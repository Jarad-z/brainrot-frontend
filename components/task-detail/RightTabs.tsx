"use client";

interface RightTabsProps {
  active: "artifacts" | "assets" | "approvals";
  onChange: (t: "artifacts" | "assets" | "approvals") => void;
  approvalsCount: number;
}

export function RightTabs({ active, onChange, approvalsCount }: RightTabsProps) {
  const tabs = [
    { k: "artifacts" as const, label: "产出" },
    { k: "assets" as const, label: "素材" },
    { k: "approvals" as const, label: "审批", count: approvalsCount },
  ];
  return (
    <div className="flex border-b-[1.5px] border-hairline bg-paper-0">
      {tabs.map((t) => (
        <button
          key={t.k}
          onClick={() => onChange(t.k)}
          data-active={active === t.k}
          className={`flex-1 px-3 py-2.5 text-sm font-semibold ${active === t.k ? "border-b-2 border-ink-0 text-ink-0" : "text-ink-2"}`}
        >
          {t.label}
          {t.k === "approvals" && t.count !== undefined && t.count > 0 && (
            <span className="ml-1.5 inline-block min-w-[18px] px-1.5 text-[11px] bg-paper-2 rounded-full">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
