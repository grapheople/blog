import { db } from "./db";

export type TagRow = {
  name: string;
  slug: string;
  postCount: number;
};

export async function getAllTags(): Promise<TagRow[]> {
  const rows = await db.tag.findMany({
    orderBy: { name: "asc" },
    select: {
      name: true,
      slug: true,
      _count: { select: { posts: true } },
    },
  });
  return rows.map((r) => ({
    name: r.name,
    slug: r.slug,
    postCount: r._count.posts,
  }));
}
