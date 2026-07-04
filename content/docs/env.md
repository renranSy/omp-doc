---
title: "环境变量"
description: "查询 omp 支持的环境变量，覆盖运行时目录、Provider 凭据、云平台、Web 搜索、本地模型、TUI 与调试设置。"
summary: "本页按类别列出 omp 环境变量及解析优先级，包括 OAuth 与 API Key、Azure、AWS、Vertex、本地模型、子智能体和 Shell 行为。"
keywords:
  - "omp 环境变量"
  - "API Key"
  - "Provider 配置"
  - "本地模型"
  - "云模型"
source: https://omp.sh/docs/env
---

# 环境变量

## 决议顺序

omp 通过分层解析环境变量 `.env` 链。第一个定义密钥的源获胜：

1.  现有的流程环境。
2.  `$PWD/.env` — 该项目的 `.env` 在 omp 启动的目录中。
3.  `~/.omp/agent/.env` — 或 `$PI_CODING_AGENT_DIR/.env` / `$PI_CONFIG_DIR/agent/.env` 如果设置了这些。
4.  `~/.omp/.env` — 荣誉 `PI_CONFIG_DIR`.
5.  `~/.env` — 你的家 `.env`.

每个里面 `.env` 文件，密钥写为 `OMP_FOO` 被镜像到 `PI_FOO`，所以旧的配置来自 `OMP_*` 时代仍然有效，无需重命名。设置在 `~/.omp/agent/config.yml` 覆盖内置默认值； CLI 标志覆盖两者。参见 [CLI 参考](/docs/cli) 对于标志列表。

> 环境变量在启动时读取。编辑后 `~/.env` 或一个项目 `.env`，重新启动omp。

> 对待任何以 `_API_KEY`, `_TOKEN`, 或 `_OAUTH_TOKEN` 作为一个秘密。从不承诺 `.env` 文件；切勿将它们粘贴到聊天记录中。 `chmod 600` 任何 `.env` 包含凭据的文件。

## .env 文件格式

一 `KEY=value` 每行， `#` 对于注释，引号是可选的，但对于包含空格或 shell 元字符的值，建议使用引号。没有插值，没有 `export` 需要关键字。

```sh
# ~/.omp/.env — applies to every project
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PI_SLOW_MODEL="openai/gpt-5.3-codex:high"
PI_NO_PTY=1
```

## 运行时旋钮

人们最常接触到的Flag。每个都有一个更高优先级的CLI标志或设置键；环境变量是为 shell 会话或 CI 作业设置环境变量的最低摩擦方式。

