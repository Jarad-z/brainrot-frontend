import type * as React from "react";

export interface KeyModifiers {
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export function isKey(
  ev: KeyboardEvent | React.KeyboardEvent,
  key: string,
  modifiers: KeyModifiers = {},
): boolean {
  if (ev.key !== key) return false;
  if (modifiers.meta !== undefined && ev.metaKey !== modifiers.meta) return false;
  if (modifiers.ctrl !== undefined && ev.ctrlKey !== modifiers.ctrl) return false;
  if (modifiers.shift !== undefined && ev.shiftKey !== modifiers.shift) return false;
  if (modifiers.alt !== undefined && ev.altKey !== modifiers.alt) return false;
  return true;
}

export function focusNext(
  container: HTMLElement,
  current: HTMLElement | null,
  direction: 1 | -1,
): HTMLElement | null {
  const focusables = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled"));
  if (focusables.length === 0) return null;
  const idx = current ? focusables.indexOf(current) : -1;
  const nextIdx = (idx + direction + focusables.length) % focusables.length;
  const next = focusables[nextIdx];
  next?.focus();
  return next ?? null;
}
