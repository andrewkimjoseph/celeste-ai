"use client";

import { formatHumanFlowText } from "@/lib/format-human-flow-text";
import { formatTxHash } from "@/lib/format-balance";
import { celoscanTxUrl } from "@/lib/links";
import { formatFlowSummary } from "@/lib/wallet-error";
import type { SessionTransaction } from "@/lib/transactions";
import { useState, useEffect } from "react";

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`size-4 text-zinc-500 transition-transform duration-200 ${
        expanded ? "rotate-180" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  );
}

interface TransactionRowProps {
  transaction: SessionTransaction;
  selected?: boolean;
  onSelect?: () => void;
}

export function TransactionRow({
  transaction,
  selected = false,
  onSelect,
}: TransactionRowProps) {
  const [expanded, setExpanded] = useState(selected);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const displaySummary = formatFlowSummary(transaction.summary);

  useEffect(() => {
    if (selected) {
      setExpanded(true);
    }
  }, [selected]);

  async function handleCopyHash(hash: string) {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      window.setTimeout(() => setCopiedHash(null), 1500);
    } catch {
      // Clipboard unavailable — ignore.
    }
  }

  return (
    <article
      className={`rounded-xl border bg-gradient-to-b from-[var(--surface-1)] to-zinc-900/70 p-3.5 shadow-sm transition-colors ${
        selected
          ? "border-emerald-500/40 ring-1 ring-emerald-500/20"
          : "border-white/[0.06]"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          setExpanded((value) => !value);
          onSelect?.();
        }}
        className="flex w-full items-start gap-3 text-left"
      >
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200/90">
              Confirmed
            </span>
            <span className="text-[11px] text-zinc-500">
              {formatRelativeTime(transaction.timestamp)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-100">
            {displaySummary}
          </p>
        </div>

        <ChevronIcon expanded={expanded} />
      </button>

      <div className="mt-3 flex flex-wrap gap-2 pl-11">
        {transaction.hashes.map((hash) => (
          <div key={hash} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void handleCopyHash(hash)}
              className="rounded-md border border-[var(--surface-2)] bg-black/20 px-2 py-1 font-mono text-[11px] text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
              title="Copy transaction hash"
            >
              {copiedHash === hash ? "Copied" : formatTxHash(hash)}
            </button>
            <a
              href={celoscanTxUrl(hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-[var(--surface-2)] px-2 py-1 text-[11px] text-[var(--accent-hover)] transition-colors hover:border-emerald-500/30 hover:text-emerald-300"
            >
              View
            </a>
          </div>
        ))}
      </div>

      {expanded && transaction.steps.length > 0 && (
        <ol className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3 pl-11">
          {transaction.steps.map((step, index) => (
            <li
              key={`${transaction.id}-step-${index}`}
              className="flex gap-2 text-sm text-zinc-400"
            >
              <span className="font-medium text-zinc-500">{index + 1}.</span>
              <span>{formatHumanFlowText(step)}</span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
