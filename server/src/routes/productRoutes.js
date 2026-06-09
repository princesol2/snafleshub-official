const express = require("express");

const { createProduct, deleteProduct, getProductById, getProducts, updateProduct } = require("../controllers/productController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.patch("/:id", requireAuth, updateProduct);
router.delete("/:id", requireAuth, deleteProduct);

module.exports = router;
