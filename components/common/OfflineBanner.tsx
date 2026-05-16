"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { messages } from "@/lib/messages";

export function OfflineBanner() {
  const status = useAppStore((s) => s.ws.status);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status !== "offline") {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(t);
  }, [status]);

  if (!show) return null;
  return (
    <div className="bg-accent-honey text-ink-0 text-sm px-4 py-2 text-center border-b border-hairline">
      {messages.offline}
    </div>
  );
}
