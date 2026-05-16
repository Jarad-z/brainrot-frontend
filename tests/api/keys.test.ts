import { describe, it, expect } from "vitest";
import { queryKeys } from "@/lib/api/keys";

describe("queryKeys", () => {
  it("me", () => {
    expect(queryKeys.me()).toEqual(["me"]);
  });
  it("workspaces.projects(wsId)", () => {
    expect(queryKeys.workspaces.projects("ws-1")).toEqual(["workspaces", "ws-1", "projects"]);
  });
  it("projects.detail(id)", () => {
    expect(queryKeys.projects.detail("p-1")).toEqual(["projects", "p-1"]);
  });
  it("projects.tasks(id)", () => {
    expect(queryKeys.projects.tasks("p-1")).toEqual(["projects", "p-1", "tasks"]);
  });
});
