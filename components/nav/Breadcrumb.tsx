"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";
import { Crumb, CrumbSeg, CrumbSep } from "@/components/brand/crumb";
import { useTask } from "@/hooks/useTask";
import { useWorkspaceContext } from "@/lib/workspace-context";

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
  const { wsList } = useWorkspaceContext();

  if (!wsId) return null;
  const wsName = wsList.find((w) => w.id === wsId)?.name ?? "工作区";
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
