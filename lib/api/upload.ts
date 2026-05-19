import { ApiError } from "./client";
import type { Asset } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export function xhrUpload(
  path: string,
  formData: FormData,
  onProgress: (loaded: number, total: number) => void,
): Promise<Asset> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}${path}`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded, e.total);
    };
    xhr.onerror = () => reject(new Error("network error"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as Asset);
        } catch (e) {
          reject(new Error(`invalid response JSON: ${(e as Error).message}`));
        }
      } else {
        reject(new ApiError(xhr.status, xhr.responseText));
      }
    };
    xhr.send(formData);
  });
}
