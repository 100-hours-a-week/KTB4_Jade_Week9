const LOGIN_STATUS_KEY = "bangal.session";

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

const unauthorizedListeners = new Set();

export function notifyUnauthorized() {
  if (!readLoginStatus()) return;
  clearLoginStatus();
  unauthorizedListeners.forEach((listener) => listener());
}

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}
