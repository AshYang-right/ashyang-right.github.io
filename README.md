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

## Kami 阅读设计（2026-10）

全站采用 Tw93/Kami 的纸白、墨蓝、暖中性色与衬线排版原则，保留所有文章正文、固定链接、旧锚点、专题和 RSS。参考技能已完整安装在 `.agents/skills/kami/`（1.20.0，来源与提交见 `INSTALLATION.txt`）。安装仅复制文件，没有运行上游脚本；它不参与 Astro 构建。

- 首页提供完整时间倒序列表和标签筛选；筛选写入 URL，可后退/前进。手机标签栏可横向滑动。
- 阅读页采用最多 760px 的正文栏，宽屏侧边目录、窄屏可折叠目录；保留进度条、代码折叠、宽表滚动及图表交互。
- 中文字体为自托管的 **Noto Serif CJK SC** 子集（SIL OFL 许可证见 `public/fonts/LICENSE-Noto-CJK.txt`），英文沿用 Source Serif 4。没有使用 Kami 中商业授权要求的 Tsanger 字体。
- 已包含当前全部文案使用的字体字形。新增文章出现新汉字时，会安全回落到系统宋体；可用 FontTools 和官方 Noto 字体源刷新子集：`python3 scripts/subset-reading-font.py /path/to/NotoSerifCJK-Regular.ttc`。这不是构建依赖。
- `npm run build` 另外校验 121 个旧锚点和全站内部 fragment 链接，避免装修破坏已有深链接。

受限执行环境可用 `ASTRO_TELEMETRY_DISABLED=1 npm run check` 与 `ASTRO_TELEMETRY_DISABLED=1 npm run build`，避免工具尝试写入用户配置目录。

可运行 `node --test scripts/test-interactions.mjs` 检查标签筛选、浏览历史、目录与阅读进度逻辑。该套测试使用小型 DOM fixture，不冒充浏览器端视觉测试；当前实际验收状态请看 `design-qa.md`。
