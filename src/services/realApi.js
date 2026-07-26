import { toLocalDate } from "../shared/utils.js";
import { http } from "./httpClient.js";
import { saveLoginStatus, readLoginStatus, clearLoginStatus } from "./loginStatusCache.js";

const UNKNOWN_AUTHOR = "알 수 없음";

function toCount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toSide(value) {
  if (value == null) return null;
  const side = String(value).trim().toUpperCase();
  return side === "A" || side === "B" ? side : null;
}

function toAuthor(writer) {
  const name = typeof writer === "string" ? writer.trim() : "";
  return name || UNKNOWN_AUTHOR;
}

function mapSummary(article) {
  return {
    id: article.articleUuid,
    question: article.title,
    optionA: article.optionA || "",
    optionB: article.optionB || "",
    votesA: toCount(article.voteCountA),
    votesB: toCount(article.voteCountB),
    myVote: toSide(article.myVote),
    likes: toCount(article.likeCount),
    liked: !!article.isLiked,
    author: toAuthor(article.writer),
    isMine: !!article.isMine,
    profileImageUrl: article.profileImageUrl,
    date: toLocalDate(article.createdAt),
  };
}

function mapComment(comment) {
  return {
    id: comment.commentUuid, content: comment.content,
    author: toAuthor(comment.writer), isMine: !!comment.isMine, profileImageUrl: comment.profileImageUrl,
    date: toLocalDate(comment.createdAt),
  };
}

function mapDetail(article, uuid) {
  return {
    id: uuid,
    question: article.title,
    optionA: article.optionA || "",
    optionB: article.optionB || "",
    votesA: toCount(article.voteCountA),
    votesB: toCount(article.voteCountB),
    myVote: toSide(article.myVote),
    likes: toCount(article.likeCount),
    liked: !!article.isLiked,
    author: toAuthor(article.writer),
    isMine: !!article.isMine,
    profileImageUrl: article.profileImageUrl,
    date: toLocalDate(article.createdAt),
    comments: (article.comments || []).map(mapComment),
  };
}

