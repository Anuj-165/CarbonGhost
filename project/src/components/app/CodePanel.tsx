import { useState, type ReactNode } from 'react';
import { Check, Copy, RotateCcw } from 'lucide-react';
import CodeEditor from '@/components/app/CodeEditor';
import type { LineDiff } from '@/lib/diff';

interface CodePanelProps {
  label: 'Baseline' | 'Candidate';
  description: string;
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
  diff: LineDiff | null;
  receded: boolean;
}

export default function CodePanel({ label, description, value, defaultValue, onChange, diff, receded }: CodePanelProps) {
  const [copied, setCopied] = useState(false);
  const lineCount = value.split('\n').length;
  const isDefault = value === defaultValue;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      aria-label={`${label} code`}
      className={`flex min-w-0 flex-col border border-graphite bg-[#0C130F] transition-[opacity,transform] duration-500 ease-out ${
        receded ? 'pointer-events-none opacity-45' : 'opacity-100'
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-graphite px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className={`h-1.5 w-1.5 rounded-full ${label === 'Candidate' ? 'bg-chartreuse' : 'bg-sage'}`} aria-hidden />
            <h2 className="font-sans text-[14px] font-medium text-paper">{label}</h2>
          </div>
          <p className="mt-1 truncate text-[12px] text-sage">{description}</p>
        </div>

        <div className="flex items-center gap-1">
          <PanelAction onClick={copy} label={copied ? 'Copied' : 'Copy code'}>
            {copied ? <Check className="h-3.5 w-3.5 text-chartreuse" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          </PanelAction>
          <PanelAction onClick={() => onChange(defaultValue)} label="Reset to example" disabled={isDefault}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          </PanelAction>
        </div>
      </header>

      <div className="h-[340px] min-h-0 overflow-hidden lg:h-[420px]">
        <CodeEditor
          label={`${label} implementation`}
          value={value}
          onChange={onChange}
          changedLines={diff?.changedLines}
        />
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-graphite px-4 py-2.5 font-mono text-[11px] text-sage">
        <span>{lineCount} lines</span>
        {diff ? (
          <span className={diff.added + diff.removed === 0 ? 'text-sage' : 'text-paper'}>
            {diff.added + diff.removed === 0 ? 'Identical to baseline' : `+${diff.added} / -${diff.removed} vs baseline`}
          </span>
        ) : (
          <span>Reference</span>
        )}
      </footer>
    </section>
  );
}

function PanelAction({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 items-center gap-1.5 px-2 font-mono text-[11px] text-sage transition-colors duration-300 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-chartreuse disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:text-sage"
    >
      {children}
    </button>
  );
}
