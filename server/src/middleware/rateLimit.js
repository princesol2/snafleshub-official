const buckets = new Map();

const rateLimit = ({ windowMs, max, keyPrefix = "global" }) => (req, res, next) => {
  const key = `${keyPrefix}:${req.ip || req.socket.remoteAddress || "unknown"}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  bucket.count += 1;

  if (bucket.count > max) {
    res.status(429).json({
      success: false,
      message: "Too many attempts. Please wait and try again.",
    });
    return;
  }

  next();
};

module.exports = rateLimit;
