const crypto = require("crypto");
const Razorpay = require("razorpay");

const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Product = require("../models/Product");
const Store = require("../models/Store");
const asyncHandler = require("../utils/asyncHandler");

const isValidPhone = (value) => String(value || "").replace(/\D/g, "").length >= 10;
const ownsStore = (store, user) => String(store.vendorId?._id || store.vendorId) === String(user?._id);
const onlinePaymentMode = "online";
const manualUpiPaymentMode = "manual_upi";

const createConfirmationToken = () => crypto.randomBytes(24).toString("base64url");
const hashConfirmationToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};
const getRazorpayAmount = (amount) => Math.round(Number(amount || 0) * 100);
const isRazorpayTestMode = () => String(process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_test_");
const verifyRazorpaySignature = ({ providerOrderId, razorpayPaymentId, razorpaySignature }) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${providerOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  const receivedSignature = String(razorpaySignature || "");

  return (
    expectedSignature.length === receivedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(receivedSignature))
  );
};
const fetchRazorpayPayment = async (razorpayPaymentId) => {
  const razorpay = getRazorpayClient();

  if (!razorpay) {
    return null;
  }

  return razorpay.payments.fetch(razorpayPaymentId);
};
const validateRazorpayPayment = ({ providerPayment, payment, order }) => {
  const providerAmount = Number(providerPayment?.amount || 0);
  const expectedAmount = getRazorpayAmount(order.subtotal);
  const providerCurrency = String(providerPayment?.currency || "").toUpperCase();
  const providerStatus = String(providerPayment?.status || "");

  return (
    providerPayment?.order_id === payment.providerOrderId &&
    providerAmount === expectedAmount &&
    providerCurrency === "INR" &&
    providerStatus === "captured"
  );
};
const getPublicOrder = (order) => ({
  _id: order._id,
  items: order.items,
  customer: {
    name: order.customer?.name || "",
    phone: order.customer?.phone || "",
    address: order.customer?.address || "",
  },
  fulfillmentMethod: order.fulfillmentMethod,
  paymentMode: order.paymentMode,
  subtotal: order.subtotal,
  currency: order.currency,
  status: order.status,
  payment: order.paymentId && typeof order.paymentId === "object" ? getPublicPayment(order.paymentId) : undefined,
  createdAt: order.createdAt,
});
const getPublicPayment = (payment) => ({
  _id: payment._id,
  provider: payment.provider,
  providerOrderId: payment.providerOrderId,
  amount: payment.amount,
  currency: payment.currency,
  status: payment.status,
  testMode: payment.testMode,
  metadata: {
    checkoutMode: payment.metadata?.checkoutMode || "",
    upiReference: payment.metadata?.upiReference || "",
    upiScreenshotUrl: payment.metadata?.upiScreenshotUrl || "",
    vendorDecisionAt: payment.metadata?.vendorDecisionAt || "",
  },
});
const releaseOrderStock = async (order) => {
  await Promise.all(
    (order.items || []).map((item) =>
      Product.updateOne({ _id: item.productId, storeId: order.storeId }, { $inc: { stock: item.quantity } })
    )
  );
};

