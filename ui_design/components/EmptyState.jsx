// ui_design/components/EmptyState.jsx
// Reads: window.React. Writes: window.EmptyState.

/**
 * @typedef {Object} EmptyStateProps
 * @property {React.ReactNode} [glyph]    optional 48-64px glyph
 * @property {string} title               main message
 * @property {string} [description]       second line
 * @property {{ label: string, onClick: () => void }} [action]
 */

/**
 * Unified empty state for: no projects / tasks / messages / approvals /
 * agents / runtimes / assets / artifacts. See DESIGN.md §5.
 *
 * @param {EmptyStateProps} props
 */
function EmptyState({ glyph, title, description, action }) {
  return (
    <div style={{
      display: "grid", placeItems: "center", padding: "var(--sp-10)",
      background: "var(--paper-1)", border: "1.5px solid var(--hairline)",
      borderRadius: "var(--r-md)", textAlign: "center", gap: "var(--sp-2)",
    }}>
      {glyph && <div style={{ fontSize: 48, color: "var(--ink-2)", marginBottom: "var(--sp-2)" }}>{glyph}</div>}
      <div style={{ fontWeight: "var(--w-bold)", fontSize: "var(--text-base)", color: "var(--ink-0)" }}>{title}</div>
      {description && <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>{description}</div>}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: "var(--sp-3)",
            padding: "8px 16px",
            background: "var(--ink-0)", color: "var(--paper-0)",
            border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-sm)",
            fontWeight: "var(--w-semibold)", fontSize: "var(--text-sm)", cursor: "pointer",
            boxShadow: "var(--shadow-current)",
          }}>
          {action.label}
        </button>
      )}
    </div>
  );
}

window.EmptyState = EmptyState;
