(function () {
  if (!UI.requireAuth()) return;

  const $ = (s) => document.getElementById(s);

  async function init() {
    const me = await Api.getMe();
    UI.renderHeader({ back: "../../list.html", user: me });

    $("current").addEventListener("input", () => { $("curError").hidden = true; });
    $("confirm").addEventListener("input", () => { $("confirmError").hidden = true; });
    $("newPw").addEventListener("input", () => {
      $("confirmError").hidden = true;
      if (!FormUtils.isStrongPassword($("newPw").value)) {
        FormUtils.setHelper($("newPw").nextElementSibling, "8자 이상, 대소문자·숫자·특수문자 포함", true);
      } else {
        FormUtils.setHelper($("newPw").nextElementSibling, "", false);
      }
    });

    $("pwForm").addEventListener("submit", onSubmit);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const current = $("current").value;
    const newPw = $("newPw").value;
    const confirm = $("confirm").value;

    $("curError").hidden = true;
    $("confirmError").hidden = true;

    if (!current || !newPw) { UI.toast("모든 항목을 입력해 줘"); return; }
    if (newPw !== confirm) { $("confirmError").hidden = false; return; }

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      await Api.changePassword({
        nowPassword: current,
        nextPassword: newPw,
        checkNextPassword: confirm,
      });
      UI.toast("비밀번호 수정 완료");
      setTimeout(() => location.href = "../../list.html", 500);
    } catch (err) {
      if (err.code === "WRONG_PASSWORD" || err.serverCode === "WRONG_PASSWORD") $("curError").hidden = false;
      else UI.toast(err.message || "수정에 실패했어요");
      btn.disabled = false;
    }
  }

  init();
})();
