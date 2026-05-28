"use client";

export function AssistantLoading() {
  return (
    <div className="flex gap-3">
      <div
        className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 text-[11px] font-semibold text-emerald-300 ring-2 ring-emerald-500/15"
        aria-hidden
      >
        C
      </div>
      <div className="min-w-0 max-w-[94%]">
        <p className="mb-1.5 text-[11px] font-medium tracking-wide text-zinc-500">
          Celina
        </p>
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[var(--surface-1)] to-zinc-900/80 px-4 py-3 text-sm text-zinc-300 shadow-sm shadow-black/20">
          <span className="flex gap-1" aria-hidden>
            <span className="size-1.5 animate-bounce rounded-full bg-[var(--accent-hover)] [animation-delay:0ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-[var(--accent-hover)] [animation-delay:150ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-[var(--accent-hover)] [animation-delay:300ms]" />
          </span>
          <span className="text-[0.9375rem]">Thinking…</span>
        </div>
      </div>
    </div>
  );
}
