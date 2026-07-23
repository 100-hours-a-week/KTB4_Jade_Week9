export default function Modal({
  title,
  text,
  cancel,
  confirm,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="modal-actions">
          <button className="btn btn-accent" onClick={onCancel}>
            {cancel}
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            {confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
