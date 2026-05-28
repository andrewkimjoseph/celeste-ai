"use client";

export function AssistantLoading() {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] items-center gap-2 rounded-2xl bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300">
        <span
          className="inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-zinc-500 border-t-emerald-400"
          aria-hidden
        />
        <span>Celina is thinking…</span>
      </div>
    </div>
  );
}
