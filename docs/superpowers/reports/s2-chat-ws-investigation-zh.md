# WS 握手警告排查 —— Dev Console 警告根因调查

> **日期：** 2026-05-17
> **触发：** T44 视觉验收后续。用户问"WS /ws 握手失败 —— 为啥啊"。
> **结论：** 验证后非问题。WS 完全正常工作。那条警告是 React 18 strict mode 在 dev 模式下的产物。已写入 `s2-chat-visual-acceptance.md` 的"Known harmless"小节。不改代码。

---

## 现象

`pnpm dev` 起来后，进任务详情页，浏览器 console 反复刷：

```
WebSocket connection to 'ws://localhost:8080/ws' failed:
WebSocket is closed before the connection is established.
```

每次页面 mount 都来一遍。看着实时消息（别的用户输入了什么、agent 流式回复）也没收到。

## 我第一次的判断（错的）

看了 `.env.local`，前端是直连 `ws://localhost:8080/ws`（不走 Next.js proxy）。跑了一个 curl 探测：

```bash
curl -i http://localhost:8080/ws
# → HTTP/1.1 401 Unauthorized
# → Access-Control-Allow-Origin: http://localhost:3000
```

然后推理：

1. **CORS allowlist 写死成 `http://localhost:3000`** —— 但 dev server 跑在 **3002**（端口 3000 被一个孤儿 `node.exe` 进程 PID 3692 占着）。所以 WS 握手时 `Origin: http://localhost:3002` 跟 allowlist 不匹配 → 后端拒绝。
2. **Cookie `SameSite=Lax` 不跨端口** —— `localhost:3000` 和 `localhost:8080` 端口不同，"所以是跨站，所以 WS 升级请求时 cookie 不会带过去"。

**两点都错或部分错。** 重点说一下 (2)，因为这块我把你带偏了。

## 你的纠正：「为啥cookie不行」

你直接把我那句 cookie 的论断顶回来了。我回去重查浏览器平台规范，发现我把两个概念混在一起：

| 概念 | 谁在用 | 看什么 | `localhost:3000` vs `localhost:8080` |
|---|---|---|---|
| **Same-Origin（同源）** | CORS、`Origin` 请求头、`postMessage` 的 `targetOrigin`、iframe 隔离 | scheme **+** host **+** port（三者全要相同） | **跨源**（port 不同） |
| **Same-Site（同站）** | Cookie 的 `SameSite` 属性、schemeful same-site | eTLD+1（registrable domain）。**完全不看 port。** scheme 在 Chrome 91+ "schemeful same-site" 里看，但对 `http://localhost:*` 不影响因为 `localhost` 是统一处理的。 | **同站**（eTLD+1 都是 `localhost`） |

也就是说：`localhost:8080` 给前端 set 的 `SameSite=Lax` cookie，在前端运行在 `localhost:3000` / `3001` / `3002` 等任何端口时，请求 `localhost:8080` 时都会带。**Cookie 从来不是阻碍。**

这是个坑。两个术语听着像，规则完全不同。Cookie 的定义在 RFC 6265bis，Origin 的定义在 HTML spec。两套规范两套规则。

## 用干净的环境重查

杀了占着 3000 的孤儿 node 进程（PID 3692），又杀了 4 个之前 `pnpm dev` 留下的尸体进程，重启 dev —— 这次抓到了 **3000**（跟后端 allowlist 对上了）。然后在 browse 里手动测：

```js
new WebSocket("ws://localhost:8080/ws")
// → readyState: 1 (OPEN)
// → 没 error，没 close
```

**手动握手成功。** 但 WSProvider 依然在打那条警告。同一个浏览器、同一个 origin、同一个 URL，结果不一样。这排除了 CORS、cookie、协议层 —— 问题在 React 组件生命周期内部。

## 真凶：React 18 strict mode

`next.config.ts` 里有 `reactStrictMode: true`。React 18 strict mode 在 dev 模式下会**把每个 useEffect 跑两遍**：先 mount → cleanup → 再 mount。这是故意设计的，用来暴露那些清理不干净的 effect。

WSProvider 的 effect 长这样：

```ts
useEffect(() => {
  client.connect();              // 创建 socket
  const unregister = registerHandlers(client, queryClient, getStore);
  return () => {
    unregister();
    client.disconnect();         // 关闭 socket
  };
}, [client, queryClient]);
```

dev 实际执行顺序：

```
t = 0ms       Mount 1: client.connect() → new WebSocket(url) → 握手开始
t = 0ms+      Cleanup 1: client.disconnect() → socket.close()，socket 还在 CONNECTING 状态
t = 0ms++     Mount 2: client.connect() → 第二个 new WebSocket(url) → 握手开始
t ≈ 30ms      第一个 socket 终于收到服务器回复，但已经被告知关闭
              → 浏览器触发 onclose（wasClean=false）
              → console 打印那条 "closed before the connection is established"
t ≈ 30ms      第二个 socket 握手完成 → onopen 触发
              → WSProvider 把 wsStatus 切到 "connected"
              → 重订阅循环跑起来
```

那条警告描述的是**第一个 socket**，被 strict-mode cleanup 正确关掉了。第二个 socket 才是 `client.socket` 字段里最终的那个 —— 完全 open，正常推实时帧。

production build 里 strict-mode 双调用**不存在**。一次 mount，一个 socket，没警告。

## 验证 WS 真的活着

我在浏览器 console 里搭了个最小端到端探针：

