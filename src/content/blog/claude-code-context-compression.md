---
title: "深度解析 Claude Code 的上下文压缩机制"
description: "从微压缩、Session Memory、Full Compact 到 Snip，解析 Claude Code 如何在信息保留、成本与延迟之间做工程权衡。"
publishedAt: 2026-03-31
tags:
  - "AI"
  - "源码分析"
  - "上下文工程"
  - "Claude Code"
featured: false
draft: false
slug: claude-code-context-compression
---
> Claude Code 如何在有限的上下文窗口里，用四层递进策略平衡信息保留、成本和延迟。

## 编者注：三个意外发现 {#editor-note}

1.  **Anthropic 在帮用户省钱。** 后台异步笔记系统记录对话要点，压缩时直接读笔记、不调 LLM，省掉了最贵的那次 API 调用。子代理还共享主对话的 prompt cache，input token 只付一折。
2.  **不带参数的 `/compact` 可能根本没走 Full Compact。** 如果笔记文件存在且非空，它大概率走 Session Memory 路径——毫秒级完成、零额外 API 费用。只有带自定义指令（如 `/compact 侧重错误日志`）时才会真正调 LLM。
3.  **能不 `/clear` 就别 `/clear`。** `/compact` 是压缩行李继续旅行，完整对话历史保留在本地；`/clear` 是扔掉所有行李重新出发，AI 再也找不回之前的上下文。

* * *

## 为什么需要上下文压缩 {#why}

大语言模型有上下文窗口的物理限制。即使有 200K token，一个复杂编程会话（读文件、执行命令、反复修改代码）也很容易触及上限。达到上限后，要么中止对话，要么将旧内容释放出去。

Claude Code 选择了后者，设计了一套**四层递进的压缩体系**，从"零信息损失"到"受控信息降级"层层递进。

### 一个具体的场景 {#scenario}

为了让后续的机制不那么抽象，我们跟着一个真实的使用场景走完全程：

**小杨**正在用 Claude Code 重构一个 Express 项目。他已经连续工作了 2 小时，期间让 AI 读了十几个文件、跑了几十次 grep 搜索、改了七八个模块。此时上下文已经积累到了 **160K token**（200K 窗口的 80%），而他还需要继续改下去。

接下来会发生什么？

* * *

## 整体架构：四层压缩梯队 {#architecture}

```
上下文快满了？
  │
  ├─ 第1层：微压缩（MicroCompact）—— 只动工具结果，对话内容不碰
  │
  ├─ 第2层：会话记忆压缩（Session Memory Compact）—— 用预先积累的笔记替换旧消息
  │
  ├─ 第3层：全量压缩（Full Compact）—— 调 LLM 生成完整摘要
  │
  └─ 第4层：Snip（剪断）—— 物理删除最老的消息
```

每一层只在上一层无法完成压缩目标时才触发。

### 什么时候算"快满了" {#threshold}

```
有效上下文窗口 = 模型上下文窗口 - 摘要输出预留(20K)
自动压缩阈值 = 有效上下文窗口 - 缓冲区(13K)

例：200K 的模型
  有效窗口 = 200K - 20K = 180K
  触发阈值 = 180K - 13K = 167K
  → 当 token 使用量 ≥ 167K 时触发自动压缩
```

回到小杨的场景：他的上下文已经 160K，还没到 167K 的阈值。但他接下来又让 AI 读了两个大文件（各 5K），token 飙到 170K——**触发了自动压缩**。

还有一个保险机制——**熔断器**：连续 3 次压缩失败就停止尝试，避免无限重试。这个设计来自真实线上数据——曾有用户单个会话连续失败 3272 次，每天全球浪费约 25 万次 API 调用。

小杨的 170K 请求进来后，系统首先尝试的是第 1 层——微压缩。

* * *

## 第1层：微压缩（MicroCompact） {#layer1}

微压缩的核心思路：**工具执行结果是上下文中体积最大、价值衰减最快的内容。** 对话推进越远，早期的工具结果就越没有意义——但它们仍占着宝贵的 token 空间。微压缩专门处理这类内容。

