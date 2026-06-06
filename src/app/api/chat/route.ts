/**
 * Streaming chat API — requires a connected wallet address in the request body.
 * Tools call celina-sdk for reads and prepare* flows; signing happens client-side.
 */
import { convertToModelMessages, smoothStream, stepCountIs, streamText, UIMessage } from "ai";
import { isAddress } from "viem";
import { assertChatApiKeyConfigured, getChatModel } from "@/lib/chat-model";
import { createChatTools, SYSTEM_PROMPT } from "@/lib/chat-tools";
import { scheduleAmplitudeFlush } from "@/lib/amplitude-flush";
import { getCelinaClient } from "@/lib/celina";

export const maxDuration = 60;

export async function POST(req: Request) {
  scheduleAmplitudeFlush();
  const body = (await req.json()) as {
    messages: UIMessage[];
    address?: string;
    clientContext?: string;
    supportsFeeAbstraction?: boolean;
    blocksCeloSend?: boolean;
  };

  const { messages, address, clientContext, supportsFeeAbstraction, blocksCeloSend } =
    body;

  if (!address || !isAddress(address)) {
    return new Response(
      JSON.stringify({ error: "Connect your wallet before chatting." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const apiKeyError = assertChatApiKeyConfigured();
  if (apiKeyError) {
    return new Response(JSON.stringify({ error: apiKeyError }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const celina = getCelinaClient();
  const walletAddress = address as `0x${string}`;

  let system = SYSTEM_PROMPT.replace("{address}", walletAddress);
  if (supportsFeeAbstraction === true) {
    system +=
      "\n\nConnected via MiniPay — gas can be paid from USDC, USDT, USDm, or CELO; zero CELO is OK if stablecoin balances cover fees.";
  }
  if (blocksCeloSend === true) {
    system +=
      "\n\nMiniPay does not allow sending CELO or WCELO to other wallets. Never call prepare_send with token CELO or WCELO. Offer stablecoin sends (USDC, USDT, USDm, etc.) instead.";
  }
  if (clientContext?.trim()) {
    system += `\n\nClient context for this turn:\n${clientContext.trim()}`;
  }

  const result = streamText({
    model: getChatModel(),
    system,
    messages: await convertToModelMessages(messages),
    tools: createChatTools(celina, walletAddress, {
      supportsFeeAbstraction: supportsFeeAbstraction === true,
      blocksCeloSend: blocksCeloSend === true,
    }),
    stopWhen: stepCountIs(6),
    experimental_transform: smoothStream({
      delayInMs: 52,
      chunking: "word",
    }),
  });

  return result.toUIMessageStreamResponse({ originalMessages: messages });
}
