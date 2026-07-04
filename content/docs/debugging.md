---
title: "调试"
description: "使用 omp 的 DAP 调试工具启动或附加进程，设置断点、单步执行、读取变量并计算表达式。"
summary: "本页说明何时使用运行时调试、如何启用 debug 工具、选择适配器，并通过 DAP Action 完成断点、线程、栈帧和变量检查。"
keywords:
  - "omp 调试"
  - "DAP"
  - "断点调试"
  - "debug adapter"
  - "变量检查"
source: https://omp.sh/docs/debugging
---

# 调试

## 何时伸手去拿它

使用 `debug` 当阅读代码还不够并且您需要来自正在运行的进程的状态时：这个变量在三次迭代后是什么样子，哪个线程卡在哪个互斥体上，为什么这个分支在一个输入下触发而不是另一个输入。对于有关代码本身的静态问题，更喜欢 [代码智能](/docs/code-intelligence).

## debug.enabled 门

的 `debug` 工具被门控在后面 `debug.enabled` 设置，即 **默认开启**。将其关闭 `~/.omp/agent/config.yml` 当你不想运行生成调试器时：

```yaml
# ~/.omp/agent/config.yml
debug:
  enabled: false
```

请参阅 [设置](/docs/settings) 完整的 config 布局页面。

## 适配器

omp 自动发现 PATH 上的 DAP 适配器，并从目标的文件扩展名和工作区标记中选择一个适配器（`Cargo.toml`, `go.mod`, `pyproject.toml`, `package.json`，……）。覆盖为 `adapter` 当安装通用后端和专用后端时。

| 语言 | 适配器 | 注释 |
| --- | --- | --- |
| C、C++、Rust、Swift、Zig、Objective-C | `lldb-dap` | 附带 macOS Xcode CLT；无需在 Apple 芯片上进行额外安装即可使用。 |
| 去 | `dlv` | 深入研究套接字传输。 `go install github.com/go-delve/delve/cmd/dlv@latest`. |
| Python | `debugpy` | 安装与 `pip install debugpy` 在你正在调试的解释器中。 |
| JavaScript / TypeScript（节点） | `vscode-js-debug` (`js-debug-adapter`) | 与 VS Code 捆绑在一起；可独立通过 `npm i -g js-debug-adapter`. |

默认表中的其他适配器涵盖 .NET (`netcoredbg`)、科特林、红宝石 (`rdbg`)、PHP (Xdebug)、Bash、Dart/Flutter 和 Elixir。安装适合您的语言的版本；当适配器不在 PATH 上时，该工具会报告明显的错误。

## 行动

| 奥普 | 使用 |
| --- | --- |
| **生命周期** |
| `launch` | 
在适配器下启动一个新进程（`program`, `args`, `cwd` ).

 |
| `attach` | 

附加到正在运行的 `pid`，或远程 `host`+`port`.

 |
| `terminate` | 结束活动会话并清理。 |
| `sessions` | 列出跟踪的会话以及适配器、状态和停止位置。 |
| **断点** |
| `set_breakpoint` | 

在 `file`+`line` 或 `function`;可选的 `condition` / `hit_condition`.

 |
| `remove_breakpoint` | 删除源断点。 |
| `set_data_breakpoint` | 

已解析变量上的观察点 (`read`/`write`/`readWrite`).

 |
| `set_instruction_breakpoint` | 

地址级断点位于 `instruction_reference`.

 |
| **执行** |
| `continue` | 恢复停止的线程。 |
| `step_over` | 第一步源代码行，跳过调用。 |
| `step_in` | 进入下一个通话。 |
| `step_out` | 跑到呼叫者的返回处。 |
| `pause` | 中断正在运行的目标。 |
| **检查** |
| `threads` | 适配器已知的每个线程。 |
| `stack_trace` | 

已停止线程的框架，边界为 `levels`.

 |
| `scopes` | 

局部变量、参数、寄存器 `frame_id`.

 |
| `variables` | 

展开一个 `scope_id` 或 `variable_ref`.

 |
| `evaluate` | 

运行 `expression` 在一个框架中； `context` 选择 `watch` / `repl` / `hover`.

 |
| `output` | 从目标中排出缓冲的 stdout/stderr。 |

内存和反汇编操作（`read_memory`, `write_memory`, `disassemble`）和一个 `custom_request` 当适配器支持时，应急出口可用。

## 工作示例：在三次迭代后捕获一个值

Python 循环 `etl/transform.py` 仅在第三遍时产生错误的总数。设置一个条件断点，让它跳闸，然后在继续之前检查局部变量。

```text
# 1. Launch the script under debugpy.
debug action=launch adapter=debugpy program=etl/transform.py

# 2. Break inside the loop the third time through.
debug action=set_breakpoint file=etl/transform.py line=58 condition="i == 3"
debug action=continue

# 3. When it stops, read the frame.
debug action=stack_trace levels=5
debug action=scopes frame_id=0
debug action=variables scope_id=<locals_ref_from_scopes>

# 4. Ask the running interpreter a question.
debug action=evaluate frame_id=0 expression="sum(running_totals)" context=repl

# 5. Done.
debug action=continue
debug action=terminate
```

的 `repl`\- 上下文 `evaluate` 是 DAP 表面不直接公开的原始调试器命令的逃生口。每个代理一个活动的调试会话 — 调用 `terminate` 再次启动或附加之前。
