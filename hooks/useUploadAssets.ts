"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { xhrUpload } from "@/lib/api/upload";
import { queryKeys } from "@/lib/api/keys";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

export type UploadStatus = "pending" | "uploading" | "done" | "failed";

export interface UploadItem {
  id: string;
  filename: string;
  size: number;
  loaded: number;
  status: UploadStatus;
  error?: string;
}

const MAX_BYTES = 100 * 1024 * 1024;

function genId(): string {
  return Math.random().toString(36).slice(2);
}

export function useUploadAssets(projectId: string) {
  const qc = useQueryClient();
  const m = messages.assets;
  const [items, setItems] = useState<UploadItem[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const start = useCallback(
    async (files: File[]) => {
      const newItems: UploadItem[] = files.map((f) => ({
        id: genId(),
        filename: f.name,
        size: f.size,
        loaded: 0,
        status: "pending",
      }));
      setItems((prev) => [...newItems, ...prev]);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const item = newItems[i];
        if (!file || !item) continue;

        if (file.size > MAX_BYTES) {
          updateItem(item.id, { status: "failed", error: m.tooLarge });
          continue;
        }
        updateItem(item.id, { status: "uploading" });
        const fd = new FormData();
        fd.append("file", file);
        try {
          await xhrUpload(
            `/api/v1/projects/${projectId}/assets`,
            fd,
            (loaded) => updateItem(item.id, { loaded }),
          );
          updateItem(item.id, { status: "done", loaded: file.size });
          qc.invalidateQueries({ queryKey: queryKeys.projects.assets(projectId) });
          const t = setTimeout(() => dismiss(item.id), 3000);
          timersRef.current.push(t);
        } catch (err) {
          let msg: string = m.networkError;
          if (err instanceof ApiError) {
            if (err.status === 413) msg = m.serverRejectedSize;
            else if (err.status === 403) msg = m.forbiddenViewer;
            else msg = err.body || err.message;
          }
          updateItem(item.id, { status: "failed", error: msg });
        }
      }
    },
    [projectId, qc, m, dismiss],
  );

  return { items, start, dismiss };
}
