"use client";
import { useProjectAssets } from "@/hooks/useProjectAssets";
import { AssetRow } from "./AssetRow";
import { EmptyState } from "@/components/common/EmptyState";

interface AssetsTabProps {
  projectId: string;
}

export function AssetsTab({ projectId }: AssetsTabProps) {
  const { data, isLoading, isError } = useProjectAssets(projectId);

  if (isLoading) {
    return <div className="text-center text-xs text-ink-2 py-8">加载中…</div>;
  }
  if (isError) {
    return <div className="text-center text-xs text-ink-2 py-8">加载失败</div>;
  }
  const items = data ?? [];
  if (items.length === 0) {
    return <EmptyState title="暂无素材" description="上传到本项目的参考文件会出现在这里" />;
  }
  return (
    <ul className="flex flex-col">
      {items.map((a) => (
        <AssetRow key={a.id} asset={a} />
      ))}
    </ul>
  );
}
