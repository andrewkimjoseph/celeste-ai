"use client";

import type { WalletBalancesResponse } from "@/lib/balances";
import { useQuery } from "@tanstack/react-query";

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
    queryKey: ["wallet-balances", address, includeZero],
    queryFn: () => fetchWalletBalances(address!, includeZero),
    enabled: Boolean(address),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
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
