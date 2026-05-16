"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";
import { Crumb, CrumbSeg, CrumbSep } from "@/components/brand/crumb";

export function Breadcrumb() {
  const params = useParams<{ wsId?: string; projectId?: string }>();
  const wsId = params.wsId;
  const projectId = params.projectId;

  const { data: project } = useQuery({
    queryKey: projectId
      ? queryKeys.projects.detail(projectId)
      : ["project-disabled"],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  if (!wsId) return null;
  return (
    <Crumb>
      <CrumbSeg active={!projectId}>工作区</CrumbSeg>
      {projectId && (
        <>
          <CrumbSep />
          <CrumbSeg active>{project?.name ?? "…"}</CrumbSeg>
        </>
      )}
    </Crumb>
  );
}
