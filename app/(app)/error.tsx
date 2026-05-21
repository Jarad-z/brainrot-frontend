"use client";
import { Button } from "@/components/brand/button";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <p className="text-ink-0 font-semibold">出现错误</p>
        <p className="text-xs text-ink-2 font-mono break-all">{error.message}</p>
        <Button size="sm" onClick={reset}>
          重试
        </Button>
      </div>
    </div>
  );
}
