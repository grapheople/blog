"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { TagRow } from "@/lib/tags";

type Props = { tags: TagRow[] };

export function TagManager({ tags }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setCreateError(data.error ?? `${res.status} ${res.statusText}`);
        return;
      }
      setName("");
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(tag: TagRow) {
    const message =
      tag.postCount > 0
        ? `"${tag.name}" 태그를 삭제하시겠습니까? 현재 ${tag.postCount}개의 글에 사용 중입니다.`
        : `"${tag.name}" 태그를 삭제하시겠습니까?`;
    if (!window.confirm(message)) return;
    setDeletingSlug(tag.slug);
    try {
      const res = await fetch(`/api/tags/${encodeURIComponent(tag.slug)}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        window.alert(`삭제 실패: ${res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="flex items-start gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="새 태그 이름"
            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {createError && (
            <p className="mt-1 text-xs text-destructive">{createError}</p>
          )}
        </div>
        <Button type="submit" disabled={creating || !name.trim()}>
          {creating ? "추가 중…" : "추가"}
        </Button>
      </form>

      {tags.length === 0 ? (
        <p className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">
          아직 태그가 없습니다.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {tags.map((tag) => (
            <li
              key={tag.slug}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium">{tag.name}</div>
                <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span>{tag.slug}</span>
                  <span>·</span>
                  <span>{tag.postCount}개 글</span>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={deletingSlug === tag.slug}
                onClick={() => onDelete(tag)}
              >
                {deletingSlug === tag.slug ? "삭제 중…" : "삭제"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
