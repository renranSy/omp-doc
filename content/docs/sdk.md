---
title: "SDK"
description: "使用 @oh-my-pi/pi-coding-agent SDK 在 TypeScript 中创建会话、流式处理事件并注册自定义工具。"
summary: "本页介绍 omp SDK 的安装、会话创建、事件流、模型与工具覆盖、CustomTool 接口、持久化管理及资源释放方式。"
keywords:
  - "omp SDK"
  - "TypeScript SDK"
  - "AgentSession"
  - "CustomTool"
  - "编程接口"
source: https://omp.sh/docs/sdk
---

# SDK

## 安装

```sh
bun add @oh-my-pi/pi-coding-agent
```

需要 Node.js 20+ 或任意 Bun 版本。该 Package 是 TypeScript ES Module，并随包发布 `.d.ts` 类型声明。

## 打开一个会话

`createAgentSession` 使用与 CLI 相同的发现规则：读取 `~/.omp/agent/config.yml`、查找凭据，并加载扩展、MCP Server、Skills 与提示词模板。可通过传入选项覆盖任一部分。

```ts
import {
  ModelRegistry,
  SessionManager,
  createAgentSession,
  discoverAuthStorage,
} from "@oh-my-pi/pi-coding-agent";

const authStorage = await discoverAuthStorage();
const modelRegistry = new ModelRegistry(authStorage);
await modelRegistry.refresh();

const { session, modelFallbackMessage } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  authStorage,
  modelRegistry,
  model: modelRegistry.getAvailable()[0],
  thinkingLevel: "medium",
});

if (modelFallbackMessage) {
  process.stderr.write(modelFallbackMessage + "\n");
}

const unsubscribe = session.subscribe((event) => {
  if (
    event.type === "message_update" &&
    event.assistantMessageEvent.type === "text_delta"
  ) {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

await session.prompt("Summarize this repository in three bullets.");
unsubscribe();
await session.dispose();
```

`SessionManager.inMemory()` 会让所有状态仅保存在内存中。改用 `SessionManager.create(cwd)` 可使用与 CLI 相同的磁盘 JSONL 存储，也可以实现自己的 SessionManager。持久会话如何恢复、Fork 和分支请参阅[会话](/docs/sessions)。

## 订阅事件流

`session.subscribe(handler)` 返回取消订阅函数。每个事件都包含 `type`；常用事件如下：

| 事件 | 内容 |
| --- | --- |
| `message_update` | 助手消息更新。检查 `assistantMessageEvent.type`，可为 `text_delta`、`thinking_delta`、`tool_call_start`、`tool_call_delta` 或 `tool_result`。 |
| `tool_execution_start` / `_update` / `_end` | 独立于助手消息的工具调用生命周期，包含 `toolCallId`、`toolName` 与意图标签。 |
| `agent_start` / `agent_end` | Agent 回合边界。`agent_end` 包含停止原因，单次 `session.prompt` 会在此时完成。 |
| `auto_compaction_start` / `_end` | 流式响应期间的自动上下文压缩。 |

## 可覆盖的行为

- `model` 与 `thinkingLevel`，也可不传而交由发现机制选择。
- `systemPrompt`：可传数组替换默认提示词，或传入 `(defaults) => final` 函数。
- `toolNames`：缩小启用的内置工具集合；`requireYieldTool` 可启用隐藏的 `yield` 工具。
- `customTools`：供 Agent 调用的宿主侧工具，见下文。
- `extensions`、`additionalExtensionPaths`、`disableExtensionDiscovery`。
- `skills`、`rules`、`promptTemplates`、`slashCommands`、`contextFiles`：用数组覆盖自动发现结果。
- `authStorage`：默认使用 `discoverAuthStorage()` 读取 `~/.omp/agent/agent.db`。
- `sessionManager`：可使用 `inMemory()`、基于文件的 `create(cwd)`，或自行实现。
- `enableMCP`、`enableLsp`，也可传入自己的 `mcpManager`。

## Custom tools

`CustomTool` 是可被 Agent 回调的普通对象。参数使用 Zod Schema（也支持 TypeBox 风格的 JSON Schema）；`execute` 返回 `AgentToolResult`。

```ts
import { z } from "zod";
import { createAgentSession, type CustomTool } from "@oh-my-pi/pi-coding-agent";

const echoHost: CustomTool = {
  name: "echo_host",
  label: "Echo Host",
  description: "Echo a value back through the embedding host.",
  parameters: z.object({ message: z.string() }),
  async execute(_id, { message }) {
    return { content: [{ type: "text", text: `host: ${message}` }] };
  },
};

const { session } = await createAgentSession({
  customTools: [echoHost],
});
```

应将 `signal` 传给长时间运行的子进程。这样在 TUI 按 Esc、通过 RPC 调用 `abort` 或在 SDK 调用 `session.abort()` 时，任务才能真正被取消。

## 生命周期

| 方法 | 作用 |
| --- | --- |
| `session.prompt(text, opts?)` | 执行一个 Agent 回合，并在 `agent_end` 时完成。 |
| `session.steer(text)` | 向正在执行的回合注入转向消息。 |
| `session.abort()` | 停止当前回合，并以中止原因发出 `agent_end`。 |
| `session.compact()` | 强制执行一次上下文压缩。 |
| `session.dispose()` | 释放模型、MCP Server 及会话创建的 LSP 进程。 |

若宿主语言不是 Node.js，或希望在 Agent 与宿主之间保留进程边界，请使用 [RPC 模式](/docs/rpc)。其他启动方式请参阅 [CLI 参考](/docs/cli)。
