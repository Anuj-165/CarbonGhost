import { motion } from 'framer-motion';
import ButtonLink from '@/components/ui/ButtonLink';
import ComputeStage from '@/components/hero/ComputeStage';
import InstrumentReadout from '@/components/hero/InstrumentReadout';
import MessageSequence from '@/components/hero/MessageSequence';

const HEADLINE_LINES = [
  ['Your', 'code', 'runs.'],
  ['But', 'does', 'it', 'run'],
];

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  let wordIndex = 0;

  return (
    <section id="top" className="technical-grid relative overflow-hidden pt-32 pb-24 md:pt-36 lg:pb-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-sage"
        >
          <span>Computational cost instrument</span>
          <span className="hidden sm:inline">Ref. CG-01 / Measurement layer</span>
        </motion.div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-8">
          <h1 className="font-display text-[clamp(3.25rem,9vw,8.75rem)] leading-[0.98] tracking-[-0.025em] lg:col-span-9">
            {HEADLINE_LINES.map((line, lineIndex) => (
              <span key={lineIndex} className="block">
                {line.map((word) => {
                  const delay = 0.15 + wordIndex++ * 0.08;
                  return (
                    <motion.span
                      key={word}
                      initial={{ opacity: 0, y: '0.4em' }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.9, delay, ease: EASE }}
                      className="mr-[0.22em] inline-block"
                    >
                      {word}
                    </motion.span>
                  );
                })}
                {lineIndex === 1 && (
                  <motion.span
                    initial={{ opacity: 0, y: '0.4em' }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.15 + wordIndex++ * 0.08, ease: EASE }}
                    className="inline-block italic text-sage"
                  >
                    efficiently?
                  </motion.span>
                )}
              </span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
            className="flex flex-col justify-end gap-8 lg:col-span-3 lg:pb-3"
          >
            <p className="max-w-xs text-lg leading-[1.5] text-paper/80">
              Compare implementations. Measure what matters. Make every computation count.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <ButtonLink href="#/app">Run your first benchmark</ButtonLink>
              <ButtonLink href="#how-it-works" variant="ghost">
                See how it works
              </ButtonLink>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.5, ease: EASE }}
          className="relative mt-16 border border-graphite bg-ink/80 lg:mt-20"
        >
          <div className="flex items-center justify-between border-b border-graphite px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-sage md:px-6">
            <span>Fig. 01 Identical input, two implementations</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-chartreuse" aria-hidden />
              Illustrative
            </span>
          </div>

          <ComputeStage />

          <div className="grid gap-10 border-t border-graphite px-5 py-8 md:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:py-10">
            <MessageSequence />
            <InstrumentReadout />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
