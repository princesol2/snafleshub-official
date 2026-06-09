import { Link } from "react-router-dom";
import "./LandingMission.css";

function LandingMission() {
  return (
    <section id="our-mission" className="landing-mission" aria-labelledby="landing-mission-title">
      <div className="landing-mission__shell">
        <div className="landing-mission__grid">
          <div className="landing-mission__content">
            <h2 id="landing-mission-title" className="landing-mission__title">
              Our Mission
            </h2>

            <blockquote className="landing-mission__quote">
              Your storefront should help customers find the store they already want to trust.
            </blockquote>

            <Link to="/vendor/login" className="landing-mission__cta">
              <span>Create your storefront</span>
            </Link>
          </div>

          <div className="landing-mission__visual" aria-label="SnaflesHub mission illustration">
            <div className="landing-mission__frame">
              <div className="landing-mission__card landing-mission__card--primary">
                <span className="landing-mission__eyebrow">Merchant-first</span>
                <strong>Own your presence.</strong>
                <p>Bring your storefront, identity, and discovery experience together in one place.</p>
              </div>
              <div className="landing-mission__card landing-mission__card--accent">
                <span>Direct discovery</span>
                <span>Map reach</span>
                <span>Independent control</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingMission;
