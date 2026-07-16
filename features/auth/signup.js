(function () {
  const form = document.getElementById("signupForm");
  const pw = document.getElementById("password");
  const pw2 = document.getElementById("password2");
  const mismatch = document.getElementById("pwMismatch");

  const DEFAULT_PROFILE_URL = "https://api.dicebear.com/9.x/thumbs/svg?seed=bangal";

  document.getElementById("avatarUpload").addEventListener("click", () =>
    UI.toast("프로필 업로드 API가 아직 없어요 (가이드 C)")
  );

  pw2.addEventListener("input", () => { mismatch.hidden = true; });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = pw.value;
    const password2 = pw2.value;
    const nick = document.getElementById("nick").value.trim();

    if (!email || !password || !nick) { UI.toast("필수 항목을 모두 입력해 줘"); return; }
    if (!FormUtils.isValidEmail(email)) { UI.toast("올바른 이메일 형식으로 입력해 줘"); return; }
    if (!FormUtils.isStrongPassword(password)) { UI.toast("비밀번호는 8자 이상, 대소문자·숫자·특수문자를 포함해야 해요"); return; }
    if (password !== password2) { mismatch.hidden = false; return; }

    const btn = form.querySelector("button[type=submit]");
    FormUtils.setSubmitState(btn, true);
    try {
      await Api.signup({
        email, password,
        checkPassword: password2,
        nickname: nick,
        profileImageUrl: DEFAULT_PROFILE_URL,
      });
      UI.toast("가입 완료! 로그인해 줘 ⚡");
      setTimeout(() => location.href = "../../index.html", 800);
    } catch (err) {
      const message = FormUtils.getErrorMessage(err, "회원가입에 실패했어요");
      if (err && err.fields && typeof err.fields === "object") {
        const first = Object.values(err.fields)[0];
        UI.toast(first || message);
      } else {
        UI.toast(message);
      }
    } finally {
      FormUtils.setSubmitState(btn, false);
    }
  });
})();
