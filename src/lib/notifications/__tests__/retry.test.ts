import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../retry';

const noSleep = () => Promise.resolve();

describe('withRetry', () => {
  it('returns immediately on first success (no retries)', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(withRetry(fn, { sleep: noSleep })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries until success and stops', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockResolvedValue('done');
    await expect(withRetry(fn, { retries: 2, sleep: noSleep })).resolves.toBe('done');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws the last error after exhausting retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(withRetry(fn, { retries: 2, sleep: noSleep })).rejects.toThrow('boom');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('applies exponential backoff delays', async () => {
    const delays: number[] = [];
    const sleep = (ms: number) => {
      delays.push(ms);
      return Promise.resolve();
    };
    const fn = vi.fn().mockRejectedValue(new Error('x'));
    await expect(
      withRetry(fn, { retries: 3, baseDelayMs: 100, factor: 2, sleep })
    ).rejects.toThrow();
    expect(delays).toEqual([100, 200, 400]); // one fewer than total attempts
  });
});
