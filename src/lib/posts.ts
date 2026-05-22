import { db } from "./db";

export type Post = {
  slug: string;
  title: string;
  description: string;
  contentHtml: string;
  publishedAt: string;
  tags: string[];
};

type PostRow = {
  slug: string;
  title: string;
  description: string;
  contentHtml: string;
  publishedAt: Date;
  tags: { name: string }[];
};

function toPost(row: PostRow): Post {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    contentHtml: row.contentHtml,
    publishedAt: row.publishedAt.toISOString(),
    tags: row.tags.map((t) => t.name),
  };
}

export async function getPosts(): Promise<Post[]> {
  const rows = await db.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      description: true,
      contentHtml: true,
      publishedAt: true,
      tags: { select: { name: true } },
    },
  });
  return rows.map(toPost);
}

export async function getPost(slug: string): Promise<Post | null> {
  const row = await db.post.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      description: true,
      contentHtml: true,
      published: true,
      publishedAt: true,
      tags: { select: { name: true } },
    },
  });
  if (!row || !row.published) return null;
  return toPost(row);
}
