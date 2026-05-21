"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  Cpu,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/brand/button";
import { ProjectStatCard } from "@/components/projects/ProjectStatCard";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { useProjects } from "@/hooks/useProjects";
import { useSession } from "@/hooks/useSession";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { useWorkspaceAgents } from "@/hooks/useWorkspaceAgents";
import { useWorkspacePendingApprovals } from "@/hooks/useWorkspacePendingApprovals";
import { useCountdown } from "@/lib/chat/use-countdown";
import { agentColor } from "@/components/brand/avatar";

interface PageProps {
  params: Promise<{ wsId: string }>;
}

export default function WorkspaceHomePage({ params }: PageProps) {
  const { wsId } = use(params);
  const [createOpen, setCreateOpen] = useState(false);

  const session = useSession();
  const { data: projects = [], isPending: projectsPending } = useProjects(wsId);
  const { data: runtimes = [] } = useWorkspaceRuntimes(wsId);
  const { data: agents = [] } = useWorkspaceAgents(wsId);
  const pendingApprovals = useWorkspacePendingApprovals(wsId);

  const user = session.data;
  const displayName = (user?.name || user?.email?.split("@")[0] || "你").trim();

  const onlineRuntimes = runtimes.filter((r) => r.online);
  const activeAgents = agents.filter((a) => !a.archived);

  const hero = useMemo(() => {
    const parts: string[] = [];
    parts.push(`${projects.length} 个项目`);
    parts.push(`${activeAgents.length} 位 agent`);
    parts.push(
      onlineRuntimes.length > 0
        ? `${onlineRuntimes.length} 个 daemon 在线`
        : "daemon 离线",
    );
    return parts.join(" · ");
  }, [projects.length, activeAgents.length, onlineRuntimes.length]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1280px] mx-auto px-8 py-8">
        {/* ============================================================
            HERO — single sentence + actions. No empty stat boxes.
            ============================================================ */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
          <div className="min-w-0">
            <p className="text-[11.5px] uppercase tracking-[0.14em] text-ink-3 font-semibold mb-2">
              Workspace
            </p>
            <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-ink-0 leading-[1.15] m-0">
              你好 {displayName}
              <span className="text-ink-3">.</span>
            </h1>
            <p className="text-[14px] text-ink-2 mt-1.5 m-0">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle ${
                  onlineRuntimes.length > 0
                    ? "bg-accent-moss animate-status-pulse"
                    : "bg-ink-3"
                }`}
                aria-hidden
              />
              {hero}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="default"
              onClick={() => {
                /* @召唤 agent — S4 */
              }}
              disabled
            >
              <Sparkles className="w-4 h-4" />
              召唤 agent
            </Button>
            <Button size="default" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              新建项目
            </Button>
          </div>
        </header>

        {/* Activity strip — only renders if there's something to say */}
        <ActivityStrip
          wsId={wsId}
          pendingCount={pendingApprovals.length}
          firstApproval={pendingApprovals[0]}
        />

        {/* ============================================================
            MAIN GRID — projects (left) + workshop status (right rail)
            ============================================================ */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 mt-7">
          {/* ----- Projects column ----- */}
          <section className="min-w-0">
            <div className="flex items-baseline justify-between mb-3.5">
              <h2 className="text-[15px] font-semibold text-ink-0 m-0 flex items-baseline gap-2">
                项目
                <span className="text-[12px] font-mono text-ink-3 tabular-nums">
                  {projects.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="text-[12.5px] text-ink-2 hover:text-accent transition-colors inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                新建
              </button>
            </div>

            {projectsPending ? (
              <ProjectGridSkeleton />
            ) : projects.length === 0 ? (
              <EmptyProjectCallout onCreate={() => setCreateOpen(true)} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p, i) => (
                  <ProjectStatCard key={p.id} wsId={wsId} project={p} index={i} />
                ))}
              </div>
            )}
          </section>

          {/* ----- Workshop status rail ----- */}
          <aside className="min-w-0 flex flex-col gap-5">
            <RuntimeRail wsId={wsId} runtimes={runtimes} />
            <AgentRoster wsId={wsId} agents={activeAgents} />
          </aside>
        </div>
      </div>

      <CreateProjectModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        wsId={wsId}
      />
    </div>
  );
}

/* ================================================================
   Activity strip — pending approvals get top billing as a live row,
   otherwise we say something positive (not "暂无").
   ================================================================ */
function ActivityStrip({
  wsId,
  pendingCount,
  firstApproval,
}: {
  wsId: string;
  pendingCount: number;
  firstApproval: ReturnType<typeof useWorkspacePendingApprovals>[number] | undefined;
}) {
  const { label, urgent } = useCountdown(firstApproval?.expiresAt);

  if (pendingCount === 0) {
    return (
      <Link
        href={`/w/${wsId}/approvals`}
        className="block rounded-xl aero-glass px-5 py-3.5 hover:border-accent/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="w-8 h-8 rounded-full bg-accent-wash text-accent grid place-items-center"
          >
            <CheckMark />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-medium text-ink-0 m-0">
              没有待审批
              <span className="text-ink-3 font-normal">
                {" "}· agent 都在待命
              </span>
            </p>
            <p className="text-[11.5px] text-ink-3 m-0 mt-0.5">
              派一个 @mention 给 agent，工具调用会出现在这里等你拍板。
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-3 group-hover:text-ink-1 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/w/${wsId}/approvals`}
      className="block rounded-xl aero-glass-blue px-5 py-3.5 transition-all group hover:brightness-105"
    >
      <div className="flex items-center gap-3 text-white" style={{ textShadow: "0 -1px 0 rgba(30,72,119,0.35)" }}>
        <span
          aria-hidden
          className="relative w-8 h-8 rounded-full grid place-items-center"
          style={{
            background: "rgba(255,255,255,0.25)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          <span className="text-[14px] font-bold leading-none">{pendingCount}</span>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-countdown-urgent border-2 border-white" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold m-0">
            {pendingCount} 件等你审批
          </p>
          {firstApproval && (
            <p className="text-[11.5px] m-0 mt-0.5 truncate text-white/85">
              <span className="font-mono">@{firstApproval.toolName}</span>
              <span className="text-white/55"> · </span>
              {firstApproval.projectName}
              <span className="text-white/55"> / </span>
              {firstApproval.taskTitle}
              <span className="text-white/55"> · </span>
              <span
                className={`font-mono tabular-nums ${
                  urgent ? "text-countdown-urgent font-semibold" : ""
                }`}
              >
                {label}
              </span>
            </p>
          )}
        </div>
        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
      </div>
    </Link>
  );
}

function CheckMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M2.5 7.5L5.5 10.5L11.5 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ================================================================
   Runtime rail — real daemon presence. Each card shows host + capacity.
   ================================================================ */
function RuntimeRail({
  wsId,
  runtimes,
}: {
  wsId: string;
  runtimes: ReturnType<typeof useWorkspaceRuntimes>["data"] extends infer T
    ? T extends ReadonlyArray<infer U>
      ? U[]
      : never
    : never;
}) {
  void wsId;
  if (!runtimes || runtimes.length === 0) {
    return (
      <section className="rounded-xl aero-glass border-dashed px-4 py-5">
        <RailHeading icon={<Cpu className="w-3.5 h-3.5" />}>Daemon</RailHeading>
        <p className="text-[12.5px] text-ink-2 m-0">
          还没注册 daemon。在桌面端 register.html 里粘 install token 来上线。
        </p>
      </section>
    );
  }
  return (
    <section className="rounded-xl aero-glass px-4 py-4">
      <RailHeading icon={<Cpu className="w-3.5 h-3.5" />}>
        Daemon
        <span className="ml-1.5 text-[11px] font-mono text-ink-3 tabular-nums">
          {runtimes.filter((r) => r.online).length}/{runtimes.length}
        </span>
      </RailHeading>
      <ul className="flex flex-col gap-2 m-0 p-0 list-none">
        {runtimes.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-2.5 px-2 py-1.5 -mx-2 rounded-lg hover:bg-white/40 transition-colors"
          >
            <span
              aria-hidden
              className={`relative w-2 h-2 rounded-full shrink-0 ${
                r.online ? "bg-accent-moss" : "bg-ink-3"
              }`}
            >
              {r.online && (
                <span className="absolute inset-0 rounded-full bg-accent-moss animate-ping opacity-50" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-ink-0 m-0 truncate">
                {r.host || "daemon"}
              </p>
              <p className="text-[10.5px] text-ink-3 font-mono m-0 truncate">
                {r.online
                  ? "online"
                  : r.last_heartbeat
                    ? `last seen ${r.last_heartbeat.slice(11, 16)}`
                    : "offline"}
              </p>
            </div>
            <span className="text-[10.5px] font-mono text-ink-3 tabular-nums shrink-0">
              cap {r.capacity}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ================================================================
   Agent roster — handles list with deterministic identity colors.
   ================================================================ */
function AgentRoster({
  wsId,
  agents,
}: {
  wsId: string;
  agents: ReturnType<typeof useWorkspaceAgents>["data"] extends infer T
    ? T extends ReadonlyArray<infer U>
      ? U[]
      : never
    : never;
}) {
  if (!agents || agents.length === 0) {
    return (
      <section className="rounded-xl aero-glass border-dashed px-4 py-5">
        <RailHeading icon={<AtIcon />}>Agents</RailHeading>
        <p className="text-[12.5px] text-ink-2 m-0">
          还没注册 agent。
        </p>
        <Link
          href={`/w/${wsId}/agents`}
          className="text-[12px] text-accent font-medium inline-flex items-center gap-1 mt-2 hover:underline"
        >
          去注册 <ChevronRight className="w-3 h-3" />
        </Link>
      </section>
    );
  }

  const visible = agents.slice(0, 6);
  const overflow = agents.length - visible.length;

  return (
    <section className="rounded-xl aero-glass px-4 py-4">
      <RailHeading icon={<AtIcon />}>
        Agents
        <span className="ml-1.5 text-[11px] font-mono text-ink-3 tabular-nums">
          {agents.length}
        </span>
      </RailHeading>
      <ul className="flex flex-col gap-1 m-0 p-0 list-none">
        {visible.map((a) => {
          const color = agentColor(a.handle);
          return (
            <li key={a.id}>
              <Link
                href={`/w/${wsId}/agents`}
                className="flex items-center gap-2.5 px-2 py-1.5 -mx-2 rounded-lg hover:bg-white/40 transition-colors"
              >
                <span
                  className="grid place-items-center w-6 h-6 rounded-md text-paper-0 text-[10px] font-bold shrink-0"
                  style={{ background: color }}
                  aria-hidden
                >
                  {a.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-ink-0 m-0 truncate">
                    {a.name}
                  </p>
                  <p className="text-[10.5px] text-ink-3 font-mono m-0 truncate">
                    @{a.handle}
                    {a.model ? ` · ${a.model}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {overflow > 0 && (
        <Link
          href={`/w/${wsId}/agents`}
          className="text-[11.5px] text-ink-2 hover:text-accent transition-colors inline-flex items-center gap-1 mt-2 pl-2"
        >
          +{overflow} 位
          <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </section>
  );
}

function AtIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="2.4" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9.4 7v.7a1.3 1.3 0 002.6 0V7a5 5 0 10-2 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function RailHeading({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-ink-2 font-semibold m-0 mb-3">
      <span className="text-ink-3">{icon}</span>
      {children}
    </h3>
  );
}

/* ================================================================
   Skeleton + empty
   ================================================================ */
function ProjectGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-xl aero-glass h-[200px] overflow-hidden"
        >
          <div className="skeleton-pixel h-full w-full opacity-50" />
        </div>
      ))}
    </div>
  );
}

function EmptyProjectCallout({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl aero-glass border-dashed px-8 py-12 flex flex-col items-center text-center gap-3">
      <span
        aria-hidden
        className="w-12 h-12 rounded-2xl bg-accent-wash text-accent grid place-items-center"
      >
        <Plus className="w-5 h-5" />
      </span>
      <h3 className="text-[16px] font-semibold text-ink-0 m-0">
        还没有项目
      </h3>
      <p className="text-[13px] text-ink-2 max-w-[42ch] m-0 leading-[1.55]">
        项目是工作的容器。给它一个名字，然后在里面建任务卡、@ 一个 agent，
        看它干活。
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-2 px-4 py-2 bg-accent text-accent-fg rounded-lg font-semibold text-sm hover:opacity-90 shadow-[var(--shadow-1)] transition-opacity inline-flex items-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        建第一个项目
      </button>
    </div>
  );
}
