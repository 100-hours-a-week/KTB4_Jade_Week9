(function () {
  const form = document.getElementById("signupForm");
  const pw = document.getElementById("password");
  const pw2 = document.getElementById("password2");
  const mismatch = document.getElementById("pwMismatch");
  const avatarUpload = document.getElementById("avatarUpload");
  const avatarFile = document.getElementById("avatarFile");
  const avatarHint = document.getElementById("avatarHint");
  let selectedAvatar = null;
  let previewUrl = null;

  avatarUpload.addEventListener("click", () => avatarFile.click());
  avatarFile.addEventListener("change", () => {
    const file = avatarFile.files && avatarFile.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      UI.toast("이미지 파일만 선택해 주세요");
      avatarFile.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      UI.toast("5MB 이하 이미지만 선택해 주세요");
      avatarFile.value = "";
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    selectedAvatar = file;
    avatarUpload.textContent = "";
    avatarUpload.style.backgroundImage = `url("${previewUrl}")`;
    avatarUpload.classList.add("has-profile-image");
    avatarHint.textContent = file.name;
  });

  pw2.addEventListener("input", () => { mismatch.hidden = true; });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = pw.value;
    const password2 = pw2.value;
    const nick = document.getElementById("nick").value.trim();

    if (!email || !password || !nick || !selectedAvatar) { UI.toast("프로필 사진을 포함한 필수 항목을 모두 입력해 줘"); return; }
    if (!FormUtils.isValidEmail(email)) { UI.toast("올바른 이메일 형식으로 입력해 줘"); return; }
    if (!FormUtils.isStrongPassword(password)) { UI.toast("비밀번호는 8자 이상, 대소문자·숫자·특수문자를 포함해야 해요"); return; }
    if (password !== password2) { mismatch.hidden = false; return; }

    const btn = form.querySelector("button[type=submit]");
    FormUtils.setSubmitState(btn, true);
    let profileImageUrl = null;
    try {
      profileImageUrl = await ProfileImages.save(selectedAvatar);
      await Api.signup({
        email, password,
        checkPassword: password2,
        nickname: nick,
        profileImageUrl,
      });
      UI.toast("가입 완료! 로그인해 줘 ⚡");
      setTimeout(() => location.href = "../../index.html", 800);
    } catch (err) {
      if (profileImageUrl) await ProfileImages.remove(profileImageUrl);
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
