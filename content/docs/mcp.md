---
title: "MCP"
description: "配置 omp MCP Server 的 stdio 与 HTTP Transport、OAuth、Header、工具发现、作用域和连接生命周期。"
summary: "本页说明何时使用 MCP，介绍 mcp.json 配置格式、本地与远程 Transport、认证方式、工具命名和运行时重连行为。"
keywords:
  - "omp MCP"
  - "MCP Server"
  - "stdio"
  - "HTTP Transport"
  - "OAuth"
source: https://omp.sh/docs/mcp
---

# MCP

## 何时使用 MCP

当有人已经发布了您想要的集成（文件系统、GitHub、Slack、Linear、Postgres）时，请使用 MCP 服务器。您掉落了一个 JSON config； omp 处理握手、OAuth、重新连接和工具注册。如果您需要定制逻辑，请编写 [自定义工具](/docs/custom-tools) 相反。

## Config 文件

奥普读取 `mcp.json` 从这些位置，按优先顺序：

-   `.omp/mcp.json` — 项目，由 OMP 管理
-   `~/.omp/agent/mcp.json` — 用户，omp 管理
-   `.claude/`, `.cursor/`, `.vscode/`, `.gemini/`, `.windsurf/`, `opencode.json` — 自动发现
-   `mcp.json` 或 `.mcp.json` 在回购根目录 - 独立后备，最低优先级

项目条目使用相同的密钥隐藏用户条目。通过将其密钥添加到来禁用服务器而不删除其 config `disabledServers` 在用户文件中（`~/.omp/agent/mcp.json`).

## 音频传输

生成本地进程。 omp 通过其 stdin/stdout 管道 JSON-RPC。

```json
{
  "$schema": "https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json",
  "mcpServers": {
    "fs": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${HOME}/projects"],
      "env": {
        "LOG_LEVEL": "info"
      },
      "cwd": "${HOME}"
    }
  }
}
```

`type` 默认为 `"stdio"` 当 `command` 已设置。 `${VAR}` 和 `${VAR:-default}` 在加载时扩展 `command`, `args`, `env`, `cwd`, `url`, `headers`, `auth`, 和 `oauth`.

## 可流传输 HTTP

连接到远程端点。通过发送Bearer Token `headers` 或将 OAuth 穿过 `oauth`.

```json
{
  "$schema": "https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json",
  "mcpServers": {
    "linear": {
      "type": "http",
      "url": "https://mcp.linear.app/sse",
      "headers": {
        "Authorization": "Bearer ${LINEAR_TOKEN}"
      }
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "oauth": {
        "clientId": "${GH_CLIENT_ID}",
        "clientSecret": "${GH_CLIENT_SECRET}"
      }
    }
  }
}
```

对于 OAuth 服务器，请使用以下命令完成流程 `/mcp reauth <name>`。凭证登陆 `agent.db` （仅您的用户可读）；没有任何内容写回 JSON。

## 发现和范围界定

工具表面为 `mcp__<server>_<tool>`。该前缀使具有相同上游工具名称的两个服务器保持不同。连接、列表和工具加载与 250 毫秒的快速启动门并行发生 - 缓存的工具定义立即作为延迟句柄出现，而慢速服务器完成握手。每个服务器的故障都是隔离的，传输自动重新连接和退避。

## 按需激活

对于大型目录，将每个 MCP 工具加载到提示中会浪费上下文。套装 `tools.discoveryMode: mcp-only` 在 `~/.omp/agent/config.yml` 和 MCP 工具在发现步骤后面进行门控：模型看到单个 `search_tool_bm25` 工具，搜索它所需的功能，并且只有匹配的工具才会具体化到活动工具集中。默认 `auto` 一旦工具集超过 40 个工具，模式就会自动执行此操作。

```yaml
tools:
  discoveryMode: mcp-only   # or "auto" (default), "off", "all"
```

## 斜杠命令

| 类别 | 命令 |
| --- | --- |
| 编辑config | `/mcp add`, `/mcp remove`, `/mcp enable`, `/mcp disable` |
| 运行时 | `/mcp test`, `/mcp reauth`, `/mcp unauth`, `/mcp reconnect <name>`, `/mcp reload` |
| 检查 | `/mcp list`, `/mcp resources`, `/mcp prompts`, `/mcp notifications` |
| 锻造厂 | `/mcp smithery-search`, `/mcp smithery-login`, `/mcp smithery-logout` |

`/mcp add`, `/mcp enable`, `/mcp disable`, 和 `/mcp reauth` 写回 omp 管理的文件并添加 `$schema` 自动线。

## 相关

-   [Custom tools](/docs/custom-tools) — 编写自己的工具，而不是采用 MCP 服务器。
-   [插件](/docs/plugins) — 将 MCP config 与 skills、命令和 hooks 捆绑在一起。
-   [设置](/docs/settings) — `tools.discoveryMode` 及相关旋钮。
