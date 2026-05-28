"use client";

import type { TokenBalanceRow } from "@/lib/balances";

interface BalanceRowProps {
  row: TokenBalanceRow;
  compact?: boolean;
  showSubtitle?: boolean;
}

function isZero(raw: string): boolean {
  return raw === "0" || raw === "0n";
}

export function BalanceRow({
  row,
  compact = false,
  showSubtitle = true,
}: BalanceRowProps) {
  const subtitle =
    showSubtitle && (row.useCase || row.issuer)
      ? (row.useCase ?? row.issuer)
      : null;

  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        compact ? "py-1.5" : "py-2"
      } ${isZero(row.raw) ? "opacity-50" : ""}`}
    >
      <div className="min-w-0">
        <p className={`truncate font-medium text-zinc-100 ${compact ? "text-xs" : "text-sm"}`}>
          {row.symbol}
          {row.readError && (
            <span className="ml-1.5 text-[10px] font-normal text-amber-400">
              unreadable
            </span>
          )}
        </p>
        {subtitle && (
          <p className="truncate text-[10px] text-zinc-500">{subtitle}</p>
        )}
      </div>
      <p
        className={`shrink-0 font-mono tabular-nums text-zinc-200 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {row.formatted}
      </p>
    </div>
  );
}

interface BalanceCardProps {
  rows: TokenBalanceRow[];
  celo?: { formatted: string };
  compact?: boolean;
  title?: string;
  emptyMessage?: string;
  showZeroBalances?: boolean;
}

export function BalanceCard({
  rows,
  celo,
  compact = false,
  title,
  emptyMessage = "All scanned balances are zero.",
  showZeroBalances = true,
}: BalanceCardProps) {
  const filteredRows = showZeroBalances
    ? rows
    : rows.filter((row) => !isZero(row.raw));

  const hasCelo = celo && celo.formatted !== "0";
  const hasTokens = filteredRows.length > 0;

  if (!hasCelo && !hasTokens) {
    return (
      <div className="mt-2 rounded-lg border border-[var(--surface-2)] bg-[var(--surface-1)] px-3 py-2">
        <p className="text-xs text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-[var(--surface-2)] bg-[var(--surface-1)] px-3 py-2">
      {title && (
        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          {title}
        </p>
      )}
      {celo && (
        <BalanceRow
          row={{
            symbol: "CELO",
            formatted: celo.formatted,
            raw: "0",
            address: "native",
            useCase: "Gas",
          }}
          compact={compact}
        />
      )}
      {filteredRows.length > 0 && (
        <div className={celo ? "mt-1 border-t border-[var(--surface-2)] pt-1" : ""}>
          {filteredRows.map((row) => (
            <BalanceRow key={`${row.symbol}-${row.address}`} row={row} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}

interface GroupedBalanceListProps {
  groups: Array<{ label: string; tokens: TokenBalanceRow[] }>;
  showZeroBalances?: boolean;
}

export function GroupedBalanceList({
  groups,
  showZeroBalances = false,
}: GroupedBalanceListProps) {
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      tokens: showZeroBalances
        ? group.tokens
        : group.tokens.filter((token) => !isZero(token.raw)),
    }))
    .filter((group) => group.tokens.length > 0);

  if (visibleGroups.length === 0) {
    return (
      <p className="px-1 py-4 text-center text-xs text-zinc-500">
        No token balances found.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visibleGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {group.label}
          </p>
          <div className="rounded-lg border border-[var(--surface-2)] bg-[var(--surface-1)] px-3 py-1">
            {group.tokens.map((row) => (
              <BalanceRow key={`${row.symbol}-${row.address}`} row={row} compact />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
