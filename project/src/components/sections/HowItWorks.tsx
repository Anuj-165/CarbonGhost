import { motion } from 'framer-motion';
import { Fingerprint, GitCompare, Gauge, Timer } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

const STEPS = [
  {
    icon: GitCompare,
    title: 'Compare',
    body: 'Place two implementations side by side with the same input, the same environment and the same success criteria.',
    detail: 'Input schema / fixtures',
  },
  {
    icon: Timer,
    title: 'Measure',
    body: 'Run each version under controlled warm-up and sampling. Record runtime, peak memory and operation counts.',
    detail: 'Runtime / memory / ops',
  },
  {
    icon: Fingerprint,
    title: 'Verify',
    body: 'Confirm both versions return identical results. A faster answer that differs is reported as a failure, not a win.',
    detail: 'Output equivalence',
  },
  {
    icon: Gauge,
    title: 'Improve',
    body: 'Read the report, change the implementation, and measure again. Each improvement is tied to a recorded before and after.',
    detail: 'Before / after delta',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-ink py-28 lg:py-40">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionLabel index="04">How it works</SectionLabel>
            <h2 className="mt-8 font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.02] tracking-[-0.02em]">
              A loop you can <span className="italic text-sage">repeat.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="max-w-sm text-base leading-[1.5] text-paper/70">
            Four stages turn a hunch about performance into a verified, reproducible result.
          </Reveal>
        </div>

        <div className="relative mt-20 grid gap-12 md:grid-cols-2 lg:mt-28 lg:grid-cols-4 lg:gap-6">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-[27px] hidden h-px origin-left bg-gradient-to-r from-chartreuse via-sage/50 to-transparent lg:block"
            aria-hidden
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex flex-col gap-6"
              >
                <div className="relative flex h-14 w-14 items-center justify-center border border-sage/40 bg-ink transition-colors duration-500 group-hover:border-chartreuse">
                  <Icon className="h-5 w-5 text-paper transition-colors duration-500 group-hover:text-chartreuse" aria-hidden />
                  <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-chartreuse opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-chartreuse">
                    Step 0{i + 1}
                  </p>
                  <h3 className="mt-3 font-display text-4xl leading-[1.1] md:text-5xl">{step.title}</h3>
                </div>
                <p className="max-w-xs text-base leading-[1.5] text-paper/70">{step.body}</p>
                <p className="mt-auto border-t border-graphite pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-sage">
                  {step.detail}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
