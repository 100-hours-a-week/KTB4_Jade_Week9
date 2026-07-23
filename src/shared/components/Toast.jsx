import { useEffect, useState } from "react";

const listeners = new Set();

export function toast(message) {
  listeners.forEach((listener) => listener(message));
}

export default function Toast() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    let timer;
    const listener = (nextMessage) => {
      setMessage(nextMessage);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(""), 2200);
    };

    listeners.add(listener);
    return () => {
      clearTimeout(timer);
      listeners.delete(listener);
    };
  }, []);

  return message ? (
    <div className="toast" role="status">
      {message}
    </div>
  ) : null;
}
