
import type { BenchmarkOutcome } from '@/lib/benchmark/useBenchmarkRun';
import type { EnergyAssumptions } from '@/lib/benchmark/energy';
import type { EnvironmentInfo } from '@/lib/environment';
import { summarize, type Summary } from '@/lib/benchmark/stats';

const STORAGE_KEY = 'carbonghost_benchmark_runs';
const MAX_SAVED_RUNS = 100;

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

function isStoredOutcome(value: unknown): value is StoredOutcome {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<StoredOutcome>;

  return (
    typeof candidate.outcome === 'object' &&
    candidate.outcome !== null &&
    typeof candidate.assumptions === 'object' &&
    candidate.assumptions !== null
  );
}

function readRuns(): StoredRun[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error('Invalid benchmark history format.');
    }

    return parsed.filter((run): run is StoredRun => {
      return (
        typeof run === 'object' &&
        run !== null &&
        typeof run.id === 'string' &&
        typeof run.name === 'string' &&
        (run.mode === 'isolated' || run.mode === 'end-to-end') &&
        typeof run.inputSize === 'number' &&
        typeof run.createdAt === 'string' &&
        isStoredOutcome(run.outcome)
      );
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Saved benchmark history is corrupted.');
    }

    throw error;
  }
}

function writeRuns(runs: StoredRun[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(runs.slice(0, MAX_SAVED_RUNS))
    );
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      throw new Error(
        'Browser storage is full. Delete some saved benchmark runs and try again.'
      );
    }

    throw new Error(
      error instanceof Error
        ? error.message
        : 'Could not save benchmark history.'
    );
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

export function successfulTimes(
  samples: BenchmarkOutcome['baseline']['samples']
): number[] {
  return samples.flatMap((sample) =>
    sample.ok && sample.perCallMs !== null
      ? [sample.perCallMs]
      : []
  );
}

export async function saveRun(
  stored: StoredOutcome
): Promise<StoredRun> {
  const { outcome } = stored;

  const run: StoredRun = {
    id: createId(),
    name: outcome.config.name,
    mode: outcome.config.mode,
    inputSize: outcome.config.inputSize,
    createdAt: new Date().toISOString(),
    baselineMedianMs: stored.baselineSummary?.median ?? null,
    candidateMedianMs: stored.candidateSummary?.median ?? null,
    outcome: stored,
  };

  const existingRuns = readRuns();

  const updatedRuns = [
    run,
    ...existingRuns.filter((item) => item.id !== run.id),
  ].slice(0, MAX_SAVED_RUNS);

  writeRuns(updatedRuns);

  return run;
}

export async function listRuns(): Promise<StoredRun[]> {
  return readRuns().sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );
}

export async function deleteRun(id: string): Promise<void> {
  const runs = readRuns();
  writeRuns(runs.filter((run) => run.id !== id));
}

export async function clearRuns(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
}
