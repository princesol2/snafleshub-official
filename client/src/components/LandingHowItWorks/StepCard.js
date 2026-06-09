function StepCard({ icon, title, description, delay }) {
  return (
    <article className="how-it-works-card" style={{ animationDelay: delay }}>
      <div className="how-it-works-card__icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="how-it-works-card__title">{title}</h3>
      <p className="how-it-works-card__description">{description}</p>
    </article>
  );
}

export default StepCard;
