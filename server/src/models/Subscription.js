const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    planId: {
      type: String,
      enum: ["free", "founding", "growth"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "pending_payment", "cancelled"],
      default: "active",
    },
    provider: {
      type: String,
      enum: ["manual", "razorpay_test"],
      default: "manual",
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