```js
const ws = new WebSocket("ws://localhost:8080/ws");
const frames = [];

ws.onopen = () => {
  ws.send(JSON.stringify({ type: "subscribe", scope: "task", id: "<task-uuid>" }));
};
ws.onmessage = (e) => frames.push(e.data);

// 订阅完成后，通过 REST 发一条消息
await fetch("/api/v1/tasks/<task-uuid>/messages", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content: { text: "ws live echo test", mentions: [] } }),
});

// 2 秒后看 frames
// → [
//     '{"type":"message.appended","scope":"task","id":"<task-uuid>","payload":{"message":{"id":"80a2043f-...","task_card_id":"<task-uuid>","role":"user", ...}}}'
//   ]
```

REST POST 返回 `201`，后端广播给所有订阅 `task:<uuid>` 的客户端，WS push 到达 open 的 socket，前端收到 `message.appended` 帧，带完整的 enriched payload。整个 REST → 广播 → WS → 客户端的闭环大约 50ms。

WSProvider 健康的其他证据：
- `<OfflineBanner>` 没渲染（如果 `wsStatus !== "connected"` 就会渲染）
- zustand 里 `useAppStore((s) => s.wsStatus)` 读出来是 `"connected"`
- 没有 `Failed to load resource: ws://...` 错误；只有那条 strict-mode 关 socket 的警告

## 决策：不修

考虑过的几个修法：

1. **让 `WSClient.disconnect()` 等 socket 握手完再关。** 可以做 —— 在 `disconnect()` 里看 `readyState`，如果还在 CONNECTING 就推迟到 `onopen` / `onerror` 后再关。但这是**为了消一条 dev 警告**而把生产代码路径搞复杂。引入真 bug 的风险。
2. **用 microtask 或 50ms timer 给 `connect()` 防抖。** 同样的代价 —— 给生产路径加异步，只为遮住 dev 产物。
3. **关掉 React strict mode。** 等于把那个测试关掉。Strict mode 就是设计来暴露 effect 清理 bug 的，把症状盖住等于把测试丢了。
4. **什么都不做，写文档。** 警告是在正确告诉我们 cleanup 路径跑了。我们的 cleanup *本来就是干净的*（`closedByUser` 标志位、正常 `socket.close()`、没漏 listener）。production 没这条噪音。

选 **(4)**。在 `s2-chat-visual-acceptance.md` 的"Known harmless (dev-only console warnings)"小节里写清楚根因 + 证据 + 生产影响。

## 顺带说一下：另一条 `405 Method Not Allowed` 在 `/api/v1/tasks/<id>`

同一次调查冒出来的第二条持续性错误：`GET /api/v1/tasks/<id> → 405`。这也不是 bug：

- 后端不提供单 task GET endpoint（spec §5.12 已记录）。
- `lib/api/task.ts::fetchTask` 还是会调它，捕获 `ApiError` 的 404 和 405 状态码，返回 `undefined`，让 `useTask` 走 fallback 路径 —— 扫项目的 task list 缓存。
- 验证过：T44 截图里 TaskHeader 完整渲染（StatusChip + WK-xxxx + 标题 + 摘要），每次 deep-link 进任务详情页都靠这个 fallback 跑通。
- 状态码瑕疵：spec 期望端点缺失时返 `404 Not Found`，后端返了 `405 Method Not Allowed`。我们的兜底逻辑两个码处理一样。记到 backend follow-up 里，不阻塞。

## 教训

1. **碰到"看着 broken 但有奇怪线索"先做最小复现，别急着列修法。** 我从"WS 警告 + 401 curl + 写死的 allowlist"直接跳到"CORS 或 cookie"然后列了三个补丁。如果当时先在浏览器 console 跑一句 `new WebSocket(url)`，5 秒就能排除 CORS 和 cookie，转向 lifecycle 角度。修法清单晚了 40 分钟才被诊断打脸。
2. **Same-origin ≠ same-site。** Web 平台两个听着像、技术上完全不同的概念。我搞混了，自信满满给了个错的 cookie 论断，要不是你顶回来差点就上线一个白做的修复。
3. **React 18 strict-mode 的副作用日志是设计的噪音。** Dev 模式 double-invoke effect 是用来暴露 cleanup 漏洞的。任何开 socket、起 timer、订阅 stream 的 effect 都会在 dev 里看到"还没完成就被拆掉"的日志。这条信号告诉你 cleanup 跑了 —— 你应该庆祝这条警告，不是压住它。生产模式只跑一次。
4. **用户顶回来时要信。** 「为啥cookie不行」—— 三个字，零修饰，是这次调查里效率最高的一次 debug 输入。

## 参考

- React Strict Mode 行为：[react.dev/reference/react/StrictMode](https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-re-running-effects-in-development)
- Same-Site vs Same-Origin：[web.dev/articles/same-site-same-origin](https://web.dev/articles/same-site-same-origin)
- 浏览器警告文本来源：WHATWG Fetch + WebSocket 集成；"closed before connection established" 是当 `WebSocket` 还在 `CONNECTING` 状态时收到 `close()` 调用时打的
- 涉及文件：`lib/ws/client.ts`（未改动）
- 涉及文件：`lib/ws/provider.tsx`（未改动）
- 交叉引用：`docs/superpowers/reports/s2-chat-visual-acceptance.md` —— "Known harmless (dev-only console warnings)" 小节
- 英文版：`docs/superpowers/reports/s2-chat-ws-investigation.md`
