import Link from "next/link";
import { getPosts } from "@/lib/posts";

export const metadata = {
  title: "posts",
};

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">posts</h1>
      <ul className="space-y-6">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/posts/${p.slug}`}
              className="group block"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-medium group-hover:underline">
                  {p.title}
                </h2>
                <time className="font-mono text-xs text-muted-foreground">
                  {p.publishedAt.slice(0, 10)}
                </time>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {p.description}
              </p>
              {p.tags.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