小杨两小时前 grep 出来的 5000 行搜索结果，对话早已远远推进，那些结果早就没用了——但它们还占着上下文空间。微压缩要做的，就是把这些"过期的大块头"清掉。

### 路径A：缓存已冷 → 直接清空旧工具结果 {#layer1-path-a}

当距离上次 AI 回复超过 N 分钟时，服务器端的 prompt cache 已过期。既然缓存冷了，直接把旧的工具执行结果替换为 `[Old tool result content cleared]`，但**保留最近 N 个**（通过配置控制），只清较老的。

### 路径B：缓存还热 → 通过 cache\_edits "隔空删除" {#layer1-path-b}

如果缓存未过期，修改本地消息内容会导致缓存前缀变化、缓存失效。Claude Code 的做法是：**本地消息一个字都不改**，在 API 请求中附带 `cache_edits` 指令，告诉服务器"缓存里那段工具结果，帮我删掉"。服务器执行删除，但缓存前缀没变，其他部分继续命中。

类比：在图书馆借了一本书想遮掉中间几页，不撕掉再还（会被当成新书重新登记），而是告诉管理员"帮我把第 50-60 页遮住"——书还是那本书，借阅记录不用重建。

小杨的情况：他一直在连续工作，缓存还热着，所以走的是路径 B——cache\_edits 隔空删除了早期那些 grep 和 cat 的结果。

### 微压缩的限制 {#layer1-limits}

只处理**9 种特定工具**的结果（FileRead、Bash、PowerShell、Grep、Glob、WebSearch、WebFetch、FileEdit、FileWrite），不动对话文本、AI 推理过程、用户消息。如果上下文主要被大量来回对话填满，微压缩帮不了。

### 微压缩之后：够不够？ {#layer1-after}

微压缩清掉了小杨早期的工具结果，释放了大约 30K token，上下文降到 140K——低于 167K 的阈值了。**这次压缩到此结束**，小杨完全无感。

但如果小杨的会话更长呢？假设他又工作了半小时，上下文再次逼近 167K，而这次早期的工具结果已经在上一轮微压缩中清过了，没什么可清的了——微压缩释放的空间不够，上下文仍然超标。

这时候，系统进入第 2 层：Session Memory Compact。

* * *

## 第2层：会话记忆压缩（Session Memory Compact） {#layer2}

微压缩只处理工具结果。但对话本身——用户的问题、AI 的分析、来回讨论的设计决策——这些文本内容微压缩不会触及。当对话文本自身积累到较大体量时，就需要一种更深层的压缩：**用一份预先准备好的笔记来替代那些旧对话。**

这就是 Session Memory 的设计思路——与其等到上下文接近上限时再调用 LLM 生成摘要，不如**在对话过程中持续维护一份后台笔记**，压缩时直接使用，零 API 费用、毫秒级完成。

### 什么是 Session Memory {#layer2-what}

本质是一个**后台持续维护的 Markdown 笔记文件**，保存在磁盘上，固定 9 个章节：

| 章节 | 内容 |
| --- | --- |
| Session Title | 5-10 词的会话标题 |
| Current State | 当前任务、待办、下一步 |
| Task specification | 用户要求构建什么 |
| Files and Functions | 重要文件及其作用 |
| Workflow | 常用命令和执行顺序 |
| Errors & Corrections | 遇到的错误、修复方法、失败方案 |
| Codebase and System Documentation | 系统组件和架构 |
| Learnings | 经验教训 |
| Key results | 用户要求的特定输出 |
| Worklog | 逐步操作记录 |

回到小杨的场景：他在这 2.5 小时的工作中，后台已经悄悄更新了这份笔记十几次——记下了他在重构哪些模块、遇到了什么报错、当前改到哪里了。

笔记模板支持自定义——用户可在 `~/.claude/session-memory/config/template.md` 放置自己的模板，更新提示词也可通过 `~/.claude/session-memory/config/prompt.md` 自定义。

### 笔记的更新机制 {#layer2-update}

后台有一个异步钩子（post-sampling hook），在 AI 每次回复后检查是否该记笔记。**不是每次都记**，必须同时满足三个条件：

