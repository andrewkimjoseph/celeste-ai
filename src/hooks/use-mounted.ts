"use client";

import { useSyncExternalStore } from "react";

/** True after client mount — use before rendering wallet-dependent UI. */
export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
