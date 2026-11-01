import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeft, Search } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  hint: string;
  onSelect: () => void;
  disabled?: boolean;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}

export default function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return commands.filter((command) => !needle || command.label.toLowerCase().includes(needle));
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    setActive((index) => Math.min(index, Math.max(results.length - 1, 0)));
  }, [results.length]);

  const runCommand = (command: Command | undefined) => {
    if (!command || command.disabled) return;
    onClose();
    command.onSelect();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') onClose();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % Math.max(results.length, 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % Math.max(results.length, 1));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      runCommand(results[active]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/70 px-4 pt-[14vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-xl border border-graphite bg-[#0C130F] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center gap-3 border-b border-graphite px-4">
              <Search className="h-4 w-4 text-sage" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command"
                aria-label="Search commands"
                aria-controls="command-results"
                aria-activedescendant={results[active] ? `command-${results[active].id}` : undefined}
                className="h-14 flex-1 bg-transparent text-[15px] text-paper placeholder:text-sage/70 focus:outline-none"
              />
              <kbd className="font-mono text-[10px] text-sage">Esc</kbd>
            </div>

            <ul id="command-results" role="listbox" className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center font-mono text-[12px] text-sage">No matching commands</li>
              )}
              {results.map((command, index) => {
                const selected = index === active;
                return (
                  <li
                    key={command.id}
                    id={`command-${command.id}`}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={command.disabled || undefined}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => runCommand(command)}
                    className={`flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm transition-colors duration-150 ${
                      selected ? 'bg-paper/[0.06] text-paper' : 'text-paper/80'
                    } ${command.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`h-1 w-1 rounded-full transition-colors ${selected ? 'bg-chartreuse' : 'bg-transparent'}`}
                        aria-hidden
                      />
                      {command.label}
                    </span>
                    <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-sage">
                      {command.hint}
                      {selected && <CornerDownLeft className="h-3 w-3 text-chartreuse" aria-hidden />}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
