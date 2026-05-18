"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/brand/input";

interface ToolFilterInputProps {
  onChange: (value: string) => void;
  delayMs?: number;
}

export function ToolFilterInput({ onChange, delayMs = 100 }: ToolFilterInputProps) {
  const [local, setLocal] = useState("");
  useEffect(() => {
    const t = setTimeout(() => onChange(local.trim().toLowerCase()), delayMs);
    return () => clearTimeout(t);
  }, [local, delayMs, onChange]);

  return (
    <Input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder="按工具名过滤"
      className="min-w-[180px]"
    />
  );
}
