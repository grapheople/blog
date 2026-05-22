import { generateHTML } from "@tiptap/html/server";
import type { JSONContent } from "@tiptap/react";
import { extensions } from "./tiptap-extensions";

export function renderContentToHtml(content: JSONContent): string {
  return generateHTML(content, extensions);
}
