import type { ReactNode } from "react";

type ErrorKind = "inline" | "card";
type ErrorVariant = "info" | "warn" | "error";

interface ErrorBannerProps {
  kind?: ErrorKind;
  variant?: ErrorVariant;
  children: ReactNode;
}

const variantClass: Record<ErrorVariant, string> = {
  info:  "bg-paper-2 text-ink-0 border-hairline",
  warn:  "bg-accent-honey/20 text-ink-0 border-accent-honey",
  error: "bg-accent-poppy/15 text-ink-0 border-accent-poppy",
};

export function ErrorBanner({ kind = "inline", variant = "error", children }: ErrorBannerProps) {
  const base = "border rounded-md px-4 py-3 text-sm";
  if (kind === "card") {
    return (
      <div className={`${base} ${variantClass[variant]} max-w-md mx-auto my-8`}>
        {children}
      </div>
    );
  }
  return <div className={`${base} ${variantClass[variant]}`}>{children}</div>;
}
