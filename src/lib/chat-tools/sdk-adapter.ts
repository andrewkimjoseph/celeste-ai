import { dynamicTool, type FlexibleSchema, type ToolSet } from "ai";
import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import {
  ALL_TOOL_DEFINITIONS,
  filterToolDefinitions,
  type ToolRuntime,
} from "@andrewkimjoseph/celina-sdk/tools";
import { checkSendPreflight } from "@/lib/tx/send-preflight";
import { checkBlockedSendRecipient } from "@/lib/minipay/blocked-send-recipients";
import {
  parseTransactionHash,
  TRUNCATED_TX_HASH_MESSAGE,
} from "@/lib/tx/transaction-hash";
import { z } from "zod";

type CelinaClient = ReturnType<typeof createCelinaClient>;

/** Celo governance and validator staking — not part of Celeste DeFAI. */
const OMITTED_CHAT_TOOLS = new Set([
  "get_governance_proposals",
  "get_proposal_details",
  "get_locked_celo_balance",
  "get_pending_withdrawals",
  "get_votable_proposals",
  "get_queued_proposals",
  "get_actionable_governance_proposals",
  "get_governance_votes",
  "execute_lock_celo",
  "execute_unlock_celo",
  "execute_relock_celo",
  "execute_withdraw_celo",
  "execute_vote",
  "execute_upvote",
  "execute_dequeue_proposals_if_ready",
  "execute_revoke_governance_votes",
  "execute_revoke_governance_upvote",
  "prepare_lock_celo",
  "prepare_unlock_celo",
  "prepare_relock_celo",
  "prepare_withdraw_celo",
  "prepare_vote",
  "prepare_upvote",
  "prepare_dequeue_proposals_if_ready",
  "prepare_revoke_governance_votes",
  "prepare_revoke_governance_upvote",
  "get_staking_balances",
  "get_activatable_stakes",
  "get_validator_groups",
  "get_validator_group_details",
  "get_total_staking_info",
  "get_delegation_info",
  "get_stake_eligibility",
  "execute_stake",
  "execute_activate_stake",
  "execute_unstake",
  "get_governance_delegates",
  "get_governance_delegate_details",
  "execute_delegate_power",
  "execute_undelegate_power",
  "prepare_stake",
  "prepare_activate_stake",
  "prepare_unstake",
  "prepare_delegate_power",
  "prepare_undelegate_power",
]);

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
  }).filter((def) => !OMITTED_CHAT_TOOLS.has(def.name));

  const tools: ToolSet = {};
  for (const def of definitions) {
    if (def.name === "prepare_send") {
      tools[def.name] = dynamicTool({
        description: def.description,
        inputSchema: def.inputSchema as unknown as FlexibleSchema<
          Record<string, unknown>
        >,
        execute: async (input) => {
          const params = input as {
            to?: string;
            token?: string;
            amount?: string;
            from?: string;
          };
          const { address: recipient } = await celina.ens.resolveAddressOrEns(
            String(params.to ?? ""),
          );
          const blocked = checkBlockedSendRecipient(recipient);
          if (!blocked.ok) {
            throw new Error(blocked.message);
          }
          return def.handler(runtime, input as Record<string, unknown>);
        },
      });
      continue;
    }

    if (def.name === "get_transaction") {
      tools[def.name] = dynamicTool({
        description: def.description,
        inputSchema: z.object({
          hash: z
            .string()
            .describe("Full Celo transaction hash — 0x followed by 64 hex characters"),
        }),
        execute: async (input) => {
          const params = input as { hash?: string };
          const hash = parseTransactionHash(String(params.hash ?? ""));
          if (!hash) {
            throw new Error(TRUNCATED_TX_HASH_MESSAGE);
          }
          return def.handler(runtime, { hash });
        },
      });
      continue;
    }

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
