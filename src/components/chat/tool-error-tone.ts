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
];

/** Expected or informational tool outcomes — not system failures. */
export function getToolErrorTone(errorText: string): ToolErrorTone {
  const text = errorText.trim();
  if (!text) {
    return "error";
  }

  if (NOTICE_PATTERNS.some((pattern) => pattern.test(text))) {
    return "notice";
  }

  return "error";
}

export const TOOL_ERROR_TONE_CLASS: Record<ToolErrorTone, string> = {
  notice:
    "rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-zinc-300",
  error:
    "rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300",
};
