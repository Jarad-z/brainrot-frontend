"use client";
import { useProjectAssets } from "@/hooks/useProjectAssets";
import { AssetRow } from "./AssetRow";
import { EmptyState } from "@/components/common/EmptyState";
import { UploadButton } from "@/components/assets/UploadButton";
import { messages } from "@/lib/messages";

interface AssetsTabProps {
  projectId: string;
}

export function AssetsTab({ projectId }: AssetsTabProps) {
  const m = messages.assets;
  const { data, isLoading, isError } = useProjectAssets(projectId);
  const items = data ?? [];

  return (
    <div className="flex flex-col">
      <UploadButton projectId={projectId} />
      {isLoading ? (
        <div className="text-center text-xs text-ink-2 py-8">{m.loading}</div>
      ) : isError ? (
        <div className="text-center text-xs text-ink-2 py-8">{m.loadError}</div>
      ) : items.length === 0 ? (
        <EmptyState title="暂无素材" description="上传到本项目的参考文件会出现在这里" />
      ) : (
        <ul className="flex flex-col">
          {items.map((a) => (
            <AssetRow key={a.id} asset={a} />
          ))}
        </ul>
      )}
    </div>
  );
}
