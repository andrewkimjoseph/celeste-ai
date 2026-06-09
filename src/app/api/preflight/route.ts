import { isAddress } from "viem";
import { checkSendPreflight, parseSendSummary } from "@/lib/send-preflight";
import { scheduleAmplitudeFlush } from "@/lib/amplitude-flush";
import { runWithAnalyticsWallet } from "@andrewkimjoseph/celina-sdk";
import { getCelinaClient } from "@/lib/celina";

export async function POST(req: Request) {
  scheduleAmplitudeFlush();
  const body = (await req.json()) as {
    address?: string;
    summary?: string;
    token?: string;
    amount?: string;
    supportsFeeAbstraction?: boolean;
    blocksCeloSend?: boolean;
  };

  const { address, summary, token, amount, supportsFeeAbstraction, blocksCeloSend } =
    body;

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
  const wallet = address as `0x${string}`;

  return runWithAnalyticsWallet(wallet, async () => {
    const result = await checkSendPreflight(
      celina,
      wallet,
      parsed.token,
      parsed.amount,
      {
        supportsFeeAbstraction: supportsFeeAbstraction === true,
        blocksCeloSend: blocksCeloSend === true,
      },
    );

    return Response.json(result);
  });
}
