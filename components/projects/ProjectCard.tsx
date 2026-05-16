import Link from "next/link";
import { Card } from "@/components/ui/card";
import { relativeTime } from "@/lib/format";
import type { Project } from "@/lib/api/types";

interface ProjectCardProps {
  wsId: string;
  project: Project;
}

export function ProjectCard({ wsId, project }: ProjectCardProps) {
  return (
    <Link href={`/w/${wsId}/p/${project.id}`} className="block">
      <Card className="p-5 bg-paper-0 border-hairline shadow-1 hover:shadow-2 transition-shadow h-full">
        <h3
          className="text-lg font-display font-semibold text-ink-0 mb-2"
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
          <p className="text-sm text-ink-2 line-clamp-2 mb-3">{project.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-ink-2 mt-auto">
          <span>创建于 {relativeTime(project.created_at)}</span>
          {project.archived && <span className="text-status-archived-fg">已归档</span>}
        </div>
      </Card>
    </Link>
  );
}
