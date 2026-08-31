export type SessionTransaction = {
  id: string;
  address: string;
  hashes: string[];
  summary: string;
  steps: string[];
  status: "confirmed";
  timestamp: number;
};

export type NewSessionTransaction = Omit<
  SessionTransaction,
  "id" | "timestamp" | "address"
> & {
  address: string;
};

export const MAX_TRANSACTIONS_PER_WALLET = 50;
