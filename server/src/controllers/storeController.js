const Store = require("../models/Store");
const Product = require("../models/Product");
const User = require("../models/User");
const Category = require("../models/Category");
const asyncHandler = require("../utils/asyncHandler");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const normalizeComparable = (value) => String(value || "").trim();

const getExistingStoreByName = (name) => {
  const normalizedName = normalizeComparable(name);

  if (!normalizedName) {
    return null;
  }

  return Store.findOne({ name: new RegExp(`^${escapeRegex(normalizedName)}$`, "i") });
};

const ownsStore = (store, user) => String(store.vendorId?._id || store.vendorId) === String(user?._id);

const getProductSearchQuery = (searchRegex, categoryIds = []) => ({
  $or: [
    { name: searchRegex },
    { description: searchRegex },
    ...(categoryIds.length ? [{ categoryId: { $in: categoryIds } }] : []),
  ],
});

const createStore = asyncHandler(async (req, res) => {
  const {
    ownerName,
    name,
    email,
    workPhone,
    address,
    description,
    category,
    productKeywords,
    logoUrl,
    coverImageUrl,
    workingHours,
    upiId,
    paymentType,
    paypalEmail,
    planId = "free",
    location,
  } = req.body;
  const vendorId = req.user._id;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Store name is required",
    });
  }

  const vendor = await User.findById(vendorId);

  if (!vendor) {
    return res.status(404).json({ success: false, message: "Vendor not found" });
  }

  const existingStoreForUser = await Store.findOne({ vendorId });

  if (existingStoreForUser) {
    return res.status(409).json({
      success: false,
      message: "A store already exists for this vendor account",
    });
  }

  const existingStoreByName = await getExistingStoreByName(name);

  if (existingStoreByName) {
    return res.status(409).json({
      success: false,
      message: "A store with this name already exists",
    });
  }

  const mapLocation = getMapLocation(location);

  const store = await Store.create({
    vendorId,
    ownerName,
    name,
    email,
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
    planId: "free",
    planStatus: "active",
    showOnMap: Boolean(mapLocation),
    location: mapLocation,
  });

  res.status(201).json({
    success: true,
    message: "Store created successfully",
    data: store,
  });
});

const getStores = asyncHandler(async (req, res) => {
  const searchTerm = String(req.query.search || req.query.q || "").trim();
  const searchRegex = searchTerm ? new RegExp(escapeRegex(searchTerm), "i") : null;

  const categoryIds = searchRegex
    ? await Category.distinct("_id", { $or: [{ name: searchRegex }, { slug: searchRegex }] })
    : [];
  const productMatchedStoreIds = searchRegex
    ? await Product.distinct("storeId", getProductSearchQuery(searchRegex, categoryIds))
    : [];

  const discoveryQuery = {
    showOnMap: true,
    "location.lat": { $gte: -90, $lte: 90, $ne: 0 },
    "location.lng": { $gte: -180, $lte: 180, $ne: 0 },
  };
  const storeQuery = searchRegex
    ? {
        $and: [
          discoveryQuery,
          {
            $or: [
              { name: searchRegex },
              { ownerName: searchRegex },
              { category: searchRegex },
              { address: searchRegex },
              { productKeywords: searchRegex },
              { _id: { $in: productMatchedStoreIds } },
            ],
          },
        ],
      }
    : discoveryQuery;

  const stores = await Store.find(storeQuery).populate("vendorId", "phone role").sort({ createdAt: -1 });
  const storeIds = stores.map((store) => store._id);
  const productQuery = searchRegex
    ? {
        storeId: { $in: storeIds },
        ...getProductSearchQuery(searchRegex, categoryIds),
      }
    : { storeId: { $in: storeIds } };
  const products = storeIds.length > 0 ? await Product.find(productQuery).sort({ createdAt: -1 }) : [];
  const productsByStoreId = products.reduce((groups, product) => {
    const storeId = String(product.storeId);

    return {
      ...groups,
      [storeId]: [...(groups[storeId] || []), product],
    };
  }, {});
  const storesWithProductPreview = stores.map((store) => {
    const storeObject = store.toObject();
    const productsPreview = productsByStoreId[String(store._id)] || [];

    return {
      ...storeObject,
      productsPreview,
      productMatchCount: productsPreview.length,
    };
  });

  res.status(200).json({
    success: true,
    data: storesWithProductPreview,
  });
});

const getMyStores = asyncHandler(async (req, res) => {
  const stores = await Store.find({ vendorId: req.user._id }).populate("vendorId", "phone role").sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: stores,
  });
});

const getStoreById = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id).populate("vendorId", "phone role");

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
  }

  res.status(200).json({
    success: true,
    data: store,
  });
});

const updateStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
  }

  if (!ownsStore(store, req.user)) {
    return res.status(403).json({ success: false, message: "You do not have access to this store" });
  }

  const editableFields = [
    "ownerName",
    "name",
    "email",
    "workPhone",
    "address",
    "description",
    "category",
    "logoUrl",
    "coverImageUrl",
    "workingHours",
    "upiId",
    "paymentType",
    "paypalEmail",
  ];

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      store[field] = req.body[field];
    }
  });

  if (req.body.productKeywords !== undefined) {
    store.productKeywords = getProductKeywords(req.body.productKeywords);
  }

  if (req.body.location !== undefined) {
    const mapLocation = getMapLocation(req.body.location);
    store.location = mapLocation;
    store.showOnMap = Boolean(mapLocation);
  }

  await store.save();

  res.status(200).json({
    success: true,
    message: "Store updated successfully",
    data: store,
  });
});

const requestPlanUpgrade = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { planId, paymentPreference, billingContact, note } = req.body;
  const nextPlanId = ["founding", "growth"].includes(planId) ? planId : "";

  if (!nextPlanId) {
    return res.status(400).json({ success: false, message: "Choose a valid paid plan" });
  }

  const store = await Store.findById(storeId);

  if (!store) {
    return res.status(404).json({ success: false, message: "Store not found" });
  }

  if (!ownsStore(store, req.user)) {
    return res.status(403).json({ success: false, message: "You do not have access to this store" });
  }

  store.planId = nextPlanId;
  store.planStatus = "upgrade_requested";
  store.upgradeRequest = {
    requestedPlanId: nextPlanId,
    paymentPreference: String(paymentPreference || "").trim().slice(0, 80),
    billingContact: String(billingContact || "").trim().slice(0, 120),
    note: String(note || "").trim().slice(0, 500),
    requestedAt: new Date(),
  };

  await store.save();

  res.status(200).json({
    success: true,
    message: "Upgrade request received",
    data: store,
  });
});

module.exports = {
  createStore,
  getStores,
  getMyStores,
  getStoreById,
  requestPlanUpgrade,
  updateStore,
};
