interface CarbonGhostMarkProps {
  className?: string;
}

export function CarbonGhostMark({ className = 'h-7 w-7' }: CarbonGhostMarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <path
        d="M7 26V13.5C7 8.8 10.4 6 16 6s9 2.8 9 7.5V26"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7 26l4-3.5 4 3.5 4-3.5 4 3.5 2-1.7"
        stroke="#8FA596"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M11.5 14h9" stroke="#8FA596" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="16" cy="19.5" r="2" fill="#C7F36B" />
    </svg>
  );
}

export default function CarbonGhostLogo() {
  return (
    <span className="flex items-center gap-2.5 text-paper">
      <CarbonGhostMark />
      <span className="font-sans text-[15px] font-medium tracking-[-0.01em]">CarbonGhost</span>
    </span>
  );
}
