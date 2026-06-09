import { Link } from "react-router-dom";
import useDocumentTitle from "../../utils/useDocumentTitle";
import "../InfoPage/InfoPage.css";

function NotFound() {
  useDocumentTitle("Page Not Found");

  return (
    <div className="page info-page">
      <section className="info-page__hero">
        <p className="page__eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The page you opened is not available. Start from product discovery or create your storefront.</p>
        <div className="info-page__actions">
          <Link to="/map" className="button">
            Explore stores
          </Link>
          <Link to="/" className="button--ghost">
            Go Home
          </Link>
        </div>
      </section>
    </div>
  );
}

export default NotFound;
