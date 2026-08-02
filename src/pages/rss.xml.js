import rss from "@astrojs/rss";
import { getPublishedPosts, postUrl } from "../lib/content";

export async function GET(context) {
  const posts = await getPublishedPosts();
  return rss({
    title: "Ash's Blog",
    description: "关于 AI、系统、产品与那些值得反复琢磨的问题。",
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: postUrl(post),
      categories: post.data.tags,
    })),
    customData: "<language>zh-CN</language>",
  });
}
