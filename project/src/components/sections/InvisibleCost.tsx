import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import SectionLabel from '@/components/ui/SectionLabel';

const STAGES = [
  {
    title: 'Redundant operations',
    body: 'A nested scan repeats the same comparisons on every pass. The processor performs each one, even when the answer is already known.',
  },
  {
    title: 'Memory pressure',
    body: 'Intermediate copies and oversized buffers widen the working set. Data spills out of fast caches and memory traffic climbs.',
  },
  {
    title: 'Execution time',
    body: 'The same result arrives later. The cost compounds across every request, job and retry that takes the inefficient path.',
  },
];

const COLUMNS = 12;
const CELLS = 96;

function isRedundant(index: number) {
  return (index * 37 + 11) % 7 < 4;
}

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

export default function InvisibleCost() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => setProgress(clamp01(latest)));

  const stage = progress < 0.34 ? 0 : progress < 0.67 ? 1 : 2;
  const litBaseline = Math.round(clamp01(progress / 0.5) * CELLS);
  const litOptimized = Math.round(clamp01((progress - 0.12) / 0.3) * 36);
  const memoryBaseline = clamp01((progress - 0.34) / 0.3);
  const timeBaseline = clamp01((progress - 0.67) / 0.3);

  return (
    <section
      id="invisible-cost"
      ref={sectionRef}
      className="relative h-[320vh] bg-forest text-paper"
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-6 lg:grid-cols-12 lg:gap-8 lg:px-12">
          <div className="flex flex-col justify-center lg:col-span-5">
            <SectionLabel index="02">The invisible cost</SectionLabel>
            <h2 className="mt-8 font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.02] tracking-[-0.02em]">
              Inefficient code
              <span className="italic text-sage"> spends</span> what you cannot see.
            </h2>

            <div className="relative mt-10 min-h-[200px]">
              {STAGES.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={false}
                  animate={{
                    opacity: stage === i ? 1 : 0,
                    y: stage === i ? 0 : stage > i ? -16 : 16,
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={`absolute inset-x-0 top-0 ${stage === i ? '' : 'pointer-events-none'}`}
                  aria-hidden={stage !== i}
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-chartreuse">
                    Stage 0{i + 1} / 03
                  </p>
                  <h3 className="mt-3 font-display text-3xl leading-[1.15] md:text-4xl">{item.title}</h3>
                  <p className="mt-4 max-w-md text-base leading-[1.5] text-paper/80">{item.body}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-16 flex gap-2" aria-hidden>
              {STAGES.map((item, i) => (
                <span
                  key={item.title}
                  className={`h-px flex-1 transition-colors duration-500 ${stage >= i ? 'bg-chartreuse' : 'bg-paper/15'}`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-10 lg:col-span-6 lg:col-start-7">
            <OperationGrid
              title="Baseline"
              caption="Redundant passes highlighted"
              cells={CELLS}
              lit={litBaseline}
              isLit={(i) => isRedundant(i) ? 'redundant' : 'necessary'}
            />
            <OperationGrid
              title="Optimized"
              caption="Necessary passes only"
              cells={CELLS}
              lit={litOptimized}
              isLit={() => 'necessary'}
              accent
            />

            <div className="grid gap-6 border-t border-paper/15 pt-8 sm:grid-cols-2">
              <MeterRow label="Working set" value={memoryBaseline} />
              <MeterRow label="Wall-clock time" value={timeBaseline} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface OperationGridProps {
  title: string;
  caption: string;
  cells: number;
  lit: number;
  isLit: (index: number) => 'redundant' | 'necessary';
  accent?: boolean;
}

function OperationGrid({ title, caption, cells, lit, isLit, accent = false }: OperationGridProps) {
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.16em]">
        <span className={accent ? 'text-chartreuse' : 'text-paper'}>{title}</span>
        <span className="text-sage">{caption}</span>
      </div>
      <div className="grid grid-cols-12 gap-[4px]" role="img" aria-label={`${title} operation grid`}>
        {Array.from({ length: cells }, (_, i) => {
          const isOn = i < lit;
          const kind = isLit(i);
          const tone = !isOn
            ? 'bg-paper/[0.07]'
            : accent
              ? 'bg-chartreuse'
              : kind === 'redundant'
                ? 'bg-sage'
                : 'bg-paper';
          return <span key={i} className={`aspect-square transition-colors duration-300 ${tone}`} />;
        })}
      </div>
    </div>
  );
}

function MeterRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-sage">
        <span>{label}</span>
        <span className="text-paper/70">{value > 0.02 ? (value > 0.98 ? 'High' : 'Rising') : 'Low'}</span>
      </div>
      <div className="h-1.5 w-full bg-paper/[0.08]">
        <div className="h-full bg-sage transition-[width] duration-300" style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}
