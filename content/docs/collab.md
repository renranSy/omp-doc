---
title: "协作"
description: "使用 omp Collab 建立端到端加密的实时协作会话，控制访客的查看、提示、中断和子智能体权限。"
summary: "本页介绍 `/collab` 与 `/join` 的启动方式、链接格式、AES-256-GCM 加密、访客权限模型及浏览器客户端的安全边界。"
keywords:
  - "omp Collab"
  - "实时协作"
  - "端到端加密"
  - "共享会话"
  - "访客权限"
source: https://omp.sh/docs/collab
---

# 协作

## 快速启动

`/collab` 与其他 omp 实例共享您的运行会话。来宾在自己的 TUI 中本地渲染相同的会话 — 流式助手文本、工具调用卡、页脚状态（cwd、模型、上下文 %、成本）、ctrl+o 扩展、 `/dump` — 无终端镜像。客人可以提示和打断座席；主机运行代理和所有工具。

```text
/collab
```

版画

```text
Collab session started!
 • Join from another terminal: omp join "mgAYTZwEnpRQtca0CTgn-Q#gdJUbTovD94ofDaa8YvhY0-ty16w4fn8PgB6PLnoA30"
 • or any web browser: my.omp.sh/#mgAYTZwEnpRQtca0CTgn-Q#gdJUbTovD94ofDaa8YvhY0-ty16w4fn8PgB6PLnoA30
```

浏览器线路是点击加入：中继为 web 访客客户端提供服务 `/`，以及 URL 片段中的房间 id + key。从另一个 omp（任何目录、任何机器），任何一种形式都可以：

```text
/join my.omp.sh/#mgAYTZwEnpRQtca0CTgn-Q#gdJU…
```

客人之前的会话恢复于 `/leave` （或者当主机停止时）。

## 命令

| 命令 | 效果 |
| --- | --- |
| `/collab` | 开始共享（或在已托管时重新打印链接） |
| `/collab <relay>` | 通过特定中继开始共享（`relay.example.com`, `ws://localhost:7475`) |
| `/collab view` | 打印只读（仅查看）链接（如果需要，首先开始共享） |
| `/collab status` | 显示链接+参与者 |
| `/collab stop` | 停止分享 |
| `/join <link>` | 以访客身份加入共享会话 |
| `/leave` | 离开（访客）或停止共享（主持人） |

## 链接格式

```text
https://host[:port]/#<link>          → browser deep link (printed by /collab; /join accepts it too)
<roomId>#<key>                       → default relay (my.omp.sh)
host[:port]/r/<roomId>#<key>         → custom relay, wss:// inferred
ws://localhost:7475/r/<roomId>#<key> → plain ws, allowed for localhost only
```

尾随片段 (`#<key>`) 是房间秘密，采用 base64url 编码，具有以下两个优点之一：

-   **完整链接** — 48 字节：32 字节 AES-256-GCM 房间密钥，后跟 16 字节写入令牌。授予提示、中断和子代理控制权。
-   **仅供查看的链接** — 仅包含 32 字节密钥，不含写入 Token。只授予实时读取权限；旧版链接也会解析为仅供查看模式。

在浏览器深层链接中，第一个之后的所有内容 `#` — 房间 ID 和密钥 — 是一个 URL 片段：它永远不会出现在任何 HTTP 请求中，并且两个秘密都不会发送到中继。

## 端到端加密

每个会话有效负载（条目、事件、状态、提示）在接触套接字之前都使用 AES-256-GCM 进行密封。继电器只能看到：

-   房间 ID 和连接数，
-   不透明的密文帧及其大小，
-   4 字节路由前缀（来宾帧的目标）。

链接的拥有是信任边界：完整链接读取并引导会话，仅查看链接读取会话。像秘密一样分享两者。

## 访客权限模型

两个信任级别，由链路本身强制执行 - 主机在加入时验证 16 字节写入令牌，并拒绝来自没有它的对等方的写入；它们在参与者列表中显示为只读，并且加入通知也如此说明。

拥有完整链接的客人可以：

-   阅读整个会话，包括加入时的背稿，
-   提示代理——在每个参与者的成绩单上显示他们的姓名徽章；LLM会逐字看到提示文本，名称仅显示，
-   中断代理 (Esc)，
-   针对主机的子代理使用代理中心：实时表和进度、聊天、终止、恢复以及按需从主机获取的脚本查看。

具有仅供查看链接的访客可以实时阅读所有内容 - 后台记录、流文本、工具卡、子代理记录 - 但主持人拒绝他们的提示、打断和代理控制。

改变主机会话或机器的所有内容都是仅限主机的： `/model`, `/compact`, `/resume`, `/branch`，重击（`!`), python (`$`），skills。客人保留一小部分当地许可名单（`/dump`, `/export`, `/copy`, `/help`, `/hotkeys`, `/theme`, `/settings`, `/leave`, `/collab`, `/exit`).

已知 v1 限制：当访客加入时，已经流式传输的Turn从其下一个消息边界可见。

## Web 客户端

中继服务于一个独立的浏览器客户端 `/` 对于相同的链接 - 来宾端不需要安装 omp。 `https://<relay>/#<link>` 加载客户端并从片段自动连接。它呈现实时记录（流文本、思考、工具卡）、具有按需记录的子代理面板以及具有相同来宾权限的作曲家：提示、中断、中心操作。除了中继之外，客户端不会与任何其他对象通信，并且密钥保留在片段中。

## 设置

| 设置 | 默认 | 含义 |
| --- | --- | --- |
| `collab.relayUrl` | `wss://my.omp.sh` | 继电器使用者 `/collab` 当没有内联传递继电器时 |
| `collab.displayName` | 操作系统用户名 | 向其他参与者显示的姓名 |

## 自托管中继

生产环境使用的 Go 中继目前没有发布可自托管的源码或独立二进制文件；上文的端点仅描述托管服务的网络契约，并不表示存在可安装的发行版。

仓库为本地协议开发提供了一个仅支持 WebSocket 的替代实现：`packages/collab-web/scripts/local-relay.ts`。在 `packages/collab-web` 中运行 `bun run relay` 后，它会监听 `ws://localhost:7466` 并实现 `/r/<roomId>`。该替代实现不提供浏览器客户端、`/share` blob 或 `/healthz`，不能代替生产服务。
