// ====== Main App ======

const ACCENT_OPTIONS = [
  { label: "Poppy", value: "#cf4040", text: "#ffffff", soft: "#f7e1dd",                edge: "#b03333" },
  { label: "Moss",  value: "#4d6a3f", text: "#ffffff", soft: "oklch(95% 0.025 130)",   edge: "#36502b" },
  { label: "Honey", value: "#ecbf57", text: "#1b1820", soft: "oklch(96% 0.06 80)",     edge: "#b89030" },
  { label: "Plum",  value: "#1b1820", text: "#f4ede1", soft: "oklch(94% 0.015 320)",   edge: "#000000" },
];

function applyAccent(hex) {
  const opt = ACCENT_OPTIONS.find(o => o.value.toLowerCase() === hex.toLowerCase()) || ACCENT_OPTIONS[0];
  const root = document.documentElement;
  root.style.setProperty("--accent", opt.value);
  root.style.setProperty("--accent-text", opt.text);
  root.style.setProperty("--accent-soft", opt.soft);
  root.style.setProperty("--accent-edge", opt.edge);
}

function Sidebar({ route, ws, projects, activeProjectId, onNavigate, pendingApprovals }) {
  const navItems = [
    { key: "home", label: "概览", icon: "home" },
    { key: "approvals", label: "审批", icon: "approval", count: pendingApprovals },
    { key: "agents", label: "Agents", icon: "bot" },
    { key: "runtimes", label: "Runtimes", icon: "server" },
    { key: "settings", label: "设置", icon: "settings" },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="brand-block">B</div>
        <div>
          <div className="brand-text">Brainrot</div>
          <div className="brand-sub">v0.1 · 工作台</div>
        </div>
      </div>

      <div className="ws-switcher">
        <div className="ws-avatar" style={{ background: ws.color }}>{ws.initials}</div>
        <div className="ws-info">
          <div className="ws-name" title={ws.name}>{ws.name}</div>
          <div className="ws-meta mono">{ws.slug}</div>
        </div>
        <Icon name="chevron" size={14} />
      </div>

      <div className="sidebar-section">导航</div>
      {navItems.map(n => (
        <div key={n.key} className="nav-item" data-active={route.name === n.key} onClick={() => onNavigate({ name: n.key })}>
          <Icon name={n.icon} size={17} />
          <span>{n.label}</span>
          {n.count > 0 && <span className="count" style={{ background: "var(--accent)", color: "white", borderColor: "var(--border-dark)" }}>{n.count}</span>}
        </div>
      ))}

      <div className="sidebar-section">项目</div>
      {projects.map(p => (
        <div key={p.id} className="proj-item"
             data-active={route.name === "project" && activeProjectId === p.id || route.name === "task" && activeProjectId === p.id}
             onClick={() => onNavigate({ name: "project", projectId: p.id })}>
          <span className={"proj-swatch swatch-" + p.swatch}
                style={{
                  background: ({
                    green: "oklch(50% 0.10 145)",
                    blue:  "oklch(45% 0.09 245)",
                    pink:  "oklch(58% 0.16 25)",
                    amber: "oklch(76% 0.14 80)",
                    violet:"oklch(45% 0.11 320)",
                    teal:  "oklch(55% 0.09 200)",
                  })[p.swatch] || "var(--ink)"
                }} />
          <span title={p.name} style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
          <span className="text-muted" style={{ fontSize: 11, fontWeight: 700 }}>{p.open}</span>
        </div>
      ))}
      <div className="proj-item" style={{ color: "var(--muted)" }} onClick={() => alert("演示原型 — 不会真创建项目")}>
        <span style={{ width: 14, height: 14, display: "grid", placeItems: "center", border: "1.5px dashed var(--border-strong)", borderRadius: 5 }}><Icon name="plus" size={9} /></span>
        <span>新建项目</span>
      </div>

      <div className="sidebar-foot">
        <Avatar name={MOCK.USER.name} color={MOCK.USER.color} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{MOCK.USER.name}</div>
          <div className="text-muted mono" style={{ fontSize: 11 }}>@{MOCK.USER.handle}</div>
        </div>
        <button className="btn ghost sm icon-only" onClick={() => onNavigate({ name: "login" })} title="登出"><Icon name="x" size={14} /></button>
      </div>
    </aside>
  );
}

