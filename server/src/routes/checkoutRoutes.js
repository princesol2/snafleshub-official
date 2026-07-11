const express = require("express");

const {
  createCheckout,
  getOrder,
  getStoreOrders,
  markCheckoutPaymentFailed,
  updateManualPaymentStatus,
  updateStoreOrderStatus,
  verifyCheckoutPayment,
} = require("../controllers/checkoutController");
const { optionalAuth, requireAuth } = require("../middleware/auth");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();
const checkoutLimiter = rateLimit({ windowMs: 1000 * 60 * 10, max: 30, keyPrefix: "checkout" });
const paymentLimiter = rateLimit({ windowMs: 1000 * 60 * 10, max: 60, keyPrefix: "payment" });

router.post("/", checkoutLimiter, optionalAuth, createCheckout);
router.post("/payments/verify", paymentLimiter, verifyCheckoutPayment);
router.post("/payments/failed", paymentLimiter, markCheckoutPaymentFailed);
router.get("/stores/:storeId/orders", requireAuth, getStoreOrders);
router.get("/orders/:orderId", getOrder);
router.patch("/orders/:orderId/payment", requireAuth, updateManualPaymentStatus);
router.patch("/orders/:orderId/status", requireAuth, updateStoreOrderStatus);

module.exports = router;
