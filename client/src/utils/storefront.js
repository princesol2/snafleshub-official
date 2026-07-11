export const mongoObjectIdPattern = /^[a-f\d]{24}$/i;

export const initialCheckoutForm = {
  name: "",
  phone: "",
  address: "",
  paymentMode: "cash_on_delivery",
  upiReference: "",
  upiScreenshotUrl: "",
};

export function getProductInitials(name) {
  return String(name || "SH")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function formatPrice(value) {
  if (value === undefined || value === null || value === "") {
    return "Price on visit";
  }

  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export function getCartStorageKey(storeId) {
  return `snafleshub_cart_${storeId}`;
}

export function getSavedCart(storeId) {
  if (!storeId) {
    return [];
  }

  try {
    const parsedCart = JSON.parse(window.localStorage.getItem(getCartStorageKey(storeId)) || "[]");
    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    window.localStorage.removeItem(getCartStorageKey(storeId));
    return [];
  }
}

export function saveCart(storeId, cartItems) {
  if (!storeId) {
    return;
  }

  window.localStorage.setItem(getCartStorageKey(storeId), JSON.stringify(cartItems));
}

export function addProductToCart(storeId, product, quantity = 1) {
  if (!storeId || !product || Number(product.stock || 0) <= 0) {
    return [];
  }

  const savedCart = getSavedCart(storeId);
  const existingItem = savedCart.find((item) => item.productId === product._id);
  const nextCart = existingItem
    ? savedCart.map((item) =>
        item.productId === product._id
          ? { ...item, quantity: Math.min(Number(product.stock || 1), Number(item.quantity || 1) + Number(quantity || 1)) }
          : item
      )
    : [{ productId: product._id, quantity: Math.max(1, Number(quantity || 1)) }, ...savedCart];

  saveCart(storeId, nextCart);
  return nextCart;
}

export function getCartProduct(productId, products) {
  return products.find((product) => String(product._id) === String(productId));
}

export function getStoreOwnerId(store) {
  return String(store?.vendorId?._id || store?.vendorId || "");
}

export function isVendorStoreOwner(store, vendor) {
  return Boolean(store?._id && vendor?._id && getStoreOwnerId(store) === String(vendor._id));
}
