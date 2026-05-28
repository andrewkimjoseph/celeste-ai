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

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canChat && input.trim() && !isBusy) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="border-t border-[var(--surface-2)] p-4">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            canChat
              ? "Ask about swaps, sends, or DeFi on Celo…"
              : "Connect wallet first…"
          }
          disabled={!canChat || isBusy}
          rows={1}
          suppressHydrationWarning
          className="max-h-32 min-h-[42px] flex-1 resize-y rounded-lg border border-[var(--surface-2)] bg-[var(--surface-1)] px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-[var(--accent)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canChat || !input.trim() || isBusy}
          className="self-end rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          Send
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-zinc-600">
        Enter to send · Shift+Enter for new line
      </p>
    </form>
  );
}
