"use client";

import {
  addTransactionToDb,
  findTransactionByHash,
  listTransactions,
} from "@/lib/transaction-db";
import type { NewSessionTransaction, SessionTransaction } from "@/lib/transactions";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface TransactionContextValue {
  transactions: SessionTransaction[];
  isLoading: boolean;
  isOpen: boolean;
  selectedId: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  selectTransaction: (id: string | null) => void;
  clearSelection: () => void;
  addTransaction: (tx: NewSessionTransaction) => Promise<SessionTransaction | null>;
  openTransactionByHash: (hash: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextValue | null>(null);

interface TransactionProviderProps {
  address?: `0x${string}`;
  children: ReactNode;
}

export function TransactionProvider({
  address,
  children,
}: TransactionProviderProps) {
  const [transactions, setTransactions] = useState<SessionTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    void listTransactions(address)
      .then((rows) => {
        if (!cancelled) {
          setTransactions(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTransactions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const selectTransaction = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
  }, []);

  const addTransaction = useCallback(
    async (tx: NewSessionTransaction): Promise<SessionTransaction | null> => {
      if (!address) {
        return null;
      }

      const optimistic: SessionTransaction = {
        ...tx,
        id: crypto.randomUUID(),
        address: address.toLowerCase(),
        timestamp: Date.now(),
      };

      setTransactions((current) => [optimistic, ...current]);

      try {
        const saved = await addTransactionToDb({
          ...tx,
          address,
        });

        setTransactions((current) => [
          saved,
          ...current.filter((row) => row.id !== optimistic.id),
        ]);

        return saved;
      } catch {
        setTransactions((current) =>
          current.filter((row) => row.id !== optimistic.id),
        );
        return null;
      }
    },
    [address],
  );

  const openTransactionByHash = useCallback(
    async (hash: string) => {
      if (!address) {
        openDrawer();
        return;
      }

      const match = await findTransactionByHash(address, hash);
      if (match) {
        setSelectedId(match.id);
      }
      setIsOpen(true);
    },
    [address, openDrawer],
  );

  const value = useMemo<TransactionContextValue>(
    () => ({
      transactions,
      isLoading,
      isOpen,
      selectedId,
      openDrawer,
      closeDrawer,
      selectTransaction,
      clearSelection,
      addTransaction,
      openTransactionByHash,
    }),
    [
      transactions,
      isLoading,
      isOpen,
      selectedId,
      openDrawer,
      closeDrawer,
      selectTransaction,
      clearSelection,
      addTransaction,
      openTransactionByHash,
    ],
  );

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions(): TransactionContextValue {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error("useTransactions must be used within TransactionProvider");
  }
  return context;
}
