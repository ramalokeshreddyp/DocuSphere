"use client";

import Link from "next/link";
import { useUIState } from "./ui-state";

export default function Sidebar({ locale, version, items, label }) {
  const { state, dispatch } = useUIState();

  return (
    <aside
      data-testid="sidebar"
      className={`border-r p-4 ${state.sidebarOpen ? "block" : "hidden"} md:block`}
      aria-label={label}
    >
      <div className="mb-4 flex items-center justify-between md:hidden">
        <span className="text-sm font-semibold">{label}</span>
        <button
          type="button"
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          className="rounded border px-2 py-1 text-xs"
          aria-label="Toggle sidebar"
        >
          Toggle
        </button>
      </div>
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/${locale}/docs/${version}/${item.slug}`}
            data-testid={`sidebar-nav-link-${item.slug}`}
            className="block rounded px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
