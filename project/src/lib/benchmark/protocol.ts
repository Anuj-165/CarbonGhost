import type { DatasetSpec } from '@/lib/benchmark/dataset';

export type BenchmarkMode = 'isolated' | 'end-to-end';

export type StageId = 'validate' | 'correctness' | 'warmup' | 'baseline' | 'candidate' | 'process';

export interface RunConfig {
  name: string;
  baseline: string;
  candidate: string;
  inputSize: number;
  repetitions: number;
  warmup: number;
  timeoutSec: number;
  mode: BenchmarkMode;
}

export interface TestCheck {
  name: string;
  records: number;
  queries: number;
  ok: boolean;
  detail: string;
}

export interface Sample {
  index: number;
  ok: boolean;
  perCallMs: number | null;
  error?: string;
  heapDeltaBytes?: number | null;
}

export interface ImplementationRun {
  iterations: number;
  samples: Sample[];
}

export type WorkerRequest = {
  type: 'run';
  config: RunConfig;
  input: DatasetSpec;
};

export type WorkerEvent =
  | { type: 'stage'; stage: StageId; status: 'active' | 'done'; impl?: 'baseline' | 'candidate'; rep?: number; total?: number }
  | { type: 'sample'; impl: 'baseline' | 'candidate'; sample: Sample }
  | { type: 'tests'; tests: TestCheck[] }
  | { type: 'mismatch'; tests: TestCheck[] }
  | { type: 'finished'; baseline: ImplementationRun; candidate: ImplementationRun; tests: TestCheck[] }
  | { type: 'failed'; stage: StageId; message: string };
