import { dynamicTool, type FlexibleSchema, type ToolSet } from "ai";
import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import {
  ALL_TOOL_DEFINITIONS,
  filterToolDefinitions,
  type ToolRuntime,
} from "@andrewkimjoseph/celina-sdk/tools";
import { validateCarbonPrepareBody } from "@/lib/carbon-prepare-validation";
import {
  prepareCarbonConcentratedWithLimitFallback,
  prepareCarbonWithMarketFallback,
} from "@/lib/carbon-market-price";
import type { CarbonPrepareFn } from "@/lib/carbon-prepare";
import { enrichCarbonPrepareFlow } from "@/lib/carbon-prepare-enrich";
import { finalizeCarbonPrepare } from "@andrewkimjoseph/celina-sdk";
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
  options?: { supportsFeeAbstraction?: boolean },
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
        });
        if (!preflight.ok) {
          throw new Error(
            preflight.message ??
              `Insufficient ${token} balance to send ${amount}.`,
          );
        }
      },
      carbon: {
        validateBody: validateCarbonPrepareBody,
        prepare: async (toolName, sender, prepareFn, body, opts) => {
          if (opts?.concentrated) {
            const flow = await prepareCarbonConcentratedWithLimitFallback(
              celina,
              sender,
              body,
            );
            return enrichCarbonPrepareFlow(flow, body, {
              fallbackNote: flow.carbonFallbackNote,
              orderType: flow.carbonFallbackNote
                ? "Limit buy (fallback)"
                : "Discount strategy",
            });
          }
          if (opts?.marketPriceFallback) {
            const flow = await prepareCarbonWithMarketFallback(
              celina,
              sender,
              prepareFn as CarbonPrepareFn,
              body,
            );
            return enrichCarbonPrepareFlow(flow, body, {
              fallbackNote: flow.carbonFallbackNote,
              orderType: flow.carbonFallbackNote ? "Limit buy (fallback)" : undefined,
            });
          }
          const prepared = await prepareFn(body);
          const preparedFlow = await finalizeCarbonPrepare(
            celina.carbon,
            sender,
            prepared as Parameters<typeof finalizeCarbonPrepare>[2],
            body,
          );
          return enrichCarbonPrepareFlow(preparedFlow, body);
        },
      },
    },
  };
}

export function createChatToolsFromSdk(
  celina: CelinaClient,
  connectedAddress: `0x${string}`,
  options?: { supportsFeeAbstraction?: boolean },
) {
  const runtime = createCelesteRuntime(celina, connectedAddress, options);
  const definitions = filterToolDefinitions(ALL_TOOL_DEFINITIONS, {
    surface: "browser",
    carbonPrepareEnabled: true,
    carbonExecuteEnabled: false,
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
