import { describe, expect, it } from "vitest";
import type { WalletBalancesResponse } from "@/lib/balances";
import {
  buildLandingPrompts,
  formatLandingBalanceLine,
} from "@/lib/landing-prompts";
import { formatBalanceShort } from "@/lib/format-balance";

function mockBalances(
  partial: Partial<WalletBalancesResponse> & Pick<WalletBalancesResponse, "tokens">,
): WalletBalancesResponse {
  return {
    address: "0x0000000000000000000000000000000000000001",
    network: "mainnet",
    celo: { formatted: "0", raw: "0" },
    totalNonZero: partial.tokens.filter((t) => t.raw !== "0").length,
    totalChecked: 10,
    fetchedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("buildLandingPrompts", () => {
  it("picks largest stable for send primary prompt", () => {
    const plan = buildLandingPrompts(
      mockBalances({
        celo: { formatted: "100", raw: "100000000000000000000" },
        tokens: [
          {
            symbol: "USDC",
            formatted: "5",
            raw: "5000000",
            address: "0x1",
          },
          {
            symbol: "USDm",
            formatted: "50",
            raw: "50000000000000000000",
            address: "0x2",
          },
        ],
      }),
    );

    expect(plan.primary[0]?.text).toBe(
      "Send 1 USDm to andrewkimjoseph.celo.eth",
    );
  });

  it("never uses trailing-space send prompts", () => {
    const plan = buildLandingPrompts();
    const all = [
      ...plan.primary,
      ...plan.more.flatMap((group) => group.prompts),
    ];
    for (const prompt of all) {
      expect(prompt.text).not.toMatch(/ $/);
    }
  });

  it("filters CELO send prompts in more when blocksCeloSend", () => {
    const plan = buildLandingPrompts(undefined, { blocksCeloSend: true });
    const sendMore = plan.more.find((group) => group.label === "Send");
    expect(
      sendMore?.prompts.some((p) => /^Send .* CELO to /i.test(p.text)),
    ).toBe(false);
  });

  it("merges FX prompts under Swap / convert with Swap analytics group", () => {
    const plan = buildLandingPrompts();
    const swapMore = plan.more.find((group) => group.label === "Swap / convert");
    expect(swapMore).toBeDefined();
    expect(
      swapMore?.prompts.some((p) => p.text.includes("Convert 50 USDm to EURm")),
    ).toBe(true);
    expect(swapMore?.prompts.every((p) => p.group === "Swap")).toBe(true);
  });
});

describe("formatLandingBalanceLine", () => {
  it("formats CELO and token count", () => {
    const line = formatLandingBalanceLine(
      mockBalances({
        celo: { formatted: "921.8844", raw: "921884400000000000000" },
        totalNonZero: 2,
        tokens: [
          { symbol: "USDC", formatted: "1", raw: "1", address: "0x1" },
          { symbol: "USDm", formatted: "2", raw: "2", address: "0x2" },
        ],
      }),
    );
    expect(line).toContain(`${formatBalanceShort("921.8844")} CELO`);
    expect(line).toContain("2 tokens");
  });

  it("returns null when no balance data", () => {
    expect(formatLandingBalanceLine(undefined)).toBeNull();
    expect(
      formatLandingBalanceLine(
        mockBalances({
          celo: { formatted: "0", raw: "0" },
          totalNonZero: 0,
          tokens: [],
        }),
      ),
    ).toBeNull();
  });
});
