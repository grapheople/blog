"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteButton({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (!window.confirm(`"${title}" 글을 삭제할까요? 되돌릴 수 없습니다.`)) {
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        window.alert(`삭제 실패: ${res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={onClick}
      disabled={pending}
    >
      {pending ? "삭제 중…" : "삭제"}
    </Button>
  );
}
