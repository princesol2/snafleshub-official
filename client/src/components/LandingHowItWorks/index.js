import StepCard from "./StepCard";
import "./LandingHowItWorks.css";

function ShopIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <path d="M4.5 10.5 12 4l7.5 6.5V20h-15z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 20v-5.5h6V20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <path
        d="M12 21s6-5.8 6-11a6 6 0 1 0-12 0c0 5.2 6 11 6 11Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation">
      <circle cx="6" cy="12" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="18" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.9 11.1 15.5 7M7.9 12.9l7.6 4.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const steps = [
  {
    title: "Create Your Storefront",
    description:
      "Set up storefront access, add store details, and publish products customers can search.",
    icon: <ShopIcon />,
    delay: "0ms",
  },
  {
    title: "Get Discovered on the Map",
    description:
      "Your store appears in discovery with location, category, and product details customers can preview before opening.",
    icon: <MapPinIcon />,
    delay: "90ms",
  },
  {
    title: "Share Your Store",
    description:
      "Share your SnaflesHub link first, then connect a custom domain when the store is ready for a stronger brand.",
    icon: <ShareIcon />,
    delay: "180ms",
  },
];

function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="landing-how-it-works" aria-labelledby="landing-how-it-works-title">
      <div className="landing-how-it-works__shell">
        <h2 id="landing-how-it-works-title" className="landing-how-it-works__title">
          HOW IT WORKS
        </h2>

        <div className="landing-how-it-works__grid">
          {steps.map((step) => (
            <StepCard
              key={step.title}
              icon={step.icon}
              title={step.title}
              description={step.description}
              delay={step.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default LandingHowItWorks;
