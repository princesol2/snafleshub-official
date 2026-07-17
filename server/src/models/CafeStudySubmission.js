const mongoose = require("mongoose");

const cafeStudySubmissionSchema = new mongoose.Schema(
  {
    cafeName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 24,
    },
    area: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    cafeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    customerSources: {
      type: [String],
      default: [],
    },
    biggestChallenge: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    onlinePresence: {
      type: [String],
      default: [],
    },
    usefulFeatures: {
      type: [String],
      default: [],
    },
    topFeature: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    monthlyPrice: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    paymentComfort: {
      type: [String],
      default: [],
    },
    pilotInterest: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    contactMethod: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 800,
      default: "",
    },
    pageVersion: {
      type: String,
      trim: true,
      default: "cafe-study-v1",
    },
    languageMode: {
      type: String,
      trim: true,
      default: "en-hi-inline",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CafeStudySubmission", cafeStudySubmissionSchema);
