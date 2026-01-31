import fs from "fs";
import path from "path";

const SUPPORTED_LOCALES = ["en", "es", "fr", "de"];
const DEFAULT_LOCALE = "en";

export function getSupportedLocales() {
  return SUPPORTED_LOCALES;
}

export function getDefaultLocale() {
  return DEFAULT_LOCALE;
}

export function getDictionary(locale) {
  const safeLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const filePath = path.join(process.cwd(), "public", "locales", safeLocale, "common.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}
