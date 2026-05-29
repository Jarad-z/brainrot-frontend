import type React from "react";
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
  isNew?: boolean;
  isFirstInGroup?: boolean;
}

export function MessageItem({ msg, pairing, taskId, authors, isNew, isFirstInGroup = true }: MessageItemProps) {
  const animClass = isNew ? "msg-enter" : undefined;

  let inner: React.ReactNode;
  switch (msg.parsed.type) {
    case "user": {
      const u = msg.author_user_id ? authors.users[msg.author_user_id] : undefined;
      inner = <UserMessage msg={msg} authorName={u?.name} authorHandle={u?.handle} isFirstInGroup={isFirstInGroup} />;
      break;
    }
    case "assistant_text":
    case "thinking": {
      const a = msg.author_agent_id ? authors.agents[msg.author_agent_id] : undefined;
      const agent = a ?? { name: "agent", handle: "agent" };
      inner = (
        <AssistantMessage
          msg={msg}
          taskId={taskId}
          agent={agent}
          agentId={msg.author_agent_id}
          isFirstInGroup={isFirstInGroup}
        />
      );
      break;
    }
    case "tool_use":
      inner = <ToolPair useMsg={msg} resultMsg={pairing.result} taskId={taskId} />;
      break;
    case "tool_result":
      inner = pairing.orphan ? <OrphanToolResult msg={msg} /> : null;
      break;
    case "permission_request":
      inner = <PermissionRequestCard msg={msg} taskId={taskId} />;
      break;
    case "result":
      inner = <ResultBanner msg={msg} />;
      break;
    case "system":
      inner = <SystemLine msg={msg} />;
      break;
    case "rate_limit_event":
      inner = <RateLimitBanner msg={msg} />;
      break;
  }

  if (!inner) return null;
  return <div className={animClass}>{inner}</div>;
}
