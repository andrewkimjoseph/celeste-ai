"use client";

import type { ChatStatus } from "ai";
import { useCallback, useEffect, useRef } from "react";

interface ChatComposerProps {
  input: string;
  canChat: boolean;
  status: ChatStatus;
  variant?: "bar" | "embedded";
  onInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

const EMBEDDED_MIN_TEXTAREA_HEIGHT = 72;

export function ChatComposer({
  input,
  canChat,
  status,
  variant = "bar",
  onInputChange,
  onSubmit,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isBusy = status === "streaming" || status === "submitted";
  const isEmbedded = variant === "embedded";

  const adjustTextareaHeight = useCallback((textarea?: HTMLTextAreaElement | null) => {
    const el = textarea ?? textareaRef.current;
    if (!el) {
      return;
    }

    const maxHeight = isEmbedded ? 320 : 240;
    const minHeight = isEmbedded ? EMBEDDED_MIN_TEXTAREA_HEIGHT : 44;

    el.style.height = "auto";
    const nextHeight = Math.max(
      minHeight,
      Math.min(el.scrollHeight, maxHeight),
    );
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [isEmbedded]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canChat && input.trim() && !isBusy) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  }

  function handleFocus() {
    window.scrollTo(0, 0);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        isEmbedded
          ? "w-full"
          : "composer-safe-bottom shrink-0 border-t border-[var(--surface-2)] bg-[var(--surface-0)]/95 px-3 pt-3 backdrop-blur-md sm:px-4 sm:pt-4"
      }
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => {
            onInputChange(event.target.value);
            adjustTextareaHeight(event.target);
          }}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={
            canChat
              ? "Describe your next Celo mission…"
              : "Connect wallet to chat with Celeste…"
          }
          disabled={!canChat || isBusy}
          rows={isEmbedded ? 2 : 1}
          suppressHydrationWarning
          className={
            isEmbedded
              ? "min-h-[72px] w-full flex-1 resize-none overflow-hidden rounded-xl border border-[var(--surface-2)] bg-[var(--surface-0)] px-4 py-3 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 disabled:opacity-50"
              : "min-h-[44px] flex-1 resize-none overflow-hidden rounded-xl border border-[var(--surface-2)] bg-[var(--surface-1)] px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 disabled:opacity-50"
          }
        />
        <button
          type="submit"
          disabled={!canChat || !input.trim() || isBusy}
          className={
            isEmbedded
              ? "h-11 shrink-0 rounded-xl bg-[var(--accent-strong)] px-5 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--text-subtle)]"
              : "h-[44px] shrink-0 rounded-xl bg-[var(--accent-strong)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--text-subtle)]"
          }
        >
          Send
        </button>
      </div>
      <p
        className={`text-[10px] text-[var(--text-subtle)] ${
          isEmbedded
            ? "mt-2 text-center sm:text-left"
            : "mt-1.5 hidden sm:block"
        }`}
      >
        Enter to launch · Shift+Enter for new line
      </p>
    </form>
  );
}
