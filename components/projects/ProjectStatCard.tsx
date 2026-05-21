"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, CircleDot, Activity, CheckCircle2 } from "lucide-react";
import { swatchTokens, type SwatchName } from "@/components/brand/proj-item";
import { swatchFromId } from "@/lib/swatch";
import { relativeTime } from "@/lib/format";
import { tasksApi } from "@/lib/api/tasks";
import { queryKeys } from "@/lib/api/keys";
import type { Project, TaskCard } from "@/lib/api/types";

interface ProjectStatCardProps {
  wsId: string;
  project: Project;
  /** stagger animation index for staggered page-load reveal */
  index?: number;
}

interface StatusCounts {
  open: number;
  in_progress: number;
  done: number;
  blocked: number;
  archived: number;
  busy: number;
  total: number;
  uniqueAgents: number;
  latestUpdate: string | null;
}

function summarize(tasks: ReadonlyArray<TaskCard>): StatusCounts {
  const acc: StatusCounts = {
    open: 0,
    in_progress: 0,
    done: 0,
    blocked: 0,
    archived: 0,
    busy: 0,
    total: 0,
    uniqueAgents: 0,
    latestUpdate: null,
  };
  const agentSet = new Set<string>();
  for (const t of tasks) {
    acc.total += 1;
    acc[t.status] += 1;
    if (t.busy) acc.busy += 1;
    for (const a of t.agents ?? []) agentSet.add(a);
    if (!acc.latestUpdate || t.updated_at > acc.latestUpdate) {
      acc.latestUpdate = t.updated_at;
    }
  }
  acc.uniqueAgents = agentSet.size;
  return acc;
}

export function ProjectStatCard({ wsId, project, index = 0 }: ProjectStatCardProps) {
  const swatch: SwatchName = swatchFromId(project.id);
  const tokens = swatchTokens[swatch];
  const tasksQ = useQuery({
    queryKey: queryKeys.projects.tasks(project.id),
    queryFn: () => tasksApi.list(project.id),
    staleTime: 60_000,
  });

  const stats = useMemo(() => summarize(tasksQ.data ?? []), [tasksQ.data]);
  const ratio = stats.total > 0 ? stats.done / stats.total : 0;

  return (
    <Link
      href={`/w/${wsId}/p/${project.id}`}
      className="group block focus:outline-none"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <article
        className="relative h-full rounded-xl aero-glass overflow-hidden card-lift hover:card-lift-hover focus-within:shadow-[var(--focus-ring)]"
      >
        {/* Top edge — Aero glass highlight (no project color here, kept
            in the small dot beside the name so blue palette stays clean) */}
        <div
          aria-hidden
          className="absolute top-0 inset-x-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)",
          }}
        />

        <div className="p-5">
          {/* Header: name + status chip */}
          <header className="flex items-start gap-3 mb-3">
            <span
              aria-hidden
              className="mt-1.5 w-2 h-2 rounded-full shrink-0"
              style={{
                background: tokens.stripe,
                boxShadow: `0 0 0 4px color-mix(in srgb, ${tokens.stripe} 18%, transparent)`,
              }}
            />
            <div className="min-w-0 flex-1">
              <h3
                className="text-[15px] font-semibold text-ink-0 leading-snug m-0 truncate"
                title={project.name}
              >
                {project.name}
              </h3>
              {project.description && (
                <p className="text-[12.5px] text-ink-2 mt-1 leading-[1.5] line-clamp-2 m-0">
                  {project.description}
                </p>
              )}
            </div>
            <ChevronRight
              className="w-4 h-4 text-ink-3 shrink-0 mt-1.5 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-1"
              aria-hidden
            />
          </header>

          {/* Live status row — three numeric facts, tabular */}
          <div className="grid grid-cols-3 gap-2 mb-3.5">
            <Metric
              icon={<CircleDot className="w-3 h-3" />}
              label="任务"
              value={stats.total}
              loading={tasksQ.isPending}
            />
            <Metric
              icon={<Activity className="w-3 h-3" />}
              label="进行中"
              value={stats.in_progress + stats.busy}
              accent={stats.in_progress + stats.busy > 0}
              loading={tasksQ.isPending}
            />
            <Metric
              icon={<CheckCircle2 className="w-3 h-3" />}
              label="已完成"
              value={stats.done}
              loading={tasksQ.isPending}
            />
          </div>

          {/* Progress hairline */}
          {stats.total > 0 && (
            <div className="mb-3.5">
              <div
                className="relative h-[3px] rounded-full overflow-hidden bg-paper-2"
                aria-label={`完成 ${Math.round(ratio * 100)}%`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-500"
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer: agent count + last activity */}
          <footer className="flex items-center justify-between text-[11.5px] text-ink-2">
            <span className="flex items-center gap-1.5">
              {stats.uniqueAgents > 0 ? (
                <>
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent-wash text-accent text-[10px] font-semibold"
                    aria-hidden
                  >
                    @
                  </span>
                  <span>
                    {stats.uniqueAgents} 位 agent 参与
                  </span>
                </>
              ) : (
                <span className="text-ink-3">尚未派工</span>
              )}
            </span>
            <span className="font-mono tabular-nums text-ink-3">
              {stats.latestUpdate
                ? relativeTime(stats.latestUpdate)
                : relativeTime(project.created_at)}
            </span>
          </footer>
        </div>
      </article>
    </Link>
  );
}

function Metric({
  icon,
  label,
  value,
  accent,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className="rounded-md px-2.5 py-2 flex flex-col gap-1"
      style={{
        background: "rgba(255,255,255,0.45)",
        border: "1px solid rgba(255,255,255,0.55)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      <span className="flex items-center gap-1 text-[10.5px] uppercase tracking-wider text-ink-3 font-medium">
        {icon}
        {label}
      </span>
      <span
        className={`text-[18px] font-semibold leading-none tabular-nums ${
          accent ? "text-accent" : "text-ink-0"
        } ${loading ? "opacity-40" : ""}`}
      >
        {loading ? "·" : value}
      </span>
    </div>
  );
}