1.  **首次门槛**：上下文总 token ≥ 10,000
2.  **增长门槛**：距上次记笔记后，上下文增长 ≥ 5,000 token
3.  **工具调用门槛**：距上次记笔记后，工具调用 ≥ 3 次；或 AI 最后一轮没调工具（自然对话断点）

满足条件后，系统 **fork 一个子代理**（不是直接用主对话的 AI）来更新笔记。子代理的核心要求是：

-   用 Edit 工具更新笔记文件，保持章节结构不变
-   每个章节不超过 ~2000 token，接近限制时精简旧内容
-   **始终更新 "Current State"**——这对压缩后的连续性至关重要
-   写详细、信息密集的内容：文件路径、函数名、错误信息、确切命令
-   可以并行发起多个 Edit 调用

记完笔记后，系统在最后一条消息上打**书签**（`lastSummarizedMessageId`）。安全检查：如果最后一轮 assistant 还有工具调用未完成，不更新书签，避免把 `tool_use` 和 `tool_result` 拆开导致 API 报错。

### 实现细节：子代理与缓存 {#layer2-impl}

**子代理的模型和 API Key**：与主对话完全一致，继承 `parentContext.options`，共用同一个 API Key。记笔记在主对话回复完成后才触发，`sequential()` 包装器保证同时只有一个记笔记任务在跑。

**Prompt Cache 省钱原理**：主对话和子代理发送的内容有大量重复前缀（系统提示 + 工具定义 + 对话历史），服务器发现前缀相同就复用缓存。

```
没缓存：102K × $3/1M = $0.306
有缓存：100K × $0.3/1M + 2K × $3/1M = $0.036

省了约 88% 的 input 费用
```

这就是为什么 `CacheSafeParams` 要确保子代理的前缀和主对话**完全一致**——差一个字节缓存就不命中。

**笔记与上下文的关系**：信息只从上下文流向笔记，不会反向标记。书签只记录一个时间点位，不做消息与笔记章节的精确映射。

这意味着存在**信息对齐的模糊地带**：笔记总量上限 12K token，多次更新后旧内容会被新内容挤掉。压缩时删除书签之前的所有消息，但笔记里可能已不包含那些早期消息的某些细节——这部分信息会永久丢失。系统**不做验证**，这是一个有意的工程权衡。

### 压缩时怎么用笔记 {#layer2-compact}

1.  **等待笔记提取完成**——后台正在记笔记则等它完成（最多 15 秒，超 1 分钟的过时任务跳过）
2.  从磁盘读取笔记文件（毫秒级，零 API 费用）
3.  根据书签找到分界点——书签之前的消息"笔记已覆盖"，可以删
4.  书签之后的消息必须保留
5.  如果保留消息不够多，往前扩展，保证至少 10K token / 5 条文本消息
6.  最终结果：`[边界标记] + [笔记] + [保留的原始消息]`

小杨的情况：系统从磁盘读出笔记（~10K），找到书签——小杨最近 15 分钟的消息在书签之后要保留，之前 2 小时的对话全部用笔记替代。

```
压缩前（~170K）：
  [2小时前的对话 ─── ... ─── 书签位置] [最近15分钟的对话]
  ──────── 笔记已覆盖 ────────────────   ── 必须保留 ──

压缩后（~45K）：
  [边界标记] [笔记 10K] [最近15分钟的原始消息 ~35K]
```

从 170K 压到 45K，零 API 费用，毫秒级完成。小杨继续工作，完全不知道刚才发生了什么。

### Session Memory Compact 的失败情况 {#layer2-failures}

以下 5 种情况会导致笔记方案失败，**回退到全量压缩**：

1.  功能 flag 没开
2.  笔记文件不存在（对话太短，还没触发过记笔记）
3.  笔记是空模板（文件创建了但还没写入内容）
4.  书签找不到（消息被外部修改过）
5.  压缩后仍然超标（笔记 + 保留消息 > 阈值）

### 当笔记系统也不够用时 {#layer2-not-enough}

大多数情况下，Session Memory 就够了。但有一种场景它处理不了：小杨在一个全新的项目上刚开始工作，才聊了 5 分钟，上下文就被几个大文件的读取推到了 170K。这时笔记文件还不存在（对话太短，从未触发过记笔记），Session Memory Compact 直接失败。

