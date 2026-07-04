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

模式标志与其他所有标志一起列出 [CLI 参考](/docs/cli)。 ACP 使用 JSON-RPC 框架在 stdio 上运行 - 生成 omp 作为子进程并将其 stdin/stdout 连接到您的客户端。

规范： [zed-industries/Agent Client Protocol](https://github.com/zed-industries/agent-client-protocol)。 Zed 提供第一方 ACP 支持；其他实现该协议的编辑器可以以相同的方式驱动 omp。

## 初始化

ACP 启动时不需要配置模型。客户开车 `initialize`，那么 `authenticate`，然后才选择一个模型。当客户选择加入时 `clientCapabilities.auth.terminal`, omp 发布广告 `terminal` 启动 omp TUI 进行登录的 auth 方法；否则唯一的方法是 `agent` — 重用已在下配置的 provider 键和 OAuth 状态 `~/.omp`.

## 客户看到什么

当客户端在以下位置公布文件系统和终端功能时 `initialize`，代理通过客户端路由内置工具 I/O。读取看到未保存的缓冲区；写入操作通过编辑器落盘。

| 操作工具 | ACP方法 |
| --- | --- |
| `read` | `fs/read_text_file` |
| `write` | `fs/write_text_file` |
| `bash` | `terminal/create` + `terminal/output` （每次呼叫客户端终端） |

`bash` 呼叫和破坏性 `edit` 操作（文件删除和移动）被控制在后面 `session/request_permission` 当客户支持时。代理缓存 `allow_always` 和 `reject_always` 每个工具在会话的生命周期内，因此一次批准涵盖了一个很长的编辑循环。 计划模式 已公布，以便客户可以从其 UI 将代理转为仅提案执行；工具调用更新携带 `tool_call_update.locations` 因此编辑人员可以实时跟踪多文件编辑。

## 斜杠命令

大多数 [斜线命令](/docs/slash) 通过ACP的命令列表表面，所以用户得到相同的 `/plan`, `/model`, `/compact`，等等从编辑器内部。没有文本处理程序的命令（仅用于驱动 TUI 表面的命令）将被过滤掉，并且 `/login` 和 `/quit` 也被隐藏（登录名由 ACP 拥有 `authenticate` 步骤；辞职是客户的工作）。

文件参考（`@path`）和工具调用卡的工作方式与它们在 TUI 中的工作方式相同 - 编辑器使用 ACP 的内容块类型来呈现它们。

## 模式和 config 更新

`session/set_mode` 和 `session/set_session_config_option("mode", …)` 两者都发射 `current_mode_update` 所以编辑器保持同步。 `/model` 发出 `config_option_update` 切换后。

## 扩展方法

除了库存ACP，omp曝光了小 `_omp/*` 命名空间（前导下划线是规范对非规范方法的约定）：

| 方法 | 退货 |
| --- | --- |
| `_omp/sessions/listAll` | 分页跨 cwd 会话索引。 |
| `_omp/projects/list` | 发现项目 cwds 和会话计数。 |
| `_omp/chats/byCwd` | 按工作目录过滤的会话。 |
| `_omp/usage` | 活动会话的令牌和成本汇总。 |
| `_omp/extensions` | 列出发现的扩展。 |
| `_omp/extensions/toggle` | 启用或禁用扩展。 |

这些允许 ACP 客户端浏览并重新打开先前的会话，而无需重新实现会话发现；看到 [会话](/docs/sessions) 了解底层树的布局方式。

## 调试线材

ACP 框架是 stdio 上每行一个 JSON 对象，与 RPC 形状相同，因此相同 `tee` 技巧的工作原理：

```sh
mkfifo in out
tee acp.in.log < in | omp acp | tee acp.out.log > out &
# point your ACP client at the named pipes
#   stdin  -> in
#   stdout -> out
```

对于一次性检查，运行编辑器 `omp acp 2>acp.stderr.log`。 omp 将启动和传输错误写入 stderr，而不将它们混合到 ACP 流中。
