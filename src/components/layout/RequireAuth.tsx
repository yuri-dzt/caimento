import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'
import type { Me } from '../../types/api'
import { Spinner } from '../ui/Spinner'

/** Sem sessão → /login?next=... ; com `allow`, bloqueia quem não tem acesso à tela */
export function RequireAuth({ children, allow }: { children: ReactNode; allow?: (me: Me) => boolean }) {
  const { me, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center text-primary">
        <Spinner className="h-7 w-7" />
      </div>
    )
  }

  if (!me) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (allow && !allow(me)) return <Navigate to="/nao-encontrado" replace />

  return <>{children}</>
}
