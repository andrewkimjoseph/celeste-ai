import { dynamicTool, type FlexibleSchema, type ToolSet } from "ai";
import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import {
  ALL_TOOL_DEFINITIONS,
  filterToolDefinitions,
  type ToolRuntime,
} from "@andrewkimjoseph/celina-sdk/tools";
import { checkSendPreflight } from "@/lib/send-preflight";

type CelinaClient = ReturnType<typeof createCelinaClient>;

export function resolveTargetAddress(
  connectedAddress: `0x${string}`,
  address?: string,
): `0x${string}` {
  return (address ?? connectedAddress) as `0x${string}`;
}

function createCelesteRuntime(
  celina: CelinaClient,
  connectedAddress: `0x${string}`,
  options?: { supportsFeeAbstraction?: boolean; blocksCeloSend?: boolean },
): ToolRuntime {
  return {
    celina,
    resolveWallet: (input) =>
      resolveTargetAddress(
        connectedAddress,
        input?.address ?? input?.wallet_address ?? input?.from,
      ),
    hooks: {
      beforePrepareSend: async ({ sender, token, amount }) => {
        const preflight = await checkSendPreflight(celina, sender, token, amount, {
          supportsFeeAbstraction: options?.supportsFeeAbstraction === true,
          blocksCeloSend: options?.blocksCeloSend === true,
        });
        if (!preflight.ok) {
          throw new Error(
            preflight.message ??
              `Insufficient ${token} balance to send ${amount}.`,
          );
        }
      },
    },
  };
}

export function createChatToolsFromSdk(
  celina: CelinaClient,
  connectedAddress: `0x${string}`,
  options?: { supportsFeeAbstraction?: boolean; blocksCeloSend?: boolean },
) {
  const runtime = createCelesteRuntime(celina, connectedAddress, options);
  const definitions = filterToolDefinitions(ALL_TOOL_DEFINITIONS, {
    surface: "browser",
  });

  const tools: ToolSet = {};
  for (const def of definitions) {
    tools[def.name] = dynamicTool({
      description: def.description,
      inputSchema: def.inputSchema as unknown as FlexibleSchema<
        Record<string, unknown>
      >,
      execute: async (input) =>
        def.handler(runtime, input as Record<string, unknown>),
    });
  }
  return tools;
}
