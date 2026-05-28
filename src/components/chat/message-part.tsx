"use client";

import { isTextUIPart, isToolUIPart, type UIMessage } from "ai";
import { ToolStatus } from "@/components/chat/tool-status";

type MessagePart = UIMessage["parts"][number];

interface MessagePartProps {
  part: MessagePart;
  hidePrepareToolDone?: boolean;
}

export function MessagePart({
  part,
  hidePrepareToolDone = false,
}: MessagePartProps) {
  if (isTextUIPart(part)) {
    if (!part.text) {
      return null;
    }

    return (
      <p className="whitespace-pre-wrap">
        {part.text}
        {part.state === "streaming" && (
          <span className="ml-0.5 inline-block w-1.5 animate-pulse bg-zinc-400 align-middle" />
        )}
      </p>
    );
  }

  if (isToolUIPart(part)) {
    return (
      <ToolStatus part={part} hidePrepareDone={hidePrepareToolDone} />
    );
  }

  return null;
}
