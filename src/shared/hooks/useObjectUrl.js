import { useEffect, useState } from "react";
import { profileImages } from "../../services/profileImages.js";

export default function useObjectUrl(reference) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    let resolvedUrl = "";

    profileImages.resolve(reference).then((nextUrl) => {
      resolvedUrl = nextUrl || "";
      if (active) setUrl(resolvedUrl);
    });

    return () => {
      active = false;
      if (resolvedUrl.startsWith("blob:")) URL.revokeObjectURL(resolvedUrl);
    };
  }, [reference]);

  return url;
}
