export type ImportRetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

export const DEFAULT_IMPORT_RETRY_POLICY: ImportRetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 5_000,
};

export function isRetryableImportError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("instrument_identity_conflict")) return false;
  if (normalized.includes("unique constraint")) return false;
  if (normalized.includes("check constraint")) return false;
  if (normalized.includes("invalid")) return false;

  return normalized.includes("timeout") ||
    normalized.includes("temporarily") ||
    normalized.includes("connection") ||
    normalized.includes("rate limit") ||
    normalized.includes("429") ||
    normalized.includes("503");
}

export function retryDelayMs(
  attempt: number,
  policy: ImportRetryPolicy = DEFAULT_IMPORT_RETRY_POLICY,
): number {
  const exponential = policy.baseDelayMs * 2 ** Math.max(0, attempt - 1);
  return Math.min(exponential, policy.maxDelayMs);
}
