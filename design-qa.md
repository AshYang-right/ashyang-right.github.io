# Kami redesign — verification record

## Design

The blog adapts Tw93/Kami 1.20.0's paper, ink-blue, warm-neutral and serif typography principles. The project-local skill lives in `.agents/skills/kami/`; provenance is recorded in its `INSTALLATION.txt`. Article text, existing media, fixed URLs and legacy anchors are preserved.

## Automated verification

- `npm run check`: 32 files; no errors, warnings or hints.
- `npm run build`: 36 HTML pages, 9 posts in chronological order, 121 preserved legacy anchors, valid local resources and fragment links, RSS and sitemap.
- `node --test scripts/test-interactions.mjs`: 6 passing logic tests covering filtering/history, TOC targeting and focus, reading progress and unchanged chart proportions.
- No changes to article sources, original images/videos or dependency versions.

## Browser verification

Real Windows browser testing covered the homepage and four representative articles at 390px and 1440px, navigation, filtering and history, long-code disclosure, scrollable tables and Sankey diagrams, donut comparison toggles, responsive image pairs, and video playback.

Final rechecks confirmed no document-level horizontal overflow at the primary phone and desktop sizes, fixed 14px HTML chart legends, working comparison controls and improved heading wraps. The mobile TOC separately passed at 320px and 390px: independent scrolling without page scroll chaining, keyboard scrolling, close/reopen, last-section navigation/focus and Back.

These checks do not establish full accessibility conformance. No-JavaScript browser mode, reduced-motion settings, actual 200% browser zoom, screen readers, cross-browser consistency and playback of every media file remain unverified. A static 404 page was checked, not the production server's arbitrary-unknown-path mapping.
