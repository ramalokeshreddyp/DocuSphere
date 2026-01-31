"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

function CodeBlock({ inline, className, children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");

  if (inline) {
    return <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{children}</code>;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div data-testid="code-block" className="relative my-4 rounded border bg-slate-50 p-3 dark:bg-slate-900">
      <button
        type="button"
        data-testid="copy-code-button"
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded border px-2 py-1 text-xs"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className={className}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function MarkdownContent({ content }) {
  return (
    <div data-testid="doc-content" className="prose max-w-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={{ code: CodeBlock }}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
