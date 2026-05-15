// ui_design/screens/Login.jsx
// Reads: window.React, window.ErrorBanner. Writes: window.Login, window.__loginStyles.

/**
 * Login screen — full-page centered card, local validation only.
 *
 * @param {{ onLoggedIn: () => void, onGotoRegister: () => void }} props
 */
function Login({ onLoggedIn, onGotoRegister }) {
  const React = window.React;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  function validate() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "邮箱格式不正确";
    if (password.length < 8) return "密码至少 8 位";
    return null;
  }

  function submit(e) {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    if (email === "wrong@wrong.com") { setError("邮箱或密码错误"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLoggedIn && onLoggedIn(); }, 1000);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center",
      background: "var(--paper-1)", padding: "var(--sp-6)",
    }}>
      <div style={{
        width: 420, background: "var(--paper-0)",
        border: "1.5px solid var(--hairline)", borderRadius: "var(--r-lg)",
        padding: "var(--sp-8)", boxShadow: "var(--shadow-current)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "var(--sp-6)" }}>
          <div style={{ fontSize: 48, fontWeight: "var(--w-black)", fontFamily: "var(--font-display)" }}>Brainrot</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>登录到协作 AI 工作台</div>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          {error && <window.ErrorBanner kind="inline" variant="error" message={error} onClose={() => setError(null)} />}
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>邮箱</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                   style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>密码</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                   style={inputStyle} />
          </label>
          <button type="submit" disabled={loading} style={primaryBtn(loading)}>
            {loading ? "登录中…" : "登录"}
          </button>
          <div style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>
            还没账号？<a onClick={onGotoRegister} style={{ color: "var(--ink-0)", cursor: "pointer", fontWeight: "var(--w-semibold)" }}>注册</a>
          </div>
        </form>
        <div style={{ textAlign: "center", marginTop: "var(--sp-6)", fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
          Brainrot · 协作 AI 工作台
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "8px 12px", border: "1.5px solid var(--hairline)",
  borderRadius: "var(--r-sm)", background: "var(--paper-0)",
  fontSize: "var(--text-sm)", fontFamily: "inherit",
};

/**
 * Returns style object for the primary submit button.
 * @param {boolean} disabled
 * @returns {Object}
 */
function primaryBtn(disabled) {
  return {
    padding: "10px 16px",
    background: disabled ? "var(--ink-3)" : "var(--ink-0)",
    color: "var(--paper-0)", border: "1.5px solid var(--ink-0)",
    borderRadius: "var(--r-sm)", fontWeight: "var(--w-semibold)",
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : "var(--shadow-current)",
  };
}

window.Login = Login;
window.__loginStyles = { inputStyle, primaryBtn };
