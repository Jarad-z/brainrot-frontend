"use client";

import Link from "next/link";
import { Card } from "@/components/brand/card";
import { ProjTopstrip } from "@/components/brand/proj-topstrip";
import { swatchFromId } from "@/lib/swatch";
import { relativeTime } from "@/lib/format";
import type { Project } from "@/lib/api/types";

interface ProjectCardProps {
  wsId: string;
  project: Project;
}

export function ProjectCard({ wsId, project }: ProjectCardProps) {
  const swatch = swatchFromId(project.id);
  return (
    <Link href={`/w/${wsId}/p/${project.id}`} className="block">
      <Card chunky className="overflow-hidden p-0 hover:-translate-y-0.5 transition-transform">
        <ProjTopstrip swatch={swatch} className="h-[130px]" />
        <div className="p-4">
          <h3
            className="text-[15px] font-medium text-ink-0"
            style={{
              wordBreak: "keep-all",
              overflowWrap: "break-word",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {project.name}
          </h3>
          {project.description && (
            <p className="text-xs text-ink-2 mt-1 line-clamp-2 leading-[1.45]">
              {project.description}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-ink-2 mt-3">
            <span>创建于 {relativeTime(project.created_at)}</span>
            {project.archived && (
              <span className="text-status-archived-fg">已归档</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
