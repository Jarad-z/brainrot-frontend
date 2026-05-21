import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8 max-w-[420px] mx-auto">
      {icon && (
        <div className="mb-4 w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center text-ink-2 text-[22px] leading-none">
          {icon}
        </div>
      )}
      <h3 className="text-[16px] font-medium text-ink-0 m-0 mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-ink-2 leading-relaxed mt-0 max-w-[36ch]">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
