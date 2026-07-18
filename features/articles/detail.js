(function () {
  if (!UI.requireAuth()) return;

  const id = UI.param("id");
  let me = null;
  let game = null;
  let isLiked = false;
  let isLikePending = false;
  let isVotePending = false;

  const $ = (s) => document.getElementById(s);

  function render() {
    const total = game.votesA + game.votesB;
    const pctA = total ? Math.round((game.votesA / total) * 100) : 50;
    const pctB = total ? 100 - pctA : 50;
    const voted = !!game.myVote;
    const showResult = voted || total > 0;

    $("dQuestion").textContent = game.question;
    $("dAuthor").textContent = game.author;
    $("dDate").textContent = "· " + game.date;
    const ava = $("dAva");
    ava.textContent = game.author.slice(0, 1);
    ava.style.background = UI.avatarBg(game.authorId);

    $("optA").textContent = game.optionA;
    $("optB").textContent = game.optionB;

    $("labelA").textContent = "A" + (game.myVote === "A" ? " · 내 선택 ✓" : "");
    $("labelB").textContent = (game.myVote === "B" ? "✓ 내 선택 · " : "") + "B";
    $("sideA").classList.toggle("picked", game.myVote === "A");
    $("sideB").classList.toggle("picked", game.myVote === "B");

    $("resultA").hidden = !showResult;
    $("resultB").hidden = !showResult;
    $("pctA").textContent = pctA + "%";
    $("pctB").textContent = pctB + "%";
    $("votesA").textContent = UI.fmt(game.votesA) + "표";
    $("votesB").textContent = UI.fmt(game.votesB) + "표";
    $("sideA").style.flexGrow = showResult ? Math.max(pctA, 18) : 50;
    $("sideB").style.flexGrow = showResult ? Math.max(pctB, 18) : 50;

    $("statTotal").textContent = UI.fmt(total);

    $("voteHint").textContent = voted
      ? "마음 바뀌면 반대쪽으로 갈아타도 됨"
      : "눌러서 한 표. 1인 1갈";

    $("likeCount").textContent = UI.fmt(game.likes || 0);
    $("likeHeart").textContent = isLiked ? "♥" : "♡";
    $("likeBtn").classList.toggle("liked", !!isLiked);

    const isOwner = me && game.authorId === me.id;
    $("ownerActions").hidden = !isOwner;
    if (isOwner) $("editBtn").href = "../../edit.html?id=" + game.id;
  }

  async function doVote(side) {
    if (isVotePending) return;
    isVotePending = true;
    const prev = { votesA: game.votesA, votesB: game.votesB, myVote: game.myVote };
    try {
      if (game.myVote === side) {
      } else if (game.myVote == null) {
        if (side === "A") game.votesA++;
        else game.votesB++;
        game.myVote = side;
      } else {
        if (side === "A") { game.votesA++; game.votesB = Math.max(0, game.votesB - 1); }
        else { game.votesB++; game.votesA = Math.max(0, game.votesA - 1); }
        game.myVote = side;
      }
      render();

      const res = await Api.vote(game.id, side);
      if (res && typeof res.votesA === "number") game.votesA = res.votesA;
      if (res && typeof res.votesB === "number") game.votesB = res.votesB;
      if (res && res.myVote !== undefined) game.myVote = res.myVote;
      render();

      if (res && res.changed === false) UI.toast("이미 " + side + "쪽으로 갈랐잖아");
      else if (res && res.wasFirst) UI.toast(side + "로 반갈! ⚡");
      else UI.toast(side + "로 갈아탔다");
    } catch (err) {
      game.votesA = prev.votesA; game.votesB = prev.votesB; game.myVote = prev.myVote;
      render();
      UI.toast(err.message || "투표에 실패했어요");
    } finally {
      isVotePending = false;
    }
  }

  async function toggleLike() {
    if (isLikePending) return;
    isLikePending = true;
    const btn = $("likeBtn");
    FormUtils.setSubmitState(btn, true);
    try {
      const res = await Api.toggleLike(game.id, isLiked);
      game.likes = res.likes;
      isLiked = !!res.liked;
      render();

      btn.classList.remove("pop");
      void btn.offsetWidth;
      btn.classList.add("pop");
      setTimeout(() => btn.classList.remove("pop"), 200);
      UI.toast(res.liked ? "좋아요! ♥" : "좋아요 취소~ ♡");
    } catch (err) {
      UI.toast(FormUtils.getErrorMessage(err, "좋아요에 실패했어요"));
    } finally {
      isLikePending = false;
      FormUtils.setSubmitState(btn, false);
    }
  }

  function openDelete() { $("deleteModal").hidden = false; }
  function closeDelete() { $("deleteModal").hidden = true; }
  async function confirmDelete() {
    try {
      await Api.deleteGame(game.id);
      UI.toast("반갈 삭제 완료");
      setTimeout(() => location.href = "../../list.html", 400);
    } catch (err) {
      UI.toast(err.message || "삭제에 실패했어요");
      closeDelete();
    }
  }

  async function init() {
    me = await Api.getMe();
    UI.renderHeader({ back: "../../list.html", user: me });

    if (!id) { location.replace("../../list.html"); return; }
    try {
      game = await Api.getGame(id);
      isLiked = !!game.liked;
    } catch (err) {
      UI.toast("게임을 찾을 수 없어요");
      setTimeout(() => location.href = "../../list.html", 600);
      return;
    }

    $("detail").hidden = false;
    render();

    $("sideA").addEventListener("click", () => doVote("A"));
    $("sideB").addEventListener("click", () => doVote("B"));
    $("likeBtn").addEventListener("click", toggleLike);
    $("deleteBtn").addEventListener("click", openDelete);
    $("deleteCancel").addEventListener("click", closeDelete);
    $("deleteConfirm").addEventListener("click", confirmDelete);
    $("deleteModal").addEventListener("click", (e) => {
      if (e.target === $("deleteModal")) closeDelete();
    });
  }

  init();
})();
