import { z } from "zod";

export const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address");

export const addressOrEnsSchema = z
  .string()
  .min(3)
  .describe("0x address or ENS name (e.g. andrewkimjoseph.celo.eth)");

export const blockIdSchema = z.union([
  z.number().int().nonnegative(),
  z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid block hash"),
  z.literal("latest"),
  z.literal("pending"),
]);

export const abiSchema = z
  .array(z.record(z.string(), z.unknown()))
  .min(1)
  .describe("Contract ABI as a JSON array");

export function resolveTargetAddress(
  connectedAddress: `0x${string}`,
  address?: string,
): `0x${string}` {
  return (address ?? connectedAddress) as `0x${string}`;
}
