"use client";

import {
  formatMessageText,
  type MessageTextVariant,
} from "@/components/chat/format-message-text";
import { isTextUIPart, isToolUIPart, type UIMessage } from "ai";
import { ToolStatus } from "@/components/chat/tool-status";

type MessagePart = UIMessage["parts"][number];

interface MessagePartProps {
  part: MessagePart;
  hidePrepareToolDone?: boolean;
  variant?: MessageTextVariant;
}

export function MessagePart({
  part,
  hidePrepareToolDone = false,
  variant = "assistant",
}: MessagePartProps) {
  if (isTextUIPart(part)) {
    if (!part.text) {
      return null;
    }

    return (
      <div
        className={`space-y-3 text-[0.9375rem] leading-[1.65] ${
          variant === "user" ? "text-white" : "text-zinc-100"
        }`}
      >
        {formatMessageText(part.text, { variant })}
        {part.state === "streaming" && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse rounded-full bg-[var(--accent-hover)] align-middle" />
        )}
      </div>
    );
  }

  if (isToolUIPart(part)) {
    return (
      <ToolStatus part={part} hidePrepareDone={hidePrepareToolDone} />
    );
  }

  return null;
}
