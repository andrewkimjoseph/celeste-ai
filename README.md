# Celeste AI

DeFAI chat UI for Celo — applied Celina. Connect a wallet, ask about balances, and prepare sends, swaps (Mento FX + Uniswap v4), and Aave actions — you sign in your wallet.

## Setup

```bash
cp .env.example .env.local
# Set OPENROUTER_API_KEY (or OPENAI_API_KEY) and optionally NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
npm install
npm run dev
```

Installs `@andrewkimjoseph/celina-sdk` from npm.

## Stack

- Next.js + Vercel AI SDK + OpenAI-compatible LLM (`/api/chat`) — OpenRouter or direct OpenAI
- wagmi + RainbowKit (Celo mainnet)
- `@andrewkimjoseph/celina-sdk` for chain reads and `prepare*` flows

No `CELO_PRIVATE_KEY` — writes require wallet confirmation via `TxConfirmCard`.

## Swap routing

Swaps use **composite routing** in [`src/lib/swap-routing.ts`](src/lib/swap-routing.ts): the agent quotes Mento FX and Uniswap v4 in parallel and picks the better `expectedOut`.

| Tool | Purpose |
|------|---------|
| `get_swap_quote` | **Default for swaps** — Mento + Uniswap quotes, best route selected |
| `prepare_swap` | Unsigned steps after user confirms (auto-selects or uses quoted protocol) |
| `get_mento_fx_quote` / `prepare_mento_fx` | Mento FX only |
| `get_uniswap_quote` / `prepare_uniswap_swap` | Uniswap v4 only |
| `estimate_mento_fx` / `estimate_uniswap_swap` | Gas estimates (when user asks) |

Example: *"Swap 100 G$ to USDT"* → `get_swap_quote` (Uniswap when Mento has no route) → user confirms → `prepare_swap` → `TxConfirmCard` (approve + Permit2 approve + swap when needed).

## GoodDollar UBI

Wallet-signed daily G$ claims via celina-sdk (UBISchemeV2 on Celo):

| Tool | Purpose |
|------|---------|
| `get_gooddollar_whitelisting_info` | IdentityV4 whitelist and reverification status |
| `get_gooddollar_ubi_entitlement` | Today's claimable amount, eligibility, blockers |
| `prepare_claim_daily_gooddollar_ubi` | Unsigned `claim()` — user signs in wallet via `TxConfirmCard` |

Example: *"Claim my GoodDollar UBI"* → `get_gooddollar_ubi_entitlement` → user confirms → `prepare_claim_daily_gooddollar_ubi` → sign in wallet. One claim per verified identity per day.

Requires `@andrewkimjoseph/celina-sdk` **^0.4.0**. See [GoodDollar guide](../celina-sdk/docs/guides/gooddollar.md).

Uniswap v4 CELO swaps route through WCELO — the connected wallet needs WCELO balance. Dismissing the confirm card does not re-prepare until the user sends a new message.

## For developers

### Request flow

1. User connects wallet (wagmi + RainbowKit).
2. `ChatPanel` sends messages + `{ address }` to `POST /api/chat`.
3. LLM calls tools from `src/lib/chat-tools.ts` (reads via SDK, writes via `prepare_*`).
4. `prepare_*` tools return `SerializedPreparedFlow` from celina-sdk.
5. `ChatPanel` detects the flow in message parts and renders `TxConfirmCard`.
6. User confirms — `TxConfirmCard` signs each step sequentially via wagmi.

Chat tools mirror **celina-sdk** reads and `prepare_*` wallet flows (aligned with celina-mcp read tools). Server-key writes (`send_token`, `execute_mento_fx`, `execute_uniswap_swap`) and **Self Agent ID** are only in [celina-mcp](../celina-mcp) or [`@selfxyz/agent-sdk`](https://www.npmjs.com/package/@selfxyz/agent-sdk).

### Directory map

| Path | Purpose |
|------|---------|
| `src/app/api/chat/route.ts` | Streaming chat route — wallet gate, tool wiring |
| `src/lib/chat-tools/` | Vercel AI SDK tool definitions (reads + prepare_*) |
| `src/lib/swap-routing.ts` | Composite Mento FX + Uniswap v4 quote/prepare logic |
| `src/lib/chat-model.ts` | OpenRouter / OpenAI model selection |
| `src/lib/celina.ts` | Server-side SDK singleton |
| `src/lib/prepared-flow.ts` | Extract `SerializedPreparedFlow` from chat messages |
| `src/components/chat-panel.tsx` | Chat UI, address transport, tx card trigger |
| `src/components/tx-confirm-card.tsx` | Sequential wagmi signing loop |
| `next.config.ts` | Monorepo + bundler workarounds |

### Environment variables

See [`.env.example`](.env.example):

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | OpenRouter LLM (recommended) |
| `OPENAI_API_KEY` | Direct OpenAI (alternative) |
| `OPENAI_MODEL` | Model id (e.g. `openai/gpt-4o-mini` on OpenRouter) |
| `OPENAI_BASE_URL` | Override provider URL (optional) |
| `CELO_RPC_URL_MAINNET` | Celo RPC for SDK reads/prepare |
| `ETH_RPC_URL_MAINNET` | Ethereum RPC for ENS resolution |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect / RainbowKit |

### Next.js config notes

[`next.config.ts`](next.config.ts) includes:

- `serverExternalPackages` — keep `@andrewkimjoseph/celina-sdk` and `@mento-protocol/mento-sdk` out of the server bundle
- `turbopack.root` — points at the monorepo root when developing inside the hackathon workspace
- `@react-native-async-storage/async-storage` stub — MetaMask/RainbowKit dependency shim for web

Dev script uses `--webpack` for compatibility; adjust if Turbopack-only dev is preferred.

### Adding a chat tool

1. Add a `tool({ description, inputSchema, execute })` entry in `createChatTools()` in [`src/lib/chat-tools.ts`](src/lib/chat-tools.ts).
2. Call the matching celina-sdk method; use `connectedAddress` as default `from`.
3. For writes, use `prepare_*` naming to match MCP conventions where possible.
4. Update `SYSTEM_PROMPT` if the LLM needs new behavior rules.
