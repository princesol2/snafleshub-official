const Product = require("../models/Product");
const ProductRequest = require("../models/ProductRequest");
const Store = require("../models/Store");
const asyncHandler = require("../utils/asyncHandler");

const ownsStore = (store, user) => String(store.vendorId?._id || store.vendorId) === String(user?._id);

const createProductRequest = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { productId, productName, productPrice, customerName, customerPhone, message, paymentTiming } = req.body;

  if (!customerName || !customerPhone || (!productId && !productName)) {
    return res.status(400).json({
      success: false,
      message: "Customer name, phone, and product are required",
    });
  }

  const store = await Store.findById(storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
  }

  const product = productId ? await Product.findOne({ _id: productId, storeId }) : null;
  const request = await ProductRequest.create({
    storeId,
    productId: product?._id || null,
    productName: product?.name || productName,
    productPrice: product?.price ?? productPrice ?? null,
    customerName,
    customerPhone,
    message: String(message || "").trim().slice(0, 800),
    paymentTiming: paymentTiming === "payNow" ? "payNow" : "payLater",
  });

  res.status(201).json({
    success: true,
    message: "Product request placed",
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
