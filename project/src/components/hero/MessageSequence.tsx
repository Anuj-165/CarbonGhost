import { motion } from 'framer-motion';

const LINES = [
  'Same problem.',
  'Different implementations.',
  'Different computational cost.',
  'Measure the difference.',
];

export default function MessageSequence() {
  return (
    <ol className="flex flex-col gap-3" aria-label="Core idea">
      {LINES.map((line, i) => (
        <motion.li
          key={line}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.6 + i * 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-baseline gap-4"
        >
          <span className="font-mono text-[11px] tabular-nums text-chartreuse">0{i + 1}</span>
          <span
            className={`font-display text-2xl leading-[1.2] md:text-[28px] ${
              i === LINES.length - 1 ? 'text-chartreuse' : 'text-paper'
            }`}
          >
            {line}
          </span>
        </motion.li>
      ))}
    </ol>
  );
}
