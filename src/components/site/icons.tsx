// The few hand-drawn icons the design uses (everything else comes from lucide-react).

export function WaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}

export function Chevron() {
  return (
    <svg className="chev" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The bow that ties the builder's lid and the "close the lid" button. */
export function Bow({ className, tails, loops, knot, gradient }: { className?: string; tails: [string, string]; loops: string; knot: string; gradient?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 240 170" aria-hidden="true">
      {gradient && (
        <defs>
          <linearGradient id="bowG2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e5559a" /><stop offset=".5" stopColor="#d5136f" /><stop offset="1" stopColor="#b80f5f" />
          </linearGradient>
        </defs>
      )}
      <path d="M114 88 L78 158 L95 152 L104 166 L124 92 Z" fill={tails[0]} />
      <path d="M126 88 L162 158 L145 152 L136 166 L116 92 Z" fill={tails[1]} />
      <path d="M120 84 C82 20 14 26 22 70 C30 108 92 102 120 84 Z" fill={loops} />
      <path d="M120 84 C158 20 226 26 218 70 C210 108 148 102 120 84 Z" fill={loops} />
      <rect x="104" y="66" width="32" height="34" rx="10" fill={knot} />
    </svg>
  );
}
