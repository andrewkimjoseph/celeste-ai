"use client";

import { useTxPreflight } from "@/hooks/use-tx-preflight";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { useWalletCapabilities } from "@/hooks/use-wallet-capabilities";
import type { PreparedTx } from "@/lib/prepared-flow";
import type { CarbonOrderDisplay } from "@/lib/carbon-order-display";
import { CarbonOrderSummary } from "@/components/carbon-order-summary";
import { parseSendSummary } from "@/lib/send-preflight";
import { formatFlowSummary, formatWalletError } from "@/lib/wallet-error";
import { formatTransactionStep } from "@/lib/transaction-display";
import { useState } from "react";
import { useAccount, usePublicClient, useSendTransaction } from "wagmi";

type CardStatus = "idle" | "signing" | "done" | "error";

interface TxConfirmCardProps {
  summary: string;
  steps: PreparedTx[];
  recipientLabel?: string;
  warnings?: string[];
  deepLink?: string;
  carbonDetails?: CarbonOrderDisplay;
  onComplete: (hashes: string[]) => void;
  onDismiss: () => void;
}

const CARD_COPY: Record<
  CardStatus,
  { title: string; hint: string; icon: "ready" | "wallet" | "cancelled" }
> = {
  idle: {
    title: "Ready to confirm",
    hint: "Tap Confirm below — your wallet will open to approve.",
    icon: "ready",
  },
  signing: {
    title: "Waiting for wallet",
    hint: "Approve or reject the transaction in your wallet app.",
    icon: "wallet",
  },
  done: {
    title: "Transaction sent",
    hint: "Your transaction was submitted successfully.",
    icon: "ready",
  },
  error: {
    title: "Not sent",
    hint: "Nothing was submitted on-chain.",
    icon: "cancelled",
  },
};

function CardIcon({ variant }: { variant: "ready" | "wallet" | "cancelled" }) {
  if (variant === "cancelled") {
    return (
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
          d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
        />
      </svg>
    );
  }

  if (variant === "wallet") {
    return (
      <svg
        className="size-5 animate-pulse"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"
        />
      </svg>
    );
  }

  return (
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
  );
}

