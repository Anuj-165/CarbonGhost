import { Loader2, Play } from 'lucide-react';
import ConfigBar from '@/components/app/ConfigBar';
import CodePanel from '@/components/app/CodePanel';
import InputPanel from '@/components/app/InputPanel';
import PresetPicker from '@/components/app/PresetPicker';
import ResultsView from '@/components/app/ResultsView';
import RunTimeline from '@/components/app/RunTimeline';
import { EXAMPLE_BASELINE, EXAMPLE_CANDIDATE } from '@/lib/benchmark/examples';
import type { Workbench } from '@/lib/benchmark/useWorkbench';
import { diffLines } from '@/lib/diff';

interface ComparisonWorkspaceProps {
  workbench: Workbench;
}

export default function ComparisonWorkspace({ workbench }: ComparisonWorkspaceProps) {
  const {
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
  } = workbench;
  const running = run.status === 'running';

  if (run.status === 'completed' && completed) {
    return (
      <ResultsView
        stored={completed}
        saveState={saveState}
        onReproduce={() => reproduce(completed)}
        headerAction={
          <button
            type="button"
            onClick={reset}
            className="flex h-10 items-center border border-graphite px-4 text-[13px] text-paper transition-colors duration-300 hover:border-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
          >
            Edit configuration
          </button>
        }
      />
    );
  }

  const diff = diffLines(config.baseline, config.candidate);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-5 py-8 lg:px-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <label htmlFor="comparison-name" className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
            Comparison name
          </label>
          <input
            id="comparison-name"
            value={config.name}
            disabled={running}
            onChange={(event) => updateConfig({ name: event.target.value })}
            className="mt-2 w-full bg-transparent font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] text-paper transition-colors duration-300 placeholder:text-sage focus:outline-none focus-visible:ring-1 focus-visible:ring-chartreuse disabled:opacity-60"
          />
        </div>
        <button
          type="button"
          onClick={start}
          disabled={running}
          className="flex h-11 shrink-0 items-center gap-2.5 bg-chartreuse px-6 text-[14px] font-medium text-ink transition-[transform,opacity] duration-300 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chartreuse active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          {running ? 'Running' : 'Run comparison'}
        </button>
      </header>

      {formError && (
        <p role="alert" className="border-l-2 border-chartreuse pl-3 text-[13px] text-paper">
          {formError}
        </p>
      )}

      {!running && (
        <>
          <PresetPicker current={config} onApply={applyPreset} disabled={running} />
          <ConfigBar
            config={config}
            onChange={updateConfig}
            assumptions={assumptions}
            onAssumptionsChange={updateAssumptions}
            environment={environment}
            disabled={running}
          />
        </>
      )}

      {run.status !== 'idle' && (
        <RunTimeline status={run.status} progress={run.progress} config={config} onCancel={run.cancel} onEdit={reset} />
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <CodePanel
          label="Baseline"
          description="Reference implementation"
          value={config.baseline}
          defaultValue={EXAMPLE_BASELINE}
          onChange={(baseline) => updateConfig({ baseline })}
          diff={null}
          receded={running}
        />
        <CodePanel
          label="Candidate"
          description="Implementation under test"
          value={config.candidate}
          defaultValue={EXAMPLE_CANDIDATE}
          onChange={(candidate) => updateConfig({ candidate })}
          diff={diff}
          receded={running}
        />
      </div>

      <InputPanel inputSize={config.inputSize} tests={run.progress.tests} testsPending={running} />
    </div>
  );
}
