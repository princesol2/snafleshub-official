const express = require("express");

const { createStore, getStores, getMyStores, getStoreById, requestPlanUpgrade, updateStore } = require("../controllers/storeController");
const { getProductsByStore } = require("../controllers/productController");
const { createProductRequest, getStoreRequests } = require("../controllers/requestController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, createStore);
router.get("/", getStores);
router.get("/mine", requireAuth, getMyStores);
router.post("/:storeId/requests", createProductRequest);
router.get("/:storeId/requests", requireAuth, getStoreRequests);
router.patch("/:storeId/plan", requireAuth, requestPlanUpgrade);
router.patch("/:storeId", requireAuth, updateStore);
router.get("/:storeId/products", getProductsByStore);
router.get("/:id", getStoreById);

module.exports = router;
