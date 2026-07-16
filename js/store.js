/* =========================================================
   반갈 BAN-GAL — mock 데이터 저장소 (localStorage)
   ---------------------------------------------------------
   현재 백엔드 로직 및 db를 변경하기엔 이르다고 판단해, ai 통해 mock 데이터 작성했습니다.
   ========================================================= */
(function () {
  const GAMES_KEY = "bangal.games";
  const SESSION_KEY = "bangal.session";
  const USER_KEY = "bangal.user";

  const SEED_GAMES = [
    { id: 1, question: "평생 치킨 금지 vs 평생 피자 금지, 하나만 피할 수 있다면?", optionA: "치킨 없이 산다", optionB: "피자 없이 산다", votesA: 482, votesB: 731, likes: 128, authorId: "me", author: "스타트업코드", date: "2026-07-14" },
    { id: 2, question: "100억 받고 10년 전으로 vs 그냥 지금 이대로", optionA: "100억 들고 10년 전으로", optionB: "지금 이대로 산다", votesA: 1204, votesB: 356, likes: 342, authorId: "u2", author: "고민제조기", date: "2026-07-13" },
    { id: 3, question: "여행 갈 때 당신의 스타일은?", optionA: "분 단위 계획형", optionB: "무계획 즉흥형", votesA: 618, votesB: 645, likes: 87, authorId: "u3", author: "길치탈출", date: "2026-07-12" },
    { id: 4, question: "아는 맛 vs 새로운 맛, 오늘 저녁 메뉴는?", optionA: "실패 없는 아는 맛", optionB: "모험적인 새로운 맛", votesA: 892, votesB: 407, likes: 205, authorId: "u4", author: "먹짱", date: "2026-07-11" },
    { id: 5, question: "월급 2배 but 일도 2배 vs 지금 그대로", optionA: "월급 2배 일 2배", optionB: "지금 그대로", votesA: 533, votesB: 588, likes: 64, authorId: "u5", author: "월급루팡", date: "2026-07-10" },
    { id: 6, question: "연애할 때 더 힘든 쪽은?", optionA: "연락 뜸한 사람", optionB: "집착하는 사람", votesA: 774, votesB: 512, likes: 156, authorId: "u6", author: "모솔탈출", date: "2026-07-09" },
    { id: 7, question: "로또 1등 당첨금 받는 방법", optionA: "매달 나눠서 평생", optionB: "한 번에 전액", votesA: 421, votesB: 998, likes: 233, authorId: "u7", author: "인생역전", date: "2026-07-08" },
    { id: 8, question: "무인도에 딱 하나만 가져간다면?", optionA: "평생 라이터", optionB: "평생 칼", votesA: 645, votesB: 389, likes: 91, authorId: "u8", author: "생존왕", date: "2026-07-07" },
    { id: 9, question: "더 짜증나는 룸메이트는?", optionA: "더러운데 조용한 사람", optionB: "깔끔한데 시끄러운 사람", votesA: 588, votesB: 702, likes: 178, authorId: "u9", author: "자취9년차", date: "2026-07-06" },
    { id: 10, question: "평생 한 계절에서만 산다면?", optionA: "영원한 여름", optionB: "영원한 겨울", votesA: 833, votesB: 617, likes: 74, authorId: "u10", author: "날씨요정", date: "2026-07-05" },
    { id: 11, question: "초능력 하나만 고른다면?", optionA: "순간이동", optionB: "시간 정지", votesA: 912, votesB: 1088, likes: 301, authorId: "u11", author: "히어로지망생", date: "2026-07-04" },
    { id: 12, question: "더 견디기 힘든 상황은?", optionA: "와이파이 없는 하루", optionB: "카페인 없는 일주일", votesA: 502, votesB: 448, likes: 62, authorId: "u12", author: "디지털노마드", date: "2026-07-03" },
    { id: 13, question: "탕수육, 당신의 선택은?", optionA: "부먹", optionB: "찍먹", votesA: 1503, votesB: 1721, likes: 442, authorId: "u13", author: "중식러버", date: "2026-07-02" },
    { id: 14, question: "더 최악인 지각 사유는?", optionA: "알람 못 들음", optionB: "차 놓침", votesA: 388, votesB: 356, likes: 38, authorId: "u14", author: "지각대장", date: "2026-07-01" },
  ];

  const DEFAULT_USER = { id: "me", email: "startupcode@gmail.com", nick: "스타트업코드", password: "password1!" };

  function read(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  window.MockStore = {
    getGames() {
      let g = read(GAMES_KEY, null);
      if (!g) { g = SEED_GAMES.slice(); write(GAMES_KEY, g); return g; }
      let migrated = false;
      g = g.map((x) => {
        if (typeof x.likes !== "number") {
          const seed = SEED_GAMES.find((s) => s.id === x.id);
          migrated = true;
          return { ...x, likes: seed ? seed.likes : 0 };
        }
        return x;
      });
      if (migrated) write(GAMES_KEY, g);
      const ids = new Set(g.map((x) => x.id));
      const appended = SEED_GAMES.filter((s) => !ids.has(s.id));
      if (appended.length) { g = g.concat(appended); write(GAMES_KEY, g); }
      return g;
    },
    saveGames(games) { write(GAMES_KEY, games); },

    getMyVotes() { return read("bangal.votes", {}); },
    saveMyVotes(v) { write("bangal.votes", v); },

    getMyLikes() { return read("bangal.likes", {}); },
    saveMyLikes(v) { write("bangal.likes", v); },

    getUser() { return read(USER_KEY, DEFAULT_USER); },
    saveUser(u) { write(USER_KEY, u); },

    getSession() { return read(SESSION_KEY, null); },
    setSession(token) { write(SESSION_KEY, token); },
    clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} },
  };
})();
