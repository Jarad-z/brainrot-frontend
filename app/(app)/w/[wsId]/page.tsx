"use client";

import { use } from "react";
import {
  HeroEyebrow,
  HeroTitle,
  HeroPop,
  HeroArrow,
  HeroSub,
} from "@/components/brand/hero";
import { Button } from "@/components/brand/button";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/brand/tooltip";
import { SectionHead } from "@/components/brand/section-head";
import { Pills, Pill } from "@/components/brand/tag";
import { StatCard } from "@/components/brand/stat-card";
import {
  RailSection,
  RailHead,
  RailEmpty,
} from "@/components/brand/rail-section";
import { EmptyState } from "@/components/common/EmptyState";
import { PageSkeleton } from "@/components/common/PageSkeleton";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { useProjects } from "@/hooks/useProjects";
import { useSession } from "@/hooks/useSession";
import { messages } from "@/lib/messages";

interface PageProps {
  params: Promise<{ wsId: string }>;
}

export default function WorkspaceHomePage({ params }: PageProps) {
  const { wsId } = use(params);
  const { data: projects, isPending } = useProjects(wsId);
  const session = useSession();
  const user = session.data;
  const firstName =
    user?.Name?.split(/\s+/)[0] ??
    user?.Email?.split("@")[0] ??
    "";

  return (
    <TooltipProvider>
      <div className="p-7 home-page">
        <div className="home-grid">
          <section className="hero relative flex flex-col justify-end">
            <HeroEyebrow>
              <span className="dot" /> · 概览
            </HeroEyebrow>
            <HeroTitle>
              {firstName && `${firstName}, `}今天 <HeroPop>开干</HeroPop>
              <HeroArrow />
            </HeroTitle>
            <HeroSub>该开始干了。先把今天最重要的一件事拎出来。</HeroSub>
            <div className="flex gap-2.5 flex-wrap items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button size="big" disabled>
                      + 新建项目
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{messages.shell.writesDisabled}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="ghost" size="big" disabled>
                      召唤 agent
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>S2 上线后启用</TooltipContent>
              </Tooltip>
            </div>
          </section>

          <section className="stat-grid grid grid-cols-2 gap-3">
            <StatCard hot label="待审批" value="—" foot="—" />
            <StatCard label="在线" value="—" foot="—" />
            <StatCard label="今日新建" value="—" foot="—" />
            <StatCard label="已完成" value="—" foot="—" />
          </section>

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
              />
            )}
            {!isPending && projects && projects.length > 0 && (
              <ProjectGrid wsId={wsId} projects={projects} />
            )}
          </section>

          <section className="home-rail">
            <RailSection>
              <RailHead dot>待审批 · 0 件</RailHead>
              <RailEmpty>暂无待审批，agent 安静着</RailEmpty>
            </RailSection>
          </section>
        </div>
      </div>
    </TooltipProvider>
  );
}
