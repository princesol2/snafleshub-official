import { Link } from "react-router-dom";
import useDocumentTitle from "../../utils/useDocumentTitle";
import craftMarketImage from "../../../img/about-craft-market.jpg";
import foundersWorkshopImage from "../../../img/about-founders-workshop.jpg";
import handmadeGiftImage from "../../../img/about-handmade-gift.jpg";
import makersWorkshopImage from "../../../img/about-makers-workshop.jpg";
import potteryHandsImage from "../../../img/about-pottery-hands.jpg";
import "./InfoPage.css";

const pages = {
  about: {
    title: "About SnaflesHub",
    eyebrow: "About",
    lead: "SnaflesHub helps stores create a public storefront, appear on the map, and connect directly with customers.",
    sections: [
      {
        title: "What we are building",
        copy: "A simple commerce discovery layer where stores can publish their profile, location, products, and customer-facing details without needing a custom website first.",
      },
      {
        title: "Who it is for",
        copy: "Independent stores, market stalls, services, makers, and sellers who need a clean digital presence customers can discover and trust.",
      },
      {
        title: "Why map-first",
        copy: "Shopping starts with intent: where is it, what do they sell, and can I reach them directly? SnaflesHub keeps those answers close to the map.",
      },
    ],
    actions: [{ label: "Explore stores", to: "/map", variant: "primary" }],
  },
  support: {
    title: "Support",
    eyebrow: "Support",
    lead: "Get assistance with store listings, account access, product visibility, customer requests, and map discovery.",
    sections: [
      {
        title: "Contact support",
        copy: "Email support@snafleshub.com with the store name, Store ID when available, and a concise description of the issue.",
      },
      {
        title: "For stores",
        copy: "For storefront access, setup, product updates, or map visibility, include the phone number connected to the store account.",
      },
      {
        title: "For customers",
        copy: "For a storefront, product, or listing question, include the store link and the product or store you were trying to reach.",
      },
    ],
    contact: {
      email: "support@snafleshub.com",
    },
    actions: [{ label: "Email support", href: "mailto:support@snafleshub.com", variant: "primary" }],
  },
  "terms-and-conditions": {
    title: "Terms and Conditions",
    eyebrow: "Terms",
    lead: "These terms explain the expected use of SnaflesHub for stores, storefronts, and discovery.",
    sections: [
      { title: "Store responsibility", copy: "Stores are responsible for accurate details, product information, availability, and customer communication." },
      { title: "Platform role", copy: "SnaflesHub provides discovery and storefront tools. It does not guarantee sales, customer visits, or fulfillment outcomes." },
      { title: "Updates", copy: "SnaflesHub may update these terms as the platform, storefront tools, and discovery features evolve." },
    ],
    actions: [],
  },
  "terms-of-use": {
    title: "Terms of Use",
    eyebrow: "Usage",
    lead: "Use SnaflesHub in a way that keeps discovery accurate, useful, and safe for stores and customers.",
    sections: [
      { title: "Acceptable use", copy: "Do not publish false store details, misleading products, abusive content, or information that belongs to another store." },
      { title: "Account access", copy: "Storefront tools should only be used by the owner or authorized team members of that store." },
      { title: "Service integrity", copy: "Use account, store, and product tools only for accurate store information and legitimate customer discovery." },
    ],
    actions: [],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    eyebrow: "Privacy",
    lead: "SnaflesHub should collect only the information needed to create storefronts, support discovery, and help customers contact stores.",
    sections: [
      { title: "Data used", copy: "Store names, owner contact details, store addresses, product details, and optional map coordinates may be used to power storefronts and discovery." },
      { title: "Local storage", copy: "The current app stores basic session and draft setup data in the browser so stores can continue their flow." },
      { title: "Control", copy: "Stores can update details so customers see accurate storefront and discovery information." },
    ],
    actions: [],
  },
  "vendor-policy": {
    title: "Storefront Policy",
    eyebrow: "Storefront policy",
    lead: "Storefront trust is the foundation of SnaflesHub. Storefronts should be accurate, respectful, and maintained by the real store owner.",
    sections: [
      { title: "Store quality", copy: "Keep address, working hours, products, availability, and contact details current." },
      { title: "Product listings", copy: "Only list products or services the store can reasonably provide, and remove unavailable items when needed." },
      { title: "Customer trust", copy: "Use clear images, honest descriptions, and direct communication to avoid confusion before customers visit or buy." },
    ],
    actions: [],
  },
};

