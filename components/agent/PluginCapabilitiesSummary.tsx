import type { PluginItemSummary } from "@/lib/api/types";

interface PluginCapabilitiesSummaryProps {
  skills: PluginItemSummary[];
  commands: PluginItemSummary[];
  subagents: PluginItemSummary[];
  hooksCount: number;
  mcpServers: string[];
  /**
   * "compact" → single row of dot-separated badges (only non-zero shown).
   * "full"    → expanded sections with each item's name + description.
   *
   * Both variants surface only names + descriptions — content bodies, hook
   * shell commands, and MCP configs are never on the wire (backend strips
   * them in service.publicViewFromX).
   */
  variant: "compact" | "full";
}

/**
 * Render a marketplace agent's plugin tree summary. The compact variant is
 * intended for grid cards; the full variant for the agent detail page.
 */
export function PluginCapabilitiesSummary({
  skills,
  commands,
  subagents,
  hooksCount,
  mcpServers,
  variant,
}: PluginCapabilitiesSummaryProps) {
  const totalCapabilities =
    skills.length +
    commands.length +
    subagents.length +
    (hooksCount > 0 ? 1 : 0) +
    (mcpServers.length > 0 ? 1 : 0);

  if (totalCapabilities === 0) {
    // Pure conversation agent — no plugin tree at all. Surface this
    // explicitly so users don't think the data is missing.
    return (
      <p className="text-xs text-ink-2 italic">
        Conversation only — no skills, commands, subagents, hooks, or MCP servers.
      </p>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-1.5 text-xs">
        {skills.length > 0 && <Badge label="skills" count={skills.length} />}
        {commands.length > 0 && <Badge label="commands" count={commands.length} />}
        {subagents.length > 0 && (
          <Badge label="subagents" count={subagents.length} />
        )}
        {hooksCount > 0 && <Badge label="hooks" count={hooksCount} tone="warn" />}
        {mcpServers.length > 0 && (
          <Badge label="MCP" count={mcpServers.length} />
        )}
      </div>
    );
  }

  // Full variant: each non-empty section gets a labeled block.
  return (
    <div className="flex flex-col gap-4">
      {skills.length > 0 && (
        <SectionList title="Skills" items={skills} count={skills.length} />
      )}
      {commands.length > 0 && (
        <SectionList title="Commands" items={commands} count={commands.length} />
      )}
      {subagents.length > 0 && (
        <SectionList title="Subagents" items={subagents} count={subagents.length} />
      )}
      {hooksCount > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold text-ink-1 uppercase tracking-wide">
            Hooks <span className="text-ink-2 font-normal">({hooksCount})</span>
          </h3>
          <p className="text-xs text-state-failed">
            ⚠️ This agent runs {hooksCount} hook
            {hooksCount === 1 ? "" : "s"} (shell commands triggered by tool-use
            lifecycle events). Hook command bodies are not shown — they execute
            on the publisher&apos;s runtime, not yours.
          </p>
        </div>
      )}
      {mcpServers.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold text-ink-1 uppercase tracking-wide">
            MCP servers <span className="text-ink-2 font-normal">({mcpServers.length})</span>
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {mcpServers.map((s) => (
              <li
                key={s}
                className="text-xs font-mono text-ink-1 px-1.5 py-0.5 bg-paper-1 border border-line rounded-sm"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface BadgeProps {
  label: string;
  count: number;
  tone?: "default" | "warn";
}

function Badge({ label, count, tone = "default" }: BadgeProps) {
  const classes =
    tone === "warn"
      ? "text-xs px-1.5 py-0.5 border border-state-failed text-state-failed rounded-sm"
      : "text-xs px-1.5 py-0.5 border border-hairline text-ink-1 rounded-sm";
  return (
    <span className={classes}>
      <span className="font-mono">{count}</span> {label}
    </span>
  );
}

interface SectionListProps {
  title: string;
  items: PluginItemSummary[];
  count: number;
}

function SectionList({ title, items, count }: SectionListProps) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold text-ink-1 uppercase tracking-wide">
        {title} <span className="text-ink-2 font-normal">({count})</span>
      </h3>
      <ul className="flex flex-col gap-1">
        {items.map((it) => (
          <li
            key={it.name}
            className="flex flex-col gap-0.5 py-1 px-2 border-l-2 border-hairline"
          >
            <span className="text-sm font-mono text-ink-0">{it.name}</span>
            {it.description ? (
              <span className="text-xs text-ink-2">{it.description}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
