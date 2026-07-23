export default function Heart({ filled }) {
  return (
    <svg
      className="heart-icon"
      viewBox="0 0 24 22"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 3.4}
      strokeLinejoin="round"
      strokeLinecap="round"
      shapeRendering="geometricPrecision"
    >
      <path d="M12 19C12 19 3 13.3 3 7.8C3 4.6 5.6 3 8.2 3C10 3 11.3 4 12 5.3C12.7 4 14 3 15.8 3C18.4 3 21 4.6 21 7.8C21 13.3 12 19 12 19Z" />
    </svg>
  );
}
