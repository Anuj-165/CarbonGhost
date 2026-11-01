import { motion } from 'framer-motion';
import { Activity, Cpu, Gauge, MemoryStick } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

const PILLARS = [
  {
    icon: Gauge,
    title: 'Runtime',
    body: 'Wall-clock time per run after warm-up, reported as median and spread across samples.',
    method: 'High-resolution timer, repeated samples',
  },
  {
    icon: MemoryStick,
    title: 'Memory tracing',
    body: 'Peak heap and allocation volume during execution, so buffers and copies are visible.',
    method: 'Allocator sampling per run',
  },
  {
    icon: Activity,
    title: 'Operation counts',
    body: 'Comparisons, reads and writes counted at instrumented points, independent of machine speed.',
    method: 'Instrumented operation counters',
  },
  {
    icon: Cpu,
    title: 'Estimated energy',
    body: 'A modeled figure derived from runtime and memory traffic. It is an estimate, not a meter reading.',
    method: 'Model with stated assumptions',
  },
];

const ASSUMPTIONS = [
  'CPU power is taken from a configurable package power figure. It is not metered at the socket.',
  'Memory energy is modeled per byte moved. Hardware counters are not read.',
  'Carbon conversion uses a grid intensity you set for the region where the code runs.',
];

export default function Methodology() {
  return (
    <section id="methodology" className="technical-grid-light relative bg-paper text-ink">
      <div className="mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-40">
        <Reveal className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionLabel index="05" tone="light">
              Methodology
            </SectionLabel>
            <h2 className="mt-8 font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.02] tracking-[-0.02em]">
              Four measurements.
              <span className="block italic text-forest">One stated model.</span>
            </h2>
          </div>
          <p className="self-end text-base leading-[1.5] text-graphite-500 lg:col-span-4 lg:col-start-9">
            Measured quantities and modeled quantities are kept apart. Where we estimate, the assumption and the
            uncertainty are shown next to the number.
          </p>
        </Reveal>

        <div className="mt-20 grid gap-16 lg:grid-cols-12 lg:gap-8">
          <ul className="divide-y divide-forest/15 border-y border-forest/15 lg:col-span-6">
            {PILLARS.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <li key={pillar.title}>
                  <Reveal delay={i * 0.08} className="grid gap-4 py-8 sm:grid-cols-[auto_1fr]">
                    <Icon className="mt-1 h-5 w-5 text-forest" aria-hidden />
                    <div>
                      <h3 className="font-display text-3xl leading-[1.15]">{pillar.title}</h3>
                      <p className="mt-3 max-w-md text-[15px] leading-[1.5] text-graphite-500">{pillar.body}</p>
                      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-forest">{pillar.method}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>

          <Reveal delay={0.1} className="lg:col-span-5 lg:col-start-8">
            <div className="border border-forest/25 bg-ink p-6 text-paper md:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-sage">Energy estimate model</p>
              <p className="mt-5 overflow-x-auto font-mono text-[13px] leading-[1.7] text-paper/90">
                E = (P<sub>cpu</sub> × t<sub>run</sub>) + (e<sub>mem</sub> × B<sub>moved</sub>)
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px] text-sage">
                <dt>P_cpu</dt>
                <dd className="text-right">package power, W</dd>
                <dt>t_run</dt>
                <dd className="text-right">measured runtime, s</dd>
                <dt>e_mem</dt>
                <dd className="text-right">energy per byte, J</dd>
                <dt>B_moved</dt>
                <dd className="text-right">bytes moved, measured</dd>
              </dl>

              <div className="mt-10 border-t border-paper/10 pt-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-sage">Uncertainty band</p>
                <UncertaintyPlot />
                <p className="mt-4 font-mono text-[11px] leading-relaxed text-sage">
                  Illustrative interval. Shown as a range so a single figure is never read as exact.
                </p>
              </div>

              <div className="mt-10 border-t border-paper/10 pt-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-chartreuse">Stated assumptions</p>
                <ol className="mt-5 flex flex-col gap-4">
                  {ASSUMPTIONS.map((item, i) => (
                    <li key={item} className="grid grid-cols-[auto_1fr] gap-4 text-sm leading-[1.5] text-paper/85">
                      <span className="font-mono text-[11px] text-sage">A{i + 1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function UncertaintyPlot() {
  const low = 22;
  const mid = 48;
  const high = 79;
  const pct = (v: number) => `${v}%`;

  return (
    <div className="relative mt-6 h-20" role="img" aria-label="Illustrative estimate with an uncertainty range">
      <div className="absolute left-0 right-0 top-1/2 h-px bg-paper/15" />
      {[0, 25, 50, 75, 100].map((tick) => (
        <span key={tick} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-paper/25" style={{ left: pct(tick) }} />
      ))}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-1/2 h-3 -translate-y-1/2 origin-left bg-sage/30"
        style={{ left: pct(low), width: pct(high - low) }}
      />
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute top-1/2 h-7 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-chartreuse"
        style={{ left: pct(mid) }}
      />
      <span className="absolute font-mono text-[10px] text-sage" style={{ left: pct(low), top: '78%', transform: 'translateX(-50%)' }}>
        low
      </span>
      <span className="absolute font-mono text-[10px] text-chartreuse" style={{ left: pct(mid), top: '0%', transform: 'translateX(-50%)' }}>
        estimate
      </span>
      <span className="absolute font-mono text-[10px] text-sage" style={{ left: pct(high), top: '78%', transform: 'translateX(-50%)' }}>
        high
      </span>
    </div>
  );
}
