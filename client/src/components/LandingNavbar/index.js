import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import BrandMark from "../BrandMark";
import LanguageSwitcher from "../LanguageSwitcher";
import { useLanguage } from "../../i18n/LanguageContext";
import "./LandingNavbar.css";

const navItems = [
  { labelKey: "nav.meet", id: "home" },
  { labelKey: "nav.discoveryMap", to: "/map" },
  { labelKey: "nav.ourMission", id: "mission" },
  { labelKey: "nav.howItWorks", id: "how-it-works" },
  { labelKey: "nav.aboutUs", to: "/about" },
];

function LandingNavbar() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const sectionIds = useMemo(() => navItems.map((item) => item.id).filter(Boolean), []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries[0]?.target?.id) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.2, 0.35, 0.5, 0.7],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, [sectionIds]);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (!section) {
      return;
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
    navigate(id === "home" ? "/" : `/#${id}`);
    setActiveSection(id);
    setIsMenuOpen(false);
  };

  const handleBrandClick = (event) => {
    event.preventDefault();
    scrollToSection("home");
  };

  const handleNavClick = (item) => {
    if (item.to) {
      setIsMenuOpen(false);
      navigate(item.to);
      return;
    }

    scrollToSection(item.id);
  };

  const handleSignUp = () => {
    setIsMenuOpen(false);
    navigate("/vendor/create-store");
  };

  const handleSignIn = () => {
    setIsMenuOpen(false);
    navigate("/vendor/login");
  };

  return (
    <header className={`landing-navbar ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="landing-navbar__inner">
        <Link to="/" className="landing-navbar__brand" onClick={handleBrandClick}>
          <BrandMark />
          <span>SnaflesHub</span>
        </Link>

        <div className={`landing-navbar__panel ${isMenuOpen ? "is-open" : ""}`}>
          <nav className="landing-navbar__links" aria-label="Landing page">
            {navItems.map((item) => (
              <button
                key={item.id || item.to}
                type="button"
                className={`landing-navbar__link ${activeSection === item.id ? "is-active" : ""}`}
                onClick={() => handleNavClick(item)}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </nav>

          <div className="landing-navbar__auth">
            <LanguageSwitcher />
            <button type="button" className="landing-navbar__auth-link" onClick={handleSignIn}>
              {t("nav.signInLower")}
            </button>
            <button type="button" className="landing-navbar__signup" onClick={handleSignUp}>
              {t("nav.createStore")}
            </button>
          </div>
        </div>

        <LanguageSwitcher className="landing-navbar__language-compact" />

        <button
          type="button"
          className={`landing-navbar__toggle ${isMenuOpen ? "is-open" : ""}`}
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

export default LandingNavbar;