或者另一种情况：小杨输入了 `/compact 侧重错误日志`——带了自定义指令。笔记是后台预先生成的，无法在压缩时临时调整侧重点，Session Memory 同样无法满足这个需求。

这时候，系统回退到第 3 层：Full Compact。

### 附录A：Session Memory 更新提示词 {#appendix-a}

> 源码原文引用，供深入研究参考，跳过不影响理解正文。

以下是后台子代理更新笔记时收到的完整提示词（源码位于 `src/services/SessionMemory/prompts.ts`）。`{{currentNotes}}` 和 `{{notesPath}}` 会被替换为笔记文件的当前内容和路径：

_▾_ 展开完整提示词

```
IMPORTANT: This message and these instructions are NOT part of the actual
user conversation. Do NOT include any references to "note-taking",
"session notes extraction", or these update instructions in the notes content.

Based on the user conversation above (EXCLUDING this note-taking instruction
message as well as system prompt, claude.md entries, or any past session
summaries), update the session notes file.

The file {{notesPath}} has already been read for you. Here are its current
contents:
<current_notes_content>
{{currentNotes}}
</current_notes_content>

Your ONLY task is to use the Edit tool to update the notes file, then stop.
You can make multiple edits (update every section as needed) - make all Edit
tool calls in parallel in a single message. Do not call any other tools.

CRITICAL RULES FOR EDITING:
- The file must maintain its exact structure with all sections, headers, and
  italic descriptions intact
  - NEVER modify, delete, or add section headers (the lines starting with
    '#' like # Task specification)
  - NEVER modify or delete the italic _section description_ lines (these are
    the lines in italics immediately following each header - they start and
    end with underscores)
  - The italic _section descriptions_ are TEMPLATE INSTRUCTIONS that must be
    preserved exactly as-is - they guide what content belongs in each section
  - ONLY update the actual content that appears BELOW the italic _section
    descriptions_ within each existing section
  - Do NOT add any new sections, summaries, or information outside the
    existing structure
- Do NOT reference this note-taking process or instructions anywhere in
  the notes
- It's OK to skip updating a section if there are no substantial new
  insights to add. Do not add filler content like "No info yet", just
  leave sections blank/unedited if appropriate.
- Write DETAILED, INFO-DENSE content for each section - include specifics
  like file paths, function names, error messages, exact commands,
  technical details, etc.
- For "Key results", include the complete, exact output the user requested
  (e.g., full table, full answer, etc.)
- Do not include information that's already in the CLAUDE.md files included
  in the context
- Keep each section under ~2000 tokens/words - if a section is approaching
  this limit, condense it by cycling out less important details while
  preserving the most critical information
- Focus on actionable, specific information that would help someone
  understand or recreate the work discussed in the conversation
- IMPORTANT: Always update "Current State" to reflect the most recent
  work - this is critical for continuity after compaction

Use the Edit tool with file_path: {{notesPath}}

STRUCTURE PRESERVATION REMINDER:
Each section has TWO parts that must be preserved exactly as they appear
in the current file:
1. The section header (line starting with #)
2. The italic description line (the _italicized text_ immediately after
   the header - this is a template instruction)

You ONLY update the actual content that comes AFTER these two preserved
lines. The italic description lines starting and ending with underscores
are part of the template structure, NOT content to be edited or removed.

REMEMBER: Use the Edit tool in parallel and stop. Do not continue after
the edits. Only include insights from the actual user conversation, never
from these note-taking instructions. Do not delete or change section
headers or italic _section descriptions_.
```

当笔记总量超过 12,000 token 或某个章节超过 2,000 token 时，系统会在提示词末尾追加额外警告，要求子代理积极精简超标章节。

笔记的默认模板（9 个章节）如下：

_▾_ 展开完整模板

