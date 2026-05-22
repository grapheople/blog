import { PostForm } from "@/components/admin/post-form";
import { getAllTags } from "@/lib/tags";

export default async function NewPostPage() {
  const tags = await getAllTags();
  return (
    <div>
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">새 글</h1>
      <PostForm mode="create" availableTags={tags.map((t) => t.name)} />
    </div>
  );
}
