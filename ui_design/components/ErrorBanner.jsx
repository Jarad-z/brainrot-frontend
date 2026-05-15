// ui_design/components/ErrorBanner.jsx
// Reads: window.React, window.Icon. Writes: window.ErrorBanner, window.useToast.

/**
 * @typedef {"info"|"warn"|"error"} BannerVariant
 * @typedef {"inline"|"toast"|"card"} BannerKind
 *
 * @typedef {Object} ErrorBannerProps
 * @property {BannerKind} kind
 * @property {BannerVariant} variant
 * @property {string} message
 * @property {() => void} [onClose]
 */

const ERR_TINT = {
  info:  { bg: "var(--paper-2)", fg: "var(--ink-0)",  bd: "var(--hairline)" },
  warn:  { bg: "#f7e7c4",        fg: "var(--ink-0)",  bd: "#d9b766" },
  error: { bg: "#f3c7c0",        fg: "#7a1d10",       bd: "var(--state-failed)" },
};

/**
 * Unified banner. See DESIGN.md §5.
 * @param {ErrorBannerProps} props
 */
function ErrorBanner({ kind, variant, message, onClose }) {
  const tint = ERR_TINT[variant] || ERR_TINT.info;
  const base = {
    padding: "var(--sp-3) var(--sp-5)", display: "flex", alignItems: "center",
    gap: "var(--sp-3)", background: tint.bg, color: tint.fg,
    border: "1.5px solid " + tint.bd, borderRadius: "var(--r-sm)",
    fontSize: "var(--text-sm)",
  };
  const kindStyle = {
    inline: {},
    toast:  { position: "fixed", right: 24, bottom: 24, zIndex: 1000, boxShadow: "var(--shadow-soft)" },
    card:   { padding: "var(--sp-8)", flexDirection: "column", textAlign: "center" },
  }[kind] || {};
  return (
    <div role={variant === "error" ? "alert" : "status"} style={{ ...base, ...kindStyle }}>
      <window.Icon name={variant === "error" ? "warn" : variant === "warn" ? "warn" : "approval"} size={16} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="关闭"
                style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}>
          <window.Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}

/**
 * Minimal toast manager: useToast() returns `{ push(message, variant?, ms?) }`.
 * Renders to a portal-like fixed container kept inside the calling tree.
 *
 * @returns {{
 *   toasts: Array<{id:number, message:string, variant:BannerVariant}>,
 *   push: (message: string, variant?: BannerVariant, ms?: number) => void,
 *   dismiss: (id: number) => void
 * }}
 */
function useToast() {
  const [toasts, setToasts] = window.React.useState([]);
  const idRef = window.React.useRef(0);
  const push = window.React.useCallback((message, variant = "info", ms = 4000) => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, message, variant }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ms);
  }, []);
  const dismiss = window.React.useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);
  return { toasts, push, dismiss };
}

window.ErrorBanner = ErrorBanner;
window.useToast = useToast;
