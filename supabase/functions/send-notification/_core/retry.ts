// AUTO-GENERATED — do not edit by hand.
// Source: src/lib/notifications/retry.ts · regenerate: npm run notify:sync

/**
 * Tiny retry helper with exponential backoff. `sleep` is injectable so tests
 * run instantly and deterministically.
 */
export interface RetryOptions {
  /** Extra attempts after the first try. Default 2 → up to 3 calls total. */
  retries?: number;
  /** Base delay before the first retry, in ms. Default 500. */
  baseDelayMs?: number;
  /** Backoff multiplier. Default 2 → 500ms, 1000ms, 2000ms, … */
  factor?: number;
  sleep?: (ms: number) => Promise<void>;
  /** Observe each failed attempt (0-indexed). */
  onAttempt?: (attempt: number, error: unknown) => void;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const {
    retries = 2,
    baseDelayMs = 500,
    factor = 2,
    sleep = defaultSleep,
    onAttempt,
  } = opts;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      onAttempt?.(attempt, error);
      if (attempt < retries) {
        await sleep(baseDelayMs * Math.pow(factor, attempt));
      }
    }
  }
  throw lastError;
}
