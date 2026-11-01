import { useCallback, useEffect, useRef, useState } from 'react';
import type { DatasetSpec } from '@/lib/benchmark/dataset';
import type {
  ImplementationRun,
  RunConfig,
  Sample,
  StageId,
  TestCheck,
  WorkerEvent,
  WorkerRequest,
} from '@/lib/benchmark/protocol';

export type RunStatus = 'idle' | 'running' | 'completed' | 'timeout' | 'error' | 'non-equivalent' | 'cancelled';
export type StageStatus = 'pending' | 'active' | 'done' | 'failed';

export const STAGE_ORDER: StageId[] = ['validate', 'correctness', 'warmup', 'baseline', 'candidate', 'process'];

export interface RunProgress {
  stages: Record<StageId, StageStatus>;
  activeRep: { impl: 'baseline' | 'candidate'; rep: number; total: number } | null;
  samples: { baseline: Sample[]; candidate: Sample[] };
  tests: TestCheck[];
  message: string | null;
  failedStage: StageId | null;
}

export interface BenchmarkOutcome {
  config: RunConfig;
  input: DatasetSpec;
  finishedAt: string;
  baseline: ImplementationRun;
  candidate: ImplementationRun;
  tests: TestCheck[];
}

const emptyStages = (): Record<StageId, StageStatus> => ({
  validate: 'pending',
  correctness: 'pending',
  warmup: 'pending',
  baseline: 'pending',
  candidate: 'pending',
  process: 'pending',
});

const initialProgress = (): RunProgress => ({
  stages: emptyStages(),
  activeRep: null,
  samples: { baseline: [], candidate: [] },
  tests: [],
  message: null,
  failedStage: null,
});

export function useBenchmarkRun() {
  const [status, setStatus] = useState<RunStatus>('idle');
  const [progress, setProgress] = useState<RunProgress>(initialProgress);
  const [outcome, setOutcome] = useState<BenchmarkOutcome | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<number | null>(null);

  const teardown = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => teardown, [teardown]);

  const start = useCallback(
    (config: RunConfig, input: DatasetSpec) => {
      teardown();
      setOutcome(null);
      setProgress(initialProgress());
      setStatus('running');

      const worker = new Worker(new URL('../../workers/benchmark.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      const fail = (nextStatus: RunStatus, message: string) => {
        teardown();
        setStatus(nextStatus);
        setProgress((current) => {
          const active = STAGE_ORDER.find((stage) => current.stages[stage] === 'active') ?? null;
          const stages = { ...current.stages };
          if (active) stages[active] = 'failed';
          return { ...current, stages, message, failedStage: active, activeRep: null };
        });
      };

      worker.onmessage = (event: MessageEvent<WorkerEvent>) => {
        const message = event.data;
        switch (message.type) {
          case 'stage':
            setProgress((current) => ({
              ...current,
              stages: { ...current.stages, [message.stage]: message.status === 'active' ? 'active' : 'done' },
              activeRep:
                message.status === 'active' && message.impl && message.rep !== undefined
                  ? { impl: message.impl, rep: message.rep, total: message.total ?? 0 }
                  : current.activeRep,
            }));
            break;
          case 'sample':
            setProgress((current) => ({
              ...current,
              samples: { ...current.samples, [message.impl]: [...current.samples[message.impl], message.sample] },
            }));
            break;
          case 'tests':
            setProgress((current) => ({ ...current, tests: message.tests }));
            break;
          case 'mismatch':
            setProgress((current) => ({ ...current, tests: message.tests }));
            if (timerRef.current !== null) window.clearTimeout(timerRef.current);
            teardown();
            setStatus('non-equivalent');
            break;
          case 'finished':
            teardown();
            setOutcome({
              config,
              input,
              finishedAt: new Date().toISOString(),
              baseline: message.baseline,
              candidate: message.candidate,
              tests: message.tests,
            });
            setProgress((current) => ({
              ...current,
              stages: { ...current.stages, process: 'done' },
              tests: message.tests,
            }));
            setStatus('completed');
            break;
          case 'failed':
            setProgress((current) => ({ ...current, failedStage: message.stage }));
            fail('error', message.message);
            break;
        }
      };

      worker.onerror = (event) => {
        fail('error', event.message || 'The benchmark worker stopped unexpectedly.');
      };

      timerRef.current = window.setTimeout(() => {
        fail('timeout', `Stopped after ${config.timeoutSec} s. Increase the timeout or reduce repetitions.`);
      }, config.timeoutSec * 1000);

      const request: WorkerRequest = { type: 'run', config, input };
      worker.postMessage(request);
    },
    [teardown],
  );

  const cancel = useCallback(() => {
    teardown();
    setStatus('cancelled');
    setProgress((current) => ({
      ...current,
      message: 'Run cancelled before completion. No result was recorded.',
    }));
  }, [teardown]);

  const reset = useCallback(() => {
    teardown();
    setStatus('idle');
    setOutcome(null);
    setProgress(initialProgress());
  }, [teardown]);

  return { status, progress, outcome, start, cancel, reset };
}
