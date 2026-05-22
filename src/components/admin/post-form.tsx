"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { JSONContent } from "@tiptap/react";
import { Editor } from "@/components/editor/editor";
import { TagSelector } from "@/components/admin/tag-selector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다").max(200),
  slug: z
    .string()
    .min(1, "slug는 필수입니다")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "소문자/숫자/하이픈만 사용 가능합니다"),
  description: z.string().max(500),
  published: z.boolean(),
  publishedAt: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export type PostFormInitial = {
  slug: string;
  title: string;
  description: string;
  content: JSONContent | null;
  tags: string[];
  published: boolean;
  publishedAt: string;
};

type Props = {
  mode: "create" | "edit";
  availableTags: string[];
  initial?: PostFormInitial;
};

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostForm({ mode, availableTags, initial }: Props) {
  const router = useRouter();
  const [content, setContent] = useState<JSONContent | null>(
    initial?.content ?? null,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initial?.tags ?? [],
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      published: initial?.published ?? false,
      publishedAt: initial?.publishedAt
        ? toLocalDatetime(initial.publishedAt)
        : "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);

    if (!content) {
      setSubmitError("본문을 입력해주세요");
      return;
    }

    const tags = selectedTags;

    const payload = {
      slug: values.slug,
      title: values.title,
      description: values.description,
      content,
      published: values.published,
      publishedAt: values.publishedAt
        ? new Date(values.publishedAt).toISOString()
        : undefined,
      tags,
    };

    setSubmitting(true);
    try {
      const url =
        mode === "create"
          ? "/api/posts"
          : `/api/posts/${encodeURIComponent(initial!.slug)}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setSubmitError(data.error ?? `${res.status} ${res.statusText}`);
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Field label="제목" error={errors.title?.message}>
        <input
          type="text"
          {...register("title")}
          className={inputClass}
          placeholder="글 제목"
        />
      </Field>

      <Field label="slug" error={errors.slug?.message}>
        <input
          type="text"
          {...register("slug")}
          className={cn(inputClass, "font-mono")}
          placeholder="url-friendly-slug"
        />
      </Field>

      <Field label="설명" error={errors.description?.message}>
        <textarea
          {...register("description")}
          className={cn(inputClass, "min-h-[80px] resize-y")}
          placeholder="글 목록에 표시될 짧은 설명"
        />
      </Field>

      <Field label="태그">
        <TagSelector
          available={availableTags}
          selected={selectedTags}
          onChange={setSelectedTags}
        />
      </Field>

      <Field label="본문">
        <Editor initialContent={initial?.content ?? null} onChange={setContent} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="공개">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("published")}
              className="size-4 rounded border-input"
            />
            <span>공개</span>
          </label>
        </Field>
        <Field label="공개 시각" error={errors.publishedAt?.message}>
          <input
            type="datetime-local"
            {...register("publishedAt")}
            className={cn(inputClass, "font-mono")}
          />
        </Field>
      </div>

      {submitError && (
        <p className="text-sm text-destructive">{submitError}</p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "저장 중…" : mode === "create" ? "게시" : "저장"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin")}
          disabled={submitting}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">{label}</label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
