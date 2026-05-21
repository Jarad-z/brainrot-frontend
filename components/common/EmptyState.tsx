import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 max-w-[360px] mx-auto">
      {icon ? (
        <div className="mb-3 w-10 h-10 rounded-xl bg-accent-wash text-accent flex items-center justify-center text-[18px] leading-none">
          {icon}
        </div>
      ) : (
        <div
          aria-hidden
          className="mb-3 w-8 h-[2px] rounded-full bg-hairline"
        />
      )}
      <h3 className="text-[13.5px] font-semibold text-ink-1 m-0 mb-1.5 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-[12px] text-ink-3 leading-[1.6] mt-0 max-w-[34ch] m-0">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
