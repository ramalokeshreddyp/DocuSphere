import GithubSlugger from "github-slugger";

export function extractHeadings(markdown) {
  const slugger = new GithubSlugger();
  const headings = [];
  const lines = markdown.split(/\r?\n/);

  for (const line of lines) {
    const match = /^(#{2,4})\s+(.*)$/.exec(line);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = slugger.slug(text);
      headings.push({ id, text, level });
    }
  }

  return headings;
}

export function extractTitle(markdown) {
  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    const match = /^#\s+(.*)$/.exec(line);
    if (match) {
      return match[1].trim();
    }
  }
  return "";
}

export function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
