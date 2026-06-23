"use client";

import type { WalletBalancesResponse } from "@/lib/balances";
import {
  type QueryClient,
  useQuery,
} from "@tanstack/react-query";

export const WALLET_BALANCES_QUERY_KEY = "wallet-balances";
export const WALLET_BALANCES_STALE_MS = 120_000;

export function walletBalancesQueryKey(
  address: `0x${string}`,
  includeZero = false,
) {
  return [WALLET_BALANCES_QUERY_KEY, address, includeZero] as const;
}

export function invalidateWalletBalances(
  queryClient: QueryClient,
  address: `0x${string}`,
) {
  return queryClient.invalidateQueries({
    queryKey: [WALLET_BALANCES_QUERY_KEY, address],
  });
}

async function fetchWalletBalances(
  address: `0x${string}`,
  includeZero: boolean,
): Promise<WalletBalancesResponse> {
  const params = new URLSearchParams({ address });
  if (includeZero) {
    params.set("includeZero", "true");
  }

  const res = await fetch(`/api/balances?${params.toString()}`);
  const data = (await res.json()) as WalletBalancesResponse & { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load balances.");
  }

  return data;
}

export function useWalletBalances(
  address: `0x${string}` | undefined,
  includeZero = false,
) {
  const query = useQuery({
    queryKey: walletBalancesQueryKey(address!, includeZero),
    queryFn: () => fetchWalletBalances(address!, includeZero),
    enabled: Boolean(address),
    staleTime: WALLET_BALANCES_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
    lastUpdated: query.data?.fetchedAt,
  };
}
