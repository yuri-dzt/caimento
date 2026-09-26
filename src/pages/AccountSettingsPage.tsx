import { LogOut } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { visibleNav } from '../components/layout/navigation'
import { Avatar } from '../components/layout/UserMenu'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Feedback'
import { Field, Input } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../contexts/auth-context'
import { errorMessage } from '../services/api'
import { authApi } from '../services/resources'
import { ACCOUNT_TYPE_LABEL } from '../types/labels'

export function AccountSettingsPage(): JSX.Element | null {
  const { me, logout } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null)

  if (!me) return null
  // telas fora das abas do celular (Equipe, Lojas) ficam acessíveis por aqui
  const extraLinks = visibleNav(me).filter((item) => !item.mobileTab)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setMessage({ tone: 'success', text: 'Senha alterada.' })
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Minha conta" />

      <section className="flex items-center gap-3 rounded-card border bg-card p-4">
        <Avatar name={me.user.name} className="h-12 w-12 text-[15px]" />
        <div className="min-w-0">
          <p className="truncate font-medium">{me.user.name}</p>
          <p className="truncate text-[13px] text-muted-foreground">{me.user.email}</p>
          <p className="text-[13px] text-muted-foreground">
            {ACCOUNT_TYPE_LABEL[me.user.accountType]}
            {me.account && ` · ${me.account.name}`}
          </p>
        </div>
      </section>

      {extraLinks.length > 0 && (
        <nav className="mt-4 divide-y overflow-hidden rounded-card border bg-card lg:hidden" aria-label="Gestão">
          {extraLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex h-12 items-center gap-3 px-4 text-sm font-medium hover:bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" /> {label}
            </Link>
          ))}
        </nav>
      )}

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 flex flex-col gap-4">
        <h2 className="text-[17px] font-semibold">Trocar senha</h2>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        <Field label="Senha atual">
          {(id) => <Input id={id} type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />}
        </Field>
        <Field label="Nova senha" hint="Mínimo de 8 caracteres.">
          {(id) => <Input id={id} type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />}
        </Field>
        <Button type="submit" className="w-fit" loading={saving} disabled={!currentPassword || newPassword.length < 8}>
          Salvar nova senha
        </Button>
      </form>

      <Button
        variant="ghost"
        className="mt-10 text-destructive hover:bg-destructive/10"
        onClick={async () => {
          await logout()
          navigate('/login', { replace: true })
        }}
      >
        <LogOut className="h-4 w-4" /> Sair
      </Button>
    </div>
  )
}
