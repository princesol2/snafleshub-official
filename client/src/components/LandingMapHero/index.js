import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { getStoreId, getStoreLink, getStoreLocationLabel } from "../../utils/storeDisplay";
import "./LandingMapHero.css";

const pinPositions = [
  { left: "22%", top: "34%" },
  { left: "62%", top: "24%" },
  { left: "74%", top: "58%" },
  { left: "38%", top: "68%" },
  { left: "48%", top: "42%" },
];

function LandingMapHero() {
  const [stores, setStores] = useState([]);
  const [activeStoreId, setActiveStoreId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadStores = async () => {
      try {
        const response = await api.get("/api/stores");
        const liveStores = response.data.data || [];

        if (!isMounted) {
          return;
        }

        if (liveStores.length > 0) {
          setStores(liveStores.slice(0, 5));
          setActiveStoreId(getStoreId(liveStores[0]));
        }
      } catch (error) {
        if (isMounted) {
          setStores([]);
          setActiveStoreId("");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStores();

    return () => {
      isMounted = false;
    };
  }, []);

  const mapStores = useMemo(
    () =>
      stores.slice(0, 5).map((store, index) => ({
        ...store,
        id: getStoreId(store, index),
        position: pinPositions[index % pinPositions.length],
      })),
    [stores]
  );

  const activeStore = mapStores.find((store) => store.id === activeStoreId) || mapStores[0];

  const activateStore = (storeId) => {
    setActiveStoreId(storeId);
  };

  return (
    <section id="home" className="landing-map-hero" aria-labelledby="landing-map-hero-title">
      <div className="landing-map-hero__intro">
        <p className="landing-map-hero__eyebrow">Map-first product discovery</p>
        <h1 id="landing-map-hero-title" className="landing-map-hero__title">
          Find products on a map. Reach the store directly.
        </h1>
        <p className="landing-map-hero__copy">
          SnaflesHub helps customers search what they need, open nearby storefronts, and contact stores without
          a marketplace account or a long checkout.
        </p>
        <div className="landing-map-hero__actions">
          <Link to="/vendor/login" className="landing-map-hero__primary">
            Storefront Login
          </Link>
          <Link to="/map" className="landing-map-hero__secondary">
            Explore stores
          </Link>
        </div>
      </div>

      <div className="landing-map-hero__map-shell">
        <div className="landing-map-hero__map" aria-label="Store discovery preview">
          <div className="landing-map-hero__roads" aria-hidden="true" />
          <div className="landing-map-hero__district landing-map-hero__district--one" aria-hidden="true" />
          <div className="landing-map-hero__district landing-map-hero__district--two" aria-hidden="true" />
          <div className="landing-map-hero__district landing-map-hero__district--three" aria-hidden="true" />

          {mapStores.map((store, index) => (
            <button
              key={store.id}
              type="button"
              className={`landing-map-hero__pin ${activeStoreId === store.id ? "is-active" : ""}`}
              style={store.position}
              onClick={() => activateStore(store.id)}
              onFocus={() => activateStore(store.id)}
              aria-label={`Preview ${store.name}`}
            >
              <span>{index + 1}</span>
            </button>
          ))}

          <article className="landing-map-hero__active-card">
            <span className="landing-map-hero__live-pill">Live discovery</span>
            <h2>{activeStore?.name || "Shop discovery"}</h2>
            <p>{activeStore?.description || "Stores appear here with searchable products and a direct storefront."}</p>
            <div className="landing-map-hero__meta">
              <span>{activeStore?.category || "Store"}</span>
              <span>{activeStore ? getStoreLocationLabel(activeStore) : "Map ready"}</span>
            </div>
          </article>
        </div>

        <div className="landing-map-hero__store-rail" aria-label="Store preview cards">
          {mapStores.map((store, index) => (
            <article
              key={store.id}
              className={`landing-map-hero__store-card ${activeStoreId === store.id ? "is-active" : ""}`}
              tabIndex={0}
              onMouseEnter={() => activateStore(store.id)}
              onFocus={() => activateStore(store.id)}
              onClick={() => activateStore(store.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  activateStore(store.id);
                }
              }}
            >
              <div className="landing-map-hero__store-topline">
                <span>{store.category || "Store"}</span>
                <span>{store.distance || "Map pin"}</span>
              </div>
              <h3>{store.name}</h3>
              <div className="landing-map-hero__store-details">
                <p>{store.description || "This store is building a searchable storefront on SnaflesHub."}</p>
                <span>{getStoreLocationLabel(store)}</span>
                <Link to={getStoreLink(store, index)}>View store</Link>
              </div>
            </article>
          ))}
        </div>

        {isLoading ? <p className="landing-map-hero__loading">Checking live stores...</p> : null}
      </div>
    </section>
  );
}

export default LandingMapHero;
