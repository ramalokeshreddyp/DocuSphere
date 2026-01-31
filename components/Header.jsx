import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import VersionSelector from "./VersionSelector";
import Search from "./Search";
import SidebarToggle from "./SidebarToggle";
import { getLocales, getVersions } from "../lib/docs";

export default function Header({ locale, dictionary }) {
  return (
    <header className="border-b">
      <div className="container flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {dictionary.siteTitle}
        </div>
        <Search locale={locale} placeholder={dictionary.searchPlaceholder} />
        <div className="flex items-center gap-3">
          <SidebarToggle label={dictionary.sidebarToggle} />
          <VersionSelector versions={getVersions()} />
          <LanguageSwitcher locales={getLocales()} />
          <ThemeToggle label={dictionary.themeToggle} />
        </div>
      </div>
    </header>
  );
}