export const realApi = {
  async login(email, password) {
    const res = (await http("POST", "/auth/sign-in", { email, password })) || {};
    saveLoginStatus({
      profileImageUrl: res.profileImageUrl,
      accessTokenExpiresAt: res.accessTokenExpiresAt,
      loggedIn: true,
    });
    return res;
  },

  async signup(payload) {
    return http("POST", "/auth/sign-up", payload);
  },

  async logout() {
    try {
      await http("POST", "/auth/sign-out");
    } finally {
      clearLoginStatus();
    }
    return true;
  },

  isLoggedIn() {
    const status = readLoginStatus();
    return !!(status && status.loggedIn);
  },

  async listGames({ cursor = null, limit = 10 } = {}) {
    const query = new URLSearchParams();
    if (cursor) query.set("cursor", cursor);
    query.set("size", limit);
    const res = (await http("GET", "/articles?" + query.toString())) || {};
    return { items: (res.articles || []).map(mapSummary), nextCursor: res.hasNext ? res.nextCursor : null };
  },

  async getGame(id) {
    const res = await http("GET", "/articles/" + encodeURIComponent(id));
    if (!res) throw new Error("반틈을 찾을 수 없어요");
    return mapDetail(res, id);
  },

  async createGame({ question, optionA, optionB }) {
    const res = (await http("POST", "/articles", {
      title: question,
      optionA,
      optionB,
    })) || {};
    // 서버가 본문 없이 성공만 알릴 수도 있다. 생성 자체는 성공이므로 id 없음을 그대로 알린다.
    return { id: res.articleUuid ?? null };
  },

  async updateGame(id, { question, optionA, optionB }) {
    const patch = {};
    if (question != null) patch.title = question;
    if (optionA != null) patch.optionA = optionA;
    if (optionB != null) patch.optionB = optionB;
    await http("PATCH", "/articles/" + encodeURIComponent(id), patch);
    return { id };
  },

  async deleteGame(id) {
    await http("DELETE", "/articles/" + encodeURIComponent(id));
    return true;
  },

  async vote(id, side) {
    const option = toSide(side);
    if (!option) throw new Error("A 또는 B만 선택할 수 있어요");

    const path = "/articles/" + encodeURIComponent(id) + "/vote";
    try {
      const res = await http("POST", path, { option });
      // 집계가 담기지 않은 응답이면 상세를 다시 읽어 실제 값을 맞춘다.
      if (!res || res.voteCountA == null || res.voteCountB == null) {
        return { ...(await this.readVoteState(id, option)), changed: true };
      }
      return {
        votesA: toCount(res.voteCountA),
        votesB: toCount(res.voteCountB),
        myVote: toSide(res.myVote) || option,
        changed: res.changed !== false,
      };
    } catch (error) {
      if (error.status !== 409) throw error;
      return { ...(await this.readVoteState(id, option)), changed: false };
    }
  },

  async readVoteState(id, fallbackSide) {
    const current = await this.getGame(id);
    return {
      votesA: current.votesA,
      votesB: current.votesB,
      myVote: current.myVote || fallbackSide,
    };
  },

  async toggleLike(id, currentlyLiked) {
    const path = "/articles/" + encodeURIComponent(id) + "/like";
    try {
      const res = await http(currentlyLiked ? "DELETE" : "POST", path);
      if (!res || res.likeCount == null) {
        const current = await this.getGame(id);
        return { liked: current.liked, likes: current.likes };
      }
      return { liked: !!res.isLiked, likes: toCount(res.likeCount) };
    } catch (error) {
      // 409는 동시 요청, 400(ARTICLE_LIKE-400-001)은 이미 취소된 좋아요를 또 취소한 경우다.
      // 둘 다 화면 상태가 서버와 어긋난 것이므로 실제 값을 다시 읽어 맞춘다.
      const isDesync = error.status === 409 || error.serverCode === "ARTICLE_LIKE-400-001";
      if (!isDesync) throw error;
      const current = await this.getGame(id);
      return { liked: current.liked, likes: current.likes };
    }
  },

  async getMe() {
    const res = await http("GET", "/me/basic-info");
    if (!res) throw new Error("회원 정보를 불러오지 못했어요");
    return {
      email: res.email,
      nick: res.nickname,
      profileImageUrl: res.profileImageUrl,
    };
  },

  async updateMe({ nick, profileImageUrl }) {
    const patch = {};
    if (nick != null) patch.nickname = nick;
    if (profileImageUrl != null) patch.profileImageUrl = profileImageUrl;
    const res = (await http("PATCH", "/me/basic-info", patch)) || {};
    // 서버가 정규화한 값이 있으면 그쪽을 신뢰한다.
    return {
      nick: res.nickname ?? nick,
      profileImageUrl: res.profileImageUrl ?? profileImageUrl,
    };
  },

  async changePassword({ nowPassword, nextPassword, checkNextPassword }) {
    await http("PUT", "/me/security", { nowPassword, nextPassword, checkNextPassword });
    return true;
  },

  async withdraw() {
    try {
      await http("DELETE", "/me");
    } finally {
      clearLoginStatus();
    }
    return true;
  },

  async getSummary() {
    try {
      const res = (await http("GET", "/articles?size=10")) || {};
      const totalVotes = (res.articles || []).reduce(
        (sum, article) => sum + toCount(article.voteCountA) + toCount(article.voteCountB),
        0,
      );
      return { totalVotes };
    } catch (error) {
      return { totalVotes: 0 };
    }
  },

  async addComment(id, content) {
    const res = (await http("POST", "/articles/" + encodeURIComponent(id) + "/comments", { content })) || {};
    return { id: res.commentUuid ?? null };
  },

  async updateComment(id, commentId, content) {
    await http("PUT", "/articles/" + encodeURIComponent(id) + "/comments/" + encodeURIComponent(commentId), { content });
    return true;
  },

  async deleteComment(id, commentId) {
    await http("DELETE", "/articles/" + encodeURIComponent(id) + "/comments/" + encodeURIComponent(commentId));
    return true;
  },
};
