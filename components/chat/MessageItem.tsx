import type { ClientMessage } from "@/lib/api/types";
import { UserMessage } from "./parts/UserMessage";
import { AssistantMessage } from "./parts/AssistantMessage";
import { ToolPair } from "./parts/ToolPair";
import { OrphanToolResult } from "./parts/OrphanToolResult";
import { PermissionRequestCard } from "./parts/PermissionRequestCard";
import { ResultBanner } from "./parts/ResultBanner";
import { SystemLine } from "./parts/SystemLine";
import { RateLimitBanner } from "./parts/RateLimitBanner";

interface AuthorMaps {
  users: Record<string, { name: string; handle?: string }>;
  agents: Record<string, { name: string; handle: string }>;
}

interface MessageItemProps {
  msg: ClientMessage;
  pairing: { result?: ClientMessage; orphan?: boolean };
  taskId: string;
  authors: AuthorMaps;
}

export function MessageItem({ msg, pairing, taskId, authors }: MessageItemProps) {
  switch (msg.parsed.type) {
    case "user": {
      const u = msg.author_user_id ? authors.users[msg.author_user_id] : undefined;
      return <UserMessage msg={msg} authorName={u?.name} authorHandle={u?.handle} />;
    }
    case "assistant_text":
    case "thinking": {
      const a = msg.author_agent_id ? authors.agents[msg.author_agent_id] : undefined;
      const agent = a ?? { name: "agent", handle: "agent" };
      return <AssistantMessage msg={msg} taskId={taskId} agent={agent} />;
    }
    case "tool_use":
      return <ToolPair useMsg={msg} resultMsg={pairing.result} taskId={taskId} />;
    case "tool_result":
      return pairing.orphan ? <OrphanToolResult msg={msg} /> : null;
    case "permission_request":
      return <PermissionRequestCard msg={msg} taskId={taskId} />;
    case "result":
      return <ResultBanner msg={msg} />;
    case "system":
      return <SystemLine msg={msg} />;
    case "rate_limit_event":
      return <RateLimitBanner msg={msg} />;
  }
}
