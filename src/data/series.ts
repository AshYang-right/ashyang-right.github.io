export const SERIES = {
  "intelligent-npc": {
    title: "构建沉浸世界的智能 NPC",
    shortTitle: "智能 NPC",
    description: "从上下文编排、角色塑造到动态世界写回，记录一套 AI NPC 系统的完整演进。"
  }
} as const;

export type SeriesSlug = keyof typeof SERIES;

export function isSeriesSlug(value: string): value is SeriesSlug {
  return Object.prototype.hasOwnProperty.call(SERIES, value);
}
