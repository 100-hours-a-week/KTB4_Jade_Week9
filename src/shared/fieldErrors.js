// 서버는 검증 실패를 fields에 { 필드명: 메시지 } 형태로 담아 보내고
// message에는 공통 문구만 넣는다. 그대로 띄우면 어느 칸이 틀렸는지 알 수 없다.
function toMessages(value) {
  return (Array.isArray(value) ? value : [value])
    .map((item) => (typeof item === "string" ? item : item?.message))
    .filter((message) => typeof message === "string" && message.trim())
    .map((message) => message.trim());
}

export function getFieldErrors(error) {
  const fields = error?.fields;
  if (!fields || typeof fields !== "object") return {};

  return Object.fromEntries(
    Object.entries(fields)
      .map(([name, value]) => [name, toMessages(value).join("\n")])
      .filter(([, message]) => message),
  );
}

export function getFieldErrorMessage(error, fallback) {
  const messages = [...new Set(Object.values(getFieldErrors(error)))];

  return messages.length ? messages.join("\n") : error?.message || fallback;
}
