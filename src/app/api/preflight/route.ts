import { isAddress } from "viem";
import { checkSendPreflight, parseSendSummary } from "@/lib/send-preflight";
import { getCelinaClient } from "@/lib/celina";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    address?: string;
    summary?: string;
    token?: string;
    amount?: string;
  };

  const { address, summary, token, amount } = body;

  if (!address || !isAddress(address)) {
    return Response.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  const parsed =
    token && amount
      ? { token, amount }
      : summary
        ? parseSendSummary(summary)
        : null;

  if (!parsed) {
    return Response.json(
      { error: "Could not parse transaction for balance check." },
      { status: 400 },
    );
  }

  const celina = getCelinaClient();
  const result = await checkSendPreflight(
    celina,
    address as `0x${string}`,
    parsed.token,
    parsed.amount,
  );

  return Response.json(result);
}
