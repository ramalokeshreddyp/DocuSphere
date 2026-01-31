"use client";

import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiReference({ specUrl }) {
  const [spec, setSpec] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSpec() {
      try {
        const response = await fetch(specUrl);
        if (!response.ok) {
          throw new Error("Failed to load OpenAPI spec");
        }
        const json = await response.json();
        setSpec(json);
      } catch (err) {
        setError(err.message || "Failed to load OpenAPI spec");
      }
    }

    loadSpec();
  }, [specUrl]);

  if (error) {
    return <div className="rounded border p-4 text-sm text-red-600">{error}</div>;
  }

  if (!spec) {
    return <div className="rounded border p-4 text-sm">Loading API reference...</div>;
  }

  return <SwaggerUI spec={spec} />;
}
