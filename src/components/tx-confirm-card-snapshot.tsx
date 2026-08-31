import type { PreparedTx } from "@/lib/tx/prepared-flow";
import {
  formatMessageTimestamp,
  MESSAGE_TIMESTAMP_CLASS,
} from "@/lib/chat/chat-message-metadata";
import { formatFlowSummary } from "@/lib/tx/wallet-error";
import { formatTransactionStep } from "@/lib/tx/transaction-display";
import { formatTxHash } from "@/lib/wallet/format-balance";
import { celoscanTxUrl } from "@/lib/wallet/links";

interface TxConfirmCardSnapshotProps {
  summary: string;
  steps: PreparedTx[];
  recipientLabel?: string;
  hashes: string[];
  confirmedAt?: number;
}

/** Read-only success card pinned in chat history after signing. */
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
    <div className="card-brutal w-full min-w-0 max-w-full p-4">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[2px] border-2 border-[var(--ink)] bg-[var(--success)] text-[var(--ink)]"
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
            <p className="text-sm font-bold text-[var(--ink)]">
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
          <p className="mt-1 break-words text-sm leading-relaxed text-[var(--text-secondary)]">
            {displaySummary}
          </p>
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            Saved to your history. Tap a hash to view details.
          </p>
        </div>
      </div>

      <ol className="mt-3 space-y-1.5 border-t-2 border-[var(--ink)] pt-3">
        {steps.map((step, index) => (
          <li
            key={`${step.description}-${index}`}
            className="flex gap-2 text-sm text-[var(--text-secondary)]"
          >
            <span className="font-bold text-[var(--ink)]">{index + 1}.</span>
            <span className="min-w-0 break-words">
              {formatTransactionStep(step.description, { summary })}
            </span>
          </li>
        ))}
      </ol>

      {hashes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t-2 border-[var(--ink)] pt-3">
          {hashes.map((hash) => (
            <a
              key={hash}
              href={celoscanTxUrl(hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-[2px] border-2 border-[var(--ink)] bg-[var(--success)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--ink)]"
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
