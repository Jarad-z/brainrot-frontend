# Plugin UI — known follow-ups

Outstanding work tracked against the plugin marketplace + agent attach
UI landed in `feat(plugins): plugin marketplace + agent attach UI`
(frontend `a72a9f7`). Pairs with the backend
[`plugin-system-followups.md`](../../backend/docs/plugin-system-followups.md).

Each item: title · severity · what's wrong · suggested fix · where.

---

## Defensive gaps

### U1. `AgentPluginsPanel` doesn't gate queries on prop validity · HIGH (def-in-depth)

`useQuery({ queryFn: () => listAgentPlugins(agentId) })` runs as soon
as the component mounts. Today it's safe because the parent
`app/(app)/w/[wsId]/agents/[agentId]/page.tsx` early-returns on
`!agent`, so the panel never mounts with empty `agentId`. But the
component takes `agentId` / `wsId` as props without validating.

**Suggested fix.** Add `enabled: !!agentId && !!wsId` to both
`useQuery` calls. Cheap defense.

**Where:** `components/agent/AgentPluginsPanel.tsx:42-50`.

---

### U2. attach/detach/enable mutations share one global "pending" disable · LOW (UX)

Clicking "enable" on plugin A disables the Detach button on plugin B
and vice versa, because the `disabled={mu.isPending}` prop applies
across all rows. Correctness-wise OK (mutation does target the right
install_id via `variables`), but feels janky on a workspace with
many attached plugins.

**Suggested fix.** Track per-row pending state with a `Set<string>` of
install ids being acted on, drive `disabled` from membership in that
set rather than the top-level mutation's `isPending`.

**Where:** `components/agent/AgentPluginsPanel.tsx`.

---

## Error / cache hygiene

### U3. attached/installs query errors silently render as empty state · MEDIUM

`attachedQ.data ?? []` and `installsQ.data ?? []` swallow `isError`.
User sees "No plugins attached." even when the request 500'd. The
fix is small: render `attachedQ.isError` as an inline error banner
above the list, same pattern as `MarketplacePage` already does.

**Where:** `components/agent/AgentPluginsPanel.tsx`.

---

### U4. Publish/unpublish only invalidates empty-query marketplace cache · MEDIUM

`WorkspacePluginsPage` invalidates `queryKeys.plugins.marketplace("")`.
Any active marketplace search (e.g. user typed "coord") still shows
the stale published/unpublished row until the next refetch.

**Suggested fix.** Use a partial-match invalidation:
`qc.invalidateQueries({ queryKey: ["plugins", "marketplace"] })`.
TanStack Query treats this as a prefix match and invalidates every
search.

**Where:** `app/(app)/w/[wsId]/plugins/page.tsx:88`.

---

### U5. Self-install doesn't invalidate the `ownedBy` cache · LOW

A workspace self-installing a private plugin it owns means the
workspace plugins list could refresh stale. Rare (private plugins
typically attached without going through Install flow), but
asymmetric with how Attach invalidates everything.

**Suggested fix.** Add
`qc.invalidateQueries({ queryKey: queryKeys.plugins.ownedBy(wsId) })`
to `InstallPluginDialog`'s onSuccess.

**Where:** `components/plugin/InstallPluginDialog.tsx:60-65`.

---

## Out of v1, ready for v2 spec

- **WS event subscription** for `plugin.installed` / `agent.attached`
  so cross-tab updates land without manual refresh. Current model is
  invalidate-on-mutation only.
- **Plugin browse on the agent detail page itself** (instead of having
  to install from `/marketplace?tab=plugins` first then attach from
  the agent page). Single-click "Install + Attach" combo.
- **Browser zip upload** (`POST /workspaces/{ws}/plugins` via web UI)
  with progress + manifest preview. Today push is CLI-only.
- **Plugin detail card with skill / command list** (currently only
  shows description + version). Backend `manifest` field is already
  there.
- **"Installed by" attribution + last-attached date** on Plugins list
  in agent detail page.
