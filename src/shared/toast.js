const listeners = new Set();

export function toast(message) {
  listeners.forEach((listener) => listener(message));
}

export function subscribeToast(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
