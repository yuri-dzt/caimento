import { cn } from '../../utils/cn'

/** Carretel girando: indicador de carregamento curto */
export function Spinner({ className }: { className?: string }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-5 w-5 animate-spool-turn', className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
