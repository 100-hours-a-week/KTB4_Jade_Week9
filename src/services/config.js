const DEFAULT_API_BASE = "http://localhost:8080";

export const config = {
  API_BASE: (import.meta.env.VITE_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, ""),
};
