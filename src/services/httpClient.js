import { config } from "./config.js";
import { notifyUnauthorized } from "./loginStatusCache.js";

const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
const AUTH_PATHS = ["/auth/token/re-issue", "/auth/sign-in", "/auth/sign-up"];

function readCookie(name) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfReady = false;
async function ensureCsrf() {
  if (csrfReady && readCookie("XSRF-TOKEN")) return;
  const response = await fetch(config.API_BASE + "/auth/csrf", { credentials: "include" });
  csrfReady = response.ok;
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

  const isAuthPath = AUTH_PATHS.includes(path);
  if (response.status === 401) {
    if (!isRetry && !isAuthPath) return retryAfterReissue(method, path, body);
    if (!isAuthPath) notifyUnauthorized();
  }

  if (response.status === 403 && !isRetry && MUTATING_METHODS.includes(method)) {
    csrfReady = false;
    return http(method, path, body, true);
  }

  if (!response.ok) throw await toApiError(response);
  return parseBody(response);
}

export async function httpPublic(method, path, body) {
  const response = await fetch(config.API_BASE + path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) throw await toApiError(response);
  return parseBody(response);
}

async function retryAfterReissue(method, path, body) {
  try {
    await http("POST", "/auth/token/re-issue");
  } catch (e) {}
  return http(method, path, body, true);
}

async function toApiError(response) {
  let message = "요청에 실패했어요";
  let fields = null;
  let code = null;
  try {
    const responseBody = await response.json();
    message = responseBody.message || message;
    fields = responseBody.fields || null;
    code = responseBody.code || null;
  } catch (e) {}

  return buildError(message, response.status, fields, code);
}

function buildError(message, status, fields, code) {
  const error = new Error(message);
  error.status = status;
  error.fields = fields;
  error.serverCode = code;
  return error;
}

async function parseBody(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw buildError("서버 응답을 처리할 수 없어요", response.status, null, null);
  }

  if (!json || typeof json !== "object" || !("success" in json)) return json;
  if (json.success !== true) {
    throw buildError(json.message || "요청에 실패했어요", response.status, json.fields || null, json.code || null);
  }
  return json.data ?? null;
}
