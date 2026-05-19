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
    <Card className="flex flex-col items-center justify-center text-center p-12 bg-paper-1 max-w-[320px] mx-auto">
      {icon && <div className="mb-3 text-ink-2 text-[64px]">{icon}</div>}
      <h3 className="text-base font-extrabold text-ink-0 font-tight">{title}</h3>
      {description && (
        <p className="text-[13px] text-ink-2 mt-2 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
