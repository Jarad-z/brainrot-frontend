# WS Handshake Investigation — Dev Console Warning Root Cause

> **Date:** 2026-05-17
> **Triggered by:** T44 visual acceptance follow-up; user asked "WS /ws 握手失败 —— 为啥啊".
> **Outcome:** Verified non-issue. WS is fully operational. The warning is a React 18 strict-mode dev-only artifact. Documented under "Known harmless" in `s2-chat-visual-acceptance.md`. No code change.

---

## The symptom

After running `pnpm dev` and navigating to the task detail page, the browser console reliably prints:

```
WebSocket connection to 'ws://localhost:8080/ws' failed:
WebSocket is closed before the connection is established.
```

…repeatedly on every page mount. Real-time message updates (other-user typed something, agent streamed reply) seemed not to arrive.

## The first (wrong) hypothesis

I looked at `.env.local` and saw the frontend connects directly to `ws://localhost:8080/ws` (not through the Next.js proxy). I ran:

```bash
curl -i http://localhost:8080/ws
# → HTTP/1.1 401 Unauthorized
# → Access-Control-Allow-Origin: http://localhost:3000
```

…and reasoned:

1. **CORS allowlist hardcoded to `http://localhost:3000`** — but the dev server was running on **3002** (port 3000 was held by an orphan `node.exe` process, PID 3692). So the WS handshake's `Origin: http://localhost:3002` wouldn't match the allowlist → backend rejects.
2. **Cookie `SameSite=Lax` won't cross ports** — `localhost:3000` ↔ `localhost:8080` are different ports, "so they're cross-site, so cookies won't be sent on WS upgrade."

**Both were partially or completely wrong.** I'll dissect (2) in particular because that's where I led the user astray.

## The user's correction: 「为啥cookie不行」

The user pushed back on the cookie claim. I went back and re-checked the platform definitions. Two different concepts that I had conflated:

| Concept | Used by | What it considers | `localhost:3000` vs `localhost:8080` |
|---|---|---|---|
| **Same-Origin** | CORS, the `Origin` request header, `postMessage` `targetOrigin`, iframe isolation | scheme **+** host **+** port (all three must match) | **Cross-origin** (ports differ) |
| **Same-Site** | Cookie `SameSite` attribute, schemeful same-site | eTLD+1 (registrable domain). **Port is irrelevant.** Scheme matters under "schemeful same-site" (Chrome 91+) but not for `http://localhost:*` because `localhost` is treated uniformly. | **Same-site** (eTLD+1 = `localhost`) |

So a `SameSite=Lax` cookie set by `localhost:8080` is delivered on requests to `localhost:8080` regardless of which port the page itself is on, as long as both sides are `localhost`. The cookie was never the blocker.

This is a foot-gun. The two terms sound similar but the rules differ. RFC 6265bis pins the cookie definition; the HTML spec pins the origin definition. They are not the same concept.

## Re-investigating with a clean baseline

