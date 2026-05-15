// ui_design/screens/AgentNew.jsx
// Reads: window.React, window.MOCK, window.useToast, window.ErrorBanner,
//        window.__loginStyles (inputStyle, primaryBtn), window.Avatar.
// Writes: window.AgentNew.

/**
 * AgentNew screen — full agent creation form with validation.
 * @param {{ onCancel: () => void, onCreated: () => void }} props
 */
function AgentNew({ onCancel, onCreated }) {
  const React = window.React;
  const { push: pushToast, toasts } = window.useToast();

  const [form, setForm] = React.useState({
    runtime_id: window.MOCK.RUNTIMES[0]?.id || "",
    handle: "", name: "", avatar_url: "",
    description: "", instructions: "",
    model: "claude-opus-4-7",
    custom_env: [{ k: "", v: "" }],
    custom_args: [],
    mcp_config: "{}",
  });
  const [errors, setErrors] = React.useState({});
  const [argDraft, setArgDraft] = React.useState("");

  /** @param {string} field @param {any} value */
  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  /** @returns {{ [key: string]: string }} */
  function validate() {
    const e = {};
    if (!/^[a-z0-9_]{2,}$/i.test(form.handle)) e.handle = "handle 必须是字母数字下划线，≥2 字符";
    if (form.instructions.length > 4000) e.instructions = "instructions 长度 ≤4000";
    try { JSON.parse(form.mcp_config); } catch { e.mcp_config = "mcp_config 必须是合法 JSON"; }
    return e;
  }

  /** @param {React.FormEvent} ev */
  function submit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) {
      pushToast(`Mock：将创建 agent @${form.handle}（原型不提交）`, "info");
      setTimeout(() => onCreated && onCreated(), 800);
    }
  }

  const inputStyle = window.__loginStyles.inputStyle;

  /**
   * Renders a labeled form field with optional error.
   * @param {string} label
   * @param {React.ReactNode} control
   * @param {string | undefined} err
   */
  function field(label, control, err) {
    return (
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)" }}>{label}</span>
        {control}
        {err && <span style={{ fontSize: "var(--text-xs)", color: "var(--state-failed)" }}>{err}</span>}
      </label>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">新建 agent</h1>
      </div>
      <form onSubmit={submit} className="card chunky" style={{ padding: "var(--sp-6)", display: "grid", gap: "var(--sp-4)", maxWidth: 720 }}>
        {field("runtime", (
          <select value={form.runtime_id} onChange={(e) => set("runtime_id", e.target.value)} style={inputStyle}>
            {window.MOCK.RUNTIMES.map(r => <option key={r.id} value={r.id}>{r.name} ({r.host || r.id})</option>)}
          </select>
        ))}
        {field("handle (工作区内唯一)", (
          <input value={form.handle} onChange={(e) => set("handle", e.target.value)} placeholder="例如 writer" style={inputStyle} />
        ), errors.handle)}
        {field("name", <input value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} />)}
        {field("avatar_url", <input value={form.avatar_url} onChange={(e) => set("avatar_url", e.target.value)} style={inputStyle} />)}
        {field("description", <textarea value={form.description} onChange={(e) => set("description", e.target.value)} style={{ ...inputStyle, minHeight: 60 }} />)}
        {field(`instructions (${form.instructions.length}/4000)`, (
          <textarea value={form.instructions} onChange={(e) => set("instructions", e.target.value)} style={{ ...inputStyle, minHeight: 100 }} />
        ), errors.instructions)}
        {field("model", (
          <select value={form.model} onChange={(e) => set("model", e.target.value)} style={inputStyle}>
            <option value="claude-opus-4-7">claude-opus-4-7</option>
            <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
            <option value="claude-haiku-4-5">claude-haiku-4-5</option>
          </select>
        ))}
        {field("custom_env", (
          <div style={{ display: "grid", gap: 4 }}>
            {form.custom_env.map((kv, i) => (
              <div key={i} style={{ display: "flex", gap: 4 }}>
                <input placeholder="KEY" value={kv.k} onChange={(e) => set("custom_env", form.custom_env.map((x, j) => j === i ? { ...x, k: e.target.value } : x))} style={inputStyle} />
                <input placeholder="value" value={kv.v} onChange={(e) => set("custom_env", form.custom_env.map((x, j) => j === i ? { ...x, v: e.target.value } : x))} style={inputStyle} />
                <button type="button" onClick={() => set("custom_env", form.custom_env.filter((_, j) => j !== i))} style={{ padding: "0 8px" }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => set("custom_env", [...form.custom_env, { k: "", v: "" }])} style={{ alignSelf: "start", padding: "4px 8px", background: "transparent", border: "1.5px dashed var(--hairline)", borderRadius: 4 }}>+ 增加</button>
          </div>
        ))}
        {field("custom_args", (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {form.custom_args.map((arg, i) => (
              <span key={i} style={{ padding: "2px 8px", background: "var(--paper-2)", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
                {arg} <button type="button" onClick={() => set("custom_args", form.custom_args.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer" }}>×</button>
              </span>
            ))}
            <input value={argDraft} onChange={(e) => setArgDraft(e.target.value)}
                   onKeyDown={(e) => { if (e.key === "Enter" && argDraft.trim()) { e.preventDefault(); set("custom_args", [...form.custom_args, argDraft.trim()]); setArgDraft(""); } }}
                   placeholder="回车增加" style={{ ...inputStyle, minWidth: 120 }} />
          </div>
        ))}
        {field("mcp_config (JSON)", (
          <textarea value={form.mcp_config} onChange={(e) => set("mcp_config", e.target.value)}
                    style={{ ...inputStyle, minHeight: 100, fontFamily: "var(--font-mono)" }} />
        ), errors.mcp_config)}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} style={{ padding: "8px 16px", background: "var(--paper-0)", border: "1.5px solid var(--ink-0)", borderRadius: "var(--r-sm)", cursor: "pointer" }}>取消</button>
          <button type="submit" style={window.__loginStyles.primaryBtn(false)}>创建 agent</button>
        </div>
      </form>
      {toasts.length > 0 && (
        <div style={{ position: "fixed", right: 24, bottom: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 1000 }}>
          {toasts.map(t => <window.ErrorBanner key={t.id} kind="toast" variant={t.variant} message={t.message} />)}
        </div>
      )}
    </div>
  );
}

window.AgentNew = AgentNew;
