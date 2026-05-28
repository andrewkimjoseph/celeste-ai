/** Short display for nav chips (avoids long decimal strings on mobile). */
export function formatBalanceShort(
  formatted: string,
  maxFractionDigits = 4,
): string {
  const num = Number(formatted);
  if (Number.isNaN(num)) {
    return formatted;
  }
  if (num === 0) {
    return "0";
  }
  if (num > 0 && num < 10 ** -maxFractionDigits) {
    return `<${10 ** -maxFractionDigits}`;
  }
  return num.toLocaleString(undefined, {
    maximumFractionDigits: maxFractionDigits,
  });
}
