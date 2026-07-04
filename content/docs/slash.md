---
title: "斜杠命令"
description: "按类别查询 omp 的斜杠命令，覆盖会话、模型、计划、认证、扩展、工具和界面控制等常用操作。"
summary: "本页汇总 omp 会话内可用的斜杠命令，并解释命令补全、参数输入以及 `/plan`、`/model`、`/login`、`/agents` 等入口的用途。"
keywords:
  - "omp 斜杠命令"
  - "slash command"
  - "会话命令"
  - "模型切换"
  - "CLI"
source: https://omp.sh/docs/slash
---

# 斜杠命令

## 他们如何工作

类型 `/` 打开完成菜单。安装的 skills 显示为 `/skill:<name>` 和 [自定义命令模板](/docs/prompt-templates) 在自己的下扩展 `/<template>` 名字。驱动编辑器的按键位于 [快捷键](/docs/keybindings) 页。

## 您实际使用的前 10 名

-   `/plan` — 切换 计划模式；代理在执行之前起草。参见 [计划模式](/docs/plan).
-   `/model` — 打开模型选择器；选择一个角色和 provider。
-   `/compact` — 手动总结旧的上下文；传递一个焦点。
-   `/tree` — 就地会话导航器；跳转到任何先前的消息。
-   `/branch` — 从同一文件中的上一条消息开始一个新线程。
-   `/extensions` — skills、hooks、custom tools、MCP 插件的扩展控制中心。
-   `/agents` — 代理控制中心；生成、观察和引导子代理。
-   `/login` — OAuth 变为 provider； `/logout` 撤销。
-   `/share` — 渲染会话并上传（自定义处理程序，然后 gist 回退）。
-   `/handoff` — 写一个结构化的总结并结束回合。

## 会话

| 命令 | 描述 |
| --- | --- |
| `/session [info|delete]` | 显示会话信息或删除当前会话 |
| `/resume` | 打开会话选择器 |
| `/new` | 开始新会话 |
| `/drop` | 删除当前会话并开始新会话 |
| `/rename <title>` | 重命名当前会话 |
| `/move <path>` | 将会话移动到不同的工作目录 |
| `/tree` | 导航 session tree（切换分支） |
| `/branch` | 从上一条消息分支（同一文件，新叶） |
| `/fork` | 将上一条消息Fork到新文件中 |
| `/compact [focus]` | 手动压缩会话上下文 |
| `/handoff [focus]` | 写一个结构化的总结条目并结束回合 |
| `/btw <question>` | 使用当前上下文的临时附带问题 |
| `/retry` | 重试上次失败的代理轮次 |
| `/export [path]` | 将会话导出为 HTML |
| `/dump` | 将会话记录复制到剪贴板 |
| `/share` | 将会话上传为秘密 GitHub 要点（或自定义处理程序） |
| `/copy [last|code|all|cmd]` | 复制最后的代理消息/代码块/最后的 bash 或 python 命令 |
| `/goal <subcommand>` | 持续自主目标（`set`, `show`, `pause`, `resume`, `drop`, `budget`) |
| `/todo <subcommand>` | 查看/编辑待办事项列表（`edit`, `copy`, `export`, `import`, `append`, `start`, `done`, `drop`, `rm`) |

## 模型

| 命令 | 描述 |
| --- | --- |
| `/model` (`/models`) | 打开模型选择器 |
| `/fast [on|off|status]` | 切换 OpenAI 服务层快速模式 |
| `/loop [count|duration]` | 切换循环模式（每次屈服后重新提交下一个提示） |
| `/force <tool> [prompt]` | 强制下一回合使用特定工具 |
| `/browser [headless|visible]` | 切换浏览器无头/可见模式 |

## 计划

| 命令 | 描述 |
| --- | --- |
| `/plan [prompt]` | 切换计划模式；将下一个提示路由给计划者 |

计划模式 是针对专用的侧通道转向 `plan`\-榜样。流程、退出时的批准选择以及何时获得回报 [计划模式](/docs/plan) 页。

## 扩展

