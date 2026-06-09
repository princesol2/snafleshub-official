import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LayoutDashboard, LogOut, UserCircle } from "lucide-react";
import BrandMark from "../BrandMark";
import LanguageSwitcher from "../LanguageSwitcher";
import { useLanguage } from "../../i18n/LanguageContext";
import { clearSession, getAuthToken, getStore, getVendor } from "../../services/session";
import "./Navbar.css";

const navItems = [
  { labelKey: "nav.meet", to: "/#home" },
  { labelKey: "nav.discoveryMap", to: "/map" },
  { labelKey: "nav.ourMission", to: "/#mission" },
  { labelKey: "nav.howItWorks", to: "/#how-it-works" },
  { labelKey: "nav.aboutUs", to: "/about" },
];

const vendorNavItems = [
  { label: "Dashboard", to: "/vendor/dashboard" },
  { label: "Browse stores", to: "/map" },
];

function Navbar() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const authToken = getAuthToken();
  const vendor = getVendor();
  const store = getStore();
  const isAuthenticated = Boolean(authToken && vendor?._id);
  const activeNavItems = isAuthenticated ? vendorNavItems : navItems;
  const profileLabel = store?.name || vendor?.ownerName || "Vendor";
  const brandTarget = isAuthenticated ? "/vendor/dashboard" : "/";

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLoginClick = () => {
    closeMenu();
    navigate("/vendor/login");
  };

  const handleLogout = () => {
    clearSession();
    closeMenu();
    navigate("/", { replace: true });
  };

  const getLinkClassName = (item) => {
    const [path, hash] = item.to.split("#");
    const isHome =
      item.to === "/#home" &&
      location.pathname === "/" &&
      !location.hash;
    const isHashMatch = hash && location.pathname === "/" && location.hash === `#${hash}`;
    const isPathMatch = !hash && location.pathname === path;

    return `navbar__link ${isHome || isHashMatch || isPathMatch ? "is-active" : ""}`;
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__brand-wrap">
          <Link to={brandTarget} className="navbar__brand" onClick={closeMenu}>
            <BrandMark />
            <span>SnaflesHub</span>
          </Link>
          <span className="navbar__tagline">{isAuthenticated ? "Vendor workspace" : t("nav.tagline")}</span>
        </div>

        <nav className={`navbar__links ${isMenuOpen ? "is-open" : ""}`} aria-label="Primary">
          {activeNavItems.map((item) => (
            <Link key={item.labelKey || item.label} to={item.to} className={getLinkClassName(item)} onClick={closeMenu}>
              {item.label || t(item.labelKey)}
            </Link>
          ))}

          <div className="navbar__mobile-actions">
            {isAuthenticated ? (
              <>
                <Link to="/vendor/dashboard" className="navbar__profile" onClick={closeMenu}>
                  <UserCircle size={18} />
                  <span>{profileLabel}</span>
                </Link>
                <button type="button" className="navbar__logout" onClick={handleLogout}>
                  <LogOut size={18} />
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <>
                <button type="button" className="navbar__login" onClick={handleLoginClick}>
                  {t("nav.signIn")}
                </button>
                <Link to="/vendor/create-store" className="navbar__register" onClick={closeMenu}>
                  {t("nav.createStore")}
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="navbar__actions">
          {isAuthenticated ? (
            <>
              <Link to="/vendor/dashboard" className="navbar__profile" title="Vendor profile">
                <UserCircle size={18} />
                <span>{profileLabel}</span>
              </Link>
              <button type="button" className="navbar__dashboard-icon" onClick={() => navigate("/vendor/dashboard")} aria-label="Open dashboard" title="Dashboard">
                <LayoutDashboard size={18} />
              </button>
              <button type="button" className="navbar__logout" onClick={handleLogout} aria-label="Log out" title="Log out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <LanguageSwitcher />
              <button type="button" className="navbar__login" onClick={handleLoginClick}>
                {t("nav.signIn")}
              </button>
              <Link to="/vendor/create-store" className="navbar__register">
                {t("nav.createStore")}
              </Link>
            </>
          )}
        </div>

        <LanguageSwitcher className="navbar__language-compact" />

        <button
          type="button"
          className={`navbar__toggle ${isMenuOpen ? "is-open" : ""}`}
          aria-expanded={isMenuOpen}
          aria-label={t("nav.toggleMenu")}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
