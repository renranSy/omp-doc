---
title: "密钥与认证"
description: "了解 omp 如何在 agent.db 中存储 OAuth 与 API Key，并通过 Auth Broker 和 Gateway 跨机器安全共享凭据。"
summary: "本页介绍凭据存储格式、登录与退出、解析优先级、文件权限、远程 Broker、SSH 登录代理和 Gateway 转发的安全模型。"
keywords:
  - "omp 认证"
  - "agent.db"
  - "OAuth"
  - "Auth Broker"
  - "API Key"
source: https://omp.sh/docs/secrets
---

# 密钥与认证

omp 将每个 provider 凭证（OAuth 刷新令牌、OAuth 访问令牌、存储的 API 密钥）保存在单个本地 SQLite 文件中。 `/login` 写入它， `/logout` 清除其中的条目，并调用 provider 从中读取。当您需要在多个主机上进行相同的登录时，请将本地文件交换为远程代理，而无需触及任何其他 config。

## 凭证存储

凭证位于 `~/.omp/agent/agent.db` （或同等的 `PI_CONFIG_DIR`）。每个凭证一行，每个 provider 允许多个凭证 - 在调用时在它们之间进行循环选择。

存储每行保存三件事：provider id (`anthropic`, `openai-codex`, `google-gemini-cli`，...）、凭证类型（OAuth 或 API 密钥）以及秘密负载。 OAuth 行同时携带长寿命 `refresh` 令牌和短暂的 `access` 令牌；只要访问令牌在到期前一分钟内，刷新就会在进程中发生。 API-键行保存原始密钥。

按照您的方式保护文件 `~/.ssh/id_*`：文件系统权限是对您的主目录具有读取访问权限的攻击者与您的令牌之间的唯一权限。如果您担心这一点，请使用以下命令将凭证完全从计算机上移走： [授权代理](#sharing-credentials-across-machines) — 笔记本电脑根本不持有刷新令牌。

## 登录和退出

内部 OMP：

-   `/login` 打开 provider 选择器。选择一个 provider，在浏览器中完成 OAuth 流程，并将生成的令牌附加到 `agent.db`。对于非 OAuth 提供程序，在出现提示时粘贴 API 密钥的作用相同。
-   `/logout <provider>` 删除该 provider 的每个凭证行。用它来撤销帐户而不影响其他人。
-   要旋转， `/logout` 然后 `/login` 再次。没有就地轮换——新的标记替换旧的行。

OAuth 流为每个 provider 绑定一个本地回调端口，以便浏览器可以将代码交还给 omp。默认值：Anthropic `54545`, OpenAI 法典 `1455`, Google Gemini CLI `8085`, Google 反重力 `51121`, GitLab 双人 `8080`。如果繁忙，请在重新运行之前关闭与其绑定的任何其他内容 `/login`.

选取器也是检查表面：它显示每个 provider 中至少有一行 `agent.db`，所以看一眼 `/login` 告诉您当前登录的内容。参见 [Provider](/docs/providers) 对于支持 OAuth 的 provider 矩阵。

## API 密钥与存储的凭据

当 omp 需要 provider 的凭证时，它会遍历此列表并返回第一个命中：

1.  `--api-key` 在 omp 命令行上。
2.  存储 API-key 行于 `agent.db`.
3.  存储 OAuth 行于 `agent.db` （如果过期则刷新）。
4.  Provider 环境变量 (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, …).

环境变量是后备，而不是覆盖 - 对于相同的 provider，存储的凭证始终胜过环境变量。要强制环境变量优先， `/logout <provider>` 首先。完整的环境库存位于 [Environment variables](/docs/env).

存在一个狭窄的覆盖：a `models.yml` `apiKey` 将击败存储的 OAuth 令牌而不覆盖运行时 `--api-key`。这是“我希望这个模型 config 使用特定密钥，同时保持我的 OAuth 登录完好无损”的应急出口。

## 跨机器共享凭证

`omp auth-broker serve` 将一台主机变成其他计算机通过 HTTP 查询的凭证库。经纪人是刷新Token的唯一编写者；客户端会收到一个快照，其中刷新令牌被哨兵替换，并且它们会在访问令牌到期时回调代理。

```sh
# on the broker host
omp auth-broker serve --bind=0.0.0.0:8765
omp auth-broker login anthropic     # OAuth flow runs here
omp auth-broker token --json        # mint the bearer token for clients
```

向客户指出 `OMP_AUTH_BROKER_URL` 和 `OMP_AUTH_BROKER_TOKEN` （或匹配的 `auth.broker.url` / `auth.broker.token` 键入 `config.yml`）。设置后，omp 会绕过本地 `agent.db` 完全并通过经纪人解决每个凭证。 `/login` 和 `/logout` 代理也通过，所以日常使用没有变化。

`omp auth-broker login <provider> --via=user@host` 对于代理主机上没有浏览器的笔记本电脑来说，这是一个技巧：它会打开一个 SSH 隧道，以便 OAuth 回调会到达您的本地浏览器，同时凭证会到达代理的主机上。 `agent.db`。其他有用的子命令： `omp auth-broker logout <provider>` （没有参数的交互式）， `omp auth-broker list` 枚举支持的Provider， `omp auth-broker status`, `omp auth-broker token --regenerate` 旋转承载器。

客户端和代理之间的传输安全是您的责任 - 在反向代理处终止 TLS，或将代理置于 Tailscale / WireGuard 后面。代理在每个端点上强制执行Bearer Token，除了 `/v1/healthz`.

## 通过网关路由 provider 呼叫

代理仅解析凭证；它不代理 provider 流量。对于使用原始 OpenAI 聊天、Anthropic 消息或 OpenAI 响应wire format（第三方 CLI、脚本、IDE 插件、容器化 omp）的客户端，将代理与 `omp auth-gateway serve`。网关接受这些请求 `127.0.0.1:4000` （默认），去除入站 `Authorization` 标头，要求代理解析所请求模型的正确凭证，并将字节转发到上游并注入解析的访问令牌。

网关本身就是一个broker客户端，所以它继承了 `OMP_AUTH_BROKER_URL` 和 `OMP_AUTH_BROKER_TOKEN`。它自己的入站Bearer Token位于 `~/.omp/auth-gateway.token` （模式 `0600`); `--no-auth` 禁用仅环回使用的检查。客户永远不会看到 provider Token，并且凭证轮换继续从单个代理进行。

## 相关

-   [Provider](/docs/providers) — 支持 OAuth 的 provider 列表和完整的凭证解析顺序。
-   [Environment variables](/docs/env) — 每个 `OMP_*` 和 provider `*_API_KEY` 变量 omp 读取。
-   [MCP](/docs/mcp) — MCP 服务器重用相同的 `agent.db` 获取他们的 OAuth 凭证。
