"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useProjects } from "@/hooks/useProjects";
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
import { useWorkspaceContext } from "@/lib/workspace-context";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";

const LAST_WS_KEY = "brainrot.lastWsId";

export function Sidebar() {
  const params = useParams<{ wsId?: string; projectId?: string }>();
  const pathname = usePathname() ?? "";
  const wsId = params.wsId ?? null;
  const activeProjectId = params.projectId ?? null;
  const { wsList } = useWorkspaceContext();

  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  // Fallback wsId so nav items remain functional on workspace-agnostic pages
  // (e.g. top-level /approvals). Read localStorage lazily on the client only.
  const [lastWsId, setLastWsId] = useState<string | null>(null);
  useEffect(() => {
    try {
      setLastWsId(localStorage.getItem(LAST_WS_KEY));
    } catch {
      // localStorage may be unavailable — ignore
    }
  }, []);

  // Only honor lastWsId if it's still a workspace the user is a member of —
  // otherwise sidebar links would point to a 403 ws and trap the user.
  const isLastWsValid = !!lastWsId && wsList.some((w) => w.id === lastWsId);
  useEffect(() => {
    if (lastWsId && wsList.length > 0 && !isLastWsValid) {
      try {
        localStorage.removeItem(LAST_WS_KEY);
      } catch {
        // ignore
      }
      setLastWsId(null);
    }
  }, [lastWsId, wsList, isLastWsValid]);

  const effectiveWsId =
    wsId ?? (isLastWsValid ? lastWsId : null) ?? wsList[0]?.id ?? null;

  const { data: projects = [] } = useProjects(effectiveWsId ?? "");

  const isOverview = !!wsId && pathname === `/w/${wsId}`;
  const isApprovals =
    pathname === "/approvals" || /^\/w\/[^/]+\/approvals$/.test(pathname);
  const isAgents = !!wsId && pathname === `/w/${wsId}/agents`;
  const isRuntimes = !!wsId && pathname === `/w/${wsId}/runtimes`;
  const isSettings = !!wsId && pathname === `/w/${wsId}/settings`;

  return (
    <TooltipProvider>
      <aside className="sidebar aero-glass w-[228px] h-full shrink-0 rounded-2xl flex flex-col overflow-hidden">
        {/* head */}
        <div className="flex items-center gap-2.5 px-4 py-4">
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
          <p className="px-4 pt-3 pb-1.5 pixel-label">
            导航
          </p>
          {effectiveWsId ? (
            <Link href={`/w/${effectiveWsId}`}>
              <NavItem active={isOverview} swatch="bondi">概览</NavItem>
            </Link>
          ) : (
            <NavItem swatch="bondi">概览</NavItem>
          )}
          <Link href="/approvals">
            <NavItem active={isApprovals} swatch="strawberry">{messages.shell.pendingApprovals}</NavItem>
          </Link>
          {effectiveWsId ? (
            <Link href={`/w/${effectiveWsId}/agents`}>
              <NavItem active={isAgents} swatch="grape">{messages.shell.agents}</NavItem>
            </Link>
          ) : (
            <NavItem swatch="grape">{messages.shell.agents}</NavItem>
          )}
          {effectiveWsId ? (
            <Link href={`/w/${effectiveWsId}/runtimes`}>
              <NavItem active={isRuntimes} swatch="lime">{messages.shell.runtimes}</NavItem>
            </Link>
          ) : (
            <NavItem swatch="lime">{messages.shell.runtimes}</NavItem>
          )}
          {effectiveWsId ? (
            <Link href={`/w/${effectiveWsId}/settings`}>
              <NavItem active={isSettings} swatch="tangerine">{messages.shell.settings}</NavItem>
            </Link>
          ) : (
            <NavItem swatch="tangerine">{messages.shell.settings}</NavItem>
          )}

          {/* projects */}
          <p className="px-4 pt-4 pb-1.5 pixel-label">
            {messages.shell.projects}
          </p>
          {effectiveWsId &&
            projects.map((p) => (
              <Link key={p.id} href={`/w/${effectiveWsId}/p/${p.id}`}>
                <ProjItem
                  swatch={swatchFromId(p.id)}
                  active={p.id === activeProjectId}
                  title={p.name}
                >
                  {p.name}
                </ProjItem>
              </Link>
            ))}
          {effectiveWsId ? (
            <ProjItem
              role="button"
              tabIndex={0}
              onClick={() => setCreateProjectOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setCreateProjectOpen(true);
                }
              }}
            >
              + 新建项目
            </ProjItem>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <ProjItem disabled>+ 新建项目</ProjItem>
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">
                {messages.shell.wsListEmpty}
              </TooltipContent>
            </Tooltip>
          )}
        </nav>
      </aside>
      {effectiveWsId ? (
        <CreateProjectModal
          open={createProjectOpen}
          onOpenChange={setCreateProjectOpen}
          wsId={effectiveWsId}
        />
      ) : null}
    </TooltipProvider>
  );
}
