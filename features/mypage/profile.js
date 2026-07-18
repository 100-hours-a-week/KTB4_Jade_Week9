(function () {
  if (!UI.requireAuth()) return;

  const $ = (s) => document.getElementById(s);
  let me = null;
  let selectedAvatar = null;
  let previewUrl = null;

  async function renderAvatar(reference, fallback) {
    await ProfileImages.apply($("profileAvatarBtn"), reference, fallback);
    const tag = document.createElement("span");
    tag.className = "edit-tag";
    tag.textContent = "변경";
    $("profileAvatarBtn").appendChild(tag);
  }

  async function init() {
    me = await Api.getMe();
    UI.renderHeader({ back: "../../list.html", user: me });

    $("email").textContent = me.email;
    $("nick").value = me.nick || "";
    await renderAvatar(me.profileImageUrl, (me.nick || "?").slice(0, 1));

    $("profileForm").addEventListener("submit", onSubmit);
    $("profileAvatarBtn").addEventListener("click", () => $("avatarFile").click());
    $("avatarFile").addEventListener("change", onAvatarChange);
    $("withdrawBtn").addEventListener("click", onWithdraw);
  }

  function onAvatarChange() {
    const file = $("avatarFile").files && $("avatarFile").files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      UI.toast("이미지 파일만 선택해 주세요");
      $("avatarFile").value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      UI.toast("5MB 이하 이미지만 선택해 주세요");
      $("avatarFile").value = "";
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    selectedAvatar = file;
    $("profileAvatarBtn").textContent = "";
    $("profileAvatarBtn").style.backgroundImage = `url("${previewUrl}")`;
    $("profileAvatarBtn").classList.add("has-profile-image");
    const tag = document.createElement("span");
    tag.className = "edit-tag";
    tag.textContent = "변경";
    $("profileAvatarBtn").appendChild(tag);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const nick = $("nick").value.trim();
    const btn = $("profileForm").querySelector("button[type=submit]");
    btn.disabled = true;
    let nextProfileImageUrl = null;
    try {
      if (selectedAvatar) nextProfileImageUrl = await ProfileImages.save(selectedAvatar);
      await Api.updateMe({
        nick,
        profileImageUrl: nextProfileImageUrl == null ? undefined : nextProfileImageUrl,
      });
      if (nextProfileImageUrl && ProfileImages.isLocal(me.profileImageUrl)) {
        await ProfileImages.remove(me.profileImageUrl);
      }
      UI.toast("회원정보 수정 완료");
      setTimeout(() => location.href = "../../list.html", 500);
    } catch (err) {
      if (nextProfileImageUrl) await ProfileImages.remove(nextProfileImageUrl);
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
