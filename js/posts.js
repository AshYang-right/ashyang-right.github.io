/**
 * 文章数据列表
 * 每次发布新文章时，在此数组头部添加一条记录即可。
 */
const POSTS = [
    {
        slug: "claude-code-context-compression",
        title: "Claude Code 是如何进行上下文压缩的？（源码学习）",
        date: "2026-03-31",
        summary: "深度解析 Claude Code 的四层递进上下文压缩机制——从微压缩的缓存感知设计，到 Session Memory 的后台笔记系统，再到 Full Compact 的 LLM 摘要生成，最后是 Snip 的物理删除。一套精密的系统，在信息保留、成本和延迟之间做出精妙的工程权衡。",
        tags: ["AI", "源码分析", "上下文工程", "Claude Code"]
    },
    {
        slug: "context-assembly-author-note",
        title: "构建沉浸世界的智能 NPC（二）Context Assembly & Author's Note",
        date: "2026-03-27",
        summary: "如何让 NPC 引导玩家推进剧情？本文探讨时间系统、Author's Note 与 Depth 机制的协作——让世界从静止的蜡像馆变为正在运转的活世界。三层机制各司其职：时间回答'世界走到了哪里'，Author's Note 回答'NPC 现在该做什么'，Depth 回答'这件事有多急'。",
        tags: ["AI", "游戏开发", "NPC对话", "上下文工程", "智能NPC系列"]
    },
    {
        slug: "intelligent-npc-architecture",
        title: "构建沉浸世界的智能 NPC（一）Context is all you need !",
        date: "2026-03-27",
        summary: "为Unity游戏构建了一套完整的AI NPC对话系统，让NPC能够根据世界观、角色人设、游戏状态进行智能对话。本文以幽灵公主艾琳娜的案例为线索，展示系统从传统预设对话到完整AI对话系统的八个演进阶段。",
        tags: ["AI", "游戏开发", "NPC对话", "架构设计", "智能NPC系列"]
    },

];
