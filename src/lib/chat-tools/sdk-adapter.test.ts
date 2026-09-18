import { describe, expect, it } from "vitest";
import { shouldDelegateReserveToComposite } from "./sdk-adapter";

describe("shouldDelegateReserveToComposite", () => {
  it("keeps G$ ↔ USDm on the reserve path", () => {
    expect(shouldDelegateReserveToComposite("G$", "USDm")).toBe(false);
    expect(shouldDelegateReserveToComposite("GoodDollar", "cUSD")).toBe(false);
    expect(shouldDelegateReserveToComposite("USDm", "G$")).toBe(false);
  });

  it("routes other G$ pairs through composite swap", () => {
    expect(shouldDelegateReserveToComposite("G$", "USDC")).toBe(true);
    expect(shouldDelegateReserveToComposite("GoodDollar", "USDT")).toBe(true);
    expect(shouldDelegateReserveToComposite("CELO", "G$")).toBe(true);
  });

  it("does not remap incomplete pairs", () => {
    expect(shouldDelegateReserveToComposite(undefined, "USDC")).toBe(false);
    expect(shouldDelegateReserveToComposite("G$", "")).toBe(false);
  });
});
