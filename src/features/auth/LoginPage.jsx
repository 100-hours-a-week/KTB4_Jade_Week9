import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../../services/api.js";
import Field from "../../shared/components/Field.jsx";
import Shell from "../../shared/components/Shell.jsx";
import { toast } from "../../shared/components/Toast.jsx";
import { EMAIL_PATTERN } from "../../shared/utils.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [pending, setPending] = useState(false);

  if (api.isLoggedIn()) return <Navigate to="/games" replace />;

  const submit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.password) {
      toast("이메일과 비밀번호를 입력해 줘");
      return;
    }
    if (!EMAIL_PATTERN.test(form.email.trim())) {
      toast("올바른 이메일 형식으로 입력해 줘");
      return;
    }

    setPending(true);
    try {
      await api.login(form.email.trim(), form.password);
      toast("반틈 준비 완료 ⚡");
      navigate("/games", { replace: true });
    } catch (error) {
      toast(error.message || "로그인에 실패했어요");
    } finally {
      setPending(false);
    }
  };

  return (
    <Shell>
      <div className="wrap-narrow auth-wrap">
        <div className="auth-head">
          <div className="auth-logo" />
          <h1>로그인</h1>
          <p>오늘도 세상을 딱 반틈으로</p>
        </div>
        <form className="card form-stack" onSubmit={submit} noValidate>
          <Field label="이메일">
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              placeholder="이메일을 입력하세요"
              autoComplete="email"
            />
          </Field>
          <Field
            label="비밀번호"
            hint="8자 이상, 대소문자·숫자·특수문자 포함"
          >
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
            />
          </Field>
          <button className="btn btn-accent" disabled={pending}>
            {pending ? "로그인 중..." : "로그인"}
          </button>
        </form>
        <button className="btn-text" onClick={() => navigate("/signup")}>
          계정이 없다면? <span className="text-link">회원가입</span>
        </button>
      </div>
    </Shell>
  );
}
