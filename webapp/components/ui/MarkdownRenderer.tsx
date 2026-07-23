"use client";

import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({
  breaks: true,
  gfm: true,
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarkdown(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const isPreformatted =
    trimmed.startsWith("```") ||
    trimmed.startsWith("    ") ||
    trimmed.startsWith("\t");

  if (isPreformatted) {
    const code = escapeHtml(trimmed.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, ""));
    return `<pre><code>${code}</code></pre>`;
  }

  try {
    const html = marked.parse(trimmed) as string;
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
    });
  } catch {
    return escapeHtml(trimmed).replace(/\n/g, "<br />");
  }
}

const baseClass =
  "prose prose-sm max-w-none text-text leading-6 break-words";

const elementClassMap: Record<string, string> = {
  h1: "text-xl font-semibold mt-4 mb-2 first:mt-0",
  h2: "text-lg font-semibold mt-3 mb-2 first:mt-0",
  h3: "text-base font-semibold mt-2 mb-1 first:mt-0",
  h4: "text-sm font-semibold mt-2 mb-1 first:mt-0",
  p: "mb-2 last:mb-0",
  ul: "list-disc pl-5 mb-2 space-y-1",
  ol: "list-decimal pl-5 mb-2 space-y-1",
  li: "mb-0.5",
  blockquote: "border-l-3 border-accent1/60 pl-3 italic text-text-muted my-2",
  pre: "rounded-xl border border-border bg-surface-tint/60 p-3 overflow-x-auto text-xs my-2",
  code: "rounded-md bg-surface-tint px-1.5 py-0.5 text-xs font-mono text-text",
  a: "text-accent1 underline underline-offset-2 break-all",
  hr: "my-3 border-border",
  table: "w-full border-collapse my-2 text-xs",
  th: "border border-border px-2 py-1 bg-surface-tint text-left font-medium",
  td: "border border-border px-2 py-1",
  strong: "font-semibold text-text",
  em: "italic",
};

export function MarkdownRenderer({ content }: { content: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div
      className={baseClass}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
