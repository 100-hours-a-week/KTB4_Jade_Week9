(function () {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    if (!email || !password) { UI.toast("이메일과 비밀번호를 입력해 줘"); return; }
    if (!FormUtils.isValidEmail(email)) { UI.toast("올바른 이메일 형식으로 입력해 줘"); return; }

    const btn = form.querySelector("button[type=submit]");
    FormUtils.setSubmitState(btn, true);
    try {
      const res = await Api.login(email, password);
      const userUuid = res && res.user && res.user.id ? res.user.id : null;
      if (userUuid) {
        UI.toast("반갈 준비 완료 ⚡");
      } else {
        UI.toast("로그인 완료! 반갈로 이동해요");
      }
      location.href = "../../list.html";
    } catch (err) {
      UI.toast(FormUtils.getErrorMessage(err, "로그인에 실패했어요"));
    } finally {
      FormUtils.setSubmitState(btn, false);
    }
  });
})();


