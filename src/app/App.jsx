import { Navigate, Route, Routes } from "react-router-dom";
import GameDetailPage from "../features/articles/GameDetailPage.jsx";
import GameFormPage from "../features/articles/GameFormPage.jsx";
import GamesPage from "../features/articles/GamesPage.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import SignupPage from "../features/auth/SignupPage.jsx";
import PasswordPage from "../features/mypage/PasswordPage.jsx";
import ProfilePage from "../features/mypage/ProfilePage.jsx";
import Toast from "../shared/components/Toast.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

const protect = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/games" element={protect(<GamesPage />)} />
        <Route path="/games/new" element={protect(<GameFormPage />)} />
        <Route path="/games/:id" element={protect(<GameDetailPage />)} />
        <Route
          path="/games/:id/edit"
          element={protect(<GameFormPage edit />)}
        />
        <Route path="/profile" element={protect(<ProfilePage />)} />
        <Route path="/password" element={protect(<PasswordPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  );
}
