(function () {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

  function isValidEmail(value) {
    return EMAIL_RE.test(String(value || "").trim());
  }

  function isStrongPassword(value) {
    return PASSWORD_RE.test(String(value || ""));
  }

  function getErrorMessage(err, fallback) {
    if (!err) return fallback;
    if (typeof err === "string") return err;
    if (err.message) return err.message;
    return fallback;
  }

  function setFieldError(input, message) {
    if (!input) return;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    input.classList.toggle("input-error", !!message);
    if (message) input.dataset.error = message;
    else delete input.dataset.error;
  }

  function clearFieldError(input) {
    setFieldError(input, "");
  }

  function setSubmitState(button, isSubmitting) {
    if (!button) return;
    button.disabled = isSubmitting;
    button.dataset.submitting = isSubmitting ? "true" : "false";
  }

  function setHelper(el, message, isError) {
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
    el.classList.toggle("error", !!isError);
  }

  function validateArticleForm({ question, optionA, optionB }) {
    const errors = {};
    if (!question || !String(question).trim()) errors.question = "질문을 입력해 주세요";
    if (!optionA || !String(optionA).trim()) errors.optionA = "선택지 A를 입력해 주세요";
    if (!optionB || !String(optionB).trim()) errors.optionB = "선택지 B를 입력해 주세요";
    return errors;
  }

  window.FormUtils = {
    isValidEmail,
    isStrongPassword,
    getErrorMessage,
    setFieldError,
    clearFieldError,
    setSubmitState,
    setHelper,
    validateArticleForm,
  };
})();
