import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { renderContentToHtml } from "@/lib/render-content";
import { postUpdateSchema } from "@/lib/validators";
import { slugifyTag } from "@/lib/utils";

export const runtime = "nodejs";

function isPrismaUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: unknown }).code === "P2002"
  );
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const post = await db.post.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      description: true,
      content: true,
      published: true,
      publishedAt: true,
      tags: { select: { name: true } },
    },
  });
  if (!post) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({
    ...post,
    publishedAt: post.publishedAt.toISOString(),
    tags: post.tags.map((t) => t.name),
  });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { slug: currentSlug } = await ctx.params;

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = postUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const contentHtml =
    data.content !== undefined ? renderContentToHtml(data.content) : undefined;

  const tagSlugs =
    data.tags !== undefined
      ? Array.from(
          new Map(data.tags.map((name) => [slugifyTag(name), name])).entries(),
        )
      : undefined;

  try {
    const post = await db.$transaction(async (tx) => {
      if (tagSlugs) {
        for (const [slug, name] of tagSlugs) {
          await tx.tag.upsert({
            where: { slug },
            update: { name },
            create: { slug, name },
          });
        }
      }
      return tx.post.update({
        where: { slug: currentSlug },
        data: {
          slug: data.slug,
          title: data.title,
          description: data.description,
          content:
            data.content !== undefined
              ? (data.content as unknown as Prisma.InputJsonValue)
              : undefined,
          contentHtml,
          published: data.published,
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
          tags: tagSlugs
            ? { set: tagSlugs.map(([slug]) => ({ slug })) }
            : undefined,
        },
        select: { slug: true },
      });
    });
    return Response.json(post);
  } catch (e) {
    if (isPrismaUniqueError(e)) {
      return Response.json(
        { error: "slug already exists" },
        { status: 409 },
      );
    }
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: unknown }).code === "P2025"
    ) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    throw e;
  }
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  try {
    await db.post.delete({ where: { slug } });
    return new Response(null, { status: 204 });
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: unknown }).code === "P2025"
    ) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    throw e;
  }
}
