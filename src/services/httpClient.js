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
  // 204 + XSRF-TOKEN 쿠키를 기대한다. 실패하면 다음 요청에서 다시 시도한다.
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
    // 인증 경로의 401은 자격 증명 오류이므로 재발급 대상이 아니다.
    if (!isRetry && !isAuthPath) return retryAfterReissue(method, path, body);
    // 재발급까지 실패했다면 세션이 끝난 것으로 보고 로컬 상태를 비운다.
    if (!isAuthPath) notifyUnauthorized();
  }

  // CSRF 토큰이 만료되면 403(AUTH-403-002)이 온다. 토큰을 새로 받아 한 번만 다시 시도한다.
  if (response.status === 403 && !isRetry && MUTATING_METHODS.includes(method)) {
    csrfReady = false;
    return http(method, path, body, true);
  }

  if (!response.ok) throw await toApiError(response);
  return parseBody(response);
}

async function retryAfterReissue(method, path, body) {
  try {
    // 재발급도 POST라 CSRF 헤더가 필요하다. 직접 fetch하면 403으로 죽는다.
    // 재발급 경로의 401은 위에서 재귀 대상에서 빠지므로 isRetry를 넘기지 않아도 안전하다.
    await http("POST", "/auth/token/re-issue");
  } catch (e) {
    // 재발급 실패는 아래 재시도의 401로 드러난다.
  }
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
  } catch (e) {
    // 본문이 없거나 JSON이 아니면 기본 메시지를 쓴다.
  }

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
  // 상태 코드가 2xx여도 봉투가 실패를 알리면 에러로 취급한다.
  if (json.success !== true) {
    throw buildError(json.message || "요청에 실패했어요", response.status, json.fields || null, json.code || null);
  }
  return json.data ?? null;
}
