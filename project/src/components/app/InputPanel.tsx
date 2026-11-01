import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, CircleCheck, CircleX, CircleDashed } from 'lucide-react';
import { generateDataset, INPUT_SEED, QUERY_COUNT } from '@/lib/benchmark/dataset';
import type { TestCheck } from '@/lib/benchmark/protocol';

const EASE = [0.22, 1, 0.36, 1] as const;

interface InputPanelProps {
  inputSize: number;
  tests: TestCheck[];
  testsPending: boolean;
}

export default function InputPanel({ inputSize, tests, testsPending }: InputPanelProps) {
  const [open, setOpen] = useState(false);

  const dataset = useMemo(
    () => (open ? generateDataset({ size: inputSize, queries: QUERY_COUNT, seed: INPUT_SEED }) : null),
    [open, inputSize],
  );

  const hitRate = useMemo(() => {
    if (!dataset) return null;
    const keys = new Set(dataset.records.map((record) => record.key));
    const hits = dataset.queries.filter((query) => keys.has(query)).length;
    return hits / dataset.queries.length;
  }, [dataset]);

  return (
    <section className="border border-graphite">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="input-panel-body"
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors duration-300 hover:bg-paper/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
      >
        <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-[14px] font-medium text-paper">Input and correctness checks</span>
          <span className="font-mono text-[11px] text-sage">
            {inputSize.toLocaleString()} records, {QUERY_COUNT} queries, seed {INPUT_SEED}
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.35, ease: EASE }}>
          <ChevronDown className="h-4 w-4 text-sage" aria-hidden />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && dataset && (
          <motion.div
            id="input-panel-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="grid gap-8 border-t border-graphite p-5 md:grid-cols-2">
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">Generated input</h3>
                <p className="mt-3 max-w-md text-[13px] leading-[1.6] text-paper/80">
                  Every run uses the same pseudo-random records and queries, so both implementations see identical data.
                  About {hitRate === null ? '0' : Math.round(hitRate * 100)}% of queries have a matching record.
                </p>
                <dl className="mt-5 grid max-w-md grid-cols-2 gap-x-6 gap-y-3 font-mono text-[12px]">
                  <dt className="text-sage">Records</dt>
                  <dd className="text-paper">{dataset.records.length.toLocaleString()}</dd>
                  <dt className="text-sage">Queries</dt>
                  <dd className="text-paper">{dataset.queries.length.toLocaleString()}</dd>
                  <dt className="text-sage">First record</dt>
                  <dd className="text-paper">
                    key {dataset.records[0].key}, value {dataset.records[0].value}
                  </dd>
                </dl>
              </div>

              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">Output checks</h3>
                <ul className="mt-3 flex flex-col divide-y divide-graphite border-y border-graphite">
                  {tests.length === 0 && (
                    <li className="flex items-start gap-3 py-3 text-[13px] text-sage">
                      <CircleDashed className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      {testsPending
                        ? 'Waiting for the run to start.'
                        : 'Both implementations are compared on the same queries before any timing begins.'}
                    </li>
                  )}
                  {tests.map((test) => (
                    <li key={test.name} className="flex items-start gap-3 py-3">
                      {test.ok ? (
                        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-chartreuse" aria-hidden />
                      ) : (
                        <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-paper" aria-hidden />
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] text-paper">{test.name}</p>
                        <p className="mt-0.5 text-[12px] leading-[1.5] text-sage">{test.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
