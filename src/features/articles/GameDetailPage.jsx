import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../services/api.js";
import Avatar from "../../shared/components/Avatar.jsx";
import Heart from "../../shared/components/Heart.jsx";
import Loading from "../../shared/components/Loading.jsx";
import Modal from "../../shared/components/Modal.jsx";
import Shell from "../../shared/components/Shell.jsx";
import { toast } from "../../shared/toast.js";
import useCurrentUser from "../../shared/hooks/useCurrentUser.js";
import {
  formatNumber,
  getAvatarBackground,
  toLocalDate,
} from "../../shared/utils.js";

export default function GameDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading: userLoading, user } = useCurrentUser();
  const [game, setGame] = useState(null);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentDeleteTargetId, setCommentDeleteTargetId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentPending, setCommentPending] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    let active = true;

    api
      .getGame(id)
      .then((result) => {
        if (!active) return;
        setGame(result);
        setLiked(Boolean(result.liked));
        setComments(result.comments || []);
      })
      .catch(() => {
        if (!active) return;
        toast("게임을 찾을 수 없어요");
        navigate("/games", { replace: true });
      });

    return () => {
      active = false;
    };
  }, [id, navigate]);

  if (userLoading || !game) return <Loading />;

  const total = game.votesA + game.votesB;
  const percentA = total ? Math.round((game.votesA / total) * 100) : 50;
  const percentB = 100 - percentA;
  const isOwner = game.isMine;

  const vote = async (side) => {
    if (pending) return;

    const previousVote = game.myVote;
    setPending(true);
    try {
      const result = await api.vote(id, side);
      setGame((current) => ({
        ...current,
        votesA: result.votesA,
        votesB: result.votesB,
        myVote: result.myVote,
      }));
      toast(
        result.changed === false
          ? `이미 ${side}쪽으로 갈랐잖아`
          : previousVote
            ? `${side}로 갈아탔다`
            : `${side}로 반틈! ⚡`,
      );
    } catch (error) {
      toast(error.message || "투표에 실패했어요");
    } finally {
      setPending(false);
    }
  };

  const toggleLike = async () => {
    if (pending) return;

    setPending(true);
    try {
      const result = await api.toggleLike(id, liked);
      setLiked(result.liked);
      setGame((current) => ({ ...current, likes: result.likes }));
      toast(result.liked ? "좋아요! ♥" : "좋아요 취소~ ♡");
    } catch (error) {
      toast(error.message || "좋아요에 실패했어요");
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    try {
      await api.deleteGame(id);
      toast("반틈 삭제 완료");
      navigate("/games", { replace: true });
    } catch (error) {
      toast(error.message || "삭제에 실패했어요");
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    const content = commentText.trim();
    if (!content || commentPending) return;
    if (!user) {
      toast("로그인 정보를 확인할 수 없어요");
      return;
    }

    setCommentPending(true);
    try {
      const created = await api.addComment(id, content);
      if (created.id) {
        setComments((current) => [
          {
            id: created.id,
            content,
            author: user.nick,
            isMine: true,
            profileImageUrl: user.profileImageUrl,
            date: toLocalDate(new Date().toISOString()),
          },
          ...current,
        ]);
      } else {
        // 서버가 id를 안 주면 수정·삭제를 걸 수 없다. 목록을 다시 읽어 실제 값으로 맞춘다.
        const refreshed = await api.getGame(id);
        setComments(refreshed.comments || []);
      }
      setCommentText("");
      toast("댓글 등록 완료");
    } catch (error) {
      toast(error.message || "댓글 등록에 실패했어요");
    } finally {
      setCommentPending(false);
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.content);
  };

  const submitEditComment = async (commentId) => {
    const content = editingText.trim();
    if (!content) return;

    try {
      await api.updateComment(id, commentId, content);
      setComments((current) =>
        current.map((c) => (c.id === commentId ? { ...c, content } : c)),
      );
      setEditingCommentId(null);
      toast("댓글을 수정했어요");
    } catch (error) {
      toast(error.message || "댓글 수정에 실패했어요");
    }
  };

  const removeComment = async (commentId) => {
    try {
      await api.deleteComment(id, commentId);
      setComments((current) => current.filter((c) => c.id !== commentId));
      toast("댓글을 삭제했어요");
    } catch (error) {
      toast(error.message || "댓글 삭제에 실패했어요");
    }
  };

  return (
    <Shell header back="/games" user={user}>
      <div className="wrap">
        <h1 className="detail-title">{game.question}</h1>
        <div className="detail-meta">
          <div className="author">
            <Avatar
              reference={game.profileImageUrl}
              fallback={game.author.slice(0, 1)}
              style={{ backgroundColor: getAvatarBackground(game.author) }}
            />
            <span className="name">{game.author}</span>
            <span className="date">· {game.date}</span>
          </div>
          {isOwner && (
            <div className="owner-actions">
              <Link className="mini-btn" to={`/games/${id}/edit`}>
                수정
              </Link>
              <button
                className="mini-btn del"
                onClick={() => setDeleteModalOpen(true)}
              >
                삭제
              </button>
            </div>
          )}
        </div>
        <div className="arena">
          <div className="arena-row">
            <VoteSide
              side="A"
              option={game.optionA}
              picked={game.myVote === "A"}
              votes={game.votesA}
              percent={percentA}
              showResult={Boolean(game.myVote) || total > 0}
              onClick={() => vote("A")}
            />
            <VoteSide
              side="B"
              option={game.optionB}
              picked={game.myVote === "B"}
              votes={game.votesB}
              percent={percentB}
              showResult={Boolean(game.myVote) || total > 0}
              onClick={() => vote("B")}
            />
          </div>
        </div>
        <p className="vote-hint">
          {game.myVote
            ? "마음 바뀌면 반대쪽으로 갈아타도 됨"
            : "눌러서 한 표. 1인 1반틈"}
        </p>
        <div className="detail-actions">
          <button
            className={`like-big${liked ? " liked" : ""}`}
            onClick={toggleLike}
          >
            <span className="heart"><Heart filled={liked} /></span>
            {formatNumber(game.likes)}
          </button>
          <div className="total-big">
            <span className="lbl">참전 인원</span>
            <span className="num">{formatNumber(total)}</span>
          </div>
        </div>
        <div className="comment-section">
          <h2 className="comment-title">댓글 {formatNumber(comments.length)}</h2>
          <form className="comment-form" onSubmit={submitComment}>
            <textarea
              className="textarea"
              rows="2"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="댓글을 남겨주세요!"
            />
            <div className="comment-divider" />
            <div className="comment-form-actions">
              <button className="btn btn-accent" disabled={commentPending}>
                댓글 등록
              </button>
            </div>
          </form>
          {comments.length === 0 && (
            <p className="comment-empty">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</p>
          )}
          <ul className="comment-list">
            {comments.map((comment) => (
              <li className="comment-item" key={comment.id}>
                <Avatar
                  reference={comment.profileImageUrl}
                  fallback={comment.author.slice(0, 1)}
                  style={{ backgroundColor: getAvatarBackground(comment.author) }}
                />
                <div className="comment-body">
                  <div className="comment-meta">
                    <span className="name">{comment.author}</span>
                    <span className="date">· {comment.date}</span>
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="comment-edit">
                      <textarea
                        className="textarea"
                        rows="2"
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                      />
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() => submitEditComment(comment.id)}
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() => setEditingCommentId(null)}
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <p className="comment-content">{comment.content}</p>
                  )}
                </div>
                {comment.isMine && editingCommentId !== comment.id && (
                  <div className="comment-actions">
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() => startEditComment(comment)}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="mini-btn del"
                      onClick={() => setCommentDeleteTargetId(comment.id)}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
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
      {commentDeleteTargetId !== null && (
        <Modal
          title="댓글을 삭제하시겠습니까?"
          text="삭제한 내용은 복구할 수 없습니다."
          cancel="취소"
          confirm="확인"
          onCancel={() => setCommentDeleteTargetId(null)}
          onConfirm={() => {
            removeComment(commentDeleteTargetId);
            setCommentDeleteTargetId(null);
          }}
        />
      )}
    </Shell>
  );
}

function VoteSide({
  side,
  option,
  picked,
  votes,
  percent,
  showResult,
  onClick,
}) {
  const label =
    side === "A"
      ? `A${picked ? " · 내 선택 ✓" : ""}`
      : `${picked ? "✓ 내 선택 · " : ""}B`;

  return (
    <button
      className={`vote-side ${side.toLowerCase()}${picked ? " picked" : ""}`}
      style={{ flexGrow: showResult ? Math.max(percent, 18) : 50 }}
      onClick={onClick}
    >
      <div className="tag-lbl">{label}</div>
      <div className="opt">{option}</div>
      <div className={`result${showResult ? " show" : ""}`} aria-hidden={!showResult}>
        <div className="pct">{percent}%</div>
        <div className="votes">{formatNumber(votes)}표</div>
      </div>
    </button>
  );
}
