import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api.js";
import Field from "../../shared/components/Field.jsx";
import Loading from "../../shared/components/Loading.jsx";
import Shell from "../../shared/components/Shell.jsx";
import {
  getFieldErrorMessage,
  getFieldErrors,
} from "../../shared/fieldErrors.js";
import { toast } from "../../shared/toast.js";
import useCurrentUser from "../../shared/hooks/useCurrentUser.js";
import { PASSWORD_PATTERN } from "../../shared/utils.js";

// 폼 상태 키를 서버가 fields에 쓰는 이름으로 옮긴다.
const FIELD_NAMES = {
  current: "nowPassword",
  password: "nextPassword",
  confirm: "checkNextPassword",
};

export default function PasswordPage() {
  const navigate = useNavigate();
  const { loading, user } = useCurrentUser();
  const [form, setForm] = useState({
    current: "",
    password: "",
    confirm: "",
  });
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    // 값을 고치면 서버가 준 지난 오류 표시는 지운다.
    setFieldErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch)) delete next[FIELD_NAMES[key]];
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setFieldErrors({});

    if (!form.current || !form.password) {
      toast("모든 항목을 입력해 줘");
      return;
    }
    if (!PASSWORD_PATTERN.test(form.password)) {
      toast("새 비밀번호 형식을 확인해 주세요");
      return;
    }
    if (form.password !== form.confirm) {
      toast("동일한 비밀번호를 입력해 주세요");
      return;
    }

    setPending(true);
    try {
      await api.changePassword({
        nowPassword: form.current,
        nextPassword: form.password,
        checkNextPassword: form.confirm,
      });
      toast("비밀번호 수정 완료");
      navigate("/games");
    } catch (error) {
      setFieldErrors(getFieldErrors(error));
      toast(getFieldErrorMessage(error, "수정에 실패했어요"));
    } finally {
      setPending(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Shell header back="/games" user={user}>
      <div className="wrap-narrow password-wrap">
        <h1 className="page-title profile-title">비밀번호 수정</h1>
        <form className="card form-stack" onSubmit={submit}>
          <Field label="현재 비밀번호" error={fieldErrors.nowPassword}>
            <input
              className="input"
              type="password"
              value={form.current}
              onChange={(event) => update({ current: event.target.value })}
              autoComplete="current-password"
            />
          </Field>
          <Field
            label="새 비밀번호"
            hint="8~20자, 대소문자·숫자·특수문자 포함"
            error={fieldErrors.nextPassword}
          >
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(event) => update({ password: event.target.value })}
              autoComplete="new-password"
            />
          </Field>
          <Field
            label="비밀번호 확인"
            error={
              form.confirm && form.password !== form.confirm
                ? "동일한 비밀번호를 입력해 주세요"
                : fieldErrors.checkNextPassword
            }
          >
            <input
              className="input"
              type="password"
              value={form.confirm}
              onChange={(event) => update({ confirm: event.target.value })}
              autoComplete="new-password"
            />
          </Field>
          <button className="btn btn-accent" disabled={pending}>
            {pending ? "저장 중..." : "수정하기"}
          </button>
        </form>
      </div>
    </Shell>
  );
}
