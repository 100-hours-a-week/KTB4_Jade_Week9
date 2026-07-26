const LOGIN_STATUS_KEY = "bangal.session";
const DEBUG_LOG_KEY = "bangal.debug.logs";

export function saveLoginStatus(data) {
  try {
    localStorage.setItem(LOGIN_STATUS_KEY, JSON.stringify(data));
  } catch (e) {}
}

export function readLoginStatus() {
  try {
    return JSON.parse(localStorage.getItem(LOGIN_STATUS_KEY) || "null");
  } catch (e) {
    return null;
  }
}

export function clearLoginStatus() {
  try {
    localStorage.removeItem(LOGIN_STATUS_KEY);
  } catch (e) {}
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function readAuthCookieState() {
  return {
    accessToken: readCookie("ACCESS_TOKEN"),
    refreshToken: readCookie("REFRESH_TOKEN"),
    xsrfToken: readCookie("XSRF-TOKEN"),
    documentCookie: document.cookie,
  };
}

export function appendDebugLog(entry) {
  try {
    const items = JSON.parse(localStorage.getItem(DEBUG_LOG_KEY) || "[]");
    items.push({ timestamp: new Date().toISOString(), ...entry });
    localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(items.slice(-20)));
  } catch (e) {}
}

if (typeof window !== "undefined") {
  window.BANGAL_DEBUG = {
    log: appendDebugLog,
    read: () => {
      try {
        return JSON.parse(localStorage.getItem(DEBUG_LOG_KEY) || "[]");
      } catch (e) {
        return [];
      }
    },
    clear: () => {
      try {
        localStorage.removeItem(DEBUG_LOG_KEY);
      } catch (e) {}
    },
    authCookies: readAuthCookieState,
    loginStatus: readLoginStatus,
  };
}
