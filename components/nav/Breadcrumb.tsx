"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";
import { Crumb, CrumbSeg, CrumbSep } from "@/components/brand/crumb";
import { useTask } from "@/hooks/useTask";

export function Breadcrumb() {
  const params = useParams<{ wsId?: string; projectId?: string; taskId?: string }>();
  const wsId = params.wsId;
  const projectId = params.projectId;
  const taskId = params.taskId;

  const { data: project } = useQuery({
    queryKey: projectId
      ? queryKeys.projects.detail(projectId)
      : ["project-disabled"],
    queryFn: () => projectsApi.get(projectId!),
    enabled: !!projectId,
  });

  const { data: task } = useTask(taskId ?? "");

  if (!wsId) return null;
  // BACKEND_GAPS #5: no `GET /workspaces/{wsId}` endpoint, so the workspace
  // name is hardcoded to match `Sidebar.tsx` until the endpoint lands.
  const wsName = "Lumen Labs";
  return (
    <Crumb>
      <CrumbSeg active={!projectId}>{wsName}</CrumbSeg>
      {projectId && (
        <>
          <CrumbSep />
          <CrumbSeg active={!taskId}>{project?.name ?? "…"}</CrumbSeg>
        </>
      )}
      {taskId && (
        <>
          <CrumbSep />
          <CrumbSeg active>{task?.title ?? "…"}</CrumbSeg>
        </>
      )}
    </Crumb>
  );
}
