"use client";
import { useTaskArtifacts } from "@/hooks/useTaskArtifacts";
import { ArtifactRow } from "./ArtifactRow";
import { EmptyState } from "@/components/common/EmptyState";

interface ArtifactsTabProps {
  taskId: string;
}

export function ArtifactsTab({ taskId }: ArtifactsTabProps) {
  const { data, isLoading, isError } = useTaskArtifacts(taskId);

  if (isLoading) {
    return <div className="text-center text-xs text-ink-2 py-8">加载中…</div>;
  }
  if (isError) {
    return <div className="text-center text-xs text-ink-2 py-8">加载失败</div>;
  }
  const items = data ?? [];
  if (items.length === 0) {
    return <EmptyState title="暂无产出" description="agent 运行后产生的文件会出现在这里" />;
  }
  return (
    <ul className="flex flex-col">
      {items.map((a) => (
        <ArtifactRow key={a.id} artifact={a} />
      ))}
    </ul>
  );
}
