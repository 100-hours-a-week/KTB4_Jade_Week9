const LOGIN_STATUS_KEY = "bangal.session";
const DEBUG_LOG_KEY = "bangal.debug.logs";

// 실제 인증은 백엔드가 내려주는 httpOnly 쿠키(JWT)가 담당한다. JS는 그 값을 읽을 수 없어서
// "로그인에 성공했다"는 사실만 로컬에 캐시해두고, 페이지 진입할 때마다 서버에 묻지 않고
// 이 캐시로 로그인 여부를 판단한다. 이건 백엔드 세션이 아니다.
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

// 브라우저 콘솔에서 실서버 연동 문제(401, 쿠키 등)를 살펴볼 때 쓰는 디버그 창구.
// 코드 어디에서도 참조하지 않고, 개발자가 devtools 콘솔에서 직접 호출하는 용도.
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
