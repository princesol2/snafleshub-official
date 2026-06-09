const express = require("express");

const {
  loginWithStoreId,
  registerVendorStore,
  requestPasswordReset,
  resetPassword,
  sendOtp,
  verifyOtp,
} = require("../controllers/authController");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 1000 * 60 * 15, max: 40, keyPrefix: "auth" });

router.post("/login-store", authLimiter, loginWithStoreId);
router.post("/register-store", authLimiter, registerVendorStore);
router.post("/request-password-reset", authLimiter, requestPasswordReset);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/send-otp", authLimiter, sendOtp);
router.post("/verify-otp", authLimiter, verifyOtp);

module.exports = router;
