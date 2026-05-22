import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

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
    await db.tag.delete({ where: { slug } });
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
