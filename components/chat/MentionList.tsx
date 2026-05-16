"use client";
import {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
} from "react";
import type { Agent } from "@/lib/api/types";
import { Avatar } from "@/components/brand/avatar";

export interface MentionListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface MentionListProps {
  candidates: ReadonlyArray<Agent>;
  anchorRect: DOMRect;
  onPick: (agent: Agent) => void;
  onClose: () => void;
}

export const MentionList = forwardRef<MentionListHandle, MentionListProps>(
  function MentionList(
    { candidates, anchorRect, onPick, onClose },
    ref,
  ) {
    const [highlight, setHighlight] = useState(0);
    const highlightRef = useRef(0);
    const wrapRef = useRef<HTMLDivElement>(null);

    const setHi = (next: number) => {
      highlightRef.current = next;
      setHighlight(next);
    };

    useEffect(() => {
      highlightRef.current = 0;
      setHighlight(0);
    }, [candidates]);

    useEffect(() => {
      const onDoc = (e: MouseEvent) => {
        if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
          onClose();
        }
      };
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }, [onClose]);

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: (event) => {
          if (candidates.length === 0) {
            if (event.key === "Escape") {
              onClose();
              return true;
            }
            return false;
          }
          if (event.key === "ArrowDown") {
            setHi((highlightRef.current + 1) % candidates.length);
            return true;
          }
          if (event.key === "ArrowUp") {
            setHi(
              (highlightRef.current - 1 + candidates.length) % candidates.length,
            );
            return true;
          }
          if (event.key === "Enter" || event.key === "Tab") {
            onPick(candidates[highlightRef.current]!);
            return true;
          }
          if (event.key === "Escape") {
            onClose();
            return true;
          }
          return false;
        },
      }),
      [candidates, onPick, onClose],
    );

    return (
      <div
        ref={wrapRef}
        role="listbox"
        aria-label="agent mention candidates"
        style={{
          position: "fixed",
          left: anchorRect.left,
          top: anchorRect.bottom + 4,
          minWidth: 240,
          zIndex: 100,
        }}
        className="bg-paper-0 border-[1.5px] border-ink-0 rounded-md shadow-[var(--shadow-current)] overflow-hidden"
      >
        {candidates.length === 0 ? (
          <div className="px-3 py-2 text-sm text-ink-2">
            未找到 agent，请检查 handle
          </div>
        ) : (
          candidates.map((a, i) => (
            <div
              key={a.id}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(a);
              }}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                i === highlight ? "bg-paper-2" : ""
              }`}
            >
              <Avatar name={a.name} size={24} />
              <span className="font-semibold">@{a.handle}</span>
              <span className="text-ink-2 text-xs">{a.name}</span>
            </div>
          ))
        )}
      </div>
    );
  },
);
