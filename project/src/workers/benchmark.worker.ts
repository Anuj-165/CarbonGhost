import { generateDataset, QUERY_COUNT, INPUT_SEED, type Dataset, type DatasetSpec } from '@/lib/benchmark/dataset';
import type {
  ImplementationRun,
  Sample,
  StageId,
  TestCheck,
  WorkerEvent,
  WorkerRequest,
} from '@/lib/benchmark/protocol';

interface Solver {
  prepare: (input: Dataset) => unknown;
  solve: (state: unknown) => unknown;
}

type Implementation = 'baseline' | 'candidate';
type Mode = WorkerRequest['config']['mode'];

const CALIBRATION_TARGET_MS = 8;
const MAX_ITERATIONS = 5000;

const scope = self as unknown as {
  postMessage: (message: WorkerEvent) => void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
};

let blackhole: unknown;
let currentStage: StageId = 'validate';

const emit = (event: WorkerEvent) => scope.postMessage(event);

const serialize = (value: unknown) => JSON.stringify(value) ?? 'undefined';

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error));

function compile(code: string, label: string): Solver {
  let factory: () => Solver;
  try {
    factory = new Function(
      `${code}\n;return {
        prepare: typeof prepare === 'function' ? prepare : (input) => input,
        solve: typeof solve === 'function' ? solve : undefined,
      };`,
    ) as () => Solver;
  } catch (error) {
    throw new Error(`${label} has a syntax error: ${describe(error)}`);
  }

  const solver = factory();
  if (typeof solver.solve !== 'function') {
    throw new Error(`${label} must define a solve(state) function.`);
  }
  return solver;
}

function runOnce(solver: Solver, input: Dataset) {
  return solver.solve(solver.prepare(input));
}

function firstMismatch(a: unknown, b: unknown): number {
  if (!Array.isArray(a) || !Array.isArray(b)) return -1;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    if (serialize(a[i]) !== serialize(b[i])) return i;
  }
  return -1;
}

function checkCorrectness(baseline: Solver, candidate: Solver, mainSpec: DatasetSpec): TestCheck[] {
  const specs: { name: string; spec: DatasetSpec }[] = [
    { name: 'Empty dataset', spec: { size: 0, queries: 5, seed: 7 } },
    { name: 'Single record', spec: { size: 1, queries: 8, seed: 11 } },
    { name: 'Small dataset', spec: { size: 50, queries: 60, seed: 13 } },
    { name: 'Benchmark input', spec: mainSpec },
  ];

  return specs.map(({ name, spec }) => {
    const base = { name, records: spec.size, queries: spec.queries };
    const input = generateDataset(spec);
    const before = serialize(input);

    let baselineOut: unknown;
    let candidateOut: unknown;
    try {
      baselineOut = runOnce(baseline, input);
    } catch (error) {
      return { ...base, ok: false, detail: `Baseline threw: ${describe(error)}` };
    }
    if (serialize(input) !== before) {
      return { ...base, ok: false, detail: 'Baseline modified its input' };
    }
    try {
      candidateOut = runOnce(candidate, input);
    } catch (error) {
      return { ...base, ok: false, detail: `Candidate threw: ${describe(error)}` };
    }
    if (serialize(input) !== before) {
      return { ...base, ok: false, detail: 'Candidate modified its input' };
    }

    const index = firstMismatch(baselineOut, candidateOut);
    const same = serialize(baselineOut) === serialize(candidateOut);
    if (same) {
      const count = Array.isArray(baselineOut) ? baselineOut.length : 1;
      return { ...base, ok: true, detail: `${count} outputs identical` };
    }
    return {
      ...base,
      ok: false,
      detail: index >= 0 ? `Outputs differ first at result ${index}` : 'Outputs differ',
    };
  });
}

function runRepetition(solver: Solver, input: Dataset, mode: Mode, iterations: number): number {
  const prepared = mode === 'isolated' ? solver.prepare(input) : undefined;
  const t0 = performance.now();
  for (let k = 0; k < iterations; k++) {
    blackhole = mode === 'isolated' ? solver.solve(prepared) : runOnce(solver, input);
  }
  return (performance.now() - t0) / iterations;
}

function calibrate(solver: Solver, input: Dataset, mode: Mode): number {
  const perCall = runRepetition(solver, input, mode, 1);
  return Math.min(MAX_ITERATIONS, Math.max(1, Math.ceil(CALIBRATION_TARGET_MS / Math.max(perCall, 0.001))));
}

function readHeap(): number | null {
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return memory ? memory.usedJSHeapSize : null;
}

function measure(
  name: Implementation,
  solver: Solver,
  input: Dataset,
  mode: Mode,
  repetitions: number,
): ImplementationRun {
  currentStage = name;
  const iterations = calibrate(solver, input, mode);
  const samples: Sample[] = [];

  for (let rep = 0; rep < repetitions; rep++) {
    emit({ type: 'stage', stage: name, status: 'active', impl: name, rep, total: repetitions });
    let sample: Sample;
    try {
      const heapBefore = readHeap();
      const perCallMs = runRepetition(solver, input, mode, iterations);
      const heapAfter = readHeap();
      sample = {
        index: rep,
        ok: true,
        perCallMs,
        heapDeltaBytes: heapBefore !== null && heapAfter !== null ? heapAfter - heapBefore : null,
      };
    } catch (error) {
      sample = { index: rep, ok: false, perCallMs: null, error: describe(error) };
    }
    samples.push(sample);
    emit({ type: 'sample', impl: name, sample });
  }

  emit({ type: 'stage', stage: name, status: 'done', impl: name, total: repetitions });
  return { iterations, samples };
}

function execute({ config, input }: WorkerRequest) {
  currentStage = 'validate';
  emit({ type: 'stage', stage: 'validate', status: 'active' });
  const baseline = compile(config.baseline, 'Baseline');
  const candidate = compile(config.candidate, 'Candidate');
  const benchmarkInput = generateDataset(input);
  emit({ type: 'stage', stage: 'validate', status: 'done' });

  currentStage = 'correctness';
  emit({ type: 'stage', stage: 'correctness', status: 'active' });
  const tests = checkCorrectness(baseline, candidate, { ...input, queries: QUERY_COUNT, seed: INPUT_SEED });
  emit({ type: 'tests', tests });
  if (tests.some((test) => !test.ok)) {
    emit({ type: 'mismatch', tests });
    return;
  }
  emit({ type: 'stage', stage: 'correctness', status: 'done' });

  currentStage = 'warmup';
  emit({ type: 'stage', stage: 'warmup', status: 'active' });
  for (let i = 0; i < config.warmup; i++) {
    runRepetition(baseline, benchmarkInput, config.mode, 1);
    runRepetition(candidate, benchmarkInput, config.mode, 1);
  }
  emit({ type: 'stage', stage: 'warmup', status: 'done' });

  const baselineRun = measure('baseline', baseline, benchmarkInput, config.mode, config.repetitions);
  const candidateRun = measure('candidate', candidate, benchmarkInput, config.mode, config.repetitions);

  currentStage = 'process';
  emit({ type: 'stage', stage: 'process', status: 'active' });
  emit({ type: 'finished', baseline: baselineRun, candidate: candidateRun, tests });
}

scope.onmessage = (event) => {
  try {
    execute(event.data);
  } catch (error) {
    emit({ type: 'failed', stage: currentStage, message: describe(error) });
  }
};
