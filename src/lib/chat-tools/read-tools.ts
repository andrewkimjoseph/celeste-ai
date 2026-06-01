import { tool } from "ai";
import type { Abi } from "viem";
import { isAddress } from "viem";
import { z } from "zod";
import type { createCelinaClient } from "@andrewkimjoseph/celina-sdk";
import {
  abiSchema,
  addressOrEnsSchema,
  addressSchema,
  blockIdSchema,
  resolveTargetAddress,
} from "@/lib/chat-tools/schemas";
import { normalizeRegistryTokenInput } from "@/lib/registry-token";
import {
  getSwapQuoteWithFallback,
} from "@/lib/swap-routing";

type CelinaClient = ReturnType<typeof createCelinaClient>;

export function createReadTools(
  celina: CelinaClient,
  connectedAddress: `0x${string}`,
) {
  return {
    get_account: tool({
      description:
        "Returns native CELO balance, nonce, and whether the address is a contract.",
      inputSchema: z.object({
        address: addressSchema.optional(),
      }),
      execute: async ({ address }) =>
        celina.account.getAccount(resolveTargetAddress(connectedAddress, address)),
    }),

    get_network_status: tool({
      description: "Get Celo mainnet chain status (block, gas price).",
      inputSchema: z.object({}),
      execute: async () => celina.blockchain.getNetworkStatus(),
    }),

    get_block: tool({
      description: "Fetch a Celo mainnet block by number, hash, or latest.",
      inputSchema: z.object({
        block_id: blockIdSchema,
        include_transactions: z.boolean().optional(),
      }),
      execute: async ({ block_id, include_transactions }) =>
        celina.blockchain.getBlock(block_id, {
          includeTransactions: include_transactions,
        }),
    }),

    get_latest_blocks: tool({
      description: "Fetch the most recent blocks on Celo mainnet.",
      inputSchema: z.object({
        count: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      }),
      execute: async ({ count, offset }) =>
        celina.blockchain.getLatestBlocks(count ?? 5, offset ?? 0),
    }),

    get_transaction: tool({
      description: "Fetch a transaction and receipt by hash on Celo mainnet.",
      inputSchema: z.object({
        hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
      }),
      execute: async ({ hash }) =>
        celina.blockchain.getTransaction(hash as `0x${string}`),
    }),

    get_stablecoin_balances: tool({
      description:
        "Scan all registry stablecoins for an address in one call (Mento stables, USDC, USDT, GoodDollar, etc.). Omits zero balances by default. Defaults to the connected wallet.",
      inputSchema: z.object({
        address: addressSchema.optional(),
        stablecoins: z.array(z.string()).optional(),
        include_zero: z.boolean().optional(),
      }),
      execute: async ({ address, stablecoins, include_zero }) => {
        const target = resolveTargetAddress(connectedAddress, address);
        return celina.token.getStablecoinBalances(target, {
          stablecoins,
          includeZero: include_zero,
        });
      },
    }),

    get_celo_balances: tool({
      description:
        "Balances for named registry tokens on Celo mainnet. Default tokens: CELO + USDm. Pass tokens for specific symbols (USDC, WETH, EURm, …). Defaults to the connected wallet.",
      inputSchema: z.object({
        address: addressSchema.optional(),
        tokens: z.array(z.string()).optional(),
      }),
      execute: async ({ address, tokens }) =>
        celina.token.getBalances(
          resolveTargetAddress(connectedAddress, address),
          tokens,
        ),
    }),

    get_token_info: tool({
      description:
        "Registry token metadata (symbol, address, decimals). Does not read balances.",
      inputSchema: z.object({
        token: z.string(),
      }),
      execute: async ({ token }) =>
        celina.token.getTokenInfo(normalizeRegistryTokenInput(token)),
    }),

    get_token_balance: tool({
      description:
        "Balance for one registry token. Pass a symbol (USDC, USDm, CELO, …) or a known registry contract address. Defaults to the connected wallet.",
      inputSchema: z.object({
        token: z.string(),
        address: addressSchema.optional(),
      }),
      execute: async ({ token, address }) =>
        celina.token.getTokenBalance(
          normalizeRegistryTokenInput(token),
          resolveTargetAddress(connectedAddress, address),
        ),
    }),

    get_mento_fx_quote: tool({
      description:
        "Mento FX oracle quote only (USDm, EURm, and other Mento stables). For general swap requests use get_swap_quote instead — it also tries Uniswap v4. Do not call without a user-specified amount — ask first if missing.",
      inputSchema: z.object({
        token_in: z.string().describe("Registry symbol, e.g. USDm, EURm"),
        token_out: z.string().describe("Registry symbol, e.g. EURm, USDm"),
        amount: z.string().describe("Human-readable amount the user asked to swap — never a guessed placeholder"),
      }),
      execute: async ({ token_in, token_out, amount }) =>
        celina.mentoFx.getFxQuote(
          normalizeRegistryTokenInput(token_in),
          normalizeRegistryTokenInput(token_out),
          amount,
          connectedAddress,
        ),
    }),

    get_swap_quote: tool({
      description:
        "Get the best swap quote on Celo — tries Mento FX and Uniswap v4 in parallel and returns the best route. Use for swap requests once the user has specified an amount (e.g. G$ → USDT, CELO → USDC). Do not call without a user-specified amount — ask how much to swap first.",
      inputSchema: z.object({
        token_in: z.string().describe("Registry symbol, e.g. GoodDollar, G$, CELO, USDC"),
        token_out: z.string().describe("Registry symbol, e.g. USDT, USDC, EURm"),
        amount: z.string().describe("Human-readable amount the user asked to swap — never a guessed placeholder"),
      }),
      execute: async ({ token_in, token_out, amount }) =>
        getSwapQuoteWithFallback(
          celina,
          normalizeRegistryTokenInput(token_in),
          normalizeRegistryTokenInput(token_out),
          amount,
          connectedAddress,
        ),
    }),

    get_uniswap_quote: tool({
      description:
        "Uniswap v4 AMM quote only. For general swaps use get_swap_quote instead — it falls back automatically when Mento FX has no route. Do not call without a user-specified amount — ask first if missing.",
      inputSchema: z.object({
        token_in: z.string().describe("Registry symbol, e.g. CELO, USDC, USDT"),
        token_out: z.string().describe("Registry symbol, e.g. USDC, USDT"),
        amount: z.string().describe("Human-readable amount the user asked to swap — never a guessed placeholder"),
      }),
      execute: async ({ token_in, token_out, amount }) =>
        celina.uniswap.getSwapQuote(
          normalizeRegistryTokenInput(token_in),
          normalizeRegistryTokenInput(token_out),
          amount,
          connectedAddress,
        ),
    }),

    estimate_send: tool({
      description:
        "Estimate gas for sending CELO or an ERC-20 from the connected wallet. Recipient can be ENS.",
      inputSchema: z.object({
        to: addressOrEnsSchema,
        token: z.string().optional(),
        amount: z.string(),
        from: addressSchema.optional(),
      }),
      execute: async ({ to, token, amount, from }) => {
        const sender = resolveTargetAddress(connectedAddress, from);
        const recipient = isAddress(to)
          ? (to as `0x${string}`)
          : (await celina.ens.resolveAddressOrEns(to)).address;
        return celina.transaction.estimateSend(
          sender,
          recipient,
          normalizeRegistryTokenInput(token ?? "CELO"),
          amount,
        );
      },
    }),

    estimate_mento_fx: tool({
      description:
        "Estimate gas for a Mento FX swap from the connected wallet, including approval if needed.",
      inputSchema: z.object({
        token_in: z.string(),
        token_out: z.string(),
        amount: z.string(),
        from: addressSchema.optional(),
        recipient: addressSchema.optional(),
        slippage_tolerance: z.number().min(0).max(20).optional(),
        deadline_minutes: z.number().int().positive().optional(),
      }),
      execute: async ({
        token_in,
        token_out,
        amount,
        from,
        recipient,
        slippage_tolerance,
        deadline_minutes,
      }) => {
        const sender = resolveTargetAddress(connectedAddress, from);
        return celina.mentoFx.estimateFx(
          sender,
          normalizeRegistryTokenInput(token_in),
          normalizeRegistryTokenInput(token_out),
          amount,
          {
            recipient: recipient as `0x${string}` | undefined,
            slippageTolerance: slippage_tolerance,
            deadlineMinutes: deadline_minutes,
          },
        );
      },
    }),

    estimate_uniswap_swap: tool({
      description:
        "Estimate gas for a Uniswap v4 swap from the connected wallet, including ERC-20 and Permit2 approvals when needed.",
      inputSchema: z.object({
        token_in: z.string(),
        token_out: z.string(),
        amount: z.string(),
        from: addressSchema.optional(),
        recipient: addressSchema.optional(),
        slippage_tolerance: z.number().min(0).max(20).optional(),
        deadline_minutes: z.number().int().positive().optional(),
      }),
      execute: async ({
        token_in,
        token_out,
        amount,
        from,
        recipient,
        slippage_tolerance,
        deadline_minutes,
      }) => {
        const sender = resolveTargetAddress(connectedAddress, from);
        return celina.uniswap.estimateSwap(
          sender,
          normalizeRegistryTokenInput(token_in),
          normalizeRegistryTokenInput(token_out),
          amount,
          {
            recipient: recipient as `0x${string}` | undefined,
            slippageTolerance: slippage_tolerance,
            deadlineMinutes: deadline_minutes,
          },
        );
      },
    }),

    get_gas_fee_data: tool({
      description: "Returns current gas fee data including EIP-1559 fees on mainnet.",
      inputSchema: z.object({}),
      execute: async () => celina.transaction.getGasFeeData(),
    }),

    estimate_transaction: tool({
      description:
        "Estimates gas for a generic transaction (to/value/data) from the connected wallet.",
      inputSchema: z.object({
        to: addressSchema,
        value: z.string().optional(),
        data: z
          .string()
          .regex(/^0x[a-fA-F0-9]*$/)
          .optional(),
        from: addressSchema.optional(),
      }),
      execute: async ({ to, value, data, from }) =>
        celina.transaction.estimateTransaction({
          from: resolveTargetAddress(connectedAddress, from),
          to: to as `0x${string}`,
          value,
          data: data as `0x${string}` | undefined,
        }),
    }),

    get_gooddollar_whitelisting_info: tool({
      description: "Check GoodDollar IdentityV4 whitelist status for an address.",
      inputSchema: z.object({
        address: addressSchema.optional(),
      }),
      execute: async ({ address }) =>
        celina.gooddollar.getWhitelistingInfo(
          resolveTargetAddress(connectedAddress, address),
        ),
    }),

    get_gooddollar_ubi_entitlement: tool({
      description:
        "Check daily GoodDollar UBI claim eligibility: whitelist root, claimable G$, already claimed, and reasons when not eligible.",
      inputSchema: z.object({
        address: addressSchema.optional(),
      }),
      execute: async ({ address }) =>
        celina.gooddollar.getUbiClaimEligibility(
          resolveTargetAddress(connectedAddress, address),
        ),
    }),

    resolve_ens: tool({
      description: "Resolve a Celo or Ethereum ENS name to an address.",
      inputSchema: z.object({
        name: z.string(),
        chain: z.enum(["celo", "ethereum"]).optional(),
      }),
      execute: async ({ name, chain }) =>
        celina.ens.resolveEns(name, chain ?? "celo"),
    }),

    get_governance_proposals: tool({
      description:
        "Returns Celo governance proposals with pagination. Set include_metadata=false for faster responses.",
      inputSchema: z.object({
        include_inactive: z.boolean().optional(),
        include_metadata: z.boolean().optional(),
        page: z.number().int().min(1).optional(),
        page_size: z.number().int().min(1).max(20).optional(),
        offset: z.number().int().min(0).optional(),
        limit: z.number().int().min(1).optional(),
      }),
      execute: async ({
        include_inactive,
        include_metadata,
        page,
        page_size,
        offset,
        limit,
      }) =>
        celina.governance.getGovernanceProposals({
          includeInactive: include_inactive,
          includeMetadata: include_metadata,
          page,
          pageSize: page_size,
          offset,
          limit,
        }),
    }),

    get_proposal_details: tool({
      description:
        "Returns detailed information about a Celo governance proposal.",
      inputSchema: z.object({
        proposal_id: z.number().int().min(0),
      }),
      execute: async ({ proposal_id }) =>
        celina.governance.getProposalDetails(proposal_id),
    }),

    get_staking_balances: tool({
      description:
        "Returns active and pending staking votes for an address by validator group.",
      inputSchema: z.object({
        address: addressSchema.optional(),
      }),
      execute: async ({ address }) =>
        celina.staking.getStakingBalances(
          resolveTargetAddress(connectedAddress, address),
        ),
    }),

    get_activatable_stakes: tool({
      description:
        "Returns validator groups where pending stakes can be activated for an address.",
      inputSchema: z.object({
        address: addressSchema.optional(),
      }),
      execute: async ({ address }) =>
        celina.staking.getActivatableStakes(
          resolveTargetAddress(connectedAddress, address),
        ),
    }),

    get_validator_groups: tool({
      description:
        "Returns paginated validator groups with votes, capacity, and member counts.",
      inputSchema: z.object({
        page: z.number().int().min(1).optional(),
        page_size: z.number().int().min(1).max(50).optional(),
        offset: z.number().int().min(0).optional(),
        limit: z.number().int().min(1).optional(),
      }),
      execute: async ({ page, page_size, offset, limit }) =>
        celina.staking.getValidatorGroups({
          page,
          pageSize: page_size,
          offset,
          limit,
        }),
    }),

    get_validator_group_details: tool({
      description:
        "Returns detailed information about a validator group including members.",
      inputSchema: z.object({
        group_address: addressSchema,
      }),
      execute: async ({ group_address }) =>
        celina.staking.getValidatorGroupDetails(
          group_address as `0x${string}`,
        ),
    }),

    get_total_staking_info: tool({
      description: "Returns network-wide staking participation metrics.",
      inputSchema: z.object({}),
      execute: async () => celina.staking.getTotalStakingInfo(),
    }),

    get_nft_info: tool({
      description:
        "Returns NFT token information including metadata for ERC-721 or ERC-1155.",
      inputSchema: z.object({
        contract_address: addressSchema,
        token_id: z.string(),
      }),
      execute: async ({ contract_address, token_id }) =>
        celina.nft.getNftInfo(contract_address as `0x${string}`, token_id),
    }),

    get_nft_balance: tool({
      description:
        "Returns NFT balance for an address. Token ID required for ERC-1155.",
      inputSchema: z.object({
        contract_address: addressSchema,
        address: addressSchema.optional(),
        token_id: z.string().optional(),
      }),
      execute: async ({ contract_address, address, token_id }) =>
        celina.nft.getNftBalance(
          contract_address as `0x${string}`,
          resolveTargetAddress(connectedAddress, address),
          token_id,
        ),
    }),

    call_contract_function: tool({
      description:
        "Calls a read-only contract function. Requires caller-supplied ABI JSON array.",
      inputSchema: z.object({
        contract_address: addressSchema,
        function_name: z.string().min(1),
        abi: abiSchema,
        function_args: z.array(z.unknown()).optional(),
        from_address: addressSchema.optional(),
      }),
      execute: async ({
        contract_address,
        function_name,
        abi,
        function_args,
        from_address,
      }) =>
        celina.contract.callFunction({
          contractAddress: contract_address as `0x${string}`,
          functionName: function_name,
          abi: abi as unknown as Abi,
          functionArgs: function_args,
          fromAddress: from_address as `0x${string}` | undefined,
        }),
    }),

    estimate_contract_gas: tool({
      description:
        "Estimates gas for a contract function call from the connected wallet.",
      inputSchema: z.object({
        contract_address: addressSchema,
        function_name: z.string().min(1),
        abi: abiSchema,
        function_args: z.array(z.unknown()).optional(),
        value: z.string().optional(),
        from: addressSchema.optional(),
      }),
      execute: async ({
        contract_address,
        function_name,
        abi,
        function_args,
        value,
        from,
      }) =>
        celina.contract.estimateGas({
          contractAddress: contract_address as `0x${string}`,
          functionName: function_name,
          abi: abi as unknown as Abi,
          functionArgs: function_args,
          fromAddress: resolveTargetAddress(connectedAddress, from),
          value,
        }),
    }),
  };
}
