"use client";

import { useEffect, useState } from "react";

export default function TableOfContents({ headings, label }) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const elements = headings.map((heading) => document.getElementById(heading.id));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    elements.forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, [headings]);

  return (
    <aside data-testid="table-of-contents" aria-label={label} className="text-sm">
      <div className="mb-2 font-semibold">{label}</div>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id} style={{ marginLeft: `${(heading.level - 2) * 12}px` }}>
            <a
              href={`#${heading.id}`}
              data-testid={`toc-link-${heading.id}`}
              data-active={activeId === heading.id ? "true" : "false"}
              className={`block rounded px-2 py-1 ${
                activeId === heading.id
                  ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
