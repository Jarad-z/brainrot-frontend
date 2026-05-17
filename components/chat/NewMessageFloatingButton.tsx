"use client";

interface NewMessageFloatingButtonProps {
  onClick: () => void;
}

export function NewMessageFloatingButton({ onClick }: NewMessageFloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-ink-0 text-paper-0 text-xs font-semibold shadow-[var(--shadow-current)]"
    >
      ↓ 有新消息
    </button>
  );
}
