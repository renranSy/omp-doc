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

节点 20+ 或任何 Bun 版本。 package 是 TypeScript ES 模块；消费者根据已发布的信息进行编译 `.d.ts`.

## 打开一个会话

`createAgentSession` 遵循与 CLI 相同的发现规则：它读取 `~/.omp/agent/config.yml`，查找凭据，加载扩展，MCP 服务器，skills，提示词模板。传递任何选项来覆盖一件。

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

`SessionManager.inMemory()` 让一切都转瞬即逝。换入 `SessionManager.create(cwd)` 对于 CLI 使用的磁盘上 JSONL 存储，或实现您自己的。参见 [会话](/docs/sessions) 了解持久会话如何跨嵌入恢复、Fork和分支。

## 流转一圈

`session.subscribe(handler)` 返回取消订阅函数。每个事件都承载着 `type`;您平时关心的：

| 活动 | 它携带什么 |
| --- | --- |
| `message_update` | 辅助输出。检查 `assistantMessageEvent.type` 为了 `text_delta`, `thinking_delta`, `tool_call_start`, `tool_call_delta`, 或 `tool_result`. |
| `tool_execution_start` / `_update` / `_end` | 辅助消息之外的工具调用生命周期。 `toolCallId`, `toolName`，意图标签。 |
| `agent_start` / `agent_end` | 转动边界。 `agent_end` 带有停止原因并且终止符是单个 `session.prompt` 解决。 |
| `auto_compaction_start` / `_end` | 中流上下文压缩射击。 |

## 你可以覆盖什么

-   `model` 和 `thinkingLevel` ——或者让发现来选择。
-   `systemPrompt` — 一个数组（替换默认值）或 `(defaults) => final`.
-   `toolNames` — 缩小活动内置集的范围。 `requireYieldTool` 选择隐藏的 `yield` 工具。
-   `customTools` — 代理可以调用的主机端工具（见下文）。
-   `extensions`, `additionalExtensionPaths`, `disableExtensionDiscovery`.
-   `skills`, `rules`, `promptTemplates`, `slashCommands`, `contextFiles` — 数组覆盖发现。
-   `authStorage` — 默认为 `discoverAuthStorage()` 反对 `~/.omp/agent/agent.db`.
-   `sessionManager` — `inMemory()`，文件支持（`create(cwd)`），或者你自己的。
-   `enableMCP`, `enableLsp`，或者上交你自己的 `mcpManager`.

## Custom tools

A `CustomTool` 是代理可以回调的普通对象。参数使用 Zod 模式（TypeBox 样式的 JSON 模式也适用）； `execute` 返回一个 `AgentToolResult`.

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

转发 `signal` 参数进入长时间运行的子进程，因此中止（Esc 在 TUI 中， `abort` 在 RPC 管道上， `session.abort()` 在 SDK 中）实际上取消了工作。

## 生命周期

| 方法 | 效果 |
| --- | --- |
| `session.prompt(text, opts?)` | 跑一圈。决议于 `agent_end`. |
| `session.steer(text)` | 将转向信息注入到正在运行的Turn中。 |
| `session.abort()` | 停止当前Turn；发出 `agent_end` 具有中止的停止原因。 |
| `session.compact()` | 强制进行上下文压缩传递。 |
| `session.dispose()` | 释放模型、MCP 服务器以及打开的会话的任何 LSP 进程。 |

需要非节点语言，或者代理和主机之间的进程边界？使用 [RPC模式](/docs/rpc) 相反。通过 SDK 生成 omp 是本文中涵盖的几个入口形状之一 [CLI 参考](/docs/cli).
