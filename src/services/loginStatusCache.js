const LOGIN_STATUS_KEY = "bangal.session";

export function saveLoginStatus(data) {
  try {
    localStorage.setItem(LOGIN_STATUS_KEY, JSON.stringify(data));
  } catch (e) {
    // 사파리 프라이빗 모드 등 저장이 막힌 환경은 무시한다.
  }
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
  } catch (e) {
    // 위와 동일
  }
}

const unauthorizedListeners = new Set();

// 서버가 최종적으로 401을 돌려준 순간 세션을 비우고 구독자에게 알린다.
// 동시에 여러 요청이 401을 받아도 알림은 한 번만 나가도록 이미 비워진 경우는 건너뛴다.
export function notifyUnauthorized() {
  if (!readLoginStatus()) return;
  clearLoginStatus();
  unauthorizedListeners.forEach((listener) => listener());
}

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}
