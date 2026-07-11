const buckets = new Map();

const pruneBuckets = (now) => {
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  }
};

const rateLimit = ({ windowMs, max, keyPrefix = "global" }) => (req, res, next) => {
  const key = `${keyPrefix}:${req.ip || req.socket.remoteAddress || "unknown"}`;
  const now = Date.now();

  if (buckets.size > 10000) {
    pruneBuckets(now);
  }

  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(max - 1, 0)));
    res.setHeader("RateLimit-Reset", String(Math.ceil((now + windowMs) / 1000)));
    next();
    return;
  }

  bucket.count += 1;
  res.setHeader("RateLimit-Limit", String(max));
  res.setHeader("RateLimit-Remaining", String(Math.max(max - bucket.count, 0)));
  res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > max) {
    res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
    res.status(429).json({
      success: false,
      message: "Too many attempts. Please wait and try again.",
    });
    return;
  }

  next();
};

module.exports = rateLimit;
