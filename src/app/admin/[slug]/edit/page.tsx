import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { getPostForAdmin } from "@/lib/posts";
import { getAllTags } from "@/lib/tags";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function EditPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, tags] = await Promise.all([getPostForAdmin(slug), getAllTags()]);
  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">글 편집</h1>
      <PostForm
        mode="edit"
        availableTags={tags.map((t) => t.name)}
        initial={{
          slug: post.slug,
          title: post.title,
          description: post.description,
          content: post.content,
          tags: post.tags,
          published: post.published,
          publishedAt: post.publishedAt,
        }}
      />
    </div>
  );
}
