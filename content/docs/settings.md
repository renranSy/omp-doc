---
title: "设置"
description: "了解 ~/.omp/agent/config.yml 的结构、配置优先级、常用设置项，以及模型角色和交互行为的配置方法。"
summary: "本页说明 omp 配置文件的位置与加载优先级，列出顶级设置和常用选项，并给出模型角色、工具发现、消息队列及项目范围配置示例。"
keywords:
  - "omp 配置"
  - "config.yml"
  - "设置项"
  - "模型角色"
  - "配置优先级"
source: https://omp.sh/docs/settings
---

# 设置

## 它住在哪里

持久设置位于 `~/.omp/agent/config.yml` （使用覆盖父目录 `PI_CODING_AGENT_DIR` 或将 config 根重命名为 `PI_CONFIG_DIR`）。该文件是一个普通的 YAML 树；缺少的键会归入内置默认值。

通过三种方式编辑：

-   `/settings` 在会话内 - 菜单驱动，在保存时验证。
-   `omp config <action>` 从 shell — 脚本化编辑，请参阅 [CLI 参考](/docs/cli).
-   您的文本编辑器 - 下次启动时重新阅读；格式错误的 YAML 会使 omp 记录警告并忽略整个文件，因此请在编辑后进行验证。

```sh
omp config list                            # the full tree
omp config get modelRoles.default          # one key
omp config set theme.dark catppuccin-macchiato
omp config reset theme.dark                # back to schema default
omp config path                            # print the agent config directory
```

## 优先级

从最高优先级到最低优先级：

1.  CLI 标志（`--slow`, `--no-pty`, `--api-key`, …)
2.  环境变量（`PI_SLOW_MODEL`, `ANTHROPIC_API_KEY`, …)
3.  `~/.omp/agent/config.yml`
4.  内置默认值

OAuth 保存的凭据 `/login` 住在 `agent.db` 旁边 `config.yml` 并遵循相同的查找顺序：token-in-db 胜过相同 provider 的环境变量。

## 顶级键

| 钥匙 | 它控制什么 |
| --- | --- |
| `theme` | 终端调色板。 `theme.dark` / `theme.light` 命名内置或用户调色板。 |
| `modelRoles` | 角色→模型图（`default`, `smol`, `slow`, `plan`, `commit`）。参见 [模型角色](/docs/roles). |
| `steeringMode` | 排队的转向消息如何耗尽： `one-at-a-time` （默认）或 `all`. |
| `followUpMode` | Turn后排队的后续行动如何消耗： `one-at-a-time` （默认）或 `all`. |
| `interruptMode` | `immediate` （默认）缩短飞行中工具调用以进行转向； `wait` 推迟直到它返回。 |
| `tools.discoveryMode` | 磁盘工具是否自动注册或需要显式允许列表。 |
| `debug.enabled` | 表面 `debug` 工具和 DAP 支持的流程。默认关闭。 |
| `extensions` | 超出自动发现范围的显式扩展路径。 |
| `skills` | 每个 skill 启用/禁用地图。 |
| `images.autoResize` | 发送前自动缩小附加图像。默认开启。 |
| `searxng` | 自托管 web-搜索端点： `endpoint`, `token`, `basicUsername`, `basicPassword`. |

列出的按键是用户最常触摸的按键； `omp config list` 打印模式知道的所有内容，包括 provider 特定的子树和 TUI 内部结构。

快捷键重新映射不存在于此 - 它们单独存储在 `~/.omp/agent/keybindings.yaml` （旧版 `keybindings.json` 会自动迁移）。参见 [快捷键](/docs/keybindings#customize).

## 常用旋钮

### 为每个角色选择默认模型

角色名称稳定；根据活动的 provider 目录分配具体模型 ID。 `omp --list-models` 转储每个角色现在可以解决的问题。

```yaml
# ~/.omp/agent/config.yml
modelRoles:
  default: anthropic/claude-sonnet-4-5
  smol:    anthropic/claude-haiku-4-5
  slow:    anthropic/claude-opus-4-6:high
  plan:    openai/gpt-5.3-codex:high
  commit:  anthropic/claude-haiku-4-5
```

的 `commit` 角色驱动 `/commit` 管道；当提交消息发生漂移时，将其调整为更强大的模型，而对于嘈杂的存储库，将其调整为更便宜的模型。

### 调整消息队列

当您在代理工作时键入时会发生什么：请参阅 [使用omp](/docs/using) 对于工作时间表。

```yaml
steeringMode:  one-at-a-time   # or: all
followUpMode:  one-at-a-time   # or: all
interruptMode: immediate       # or: wait
```

### 打开调试工具

DAP 集成和 `debug` 工具表面在一起。默认情况下关闭，以便工具选项板保持焦点。

```yaml
debug:
  enabled: true
```

### 选择一个主题

```yaml
theme:
  dark:  catppuccin-macchiato
  light: solarized-light
```

## 安全编辑

> 畸形的 `config.yml` 不阻止启动 - omp 记录警告并回退到内置默认值，默默地忽略整个文件。始终验证 `omp config list` 手动编辑后。
