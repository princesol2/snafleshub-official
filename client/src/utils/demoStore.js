import coverImage from "../../img/storefront.jpg";
import logoImage from "../../img/sh-logo.jpeg";
import potteryImage from "../../img/about-pottery-hands.jpg";
import textileImage from "../../img/hero-handmade-textiles.jpg";
import candleImage from "../../img/hero-craft-fair-candles.jpg";
import craftImage from "../../img/hero-market-stall-crafts.jpg";
import ceramicsImage from "../../img/hero-outdoor-ceramics.jpg";
import giftImage from "../../img/about-handmade-gift.jpg";

export const demoStoreId = "66f1a7c8b9d2e3f4a5b6c7d8";
export const demoOrderId = "66f1a7c8b9d2e3f4a5b6c7d9";
export const demoOrderToken = "demo-confirmed";

export const demoStore = {
  _id: demoStoreId,
  storeCode: "DEMO-STORE",
  name: "SnaflesHub Demo Store",
  category: "Handmade Gifts",
  description:
    "A ready-to-shop demo storefront with handmade home goods, textiles, candles, and gift pieces for testing the customer experience.",
  address: "Demo Market, Bengaluru",
  workingHours: "10:00 AM - 8:00 PM",
  workPhone: "+91 98765 43210",
  coverImageUrl: coverImage,
  logoUrl: logoImage,
  location: {
    lat: 12.9716,
    lng: 77.5946,
  },
  socialLinks: {
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
  },
};

export const demoProducts = [
  {
    _id: "66f1a7c8b9d2e3f4a5b6c7e1",
    name: "Ceramic Breakfast Bowl",
    description: "Hand-thrown ceramic bowl with a soft glazed finish for daily breakfasts, snacks, and table styling.",
    price: 649,
    stock: 18,
    imageUrl: potteryImage,
    categoryId: { name: "Ceramics" },
  },
  {
    _id: "66f1a7c8b9d2e3f4a5b6c7e2",
    name: "Block Print Cotton Tote",
    description: "Reusable cotton tote with hand-block printed patterns and a roomy everyday carry shape.",
    price: 499,
    stock: 24,
    imageUrl: textileImage,
    categoryId: { name: "Textiles" },
  },
  {
    _id: "66f1a7c8b9d2e3f4a5b6c7e3",
    name: "Soy Wax Candle Set",
    description: "Set of two clean-burning soy candles with warm market-inspired fragrances and reusable jars.",
    price: 799,
    stock: 12,
    imageUrl: candleImage,
    categoryId: { name: "Home Fragrance" },
  },
  {
    _id: "66f1a7c8b9d2e3f4a5b6c7e4",
    name: "Woven Table Runner",
    description: "Textured runner for dining tables, consoles, and festive setups, woven in a small-batch finish.",
    price: 1199,
    stock: 9,
    imageUrl: craftImage,
    categoryId: { name: "Decor" },
  },
  {
    _id: "66f1a7c8b9d2e3f4a5b6c7e5",
    name: "Mini Planter Pair",
    description: "Two compact ceramic planters for desks, shelves, and windowsills. Plants not included.",
    price: 899,
    stock: 15,
    imageUrl: ceramicsImage,
    categoryId: { name: "Planters" },
  },
  {
    _id: "66f1a7c8b9d2e3f4a5b6c7e6",
    name: "Gift Hamper Sampler",
    description: "A curated sampler with a candle, mini decor piece, and handwritten gift note for quick gifting.",
    price: 1499,
    stock: 7,
    imageUrl: giftImage,
    categoryId: { name: "Gifts" },
  },
];

export function isDemoStoreId(storeId) {
  return String(storeId || "") === demoStoreId;
}

export function getDemoProduct(productId) {
  return demoProducts.find((product) => product._id === String(productId));
}

export function createDemoOrder(cartItems, customer, paymentMode = "cash_on_delivery") {
  const items = cartItems
    .map((item) => {
      const product = getDemoProduct(item.productId);

      if (!product) {
        return null;
      }

      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(product.price || 0);

      return {
        productId: product._id,
        name: product.name,
        quantity,
        unitPrice,
        total: unitPrice * quantity,
      };
    })
    .filter(Boolean);

  return {
    _id: demoOrderId,
    status: "confirmed",
    paymentMode,
    subtotal: items.reduce((sum, item) => sum + item.total, 0),
    items,
    customer,
  };
}

export function saveDemoOrder(order) {
  window.localStorage.setItem("snafleshub_demo_order", JSON.stringify(order));
}

export function getSavedDemoOrder() {
  try {
    return JSON.parse(window.localStorage.getItem("snafleshub_demo_order") || "null");
  } catch (error) {
    window.localStorage.removeItem("snafleshub_demo_order");
    return null;
  }
}
