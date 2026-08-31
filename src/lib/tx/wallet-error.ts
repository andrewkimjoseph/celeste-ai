import { formatHumanFlowText } from "@/lib/tx/format-human-flow-text";

export type WalletErrorDisplay = {
  title: string;
  message: string;
  technicalDetails?: string;
  retryable?: boolean;
};

function truncateForDisplay(text: string, max = 280): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}…`;
}

/** Map wagmi/viem wallet errors to short, user-facing copy. */
export function formatWalletError(error: unknown): WalletErrorDisplay {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Something went wrong. Please try again.";

  const lower = raw.toLowerCase();

  if (
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("rejected the request")
  ) {
    return {
      title: "Transaction cancelled",
      message:
        "You declined the transaction in your wallet. Tap Confirm below to open your wallet again.",
    };
  }

  if (lower.includes("insufficient funds")) {
    return {
      title: "Insufficient balance",
      message:
        "Your wallet does not have enough funds for this transaction, including gas.",
      technicalDetails: truncateForDisplay(raw),
    };
  }

  if (lower.includes("chain mismatch") || lower.includes("wrong network")) {
    return {
      title: "Wrong network",
      message: "Switch your wallet to Celo mainnet, then try again.",
      technicalDetails: truncateForDisplay(raw),
    };
  }

  if (lower.includes("transaction reverted")) {
    return {
      title: "Transaction failed",
      message:
        "This transaction didn't complete. You may still have paid network fees.",
      technicalDetails: raw,
      retryable: false,
    };
  }

  const firstLine = raw.split("\n").find((line) => line.trim().length > 0)?.trim();
  const shortMessage = firstLine?.replace(/^details:\s*/i, "") ?? "Transaction failed.";

  return {
    title: "Transaction failed",
    message: truncateForDisplay(shortMessage, 120),
    technicalDetails: raw,
    retryable: false,
  };
}

const HEX_ADDRESS = /\b0x[a-fA-F0-9]{40}\b/g;
const TRUNCATED_HEX = /\b0x[a-fA-F0-9]{4,6}…[a-fA-F0-9]{4}\b/gi;

/** Shorten long hex addresses inside flow summaries. */
export function formatFlowSummary(
  summary: string,
  recipientLabel?: string,
): string {
  let formatted = summary;

  if (recipientLabel) {
    formatted = formatted
      .replace(HEX_ADDRESS, recipientLabel)
      .replace(TRUNCATED_HEX, recipientLabel);
  }

  return formatHumanFlowText(
    formatted.replace(HEX_ADDRESS, (address) => {
      return `${address.slice(0, 6)}…${address.slice(-4)}`;
    }),
  );
}
