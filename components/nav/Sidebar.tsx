"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/api/keys";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { messages } from "@/lib/messages";

function DisabledLink({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block px-3 py-1.5 text-sm text-ink-3 opacity-60 cursor-not-allowed select-none">
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Sidebar() {
  const params = useParams<{ wsId?: string; projectId?: string }>();
  const wsId = params.wsId ?? null;
  const activeProjectId = params.projectId ?? null;

  const { data: projects = [] } = useQuery({
    queryKey: wsId ? queryKeys.workspaces.projects(wsId) : ["projects-disabled"],
    queryFn: () => projectsApi.list(wsId!),
    enabled: !!wsId,
  });

  return (
    <aside className="w-60 shrink-0 border-r border-hairline bg-paper-1 flex flex-col">
      <div className="p-4">
        <Link href="/" className="text-xl font-display font-extrabold text-ink-0">
          Brainrot
        </Link>
      </div>
      <Separator />
      <div className="p-3">
        <WorkspaceSwitcher />
      </div>
      <Separator />
      <nav className="flex-1 overflow-y-auto py-2">
        <p className="px-3 py-1 text-xs text-ink-2 uppercase">{messages.shell.projects}</p>
        {wsId && projects.map((p) => (
          <Link
            key={p.id}
            href={`/w/${wsId}/p/${p.id}`}
            className={`block px-3 py-1.5 text-sm rounded-md mx-1 truncate ${
              activeProjectId === p.id
                ? "bg-paper-2 text-ink-0 font-medium"
                : "text-ink-1 hover:bg-paper-2"
            }`}
            title={p.name}
          >
            • {p.name}
          </Link>
        ))}
        <Separator className="my-2" />
        <DisabledLink label={`${messages.shell.pendingApprovals} (0)`} tooltip={messages.shell.pendingDisabled} />
        <DisabledLink label={messages.shell.agents} tooltip={messages.shell.listsDisabled} />
        <DisabledLink label={messages.shell.runtimes} tooltip={messages.shell.listsDisabled} />
        <DisabledLink label={messages.shell.settings} tooltip={messages.shell.listsDisabled} />
      </nav>
    </aside>
  );
}
