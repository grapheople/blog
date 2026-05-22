"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  available: string[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export function TagSelector({ available, selected, onChange }: Props) {
  const selectedSet = new Set(selected);

  function toggle(name: string) {
    if (selectedSet.has(name)) {
      onChange(selected.filter((t) => t !== name));
    } else {
      onChange([...selected, name]);
    }
  }

  if (available.length === 0) {
    return (
      <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        등록된 태그가 없습니다.{" "}
        <Link
          href="/admin/tags"
          className="underline underline-offset-4 hover:text-foreground"
        >
          태그관리에서 추가
        </Link>
        해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {available.map((name) => {
          const active = selectedSet.has(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              aria-pressed={active}
              className={cn(
                "rounded-md border px-2 py-1 font-mono text-xs transition-colors",
                active
                  ? "border-foreground/30 bg-foreground text-background"
                  : "border-input text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        태그가 더 필요하면{" "}
        <Link
          href="/admin/tags"
          className="underline underline-offset-4 hover:text-foreground"
        >
          태그관리
        </Link>
        에서 추가하세요.
      </p>
    </div>
  );
}
