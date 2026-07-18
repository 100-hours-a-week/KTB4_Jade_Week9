(function () {
  const cfg = window.BANGAL_CONFIG;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function notImplemented(what) {
    const e = new Error((what || "이 기능") + "은(는) 아직 백엔드에 구현되지 않았어요.");
    e.code = "NOT_IMPLEMENTED";
    return e;
  }

  function readCookie(name) {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function readAuthCookieState() {
    return {
      accessToken: readCookie("ACCESS_TOKEN"),
      refreshToken: readCookie("REFRESH_TOKEN"),
      xsrfToken: readCookie("XSRF-TOKEN"),
      documentCookie: document.cookie,
    };
  }
  let csrfReady = false;
  async function ensureCsrf() {
    if (csrfReady && readCookie("XSRF-TOKEN")) return;
    await fetch(cfg.API_BASE + "/auth/csrf", { credentials: "include" });
    csrfReady = true;
  }

  async function http(method, path, body, _retried) {
    const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (mutating) {
      await ensureCsrf();
      const token = readCookie("XSRF-TOKEN");
      if (token) headers["X-XSRF-TOKEN"] = token;
    }
    const res = await fetch(cfg.API_BASE + path, {
      method,
      credentials: "include",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && !_retried && path !== "/auth/token/re-issue" && path !== "/auth/sign-in") {
      try {
        appendDebugLog && appendDebugLog({ type: "http.401", path, note: "attempting token re-issue" });
        const re = await fetch(cfg.API_BASE + "/auth/token/re-issue", { method: "POST", credentials: "include" });
        appendDebugLog && appendDebugLog({ type: "http.reissue.response", status: re.status, path: "/auth/token/re-issue" });
        return http(method, path, body, true);
      } catch (e) {
        appendDebugLog && appendDebugLog({ type: "http.reissue.error", path: "/auth/token/re-issue", error: (e && e.message) || String(e) });
      }
    }

    if (!res.ok) {
      let msg = "요청에 실패했어요", fields = null, code = null, bodyJson = null;
      try {
        const j = await res.json();
        bodyJson = j;
        msg = j.message || msg; fields = j.fields || null; code = j.code || null;
      } catch (e) {}
      appendDebugLog && appendDebugLog({ type: "http.error", path, status: res.status, body: bodyJson });
      console.error("[BANGAL API ERROR]", {
        method,
        path,
        status: res.status,
        response: bodyJson,
      });
      const err = new Error(msg); err.status = res.status; err.fields = fields; err.serverCode = code;
      throw err;
    }
    if (res.status === 204) return null;
    const text = await res.text();
    if (!text) return null;

    const json = JSON.parse(text);
    return json && json.success === true ? (json.data ?? null) : json;
  }

  const SESSION_KEY = "bangal.session";
  const DEBUG_LOG_KEY = "bangal.debug.logs";
  function saveSession(data) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (e) {} }
  function readSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch (e) { return null; } }
  function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }
  function appendDebugLog(entry) {
    try {
      const items = JSON.parse(localStorage.getItem(DEBUG_LOG_KEY) || "[]");
      items.push({ timestamp: new Date().toISOString(), ...entry });
      localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(items.slice(-20)));
    } catch (e) {}
  }
  window.BANGAL_DEBUG = {
    log: appendDebugLog,
    read: () => {
      try { return JSON.parse(localStorage.getItem(DEBUG_LOG_KEY) || "[]"); }
      catch (e) { return []; }
    },
    clear: () => { try { localStorage.removeItem(DEBUG_LOG_KEY); } catch (e) {} },
    authCookies: readAuthCookieState,
    session: () => readSession(),
  };

  function mapSummary(a) {
    return {
      id: a.articleUuid, question: a.title,
      optionA: null, optionB: null, votesA: 0, votesB: 0, myVote: null,
      likes: a.likeCount || 0, liked: !!(a.isLiked ?? a.liked),
      commentCount: a.commentCount || 0, viewCount: a.viewCount || 0,
      author: a.writer, authorId: a.writer, profileImageUrl: a.profileImageUrl,
      date: (a.createdAt || "").slice(0, 10),
    };
  }
  function mapDetail(a, uuid) {
    return {
      id: uuid, question: a.title, content: a.content,
      optionA: null, optionB: null, votesA: 0, votesB: 0, myVote: null,
      likes: a.likeCount || 0, liked: !!a.isLiked,
      commentCount: a.commentCount || 0, viewCount: a.viewCount || 0,
      author: a.writer, authorId: a.userUuid, imageUrl: a.imageUrl,
      date: (a.createdAt || "").slice(0, 10),
    };
  }

  function withMyVote(game) {
    const votes = window.MockStore.getMyVotes();
    const likes = window.MockStore.getMyLikes();
    return { ...game, likes: game.likes || 0, myVote: votes[game.id] || null, liked: !!likes[game.id] };
  }

  window.Api = {
    async login(email, password) {
      if (cfg.USE_MOCK) {
        await wait(150);
        const user = window.MockStore.getUser();
        saveSession({ profileImageUrl: user.profileImageUrl || "", loggedIn: true });
        window.MockStore.setSession("mock-token");
        return { user };
      }
      const res = await http("POST", "/auth/sign-in", { email, password });
      saveSession({
        profileImageUrl: res.profileImageUrl,
        accessTokenExpiresAt: res.accessTokenExpiresAt,
        loggedIn: true,
      });
      appendDebugLog({
        type: "auth.sign-in",
        success: true,
        summary: {
          profileImageUrl: res?.profileImageUrl ?? null,
          accessTokenExpiresAt: res?.accessTokenExpiresAt ?? null,
        },
        cookies: readAuthCookieState(),
        response: res,
      });
      return res;
    },

    async signup(payload) {
      if (cfg.USE_MOCK) {
        await wait(150);
        const user = { ...window.MockStore.getUser(), email: payload.email, nick: payload.nickname };
        window.MockStore.saveUser(user);
        return { ok: true };
      }
      return http("POST", "/auth/sign-up", payload);
    },

    async logout() {
      if (cfg.USE_MOCK) { window.MockStore.clearSession(); clearSession(); return true; }
      try { await http("POST", "/auth/sign-out"); } finally { clearSession(); }
      return true;
    },

    isLoggedIn() {
      if (cfg.USE_MOCK) return !!window.MockStore.getSession();
      const s = readSession();
      return !!(s && s.loggedIn);
    },

    async listGames({ cursor = null, limit = 10 } = {}) {
      if (cfg.USE_MOCK) {
        await wait(300);
        const all = window.MockStore.getGames();
        const start = cursor == null ? 0 : Number(cursor);
        const slice = all.slice(start, start + limit);
        const end = start + slice.length;
        return { items: slice.map(withMyVote), nextCursor: end < all.length ? String(end) : null };
      }
      const qs = new URLSearchParams();
      if (cursor) qs.set("cursor", cursor);
      qs.set("size", limit);
      const res = await http("GET", "/articles?" + qs.toString());
      return { items: (res.articles || []).map(mapSummary), nextCursor: res.hasNext ? res.nextCursor : null };
    },

    async getGame(id) {
      if (cfg.USE_MOCK) {
        await wait(120);
        const g = window.MockStore.getGames().find((x) => x.id === Number(id));
        if (!g) { const e = new Error("게임을 찾을 수 없어요"); e.status = 404; throw e; }
        return withMyVote(g);
      }
      const res = await http("GET", "/articles/" + encodeURIComponent(id));
      return mapDetail(res, id);
    },

    async createGame({ question, optionA, optionB, content, imageUrl }) {
      if (cfg.USE_MOCK) {
        await wait(150);
        const games = window.MockStore.getGames();
        const user = window.MockStore.getUser();
        const id = games.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        const game = { id, question, optionA, optionB, votesA: 0, votesB: 0, likes: 0, liked: false,
          authorId: user.id, author: user.nick, date: new Date().toISOString().slice(0, 10), myVote: null };
        window.MockStore.saveGames([game, ...games]);
        return withMyVote(game);
      }
      console.warn("[반갈] 백엔드 Article에 optionA/B 필드가 없어 A/B 선택지는 저장되지 않습니다. 가이드 (A) 참고.");
      const res = await http("POST", "/articles", {
        title: question,
        content: content != null ? content : "",
        imageUrl: imageUrl || null,
      });
      return { id: res.articleUuid };
    },

    async updateGame(id, { question, optionA, optionB, content, imageUrl }) {
      if (cfg.USE_MOCK) {
        await wait(150);
        const next = window.MockStore.getGames().map((x) =>
          x.id === Number(id) ? { ...x, question, optionA, optionB } : x);
        window.MockStore.saveGames(next);
        return withMyVote(next.find((x) => x.id === Number(id)));
      }
      console.warn("[반갈] 백엔드 Article에 optionA/B 필드가 없어 A/B 선택지는 저장되지 않습니다. 가이드 (A) 참고.");
      const patch = {};
      if (question != null) patch.title = question;
      if (content != null) patch.content = content;
      if (imageUrl != null) patch.imageUrl = imageUrl;
      await http("PATCH", "/articles/" + encodeURIComponent(id), patch);
      return { id };
    },

    async deleteGame(id) {
      if (cfg.USE_MOCK) {
        await wait(150);
        window.MockStore.saveGames(window.MockStore.getGames().filter((x) => x.id !== Number(id)));
        return true;
      }
      await http("DELETE", "/articles/" + encodeURIComponent(id));
      return true;
    },

    async vote(id, side) {
      if (cfg.USE_MOCK) {
        await wait(100);
        const games = window.MockStore.getGames();
        const votes = window.MockStore.getMyVotes();
        const prev = votes[id] || null;
        if (prev === side) {
          const g = games.find((x) => x.id === Number(id));
          return { votesA: g.votesA, votesB: g.votesB, myVote: prev, changed: false };
        }
        const next = games.map((x) => {
          if (x.id !== Number(id)) return x;
          const n = { ...x };
          if (prev === null) { side === "A" ? n.votesA++ : n.votesB++; }
          else { if (side === "A") { n.votesA++; n.votesB--; } else { n.votesB++; n.votesA--; } }
          return n;
        });
        window.MockStore.saveGames(next);
        votes[id] = side; window.MockStore.saveMyVotes(votes);
        const g = next.find((x) => x.id === Number(id));
        return { votesA: g.votesA, votesB: g.votesB, myVote: side, changed: true, wasFirst: prev === null };
      }
      throw notImplemented("투표");
    },

    async toggleLike(id, currentlyLiked) {
      if (cfg.USE_MOCK) {
        await wait(80);
        const games = window.MockStore.getGames();
        const likes = window.MockStore.getMyLikes();
        const liked = !likes[id];
        const next = games.map((x) => x.id === Number(id)
          ? { ...x, likes: Math.max(0, (x.likes || 0) + (liked ? 1 : -1)) } : x);
        window.MockStore.saveGames(next);
        if (liked) likes[id] = true; else delete likes[id];
        window.MockStore.saveMyLikes(likes);
        return { liked, likes: next.find((x) => x.id === Number(id)).likes };
      }
      const path = "/articles/" + encodeURIComponent(id) + "/like";
      const res = await http(currentlyLiked ? "DELETE" : "POST", path);
      return { liked: res.isLiked, likes: res.likeCount };
    },

    async getMe() {
      if (cfg.USE_MOCK) {
        await wait(80);
        const u = window.MockStore.getUser();
        return { email: u.email, nick: u.nick, id: u.id, profileImageUrl: u.profileImageUrl || "" };
      }
      const res = await http("GET", "/me/basic-info");
      return { email: res.email, nick: res.nickname, id: null, profileImageUrl: res.profileImageUrl };
    },

    async updateMe({ nick, profileImageUrl }) {
      if (cfg.USE_MOCK) {
        await wait(150);
        const user = {
          ...window.MockStore.getUser(),
          nick,
          profileImageUrl: profileImageUrl ?? window.MockStore.getUser().profileImageUrl,
        };
        window.MockStore.saveUser(user);
        return { nick, profileImageUrl: user.profileImageUrl };
      }
      const patch = {};
      if (nick != null) patch.nickname = nick;
      if (profileImageUrl != null) patch.profileImageUrl = profileImageUrl;
      await http("PATCH", "/me/basic-info", patch);
      return { nick: nick, profileImageUrl };
    },

    async changePassword({ nowPassword, nextPassword, checkNextPassword }) {
      if (cfg.USE_MOCK) {
        await wait(150);
        const user = window.MockStore.getUser();
        if (nowPassword !== user.password) {
          const e = new Error("현재 비밀번호와 다릅니다"); e.code = "WRONG_PASSWORD"; throw e;
        }
        if (nextPassword !== checkNextPassword) {
          const e = new Error("새 비밀번호가 일치하지 않습니다"); e.code = "PASSWORD_MISMATCH"; throw e;
        }
        window.MockStore.saveUser({ ...user, password: nextPassword });
        return true;
      }
      await http("PUT", "/me/security", { nowPassword, nextPassword, checkNextPassword });
      return true;
    },

    async withdraw() {
      if (cfg.USE_MOCK) { window.MockStore.clearSession(); clearSession(); return true; }
      try { await http("DELETE", "/me"); } finally { clearSession(); }
      return true;
    },

    async getSummary() {
      if (cfg.USE_MOCK) {
        await wait(80);
        return { totalVotes: window.MockStore.getGames().reduce((a, g) => a + g.votesA + g.votesB, 0) };
      }
      return { totalVotes: 0 };
    },
  };
})();
