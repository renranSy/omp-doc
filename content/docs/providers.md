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

选择适合当下的那个。您稍后设置的任何内容都会影响该 provider 之前的设置。

| 方法 | 何时使用 | 示例 |
| --- | --- | --- |
| 环境变量 | 脚本、CI、首次运行冒烟测试。磁盘上什么也没有。 | `ANTHROPIC_API_KEY=sk-ant-… omp` |
| `/login` | 互动。当 provider 支持时，走 OAuth 流程，否则提示输入密钥。存储在 `~/.omp/agent/agent.db`. | `/login anthropic` |
| `config.yml` / `models.yml` | 声明性的。为每个 provider 固定一个密钥（或环境变量名称），以便在新检出的工作区中无需交互步骤即可使用。 | `apiKey: MYCO_API_KEY` |

`/login` 附加 - 它不会替换现有的凭据。 `/logout <provider>` 清除它们。参见 [斜杠命令](/docs/slash) 为充分 `/login` 表面，以及 [Environment variables](/docs/env) 对于每个 provider 的 API-key var。

## 支持 OAuth 的Provider

这些Provider允许您使用现有帐户登录，而不是粘贴原始密钥。 `/login <provider>` 启动认证流程；刷新后的令牌存储在 `agent.db` 并在每次调用前轮换。

| Provider | `/login` 编号 | 注释 |
| --- | --- | --- |
| Anthropic（专业版/最大版） | `anthropic` | console.anthropic.com 的浏览器认证流程。如果取消则返回到输入 Key 的提示。 |
| OpenAI 法典 | `openai-codex` | ChatGPT 账户流程。使用感知轮换会跳过接近 5 小时或每周上限的关键。 |
| GitHub Copilot | `github-copilot` | 针对 github.com 或您的企业主机的设备代码流。成功后，完整的 Copilot 目录（Claude、GPT、Gemini、Grok）将自动启用。 |
| Gemini CLI | `google-gemini-cli` | Google 账户认证流程；使用与 gemini CLI 相同的凭据。 |
| Z.AI | `zai` | 仅按键粘贴 - 无浏览器流程。列在这里是因为 `/login zai` 是支持的入口点。 |
| Cursor | `cursor` | cursor.com 的浏览器认证流程。 |

每个其他 provider 使用 API 密钥进行身份验证 - 通过其 `*_API_KEY` 环境变量或通过 `/login` 这将提示输入密钥。

## 决议顺序

当 omp 需要 provider 的凭证时，它会遍历此列表并返回第一个命中：

1.  `--api-key` omp 进程上的运行时覆盖。
2.  存储 API 密钥 `agent.db`。当为同一个 provider 存储多个密钥时，调用是循环的。
3.  将 OAuth 凭证存储在 `agent.db`，在每次调用前按需刷新。
4.  Provider 环境变量 (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ZAI_API_KEY`, …).
5.  `apiKey:` 领域在 `models.yml`。首先作为环境变量名称进行检查，然后将其视为文字标记。

> 当同一 provider 存在 API 密钥和 OAuth 凭证时，API 密钥获胜。套装 `ANTHROPIC_OAUTH_TOKEN` 显式强制 OAuth 优先。

有关完整的环境变量清单，请参阅 [Environment variables](/docs/env)。有关全局和项目 config 文件所在的位置，请参阅 [设置](/docs/settings).

## 远程凭据存储库（Auth Broker）

多机设置可以共享一组凭据而不是运行 `/login` 每个盒子上。启动一次 Broker：

```sh
omp auth-broker serve --bind=127.0.0.1:8765
omp auth-broker token                        # prints the bearer token (--regenerate rotates it)
omp auth-broker migrate --from-local         # one-time migration from agent.db
```

向客户指出 `OMP_AUTH_BROKER_URL` + `OMP_AUTH_BROKER_TOKEN` （或匹配的 `auth.broker.*` 键入 `config.yml`）。在 Broker 模式下 `/login`, `/logout`、OAuth 通过远程保管库刷新所有代理；当地的 `agent.db` 保持空状态。客户端为每个凭证保留 5 分钟的使用缓存，并带有抖动和最后一次已知的良好回退，以及前面 15 秒的单次飞行 `/v1/usage`，因此短暂的服务波动不会导致呼叫失败。

对于使用原始 provider wire format（CLI、脚本、第三方代理）的工具，请将代理与 `omp auth-gateway serve` — 一个转发代理，将代理解析的凭据注入到 OpenAI 聊天、Anthropic 消息和 OpenAI 响应请求中。使用网关Bearer Token将这些客户端指向网关的基本 URL；网关根据每个请求回调代理，因此凭证轮换和 `/v1/usage` 用量统计保持集中管理。

## 会话中途切换Provider

`/model` 打开适用于您登录的Provider的模型选择器。 `/model <id>` 在没有 UI 的情况下设置一个。切换时不会注销之前的provider；它为下一个针对它的调用做好准备。

```text
> /model
? Pick a model: anthropic/claude-sonnet-4-6
> /model openai/gpt-5.3-codex:high
```

要为单个命令绑定 provider，请使用 `--provider` 和 `--model` 在发射线上：

```sh
omp --provider openai --model gpt-5.3-codex:high
```

参见 [模型角色](/docs/roles) 将不同的Provider分配给不同类型的工作，以及 [自定义模型和Provider](/docs/custom-models) 添加您自己的。
