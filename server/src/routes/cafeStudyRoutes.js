const express = require("express");

const { createCafeStudySubmission } = require("../controllers/cafeStudyController");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();
const cafeStudyLimiter = rateLimit({ windowMs: 1000 * 60 * 15, max: 8, keyPrefix: "cafe-study" });

router.post("/", cafeStudyLimiter, createCafeStudySubmission);

module.exports = router;
