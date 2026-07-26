import { useEffect, useState } from "react";
import { api } from "../../services/api.js";

export default function useCurrentUser() {
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    let active = true;

    api
      .getMe()
      .then((user) => {
        if (active) setState({ loading: false, user });
      })
      .catch(() => {
        if (active) setState({ loading: false, user: null });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