Killed the orphan `node.exe` process (PID 3692), killed 4 stale `pnpm dev` instances, restarted dev → grabbed port **3000** (matching the backend's allowlist). Then in browse:

```js
new WebSocket("ws://localhost:8080/ws")
// → readyState: 1 (OPEN)
// → no error, no close
```

**Manual handshake worked.** But the WSProvider still printed the warning. Same browser, same origin, same URL — different result. That ruled out CORS, cookies, and protocol. Something was happening *inside* the React component lifecycle.

## The actual cause: React 18 strict mode

`next.config.ts` has `reactStrictMode: true`. React 18 strict mode in dev **runs every `useEffect` twice** on initial mount — once, then teardown, then a second time. This is deliberate, designed to surface effects that don't clean up properly.

WSProvider's effect:

```ts
useEffect(() => {
  client.connect();              // creates a WebSocket
  const unregister = registerHandlers(client, queryClient, getStore);
  return () => {
    unregister();
    client.disconnect();         // closes the socket
  };
}, [client, queryClient]);
```

In dev, this runs as:

```
t = 0ms       Mount 1: client.connect() → new WebSocket(url) → handshake starts
t = 0ms+      Cleanup 1: client.disconnect() → socket.close() while still CONNECTING
t = 0ms++     Mount 2: client.connect() → second new WebSocket(url) → handshake starts
t ≈ 30ms      The first socket finally hears back from the server, but it was already
              told to close → browser fires `onclose` with `wasClean=false` AND prints
              the "closed before the connection is established" warning to console
t ≈ 30ms      The second socket completes its handshake → `onopen` fires
              → WSProvider transitions wsStatus → "connected"
              → resubscribe loop runs against the open socket
```

The warning describes **the first socket**, which was correctly torn down by the strict-mode cleanup. The second socket is the one that ends up in the live `client.socket` slot, fully open and serving real-time frames.

In production builds, strict-mode double-invoke does **not** happen. There is one mount, one socket, no warning.

## Verifying the WS is actually live

I built a minimal end-to-end probe in the browser console:

```js
const ws = new WebSocket("ws://localhost:8080/ws");
const frames = [];

ws.onopen = () => {
  ws.send(JSON.stringify({ type: "subscribe", scope: "task", id: "<task-uuid>" }));
};
ws.onmessage = (e) => frames.push(e.data);

// While subscribed, send a message via REST
await fetch("/api/v1/tasks/<task-uuid>/messages", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content: { text: "ws live echo test", mentions: [] } }),
});

// Inspect frames after 2s
// → [
//     '{"type":"message.appended","scope":"task","id":"<task-uuid>","payload":{"message":{"id":"80a2043f-...","task_card_id":"<task-uuid>","role":"user", ...}}}'
//   ]
```

The REST `POST` returned `201`, the backend broadcast to subscribers of `task:<uuid>`, the WS push arrived on the open socket, and we captured the `message.appended` frame with full enriched payload. The whole REST→broadcast→WS→client round-trip took roughly 50ms.

Additional evidence WSProvider is healthy:
- `<OfflineBanner>` was not rendered (it would have been if `wsStatus !== "connected"`)
- zustand's `useAppStore((s) => s.wsStatus)` reads `"connected"`
- No `Failed to load resource` errors related to `ws://...`; only the strict-mode close-while-connecting warning

## Decision: don't fix it

Options considered:

1. **Wait for the socket to finish CONNECTING before honoring `disconnect()`.** Possible — track readyState in `WSClient.disconnect()`, defer the close until after `onopen` or onerror. But this complicates the production code path purely to suppress a dev-only warning. Risk of introducing real bugs.
2. **Debounce `connect()` with a microtask or 50ms timer.** Same trade-off — adds asynchrony to the production path to mask a dev artifact.
3. **Disable React strict mode.** Defeats the purpose of strict mode. Strict mode is designed to surface real effect-cleanup bugs; we'd be hiding the test by hiding the symptom.
4. **Do nothing; document.** The warning is correctly informing us that the cleanup path runs. Our cleanup *is* clean (`closedByUser` flag, proper `socket.close()`, no leaked listeners). Production has none of this noise.

Chose **(4)**. Documented in `s2-chat-visual-acceptance.md` under "Known harmless (dev-only console warnings)" with full cause + evidence + production impact.

## The other warning: `405 Method Not Allowed` on `/api/v1/tasks/<id>`

Same investigation surfaced a second persistent error: `GET /api/v1/tasks/<id> → 405`. This is not a bug either:

- Backend does not expose a single-task GET endpoint (documented in spec §5.12).
- `lib/api/task.ts::fetchTask` calls it anyway, catches `ApiError` for status 404 and 405, and returns `undefined` so `useTask` falls back to scanning the project task-list cache.
- Verified: T44 captures show the full TaskHeader (StatusChip + WK-xxxx + title + summary) rendering correctly via the fallback path on every deep-link.
- Cosmetic nit: spec expects `404 Not Found` for a missing endpoint, backend returns `405 Method Not Allowed`. The fallback handler treats both equivalently. Logged as a backend follow-up; not blocking.

## Lessons

1. **Build a minimum repro before listing fixes.** I jumped straight from "WS warning + 401 curl + hardcoded allowlist" to "CORS or cookies" and listed three patches. If I had run `new WebSocket(url)` in the browser console first, I would have ruled out CORS and cookies in 5 seconds and looked at the lifecycle instead. The fix list arrived ~40 minutes earlier than the diagnosis warranted.
2. **Same-origin ≠ same-site.** Two related-sounding but technically distinct concepts on the web platform. I confused them, asserted a confident-but-wrong cookie claim, and would have shipped a wasted fix if the user hadn't pushed back.
3. **React 18 strict-mode artifacts are noise by design.** Dev-mode double-invocation of effects is meant to surface cleanup bugs. Any effect that opens a socket, starts a timer, subscribes to a stream, etc. will emit a "torn down before completed" log in dev. The signal is that the cleanup runs; you should celebrate the warning, not suppress it. Production runs the effect once.
4. **Trust the user when they push back.** "为啥cookie不行" — three words, zero hedging, was the most efficient piece of debugging input in the whole investigation.

## References

- React Strict Mode behavior: [react.dev/reference/react/StrictMode](https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-re-running-effects-in-development)
- Same-Site vs Same-Origin: [web.dev/articles/same-site-same-origin](https://web.dev/articles/same-site-same-origin)
- The browser warning text source: WHATWG Fetch + WebSocket integration; "closed before connection established" is emitted when a `WebSocket` in `CONNECTING` state receives `close()`
- Affected file: `lib/ws/client.ts` (no change made)
- Affected file: `lib/ws/provider.tsx` (no change made)
- Cross-reference: `docs/superpowers/reports/s2-chat-visual-acceptance.md` — "Known harmless (dev-only console warnings)" section
