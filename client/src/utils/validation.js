export function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

export function isValidPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function isValidPassword(value) {
  return String(value || "").trim().length >= 8;
}

export function isValidEmail(value) {
  if (!String(value || "").trim()) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}