export function TxConfirmCard({
  summary,
  steps,
  recipientLabel,
  warnings,
  deepLink,
  carbonDetails,
  onComplete,
  onDismiss,
}: TxConfirmCardProps) {
  const [status, setStatus] = useState<CardStatus>("idle");
  const [signingStepIndex, setSigningStepIndex] = useState(0);
  const [errorDisplay, setErrorDisplay] = useState<ReturnType<
    typeof formatWalletError
  > | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();
  const preflight = useTxPreflight(address, summary);
  const { data: walletBalances } = useWalletBalances(address);
  const { supportsFeeAbstraction } = useWalletCapabilities();
  const isSendFlow = parseSendSummary(summary) !== null;
  const celoBalance = Number(walletBalances?.celo?.formatted ?? 0);
  const insufficientGas =
    !supportsFeeAbstraction && !isSendFlow && celoBalance <= 0;
  const invalidCarbonBudget = carbonDetails?.budgetValid === false;
  const preflightBlocked =
    isSendFlow &&
    preflight.status === "ready" &&
    !preflight.data.ok;
  const celoSendBlocked =
    preflightBlocked &&
    preflight.status === "ready" &&
    preflight.data.blocksCeloSend === true;

  const copy = CARD_COPY[status];
  const displaySummary = formatFlowSummary(summary, recipientLabel);
  const isBusy = status === "signing" || status === "done";
  const confirmDisabled =
    isBusy ||
    preflightBlocked ||
    insufficientGas ||
    invalidCarbonBudget ||
    (isSendFlow && preflight.status === "loading");

  const cardTitle =
    invalidCarbonBudget
      ? "Invalid order amount"
      : insufficientGas
        ? "Insufficient CELO for gas"
        : celoSendBlocked
          ? "CELO sends not supported"
          : preflightBlocked && preflight.status === "ready"
            ? "Insufficient balance"
            : copy.title;

  const iconStyles =
    status === "error"
      ? "bg-red-500/15 text-red-300"
      : status === "signing"
        ? "bg-amber-500/25 text-amber-200"
        : "bg-amber-500/20 text-amber-300";

  const borderStyles =
    status === "error"
      ? "border-red-500/25"
      : "border-amber-500/30";

  async function handleConfirm() {
    if (!publicClient) {
      setErrorDisplay({
        title: "Wallet unavailable",
        message: "Reconnect your wallet, then tap Confirm below.",
      });
      setStatus("error");
      return;
    }

    setStatus("signing");
    setSigningStepIndex(0);
    setErrorDisplay(null);
    setShowTechnicalDetails(false);
    const hashes: string[] = [];

    try {
      for (let index = 0; index < steps.length; index++) {
        setSigningStepIndex(index);
        const step = steps[index]!;
        const hash = await sendTransactionAsync({
          to: step.to,
          data: step.data,
          value: step.value ? BigInt(step.value) : undefined,
        });
        hashes.push(hash);
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setStatus("done");
      onComplete(hashes);
    } catch (err) {
      setStatus("error");
      setErrorDisplay(formatWalletError(err));
    }
  }

  return (
    <div
      className={`rounded-xl border bg-gradient-to-b from-[var(--warn)]/10 to-[var(--surface-1)] p-4 shadow-sm ${borderStyles}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${iconStyles}`}
          aria-hidden
        >
          <CardIcon variant={copy.icon} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-50">{cardTitle}</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-300">
            {displaySummary}
          </p>
          {carbonDetails && <CarbonOrderSummary details={carbonDetails} />}
          <p className="mt-1.5 text-xs text-zinc-500">
            {status === "signing" && steps.length > 1
              ? `Step ${signingStepIndex + 1} of ${steps.length} — approve in your wallet.`
              : copy.hint}
          </p>
        </div>
      </div>

      {warnings && warnings.length > 0 && (
        <div
          className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5"
          role="status"
        >
          <p className="text-xs font-medium text-amber-100">Carbon warnings</p>
          <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs text-amber-100/90">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {deepLink && (
        <p className="mt-3">
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-amber-300 underline-offset-2 hover:text-amber-200 hover:underline"
          >
            View on Carbon
          </a>
        </p>
      )}

      {isSendFlow &&
        (preflight.status === "loading" || preflightBlocked) && (
          <div className="mt-3 border-t border-[var(--warn)]/15 pt-3">
            {preflight.status === "loading" && (
              <p className="flex items-center gap-2 text-xs text-zinc-400">
                <span
                  className="inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-zinc-500 border-t-[var(--accent-hover)]"
                  aria-hidden
                />
                Checking your balance…
              </p>
            )}
            {preflightBlocked && preflight.status === "ready" && (
              <p className="text-xs text-amber-200/90" role="alert">
                {preflight.data.message}
              </p>
            )}
          </div>
        )}

      {!isSendFlow && (insufficientGas || invalidCarbonBudget) && (
        <div className="mt-3 border-t border-[var(--warn)]/15 pt-3">
          {insufficientGas && (
            <p className="text-xs text-amber-200/90" role="alert">
              You need a small CELO balance to pay network fees. Add CELO to your
              wallet, then try again.
            </p>
          )}
          {invalidCarbonBudget && (
            <p
              className={`text-xs text-amber-200/90${insufficientGas ? " mt-1.5" : ""}`}
              role="alert"
            >
              This order has no spend amount. Ask Celeste to prepare again with
              how much you want to use (e.g. 50 USDT).
            </p>
          )}
        </div>
      )}

      <ol className="mt-3 space-y-1.5 border-t border-[var(--warn)]/15 pt-3">
        {steps.map((step, index) => (
          <li
            key={`${step.description}-${index}`}
            className="flex gap-2 text-sm text-zinc-400"
          >
            <span className="font-medium text-zinc-500">{index + 1}.</span>
            <span>{formatTransactionStep(step.description, { carbonDetails, summary })}</span>
          </li>
        ))}
      </ol>

      {errorDisplay && (
        <div
          className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5"
          role="alert"
        >
          <p className="text-sm font-medium text-red-200">{errorDisplay.title}</p>
          <p className="mt-0.5 text-sm text-red-100/90">{errorDisplay.message}</p>
          {errorDisplay.technicalDetails && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails((open) => !open)}
                className="text-xs text-red-200/80 underline-offset-2 hover:text-red-100 hover:underline"
              >
                {showTechnicalDetails ? "Hide details" : "Show technical details"}
              </button>
              {showTechnicalDetails && (
                <pre className="mt-1.5 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded bg-black/20 p-2 text-[10px] leading-snug text-red-200/70">
                  {errorDisplay.technicalDetails}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={confirmDisabled}
          onClick={() => void handleConfirm()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          {status === "signing" ? "Waiting for wallet…" : "Confirm"}
        </button>
        <button
          type="button"
          disabled={status === "signing"}
          onClick={onDismiss}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
