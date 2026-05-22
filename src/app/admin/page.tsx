import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { getAllPostsForAdmin } from "@/lib/posts";

export default async function AdminPage() {
  const posts = await getAllPostsForAdmin();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">글쓰기</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            전체 글 {posts.length}개
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/new">새 글</Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
          아직 글이 없습니다.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {posts.map((p) => (
            <li
              key={p.slug}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/${encodeURIComponent(p.slug)}/edit`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {p.title}
                  </Link>
                  {!p.published && (
                    <span className="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      draft
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span>{p.slug}</span>
                  <span>·</span>
                  <span>{p.updatedAt.slice(0, 10)}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/${encodeURIComponent(p.slug)}/edit`}>
                    편집
                  </Link>
                </Button>
                <DeleteButton slug={p.slug} title={p.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
