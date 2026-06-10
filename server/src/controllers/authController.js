const crypto = require("crypto");

const Store = require("../models/Store");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { setOtp, getOtp, clearOtp } = require("../utils/otpStore");
const { createToken } = require("../utils/token");

const PASSWORD_KEY_LENGTH = 64;

const generateVerificationCode = () => String(crypto.randomInt(100000, 1000000));

const sendAuthError = (res, statusCode, code, title, message, details = undefined) =>
  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      title,
      message,
      details,
    },
  });

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getOtpResponse = (message, otp) => {
  const response = {
    success: true,
    message,
  };

  if (process.env.NODE_ENV !== "production") {
    response.devCode = otp;
  }

  return response;
};

const getCoordinate = (value) => {
  const coordinate = Number(value);

  return Number.isFinite(coordinate) ? coordinate : null;
};

const getMapLocation = (location) => {
  if (!location) {
    return null;
  }

  const lat = getCoordinate(location.lat);
  const lng = getCoordinate(location.lng);

  if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180 || (lat === 0 && lng === 0)) {
    return null;
  }

  return { lat, lng };
};

const getProductKeywords = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((product) => String(product).trim()).filter(Boolean))].slice(0, 12);
};

const getExistingStoreByName = (name) => {
  const normalizedName = String(name || "").trim();

  if (!normalizedName) {
    return null;
  }

  return Store.findOne({ name: new RegExp(`^${escapeRegex(normalizedName)}$`, "i") });
};

const getStoreCodePrefix = (category, name) => {
  const source = String(category || name || "STORE")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 6);

  return source || "STORE";
};

const generateUniqueStoreCode = async (category, name) => {
  const prefix = getStoreCodePrefix(category, name);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `SH-${prefix}-${crypto.randomInt(10000, 100000)}`;
    const existingStore = await Store.findOne({ storeCode: code });

    if (!existingStore) {
      return code;
    }
  }

  return `SH-${prefix}-${Date.now().toString().slice(-6)}`;
};

const findStoreByLoginId = (storeId) => {
  const normalizedStoreId = String(storeId || "").trim();
  const phoneDigits = normalizedStoreId.replace(/\D/g, "");

  if (!normalizedStoreId) {
    return null;
  }

  if (/^[a-f\d]{24}$/i.test(normalizedStoreId)) {
    return Store.findOne({
      $or: [{ _id: normalizedStoreId }, { storeCode: normalizedStoreId.toUpperCase() }],
    });
  }

  return Store.findOne({
    $or: [
      { storeCode: normalizedStoreId.toUpperCase() },
      ...(phoneDigits.length >= 10 ? [{ workPhone: phoneDigits }, { workPhone: normalizedStoreId }] : []),
    ],
  });
};

const findStoreByPhone = (phone) => {
  const phoneDigits = String(phone || "").replace(/\D/g, "");

  if (!phoneDigits) {
    return null;
  }

  return Store.findOne({ $or: [{ workPhone: phoneDigits }, { workPhone: String(phone || "").trim() }] });
};

const samePhone = (first, second) => String(first || "").replace(/\D/g, "") === String(second || "").replace(/\D/g, "");

const isValidPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
};

const isValidPassword = (value) => String(value || "").trim().length >= 8;

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");

  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  if (!password || !storedHash || !storedHash.includes(":")) {
    return false;
  }

  const [salt, originalHash] = storedHash.split(":");
  const hashBuffer = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  const originalBuffer = Buffer.from(originalHash, "hex");

  return originalBuffer.length === hashBuffer.length && crypto.timingSafeEqual(originalBuffer, hashBuffer);
};

const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: "Phone is required" });
  }

  const verificationCode = generateVerificationCode();
  setOtp(phone, verificationCode);

  res.status(200).json(getOtpResponse("Verification code sent successfully", verificationCode));
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const { storeId, phone } = req.body;

  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, message: "Please enter a valid mobile number" });
  }

  const store = storeId ? await findStoreByLoginId(storeId) : await findStoreByPhone(phone);

  if (!store || !samePhone(store.workPhone, phone)) {
    return res.status(404).json({ success: false, message: "No store found for this phone number" });
  }

  const verificationCode = generateVerificationCode();
  setOtp(`reset:${phone}`, verificationCode);

  res.status(200).json(getOtpResponse("Password reset code sent successfully", verificationCode));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { storeId, phone, otp, password } = req.body;

  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, message: "Please enter a valid mobile number" });
  }

  if (!otp) {
    return res.status(400).json({ success: false, message: "Please enter the verification code" });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ success: false, message: "Please enter a new password with at least 8 characters" });
  }

  const savedOtp = getOtp(`reset:${phone}`);

  if (!savedOtp || savedOtp !== otp) {
    return res.status(400).json({ success: false, message: "Invalid reset code" });
  }

  const store = storeId ? await findStoreByLoginId(storeId) : await findStoreByPhone(phone);

  if (!store || !samePhone(store.workPhone, phone)) {
    return res.status(404).json({ success: false, message: "No store found for this phone number" });
  }

  const user = await User.findById(store.vendorId);

  if (!user) {
    return res.status(404).json({ success: false, message: "Vendor account not found" });
  }

  user.passwordHash = hashPassword(password);
  await user.save();
  clearOtp(`reset:${phone}`);

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: "Phone and OTP are required" });
  }

  const savedOtp = getOtp(phone);

  if (!savedOtp || savedOtp !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  let user = await User.findOne({ phone });

  if (!user) {
    user = await User.create({ phone, role: "vendor" });
  }

  clearOtp(phone);

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    data: {
      vendor: user,
      token: createToken(user),
    },
  });
});

