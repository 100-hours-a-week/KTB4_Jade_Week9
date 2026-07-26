export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,20}$/;
export const NICKNAME_PATTERN = /^\S{1,10}$/;

export function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

// 서버는 createdAt을 Z가 붙은 UTC로 내려준다. 그대로 파싱해 뷰어의 로컬 날짜로 변환.
export function toLocalDate(createdAt) {
  if (!createdAt) return "";

  const text = String(createdAt);
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text.slice(0, 10);

  return parsed.toLocaleDateString("sv-SE");
}

export function getAvatarBackground(seed) {
  let hue = 0;
  for (const char of String(seed)) {
    hue = (hue * 31 + char.charCodeAt(0)) % 360;
  }

  return `oklch(0.55 0.17 ${hue})`;
}
