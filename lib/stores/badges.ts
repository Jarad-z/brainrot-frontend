import { create } from "zustand";

interface BadgeState {
  friendRequests: number;
  workspaceInvitations: number;
  dm: Record<string, number>;
  seed: (s: { friendRequests: number; workspaceInvitations: number; dm: Record<string, number> }) => void;
  bumpFriendRequests: () => void;
  decFriendRequests: () => void;
  bumpWorkspaceInvitations: () => void;
  decWorkspaceInvitations: () => void;
  bumpConversation: (convId: string) => void;
  clearConversation: (convId: string) => void;
  reset: () => void;
}

export const useBadges = create<BadgeState>((set) => ({
  friendRequests: 0,
  workspaceInvitations: 0,
  dm: {},
  seed: (s) =>
    set({
      friendRequests: s.friendRequests,
      workspaceInvitations: s.workspaceInvitations,
      dm: { ...s.dm },
    }),
  bumpFriendRequests: () => set((p) => ({ friendRequests: p.friendRequests + 1 })),
  decFriendRequests: () => set((p) => ({ friendRequests: Math.max(0, p.friendRequests - 1) })),
  bumpWorkspaceInvitations: () => set((p) => ({ workspaceInvitations: p.workspaceInvitations + 1 })),
  decWorkspaceInvitations: () => set((p) => ({ workspaceInvitations: Math.max(0, p.workspaceInvitations - 1) })),
  bumpConversation: (convId) =>
    set((p) => ({ dm: { ...p.dm, [convId]: (p.dm[convId] ?? 0) + 1 } })),
  clearConversation: (convId) =>
    set((p) => {
      const next = { ...p.dm };
      delete next[convId];
      return { dm: next };
    }),
  reset: () => set({ friendRequests: 0, workspaceInvitations: 0, dm: {} }),
}));
