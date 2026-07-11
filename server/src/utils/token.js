const crypto = require("crypto");

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const base64UrlEncode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

const base64UrlDecode = (value) => JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

const getSecret = () => {
  const secret = process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_TOKEN_SECRET is required in production");
  }

  return "snafleshub-dev-token-secret";
};

const sign = (payload) => crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");

const createToken = (user) => {
  const payload = base64UrlEncode({
    sub: String(user._id),
    role: user.role,
    exp: Date.now() + TOKEN_TTL_MS,
  });
  const signature = sign(payload);

  return `${payload}.${signature}`;
};

const verifyToken = (token) => {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = sign(payload);

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  let data;

  try {
    data = base64UrlDecode(payload);
  } catch (error) {
    return null;
  }

  if (!data.exp || Date.now() > data.exp) {
    return null;
  }

  return data;
};

module.exports = {
  createToken,
  verifyToken,
};
