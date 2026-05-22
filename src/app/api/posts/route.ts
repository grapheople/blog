import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { renderContentToHtml } from "@/lib/render-content";
import { postCreateSchema } from "@/lib/validators";
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

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = postCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const contentHtml = renderContentToHtml(data.content);
  const publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();

  const tagSlugs = Array.from(
    new Map(data.tags.map((name) => [slugifyTag(name), name])).entries(),
  );

  try {
    const post = await db.$transaction(async (tx) => {
      for (const [slug, name] of tagSlugs) {
        await tx.tag.upsert({
          where: { slug },
          update: { name },
          create: { slug, name },
        });
      }
      return tx.post.create({
        data: {
          slug: data.slug,
          title: data.title,
          description: data.description,
          content: data.content as unknown as Prisma.InputJsonValue,
          contentHtml,
          published: data.published,
          publishedAt,
          tags: { connect: tagSlugs.map(([slug]) => ({ slug })) },
        },
        select: { slug: true },
      });
    });
    return Response.json(post, { status: 201 });
  } catch (e) {
    if (isPrismaUniqueError(e)) {
      return Response.json(
        { error: "slug already exists" },
        { status: 409 },
      );
    }
    throw e;
  }
}
