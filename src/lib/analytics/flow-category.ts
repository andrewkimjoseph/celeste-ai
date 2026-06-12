import type { FlowCategory } from "@/lib/analytics/events";
import { parseSendSummary } from "@/lib/send-preflight";

type InferFlowCategoryOptions = {
  toolName?: string;
};

export function inferFlowCategory(
  summary: string,
  options?: InferFlowCategoryOptions,
): FlowCategory {
  const toolName = options?.toolName?.toLowerCase() ?? "";

  if (toolName.startsWith("prepare_aave_")) {
    return "aave";
  }
  if (
    toolName.startsWith("prepare_mento_fx") ||
    toolName === "prepare_mento_fx"
  ) {
    return "mento_fx";
  }
  if (
    toolName.startsWith("prepare_gooddollar") ||
    toolName.includes("gooddollar")
  ) {
    return "gooddollar";
  }
  if (parseSendSummary(summary)) {
    return "send";
  }

  const lower = summary.toLowerCase();

  if (lower.includes("aave")) {
    return "aave";
  }
  if (lower.includes("gooddollar") || /\bg\$/.test(lower)) {
    return "gooddollar";
  }
  if (lower.includes("mento") || lower.includes("eurm")) {
    return "mento_fx";
  }
  if (lower.startsWith("send ")) {
    return "send";
  }
  if (lower.includes("swap") || lower.includes("quote")) {
    return "swap";
  }

  return "other";
}
