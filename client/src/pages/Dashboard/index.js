import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronDown, Copy, ExternalLink, MessageCircle, PackageCheck, PackagePlus, Phone, Search, X } from "lucide-react";
import api from "../../services/api";
import Modal from "../../components/Modal";
import { useLanguage } from "../../i18n/LanguageContext";
import { clearSession, getAuthToken, getStore, getVendor, setStore as persistStore } from "../../services/session";
import useDocumentTitle from "../../utils/useDocumentTitle";
import { DashboardSkeleton } from "../../components/LoadingSkeleton";

function getVendorId(store) {
  return String(store.vendorId?._id || store.vendorId || "");
}

const initialProductForm = {
  name: "",
  description: "",
  imageUrl: "",
  price: "",
  stock: "",
};

const dashboardTabs = [
  { id: "products", label: "Products" },
  { id: "orders", label: "Orders" },
  { id: "messages", label: "Messages" },
  { id: "payments", label: "Payments" },
  { id: "sales", label: "Sales" },
  { id: "profile", label: "Profile" },
  { id: "settings", label: "Settings" },
];

const productSortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price-high", label: "Price High-Low" },
  { value: "price-low", label: "Price Low-High" },
  { value: "stock-low", label: "Stock Low-High" },
];

const orderStatusSteps = [
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancel" },
];

const initialProfileForm = {
  ownerName: "",
  name: "",
  category: "",
  address: "",
  workPhone: "",
  email: "",
  description: "",
  logoUrl: "",
  coverImageUrl: "",
  workingHours: "",
  paymentType: "upi",
  upiId: "",
  upiQrUrl: "",
  upiQrReference: "",
  lat: "",
  lng: "",
  socialLinks: {
    instagram: "",
    facebook: "",
    linkedin: "",
  },
};

function getPaymentLabel(store) {
  if (!store) {
    return "Not listed";
  }

  if (store.paymentType === "upi") {
    return store.upiId ? `Digital payment: ${store.upiId}` : "Digital payment";
  }

  if (store.paymentType === "cash") {
    return "Pay at store";
  }

  return store.upiId || store.paypalEmail || "Not listed";
}

function getUpiQrReference(values = {}) {
  return ["SnaflesHub", values.name, values.ownerName, values.email || values.workPhone, values.category]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" | ");
}

function getProductInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "SH";
  }

  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
}

function getStockLabel(product) {
  const stock = Number(product?.stock || 0);

  if (stock <= 0) {
    return "Out of stock";
  }

  if (stock <= 3) {
    return "Low stock";
  }

  return "Available";
}