```
# Session Title
_A short and distinctive 5-10 word descriptive title for the session.
Super info dense, no filler_

# Current State
_What is actively being worked on right now? Pending tasks not yet
completed. Immediate next steps._

# Task specification
_What did the user ask to build? Any design decisions or other
explanatory context_

# Files and Functions
_What are the important files? In short, what do they contain and
why are they relevant?_

# Workflow
_What bash commands are usually run and in what order? How to interpret
their output if not obvious?_

# Errors & Corrections
_Errors encountered and how they were fixed. What did the user correct?
What approaches failed and should not be tried again?_

# Codebase and System Documentation
_What are the important system components? How do they work/fit together?_

# Learnings
_What has worked well? What has not? What to avoid? Do not duplicate
items from other sections_

# Key results
_If the user asked a specific output such as an answer to a question,
a table, or other document, repeat the exact result here_

# Worklog
_Step by step, what was attempted, done? Very terse summary for each step_
```

* * *

## 第3层：全量压缩（Full Compact） {#layer3}

**Full Compact 是 Session Memory 的兜底方案**，只在笔记系统出现上述失败情况，或用户通过 `/compact <自定义指令>` 主动要求时触发。

它的代价更高——需要调用 LLM 生成摘要，消耗大量 output token，耗时约 5-15 秒。但它能处理任何场景，包括笔记系统无法覆盖的情况。

### 执行流程 {#layer3-flow}

