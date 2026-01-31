"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle({ label }) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const activeTheme = theme === "system" ? systemTheme : theme;
  const isDark = activeTheme === "dark";

  return (
    <button
      type="button"
      data-testid="theme-toggle"
      className="rounded border px-3 py-1 text-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
