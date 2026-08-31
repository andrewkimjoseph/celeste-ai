import { formatUnits } from "viem";
import { isAddress } from "viem";
import { buildWalletBalancesResponse, goodDollarBalanceRow } from "@/lib/wallet/balances";
import { scheduleAmplitudeFlush } from "@/lib/analytics/amplitude-flush";
import { runWithAnalyticsWallet } from "@andrewkimjoseph/celina-sdk";
import { getCelinaClient } from "@/lib/wallet/celina";

export async function GET(req: Request) {
  scheduleAmplitudeFlush();
  const { searchParams } = new URL(req.url);
  const addressParam = searchParams.get("address");
  const includeZero = searchParams.get("includeZero") === "true";

  if (!addressParam || !isAddress(addressParam)) {
    return Response.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  const address = addressParam as `0x${string}`;
  const celina = getCelinaClient();

  return runWithAnalyticsWallet(address, async () => {
    const [account, stablecoinResult, goodDollarBalance] = await Promise.all([
      celina.account.getAccount(address),
      celina.token.getStablecoinBalances(address, { includeZero }),
      celina.token.getTokenBalance("GoodDollar", address),
    ]);

    const celoFormatted = formatUnits(BigInt(account.balanceWei), 18);
    const goodDollarRow = goodDollarBalanceRow({
      tokenAddress: goodDollarBalance.tokenAddress as `0x${string}`,
      raw: goodDollarBalance.raw,
      formatted: goodDollarBalance.formatted,
    });
    const extraTokens =
      includeZero || goodDollarRow.raw !== "0" ? [goodDollarRow] : [];

    const response = buildWalletBalancesResponse(
      address,
      account.balanceWei,
      celoFormatted,
      stablecoinResult.stablecoins,
      stablecoinResult.totalChecked,
      extraTokens,
    );

    return Response.json(response);
  });
}
