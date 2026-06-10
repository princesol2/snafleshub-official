const Product = require("../models/Product");
const ProductRequest = require("../models/ProductRequest");
const Store = require("../models/Store");
const asyncHandler = require("../utils/asyncHandler");

const ownsStore = (store, user) => String(store.vendorId?._id || store.vendorId) === String(user?._id);

const createProductRequest = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { productId, productName, productPrice, customerName, customerPhone, customerEmail, message, paymentTiming, requestType } = req.body;
  const normalizedRequestType = requestType === "message" || (!productId && !productName) ? "message" : "product";
  const cleanMessage = String(message || "").trim().slice(0, 800);

  if (!customerName || !customerPhone || (normalizedRequestType === "product" && !productId && !productName)) {
    return res.status(400).json({
      success: false,
      message: "Customer name, phone, and product are required",
    });
  }

  if (normalizedRequestType === "message" && cleanMessage.length < 3) {
    return res.status(400).json({
      success: false,
      message: "Please write a short message for the vendor",
    });
  }

  const store = await Store.findById(storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
  }

  const product = productId ? await Product.findOne({ _id: productId, storeId }) : null;
  const phoneDigits = String(customerPhone || "").replace(/\D/g, "");
  const customerKey = phoneDigits || String(req.ip || req.socket.remoteAddress || "unknown");
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  if (normalizedRequestType === "message") {
    const todaysMessageCount = await ProductRequest.countDocuments({
      storeId,
      requestType: "message",
      customerKey,
      createdAt: { $gte: dayStart },
    });

    if (todaysMessageCount >= 2) {
      return res.status(429).json({
        success: false,
        message: "You can send 2 messages to this vendor per day. Please try again tomorrow.",
      });
    }
  }

  const request = await ProductRequest.create({
    storeId,
    productId: product?._id || null,
    productName: product?.name || productName || "Store message",
    productPrice: product?.price ?? productPrice ?? null,
    customerName,
    customerPhone,
    customerEmail: String(customerEmail || "").trim().slice(0, 140),
    message: cleanMessage,
    paymentTiming: paymentTiming === "payNow" ? "payNow" : "payLater",
    requestType: normalizedRequestType,
    customerKey,
  });

  res.status(201).json({
    success: true,
    message: normalizedRequestType === "message" ? "Message sent to vendor" : "Product request placed",
    data: request,
  });
});

const getStoreRequests = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const store = await Store.findById(storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
  }

  if (!ownsStore(store, req.user)) {
    return res.status(403).json({ success: false, message: "You do not have access to this store" });
  }

  const requests = await ProductRequest.find({ storeId }).sort({ createdAt: -1 }).limit(100);

  res.status(200).json({
    success: true,
    data: requests,
  });
});

module.exports = {
  createProductRequest,
  getStoreRequests,
};
