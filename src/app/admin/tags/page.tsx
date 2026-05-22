import { TagManager } from "@/components/admin/tag-manager";
import { getAllTags } from "@/lib/tags";

export default async function AdminTagsPage() {
  const tags = await getAllTags();
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">태그관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          전체 태그 {tags.length}개
        </p>
      </div>
      <TagManager tags={tags} />
    </div>
  );
}
