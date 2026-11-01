import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { motion } from 'framer-motion';

const CHANNELS = [
  { label: 'Runtime', baseline: 1, optimized: 0.34 },
  { label: 'Peak memory', baseline: 1, optimized: 0.61 },
  { label: 'Estimated energy', baseline: 1, optimized: 0.38 },
];

export default function InstrumentReadout() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-sage">
        <span>Relative index</span>
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 bg-sage-400" aria-hidden />
            Baseline
          </span>
          <span className="flex items-center gap-2 text-chartreuse">
            <span className="h-2 w-2 bg-chartreuse" aria-hidden />
            Optimized
          </span>
        </span>
      </div>

      {CHANNELS.map((channel, i) => (
        <div key={channel.label} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2">
          <span className="text-sm text-paper/90">{channel.label}</span>
          <span className="font-mono text-xs tabular-nums text-sage">
            <AnimatedNumber value={channel.baseline} suffix="x" />
            <span className="mx-2 text-graphite-500">/</span>
            <span className="text-chartreuse">
              <AnimatedNumber value={channel.optimized} suffix="x" />
            </span>
          </span>
          <div className="col-span-2 flex flex-col gap-1.5">
            <div className="relative h-1.5 w-full bg-paper/[0.06]">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: channel.baseline }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 origin-left bg-sage-400/70"
              />
            </div>
            <div className="relative h-1.5 w-full bg-paper/[0.06]">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: channel.optimized }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: 0.4 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 origin-left bg-chartreuse"
              />
            </div>
          </div>
        </div>
      ))}

      <p className="mt-1 font-mono text-[11px] leading-relaxed text-sage">
        Illustrative model output. Not a benchmark result. Real measurements replace these values once a
        benchmark has run.
      </p>
    </div>
  );
}
