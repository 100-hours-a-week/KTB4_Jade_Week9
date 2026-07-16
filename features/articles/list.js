(function () {
  if (!UI.requireAuth()) return;

  const PAGE_SIZE = 10;
  let cursor = null;
  let done = false;
  let loading = false;

  const host = () => document.getElementById("games");

  function cardHtml(g) {
    const t = g.votesA + g.votesB;
    const doneBadge = g.myVote ? `<span class="badge-done">반갈 완료!</span>` : "";
    return `
      <a class="game-card" href="../../detail.html?id=${g.id}">
        <div class="game-top">
          <h2 class="game-q">${UI.esc(g.question)}</h2>
          ${doneBadge}
        </div>
        <div class="vs-bar">
          <div class="side a"><span class="tag a">A</span>${UI.esc(g.optionA)}</div>
          <div class="split"></div>
          <div class="side b">${UI.esc(g.optionB)}<span class="tag b">B</span></div>
        </div>
        <div class="game-meta">
          <div class="author">
            <span class="ava" style="background:${UI.avatarBg(g.authorId)}">${UI.esc(g.author.slice(0,1))}</span>
            <span class="name">${UI.esc(g.author)}</span>
            <span class="date">· ${UI.esc(g.date)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="count">⚡ ${UI.fmt(t)}명 갈림</span>
            <span class="card-like${g.liked ? " liked" : ""}">${g.liked ? "♥" : "♡"} ${UI.fmt(g.likes || 0)}</span>
          </div>
        </div>
      </a>`;
  }

  async function loadMore() {
    if (loading || done) return;
    loading = true;
    document.getElementById("loader").hidden = false;
    try {
      const { items, nextCursor } = await Api.listGames({ cursor, limit: PAGE_SIZE });
      host().insertAdjacentHTML("beforeend", items.map(cardHtml).join(""));
      cursor = nextCursor;
      if (nextCursor == null) {
        done = true;
        window.removeEventListener("scroll", onScroll);
      }
    } catch (err) {
      UI.toast(err.message || "목록을 불러오지 못했어요");
    } finally {
      loading = false;
      document.getElementById("loader").hidden = true;
    }
  }

  function onScroll() {
    if (loading || done) return;
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 320;
    if (nearBottom) loadMore();
  }

  async function init() {
    const me = await Api.getMe();
    UI.renderHeader({ back: false, user: me });

    try {
      const { totalVotes } = await Api.getSummary();
      document.getElementById("totalVoters").textContent = UI.fmt(totalVotes);
    } catch (e) {}

    await loadMore();

    window.addEventListener("scroll", onScroll, { passive: true });
    if (document.body.offsetHeight <= window.innerHeight) loadMore();
  }

  init();
})();
