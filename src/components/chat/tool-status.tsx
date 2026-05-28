"use client";

import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { BalanceCard } from "@/components/balance-card";
import { getToolLabels } from "@/components/chat/tool-labels";
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

function formatMentoQuote(output: unknown): string | null {
  if (typeof output !== "object" || output === null) {
    return null;
  }

  const quote = output as {
    tokenIn?: string;
    tokenOut?: string;
    amountIn?: string;
    amountOut?: string;
  };

  if (!quote.tokenIn || !quote.tokenOut || !quote.amountIn || !quote.amountOut) {
    return null;
  }

  return formatHumanFlowText(
    `${quote.amountIn} ${quote.tokenIn} → ${quote.amountOut} ${quote.tokenOut}`,
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
    return (
      <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
        {part.errorText ?? `${labels.done} failed`}
      </p>
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

    const mentoSummary =
      toolName === "get_mento_fx_quote"
        ? formatMentoQuote(part.output)
        : null;

    const governanceSummary =
      toolName === "get_governance_proposals"
        ? formatGovernanceSummary(part.output)
        : null;

    return (
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200/90">
          <span className="text-emerald-400" aria-hidden>
            ✓
          </span>
          {labels.done}
          {mentoSummary && (
            <span className="text-emerald-100/80">· {mentoSummary}</span>
          )}
          {governanceSummary && (
            <span className="text-emerald-100/80">· {governanceSummary}</span>
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
