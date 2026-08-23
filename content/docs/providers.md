---
title: "Provider"
description: "配置 omp 模型 Provider 的环境变量、OAuth 与 API Key，了解凭据优先级、Auth Broker 和 Gateway。"
summary: "本页比较三种认证方式，列出支持 OAuth 的 Provider，解释凭据解析顺序，并介绍跨机器共享凭据的 Auth Broker 与转发 Gateway。"
keywords:
  - "omp Provider"
  - "OAuth"
  - "API Key"
  - "Auth Broker"
  - "模型认证"
source: https://omp.sh/docs/providers
---

# Provider

## 三种认证方式

按使用场景选择认证方式。后续新增的凭据会参与同一 Provider 的凭据解析，而不会自动删除已有凭据。

| 方法 | 何时使用 | 示例 |
| --- | --- | --- |
| 环境变量 | 脚本、CI 或首次连通性测试；无需在磁盘保存凭据。 | `ANTHROPIC_API_KEY=sk-ant-… omp` |
| `/login` | 交互使用。支持时走 OAuth，否则提示输入 API Key；凭据保存到 `~/.omp/agent/agent.db`。 | `/login anthropic` |
| `config.yml` / `models.yml` | 声明式配置。为 Provider 指定密钥或环境变量名，便于新工作区直接使用。 | `apiKey: MYCO_API_KEY` |

`/login` 只会添加凭据，不会覆盖现有记录；使用 `/logout <provider>` 清除指定 Provider 的凭据。有关交互命令请参阅[斜杠命令](/docs/slash)，各 Provider 的 API Key 环境变量请参阅[环境变量](/docs/env)。

## 支持 OAuth 的 Provider

以下 Provider 可使用已有账号完成登录，无需手动粘贴密钥。`/login <provider>` 会启动认证流程；刷新后的令牌存储在 `agent.db`，并在请求前按需刷新。

| Provider | `/login` 标识 | 说明 |
| --- | --- | --- |
| Anthropic（Pro / Max） | `anthropic` | 在浏览器完成 console.anthropic.com 的认证；取消后会回到 API Key 输入提示。 |
| OpenAI Codex | `openai-codex` | 使用 ChatGPT 账号登录；用量感知轮换会避开接近 5 小时或周限额的账号。 |
| GitHub Copilot | `github-copilot` | 支持 github.com 或企业主机的设备码登录；成功后会启用可用的 Copilot 模型目录。 |
| Gemini CLI | `google-gemini-cli` | 使用 Google 账号认证，并复用 Gemini CLI 的凭据。 |
| Z.AI | `zai` | 通过提示粘贴 Key，不走浏览器流程；列出它是因为支持 `/login zai` 入口。 |
| Cursor | `cursor` | 在 cursor.com 的浏览器流程中完成认证。 |

其他 Provider 使用 API Key 认证：可设置相应的 `*_API_KEY` 环境变量，也可通过 `/login` 按提示输入。

## 凭据解析顺序

omp 需要某个 Provider 的凭据时，按以下顺序查找并使用首个命中项：

1. `omp` 进程的运行时覆盖：`--api-key`。
2. `agent.db` 中保存的 API Key；同一 Provider 有多个 Key 时会轮换使用。
3. `agent.db` 中保存的 OAuth 凭据，并在每次调用前按需刷新。
4. Provider 的环境变量，如 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY`、`GEMINI_API_KEY`、`ZAI_API_KEY`。
5. `models.yml` 的 `apiKey:` 字段：先视为环境变量名查找，未命中时才将其视为字面量 Token。

> 同一 Provider 同时存在 API Key 与 OAuth 凭据时，API Key 优先。设置 `ANTHROPIC_OAUTH_TOKEN` 可显式让 Anthropic OAuth 优先。

完整变量清单请参阅[环境变量](/docs/env)；全局和项目配置文件的位置请参阅[设置](/docs/settings)。

## 远程凭据存储库（Auth Broker）

在多台机器上使用时，可通过 Auth Broker 共享一组凭据，而无需在每台机器分别执行 `/login`。Broker 仅需启动一次：

```sh
omp auth-broker serve --bind=127.0.0.1:8765
omp auth-broker token                        # prints the bearer token (--regenerate rotates it)
omp auth-broker migrate --from-local         # one-time migration from agent.db
```

在客户端设置 `OMP_AUTH_BROKER_URL` 与 `OMP_AUTH_BROKER_TOKEN`，或在 `config.yml` 中使用相应的 `auth.broker.*` 配置。Broker 模式下，`/login`、`/logout` 与 OAuth 刷新都由远程凭据库处理，本地 `agent.db` 保持为空。客户端会缓存凭据用量并保留最近一次可用结果，以降低短暂服务波动对请求的影响。

对于直接使用 Provider 协议的 CLI、脚本或第三方 Agent，可运行 `omp auth-gateway serve`。该转发网关会把 omp 解析出的凭据注入 OpenAI Chat、Anthropic Messages 和 OpenAI Responses 请求。使用网关 Bearer Token 将客户端指向网关地址；网关会在每次请求时回调 Broker，因此凭据轮换与 `/v1/usage` 统计仍集中管理。

## 在会话中切换 Provider

`/model` 会打开当前已认证 Provider 可用模型的选择器。`/model <id>` 可直接设置模型而不打开 UI。切换模型不会注销其他 Provider，只会改变下一次调用的目标模型。

```text
> /model
? Pick a model: anthropic/claude-sonnet-4-6
> /model openai/gpt-5.3-codex:high
```

如需为单次命令指定 Provider 与模型，可使用 `--provider` 和 `--model`：

```sh
omp --provider openai --model gpt-5.3-codex:high
```

参阅[模型角色](/docs/roles)可为不同工作类型分配模型；参阅[自定义模型与 Provider](/docs/custom-models)可添加自己的 Provider。
