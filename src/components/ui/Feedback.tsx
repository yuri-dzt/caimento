import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export function Alert({
  tone = 'error',
  children,
  className,
}: {
  tone?: 'error' | 'success'
  children: ReactNode
  className?: string
}): JSX.Element {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-control px-3.5 py-3 text-sm',
        tone === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success',
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
  className?: string
}): JSX.Element {
  const tones = {
    neutral: 'bg-muted text-muted-foreground',
    primary: 'bg-accent text-accent-foreground',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-destructive/15 text-destructive',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium leading-5',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

/** Estado vazio que ensina o próximo passo */
export function EmptyState({ icon, title, description, action }: EmptyStateProps): JSX.Element {
  return (
    <div className="stitch-frame flex flex-col items-center rounded-card px-6 py-12 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">{icon}</div>
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Grade de placeholders enquanto carrega */
export function SkeletonGrid({ count = 8, aspect = 'aspect-[3/4]' }: { count?: number; aspect?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={cn(aspect, 'animate-pulse rounded-card bg-muted')} />
      ))}
    </div>
  )
}