| 变量 | 它的作用 |
| --- | --- |
| `PI_CODING_AGENT_DIR` | 关闭代理数据目录 `~/.omp/agent` — 在共享盒子或隔离配置文件时很有用。 |
| `PI_CONFIG_DIR` | 将根目录重命名为 config `$HOME` （默认 `.omp`）。代理目录变为 `~/<PI_CONFIG_DIR>/agent` 除非 `PI_CODING_AGENT_DIR` 也被设定。 |
| `PI_PACKAGE_DIR` | 将 package 资产解析（文档、示例、更改日志）指向自定义安装路径 - 在 Nix/Guix 上很方便。 |
| `PI_SMOL_MODEL` | 固定会话的 smol 角色。 CLI `--smol` 如果两者都设置了则获胜。 |
| `PI_SLOW_MODEL` | 固定缓慢/推理的角色。 CLI `--slow` 获胜。 |
| `PI_PLAN_MODEL` | 固定计划角色。 CLI `--plan` 获胜。 |
| `PI_NO_PTY` | 设置为 `1` 禁用 bash 工具的 PTY 路径。相当于 `--no-pty`. |
| `PI_PY` | 门控 Python 后端 `eval` 工具：真相（`1`/`true`/`yes`/`on`) 启用，任何其他值禁用；未设置遵循 `eval.py` 设置（默认启用）。 |
| `PI_JS` | JavaScript 后端的伴随门 `eval` (`eval.js` 设置）。 |
| `OMP_GITHUB_CACHE_DB` | 覆盖 SQLite 缓存文件支持 `pr://` 和 `issue://`。默认 `~/.omp/cache/github-cache.db`. |
| `OMP_AUTORESEARCH_DB_DIR` | 覆盖保存自动研究 SQLite 数据库的目录。 |
| `VISUAL`, `EDITOR` | 首选外部编辑器和后备，使用者 Ctrl+G. |
| `PUPPETEER_EXECUTABLE_PATH` | 告诉浏览器工具要启动哪个 Chromium 二进制文件。 |

## Provider 凭证

您要使用的每个 provider 一把钥匙。对于 Anthropic、OpenAI Codex、GitHub Copilot、Kimi、Cursor 和 Qwen Portal，交互式 `/login` 将 OAuth 凭证写入 `~/.omp/agent/agent.db` 通常比管理 API 密钥更麻烦。参见 [Provider](/docs/providers) 完整的 OAuth 矩阵和登录流程。

| Provider | 环境变量 | 注释 |
| --- | --- | --- |
| Anthropic | `ANTHROPIC_OAUTH_TOKEN`, `ANTHROPIC_API_KEY` | OAuth Token胜过 API 密钥。 |
| Anthropic 代工厂 | `ANTHROPIC_FOUNDRY_API_KEY` | 使用时 `CLAUDE_CODE_USE_FOUNDRY` 已开启。 |
| OpenAI | `OPENAI_API_KEY` | 也由 OpenAI 响应和 Codex 解析使用。 |
| OpenAI 法典 | `OPENAI_CODEX_OAUTH_TOKEN` | OAuth 通过 `/login` 首选。 |
| Google (Gemini) | `GEMINI_API_KEY` | 图像工具回退到 `GOOGLE_API_KEY`. |
| Google 顶点 | `GOOGLE_CLOUD_API_KEY` | 否则 ADC + 项目/位置；请参阅下面的云Provider。 |
| 亚马逊基岩 | 多个 | 请参阅下面的云Provider。 |
| Azure OpenAI | `AZURE_OPENAI_API_KEY` | 请参阅下面的云Provider。 |
| 格罗克 | `GROQ_API_KEY` |  |
| 大脑 | `CEREBRAS_API_KEY` |  |
| 烟花 | `FIREWORKS_API_KEY` |  |
| 一起 | `TOGETHER_API_KEY` |  |
| 抱脸 | `HUGGINGFACE_HUB_TOKEN` → `HF_TOKEN` | 第一个非空者获胜。 |
| 合成的 | `SYNTHETIC_API_KEY` |  |
| 英伟达 | `NVIDIA_API_KEY` |  |
| 纳米GPT | `NANO_GPT_API_KEY` |  |
| 威尼斯 | `VENICE_API_KEY` | 允许未经身份验证的访问。 |
| 莱特LLM | `LITELLM_API_KEY` | OpenAI 兼容的 LiteLLM 代理。 |
| LM工作室 | `LM_STUDIO_API_KEY` *（可选）* | 本地服务器通常不需要身份验证。 |
| 奥拉玛 | `OLLAMA_API_KEY` *（可选）* |  |
| 奥拉马云 | `OLLAMA_CLOUD_API_KEY` |  |
| 骆驼.cpp | `LLAMA_CPP_API_KEY` *（可选）* |  |
| LLM | `VLLM_API_KEY` | 无身份验证本地服务器的任何非空值。 |
| 小米MiMo | `XIAOMI_API_KEY` |  |
| 登月计划 | `MOONSHOT_API_KEY` |  |
| 基米密码 | `KIMI_API_KEY` | OAuth 通过 `/login` 是共同的路径。 |
| 人工智能 | `XAI_API_KEY` |  |
| 开放路由器 | `OPENROUTER_API_KEY` | 通过 OpenRouter 路由时也由图像工具使用。 |
| 米斯特拉尔 | `MISTRAL_API_KEY` |  |
| Z.AI | `ZAI_API_KEY` | 还驱动 z.ai web-搜索 provider。 |
| 最小最大 | `MINIMAX_API_KEY` |  |
| 极小极大代码 | `MINIMAX_CODE_API_KEY` |  |
| MiniMax 代码 CN | `MINIMAX_CODE_CN_API_KEY` |  |
| OpenCode Go / Zen | `OPENCODE_API_KEY` | 两条路线的共享密钥。 |
| 千帆 | `QIANFAN_API_KEY` |  |
| 奎文传送门 | `QWEN_OAUTH_TOKEN` → `QWEN_PORTAL_API_KEY` | OAuth Token获胜。 |
| Cursor | `CURSOR_ACCESS_TOKEN` | OAuth 通过 `/login` 推荐。 |
| 多路复用器 | `ZENMUX_API_KEY` | 涵盖 ZenMux 的 OpenAI 和 Anthropic 兼容路由。 |
| 深度搜索 | `DEEPSEEK_API_KEY` |  |
| 基洛网关 | `KILO_API_KEY` | 允许未经身份验证的访问。 |
| 阿里巴巴编码计划 | `ALIBABA_CODING_PLAN_API_KEY` |  |
| Vercel人工智能网关 | `AI_GATEWAY_API_KEY` | 还接受 `VERCEL_AI_GATEWAY_API_KEY` 用于目录发现。 |
| Cloudflare AI 网关 | `CLOUDFLARE_AI_GATEWAY_API_KEY` | 基本 URL 形式 `https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/anthropic`. |
| GitLab 双人 | `GITLAB_TOKEN` |  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN` | 通用 `GH_TOKEN` / `GITHUB_TOKEN` 不用于 Copilot（web 抓取器读取这些）。 |
| 身份验证代理（远程） | `OMP_AUTH_BROKER_URL`, `OMP_AUTH_BROKER_TOKEN` | 将 omp 指向远程凭证库而不是 `~/.omp/agent/agent.db`。 URL启用代理模式；令牌对客户端进行身份验证。参见 [Provider](/docs/providers). |

## 云Provider

### Anthropic 铸造厂和 mTLS

当您的组织使用需要自定义标头或客户端证书的 Azure Foundry 或企业网关来实现 Anthropic 时，请实现此目的。设置 `CLAUDE_CODE_USE_FOUNDRY` 将 Anthropic provider 切换到 Foundry 模式以进行流式传输和搜索。

| 变量 | 行为 |
| --- | --- |
| `CLAUDE_CODE_USE_FOUNDRY` | 类似布尔的开关 (`1`, `true`, `yes`, `on`). |
| `FOUNDRY_BASE_URL` | Anthropic Foundry 模式下的端点基本 URL。 |
| `ANTHROPIC_FOUNDRY_API_KEY` | Foundry 模式请求的Bearer Token。 |
| `ANTHROPIC_CUSTOM_HEADERS` | 额外的标题， `name: value` 条目以逗号或换行符分隔。 |
| `NODE_EXTRA_CA_CERTS` | 额外的 CA 链 — PEM 文件路径或内联 PEM（转义） `\n` 支持）。 |
| `CLAUDE_CODE_CLIENT_CERT`, `CLAUDE_CODE_CLIENT_KEY` | mTLS 客户端证书和匹配的私钥（必须配对）。 |

启用 Foundry 后的 Anthropic 分辨率变为 `ANTHROPIC_FOUNDRY_API_KEY` → `ANTHROPIC_OAUTH_TOKEN` → `ANTHROPIC_API_KEY`;否则 OAuth 令牌然后 API 密钥。

### 亚马逊基岩

地区解析 `options.region` → `AWS_REGION` → `AWS_DEFAULT_REGION` → `us-east-1`.

| 变量 | 行为 |
| --- | --- |
| `AWS_REGION`, `AWS_DEFAULT_REGION` | 主要区域，然后回退区域。 |
| `AWS_PROFILE` | 命名配置文件身份验证路径。 |
| `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | 普通 IAM 密钥。 |
| `AWS_BEARER_TOKEN_BEDROCK` | Bedrock API-密钥（Bearer Token）身份验证。 |
| `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI`, `AWS_CONTAINER_CREDENTIALS_FULL_URI` | 将 Bedrock 标记为可用于 provider 检测（分辨率本身涵盖环境密钥、配置文件/SSO/`credential_process`，然后是 IMDSv2)。 |
| `AWS_WEB_IDENTITY_TOKEN_FILE` + `AWS_ROLE_ARN` | 将 Bedrock 标记为可用于 provider 检测（与上面的 ECS 变量相同的警告）。 |
| `AWS_BEDROCK_SKIP_AUTH` | 如果 `1`，为代理/无身份验证设置注入虚拟凭据。 |
| `HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` | 通过 Bun 的本机获取代理支持获得荣誉。 |

