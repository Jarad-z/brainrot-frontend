import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-paper-1 rounded-md border border-hairline">
      {icon && <div className="mb-4 text-ink-2">{icon}</div>}
      <h3 className="text-base font-semibold text-ink-0">{title}</h3>
      {description && <p className="text-sm text-ink-2 mt-2 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
