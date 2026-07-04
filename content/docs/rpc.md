---
title: "RPC 模式"
description: "通过 stdio 使用 omp RPC 模式，以 JSON 消息发送命令、接收事件流，并从任意语言驱动编程智能体。"
summary: "本页定义 RPC 模式的启动方式、消息格式、命令与事件类型，提供 Shell 示例，并说明会话持久化和 UI 请求处理。"
keywords:
  - "omp RPC"
  - "JSON-RPC"
  - "stdio"
  - "事件流"
  - "编程接口"
source: https://omp.sh/docs/rpc
---

# RPC 模式

## 开始吧

```sh
omp --mode rpc --no-session       # headless: events out, commands in
omp --mode rpc-ui --no-session    # adds tool-card / selector UI frames
```

启动时 omp 写入 `{"type":"ready"}`，然后在 stdin 上每行读取一个 JSON 对象，并在 stdout 上每行写入一个对象。模式标志与每个其他 CLI 选项一起记录在 [CLI 参考](/docs/cli)。通行证 `--no-session` 以防止用完 `~/.omp/agent/sessions/`;省略它以持久化，然后通过您交互使用的相同通道恢复、Fork或分支（[会话](/docs/sessions)).

`--mode rpc` 完全无头。 `--mode rpc-ui` 将 TUI 的交互表面分层在同一根线上：工具执行卡、选择器、权限提示作为 `extension_ui_request` 嵌入器必须用匹配的帧回答 `extension_ui_response`.

## 消息形状

每个命令可能携带一个 `id`;匹配的响应与它相呼应 `{"type":"response","command":"…","success":bool}`. `prompt` 和 `abort_and_prompt` 立即确认——回合本身流为 `agent_start`, `message_update`, `tool_execution_*`，并以 `agent_end`.

### 命令

| 命令 | 有效载荷 | 退货 |
| --- | --- | --- |
| `prompt` | 
`message`, `images?`

 | 

确认；溪流 `agent_start` → 三角洲 → `agent_end`

 |
| `steer` | 

`message`, `images?`

 | 确认；插入正在运行的Turn |
| `follow_up` | 

`message`, `images?`

 | 确认；在当前轮次之后排队 |
| `abort` | — | 

确认；活动回合结束于 `agent_end`

 |
| `abort_and_prompt` | 

`message`, `images?`

 | 确认；中止然后开始新一轮 |
| 

`new_session` / `switch_session` / `branch`

 | 会话目标 | 会话树转换 |
| `handoff` | `customInstructions?` | `{ savedPath } | null` |
| 

`get_state` / `get_messages` / `get_session_stats`

 | — | 会话快照 |
| 

`set_model` / `cycle_model` / `set_thinking_level`

 | 模型选择器 | 

`set_model` / `cycle_model` 返回选择的模型；思维的改变会发出 `thinking_level_changed` 事件

 |
| 

`compact` / `set_auto_compaction`

 | 上下文压缩控制 | 

确认/ `CompactionResult`

 |
| 

`bash` / `abort_bash`

 | `command` | `BashResult` |
| `set_host_tools` | `tools: RpcHostToolDefinition[]` | 

主机端工具表面为 `host_tool_call` 框架；回复 `host_tool_result`

 |
| `extension_ui_response` | 

`id`, `value | confirmed | cancelled`

 | 

回答先前发出的 `extension_ui_request`

 |
| 

`get_login_providers` / `login`

 | provider id | 

OAuth URL 到达为 `extension_ui_request` 与 `method: "open_url"`

 |
| `export_html` | `outputPath?` | `{ path }` |

### 事件流

-   `message_update` — 辅助输出。 `assistantMessageEvent.type` 在之间选择 `text_delta`, `thinking_delta`, `tool_call_start`, `tool_call_delta`, 和 `tool_result`.
-   `message_start` / `message_end` — 回合内的消息边界。
-   `tool_execution_start` / `_update` / `_end` ——工具生命周期；携带 `toolCallId`, `toolName`和意图标签。
-   `agent_start` / `agent_end` ——转向边界。 `agent_end` 带有单个提示等待的停止原因。
-   `auto_compaction_start` / `_end`, `auto_retry_start` / `_end` — mid-stream housekeeping.
-   `available_commands_update` — the current slash-command surface;在启动时发出一次，并在命令元数据更改时再次发出。 Session-tree transitions (`new_session` / `switch_session` / `branch`) are observed through their command responses.
-   `extension_ui_request` — 代理需要 UI：选择器、确认、输入或 OAuth URL。回复 `extension_ui_response` 使用相同的 `id`。工具执行卡和权限提示仅在以下情况下到达 `--mode rpc-ui`.

## Shell示例

One prompt in, text deltas out, exit on `agent_end`。 No language binding required.

```sh
#!/usr/bin/env bash
set -euo pipefail
prompt='Say "ok" and nothing else.'
jq -nc --arg m "$prompt" '{id:"s1",type:"prompt",message:$m}' \
  | omp --mode rpc --no-session \
  | while IFS= read -r line; do
      t=$(jq -r '.type' <<<"$line")
      [[ "$t" == "message_update" ]] && \
        jq -r '.assistantMessageEvent.delta // empty' <<<"$line"
      [[ "$t" == "agent_end" ]] && exit 0
    done
```

## JSON event stream mode

`--mode json` is the print-mode variant of the same wire. It accepts a prompt from argv (or `-p`)，将相同的事件对象写入 stdout，然后退出。将其用于 CI 捕获、黄金文件测试或通过管道传输到 HTML 导出器，而无需保持子进程处于活动状态。

```sh
omp --mode json --no-session "Audit src/ for unused exports" > run.jsonl
omp --export run.jsonl audit.html
```

Same framing, same event types, same renderer. The difference is purely lifecycle: `--mode rpc` is a long-running pipe you keep feeding; `--mode json` is one prompt, one stream, exit.