### Azure OpenAI 响应

基本 URL 解析选项 → `AZURE_OPENAI_BASE_URL` → `AZURE_OPENAI_RESOURCE_NAME` → 模型的默认值。

| 变量 | 行为 |
| --- | --- |
| `AZURE_OPENAI_API_KEY` | 除非 API 密钥作为选项传递，否则是必需的。 |
| `AZURE_OPENAI_API_VERSION` | 默认 `v1`. |
| `AZURE_OPENAI_BASE_URL` | 直接覆盖基本 URL。 |
| `AZURE_OPENAI_RESOURCE_NAME` | 构建 `https://<resource>.openai.azure.com/openai/v1`. |
| `AZURE_OPENAI_DEPLOYMENT_NAME_MAP` | 映射字符串： `modelId=deployment,modelB=deploymentB`. |

### Google 顶点人工智能

| 变量 | 行为 |
| --- | --- |
| `GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT` | 项目 ID，然后回退。 |
| `GOOGLE_CLOUD_LOCATION` | 地区； ADC 身份验证所需（无默认值）。 |
| `GOOGLE_CLOUD_API_KEY` | 直接 Vertex API-密钥身份验证；跳过 ADC。 |
| `GOOGLE_APPLICATION_CREDENTIALS` | ADC JSON 的路径；回落到 `~/.config/gcloud/application_default_credentials.json`. |
| `GOOGLE_CLOUD_PROJECT_ID` | 仅 OAuth 登录帮助程序 — 由 Gemini CLI 项目发现使用。 |

