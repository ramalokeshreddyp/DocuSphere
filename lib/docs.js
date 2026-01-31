import fs from "fs";
import path from "path";
import { extractHeadings, extractTitle, stripMarkdown } from "./markdown";

const DOCS_DIR = path.join(process.cwd(), "_docs");
const VERSIONS = ["v1", "v2", "v3"];
const LOCALES = ["en", "es", "fr", "de"];

export function getVersions() {
  return VERSIONS;
}

export function getLocales() {
  return LOCALES;
}

export function getDocPath(locale, version, slugParts) {
  const slug = Array.isArray(slugParts) ? slugParts.join("/") : slugParts;
  return path.join(DOCS_DIR, locale, version, `${slug}.md`);
}

export function getDocBySlug(locale, version, slugParts) {
  const filePath = getDocPath(locale, version, slugParts);
  const content = fs.readFileSync(filePath, "utf-8");
  const title = extractTitle(content) || "Documentation";
  const headings = extractHeadings(content);
  return { content, title, headings };
}

export function getDocSlugs(locale, version) {
  const dir = path.join(DOCS_DIR, locale, version);
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.replace(/\.md$/, ""));
}

export function getNavItems(locale, version) {
  return getDocSlugs(locale, version).map((slug) => {
    const { title } = getDocBySlug(locale, version, slug);
    return { slug, title };
  });
}

export function getStaticParams() {
  const params = [];
  for (const locale of LOCALES) {
    for (const version of VERSIONS) {
      for (const slug of getDocSlugs(locale, version)) {
        params.push({ locale, version, slug: [slug] });
      }
    }
  }
  return params;
}

export function getDocsForSearch(locale) {
  const docs = [];
  for (const version of VERSIONS) {
    for (const slug of getDocSlugs(locale, version)) {
      const { content, title } = getDocBySlug(locale, version, slug);
      docs.push({
        id: `${locale}-${version}-${slug}`,
        title,
        content: stripMarkdown(content),
        href: `/${locale}/docs/${version}/${slug}`,
        version
      });
    }
  }
  return docs;
}