const registerVendorStore = asyncHandler(async (req, res) => {
  const {
    ownerName,
    name,
    email,
    workPhone,
    password,
    address,
    description,
    category,
    productKeywords,
    logoUrl,
    coverImageUrl,
    workingHours,
    upiId,
    paymentType = "upi",
    paypalEmail,
    planId = "free",
    location,
    socialLinks,
  } = req.body;

  if (!ownerName) {
    return sendAuthError(
      res,
      400,
      "MISSING_OWNER_NAME",
      "Owner name is required",
      "Please enter the owner or manager name before continuing.",
      [{ field: "ownerName", message: "Owner or manager name is required." }]
    );
  }

  if (!name) {
    return sendAuthError(
      res,
      400,
      "MISSING_STORE_NAME",
      "Store name is required",
      "Please enter your store name before continuing.",
      [{ field: "name", message: "Store name is required." }]
    );
  }

  if (!isValidPhone(workPhone)) {
    return sendAuthError(
      res,
      400,
      "INVALID_PHONE",
      "Phone number needs attention",
      "Please enter a valid mobile number for this store.",
      [{ field: "workPhone", message: "Enter a valid mobile number." }]
    );
  }

  if (!isValidPassword(password)) {
    return sendAuthError(
      res,
      400,
      "INVALID_PASSWORD",
      "Password needs attention",
      "Please enter a password with at least 8 characters.",
      [{ field: "password", message: "Use at least 8 characters." }]
    );
  }

  if (paymentType === "upi" && !upiId) {
    return sendAuthError(
      res,
      400,
      "MISSING_PAYMENT_DETAILS",
      "Payment details are required",
      "Please add the payment ID, payment link, or direct payment note customers should use.",
      [{ field: "upiId", message: "Payment details are required for UPI payments." }]
    );
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (normalizedEmail) {
    const existingUserWithEmail = await User.findOne({ email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i") });

    if (existingUserWithEmail && String(existingUserWithEmail.phone) !== String(workPhone)) {
      return sendAuthError(
        res,
        409,
        "EMAIL_ALREADY_EXISTS",
        "Email already connected to another vendor",
        "A vendor account already exists with this email. Please log in or use a different email address.",
        [{ field: "email", message: "Email is already connected to another account." }]
      );
    }
  }

  const existingStoreByName = await getExistingStoreByName(name);

  if (existingStoreByName) {
    return sendAuthError(
      res,
      409,
      "STORE_NAME_ALREADY_EXISTS",
      "Store name already exists",
      "A store with this name already exists. Please choose a slightly different store name.",
      [{ field: "name", message: "Store name is already in use." }]
    );
  }

  const mapLocation = getMapLocation(location);

  let user = await User.findOne({ phone: workPhone });

  if (user) {
    const existingStore = await Store.findOne({ vendorId: user._id });

    if (existingStore || user.passwordHash) {
      return sendAuthError(
        res,
        409,
        "PHONE_ALREADY_EXISTS",
        "Phone number already connected to a vendor",
        "A vendor account already exists with this work phone number. Please log in or use a different number.",
        [{ field: "workPhone", message: "Phone number is already connected to a vendor account." }]
      );
    }
  }

  if (!user) {
    user = await User.create({
      phone: workPhone,
      ownerName,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: "vendor",
    });
  } else {
    user.ownerName = ownerName;
    user.email = normalizedEmail;
    user.passwordHash = hashPassword(password);
    await user.save();
  }

  const existingStoreForUser = await Store.findOne({ vendorId: user._id });

  if (existingStoreForUser) {
    return sendAuthError(
      res,
      409,
      "VENDOR_STORE_ALREADY_EXISTS",
      "Vendor already has a store",
      "A store already exists for this vendor account. Please log in to manage it.",
      [{ field: "workPhone", message: "This vendor already has a store." }]
    );
  }

  const store = await Store.create({
    vendorId: user._id,
    storeCode: await generateUniqueStoreCode(category, name),
    ownerName,
    name,
    email: normalizedEmail,
    workPhone,
    address,
    description,
    category,
    productKeywords: getProductKeywords(productKeywords),
    logoUrl,
    coverImageUrl,
    workingHours,
    upiId,
    paymentType,
    paypalEmail,
    socialLinks: {
      instagram: String(socialLinks?.instagram || "").trim().slice(0, 220),
      facebook: String(socialLinks?.facebook || "").trim().slice(0, 220),
      linkedin: String(socialLinks?.linkedin || "").trim().slice(0, 220),
    },
    planId: "free",
    planStatus: "active",
    showOnMap: Boolean(mapLocation),
    location: mapLocation,
  });

  const userObject = user.toObject();
  delete userObject.passwordHash;

  res.status(201).json({
    success: true,
    message: "Store account created successfully",
    data: {
      vendor: userObject,
      store,
      token: createToken(user),
    },
  });
});

const loginWithStoreId = asyncHandler(async (req, res) => {
  const { storeId, password } = req.body;

  if (!storeId) {
    return res.status(400).json({ success: false, message: "Please enter your Store ID or work phone number" });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({ success: false, message: "Please enter your valid password" });
  }

  const store = await findStoreByLoginId(storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
  }

  const user = await User.findById(store.vendorId);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ success: false, message: "Invalid Store ID, phone number, or password" });
  }

  const userObject = user.toObject();
  delete userObject.passwordHash;

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      vendor: userObject,
      store,
      token: createToken(user),
    },
  });
});

module.exports = {
  loginWithStoreId,
  registerVendorStore,
  requestPasswordReset,
  resetPassword,
  sendOtp,
  verifyOtp,
};