## Web 搜索

内置 web 搜索提供程序的凭证和端点覆盖。一些键（例如Z.AI、Anthropic搜索）也会被相应模型provider读取。

| 变量 | 使用者 |
| --- | --- |
| `EXA_API_KEY` | Exa 搜索和 Exa MCP 工具。 |
| `BRAVE_API_KEY` | 勇敢的寻找。 |
| `PERPLEXITY_API_KEY` | 困惑API-键模式。 |
| `PERPLEXITY_COOKIES` | 困惑 cookie 身份验证模式。 |
| `TAVILY_API_KEY` | 塔维利。 |
| `KAGI_API_KEY` | 卡吉。 |
| `JINA_API_KEY` | 吉娜。 |
| `PARALLEL_API_KEY` | 平行。 |
| `ANTHROPIC_SEARCH_API_KEY`, `ANTHROPIC_SEARCH_BASE_URL`, `ANTHROPIC_SEARCH_MODEL` | 覆盖 Anthropic web 搜索后端。默认模型： `claude-haiku-4-5`. |
| `ANTHROPIC_BASE_URL` | 搜索后备路径使用的通用 Anthropic 基本 URL。 |
| `MOONSHOT_SEARCH_API_KEY` / `KIMI_SEARCH_API_KEY` | Kimi / Moonshot 搜索 provider。 |
| `MOONSHOT_SEARCH_BASE_URL` / `KIMI_SEARCH_BASE_URL` | Kimi / Moonshot 搜索端点覆盖。 |
| `PI_CODEX_WEB_SEARCH_MODEL` | Codex 搜索 provider 模型覆盖。 |
| `SEARXNG_ENDPOINT`, `SEARXNG_TOKEN` | SearXNG 端点和可选的Bearer Token。 |
| `SEARXNG_BASIC_USERNAME`, `SEARXNG_BASIC_PASSWORD` | SearXNG HTTP 基本授权 |
| `PI_AUTH_NO_BORROW` | 禁用 Perplexity 登录使用的 macOS 本机应用程序令牌借用路径。 |

