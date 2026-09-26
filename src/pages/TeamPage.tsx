import { Plus, UserCog } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Avatar } from '../components/layout/UserMenu'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { Alert, Badge, EmptyState } from '../components/ui/Feedback'
import { Field, Input, Select } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../contexts/auth-context'
import { errorMessage } from '../services/api'
import { accountsApi, usersApi } from '../services/resources'
import type { AccountType, Permission, User } from '../types/api'
import { ACCOUNT_TYPE_LABEL, PERMISSION_LABEL } from '../types/labels'
import { cn } from '../utils/cn'
import { isAdmin } from '../utils/permissions'
import { useResource } from '../utils/use-resource'

const EDITABLE_PERMISSIONS: Permission[] = ['create', 'edit', 'delete']
const PERMISSION_HINT: Record<Permission, string> = {
  view: 'Ver acervo e histórico',
  create: 'Cadastrar fotos e gerar simulações',
  edit: 'Trocar foto de cliente',
  delete: 'Excluir itens',
}

export function TeamPage(): JSX.Element {
  const { me } = useAuth()
  const admin = isAdmin(me)
  const users = useResource(() => usersApi.list())
  const accounts = useResource(() => (admin ? accountsApi.list() : Promise.resolve([])), [admin])
  const [editing, setEditing] = useState<User | 'new' | null>(null)

  const accountName = (id: string | null): string =>
    id ? (accounts.data?.find((account) => account.id === id)?.name ?? '') : 'Plataforma'

  function upsert(user: User): void {
    users.setData((current) => {
      const list = current ?? []
      return list.some((item) => item.id === user.id)
        ? list.map((item) => (item.id === user.id ? user : item))
        : [...list, user]
    })
    setEditing(null)
  }

  return (
    <div>
      <PageHeader
        title="Equipe"
        description={admin ? 'Usuários de todas as lojas.' : 'Quem usa o Caimento na sua loja.'}
        actions={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Novo usuário</Button>}
      />
      {users.error && <Alert className="mb-4">{users.error}</Alert>}

      {users.data?.length === 0 ? (
        <EmptyState icon={<UserCog className="h-5 w-5" />} title="Ninguém por aqui" description="Cadastre as funcionárias que vão usar a bancada." />
      ) : (
        <ul className="divide-y overflow-hidden rounded-card border bg-card">
          {(users.data ?? []).map((user) => {
            const editable = admin || (user.accountType === 'EMPLOYEE' && user.id !== me?.user.id)
            return (
              <li key={user.id} className={cn('flex items-center gap-3 px-4 py-3', !user.active && 'opacity-60')}>
                <Avatar name={user.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user.name} {user.id === me?.user.id && <span className="text-muted-foreground">(você)</span>}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {user.email}
                    {admin && ` · ${accountName(user.accountId)}`}
                  </p>
                </div>
                <div className="hidden flex-wrap justify-end gap-1 sm:flex">
                  <Badge tone={user.accountType === 'EMPLOYEE' ? 'neutral' : 'primary'}>{ACCOUNT_TYPE_LABEL[user.accountType]}</Badge>
                  {!user.active && <Badge tone="danger">Inativo</Badge>}
                </div>
                {editable && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(user)}>
                    Editar
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <UserDialog
          user={editing === 'new' ? null : editing}
          admin={admin}
          accounts={accounts.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={upsert}
        />
      )}
    </div>
  )
}

function UserDialog({
  user,
  admin,
  accounts,
  onClose,
  onSaved,
}: {
  user: User | null
  admin: boolean
  accounts: Array<{ id: string; name: string }>
  onClose: () => void
  onSaved: (user: User) => void
}) {
  const { me } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState<AccountType>(user?.accountType ?? 'EMPLOYEE')
  const [accountId, setAccountId] = useState(user?.accountId ?? accounts[0]?.id ?? '')
  const [permissions, setPermissions] = useState<Permission[]>(user?.permissions ?? ['view', 'create'])
  const [active, setActive] = useState(user?.active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isNew = !user
  const isSelf = user?.id === me?.user.id

  function togglePermission(permission: Permission): void {
    setPermissions((current) =>
      current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission],
    )
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const saved = isNew
        ? await usersApi.create({
            name,
            email,
            password,
            accountType,
            permissions,
            accountId: admin && accountType !== 'ADMIN' ? accountId : null,
          })
        : await usersApi.update(user.id, {
            name,
            permissions: accountType === 'EMPLOYEE' ? permissions : undefined,
            active: isSelf ? undefined : active,
            password: password || undefined,
          })
      onSaved(saved)
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} title={isNew ? 'Novo usuário' : `Editar ${user.name}`}>
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Nome">{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} required />}</Field>
        {isNew && (
          <Field label="E-mail">
            {(id) => <Input id={id} type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} required />}
          </Field>
        )}
        <Field label={isNew ? 'Senha inicial' : 'Nova senha (opcional)'} hint="Mínimo de 8 caracteres. Passe para a pessoa trocar depois.">
          {(id) => (
            <Input id={id} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required={isNew} minLength={8} />
          )}
        </Field>

        {isNew && admin && (
          <>
            <Field label="Tipo de acesso">
              {(id) => (
                <Select id={id} value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)}>
                  <option value="EMPLOYEE">Funcionária</option>
                  <option value="OWNER">Responsável da loja</option>
                  <option value="ADMIN">Administrador da plataforma</option>
                </Select>
              )}
            </Field>
            {accountType !== 'ADMIN' && (
              <Field label="Loja">
                {(id) => (
                  <Select id={id} value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
          </>
        )}

        {accountType === 'EMPLOYEE' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-[13px] font-medium">O que pode fazer</legend>
            {EDITABLE_PERMISSIONS.map((permission) => (
              <label key={permission} className="flex cursor-pointer items-center gap-3 rounded-control border px-3.5 py-2.5">
                <input
                  type="checkbox"
                  checked={permissions.includes(permission)}
                  onChange={() => togglePermission(permission)}
                  className="h-5 w-5 accent-[hsl(var(--primary))]"
                />
                <span>
                  <span className="block text-sm font-medium">{PERMISSION_LABEL[permission]}</span>
                  <span className="block text-[12px] text-muted-foreground">{PERMISSION_HINT[permission]}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {!isNew && !isSelf && (
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-5 w-5 accent-[hsl(var(--primary))]" />
            Acesso ativo
          </label>
        )}

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" loading={saving}>{isNew ? 'Criar usuário' : 'Salvar'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
