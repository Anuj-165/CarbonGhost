import { motion } from 'framer-motion';

interface SectionLabelProps {
  index: string;
  children: string;
  tone?: 'light' | 'dark';
}

export default function SectionLabel({ index, children, tone = 'dark' }: SectionLabelProps) {
  const color = tone === 'dark' ? 'text-sage' : 'text-graphite-500';
  const indexColor = tone === 'dark' ? 'text-chartreuse' : 'text-forest';
  const rule = tone === 'dark' ? 'bg-sage/40' : 'bg-graphite-500/40';

  return (
    <div className={`flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.18em] ${color}`}>
      <span className={`tabular-nums ${indexColor}`}>{index}</span>
      <motion.span
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className={`h-px w-12 origin-left ${rule}`}
        aria-hidden
      />
      <span>{children}</span>
    </div>
  );
}
