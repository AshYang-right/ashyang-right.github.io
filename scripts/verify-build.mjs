import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const required = [
  "index.html",
  "about.html",
  "archive.html",
  "series.html",
  "series/intelligent-npc.html",
  "rss.xml",
  "sitemap-index.xml",
  "robots.txt",
  "404.html",
];
const errors = [];

for (const file of required) {
  if (!fs.existsSync(path.join(dist, file))) errors.push(`Missing build artifact: ${file}`);
}

const contentDir = path.join(root, "src", "content", "blog");
const publishedPosts = fs.readdirSync(contentDir)
  .filter((file) => /\.mdx?$/.test(file))
  .map((file) => fs.readFileSync(path.join(contentDir, file), "utf8"))
  .filter((source) => !/^draft:\s*true\s*$/m.test(source))
  .map((source) => ({
    slug: source.match(/^slug:\s*([a-z0-9-]+)\s*$/m)?.[1],
    publishedAt: source.match(/^publishedAt:\s*(\d{4}-\d{2}-\d{2})\s*$/m)?.[1],
    seriesOrder: Number(source.match(/^seriesOrder:\s*(\d+)\s*$/m)?.[1] ?? 0),
  }))
  .filter((post) => post.slug && post.publishedAt)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.seriesOrder - b.seriesOrder);
const publishedSlugs = publishedPosts.map((post) => post.slug);

for (const slug of publishedSlugs) {
  if (!fs.existsSync(path.join(dist, "posts", `${slug}.html`))) {
    errors.push(`Missing post artifact: ${slug}`);
  }
}

const homeHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const homeSlugs = [...homeHtml.matchAll(/<h2 class="post-card__title"><a href="\/posts\/([a-z0-9-]+)\.html"/g)]
  .map((match) => match[1]);
if (JSON.stringify(homeSlugs) !== JSON.stringify(publishedSlugs)) {
  errors.push(`Homepage post order is incorrect. Expected ${publishedSlugs.join(", ")}; found ${homeSlugs.join(", ")}`);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const htmlFiles = walk(dist).filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  if (h1Count !== 1) errors.push(`${path.relative(dist, file)}: expected exactly one h1, found ${h1Count}`);

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|#)/.test(raw)) continue;
    const clean = decodeURIComponent(raw.split("#")[0].split("?")[0]);
    if (!clean) continue;
    let target = clean.startsWith("/")
      ? path.join(dist, clean.slice(1))
      : path.resolve(path.dirname(file), clean);
    if (clean.endsWith("/")) target = path.join(target, "index.html");
    if (!path.extname(target)) target += ".html";
    if (!fs.existsSync(target)) errors.push(`${path.relative(dist, file)}: missing local resource ${raw}`);
  }
}

const rss = fs.existsSync(path.join(dist, "rss.xml"))
  ? fs.readFileSync(path.join(dist, "rss.xml"), "utf8")
  : "";
const rssItems = (rss.match(/<item>/g) ?? []).length;
if (rssItems !== publishedSlugs.length) {
  errors.push(`RSS should contain ${publishedSlugs.length} posts, found ${rssItems}`);
}

const sitemapXml = fs.readdirSync(dist)
  .filter((file) => /^sitemap-\d+\.xml$/.test(file))
  .map((file) => fs.readFileSync(path.join(dist, file), "utf8"))
  .join("\n");
for (const slug of publishedSlugs) {
  const url = `https://ashyang-right.github.io/posts/${slug}.html`;
  if (!sitemapXml.includes(url)) errors.push(`Sitemap is missing: ${url}`);
}

if (errors.length) {
  console.error([...new Set(errors)].join("\n"));
  process.exit(1);
}

console.log(
  `Static build verified: ${publishedSlugs.length} posts in newest-first order, ${htmlFiles.length} HTML pages, valid internal resources, RSS and sitemap.`,
);
