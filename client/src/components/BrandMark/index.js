import "./BrandMark.css";

function BrandMark({ className = "" }) {
  return (
    <span className={`brand-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <path
          d="M14.3 5.8h19.4L44 24 33.7 42.2H14.3L4 24 14.3 5.8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M19 15.5h10l5.5 8.5-5.5 8.5H19L13.5 24 19 15.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M14.3 5.8 19 15.5M33.7 5.8 29 15.5M44 24h-9.5M33.7 42.2 29 32.5M14.3 42.2 19 32.5M4 24h9.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default BrandMark;
