"use client";

import { useUIState } from "./ui-state";

export default function SidebarToggle({ label }) {
  const { dispatch } = useUIState();

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
      className="rounded border px-2 py-1 text-xs"
      aria-label={label}
    >
      {label}
    </button>
  );
}
