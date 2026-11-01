import { useState } from 'react';
import { motion } from 'framer-motion';
import { Segmented } from '@/components/app/ConfigBar';
import { formatMs, type Summary } from '@/lib/benchmark/stats';
import type { Sample } from '@/lib/benchmark/protocol';

type ChartView = 'distribution' | 'repetitions';

interface Series {
  summary: Summary | null;
  samples: Sample[];
}

interface ComparisonChartsProps {
  baseline: Series;
  candidate: Series;
}

const WIDTH = 640;
const PAD = { left: 104, right: 24, top: 16, bottom: 36 };
const PLOT_W = WIDTH - PAD.left - PAD.right;

export default function ComparisonCharts({ baseline, candidate }: ComparisonChartsProps) {
  const [view, setView] = useState<ChartView>('distribution');
  const values = [...baseline.samples, ...candidate.samples].flatMap(okTimes);
  const max = values.length > 0 ? Math.max(...values) * 1.08 : 1;

  return (
    <section aria-label="Comparison charts" className="border border-graphite bg-[#0C130F] p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h3 className="text-[15px] font-medium text-paper">Comparison charts</h3>
        <Segmented<ChartView>
          ariaLabel="Chart view"
          value={view}
          onChange={setView}
          options={[
            { value: 'distribution', label: 'Distribution' },
            { value: 'repetitions', label: 'By repetition' },
          ]}
        />
      </div>

      <div className="mt-6">
        {values.length === 0 ? (
          <p className="text-[14px] leading-[1.6] text-sage">No successful repetitions to chart.</p>
        ) : view === 'distribution' ? (
          <Distribution baseline={baseline} candidate={candidate} max={max} />
        ) : (
          <ByRepetition baseline={baseline} candidate={candidate} max={max} />
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-6 font-mono text-[11px] text-sage">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sage" aria-hidden /> Baseline
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-chartreuse" aria-hidden /> Candidate
        </span>
        <span>Shaded band: middle 50% of repetitions. Bar: median.</span>
      </div>
    </section>
  );
}

function Distribution({ baseline, candidate, max }: ComparisonChartsProps & { max: number }) {
  const HEIGHT = 200;
  const AXIS_Y = 172;
  const rows = [
    { key: 'baseline', label: 'Baseline', series: baseline, y: 64, tone: 'text-sage' },
    { key: 'candidate', label: 'Candidate', series: candidate, y: 124, tone: 'text-chartreuse' },
  ];
  const x = (value: number) => PAD.left + (value / max) * PLOT_W;
  const ticks = [0, max / 2, max];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Distribution of per-call times. Baseline median ${describe(baseline.summary)}, candidate median ${describe(candidate.summary)}.`}
      className="h-auto w-full"
    >
      {ticks.map((tick) => (
        <g key={`tick-${tick}`}>
          <line x1={x(tick)} x2={x(tick)} y1={PAD.top} y2={AXIS_Y} className="stroke-graphite" strokeWidth={1} />
          <text x={x(tick)} y={AXIS_Y + 20} textAnchor="middle" className="fill-sage font-mono text-[10px]">
            {formatMs(tick)}
          </text>
        </g>
      ))}
      <line x1={PAD.left} x2={WIDTH - PAD.right} y1={AXIS_Y} y2={AXIS_Y} className="stroke-graphite" strokeWidth={1} />

      {rows.map((row) => {
        const { summary, samples } = row.series;
        const ok = samples.filter((sample) => sample.ok && sample.perCallMs !== null);
        return (
          <g key={row.key} className={row.tone}>
            <text x={PAD.left - 16} y={row.y + 4} textAnchor="end" className="fill-paper font-mono text-[11px]">
              {row.label}
            </text>
            {summary && (
              <>
                <rect
                  x={x(summary.p25)}
                  y={row.y - 14}
                  width={Math.max(2, x(summary.p75) - x(summary.p25))}
                  height={28}
                  fill="currentColor"
                  opacity={0.14}
                />
                <line
                  x1={x(summary.median)}
                  x2={x(summary.median)}
                  y1={row.y - 20}
                  y2={row.y + 20}
                  stroke="currentColor"
                  strokeWidth={2}
                />
              </>
            )}
            {ok.map((sample, index) => (
              <motion.circle
                key={sample.index}
                cx={x(sample.perCallMs ?? 0)}
                cy={row.y + (((sample.index * 7) % 9) - 4) * 2}
                r={4}
                fill="currentColor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function ByRepetition({ baseline, candidate, max }: ComparisonChartsProps & { max: number }) {
  const HEIGHT = 240;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const count = Math.max(baseline.samples.length, candidate.samples.length, 1);
  const x = (index: number) => PAD.left + ((index + 0.5) / count) * PLOT_W;
  const y = (value: number) => PAD.top + plotH - (value / max) * plotH;
  const ticks = [0, max / 2, max];
  const series = [
    { key: 'baseline', samples: baseline.samples, tone: 'text-sage' },
    { key: 'candidate', samples: candidate.samples, tone: 'text-chartreuse' },
  ];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Per-call time for each repetition, baseline and candidate."
      className="h-auto w-full"
    >
      {ticks.map((tick) => (
        <g key={`tick-${tick}`}>
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-graphite" strokeWidth={1} />
          <text x={PAD.left - 12} y={y(tick) + 4} textAnchor="end" className="fill-sage font-mono text-[10px]">
            {formatMs(tick)}
          </text>
        </g>
      ))}
      {Array.from({ length: count }, (_, index) => (
        <text key={`rep-${index}`} x={x(index)} y={HEIGHT - 12} textAnchor="middle" className="fill-sage font-mono text-[10px]">
          {index + 1}
        </text>
      ))}

      {series.map((line) => {
        const points = line.samples.flatMap((sample) =>
          sample.ok && sample.perCallMs !== null ? [{ x: x(sample.index), y: y(sample.perCallMs) }] : [],
        );
        return (
          <g key={line.key} className={line.tone}>
            {points.length > 1 && (
              <polyline
                points={points.map((point) => `${point.x},${point.y}`).join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                opacity={0.7}
              />
            )}
            {points.map((point, index) => (
              <motion.circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={4}
                fill="currentColor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function okTimes(sample: Sample): number[] {
  return sample.ok && sample.perCallMs !== null ? [sample.perCallMs] : [];
}

function describe(summary: Summary | null) {
  return summary ? formatMs(summary.median) : 'not available';
}
