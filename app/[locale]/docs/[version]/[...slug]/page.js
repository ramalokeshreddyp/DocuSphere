import Link from "next/link";
import { notFound } from "next/navigation";
import MarkdownContent from "../../../../../components/MarkdownContent";
import TableOfContents from "../../../../../components/TableOfContents";
import FeedbackWidget from "../../../../../components/FeedbackWidget";
import Sidebar from "../../../../../components/Sidebar";
import { getDocBySlug, getNavItems, getStaticParams } from "../../../../../lib/docs";
import { getDictionary } from "../../../../../lib/i18n";

export const revalidate = 60;

export async function generateStaticParams() {
  return getStaticParams();
}

export default function DocPage({ params }) {
  const { locale, version, slug } = params;
  try {
    const { content, title, headings } = getDocBySlug(locale, version, slug);
    const dictionary = getDictionary(locale);
    const navItems = getNavItems(locale, version);
    const slugPath = Array.isArray(slug) ? slug.join("/") : slug;
    const editUrl = `${dictionary.editLink}/${locale}/${version}/${slugPath}.md`;

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_220px]">
        <Sidebar locale={locale} version={version} items={navItems} label={dictionary.sidebarLabel} />
        <article className="min-w-0">
          <h1 className="mb-4 text-3xl font-bold">{title}</h1>
          <MarkdownContent content={content} />
          <div className="mt-6 text-sm">
            <Link href={editUrl} className="underline">
              {dictionary.editThisPage}
            </Link>
          </div>
          <FeedbackWidget label={dictionary.feedbackLabel} successLabel={dictionary.feedbackSuccess} />
        </article>
        <div className="hidden lg:block">
          <TableOfContents headings={headings} label={dictionary.tocLabel} />
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