const createCheckout = asyncHandler(async (req, res) => {
  const {
    storeId,
    items = [],
    customer = {},
    fulfillmentMethod = "store_contact",
    paymentMode = "cash_on_delivery",
    paymentDetails = {},
  } = req.body;

  if (!storeId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Store and at least one product are required" });
  }

  if (!String(customer.name || "").trim()) {
    return res.status(400).json({ success: false, message: "Enter the customer name." });
  }

  if (!isValidPhone(customer.phone)) {
    return res.status(400).json({ success: false, message: "Enter a valid mobile number with 10 to 15 digits." });
  }

  if (String(customer.address || "").trim().length < 8) {
    return res.status(400).json({ success: false, message: "Enter a delivery address with at least 8 characters." });
  }

  if (!["cash_on_delivery", "pay_at_store", manualUpiPaymentMode, onlinePaymentMode].includes(paymentMode)) {
    return res.status(400).json({ success: false, message: "Choose a valid payment option" });
  }

  const wantsOnlinePayment = paymentMode === onlinePaymentMode;
  const wantsManualUpiPayment = paymentMode === manualUpiPaymentMode;
  const razorpay = wantsOnlinePayment ? getRazorpayClient() : null;

  if (wantsOnlinePayment && !razorpay) {
    return res.status(503).json({
      success: false,
      message: "Online payment is not configured yet. Please choose cash payment or try again later.",
    });
  }

  const store = await Store.findById(storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
  }

  if (wantsManualUpiPayment && !store.upiId && !store.upiQrUrl) {
    return res.status(400).json({
      success: false,
      message: "This store has not added UPI payment details yet. Please choose another payment option.",
    });
  }

  const upiReference = String(paymentDetails.upiReference || "").trim().slice(0, 120);
  const upiScreenshotUrl = String(paymentDetails.upiScreenshotUrl || "").trim().slice(0, 500);

  if (wantsManualUpiPayment && upiReference.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Enter the UPI transaction reference after paying the store.",
    });
  }

  if (req.user && ownsStore(store, req.user)) {
    return res.status(403).json({
      success: false,
      message: "Vendors cannot place orders from their own store account. Use a customer session to test checkout.",
    });
  }

  const itemQuantities = items.reduce((totals, item) => {
    if (!item.productId) {
      return totals;
    }

    const productId = String(item.productId);
    const quantity = Math.max(1, Math.floor(Number(item.quantity || 1)));

    return {
      ...totals,
      [productId]: (totals[productId] || 0) + quantity,
    };
  }, {});
  const productIds = Object.keys(itemQuantities);

  if (productIds.length === 0) {
    return res.status(400).json({ success: false, message: "Add at least one valid product to checkout" });
  }

  const products = await Product.find({ _id: { $in: productIds }, storeId });
  const productById = new Map(products.map((product) => [String(product._id), product]));

  const orderItems = productIds.map((productId) => {
    const product = productById.get(productId);
    const quantity = itemQuantities[productId];

    if (!product) {
      return null;
    }

    return {
      productId: product._id,
      name: product.name,
      quantity,
      unitPrice: product.price,
      total: product.price * quantity,
    };
  });

  if (orderItems.some((item) => !item)) {
    return res.status(400).json({ success: false, message: "One or more products are unavailable" });
  }

  if (orderItems.length === 0) {
    return res.status(400).json({ success: false, message: "Add at least one valid product to checkout" });
  }

  const stockUpdates = [];

  for (const item of orderItems) {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: item.productId, storeId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );

    if (!updatedProduct) {
      await Promise.all(
        stockUpdates.map((stockItem) =>
          Product.updateOne({ _id: stockItem.productId }, { $inc: { stock: stockItem.quantity } })
        )
      );
      return res.status(400).json({ success: false, message: `${item.name} does not have enough stock` });
    }

    stockUpdates.push({ productId: item.productId, quantity: item.quantity });
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);

  if (wantsOnlinePayment && subtotal <= 0) {
    return res.status(400).json({ success: false, message: "Online payment requires at least one priced product" });
  }

  const confirmationToken = createConfirmationToken();
  let order;
  let payment;

  try {
    order = await Order.create({
      storeId,
      items: orderItems,
      customer: {
        name: String(customer.name).trim(),
        phone: String(customer.phone).trim(),
        address: String(customer.address || "").trim().slice(0, 600),
      },
      fulfillmentMethod: fulfillmentMethod === "pickup" ? "pickup" : "store_contact",
      paymentMode: wantsOnlinePayment ? onlinePaymentMode : paymentMode,
      subtotal,
      status: wantsOnlinePayment ? "payment_pending" : wantsManualUpiPayment ? "payment_submitted" : "confirmed",
      confirmationTokenHash: hashConfirmationToken(confirmationToken),
    });

    let razorpayOrder = null;

    if (wantsOnlinePayment) {
      razorpayOrder = await razorpay.orders.create({
        amount: getRazorpayAmount(subtotal),
        currency: "INR",
        receipt: `order_${order._id}`,
        notes: {
          localOrderId: String(order._id),
          storeId: String(storeId),
          storeName: store.name || "",
        },
      });
    }

    payment = await Payment.create({
      orderId: order._id,
      provider: wantsOnlinePayment ? "razorpay" : "manual",
      providerOrderId: wantsOnlinePayment ? razorpayOrder.id : `manual_${order._id}`,
      amount: subtotal,
      currency: "INR",
      status: wantsOnlinePayment ? "created" : wantsManualUpiPayment ? "submitted" : "not_required",
      testMode: wantsOnlinePayment ? isRazorpayTestMode() : false,
      metadata: {
        checkoutMode: wantsOnlinePayment ? onlinePaymentMode : paymentMode,
        ...(wantsManualUpiPayment
          ? {
              upiId: store.upiId || "",
              upiQrReference: store.upiQrReference || "",
              upiReference,
              upiScreenshotUrl,
              submittedAt: new Date().toISOString(),
            }
          : {}),
      },
    });
  } catch (error) {
    await Promise.all(
      stockUpdates.map((stockItem) =>
        Product.updateOne({ _id: stockItem.productId }, { $inc: { stock: stockItem.quantity } })
      )
    );
    throw error;
  }

  order.paymentId = payment._id;
  await order.save();

  if (wantsOnlinePayment) {
    return res.status(201).json({
      success: true,
      message: "Payment order created",
      data: {
        paymentRequired: true,
        order: getPublicOrder(order),
        payment: getPublicPayment(payment),
        razorpay: {
          keyId: process.env.RAZORPAY_KEY_ID,
          orderId: payment.providerOrderId,
          amount: getRazorpayAmount(subtotal),
          currency: "INR",
          name: "SnaflesHub",
          description: `Order from ${store.name || "store"}`,
          prefill: {
            name: String(customer.name || "").trim(),
            contact: String(customer.phone || "").trim(),
          },
        },
      },
    });
  }

  res.status(201).json({
    success: true,
    message: "Order confirmed",
    data: {
      order: getPublicOrder(order),
      payment,
      confirmationToken,
    },
  });
});

const verifyCheckoutPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!orderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: "Payment verification details are required" });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ success: false, message: "Online payment verification is not configured" });
  }

  if (!getRazorpayClient()) {
    return res.status(503).json({ success: false, message: "Online payment verification is not configured" });
  }

  const order = await Order.findById(orderId).select("+confirmationTokenHash").populate("paymentId");

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const payment = order.paymentId;

  if (!payment || payment.provider !== "razorpay" || payment.providerOrderId !== razorpay_order_id) {
    return res.status(400).json({ success: false, message: "Payment order does not match this checkout" });
  }

  if (payment.status === "paid" && order.status === "confirmed") {
    const confirmationToken = createConfirmationToken();
    order.confirmationTokenHash = hashConfirmationToken(confirmationToken);
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment already verified",
      data: {
        order: getPublicOrder(order),
        payment: getPublicPayment(payment),
        confirmationToken,
      },
    });
  }

  const isSignatureValid = verifyRazorpaySignature({
    providerOrderId: payment.providerOrderId,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  if (!isSignatureValid) {
    payment.status = "failed";
    payment.metadata = {
      ...payment.metadata,
      verificationError: "signature_mismatch",
      razorpayPaymentId: razorpay_payment_id,
    };
    const shouldReleaseStock = order.status === "payment_pending";

    order.status = "payment_failed";
    await Promise.all([payment.save(), order.save(), shouldReleaseStock ? releaseOrderStock(order) : Promise.resolve()]);

    return res.status(400).json({ success: false, message: "Payment verification failed" });
  }

  let providerPayment;

  try {
    providerPayment = await fetchRazorpayPayment(razorpay_payment_id);
  } catch (error) {
    payment.metadata = {
      ...payment.metadata,
      verificationError: "provider_lookup_failed",
      providerLookupMessage: String(error.message || "Unable to verify payment with Razorpay").slice(0, 200),
    };
    await payment.save();

    return res.status(502).json({ success: false, message: "Unable to verify payment with Razorpay. Please try again." });
  }

  if (!validateRazorpayPayment({ providerPayment, payment, order })) {
    payment.status = "failed";
    payment.metadata = {
      ...payment.metadata,
      verificationError: "provider_payment_mismatch",
      razorpayPaymentId: razorpay_payment_id,
      providerOrderId: providerPayment?.order_id || "",
      providerAmount: providerPayment?.amount || 0,
      providerCurrency: providerPayment?.currency || "",
      providerStatus: providerPayment?.status || "",
    };
    const shouldReleaseStock = order.status === "payment_pending";

    order.status = "payment_failed";
    await Promise.all([payment.save(), order.save(), shouldReleaseStock ? releaseOrderStock(order) : Promise.resolve()]);

    return res.status(400).json({ success: false, message: "Payment could not be confirmed by Razorpay" });
  }

  const confirmationToken = createConfirmationToken();

  payment.status = "paid";
  payment.metadata = {
    ...payment.metadata,
    razorpayPaymentId: razorpay_payment_id,
    providerStatus: providerPayment.status,
    verifiedAt: new Date().toISOString(),
  };
  order.status = "confirmed";
  order.confirmationTokenHash = hashConfirmationToken(confirmationToken);
  await Promise.all([payment.save(), order.save()]);

  res.status(200).json({
    success: true,
    message: "Payment verified",
    data: {
      order: getPublicOrder(order),
      payment: getPublicPayment(payment),
      confirmationToken,
    },
  });
});

