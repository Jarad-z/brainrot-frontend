// ====== Shared primitives ======
const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } = React;

// --- icon helpers (inline SVG, no library) ---
function Icon({ name, size = 18, stroke = 1.75 }) {
  const s = size;
  const common = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "home": return <svg {...common}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-7h4v7h4a1 1 0 0 0 1-1V9.5"/></svg>;
    case "grid": return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>;
    case "stack": return <svg {...common}><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/></svg>;
    case "bot":   return <svg {...common}><rect x="4" y="7" width="16" height="13" rx="3"/><path d="M12 3v4"/><circle cx="9" cy="13" r="1.2"/><circle cx="15" cy="13" r="1.2"/><path d="M9 17h6"/></svg>;
    case "server":return <svg {...common}><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><circle cx="7" cy="7.5" r="0.8" fill="currentColor"/><circle cx="7" cy="16.5" r="0.8" fill="currentColor"/></svg>;
    case "settings": return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case "bell":  return <svg {...common}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
    case "search":return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case "plus":  return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case "send":  return <svg {...common}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>;
    case "paperclip": return <svg {...common}><path d="m21.4 11-9 9a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2L9.7 17.6a1.8 1.8 0 0 1-2.6-2.6L15.4 6.7"/></svg>;
    case "at":    return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>;
    case "chevron":return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    case "chevron-right":return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>;
    case "check": return <svg {...common}><path d="m5 12 5 5 9-11"/></svg>;
    case "x":     return <svg {...common}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case "file":  return <svg {...common}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>;
    case "image": return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.5"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg>;
    case "zip":   return <svg {...common}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M11 4v3M11 9v3M11 14v3"/></svg>;
    case "code":  return <svg {...common}><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>;
    case "play":  return <svg {...common}><path d="m6 4 14 8-14 8z"/></svg>;
    case "stop":  return <svg {...common}><rect x="6" y="6" width="12" height="12" rx="2"/></svg>;
    case "more":  return <svg {...common}><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>;
    case "pin":   return <svg {...common}><path d="M12 17v5"/><path d="M15.5 4 20 8.5l-4 4-3-1-4 4-1.5-1.5 4-4-1-3z"/></svg>;
    case "upload":return <svg {...common}><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></svg>;
    case "cmd":   return <svg {...common}><path d="M9 6a3 3 0 1 0-3 3h3V6zM15 6a3 3 0 1 1 3 3h-3V6zM9 18a3 3 0 1 1-3-3h3v3zM15 18a3 3 0 1 0 3-3h-3v3z"/><path d="M9 9h6v6H9z"/></svg>;
    case "queue": return <svg {...common}><path d="M3 6h18M3 12h18M3 18h12"/><circle cx="20" cy="18" r="2"/></svg>;
    case "approval":return <svg {...common}><path d="M9 11.5 11 13.5 15.5 9"/><path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7z"/></svg>;
    case "warn":  return <svg {...common}><path d="m12 3 10 18H2z"/><path d="M12 10v5M12 18.5v.5"/></svg>;
    case "spark": return <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>;
    default: return null;
  }
}

// --- block avatar ---
function Avatar({ name, color, size = 36, online, radius = 10, fontScale = 1 }) {
  const initials = (name || "?").split(/\s+/).map(w => w[0]).join("").slice(0,2).toUpperCase();
  return (
    <span className="av-wrap" style={{ width: size, height: size, display: "inline-block" }}>
      <span className="avatar-block" style={{
        width: size, height: size,
        background: color || "var(--ink-2)",
        borderRadius: radius,
        fontSize: Math.round(size * 0.36 * fontScale),
      }}>{initials}</span>
      {online !== undefined && <span className={"av-online" + (online ? "" : " offline")} />}
    </span>
  );
}

function AgentAvatar({ agent, size = 32, online }) {
  if (!agent) return null;
  return <Avatar name={agent.name} color={agent.color} size={size} online={online ?? agent.online} radius={Math.round(size * 0.28)} />;
}

// --- status chip ---
function StatusChip({ status }) {
  const labels = {
    open: "待办",
    in_progress: "进行中",
    done: "完成",
    blocked: "阻塞",
    archived: "归档",
    queued: "排队中",
  };
  return (
    <span className="chip" data-status={status}>
      <span className="dot" />
      {labels[status] || status}
    </span>
  );
}

// --- countdown (delegates to lib/countdown.js) ---
// Legacy callers expect a `seconds-remaining` number; adapt by accepting an
// `initialSec` and converting to an expiry, then projecting back.
function useCountdown(initialSec) {
  const expiresAt = useMemo(() => Date.now() + initialSec * 1000, [initialSec]);
  const state = window.BR_LIB.countdown.useCountdown(expiresAt);
  return Math.floor(state.remainingMs / 1000);
}
function fmtCountdown(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// --- empty state ---
function Empty({ glyph, title, sub }) {
  return (
    <div className="empty">
      <div className="glyph">{glyph}</div>
      <div style={{ fontWeight: 800, fontSize: 16, color: "var(--ink)" }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 13 }}>{sub}</div>
    </div>
  );
}

Object.assign(window, { Icon, Avatar, AgentAvatar, StatusChip, useCountdown, fmtCountdown, Empty });
