import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * <dialog> nativo: foco preso, Esc fecha, fica acima de tudo.
 * No celular vira folha que sobe de baixo.
 */
export function Dialog({ open, onClose, title, description, children, footer, className }: DialogProps): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      aria-labelledby="dialog-title"
      className={cn(
        'm-0 mt-auto w-full max-w-none rounded-t-[20px] border-0 bg-card p-0 text-card-foreground shadow-float',
        'backdrop:bg-[hsl(var(--shadow)/0.45)] backdrop:backdrop-blur-[2px]',
        'sm:m-auto sm:max-w-lg sm:rounded-card',
        'open:animate-in open:slide-in-from-bottom-6 open:fade-in-0 sm:open:zoom-in-95 sm:open:slide-in-from-bottom-2',
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[88dvh] flex-col">
          <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
            <div>
              <h2 id="dialog-title" className="text-[17px] font-semibold tracking-tight">
                {title}
              </h2>
              {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-1 grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="overflow-y-auto px-5 pb-5">{children}</div>
          {footer && (
            <footer className="flex flex-col-reverse gap-2 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  )
}
