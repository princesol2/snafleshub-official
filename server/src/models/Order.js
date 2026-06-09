const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    customer: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        default: "",
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
    },
    fulfillmentMethod: {
      type: String,
      enum: ["pickup", "store_contact"],
      default: "pickup",
    },
    paymentMode: {
      type: String,
      enum: ["pay_at_store", "cash_on_delivery", "test_online"],
      default: "cash_on_delivery",
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    status: {
      type: String,
      enum: ["created", "payment_pending", "confirmed", "preparing", "completed", "cancelled"],
      default: "created",
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    confirmationTokenHash: {
      type: String,
      trim: true,
      default: "",
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
