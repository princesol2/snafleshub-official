const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storeCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
      default: "",
    },
    ownerName: {
      type: String,
      trim: true,
      default: "",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    workPhone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    productKeywords: {
      type: [String],
      default: [],
    },
    logoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    coverImageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    workingHours: {
      type: String,
      trim: true,
      default: "",
    },
    upiId: {
      type: String,
      trim: true,
      default: "",
    },
    upiQrUrl: {
      type: String,
      trim: true,
      default: "",
    },
    upiQrReference: {
      type: String,
      trim: true,
      default: "",
    },
    paymentType: {
      type: String,
      trim: true,
      default: "upi",
    },
    paypalEmail: {
      type: String,
      trim: true,
      default: "",
    },
    socialLinks: {
      instagram: {
        type: String,
        trim: true,
        default: "",
      },
      facebook: {
        type: String,
        trim: true,
        default: "",
      },
      linkedin: {
        type: String,
        trim: true,
        default: "",
      },
    },
    planId: {
      type: String,
      enum: ["free", "founding", "growth"],
      default: "free",
    },
    planStatus: {
      type: String,
      enum: ["active", "upgrade_requested"],
      default: "active",
    },
    upgradeRequest: {
      requestedPlanId: {
        type: String,
        enum: ["free", "founding", "growth", ""],
        default: "",
      },
      paymentPreference: {
        type: String,
        trim: true,
        default: "",
      },
      billingContact: {
        type: String,
        trim: true,
        default: "",
      },
      note: {
        type: String,
        trim: true,
        default: "",
      },
      requestedAt: {
        type: Date,
        default: null,
      },
    },
    showOnMap: {
      type: Boolean,
      default: true,
    },
    location: {
      lat: {
        type: Number,
        default: null,
      },
      lng: {
        type: Number,
        default: null,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);
