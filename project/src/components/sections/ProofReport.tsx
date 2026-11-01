import { motion } from 'framer-motion';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

const BASELINE_CODE = `// Baseline: compares every pair of items
function findDuplicates(items: string[]) {
  const dupes: string[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i !== j && items[i] === items[j] && !dupes.includes(items[i])) {
        dupes.push(items[i]);
      }
    }
  }
  return dupes;
}`;

const OPTIMIZED_CODE = `// Optimized: one pass with constant-time lookups
function findDuplicates(items: string[]) {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const item of items) {
    if (seen.has(item)) dupes.add(item);
    else seen.add(item);
  }
  return [...dupes];
}`;

const REPORT_ROWS = ['Runtime, p50', 'Peak memory', 'Operations counted', 'Estimated energy'];

const META_ROWS = [
  ['Workload', 'findDuplicates, 10,000 string items'],
  ['Warm-up / samples', 'Recorded per run'],
  ['Reproducibility', 'Input hash, commit, environment snapshot'],
];

export default function ProofReport() {
  return (
    <section id="proof" className="technical-grid-light relative bg-paper text-ink">
      <div className="mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-40">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-5">
            <SectionLabel index="03" tone="light">
              Proof, not promises
            </SectionLabel>
            <h2 className="mt-8 font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.02] tracking-[-0.02em]">
              Two implementations.
              <span className="block italic text-forest">One reproducible report.</span>
            </h2>
            <p className="mt-8 max-w-md text-lg leading-[1.5] text-graphite-500">
              Each run records what was executed, on what input, under which conditions. Every figure traces back to
              that record, so the comparison can be repeated by anyone.
            </p>
          </Reveal>

          <div className="grid gap-6 lg:col-span-7 lg:col-start-6">
            <CodePanel label="Baseline" code={BASELINE_CODE} tone="muted" delay={0} />
            <CodePanel label="Optimized" code={OPTIMIZED_CODE} tone="accent" delay={0.15} />
          </div>
        </div>

        <div className="relative mt-24 grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="flex items-center justify-center lg:col-span-1 lg:flex-col" aria-hidden>
            <motion.span
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="h-px w-full origin-left bg-forest/30 lg:h-full lg:w-px lg:origin-top"
            />
          </div>

          <Reveal className="lg:col-span-10 lg:col-start-2">
            <article className="border border-forest/25 bg-paper-200/70">
              <header className="flex flex-wrap items-center justify-between gap-4 border-b border-forest/20 px-6 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-graphite-500 md:px-8">
                <span>Benchmark report / sample layout</span>
                <span className="flex items-center gap-4">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-graphite-500/60" aria-hidden />
                    Baseline
                  </span>
                  <span className="flex items-center gap-2 text-forest">
                    <span className="h-2 w-2 bg-forest" aria-hidden />
                    Optimized
                  </span>
                </span>
              </header>

              <div className="grid gap-10 p-6 md:p-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
                <div className="flex flex-col gap-6">
                  {REPORT_ROWS.map((label) => (
                    <div key={label} className="flex items-baseline justify-between gap-4 border-b border-forest/15 pb-3">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="font-mono text-[11px] text-graphite-500">Awaiting first recorded run</span>
                    </div>
                  ))}
                  <p className="font-mono text-[11px] leading-relaxed text-graphite-500">
                    No figures are shown until a comparison has been run and recorded. Results appear here with their configuration and environment.
                  </p>
                </div>

                <dl className="flex flex-col divide-y divide-forest/15 self-start border-t border-forest/20 lg:border-t-0">
                  {META_ROWS.map(([term, value]) => (
                    <div key={term} className="flex flex-col gap-1 py-4 first:pt-0">
                      <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite-500">{term}</dt>
                      <dd className="text-sm leading-[1.5]">{value}</dd>
                    </div>
                  ))}
                  <div className="flex flex-col gap-2 py-4">
                    <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite-500">Status</dt>
                    <dd className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-forest" aria-hidden />
                      Ready to record
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

interface CodePanelProps {
  label: string;
  code: string;
  tone: 'muted' | 'accent';
  delay: number;
}

function CodePanel({ label, code, tone, delay }: CodePanelProps) {
  const isAccent = tone === 'accent';
  return (
    <Reveal delay={delay} className={isAccent ? 'lg:ml-12' : ''}>
      <div className="border border-ink/15 bg-ink text-paper">
        <div className="flex items-center justify-between border-b border-paper/10 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em]">
          <span className={isAccent ? 'text-chartreuse' : 'text-sage'}>{label}</span>
          <span className="text-sage">findDuplicates.ts</span>
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.7] text-paper/85 md:text-[13px]">
          <code>{code}</code>
        </pre>
      </div>
    </Reveal>
  );
}
