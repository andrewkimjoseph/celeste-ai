"use client";

import type { TokenBalanceRow } from "@/lib/wallet/balances";
import { formatBalanceShort } from "@/lib/wallet/format-balance";

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
      className={`flex min-w-0 gap-2 sm:items-center sm:justify-between ${
        compact ? "flex-col py-1.5 sm:flex-row" : "flex-col py-2 sm:flex-row"
      } ${isZero(row.raw) ? "opacity-50" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className={`truncate font-bold text-[var(--ink)] ${compact ? "text-xs" : "text-sm"}`}>
          {row.symbol}
          {row.readError && (
            <span className="ml-1.5 text-[10px] font-normal text-[var(--accent)]">
              unreadable
            </span>
          )}
        </p>
        {subtitle && (
          <p className="truncate text-[10px] text-[var(--text-muted)]">{subtitle}</p>
        )}
      </div>
      <p
        className={`max-w-full font-mono font-bold tabular-nums text-[var(--ink)] sm:shrink-0 sm:text-right ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {formatBalanceShort(row.formatted)}
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
      <div className="card-brutal mt-2 px-3 py-2 sm:px-3.5">
        <p className="text-xs text-[var(--text-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="card-brutal mt-2 px-3 py-2 sm:px-3.5">
      {title && (
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
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
        <div className={celo ? "mt-1 border-t-2 border-[var(--ink)] pt-1" : ""}>
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
      <p className="px-1 py-4 text-center text-xs text-[var(--text-muted)]">
        No token balances found.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visibleGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
            {group.label}
          </p>
          <div className="card-brutal min-w-0 overflow-hidden px-3 py-1">
            {group.tokens.map((row) => (
              <BalanceRow key={`${row.symbol}-${row.address}`} row={row} compact />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
