import Dexie, { type Table } from "dexie";
import {
  MAX_TRANSACTIONS_PER_WALLET,
  type NewSessionTransaction,
  type SessionTransaction,
} from "@/lib/transactions";

class TransactionDatabase extends Dexie {
  transactions!: Table<SessionTransaction, string>;

  constructor() {
    super("celeste-ai");
    this.version(1).stores({
      transactions: "id, address, timestamp",
    });
  }
}

export const txDb = new TransactionDatabase();

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export async function listTransactions(
  address: string,
): Promise<SessionTransaction[]> {
  return txDb.transactions
    .where("address")
    .equals(normalizeAddress(address))
    .reverse()
    .sortBy("timestamp");
}

async function trimTransactionsForAddress(address: string): Promise<void> {
  const normalized = normalizeAddress(address);
  const rows = await txDb.transactions
    .where("address")
    .equals(normalized)
    .reverse()
    .sortBy("timestamp");

  if (rows.length <= MAX_TRANSACTIONS_PER_WALLET) {
    return;
  }

  const overflow = rows.slice(MAX_TRANSACTIONS_PER_WALLET);
  await txDb.transactions.bulkDelete(overflow.map((row) => row.id));
}

export async function addTransactionToDb(
  tx: NewSessionTransaction,
): Promise<SessionTransaction> {
  const record: SessionTransaction = {
    ...tx,
    id: crypto.randomUUID(),
    address: normalizeAddress(tx.address),
    timestamp: Date.now(),
  };

  await txDb.transactions.add(record);
  await trimTransactionsForAddress(record.address);

  return record;
}

export async function findTransactionByHash(
  address: string,
  hash: string,
): Promise<SessionTransaction | undefined> {
  const normalizedAddress = normalizeAddress(address);
  const rows = await txDb.transactions
    .where("address")
    .equals(normalizedAddress)
    .reverse()
    .sortBy("timestamp");

  return rows.find((row) =>
    row.hashes.some((entry) => hashMatches(entry, hash)),
  );
}

function hashMatches(storedHash: string, queryHash: string): boolean {
  const stored = storedHash.toLowerCase();
  const query = queryHash.toLowerCase();

  if (stored === query) {
    return true;
  }

  const truncatedMatch = query.match(/^0x([a-f0-9]+)…([a-f0-9]+)$/i);
  if (!truncatedMatch) {
    return false;
  }

  const prefix = truncatedMatch[1];
  const suffix = truncatedMatch[2];
  return stored.startsWith(`0x${prefix}`) && stored.endsWith(suffix);
}
