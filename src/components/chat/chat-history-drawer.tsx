"use client";

import { ChatThreadRow } from "@/components/chat/chat-thread-row";
import { useChats } from "@/hooks/use-chats";
import { useEffect, useRef } from "react";

export function ChatHistoryDrawer() {
  const {
    chats,
    activeChatId,
    isLoading,
    isHistoryOpen,
    closeHistory,
    createChat,
    selectChat,
    deleteChat,
  } = useChats();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isHistoryOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeHistory();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isHistoryOpen, closeHistory]);

  if (!isHistoryOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close chat history panel"
        className="absolute inset-0 bg-[var(--overlay-backdrop)] backdrop-blur-sm transition-opacity"
        onClick={closeHistory}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-history-drawer-title"
        className="absolute left-0 top-0 flex h-dvh w-full max-w-sm flex-col border-r border-[var(--surface-2)] bg-[var(--surface-0)] shadow-2xl shadow-black/40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgb(166 80 148 / 0.14), transparent)",
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--surface-2)] px-4 py-4">
          <div>
            <h2
              id="chat-history-drawer-title"
              className="text-base font-semibold text-[var(--text-primary)]"
            >
              Chat history
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {chats.length === 0
                ? "Saved on this device"
                : `${chats.length} saved`}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeHistory}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full border border-[var(--surface-2)] text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="shrink-0 border-b border-[var(--surface-2)] p-3">
          <button
            type="button"
            onClick={() => void createChat()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            New chat
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <span
                className="inline-block size-5 animate-spin rounded-full border-2 border-[var(--surface-3)] border-t-[var(--accent-hover)]"
                aria-hidden
              />
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <p className="text-sm font-medium text-[var(--text-secondary)]">No saved chats</p>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
                Start a conversation and it will appear here after your first
                message.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <ChatThreadRow
                  key={chat.id}
                  id={chat.id}
                  title={chat.title}
                  updatedAt={chat.updatedAt}
                  isActive={chat.id === activeChatId}
                  onSelect={(id) => void selectChat(id)}
                  onDelete={(id) => void deleteChat(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
