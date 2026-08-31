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
          : "composer-safe-bottom shrink-0 border-t-2 border-[var(--ink)] bg-[var(--surface)] px-3 pt-3 sm:px-4 sm:pt-4"
      }
    >
      <div className="flex items-stretch gap-2">
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
              ? "min-h-[72px] w-full flex-1 resize-none overflow-hidden rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface)] px-4 py-3 text-sm leading-relaxed text-[var(--ink)] shadow-[var(--shadow-brutal)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--celo-forest)] disabled:opacity-50"
              : "min-h-[44px] flex-1 resize-none overflow-hidden rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface)] px-3 py-2.5 text-sm leading-relaxed text-[var(--ink)] shadow-[var(--shadow-brutal)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--celo-forest)] disabled:opacity-50"
          }
        />
        <button
          type="submit"
          disabled={!canChat || !input.trim() || isBusy}
          className={
            isEmbedded
              ? "btn-brutal btn-primary min-h-[72px] w-[4.75rem] shrink-0 self-stretch px-4 text-sm disabled:cursor-not-allowed disabled:bg-[var(--surface-3)] disabled:text-[var(--text-muted)]"
              : "btn-brutal btn-primary min-h-[44px] w-[4.75rem] shrink-0 self-stretch px-3 text-sm disabled:cursor-not-allowed disabled:bg-[var(--surface-3)] disabled:text-[var(--text-muted)]"
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
