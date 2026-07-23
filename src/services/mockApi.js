import { mockStore } from "./mockStore.js";
import { saveLoginStatus, clearLoginStatus } from "./loginStatusCache.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function withMyVote(game) {
  const votes = mockStore.getMyVotes();
  const likes = mockStore.getMyLikes();
  return { ...game, likes: game.likes || 0, myVote: votes[game.id] || null, liked: !!likes[game.id] };
}

/** 실서버 없이 로컬 브라우저 저장소만으로 앱을 돌려보는 가짜(mock) 백엔드. */
export const mockApi = {
  async login() {
    await wait(150);
    const user = mockStore.getUser();
    saveLoginStatus({ profileImageUrl: user.profileImageUrl || "", loggedIn: true });
    mockStore.setSession("mock-token");
    return { user };
  },

  async signup(payload) {
    await wait(150);
    const user = {
      ...mockStore.getUser(),
      email: payload.email,
      nick: payload.nickname,
      profileImageUrl: payload.profileImageUrl || "",
    };
    mockStore.saveUser(user);
    return { ok: true };
  },

  async logout() {
    mockStore.clearSession();
    clearLoginStatus();
    return true;
  },

  isLoggedIn() {
    return !!mockStore.getSession();
  },

  async listGames({ cursor = null, limit = 10 } = {}) {
    await wait(300);
    const all = mockStore.getGames();
    const start = cursor == null ? 0 : Number(cursor);
    const slice = all.slice(start, start + limit);
    const end = start + slice.length;
    return { items: slice.map(withMyVote), nextCursor: end < all.length ? String(end) : null };
  },

  async getGame(id) {
    await wait(120);
    const game = mockStore.getGames().find((g) => g.id === Number(id));
    if (!game) {
      const error = new Error("게임을 찾을 수 없어요");
      error.status = 404;
      throw error;
    }
    return { ...withMyVote(game), comments: mockStore.getComments(id) };
  },

  async createGame({ question, optionA, optionB }) {
    await wait(150);
    const games = mockStore.getGames();
    const user = mockStore.getUser();
    const id = games.reduce((max, g) => Math.max(max, g.id), 0) + 1;
    const game = {
      id, question, optionA, optionB, votesA: 0, votesB: 0, likes: 0, liked: false,
      authorId: user.id, author: user.nick, date: new Date().toISOString().slice(0, 10), myVote: null,
    };
    mockStore.saveGames([game, ...games]);
    return withMyVote(game);
  },

  async updateGame(id, { question, optionA, optionB }) {
    await wait(150);
    const next = mockStore.getGames().map((g) =>
      g.id === Number(id) ? { ...g, question, optionA, optionB } : g);
    mockStore.saveGames(next);
    return withMyVote(next.find((g) => g.id === Number(id)));
  },

  async deleteGame(id) {
    await wait(150);
    mockStore.saveGames(mockStore.getGames().filter((g) => g.id !== Number(id)));
    return true;
  },

  async vote(id, side) {
    await wait(100);
    const games = mockStore.getGames();
    const votes = mockStore.getMyVotes();
    const prevSide = votes[id] || null;
    if (prevSide === side) {
      const game = games.find((g) => g.id === Number(id));
      return { votesA: game.votesA, votesB: game.votesB, myVote: prevSide, changed: false };
    }

    const next = games.map((game) => {
      if (game.id !== Number(id)) return game;
      const updated = { ...game };
      if (prevSide === null) {
        side === "A" ? updated.votesA++ : updated.votesB++;
      } else if (side === "A") {
        updated.votesA++; updated.votesB--;
      } else {
        updated.votesB++; updated.votesA--;
      }
      return updated;
    });
    mockStore.saveGames(next);
    votes[id] = side;
    mockStore.saveMyVotes(votes);

    const game = next.find((g) => g.id === Number(id));
    return { votesA: game.votesA, votesB: game.votesB, myVote: side, changed: true, wasFirst: prevSide === null };
  },

  async toggleLike(id) {
    await wait(80);
    const games = mockStore.getGames();
    const likes = mockStore.getMyLikes();
    const liked = !likes[id];
    const next = games.map((game) =>
      game.id === Number(id) ? { ...game, likes: Math.max(0, (game.likes || 0) + (liked ? 1 : -1)) } : game);
    mockStore.saveGames(next);
    if (liked) likes[id] = true; else delete likes[id];
    mockStore.saveMyLikes(likes);
    return { liked, likes: next.find((g) => g.id === Number(id)).likes };
  },

  async getMe() {
    await wait(80);
    const user = mockStore.getUser();
    return { email: user.email, nick: user.nick, id: user.id, profileImageUrl: user.profileImageUrl || "" };
  },

  async updateMe({ nick, profileImageUrl }) {
    await wait(150);
    const user = {
      ...mockStore.getUser(),
      nick,
      profileImageUrl: profileImageUrl ?? mockStore.getUser().profileImageUrl,
    };
    mockStore.saveUser(user);
    return { nick, profileImageUrl: user.profileImageUrl };
  },

  async changePassword({ nowPassword, nextPassword, checkNextPassword }) {
    await wait(150);
    const user = mockStore.getUser();
    if (nowPassword !== user.password) {
      const error = new Error("현재 비밀번호와 다릅니다");
      error.code = "WRONG_PASSWORD";
      throw error;
    }
    if (nextPassword !== checkNextPassword) {
      const error = new Error("새 비밀번호가 일치하지 않습니다");
      error.code = "PASSWORD_MISMATCH";
      throw error;
    }
    mockStore.saveUser({ ...user, password: nextPassword });
    return true;
  },

  async withdraw() {
    mockStore.clearSession();
    clearLoginStatus();
    return true;
  },

  async getSummary() {
    await wait(80);
    return { totalVotes: mockStore.getGames().reduce((sum, g) => sum + g.votesA + g.votesB, 0) };
  },

  async addComment(id, content) {
    await wait(120);
    const user = mockStore.getUser();
    const comment = {
      id: "c" + Date.now(), content,
      author: user.nick, authorId: user.id, profileImageUrl: user.profileImageUrl || "",
      date: new Date().toISOString().slice(0, 10),
    };
    mockStore.saveComments(id, [...mockStore.getComments(id), comment]);
    return { id: comment.id };
  },

  async updateComment(id, commentId, content) {
    await wait(100);
    const next = mockStore.getComments(id).map((c) => (c.id === commentId ? { ...c, content } : c));
    mockStore.saveComments(id, next);
    return true;
  },

  async deleteComment(id, commentId) {
    await wait(100);
    mockStore.saveComments(id, mockStore.getComments(id).filter((c) => c.id !== commentId));
    return true;
  },
};
