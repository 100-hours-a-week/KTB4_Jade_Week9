export default function Field({
  label,
  required = false,
  hint,
  error,
  children,
}) {
  return (
    <div className="field">
      <label className="lbl">
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {(hint || error) && (
        <p className={`hint${error ? " error" : ""}`}>{error || hint}</p>
      )}
    </div>
  );
}
