"use client";

import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { getToolLabels } from "@/components/chat/tool-labels";

function formatBalanceSummary(output: unknown): string | null {
  if (typeof output !== "object" || output === null || !("balances" in output)) {
    return null;
  }

  const balances = (output as { balances?: unknown }).balances;
  if (!Array.isArray(balances)) {
    return null;
  }

  const nonZero = balances
    .filter(
      (entry): entry is { symbol: string; formatted: string } =>
        typeof entry === "object" &&
        entry !== null &&
        "symbol" in entry &&
        "formatted" in entry &&
        typeof (entry as { formatted: unknown }).formatted === "string" &&
        (entry as { formatted: string }).formatted !== "0",
    )
    .slice(0, 4)
    .map((entry) => `${entry.symbol}: ${entry.formatted}`);

  if (nonZero.length === 0) {
    return "All scanned balances are zero.";
  }

  return nonZero.join(" · ");
}

type ToolPart = UIMessage["parts"][number];

const PREPARE_TOOL_PREFIX = "prepare_";

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

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
        <span
          className="inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-zinc-500 border-t-emerald-400"
          aria-hidden
        />
        <span>{labels.inProgress}</span>
      </div>
    );
  }

  if (part.state === "output-error") {
    return (
      <p className="mt-1 text-xs text-red-400">
        {part.errorText ?? `${labels.done} failed`}
      </p>
    );
  }

  if (part.state === "output-available") {
    if (hidePrepareDone && toolName.startsWith(PREPARE_TOOL_PREFIX)) {
      return null;
    }

    const summary =
      toolName === "get_stablecoin_balances" || toolName === "get_celo_balances"
        ? formatBalanceSummary(part.output)
        : null;

    return (
      <div className="mt-1 text-xs text-zinc-400">
        <p className="flex items-center gap-1.5">
          <span className="text-emerald-400" aria-hidden>
            ✓
          </span>
          {labels.done}
        </p>
        {summary && <p className="mt-0.5 text-zinc-500">{summary}</p>}
      </div>
    );
  }

  return null;
}
