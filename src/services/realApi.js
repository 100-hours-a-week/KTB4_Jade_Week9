import { http } from "./httpClient.js";
import { saveLoginStatus, readLoginStatus, clearLoginStatus, appendDebugLog, readAuthCookieState } from "./loginStatusCache.js";

function notImplemented(what) {
  const error = new Error((what || "이 기능") + "은(는) 아직 백엔드에 구현되지 않았어요.");
  error.code = "NOT_IMPLEMENTED";
  return error;
}

function mapSummary(article) {
  return {
    id: article.articleUuid, question: article.title,
    optionA: null, optionB: null, votesA: 0, votesB: 0, myVote: null,
    likes: article.likeCount || 0, liked: !!(article.isLiked ?? article.liked),
    commentCount: article.commentCount || 0, viewCount: article.viewCount || 0,
    author: article.writer, authorId: article.writer, profileImageUrl: article.profileImageUrl,
    date: (article.createdAt || "").slice(0, 10),
  };
}

function mapComment(comment) {
  return {
    id: comment.commentUuid, content: comment.content,
    author: comment.writer, authorId: comment.userUuid, profileImageUrl: comment.profileImageUrl,
    date: (comment.createdAt || "").slice(0, 10),
  };
}

function mapDetail(article, uuid) {
  return {
    id: uuid, question: article.title, content: article.content,
    optionA: null, optionB: null, votesA: 0, votesB: 0, myVote: null,
    likes: article.likeCount || 0, liked: !!article.isLiked,
    commentCount: article.commentCount || 0, viewCount: article.viewCount || 0,
    author: article.writer, authorId: article.userUuid, imageUrl: article.imageUrl,
    date: (article.createdAt || "").slice(0, 10),
    comments: (article.comments || []).map(mapComment),
  };
}

/** 실제 백엔드(KTB4_Jade_Week4)와 통신하는 API. */
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

  async createGame({ question, content, imageUrl }) {
    console.warn("[반틈] 백엔드 Article에 optionA/B 필드가 없어 A/B 선택지는 저장되지 않습니다. 가이드 (A) 참고.");
    const res = await http("POST", "/articles", {
      title: question,
      content: content != null ? content : "",
      imageUrl: imageUrl || null,
    });
    return { id: res.articleUuid };
  },

  async updateGame(id, { question, content, imageUrl }) {
    console.warn("[반틈] 백엔드 Article에 optionA/B 필드가 없어 A/B 선택지는 저장되지 않습니다. 가이드 (A) 참고.");
    const patch = {};
    if (question != null) patch.title = question;
    if (content != null) patch.content = content;
    if (imageUrl != null) patch.imageUrl = imageUrl;
    await http("PATCH", "/articles/" + encodeURIComponent(id), patch);
    return { id };
  },

  async deleteGame(id) {
    await http("DELETE", "/articles/" + encodeURIComponent(id));
    return true;
  },

  async vote() {
    throw notImplemented("투표");
  },

  async toggleLike(id, currentlyLiked) {
    const path = "/articles/" + encodeURIComponent(id) + "/like";
    const res = await http(currentlyLiked ? "DELETE" : "POST", path);
    return { liked: res.isLiked, likes: res.likeCount };
  },

  async getMe() {
    const res = await http("GET", "/me/basic-info");
    return { email: res.email, nick: res.nickname, id: res.memberUuid, profileImageUrl: res.profileImageUrl };
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
    return { totalVotes: 0 };
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
