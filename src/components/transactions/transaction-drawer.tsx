"use client";

import { TransactionRow } from "@/components/transactions/transaction-row";
import { useTransactions } from "@/hooks/use-transactions";
import { useEffect, useRef } from "react";

export function TransactionDrawer() {
  const {
    transactions,
    isLoading,
    isOpen,
    selectedId,
    closeDrawer,
    clearSelection,
  } = useTransactions();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDrawer();
        clearSelection();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeDrawer, clearSelection]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close transactions panel"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          closeDrawer();
          clearSelection();
        }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-drawer-title"
        className="absolute right-0 top-0 flex h-dvh w-full max-w-md translate-x-0 flex-col border-l border-[var(--surface-2)] bg-[var(--surface-0)] shadow-2xl shadow-black/40 transition-transform duration-300 ease-out"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgb(108 180 238 / 0.08), transparent)",
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--surface-2)] px-4 py-4">
          <div>
            <h2
              id="transaction-drawer-title"
              className="text-base font-semibold text-white"
            >
              Transactions
            </h2>
            <p className="text-xs text-zinc-500">
              {transactions.length === 0
                ? "Confirmed through Celeste"
                : `${transactions.length} confirmed`}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => {
              closeDrawer();
              clearSelection();
            }}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full border border-[var(--surface-2)] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <span
                className="inline-block size-5 animate-spin rounded-full border-2 border-zinc-600 border-t-[var(--accent-hover)]"
                aria-hidden
              />
              <span className="sr-only">Loading transactions</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-[var(--surface-2)] bg-[var(--surface-1)] text-zinc-500">
                <svg
                  className="size-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-zinc-200">
                No transactions yet
              </p>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-zinc-500">
                Confirm a swap, send, or DeFi action in chat and it will appear
                here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  selected={selectedId === transaction.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
