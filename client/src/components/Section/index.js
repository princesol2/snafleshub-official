import "./Section.css";

function Section({ id, eyebrow, heading, description, children }) {
  return (
    <section id={id} className="page-section">
      {eyebrow ? <p className="page-section__eyebrow">{eyebrow}</p> : null}
      <h2 className="page-section__heading">{heading}</h2>
      {description ? <p className="page-section__text">{description}</p> : null}
      {children ? <div className="page-section__content">{children}</div> : null}
    </section>
  );
}

export default Section;
