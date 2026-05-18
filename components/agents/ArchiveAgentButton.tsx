"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/brand/confirm-dialog";
import { useArchiveAgent } from "@/hooks/useArchiveAgent";
import { messages } from "@/lib/messages";

interface ArchiveAgentButtonProps {
  wsId: string;
  agentId: string;
}

export function ArchiveAgentButton({ wsId, agentId }: ArchiveAgentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const m = messages.agents;
  const mutation = useArchiveAgent(wsId);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 border-[1.5px] border-state-failed text-state-failed rounded-sm font-semibold text-sm"
      >
        {mutation.isPending ? m.archiving : m.archive}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={m.archiveConfirmTitle}
        description={m.archiveConfirmDesc}
        confirmLabel={m.archive}
        destructive
        onConfirm={async () => {
          await mutation.mutateAsync(agentId);
          router.push(`/w/${wsId}/agents`);
        }}
      />
    </>
  );
}
