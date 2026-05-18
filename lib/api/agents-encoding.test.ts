import { describe, it, expect } from "vitest";
import { decodeAgentResponse, encodeAgentInput } from "./agents-encoding";
import type { AgentWire, AgentInput } from "./types";

const wireBase: Omit<AgentWire, "custom_env" | "custom_args" | "mcp_config"> = {
  id: "a1",
  workspace_id: "ws1",
  runtime_id: "rt1",
  handle: "writer",
  name: "Writer",
  avatar_url: null,
  description: "",
  instructions: "",
  backend_type: "claude",
  model: "claude-sonnet-4-6",
  archived: false,
  created_at: "2026-05-18T00:00:00Z",
  updated_at: "2026-05-18T00:00:00Z",
};

function b64(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}

describe("decodeAgentResponse", () => {
  it("decodes base64-encoded jsonb fields into JS objects", () => {
    const wire: AgentWire = {
      ...wireBase,
      custom_env: b64({ OPENAI_API_KEY: "sk-x" }),
      custom_args: b64(["--verbose"]),
      mcp_config: b64({ servers: { fs: { command: "mcp-fs" } } }),
    };
    const a = decodeAgentResponse(wire);
    expect(a.custom_env).toEqual({ OPENAI_API_KEY: "sk-x" });
    expect(a.custom_args).toEqual(["--verbose"]);
    expect(a.mcp_config).toEqual({ servers: { fs: { command: "mcp-fs" } } });
  });

  it("treats empty string as empty container", () => {
    const wire: AgentWire = {
      ...wireBase,
      custom_env: "",
      custom_args: "",
      mcp_config: "",
    };
    const a = decodeAgentResponse(wire);
    expect(a.custom_env).toEqual({});
    expect(a.custom_args).toEqual([]);
    expect(a.mcp_config).toEqual({});
  });

  it("treats base64-encoded null as empty container", () => {
    const wire: AgentWire = {
      ...wireBase,
      custom_env: b64(null),
      custom_args: b64(null),
      mcp_config: b64(null),
    };
    const a = decodeAgentResponse(wire);
    expect(a.custom_env).toEqual({});
    expect(a.custom_args).toEqual([]);
    expect(a.mcp_config).toEqual({});
  });

  it("throws on invalid JSON inside the base64 payload", () => {
    const wire: AgentWire = {
      ...wireBase,
      custom_env: Buffer.from("not-json{").toString("base64"),
      custom_args: "",
      mcp_config: "",
    };
    expect(() => decodeAgentResponse(wire)).toThrow(/decode.*custom_env/i);
  });
});

describe("encodeAgentInput", () => {
  it("passes structured fields through unchanged (POST takes raw JSON, not base64)", () => {
    const input: AgentInput = {
      runtime_id: "rt1",
      handle: "writer",
      name: "Writer",
      custom_env: { K: "V" },
      custom_args: ["--x"],
      mcp_config: { a: 1 },
    };
    const out = encodeAgentInput(input);
    expect(out.custom_env).toEqual({ K: "V" });
    expect(out.custom_args).toEqual(["--x"]);
    expect(out.mcp_config).toEqual({ a: 1 });
    expect(typeof out.custom_env).toBe("object");
  });
});
