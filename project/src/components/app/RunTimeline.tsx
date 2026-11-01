import { motion } from 'framer-motion';
import { Check, CircleAlert, X } from 'lucide-react';
import { STAGE_DETAIL, STAGE_LABELS } from '@/lib/benchmark/stages';
import { STAGE_ORDER, type RunProgress, type RunStatus, type StageStatus } from '@/lib/benchmark/useBenchmarkRun';
import { formatMs } from '@/lib/benchmark/stats';
import type { RunConfig, Sample, StageId } from '@/lib/benchmark/protocol';

interface RunTimelineProps {
  status: RunStatus;
  progress: RunProgress;
  config: RunConfig;
  onCancel: () => void;
  onEdit: () => void;
}

export default function RunTimeline({ status, progress, config, onCancel, onEdit }: RunTimelineProps) {
  const running = status === 'running';
  const activeStage = STAGE_ORDER.find((stage) => progress.stages[stage] === 'active') ?? null;
  const stopped = status !== 'running' && status !== 'idle' && status !== 'completed';

  return (
    <section aria-label="Run progress" className="border border-graphite bg-[#0C130F]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-graphite px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
            {running ? 'Measuring live' : stopped ? 'Run stopped' : 'Run status'}
          </p>
          <p className="mt-1 text-[15px] text-paper">
            {running && activeStage
              ? describeActive(activeStage, progress, config)
              : running
                ? 'Starting the worker'
                : stopped
                  ? 'The run ended before completion.'
                  : 'Ready'}
          </p>
        </div>
        {running ? (
          <button
            type="button"
            onClick={onCancel}
            className="h-9 border border-graphite px-4 text-[13px] text-paper transition-colors duration-300 hover:border-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
          >
            Cancel run
          </button>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="h-9 border border-graphite px-4 text-[13px] text-paper transition-colors duration-300 hover:border-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
          >
            Edit configuration
          </button>
        )}
      </div>

      <ol className="grid grid-cols-2 gap-x-4 gap-y-6 px-5 py-6 md:grid-cols-3 xl:grid-cols-6">
        {STAGE_ORDER.map((stage) => (
          <StageNode key={stage} stage={stage} state={progress.stages[stage]} />
        ))}
      </ol>

      <div className="flex flex-col gap-5 border-t border-graphite px-5 py-6">
        <RepTrace
          label="Baseline"
          tone="sage"
          total={config.repetitions}
          samples={progress.samples.baseline}
          active={progress.activeRep?.impl === 'baseline' ? progress.activeRep.rep : null}
          stage={progress.stages.baseline}
        />
        <RepTrace
          label="Candidate"
          tone="chartreuse"
          total={config.repetitions}
          samples={progress.samples.candidate}
          active={progress.activeRep?.impl === 'candidate' ? progress.activeRep.rep : null}
          stage={progress.stages.candidate}
        />
      </div>

      {stopped && <StoppedNotice status={status} progress={progress} />}
    </section>
  );
}

function describeActive(stage: StageId, progress: RunProgress, config: RunConfig) {
  if (progress.activeRep && (stage === 'baseline' || stage === 'candidate')) {
    return `${STAGE_LABELS[stage]}, repetition ${progress.activeRep.rep + 1} of ${progress.activeRep.total || config.repetitions}`;
  }
  return STAGE_LABELS[stage];
}

const NODE_STYLE: Record<StageStatus, string> = {
  pending: 'border-graphite text-sage',
  active: 'border-chartreuse text-chartreuse',
  done: 'border-chartreuse bg-chartreuse text-ink',
  failed: 'border-paper bg-paper text-ink',
};

