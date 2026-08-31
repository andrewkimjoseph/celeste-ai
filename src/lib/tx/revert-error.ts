import type { PreparedTx } from "@/lib/tx/prepared-flow";
import type { WalletErrorDisplay } from "@/lib/tx/wallet-error";

/** Friendly copy when a broadcast transaction reverts on-chain. */
export function formatRevertedStepError(
  step: PreparedTx,
  hash: string,
): WalletErrorDisplay {
  const lower = step.description.toLowerCase();
  const supplyMatch = step.description.match(/Supply\s+[\d.]+\s+(\S+)/i);
  const token = supplyMatch?.[1];

  let message =
    "This transaction didn't complete. You may still have paid network fees.";

  if (lower.includes("supply") && token) {
    message = `Not enough ${token} after network fees. Try a slightly smaller amount.`;
  } else if (lower.includes("send")) {
    message =
      "Not enough balance after network fees. Try a slightly smaller amount.";
  }

  return {
    title: "Transaction failed",
    message,
    technicalDetails: `Transaction reverted: ${hash} (${step.description})`,
    retryable: false,
  };
}
