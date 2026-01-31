import { NextResponse } from "next/server";
import { getDocsForSearch, getLocales } from "../../../lib/docs";

export function GET(request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en";
  const safeLocale = getLocales().includes(locale) ? locale : "en";
  const docs = getDocsForSearch(safeLocale);
  return NextResponse.json(docs);
}
