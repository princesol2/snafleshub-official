import { Link } from "react-router-dom";
import "./LandingDomainSection.css";

const domainCards = [
  {
    title: "Free launch URL",
    value: "snafleshub.com/store/your-shop",
    description: "Every store can start with a SnaflesHub storefront link that is ready to share immediately.",
  },
  {
    title: "Custom domain later",
    value: "yourshop.com",
    description: "When the store wants a stronger brand, the same storefront can be connected to its own domain.",
  },
  {
    title: "Map discovery included",
    value: "Pinned by location",
    description: "The storefront is not isolated. Customers can find it from discovery cards and map pins.",
  },
];

function LandingDomainSection() {
  return (
    <section id="domains" className="landing-domain" aria-labelledby="landing-domain-title">
      <div className="landing-domain__header">
        <p className="landing-domain__eyebrow">Links and domains</p>
        <h2 id="landing-domain-title" className="landing-domain__title">
          Start simple with a storefront link customers can open immediately.
        </h2>
      </div>

      <div className="landing-domain__grid">
        {domainCards.map((card) => (
          <article key={card.title} className="landing-domain__card">
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <p>{card.description}</p>
          </article>
        ))}
      </div>

      <div className="landing-domain__footer">
        <p>Every shop gets a SnaflesHub URL first. Custom domains can be connected later when the store wants a dedicated brand address.</p>
        <Link to="/vendor/login">Register and claim a store link</Link>
      </div>
    </section>
  );
}

export default LandingDomainSection;
