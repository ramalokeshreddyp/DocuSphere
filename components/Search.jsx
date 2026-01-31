"use client";

import { useEffect, useRef, useState } from "react";
import FlexSearch from "flexsearch";
import Link from "next/link";

export default function Search({ locale, placeholder }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [docs, setDocs] = useState([]);
  const indexRef = useRef(null);

  useEffect(() => {
    async function loadIndex() {
      indexRef.current = new FlexSearch.Index({ tokenize: "forward" });
      const res = await fetch(`/api/search-index?locale=${locale}`);
      const data = await res.json();
      setDocs(data);
      data.forEach((doc, idx) => {
        indexRef.current.add(idx, `${doc.title} ${doc.content}`);
      });
    }

    loadIndex();
  }, [locale]);

  useEffect(() => {
    if (!query || !indexRef.current) {
      setResults([]);
      return;
    }
    const hits = indexRef.current.search(query, 8);
    const mapped = hits.map((hit) => docs[hit]).filter(Boolean);
    setResults(mapped);
  }, [query, docs]);

  return (
    <div className="relative w-full max-w-sm">
      <input
        data-testid="search-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded border px-3 py-2 text-sm"
        aria-label="Search documentation"
      />
      {query && (
        <div
          data-testid="search-results"
          className="absolute z-10 mt-1 w-full rounded border bg-white p-2 shadow dark:bg-slate-900"
        >
          {results.length === 0 ? (
            <p data-testid="search-no-results" className="text-xs text-slate-500">
              No results found
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="block text-sm font-medium">
                    {item.title}
                  </Link>
                  <p className="text-xs text-slate-500">{item.version}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
