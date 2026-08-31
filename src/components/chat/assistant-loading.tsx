"use client";

import { CelesteLogoAvatar } from "@/components/celeste-logo";

export function AssistantLoading() {
  return (
    <div className="flex w-full gap-3">
      <CelesteLogoAvatar
        size="sm"
        className="mt-1"
      />
      <div className="min-w-0 flex-1">
        <p className="mb-1.5 text-[11px] font-bold tracking-wide text-[var(--text-muted)]">
          Celeste AI
        </p>
        <div className="flex items-center gap-2.5 rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] shadow-[var(--shadow-brutal-sm)]">
          <span className="flex gap-1" aria-hidden>
            <span className="size-1.5 animate-bounce rounded-[2px] bg-[var(--ink)] [animation-delay:0ms]" />
            <span className="size-1.5 animate-bounce rounded-[2px] bg-[var(--ink)] [animation-delay:150ms]" />
            <span className="size-1.5 animate-bounce rounded-[2px] bg-[var(--ink)] [animation-delay:300ms]" />
          </span>
          <span className="text-[0.9375rem]">Thinking…</span>
        </div>
      </div>
    </div>
  );
}