function TopBar({ route, ws, projects, onNavigate, pendingApprovals, online, setOnline }) {
  const project = route.projectId ? projects.find(p => p.id === route.projectId) : null;
  const task = route.taskId ? MOCK.TASKS.find(t => t.id === route.taskId) : null;
  return (
    <div className="topbar">
      <div className="crumb">
        <span className="seg" onClick={() => onNavigate({ name: "home" })}>{ws.name}</span>
        {project && <><span className="sep">/</span><span className={"seg" + (route.name === "project" ? " active" : "")} onClick={() => onNavigate({ name: "project", projectId: project.id })}>{project.name}</span></>}
        {task && <><span className="sep">/</span><span className="seg active">{task.title}</span></>}
        {route.name === "approvals" && <><span className="sep">/</span><span className="seg active">审批</span></>}
        {route.name === "agents" && <><span className="sep">/</span><span className="seg active">Agents</span></>}
        {route.name === "runtimes" && <><span className="sep">/</span><span className="seg active">Runtimes</span></>}
        {route.name === "settings" && <><span className="sep">/</span><span className="seg active">设置</span></>}
      </div>
      <span className="topbar-spacer" />

      <div className="search-box">
        <Icon name="search" size={14} />
        <input placeholder="搜任务、消息、@agent…" />
        <span className="kbd">⌘K</span>
      </div>

      <button className="icon-btn" title="审批" onClick={() => onNavigate({ name: "approvals" })}>
        <Icon name="bell" size={17} />
        {pendingApprovals > 0 && <span className="dot">{pendingApprovals}</span>}
      </button>
      <button className="icon-btn" title={online ? "在线" : "离线 · 点重连"} onClick={() => setOnline(o => !o)}>
        <span style={{ width: 10, height: 10, background: online ? "var(--success)" : "var(--faint)", border: "1.5px solid var(--border-dark)", borderRadius: 3 }} />
      </button>
      <Avatar name={MOCK.USER.name} color={MOCK.USER.color} size={36} />
    </div>
  );
}

function BrainrotTweaks() {
  const [t, setTweak] = useTweaks(window.__TWEAK_DEFAULTS__);

  useEffect(() => { applyAccent(t.accent); }, [t.accent]);
  useEffect(() => { document.documentElement.setAttribute("data-theme", t.theme); }, [t.theme]);
  useEffect(() => { document.documentElement.setAttribute("data-density", t.density); }, [t.density]);
  useEffect(() => { document.documentElement.style.setProperty("--depth", `${t.blockDepth}px`); }, [t.blockDepth]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="主题色" />
      <TweakColor label="Accent" value={t.accent}
        options={ACCENT_OPTIONS.map(o => o.value)}
        onChange={(v) => setTweak("accent", v)} />

      <TweakSection label="外观" />
      <TweakRadio label="主题" value={t.theme}
        options={[{ value: "light", label: "浅色" }, { value: "dark", label: "深色" }]}
        onChange={(v) => setTweak("theme", v)} />
      <TweakRadio label="密度" value={t.density}
        options={[{ value: "compact", label: "紧凑" }, { value: "cozy", label: "舒适" }, { value: "airy", label: "宽松" }]}
        onChange={(v) => setTweak("density", v)} />

      <TweakSection label="积木风" />
      <TweakSlider label="厚度" value={t.blockDepth} min={0} max={8} step={1} unit="px"
        onChange={(v) => setTweak("blockDepth", v)} />
    </TweaksPanel>
  );
}

