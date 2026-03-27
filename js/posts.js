/**
 * 文章数据列表
 * 每次发布新文章时，在此数组头部添加一条记录即可。
 */
const POSTS = [
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
    {
        slug: "thinking-about-thinking",
        title: "关于思考的思考",
        date: "2026-03-27",
        summary: "我们每天都在思考，但很少去思考「思考」本身。这篇文章记录了我对元认知的一些探索：如何觉察自己的思维模式，如何让思考更有质量。",
        tags: ["思维", "元认知", "自我提升"]
    },
    {
        slug: "why-i-write",
        title: "为什么我开始写博客",
        date: "2026-03-27",
        summary: "写作不仅仅是输出，更是一种深度思考的过程。这篇文章聊聊我为什么决定开始用博客来记录自己的想法。",
        tags: ["写作", "思考"]
    }
];
