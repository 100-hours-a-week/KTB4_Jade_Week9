import { config } from "./config.js";
import { appendDebugLog } from "./loginStatusCache.js";

const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

function readCookie(name) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfReady = false;
async function ensureCsrf() {
  if (csrfReady && readCookie("XSRF-TOKEN")) return;
  await fetch(config.API_BASE + "/auth/csrf", { credentials: "include" });
  csrfReady = true;
}

export async function http(method, path, body, isRetry) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (MUTATING_METHODS.includes(method)) {
    await ensureCsrf();
    const csrfToken = readCookie("XSRF-TOKEN");
    if (csrfToken) headers["X-XSRF-TOKEN"] = csrfToken;
  }

  const response = await fetch(config.API_BASE + path, {
    method,
    credentials: "include",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isReissuePath = path === "/auth/token/re-issue" || path === "/auth/sign-in";
  if (response.status === 401 && !isRetry && !isReissuePath) {
    return retryAfterReissue(method, path, body);
  }

  if (!response.ok) throw await toApiError(method, path, response);
  return parseBody(response);
}

async function retryAfterReissue(method, path, body) {
  try {
    appendDebugLog({ type: "http.401", path, note: "attempting token re-issue" });
    const reissueResponse = await fetch(config.API_BASE + "/auth/token/re-issue", {
      method: "POST",
      credentials: "include",
    });
    appendDebugLog({ type: "http.reissue.response", status: reissueResponse.status, path: "/auth/token/re-issue" });
  } catch (error) {
    appendDebugLog({ type: "http.reissue.error", path: "/auth/token/re-issue", error: error.message || String(error) });
  }
  return http(method, path, body, true);
}

async function toApiError(method, path, response) {
  let message = "요청에 실패했어요";
  let fields = null;
  let code = null;
  let responseBody = null;
  try {
    responseBody = await response.json();
    message = responseBody.message || message;
    fields = responseBody.fields || null;
    code = responseBody.code || null;
  } catch (e) {}

  appendDebugLog({ type: "http.error", path, status: response.status, body: responseBody });
  console.error("[BANGAL API ERROR]", { method, path, status: response.status, response: responseBody });

  const error = new Error(message);
  error.status = response.status;
  error.fields = fields;
  error.serverCode = code;
  return error;
}

async function parseBody(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;

  const json = JSON.parse(text);
  return json && json.success === true ? (json.data ?? null) : json;
}
