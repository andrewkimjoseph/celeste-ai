import { isExpectedToolError } from "@/lib/tx/format-tool-error";

export type ToolErrorTone = "notice" | "error";

const NOTICE_PATTERNS: RegExp[] = [
  /no swap route for/i,
  /no mento fx route/i,
  /no uniswap v4 route/i,
  /insufficient liquidity in uniswap v4 pools/i,
  /mento fx market is currently closed/i,
  /no route for/i,
  /no supplied .+ balance to withdraw/i,
  /could not resolve ens/i,
  /ens name could not be resolved/i,
  /block not found/i,
  /transaction not found/i,
  /not found on celo/i,
  /is not supported on aave/i,
  /token .+ is not supported/i,
  /unknown token/i,
  /did you mean/i,
  /insufficient .+ balance/i,
];

/** Expected or informational tool outcomes — not system failures. */
export function getToolErrorTone(
  errorText: string,
  toolName?: string,
): ToolErrorTone {
  const text = errorText.trim();
  if (!text) {
    return "error";
  }

  if (toolName && isExpectedToolError(toolName, text)) {
    return "notice";
  }

  if (NOTICE_PATTERNS.some((pattern) => pattern.test(text))) {
    return "notice";
  }

  return "error";
}

export const TOOL_ERROR_TONE_CLASS: Record<ToolErrorTone, string> = {
  notice:
    "border-2 border-[var(--ink)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-secondary)] rounded-[2px]",
  error:
    "rounded-[2px] border-2 border-[var(--ink)] bg-[var(--warn)] px-3 py-2 text-xs font-semibold text-white",
};
