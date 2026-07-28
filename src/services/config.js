const DEFAULT_API_BASE = "/api";

export const config = {
  API_BASE: (import.meta.env.VITE_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, ""),
};
