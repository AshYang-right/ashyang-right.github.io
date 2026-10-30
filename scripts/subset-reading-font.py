#!/usr/bin/env python3
"""Refresh the local, OFL-licensed reading font after adding Chinese copy.

Optional authoring helper; not needed by npm install/check/build.
Requires fontTools and an installed Noto Serif CJK Regular collection.
Usage: python3 scripts/subset-reading-font.py /path/to/NotoSerifCJK-Regular.ttc
"""
from pathlib import Path
import argparse
from fontTools import subset
from fontTools.ttLib import TTFont

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("source", type=Path)
parser.add_argument("--font-number", type=int, default=2, help="Simplified Chinese face in the official Noto CJK collection")
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
text = "".join(path.read_text() for path in (root / "src").rglob("*") if path.suffix in (".astro", ".md", ".mdx", ".ts"))
options = subset.Options()
options.flavor = "woff"
options.layout_features = ["*"]
font = TTFont(args.source, fontNumber=args.font_number)
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=text)
subsetter.subset(font)
font.flavor = "woff"
output = root / "public/fonts/blog-cjk-serif.woff"
output.parent.mkdir(exist_ok=True)
font.save(output)
print(f"Saved {output.relative_to(root)} ({output.stat().st_size:,} bytes)")
