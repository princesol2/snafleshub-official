import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Phone,
  Plus,
  Search,
  Send,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import api from "../../services/api";
import { useLanguage } from "../../i18n/LanguageContext";
import useDocumentTitle from "../../utils/useDocumentTitle";
import { getStoreCode, getStoreInitials, getStoreLocationLabel } from "../../utils/storeDisplay";
import { StoreViewSkeleton } from "../../components/LoadingSkeleton";
import { isValidPhone } from "../../utils/validation";
import { getVendor } from "../../services/session";
import {
  formatPrice,
  getCartProduct,
  getProductInitials,
  getSavedCart,
  initialCheckoutForm,
  isVendorStoreOwner,
  mongoObjectIdPattern,
} from "../../utils/storefront";
import {
  createDemoOrder,
  demoOrderId,
  demoOrderToken,
  demoProducts,
  demoStore,
  isDemoStoreId,
  saveDemoOrder,
} from "../../utils/demoStore";
import "./StoreView.css";

function getCartStorageKey(storeId) {
  return `snafleshub_cart_${storeId}`;
}

function SocialBadge({ label }) {
  return <span className="social-icon-badge" aria-hidden="true">{label}</span>;
}

function StoreView() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [cartItems, setCartItems] = useState(() => getSavedCart(id));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState(initialCheckoutForm);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [cartNotice, setCartNotice] = useState("");
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageForm, setMessageForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [messageError, setMessageError] = useState("");
  const [messageStatus, setMessageStatus] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  useDocumentTitle(store?.name || "Storefront");

  useEffect(() => {
    let isMounted = true;

    const loadStore = async () => {
      if (isDemoStoreId(id)) {
        setStore(demoStore);
        setProducts(demoProducts);
        setError("");
        setIsLoading(false);
        return;
      }

      if (!mongoObjectIdPattern.test(id || "")) {
        setError(t("store.unavailableCopy"));
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        const [storeResponse, productsResponse] = await Promise.all([
          api.get(`/api/stores/${id}`),
          api.get(`/api/stores/${id}/products`),
        ]);

        if (!isMounted) {
          return;
        }

        setStore(storeResponse.data.data || null);
        setProducts(productsResponse.data.data || []);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(t("store.unavailableCopy"));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStore();

    return () => {
      isMounted = false;
    };
  }, [id, t]);

  useEffect(() => {
    setCartItems(getSavedCart(id));
    setCheckoutStatus(null);
    setCheckoutError("");
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    window.localStorage.setItem(getCartStorageKey(id), JSON.stringify(cartItems));
  }, [cartItems, id]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.description, product.categoryId?.name].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery)
    );
  }, [products, query]);

  const hydratedCart = useMemo(
    () =>
      cartItems
        .map((item) => {
          const product = getCartProduct(item.productId, products);
          return product ? { ...item, product } : null;
        })
        .filter(Boolean),
    [cartItems, products]
  );
  const cartCount = hydratedCart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const cartSubtotal = hydratedCart.reduce((sum, item) => sum + Number(item.product.price || 0) * Number(item.quantity || 0), 0);
  const coverImage = store?.coverImageUrl;
  const logoImage = store?.logoUrl;
  const socialLinks = store?.socialLinks || {};
  const visibleSocialLinks = [
    { key: "instagram", label: "Instagram", iconLabel: "IG", href: socialLinks.instagram },
    { key: "facebook", label: "Facebook", iconLabel: "f", href: socialLinks.facebook },
    { key: "linkedin", label: "LinkedIn", iconLabel: "in", href: socialLinks.linkedin },
  ].filter((item) => item.href);
  const vendor = getVendor();
  const isOwnStorePreview = isVendorStoreOwner(store, vendor);

  const updateCheckoutForm = (field, value) => {
    setCheckoutForm((current) => ({ ...current, [field]: value }));
    setCheckoutError("");
  };

  const updateMessageForm = (field, value) => {
    setMessageForm((current) => ({ ...current, [field]: value }));
    setMessageError("");
    setMessageStatus("");
  };

  const submitVendorMessage = async (event) => {
    event.preventDefault();
    setMessageError("");
    setMessageStatus("");

    if (!messageForm.name.trim() || !isValidPhone(messageForm.phone) || messageForm.message.trim().length < 3) {
      setMessageError("Enter your name, a valid mobile number, and a short message.");
      return;
    }

    try {
      setIsSendingMessage(true);
      const response = await api.post(`/api/stores/${store._id}/requests`, {
        requestType: "message",
        customerName: messageForm.name.trim(),
        customerPhone: messageForm.phone.trim(),
        customerEmail: messageForm.email.trim(),
        message: messageForm.message.trim(),
      });

      setMessageStatus(response.data.message || "Message sent to owner.");
      setMessageForm({ name: "", phone: "", email: "", message: "" });
    } catch (requestError) {
      setMessageError(requestError.response?.data?.message || "Unable to send this message. Please try again.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const addToCart = (product) => {
    if (isOwnStorePreview) {
      setCartNotice("Preview mode: owners cannot place orders from their own storefront account.");
      return;
    }

    if (!product || Number(product.stock || 0) <= 0) {
      setCartNotice("This product is out of stock.");
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === product._id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: Math.min(Number(product.stock || 1), Number(item.quantity || 1) + 1) }
            : item
        );
      }

      return [{ productId: product._id, quantity: 1 }, ...currentItems];
    });
    setSelectedProduct(null);
    setIsCartOpen(true);
    setCartNotice(`${product.name} added to cart.`);
  };

  const setCartQuantity = (productId, quantity) => {
    const product = getCartProduct(productId, products);
    const nextQuantity = Math.max(1, Math.min(Number(product?.stock || 1), Number(quantity || 1)));

    setCartItems((currentItems) =>
      currentItems.map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item))
    );
    setCheckoutError("");
  };

  const removeCartItem = (productId) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
    setCheckoutError("");
  };

  const submitCheckout = async (event) => {
    event.preventDefault();
    setCheckoutError("");

    if (isOwnStorePreview) {
      setCheckoutError("Preview mode: owners cannot place orders from their own storefront account.");
      return;
    }

    if (hydratedCart.length === 0) {
      setCheckoutError("Your cart is empty. Add a product before checkout.");
      return;
    }

    if (!checkoutForm.name.trim() || !isValidPhone(checkoutForm.phone) || checkoutForm.address.trim().length < 8) {
      setCheckoutError("Enter a valid name, mobile number, and delivery address.");
      return;
    }

    const unavailableItem = hydratedCart.find((item) => Number(item.product.stock || 0) < Number(item.quantity || 1));

    if (unavailableItem) {
      setCheckoutError(`${unavailableItem.product.name} does not have enough stock.`);
      return;
    }

    try {
      setIsCheckingOut(true);

      if (isDemoStoreId(id)) {
        const demoOrder = createDemoOrder(
          hydratedCart.map((item) => ({ productId: item.product._id, quantity: item.quantity })),
          {
            name: checkoutForm.name,
            phone: checkoutForm.phone,
            address: checkoutForm.address,
          },
          "cash_on_delivery"
        );
        saveDemoOrder(demoOrder);
        setCartItems([]);
        setCheckoutForm(initialCheckoutForm);
        setIsCartOpen(false);
        navigate(`/store/${id}/order-success/${demoOrderId}?token=${encodeURIComponent(demoOrderToken)}`, { replace: true });
        return;
      }

      const response = await api.post("/api/checkout", {
        storeId: store._id,
        items: hydratedCart.map((item) => ({
          productId: item.product._id,
          quantity: Number(item.quantity || 1),
        })),
        customer: {
          name: checkoutForm.name,
          phone: checkoutForm.phone,
          address: checkoutForm.address,
        },
        paymentMode: "cash_on_delivery",
        fulfillmentMethod: "store_contact",
      });

      setCheckoutStatus(response.data.data);
      setCartItems([]);
      setCheckoutForm(initialCheckoutForm);
      const productsResponse = await api.get(`/api/stores/${id}/products`);
      setProducts(productsResponse.data.data || []);
    } catch (requestError) {
      setCheckoutError(requestError.response?.data?.message || "Unable to place this order. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleShareStore = async () => {
    const shareUrl = window.location.href;
    const shareTitle = `${store.name} on SnaflesHub`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: `Open ${store.name} on SnaflesHub.`,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setCartNotice("Store link copied.");
    } catch (shareError) {
      if (shareError?.name === "AbortError") {
        return;
      }

      setCartNotice("Store link is ready in the address bar.");
    }
  };

  return (
    <div className="page">
      {isLoading ? <StoreViewSkeleton /> : null}

      {error ? (
        <div className="empty-state">
          <h1 className="surface-card__title">{t("store.unavailable")}</h1>
          <p className="empty-state__copy">{error}</p>
          <Link to="/map" className="button">
            {t("store.browseOther")}
          </Link>
        </div>
      ) : null}

      {store ? (
        <main className="public-store">
          <section className="public-store__hero">
            <div className="public-store__cover">{coverImage ? <img src={coverImage} alt="" /> : null}</div>
            <div className="public-store__profile">
              <div className="public-store__avatar">
                {logoImage ? <img src={logoImage} alt="" /> : <span>{getStoreInitials(store)}</span>}
              </div>
              <div className="public-store__identity">
                <p>Local storefront</p>
                <h1>{store.name}</h1>
                <span>{store.category || t("store.general")} · Store ID: {getStoreCode(store)}</span>
              </div>
              <div className="public-store__actions">
                <button className="public-store__secondary" type="button" onClick={handleShareStore}>
                  <Share2 size={16} aria-hidden="true" />
                  Share
                </button>
                <button className="public-store__secondary" type="button" onClick={() => setIsMessageOpen(true)}>
                  <MessageCircle size={16} aria-hidden="true" />
                  Message
                </button>
                <button className="public-store__primary" type="button" onClick={() => {
                  if (isOwnStorePreview) {
                    setCartNotice("Preview mode: use a customer session to test checkout.");
                    return;
                  }

                  navigate(`/store/${id}/checkout`);
                }}>
                  <ShoppingCart size={16} aria-hidden="true" />
                  {isOwnStorePreview ? "Preview mode" : `Cart ${cartCount ? `(${cartCount})` : ""}`}
                </button>
              </div>
            </div>
          </section>

          {isOwnStorePreview ? (
            <p className="store-preview-notice" role="status">
              You are viewing your own storefront as an owner preview. Customer checkout is disabled for this account.
            </p>
          ) : null}

          <section className="public-store__summary" aria-label={t("store.storeDetails")}>
            <div>
              <p>{store.description || t("store.noPublicDescription")}</p>
              <div className="public-store__facts">
                <span>
                  <MapPin size={16} aria-hidden="true" />
                  {getStoreLocationLabel(store)}
                </span>
                <span>
                  <Package size={16} aria-hidden="true" />
                  Store ID: {getStoreCode(store)}
                </span>
                {store.workingHours ? (
                  <span>
                    <Clock size={16} aria-hidden="true" />
                    {store.workingHours}
                  </span>
                ) : null}
                {store.workPhone ? (
                  <span>
                    <Phone size={16} aria-hidden="true" />
                    {store.workPhone}
                  </span>
                ) : null}
              </div>
            </div>
            <aside className="public-store__catalog-card">
              <span>
                <Package size={17} aria-hidden="true" />
                Product catalog
              </span>
              <strong>{products.length}</strong>
              <p>Search available products, open item details, add items to cart, and place a manual order.</p>
            </aside>
          </section>

          {visibleSocialLinks.length ? (
            <section className="public-store__socials" aria-label="Store social links">
              {visibleSocialLinks.map((social) => {
                return (
                  <a key={social.key} href={social.href} target="_blank" rel="noreferrer" aria-label={`${store.name} on ${social.label}`} title={social.label}>
                    <SocialBadge label={social.iconLabel} />
                    <span>{social.label}</span>
                  </a>
                );
              })}
            </section>
          ) : null}

          {cartNotice ? (
            <p className="store-cart-notice" role="status">
              {cartNotice}
            </p>
          ) : null}

          <section className="store-view-products" id="products">
            <div className="store-view-products__header">
              <div>
                <span>Store catalog</span>
                <h2>Products</h2>
                <p>Browse the catalog, check stock, and add products to cart.</p>
              </div>
              <label className="store-product-search">
                <Search size={17} aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search this store"
                  aria-label="Search products in this store"
                />
              </label>
            </div>

            {visibleProducts.length === 0 ? (
              <p className="store-view-products__empty">
                {products.length === 0 ? "This store has not published products yet." : "No products match this search."}
              </p>
            ) : (
              <div className="store-product-grid">
                {visibleProducts.map((product, index) => (
                  <article key={product._id || `${product.name}-${index}`} className="store-product-card">
                    <button type="button" className="store-product-card__detail" onClick={() => navigate(`/store/${id}/product/${product._id}`)}>
                      <div className="store-product-card__visual">
                        {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span>{getProductInitials(product.name)}</span>}
                        {index === 0 ? <strong>Featured</strong> : null}
                      </div>
                      <div className="store-product-card__content">
                        <div>
                          <h3>{product.name}</h3>
                          <p>{product.description || "Available at this store."}</p>
                        </div>
                        <div className="store-product-card__meta">
                          <span>{formatPrice(product.price)}</span>
                          <strong className={product.stock === 0 ? "is-empty" : ""}>
                            <CheckCircle2 size={15} aria-hidden="true" />
                            {product.stock > 0 ? `In stock · ${product.stock}` : "Out of stock"}
                          </strong>
                        </div>
                      </div>
                    </button>
                    <div className="store-product-card__actions">
                      <button
                        className="store-product-card__pull"
                        type="button"
                        onClick={() => {
                          addToCart(product);
                          if (!isOwnStorePreview) {
                            navigate(`/store/${id}/checkout`);
                          }
                        }}
                        disabled={product.stock === 0 || isOwnStorePreview}
                      >
                        {isOwnStorePreview ? "Preview only" : "Buy now"}
                      </button>
                      <button
                        className="store-product-card__cart"
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0 || isOwnStorePreview}
                        aria-label={isOwnStorePreview ? "Preview only" : `Add ${product.name} to cart`}
                        title={isOwnStorePreview ? "Preview only" : "Add to cart"}
                      >
                        <ShoppingCart size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {selectedProduct ? (
            <div className="store-request-overlay" role="dialog" aria-modal="true" aria-labelledby="product-detail-title">
              <section className="store-request-panel">
                <button className="store-request-panel__close" type="button" onClick={() => setSelectedProduct(null)} aria-label="Close">
                  <X size={18} aria-hidden="true" />
                </button>
                <div className="store-request-success store-product-detail">
                  <div className="store-product-detail__image">
                    {selectedProduct.imageUrl ? <img src={selectedProduct.imageUrl} alt="" /> : <span>{getProductInitials(selectedProduct.name)}</span>}
                  </div>
                  <span>{selectedProduct.categoryId?.name || store.category || "Product"}</span>
                  <h2 id="product-detail-title">{selectedProduct.name}</h2>
                  <p>{selectedProduct.description || "Available at this store."}</p>
                  <strong>{formatPrice(selectedProduct.price)}</strong>
                  <p>{selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : "Out of stock"}</p>
                  <button className="store-request-submit" type="button" onClick={() => addToCart(selectedProduct)} disabled={selectedProduct.stock === 0 || isOwnStorePreview}>
                    <ShoppingCart size={17} aria-hidden="true" />
                    {isOwnStorePreview ? "Preview only" : "Add to cart"}
                  </button>
                </div>
              </section>
            </div>
          ) : null}

          {isMessageOpen ? (
            <div className="store-request-overlay" role="dialog" aria-modal="true" aria-labelledby="vendor-message-title">
              <section className="store-request-panel">
                <button className="store-request-panel__close" type="button" onClick={() => setIsMessageOpen(false)} aria-label="Close message form">
                  <X size={18} aria-hidden="true" />
                </button>
                <form className="store-request-form" onSubmit={submitVendorMessage} noValidate>
                  <div className="store-request-panel__header">
                    <span>Owner mailbox</span>
                    <h2 id="vendor-message-title">Message {store.name}</h2>
                    <p>Send a note inside SnaflesHub. To protect owners, customers can send 2 messages per day.</p>
                  </div>
                  <label className="store-request-field">
                    <span>Name</span>
                    <input value={messageForm.name} onChange={(event) => updateMessageForm("name", event.target.value)} placeholder="Your name" />
                  </label>
                  <label className="store-request-field">
                    <span>Mobile number</span>
                    <input value={messageForm.phone} onChange={(event) => updateMessageForm("phone", event.target.value)} placeholder="Your mobile number" />
                  </label>
                  <label className="store-request-field">
                    <span>Email optional</span>
                    <input type="email" value={messageForm.email} onChange={(event) => updateMessageForm("email", event.target.value)} placeholder="name@example.com" />
                  </label>
                  <label className="store-request-field">
                    <span>Message</span>
                    <textarea value={messageForm.message} onChange={(event) => updateMessageForm("message", event.target.value)} placeholder="Ask about size, timing, availability, or pickup." />
                  </label>
                  {messageError ? <p className="store-request-error">{messageError}</p> : null}
                  {messageStatus ? <p className="store-request-success-note">{messageStatus}</p> : null}
                  <button className="store-request-submit" type="submit" disabled={isSendingMessage}>
                    <Send size={17} aria-hidden="true" />
                    {isSendingMessage ? "Sending..." : "Send message"}
                  </button>
                </form>
              </section>
            </div>
          ) : null}

          {isCartOpen ? (
            <div className="store-request-overlay" role="dialog" aria-modal="true" aria-labelledby="cart-title">
              <section className="store-request-panel store-cart-panel">
                <button className="store-request-panel__close" type="button" onClick={() => setIsCartOpen(false)} aria-label="Close cart">
                  <X size={18} aria-hidden="true" />
                </button>

                {checkoutStatus ? (
                  <div className="store-request-success">
                    <CheckCircle2 size={42} aria-hidden="true" />
                    <h2 id="cart-title">Order confirmed</h2>
                    <p>
                      Order #{String(checkoutStatus.order._id).slice(-6).toUpperCase()} has been sent to {store.name}. The store
                      will contact you to confirm cash payment and fulfillment.
                    </p>
                    <strong>{formatPrice(checkoutStatus.order.subtotal)}</strong>
                    <button className="store-request-secondary" type="button" onClick={() => { setCheckoutStatus(null); setIsCartOpen(false); }}>
                      Continue shopping
                    </button>
                  </div>
                ) : (
                  <form className="store-request-form" onSubmit={submitCheckout} noValidate>
                    <div className="store-request-panel__header">
                      <span>Cart</span>
                      <h2 id="cart-title">Your order</h2>
                      <p>Manual cash order placement only. No card details are collected.</p>
                    </div>

                    {hydratedCart.length === 0 ? (
                      <p className="store-view-products__empty">Your cart is empty. Add a product before checkout.</p>
                    ) : (
                      <div className="store-cart-list">
                        {hydratedCart.map((item) => (
                          <article className="store-cart-item" key={item.product._id}>
                            <div>
                              <strong>{item.product.name}</strong>
                              <span>{formatPrice(item.product.price)} · {item.product.stock} available</span>
                            </div>
                            <div className="store-cart-item__actions">
                              <button type="button" onClick={() => setCartQuantity(item.product._id, item.quantity - 1)} aria-label={`Decrease ${item.product.name}`}>
                                <Minus size={15} aria-hidden="true" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={Math.max(1, item.product.stock || 1)}
                                value={item.quantity}
                                onChange={(event) => setCartQuantity(item.product._id, event.target.value)}
                                aria-label={`${item.product.name} quantity`}
                              />
                              <button type="button" onClick={() => setCartQuantity(item.product._id, item.quantity + 1)} aria-label={`Increase ${item.product.name}`}>
                                <Plus size={15} aria-hidden="true" />
                              </button>
                              <button type="button" onClick={() => removeCartItem(item.product._id)} aria-label={`Remove ${item.product.name}`}>
                                <Trash2 size={15} aria-hidden="true" />
                              </button>
                            </div>
                          </article>
                        ))}
                        <div className="store-cart-total">
                          <span>Total</span>
                          <strong>{formatPrice(cartSubtotal)}</strong>
                        </div>
                      </div>
                    )}

                    <label className="store-request-field">
                      <span>Name</span>
                      <input
                        value={checkoutForm.name}
                        onChange={(event) => updateCheckoutForm("name", event.target.value)}
                        placeholder="Customer name"
                      />
                    </label>
                    <label className="store-request-field">
                      <span>Mobile number</span>
                      <input
                        value={checkoutForm.phone}
                        onChange={(event) => updateCheckoutForm("phone", event.target.value)}
                        placeholder="Customer mobile number"
                      />
                    </label>
                    <label className="store-request-field">
                      <span>Delivery address</span>
                      <textarea
                        value={checkoutForm.address}
                        onChange={(event) => updateCheckoutForm("address", event.target.value)}
                        placeholder="House number, street, city"
                      />
                    </label>

                    <fieldset className="store-request-options store-request-options--single">
                      <legend>Payment method</legend>
                      <label className="store-request-option">
                        <input type="radio" name="paymentMode" value="cash_on_delivery" checked readOnly />
                        <span>Cash on delivery / manual order</span>
                      </label>
                    </fieldset>

                    {checkoutError ? <p className="store-request-error">{checkoutError}</p> : null}

                    <button className="store-request-submit" type="submit" disabled={isCheckingOut || hydratedCart.length === 0}>
                      <CreditCard size={17} aria-hidden="true" />
                      {isCheckingOut ? "Placing order..." : "Place order"}
                    </button>
                  </form>
                )}
              </section>
            </div>
          ) : null}
        </main>
      ) : null}
    </div>
  );
}

export default StoreView;
