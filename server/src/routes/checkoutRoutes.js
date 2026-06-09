const express = require("express");

const { createCheckout, getOrder, getStoreOrders, updateStoreOrderStatus } = require("../controllers/checkoutController");
const { optionalAuth, requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", optionalAuth, createCheckout);
router.get("/stores/:storeId/orders", requireAuth, getStoreOrders);
router.get("/orders/:orderId", getOrder);
router.patch("/orders/:orderId/status", requireAuth, updateStoreOrderStatus);

module.exports = router;
