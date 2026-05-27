# Mention fallback over-match — unintended agent dispatch

**Date:** 2026-05-28
**Component:** `frontend/lib/chat/serialize-editor.ts`
**Severity:** functional — sends extra runs to agents the user did not @mention
**Status:** fixed (regex now requires whitespace / start-of-text before `@`)

## What you see

On task card 123 in workspace `65fc698e-…` (project `7a5146ca-…`), the user sent
one chat message naming jarad in the lead-off `@`:

```
@jarad 叫3 无所谓 测试而已 你测试下cli的完整功能 agent就@writer
```

The intent: dispatch jarad, and in prose tell jarad that "if you need an agent,
go @writer." The trailing `@writer` is **instructional text addressed to jarad**,
not a second mention.

What actually happened: the message was persisted with
`content.mentions = [<jarad-id>, <writer-id>]`. Both agents were enqueued. jarad
ran first; the second run was held by the per-card partial-unique index and
auto-promoted to writer the instant jarad finished. The writer run consumed the
same prompt jarad had seen — including the literal text `@jarad 叫3 无所谓 测试
而已 你测试下cli的完整功能 agent就@writer` — got confused about its own
identity, called `brainrot whoami`, saw "jarad" (because the daemon's auth token
is jarad's), and proceeded to act as jarad for an entire 4-minute run. It even
dispatched a *third* run (another writer) on task card "3" using the brainrot
CLI, and wrote a closing summary of "the cli test" as if it were jarad.

The card's UI shows a writer-avatar bubble whose text begins **"我来测试 cli 的
完整功能，并且 @writer 这个 agent"**. The author rendering is correct — DB
`author_agent_id` is writer. The bug is that the writer run never should have
started.

## Why it happened

`serializeEditor()` produces `{ text, mentions }` from the Tiptap editor state.
Mentions are normally placed as `mention` nodes by the suggestion popup, which
only triggers at the start of the text or after whitespace (see `activePrefix`
in `lib/mention-parse.ts`).

The function also runs a **plain-text fallback** to catch the case where the
user types `@writer` and never picks the popup item. That fallback used the
pattern:

```js
const re = /@([A-Za-z0-9_-]+)/g;
```

There's no anchor: `@handle` matches anywhere in the string, including
mid-word. CJK prose like `就@writer` ("just @writer") satisfies the regex, so
the fallback resolves `writer` against the agent lookup and pushes its id into
`mentions`.

This was invisible in tests because every fallback case in
`serialize-editor.test.ts` placed `@handle` at the start of a paragraph
(`@writer 你好`, `@unknown hi`, etc.). The mid-word case was never exercised.

## The fix

Anchor the fallback regex the same way the suggestion popup is anchored — only
treat `@handle` as a mention when it is preceded by whitespace or sits at the
start of the text:

```js
const re = /(?:^|\s)@([A-Za-z0-9_-]+)/g;
```

Three regression tests added in `serialize-editor.test.ts`:

1. `@handle` directly attached to the trailing characters of another word
   (CJK case: `agent就@writer`) does **not** dispatch.
2. `@handle` preceded by a non-space ASCII char (`foo@writer`) does **not**
   dispatch — guards against email-shaped tokens too.
3. `@handle` after a newline still resolves — the popup permits this and so
   should the fallback.

## What this doesn't fix

Two adjacent issues surfaced during diagnosis. Filing them here so they're not
forgotten:

1. **Agents have no built-in identity guard in their prompt.** When writer was
   handed jarad's trigger text, nothing in its system prompt reminded it which
   agent it actually is. It read "@jarad … 测试下cli" and rolled with it. A
   short `# Identity` block in `buildPrompt` (backend/internal/daemon/backend/
   claude/claude.go) stating the running agent's handle would prevent
   misidentification when a prompt mentions other agents.

2. **Daemon CLI shares the workspace owner's token, not the agent's.** When
   writer (or any agent) shells out to `brainrot whoami`, it sees the human's
   identity. This is consistent with how the daemon is set up today, but it
   makes identity confusion easier — see #1.

Neither is changed in this commit. Adding `# Identity` is a one-line backend
change once we decide what name to surface (handle? display name? both?).
