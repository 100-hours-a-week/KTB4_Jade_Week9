import { useCallback, useEffect, useRef, useState } from "react";
import {
   Link } from "react-router-dom";
import { api } from "../../services/api.js";
import Heart from "../../shared/components/Heart.jsx";
import Loading from "../../shared/components/Loading.jsx";
import Shell from "../../shared/components/Shell.jsx";
import Avatar from "../../shared/components/Avatar.jsx";
import { toast } from "../../shared/components/Toast.jsx";
import useCurrentUser from "../../shared/hooks/useCurrentUser.js";
import {
  formatNumber,
  getAvatarBackground,
} from "../../shared/utils.js";

export default function GamesPage() {
  const { loading: userLoading, user } = useCurrentUser();
  const [games, setGames] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const firstLoad = useRef(false);

  const loadMore = useCallback(async () => {
    if (loading || done) return;

    setLoading(true);
    try {
      const result = await api.listGames({ cursor, limit: 10 });
      setGames((current) => [...current, ...result.items]);
      setCursor(result.nextCursor);
      setDone(result.nextCursor == null);
    } catch (error) {
      toast(error.message || "목록을 불러오지 못했어요");
    } finally {
      setLoading(false);
    }
  }, [cursor, done, loading]);

  useEffect(() => {
    api
      .getSummary()
      .then(({ totalVotes: total }) => setTotalVotes(total))
      .catch(() => {});

    if (!firstLoad.current) {
      firstLoad.current = true;
      loadMore();
    }
  }, [loadMore]);

  useEffect(() => {
    const onScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 320;
      if (nearBottom) loadMore();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [loadMore]);

  if (userLoading) return <Loading />;

  return (
    <Shell header user={user}>
      <div className="wrap">
        <div className="list-hero">
          <div className="pill">
            <span className="dot" /> 지금 {formatNumber(totalVotes)}명이 반틈
            가르는 중
          </div>
          <h1>
            세상 모든 고민,
            <br />
            <span className="a">반</span>
            <span className="b">틈</span>에 물어봐
          </h1>
          <p>못 정하겠으면 일단 던져. 다들 어느 쪽인지 보여줄게.</p>
          <Link className="btn btn-primary create-link" to="/games/new">
            ⚔️ 반틈 갈라보기
          </Link>
        </div>
        <div className="games">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
        {loading && (
          <div className="load-more">
            <span className="spinner" /> 더 많은 반틈 불러오는 중...
          </div>
        )}
      </div>
    </Shell>
  );
}

function GameCard({ game }) {
  const total = game.votesA + game.votesB;

  return (
    <Link className="game-card" to={`/games/${game.id}`}>
      <div className="game-top">
        <h2 className="game-q">{game.question}</h2>
        {game.myVote && <span className="badge-done">골랐어요!</span>}
      </div>
      <div className="vs-bar">
        <div className="side a">
          <span className="tag a">A</span>
          {game.optionA}
        </div>
        <div className="split" />
        <div className="side b">
          {game.optionB}
          <span className="tag b">B</span>
        </div>
      </div>
      <div className="game-meta">
        <div className="author">
          <Avatar
            reference={game.profileImageUrl}
            fallback={game.author.slice(0, 1)}
            style={{ backgroundColor: getAvatarBackground(game.authorId) }}
          />
          <span className="name">{game.author}</span>
          <span className="date">· {game.date}</span>
        </div>
        <div className="card-stats">
          <span className="count">⚡ {formatNumber(total)}명 참전</span>
          <span className={`card-like${game.liked ? " liked" : ""}`}>
            <span className="heart"><Heart filled={game.liked} /></span>{" "}
            {formatNumber(game.likes)}
          </span>
        </div>
      </div>
    </Link>
  );
}
