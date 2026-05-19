"use client";

import { useEffect, useRef, useState } from "react";
import { useProjectIdFromRoute } from "@/hooks/useProjectIdFromRoute";
import { useUploadAssets } from "@/hooks/useUploadAssets";
import { messages } from "@/lib/messages";

export function DropZoneOverlay() {
  const m = messages.assets;
  const projectId = useProjectIdFromRoute();
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const upload = useUploadAssets(projectId ?? "");

  useEffect(() => {
    if (!projectId) return;

    function hasFiles(types: ReadonlyArray<string> | DOMStringList | undefined): boolean {
      if (!types) return false;
      const arr = Array.from(types as ArrayLike<string>);
      return arr.includes("Files");
    }

    function onDragEnter(e: DragEvent) {
      if (!hasFiles(e.dataTransfer?.types)) return;
      e.preventDefault();
      dragCounter.current += 1;
      setIsDragOver(true);
    }
    function onDragOver(e: DragEvent) {
      if (!hasFiles(e.dataTransfer?.types)) return;
      e.preventDefault();
    }
    function onDragLeave(e: DragEvent) {
      if (!hasFiles(e.dataTransfer?.types)) return;
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) setIsDragOver(false);
    }
    function onDrop(e: DragEvent) {
      if (!hasFiles(e.dataTransfer?.types)) return;
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) void upload.start(files);
    }

    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
      dragCounter.current = 0;
    };
  }, [projectId, upload.start]);

  if (!projectId || !isDragOver) return null;

  return (
    <div
      data-testid="dropzone-overlay"
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-paper-1/95 border-[3px] border-dashed border-ink-0"
    >
      <div className="text-center">
        <p className="text-2xl font-bold text-ink-0">{m.dropZoneTitle}</p>
        <p className="text-sm text-ink-2 mt-2">{m.dropZoneSubtitle}</p>
      </div>
    </div>
  );
}
