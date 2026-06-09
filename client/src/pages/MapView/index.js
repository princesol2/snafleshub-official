import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LocateFixed, Map as MapIcon, MapPin, Satellite, Search, X } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import api from "../../services/api";
import { useLanguage } from "../../i18n/LanguageContext";
import useDocumentTitle from "../../utils/useDocumentTitle";
import {
  getStoreId,
  getStoreInitials,
  getStoreLink,
  getStoreLocationLabel,
} from "../../utils/storeDisplay";
import { MapLoadingOverlay, ProductPreviewSkeleton } from "../../components/LoadingSkeleton";
import "./MapView.css";

const mapModes = {
  street: "street",
  satellite: "satellite",
};
const mapTileSources = {
  [mapModes.street]: {
    id: "cartoVoyager",
    tiles: [
      "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    ],
    maxzoom: 20,
  },
  [mapModes.satellite]: {
    id: "esriWorldImagery",
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    maxzoom: 19,
  },
};
const mapAttribution =
  '<a href="https://maplibre.org/" target="_blank" rel="noreferrer">MapLibre</a> | © <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a> | © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors | Tiles © Esri';
const defaultCenter = [76.7794, 30.7333];

function createMapStyle(mode) {
  const tileSource = mapTileSources[mode] || mapTileSources[mapModes.street];

  return {
    version: 8,
    sources: {
      [tileSource.id]: {
        type: "raster",
        tiles: tileSource.tiles,
        tileSize: 256,
        minzoom: 0,
        maxzoom: tileSource.maxzoom,
      },
    },
    layers: [
      {
        id: tileSource.id,
        type: "raster",
        source: tileSource.id,
      },
    ],
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function hasValidLocation(store) {
  const lat = parseCoordinate(store?.location?.lat);
  const lng = parseCoordinate(store?.location?.lng);

  if (lat === null || lng === null || (lat === 0 && lng === 0)) {
    return false;
  }

  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function getStoreCoordinates(store) {
  if (hasValidLocation(store)) {
    return [parseCoordinate(store.location.lng), parseCoordinate(store.location.lat)];
  }

  return null;
}

function getCoordinateGroupKey(coordinates) {
  return coordinates.map((coordinate) => coordinate.toFixed(4)).join(":");
}

function getClusterOffset(clusterIndex) {
  if (clusterIndex === 0) {
    return { x: 0, y: 0 };
  }

  const pinsPerRing = 8;
  const zeroBasedIndex = clusterIndex - 1;
  const ring = Math.floor(zeroBasedIndex / pinsPerRing);
  const positionInRing = zeroBasedIndex % pinsPerRing;
  const radius = 50 + ring * 24;
  const angle = positionInRing * ((Math.PI * 2) / pinsPerRing);

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function getFitPadding(map) {
  const { clientWidth, clientHeight } = map.getContainer();
  const basePadding = Math.max(24, Math.min(80, Math.round(Math.min(clientWidth, clientHeight) * 0.12)));
  const rightPadding = clientWidth >= 900 ? Math.min(360, Math.round(clientWidth * 0.26)) : basePadding;
  const horizontalPadding = basePadding + rightPadding;

  if (horizontalPadding > clientWidth - 120) {
    const compactPadding = Math.max(20, Math.round(Math.min(clientWidth, clientHeight) * 0.08));

    return {
      top: compactPadding,
      right: compactPadding,
      bottom: compactPadding,
      left: compactPadding,
    };
  }

  return {
    top: basePadding + 28,
    right: rightPadding,
    bottom: basePadding,
    left: basePadding,
  };
}

function fitMapToStores(map, stores) {
  if (!map || stores.length === 0) {
    return;
  }

  if (stores.length === 1) {
    map.easeTo({
      center: stores[0].coordinates,
      zoom: 13,
      duration: 500,
      essential: true,
    });
    return;
  }

  const bounds = stores.reduce(
    (nextBounds, store) => nextBounds.extend(store.coordinates),
    new maplibregl.LngLatBounds(stores[0].coordinates, stores[0].coordinates)
  );

  map.fitBounds(bounds, {
    maxZoom: 13.5,
    padding: getFitPadding(map),
    duration: 600,
    essential: true,
  });
}

function getStoreProducts(store) {
  if (store?.productsPreview?.length) {
    return store.productsPreview;
  }

  if (store?.products?.length) {
    return store.products;
  }

  if (store?.productKeywords?.length) {
    return store.productKeywords.map((name) => ({ name }));
  }

  return [];
}

function getStoreStatusLabel(store, t) {
  const hours = String(store?.workingHours || "").trim();

  if (!hours) {
    return t("map.hoursNotListed");
  }

  if (/closed|close/i.test(hours)) {
    return hours;
  }

  return `${t("map.hoursListed")} · ${hours}`;
}

function ProductPreview({ products, isLoading, store, storeIndex }) {
  const { t } = useLanguage();

  if (isLoading) {
    return <ProductPreviewSkeleton />;
  }

  if (!products?.length) {
    return <p className="custom-store-card__empty">{t("map.productsEmpty")}</p>;
  }

  return (
    <div className="custom-store-card__products">
      {products.slice(0, 3).map((product, index) => (
        <article key={product._id || `${product.name}-${index}`}>
          <span>{product.name}</span>
          {product.price !== undefined ? <strong>{`${t("store.productPrice")}: ${product.price}`}</strong> : null}
          <Link to={`${getStoreLink(store, storeIndex)}#products`}>
            {t("map.viewItem")}
          </Link>
        </article>
      ))}
    </div>
  );
}

function StoreHoverCard({ store, index, products, isLoadingProducts, onClose }) {
  const { t } = useLanguage();
  const coverImage = store.coverImageUrl;
  const logoImage = store.logoUrl;

  return (
    <article className="custom-store-card">
      <button type="button" className="custom-store-card__close" onClick={onClose} aria-label={t("map.closeStoreCard")}>
        <X size={16} aria-hidden="true" />
      </button>
      <div className="custom-store-card__cover">
        {coverImage ? <img src={coverImage} alt="" /> : null}
        <div className="custom-store-card__avatar">
          {logoImage ? <img src={logoImage} alt="" /> : <span>{getStoreInitials(store)}</span>}
        </div>
      </div>
      <div className="custom-store-card__body">
        <div className="custom-store-card__meta">
          <span>{store.category || t("map.localShop")}</span>
          <span>{getStoreStatusLabel(store, t)}</span>
        </div>
        <h2>{store.name}</h2>
        <p>{store.description || t("map.defaultDescription")}</p>
        <div className="custom-store-card__details">
          <div>
            <strong>{t("map.address")}</strong>
            <span>
              <MapPin size={14} aria-hidden="true" />
              {store.address || getStoreLocationLabel(store)}
            </span>
          </div>
          {store.workingHours ? (
            <div>
              <strong>{t("map.openStatus")}</strong>
              <span>{getStoreStatusLabel(store, t)}</span>
            </div>
          ) : null}
          {store.ownerName ? (
            <div>
              <strong>{t("map.owner")}</strong>
              <span>{store.ownerName}</span>
            </div>
          ) : null}
          {store.email ? (
            <div>
              <strong>{t("map.email")}</strong>
              <span>{store.email}</span>
            </div>
          ) : null}
          <div>
            <strong>{t("map.location")}</strong>
            <span>{getStoreLocationLabel(store)}</span>
          </div>
        </div>
        <h3>{store.productMatchCount ? t("map.matchingProducts") : t("map.products")}</h3>
        <ProductPreview
          products={products || getStoreProducts(store)}
          isLoading={isLoadingProducts}
          store={store}
          storeIndex={index}
        />
        <Link to={getStoreLink(store, index)}>{t("map.viewProducts")}</Link>
      </div>
    </article>
  );
}

function StoreResultsTray({ stores, activeStoreId, query, onSelect }) {
  const { t } = useLanguage();
  const storesLabel = stores.length === 1 ? t("map.resultSingular") : t("map.resultPlural");
  const visibleStores = stores.slice(0, 6);

  return (
    <aside className="custom-map__results" aria-label={t("map.resultsAria")}>
      <div className="custom-map__results-header">
        <strong>{query.trim() ? t("map.resultsMatching") : t("map.resultsNearby")}</strong>
        <span>
          {stores.length} {storesLabel}
        </span>
      </div>
      <div className="custom-map__results-list">
        {visibleStores.map((store) => (
          <button
            key={store.mapId}
            type="button"
            className={activeStoreId === store.mapId ? "is-active" : ""}
            onClick={() => onSelect(store)}
          >
            <span>{getStoreInitials(store)}</span>
            <div>
              <strong>{store.name}</strong>
              <small>{getStoreLocationLabel(store)}</small>
            </div>
          </button>
        ))}
      </div>
      {stores.length > visibleStores.length ? (
        <p className="custom-map__results-footnote">
          {t("map.resultsShowing")} {visibleStores.length} {t("map.resultsOf")} {stores.length}
        </p>
      ) : null}
    </aside>
  );
}

function MapView() {
  const { t } = useLanguage();
  useDocumentTitle("Search Stores");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const lastFitKeyRef = useRef("");
  const [stores, setStores] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [mapNotice, setMapNotice] = useState("");
  const [activeStoreId, setActiveStoreId] = useState("");
  const [productsByStore, setProductsByStore] = useState({});
  const [loadingProductsByStore, setLoadingProductsByStore] = useState({});
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapMode, setMapMode] = useState(mapModes.street);
  const [projectedStores, setProjectedStores] = useState([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: createMapStyle(mapModes.street),
      center: defaultCenter,
      zoom: 12.2,
      minZoom: 3,
      maxZoom: 19,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: mapAttribution,
      }),
      "bottom-right"
    );
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }),
      "bottom-right"
    );
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
    const markMapReady = () => {
      map.resize();
      setIsMapReady(true);
    };

    map.once("styledata", markMapReady);
    map.once("load", markMapReady);
    map.once("error", () => {
      setMapNotice("Map tiles are temporarily unavailable. Store pins are still available.");
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady) {
      return undefined;
    }

    setIsMapReady(false);
    const markMapReady = () => {
      map.resize();
      setIsMapReady(true);
    };

    map.once("styledata", markMapReady);
    map.setStyle(createMapStyle(mapMode));

    return () => {
      map.off("styledata", markMapReady);
    };
  }, [mapMode]);

  useEffect(() => {
    let isMounted = true;
    const searchTerm = query.trim();

    const loadStores = async () => {
      try {
        setIsLoading(true);
        setError("");
        setProductsByStore({});
        const response = await api.get("/api/stores", {
          params: searchTerm ? { search: searchTerm } : {},
        });

        if (!isMounted) {
          return;
        }

        setStores(response.data.data || []);
        setActiveStoreId("");
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setStores([]);
        setActiveStoreId("");
        setError(requestError.response?.data?.message || t("map.unavailable"));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const timeout = window.setTimeout(loadStores, 220);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [query]);

  const mapStores = useMemo(() => {
    return stores
      .map((store, index) => ({
        ...store,
        mapId: getStoreId(store, index),
        mapIndex: index,
        coordinates: getStoreCoordinates(store),
      }))
      .filter((store) => store.coordinates);
  }, [stores]);
  const unpinnedStoreCount = Math.max(stores.length - mapStores.length, 0);

  const activeStore = activeStoreId ? mapStores.find((store) => store.mapId === activeStoreId) : null;
  const activeProjectedStore = activeStore
    ? projectedStores.find((store) => store.mapId === activeStore.mapId)
    : null;

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return undefined;
    }

    const updateProjectedStores = () => {
      const { clientWidth, clientHeight } = map.getContainer();
      const clusteredPins = new Map();

      setProjectedStores(
        mapStores.map((store) => {
          const point = map.project(store.coordinates);
          const clusterKey = getCoordinateGroupKey(store.coordinates);
          const clusterIndex = clusteredPins.get(clusterKey) || 0;
          const offset = getClusterOffset(clusterIndex);
          clusteredPins.set(clusterKey, clusterIndex + 1);
          const x = clamp(point.x + offset.x, 28, Math.max(clientWidth - 28, 28));
          const y = clamp(point.y + offset.y, 28, Math.max(clientHeight - 28, 28));
          const isCompact = clientWidth < 761;
          const hasRoomRight = x < clientWidth - 390;
          const hasRoomLeft = x > 390;
          const hasRoomBelow = y < clientHeight - 420;
          const placement = isCompact
            ? "bottom-sheet"
            : hasRoomRight
              ? "right"
              : hasRoomLeft
                ? "left"
                : hasRoomBelow
                  ? "below"
                  : "above";

          return {
            ...store,
            clusterIndex,
            placement,
            screenPosition: {
              x,
              y,
            },
          };
        })
      );
    };

    updateProjectedStores();
    map.on("move", updateProjectedStores);
    map.on("zoom", updateProjectedStores);
    map.on("resize", updateProjectedStores);

    return () => {
      map.off("move", updateProjectedStores);
      map.off("zoom", updateProjectedStores);
      map.off("resize", updateProjectedStores);
    };
  }, [mapStores]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady || mapStores.length === 0) {
      return;
    }

    const fitKey = `${query.trim()}::${mapStores.map((store) => store.mapId).join("|")}`;

    if (fitKey === lastFitKeyRef.current) {
      return;
    }

    lastFitKeyRef.current = fitKey;
    fitMapToStores(map, mapStores);
  }, [isMapReady, mapStores, query]);

  const loadProducts = async (store) => {
    if (!store || productsByStore[store.mapId] || loadingProductsByStore[store.mapId]) {
      return;
    }

    setLoadingProductsByStore((current) => ({ ...current, [store.mapId]: true }));

    try {
      const response = await api.get(`/api/stores/${store._id}/products`);
      setProductsByStore((current) => ({ ...current, [store.mapId]: response.data.data || [] }));
    } catch (requestError) {
      setProductsByStore((current) => ({ ...current, [store.mapId]: [] }));
    } finally {
      setLoadingProductsByStore((current) => ({ ...current, [store.mapId]: false }));
    }
  };

  const activateStore = (store) => {
    setActiveStoreId(store.mapId);
    loadProducts(store);

    if (mapRef.current && isMapReady) {
      mapRef.current.easeTo({
        center: store.coordinates,
        zoom: Math.max(mapRef.current.getZoom(), 13),
        duration: 650,
        essential: true,
      });
    }
  };

  const resetMapView = () => {
    if (!mapRef.current || !isMapReady) {
      return;
    }

    if (mapStores.length > 0) {
      fitMapToStores(mapRef.current, mapStores);
      return;
    }

    mapRef.current.easeTo({
      center: defaultCenter,
      zoom: 12.2,
      duration: 500,
      essential: true,
    });
  };

  return (
    <div className="custom-map-page">
      <section className="custom-map__topbar" aria-label="Map search controls">
        <label className="custom-map__search">
          <Search size={20} aria-hidden="true" />
          <input
            type="search"
            aria-label={t("map.searchAria")}
            placeholder={t("map.searchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label={t("map.clearSearch")}>
              <X size={18} aria-hidden="true" />
            </button>
          ) : null}
        </label>
        <div className="custom-map__toolbar">
          <div className="custom-map__mode" role="group" aria-label={t("map.modeLabel")}>
            <button
              type="button"
              className={mapMode === mapModes.street ? "is-active" : ""}
              onClick={() => setMapMode(mapModes.street)}
              aria-pressed={mapMode === mapModes.street}
            >
              <MapIcon size={16} aria-hidden="true" />
              {t("map.street")}
            </button>
            <button
              type="button"
              className={mapMode === mapModes.satellite ? "is-active" : ""}
              onClick={() => setMapMode(mapModes.satellite)}
              aria-pressed={mapMode === mapModes.satellite}
            >
              <Satellite size={16} aria-hidden="true" />
              {t("map.satellite")}
            </button>
          </div>
          <button type="button" className="custom-map__reset" onClick={resetMapView}>
            <LocateFixed size={16} aria-hidden="true" />
            {t("map.resetView")}
          </button>
        </div>
      </section>

      {isLoading ? <p className="custom-map__status">{t("map.loading")}</p> : null}
      {error ? <p className="custom-map__notice">{error}</p> : null}
      {mapNotice ? <p className="custom-map__notice custom-map__notice--map">{mapNotice}</p> : null}

      <section className="custom-map">
        <div className="custom-map__surface">
          <div ref={mapContainerRef} className="custom-map__canvas" aria-label={t("map.interactiveMap")} />
          {isLoading || !isMapReady ? <MapLoadingOverlay /> : null}

          <aside className="custom-map__insight" aria-live="polite">
            <span>{t("map.discoveryStatus")}</span>
            <strong>
              {isLoading
                ? t("map.discoveryLoading")
                : `${mapStores.length} ${mapStores.length === 1 ? t("map.resultSingular") : t("map.resultPlural")} ${t("map.mapReady")}`}
            </strong>
            <p>{query.trim() ? t("map.searchingReach") : t("map.discoveryHint")}</p>
            {!isLoading && unpinnedStoreCount > 0 ? (
              <small>
                {unpinnedStoreCount} {unpinnedStoreCount === 1 ? t("map.unpinnedSingular") : t("map.unpinnedPlural")}
              </small>
            ) : null}
          </aside>

          {projectedStores.length > 0 ? (
            projectedStores.map((store) => (
              <button
                key={store.mapId}
                type="button"
                className={`custom-map-pin ${activeStoreId === store.mapId ? "is-active" : ""}`}
                style={{ left: `${store.screenPosition.x}px`, top: `${store.screenPosition.y}px` }}
                onClick={() => activateStore(store)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    activateStore(store);
                  }
                }}
                aria-label={`${t("map.openStoreCard")} ${store.name}`}
              >
                <span>{getStoreInitials(store)}</span>
              </button>
            ))
          ) : !isLoading && !error ? (
            <div className="custom-map__empty">
              <h2>{t("map.noStoresTitle")}</h2>
              <p>{t("map.noStoresCopy")}</p>
            </div>
          ) : null}

          {mapStores.length > 0 && !activeStoreId ? (
            <StoreResultsTray
              stores={mapStores}
              activeStoreId={activeStoreId}
              query={query}
              onSelect={activateStore}
            />
          ) : null}

          {activeProjectedStore ? (
            <div
              className={`custom-map__hover custom-map__hover--${activeProjectedStore.placement}`}
              style={{
                left: `${activeProjectedStore.screenPosition.x}px`,
                top: `${activeProjectedStore.screenPosition.y}px`,
              }}
            >
              <StoreHoverCard
                store={activeProjectedStore}
                index={activeProjectedStore.mapIndex}
                products={productsByStore[activeProjectedStore.mapId]}
                isLoadingProducts={loadingProductsByStore[activeProjectedStore.mapId]}
                onClose={() => setActiveStoreId("")}
              />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default MapView;
