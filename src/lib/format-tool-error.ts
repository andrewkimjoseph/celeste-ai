/** User-facing copy for known tool failures — replaces cold API error strings. */

export function formatToolErrorMessage(
  _toolName: string,
  errorText: string,
): string {
  const text = errorText.trim();
  if (!text) {
    return "Something went wrong. Please try again.";
  }

  return text;
}

/** Whether a tool error is an expected limitation, not a system failure. */
export function isExpectedToolError(
  _toolName: string,
  _errorText: string,
): boolean {
  return false;
}
