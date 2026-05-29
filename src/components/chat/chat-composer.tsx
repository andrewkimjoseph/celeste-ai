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
    <form
      onSubmit={onSubmit}
      className="composer-safe-bottom shrink-0 border-t border-[var(--surface-2)] bg-[var(--surface-0)]/95 px-3 pb-3 pt-3 backdrop-blur-md sm:px-4 sm:pb-4 sm:pt-4"
    >
      <div className="flex items-center gap-2">
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
          className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-[var(--surface-2)] bg-[var(--surface-1)] px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-[var(--accent)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canChat || !input.trim() || isBusy}
          className="h-[44px] shrink-0 rounded-xl bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-zinc-500"
        >
          Send
        </button>
      </div>
      <p className="mt-1.5 hidden text-[10px] text-zinc-600 sm:block">
        Enter to send · Shift+Enter for new line
      </p>
    </form>
  );
}
