import { describe, expect, it, beforeEach } from "vitest";
import { useBadges } from "./badges";

describe("badges store", () => {
  beforeEach(() => useBadges.getState().reset());

  it("seed and bump friendRequests", () => {
    useBadges.getState().seed({ friendRequests: 2, workspaceInvitations: 0, dm: {} });
    expect(useBadges.getState().friendRequests).toBe(2);
    useBadges.getState().bumpFriendRequests();
    expect(useBadges.getState().friendRequests).toBe(3);
  });

  it("bumpConversation accumulates per id", () => {
    useBadges.getState().bumpConversation("c1");
    useBadges.getState().bumpConversation("c1");
    useBadges.getState().bumpConversation("c2");
    expect(useBadges.getState().dm).toEqual({ c1: 2, c2: 1 });
  });

  it("clearConversation zeros a single id", () => {
    useBadges.getState().bumpConversation("c1");
    useBadges.getState().clearConversation("c1");
    expect(useBadges.getState().dm.c1 ?? 0).toBe(0);
  });
});
