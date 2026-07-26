import { toLocalDate } from "../shared/utils.js";
import { http } from "./httpClient.js";
import { saveLoginStatus, readLoginStatus, clearLoginStatus, appendDebugLog, readAuthCookieState } from "./loginStatusCache.js";

function toCount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toSide(value) {
  if (value == null) return null;
  const side = String(value).trim().toUpperCase();
  return side === "A" || side === "B" ? side : null;
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
    author: article.writer,
    isMine: !!article.isMine,
    profileImageUrl: article.profileImageUrl,
    date: toLocalDate(article.createdAt),
  };
}

function mapComment(comment) {
  return {
    id: comment.commentUuid, content: comment.content,
    author: comment.writer, isMine: !!comment.isMine, profileImageUrl: comment.profileImageUrl,
    date: toLocalDate(comment.createdAt),
  };
}

function mapDetail(article, uuid) {
  const comments = (article.comments || []).map(mapComment);
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
    commentCount: comments.length,
    author: article.writer,
    isMine: !!article.isMine,
    profileImageUrl: article.profileImageUrl,
    date: toLocalDate(article.createdAt),
    comments,
  };
}

export const realApi = {
  async login(email, password) {
    const res = await http("POST", "/auth/sign-in", { email, password });
    saveLoginStatus({
      profileImageUrl: res.profileImageUrl,
      accessTokenExpiresAt: res.accessTokenExpiresAt,
      loggedIn: true,
    });
    appendDebugLog({
      type: "auth.sign-in",
      success: true,
      summary: { profileImageUrl: res?.profileImageUrl ?? null, accessTokenExpiresAt: res?.accessTokenExpiresAt ?? null },
      cookies: readAuthCookieState(),
      response: res,
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
    const res = await http("GET", "/articles?" + query.toString());
    return { items: (res.articles || []).map(mapSummary), nextCursor: res.hasNext ? res.nextCursor : null };
  },

  async getGame(id) {
    const res = await http("GET", "/articles/" + encodeURIComponent(id));
    return mapDetail(res, id);
  },

  async createGame({ question, optionA, optionB }) {
    const res = await http("POST", "/articles", {
      title: question,
      optionA,
      optionB,
    });
    return { id: res.articleUuid };
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
      return {
        votesA: toCount(res.voteCountA),
        votesB: toCount(res.voteCountB),
        myVote: toSide(res.myVote) || option,
        changed: res.changed !== false,
        wasFirst: !!res.wasFirst,
      };
    } catch (error) {
      if (error.status !== 409) throw error;
      const current = await this.getGame(id);
      return {
        votesA: current.votesA,
        votesB: current.votesB,
        myVote: current.myVote || option,
        changed: false,
      };
    }
  },

  async toggleLike(id, currentlyLiked) {
    const path = "/articles/" + encodeURIComponent(id) + "/like";
    try {
      const res = await http(currentlyLiked ? "DELETE" : "POST", path);
      return { liked: !!res.isLiked, likes: toCount(res.likeCount) };
    } catch (error) {
      if (error.status !== 409) throw error;
      const current = await this.getGame(id);
      return { liked: current.liked, likes: current.likes };
    }
  },

  async getMe() {
    const res = await http("GET", "/me/basic-info");
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
    await http("PATCH", "/me/basic-info", patch);
    return { nick, profileImageUrl };
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
      const res = await http("GET", "/articles?size=10");
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
    const res = await http("POST", "/articles/" + encodeURIComponent(id) + "/comments", { content });
    return { id: res.commentUuid };
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
