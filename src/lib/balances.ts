export interface TokenBalanceRow {
  symbol: string;
  formatted: string;
  raw: string;
  address: "native" | `0x${string}`;
  issuer?: string;
  useCase?: string;
  readError?: boolean;
}

export interface WalletBalancesResponse {
  address: `0x${string}`;
  network: "mainnet";
  celo: { formatted: string; raw: string };
  tokens: TokenBalanceRow[];
  totalNonZero: number;
  totalChecked: number;
  fetchedAt: string;
}

function isZeroBalance(raw: string): boolean {
  return raw === "0" || raw === "0n";
}

function sortTokenRows(rows: TokenBalanceRow[]): TokenBalanceRow[] {
  return [...rows].sort((a, b) => {
    const aNonZero = !isZeroBalance(a.raw);
    const bNonZero = !isZeroBalance(b.raw);
    if (aNonZero !== bNonZero) {
      return aNonZero ? -1 : 1;
    }
    return a.symbol.localeCompare(b.symbol);
  });
}

export function groupTokensByUseCase(
  tokens: TokenBalanceRow[],
): Array<{ label: string; tokens: TokenBalanceRow[] }> {
  const groups = new Map<string, TokenBalanceRow[]>();

  for (const token of tokens) {
    const label = token.useCase?.trim() || token.issuer?.trim() || "Other";
    const bucket = groups.get(label) ?? [];
    bucket.push(token);
    groups.set(label, bucket);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, groupTokens]) => ({
      label,
      tokens: sortTokenRows(groupTokens),
    }));
}

export function buildWalletBalancesResponse(
  address: `0x${string}`,
  celoRaw: string,
  celoFormatted: string,
  stablecoins: Array<{
    symbol: string;
    address: `0x${string}`;
    issuer?: string;
    useCase?: string;
    raw: string;
    formatted: string;
    readError?: boolean;
  }>,
  totalChecked: number,
  extraTokens: TokenBalanceRow[] = [],
): WalletBalancesResponse {
  const tokens = sortTokenRows([
    ...stablecoins.map((coin) => ({
      symbol: coin.symbol,
      formatted: coin.formatted,
      raw: coin.raw,
      address: coin.address,
      issuer: coin.issuer,
      useCase: coin.useCase,
      readError: coin.readError,
    })),
    ...extraTokens,
  ]);

  const totalNonZero = tokens.filter((token) => !isZeroBalance(token.raw)).length;

  return {
    address,
    network: "mainnet",
    celo: { formatted: celoFormatted, raw: celoRaw },
    tokens,
    totalNonZero,
    totalChecked: totalChecked + extraTokens.length,
    fetchedAt: new Date().toISOString(),
  };
}

/** GoodDollar balance row for wallet panels (G$ is excluded from stablecoin scans). */
export function goodDollarBalanceRow(balance: {
  tokenAddress: `0x${string}`;
  raw: string;
  formatted: string;
}): TokenBalanceRow {
  return {
    symbol: "G$",
    formatted: balance.formatted,
    raw: balance.raw,
    address: balance.tokenAddress,
    issuer: "GoodDollar",
    useCase: "UBI-focused token for financial inclusion",
  };
}

/** Normalize get_celo_balances tool output into token rows. */
export function normalizeCeloBalancesOutput(output: unknown): TokenBalanceRow[] {
  if (typeof output !== "object" || output === null || !("balances" in output)) {
    return [];
  }

  const balances = (output as { balances?: unknown }).balances;
  if (!Array.isArray(balances)) {
    return [];
  }

  return sortTokenRows(
    balances
      .filter(
        (entry): entry is {
          token: string;
          address: "native" | `0x${string}`;
          raw: string;
          formatted: string;
        } =>
          typeof entry === "object" &&
          entry !== null &&
          "token" in entry &&
          "formatted" in entry &&
          "raw" in entry &&
          typeof (entry as { token: unknown }).token === "string",
      )
      .map((entry) => ({
        symbol: entry.token,
        formatted: entry.formatted,
        raw: entry.raw,
        address: entry.address ?? "native",
      })),
  );
}

/** Normalize get_stablecoin_balances tool output into token rows. */
export function normalizeStablecoinBalancesOutput(
  output: unknown,
): TokenBalanceRow[] {
  if (typeof output !== "object" || output === null || !("stablecoins" in output)) {
    return [];
  }

  const stablecoins = (output as { stablecoins?: unknown }).stablecoins;
  if (!Array.isArray(stablecoins)) {
    return [];
  }

  return sortTokenRows(
    stablecoins
      .filter(
        (entry): entry is {
          symbol: string;
          address: `0x${string}`;
          raw: string;
          formatted: string;
          issuer?: string;
          useCase?: string;
          readError?: boolean;
        } =>
          typeof entry === "object" &&
          entry !== null &&
          "symbol" in entry &&
          "formatted" in entry &&
          typeof (entry as { symbol: unknown }).symbol === "string",
      )
      .map((entry) => ({
        symbol: entry.symbol,
        formatted: entry.formatted,
        raw: entry.raw,
        address: entry.address,
        issuer: entry.issuer,
        useCase: entry.useCase,
        readError: entry.readError,
      })),
  );
}

/** Normalize get_token_balance tool output into a single row. */
export function normalizeTokenBalanceOutput(output: unknown): TokenBalanceRow | null {
  if (typeof output !== "object" || output === null) {
    return null;
  }

  const row = output as {
    symbol?: string;
    tokenAddress?: `0x${string}`;
    raw?: string;
    formatted?: string;
  };

  if (!row.symbol || !row.formatted || !row.raw || !row.tokenAddress) {
    return null;
  }

  return {
    symbol: row.symbol,
    formatted: row.formatted,
    raw: row.raw,
    address: row.tokenAddress,
  };
}

/** Normalize get_account tool output into CELO row. */
export function normalizeAccountOutput(output: unknown): TokenBalanceRow | null {
  if (typeof output !== "object" || output === null) {
    return null;
  }

  const row = output as {
    balanceWei?: string;
    balanceCelo?: number;
  };

  if (typeof row.balanceWei !== "string") {
    return null;
  }

  const formatted =
    typeof row.balanceCelo === "number"
      ? String(row.balanceCelo)
      : row.balanceWei;

  return {
    symbol: "CELO",
    formatted,
    raw: row.balanceWei,
    address: "native",
    useCase: "Gas",
  };
}

export function parseToolBalanceRows(
  toolName: string,
  output: unknown,
): TokenBalanceRow[] {
  switch (toolName) {
    case "get_celo_balances":
      return normalizeCeloBalancesOutput(output);
    case "get_stablecoin_balances":
      return normalizeStablecoinBalancesOutput(output);
    case "get_token_balance": {
      const row = normalizeTokenBalanceOutput(output);
      return row ? [row] : [];
    }
    case "get_account": {
      const row = normalizeAccountOutput(output);
      return row ? [row] : [];
    }
    default:
      return [];
  }
}
