export const SERIES = {
  "intelligent-npc": {
    title: "构建沉浸世界的智能 NPC",
    shortTitle: "智能 NPC",
    description: "从上下文编排、角色塑造到动态世界写回，记录一套 AI NPC 系统的完整演进。"
  },
  "xiuxian-world-v2": {
    title: "修仙世界 V2.1 深度解析",
    shortTitle: "修仙世界",
    description: "对大型角色卡的系统架构、人物方法、记忆机制、世界书与 Prompt 工程进行逐层拆解。"
  }
} as const;

export type SeriesSlug = keyof typeof SERIES;

export function isSeriesSlug(value: string): value is SeriesSlug {
  return Object.prototype.hasOwnProperty.call(SERIES, value);
}
