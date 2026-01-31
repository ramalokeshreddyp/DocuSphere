"use client";

import { usePathname, useRouter } from "next/navigation";

const LABELS = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch"
};

export default function LanguageSwitcher({ locales }) {
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(targetLocale) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) {
      router.push(`/${targetLocale}`);
      return;
    }
    parts[0] = targetLocale;
    router.push(`/${parts.join("/")}`);
  }

  return (
    <div data-testid="language-switcher" className="flex items-center gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => switchLocale(locale)}
          className="rounded border px-2 py-1 text-xs"
          aria-label={`Switch to ${LABELS[locale]}`}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
