import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'
import { cn } from '../../utils/cn'
import { Logo } from './Logo'
import { visibleNav } from './navigation'
import { UserMenu } from './UserMenu'

/** Sidebar no desktop; no celular, barra de topo + abas na base (alcance do polegar) */
export function AppLayout(): JSX.Element | null {
  const { me } = useAuth()
  if (!me) return null

  const items = visibleNav(me)
  const tabs = items.filter((item) => item.mobileTab)

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      {/* sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-card/80 backdrop-blur lg:flex">
        <div className="px-5 pb-4 pt-5">
          <Logo />
          {me.account && <p className="mt-1 truncate pl-9 text-[12px] text-muted-foreground">{me.account.name}</p>}
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Principal">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-10 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 h-6 w-[3px] rounded-full bg-stitch" aria-hidden="true" />
                  )}
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          <UserMenu placement="up" showName />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* topo mobile */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
          <Logo />
          <UserMenu />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          <Outlet />
        </main>

        {/* abas mobile */}
        {tabs.length > 1 && (
          <nav
            aria-label="Principal"
            className="fixed inset-x-0 bottom-0 z-30 grid border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
            style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
          >
            {tabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-stitch" aria-hidden="true" />
                    )}
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}
