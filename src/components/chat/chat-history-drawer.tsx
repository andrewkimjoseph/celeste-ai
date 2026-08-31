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
        className="absolute inset-0 bg-[var(--overlay-backdrop)]"
        onClick={closeHistory}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-history-drawer-title"
        className="absolute left-0 top-0 flex h-dvh w-full max-w-sm flex-col border-r-2 border-[var(--ink)] bg-[var(--surface)]"
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-[var(--ink)] px-4 py-4">
          <div>
            <h2
              id="chat-history-drawer-title"
              className="text-base font-bold tracking-tight text-[var(--ink)]"
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
            className="flex size-9 items-center justify-center rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-brutal-sm)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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

        <div className="shrink-0 border-b-2 border-[var(--ink)] p-3">
          <button
            type="button"
            onClick={() => void createChat()}
            className="btn-brutal btn-primary w-full px-3 py-2 text-sm"
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
                className="inline-block size-5 animate-spin rounded-full border-2 border-[var(--ink)] border-t-[var(--accent)]"
                aria-hidden
              />
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <p className="text-sm font-bold text-[var(--ink)]">No saved chats</p>
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