const markCheckoutPaymentFailed = asyncHandler(async (req, res) => {
  const { orderId, reason = "payment_cancelled" } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: "Order is required" });
  }

  const order = await Order.findById(orderId).populate("paymentId");

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const payment = order.paymentId;

  if (order.status !== "payment_pending" || !payment || payment.status === "paid") {
    return res.status(200).json({ success: true, message: "No pending payment to close" });
  }

  payment.status = "failed";
  payment.metadata = {
    ...payment.metadata,
    failureReason: String(reason || "payment_cancelled").slice(0, 120),
    failedAt: new Date().toISOString(),
  };
  order.status = "payment_failed";
  await Promise.all([payment.save(), order.save(), releaseOrderStock(order)]);

  res.status(200).json({
    success: true,
    message: "Payment attempt closed",
    data: {
      order: getPublicOrder(order),
      payment: getPublicPayment(payment),
    },
  });
});

const getOrder = asyncHandler(async (req, res) => {
  const confirmationToken = String(req.query.token || "");

  if (!confirmationToken) {
    return res.status(401).json({ success: false, message: "Order confirmation token is required" });
  }

  const order = await Order.findById(req.params.orderId).select("+confirmationTokenHash").populate("paymentId");

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.confirmationTokenHash !== hashConfirmationToken(confirmationToken)) {
    return res.status(403).json({ success: false, message: "Invalid order confirmation token" });
  }

  res.status(200).json({ success: true, data: getPublicOrder(order) });
});

const getStoreOrders = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
  }

  if (!ownsStore(store, req.user)) {
    return res.status(403).json({ success: false, message: "You do not have access to this store" });
  }

  const orders = await Order.find({ storeId: req.params.storeId }).populate("paymentId").sort({ createdAt: -1 }).limit(100);

  res.status(200).json({
    success: true,
    data: orders,
  });
});

const updateStoreOrderStatus = asyncHandler(async (req, res) => {
  const allowedStatuses = ["confirmed", "preparing", "completed", "cancelled"];
  const nextStatus = String(req.body.status || "").trim();

  if (!allowedStatuses.includes(nextStatus)) {
    return res.status(400).json({ success: false, message: "Choose a valid order status" });
  }

  const order = await Order.findById(req.params.orderId).populate("paymentId");

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const store = await Store.findById(order.storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
  }

  if (!ownsStore(store, req.user)) {
    return res.status(403).json({ success: false, message: "You do not have access to this order" });
  }

  if (["payment_pending", "payment_submitted", "payment_failed"].includes(order.status)) {
    return res.status(409).json({
      success: false,
      message: "This order cannot move through the vendor workflow until payment is confirmed.",
    });
  }

  order.status = nextStatus;
  await order.save();

  res.status(200).json({
    success: true,
    message: "Order status updated",
    data: order,
  });
});

const updateManualPaymentStatus = asyncHandler(async (req, res) => {
  const decision = String(req.body.decision || "").trim();

  if (!["confirm", "reject"].includes(decision)) {
    return res.status(400).json({ success: false, message: "Choose whether to confirm or reject the UPI payment" });
  }

  const order = await Order.findById(req.params.orderId).populate("paymentId");

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const store = await Store.findById(order.storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
  }

  if (!ownsStore(store, req.user)) {
    return res.status(403).json({ success: false, message: "You do not have access to this order" });
  }

  const payment = order.paymentId;

  if (order.paymentMode !== manualUpiPaymentMode || !payment || payment.provider !== "manual") {
    return res.status(400).json({ success: false, message: "This order is not a manual UPI payment order" });
  }

  if (order.status !== "payment_submitted" || payment.status !== "submitted") {
    return res.status(409).json({ success: false, message: "This UPI payment has already been reviewed" });
  }

  payment.metadata = {
    ...payment.metadata,
    vendorDecision: decision,
    vendorDecisionAt: new Date().toISOString(),
  };

  if (decision === "confirm") {
    payment.status = "paid";
    order.status = "confirmed";
    await Promise.all([payment.save(), order.save()]);

    return res.status(200).json({
      success: true,
      message: "UPI payment confirmed",
      data: order,
    });
  }

  payment.status = "failed";
  order.status = "payment_failed";
  await Promise.all([payment.save(), order.save(), releaseOrderStock(order)]);

  res.status(200).json({
    success: true,
    message: "UPI payment rejected and stock restored",
    data: order,
  });
});

module.exports = {
  createCheckout,
  markCheckoutPaymentFailed,
  getOrder,
  getStoreOrders,
  updateManualPaymentStatus,
  updateStoreOrderStatus,
  verifyCheckoutPayment,
};
