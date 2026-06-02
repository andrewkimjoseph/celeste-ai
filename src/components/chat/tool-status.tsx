"use client";

import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { BalanceCard } from "@/components/balance-card";
import { getToolLabels } from "@/components/chat/tool-labels";
import {
  getToolErrorTone,
  TOOL_ERROR_TONE_CLASS,
} from "@/components/chat/tool-error-tone";
import { formatToolErrorMessage } from "@/lib/format-tool-error";
import { parseToolBalanceRows } from "@/lib/balances";
import { formatHumanFlowText } from "@/lib/format-human-flow-text";

type ToolPart = UIMessage["parts"][number];

const PREPARE_TOOL_PREFIX = "prepare_";
const BALANCE_TOOLS = new Set([
  "get_stablecoin_balances",
  "get_celo_balances",
  "get_token_balance",
  "get_account",
]);

function formatSwapQuote(output: unknown): string | null {
  if (typeof output !== "object" || output === null) {
    return null;
  }

  const quote = output as {
    tokenIn?: string;
    tokenOut?: string;
    amountIn?: string;
    amountOut?: string;
    expectedOut?: string;
    protocol?: string;
  };

  const amountOut = quote.expectedOut ?? quote.amountOut;
  if (!quote.tokenIn || !quote.tokenOut || !quote.amountIn || !amountOut) {
    return null;
  }

  const via =
    quote.protocol === "uniswap_v4"
      ? " via Uniswap"
      : quote.protocol === "mento_fx"
        ? " via Mento"
        : "";

  return formatHumanFlowText(
    `${quote.amountIn} ${quote.tokenIn} → ${amountOut} ${quote.tokenOut}${via}`,
  );
}

function formatGovernanceSummary(output: unknown): string | null {
  if (typeof output !== "object" || output === null || !("proposals" in output)) {
    return null;
  }

  const proposals = (output as { proposals?: unknown }).proposals;
  if (!Array.isArray(proposals)) {
    return null;
  }

  return `${proposals.length} proposal${proposals.length === 1 ? "" : "s"} loaded`;
}

interface ToolStatusProps {
  part: ToolPart;
  hidePrepareDone?: boolean;
}

export function ToolStatus({
  part,
  hidePrepareDone = false,
}: ToolStatusProps) {
  if (!isToolUIPart(part)) {
    return null;
  }

  const toolName = getToolName(part);
  const labels = getToolLabels(toolName);

  if (
    hidePrepareDone &&
    toolName.startsWith(PREPARE_TOOL_PREFIX) &&
    (part.state === "output-available" || part.state === "output-error")
  ) {
    return null;
  }

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-xs text-zinc-400">
        <span
          className="inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-zinc-600 border-t-[var(--accent-hover)]"
          aria-hidden
        />
        <span>{labels.inProgress}</span>
      </div>
    );
  }

  if (part.state === "output-error") {
    const rawError = part.errorText ?? `${labels.done} failed`;
    const errorText = formatToolErrorMessage(toolName, rawError);
    const tone = getToolErrorTone(rawError, toolName);

    return (
      <p className={TOOL_ERROR_TONE_CLASS[tone]}>{errorText}</p>
    );
  }

  if (part.state === "output-available") {
    const balanceRows = BALANCE_TOOLS.has(toolName)
      ? parseToolBalanceRows(toolName, part.output)
      : [];

    const celoRow =
      toolName === "get_celo_balances"
        ? balanceRows.find((row) => row.symbol === "CELO")
        : toolName === "get_account"
          ? balanceRows[0]
          : undefined;

    const tokenRows =
      toolName === "get_celo_balances"
        ? balanceRows.filter((row) => row.symbol !== "CELO")
        : toolName === "get_account"
          ? []
          : balanceRows;

    const swapQuoteSummary =
      toolName === "get_swap_quote" ||
      toolName === "get_mento_fx_quote" ||
      toolName === "get_uniswap_quote"
        ? formatSwapQuote(part.output)
        : null;

    const governanceSummary =
      toolName === "get_governance_proposals"
        ? formatGovernanceSummary(part.output)
        : null;

    return (
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-soft-border)] bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-soft-text)]">
          <span className="text-[var(--accent-hover)]" aria-hidden>
            ✓
          </span>
          {labels.done}
          {swapQuoteSummary && (
            <span className="text-[var(--accent-soft-text)]/80">· {swapQuoteSummary}</span>
          )}
          {governanceSummary && (
            <span className="text-[var(--accent-soft-text)]/80">· {governanceSummary}</span>
          )}
        </div>

        {balanceRows.length > 0 && (
          <BalanceCard
            rows={tokenRows}
            celo={
              celoRow
                ? { formatted: celoRow.formatted }
                : undefined
            }
            compact
            showZeroBalances={toolName === "get_stablecoin_balances"}
          />
        )}
      </div>
    );
  }

  return null;
}