function getStockTone(product) {
  const stock = Number(product?.stock || 0);

  if (stock <= 0) {
    return "is-empty";
  }

  if (stock <= 3) {
    return "is-low";
  }

  return "is-ready";
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getPriceSuggestion(value) {
  const trimmedValue = String(value || "").trim();
  const price = Number(trimmedValue);

  if (!trimmedValue || !Number.isFinite(price) || price <= 0) {
    return null;
  }

  return {
    label: formatCurrency(price),
    copy: `This product will show as ${formatCurrency(price)} to customers.`,
  };
}

function formatOrderStatus(value) {
  return String(value || "confirmed")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getOrderPaymentLabel(order) {
  if (order?.paymentMode === "manual_upi") {
    if (order?.paymentId?.status === "paid" || order?.status === "confirmed") {
      return "UPI confirmed";
    }

    if (order?.paymentId?.status === "failed" || order?.status === "payment_failed") {
      return "UPI rejected";
    }

    return "UPI submitted";
  }

  if (order?.paymentMode === "online" || order?.paymentMode === "test_online") {
    if (order?.paymentId?.status === "paid" || order?.status === "confirmed") {
      return "Online paid";
    }

    if (order?.paymentId?.status === "failed" || order?.status === "payment_failed") {
      return "Online failed";
    }

    return "Online pending";
  }

  if (order?.paymentMode === "pay_at_store") {
    return "Pay at store";
  }

  return "Cash/manual";
}

function canUpdateOrderStatus(order) {
  return !["payment_pending", "payment_submitted", "payment_failed"].includes(order?.status);
}

function getManualUpiReference(order) {
  return order?.paymentId?.metadata?.upiReference || "";
}

function getManualUpiScreenshot(order) {
  return order?.paymentId?.metadata?.upiScreenshotUrl || "";
}

function getPhoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function SocialBadge({ label }) {
  return <span className="social-icon-badge" aria-hidden="true">{label}</span>;
}

function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const vendor = getVendor();
  const authToken = getAuthToken();
  const savedStore = getStore();
  const [store, setStore] = useState(savedStore);
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [productSort, setProductSort] = useState("newest");
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [ordersError, setOrdersError] = useState("");
  const [messagesError, setMessagesError] = useState("");
  const [ordersStatus, setOrdersStatus] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [productForm, setProductForm] = useState(initialProductForm);
  const [editingProductId, setEditingProductId] = useState("");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productStatus, setProductStatus] = useState("");
  const [productError, setProductError] = useState("");
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [profileStatus, setProfileStatus] = useState("");
  const [profileError, setProfileError] = useState("");
  const [dashboardNotice, setDashboardNotice] = useState(() => window.sessionStorage.getItem("snafleshub_dashboard_notice") || "");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  useDocumentTitle(store?.name ? `${store.name} Shop Dashboard` : "Shop Dashboard");

  useEffect(() => {
    if (!dashboardNotice) {
      return;
    }

    window.sessionStorage.removeItem("snafleshub_dashboard_notice");
  }, [dashboardNotice]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!vendor?._id) {
        return;
      }

      try {
        setError("");
        const storesResponse = await api.get("/api/stores/mine");
        const allStores = storesResponse.data.data || [];
        const vendorStores = allStores.filter((store) => getVendorId(store) === String(vendor._id));

        if (!isMounted) {
          return;
        }

        const currentStore = vendorStores[0] || null;
        setStore(currentStore);

        if (currentStore) {
          persistStore(currentStore);
          setProfileForm({
            ownerName: currentStore.ownerName || "",
            name: currentStore.name || "",
            category: currentStore.category || "",
            address: currentStore.address || "",
            workPhone: currentStore.workPhone || "",
            email: currentStore.email || "",
            description: currentStore.description || "",
            logoUrl: currentStore.logoUrl || "",
            coverImageUrl: currentStore.coverImageUrl || "",
            workingHours: currentStore.workingHours || "",
            paymentType: currentStore.paymentType || "upi",
            upiId: currentStore.upiId || "",
            upiQrUrl: currentStore.upiQrUrl || "",
            upiQrReference: currentStore.upiQrReference || getUpiQrReference(currentStore),
            lat: currentStore.location?.lat ?? "",
            lng: currentStore.location?.lng ?? "",
            socialLinks: {
              instagram: currentStore.socialLinks?.instagram || "",
              facebook: currentStore.socialLinks?.facebook || "",
              linkedin: currentStore.socialLinks?.linkedin || "",
            },
          });
          const productsResponse = await api.get(`/api/stores/${currentStore._id}/products`);

          if (!isMounted) {
            return;
          }

          setProducts(productsResponse.data.data || []);
          try {
            const ordersResponse = await api.get(`/api/checkout/stores/${currentStore._id}/orders`);

            if (!isMounted) {
              return;
            }

            setOrders(ordersResponse.data.data || []);
            setOrdersError("");
          } catch (requestLoadError) {
            if (!isMounted) {
              return;
            }

            setOrders([]);
            setOrdersError("Unable to load customer orders.");
          }
          try {
            const messagesResponse = await api.get(`/api/stores/${currentStore._id}/requests`);

            if (!isMounted) {
              return;
            }

            setMessages(messagesResponse.data.data || []);
            setMessagesError("");
          } catch (requestLoadError) {
            if (!isMounted) {
              return;
            }

            setMessages([]);
            setMessagesError("Unable to load owner mailbox.");
          }
        } else {
          setProducts([]);
          setOrders([]);
          setMessages([]);
        }
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        if (requestError.response?.status === 401) {
          clearSession();
          navigate("/vendor/login", { replace: true });
          return;
        }

        setError(requestError.response?.data?.message || t("dashboard.error"));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [navigate, t, vendor?._id]);

  if (!vendor?._id || !authToken) {
    return <Navigate to="/vendor/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="page vendor-score-page">
        <DashboardSkeleton />
      </div>
    );
  }

  const ownerName = store?.ownerName || vendor?.ownerName || "";
  const isMapReady = Boolean(store?.showOnMap && store?.location?.lat && store?.location?.lng);
  const lowStockProducts = products.filter((product) => Number(product.stock || 0) <= 3);
  const openOrders = orders.filter((order) => !["completed", "cancelled"].includes(order.status));
  const completedOrders = orders.filter((order) => order.status === "completed");
  const activeOrders = orders.filter((order) => order.status !== "cancelled");
  const pendingPaymentOrders = orders.filter((order) => ["created", "payment_pending", "payment_submitted"].includes(order.status));
  const totalSales = activeOrders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
  const completedSales = completedOrders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
  const pendingPaymentTotal = pendingPaymentOrders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
  const topShelfProducts = products.slice(0, 6);
  const totalInventoryValue = products.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0), 0);
  const recentProducts = products.slice(0, 5);
  const publicStoreUrl = store?._id ? `${window.location.origin}/store/${store._id}` : "";
  const whatsappShareUrl = publicStoreUrl
    ? `https://wa.me/?text=${encodeURIComponent(`Visit my SnaflesHub store: ${publicStoreUrl}`)}`
    : "";
  const facebookShareUrl = publicStoreUrl
    ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicStoreUrl)}`
    : "";
  const setupChecklist = [
    { label: "Add logo", done: Boolean(store?.logoUrl) },
    { label: "Add first product", done: products.length > 0 },
    { label: "Verify phone", done: Boolean(store?.workPhone) },
    { label: "Share store", done: false },
    { label: "Complete store profile", done: Boolean(store?.description && store?.address && store?.category) },
  ];
  const setupProgress = Math.max(25, Math.round((setupChecklist.filter((item) => item.done).length / setupChecklist.length) * 100));
  const profileRows = [
    { label: "Owner name", value: ownerName || "Not listed" },
    { label: "Store name", value: store?.name || "Not listed" },
    { label: "Phone number", value: store?.workPhone || vendor?.phone || "Not listed" },
    { label: "Email", value: store?.email || vendor?.email || "Not listed" },
    { label: "Payment method", value: getPaymentLabel(store) },
  ];
  const accountJoinedDate = vendor?.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "Not available";
  const storeJoinedDate = store?.createdAt ? new Date(store.createdAt).toLocaleDateString() : "Not available";
  const emailVerified = Boolean(vendor?.emailVerified || store?.emailVerified);
  const settingsRows = [
    { label: "Owner account", value: accountJoinedDate },
    { label: "Store created", value: storeJoinedDate },
    { label: "Email verification", value: emailVerified ? "Verified" : "Not verified yet" },
    { label: "Store ID", value: store?.storeCode || String(store?._id || "").slice(-6).toUpperCase() || "Not available" },
  ];
  const dashboardStatus = store?.workingHours || "Open now";
  const dashboardStatusTone = "is-live";
  const healthMetrics = [
    { label: "Orders", value: openOrders.length, detail: `${orders.length} total` },
    { label: "Messages", value: messages.filter((message) => message.requestType === "message").length, detail: "owner inbox" },
    { label: "Payments", value: formatCurrency(pendingPaymentTotal), detail: `${pendingPaymentOrders.length} pending` },
    { label: "Sales", value: formatCurrency(totalSales), detail: `${completedOrders.length} completed` },
  ];
  const productSearchTerm = productSearch.trim().toLowerCase();
  const priceSuggestion = getPriceSuggestion(productForm.price);
  const visibleProducts = products
    .filter((product) => {
      if (!productSearchTerm) {
        return true;
      }

      return [product.name, product.description]
        .some((value) => String(value || "").toLowerCase().includes(productSearchTerm));
    })
    .sort((firstProduct, secondProduct) => {
      if (productSort === "oldest") {
        return new Date(firstProduct.createdAt || 0) - new Date(secondProduct.createdAt || 0);
      }

      if (productSort === "price-high") {
        return Number(secondProduct.price || 0) - Number(firstProduct.price || 0);
      }

      if (productSort === "price-low") {
        return Number(firstProduct.price || 0) - Number(secondProduct.price || 0);
      }

      if (productSort === "stock-low") {
        return Number(firstProduct.stock || 0) - Number(secondProduct.stock || 0);
      }

      return new Date(secondProduct.createdAt || 0) - new Date(firstProduct.createdAt || 0);
    });

  const updateProductForm = (field, value) => {
    setProductForm((current) => ({
      ...current,
      [field]: value,
    }));
    setProductError("");
    setProductStatus("");
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      setUpdatingOrderId(orderId);
      setOrdersError("");
      setOrdersStatus("");
      const response = await api.patch(`/api/checkout/orders/${orderId}/status`, { status });
      const updatedOrder = response.data.data;

      setOrders((currentOrders) =>
        currentOrders.map((order) => (order._id === orderId ? { ...order, ...updatedOrder } : order))
      );
      setOrdersStatus(`Order #${String(orderId).slice(-6).toUpperCase()} marked ${formatOrderStatus(status)}.`);
    } catch (requestError) {
      setOrdersError(requestError.response?.data?.message || "Unable to update this order.");
    } finally {
      setUpdatingOrderId("");
    }
  };

  const updateManualUpiPayment = async (orderId, decision) => {
    try {
      setUpdatingOrderId(orderId);
      setOrdersError("");
      setOrdersStatus("");
      const response = await api.patch(`/api/checkout/orders/${orderId}/payment`, { decision });
      const updatedOrder = response.data.data;

      setOrders((currentOrders) =>
        currentOrders.map((order) => (order._id === orderId ? { ...order, ...updatedOrder } : order))
      );
      setOrdersStatus(
        decision === "confirm"
          ? `UPI payment confirmed for order #${String(orderId).slice(-6).toUpperCase()}.`
          : `UPI payment rejected for order #${String(orderId).slice(-6).toUpperCase()}.`
      );
    } catch (requestError) {
      setOrdersError(requestError.response?.data?.message || "Unable to update this UPI payment.");
    } finally {
      setUpdatingOrderId("");
    }
  };

  const copyStoreLink = async () => {
    if (!publicStoreUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicStoreUrl);
      setShareStatus("Public store link copied.");
    } catch (copyError) {
      setShareStatus("Copy failed. Select and copy the public URL manually.");
    }
  };

  const resetProductForm = () => {
    setProductForm(initialProductForm);
    setEditingProductId("");
    setIsProductFormOpen(false);
    setProductError("");
    setProductStatus("");
  };

  const startAddingProduct = () => {
    setProductForm(initialProductForm);
    setEditingProductId("");
    setIsProductFormOpen(true);
    setProductError("");
    setProductStatus("");
  };

  const startEditingProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
    });
    setIsProductFormOpen(true);
    setProductError("");
    setProductStatus("");
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();

    if (!store?._id) {
      setProductError(t("dashboard.createStoreFirst"));
      return;
    }

    const price = Number(productForm.price);
    const stock = Number(productForm.stock);

    if (!productForm.name.trim() || !Number.isFinite(price) || !Number.isFinite(stock)) {
      setProductError(t("store.addProductValidation"));
      return;
    }

    if (price < 0 || stock < 0) {
      setProductError(t("store.addProductNonNegative"));
      return;
    }

    try {
      const wasEditingProduct = Boolean(editingProductId);
      setIsAddingProduct(true);
      setProductError("");
      setProductStatus("");

      const productPayload = {
        storeId: store._id,
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        imageUrl: productForm.imageUrl.trim(),
        price,
        stock,
      };
      const response = editingProductId
        ? await api.patch(`/api/products/${editingProductId}`, productPayload)
        : await api.post("/api/products", productPayload);

      setProducts((current) =>
        wasEditingProduct
          ? current.map((product) => (product._id === editingProductId ? response.data.data : product))
          : [response.data.data, ...current]
      );
      setProductForm(initialProductForm);
      setEditingProductId("");
      setIsProductFormOpen(!wasEditingProduct);
      setProductStatus(wasEditingProduct ? t("store.updateProductSuccess") : t("store.addProductSuccess"));
    } catch (requestError) {
      setProductError(requestError.response?.data?.message || t("store.saveProductError"));
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      setProductError("");
      setProductStatus("");
      await api.delete(`/api/products/${productId}`);
      setProducts((current) => current.filter((product) => product._id !== productId));
      if (editingProductId === productId) {
        resetProductForm();
      }
      setProductStatus(t("store.deleteProductSuccess"));
    } catch (requestError) {
      setProductError(requestError.response?.data?.message || t("store.deleteProductError"));
    }
  };

  const updateProfileForm = (field, value) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
    setProfileError("");
    setProfileStatus("");
  };

  const updateSocialForm = (field, value) => {
    setProfileForm((current) => ({
      ...current,
      socialLinks: {
        ...current.socialLinks,
        [field]: value,
      },
    }));
    setProfileError("");
    setProfileStatus("");
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!store?._id) {
      setProfileError("Create a storefront before editing profile details.");
      return;
    }

    if (!profileForm.name.trim() || !profileForm.workPhone.trim()) {
      setProfileError("Store name and customer phone number are required.");
      return;
    }

    try {
      setIsProfileSaving(true);
      setProfileError("");
      setProfileStatus("");
      const lat = Number(profileForm.lat);
      const lng = Number(profileForm.lng);
      const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
      const response = await api.patch(`/api/stores/${store._id}`, {
        ownerName: profileForm.ownerName.trim(),
        name: profileForm.name.trim(),
        category: profileForm.category.trim(),
        address: profileForm.address.trim(),
        workPhone: profileForm.workPhone.trim(),
        email: profileForm.email.trim(),
        description: profileForm.description.trim(),
        logoUrl: profileForm.logoUrl.trim(),
        coverImageUrl: profileForm.coverImageUrl.trim(),
        workingHours: profileForm.workingHours.trim(),
        paymentType: profileForm.paymentType,
        upiId: profileForm.upiId.trim(),
        upiQrUrl: profileForm.upiQrUrl.trim(),
        upiQrReference: (profileForm.upiQrReference || getUpiQrReference(profileForm)).trim(),
        location: hasLocation ? { lat, lng } : null,
        socialLinks: {
          instagram: profileForm.socialLinks.instagram.trim(),
          facebook: profileForm.socialLinks.facebook.trim(),
          linkedin: profileForm.socialLinks.linkedin.trim(),
        },
      });

      setStore(response.data.data);
      persistStore(response.data.data);
      setProfileStatus("Store profile updated.");
    } catch (requestError) {
      setProfileError(requestError.response?.data?.message || "Unable to update store profile.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const openDashboardSection = (sectionId) => {
    setActiveTab(sectionId);
    setIsAccountMenuOpen(false);
  };

  const handleSignOut = () => {
    clearSession();
    setIsAccountMenuOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="page vendor-score-page dashboard-layout">
      <section className="vendor-score container--dashboard">
        <section className="vendor-score__header dashboard-store-header" aria-label="Store dashboard header">
          <div className="dashboard-store-header__cover">
            {store?.coverImageUrl ? <img src={store.coverImageUrl} alt="" /> : null}
          </div>
          <div className="dashboard-store-header__body">
            <div className="dashboard-store-header__identity">
              <div className="dashboard-store-header__avatar" aria-hidden="true">
                {store?.logoUrl ? <img src={store.logoUrl} alt="" /> : <span>{getProductInitials(store?.name || "Shop")}</span>}
              </div>
              <div className="dashboard-store-header__copy">
                <div className="dashboard-store-header__title-row">
                  <h1>Hello, {store?.name || "your store"}</h1>
                  <span className={`dashboard-status ${dashboardStatusTone}`}>{dashboardStatus}</span>
                </div>
                <p>
                  {store?.storeCode ? `Store ID: ${store.storeCode}` : "Your workspace for orders, payments, sales, and products."}
                </p>
              </div>
            </div>
            {store ? (
              <div className="vendor-score__header-actions">
                <Link to={`/store/${store._id}`}>View Store</Link>
                <button type="button" onClick={() => openDashboardSection("profile")}>
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShareStatus("");
                    setIsShareDialogOpen(true);
                  }}
                >
                  Share Store
                </button>
                <div className="dashboard-account-menu">
                  <button
                    type="button"
                    className="dashboard-account-menu__trigger"
                    onClick={() => setIsAccountMenuOpen((current) => !current)}
                    aria-expanded={isAccountMenuOpen}
                    aria-haspopup="menu"
                  >
                    <span className="dashboard-account-menu__avatar" aria-hidden="true">
                      {store.logoUrl ? <img src={store.logoUrl} alt="" /> : <span>{getProductInitials(store.name || "Shop")}</span>}
                    </span>
                    <span className="dashboard-account-menu__name">{store.name}</span>
                    <ChevronDown size={16} aria-hidden="true" />
                  </button>
                  {isAccountMenuOpen ? (
                    <div className="dashboard-account-menu__panel" role="menu">
                      <button type="button" role="menuitem" onClick={() => openDashboardSection("profile")}>
                        My profile
                      </button>
                      <button type="button" role="menuitem" onClick={() => openDashboardSection("settings")}>
                        Settings
                      </button>
                      <Link to="/support" role="menuitem" onClick={() => setIsAccountMenuOpen(false)}>
                        Help
                      </Link>
                      <button type="button" role="menuitem" onClick={handleSignOut}>
                        Log out
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {dashboardNotice ? <p className="status-text status-text--success">{dashboardNotice}</p> : null}
        {shareStatus ? <p className="status-text status-text--success">{shareStatus}</p> : null}

        <div className="dashboard-health" aria-label="Shop health">
          {healthMetrics.map((metric) => (
            <article key={metric.label}>
              <div>
                <span>{metric.label}</span>
                <small>{metric.detail}</small>
              </div>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>

        {error ? <p className="status-text status-text--error">{error}</p> : null}

        {!isLoading && !store ? (
          <div className="vendor-score__empty">
            <h2>{t("dashboard.emptyTitle")}</h2>
            <p>{t("dashboard.emptyCopy")}</p>
          </div>
        ) : null}

        <div className="vendor-score__tabs" role="tablist" aria-label="Shop dashboard tools">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : ""}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "payments" ? (
          <section className="vendor-score__products vendor-requests-panel" aria-labelledby="dashboard-payments-title">
            <div className="vendor-profile-panel__header">
              <div>
                <h2 id="dashboard-payments-title">Payments</h2>
                <p>Track payment value connected to customer orders.</p>
              </div>
              <span>{formatCurrency(pendingPaymentTotal)} pending</span>
            </div>
            <div className="dashboard-order-summary" aria-label="Payment summary">
              <article>
                <span>Pending</span>
                <strong>{formatCurrency(pendingPaymentTotal)}</strong>
              </article>
              <article>
                <span>Completed sales</span>
                <strong>{formatCurrency(completedSales)}</strong>
              </article>
              <article>
                <span>Payment method</span>
                <strong>{getPaymentLabel(store)}</strong>
              </article>
            </div>
            <div className="dashboard-upi-scanner">
              <div>
                <span>UPI scanner</span>
                <h3>{store?.upiQrUrl ? "Scanner ready" : "No scanner added"}</h3>
                <p>Add your UPI scanner image URL in Profile so customers can pay manually after placing an order.</p>
                <strong className="dashboard-upi-scanner__reference">
                  {store?.upiQrReference || getUpiQrReference(store)}
                </strong>
                <button type="button" onClick={() => openDashboardSection("profile")}>
                  Manage scanner
                </button>
              </div>
              {store?.upiQrUrl ? (
                <img src={store.upiQrUrl} alt={`${store.name || "Store"} UPI scanner`} />
              ) : (
                <div className="dashboard-upi-scanner__empty" aria-hidden="true">
                  QR
                </div>
              )}
            </div>
            {orders.length === 0 ? (
              <div className="dashboard-empty-state">
                <PackageCheck size={28} aria-hidden="true" />
                <h3>No payment activity yet</h3>
                <p>Payments will appear here after customers place orders.</p>
              </div>
            ) : (
              <div className="vendor-request-list">
                {activeOrders.map((order) => (
                  <article key={order._id} className={`dashboard-order-card dashboard-order-card--${order.status}`}>
                    <div className="dashboard-order-card__main">
                      <div className="dashboard-order-card__top">
                        <span>{formatOrderStatus(order.status)}</span>
                        <strong>Order #{String(order._id).slice(-6).toUpperCase()}</strong>
                      </div>
                      <div className="dashboard-order-card__customer">
                        <strong>{order.customer?.name || "Customer"}</strong>
                        <p>{getOrderPaymentLabel(order)}</p>
                        {order.paymentMode === "manual_upi" && getManualUpiReference(order) ? (
                          <p>UPI ref: {getManualUpiReference(order)}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="dashboard-order-card__side">
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <strong>{formatCurrency(order.subtotal)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "sales" ? (
          <section className="vendor-score__products vendor-requests-panel" aria-labelledby="dashboard-sales-title">
            <div className="vendor-profile-panel__header">
              <div>
                <h2 id="dashboard-sales-title">Sales</h2>
                <p>See the value moving through this store.</p>
              </div>
              <span>{formatCurrency(totalSales)} total</span>
            </div>
            <div className="dashboard-order-summary" aria-label="Sales summary">
              <article>
                <span>Total sales</span>
                <strong>{formatCurrency(totalSales)}</strong>
              </article>
              <article>
                <span>Completed</span>
                <strong>{formatCurrency(completedSales)}</strong>
              </article>
              <article>
                <span>Inventory value</span>
                <strong>{formatCurrency(totalInventoryValue)}</strong>
              </article>
            </div>
            <div className="dashboard-empty-state">
              <PackageCheck size={28} aria-hidden="true" />
              <h3>{orders.length ? "Sales summary is ready" : "No sales yet"}</h3>
              <p>{orders.length ? "A fuller sales chart can come in the next dashboard slice." : "Sales will build as customer orders come in."}</p>
            </div>
          </section>
        ) : null}

        {activeTab === "favorites" ? (
          <section className="vendor-score__products dashboard-products" aria-labelledby="dashboard-favorites-title">
            <div className="dashboard-section-header">
              <div>
                <h2 id="dashboard-favorites-title">My Favorite Ones</h2>
                <span>{topShelfProducts.length} products shown</span>
              </div>
            </div>
            {topShelfProducts.length === 0 ? (
              <div className="dashboard-empty-state">
                <PackagePlus size={34} aria-hidden="true" />
                <strong>No products yet</strong>
                <p>Add products first, then this area can become a favorite list.</p>
              </div>
            ) : (
              <div className="dashboard-product-grid">
                {topShelfProducts.map((product) => (
                  <article className={`dashboard-product-card ${getStockTone(product)}`} key={product._id}>
                    <div className="dashboard-product-card__visual">
                      {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span>{getProductInitials(product.name)}</span>}
                    </div>
                    <div className="dashboard-product-card__body">
                      <div className="dashboard-product-card__top">
                        <strong>{product.name}</strong>
                        <span className={`shop-shelf-card__badge ${getStockTone(product)}`}>{getStockLabel(product)}</span>
                      </div>
                      <div className="dashboard-product-card__meta">
                        <span>{formatCurrency(product.price)}</span>
                        <small>{Number(product.stock || 0)} stock</small>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "orders" ? (
          <section className="vendor-score__products vendor-requests-panel" aria-labelledby="dashboard-requests-title">
            <div className="vendor-profile-panel__header">
              <div>
                <h2 id="dashboard-requests-title">Customer orders</h2>
                <p>Review new orders, contact customers, and move each order through the shop workflow.</p>
              </div>
              <span>{openOrders.length} open · {orders.length} total</span>
            </div>

            {ordersError ? <p className="status-text status-text--error">{ordersError}</p> : null}
            {ordersStatus ? <p className="status-text status-text--success">{ordersStatus}</p> : null}

            <div className="dashboard-order-summary" aria-label="Order summary">
              <article>
                <span>Open</span>
                <strong>{openOrders.length}</strong>
              </article>
              <article>
                <span>Completed</span>
                <strong>{orders.filter((order) => order.status === "completed").length}</strong>
              </article>
              <article>
                <span>Revenue</span>
                <strong>{formatCurrency(orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + Number(order.subtotal || 0), 0))}</strong>
              </article>
            </div>

            {orders.length === 0 ? (
              <div className="dashboard-empty-state">
                <PackageCheck size={28} aria-hidden="true" />
                <h3>No customer orders yet</h3>
                <p>When a customer places an order from the public storefront, it will appear here for follow-up.</p>
                {publicStoreUrl ? (
                  <Link to={`/store/${store._id}`} target="_blank" rel="noreferrer">
                    Open storefront
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="vendor-request-list">
                {orders.map((order) => (
                  <article key={order._id} className={`dashboard-order-card dashboard-order-card--${order.status}`}>
                    <div className="dashboard-order-card__main">
                      <div className="dashboard-order-card__top">
                        <span>{formatOrderStatus(order.status)}</span>
                        <strong>Order #{String(order._id).slice(-6).toUpperCase()}</strong>
                      </div>
                      <div className="dashboard-order-card__customer">
                        <strong>{order.customer?.name || "Customer"}</strong>
                        <p>{order.customer?.phone || "No phone listed"}</p>
                        {order.customer?.address ? <p>{order.customer.address}</p> : null}
                        {order.paymentMode === "manual_upi" && getManualUpiReference(order) ? (
                          <p>UPI ref: {getManualUpiReference(order)}</p>
                        ) : null}
                        {order.paymentMode === "manual_upi" && getManualUpiScreenshot(order) ? (
                          <p>
                            <a href={getManualUpiScreenshot(order)} target="_blank" rel="noreferrer">
                              View payment screenshot
                            </a>
                          </p>
                        ) : null}
                      </div>
                      <div className="dashboard-order-items">
                        {order.items?.map((item) => (
                          <span key={`${order._id}-${item.productId || item.name}`}>
                            {item.name} x{item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="dashboard-order-card__side">
                      <span>{getOrderPaymentLabel(order)}</span>
                      <strong>{formatCurrency(order.subtotal)}</strong>
                      <p>{new Date(order.createdAt).toLocaleString()}</p>
                      <div className="dashboard-order-contact">
                        {getPhoneDigits(order.customer?.phone) ? (
                          <>
                            <a href={`tel:${getPhoneDigits(order.customer?.phone)}`} title="Call customer" aria-label="Call customer">
                              <Phone size={16} aria-hidden="true" />
                            </a>
                            <a
                              href={`https://wa.me/${getPhoneDigits(order.customer?.phone)}?text=${encodeURIComponent(
                                `Hi ${order.customer?.name || ""}, this is ${store?.name || "the store"} about your SnaflesHub order #${String(order._id).slice(-6).toUpperCase()}.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Message customer on WhatsApp"
                              aria-label="Message customer on WhatsApp"
                            >
                              <MessageCircle size={16} aria-hidden="true" />
                            </a>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="dashboard-order-actions">
                      {order.paymentMode === "manual_upi" && order.status === "payment_submitted" ? (
                        <>
                          <button
                            type="button"
                            className="is-payment-confirm"
                            onClick={() => updateManualUpiPayment(order._id, "confirm")}
                            disabled={updatingOrderId === order._id}
                          >
                            {updatingOrderId === order._id ? "Updating..." : "Confirm UPI received"}
                          </button>
                          <button
                            type="button"
                            className="is-payment-reject"
                            onClick={() => updateManualUpiPayment(order._id, "reject")}
                            disabled={updatingOrderId === order._id}
                          >
                            Reject UPI
                          </button>
                        </>
                      ) : null}
                      {orderStatusSteps.map((step) => (
                        <button
                          key={step.value}
                          type="button"
                          className={order.status === step.value ? "is-active" : ""}
                          onClick={() => updateOrderStatus(order._id, step.value)}
                          disabled={updatingOrderId === order._id || order.status === step.value || !canUpdateOrderStatus(order)}
                        >
                          {updatingOrderId === order._id && order.status !== step.value ? "Updating..." : step.label}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "messages" ? (
          <section className="vendor-score__products vendor-requests-panel" aria-labelledby="dashboard-messages-title">
            <div className="vendor-profile-panel__header">
              <div>
                <h2 id="dashboard-messages-title">Owner mailbox</h2>
                <p>Read customer messages sent from the public storefront.</p>
              </div>
              <span>{messages.filter((message) => message.requestType === "message").length} messages</span>
            </div>

            {messagesError ? <p className="status-text status-text--error">{messagesError}</p> : null}

            {messages.filter((message) => message.requestType === "message").length === 0 ? (
              <div className="dashboard-empty-state">
                <MessageCircle size={30} aria-hidden="true" />
                <strong>No owner messages yet</strong>
                <p>When customers message this store, their notes will appear here.</p>
              </div>
            ) : (
              <div className="vendor-request-list">
                {messages.filter((message) => message.requestType === "message").map((message) => (
                  <article key={message._id} className="dashboard-order-card dashboard-message-card">
                    <div className="dashboard-order-card__main">
                      <div className="dashboard-order-card__top">
                        <span>Message</span>
                        <strong>{message.customerName}</strong>
                      </div>
                      <div className="dashboard-order-card__customer">
                        <p>{message.message}</p>
                        {message.customerEmail ? <p>{message.customerEmail}</p> : null}
                      </div>
                    </div>
                    <div className="dashboard-order-card__side">
                      <span>{new Date(message.createdAt).toLocaleString()}</span>
                      <strong>{message.customerPhone}</strong>
                      {getPhoneDigits(message.customerPhone) ? (
                        <a href={`tel:${getPhoneDigits(message.customerPhone)}`} title="Call customer" aria-label="Call customer">
                          <Phone size={16} aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "profile" ? (
          <section className="vendor-score__products vendor-profile-panel" aria-labelledby="dashboard-profile-title">
            <div className="vendor-profile-panel__header">
              <div>
                <h2 id="dashboard-profile-title">Shop profile</h2>
                <p>Review the details customers use to identify and contact this shop.</p>
              </div>
              <span>{store?._id ? `Store ID ${String(store._id).slice(-6).toUpperCase()}` : "No Store ID"}</span>
            </div>

            <div className="vendor-profile-list">
              {profileRows.map((row) => (
                <article key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </article>
              ))}
            </div>

            <div className="vendor-profile-disclaimer">
              <strong>Payment privacy note</strong>
              <p>
                SnaflesHub does not need bank account details for this dashboard. Keep only the payment method customers
                should use to pay you directly. Sensitive payment information should not be entered here.
              </p>
            </div>

            <form className="form-panel vendor-profile-edit" onSubmit={handleSaveProfile} noValidate>
              <h3>Edit store profile</h3>
              <div className="field-grid">
                <label className="field">
                  <span>Owner name</span>
                  <input value={profileForm.ownerName} onChange={(event) => updateProfileForm("ownerName", event.target.value)} />
                </label>
                <label className="field">
                  <span>Store name</span>
                  <input value={profileForm.name} onChange={(event) => updateProfileForm("name", event.target.value)} />
                </label>
                <label className="field">
                  <span>Category</span>
                  <input value={profileForm.category} onChange={(event) => updateProfileForm("category", event.target.value)} placeholder="Grocery, fashion, food" />
                </label>
                <label className="field">
                  <span>Customer phone</span>
                  <input value={profileForm.workPhone} onChange={(event) => updateProfileForm("workPhone", event.target.value)} />
                </label>
                <label className="field">
                  <span>Email optional</span>
                  <input value={profileForm.email} onChange={(event) => updateProfileForm("email", event.target.value)} />
                </label>
                <label className="field">
                  <span>Working hours</span>
                  <input value={profileForm.workingHours} onChange={(event) => updateProfileForm("workingHours", event.target.value)} placeholder="Mon-Sat, 10 AM - 8 PM" />
                </label>
                <label className="field field--full">
                  <span>Address</span>
                  <input value={profileForm.address} onChange={(event) => updateProfileForm("address", event.target.value)} placeholder="Store number, street, city" />
                </label>
                <label className="field field--full">
                  <span>Description</span>
                  <textarea value={profileForm.description} onChange={(event) => updateProfileForm("description", event.target.value)} placeholder="What customers can buy from this store" />
                </label>
                <label className="field">
                  <span>Store logo URL</span>
                  <input value={profileForm.logoUrl} onChange={(event) => updateProfileForm("logoUrl", event.target.value)} placeholder="https://example.com/logo.jpg" />
                </label>
                <label className="field">
                  <span>Store cover image URL</span>
                  <input value={profileForm.coverImageUrl} onChange={(event) => updateProfileForm("coverImageUrl", event.target.value)} placeholder="https://example.com/cover.jpg" />
                </label>
                <label className="field">
                  <span>Payment method</span>
                  <select value={profileForm.paymentType} onChange={(event) => updateProfileForm("paymentType", event.target.value)}>
                    <option value="upi">UPI or direct digital payment</option>
                    <option value="cash">Pay at store</option>
                  </select>
                </label>
                <label className="field">
                  <span>Payment ID optional</span>
                  <input value={profileForm.upiId} onChange={(event) => updateProfileForm("upiId", event.target.value)} placeholder="store@upi or payment note" />
                </label>
                <label className="field">
                  <span>UPI scanner image URL optional</span>
                  <input value={profileForm.upiQrUrl} onChange={(event) => updateProfileForm("upiQrUrl", event.target.value)} placeholder="https://example.com/upi-qr.jpg" />
                </label>
                <label className="field field--full">
                  <span>QR payment reference</span>
                  <input
                    value={profileForm.upiQrReference || getUpiQrReference(profileForm)}
                    onChange={(event) => updateProfileForm("upiQrReference", event.target.value)}
                    placeholder="SnaflesHub | Store | Owner | Email"
                  />
                </label>
                {profileForm.upiQrUrl ? (
                  <div className="field field--full dashboard-upi-preview">
                    <span>UPI scanner preview</span>
                    <img src={profileForm.upiQrUrl} alt="UPI scanner preview" />
                    <small>{profileForm.upiQrReference || getUpiQrReference(profileForm)}</small>
                  </div>
                ) : null}
                <label className="field">
                  <span>Latitude optional</span>
                  <input value={profileForm.lat} onChange={(event) => updateProfileForm("lat", event.target.value)} placeholder="30.7333" />
                </label>
                <label className="field">
                  <span>Longitude optional</span>
                  <input value={profileForm.lng} onChange={(event) => updateProfileForm("lng", event.target.value)} placeholder="76.7794" />
                </label>
                <label className="field">
                  <span><SocialBadge label="IG" /> Instagram</span>
                  <input value={profileForm.socialLinks.instagram} onChange={(event) => updateSocialForm("instagram", event.target.value)} placeholder="https://instagram.com/yourstore" />
                </label>
                <label className="field">
                  <span><SocialBadge label="f" /> Facebook</span>
                  <input value={profileForm.socialLinks.facebook} onChange={(event) => updateSocialForm("facebook", event.target.value)} placeholder="https://facebook.com/yourstore" />
                </label>
                <label className="field">
                  <span><SocialBadge label="in" /> LinkedIn</span>
                  <input value={profileForm.socialLinks.linkedin} onChange={(event) => updateSocialForm("linkedin", event.target.value)} placeholder="https://linkedin.com/company/yourstore" />
                </label>
              </div>
              {profileError ? <p className="status-text status-text--error">{profileError}</p> : null}
              {profileStatus ? <p className="status-text status-text--success">{profileStatus}</p> : null}
              <button type="submit" className="button" disabled={isProfileSaving}>
                {isProfileSaving ? "Saving..." : "Save store profile"}
              </button>
            </form>
          </section>
        ) : null}

        {activeTab === "settings" ? (
          <section className="vendor-score__products vendor-profile-panel dashboard-settings-panel" aria-labelledby="dashboard-settings-title">
            <div className="vendor-profile-panel__header">
              <div>
                <h2 id="dashboard-settings-title">Settings</h2>
                <p>Manage account security, verification, and store account details.</p>
              </div>
              <span>{store?.storeCode ? `Store ID ${store.storeCode}` : "Account settings"}</span>
            </div>

            <div className="vendor-profile-list">
              {settingsRows.map((row) => (
                <article key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </article>
              ))}
            </div>

            <div className="dashboard-settings-grid">
              <article className="dashboard-settings-card">
                <div>
                  <span>Security</span>
                  <h3>Password</h3>
                  <p>Keep the store account protected with a strong password.</p>
                </div>
                <Link to="/vendor/login">Reset password</Link>
              </article>
              <article className="dashboard-settings-card">
                <div>
                  <span>Storefront</span>
                  <h3>Public page</h3>
                  <p>Open the customer-facing store page to review how shoppers see this storefront.</p>
                </div>
                <Link to={store?._id ? `/store/${store._id}` : "/map"}>View store</Link>
              </article>
            </div>
          </section>
        ) : null}

        {activeTab === "products" ? (
          <section className="vendor-score__products dashboard-products" aria-labelledby="dashboard-products-title">
            <div className="dashboard-section-header">
              <div>
                <h2 id="dashboard-products-title">Products</h2>
                <span>{products.length} live</span>
              </div>
              <button type="button" className="button" onClick={startAddingProduct}>
                Add Product
              </button>
            </div>
            <div className="dashboard-product-toolbar">
              <label className="dashboard-product-search">
                <Search size={16} aria-hidden="true" />
                <span className="sr-only">Search products</span>
                <input
                  type="search"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Search products"
                />
              </label>
              <label className="dashboard-product-sort">
                <span>Sort</span>
                <select value={productSort} onChange={(event) => setProductSort(event.target.value)}>
                  {productSortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {products.length === 0 ? (
              <div className="dashboard-empty-state">
                <PackagePlus size={34} aria-hidden="true" />
                <strong>No products yet</strong>
                <p>Add your first product to start building your store.</p>
                <button type="button" className="button" onClick={startAddingProduct}>
                  Add Product
                </button>
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="dashboard-empty-state">
                <Search size={34} aria-hidden="true" />
                <strong>No matching products</strong>
                <p>Try another search term.</p>
              </div>
            ) : (
              <div className="dashboard-product-grid">
                {visibleProducts.map((product) => (
                  <article className={`dashboard-product-card ${getStockTone(product)}`} key={product._id}>
                    <div className="dashboard-product-card__visual">
                      {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span>{getProductInitials(product.name)}</span>}
                    </div>
                    <div className="dashboard-product-card__body">
                      <div className="dashboard-product-card__top">
                        <strong>{product.name}</strong>
                        <span className={`shop-shelf-card__badge ${getStockTone(product)}`}>{getStockLabel(product)}</span>
                      </div>
                      <div className="dashboard-product-card__meta">
                        <span>{formatCurrency(product.price)}</span>
                        <small>{Number(product.stock || 0)} stock</small>
                      </div>
                    </div>
                    <div className="dashboard-product-card__actions">
                      <button type="button" onClick={() => startEditingProduct(product)}>
                        {t("store.editProduct")}
                      </button>
                      <button type="button" onClick={() => handleDeleteProduct(product._id)}>
                        {t("store.deleteProduct")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </section>
      <Modal isOpen={Boolean(store && isProductFormOpen)} onClose={resetProductForm}>
        <div className="dashboard-product-modal">
          {productStatus && !editingProductId && !productError ? (
            <section className="dashboard-product-success" aria-live="polite">
              <span className="dashboard-product-success__icon">
                <CheckCircle2 size={34} aria-hidden="true" />
              </span>
              <h2>Product added</h2>
              <p>{productStatus || "Your product has been added to the store."}</p>
              <div className="dashboard-product-modal__actions">
                <button type="button" className="button" onClick={startAddingProduct}>
                  Add another product
                </button>
                <button type="button" className="button--ghost" onClick={resetProductForm}>
                  Done
                </button>
              </div>
            </section>
          ) : (
            <>
              <header className="dashboard-product-modal__header">
                <div>
                  <span>Product catalog</span>
                  <h2 id="dashboard-add-product-title">{editingProductId ? "Edit product" : "Add product"}</h2>
                  <p>{editingProductId ? "Update this product's details and save the changes." : "Add the product customers will see on your public store."}</p>
                </div>
                <button type="button" onClick={resetProductForm} aria-label="Close product form">
                  <X size={18} aria-hidden="true" />
                </button>
              </header>
              <form className="form-panel dashboard-product-form" onSubmit={handleSaveProduct}>
                <label className="field">
                  <span>{t("store.productName")}</span>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(event) => updateProductForm("name", event.target.value)}
                    placeholder={t("store.productNamePlaceholder")}
                  />
                </label>
                <label className="field">
                  <span>{t("store.productDescription")}</span>
                  <textarea
                    value={productForm.description}
                    onChange={(event) => updateProductForm("description", event.target.value)}
                    placeholder={t("store.productDescriptionPlaceholder")}
                  />
                </label>
                <label className="field">
                  <span>Product image URL optional</span>
                  <input
                    type="url"
                    value={productForm.imageUrl}
                    onChange={(event) => updateProductForm("imageUrl", event.target.value)}
                    placeholder="https://example.com/product.jpg"
                  />
                </label>
                <div className="field-grid">
                  <label className="field">
                    <span>{t("store.productPrice")}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(event) => updateProductForm("price", event.target.value)}
                      placeholder="499"
                    />
                    {priceSuggestion ? (
                      <button
                        type="button"
                        className="price-suggestion-card"
                        onClick={() => updateProductForm("price", String(Number(productForm.price)))}
                        aria-label={`Use ${priceSuggestion.label} as product price`}
                      >
                        <span>Price preview</span>
                        <strong>{priceSuggestion.label}</strong>
                        <small>{priceSuggestion.copy}</small>
                      </button>
                    ) : null}
                  </label>
                  <label className="field">
                    <span>{t("store.productStock")}</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={productForm.stock}
                      onChange={(event) => updateProductForm("stock", event.target.value)}
                      placeholder="12"
                    />
                  </label>
                </div>
                {productError ? <p className="status-text status-text--error">{productError}</p> : null}
                <div className="dashboard-product-modal__actions">
                  <button type="submit" className="button" disabled={isAddingProduct}>
                    {isAddingProduct
                      ? t("store.addingProduct")
                      : editingProductId
                        ? t("store.updateProductButton")
                        : t("store.addProductButton")}
                  </button>
                  <button type="button" className="button--ghost" onClick={resetProductForm}>
                    {editingProductId ? t("store.cancelEdit") : "Cancel"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </Modal>
      <Modal isOpen={isShareDialogOpen} onClose={() => setIsShareDialogOpen(false)}>
        <div className="share-store-dialog">
          <header className="share-store-dialog__header">
            <div>
              <h2>Share your store</h2>
              <p>Send your public storefront link to customers.</p>
            </div>
            <button type="button" onClick={() => setIsShareDialogOpen(false)} aria-label="Close share dialog">
              <X size={18} />
            </button>
          </header>
          <div className="share-store-dialog__body">
            <label className="field">
              <span>Public store URL</span>
              <input value={publicStoreUrl} readOnly />
            </label>
            <div className="share-store-dialog__actions">
              <button type="button" className="button" onClick={copyStoreLink}>
                <Copy size={16} /> Copy link
              </button>
              <a className="button--secondary" href={whatsappShareUrl} target="_blank" rel="noreferrer">
                <MessageCircle size={16} /> WhatsApp
              </a>
              <a className="button--secondary" href={facebookShareUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} /> Facebook
              </a>
            </div>
            {shareStatus ? <p className="status-text status-text--success">{shareStatus}</p> : null}
          </div>
          <footer className="share-store-dialog__footer">
            <button type="button" className="button--secondary" onClick={() => setIsShareDialogOpen(false)}>
              Close
            </button>
          </footer>
        </div>
      </Modal>
    </div>
  );
}

export default Dashboard;
