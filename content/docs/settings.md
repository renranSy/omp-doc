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

## 配置文件位置

持久化设置位于 `~/.omp/agent/config.yml`。可通过 `PI_CODING_AGENT_DIR` 改写 Agent 目录，或通过 `PI_CONFIG_DIR` 改写配置根目录。该文件是普通 YAML；未设置的键会使用内置默认值。

可通过以下三种方式修改：

- `/settings`：在会话内通过菜单修改，保存时会校验。
- `omp config <action>`：在 Shell 中脚本化修改，参阅 [CLI 参考](/docs/cli)。
- 文本编辑器：下次启动时重新读取；YAML 格式错误会导致 omp 记录警告并忽略整个文件，因此修改后应验证。

```sh
omp config list                            # the full tree
omp config get modelRoles.default          # one key
omp config set theme.dark catppuccin-macchiato
omp config reset theme.dark                # back to schema default
omp config path                            # print the agent config directory
```

## 优先级

优先级从高到低如下：

1.  CLI 标志（`--slow`, `--no-pty`, `--api-key`, …)
2.  环境变量（`PI_SLOW_MODEL`, `ANTHROPIC_API_KEY`, …)
3.  `~/.omp/agent/config.yml`
4.  内置默认值

通过 `/login` 保存的 OAuth 凭据存放在 `agent.db` 中。解析同一 Provider 的凭据时，数据库中的 Token 优先于环境变量。

## 顶级键

| 配置键 | 作用 |
| --- | --- |
| `theme` | 终端配色；`theme.dark` 和 `theme.light` 可指定内置或自定义主题。 |
| `modelRoles` | 角色到模型的映射（`default`、`smol`、`slow`、`plan`、`commit`）。参阅[模型角色](/docs/roles)。 |
| `steeringMode` | 转向消息的队列策略：`one-at-a-time`（默认）或 `all`。 |
| `followUpMode` | 后续消息的队列策略：`one-at-a-time`（默认）或 `all`。 |
| `interruptMode` | `immediate`（默认）会立即中断当前工具调用以处理转向；`wait` 会等待其返回。 |
| `tools.discoveryMode` | 控制磁盘上的工具是自动注册还是需显式允许。 |
| `debug.enabled` | 是否启用 `debug` 工具与 DAP 支持；默认关闭。 |
| `extensions` | 自动发现范围以外的显式扩展路径。 |
| `skills` | 分别启用或禁用各个 Skill。 |
| `images.autoResize` | 发送前自动缩小附件图片；默认开启。 |
| `searxng` | 自托管 Web 搜索端点的 `endpoint`、`token`、`basicUsername` 和 `basicPassword`。 |

上表是最常用的设置。`omp config list` 会输出当前版本支持的全部配置，包括 Provider 专用子树和 TUI 内部设置。

快捷键不在该文件中配置，而是单独保存在 `~/.omp/agent/keybindings.yaml`（旧版 `keybindings.json` 会自动迁移）。参阅[快捷键](/docs/keybindings#customize)。

## 常用旋钮

### 为每个角色选择默认模型

角色名称保持稳定，只需按当前可用的 Provider 目录分配具体模型 ID。`omp --list-models` 可列出当前可选择的模型。

```yaml
# ~/.omp/agent/config.yml
modelRoles:
  default: anthropic/claude-sonnet-4-5
  smol:    anthropic/claude-haiku-4-5
  slow:    anthropic/claude-opus-4-6:high
  plan:    openai/gpt-5.3-codex:high
  commit:  anthropic/claude-haiku-4-5
```

`commit` 角色用于 `/commit` 流程。提交信息质量不足时可换用能力更强的模型；在变更噪声较大的仓库中则可使用成本更低的模型。

### 调整消息队列

这三项决定智能体工作期间输入消息的处理方式；具体交互行为请参阅[使用 omp](/docs/using)。

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

> 格式错误的 `config.yml` 不会阻止启动：omp 会记录警告、忽略该文件并回退到内置默认值。手动编辑后请运行 `omp config list` 验证结果。
