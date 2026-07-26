import { useEffect, useId, useRef } from "react";

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

export default function Modal({
  title,
  text,
  cancel,
  confirm,
  onCancel,
  onConfirm,
}) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  // 콜백은 렌더마다 새로 오므로 effect 의존성에서 빼고 ref로 최신값을 본다.
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    cancelRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onCancelRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      // 포커스가 모달 밖으로 새지 않도록 첫/마지막 요소를 이어 붙인다.
      const items = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>{title}</h2>
        <p>{text}</p>
        <div className="modal-actions">
          <button ref={cancelRef} className="btn btn-accent" onClick={onCancel}>
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
