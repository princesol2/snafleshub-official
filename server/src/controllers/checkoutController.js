const crypto = require("crypto");

const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Product = require("../models/Product");
const Store = require("../models/Store");
const asyncHandler = require("../utils/asyncHandler");

const isValidPhone = (value) => String(value || "").replace(/\D/g, "").length >= 10;
const ownsStore = (store, user) => String(store.vendorId?._id || store.vendorId) === String(user?._id);

const createConfirmationToken = () => crypto.randomBytes(24).toString("base64url");
const hashConfirmationToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
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
  createdAt: order.createdAt,
});

const createCheckout = asyncHandler(async (req, res) => {
  const { storeId, items = [], customer = {}, fulfillmentMethod = "store_contact", paymentMode = "cash_on_delivery" } = req.body;

  if (!storeId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Store and at least one product are required" });
  }

  if (!customer.name || !isValidPhone(customer.phone) || !String(customer.address || "").trim()) {
    return res.status(400).json({ success: false, message: "Enter a valid customer name, phone number, and delivery address" });
  }

  if (!["cash_on_delivery", "pay_at_store"].includes(paymentMode)) {
    return res.status(400).json({ success: false, message: "Only manual cash order placement is available right now" });
  }

  const store = await Store.findById(storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
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
      paymentMode: "cash_on_delivery",
      subtotal,
      status: "confirmed",
      confirmationTokenHash: hashConfirmationToken(confirmationToken),
    });

    payment = await Payment.create({
      orderId: order._id,
      provider: "manual",
      providerOrderId: `manual_${order._id}`,
      amount: subtotal,
      currency: "INR",
      status: "not_required",
      testMode: false,
      metadata: {
        checkoutMode: "cash_on_delivery",
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

const getOrder = asyncHandler(async (req, res) => {
  const confirmationToken = String(req.query.token || "");

  if (!confirmationToken) {
    return res.status(401).json({ success: false, message: "Order confirmation token is required" });
  }

  const order = await Order.findById(req.params.orderId).select("+confirmationTokenHash");

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

  order.status = nextStatus;
  await order.save();

  res.status(200).json({
    success: true,
    message: "Order status updated",
    data: order,
  });
});

module.exports = {
  createCheckout,
  getOrder,
  getStoreOrders,
  updateStoreOrderStatus,
};
