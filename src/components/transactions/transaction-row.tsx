"use client";

import { formatFlowSummary } from "@/lib/tx/wallet-error";
import { formatTxHash } from "@/lib/wallet/format-balance";
import { celoscanTxUrl } from "@/lib/wallet/links";
import {
  formatTransactionStep,
  getTransactionProtocolLabel,
  pairTransactionStepsWithHashes,
} from "@/lib/tx/transaction-display";
import type { SessionTransaction } from "@/lib/tx/transactions";
import { useState } from "react";

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

function HashActions({
  hash,
  copiedHash,
  onCopy,
}: {
  hash: string;
  copiedHash: string | null;
  onCopy: (hash: string) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => onCopy(hash)}
        className="rounded-[2px] border-2 border-[var(--ink)] bg-[var(--canvas)] px-2 py-1 font-mono text-[11px] font-bold text-[var(--ink)] shadow-[var(--shadow-brutal-sm)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        title="Copy transaction hash"
      >
        {copiedHash === hash ? "Copied" : formatTxHash(hash)}
      </button>
      <a
        href={celoscanTxUrl(hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-[2px] border-2 border-[var(--ink)] bg-[var(--accent)] px-2 py-1 text-[11px] font-semibold text-[var(--accent-foreground)] shadow-[var(--shadow-brutal-sm)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        View
      </a>
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`size-4 text-[var(--text-muted)] transition-transform duration-200 ${
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
  const [expandedOverride, setExpandedOverride] = useState<boolean | null>(null);
  const expanded = expandedOverride ?? selected;
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const displaySummary = formatFlowSummary(transaction.summary);
  const protocolLabel = getTransactionProtocolLabel(transaction.summary);
  const stepEntries = pairTransactionStepsWithHashes(
    transaction.steps,
    transaction.hashes,
  );
  const multiStep = stepEntries.length > 1;
  const primaryHash = transaction.hashes[transaction.hashes.length - 1];

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
      className={`border-2 bg-[var(--surface)] p-3.5 ${
        selected ? "border-[var(--accent)]" : "border-[var(--ink)]"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          setExpandedOverride((value) => !(value ?? selected));
          onSelect?.();
        }}
        className="flex w-full items-start gap-3 text-left"
      >
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[2px] border-2 border-[var(--ink)] bg-[var(--success)] text-[var(--ink)]">
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
            <span className="inline-flex items-center rounded-[2px] border-2 border-[var(--ink)] bg-[var(--success)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
              Confirmed
            </span>
            {protocolLabel && (
              <span className="inline-flex items-center rounded-[2px] border-2 border-[var(--ink)] bg-[var(--canvas)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
                {protocolLabel}
              </span>
            )}
            {multiStep && (
              <span className="text-[10px] text-[var(--text-muted)]">
                {stepEntries.length} steps
              </span>
            )}
            <span className="text-[11px] text-[var(--text-muted)]">
              {formatRelativeTime(transaction.timestamp)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-primary)]">
            {displaySummary}
          </p>
        </div>

        <ChevronIcon expanded={expanded} />
      </button>

      {!expanded && primaryHash && (
        <div className="mt-3 pl-11">
          <HashActions
            hash={primaryHash}
            copiedHash={copiedHash}
            onCopy={(hash) => void handleCopyHash(hash)}
          />
        </div>
      )}

      {expanded && (
        <ol className="mt-3 space-y-3 border-t border-[var(--surface-2)] pt-3 pl-11">
          {stepEntries.map((entry, index) => (
            <li
              key={`${transaction.id}-step-${index}`}
              className="space-y-2"
            >
              <div className="flex gap-2 text-sm text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-muted)]">{index + 1}.</span>
                <span className="min-w-0 flex-1 leading-relaxed">
                  {formatTransactionStep(entry.step, {
                    summary: transaction.summary,
                  })}
                </span>
              </div>
              {entry.hash && (
                <HashActions
                  hash={entry.hash}
                  copiedHash={copiedHash}
                  onCopy={(hash) => void handleCopyHash(hash)}
                />
              )}
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
