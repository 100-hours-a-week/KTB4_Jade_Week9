(function () {
  function avatarBg(id) {
    if (id === "me") return "#111111";
    let h = 0;
    for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 360;
    return "oklch(0.55 0.17 " + h + ")";
  }

  function fmt(n) { return Number(n).toLocaleString(); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function param(name) { return new URLSearchParams(location.search).get(name); }

  let toastTimer = null;
  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }

  function requireAuth() {
    if (!window.Api.isLoggedIn()) {
      location.replace("index.html");
      return false;
    }
    return true;
  }

  function renderHeader(opts) {
    opts = opts || {};
    const host = document.getElementById("header");
    if (!host) return;
    const initial = (opts.user && opts.user.nick ? opts.user.nick : "?").slice(0, 1);

    const backHtml = opts.back
      ? `<a class="back-btn" href="${typeof opts.back === "string" ? opts.back : "list.html"}" aria-label="뒤로">←</a>`
      : "";

    host.innerHTML = `
      <div class="hd-inner">
        <div class="hd-left">
          ${backHtml}
          <a class="brand" href="list.html">
            <span class="brand-mark"></span>
            <span class="brand-name"><b>반갈</b><small>BAN-GAL</small></span>
          </a>
        </div>
        <div class="menu-anchor">
          <button class="avatar-btn" id="avatarBtn" aria-label="메뉴">${esc(initial)}</button>
          <div class="menu" id="userMenu" hidden>
            <button data-go="profile.html">회원정보 수정</button>
            <button data-go="password.html">비밀번호 수정</button>
            <button class="danger" id="logoutBtn">로그아웃</button>
          </div>
        </div>
      </div>`;

    window.ProfileImages.apply(host.querySelector("#avatarBtn"), opts.user && opts.user.profileImageUrl, initial);

    const menu = host.querySelector("#userMenu");
    host.querySelector("#avatarBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
    });
    document.addEventListener("click", () => { menu.hidden = true; });
    menu.addEventListener("click", (e) => e.stopPropagation());
    menu.querySelectorAll("[data-go]").forEach((b) =>
      b.addEventListener("click", () => { location.href = b.dataset.go; })
    );
    host.querySelector("#logoutBtn").addEventListener("click", async () => {
      await window.Api.logout();
      toast("로그아웃 완료");
      setTimeout(() => location.href = "index.html", 400);
    });
  }

  window.UI = { avatarBg, fmt, esc, param, toast, requireAuth, renderHeader };
})();
