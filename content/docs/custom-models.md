---
title: "自定义模型与 Provider"
description: "在 models.yml 中添加自定义模型与 Provider，配置端点、认证、模型字段、覆盖规则和本地模型发现。"
summary: "本页详解 omp 自定义模型配置格式，包括兼容 API、Provider 覆盖、OAuth、动态发现、规范模型映射和多个完整配置示例。"
keywords:
  - "omp 自定义模型"
  - "models.yml"
  - "自定义 Provider"
  - "本地模型"
  - "模型配置"
source: https://omp.sh/docs/custom-models
---

# 自定义模型与 Provider

## 它住在哪里

自定义Provider和模型进入 `~/.omp/agent/models.yml`。旧版 `models.json` 第一次加载时会迁移同一路径上的内容。参见 [设置](/docs/settings) 该文件如何关联 `config.yml`.

## 添加模型条目

一个 provider 块 `models:` list 声明完整的模型元数据。您列出的任何内容都会显示在 `/model` （见 [斜杠命令](/docs/slash)）并且可用于 [模范角色](/docs/roles).

```yaml
# ~/.omp/agent/models.yml
providers:
  myco:
    baseUrl: https://llm.internal.myco.dev/v1
    apiKey: MYCO_API_KEY
    api: openai-responses
    auth: apiKey
    models:
      - id: myco-large
        name: MyCo Large
        reasoning: true
        input: [text, image]
        contextWindow: 200000
        maxTokens: 32000
        cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }
```

`apiKey:` 首先作为环境变量名称进行检查，然后将其视为文字标记。有了这个块并且 `MYCO_API_KEY` 导出（参见 [Environment variables](/docs/env)），模型显示为 `myco/myco-large` 在选择器中。

### 模型字段

`id`

上游模型 ID。用于有线请求。

`name`

在选择器中显示标签。

`reasoning`

`true` 如果模型接受思维水平。启用 `:level` 后缀和 Shift+Tab 骑自行车。

`input`

方式 — 任何一种 `text`, `image`.

`contextWindow` / `maxTokens`

Token。用于实时上下文预算。

`cost`

每百万Token的利率。出现在 `/usage`.

`contextPromotionTarget`

可选。当Turn超过 `contextWindow`, omp 在任何之前交换到此模型 ID 后备链运行。

## 覆盖内置 provider

没有的 provider 条目 `models:` list 是仅覆盖的 — 对于在代理处重新指向内置 provider 或修补一个模型的元数据而不重新声明目录非常有用。

```yaml
providers:
  anthropic:
    baseUrl: https://gateway.internal/anthropic
    headers:
      X-Org-Id: myco
    modelOverrides:
      claude-sonnet-4-6:
        contextPromotionTarget: anthropic/claude-opus-4-6
    disableStrictTools: true
```

`baseUrl` / `headers`

将 provider 指向代理或网关。

`compat`

调整 OpenAI 兼容方言 (`thinkingFormat`, `reasoningContentField`, 工具 ID 形状）。

`disableStrictTools: true`

一些拒绝严格工具架构字段的第三方 Anthropic 兼容端点需要。

`modelOverrides`

每个模型的补丁 `contextWindow`, `maxTokens`, `cost`, `contextPromotionTarget`.

`discovery`

内置 provider 上的实时模型列表。类型： `ollama`, `llama.cpp`, `lm-studio`, `openai-models-list`, `proxy`.

## 实现自定义 provider

provider 块声明有线传输、身份验证方案以及（可选）在何处发现模型。

### 运输（`api:`)

-   `openai-completions` — 经典的聊天完成。
-   `openai-responses` — 响应 API。
-   `openai-codex-responses` — 法典变体。
-   `azure-openai-responses` — Azure 托管的响应。
-   `anthropic-messages` — Anthropic 消息 API。
-   `google-generative-ai` — Gemini 公共 API。
-   `google-vertex` — Gemini 通过 Vertex。

### 身份验证方案（`auth:`)

`apiKey`

读取自 `apiKey:`，分辨率顺序为 [Provider](/docs/providers), 和 `--api-key`。云端点的默认值。

`none`

未发送任何凭证。 llama.cpp、Ollama、LM Studio 等本地服务器运行时的正确选择 未经身份验证。

`oauth`

omp 驱动浏览器或设备代码流 `/login <provider>` （见 [斜杠命令](/docs/slash)）并将可刷新令牌存储在 `agent.db`。每次调用之前都会刷新令牌。要连接 OAuth，provider 需要 已注册的客户端 ID 和授权端点 - 今天，这是为内置保留的 Provider并选择网关集成。

### 发现（`discovery:`)

当上游公开模型端点时，声明一次并删除 `models:` 清单：

```yaml
providers:
  llama.cpp:
    baseUrl: http://127.0.0.1:8080
    api: openai-responses
    auth: none
    discovery:
      type: llama.cpp
```

Discovery 在启动时命中端点并缓存结果。如果服务器在启动时离线，omp 会回退到当前状态 `models.yml`。支持的类型： `ollama`, `llama.cpp`, `lm-studio`, `openai-models-list`, `proxy`.

## 等价和平局打破

规范 ID (`claude-sonnet-4-6`, `gpt-5.3-codex`）对相同底层模型的网关和Fork进行分组。将您的自定义 provider 映射到规范组，以便单个角色分配可以路由到您拥有凭据的任何 provider：

```yaml
equivalence:
  overrides:
    myco/myco-large: claude-sonnet-4-6

modelProviderOrder:
  - anthropic
  - myco
```

`modelProviderOrder` 在 `config.yml` 当多个Provider提供相同的规范 ID 时，打破平局 — 最早进入者获胜；未经身份验证的Provider将被跳过。
