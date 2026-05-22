"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeId = "aero" | "y2k-imac";

export const THEMES: { id: ThemeId; label: string; sub: string; chip: string }[] = [
  { id: "aero", label: "Aero Glass", sub: "Vista · 2007", chip: "theme-switcher__chip--aero" },
  { id: "y2k-imac", label: "iMac G3", sub: "Bondi · 1999", chip: "theme-switcher__chip--y2k" },
];

const STORAGE_KEY = "brainrot:theme";
const DEFAULT_THEME: ThemeId = "aero";

function isThemeId(value: unknown): value is ThemeId {
  return value === "aero" || value === "y2k-imac";
}

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isThemeId(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function applyTheme(id: ThemeId): void {
  if (typeof document === "undefined") return;
  if (id === DEFAULT_THEME) {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", id);
  }
}

export function useTheme(): {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
} {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    setThemeState(readStoredTheme());
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((id: ThemeId): void => {
    setThemeState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore quota / privacy errors
    }
  }, []);

  return { theme, setTheme };
}

/** Inline script for <head> that applies the stored theme BEFORE paint
 *  to avoid the unthemed flash. Renders as a plain string so Next can
 *  put it in a <script> tag with dangerouslySetInnerHTML. */
export const themeBootScript = `
(function () {
  try {
    var k = ${JSON.stringify(STORAGE_KEY)};
    var t = window.localStorage.getItem(k);
    if (t === "y2k-imac") {
      document.documentElement.setAttribute("data-theme", "y2k-imac");
    }
  } catch (e) {}
})();
`.trim();
