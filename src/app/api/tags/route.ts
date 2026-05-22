import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAllTags } from "@/lib/tags";
import { slugifyTag } from "@/lib/utils";

export const runtime = "nodejs";

const tagCreateSchema = z.object({
  name: z.string().min(1).max(50),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const tags = await getAllTags();
  return Response.json(tags);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = tagCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const name = parsed.data.name.trim();
  const slug = slugifyTag(name);

  try {
    const tag = await db.tag.create({
      data: { name, slug },
      select: { name: true, slug: true },
    });
    return Response.json({ ...tag, postCount: 0 }, { status: 201 });
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: unknown }).code === "P2002"
    ) {
      return Response.json(
        { error: "이미 존재하는 태그입니다" },
        { status: 409 },
      );
    }
    throw e;
  }
}
