import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_CONFIG } from '@/lib/benchmark/examples';
import type { PresetSettings } from '@/lib/benchmark/presets';
import { INPUT_SEED, QUERY_COUNT } from '@/lib/benchmark/dataset';
import type { EnergyAssumptions } from '@/lib/benchmark/energy';
import type { RunConfig } from '@/lib/benchmark/protocol';
import { STAGE_LABELS } from '@/lib/benchmark/stages';
import { STAGE_ORDER, useBenchmarkRun, type BenchmarkOutcome, type RunStatus } from '@/lib/benchmark/useBenchmarkRun';
import { validateConfig } from '@/lib/benchmark/validation';
import { buildStoredOutcome, saveRun, type StoredOutcome, type StoredRun } from '@/lib/runs/runRepository';
import { captureEnvironment, useEnvironment, type EnvironmentInfo } from '@/lib/environment';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { ExecutionTone } from '@/components/app/AppShell';

export type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved'; run: StoredRun }
  | { status: 'error'; message: string };

const STATUS_LABEL: Record<Exclude<RunStatus, 'running'>, string> = {
  idle: 'Ready',
  completed: 'Completed',
  timeout: 'Timed out',
  error: 'Stopped by error',
  'non-equivalent': 'Outputs differ',
  cancelled: 'Cancelled',
};

const STATUS_TONE: Record<Exclude<RunStatus, 'running'>, ExecutionTone> = {
  idle: 'idle',
  completed: 'success',
  timeout: 'attention',
  error: 'attention',
  'non-equivalent': 'attention',
  cancelled: 'attention',
};

export function useWorkbench(defaultAssumptions: EnergyAssumptions) {
  const [config, setConfig] = useState<RunConfig>(DEFAULT_CONFIG);
  const [assumptions, setAssumptions] = useState<EnergyAssumptions>(defaultAssumptions);
  const [formError, setFormError] = useState<string | null>(null);
  const [runEnvironment, setRunEnvironment] = useState<EnvironmentInfo | null>(null);
  const [completed, setCompleted] = useState<StoredOutcome | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });
  const environment = useEnvironment();
  const run = useBenchmarkRun();
  const { start: startRun, reset: resetRun, status, outcome, progress } = run;
  const savedOutcome = useRef<BenchmarkOutcome | null>(null);

  useEffect(() => {
    if (status !== 'completed' || !outcome || savedOutcome.current === outcome) return;
    savedOutcome.current = outcome;
    const stored = buildStoredOutcome(outcome, runEnvironment, assumptions);
    setCompleted(stored);

    if (!isSupabaseConfigured) {
      setSaveState({ status: 'error', message: 'Saving is unavailable because the database connection is not configured.' });
      return;
    }

    setSaveState({ status: 'saving' });
    saveRun(stored)
      .then((saved) => setSaveState({ status: 'saved', run: saved }))
      .catch((error: Error) => setSaveState({ status: 'error', message: error.message }));
  }, [status, outcome, runEnvironment, assumptions]);

  const updateConfig = useCallback((patch: Partial<RunConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
  }, []);

  const updateAssumptions = useCallback((patch: Partial<EnergyAssumptions>) => {
    setAssumptions((current) => ({ ...current, ...patch }));
  }, []);

  const start = useCallback(() => {
    const problem = validateConfig(config);
    setFormError(problem);
    if (problem) return;
    setRunEnvironment(captureEnvironment());
    setCompleted(null);
    setSaveState({ status: 'idle' });
    startRun(config, { size: config.inputSize, queries: QUERY_COUNT, seed: INPUT_SEED });
  }, [config, startRun]);

  const applyPreset = useCallback((settings: PresetSettings) => {
    setConfig((current) => ({ ...current, ...settings }));
    setFormError(null);
  }, []);

  const reset = useCallback(() => {
    resetRun();
    setCompleted(null);
    setSaveState({ status: 'idle' });
    setFormError(null);
  }, [resetRun]);

  const reproduce = useCallback(
    (stored: StoredOutcome) => {
      setConfig(stored.outcome.config);
      setAssumptions(stored.assumptions);
      resetRun();
      setCompleted(null);
      setSaveState({ status: 'idle' });
      setFormError(null);
    },
    [resetRun],
  );

  const activeStage = STAGE_ORDER.find((stage) => progress.stages[stage] === 'active');
  const executionLabel =
    status === 'running'
      ? activeStage
        ? STAGE_LABELS[activeStage]
        : 'Starting'
      : STATUS_LABEL[status];
  const executionTone: ExecutionTone = status === 'running' ? 'running' : STATUS_TONE[status];

  return {
    config,
    updateConfig,
    assumptions,
    updateAssumptions,
    applyPreset,
    formError,
    environment,
    run,
    completed,
    saveState,
    start,
    reset,
    reproduce,
    executionLabel,
    executionTone,
  };
}

export type Workbench = ReturnType<typeof useWorkbench>;
