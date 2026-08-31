"use client";

import {
  addTransactionToDb,
  findTransactionByHash,
  listTransactions,
} from "@/lib/tx/transaction-db";
import type { NewSessionTransaction, SessionTransaction } from "@/lib/tx/transactions";
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

const EMPTY_TRANSACTIONS: SessionTransaction[] = [];

interface TransactionProviderProps {
  address?: `0x${string}`;
  children: ReactNode;
}

type TransactionCache = {
  address: string;
  rows: SessionTransaction[];
};

export function TransactionProvider({
  address,
  children,
}: TransactionProviderProps) {
  const [cache, setCache] = useState<TransactionCache | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const walletAddress = address?.toLowerCase();

  useEffect(() => {
    if (!address || !walletAddress) {
      return;
    }

    let cancelled = false;

    void listTransactions(address)
      .then((rows) => {
        if (!cancelled) {
          setCache({ address: walletAddress, rows });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCache({ address: walletAddress, rows: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address, walletAddress]);

  const transactions = useMemo(
    () =>
      walletAddress && cache?.address === walletAddress
        ? cache.rows
        : EMPTY_TRANSACTIONS,
    [walletAddress, cache],
  );
  const isLoading =
    Boolean(walletAddress) && cache?.address !== walletAddress;

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

      const normalizedAddress = address.toLowerCase();

      const optimistic: SessionTransaction = {
        ...tx,
        id: crypto.randomUUID(),
        address: normalizedAddress,
        timestamp: Date.now(),
      };

      setCache((current) => {
        if (current?.address === normalizedAddress) {
          return {
            address: normalizedAddress,
            rows: [optimistic, ...current.rows],
          };
        }
        return { address: normalizedAddress, rows: [optimistic] };
      });

      try {
        const saved = await addTransactionToDb({
          ...tx,
          address,
        });

        setCache((current) => {
          if (current?.address !== normalizedAddress) {
            return current;
          }
          return {
            address: normalizedAddress,
            rows: [
              saved,
              ...current.rows.filter((row) => row.id !== optimistic.id),
            ],
          };
        });

        return saved;
      } catch {
        setCache((current) => {
          if (current?.address !== normalizedAddress) {
            return current;
          }
          return {
            address: normalizedAddress,
            rows: current.rows.filter((row) => row.id !== optimistic.id),
          };
        });
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
