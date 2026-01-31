"use client";

import { useState } from "react";

export default function FeedbackWidget({ label, successLabel }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    if (!message.trim()) return;
    setSent(true);
    setMessage("");
  }

  return (
    <div className="mt-8 rounded border p-4">
      <h3 className="mb-2 text-sm font-semibold">{label}</h3>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          data-testid="feedback-input"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded border p-2 text-sm"
          rows={3}
          placeholder="Share your thoughts"
        />
        <button
          data-testid="feedback-submit"
          type="submit"
          className="rounded border px-3 py-1 text-sm"
        >
          Submit
        </button>
        {sent && (
          <div
            data-testid="feedback-success-message"
            className="text-xs text-emerald-600"
          >
            {successLabel}
          </div>
        )}
      </form>
    </div>
  );
}
