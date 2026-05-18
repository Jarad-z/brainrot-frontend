import type { Agent, AgentInput, AgentWire } from "./types";

function decodeField<T>(field: string, raw: string, fallback: T): T {
  if (raw === "") return fallback;
  let jsonText: string;
  try {
    if (typeof atob === "function") {
      jsonText = atob(raw);
    } else {
      jsonText = Buffer.from(raw, "base64").toString("utf8");
    }
  } catch (e) {
    throw new Error(`failed to decode ${field}: invalid base64 (${(e as Error).message})`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`failed to decode ${field}: invalid JSON (${(e as Error).message})`);
  }
  if (parsed === null || parsed === undefined) return fallback;
  return parsed as T;
}

export function decodeAgentResponse(wire: AgentWire): Agent {
  return {
    ...wire,
    custom_env: decodeField<Record<string, string>>("custom_env", wire.custom_env, {}),
    custom_args: decodeField<string[]>("custom_args", wire.custom_args, []),
    mcp_config: decodeField<Record<string, unknown>>("mcp_config", wire.mcp_config, {}),
  };
}

/**
 * POST /agents accepts raw JSON for the three jsonb fields (the asymmetry only
 * affects GET responses). This pass-through exists so callers route through
 * a single boundary — keeps the contract obvious and future-proofs against
 * backend cleanup of BACKEND_GAPS #21.
 */
export function encodeAgentInput(input: AgentInput): AgentInput {
  return {
    ...input,
    custom_env: input.custom_env,
    custom_args: input.custom_args,
    mcp_config: input.mcp_config,
  };
}
