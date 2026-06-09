require("dotenv").config();

const connectDb = require("../config/db");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Store = require("../models/Store");
const User = require("../models/User");

const categories = [
  { name: "Food & Drinks", slug: "food-drinks", description: "Ready-to-buy food, drinks, and daily treats." },
  { name: "Fashion", slug: "fashion", description: "Clothing, accessories, and footwear." },
  { name: "Crafts", slug: "crafts", description: "Handmade and creative local goods." },
];

const stores = [
  {
    ownerName: "Aarav Mehta",
    name: "Sector Brew House",
    email: "sectorbrew@example.com",
    workPhone: "9876501101",
    address: "Sector 17 Market, Chandigarh",
    description: "Fresh coffee, cold brew bottles, and small-batch bakery items for pickup.",
    category: "Food & Drinks",
    productKeywords: ["coffee", "cold brew", "brownie", "croissant"],
    coverImageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    workingHours: "Mon-Sat, 9 AM - 9 PM",
    location: { lat: 30.7401, lng: 76.7821 },
    products: [
      { name: "Cold Brew Bottle", description: "Slow-steeped house cold brew, 300ml.", price: 149, stock: 24, categorySlug: "food-drinks" },
      { name: "Walnut Brownie", description: "Dense chocolate brownie with roasted walnuts.", price: 89, stock: 18, categorySlug: "food-drinks" },
      { name: "Butter Croissant", description: "Flaky bakery croissant baked fresh daily.", price: 119, stock: 12, categorySlug: "food-drinks" },
    ],
  },
  {
    ownerName: "Meera Kapoor",
    name: "Craft Lane Studio",
    email: "craftlane@example.com",
    workPhone: "9876501102",
    address: "Elante Mall Road, Chandigarh",
    description: "Handmade gifts, pottery pieces, and custom craft items from local makers.",
    category: "Crafts",
    productKeywords: ["pottery", "gift", "handmade", "ceramic"],
    coverImageUrl: "https://images.unsplash.com/photo-1493106819501-66d381c466f1?auto=format&fit=crop&w=1200&q=80",
    workingHours: "Tue-Sun, 11 AM - 8 PM",
    location: { lat: 30.7056, lng: 76.8013 },
    products: [
      { name: "Ceramic Coffee Mug", description: "Hand-glazed ceramic mug with a matte finish.", price: 399, stock: 9, categorySlug: "crafts" },
      { name: "Handmade Gift Box", description: "Curated local craft gift box for birthdays and events.", price: 799, stock: 7, categorySlug: "crafts" },
      { name: "Mini Clay Planter", description: "Small clay planter for desk plants.", price: 249, stock: 16, categorySlug: "crafts" },
    ],
  },
  {
    ownerName: "Riya Sharma",
    name: "Urban Stitch Corner",
    email: "urbanstitch@example.com",
    workPhone: "9876501103",
    address: "Phase 7 Market, Mohali",
    description: "Everyday apparel, stitched accessories, and custom alterations.",
    category: "Fashion",
    productKeywords: ["scarf", "tote", "kurti", "alteration"],
    coverImageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
    workingHours: "Mon-Sat, 10 AM - 8 PM",
    location: { lat: 30.7046, lng: 76.7179 },
    products: [
      { name: "Cotton Tote Bag", description: "Durable stitched tote bag for daily use.", price: 299, stock: 20, categorySlug: "fashion" },
      { name: "Printed Scarf", description: "Lightweight printed scarf with soft finish.", price: 349, stock: 14, categorySlug: "fashion" },
      { name: "Everyday Kurti", description: "Comfort fit kurti available in selected sizes.", price: 899, stock: 8, categorySlug: "fashion" },
    ],
  },
];

async function seed() {
  await connectDb();

  const categoryDocs = await Promise.all(
    categories.map((category) =>
      Category.findOneAndUpdate({ slug: category.slug }, category, { upsert: true, new: true, setDefaultsOnInsert: true })
    )
  );
  const categoryBySlug = new Map(categoryDocs.map((category) => [category.slug, category]));

  for (const seedStore of stores) {
    const user = await User.findOneAndUpdate(
      { phone: seedStore.workPhone },
      {
        phone: seedStore.workPhone,
        ownerName: seedStore.ownerName,
        email: seedStore.email,
        role: "vendor",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const store = await Store.findOneAndUpdate(
      { workPhone: seedStore.workPhone },
      {
        vendorId: user._id,
        ownerName: seedStore.ownerName,
        name: seedStore.name,
        email: seedStore.email,
        workPhone: seedStore.workPhone,
        address: seedStore.address,
        description: seedStore.description,
        category: seedStore.category,
        productKeywords: seedStore.productKeywords,
        coverImageUrl: seedStore.coverImageUrl,
        workingHours: seedStore.workingHours,
        paymentType: "cash",
        planId: "free",
        planStatus: "active",
        showOnMap: true,
        location: seedStore.location,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    for (const seedProduct of seedStore.products) {
      await Product.findOneAndUpdate(
        { storeId: store._id, name: seedProduct.name },
        {
          storeId: store._id,
          name: seedProduct.name,
          description: seedProduct.description,
          price: seedProduct.price,
          stock: seedProduct.stock,
          categoryId: categoryBySlug.get(seedProduct.categorySlug)?._id || null,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  console.log(`Seeded ${stores.length} stores and ${categories.length} categories.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
