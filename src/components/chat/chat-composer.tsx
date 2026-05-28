"use client";

import type { ChatStatus } from "ai";

interface ChatComposerProps {
  input: string;
  canChat: boolean;
  status: ChatStatus;
  onInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function ChatComposer({
  input,
  canChat,
  status,
  onInputChange,
  onSubmit,
}: ChatComposerProps) {
  const isBusy = status === "streaming" || status === "submitted";

  return (
    <form onSubmit={onSubmit} className="border-t border-zinc-800 p-4">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder={
            canChat
              ? "Ask about balances, swaps, or sends…"
              : "Connect wallet first…"
          }
          disabled={!canChat || isBusy}
          suppressHydrationWarning
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canChat || !input.trim() || isBusy}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </form>
  );
}
