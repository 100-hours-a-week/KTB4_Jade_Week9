import useObjectUrl from "../hooks/useObjectUrl.js";

export default function Avatar({
  reference,
  fallback,
  className = "ava",
  style,
}) {
  const url = useObjectUrl(reference);

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
