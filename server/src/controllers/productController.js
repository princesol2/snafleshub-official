const Product = require("../models/Product");
const Store = require("../models/Store");
const asyncHandler = require("../utils/asyncHandler");
const { getPlan } = require("../config/plans");

const ownsStore = (store, user) => String(store.vendorId?._id || store.vendorId) === String(user?._id);

const createProduct = asyncHandler(async (req, res) => {
  const { storeId, name, description, price, stock, categoryId, imageUrl } = req.body;

  if (!storeId || !name || price === undefined || stock === undefined) {
    return res.status(400).json({
      success: false,
      message: "storeId, name, price and stock are required",
    });
  }

  const store = await Store.findById(storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
  }

  if (!ownsStore(store, req.user)) {
    return res.status(403).json({ success: false, message: "You do not have access to this store" });
  }

  const plan = getPlan(store.planStatus === "active" ? store.planId : "free");
  const currentProductCount = await Product.countDocuments({ storeId });

  if (currentProductCount >= plan.productLimit) {
    return res.status(403).json({
      success: false,
      message:
        store.planStatus === "upgrade_requested"
          ? `Your paid plan request is pending billing confirmation. The active free plan allows up to ${plan.productLimit} products for now.`
          : `This storefront plan allows up to ${plan.productLimit} products. Upgrade to add more.`,
    });
  }

  const product = await Product.create({
    storeId,
    name,
    description,
    categoryId: categoryId || null,
    imageUrl,
    price,
    stock,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, stock, categoryId, imageUrl } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const store = await Store.findById(product.storeId);

  if (!store || !ownsStore(store, req.user)) {
    return res.status(403).json({ success: false, message: "You do not have access to this product" });
  }

  if (name !== undefined) {
    product.name = name;
  }

  if (description !== undefined) {
    product.description = description;
  }

  if (categoryId !== undefined) {
    product.categoryId = categoryId || null;
  }

  if (imageUrl !== undefined) {
    product.imageUrl = imageUrl;
  }

  if (price !== undefined) {
    product.price = price;
  }

  if (stock !== undefined) {
    product.stock = stock;
  }

  await product.save();

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const store = await Store.findById(product.storeId);

  if (!store || !ownsStore(store, req.user)) {
    return res.status(403).json({ success: false, message: "You do not have access to this product" });
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().populate("storeId", "name category").populate("categoryId", "name slug").sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: products,
  });
});

const getProductsByStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const store = await Store.findById(storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
  }

  const searchTerm = String(req.query.search || req.query.q || "").trim();
  const query = searchTerm
    ? {
        storeId,
        $or: [
          { name: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          { description: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        ],
      }
    : { storeId };
  const products = await Product.find(query).populate("categoryId", "name slug").sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: products,
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("storeId", "name category address workPhone")
    .populate("categoryId", "name slug");

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

module.exports = {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getProductsByStore,
  updateProduct,
};
