"use client";

import { BalanceRow, GroupedBalanceList } from "@/components/balance-card";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { groupTokensByUseCase } from "@/lib/wallet/balances";
import { formatBalanceShort } from "@/lib/wallet/format-balance";
import { useState } from "react";

interface WalletBalancePanelProps {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  mounted: boolean;
  variant?: "sidebar" | "mobile-collapsible";
  hiddenOnLanding?: boolean;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`size-4 text-[var(--ink)] transition-transform duration-300 ease-in-out motion-reduce:duration-0 ${
        expanded ? "rotate-180" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  );
}

function PanelHeader({
  isFetching,
  lastUpdated,
  onRefresh,
}: {
  isFetching: boolean;
  lastUpdated?: string;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-[var(--ink)]">
          Wallet balances
        </h2>
        {lastUpdated && (
          <p className="truncate text-[10px] text-[var(--text-muted)]">
            Updated {formatRelativeTime(lastUpdated)}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isFetching}
        className="btn-brutal btn-secondary inline-flex min-w-[5.75rem] shrink-0 items-center !justify-start gap-1 px-2 py-1 text-left text-[10px] disabled:opacity-50"
        aria-label="Refresh balances"
        aria-busy={isFetching}
      >
        {isFetching ? (
          <>
            <span
              className="size-2.5 shrink-0 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent"
              aria-hidden
            />
            Refreshing…
          </>
        ) : (
          "Refresh"
        )}
      </button>
    </div>
  );
}

function PanelBody({ address }: { address: `0x${string}` }) {
  const { data, isLoading, isError, refetch, isFetching, lastUpdated } =
    useWalletBalances(address);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <span
          className="inline-block size-5 animate-spin rounded-full border-2 border-[var(--ink)] border-t-[var(--accent)]"
          aria-hidden
        />
        <p className="text-xs text-[var(--text-muted)]">Loading balances…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-4 text-center">
        <p className="text-xs font-bold text-[var(--warn)]">Could not load balances.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 text-xs font-bold text-[var(--ink)] underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const groups = groupTokensByUseCase(data.tokens);

  return (
    <>
      <PanelHeader
        isFetching={isFetching}
        lastUpdated={lastUpdated}
        onRefresh={() => void refetch()}
      />

      <div className="card-brutal mt-3 min-w-0 px-3 py-2">
        <BalanceRow
          row={{
            symbol: "CELO",
            formatted: data.celo.formatted,
            raw: data.celo.raw,
            address: "native",
            useCase: "Gas",
          }}
          compact
        />
      </div>

      <div className="mt-3">
        <GroupedBalanceList groups={groups} />
      </div>

      <p className="mt-4 border-t-2 border-[var(--ink)] px-1 pt-3 text-[10px] text-[var(--text-muted)]">
        {data.totalChecked} tokens scanned on Celo mainnet
        {data.totalNonZero > 0 && (
          <> · {data.totalNonZero} with balance</>
        )}
      </p>
    </>
  );
}

function MobileBalanceAccordion({
  address,
  isConnected,
  hiddenOnLanding,
}: {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  hiddenOnLanding?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, isFetching } = useWalletBalances(
    isConnected ? address : undefined,
  );

  if (!isConnected || !address || hiddenOnLanding) {
    return null;
  }

  const celoShort = data ? formatBalanceShort(data.celo.formatted) : null;
  const tokenCount = data?.totalNonZero ?? 0;

  return (
    <div className="shrink-0 border-b-2 border-[var(--ink)] lg:hidden">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-center justify-between gap-3 bg-[var(--surface)] px-3 py-2.5 text-left sm:px-4"
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-bold text-[var(--ink)]">Balances</span>
          {isLoading || isFetching ? (
            <span className="inline-block size-3 animate-spin rounded-full border-2 border-[var(--ink)] border-t-[var(--accent)]" />
          ) : celoShort !== null ? (
            <>
              <span className="rounded-[2px] border-2 border-[var(--ink)] bg-[var(--accent)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent-foreground)]">
                {celoShort} CELO
              </span>
              {tokenCount > 0 && (
                <span className="rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">
                  {tokenCount} token{tokenCount === 1 ? "" : "s"}
                </span>
              )}
            </>
          ) : null}
        </div>
        <ChevronIcon expanded={expanded} />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:duration-0 ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        aria-hidden={!expanded}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="max-h-[45vh] overflow-x-hidden overflow-y-auto border-t-2 border-[var(--ink)] bg-[var(--canvas)] px-3 pb-5 pt-3 sm:px-4">
            <PanelBody address={address} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function WalletBalanceSection({
  address,
  isConnected,
}: {
  address: `0x${string}` | undefined;
  isConnected: boolean;
}) {
  if (!isConnected || !address) {
    return (
      <p className="text-xs text-[var(--text-muted)]">
        Balances appear after you connect.
      </p>
    );
  }

  return (
    <div className="max-h-[40vh] overflow-x-hidden overflow-y-auto pb-2 pr-1">
      <PanelBody address={address} />
    </div>
  );
}

export function WalletBalancePanel({
  address,
  isConnected,
  mounted,
  variant = "sidebar",
  hiddenOnLanding,
}: WalletBalancePanelProps) {
  if (!mounted) {
    return null;
  }

  if (variant === "mobile-collapsible") {
    return (
      <MobileBalanceAccordion
        address={address}
        isConnected={isConnected}
        hiddenOnLanding={hiddenOnLanding}
      />
    );
  }

  if (!isConnected || !address) {
    return (
      <aside className="hidden h-full min-h-0 w-80 shrink-0 flex-col overflow-y-auto border-r-2 border-[var(--ink)] bg-[var(--surface)] p-4 lg:flex">
        <p className="text-xs text-[var(--text-muted)]">
          Balances appear after you connect.
        </p>
      </aside>
    );
  }

  return (
    <aside className="hidden h-full min-h-0 w-80 shrink-0 flex-col overflow-y-auto border-r-2 border-[var(--ink)] bg-[var(--surface)] p-4 lg:flex">
      <PanelBody address={address} />
    </aside>
  );
}
