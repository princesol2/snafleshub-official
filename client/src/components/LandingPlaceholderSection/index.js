import "./LandingPlaceholderSection.css";

function LandingPlaceholderSection({ id, title, description }) {
  return (
    <section id={id} className="landing-placeholder-section" aria-labelledby={`${id}-title`}>
      <div className="landing-placeholder-section__shell">
        <div className="landing-placeholder-section__panel">
          <h2 id={`${id}-title`} className="landing-placeholder-section__title">
            {title}
          </h2>
          <p className="landing-placeholder-section__copy">{description}</p>
        </div>
      </div>
    </section>
  );
}

export default LandingPlaceholderSection;
