const DB_NAME = "bangal.profile-images";
const STORE_NAME = "images";
const PREFIX = "local-profile:";
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 512;

// 선택한 파일이 규격에 맞는지 검사한다. 통과하면 null, 아니면 사용자에게 보여줄 메시지.
export function validateImageFile(file) {
  if (!file || !file.type.startsWith("image/")) return "이미지 파일만 선택해 주세요";
  if (file.size > MAX_FILE_SIZE) return "5MB 이하 이미지만 선택해 주세요";
  return null;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러올 수 없어요"));
    };
    image.src = url;
  });
}

async function compress(file) {
  const invalid = validateImageFile(file);
  if (invalid) throw new Error(invalid);

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("이미지를 저장할 수 없어요"))),
      "image/jpeg",
      0.82,
    );
  });
}

async function save(file) {
  const blob = await compress(file);
  const id = crypto.randomUUID();
  const db = await openDb();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put(blob, id);
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  db.close();
  return PREFIX + id;
}

function isLocal(reference) {
  return typeof reference === "string" && reference.startsWith(PREFIX);
}

async function get(reference) {
  if (!isLocal(reference)) return null;
  const db = await openDb();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const blob = await requestToPromise(transaction.objectStore(STORE_NAME).get(reference.slice(PREFIX.length)));
  db.close();
  return blob || null;
}

async function remove(reference) {
  if (!isLocal(reference)) return;
  const db = await openDb();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(reference.slice(PREFIX.length));
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  db.close();
}

async function resolve(reference) {
  if (!reference) return null;
  if (!isLocal(reference)) return reference;
  const blob = await get(reference);
  return blob ? URL.createObjectURL(blob) : null;
}

export const profileImages = { save, remove, resolve, isLocal };
