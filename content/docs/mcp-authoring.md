---
title: "编写 MCP Server"
description: "编写可供 omp 和其他 MCP Client 使用的 Server，实现 stdio 或流式 HTTP Transport 与类型化工具。"
summary: "本页给出最小 MCP Server 和 HTTP 变体，说明 JSON Schema、工具结果、认证与测试方法，帮助构建跨编辑器集成。"
keywords:
  - "MCP Server 开发"
  - "omp MCP"
  - "stdio Server"
  - "JSON Schema"
  - "MCP SDK"
source: https://omp.sh/docs/mcp-authoring
---

# 编写 MCP Server

## 何时创作一篇

当相同的集成需要从 omp、Claude 桌面、Cursor、VS Code 或任何其他支持 MCP 的东西运行时，编写 MCP 服务器。该协议为您提供免费的跨编辑器重用。如果该工具仅在 omp 内部运行，则 [自定义工具](/docs/custom-tools) 编写起来更短，附带类型化参数，并跳过 JSON-RPC 握手。

面向 omp 的 MCP 服务器的形状与任何其他客户端相同：stdio 或可流式 HTTP、JSON-RPC 2.0、 `tools/list` 和 `tools/call`。 omp 在上面没有添加任何专有内容。

## 最小的 stdio 服务器

stdio 是默认传输和阻力最小的路径：omp 生成二进制文件，将 JSON-RPC 帧写入 stdin，从 stdout 读取响应，并将 stderr 视为日志。的 `@modelcontextprotocol/sdk` package 处理成帧和 `initialize` 握手。

```ts
// server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server({ name: "hello", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "greet",
    description: "Say hello to someone.",
    inputSchema: { type: "object", properties: { who: { type: "string" } }, required: ["who"] },
  }],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => ({
  content: [{ type: "text", text: `Hello, ${req.params.arguments?.who}!` }],
}));

await server.connect(new StdioServerTransport());
```

将其连接到 omp via `~/.omp/agent/mcp.json` 或 `.omp/mcp.json`:

```json
{
  "mcpServers": {
    "hello": { "command": "node", "args": ["./server.js"] }
  }
}
```

`inputSchema` 是简单的 JSON 模式。如果您更喜欢编译时类型，请从以下位置生成架构 [类型框](https://github.com/sinclairzx81/typebox) (`Type.Object({...})`）并直接传递结果 - TypeBox 发出标准 JSON Schema，这正是 omp 转发给模型的内容。

## 可流式传输的 HTTP 变体

当服务器位于 URL 后面时，请切换到 HTTP - 长期运行的守护进程、托管集成、任何需要跨客户端身份验证或共享状态的内容。在服务器端使用SDK的HTTP传输，并设置 `type: "http"` 与一个 `url` 在 omp config 中。 omp 通过注入Bearer Token `headers` 或一个 `oauth` 块；看到 [MCP](/docs/mcp) 对于 config 架构。

```json
{
  "mcpServers": {
    "hello": {
      "type": "http",
      "url": "https://hello.example.com/mcp",
      "headers": { "Authorization": "Bearer ${HELLO_TOKEN}" }
    }
  }
}
```

`${VAR}` 和 `${VAR:-default}` 在负载时扩展。领先的 `!` 在 header 或 env 值中运行 shell 命令并使用其修剪后的 stdout - 对于秘密管理器很有用，但如果命令可能默默失败则很危险。

## 针对 omp 进行测试

从omp内部， `/mcp test <name>` 重新连接到服务器，列出其工具，并打印握手结果。 `/mcp reconnect <name>` 删除实时连接并重新打开它而不重新启动会话 - 在本地服务器上迭代时最快的循环。 `/mcp reload` 重新读取每个 config 文件。工具更改会立即传播；您不需要重新启动 omp。

连接错误、架构验证失败以及 `isError` 来自的回应 `tools/call` 所有表面都与附加的服务器名称内嵌。

## 工具如何呈现在模型中

omp 将每个 MCP 工具注册为 `mcp__<server>_<tool>`，小写，非`[a-z_]` 字符替换为 `_` 并且重复的下划线折叠起来。一个多余的 `<server>_` 工具名称上的前缀被删除一次。的 `hello` 上面的服务器向模型公开了一个工具，如下所示 `mcp__hello_greet`.

选择能够顺利通过清理的服务器和工具名称。 `my-server` 和 `my.server` 折叠到相同的前缀，并且 registry 是最后写入获胜。

## 相关

-   [MCP](/docs/mcp) — 消费者端：config 位置、传输、OAuth、发现模式。
-   [Custom tools](/docs/custom-tools) — 当不需要跨编辑器重用时，仅使用 omp 替代方案。
-   [插件](/docs/plugins) — 将 MCP 服务器 config 与 skills、命令和 hooks 捆绑在一起。
