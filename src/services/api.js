import { config } from "./config.js";
import { mockApi } from "./mockApi.js";
import { realApi } from "./realApi.js";

// config.USE_MOCK이 꺼지면 mockApi.js / mockStore.js를 지우고
// 이 파일에서 realApi를 바로 export 하도록 바꾸면 된다.
export const api = config.USE_MOCK ? mockApi : realApi;
