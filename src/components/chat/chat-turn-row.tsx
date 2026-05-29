"use client";

import { AssistantLoading } from "@/components/chat/assistant-loading";
import { ChatMessage } from "@/components/chat/chat-message";
import type { ChatTurn } from "@/components/chat/chat-utils";

interface ChatTurnRowProps {
  turn: ChatTurn;
  hidePrepareToolDone?: boolean;
  showLoading?: boolean;
}

export function ChatTurnRow({
  turn,
  hidePrepareToolDone = false,
  showLoading = false,
}: ChatTurnRowProps) {
  const hasAssistant = Boolean(turn.assistant);
  const showAssistantSlot = hasAssistant || showLoading;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {turn.user ? (
        <div className="flex min-w-0 justify-end md:w-1/2 md:self-end md:pl-4 lg:pl-6">
          <ChatMessage
            message={turn.user}
            align="end"
            hidePrepareToolDone={hidePrepareToolDone}
          />
        </div>
      ) : null}

      {showAssistantSlot ? (
        <div className="min-w-0 md:w-1/2 md:pr-4 lg:pr-6">
          {showLoading && !hasAssistant ? (
            <AssistantLoading />
          ) : turn.assistant ? (
            <ChatMessage
              message={turn.assistant}
              align="start"
              hidePrepareToolDone={hidePrepareToolDone}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
