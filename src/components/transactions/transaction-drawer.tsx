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
        className="absolute inset-0 bg-[var(--overlay-backdrop)]"
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
        className="absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col border-l-2 border-[var(--ink)] bg-[var(--surface)]"
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-[var(--ink)] px-4 py-4">
          <div>
            <h2
              id="transaction-drawer-title"
              className="text-base font-bold tracking-tight text-[var(--ink)]"
            >
              Transactions
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {transactions.length === 0
                ? "Confirmed through Celeste AI"
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
            className="flex size-9 items-center justify-center rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-brutal-sm)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
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
                className="inline-block size-5 animate-spin rounded-full border-2 border-[var(--ink)] border-t-[var(--accent)]"
                aria-hidden
              />
              <span className="sr-only">Loading transactions</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-[2px] border-2 border-[var(--ink)] bg-[var(--canvas)] text-[var(--ink)] shadow-[var(--shadow-brutal-sm)]">
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
              <p className="mt-4 text-sm font-bold text-[var(--ink)]">
                No transactions yet
              </p>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
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
