const storageKeys = {
  phone: "snafleshub_phone",
  vendor: "snafleshub_vendor",
  store: "snafleshub_store",
  token: "snafleshub_token",
};

function readJson(key) {
  const rawValue = localStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    localStorage.removeItem(key);
    return null;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSavedPhone() {
  return localStorage.getItem(storageKeys.phone) || "";
}

export function setSavedPhone(phone) {
  localStorage.setItem(storageKeys.phone, phone);
}

export function clearSavedPhone() {
  localStorage.removeItem(storageKeys.phone);
}

export function getVendor() {
  return readJson(storageKeys.vendor);
}

export function setVendor(vendor) {
  writeJson(storageKeys.vendor, vendor);
}

export function clearVendor() {
  localStorage.removeItem(storageKeys.vendor);
}

export function getAuthToken() {
  return localStorage.getItem(storageKeys.token) || "";
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(storageKeys.token, token);
  }
}

export function clearAuthToken() {
  localStorage.removeItem(storageKeys.token);
}

export function getStore() {
  return readJson(storageKeys.store);
}

export function setStore(store) {
  writeJson(storageKeys.store, store);
}

export function clearStore() {
  localStorage.removeItem(storageKeys.store);
}

export function clearSession() {
  clearSavedPhone();
  clearVendor();
  clearStore();
  clearAuthToken();
}
