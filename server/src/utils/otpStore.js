const otpStore = new Map();
const OTP_TTL_MS = 1000 * 60 * 10;

const setOtp = (phone, otp) => {
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
  });
};

const getOtp = (phone) => {
  const entry = otpStore.get(phone);

  if (!entry) {
    return undefined;
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return undefined;
  }

  return entry.otp;
};

const clearOtp = (phone) => {
  otpStore.delete(phone);
};

module.exports = {
  setOtp,
  getOtp,
  clearOtp,
};
