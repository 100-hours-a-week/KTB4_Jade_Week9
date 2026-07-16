(function () {
  if (!UI.requireAuth()) return;

  const id = UI.param("id");
  const isEdit = !!id;
  let me = null;
  let game = null;

  const $ = (s) => document.getElementById(s);

  async function init() {
    me = await Api.getMe();
    UI.renderHeader({ back: isEdit ? "../../detail.html?id=" + id : "../../list.html", user: me });

    if (isEdit) {
      $("formTitle").textContent = "반갈 수정";
      $("submitBtn").textContent = "수정하기";
      $("deleteBtn").hidden = false;
      try {
        game = await Api.getGame(id);
      } catch (err) {
        UI.toast("게임을 찾을 수 없어요");
        setTimeout(() => location.href = "../../list.html", 600);
        return;
      }
      if (game.authorId !== me.id) {
        UI.toast("작성자만 수정할 수 있어요");
        setTimeout(() => location.href = "../../detail.html?id=" + id, 600);
        return;
      }
      $("question").value = game.question;
      $("optionA").value = game.optionA;
      $("optionB").value = game.optionB;
    }

    $("gameForm").addEventListener("submit", onSubmit);
    $("deleteBtn").addEventListener("click", onDelete);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const question = $("question").value.trim();
    const optionA = $("optionA").value.trim();
    const optionB = $("optionB").value.trim();
    const errors = FormUtils.validateArticleForm({ question, optionA, optionB });

    if (Object.keys(errors).length) {
      UI.toast("질문과 두 선택지를 모두 입력해 줘");
      return;
    }

    const btn = $("submitBtn");
    FormUtils.setSubmitState(btn, true);
    try {
      if (isEdit) {
        const g = await Api.updateGame(id, { question, optionA, optionB });
        UI.toast("반갈을 수정했다");
        setTimeout(() => location.href = "../../detail.html?id=" + g.id, 500);
      } else {
        const g = await Api.createGame({ question, optionA, optionB });
        UI.toast("새 반갈 등판! 🔪");
        setTimeout(() => location.href = "../../detail.html?id=" + g.id, 500);
      }
    } catch (err) {
      const msg = FormUtils.getErrorMessage(err, "저장에 실패했어요");
        if (!isEdit && err && err.status === 400) {
          UI.toast("해당 기능은 서버에서 아직 구현 중입니다");
        } else {
          const isNotImplemented = (err && (err.serverCode === "NOT_IMPLEMENTED" || (err.status === 400 && /option|A\/B|선택지|optionA|optionB/i.test(msg)) || (err.fields && (err.fields.optionA || err.fields.optionB))));
          if (isNotImplemented) {
            UI.toast("해당 기능은 서버에서 아직 구현 중입니다");
          } else {
            UI.toast(msg);
          }
        }
    } finally {
      FormUtils.setSubmitState(btn, false);
    }
  }

  async function onDelete() {
    if (!isEdit) return;
    try {
      await Api.deleteGame(id);
      UI.toast("반갈 삭제 완료");
      setTimeout(() => location.href = "../../list.html", 400);
    } catch (err) {
      UI.toast(err.message || "삭제에 실패했어요");
    }
  }

  init();
})();
