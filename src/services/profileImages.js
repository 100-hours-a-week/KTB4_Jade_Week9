import { httpPublic } from "./httpClient.js";

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 512;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file) {
  if (!file || !file.type.startsWith("image/")) return "이미지 파일만 선택해 주세요";
  if (file.size > MAX_FILE_SIZE) return "5MB 이하 이미지만 선택해 주세요";
  return null;
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

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("이미지를 처리할 수 없어요"))),
      "image/webp",
      0.8,
    );
  });

  if (!ALLOWED_TYPES.includes(blob.type)) throw new Error("지원하지 않는 이미지 형식이에요");
  return blob;
}

async function upload(file) {
  const blob = await compress(file);

  const { uploadUrl, fileUrl } = (await httpPublic("POST", "/files/image-uploads", {
    contentType: blob.type,
  })) || {};
  if (!uploadUrl || !fileUrl) throw new Error("이미지 업로드 주소를 받지 못했어요");

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": blob.type },
    body: blob,
  });
  if (!response.ok) throw new Error("이미지 업로드에 실패했어요");

  return fileUrl;
}

export const profileImages = { upload };
