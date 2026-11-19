export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M5 5h15.2L27 11.8V27H5V5z" fill="currentColor" />
      <path d="M20.2 5.4V12H26.6" fill="none" stroke="#E7C4A8" strokeWidth="1.4" />
      <path d="M10 15.2h10.2M10 19h10.2M10 22.8h6.4" stroke="#E7C4A8" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}
