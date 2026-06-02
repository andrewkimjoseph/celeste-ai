import { formatHumanFlowText } from "@/lib/format-human-flow-text";
import type { CarbonOrderDisplay } from "@/lib/carbon-order-display";

/** Known Celo mainnet token addresses → registry symbols for step label cleanup. */
const TOKEN_ADDRESS_SYMBOLS: Record<string, string> = {
  "0x62b8b11039fcf5ab0c56e502b1c372a3d2a9c7a": "GoodDollar",
  "0x471ece3750da237f93b8e339c536989b8978a438": "CELO",
  "0xceba9300f2b948710d2653dd7b07f33a8b32118c": "USDC",
  "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e": "USDT",
  "0x765de816845861e75a25fca122bb6898b8b1282a": "USDm",
  "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73": "EURm",
  "0xd221812de1bd094f35587ee8e174b07b6167d9af": "WETH",
};

const HEX_ADDRESS = /\b0x[a-fA-F0-9]{40}\b/g;
const GENERIC_CARBON_STEP = /^Carbon transaction step \d+$/;

export type FormatTransactionStepOptions = {
  carbonDetails?: CarbonOrderDisplay;
  summary?: string;
};

function carbonStepFallback(
  step: string,
  carbonDetails: CarbonOrderDisplay,
): string {
  const direction = carbonDetails.direction === "sell" ? "sell" : "buy";
  const orderType = carbonDetails.orderType.toLowerCase();

  if (orderType.includes("limit")) {
    return carbonDetails.budget
      ? `Create limit ${direction} — ${carbonDetails.budget} on ${carbonDetails.pairLabel}`
      : `Create limit ${direction} on ${carbonDetails.pairLabel}`;
  }

  if (orderType.includes("recurring")) {
    return carbonDetails.budget
      ? `Create recurring strategy — ${carbonDetails.budget} on ${carbonDetails.pairLabel}`
      : `Create recurring strategy — ${carbonDetails.pairLabel}`;
  }

  if (orderType.includes("discount") || orderType.includes("concentrated")) {
    return carbonDetails.budget
      ? `Create concentrated strategy — ${carbonDetails.budget} on ${carbonDetails.pairLabel}`
      : `Create concentrated strategy — ${carbonDetails.pairLabel}`;
  }

  return carbonDetails.budget
    ? `Create Carbon ${direction} — ${carbonDetails.budget} on ${carbonDetails.pairLabel}`
    : `Create Carbon ${direction} on ${carbonDetails.pairLabel}`;
}

function carbonSummaryFallback(step: string, summary: string): string | null {
  if (!GENERIC_CARBON_STEP.test(step) || !/^Carbon /i.test(summary)) {
    return null;
  }

  const normalized = summary.toLowerCase();
  if (normalized.includes("deposit budget")) return "Deposit to Carbon strategy";
  if (normalized.includes("withdraw budget")) return "Withdraw from Carbon strategy";
  if (normalized.includes("reprice strategy")) return "Reprice Carbon strategy";
  if (normalized.includes("edit strategy")) return "Edit Carbon strategy";
  if (normalized.includes("pause strategy")) return "Pause Carbon strategy";
  if (normalized.includes("resume strategy")) return "Resume Carbon strategy";
  if (normalized.includes("delete strategy")) return "Close Carbon strategy";
  if (normalized.includes("taker swap")) return "Swap via Carbon DeFi";
  if (normalized.includes("limit order")) return "Create Carbon limit order";
  if (normalized.includes("recurring strategy")) return "Create Carbon recurring strategy";
  return "Create Carbon strategy";
}

export function formatTransactionStep(
  step: string,
  options: FormatTransactionStepOptions = {},
): string {
  if (GENERIC_CARBON_STEP.test(step)) {
    if (options.carbonDetails) {
      return carbonStepFallback(step, options.carbonDetails);
    }
    const fromSummary = options.summary
      ? carbonSummaryFallback(step, options.summary)
      : null;
    if (fromSummary) {
      return fromSummary;
    }
  }

  const withSymbols = step.replace(HEX_ADDRESS, (address) => {
    return TOKEN_ADDRESS_SYMBOLS[address.toLowerCase()] ?? address;
  });
  return formatHumanFlowText(withSymbols);
}

export function getTransactionProtocolLabel(
  summary: string,
): string | null {
  if (/uniswap v4/i.test(summary)) {
    return "Uniswap v4";
  }
  if (/mento fx/i.test(summary)) {
    return "Mento FX";
  }
  if (/aave/i.test(summary)) {
    return "Aave";
  }
  if (/^carbon /i.test(summary)) {
    return "Carbon";
  }
  if (/^send /i.test(summary)) {
    return "Send";
  }
  return null;
}

export function pairTransactionStepsWithHashes(
  steps: string[],
  hashes: string[],
): Array<{ step: string; hash?: string }> {
  if (steps.length === 0) {
    return hashes.map((hash) => ({ step: "Transaction", hash }));
  }

  if (steps.length === hashes.length) {
    return steps.map((step, index) => ({
      step,
      hash: hashes[index],
    }));
  }

  return steps.map((step, index) => ({
    step,
    hash: index === steps.length - 1 ? hashes[hashes.length - 1] : undefined,
  }));
}
