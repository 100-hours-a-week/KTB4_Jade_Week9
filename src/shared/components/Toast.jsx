import { useEffect, useState } from "react";
import { subscribeToast } from "../toast.js";

export default function Toast() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    let timer;
    const unsubscribe = subscribeToast((nextMessage) => {
      setMessage(nextMessage);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(""), 2200);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return message ? (
    <div className="toast" role="status">
      {message}
    </div>
  ) : null;
}
