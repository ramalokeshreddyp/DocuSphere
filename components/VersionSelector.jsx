"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function VersionSelector({ versions }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function switchVersion(targetVersion) {
    const parts = pathname.split("/").filter(Boolean);
    const docsIndex = parts.indexOf("docs");
    if (docsIndex !== -1) {
      parts[docsIndex + 1] = targetVersion;
      router.push(`/${parts.join("/")}`);
    } else {
      const locale = parts[0] || "en";
      router.push(`/${locale}/docs/${targetVersion}/introduction`);
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="version-selector"
        className="rounded border px-2 py-1 text-xs"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Select documentation version"
      >
        Versions
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-32 rounded border bg-white p-2 shadow dark:bg-slate-900">
          {versions.map((version) => (
            <button
              key={version}
              type="button"
              data-testid={`version-option-${version}`}
              className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => switchVersion(version)}
            >
              {version.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
