---
title: "记忆"
description: "配置 omp 的跨会话记忆，比较本地记忆与 Hindsight 后端，并使用 retain、recall、reflect 管理长期知识。"
summary: "本页区分长期记忆与上下文压缩，介绍本地后端和 Hindsight 的作用域、自动召回、写入工具、配置选项及故障处理方式。"
keywords:
  - "omp 记忆"
  - "Hindsight"
  - "长期记忆"
  - "retain"
  - "recall"
source: https://omp.sh/docs/memory
---

# 记忆

记忆是持久的：过去会话中的事实和惯例会反馈到新的会话中。它毗邻但又分开 [上下文压缩](/docs/compaction)，它将单个会话保留在上下文窗口内。

## 每次开火时

| 机制 | 适用范围 | 什么触发它 | 模型看到了什么 |
| --- | --- | --- | --- |
| **上下文压缩** | 单个会话 | Turn溢出、Turn后阈值维护或手动 `/compact` | 摘要条目代替旧的Turn，加上最近的尾部逐字记录 |
| **本地内存** | 一个项目（cwd） | 启动，或 `/memory enqueue` | 静态 *记忆指导* 阻止系统提示符，从本机上过去的会话中提取 |
| **Hindsight** | 全局、每个项目或标记（请参阅 `hindsight.scoping`) | 首轮自动召回加按需 `retain` / `recall` / `reflect` 工具调用 | 代理可以写入和查询的不断增长的远程事实库 |

## 上下文压缩

压缩是正交的会话中机制：当窗口填满时，它会汇总活动分支上的旧消息，使磁盘上的文件保持不变。参见 [上下文压缩](/docs/compaction) 对于触发器来说， `/compact` 命令、非压缩重试路径以及 `compaction.*` 设置。

## 内存后端

后端是通过选择的 `memory.backend`:

| 价值 | 效果 |
| --- | --- |
| `off` （默认） | 没有提取任何东西，也没有注入任何东西。 |
| `local` | 本地管道；在启动时注入静态引导块。 |
| `hindsight` | 远程事后银行；代理读写 `retain` / `recall` / `reflect`. |
| `mnemopi` | 本地 SQLite 银行存储在您的计算机上；表面相同 `retain` / `recall` / `reflect` 工具加上首轮自动召回，以及可选的嵌入。 |

### 本地后端

当前项目的过去会话被汇总到一个紧凑的内存文档中，并作为一个提示注入到系统提示符中 *记忆指导* 在会话开始时阻塞。该块是启发式上下文，代理被告知在行动之前验证当前的回购状态。每个项目（工作目录）的内存是隔离的，并存储在 `~/.omp/agent/memories/`.

从 TUI 管理本地内存：

| 命令 | 它的作用 |
| --- | --- |
| `/memory view` | 显示当前注入有效负载。 |
| `/memory clear` （别名 `/memory reset`) | 删除该项目的所有内存数据和生成的工件。 |
| `/memory enqueue` （别名 `/memory rebuild`) | 强制整合在下次启动时运行。 |

代理还可以根据需要通过阅读更深入的上下文 `memory://` 网址带有 `read` 工具：

```sh
# Show the static guidance block injected into the system prompt
omp -p 'read memory://root'

# Show the full long-term memory document for this project
omp -p 'read memory://root/MEMORY.md'

# Show a generated skill playbook
omp -p 'read memory://root/skills/<name>/SKILL.md'
```

### Hindsight后端

