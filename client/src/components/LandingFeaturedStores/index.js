import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { getStoreLink, getStoreLocationLabel } from "../../utils/storeDisplay";
import "./LandingFeaturedStores.css";

function LandingFeaturedStores() {
  const [stores, setStores] = useState([]);

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
          setStores(liveStores.slice(0, 4));
        }
      } catch (error) {
        if (isMounted) {
          setStores([]);
        }
      }
    };

    loadStores();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="featured-stores" className="landing-featured" aria-labelledby="landing-featured-title">
      <div className="landing-featured__header">
        <div>
          <p className="landing-featured__eyebrow">Live discovery</p>
          <h2 id="landing-featured-title" className="landing-featured__title">
            Stores customers can open from the map.
          </h2>
        </div>
        <Link to="/map" className="landing-featured__map-link">
          Open full map
        </Link>
      </div>

      <div className="landing-featured__grid">
        {stores.length > 0 ? stores.map((store, index) => (
          <article key={store._id || store.name} className="landing-featured__card">
            <div className="landing-featured__image" aria-hidden="true">
              <span>{store.category || "Store"}</span>
            </div>
            <div className="landing-featured__body">
              <span className="landing-featured__category">{store.category || "Store"}</span>
              <h3>{store.name}</h3>
              <p>{store.description || "This store is preparing a public storefront for discovery."}</p>
              <div className="landing-featured__footer">
                <span>{getStoreLocationLabel(store)}</span>
                <Link to={getStoreLink(store, index)}>View</Link>
              </div>
            </div>
          </article>
        )) : (
          <article className="landing-featured__card">
            <div className="landing-featured__image" aria-hidden="true">
              <span>Store</span>
            </div>
            <div className="landing-featured__body">
              <span className="landing-featured__category">Map discovery</span>
              <h3>Create the first storefront</h3>
              <p>Registered stores will appear here with a map position, public page, and product details.</p>
              <div className="landing-featured__footer">
                <span>Map ready</span>
                <Link to="/vendor/create-store">Create storefront</Link>
              </div>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

export default LandingFeaturedStores;
