import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
function valueFor(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

const slug = valueFor("--slug");
const title = valueFor("--title");
if (!slug || !title) {
  console.error('用法：npm run new:post -- --slug article-slug --title "文章标题"');
  process.exit(1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("slug 只能包含小写英文字母、数字和连字符，且不能以连字符开头或结尾。");
  process.exit(1);
}

const contentDir = path.join(process.cwd(), "src", "content", "blog");
const articlePath = path.join(contentDir, `${slug}.md`);
if (fs.existsSync(articlePath) || fs.existsSync(path.join(contentDir, `${slug}.mdx`))) {
  console.error(`文章已存在：${slug}`);
  process.exit(1);
}

const date = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const yamlTitle = JSON.stringify(title);
const content = `---
title: ${yamlTitle}
description: "请用一两句话概括这篇文章。"
publishedAt: ${date}
tags:
  - "随笔"
featured: false
draft: true
slug: ${slug}
---

在这里开始写作。

## 第一个小节

正文。
`;

fs.mkdirSync(contentDir, { recursive: true });
fs.writeFileSync(articlePath, content, { encoding: "utf8", flag: "wx" });
const imageDir = path.join(process.cwd(), "public", "images", "posts", slug);
fs.mkdirSync(imageDir, { recursive: true });
console.log(`已创建：${path.relative(process.cwd(), articlePath)}`);
console.log(`图片目录：${path.relative(process.cwd(), imageDir)}`);
console.log("草稿已设为 draft: true；准备发布时改为 false。 ");
