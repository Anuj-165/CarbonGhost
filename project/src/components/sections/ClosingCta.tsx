import { useState } from 'react';
import { motion } from 'framer-motion';
import ButtonLink from '@/components/ui/ButtonLink';
import Reveal from '@/components/ui/Reveal';
import SectionLabel from '@/components/ui/SectionLabel';

const BAR_COUNT = 56;

function barHeight(index: number, focus: number | null) {
  const x = index / (BAR_COUNT - 1);
  const idle = 0.18 + 0.1 * Math.sin(index * 0.55);
  if (focus === null) return idle;
  const d = x - focus;
  return Math.min(1, idle + 0.8 * Math.exp(-(d * d) / (2 * 0.012)));
}

export default function ClosingCta() {
  const [focus, setFocus] = useState<number | null>(null);

  return (
    <section id="start" className="relative overflow-hidden bg-forest text-paper">
      <div className="mx-auto max-w-[1440px] px-6 py-28 lg:px-12 lg:py-40">
        <Reveal>
          <SectionLabel index="06">Start measuring</SectionLabel>
        </Reveal>

        <div className="mt-10 grid gap-14 lg:grid-cols-12 lg:items-end lg:gap-8">
          <Reveal className="lg:col-span-7">
            <h2 className="font-display text-[clamp(3.25rem,8.5vw,8rem)] leading-[0.98] tracking-[-0.025em]">
              Make efficiency
              <span className="block italic text-sage">measurable.</span>
            </h2>
            <div className="mt-12 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#/app" className="justify-center">
                Run your first benchmark
              </ButtonLink>
              <ButtonLink href="#methodology" variant="ghost" className="justify-center">
                Read the methodology
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-5">
            <div
              className="relative border border-sage/25 bg-ink/40 p-6 md:p-8"
              onPointerMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setFocus(Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1));
              }}
              onPointerLeave={() => setFocus(null)}
            >
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
                <span>Sampling window</span>
                <span>{focus === null ? 'Move to sample' : `Position ${Math.round(focus * 100)}%`}</span>
              </div>
              <div className="mt-8 flex h-40 items-end gap-[3px]" aria-hidden>
                {Array.from({ length: BAR_COUNT }, (_, i) => {
                  const height = barHeight(i, focus);
                  const active = height > 0.6;
                  return (
                    <motion.span
                      key={i}
                      animate={{ height: `${height * 100}%` }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex-1 ${active ? 'bg-chartreuse' : 'bg-sage/35'}`}
                    />
                  );
                })}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-sage/20 pt-5 font-mono text-[11px] text-sage">
                <span>Bars respond to the pointer</span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-chartreuse" aria-hidden />
                  Sampling
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
