import type { PromptGroup } from "@/lib/analytics/events";
import type { WalletBalancesResponse } from "@/lib/balances";
import { formatBalanceShort } from "@/lib/format-balance";

export type LandingPrompt = { text: string; group: PromptGroup };

export type LandingPromptGroup = {
  label: string;
  prompts: LandingPrompt[];
};

export type LandingPromptPlan = {
  primary: LandingPrompt[];
  more: LandingPromptGroup[];
};

const STABLE_SYMBOLS = ["USDC", "USDT", "USDm"] as const;
const EARN_SYMBOLS = ["USDT", "USDC", "USDm"] as const;
const GOODDOLLAR_SYMBOLS = new Set(["GoodDollar", "G$"]);

const STATIC_MORE_GROUPS: Array<{ label: string; group: PromptGroup; prompts: string[] }> = [
  {
    label: "Send",
    group: "Send",
    prompts: [
      "Send 5 USDm to andrewkimjoseph.celo.eth",
      "Send 1 USDC to andrewkimjoseph.celo.eth",
    ],
  },
  {
    label: "Swap / convert",
    group: "Swap",
    prompts: [
      "Swap 10 USDm to CELO",
      "Get a quote to swap CELO to USDC",
      "Convert 50 USDm to EURm",
      "Convert 20 EURm to USDC",
    ],
  },
  {
    label: "Earn",
    group: "Earn",
    prompts: [
      "Save 10 USDT to Aave",
      "Withdraw my entire Aave savings",
      "Check my Aave balances",
    ],
  },
  {
    label: "GoodDollar",
    group: "GoodDollar",
    prompts: [
      "Claim my GoodDollar UBI",
      "Check my GoodDollar status",
      "How much G$ do I need to get 0.6 USDm?",
    ],
  },
];

const PRIMARY_BACKFILL: LandingPrompt[] = [
  { text: "Send 5 USDm to andrewkimjoseph.celo.eth", group: "Send" },
  { text: "Get a quote to swap CELO to USDC", group: "Swap" },
  { text: "Claim my GoodDollar UBI", group: "GoodDollar" },
  { text: "Check my Aave balances", group: "Earn" },
];

function parseBalance(value: string): number {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function isNonZero(raw: string): boolean {
  return raw !== "0" && raw !== "0n";
}

function largestStable(
  tokens: WalletBalancesResponse["tokens"],
): (typeof STABLE_SYMBOLS)[number] | null {
  let best: (typeof STABLE_SYMBOLS)[number] | null = null;
  let bestAmount = 0;

  for (const symbol of STABLE_SYMBOLS) {
    const row = tokens.find((token) => token.symbol === symbol);
    if (!row || !isNonZero(row.raw)) {
      continue;
    }
    const amount = parseBalance(row.formatted);
    if (amount > bestAmount) {
      bestAmount = amount;
      best = symbol;
    }
  }

  return best;
}

function hasGoodDollarBalance(tokens: WalletBalancesResponse["tokens"]): boolean {
  return tokens.some(
    (token) => GOODDOLLAR_SYMBOLS.has(token.symbol) && isNonZero(token.raw),
  );
}

function earnSymbol(
  tokens: WalletBalancesResponse["tokens"],
): string | null {
  for (const symbol of EARN_SYMBOLS) {
    const row = tokens.find((token) => token.symbol === symbol);
    if (row && isNonZero(row.raw)) {
      return symbol;
    }
  }
  return null;
}

function buildPrimaryFromBalances(
  balances: WalletBalancesResponse,
): LandingPrompt[] {
  const primary: LandingPrompt[] = [];
  const stable = largestStable(balances.tokens);
  const celoBalance = parseBalance(balances.celo.formatted);
  const hasCelo = celoBalance > 0;

  if (stable) {
    primary.push({
      text: `Send 1 ${stable} to andrewkimjoseph.celo.eth`,
      group: "Send",
    });
  }

  if (stable && hasCelo) {
    primary.push({
      text: `Swap 10 ${stable} to CELO`,
      group: "Swap",
    });
  } else {
    primary.push({
      text: "Get a quote to swap CELO to USDC",
      group: "Swap",
    });
  }

  if (hasGoodDollarBalance(balances.tokens)) {
    primary.push({
      text: "How much G$ do I need to get 0.6 USDm?",
      group: "GoodDollar",
    });
  } else {
    primary.push({
      text: "Claim my GoodDollar UBI",
      group: "GoodDollar",
    });
  }

  const earn = earnSymbol(balances.tokens);
  if (earn) {
    primary.push({
      text: `Save 10 ${earn} to Aave`,
      group: "Earn",
    });
  } else {
    primary.push({
      text: "Check my Aave balances",
      group: "Earn",
    });
  }

  return primary.slice(0, 4);
}

function dedupePrimary(primary: LandingPrompt[]): LandingPrompt[] {
  const seen = new Set<string>();
  const result: LandingPrompt[] = [];

  for (const prompt of primary) {
    if (seen.has(prompt.text)) {
      continue;
    }
    seen.add(prompt.text);
    result.push(prompt);
  }

  return result;
}

function backfillPrimary(primary: LandingPrompt[]): LandingPrompt[] {
  const seen = new Set(primary.map((prompt) => prompt.text));
  const result = [...primary];

  for (const candidate of PRIMARY_BACKFILL) {
    if (result.length >= 4) {
      break;
    }
    if (seen.has(candidate.text)) {
      continue;
    }
    seen.add(candidate.text);
    result.push(candidate);
  }

  return result.slice(0, 4);
}

function shouldIncludeSendPrompt(text: string, blocksCeloSend: boolean): boolean {
  if (!blocksCeloSend) {
    return true;
  }
  return !/^Send .* CELO to /i.test(text);
}

export function buildLandingPrompts(
  balances?: WalletBalancesResponse,
  options?: { blocksCeloSend?: boolean },
): LandingPromptPlan {
  const blocksCeloSend = options?.blocksCeloSend === true;
  const primary = backfillPrimary(
    dedupePrimary(
      balances ? buildPrimaryFromBalances(balances) : [...PRIMARY_BACKFILL],
    ),
  );
  const primaryTexts = new Set(primary.map((prompt) => prompt.text));

  const more = STATIC_MORE_GROUPS.map((group) => ({
    label: group.label,
    prompts: group.prompts
      .filter((text) => !primaryTexts.has(text))
      .filter((text) => shouldIncludeSendPrompt(text, blocksCeloSend))
      .map((text) => ({ text, group: group.group })),
  })).filter((group) => group.prompts.length > 0);

  return { primary, more };
}

export function formatLandingBalanceLine(
  balances?: WalletBalancesResponse,
): string | null {
  if (!balances) {
    return null;
  }

  const celo = parseBalance(balances.celo.formatted);
  const tokenCount = balances.totalNonZero;

  if (celo <= 0 && tokenCount === 0) {
    return null;
  }

  const celoPart =
    celo > 0 ? `${formatBalanceShort(balances.celo.formatted)} CELO` : null;
  const tokenPart =
    tokenCount > 0
      ? `${tokenCount} token${tokenCount === 1 ? "" : "s"}`
      : null;

  const holdings = [celoPart, tokenPart].filter(Boolean).join(" and ");
  if (!holdings) {
    return null;
  }

  return `You have ${holdings} — try a swap or send below.`;
}
