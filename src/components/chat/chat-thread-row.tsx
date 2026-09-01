"use client";

import { DEFAULT_CHAT_TITLE } from "@/lib/chat/chats";

function formatRelativeTimestamp(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) {
    return "just now";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return new Date(timestamp).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

interface ChatThreadRowBaseProps {
  title: string;
  isActive: boolean;
}

interface InteractiveChatThreadRowProps extends ChatThreadRowBaseProps {
  id: string;
  updatedAt: number;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  timestampLabel?: never;
}

interface PreviewChatThreadRowProps extends ChatThreadRowBaseProps {
  timestampLabel: string;
  id?: never;
  updatedAt?: never;
  onSelect?: never;
  onDelete?: never;
}

type ChatThreadRowProps =
  | InteractiveChatThreadRowProps
  | PreviewChatThreadRowProps;

function DeleteIcon() {
  return (
    <svg
      className="size-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

function isInteractiveRow(
  props: ChatThreadRowProps,
): props is InteractiveChatThreadRowProps {
  return "onSelect" in props;
}

export function ChatThreadRow(props: ChatThreadRowProps) {
  const { title, isActive } = props;
  const displayTitle = title.trim() || DEFAULT_CHAT_TITLE;

  if (isInteractiveRow(props)) {
    return (
      <ChatThreadRowChrome
        title={displayTitle}
        timestampLabel={formatRelativeTimestamp(props.updatedAt)}
        isActive={isActive}
        onSelect={() => props.onSelect(props.id)}
        onDelete={() => props.onDelete(props.id)}
      />
    );
  }

  return (
    <ChatThreadRowChrome
      title={displayTitle}
      timestampLabel={props.timestampLabel}
      isActive={isActive}
    />
  );
}

function ChatThreadRowChrome({
  title,
  timestampLabel,
  isActive,
  onSelect,
  onDelete,
}: {
  title: string;
  timestampLabel: string;
  isActive: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}) {
  const interactive = onSelect != null && onDelete != null;
  const titleClass = `truncate text-sm font-semibold ${
    isActive ? "text-[var(--accent-foreground)]" : "text-[var(--ink)]"
  }`;
  const metaClass = `mt-0.5 text-[10px] ${
    isActive
      ? "text-[var(--accent-foreground)]/80"
      : "text-[var(--text-muted)]"
  }`;
  const deleteClass = `mr-1.5 flex size-8 shrink-0 items-center justify-center self-center ${
    interactive
      ? "opacity-100 transition-colors hover:bg-[var(--canvas)] hover:text-[var(--accent)] lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
      : isActive
        ? "pointer-events-none opacity-100"
        : "pointer-events-none opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
  } ${
    isActive ? "text-[var(--accent-foreground)]" : "text-[var(--text-muted)]"
  }`;

  return (
    <div
      className={`group relative flex items-stretch rounded-[2px] border-2 ${
        isActive
          ? "border-[var(--ink)] bg-[var(--accent)] shadow-[var(--shadow-brutal-sm)]"
          : "border-transparent hover:border-[var(--ink)] hover:bg-[var(--canvas)]"
      }`}
    >
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 px-3 py-2.5 text-left"
        >
          <p className={titleClass}>{title}</p>
          <p className={metaClass}>{timestampLabel}</p>
        </button>
      ) : (
        <div className="min-w-0 flex-1 px-3 py-2.5 text-left">
          <p className={titleClass}>{title}</p>
          <p className={metaClass}>{timestampLabel}</p>
        </div>
      )}
      {onDelete ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete chat: ${title}`}
          className={deleteClass}
        >
          <DeleteIcon />
        </button>
      ) : (
        <span className={deleteClass} aria-hidden>
          <DeleteIcon />
        </span>
      )}
    </div>
  );
}
