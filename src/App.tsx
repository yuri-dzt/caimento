import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { homePath } from './components/layout/navigation'
import { RequireAuth } from './components/layout/RequireAuth'
import { useAuth } from './contexts/auth-context'
import { AccountSettingsPage } from './pages/AccountSettingsPage'
import { AccountsPage } from './pages/AccountsPage'
import { HistoryPage } from './pages/HistoryPage'
import { CustomersPage, FabricsPage, GarmentsPage } from './pages/LibraryPages'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SimulationPage } from './pages/SimulationPage'
import { TeamPage } from './pages/TeamPage'
import { WorkbenchPage } from './pages/WorkbenchPage'
import { can, canManageUsers, isAdmin, worksInAccount } from './utils/permissions'

/** "/" é a bancada; quem não gera simulação (ex.: admin) vai para a própria tela inicial */
function Home(): JSX.Element {
  const { me } = useAuth()
  if (me && worksInAccount(me) && can(me, 'create')) return <WorkbenchPage />
  return <Navigate to={me ? homePath(me) : '/login'} replace />
}

export function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="historico" element={<HistoryPage />} />
        <Route path="simulacoes/:id" element={<SimulationPage />} />
        <Route path="tecidos" element={<FabricsPage />} />
        <Route path="pecas" element={<GarmentsPage />} />
        <Route path="clientes" element={<CustomersPage />} />
        <Route path="conta" element={<AccountSettingsPage />} />
        <Route
          path="equipe"
          element={
            <RequireAuth allow={canManageUsers}>
              <TeamPage />
            </RequireAuth>
          }
        />
        <Route
          path="lojas"
          element={
            <RequireAuth allow={isAdmin}>
              <AccountsPage />
            </RequireAuth>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
