import { getCollection, type CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

export async function getVisiblePosts(): Promise<BlogPost[]> {
  const posts = await getCollection("blog", ({ data }) => import.meta.env.DEV || !data.draft);
  return sortPosts(posts);
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return sortPosts(posts);
}

export function sortPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => {
    const dateDiff = b.data.publishedAt.getTime() - a.data.publishedAt.getTime();
    if (dateDiff !== 0) return dateDiff;
    return (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0);
  });
}

export function postUrl(post: BlogPost): string {
  return `/posts/${post.data.slug}.html`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai"
  }).format(date);
}

export function allTags(posts: BlogPost[]): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  posts.forEach((post) => post.data.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "zh-CN"));
}

export function tagSlug(tag: string): string {
  return encodeURIComponent(tag);
}
