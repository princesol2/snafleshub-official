import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import useDocumentTitle from "../../utils/useDocumentTitle";
import heroArtMarket from "../../../img/hero-art-market-landscape.jpg";
import registerShopImage from "../../../img/how-register-shop.jpg";
import mapDiscoveryImage from "../../../img/how-map-discovery.jpg";
import ordersImage from "../../../img/how-orders.jpg";
import "./Home.css";

const howItWorksCards = [
  {
    step: "01",
    titleKey: "home.step1Title",
    descriptionKey: "home.step1Copy",
    image: registerShopImage,
    imagePosition: "50% 28%",
    badge: "Create",
  },
  {
    step: "02",
    titleKey: "home.step2Title",
    descriptionKey: "home.step2Copy",
    image: mapDiscoveryImage,
    imagePosition: "50% 46%",
    badge: "Discover",
  },
  {
    step: "03",
    titleKey: "home.step3Title",
    descriptionKey: "home.step3Copy",
    image: ordersImage,
    imagePosition: "50% 50%",
    badge: "Share",
  },
];

function Home() {
  const { t } = useLanguage();
  useDocumentTitle("Storefront Discovery");

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll(".home-reveal"));

    if (!revealItems.length) {
      return undefined;
    }

    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.18 }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => {
      revealItems.forEach((item) => observer.unobserve(item));
      observer.disconnect();
    };
  }, []);

  return (
    <div className="page home-page">
      <section className="home-band home-hero" id="home" style={{ "--hero-bg": `url(${heroArtMarket})` }}>
        <div className="home-band__inner home-hero__inner">
          <div className="home-hero__content">
            <span className="home-eyebrow">{t("home.eyebrow")}</span>
            <h1>{t("home.title")}</h1>
            <p className="home-hero__subtitle">
              {t("home.subtitle")}
            </p>
            <div className="home-actions">
              <Link className="home-button home-button--primary" to="/map">
                <span>{t("home.exploreStores")}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="home-band home-mission" id="mission">
        <div className="home-band__inner home-mission__inner home-reveal">
          <div className="home-mission__content">
            <span className="home-eyebrow">{t("home.missionEyebrow")}</span>
            <h2>{t("home.missionTitle")}</h2>
            <p>{t("home.missionCopy")}</p>
            <Link className="home-mission__cta" to="/about">
              {t("home.knowUs")}
            </Link>
          </div>
          <div className="home-mission__panel" aria-label="Product discovery flow">
            <div>
              <span>01</span>
              <strong>Search first</strong>
            </div>
            <div>
              <span>02</span>
              <strong>Open the map</strong>
            </div>
            <div>
              <span>03</span>
              <strong>Choose a storefront</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="home-band home-steps" id="how-it-works">
        <div className="home-band__inner">
          <div className="home-section-heading home-reveal">
            <span className="home-eyebrow">{t("home.howEyebrow")}</span>
            <h2>{t("home.howTitle")}</h2>
            <p>{t("home.howCopy")}</p>
          </div>

          <div className="home-step-list">
            {howItWorksCards.map((card, index) => (
              <article
                className="home-step-card home-reveal"
                key={card.step}
                style={{ "--step-delay": `${index * 110}ms` }}
              >
                <div className="home-step-card__visual" aria-hidden="true">
                  <img src={card.image} alt="" style={{ objectPosition: card.imagePosition }} />
                  <span>{card.badge}</span>
                </div>
                <div className="home-step-card__content">
                  <span>{card.step}</span>
                  <h3>{t(card.titleKey)}</h3>
                  <p>{t(card.descriptionKey)}</p>
                </div>
              </article>
            ))}
          </div>

        </div>
      </section>

      <section
        className="home-band home-contact"
        id="contact"
        style={{ "--contact-bg": `url(${ordersImage})` }}
      >
        <div className="home-band__inner home-contact__inner home-reveal">
          <span className="home-eyebrow">{t("home.contactEyebrow")}</span>
          <h2>{t("home.contactTitle")}</h2>
          <p>{t("home.contactCopy")}</p>
          <div className="home-contact__actions">
            <Link className="home-button home-button--primary" to="/support">
              {t("home.contactSupport")}
            </Link>
            <a className="home-button home-button--secondary" href="mailto:support@snafleshub.com">
              {t("home.emailSupport")}
            </a>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer__inner">
          <Link to="/" className="home-footer__brand">
            SnaflesHub
          </Link>
          <nav className="home-footer__links" aria-label="Footer">
            <Link to="/about">{t("footer.about")}</Link>
            <Link to="/support">{t("footer.support")}</Link>
            <Link to="/terms-and-conditions">{t("footer.terms")}</Link>
            <Link to="/terms-of-use">{t("footer.termsUse")}</Link>
            <Link to="/privacy-policy">{t("footer.privacy")}</Link>
            <Link to="/refund-payment-policy">{t("footer.paymentPolicy")}</Link>
            <Link to="/vendor-policy">{t("footer.vendorPolicy")}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default Home;





