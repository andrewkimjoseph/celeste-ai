"use client";

import { ChatThreadRow } from "@/components/chat/chat-thread-row";
import { EXAMPLE_PROMPTS } from "@/lib/chat/example-prompts";

export function ExamplePromptList({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="px-3 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        Example prompts
      </p>
      <ul className="mt-2 space-y-1">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <li key={prompt.title}>
            <ChatThreadRow
              title={prompt.title}
              timestampLabel={prompt.timestampLabel}
              isActive={"active" in prompt && prompt.active}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
