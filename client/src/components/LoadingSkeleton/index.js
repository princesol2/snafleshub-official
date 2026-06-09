function SkeletonBlock({ className = "", children }) {
  return <div className={`skeleton-block ${className}`.trim()}>{children}</div>;
}

export function RouteSkeleton({ label = "Loading page" }) {
  return (
    <div className="route-loading" aria-live="polite" aria-busy="true">
      <section className="route-loading__panel" aria-label={label}>
        <SkeletonBlock className="route-loading__eyebrow" />
        <SkeletonBlock className="route-loading__title" />
        <SkeletonBlock className="route-loading__copy" />
        <div className="route-loading__grid">
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      </section>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <section className="vendor-score dashboard-skeleton" aria-live="polite" aria-busy="true">
      <div className="vendor-score__header">
        <div className="dashboard-skeleton__header-copy">
          <SkeletonBlock className="skeleton-line skeleton-line--xs" />
          <SkeletonBlock className="skeleton-line skeleton-line--title" />
          <SkeletonBlock className="skeleton-line skeleton-line--md" />
        </div>
        <div className="dashboard-skeleton__actions">
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      </div>
      <div className="vendor-score__cards">
        {[0, 1, 2, 3].map((item) => (
          <article key={item}>
            <SkeletonBlock className="skeleton-line skeleton-line--number" />
            <SkeletonBlock className="skeleton-line skeleton-line--sm" />
          </article>
        ))}
      </div>
      <div className="vendor-score__tools">
        {[0, 1, 2].map((item) => (
          <article key={item}>
            <SkeletonBlock className="skeleton-line skeleton-line--xs" />
            <SkeletonBlock className="skeleton-line skeleton-line--md" />
            <SkeletonBlock className="skeleton-line skeleton-line--lg" />
          </article>
        ))}
      </div>
    </section>
  );
}

export function StoreViewSkeleton() {
  return (
    <main className="public-store public-store--loading" aria-live="polite" aria-busy="true">
      <section className="public-store__hero">
        <SkeletonBlock className="public-store__cover" />
        <div className="public-store__profile">
          <SkeletonBlock className="public-store__avatar" />
          <div className="public-store__identity">
            <SkeletonBlock className="skeleton-line skeleton-line--xs" />
            <SkeletonBlock className="skeleton-line skeleton-line--title" />
            <SkeletonBlock className="skeleton-line skeleton-line--sm" />
          </div>
          <SkeletonBlock className="public-store__primary" />
        </div>
      </section>
      <section className="public-store__summary">
        <div>
          <SkeletonBlock className="skeleton-line skeleton-line--lg" />
          <SkeletonBlock className="skeleton-line skeleton-line--md" />
          <SkeletonBlock className="skeleton-line skeleton-line--sm" />
        </div>
        <aside className="public-store__catalog-card">
          <SkeletonBlock className="skeleton-line skeleton-line--sm" />
          <SkeletonBlock className="skeleton-line skeleton-line--number" />
          <SkeletonBlock className="skeleton-line skeleton-line--md" />
        </aside>
      </section>
      <section className="store-view-products">
        <div className="store-view-products__header">
          <div>
            <SkeletonBlock className="skeleton-line skeleton-line--xs" />
            <SkeletonBlock className="skeleton-line skeleton-line--md" />
            <SkeletonBlock className="skeleton-line skeleton-line--lg" />
          </div>
          <SkeletonBlock className="skeleton-pill" />
        </div>
        <div className="store-product-grid">
          {[0, 1, 2].map((item) => (
            <article key={item} className="store-product-card">
              <SkeletonBlock className="store-product-card__visual" />
              <div className="store-product-card__content">
                <SkeletonBlock className="skeleton-line skeleton-line--md" />
                <SkeletonBlock className="skeleton-line skeleton-line--lg" />
                <SkeletonBlock className="skeleton-line skeleton-line--sm" />
              </div>
              <SkeletonBlock className="store-product-card__buy" />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function ProductPreviewSkeleton() {
  return (
    <div className="custom-store-card__products custom-store-card__products--loading" aria-live="polite" aria-busy="true">
      {[0, 1, 2].map((item) => (
        <article key={item}>
          <SkeletonBlock className="skeleton-line skeleton-line--md" />
          <SkeletonBlock className="skeleton-line skeleton-line--sm" />
        </article>
      ))}
    </div>
  );
}

export function MapLoadingOverlay() {
  return (
    <div className="custom-map__loading" aria-live="polite" aria-busy="true">
      <SkeletonBlock className="custom-map__loading-map" />
      <aside className="custom-map__loading-tray">
        <SkeletonBlock className="skeleton-line skeleton-line--xs" />
        <SkeletonBlock className="skeleton-line skeleton-line--md" />
        {[0, 1, 2].map((item) => (
          <div key={item} className="custom-map__loading-result">
            <SkeletonBlock className="skeleton-avatar" />
            <div>
              <SkeletonBlock className="skeleton-line skeleton-line--md" />
              <SkeletonBlock className="skeleton-line skeleton-line--sm" />
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}
