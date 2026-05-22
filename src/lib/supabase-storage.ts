import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "blog-images";

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다",
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_BYTES = 8 * 1024 * 1024;

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; status: number; error: string };

export async function uploadImage(file: File): Promise<UploadResult> {
  if (!ALLOWED_MIME.has(file.type)) {
    return {
      ok: false,
      status: 415,
      error: `지원하지 않는 형식입니다 (${file.type})`,
    };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `파일이 너무 큽니다 (최대 ${MAX_BYTES / 1024 / 1024}MB)`,
    };
  }

  const ext = EXT_BY_MIME[file.type];
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const path = `posts/${yyyy}/${mm}/${crypto.randomUUID()}.${ext}`;

  const client = getClient();
  const { error } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    return { ok: false, status: 500, error: error.message };
  }

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}
