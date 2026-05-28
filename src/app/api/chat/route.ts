/**
 * Streaming chat API — requires a connected wallet address in the request body.
 * Tools call celina-sdk for reads and prepare* flows; signing happens client-side.
 */
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { isAddress } from "viem";
import { assertChatApiKeyConfigured, getChatModel } from "@/lib/chat-model";
import { createChatTools, SYSTEM_PROMPT } from "@/lib/chat-tools";
import { getCelinaClient } from "@/lib/celina";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: UIMessage[];
    address?: string;
  };

  const { messages, address } = body;

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

  const result = streamText({
    model: getChatModel(),
    system: SYSTEM_PROMPT.replace("{address}", walletAddress),
    messages: await convertToModelMessages(messages),
    tools: createChatTools(celina, walletAddress),
    stopWhen: stepCountIs(3),
  });

  return result.toUIMessageStreamResponse({ originalMessages: messages });
}
