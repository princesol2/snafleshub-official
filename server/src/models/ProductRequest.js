const mongoose = require("mongoose");

const productRequestSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    productName: {
      type: String,
      trim: true,
      default: "",
    },
    productPrice: {
      type: Number,
      default: null,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    requestType: {
      type: String,
      enum: ["product", "message"],
      default: "product",
    },
    customerKey: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    paymentTiming: {
      type: String,
      enum: ["payLater", "payNow"],
      default: "payLater",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductRequest", productRequestSchema);
