"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";
import { BrandMark } from "@/components/brand/brand-mark";
import { WorkspaceSwitcherDropdown } from "@/components/workspace/WorkspaceSwitcherDropdown";
import { NavItem } from "@/components/brand/nav-item";
import { ProjItem } from "@/components/brand/proj-item";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/brand/tooltip";
import { swatchFromId } from "@/lib/swatch";
import { messages } from "@/lib/messages";

export function Sidebar() {
  const params = useParams<{ wsId?: string; projectId?: string }>();
  const wsId = params.wsId ?? null;
  const activeProjectId = params.projectId ?? null;

  const { data: projects = [] } = useQuery({
    queryKey: wsId ? queryKeys.workspaces.projects(wsId) : ["projects-disabled"],
    queryFn: () => projectsApi.list(wsId!),
    enabled: !!wsId,
  });

  return (
    <TooltipProvider>
      <aside className="w-60 shrink-0 bg-paper-0 border-r-[1.5px] border-hairline flex flex-col overflow-hidden">
        {/* head */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b-[1.5px] border-hairline">
          <BrandMark logo="B" />
          <div className="min-w-0 overflow-hidden">
            <div className="font-extrabold text-[17px] text-ink-0 tracking-tight truncate font-tight">
              Brainrot
            </div>
            <div className="text-[11px] font-medium text-ink-2 truncate">
              v0.1 · 工作台
            </div>
          </div>
        </div>

        {/* ws switcher */}
        <div className="px-3 pt-3 pb-1.5">
          <WorkspaceSwitcherDropdown />
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          <p className="px-4 pt-3 pb-1.5 text-[10.5px] font-extrabold tracking-[0.08em] text-ink-3 uppercase">
            导航
          </p>
          {wsId ? (
            <Link href={`/w/${wsId}`}>
              <NavItem active>概览</NavItem>
            </Link>
          ) : (
            <NavItem>概览</NavItem>
          )}
          <Link href="/approvals">
            <NavItem>{messages.shell.pendingApprovals}</NavItem>
          </Link>
          {wsId ? (
            <Link href={`/w/${wsId}/agents`}>
              <NavItem>{messages.shell.agents}</NavItem>
            </Link>
          ) : (
            <NavItem>{messages.shell.agents}</NavItem>
          )}
          {wsId ? (
            <Link href={`/w/${wsId}/runtimes`}>
              <NavItem>{messages.shell.runtimes}</NavItem>
            </Link>
          ) : (
            <NavItem>{messages.shell.runtimes}</NavItem>
          )}
          {wsId ? (
            <Link href={`/w/${wsId}/settings`}>
              <NavItem>{messages.shell.settings}</NavItem>
            </Link>
          ) : (
            <NavItem>{messages.shell.settings}</NavItem>
          )}

          {/* projects */}
          <p className="px-4 pt-4 pb-1.5 text-[10.5px] font-extrabold tracking-[0.08em] text-ink-3 uppercase">
            {messages.shell.projects}
          </p>
          {wsId &&
            projects.map((p) => (
              <Link key={p.id} href={`/w/${wsId}/p/${p.id}`}>
                <ProjItem
                  swatch={swatchFromId(p.id)}
                  active={p.id === activeProjectId}
                  title={p.name}
                >
                  {p.name}
                </ProjItem>
              </Link>
            ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <ProjItem disabled>+ 新建项目</ProjItem>
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              {messages.shell.writesDisabled}
            </TooltipContent>
          </Tooltip>
        </nav>
      </aside>
    </TooltipProvider>
  );
}
