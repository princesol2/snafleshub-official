import { useNavigate } from "react-router-dom";
import "./LandingHero.css";

function LandingHero() {
  const navigate = useNavigate();

  const handleLearnMore = () => {
    navigate("/map");
  };

  return (
    <section id="home" className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="landing-hero__shell">
        <div className="landing-hero__content">
          <h1 id="landing-hero-title" className="landing-hero__title">
            <span>Meet</span>
            <span>SnaflesHub</span>
          </h1>

          <blockquote className="landing-hero__quote">
            A technology platform helping stores create a storefront customers can discover and trust.
          </blockquote>

          <button type="button" className="landing-hero__cta" onClick={handleLearnMore}>
            Learn more
          </button>
        </div>
      </div>
    </section>
  );
}

export default LandingHero;
