import { isAddress } from "viem";
import { checkFlowPreflight, parseSupplySummary } from "@/lib/tx/flow-preflight";
import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";

const publicClient = createPublicClient({
  chain: celo,
  transport: http(process.env.CELO_RPC_URL_MAINNET ?? "https://forno.celo.org"),
});

export async function POST(req: Request) {
  const body = (await req.json()) as {
    address?: string;
    summary?: string;
    supportsFeeAbstraction?: boolean;
  };

  const { address, summary, supportsFeeAbstraction } = body;

  if (!address || !isAddress(address)) {
    return Response.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  if (!summary || !parseSupplySummary(summary)) {
    return Response.json(
      { error: "Could not parse flow for balance check." },
      { status: 400 },
    );
  }

  const result = await checkFlowPreflight(
    publicClient as never,
    address as `0x${string}`,
    summary,
    { supportsFeeAbstraction: supportsFeeAbstraction === true },
  );

  return Response.json(result);
}
