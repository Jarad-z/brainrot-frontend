"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaceRuntimes } from "@/hooks/useWorkspaceRuntimes";
import { useCreateAgent } from "@/hooks/useCreateAgent";
import { AgentForm } from "@/components/agents/AgentForm";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

export default function NewAgentPage() {
  const { wsId } = useParams<{ wsId: string }>();
  const router = useRouter();
  const { data: runtimes = [] } = useWorkspaceRuntimes(wsId);
  const mutation = useCreateAgent(wsId);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="p-6 overflow-y-auto h-full">
      <h1 className="text-lg font-bold mb-4">{messages.agents.newCta.replace("+ ", "")}</h1>
      <AgentForm
        mode="create"
        runtimes={runtimes}
        isSubmitting={mutation.isPending}
        submitError={error}
        onSubmit={async (input) => {
          setError(null);
          try {
            const a = await mutation.mutateAsync(input);
            router.push(`/w/${wsId}/agents/${a.id}`);
          } catch (e) {
            if (e instanceof ApiError && e.status === 409) {
              setError(messages.agents.form.handleConflict);
            } else {
              setError((e as Error).message);
            }
          }
        }}
      />
    </main>
  );
}
