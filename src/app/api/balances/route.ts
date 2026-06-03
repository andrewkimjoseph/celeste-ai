import { formatUnits } from "viem";
import { isAddress } from "viem";
import { buildWalletBalancesResponse } from "@/lib/balances";
import { scheduleAmplitudeFlush } from "@/lib/amplitude-flush";
import { getCelinaClient } from "@/lib/celina";

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

  const [account, stablecoinResult] = await Promise.all([
    celina.account.getAccount(address),
    celina.token.getStablecoinBalances(address, { includeZero }),
  ]);

  const celoFormatted = formatUnits(BigInt(account.balanceWei), 18);

  const response = buildWalletBalancesResponse(
    address,
    account.balanceWei,
    celoFormatted,
    stablecoinResult.stablecoins,
    stablecoinResult.totalChecked,
  );

  return Response.json(response);
}
