"use client";
import { useChatUIStore } from "@/lib/store/chat-ui";
import { useApprovalsHistory } from "@/hooks/useApprovalsHistory";
import { RightTabs } from "./RightTabs";
import { ArtifactsTab } from "./RightTabs/ArtifactsTab";
import { AssetsTab } from "./RightTabs/AssetsTab";
import { ApprovalsTab } from "./RightTabs/ApprovalsTab";

interface RightPanelProps {
  taskId: string;
}

export function RightPanel({ taskId }: RightPanelProps) {
  const activeTab = useChatUIStore((s) => s.byTask[taskId]?.activeTab ?? "artifacts");
  const setTab = useChatUIStore((s) => s.setActiveTab);
  const approvals = useApprovalsHistory(taskId);

  return (
    <aside className="border-l-[1.5px] border-hairline bg-paper-0 flex flex-col min-h-0">
      <RightTabs
        active={activeTab}
        onChange={(t) => setTab(taskId, t)}
        approvalsCount={approvals.length}
      />
      <div className="flex-1 overflow-y-auto">
        {activeTab === "artifacts" && <ArtifactsTab />}
        {activeTab === "assets" && <AssetsTab />}
        {activeTab === "approvals" && <ApprovalsTab taskId={taskId} />}
      </div>
    </aside>
  );
}
