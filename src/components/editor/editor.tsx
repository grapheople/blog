"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor as TipTapEditor, JSONContent } from "@tiptap/react";
import { extensions } from "@/lib/tiptap-extensions";
import { EditorToolbar } from "./toolbar";

type Props = {
  initialContent?: JSONContent | null;
  onChange: (content: JSONContent) => void;
};

const emptyDoc: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

export function Editor({ initialContent, onChange }: Props) {
  const editor = useEditor({
    extensions,
    content: initialContent ?? emptyDoc,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[400px] focus:outline-none [&_p]:my-3 [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_pre]:my-4 [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_code]:font-mono [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-sm [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
      },
    },
    onUpdate({ editor }: { editor: TipTapEditor }) {
      onChange(editor.getJSON());
    },
  });

  return (
    <div className="rounded-md border">
      <EditorToolbar editor={editor} />
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