| 命令 | 描述 |
| --- | --- |
| `/mcp <subcommand>` | 管理 MCP 服务器（`add`, `list`, `remove`, `test`, `reauth`, `unauth`, `enable`, `disable`, `smithery-search`, `smithery-login`, `smithery-logout`, `reconnect`, `reload`, `resources`, `prompts`, `notifications`) |
| `/ssh <subcommand>` | 管理 SSH 主机（`add`, `list`, `remove`) |
| `/memory <subcommand>` | 检查、清除或重建内存（`view`, `clear`/`reset`, `enqueue`/`rebuild`, `mm list|show|refresh|history|seed|delete|reload`) |
| `/marketplace <subcommand>` | 管理 marketplace 源和插件（`add`, `remove`, `update`, `list`, `discover`, `install`, `uninstall`, `installed`, `upgrade`) |
| `/plugins [list|enable|disable]` | 查看和管理已安装的插件（npm + marketplace） |
| `/reload-plugins` | 重新加载 skills、命令、hooks、工具、代理和 MCP |

创作生活于 [插件](/docs/plugins) 页。

## 信息

| 命令 | 描述 |
| --- | --- |
| `/usage` | Provider 使用和速率限制空间 |
| `/context` | 当前回合的Token预算明细 |
| `/jobs` | 异步后台作业状态 |
| `/tools` | 代理当前可见的工具 |
| `/extensions` (`/status`) | 打开扩展控制中心仪表板 |
| `/agents` | 打开代理控制中心仪表板 |
| `/debug` | 打开调试工具选择器 |
| `/changelog [full]` | 显示变更日志条目 |
| `/hotkeys` | 显示实时键盘快捷键列表 |

经验法则： `/usage` 回答“我可以继续工作吗？”； `/context` 回答“下一个回合适合吗？”。

## 杂项

| 命令 | 描述 |
| --- | --- |
| `/settings` | 打开设置菜单 |
| `/login` / `/logout` | OAuth 登录/撤销 |
| `/exit` (`/quit`) | 退出交互模式 |

## 食谱

### `/force <tool> [prompt]`

将下一回合固定到特定工具。当模型不断达到目标时很有用 `edit` 在尚不存在或拒绝调用的文件上 `write` 在新的脚手架上：

```sh
/force write Create src/config.ts with the default settings
```

范围正好是一圈。该回合返回后，工具选择将被解除。刚刚通过 `/force write` 没有提示固定您发送的下一条消息。

### `/btw <question>`

问一个短暂的附带问题，但不要污染成绩单。该模型看到当前上下文，但交换没有持久化，因此它不会显示在 `/tree` 并且不是记忆巩固的一部分。

```sh
/btw what does the regex on line 47 actually match?
```

### `/loop` — 迭代直至完成或超出预算

切换循环模式和每次产量后重新提交的下一个提示。裸整数限制迭代；一个 `10m` / `2h` / `30s` 形式设置了一个挂钟。 `Esc` 取消当前迭代；跑步 `/loop` 再次禁用它。

```sh
/loop 10
run the auth tests and fix the first failure you see

/loop 20m
clear the typecheck backlog in packages/coding-agent
```

受理单位： `s`, `m`, `min`, `h`, `hr`，以及它们的复数。混合（例如 `/loop 10 5m`）被拒绝。

### `/retry` 上下文溢出后

当上一轮出错时（provider 429、上下文长度溢出、瞬时套接字重置）， `/retry` 重新提交相同的用户输入。如果压缩已经运行（手动 `/compact` 或自动），重试使用压缩上下文，这通常是解除溢出阻塞的原因。 `/retry` 仅在失败的回合中起作用；已完成的Turn但答案错误，需要转向信息或 `/branch` 相反。

## 自定义斜杠命令

下的任何 Markdown 文件 `~/.omp/agent/commands/<name>.md` （用户）或 `<cwd>/.omp/commands/<name>.md` （项目）变成 `/<name>` 并作为提示展开。 Skills 暴露为 `/skill:<name>`。创作详细信息、发现顺序和 TypeScript 处理程序 API 位于 [提示词模板](/docs/prompt-templates) 页。

```md
---
description: Code-review a file or diff
---
Review the following for correctness, edge cases, and style:

$@
```

调用为 `/review src/auth.ts`，身体被渲染为 `$@` 替换为 args。位置形式（`$1`, `$2`, `$@[1:2]`）和 `$ARGUMENTS` 也得到支持。
