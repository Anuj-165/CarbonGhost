import { ShieldCheck, Timer, Zap, Leaf, AlertTriangle } from 'lucide-react';

const SECTIONS = [
  {
    icon: ShieldCheck,
    title: 'Correctness comes first',
    body: 'Both implementations run on the same generated records and the same queries. Their answers must match exactly before any timing starts. If they differ, the run stops and reports the first mismatch.',
  },
  {
    icon: Timer,
    title: 'Isolated vs end-to-end',
    body: 'Isolated mode times only the query work, after the baseline and candidate have been prepared outside the timer. End-to-end mode includes preparation, such as building an index, so a faster lookup that costs time to build is counted honestly.',
  },
  {
    icon: Zap,
    title: 'Repetitions, warm-up and spread',
    body: 'Each implementation runs a warm-up pass, then the configured repetitions. Implementations run one after the other, baseline first and then candidate, never interleaved. Results report a median with the spread across repetitions rather than a single best time.',
  },
  {
    icon: Leaf,
    title: 'Energy and carbon are modeled',
    body: 'Energy is estimated as power multiplied by measured time. Carbon is energy multiplied by grid intensity. Power draw and grid intensity are assumptions you set, and every energy figure is labelled as modeled. Uncertainty combines sample variability with the assumed ranges.',
  },
];

const NOT_SHOWN = [
  'Real power draw of your hardware. Power is an assumed value, not a meter reading.',
  'Behaviour on other machines, browsers or workloads. Results describe this environment only.',
  'Garbage collection pauses and memory pressure in a long-lived application.',
  'Peak memory, which is only reported when the browser exposes it.',
];

export default function MethodologyScreen() {
  return (
    <div className="mx-auto max-w-[1040px] px-5 py-12 lg:px-8 lg:py-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">Methodology</p>
      <h2 className="mt-4 font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.02] tracking-[-0.02em] text-paper">
        How a comparison is measured
      </h2>
      <p className="mt-6 max-w-2xl text-[15px] leading-[1.6] text-sage">
        CarbonGhost times two versions of the same task under identical inputs. The rules below decide what counts as a
        valid result.
      </p>

      <div className="mt-14 grid gap-px bg-graphite md:grid-cols-2">
        {SECTIONS.map(({ icon: Icon, title, body }) => (
          <section key={title} className="flex flex-col gap-4 bg-ink p-7 lg:p-9">
            <Icon className="h-5 w-5 text-chartreuse" aria-hidden />
            <h3 className="text-[17px] font-medium text-paper">{title}</h3>
            <p className="text-[14px] leading-[1.6] text-sage">{body}</p>
          </section>
        ))}
      </div>

      <section className="mt-14 border-t border-graphite pt-10">
        <h3 className="flex items-center gap-3 text-[17px] font-medium text-paper">
          <AlertTriangle className="h-4 w-4 text-chartreuse" aria-hidden />
          What these numbers do not show
        </h3>
        <ul className="mt-6 flex flex-col gap-4">
          {NOT_SHOWN.map((item) => (
            <li key={item} className="border-l border-graphite pl-4 text-[14px] leading-[1.6] text-sage">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
