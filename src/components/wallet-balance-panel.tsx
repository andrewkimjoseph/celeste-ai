"use client";

import { BalanceRow, GroupedBalanceList } from "@/components/balance-card";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { groupTokensByUseCase } from "@/lib/balances";
import { formatBalanceShort } from "@/lib/format-balance";
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
      className={`size-4 text-zinc-500 transition-transform duration-300 ease-in-out motion-reduce:duration-0 ${
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
      <div>
        <h2 className="text-sm font-semibold text-white">Wallet balances</h2>
        {lastUpdated && (
          <p className="text-[10px] text-zinc-500">
            Updated {formatRelativeTime(lastUpdated)}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isFetching}
        className="rounded-md border border-[var(--surface-2)] px-2 py-1 text-[10px] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-50"
        aria-label="Refresh balances"
      >
        {isFetching ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}

function PanelBody({
  address,
  includeZero,
  onIncludeZeroChange,
}: {
  address: `0x${string}`;
  includeZero: boolean;
  onIncludeZeroChange: (value: boolean) => void;
}) {
  const { data, isLoading, isError, refetch, isFetching, lastUpdated } =
    useWalletBalances(address, includeZero);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <span
          className="inline-block size-5 animate-spin rounded-full border-2 border-zinc-600 border-t-[var(--accent)]"
          aria-hidden
        />
        <p className="text-xs text-zinc-500">Loading balances…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-4 text-center">
        <p className="text-xs text-red-400">Could not load balances.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 text-xs text-[var(--accent)] hover:underline"
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

      <div className="mt-3 rounded-lg border border-[var(--surface-2)] bg-[var(--surface-1)] px-3 py-2">
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
        <GroupedBalanceList groups={groups} showZeroBalances={includeZero} />
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2 px-1">
        <input
          type="checkbox"
          checked={includeZero}
          onChange={(event) => onIncludeZeroChange(event.target.checked)}
          className="size-3.5 rounded border-zinc-600 bg-zinc-900 accent-[var(--accent)]"
        />
        <span className="text-xs text-zinc-400">Show zero balances</span>
      </label>

      <p className="mt-3 px-1 text-[10px] text-zinc-600">
        {data.totalChecked} tokens scanned on Celo mainnet
        {!includeZero && data.totalNonZero > 0 && (
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
  const [includeZero, setIncludeZero] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, isFetching } = useWalletBalances(
    isConnected ? address : undefined,
    includeZero,
  );

  if (!isConnected || !address || hiddenOnLanding) {
    return null;
  }

  const celoShort = data ? formatBalanceShort(data.celo.formatted) : null;
  const tokenCount = data?.totalNonZero ?? 0;

  return (
    <div className="border-t border-[var(--surface-2)] lg:hidden">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.02] sm:px-4"
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-medium text-zinc-300">Balances</span>
          {isLoading || isFetching ? (
            <span className="inline-block size-3 animate-spin rounded-full border-2 border-zinc-600 border-t-[var(--accent-hover)]" />
          ) : celoShort !== null ? (
            <>
              <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent-soft-text)]">
                {celoShort} CELO
              </span>
              {tokenCount > 0 && (
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
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
          <div className="max-h-[45vh] overflow-y-auto border-t border-[var(--surface-2)] bg-[var(--surface-1)]/40 px-3 pb-4 pt-3 sm:px-4">
            <PanelBody
              address={address}
              includeZero={includeZero}
              onIncludeZeroChange={setIncludeZero}
            />
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
  const [includeZero, setIncludeZero] = useState(false);

  if (!isConnected || !address) {
    return (
      <p className="text-xs text-zinc-500">
        Balances appear after you connect.
      </p>
    );
  }

  return (
    <div className="max-h-[40vh] overflow-y-auto">
      <PanelBody
        address={address}
        includeZero={includeZero}
        onIncludeZeroChange={setIncludeZero}
      />
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
  const [includeZero, setIncludeZero] = useState(false);

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
      <aside className="hidden h-full min-h-0 w-72 shrink-0 flex-col overflow-y-auto border-r border-[var(--surface-2)] bg-[var(--surface-1)]/50 p-4 lg:flex">
        <p className="text-xs text-zinc-500">
          Balances appear after you connect.
        </p>
      </aside>
    );
  }

  return (
    <aside className="hidden h-full min-h-0 w-72 shrink-0 flex-col overflow-y-auto border-r border-[var(--surface-2)] bg-[var(--surface-1)]/50 p-4 lg:flex">
      <PanelBody
        address={address}
        includeZero={includeZero}
        onIncludeZeroChange={setIncludeZero}
      />
    </aside>
  );
}
