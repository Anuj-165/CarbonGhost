import { X } from 'lucide-react';
import { Segmented } from '@/components/app/ConfigBar';
import { EMPTY_FILTERS, hasActiveFilters, type ModeFilter, type RunFilters } from '@/lib/runs/filterRuns';
import { MODE_COPY } from '@/lib/benchmark/examples';

interface HistoryFiltersProps {
  filters: RunFilters;
  sizes: number[];
  onChange: (next: RunFilters) => void;
}

const fieldClass =
  'h-10 w-full border border-graphite bg-transparent px-3 text-[13px] text-paper placeholder:text-sage [color-scheme:dark] transition-colors duration-300 hover:border-sage focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse';

export function HistoryFilters({ filters, sizes, onChange }: HistoryFiltersProps) {
  const update = (patch: Partial<RunFilters>) => onChange({ ...filters, ...patch });

  return (
    <section aria-label="Filter saved runs" className="grid gap-5 border border-graphite bg-[#0C130F] p-5 md:grid-cols-2 xl:grid-cols-12">
      <div className="xl:col-span-4">
        <label htmlFor="history-search" className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
          Search by name
        </label>
        <input
          id="history-search"
          type="search"
          value={filters.query}
          onChange={(event) => update({ query: event.target.value })}
          placeholder="e.g. lookup test"
          className={`${fieldClass} mt-2`}
        />
      </div>

      <div className="xl:col-span-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">Mode</p>
        <div className="mt-2">
          <Segmented<ModeFilter>
            ariaLabel="Filter by mode"
            value={filters.mode}
            onChange={(mode) => update({ mode })}
            options={[
              { value: 'all', label: 'All' },
              { value: 'isolated', label: MODE_COPY.isolated.label },
              { value: 'end-to-end', label: MODE_COPY['end-to-end'].label },
            ]}
          />
        </div>
      </div>

      <div className="xl:col-span-2">
        <label htmlFor="history-size" className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
          Input size
        </label>
        <select
          id="history-size"
          value={filters.inputSize}
          onChange={(event) => update({ inputSize: event.target.value === 'all' ? 'all' : Number(event.target.value) })}
          className={`${fieldClass} mt-2`}
        >
          <option value="all">All sizes</option>
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size.toLocaleString()} records
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:col-span-3">
        <div>
          <label htmlFor="history-from" className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
            From
          </label>
          <input
            id="history-from"
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(event) => update({ from: event.target.value })}
            className={`${fieldClass} mt-2`}
          />
        </div>
        <div>
          <label htmlFor="history-to" className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage">
            To
          </label>
          <input
            id="history-to"
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => update({ to: event.target.value })}
            className={`${fieldClass} mt-2`}
          />
        </div>
      </div>

      {hasActiveFilters(filters) && (
        <div className="flex items-center md:col-span-2 xl:col-span-12">
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="flex h-9 items-center gap-2 px-1 text-[13px] text-sage transition-colors duration-300 hover:text-chartreuse focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse"
          >
            <X className="h-4 w-4" aria-hidden />
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
