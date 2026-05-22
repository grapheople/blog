import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/supabase-storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "file이 누락되었습니다" }, { status: 400 });
  }

  const result = await uploadImage(file);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ url: result.url, path: result.path }, { status: 201 });
}
