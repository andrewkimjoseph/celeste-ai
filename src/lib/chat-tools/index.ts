import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import { createChatToolsFromSdk } from "@/lib/chat-tools/sdk-adapter";

export {
  buildSystemPrompt,
  formatWalletBalanceSnapshot,
  SYSTEM_PROMPT,
  type SystemPromptOptions,
} from "@/lib/chat-tools/system-prompt";

type CelinaClient = ReturnType<typeof createCelinaClient>;

export type ChatToolsOptions = {
  supportsFeeAbstraction?: boolean;
  blocksCeloSend?: boolean;
};

/** Vercel AI SDK tools for `/api/chat` — from @andrewkimjoseph/celina-sdk/tools. */
export function createChatTools(
  celina: CelinaClient,
  connectedAddress: `0x${string}`,
  options?: ChatToolsOptions,
) {
  return createChatToolsFromSdk(celina, connectedAddress, options);
}