function StageNode({ stage, state }: { stage: StageId; state: StageStatus }) {
  return (
    <li className="flex min-w-0 flex-col gap-3" aria-current={state === 'active' ? 'step' : undefined}>
      <div className="flex items-center gap-3">
        <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${NODE_STYLE[state]}`}>
          {state === 'active' && (
            <motion.span
              className="absolute inset-0 rounded-full border border-chartreuse"
              animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              aria-hidden
            />
          )}
          {state === 'done' && <Check className="h-3.5 w-3.5" aria-hidden />}
          {state === 'failed' && <X className="h-3.5 w-3.5" aria-hidden />}
          {state === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-chartreuse" aria-hidden />}
        </span>
        <span className="font-mono text-[10px] text-sage">{String(STAGE_ORDER.indexOf(stage) + 1).padStart(2, '0')}</span>
      </div>
      <div>
        <p className={`text-[13px] leading-[1.35] ${state === 'pending' ? 'text-sage' : 'text-paper'}`}>{STAGE_LABELS[stage]}</p>
        <p className="mt-1 hidden text-[11px] leading-[1.5] text-sage xl:block">{STAGE_DETAIL[stage]}</p>
      </div>
    </li>
  );
}

function RepTrace({
  label,
  tone,
  total,
  samples,
  active,
  stage,
}: {
  label: string;
  tone: 'sage' | 'chartreuse';
  total: number;
  samples: Sample[];
  active: number | null;
  stage: StageStatus;
}) {
  const successful = samples.filter((sample) => sample.ok && sample.perCallMs !== null);
  const last = successful[successful.length - 1];
  const dotCount = Math.max(total, samples.length);
  const fillClass = tone === 'chartreuse' ? 'bg-chartreuse' : 'bg-paper/80';

  return (
    <div className="grid gap-3 md:grid-cols-[9rem_1fr_9rem] md:items-center">
      <div className="flex items-center gap-2.5">
        <span className={`h-1.5 w-1.5 rounded-full ${fillClass}`} aria-hidden />
        <span className="text-[13px] text-paper">{label}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="list" aria-label={`${label} repetitions`}>
        {Array.from({ length: dotCount }, (_, index) => {
          const sample = samples.find((item) => item.index === index);
          const isActive = active === index && stage === 'active';
          return (
            <span
              key={index}
              role="listitem"
              aria-label={
                sample
                  ? sample.ok
                    ? `Repetition ${index + 1}: ${formatMs(sample.perCallMs ?? 0)}`
                    : `Repetition ${index + 1}: failed`
                  : isActive
                    ? `Repetition ${index + 1}: running`
                    : `Repetition ${index + 1}: pending`
              }
              className="relative flex h-3.5 w-3.5 items-center justify-center"
            >
              {isActive && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-chartreuse"
                  animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                  aria-hidden
                />
              )}
              {sample && sample.ok && <span className={`h-2.5 w-2.5 rounded-full ${fillClass}`} />}
              {sample && !sample.ok && <X className="h-3.5 w-3.5 text-paper" aria-hidden />}
              {!sample && !isActive && <span className="h-2.5 w-2.5 rounded-full border border-graphite" />}
              {isActive && <span className="h-2 w-2 rounded-full bg-chartreuse" />}
            </span>
          );
        })}
      </div>

      <p className="font-mono text-[12px] tabular-nums text-sage md:text-right">
        {last && last.perCallMs !== null ? (
          <>
            <span className="text-paper">{formatMs(last.perCallMs)}</span> last call
          </>
        ) : (
          `${successful.length} of ${total} recorded`
        )}
      </p>
    </div>
  );
}

function StoppedNotice({ status, progress }: { status: RunStatus; progress: RunProgress }) {
  const failing = progress.tests.filter((test) => !test.ok);
  const titles: Partial<Record<RunStatus, string>> = {
    timeout: 'The run timed out',
    error: 'The run failed',
    'non-equivalent': 'Outputs differ, so timing was skipped',
    cancelled: 'The run was cancelled',
  };

  return (
    <div role="alert" className="flex gap-4 border-t border-graphite px-5 py-5">
      <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-paper" aria-hidden />
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-paper">{titles[status] ?? 'The run stopped'}</p>
        <p className="mt-1 text-[13px] leading-[1.6] text-sage">
          {progress.message ?? 'No result was recorded for this run.'}
        </p>
        {failing.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5 font-mono text-[12px] text-paper/85">
            {failing.map((test) => (
              <li key={test.name}>
                {test.name}: {test.detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
