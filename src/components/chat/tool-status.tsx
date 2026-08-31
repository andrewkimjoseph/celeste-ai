"use client";

import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { BalanceCard } from "@/components/balance-card";
import { getToolLabels } from "@/components/chat/tool-labels";
import {
  getToolErrorTone,
  TOOL_ERROR_TONE_CLASS,
} from "@/components/chat/tool-error-tone";
import { formatToolErrorMessage } from "@/lib/tx/format-tool-error";
import { parseToolBalanceRows } from "@/lib/wallet/balances";
import { formatHumanFlowText } from "@/lib/tx/format-human-flow-text";

type ToolPart = UIMessage["parts"][number];

const PREPARE_TOOL_PREFIX = "prepare_";
const BALANCE_TOOLS = new Set([
  "get_stablecoin_balances",
  "get_celo_balances",
  "get_token_balance",
  "get_account",
]);

function formatQuoteToken(symbol: string): string {
  if (symbol === "GoodDollar") {
    return "G$";
  }
  return symbol;
}

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

  const tokenIn = formatQuoteToken(quote.tokenIn);
  const tokenOut = formatQuoteToken(quote.tokenOut);

  const via =
    quote.protocol === "uniswap_v4"
      ? " via Uniswap"
      : quote.protocol === "mento_fx"
        ? " via Mento"
        : "";

  return formatHumanFlowText(
    `${quote.amountIn} ${tokenIn} → ${amountOut} ${tokenOut}${via}`,
  );
}

function formatEstimateSendNotice(output: unknown): string | null {
  if (typeof output !== "object" || output === null) {
    return null;
  }

  const result = output as {
    insufficientBalance?: boolean;
    message?: string;
  };

  if (result.insufficientBalance !== true) {
    return null;
  }

  return (
    result.message?.trim() ||
    "Insufficient balance — gas cannot be estimated without sufficient tokens."
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
      <div className="flex items-center gap-2 rounded-[2px] border-2 border-[var(--ink)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-secondary)]">
        <span
          className="inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-[var(--ink)] border-t-[var(--accent)]"
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
      <p className={`${TOOL_ERROR_TONE_CLASS[tone]} break-words`}>{errorText}</p>
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
      toolName === "get_uniswap_quote" ||
      toolName === "get_gooddollar_reserve_quote"
        ? formatSwapQuote(part.output)
        : null;

    const governanceSummary =
      toolName === "get_governance_proposals"
        ? formatGovernanceSummary(part.output)
        : null;

    const estimateSendNotice =
      toolName === "estimate_send"
        ? formatEstimateSendNotice(part.output)
        : null;

    const detailSummary = swapQuoteSummary ?? governanceSummary;

    if (estimateSendNotice) {
      return (
        <p className={TOOL_ERROR_TONE_CLASS.notice}>{estimateSendNotice}</p>
      );
    }

    return (
      <div className="space-y-2">
        <div className="min-w-0 space-y-2">
          <div className="inline-flex w-fit max-w-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[2px] border-2 border-[var(--ink)] bg-[var(--success)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
            <span aria-hidden>
              ✓
            </span>
            {labels.done}
          </div>
          {detailSummary ? (
            <p className="text-[11px] leading-snug text-[var(--text-secondary)] break-words">
              {detailSummary}
            </p>
          ) : null}
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