## 评估 & Python 内核

| 变量 | 行为 |
| --- | --- |
| `PI_PY` | 后端门（参见 *运行时旋钮*). |
| `PI_JS` | JavaScript 后端的伴随门。 |
| `PI_PYTHON_SKIP_CHECK` | 跳过 Python 可用性探测（运行程序仍按需启动）。 |
| `PI_PYTHON_INTEGRATION` | 如果 `1`，选择针对真实 Python 安装的门控集成测试。 |
| `PI_PYTHON_IPC_TRACE` | 如果 `1`，记录与 Python 运行程序交换的 NDJSON 帧。 |
| `VIRTUAL_ENV` | Python 运行时解析的最高优先级 venv 路径。 |

当 `BUN_ENV=test` 或 `NODE_ENV=test`、Python 可用性检查被视为正常并跳过预热。 Python 运行程序从其子进程环境中删除常见的 API-key 变量，并且仅转发 `LC_`, `XDG_`, 和 `PI_` 前缀加上安全基集。

## 子代理上限

| 变量 | 行为 |
| --- | --- |
| `PI_TASK_MAX_OUTPUT_BYTES` | 每个子代理捕获的最大输出字节数（默认 `500000`). |
| `PI_TASK_MAX_OUTPUT_LINES` | 每个子代理捕获的最大输出行数（默认 `5000`). |
| `PI_BLOCKED_AGENT` | 在任务工具中阻止特定的子代理类型。 |
| `PI_SUBPROCESS_CMD` | 覆盖子代理生成命令（绕过 `omp` / `omp.cmd` 查找）。 |

## 行为切换

| 变量 | 行为 |
| --- | --- |
| `PI_NO_TITLE` | 在第一条用户消息上跳过自动生成的会话标题。 |
| `NULL_PROMPT` | 如果 `true`，系统提示生成器返回一个空字符串。对于调试或运行原始模型很有用。 |
| `PI_EDIT_VARIANT` | 强制使用编辑工具变体： `patch`, `replace`, `hashline`, `apply_patch`. |
| `PI_CACHE_RETENTION` | 如果 `long`，在支持的情况下启用长时间提示缓存保留（Anthropic、OpenAI 响应、Bedrock）。 |
| `PI_DISABLE_LSPMUX` | 如果 `1`，禁用 lspmux 集成并强制直接生成 LSP 服务器。 |
| `PI_RPC_EMIT_TITLE` | 以 RPC 模式发出标题事件。 |

## 性能与调试

| 变量 | 行为 |
| --- | --- |
| `PI_TIMING` | 任何非空值都会将累积的启动/工具计时打印到 stderr - 一旦启动完成（在 TUI 启动之前）以交互模式，在提示批处理之后 `-p` 打印模式。 `x` 打印它们并以状态 0 退出； `full` 添加每个模块负载跨度。在打印模式下，每个提示都包装为 `print:prompt:initial` / `print:prompt:next`. |
| `DEBUG_CURSOR` | Cursor provider 调试日志； `2`/`verbose` 对于有效负载片段。 |
| `DEBUG_CURSOR_LOG` | Cursor 调试流的可选 JSONL 日志文件路径。 |
| `PI_CODEX_DEBUG` | OpenAI Codex provider 调试日志记录。 |
| `PI_CODEX_WEBSOCKET` | 切换 Codex provider 的 websocket 传输。 |
| `PI_CODEX_WEBSOCKET_IDLE_TIMEOUT_MS` | 覆盖空闲超时（默认 `300000`). |
| `PI_CODEX_WEBSOCKET_RETRY_BUDGET` | 覆盖重试预算（默认 `5`). |
| `PI_CODEX_WEBSOCKET_RETRY_DELAY_MS` | 覆盖基本退避（默认 `500`). |
| `PI_OPENAI_STREAM_IDLE_TIMEOUT_MS` | 覆盖 OpenAI 流空闲超时。 |
| `PI_AI_GEMINI_CLI_VERSION` | 覆盖 Gemini CLI 用户代理版本标记。 |

