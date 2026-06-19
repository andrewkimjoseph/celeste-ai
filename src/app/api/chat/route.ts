/**
 * Streaming chat API — requires a connected wallet address in the request body.
 * Tools call celina-sdk for reads and prepare* flows; signing happens client-side.
 */
import { convertToModelMessages, smoothStream, stepCountIs, streamText, UIMessage } from "ai";
import { isAddress } from "viem";
import { assertChatApiKeyConfigured, getChatModel } from "@/lib/chat-model";
import { buildSystemPrompt, createChatTools } from "@/lib/chat-tools";
import { scheduleAmplitudeFlush } from "@/lib/amplitude-flush";
import { runWithAnalyticsWallet } from "@andrewkimjoseph/celina-sdk";
import { getCelinaClient } from "@/lib/celina";

export const maxDuration = 60;

export async function POST(req: Request) {
  scheduleAmplitudeFlush();
  const body = (await req.json()) as {
    messages: UIMessage[];
    address?: string;
    clientContext?: string;
    balanceSnapshot?: string;
    supportsFeeAbstraction?: boolean;
    blocksCeloSend?: boolean;
  };

  const {
    messages,
    address,
    clientContext,
    balanceSnapshot,
    supportsFeeAbstraction,
    blocksCeloSend,
  } = body;

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

  const system = buildSystemPrompt({
    address: walletAddress,
    supportsFeeAbstraction: supportsFeeAbstraction === true,
    blocksCeloSend: blocksCeloSend === true,
    balanceSnapshot,
    clientContext,
  });

  const modelMessages = await convertToModelMessages(messages);

  return runWithAnalyticsWallet(walletAddress, () => {
    const result = streamText({
      model: getChatModel(),
      system,
      messages: modelMessages,
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
  });
}