1.  **先跑微压缩**——减少发给 LLM 的 token 量
2.  **图片剥离**——替换为 `[image]` 文本标记，防止压缩请求本身超出上下文限制
3.  **技能附件剥离**——移除 `skill_discovery`/`skill_listing` 类型附件（压缩后会重新注入）
4.  **Pre-Compact hooks**——执行用户配置的预压缩钩子
5.  **fork 子代理生成摘要**——使用精心设计的提示词（见[附录B](#appendix-b)），要求先起草分析再写正文
6.  **prompt-too-long 重试**——如果压缩请求本身过长，从最老消息开始逐步截断，最多重试 3 次
7.  **草稿剥离**——`formatCompactSummary()` 删除 `<analysis>` 只保留 `<summary>`
8.  **工作环境重建**——并行生成文件附件、计划、技能、工具列表、代理列表、MCP 指令
9.  **SessionStart hooks**——重新注入 CLAUDE.md 等上下文
10.  **Post-Compact hooks + 元数据维护**——追加会话标题/标签

换一个场景来说明 Full Compact：小杨在一个全新项目上刚开始工作，才聊了 5 分钟，上下文就被几个巨大的文件读取推到了 170K。笔记文件还不存在，Session Memory 直接失败。

系统随即 fork 一个子代理，把这 5 分钟的完整对话发给它，让它生成一份结构化摘要。大约 8 秒后，摘要生成完毕，系统用它替换所有原始消息，再重建工作环境。小杨看到一条"对话已压缩"的提示，继续工作。

### 摘要提示词的设计要点 {#layer3-prompt}

提示词经过精心设计（完整原文见[附录B](#appendix-b)）：

-   **双重封堵工具调用**：开头和结尾都明确禁止调用工具，因为 fork 的子代理继承了主对话的完整工具集
-   **草稿区设计**（`<analysis>` + `<summary>`）：花 output token 让模型"想清楚再写"，草稿事后删除不占后续上下文
-   **9 个必须包含的章节**：主要请求和意图、关键技术概念、文件和代码段、错误和修复、问题解决过程、所有用户消息、待办任务、当前工作、下一步
-   **防止意图漂移**：第 9 章节要求引用对话原文，确保对"我该继续做什么"不产生理解偏差

### 重建上下文 {#layer3-rebuild}

LLM 只负责生成对话摘要。摘要完成后，系统用纯代码逻辑并行重建工作环境：

| 序号 | 内容 |
| --- | --- |
| ① | 边界标记（压缩前 token 数、已发现工具） |
| ② | LLM 生成的摘要 |
| ③ | 最近读过的文件（最多 5 个，每个 5K token） |
| ④ | 当前计划文件 |
| ⑤ | 计划模式指令 |
| ⑥ | 已调用的技能内容（每个 5K，总预算 25K） |
| ⑦ | 延迟加载的工具列表 |
| ⑧ | 可用代理列表 |
| ⑨ | MCP 服务器指令 |
| ⑩ | SessionStart hooks 结果（如 CLAUDE.md 注入） |

### Full Compact 后笔记的处理 {#layer3-after}

-   **笔记文件不清空**——后续对话继续时后台会接着更新，保留旧笔记让"冷启动"期更短
-   **书签会清空**（`setLastSummarizedMessageId(undefined)`）

存在一个"尴尬期"：Full Compact 后旧笔记与新对话不匹配，新书签还没打上。这段时间如果再触发压缩，Session Memory Compact 大概率失败，还是得走 Full Compact。

### 附录B：Full Compact 压缩提示词 {#appendix-b}

> 源码原文引用，供深入研究参考，跳过不影响理解正文。

以下是 Full Compact 时发给子代理的完整提示词（源码位于 `src/services/compact/prompt.ts`）：

_▾_ 展开完整提示词

```
CRITICAL: Respond with TEXT ONLY. Do NOT call any tools.

- Do NOT use Read, Bash, Grep, Glob, Edit, Write, or ANY other tool.
- You already have all the context you need in the conversation above.
- Tool calls will be REJECTED and will waste your only turn — you will
  fail the task.
- Your entire response must be plain text: an <analysis> block followed
  by a <summary> block.

Your task is to create a detailed summary of the conversation so far,
paying close attention to the user's explicit requests and your previous
actions. This summary should be thorough in capturing technical details,
code patterns, and architectural decisions that would be essential for
continuing development work without losing context.

Before providing your final summary, wrap your analysis in <analysis>
tags to organize your thoughts and ensure you've covered all necessary
points. In your analysis process:

1. Chronologically analyze each message and section of the conversation.
   For each section thoroughly identify:
   - The user's explicit requests and intents
   - Your approach to addressing the user's requests
   - Key decisions, technical concepts and code patterns
   - Specific details like:
     - file names
     - full code snippets
     - function signatures
     - file edits
   - Errors that you ran into and how you fixed them
   - Pay special attention to specific user feedback that you received,
     especially if the user told you to do something differently.
2. Double-check for technical accuracy and completeness, addressing each
   required element thoroughly.

Your summary should include the following sections:

1. Primary Request and Intent: Capture all of the user's explicit
   requests and intents in detail
2. Key Technical Concepts: List all important technical concepts,
   technologies, and frameworks discussed.
3. Files and Code Sections: Enumerate specific files and code sections
   examined, modified, or created. Pay special attention to the most
   recent messages and include full code snippets where applicable and
   include a summary of why this file read or edit is important.
4. Errors and fixes: List all errors that you ran into, and how you
   fixed them. Pay special attention to specific user feedback that you
   received, especially if the user told you to do something differently.
5. Problem Solving: Document problems solved and any ongoing
   troubleshooting efforts.
6. All user messages: List ALL user messages that are not tool results.
   These are critical for understanding the users' feedback and changing
   intent.
7. Pending Tasks: Outline any pending tasks that you have explicitly
   been asked to work on.
8. Current Work: Describe in detail precisely what was being worked on
   immediately before this summary request, paying special attention to
   the most recent messages from both user and assistant. Include file
   names and code snippets where applicable.
9. Optional Next Step: List the next step that you will take that is
   related to the most recent work you were doing. IMPORTANT: ensure
   that this step is DIRECTLY in line with the user's most recent
   explicit requests, and the task you were working on immediately
   before this summary request. If your last task was concluded, then
   only list next steps if they are explicitly in line with the users
   request. Do not start on tangential requests or really old requests
   that were already completed without confirming with the user first.
   If there is a next step, include direct quotes from the most recent
   conversation showing exactly what task you were working on and where
   you left off. This should be verbatim to ensure there's no drift in
   task interpretation.

<example>
<analysis>
[Your thought process, ensuring all points are covered thoroughly
and accurately]
</analysis>

<summary>
1. Primary Request and Intent:
   [Detailed description]

2. Key Technical Concepts:
   - [Concept 1]
   - [Concept 2]
   - [...]

3. Files and Code Sections:
   - [File Name 1]
      - [Summary of why this file is important]
      - [Summary of the changes made to this file, if any]
      - [Important Code Snippet]
   - [...]

4. Errors and fixes:
    - [Detailed description of error 1]:
      - [How you fixed the error]
      - [User feedback on the error if any]
    - [...]

5. Problem Solving:
   [Description of solved problems and ongoing troubleshooting]

6. All user messages:
    - [Detailed non tool use user message]
    - [...]

7. Pending Tasks:
   - [Task 1]
   - [Task 2]
   - [...]

8. Current Work:
   [Precise description of current work]

9. Optional Next Step:
   [Optional Next step to take]

</summary>
</example>

Please provide your summary based on the conversation so far, following
this structure and ensuring precision and thoroughness in your response.

There may be additional summarization instructions provided in the
included context. If so, remember to follow these instructions when
creating the above summary. Examples of instructions include:

<example>
## Compact Instructions
When summarizing the conversation focus on typescript code changes and
also remember the mistakes you made and how you fixed them.
</example>

<example>
# Summary instructions
When you are using compact - please focus on test output and code
changes. Include file reads verbatim.
</example>

REMINDER: Do NOT call any tools. Respond with plain text only — an
<analysis> block followed by a <summary> block. Tool calls will be
rejected and you will fail the task.
```

**要点解读**：

-   开头和结尾**双重封堵**工具调用，防止继承的工具集干扰
-   `<analysis>` 草稿区让模型先思考，`formatCompactSummary()` 事后删除，不浪费后续上下文空间
-   第 9 章节要求**引用对话原文**，防止"意图漂移"
-   末尾的 "additional summarization instructions" 就是用户通过 `/compact <自定义指令>` 传入的内容

* * *

## 第4层：Snip（剪断） {#layer4}

前三层都在"用更精简的东西替代旧内容"——清理工具结果、用笔记替代旧对话、用摘要替代全部消息。Snip 不同，它是真正的最后手段：**直接从最老的消息开始物理删除，不留任何替代品。**

Snip 是实验性功能（`feature('HISTORY_SNIP')` 门控），不独立运行，而是**配合其他层使用**——先 snip 释放空间，再将释放量（`snipTokensFreed`）传给 autocompact，由它判断是否还需要更重的压缩。

回到小杨的主线场景：他的会话已经经历了微压缩和 Session Memory 压缩。如果某一天工具结果已清空、笔记也无法再压缩，系统会启动 Snip，从最早的对话消息开始逐条删除，直到腾出足够空间。小杨看到的，只是一条提示——他不会知道有哪些消息从上下文中消失了。

* * *

## 完整执行顺序：七步预处理 {#pipeline}

四层压缩机制并非孤立运行——每次用户发送消息后，在调用 API 之前，系统会按固定顺序执行七步预处理。这个顺序本身也是设计决策：

```
① 裁切旧历史   — 如果之前做过压缩，只保留压缩点之后的消息
② 大结果转磁盘 — 单个工具结果 > 50K 字符写磁盘；单条消息工具结果总量 > 200K 也持久化
③ Snip         — 物理删除最老消息，释放空间
④ 微压缩       — 清理过期或可隔空删除的工具结果
⑤ 上下文折叠   — 把某些段落折叠成摘要（实验性功能）
⑥ 自动压缩     — 先尝试 Session Memory，失败则 Full Compact
⑦ 拼装 API 请求 — 系统提示 + 上下文 + 消息标准化 + 缓存标记 → 发送
```

注意步骤②：大结果转磁盘发生在压缩之前，这意味着即使内容被后续步骤从上下文中移除，原始数据仍然留在磁盘上，可供 AI 按需读取。

* * *

## Session Memory vs Full Compact 对比 {#comparison}

|  | Session Memory Compact | Full Compact |
| --- | --- | --- |
| **触发时 API 费用** | 0 | 高（大量 output token） |
| **压缩延迟** | 毫秒级 | 5-15 秒 |
| **信息容量上限** | 固定 12K token | LLM 自由分配（~20K） |
| **早期细节保留** | 可能被后期内容挤掉 | 一次性看全貌，权衡保留 |
| **最近上下文** | 原始消息完整保留 | 全部被摘要替换 |
| **结构化程度** | 强（固定 9 个章节） | 弱（LLM 自由发挥） |
| **压缩比** | 一般（还要保留原始消息） | 更激进 |

两者是**互补关系**——Session Memory 是日常压缩主力，Full Compact 是兜底方案。

* * *

## 手动 /compact 的实际行为 {#manual-compact}

```
/compact 指令执行流程：

① 有自定义指令吗？（比如 /compact 关注测试输出）
   ├─ 没有 → 先尝试 Session Memory Compact
   │          成功？→ 完事（毫秒级、零费用）
   │          失败？→ 继续往下
   └─ 有 → 跳过 Session Memory（它不支持自定义指令），直接走 Full Compact

② 先跑一遍微压缩（减少发给 LLM 的 token 量）
   → 再调 Full Compact
```

**Session Memory 不支持自定义指令的原因**：笔记是后台预先生成的，无法在压缩时临时按用户要求调整侧重点；而 Full Compact 是现场调 LLM，可以把自定义指令拼进提示词。

**实用建议**：想省钱且快速→直接 `/compact`；想要侧重特定内容的精准摘要→ `/compact <你的指令>` 强制走 Full Compact。

### `/compact` vs `/clear`：能不 clear 就别 clear {#compact-vs-clear}

|  | `/compact` | `/clear` |
| --- | --- | --- |
| **上下文** | 压缩为摘要/笔记，保留核心信息 | 彻底清空 |
| **Transcript** | 完整保留，AI 可以回读 | 文件还在，但新 session ID，AI 不知道旧文件路径 |
| **笔记文件** | 继续使用 | 文件还在但书签丢了 |
| **Session ID** | 不变 | 重新生成 |
| **工作状态** | 文件缓存、计划、技能都重建 | 全部清空重置 |

每个会话的完整消息记录以 JSONL 格式持久化在本地：

```
~/.claude/projects/<项目路径哈希>/<session-id>.jsonl
```

压缩**不会修改这个文件**——它只替换内存中的消息数组，Transcript 文件是追加写入的，旧消息永远不会被删除。压缩后系统会告诉 AI 这个文件的路径，AI 需要时可以自己用 FileRead 去找回细节。

回到小杨：不管他经历了多少次压缩，他所有的对话、每一次工具调用、每一段 AI 的推理过程，都完整地保存在那个 JSONL 文件里。未来模型支持更大上下文窗口时，这些完整历史会更有价值——这也是 Claude Code 选择持久化到磁盘的深层原因：**当前的上下文窗口限制是暂时的，但对话历史的价值是长期的。**

* * *

## 核心设计哲学 {#philosophy}

### 1\. "分期付款"优于"一次性结清"

Session Memory 把压缩成本分散到整个对话过程——边聊边记笔记，每次花一点小钱，到真正需要压缩时直接用现成笔记，免费且瞬时。

### 2\. "尽量不破坏缓存"贯穿始终

从 cache\_edits 的隔空删除、到时间过期检测、到 fork 子代理共享 prompt cache 前缀——整个系统围绕"保住缓存"来设计。Prompt cache 命中价格是正常价格的 1/10，对 token 消耗大户意味着数量级的成本差异。

### 3\. 层层递进、优雅降级

回顾小杨的完整经历就能看出这套哲学：工具结果过期了→微压缩清理掉（零损失）；对话太长了→用预先积累的笔记替代（轻微信息损失，但免费）；笔记不可用→调 LLM 写摘要（花钱但全面）；前三层都不够→物理删除（最后手段）。每一层都有明确的失败条件和回退路径。

### 4\. 安全优先，务实权衡

压缩过程中有大量"不变量守卫"，确保不会因为压缩而破坏 API 协议：

-   `tool_use` 和 `tool_result` 不能拆开（`adjustIndexToPreserveAPIInvariants`）
-   同一 `message.id` 的 thinking 块不能丢失
-   压缩后 token 数要确保低于阈值，否则放弃
-   熔断器防止无限重试

同时，系统也接受"少量信息丢失"——笔记系统不做"信息是否完整覆盖"的精确验证，Full Compact 允许信息被概括性压缩。因为替代方案是"上下文溢出、对话被迫终止"，这明显更糟。
