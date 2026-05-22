import { notFound } from "next/navigation";
import { getPost } from "@/lib/posts";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-prose px-4 py-16 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {post.title}
        </h1>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <time className="font-mono">{post.publishedAt.slice(0, 10)}</time>
          {post.tags.length > 0 && (
            <div className="flex gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md border px-1.5 py-0.5 font-mono"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>
      <div
        className="leading-relaxed [&_p]:my-4"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </article>
  );
}
