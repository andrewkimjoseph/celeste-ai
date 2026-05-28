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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-8 lg:gap-x-12">
      <div
        className={`order-2 min-w-0 md:order-1 ${
          showAssistantSlot ? "" : "hidden md:block md:invisible"
        }`}
      >
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

      {turn.user ? (
        <div className="order-1 flex min-w-0 justify-end md:order-2">
          <ChatMessage
            message={turn.user}
            align="end"
            hidePrepareToolDone={hidePrepareToolDone}
          />
        </div>
      ) : null}
    </div>
  );
}
