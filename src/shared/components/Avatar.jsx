export default function Avatar({
  reference,
  fallback,
  className = "ava",
  style,
}) {
  const url = typeof reference === "string" && reference.startsWith("http") ? reference : "";

  return (
    <span
      className={`${className}${url ? " has-profile-image" : ""}`}
      style={{
        ...style,
        backgroundImage: url ? `url("${url}")` : undefined,
      }}
    >
      {url ? "" : fallback}
    </span>
  );
}
