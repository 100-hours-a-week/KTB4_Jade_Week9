(function () {
  if (!UI.requireAuth()) return;

  const $ = (s) => document.getElementById(s);

  async function init() {
    const me = await Api.getMe();
    UI.renderHeader({ back: "../../list.html", user: me });

    $("email").textContent = me.email;
    $("nick").value = me.nick || "";

    $("profileForm").addEventListener("submit", onSubmit);
    $("withdrawBtn").addEventListener("click", onWithdraw);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const nick = $("nick").value.trim();
    const btn = $("profileForm").querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      await Api.updateMe({ nick, profileImageUrl: "" });
      UI.toast("회원정보 수정 완료");
      setTimeout(() => location.href = "../../list.html", 500);
    } catch (err) {
      UI.toast(err.message || "수정에 실패했어요");
      btn.disabled = false;
    }
  }

  async function onWithdraw() {
    try {
      await Api.withdraw();
      UI.toast("탈퇴 완료");
      setTimeout(() => location.href = "../../index.html", 500);
    } catch (err) {
      UI.toast(err.message || "탈퇴에 실패했어요");
    }
  }

  init();
})();
