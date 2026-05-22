"use client";

import { useState } from "react";
import { THEMES, useTheme } from "@/hooks/useTheme";

export function ThemeSwitcher(): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        type="button"
        className="theme-switcher"
        onClick={() => setCollapsed(false)}
        aria-label="展开主题切换"
        style={{ minWidth: 0, padding: "10px 12px" }}
      >
        <span className="theme-switcher__label" style={{ padding: 0 }}>
          🎨 主题
        </span>
      </button>
    );
  }

  return (
    <div className="theme-switcher" role="group" aria-label="主题切换">
      <div className="theme-switcher__label" style={{ display: "flex", alignItems: "center" }}>
        <span style={{ flex: 1 }}>🎨 主题 / Theme</span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="收起"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            font: "inherit",
            color: "inherit",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          className="theme-switcher__btn"
          aria-pressed={theme === t.id}
          onClick={() => setTheme(t.id)}
        >
          <span className={`theme-switcher__chip ${t.chip}`} aria-hidden />
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span>{t.label}</span>
            <span
              style={{
                fontSize: 10,
                opacity: 0.7,
                letterSpacing: "0.05em",
              }}
            >
              {t.sub}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
