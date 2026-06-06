# Celeste AI

DeFAI chat UI for Celo — applied Celina. Connect a wallet, ask about balances, and prepare sends, swaps (Mento FX + GoodDollar reserve + Uniswap v4), and Aave actions — you sign in your wallet.

**Celeste is independent of Celina MCP.** It does not run `@andrewkimjoseph/celina-mcp`, does not use `CELO_PRIVATE_KEY` or `get_wallet_address`, and is not the same product as [usecelina.xyz](https://usecelina.xyz). It is a Next.js app that calls **`@andrewkimjoseph/celina-sdk`** with the connected wallet address from wagmi (same pattern as any custom SDK + wagmi frontend).

## Setup

```bash
cp .env.example .env.local
# Set OPENROUTER_API_KEY (or OPENAI_API_KEY) and optionally NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
npm install
npm run dev
```

Installs `@andrewkimjoseph/celina-sdk` **`^0.7.0`** from npm (not a monorepo file link — required for Vercel deploys).

## Stack

- Next.js + Vercel AI SDK + OpenAI-compatible LLM (`/api/chat`) — OpenRouter or direct OpenAI
- wagmi + RainbowKit (Celo mainnet)
- `@andrewkimjoseph/celina-sdk` for chain reads and `prepare*` flows

No `CELO_PRIVATE_KEY` — writes require wallet confirmation via `TxConfirmCard`.

## Swap routing

Swaps use **composite routing** in [`src/lib/swap-routing.ts`](src/lib/swap-routing.ts): the agent quotes Mento FX, GoodDollar reserve (G$ ↔ USDm), and Uniswap v4 in parallel and picks the better `expectedOut`.

| Tool | Purpose |
|------|---------|
| `get_swap_quote` | **Default for swaps** — Mento + reserve + Uniswap quotes, best route selected |
| `prepare_swap` | Unsigned steps after user confirms (auto-selects or uses quoted protocol) |
| `get_mento_fx_quote` / `prepare_mento_fx` | Mento FX only |
| `get_gooddollar_reserve_quote` / `prepare_gooddollar_reserve_swap` | GoodDollar reserve (G$ ↔ USDm) only |
| `get_uniswap_quote` / `prepare_uniswap_swap` | Uniswap v4 only |
| `estimate_mento_fx` / `estimate_uniswap_swap` | Gas estimates (when user asks) |

Example: *"Swap 100 G$ to USDm"* → `get_swap_quote` selects **`gooddollar_reserve`** via MentoBroker — not Uniswap → user confirms → `prepare_swap` (or `prepare_gooddollar_reserve_swap`) → `TxConfirmCard` (optional approve + broker swap).

## Carbon DeFi

Carbon on Celo uses **maker strategies** (limit, recurring, concentrated) and **taker swaps** against maker liquidity. Celeste exposes 12 read tools and 13 `prepare_carbon_*` tools via celina-sdk (REST-primary; no `execute_carbon_*` — you sign in the wallet).

| Intent | Tools |
|--------|--------|
| Buy/sell at a limit or % vs market | `prepare_carbon_limit_order`, `prepare_carbon_recurring_strategy`, `prepare_carbon_concentrated_strategy`, … |
| Immediate swap on Carbon | `get_carbon_trade_quote` → `prepare_carbon_trade` |
| Instant Mento/reserve/Uniswap swap | `get_swap_quote` → `prepare_swap` (when user does **not** ask for Carbon) |

Market price is **auto-fetched** on prepare when omitted — if Carbon lacks pair data, Celeste **retries with a Uniswap v4 reference price** (pricing only, not an instant swap). Do not use `get_carbon_price_history` for spot price before orders (historical OHLC only; often 400 on some pairs). An empty `get_carbon_strategies` result only means the wallet has no existing strategies.

Example: *"Buy CELO with 50 USDT at 10% below market via Carbon"* → ask budget if missing → `prepare_carbon_concentrated_strategy` (base CELO, quote USDT, `spread_percentage: 10`, `buy_budget`) → `TxConfirmCard` (warnings + Carbon deep link when returned). Use `get_carbon_price_history` only when the user asks for charts/history.

See [Carbon guide](../celina-sdk/docs/guides/carbon.md).

## GoodDollar

Wallet-signed UBI claims and **G$ ↔ USDm reserve swaps** via celina-sdk:

| Tool | Purpose |
|------|---------|
| `get_gooddollar_whitelisting_info` | IdentityV4 whitelist and reverification status |
| `get_gooddollar_ubi_entitlement` | Today's claimable amount, eligibility, blockers |
| `prepare_claim_daily_gooddollar_ubi` | Unsigned UBI `claim()` — user signs in wallet |
| `get_gooddollar_reserve_quote` | G$ ↔ USDm reserve quote (MentoBroker bonding curve) |
| `prepare_gooddollar_reserve_swap` | Unsigned reserve swap — user signs in wallet |

Example (UBI): *"Claim my GoodDollar UBI"* → `get_gooddollar_ubi_entitlement` → user confirms → `prepare_claim_daily_gooddollar_ubi` → sign in wallet. One claim per verified identity per day.

Example (reserve): *"Swap 100 G$ to USDm"* → `get_swap_quote` (or `get_gooddollar_reserve_quote`) → user confirms → `prepare_swap` → sign in wallet.

Requires `@andrewkimjoseph/celina-sdk` **^0.7.0**. See [GoodDollar guide](../celina-sdk/docs/guides/gooddollar.md).

Uniswap v4 CELO swaps route through WCELO — the connected wallet needs WCELO balance. Dismissing the confirm card does not re-prepare until the user sends a new message.

## For developers

### Request flow

1. User connects wallet (wagmi + RainbowKit).
2. `ChatPanel` sends messages + `{ address }` to `POST /api/chat`.
3. `resolveTargetAddress` in `src/lib/chat-tools/schemas.ts` defaults tool inputs to that connected address (SDK always needs an explicit `0x…`; this is Celeste’s equivalent of Celina MCP’s optional-address session wallet on stdio).
4. LLM calls tools from `src/lib/chat-tools/` (reads via SDK, writes via `prepare_*`).
5. `prepare_*` tools return `SerializedPreparedFlow` from celina-sdk.
6. `ChatPanel` detects the flow in message parts and renders `TxConfirmCard`.
7. User confirms — `TxConfirmCard` signs each step sequentially via wagmi.

Chat tools mirror **celina-sdk** reads and `prepare_*` wallet flows (naming is similar to celina-mcp for familiarity, but Celeste does not call MCP). Server-key writes (`send_token`, `execute_mento_fx`, `execute_uniswap_swap`, `execute_carbon_*`) and **Self Agent ID** registration flows are only in [celina-mcp](../celina-mcp) or [`@selfxyz/agent-sdk`](https://www.npmjs.com/package/@selfxyz/agent-sdk).

### Directory map

| Path | Purpose |
|------|---------|
| `src/app/api/chat/route.ts` | Streaming chat route — wallet gate, tool wiring |
| `src/lib/chat-tools/` | Vercel AI SDK tool definitions (reads + prepare_*) |
| `src/lib/swap-routing.ts` | Composite Mento FX + GoodDollar reserve + Uniswap v4 quote/prepare logic |
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

1. Add a `ToolDefinition` in **celina-sdk** — see [LLM tool catalog](../celina-sdk/docs/guides/tool-catalog.md) (`src/tools/domains/`, `surfaces: ["browser"]` or both).
2. Celeste wires tools through [`src/lib/chat-tools/sdk-adapter.ts`](src/lib/chat-tools/sdk-adapter.ts); add `ToolRuntime.hooks` there if the tool needs host-specific behavior (e.g. send preflight, Carbon enrich). Use **`dynamicTool`** when wrapping the catalog (documented in the SDK guide).
3. Update `SYSTEM_PROMPT` in [`src/lib/chat-tools/index.ts`](src/lib/chat-tools/index.ts) if the LLM needs new rules.
4. Requires `@andrewkimjoseph/celina-sdk` **^0.7.0** with the `./tools` export.
