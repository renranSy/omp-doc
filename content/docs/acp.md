---
title: "ACP"
description: "通过 Agent Client Protocol 将 omp 嵌入 Zed 等编辑器，路由文件、终端、权限提示、模式和会话操作。"
summary: "本页介绍 ACP 初始化、认证、Client Capability、工具 I/O 路由、权限请求、斜杠命令、模式更新和会话管理扩展。"
keywords:
  - "omp ACP"
  - "Agent Client Protocol"
  - "Zed"
  - "编辑器集成"
  - "JSON-RPC"
source: https://omp.sh/docs/acp
---

# ACP

## 开始吧

```sh
omp acp           # equivalent to: omp --mode acp
```

其他模式参数请参阅 [CLI 参考](/docs/cli)。ACP 以 JSON-RPC 框架通过 stdio 通信：将 `omp` 作为子进程启动，再把它的 stdin 和 stdout 分别连接到 ACP Client 即可。

规范： [zed-industries/Agent Client Protocol](https://github.com/zed-industries/agent-client-protocol)。 Zed 提供第一方 ACP 支持；其他实现该协议的编辑器可以以相同的方式驱动 omp。

## 初始化

ACP 启动时无需预先指定模型。Client 依次调用 `initialize`、`authenticate`，随后再选择模型。若 Client 声明 `clientCapabilities.auth.terminal`，omp 会提供 `terminal` 认证方式，并启动 omp TUI 完成登录；否则只提供 `agent` 方式，复用 `~/.omp` 中已配置的 Provider 密钥与 OAuth 状态。

## 客户看到什么

当 Client 在 `initialize` 时声明文件系统和终端能力，omp 会经由 Client 路由内置工具的 I/O。这样 `read` 能读取尚未保存的编辑器缓冲区，而写入则由编辑器负责落盘。

| 操作工具 | ACP方法 |
| --- | --- |
| `read` | `fs/read_text_file` |
| `write` | `fs/write_text_file` |
| `bash` | `terminal/create` + `terminal/output`（每次调用使用 Client 提供的终端） |

当 Client 支持 `session/request_permission` 时，`bash` 调用以及会删除或移动文件的破坏性 `edit` 操作都会经过权限请求。omp 会在会话生命周期内按工具缓存 `allow_always` 与 `reject_always`，一次授权即可覆盖后续同类操作。Client 还可以公开计划模式，让用户从编辑器 UI 切换到“仅提出方案”；工具更新中的 `tool_call_update.locations` 则可用于实时定位多文件修改。

## 斜杠命令

大多数[斜杠命令](/docs/slash)都会出现在 ACP 的命令列表中，因此可直接在编辑器内使用 `/plan`、`/model`、`/compact` 等命令。没有文本处理器、仅服务于 TUI 的命令会被过滤；`/login` 与 `/quit` 也不会出现，因为认证由 ACP 的 `authenticate` 步骤处理，而退出由 Client 负责。

文件引用（`@path`）和工具调用卡与 TUI 中的语义一致；编辑器通过 ACP 的内容块类型进行呈现。

## 模式和 config 更新

`session/set_mode` 和 `session/set_session_config_option("mode", …)` 都会发出 `current_mode_update`，使编辑器状态保持同步。`/model` 切换后会发出 `config_option_update`。

## 扩展方法

除标准 ACP 方法外，omp 还提供少量 `_omp/*` 扩展方法；前导下划线表示这些方法不属于协议规范：

| 方法 | 返回内容 |
| --- | --- |
| `_omp/sessions/listAll` | 跨工作目录的分页会话索引。 |
| `_omp/projects/list` | 已发现的项目工作目录及其会话数量。 |
| `_omp/chats/byCwd` | 按工作目录筛选的会话。 |
| `_omp/usage` | 活动会话的令牌和成本汇总。 |
| `_omp/extensions` | 列出发现的扩展。 |
| `_omp/extensions/toggle` | 启用或禁用扩展。 |

借助这些方法，ACP Client 无需自行实现会话发现，即可浏览和重新打开历史会话。底层会话树的存储方式请参阅[会话](/docs/sessions)。

## 调试协议流

ACP 与 RPC 一样采用“stdio 上每行一个 JSON 对象”的格式，因此可用同样的 `tee` 方法记录双向协议流：

```sh
mkfifo in out
tee acp.in.log < in | omp acp | tee acp.out.log > out &
# point your ACP client at the named pipes
#   stdin  -> in
#   stdout -> out
```

如只需排查一次问题，可通过 `omp acp 2>acp.stderr.log` 启动。omp 会把启动和传输错误写入 stderr，不会混入 ACP 数据流。
