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
import "./Checkout.css";

function Checkout() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState(() => getSavedCart(storeId));
  const [checkoutForm, setCheckoutForm] = useState(initialCheckoutForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  useDocumentTitle("Checkout");

  useEffect(() => {
    let isMounted = true;

    const loadCheckout = async () => {
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

  const updateCheckoutForm = (field, value) => {
    setCheckoutForm((current) => ({ ...current, [field]: value }));
    setCheckoutError("");
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
      setCheckoutError("Preview mode: vendors cannot place orders from their own store account.");
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
        paymentMode: "cash_on_delivery",
        fulfillmentMethod: "store_contact",
      });
      const order = response.data.data?.order;
      const token = response.data.data?.confirmationToken;

      setCartItems([]);
      setCheckoutForm(initialCheckoutForm);
      navigate(`/store/${storeId}/order-success/${order._id}?token=${encodeURIComponent(token || "")}`, { replace: true });
    } catch (requestError) {
      setCheckoutError(requestError.response?.data?.message || "Unable to place this order. Please try again.");
    } finally {
      setIsCheckingOut(false);
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
                  ? "This is your vendor preview. Checkout is disabled for your own store."
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
              <p>Manual cash order only. The store will contact you to confirm delivery or pickup.</p>
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

            <div className="checkout-payment-note">
              <CreditCard size={17} aria-hidden="true" />
              Cash on delivery / manual order
            </div>

            <div className="checkout-total">
              <span>Total</span>
              <strong>{formatPrice(cartSubtotal)}</strong>
            </div>

            {checkoutError ? <p className="checkout-error">{checkoutError}</p> : null}

            <button type="submit" disabled={isCheckingOut || hydratedCart.length === 0 || isOwnStoreCheckout}>
              {isOwnStoreCheckout ? "Checkout disabled in preview" : isCheckingOut ? "Placing order..." : "Place order"}
            </button>
          </form>
        </main>
      ) : null}
    </div>
  );
}

export default Checkout;
