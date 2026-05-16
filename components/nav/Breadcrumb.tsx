"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";

export function Breadcrumb() {
  const params = useParams<{ wsId?: string; projectId?: string }>();
  const wsId = params.wsId;
  const projectId = params.projectId;

  const { data: project } = useQuery({
    queryKey: projectId ? queryKeys.projects.detail(projectId) : ["project-disabled"],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  if (!wsId) return null;
  return (
    <nav className="text-sm text-ink-2 flex items-center gap-2">
      <Link href={`/w/${wsId}`} className="hover:text-ink-0">
        Workspace
      </Link>
      {projectId && (
        <>
          <span>›</span>
          <Link href={`/w/${wsId}/p/${projectId}`} className="hover:text-ink-0">
            {project?.name ?? "…"}
          </Link>
        </>
      )}
    </nav>
  );
}
