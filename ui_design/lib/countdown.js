// ui_design/lib/countdown.js
// Provides: pure `computeCountdown` (testable) + React `useCountdown` hook.
// Reads: window.React. Writes: window.BR_LIB.countdown.

(function () {
  const URGENT_MS = 10 * 60 * 1000;

  /**
   * Compute countdown state from an ISO-8601 expiry and a "now" timestamp.
   * Pure — no Date.now() inside, so it's deterministic in tests.
   *
   * @param {string|number} expiresAt  ISO string or ms epoch
   * @param {number} nowMs             ms epoch (Date.now())
   * @returns {{ remainingMs: number, label: string, urgent: boolean, expired: boolean }}
   */
  function computeCountdown(expiresAt, nowMs) {
    const exp = typeof expiresAt === "number" ? expiresAt : Date.parse(expiresAt);
    const remaining = Math.max(0, exp - nowMs);
    const expired = remaining === 0;
    const urgent = !expired && remaining <= URGENT_MS;
    const totalSec = Math.floor(remaining / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const label = expired ? "已超时" : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return { remainingMs: remaining, label, urgent, expired };
  }

  /**
   * React hook: re-computes each animation frame; cheaper to read once per tick
   * than to setInterval(1000) — drift-free across inactive tabs.
   *
   * @param {string|number} expiresAt
   */
  function useCountdown(expiresAt) {
    const React = window.React;
    const [, force] = React.useState(0);
    React.useEffect(() => {
      let raf = 0;
      let lastSec = -1;
      const tick = () => {
        const state = computeCountdown(expiresAt, Date.now());
        const sec = Math.floor(state.remainingMs / 1000);
        if (sec !== lastSec) {
          lastSec = sec;
          force(x => x + 1);
        }
        if (!state.expired) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [expiresAt]);
    return computeCountdown(expiresAt, Date.now());
  }

  window.BR_LIB = window.BR_LIB || {};
  window.BR_LIB.countdown = { computeCountdown, useCountdown, URGENT_MS };
})();
