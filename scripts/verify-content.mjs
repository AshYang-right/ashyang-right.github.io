import fs from "node:fs";
import path from "node:path";

const contentDir = path.join(process.cwd(), "src", "content", "blog");
const files = fs.readdirSync(contentDir).filter((file) => /\.mdx?$/.test(file));
const slugs = new Map();
const errors = [];

for (const file of files) {
  const source = fs.readFileSync(path.join(contentDir, file), "utf8");
  const slug = source.match(/^slug:\s*([a-z0-9-]+)\s*$/m)?.[1];
  if (!slug) {
    errors.push(`${file}: 缺少合法 slug`);
    continue;
  }
  if (slugs.has(slug)) errors.push(`${file}: slug 与 ${slugs.get(slug)} 重复`);
  slugs.set(slug, file);
  if (!source.match(/^draft:\s*(true|false)\s*$/m)) errors.push(`${file}: draft 必须是 true 或 false`);
  if (!source.match(/^featured:\s*(true|false)\s*$/m)) errors.push(`${file}: featured 必须是 true 或 false`);
}

const legacySlugs = [
  "ai-world-engine-architecture",
  "character-palette-prompt-engineering",
  "claude-code-context-compression",
  "context-assembly-author-note",
  "intelligent-npc-architecture",
  "llm-industry-chain-margin-analysis",
];
for (const slug of legacySlugs) {
  if (!slugs.has(slug)) errors.push(`旧地址对应的文章缺失：${slug}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`内容结构检查通过：${files.length} 篇文章，${slugs.size} 个唯一 slug。`);