function App() {
  const [route, setRoute] = useState({ name: "home" });
  const [ws] = useState(MOCK.WORKSPACES[0]);
  const [approvals, setApprovals] = useState(MOCK.APPROVALS);
  const [online, setOnline] = useState(true);

  const navigate = (r) => {
    if (r.name === "task" && r.taskId) {
      const task = MOCK.TASKS.find(t => t.id === r.taskId);
      setRoute({ name: "task", projectId: task.projectId, taskId: task.id });
    } else if (r.name === "project" || r.name === "project-assets" || r.name === "project-artifacts") {
      setRoute({ name: r.name, projectId: r.projectId });
    } else {
      setRoute({ name: r.name });
    }
  };

  const project = route.projectId ? MOCK.PROJECTS.find(p => p.id === route.projectId) : null;
  const task = route.taskId ? MOCK.TASKS.find(t => t.id === route.taskId) : null;
  const projTasks = project ? MOCK.TASKS.filter(t => t.projectId === project.id) : [];

  const decideApproval = (apId, decision) => {
    setApprovals(a => a.filter(x => x.id !== apId));
    // (could surface a toast here)
  };

  // Login / Register intercept the shell entirely (no sidebar/topbar)
  if (route.name === "login") {
    return <window.Login
      onLoggedIn={() => setRoute({ name: "home" })}
      onGotoRegister={() => setRoute({ name: "register" })}
    />;
  }
  if (route.name === "register") {
    return <window.Register
      onRegistered={() => setRoute({ name: "login" })}
      onGotoLogin={() => setRoute({ name: "login" })}
    />;
  }

  let content;
  if (route.name === "home") {
    content = <window.WorkspaceHome workspace={ws} projects={MOCK.PROJECTS}
                approvals={approvals}
                onOpenProject={(p) => navigate({ name: "project", projectId: p.id })}
                onOpenTask={(t) => navigate({ name: "task", taskId: t.id })}
                onDecideApproval={decideApproval}
                onNavigate={navigate} />;
  } else if (route.name === "project" && project) {
    content = <window.ProjectBoard project={project} tasks={projTasks}
                onOpenTask={(t) => navigate({ name: "task", taskId: t.id })}
                activeTab="tasks"
                onTabChange={(t) => {
                  if (t === "assets") navigate({ name: "project-assets", projectId: project.id });
                  else if (t === "artifacts") navigate({ name: "project-artifacts", projectId: project.id });
                }} />;
  } else if (route.name === "project-assets" && project) {
    content = <window.ProjectAssets project={project} />;
  } else if (route.name === "project-artifacts" && project) {
    content = <window.ProjectArtifacts project={project} />;
  } else if (route.name === "task" && project && task) {
    content = <window.TaskDetail project={project} task={task} tasks={projTasks}
                onOpenTask={(t) => navigate({ name: "task", taskId: t.id })}
                onBack={() => navigate({ name: "project", projectId: project.id })} />;
  } else if (route.name === "approvals") {
    content = <window.ApprovalsHub approvals={approvals} onDecide={decideApproval}
                onOpenTask={(t) => navigate({ name: "task", taskId: t.id })} />;
  } else if (route.name === "agents") {
    content = <window.AgentsList onNew={() => setRoute({ name: "agents-new" })} />;
  } else if (route.name === "agents-new") {
    content = <window.AgentNew
      onCancel={() => setRoute({ name: "agents" })}
      onCreated={() => setRoute({ name: "agents" })} />;
  } else if (route.name === "runtimes") {
    content = <window.RuntimesList />;
  } else if (route.name === "settings") {
    content = <window.WorkspaceSettings ws={ws} />;
  }

  return (
    <div className="app">
      <Sidebar route={route} ws={ws} projects={MOCK.PROJECTS}
        activeProjectId={route.projectId}
        onNavigate={navigate}
        pendingApprovals={approvals.length}
      />
      <div className="main">
        <TopBar route={route} ws={ws} projects={MOCK.PROJECTS}
          onNavigate={navigate}
          pendingApprovals={approvals.length}
          online={online}
          setOnline={setOnline}
        />
        {!online && (
          <div className="banner">实时连接已断开，正在重连…</div>
        )}
        {content}
      </div>
      <BrainrotTweaks />
    </div>
  );
}

// initial accent / theme / density
applyAccent(window.__TWEAK_DEFAULTS__.accent);
document.documentElement.setAttribute("data-theme", window.__TWEAK_DEFAULTS__.theme);
document.documentElement.setAttribute("data-density", window.__TWEAK_DEFAULTS__.density);
document.documentElement.style.setProperty("--depth", `${window.__TWEAK_DEFAULTS__.blockDepth}px`);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
