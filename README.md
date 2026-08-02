# Ash's Blog

一个使用 Astro 构建、托管在 GitHub Pages 的个人思考博客。文章写在 Markdown / MDX 中，构建结果是普通静态 HTML；旧文章继续使用 `/posts/{slug}.html`，发布后只要不改 `slug`，分享地址就不会改变。

## 本地写作

需要 Node.js 22 或更高版本。

```bash
npm install
npm run new:post -- --slug article-slug --title "文章标题"
npm run dev
```

新文章位于 `src/content/blog/`，默认是草稿。图片放在 `public/images/posts/{slug}/`，文章中使用 `/images/posts/{slug}/文件名` 引用。

准备发布时：

1. 将文章 frontmatter 中的 `draft` 改为 `false`。
2. 运行 `npm run check` 和 `npm run build`。
3. 提交并推送到 GitHub。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动实时预览 |
| `npm run new:post -- --slug article-slug --title "文章标题"` | 创建草稿和图片目录 |
| `npm run check` | 检查内容元数据、类型和旧地址 |
| `npm run build` | 生成静态网站并检查页面、RSS 和内部链接 |
| `npm run preview` | 预览最终 `dist/` 产物 |

## 内容元数据

每篇文章使用以下字段：`title`、`description`、`publishedAt`、可选的 `updatedAt`、`tags`、可选的 `series` 与 `seriesOrder`、`featured`、`draft` 和不可随意修改的 `slug`。

`draft: true` 的文章可以在 `npm run dev` 中预览，但不会进入生产页面、归档、RSS 或 sitemap。

## 部署

`.github/workflows/deploy.yml` 会在 Pull Request 中执行检查与构建；合并到 `main` 后使用 GitHub Pages Action 部署 `dist/`。仓库第一次使用时，需要在 GitHub 的 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。
