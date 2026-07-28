import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../services/api.js";
import Field from "../../shared/components/Field.jsx";
import Loading from "../../shared/components/Loading.jsx";
import Modal from "../../shared/components/Modal.jsx";
import Shell from "../../shared/components/Shell.jsx";
import { toast } from "../../shared/toast.js";
import useCurrentUser from "../../shared/hooks/useCurrentUser.js";

export default function GameFormPage({ edit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, user } = useCurrentUser();
  const [form, setForm] = useState({
    question: "",
    optionA: "",
    optionB: "",
  });
  const [gameLoaded, setGameLoaded] = useState(!edit);
  const [pending, setPending] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    // 회원 정보를 못 읽었으면 불러올 수 없다. 세션 처리에 맡기고 여기선 아무것도 하지 않는다.
    if (!edit || !user) return undefined;

    let active = true;
    api
      .getGame(id)
      .then((game) => {
        if (!active) return;
        if (!game.isMine) {
          toast("작성자만 수정할 수 있어요");
          navigate(`/games/${id}`, { replace: true });
          return;
        }
        setForm({
          question: game.question,
          optionA: game.optionA,
          optionB: game.optionB,
        });
      })
      .catch(() => {
        if (active) navigate("/games", { replace: true });
      })
      .finally(() => {
        if (active) setGameLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [edit, id, navigate, user]);

  const submit = async (event) => {
    event.preventDefault();

    const payload = {
      question: form.question.trim(),
      optionA: form.optionA.trim(),
      optionB: form.optionB.trim(),
    };

    if (!payload.question || !payload.optionA || !payload.optionB) {
      toast("질문과 두 선택지를 모두 입력해 줘");
      return;
    }
    if (payload.optionA === payload.optionB) {
      toast("두 선택지가 같으면 반틈이 안 갈려");
      return;
    }

    setPending(true);
    try {
      const game = edit
        ? await api.updateGame(id, payload)
        : await api.createGame(payload);
      toast(edit ? "반틈을 수정했다" : "새 반틈 등판! 🔪");
      // 서버가 id를 안 돌려주면 상세로 갈 수 없으니 목록으로 보낸다.
      navigate(game.id ? `/games/${game.id}` : "/games", { replace: true });
    } catch (error) {
      toast(error.message || "저장에 실패했어요");
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    setDeleteModalOpen(false);
    setPending(true);
    try {
      await api.deleteGame(id);
      toast("반틈 삭제 완료");
      navigate("/games", { replace: true });
    } catch (error) {
      toast(error.message || "삭제에 실패했어요");
      setPending(false);
    }
  };

  if (loading || (edit && user && !gameLoaded)) return <Loading />;

  return (
    <Shell header back={edit ? `/games/${id}` : "/games"} user={user}>
      <div className="wrap-form">
        <h1 className="page-title">{edit ? "반틈 수정" : "반틈 만들기"}</h1>
        <p className="page-sub">세상을 딱 반틈으로 가를 질문을 던져봐</p>
        <form
          className="card form-stack form-stack-wide"
          onSubmit={submit}
        >
          <Field
            label="질문"
            required
            hint="최대 26자, 잔인할수록 잘 반틈"
          >
            <textarea
              className="textarea"
              rows="2"
              maxLength="26"
              value={form.question}
              onChange={(event) =>
                setForm({ ...form, question: event.target.value })
              }
              placeholder="예) 평생 라면 금지 vs 평생 김치 금지"
            />
          </Field>
          <div className="vs-inputs">
            <OptionInput
              side="A"
              value={form.optionA}
              onChange={(optionA) => setForm({ ...form, optionA })}
            />
            <OptionInput
              side="B"
              value={form.optionB}
              onChange={(optionB) => setForm({ ...form, optionB })}
            />
          </div>
          <button className="btn btn-primary" disabled={pending}>
            {pending
              ? "저장 중..."
              : edit
                ? "수정하기"
                : "반틈 던지기 ⚡"}
          </button>
        </form>
        {edit && (
          <button
            type="button"
            className="link-danger"
            disabled={pending}
            onClick={() => setDeleteModalOpen(true)}
          >
            이 반틈 삭제하기
          </button>
        )}
      </div>
      {deleteModalOpen && (
        <Modal
          title="게시글을 삭제하시겠습니까?"
          text="삭제한 내용은 복구할 수 없습니다."
          cancel="취소"
          confirm="확인"
          onCancel={() => setDeleteModalOpen(false)}
          onConfirm={remove}
        />
      )}
    </Shell>
  );
}

function OptionInput({ side, value, onChange }) {
  const sideClass = side.toLowerCase();

  return (
    <div className={`opt-box ${sideClass}`}>
      <label>
        <span className={`tag ${sideClass}`}>{side}</span>
        선택지 {side} <span className="req">*</span>
      </label>
      <input
        className="input"
        maxLength="15"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`${side === "A" ? "첫" : "두"} 번째 선택지를 입력하세요`}
      />
    </div>
  );
}