## 本地服务器发现

| 变量 | 默认 |
| --- | --- |
| `LM_STUDIO_BASE_URL` | `http://127.0.0.1:1234/v1` |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` |
| `LLAMA_CPP_BASE_URL` | `http://127.0.0.1:8080` |
| `KIMI_CODE_OAUTH_HOST` → `KIMI_OAUTH_HOST` | OAuth 主机覆盖；默认为 `https://auth.kimi.com`. |
| `KIMI_CODE_BASE_URL` | Kimi 使用端点基本 URL。 |
| `SMITHERY_URL`, `SMITHERY_API_URL` | 锻造厂 web (`https://smithery.ai`) 和 API (`https://api.smithery.ai`) 基地。 |

## Shell执行

bash 工具在运行命令时如何包装用户的 shell。每个 `PI_*` 钥匙有旧版 `CLAUDE_*` 仍然有效的别名。

| 变量 | 行为 |
| --- | --- |
| `PI_BASH_NO_CI` | 抑制自动 `CI=true` 注入生成的Shell中。 |
| `PI_BASH_NO_LOGIN` | 删除登录 shell 模式 — shell args 变为 `['-c']` 而不是 `['-l','-c']`. |
| `PI_SHELL_PREFIX` | 可选的命令前缀包装器应用于每个 shell 调用。 |
| `CLAUDE_BASH_NO_CI`, `CLAUDE_BASH_NO_LOGIN`, `CLAUDE_CODE_SHELL_PREFIX` | 上述三个的旧别名。 |
| `PI_NO_PTY` | 禁用 bash 工具的 PTY 路径（也可以通过内部设置 `--no-pty`). |

## TUI 运行时

终端侧旋钮。大多数是自动检测的；仅当默认值行为不当时才设置这些。

| 变量 | 行为 |
| --- | --- |
| `PI_NOTIFICATIONS` | `off` / `0` / `false` 抑制桌面通知。 |
| `PI_FORCE_IMAGE_PROTOCOL` | 强制终端图像协议： `kitty`, `iterm2`/`iterm`, `sixel`, `none`. |
| `PI_ALLOW_SIXEL_PASSTHROUGH` | 允许 SIXEL 直通时 `PI_FORCE_IMAGE_PROTOCOL=sixel`. |
| `PI_HARDWARE_CURSOR` | 如果 `1`，启用硬件cursor模式。 |
| `PI_TUI_WRITE_LOG` | 将所有 TUI 写入记录到文件中。 |
| `PI_DEBUG_REDRAW` | 启用重绘调试日志记录。 |

## 提交管道

的 `/commit` 斜杠命令和底层提交代理遵循这些切换。主要在提交管道本身的开发过程中使用。

| 变量 | 行为 |
| --- | --- |
| `PI_COMMIT_TEST_FALLBACK` | 如果 `true`，强制启发式后备路径而不是询问代理。 |
| `PI_COMMIT_NO_FALLBACK` | 如果 `true`，当代理没有生成提案时，将提案留空（无后备）。 |
| `PI_COMMIT_MAP_REDUCE` | 如果 `false`，禁用大差异的映射减少分析路径。 |
| `DEBUG` | 如果设置，提交代理会在失败时打印其完整的错误堆栈。 |