const aboutStorySections = [
  {
    title: "Why SnaflesHub began",
    copy:
      "SnaflesHub began with a simple human problem: someone close to the founder needed a practical way to earn, create, and stand on their own. The first idea was small but meaningful: help a creative friend share handmade work online, reach real customers, and turn skill into income.",
    image: makersWorkshopImage,
    imageAlt: "Two makers working together in a creative workshop",
  },
  {
    title: "What we believe",
    copy:
      "A store should not need a large team, expensive software, or technical knowledge before customers can discover it. SnaflesHub exists to give stores a clean storefront, map visibility, product discovery, and direct customer contact in one place.",
    image: craftMarketImage,
    imageAlt: "Customers browsing handmade items in a market store",
  },
  {
    title: "Where we are going",
    copy:
      "The goal is to build a storefront network where local stores, makers, service providers, and creative sellers can be found by what they offer. Search should lead to real stores, useful products, and direct connection.",
    image: handmadeGiftImage,
    imageAlt: "Handmade products packaged for customers",
  },
];

function AboutPage() {
  return (
    <div className="page info-page about-page">
      <section className="about-hero">
        <div className="about-hero__content">
          <p className="page__eyebrow">Know us</p>
          <h1>Built for stores that deserve to be found.</h1>
          <p>
            SnaflesHub helps stores create a public storefront, appear on the map, publish products, and connect
            directly with customers.
          </p>
          <div className="info-page__actions">
            <Link to="/map" className="button">
              Explore stores
            </Link>
            <Link to="/support" className="button--ghost">
              Contact support
            </Link>
          </div>
        </div>
        <div className="about-hero__image" aria-hidden="true">
          <img src={craftMarketImage} alt="" />
        </div>
      </section>

      <section className="founder-note" aria-labelledby="founder-note-title">
        <div>
          <p className="page__eyebrow">Founder&apos;s note</p>
          <h2 id="founder-note-title">A note to the world</h2>
        </div>
        <figure className="founder-note__image">
          <img src={foundersWorkshopImage} alt="Two people smiling while working together in a creative workshop" />
        </figure>
        <blockquote>
          <p>
            SnaflesHub started from a moment I could not ignore. Someone close to me was struggling, and I wanted to
            build something practical, not just comforting. She was creative and good at crafting. I thought: if she
            could make something with her hands, I could build the place where people could find it.
          </p>
          <p>
            That thought became the heart of SnaflesHub: a storefront system for people who have skill, products, and
            ambition, but do not yet have the tools to be seen. This platform is built for stores, makers, and local
            sellers who deserve a fair chance to reach customers.
          </p>
        </blockquote>
      </section>

      <section className="about-date-band" aria-label="Founding date">
        <span>Founded</span>
        <strong>December 24, 2025</strong>
        <p>
          The date marks the beginning of a product built around one belief: discovery should create opportunity for
          real stores and real people.
        </p>
      </section>

      <section className="about-story-grid" aria-label="SnaflesHub story">
        {aboutStorySections.map((section) => (
          <article key={section.title} className="about-story-card">
            <img src={section.image} alt={section.imageAlt} />
            <div>
              <h2>{section.title}</h2>
              <p>{section.copy}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="about-principles" aria-labelledby="about-principles-title">
        <div>
          <p className="page__eyebrow">Principles</p>
          <h2 id="about-principles-title">What the product should always protect</h2>
          <div className="about-principles__image" aria-hidden="true">
            <img src={potteryHandsImage} alt="" />
          </div>
        </div>
        <div className="about-principles__grid">
          <article>
            <h3>Human dignity</h3>
            <p>Give stores a practical way to be seen, trusted, and contacted without making technology feel heavy.</p>
          </article>
          <article>
            <h3>Direct discovery</h3>
            <p>Help customers search for what they need and reach the store behind it with as little friction as possible.</p>
          </article>
          <article>
            <h3>Store ownership</h3>
            <p>Keep the storefront identity, product details, and customer communication centered around the store.</p>
          </article>
        </div>
      </section>
    </div>
  );
}

function InfoPage({ pageKey }) {
  const page = pages[pageKey] || pages.about;

  useDocumentTitle(pageKey === "about" ? "About SnaflesHub" : page.title);

  if (pageKey === "about") {
    return <AboutPage />;
  }

  return (
    <div className="page info-page">
      <section className="info-page__hero">
        <p className="page__eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
        <p>{page.lead}</p>
        {page.actions?.length ? (
          <div className="info-page__actions">
            {page.actions.map((action) =>
              action.href ? (
                <a
                  key={action.href}
                  href={action.href}
                  className={action.variant === "primary" ? "button" : "button--ghost"}
                >
                  {action.label}
                </a>
              ) : (
                <Link
                  key={action.to}
                  to={action.to}
                  className={action.variant === "primary" ? "button" : "button--ghost"}
                >
                  {action.label}
                </Link>
              )
            )}
          </div>
        ) : null}
      </section>

      <section className="info-page__grid" aria-label={`${page.title} details`}>
        {page.sections.map((section) => (
          <article key={section.title} className="info-page__card">
            <h2>{section.title}</h2>
            <p>{section.copy}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export default InfoPage;
