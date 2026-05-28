"use client";

import {
  formatMessageText,
  type MessageTextVariant,
} from "@/components/chat/format-message-text";
import { isTextUIPart, isToolUIPart, type UIMessage } from "ai";
import { StreamingCursor } from "@/components/chat/streaming-cursor";
import { ToolStatus } from "@/components/chat/tool-status";
import { shouldHideSupersededToolError } from "@/components/chat/tool-utils";
import { useTransactions } from "@/hooks/use-transactions";

type MessagePartType = UIMessage["parts"][number];

interface MessagePartProps {
  part: MessagePartType;
  messageParts?: UIMessage["parts"];
  partIndex?: number;
  hidePrepareToolDone?: boolean;
  variant?: MessageTextVariant;
}

export function MessagePart({
  part,
  messageParts,
  partIndex,
  hidePrepareToolDone = false,
  variant = "assistant",
}: MessagePartProps) {
  const { openTransactionByHash } = useTransactions();

  if (isToolUIPart(part)) {
    if (
      messageParts &&
      partIndex !== undefined &&
      shouldHideSupersededToolError(messageParts, partIndex)
    ) {
      return null;
    }

    return (
      <ToolStatus part={part} hidePrepareDone={hidePrepareToolDone} />
    );
  }

  if (isTextUIPart(part)) {
    if (!part.text) {
      return null;
    }

    const isStreaming = part.state === "streaming";

    return (
      <div
        className={`space-y-3 text-[0.9375rem] leading-[1.65] ${
          variant === "user" ? "text-white" : "text-zinc-100"
        }`}
      >
        {isStreaming ? (
          <p className="streaming-text whitespace-pre-wrap leading-[1.65]">
            {part.text}
            <StreamingCursor />
          </p>
        ) : (
          formatMessageText(part.text, {
            variant,
            onHashClick: (hash) => {
              void openTransactionByHash(hash);
            },
          })
        )}
      </div>
    );
  }

  return null;
}
