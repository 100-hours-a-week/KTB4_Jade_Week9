import { useEffect, useState } from "react";
import { profileImages } from "../../services/profileImages.js";

export default function useObjectUrl(reference) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    let createdUrl = "";

    const release = () => {
      if (createdUrl.startsWith("blob:")) URL.revokeObjectURL(createdUrl);
      createdUrl = "";
    };

    profileImages
      .resolve(reference)
      .then((nextUrl) => {
        createdUrl = nextUrl || "";
        // 정리 단계를 이미 지났다면 방금 만든 URL을 그 자리에서 해제한다.
        if (!active) {
          release();
          return;
        }
        setUrl(createdUrl);
      })
      .catch(() => {
        if (active) setUrl("");
      });

    return () => {
      active = false;
      release();
    };
  }, [reference]);

  return url;
}
