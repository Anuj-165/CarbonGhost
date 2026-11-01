import type { StageId } from '@/lib/benchmark/protocol';

export const STAGE_LABELS: Record<StageId, string> = {
  validate: 'Validate input',
  correctness: 'Check outputs match',
  warmup: 'Warm-up',
  baseline: 'Measure baseline',
  candidate: 'Measure candidate',
  process: 'Summarize results',
};

export const STAGE_DETAIL: Record<StageId, string> = {
  validate: 'Compiles both implementations and checks the function signatures.',
  correctness: 'Runs both on the same queries. If the outputs differ, timing never starts.',
  warmup: 'Unrecorded calls so the engine reaches a steady state.',
  baseline: 'Timed repetitions of the baseline on the generated input.',
  candidate: 'Timed repetitions of the candidate on the same input, after the baseline finishes.',
  process: 'Computes medians, variability and the energy estimate.',
};
