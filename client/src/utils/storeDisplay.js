export function getStoreId(store, index = 0) {
  return String(store?._id || store?.id || `store-${index}`);
}

export function getStoreLink(store, index = 0) {
  return `/store/${getStoreId(store, index)}`;
}

export function getStoreLocationLabel(store) {
  if (store?.address) {
    return store.address;
  }

  const lat = store?.location?.lat;
  const lng = store?.location?.lng;

  if (lat === undefined || lng === undefined || lat === null || lng === null) {
    return "Location coming soon";
  }

  return `${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)}`;
}

export function getStoreInitials(store) {
  const source = store?.name || "Store";

  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
