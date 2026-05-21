"use client";

import { use, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/brand/button";
import { SectionHead } from "@/components/brand/section-head";
import { Pills, Pill } from "@/components/brand/tag";
import { StatCard } from "@/components/brand/stat-card";
import {
  RailSection,
  RailHead,
  RailEmpty,
} from "@/components/brand/rail-section";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/brand/tooltip";
import { EmptyState } from "@/components/common/EmptyState";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { useProjects } from "@/hooks/useProjects";
import { useSession } from "@/hooks/useSession";
import { messages } from "@/lib/messages";

interface PageProps {
  params: Promise<{ wsId: string }>;
}

export default function WorkspaceHomePage({ params }: PageProps) {
  const { wsId } = use(params);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: projects, isPending } = useProjects(wsId);
  const session = useSession();
  const user = session.data;
  const wsName =
    (user?.name || user?.email?.split("@")[0] || "工作区");

  return (
    <TooltipProvider>
      <div className="p-7 home-page h-full overflow-y-auto">
        <div className="home-grid">
          {/* Compact Linear-style page header */}
          <section className="hero flex flex-col justify-end gap-1">
            <p className="text-xs text-ink-2 font-medium tracking-wide mb-0.5">
              {wsName}
            </p>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h1 className="text-[18px] font-medium text-ink-0 leading-snug m-0">
                概览
              </h1>
              <div className="flex gap-2 items-center flex-wrap">
                <Button size="default" onClick={() => setCreateOpen(true)}>
                  + 新建项目
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="ghost" size="default" disabled>
                        召唤 agent
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>S4 上线后启用</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </section>

          {/* Stat cards — neutral gray, no red hot card */}
          <section className="stat-grid grid grid-cols-2 gap-3">
            <StatCard label="待审批" value="—" foot="—" />
            <StatCard label="在线" value="—" foot="—" />
            <StatCard label="今日新建" value="—" foot="—" />
            <StatCard label="已完成" value="—" foot="—" />
          </section>

          {/* Project list */}
          <section className="home-projects min-w-0">
            <SectionHead title="项目" count={projects?.length ?? 0}>
              <Pills>
                <Pill active>我的</Pill>
                <Pill>全部</Pill>
              </Pills>
            </SectionHead>
            {isPending && <PageSkeleton />}
            {!isPending && projects && projects.length === 0 && (
              <EmptyState
                title={messages.empty.noProjects.title}
                description={messages.empty.noProjects.description}
                action={
                  <Button size="default" onClick={() => setCreateOpen(true)}>
                    新建项目
                  </Button>
                }
              />
            )}
            {!isPending && projects && projects.length > 0 && (
              <ProjectGrid wsId={wsId} projects={projects} />
            )}
          </section>

          {/* Approval rail — clickable entry instead of a dead count */}
          <section className="home-rail">
            <RailSection>
              <RailHead dot>待审批</RailHead>
              <RailEmpty>暂无待审批，agent 安静着</RailEmpty>
              <div className="px-4 pb-3">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink-0 transition-colors group"
                >
                  <span>查看全部审批</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </RailSection>
          </section>
        </div>
      </div>
      <CreateProjectModal open={createOpen} onOpenChange={setCreateOpen} wsId={wsId} />
    </TooltipProvider>
  );
}
