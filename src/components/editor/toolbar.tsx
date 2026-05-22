"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { editor: Editor | null };

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/uploads/image", { method: "POST", body: form });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

export function EditorToolbar({ editor }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const state = useEditorState({
    editor,
    selector: (ctx) => {
      const e = ctx.editor;
      if (!e) return null;
      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        code: e.isActive("code"),
        h1: e.isActive("heading", { level: 1 }),
        h2: e.isActive("heading", { level: 2 }),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        blockquote: e.isActive("blockquote"),
        codeBlock: e.isActive("codeBlock"),
        link: e.isActive("link"),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
  });

  if (!editor || !state) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
      <ToolButton
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="굵게"
      >
        <Bold className="size-3.5" />
      </ToolButton>
      <ToolButton
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="기울임"
      >
        <Italic className="size-3.5" />
      </ToolButton>
      <ToolButton
        active={state.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
        label="인라인 코드"
      >
        <Code className="size-3.5" />
      </ToolButton>
      <Divider />
      <ToolButton
        active={state.h1}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        label="H1"
      >
        <Heading1 className="size-3.5" />
      </ToolButton>
      <ToolButton
        active={state.h2}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        label="H2"
      >
        <Heading2 className="size-3.5" />
      </ToolButton>
      <Divider />
      <ToolButton
        active={state.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label="목록"
      >
        <List className="size-3.5" />
      </ToolButton>
      <ToolButton
        active={state.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        label="번호 목록"
      >
        <ListOrdered className="size-3.5" />
      </ToolButton>
      <ToolButton
        active={state.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        label="인용"
      >
        <Quote className="size-3.5" />
      </ToolButton>
      <ToolButton
        active={state.codeBlock}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        label="코드 블록"
      >
        <Code2 className="size-3.5" />
      </ToolButton>
      <Divider />
      <ToolButton
        active={state.link}
        onClick={() => {
          const previous = editor.getAttributes("link").href as
            | string
            | undefined;
          const url = window.prompt("링크 URL", previous ?? "");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
        }}
        label="링크"
      >
        <LinkIcon className="size-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        label={uploading ? "업로드 중…" : "이미지 업로드"}
      >
        <ImageIcon className="size-3.5" />
      </ToolButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setUploading(true);
          try {
            const url = await uploadImage(file);
            editor.chain().focus().setImage({ src: url }).run();
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "업로드 실패";
            window.alert(message);
          } finally {
            setUploading(false);
          }
        }}
      />
      <Divider />
      <ToolButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!state.canUndo}
        label="되돌리기"
      >
        <Undo className="size-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!state.canRedo}
        label="다시 실행"
      >
        <Redo className="size-3.5" />
      </ToolButton>
    </div>
  );
}

function ToolButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground",
        disabled && "opacity-40 hover:bg-transparent hover:text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-border" aria-hidden />;
}
