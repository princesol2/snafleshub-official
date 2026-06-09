const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ownerName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    passwordHash: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["vendor"],
      default: "vendor",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
