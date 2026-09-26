import { KeyRound, LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'
import { ACCOUNT_TYPE_LABEL } from '../../types/labels'
import { cn } from '../../utils/cn'
import { initials } from '../../utils/format'

export function Avatar({ name, className }: { name: string; className?: string }): JSX.Element {
  return (
    <span
      className={cn(
        'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-semibold text-accent-foreground',
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

/** Avatar que abre menu com conta e saída. `placement` define para onde o menu abre. */
export function UserMenu({ placement = 'down', showName = false }: { placement?: 'up' | 'down'; showName?: boolean }) {
  const { me, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent | KeyboardEvent): void => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return
      if (event instanceof MouseEvent && ref.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  if (!me) return null

  async function handleLogout(): Promise<void> {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex items-center gap-2.5 rounded-control text-left',
          showName ? 'w-full p-2 hover:bg-muted' : 'rounded-full',
        )}
      >
        <Avatar name={me.user.name} />
        {showName && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium">{me.user.name}</span>
            <span className="block truncate text-[12px] text-muted-foreground">
              {me.account?.name ?? ACCOUNT_TYPE_LABEL[me.user.accountType]}
            </span>
          </span>
        )}
        {!showName && <span className="sr-only">Abrir menu da conta</span>}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 w-60 rounded-card border bg-card p-1.5 shadow-float animate-in fade-in-0 zoom-in-95',
            placement === 'down' ? 'right-0 top-full mt-2' : 'bottom-full left-0 mb-2',
          )}
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-[13px] font-medium">{me.user.name}</p>
            <p className="truncate text-[12px] text-muted-foreground">{me.user.email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link
            to="/conta"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex h-10 items-center gap-2.5 rounded-control px-2.5 text-sm hover:bg-muted"
          >
            <KeyRound className="h-4 w-4 text-muted-foreground" /> Minha conta
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleLogout()}
            className="flex h-10 w-full items-center gap-2.5 rounded-control px-2.5 text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      )}
    </div>
  )
}
