import { Navigate, useLocation } from "react-router-dom";
import { api } from "../services/api.js";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!api.isLoggedIn()) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}
