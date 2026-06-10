import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Minus, Plus, ShoppingCart } from "lucide-react";
import api from "../../services/api";
import useDocumentTitle from "../../utils/useDocumentTitle";
import { getVendor } from "../../services/session";
import { addProductToCart, formatPrice, getProductInitials, isVendorStoreOwner, mongoObjectIdPattern } from "../../utils/storefront";
import "./ProductDetail.css";

function ProductDetail() {
  const { storeId, productId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useDocumentTitle(product?.name || "Product details");

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      if (!mongoObjectIdPattern.test(storeId || "") || !mongoObjectIdPattern.test(productId || "")) {
        setError("This product link is not available.");
        setIsLoading(false);
        return;
      }

      try {
        const [storeResponse, productResponse] = await Promise.all([
          api.get(`/api/stores/${storeId}`),
          api.get(`/api/products/${productId}`),
        ]);

        if (!isMounted) {
          return;
        }

        setStore(storeResponse.data.data || null);
        setProduct(productResponse.data.data || null);
      } catch (requestError) {
        if (isMounted) {
          setError("Unable to load this product right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId, storeId]);

  const maxQuantity = Math.max(1, Number(product?.stock || 1));
  const isUnavailable = !product || Number(product.stock || 0) <= 0;
  const isOwnStorePreview = isVendorStoreOwner(store, getVendor());

  const updateQuantity = (nextQuantity) => {
    setQuantity(Math.max(1, Math.min(maxQuantity, Number(nextQuantity || 1))));
  };

  const handleAddToCart = (goToCheckout = false) => {
    if (isOwnStorePreview) {
      setNotice("Preview mode: vendors cannot place orders from their own store account.");
      return;
    }

    if (isUnavailable) {
      setNotice("This product is out of stock.");
      return;
    }

    addProductToCart(storeId, product, quantity);

    if (goToCheckout) {
      navigate(`/store/${storeId}/checkout`);
      return;
    }

    setNotice(`${product.name} added to cart.`);
  };

  return (
    <div className="page product-flow-page">
      <Link to={`/store/${storeId}`} className="product-flow-back">
        <ArrowLeft size={17} aria-hidden="true" />
        Back to store
      </Link>

      {isLoading ? (
        <section className="product-detail-shell product-detail-shell--loading" aria-label="Loading product">
          <div />
          <div />
        </section>
      ) : null}

      {error ? (
        <section className="empty-state">
          <h1 className="surface-card__title">Product unavailable</h1>
          <p className="empty-state__copy">{error}</p>
          <Link to={`/store/${storeId}`} className="button">
            Return to store
          </Link>
        </section>
      ) : null}

      {product && store ? (
        <main className="product-detail-shell">
          <section className="product-detail-media">
            {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span>{getProductInitials(product.name)}</span>}
          </section>

          <section className="product-detail-info">
            <span className="product-detail-info__eyebrow">{product.categoryId?.name || store.category || "Product"}</span>
            <h1>{product.name}</h1>
            <p>{product.description || "Available from this local storefront."}</p>

            <div className="product-detail-info__meta">
              <strong>{formatPrice(product.price)}</strong>
              <span className={isUnavailable ? "is-empty" : ""}>
                <CheckCircle2 size={16} aria-hidden="true" />
                {isUnavailable ? "Out of stock" : `${product.stock} in stock`}
              </span>
            </div>

            <div className="product-detail-store">
              <span>Sold by</span>
              <Link to={`/store/${storeId}`}>{store.name}</Link>
            </div>

            {isOwnStorePreview ? (
              <p className="product-detail-notice">
                You are previewing your own product. Customer checkout is disabled while using this vendor account.
              </p>
            ) : null}

            <div className="product-detail-quantity" aria-label="Quantity">
              <button type="button" onClick={() => updateQuantity(quantity - 1)} aria-label="Decrease quantity">
                <Minus size={16} aria-hidden="true" />
              </button>
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(event) => updateQuantity(event.target.value)}
                aria-label="Quantity"
              />
              <button type="button" onClick={() => updateQuantity(quantity + 1)} aria-label="Increase quantity">
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>

            {notice ? <p className="product-detail-notice">{notice}</p> : null}

            <div className="product-detail-actions">
              <button type="button" onClick={() => handleAddToCart(false)} disabled={isUnavailable || isOwnStorePreview}>
                <ShoppingCart size={17} aria-hidden="true" />
                {isOwnStorePreview ? "Preview only" : "Add to cart"}
              </button>
              <button type="button" onClick={() => handleAddToCart(true)} disabled={isUnavailable || isOwnStorePreview}>
                {isOwnStorePreview ? "Checkout disabled" : "Pull in"}
              </button>
            </div>
          </section>
        </main>
      ) : null}
    </div>
  );
}

export default ProductDetail;
