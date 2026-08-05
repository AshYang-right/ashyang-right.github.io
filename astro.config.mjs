import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkHeadingIds from "./src/plugins/remark-heading-ids.mjs";
import rehypeArticleElements from "./src/plugins/rehype-article-elements.mjs";

export default defineConfig({
  site: "https://ashyang-right.github.io",
  output: "static",
  build: {
    format: "file",
    inlineStylesheets: "always"
  },
  integrations: [
    mdx(),
    sitemap({
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== "/" && !url.pathname.endsWith(".html")) {
          url.pathname = `${url.pathname}.html`;
          item.url = url.href;
        }
        return item;
      }
    })
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkHeadingIds],
      rehypePlugins: [rehypeArticleElements]
    }),
    shikiConfig: {
      theme: "github-dark"
    }
  }
});
