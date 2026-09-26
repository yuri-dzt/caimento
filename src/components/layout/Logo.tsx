import { cn } from '../../utils/cn'

/** Carretel com linha carmim + nome. `compact` mostra só o ícone. */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }): JSX.Element {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden="true">
        <rect x="7" y="3" width="18" height="4" rx="1.5" className="fill-primary" />
        <rect x="7" y="25" width="18" height="4" rx="1.5" className="fill-primary" />
        <rect x="9" y="7" width="14" height="18" className="fill-stitch" />
        <path d="M9 10.5h14M9 14h14M9 17.5h14M9 21h14" stroke="hsl(0 0% 0% / 0.25)" strokeWidth="1.2" />
        <path d="M23 16c3 0 4 2 5 5" fill="none" className="stroke-stitch" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {!compact && <span className="text-[17px] font-semibold tracking-[-0.02em]">Caimento</span>}
      {compact && <span className="sr-only">Caimento</span>}
    </span>
  )
}
