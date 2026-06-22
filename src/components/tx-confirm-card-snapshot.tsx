import type { PreparedTx } from "@/lib/prepared-flow";
import {
  formatMessageTimestamp,
  MESSAGE_TIMESTAMP_CLASS,
} from "@/lib/chat-message-metadata";
import { formatFlowSummary } from "@/lib/wallet-error";
import { formatTransactionStep } from "@/lib/transaction-display";
import { formatTxHash } from "@/lib/format-balance";
import { celoscanTxUrl } from "@/lib/links";

interface TxConfirmCardSnapshotProps {
  summary: string;
  steps: PreparedTx[];
  recipientLabel?: string;
  hashes: string[];
  confirmedAt?: number;
}

/** Read-only green success card pinned in chat history after signing. */
export function TxConfirmCardSnapshot({
  summary,
  steps,
  recipientLabel,
  hashes,
  confirmedAt,
}: TxConfirmCardSnapshotProps) {
  const displaySummary = formatFlowSummary(summary, recipientLabel);
  const timestampLabel =
    confirmedAt != null ? formatMessageTimestamp(confirmedAt) : null;

  return (
    <div className="w-full min-w-0 max-w-full rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-[var(--surface-1)] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300"
          aria-hidden
        >
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-emerald-50">
              Transaction confirmed
            </p>
            {timestampLabel ? (
              <time
                dateTime={new Date(confirmedAt!).toISOString()}
                className={MESSAGE_TIMESTAMP_CLASS}
              >
                {timestampLabel}
              </time>
            ) : null}
          </div>
          <p className="mt-1 break-words text-sm leading-relaxed text-zinc-300">
            {displaySummary}
          </p>
          <p className="mt-1.5 text-xs text-zinc-500">
            Saved to your history. Tap a hash to view details.
          </p>
        </div>
      </div>

      <ol className="mt-3 space-y-1.5 border-t border-emerald-500/15 pt-3">
        {steps.map((step, index) => (
          <li
            key={`${step.description}-${index}`}
            className="flex gap-2 text-sm text-zinc-400"
          >
            <span className="font-medium text-zinc-500">{index + 1}.</span>
            <span className="min-w-0 break-words">
              {formatTransactionStep(step.description, { summary })}
            </span>
          </li>
        ))}
      </ol>

      {hashes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-emerald-500/15 pt-3">
          {hashes.map((hash) => (
            <a
              key={hash}
              href={celoscanTxUrl(hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-1 font-mono text-xs text-emerald-100 ring-1 ring-emerald-500/25 transition-colors hover:bg-emerald-500/20"
              title={hash}
            >
              {formatTxHash(hash)}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
