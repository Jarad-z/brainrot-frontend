"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { messages } from "@/lib/messages";
import { Banner } from "@/components/brand/banner";

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
  return <Banner>{messages.offline}</Banner>;
}
