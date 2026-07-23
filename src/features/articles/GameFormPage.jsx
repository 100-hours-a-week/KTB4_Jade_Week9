import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../services/api.js";
import Field from "../../shared/components/Field.jsx";
import Loading from "../../shared/components/Loading.jsx";
import Shell from "../../shared/components/Shell.jsx";
import { toast } from "../../shared/components/Toast.jsx";
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
  const [pending, setPending] = useState(edit);

  useEffect(() => {
    if (!edit || !user) return;

    api
      .getGame(id)
      .then((game) => {
        if (game.authorId !== user.id) {
          toast("작성자만 수정할 수 있어요");
          navigate(`/games/${id}`, { replace: true });
          return;
        }
        setForm({
          question: game.question,
          optionA: game.optionA,
          optionB: game.optionB,
        });
        setPending(false);
      })
      .catch(() => navigate("/games", { replace: true }));
  }, [edit, id, navigate, user]);

  const submit = async (event) => {
    event.preventDefault();

    if (!form.question.trim() || !form.optionA.trim() || !form.optionB.trim()) {
      toast("질문과 두 선택지를 모두 입력해 줘");
      return;
    }

    setPending(true);
    try {
      const game = edit
        ? await api.updateGame(id, form)
        : await api.createGame(form);
      toast(edit ? "반틈을 수정했다" : "새 반틈 등판! 🔪");
      navigate(`/games/${game.id}`, { replace: true });
    } catch (error) {
      toast(error.message || "저장에 실패했어요");
    } finally {
      setPending(false);
    }
  };

  if (loading) return <Loading />;

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
            hint="최대 40자, 잔인할수록 잘 반틈"
          >
            <textarea
              className="textarea"
              rows="2"
              maxLength="40"
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
      </div>
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`${side === "A" ? "첫" : "두"} 번째 선택지를 입력하세요`}
      />
    </div>
  );
}
