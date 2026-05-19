import type { ReactNode } from "react";
import { Card } from "@/components/brand/card";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Card
      chunky
      className="relative overflow-hidden flex flex-col items-center justify-center text-center p-10 max-w-[420px] mx-auto"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1.5 pending-stripes opacity-80"
      />
      {icon && <div className="mb-3 text-ink-0 text-[56px] leading-none">{icon}</div>}
      <h3 className="editorial-title text-[clamp(22px,2.4vw,32px)] text-ink-0 m-0">
        {title}
      </h3>
      {description && (
        <p className="editorial-deck text-sm mt-3 max-w-[36ch]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
