"use client";

import {
  formatMessageText,
  type MessageTextVariant,
} from "@/components/chat/format-message-text";
import { isTextUIPart, isToolUIPart, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { StreamingCursor } from "@/components/chat/streaming-cursor";
import { ToolStatus } from "@/components/chat/tool-status";
import { shouldHideToolError } from "@/components/chat/tool-utils";

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
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const copiedResetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedResetTimeoutRef.current != null) {
        window.clearTimeout(copiedResetTimeoutRef.current);
      }
    };
  }, []);

  async function handleHexClick(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(token);
      if (copiedResetTimeoutRef.current != null) {
        window.clearTimeout(copiedResetTimeoutRef.current);
      }
      copiedResetTimeoutRef.current = window.setTimeout(() => {
        setCopiedToken(null);
        copiedResetTimeoutRef.current = null;
      }, 1500);
    } catch {
      // Clipboard unavailable — ignore.
    }
  }

  if (isToolUIPart(part)) {
    if (
      messageParts &&
      partIndex !== undefined &&
      shouldHideToolError(messageParts, partIndex)
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
          variant === "user"
            ? "text-[var(--accent-foreground)]"
            : "text-[var(--ink)]"
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
              void handleHexClick(hash);
            },
            copiedToken,
          })
        )}
      </div>
    );
  }

  return null;
}
