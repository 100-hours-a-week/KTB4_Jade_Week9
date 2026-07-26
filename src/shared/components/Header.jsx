import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api.js";
import Avatar from "./Avatar.jsx";
import { toast } from "../toast.js";

export default function Header({ back = false, user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const initial = (user?.nick || "?").slice(0, 1);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const logout = async () => {
    try {
      await api.logout();
      toast("로그아웃 완료");
    } catch (error) {
      // 요청이 실패해도 로컬 세션은 이미 비워졌다. 화면은 반드시 로그인으로 돌린다.
      toast("로그아웃 요청은 실패했지만 이 기기에서는 로그아웃했어");
    } finally {
      navigate("/", { replace: true });
    }
  };

  return (
    <header className="hd">
      <div className="hd-inner">
        <div className="hd-left">
          {back && (
            <Link
              className="back-btn"
              to={typeof back === "string" ? back : "/games"}
              aria-label="뒤로"
            >
              ←
            </Link>
          )}
          <Link className="brand" to="/games">
            <span className="brand-mark" />
            <span className="brand-name">
              <b>반틈</b>
              <small>BAN-TEUM</small>
            </span>
          </Link>
        </div>
        <div
          className="menu-anchor"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="avatar-button-reset"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="사용자 메뉴"
          >
            <Avatar
              className="avatar-btn"
              reference={user?.profileImageUrl}
              fallback={initial}
            />
          </button>
          <div className="menu" hidden={!menuOpen}>
            <button onClick={() => navigate("/profile")}>회원정보 수정</button>
            <button onClick={() => navigate("/password")}>비밀번호 수정</button>
            <button className="danger" onClick={logout}>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
