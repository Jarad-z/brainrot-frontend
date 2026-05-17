"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { sendMessage, type SendMessageInput } from "@/lib/api/messages";
import { enrichMessage } from "@/lib/chat/enrich-message";
import { upsertMessage } from "@/lib/chat/upsert-message";
import { encodeJSON } from "@/lib/codec";
import { queryKeys } from "@/lib/api/keys";
import { useSession } from "./useSession";
import type { ClientMessage, Message } from "@/lib/api/types";

export function useSendMessage(taskId: string) {
  const queryClient = useQueryClient();
  const { data: me } = useSession();

  return useMutation({
    mutationFn: (input: SendMessageInput) => sendMessage(taskId, input),
    onMutate: async (input) => {
      const tempId = `temp-${nanoid()}`;
      const optimistic: ClientMessage = {
        id: tempId,
        tempId,
        task_card_id: taskId,
        role: "user",
        author_user_id: me?.id ?? null,
        author_agent_id: null,
        content: encodeJSON({ text: input.text, mentions: input.mentions }),
        task_run_id: null,
        seq: null,
        metadata: "",
        created_at: new Date().toISOString(),
        parsed: { type: "user", text: input.text, mentions: input.mentions },
        meta: {},
      };
      queryClient.setQueryData<ClientMessage[]>(
        queryKeys.tasks.messages(taskId),
        (old = []) => upsertMessage(old, optimistic),
      );
      return { tempId };
    },
    onSuccess: ({ message }) => {
      const enriched = enrichMessage(message as Message);
      queryClient.setQueryData<ClientMessage[]>(
        queryKeys.tasks.messages(taskId),
        (old = []) => upsertMessage(old, enriched),
      );
    },
    onError: (_err, _input, context) => {
      if (!context?.tempId) return;
      queryClient.setQueryData<ClientMessage[]>(
        queryKeys.tasks.messages(taskId),
        (old = []) => old.filter((m) => m.tempId !== context.tempId),
      );
    },
  });
}
