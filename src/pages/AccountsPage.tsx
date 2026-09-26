import { Plus, Store } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { Alert, Badge, EmptyState } from '../components/ui/Feedback'
import { Field, Input } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { errorMessage } from '../services/api'
import { accountsApi } from '../services/resources'
import type { Account } from '../types/api'
import { formatDate } from '../utils/format'
import { useResource } from '../utils/use-resource'

/** Só admin da plataforma: cadastra loja + responsável */
export function AccountsPage(): JSX.Element {
  const accounts = useResource(() => accountsApi.list())
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle(account: Account): Promise<void> {
    const verb = account.active ? 'Desativar' : 'Reativar'
    if (!window.confirm(`${verb} a loja ${account.name}?`)) return
    try {
      const updated = await accountsApi.update(account.id, { active: !account.active })
      accounts.setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Lojas"
        description="Cada loja tem seu acervo, suas clientes e sua equipe."
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nova loja</Button>}
      />
      {(accounts.error || error) && <Alert className="mb-4">{accounts.error ?? error}</Alert>}
      {accounts.data?.length === 0 ? (
        <EmptyState
          icon={<Store className="h-5 w-5" />}
          title="Nenhuma loja ainda"
          description="Cadastre a primeira loja junto com a responsável. Ela cria as funcionárias depois."
          action={<Button onClick={() => setCreating(true)}>Cadastrar loja</Button>}
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-card border bg-card">
          {(accounts.data ?? []).map((account) => (
            <li key={account.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                <Store className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{account.name}</p>
                <p className="text-[12px] text-muted-foreground">Desde {formatDate(account.createdAt)}</p>
              </div>
              <Badge tone={account.active ? 'success' : 'danger'}>{account.active ? 'Ativa' : 'Inativa'}</Badge>
              <Button variant="ghost" size="sm" onClick={() => void toggle(account)}>
                {account.active ? 'Desativar' : 'Reativar'}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {creating && (
        <CreateAccountDialog
          onClose={() => setCreating(false)}
          onCreated={(account) => {
            accounts.setData((current) => [...(current ?? []), account].sort((a, b) => a.name.localeCompare(b.name)))
            setCreating(false)
          }}
        />
      )}
    </div>
  )
}

function CreateAccountDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (account: Account) => void }) {
  const [name, setName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { account } = await accountsApi.create({ name, ownerName, ownerEmail, ownerPassword })
      onCreated(account)
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} title="Nova loja" description="A responsável entra com este e-mail e senha.">
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Nome da loja ou ateliê">{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} required />}</Field>
        <Field label="Nome da responsável">{(id) => <Input id={id} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />}</Field>
        <Field label="E-mail da responsável">
          {(id) => <Input id={id} type="email" autoComplete="off" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required />}
        </Field>
        <Field label="Senha inicial" hint="Mínimo de 8 caracteres.">
          {(id) => <Input id={id} type="password" autoComplete="new-password" minLength={8} value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} required />}
        </Field>
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" loading={saving}>Criar loja</Button>
        </div>
      </form>
    </Dialog>
  )
}
