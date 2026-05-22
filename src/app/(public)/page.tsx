import Link from "next/link";
import { getPosts } from "@/lib/posts";

export default async function HomePage() {
  const posts = (await getPosts()).slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <section className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight">blog</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          기록하고, 다시 읽고, 고친다.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          recent
        </h2>
        <ul className="divide-y border-y">
          {posts.map((p) => (
            <li key={p.slug} className="py-4">
              <Link
                href={`/posts/${p.slug}`}
                className="group flex items-baseline justify-between gap-4"
              >
                <span className="font-medium group-hover:underline">
                  {p.title}
                </span>
                <time className="font-mono text-xs text-muted-foreground">
                  {p.publishedAt.slice(0, 10)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
