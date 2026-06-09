import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, PackageCheck, ShoppingBag } from "lucide-react";
import api from "../../services/api";
import useDocumentTitle from "../../utils/useDocumentTitle";
import { formatPrice, mongoObjectIdPattern } from "../../utils/storefront";
import "./OrderSuccess.css";

function OrderSuccess() {
  const { storeId, orderId } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const token = searchParams.get("token") || "";
  useDocumentTitle("Order successful");

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      if (!mongoObjectIdPattern.test(orderId || "") || !token) {
        setError("This order confirmation link is not available.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get(`/api/checkout/orders/${orderId}?token=${encodeURIComponent(token)}`);

        if (isMounted) {
          setOrder(response.data.data || null);
        }
      } catch (requestError) {
        if (isMounted) {
          setError("Unable to load this order confirmation.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId, token]);

  return (
    <div className="page order-success-page">
      {isLoading ? <section className="order-success-card order-success-card--loading" aria-label="Loading order" /> : null}

      {error ? (
        <section className="empty-state">
          <h1 className="surface-card__title">Order link unavailable</h1>
          <p className="empty-state__copy">{error}</p>
          <Link to={`/store/${storeId}`} className="button">
            Return to store
          </Link>
        </section>
      ) : null}

      {order ? (
        <main className="order-success-card">
          <div className="order-success-card__icon">
            <CheckCircle2 size={44} aria-hidden="true" />
          </div>
          <span>Order successful</span>
          <h1>Order confirmed</h1>
          <p>
            Order #{String(order._id).slice(-6).toUpperCase()} has been sent to the store. They will contact you to
            confirm payment and fulfillment.
          </p>

          <section className="order-success-summary" aria-label="Order summary">
            <div>
              <PackageCheck size={18} aria-hidden="true" />
              <span>Status</span>
              <strong>{order.status}</strong>
            </div>
            <div>
              <Clock size={18} aria-hidden="true" />
              <span>Payment</span>
              <strong>Cash/manual</strong>
            </div>
            <div>
              <ShoppingBag size={18} aria-hidden="true" />
              <span>Total</span>
              <strong>{formatPrice(order.subtotal)}</strong>
            </div>
          </section>

          <section className="order-success-items" aria-label="Ordered items">
            <h2>Items</h2>
            {order.items.map((item) => (
              <article key={item.productId || item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>Qty {item.quantity} · {formatPrice(item.unitPrice)}</span>
                </div>
                <strong>{formatPrice(item.total)}</strong>
              </article>
            ))}
          </section>

          <section className="order-success-customer" aria-label="Customer details">
            <h2>Delivery details</h2>
            <p>{order.customer.name}</p>
            <p>{order.customer.phone}</p>
            <p>{order.customer.address}</p>
          </section>

          <div className="order-success-actions">
            <Link to={`/store/${storeId}`}>Continue shopping</Link>
            <Link to="/map">Browse more stores</Link>
          </div>
        </main>
      ) : null}
    </div>
  );
}

export default OrderSuccess;
