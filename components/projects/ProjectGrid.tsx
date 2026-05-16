import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/api/types";

interface ProjectGridProps {
  wsId: string;
  projects: Project[];
}

export function ProjectGrid({ wsId, projects }: ProjectGridProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <ProjectCard key={p.id} wsId={wsId} project={p} />
      ))}
    </div>
  );
}
