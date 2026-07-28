import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api.js";
import { profileImages, validateImageFile } from "../../services/profileImages.js";
import Field from "../../shared/components/Field.jsx";
import Shell from "../../shared/components/Shell.jsx";
import { getFieldErrorMessage } from "../../shared/fieldErrors.js";
import { toast } from "../../shared/toast.js";
import {
  EMAIL_PATTERN,
  NICKNAME_PATTERN,
  PASSWORD_PATTERN,
} from "../../shared/utils.js";

export default function SignupPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    nick: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const selectAvatar = (file) => {
    if (!file) return;

    const invalid = validateImageFile(file);
    if (invalid) {
      toast(invalid);
      return;
    }

    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.password || !form.nick || !avatar) {
      toast("프로필 사진을 포함한 필수 항목을 모두 입력해 주세요");
      return;
    }
    if (!EMAIL_PATTERN.test(form.email.trim())) {
      toast("올바른 이메일 형식으로 입력해 주세요");
      return;
    }
    if (!PASSWORD_PATTERN.test(form.password)) {
      toast("비밀번호는 8~20자, 대소문자·숫자·특수문자를 포함해야 해요");
      return;
    }
    if (form.password !== form.confirm) {
      toast("동일한 비밀번호를 입력해 주세요");
      return;
    }
    if (!NICKNAME_PATTERN.test(form.nick.trim())) {
      toast("닉네임은 띄어쓰기 없이 1~10자로 입력해 줘");
      return;
    }

    setPending(true);
    try {
      const profileImageUrl = await profileImages.upload(avatar);
      await api.signup({
        email: form.email.trim(),
        password: form.password,
        checkPassword: form.confirm,
        nickname: form.nick.trim(),
        profileImageUrl,
      });
      toast("가입 완료! 로그인해 줘 ⚡");
      navigate("/", { replace: true });
    } catch (error) {
      toast(getFieldErrorMessage(error, "회원가입에 실패했어요"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Shell>
      <div className="wrap-narrow signup-wrap">
        <h1 className="page-title">회원가입</h1>
        <p className="page-sub">가입하고 반틈 가르기 시작</p>
        <form className="card" onSubmit={submit} noValidate>
          <div className="center">
            <label className="lbl">
              프로필 사진 <span className="req">*</span>
            </label>
            <button
              type="button"
              className={`avatar-upload${preview ? " has-profile-image" : ""}`}
              style={{
                backgroundImage: preview ? `url("${preview}")` : undefined,
              }}
              onClick={() => inputRef.current.click()}
            >
              {preview ? "" : "+"}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => selectAvatar(event.target.files?.[0])}
            />
            <p className="hint">
              {avatar?.name || "5MB 이하 이미지를 선택해 주세요"}
            </p>
          </div>
          <Field label="이메일" required>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              placeholder="이메일을 입력하세요"
            />
          </Field>
          <Field label="비밀번호" required>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              placeholder="비밀번호를 입력하세요"
            />
          </Field>
          <Field
            label="비밀번호 확인"
            required
            error={
              form.confirm && form.password !== form.confirm
                ? "동일한 비밀번호를 입력해 주세요"
                : ""
            }
          >
            <input
              className="input"
              type="password"
              value={form.confirm}
              onChange={(event) =>
                setForm({ ...form, confirm: event.target.value })
              }
              placeholder="비밀번호를 한번 더 입력하세요"
            />
          </Field>
          <Field
            label="닉네임"
            required
            hint="1~10자, 띄어쓰기 없이 입력해 주세요"
          >
            <input
              className="input"
              maxLength="10"
              value={form.nick}
              onChange={(event) =>
                setForm({ ...form, nick: event.target.value })
              }
              placeholder="닉네임을 입력하세요"
            />
          </Field>
          <button className="btn btn-accent form-submit" disabled={pending}>
            {pending ? "가입 중..." : "회원가입"}
          </button>
        </form>
        <button className="btn-text" onClick={() => navigate("/")}>
          로그인하러 가기
        </button>
      </div>
    </Shell>
  );
}
