import { formatHumanFlowText } from "@/lib/tx/format-human-flow-text";

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

type FormatStepOptions = {
  summary?: string;
};

export function formatTransactionStep(
  step: string,
  _options?: FormatStepOptions,
): string {
  const withSymbols = step.replace(HEX_ADDRESS, (address) => {
    return TOKEN_ADDRESS_SYMBOLS[address.toLowerCase()] ?? address;
  });
  return formatHumanFlowText(withSymbols);
}

export function formatProtocolLabel(summary: string): string {
  const lower = summary.toLowerCase();

  if (lower.includes("aave")) {
    return "Aave";
  }
  if (lower.includes("gooddollar") || /\bg\$/.test(lower)) {
    return "GoodDollar";
  }
  if (lower.includes("mento") || lower.includes("eurm")) {
    return "Mento FX";
  }
  if (lower.includes("uniswap")) {
    return "Uniswap";
  }
  if (lower.startsWith("send ")) {
    return "Send";
  }
  if (lower.includes("swap") || lower.includes("quote")) {
    return "Swap";
  }

  return "Transaction";
}

export function getTransactionProtocolLabel(summary: string): string | null {
  if (/uniswap v4/i.test(summary)) {
    return "Uniswap v4";
  }
  if (/mento fx/i.test(summary)) {
    return "Mento FX";
  }
  if (/aave/i.test(summary)) {
    return "Aave";
  }
  if (/gooddollar/i.test(summary) || /\bg\$/i.test(summary)) {
    return "GoodDollar";
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
