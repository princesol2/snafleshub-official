const express = require("express");

const { createStore, getStores, getMyStores, getStoreById, requestPlanUpgrade, updateStore } = require("../controllers/storeController");
const { getProductsByStore } = require("../controllers/productController");
const { createProductRequest, getStoreRequests } = require("../controllers/requestController");
const { requireAuth } = require("../middleware/auth");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();
const storeMessageLimiter = rateLimit({ windowMs: 1000 * 60 * 15, max: 20, keyPrefix: "store-message" });

router.post("/", requireAuth, createStore);
router.get("/", getStores);
router.get("/mine", requireAuth, getMyStores);
router.post("/:storeId/requests", storeMessageLimiter, createProductRequest);
router.get("/:storeId/requests", requireAuth, getStoreRequests);
router.patch("/:storeId/plan", requireAuth, requestPlanUpgrade);
router.patch("/:storeId", requireAuth, updateStore);
router.get("/:storeId/products", getProductsByStore);
router.get("/:id", getStoreById);

module.exports = router;
