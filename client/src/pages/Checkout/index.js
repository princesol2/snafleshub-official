import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import api from "../../services/api";
import useDocumentTitle from "../../utils/useDocumentTitle";
import { isValidPhone } from "../../utils/validation";
import { getVendor } from "../../services/session";
import {
  formatPrice,
  getCartProduct,
  getSavedCart,
  initialCheckoutForm,
  isVendorStoreOwner,
  mongoObjectIdPattern,
  saveCart,
} from "../../utils/storefront";
import { createDemoOrder, demoOrderId, demoOrderToken, demoProducts, demoStore, isDemoStoreId, saveDemoOrder } from "../../utils/demoStore";
import "./Checkout.css";

const razorpayCheckoutScript = "https://checkout.razorpay.com/v1/checkout.js";
const manualUpiPaymentMode = "manual_upi";

function loadRazorpayCheckout() {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const existingScript = document.querySelector(`script[src="${razorpayCheckoutScript}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = razorpayCheckoutScript;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getUpiReference(store) {
  return store?.upiQrReference || `SnaflesHub | ${store?.name || "Store"}`;
}

function getUpiIntentUrl({ store, amount }) {
  if (!store?.upiId) {
    return "";
  }

  const params = new URLSearchParams({
    pa: store.upiId,
    pn: store.name || "SnaflesHub store",
    am: Number(amount || 0).toFixed(2),
    cu: "INR",
    tn: getUpiReference(store),
  });

  return `upi://pay?${params.toString()}`;
}

function Checkout() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState(() => getSavedCart(storeId));
  const [checkoutForm, setCheckoutForm] = useState(initialCheckoutForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [pendingPaymentMessage, setPendingPaymentMessage] = useState("");
  const [error, setError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  useDocumentTitle("Checkout");

  useEffect(() => {
    let isMounted = true;

    const loadCheckout = async () => {
      if (isDemoStoreId(storeId)) {
        setStore(demoStore);
        setProducts(demoProducts);
        setError("");
        setIsLoading(false);
        return;
      }

      if (!mongoObjectIdPattern.test(storeId || "")) {
        setError("This checkout link is not available.");
        setIsLoading(false);
        return;
      }

      try {
        const [storeResponse, productsResponse] = await Promise.all([
          api.get(`/api/stores/${storeId}`),
          api.get(`/api/stores/${storeId}/products`),
        ]);

        if (!isMounted) {
          return;
        }

        setStore(storeResponse.data.data || null);
        setProducts(productsResponse.data.data || []);
      } catch (requestError) {
        if (isMounted) {
          setError("Unable to load checkout right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCheckout();

    return () => {
      isMounted = false;
    };
  }, [storeId]);

  useEffect(() => {
    saveCart(storeId, cartItems);
  }, [cartItems, storeId]);

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
  const cartSubtotal = hydratedCart.reduce((sum, item) => sum + Number(item.product.price || 0) * Number(item.quantity || 0), 0);
  const isOwnStoreCheckout = isVendorStoreOwner(store, getVendor());
  const canUseManualUpi = Boolean(store?.upiId || store?.upiQrUrl);
  const upiIntentUrl = getUpiIntentUrl({ store, amount: cartSubtotal });

  const updateCheckoutForm = (field, value) => {
    setCheckoutForm((current) => ({ ...current, [field]: value }));
    setCheckoutError("");
    setPendingPaymentMessage("");
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

    if (isOwnStoreCheckout) {
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

    if (checkoutForm.paymentMode === manualUpiPaymentMode) {
      if (!canUseManualUpi) {
        setCheckoutError("This store has not added UPI payment details yet. Choose cash/manual payment.");
        return;
      }

      if (checkoutForm.upiReference.trim().length < 6) {
        setCheckoutError("Pay the store by UPI, then enter the transaction reference before placing the order.");
        return;
      }
    }

    const unavailableItem = hydratedCart.find((item) => Number(item.product.stock || 0) < Number(item.quantity || 1));

    if (unavailableItem) {
      setCheckoutError(`${unavailableItem.product.name} does not have enough stock.`);
      return;
    }

    try {
      setIsCheckingOut(true);
      setPendingPaymentMessage("");

      if (isDemoStoreId(storeId)) {
        const demoOrder = createDemoOrder(
          hydratedCart.map((item) => ({ productId: item.product._id, quantity: item.quantity })),
          {
            name: checkoutForm.name,
            phone: checkoutForm.phone,
            address: checkoutForm.address,
          },
          checkoutForm.paymentMode
        );
        saveDemoOrder(demoOrder);
        setCartItems([]);
        setCheckoutForm(initialCheckoutForm);
        navigate(`/store/${storeId}/order-success/${demoOrderId}?token=${encodeURIComponent(demoOrderToken)}`, { replace: true });
        return;
      }

      const response = await api.post("/api/checkout", {
        storeId,
        items: hydratedCart.map((item) => ({
          productId: item.product._id,
          quantity: Number(item.quantity || 1),
        })),
        customer: {
          name: checkoutForm.name,
          phone: checkoutForm.phone,
          address: checkoutForm.address,
        },
        paymentMode: checkoutForm.paymentMode,
        paymentDetails: {
          upiReference: checkoutForm.upiReference,
          upiScreenshotUrl: checkoutForm.upiScreenshotUrl,
        },
        fulfillmentMethod: "store_contact",
      });
      const order = response.data.data?.order;
      const token = response.data.data?.confirmationToken;

      if (response.data.data?.paymentRequired) {
        const razorpayOptions = response.data.data.razorpay;
        const isRazorpayReady = await loadRazorpayCheckout();

        if (!isRazorpayReady || !window.Razorpay) {
          await api.post("/api/checkout/payments/failed", {
            orderId: order?._id,
            reason: "checkout_script_failed",
          });
          setCheckoutError("Online payment could not load. Please choose cash payment or try again.");
          return;
        }

        setPendingPaymentMessage("Complete the secure Razorpay payment window to confirm your order.");

        await new Promise((resolve, reject) => {
          const checkout = new window.Razorpay({
            key: razorpayOptions.keyId,
            amount: razorpayOptions.amount,
            currency: razorpayOptions.currency,
            name: razorpayOptions.name,
            description: razorpayOptions.description,
            order_id: razorpayOptions.orderId,
            prefill: razorpayOptions.prefill,
            theme: {
              color: "#0f8f98",
            },
            handler: async (paymentResponse) => {
              try {
                const verificationResponse = await api.post("/api/checkout/payments/verify", {
                  orderId: order._id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                });
                resolve(verificationResponse.data.data);
              } catch (verificationError) {
                reject(verificationError);
              }
            },
            modal: {
              ondismiss: async () => {
                try {
                  await api.post("/api/checkout/payments/failed", {
                    orderId: order?._id,
                    reason: "checkout_dismissed",
                  });
                } catch (closeError) {
                  // The next checkout attempt will reconcile with the server state.
                }
                reject(new Error("Payment window was closed before payment finished."));
              },
            },
          });

          checkout.on("payment.failed", async (failureResponse) => {
            try {
              await api.post("/api/checkout/payments/failed", {
                orderId: order?._id,
                reason: failureResponse?.error?.reason || failureResponse?.error?.description || "payment_failed",
              });
            } catch (closeError) {
              // The visible error below is enough for the customer; server errors are logged by the API layer.
            }
            reject(new Error(failureResponse?.error?.description || "Payment failed. Please try again."));
          });

          checkout.open();
        }).then((verifiedData) => {
          const verifiedOrder = verifiedData?.order;
          const verifiedToken = verifiedData?.confirmationToken;

          setCartItems([]);
          setCheckoutForm(initialCheckoutForm);
          navigate(`/store/${storeId}/order-success/${verifiedOrder._id}?token=${encodeURIComponent(verifiedToken || "")}`, { replace: true });
        });

        return;
      }

      setCartItems([]);
      setCheckoutForm(initialCheckoutForm);
      navigate(`/store/${storeId}/order-success/${order._id}?token=${encodeURIComponent(token || "")}`, { replace: true });
    } catch (requestError) {
      setCheckoutError(requestError.response?.data?.message || requestError.message || "Unable to place this order. Please try again.");
    } finally {
      setIsCheckingOut(false);
      setPendingPaymentMessage("");
    }
  };

  return (
    <div className="page checkout-page">
      <Link to={`/store/${storeId}`} className="product-flow-back">
        <ArrowLeft size={17} aria-hidden="true" />
        Back to store
      </Link>

      {isLoading ? <section className="checkout-shell checkout-shell--loading" aria-label="Loading checkout" /> : null}

      {error ? (
        <section className="empty-state">
          <h1 className="surface-card__title">Checkout unavailable</h1>
          <p className="empty-state__copy">{error}</p>
          <Link to="/map" className="button">
            Browse stores
          </Link>
        </section>
      ) : null}

      {!isLoading && !error ? (
        <main className="checkout-shell">
          <section className="checkout-order">
            <div className="checkout-section-header">
              <span>Order page</span>
              <h1>Review your order</h1>
              <p>
                {isOwnStoreCheckout
                  ? "This is your owner preview. Checkout is disabled for your own storefront."
                  : store?.name
                    ? `Ordering from ${store.name}`
                    : "Review items before placing your order."}
              </p>
            </div>

            {isOwnStoreCheckout ? (
              <div className="checkout-owner-notice">
                <strong>Vendor preview mode</strong>
                <p>Use this page to inspect the customer checkout experience. To test a real order, log out or use a separate customer browser session.</p>
              </div>
            ) : null}

            {hydratedCart.length === 0 ? (
              <div className="checkout-empty">
                <ShoppingBag size={34} aria-hidden="true" />
                <h2>Your cart is empty</h2>
                <p>Add a product from the store catalog before checkout.</p>
                <Link to={`/store/${storeId}`}>Browse products</Link>
              </div>
            ) : (
              <div className="checkout-items">
                {hydratedCart.map((item) => (
                  <article className="checkout-item" key={item.product._id}>
                    <div>
                      <strong>{item.product.name}</strong>
                      <span>{formatPrice(item.product.price)} · {item.product.stock} available</span>
                    </div>
                    <div className="checkout-item__actions">
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
              </div>
            )}
          </section>

          <form className="checkout-form" onSubmit={submitCheckout} noValidate>
            <div className="checkout-section-header">
              <span>Customer details</span>
              <h2>Place order</h2>
              <p>Choose cash/manual payment or complete secure online payment before the order is confirmed.</p>
            </div>

            <label>
              <span>Name</span>
              <input value={checkoutForm.name} onChange={(event) => updateCheckoutForm("name", event.target.value)} placeholder="Customer name" />
            </label>
            <label>
              <span>Mobile number</span>
              <input value={checkoutForm.phone} onChange={(event) => updateCheckoutForm("phone", event.target.value)} placeholder="Customer mobile number" />
            </label>
            <label>
              <span>Delivery address</span>
              <textarea value={checkoutForm.address} onChange={(event) => updateCheckoutForm("address", event.target.value)} placeholder="House number, street, city" />
            </label>

            <div className="checkout-payment-options" role="radiogroup" aria-label="Payment option">
              <label className={checkoutForm.paymentMode === "cash_on_delivery" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="paymentMode"
                  value="cash_on_delivery"
                  checked={checkoutForm.paymentMode === "cash_on_delivery"}
                  onChange={(event) => updateCheckoutForm("paymentMode", event.target.value)}
                />
                <span>
                  <strong>Cash / manual payment</strong>
                  Pay when the store confirms pickup or delivery.
                </span>
              </label>
              {canUseManualUpi ? (
                <label className={checkoutForm.paymentMode === manualUpiPaymentMode ? "is-selected" : ""}>
                  <input
                    type="radio"
                    name="paymentMode"
                    value={manualUpiPaymentMode}
                    checked={checkoutForm.paymentMode === manualUpiPaymentMode}
                    onChange={(event) => updateCheckoutForm("paymentMode", event.target.value)}
                  />
                  <span>
                    <strong>Pay directly by UPI</strong>
                    Send payment to the store, then submit the UPI reference for vendor confirmation.
                  </span>
                </label>
              ) : null}
              <label className={checkoutForm.paymentMode === "online" ? "is-selected" : ""}>
                <input
                  type="radio"
                  name="paymentMode"
                  value="online"
                  checked={checkoutForm.paymentMode === "online"}
                  onChange={(event) => updateCheckoutForm("paymentMode", event.target.value)}
                />
                <span>
                  <strong>Pay online</strong>
                  Complete payment securely through Razorpay.
                </span>
              </label>
            </div>

            <div className="checkout-payment-note">
              <CreditCard size={17} aria-hidden="true" />
              {checkoutForm.paymentMode === "online"
                ? "Online payment confirms the order after verification."
                : checkoutForm.paymentMode === manualUpiPaymentMode
                  ? "UPI payment is reviewed by the vendor before fulfillment."
                  : "Cash on delivery / manual order"}
            </div>
            {checkoutForm.paymentMode === manualUpiPaymentMode ? (
              <div className="checkout-upi-scanner">
                <div>
                  <span>Direct UPI payment</span>
                  <strong>{store.upiId ? `Pay ${store.upiId}` : `Scan to pay ${store.name}`}</strong>
                  <p>Pay exactly {formatPrice(cartSubtotal)} and use this note: {getUpiReference(store)}</p>
                  {upiIntentUrl ? (
                    <a href={upiIntentUrl} className="checkout-upi-scanner__link">
                      Open UPI app
                    </a>
                  ) : null}
                </div>
                {store?.upiQrUrl ? <img src={store.upiQrUrl} alt={`${store.name} UPI scanner`} /> : null}
              </div>
            ) : null}

            {checkoutForm.paymentMode === manualUpiPaymentMode ? (
              <div className="checkout-upi-fields">
                <label>
                  <span>UPI transaction/reference ID</span>
                  <input
                    value={checkoutForm.upiReference}
                    onChange={(event) => updateCheckoutForm("upiReference", event.target.value)}
                    placeholder="Example: UPI Ref No. 412345678901"
                  />
                </label>
                <label>
                  <span>Screenshot URL optional</span>
                  <input
                    value={checkoutForm.upiScreenshotUrl}
                    onChange={(event) => updateCheckoutForm("upiScreenshotUrl", event.target.value)}
                    placeholder="Paste payment screenshot link if available"
                  />
                </label>
              </div>
            ) : null}

            <div className="checkout-total">
              <span>Total</span>
              <strong>{formatPrice(cartSubtotal)}</strong>
            </div>

            {checkoutError ? <p className="checkout-error">{checkoutError}</p> : null}
            {pendingPaymentMessage ? <p className="checkout-pending">{pendingPaymentMessage}</p> : null}

            <button type="submit" disabled={isCheckingOut || hydratedCart.length === 0 || isOwnStoreCheckout}>
              {isOwnStoreCheckout
                ? "Checkout disabled in preview"
                : isCheckingOut
                  ? checkoutForm.paymentMode === "online"
                    ? "Opening secure payment..."
                    : checkoutForm.paymentMode === manualUpiPaymentMode
                      ? "Submitting UPI payment..."
                    : "Placing order..."
                  : checkoutForm.paymentMode === "online"
                    ? "Pay online"
                    : checkoutForm.paymentMode === manualUpiPaymentMode
                      ? "Submit UPI payment"
                    : "Place order"}
            </button>
          </form>
        </main>
      ) : null}
    </div>
  );
}

export default Checkout;
