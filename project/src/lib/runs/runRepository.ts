import { supabase } from '@/lib/supabase';
import type { BenchmarkOutcome } from '@/lib/benchmark/useBenchmarkRun';
import type { EnergyAssumptions } from '@/lib/benchmark/energy';
import type { EnvironmentInfo } from '@/lib/environment';
import { summarize, type Summary } from '@/lib/benchmark/stats';

export interface StoredRun {
  id: string;
  name: string;
  mode: 'isolated' | 'end-to-end';
  inputSize: number;
  createdAt: string;
  baselineMedianMs: number | null;
  candidateMedianMs: number | null;
  outcome: StoredOutcome;
}

export interface StoredOutcome {
  outcome: BenchmarkOutcome;
  environment: EnvironmentInfo | null;
  assumptions: EnergyAssumptions;
  baselineSummary: Summary | null;
  candidateSummary: Summary | null;
}

interface RunRow {
  id: string;
  name: string;
  mode: 'isolated' | 'end-to-end';
  input_size: number;
  baseline_median_ms: number | null;
  candidate_median_ms: number | null;
  result: StoredOutcome;
  created_at: string;
}

function isStoredOutcome(value: unknown): value is StoredOutcome {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<StoredOutcome>;
  return typeof candidate.outcome === 'object' && candidate.outcome !== null && typeof candidate.assumptions === 'object';
}

function toStoredRun(row: RunRow): StoredRun | null {
  if (!isStoredOutcome(row.result)) return null;
  return {
    id: row.id,
    name: row.name,
    mode: row.mode,
    inputSize: row.input_size,
    createdAt: row.created_at,
    baselineMedianMs: row.baseline_median_ms,
    candidateMedianMs: row.candidate_median_ms,
    outcome: row.result,
  };
}

export function buildStoredOutcome(
  outcome: BenchmarkOutcome,
  environment: EnvironmentInfo | null,
  assumptions: EnergyAssumptions,
): StoredOutcome {
  return {
    outcome,
    environment,
    assumptions,
    baselineSummary: summarize(successfulTimes(outcome.baseline.samples)),
    candidateSummary: summarize(successfulTimes(outcome.candidate.samples)),
  };
}

export function successfulTimes(samples: BenchmarkOutcome['baseline']['samples']): number[] {
  return samples.flatMap((sample) => (sample.ok && sample.perCallMs !== null ? [sample.perCallMs] : []));
}

export async function saveRun(stored: StoredOutcome): Promise<StoredRun> {
  const { outcome } = stored;
  const { data, error } = await supabase
    .from('benchmark_runs')
    .insert({
      name: outcome.config.name,
      mode: outcome.config.mode,
      input_size: outcome.config.inputSize,
      repetitions: outcome.config.repetitions,
      warmup: outcome.config.warmup,
      timeout_sec: outcome.config.timeoutSec,
      baseline_source: outcome.config.baseline,
      candidate_source: outcome.config.candidate,
      baseline_median_ms: stored.baselineSummary?.median ?? null,
      candidate_median_ms: stored.candidateSummary?.median ?? null,
      result: stored,
    })
    .select('id, name, mode, input_size, baseline_median_ms, candidate_median_ms, result, created_at')
    .single();

  if (error) throw new Error(error.message);
  const run = toStoredRun(data as RunRow);
  if (!run) throw new Error('The saved run could not be read back.');
  return run;
}

export async function listRuns(): Promise<StoredRun[]> {
  const { data, error } = await supabase
    .from('benchmark_runs')
    .select('id, name, mode, input_size, baseline_median_ms, candidate_median_ms, result, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return ((data ?? []) as RunRow[]).flatMap((row) => {
    const run = toStoredRun(row);
    return run ? [run] : [];
  });
}
