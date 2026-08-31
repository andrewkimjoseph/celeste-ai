/** User-facing copy for known tool failures — replaces cold API error strings. */

import {
  isTruncatedTransactionHash,
  TRUNCATED_TX_HASH_MESSAGE,
} from "@/lib/tx/transaction-hash";

export function formatToolErrorMessage(
  toolName: string,
  errorText: string,
): string {
  const text = errorText.trim();
  if (!text) {
    return "Something went wrong. Please try again.";
  }

  if (
    toolName === "get_transaction" &&
    (text.includes("Invalid input for tool get_transaction") ||
      text.includes('"path": [ "hash" ]') ||
      isTruncatedTransactionHash(text))
  ) {
    return TRUNCATED_TX_HASH_MESSAGE;
  }

  return text;
}

/** Whether a tool error is an expected limitation, not a system failure. */
export function isExpectedToolError(
  _toolName: string,
  _errorText: string,
): boolean {
  return false;
}
