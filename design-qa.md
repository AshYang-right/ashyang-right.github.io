# Design QA — Original Layout Restoration

## Comparison target

- Source visual truth: `C:/Users/yangj/.codex/visualizations/2026/08/02/019fc19a-47c9-7240-a9ad-813203efc24b/blog-audit/01-home-desktop.png` and `03-article-desktop.png`.
- Browser-rendered implementation: `blog-implementation/09-restored-home-1280x720.png`, `10-restored-article-1280x720.png`, `11-restored-home-390x844.png`, and `12-restored-article-390x844.png`.
- Combined full-view evidence: `blog-implementation/comparison-restored-home.png` and `comparison-restored-article.png`.
- State: default homepage with “全部” selected; LLM article at the top of the page; mobile article TOC closed.

## Normalization

- Desktop CSS viewport: 1280×720 at device density 1.
- Source article pixels: 1265×712; implementation article pixels: 1265×712.
- Source homepage capture: 1264×1765 full-page; comparison uses its top 1264×712 region against the implementation's 1265×712 viewport capture.
- Mobile CSS viewport: 390×844; implementation capture uses the same browser density.
- The one-pixel desktop width difference is browser scrollbar rounding and is not treated as visual drift.

## Findings

- No remaining P0, P1, or P2 findings.
- The restored homepage matches the source information architecture: centered blog title, pill-shaped tag filters, a short divider, and a single chronological article list.
- The restored article matches the source layout: centered site title and two-link navigation, left 220px sticky TOC, wide right-hand article column, restrained 2rem title, date above title, and warm tag pills.
- The homepage now contains 11 articles and more tags than the six-article source. Extra wrapping is expected dynamic-content growth, not design drift.

## Required fidelity surfaces

- Fonts and typography: local Source Serif 4 remains the primary family; weights, title scale, body size, line height, and TOC hierarchy were returned to the original values. Chinese fallbacks remain Songti/STSong/SimSun.
- Spacing and layout rhythm: desktop article tracks measure 220px + 48px + 933px at the tested viewport, matching the source proportions. Homepage cards use the original 1080px list width and 28px/24px padding. Mobile returns to a single readable column.
- Colors and tokens: background `#f3ede4`, text `#3d3929`, secondary text `#8b8578`, accent `#c4703f`, and the original warm borders/tints are restored.
- Image quality and assets: the source layout contains no article thumbnails, illustrations, or UI icons; no substitute or placeholder imagery was introduced.
- Copy and content: “Ash's Blog”, “首页 / 关于”, “全部”, article titles, dates, summaries, and tags are real content. The homepage list is generated from Content Collection metadata rather than runtime title fetching.
- Accessibility and responsiveness: one `h1` per page, keyboard-operable native buttons/details, visible focus, named navigation landmarks, reduced-motion support, and zero document-level horizontal overflow at desktop and mobile sizes.

## Interaction checks

- The latest article link opens `/posts/llm-industry-chain-margin-analysis.html`.
- “SillyTavern” filtering sets `aria-pressed=true` and shows the expected five posts; “全部” restores all eleven.
- Homepage output order starts at `2026-05-18` and ends at `2026-03-27`.
- Mobile article title appears before the TOC; desktop TOC is hidden and the mobile native `details` control starts closed.
- Internal links, 11 article routes, RSS, sitemap, and preserved legacy anchors remain covered by the production build checks.

## Comparison history

- Earlier P1: the editorial hero, featured story, series cards, and large display typography replaced the user's direct article-index experience.
- Fix: removed those homepage regions, restored the old title/filter/list structure, restored the old site header and article proportions, and kept only the Astro-generated article data underneath.
- Post-fix evidence: `comparison-restored-home.png` and `comparison-restored-article.png`; no actionable P0/P1/P2 mismatch remains.

## Implementation checklist

- [x] Homepage is a complete newest-first article list.
- [x] Tag filtering works without hiding the static list from no-JavaScript readers.
- [x] Original desktop and mobile visual structure is restored.
- [x] Production check and build pass.

final result: passed
