// ui_design/screens/Register.jsx
// Reads: window.React, window.ErrorBanner, window.__loginStyles. Writes: window.Register.

/**
 * Register screen — full-page centered card, local validation only.
 * Reuses inputStyle and primaryBtn from window.__loginStyles (set by Login.jsx).
 *
 * @param {{ onRegistered: () => void, onGotoLogin: () => void }} props
 */
function Register({ onRegistered, onGotoLogin }) {
  const React = window.React;
  const { inputStyle, primaryBtn } = window.__loginStyles;
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return setError("姓名必填");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("邮箱格式不正确");
    if (password.length < 8) return setError("密码至少 8 位");
    setLoading(true);
    setTimeout(() => { setLoading(false); onRegistered && onRegistered(); }, 1000);
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--paper-1)", padding: "var(--sp-6)" }}>
      <div style={{
        width: 420, background: "var(--paper-0)",
        border: "1.5px solid var(--hairline)", borderRadius: "var(--r-lg)",
        padding: "var(--sp-8)", boxShadow: "var(--shadow-current)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "var(--sp-6)" }}>
          <div style={{ fontSize: 48, fontWeight: "var(--w-black)", fontFamily: "var(--font-display)" }}>注册</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>创建 Brainrot 账户</div>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          {error && <window.ErrorBanner kind="inline" variant="error" message={error} onClose={() => setError(null)} />}
          <input placeholder="姓名" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          <input type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="密码（≥8）" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          <button type="submit" disabled={loading} style={primaryBtn(loading)}>
            {loading ? "注册中…" : "创建账户"}
          </button>
          <div style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>
            已有账户？<a onClick={onGotoLogin} style={{ color: "var(--ink-0)", cursor: "pointer", fontWeight: "var(--w-semibold)" }}>登录</a>
          </div>
        </form>
      </div>
    </div>
  );
}

window.Register = Register;