选择加入远程后端支持 [Hindsight](https://hindsight.vectorize.io) （云或自托管）。 Hindsight 向代理提供了三种工具，而不是静态注入摘要： `retain` 存储一个持久的事实， `recall` 搜索之前的记忆，并且 `reflect` 综合许多记忆的答案。在每个会话的第一回合，都会针对配置的库触发自动调用，以便在模型说话之前先了解先前的上下文。

每个会话都有一个银行别名；子代理重复使用母公司的银行，因此保留和召回集中在同一个地方。 `hindsight.scoping` 选择银行的分区方式：

| 价值 | 布局 |
| --- | --- |
| `global` | 每个项目都有一个共享银行。 |
| `per-project` | 每个工作目录都有单独的银行。 |
| `per-project-tagged` （默认） | 与 1 家共享银行 `project:<cwd>` 标签，以便全局和每个项目的记忆在调用时合并。 |

对于两种项目级作用域，omp 都以同一规则生成项目名称：先找到仓库的主检出根目录（因此同一仓库的所有 linked worktree 会归到一起），再取其目录名并转换为小写。例如，检出目录为 `~/code/General` 时会使用 `project:general`。Hindsight 的标签区分大小写；这一步可避免同一仓库因路径大小写不同而被拆分为彼此不可见的记忆范围。

### 设置Hindsight

四 `hindsight.*` 键入 `~/.omp/agent/config.yml` 足以连接：

```yaml
# Public Hindsight Cloud
memory:
  backend: hindsight
hindsight:
  apiUrl: https://api.hindsight.vectorize.io
  apiToken: hs_live_REPLACE_ME
  bankId: my-team-bank          # optional; defaults to a bank derived from `omp`
  scoping: per-project-tagged   # global | per-project | per-project-tagged
```

```yaml
# Self-hosted (default apiUrl is http://localhost:8888)
memory:
  backend: hindsight
hindsight:
  apiUrl: http://hindsight.internal:8888
  apiToken: REPLACE_ME
  bankId: null                  # per-project bucket allocated on first use
  scoping: per-project
```

> 使用 `per-project-tagged` 当您希望全局事实和项目范围的事实存在于同一个银行中并在调用时合并时。切换到 `per-project` 当项目不能看到彼此的记忆（例如，客户在保密协议下工作）并接受回忆将不再涉及跨领域偏好时。储备 `global` 适用于单个开发人员设置一个心理项目。

### 心理模型

长期运行的策划摘要（用户偏好、项目约定、架构决策）每个银行播种一次，并在合并后刷新。将活动集拼接到系统提示符中作为 `<mental_models>` 块。从 TUI 管理它们 `/memory mm`:

| 子命令 | 它的作用 |
| --- | --- |
| `list` | 列出活跃银行中的心理模型。 |
| `show <id>` | 打印一个模型的文本。 |
| `refresh [id]` | 从当前记忆重新合成。没有 `id`，仅刷新选择自动刷新的模型；与 `id`，按需刷新任何模型。 |
| `history <id>` | 以行差异形式查看修订历史记录。 |
| `seed` | 创建该银行缺少的任何内置心理模型。 |
| `delete <id>` | 从银行中删除心理模型。 |
| `reload` | 重新拉取缓存 `<mental_models>` 阻止进入系统提示符。 |

> 当地的 `/memory view|clear|enqueue` 命令仍然适用于 Hindsight 后端——它们管理项目的本地工件，而不是远程库。 `/memory mm` 仅限 TUI；在ACP /无头模式下使用Hindsight HTTP API直接维护模型。

## 隐私和存储

**会话记录保存在哪里？** 下 `~/.omp/agent/sessions/<encoded-cwd>/`，每个会话一个 JSONL 文件。默认情况下仅限本地；除非你跑，否则什么都不会离开机器 `/share`, `/export` 到网络路径，或启动 `--mode rpc` 将会话事件通过管道输出到 ACP 客户端。

**记忆住在哪里？** 随着 `local` 后端，下 `~/.omp/agent/memories/<encoded-cwd>/MEMORY.md`，以及代理目录中的 SQLite 作业/状态数据库。随着 `hindsight` 后端，持久存储就是你指向的外部银行 `hindsight.apiUrl` at — 自托管或 Hindsight Cloud — 并且只有本地 config 和别名银行 ID 位于您的计算机上。

**哪些内容会上传到 Hindsight？** 显式的 `retain` 有效载荷， `recall` / `reflect` 查询，并且 - 与 `hindsight.autoRetain` on（默认）- 会话的用户和助理文本轮次的记录，每隔几轮保留一次。保留的转录本丢弃工具调用、工具结果和思维块，并条带注入 `<memories>` / `<mental_models>` 块，因此策划的内存永远不会作为对话噪音重新输入银行。禁用 `hindsight.autoRetain` 如果只是明确的 `retain` 呼叫应该离开机器。

> 随时审核 `omp -p 'read memory://root'` 对于注入的有效负载和 `omp -p 'read memory://root/MEMORY.md'` 为长期文件。

## 食谱

### 重大重构后重建本地内存

您重命名了一半的模块，“内存指导”块现在充满了过时的文件路径。擦除项目的内存并加入新的合并队列：

```text
/memory clear
/memory enqueue
```

### 在新的事后银行中播种心智模型

```text
/memory mm seed
/memory mm list
```

模型从空开始并填充为 `retain` 呼叫源源不断地涌入。一旦您在银行中有一些真正的保留，请强制提前刷新 `/memory mm refresh project-conventions`.

### 从本地切换到Hindsight而不丢失上下文

1.  `/memory clear` — 否则本地 *记忆指导* 作为静态系统提示块与新的后见之明工具一起存在。
2.  套装 `memory.backend: hindsight` 加上四个 `hindsight.*` 键入 [`~/.omp/agent/config.yml`](/docs/settings).
3.  重新启动代理。自动召回在第一回合针对新（空）银行时触发；随后的 `retain` 电话从实际工作中填充它。
4.  可选： `/memory mm seed` 将内置的心理模型脚手架扔进银行。

参见 [会话](/docs/sessions) 对于简历和分支机制， [斜杠命令](/docs/slash) 完整的命令清单，以及 [CLI 参考](/docs/cli) 对于无头Flag。
