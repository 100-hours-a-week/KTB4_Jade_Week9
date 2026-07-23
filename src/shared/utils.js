export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export function getAvatarBackground(id) {
  if (id === "me") return "#111111";

  let hue = 0;
  for (const char of String(id)) {
    hue = (hue * 31 + char.charCodeAt(0)) % 360;
  }

  return `oklch(0.55 0.17 ${hue})`;
}
