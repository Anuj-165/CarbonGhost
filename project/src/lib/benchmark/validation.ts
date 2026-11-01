import type { RunConfig } from '@/lib/benchmark/protocol';

export const LIMITS = {
  repetitions: { min: 3, max: 30 },
  warmup: { min: 0, max: 10 },
  timeoutSec: { min: 5, max: 120 },
} as const;

export function validateConfig(config: RunConfig): string | null {
  if (!config.name.trim()) return 'Give this comparison a name before running it.';
  if (!config.baseline.trim() || !config.candidate.trim()) {
    return 'Both panels need code before the comparison can run.';
  }
  const { repetitions, warmup, timeoutSec } = LIMITS;
  if (config.repetitions < repetitions.min || config.repetitions > repetitions.max) {
    return `Repetitions must be between ${repetitions.min} and ${repetitions.max}.`;
  }
  if (config.warmup < warmup.min || config.warmup > warmup.max) {
    return `Warm-up runs must be between ${warmup.min} and ${warmup.max}.`;
  }
  if (config.timeoutSec < timeoutSec.min || config.timeoutSec > timeoutSec.max) {
    return `Timeout must be between ${timeoutSec.min} and ${timeoutSec.max} seconds.`;
  }
  return null;
}
