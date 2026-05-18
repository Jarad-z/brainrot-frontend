"use client";

import { useMutation } from "@tanstack/react-query";
import { addWorkspaceMember } from "@/lib/api/members";
import type { WorkspaceMemberInput } from "@/lib/api/types";

export function useAddMember(wsId: string) {
  return useMutation<void, Error, WorkspaceMemberInput>({
    mutationFn: (input) => addWorkspaceMember(wsId, input),
  });
}
