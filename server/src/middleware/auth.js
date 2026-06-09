const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken } = require("../utils/token");

const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const tokenData = verifyToken(token);

  if (!tokenData?.sub) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const user = await User.findById(tokenData.sub);

  if (!user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    next();
    return;
  }

  const tokenData = verifyToken(token);

  if (!tokenData?.sub) {
    next();
    return;
  }

  const user = await User.findById(tokenData.sub);

  if (user) {
    req.user = user;
  }

  next();
});

module.exports = {
  optionalAuth,
  requireAuth,
};
