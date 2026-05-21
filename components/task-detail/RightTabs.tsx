"use client";

interface RightTabsProps {
  active: "artifacts" | "assets" | "approvals";
  onChange: (t: "artifacts" | "assets" | "approvals") => void;
  approvalsCount: number;
}

/**
 * Aero glass segmented control. The container is barely-there glass;
 * the active segment is a small aero-active blue pill with white text.
 * Inactive segments are mid-ink on transparent.
 */
export function RightTabs({ active, onChange, approvalsCount }: RightTabsProps) {
  const tabs = [
    { k: "artifacts" as const, label: "产出" },
    { k: "assets" as const, label: "素材" },
    { k: "approvals" as const, label: "审批", count: approvalsCount },
  ] as const;

  return (
    <div className="px-2.5 pt-2.5 pb-2">
      <div
        className="inline-flex w-full p-[2px] rounded-md"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.12) 100%)",
          border: "1px solid rgba(255,255,255,0.4)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(30,72,119,0.08)",
        }}
      >
        {tabs.map((t) => {
          const isActive = active === t.k;
          return (
            <button
              key={t.k}
              type="button"
              onClick={() => onChange(t.k)}
              data-active={isActive}
              className={`relative flex-1 px-2.5 py-1.5 rounded text-[12px] font-medium transition-all ${
                isActive ? "text-white" : "text-ink-1 hover:text-ink-0"
              }`}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(180deg, rgba(180,220,245,0.95) 0%, rgba(140,195,230,0.95) 49.5%, rgba(100,165,215,0.95) 50.5%, rgba(80,145,200,0.95) 100%)",
                      border: "1px solid rgba(30,72,119,0.45)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(30,72,119,0.3), 0 1px 2px rgba(30,72,119,0.18)",
                      textShadow: "0 -1px 0 rgba(30,72,119,0.3)",
                    }
                  : undefined
              }
            >
              <span className="inline-flex items-center gap-1.5">
                {t.label}
                {t.k === "approvals" && t.count > 0 && (
                  <span
                    className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-semibold rounded-full tabular-nums"
                    style={
                      isActive
                        ? {
                            background: "rgba(255,255,255,0.25)",
                            color: "#fff",
                            border: "1px solid rgba(255,255,255,0.4)",
                          }
                        : {
                            background:
                              "linear-gradient(180deg, #f3a76b 0%, #e07c3f 50%, #c4571e 100%)",
                            color: "#fff",
                            border: "1px solid rgba(255,255,255,0.45)",
                            textShadow: "0 -1px 0 rgba(150,55,15,0.35)",
                          }
                    }
                  >
                    {t.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
