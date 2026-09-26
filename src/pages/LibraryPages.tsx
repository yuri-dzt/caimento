import { Layers, Plus, Shirt, Trash2, UserRound, Users } from 'lucide-react'
import { useState } from 'react'
import { ConsentCheckbox, CustomerForm, FabricForm, GarmentForm } from '../components/catalog/forms'
import { FabricTile, GarmentTile } from '../components/catalog/tiles'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { Alert, Badge, EmptyState, SkeletonGrid } from '../components/ui/Feedback'
import { ImageInput } from '../components/ui/ImageInput'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../contexts/auth-context'
import { errorMessage } from '../services/api'
import { customersApi, fabricsApi, garmentsApi } from '../services/resources'
import type { Customer } from '../types/api'
import { formatDate } from '../utils/format'
import { can, worksInAccount } from '../utils/permissions'
import { useResource } from '../utils/use-resource'

function DeleteButton({ label, onDelete }: { label: string; onDelete: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      aria-label={`Excluir ${label}`}
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(`Excluir ${label}?`)) return
        setBusy(true)
        try {
          await onDelete()
        } finally {
          setBusy(false)
        }
      }}
      className="-mr-1.5 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}

function useLibraryPermissions() {
  const { me } = useAuth()
  return { canCreate: worksInAccount(me) && can(me, 'create'), canDelete: can(me, 'delete'), canEdit: can(me, 'edit') }
}

export function FabricsPage(): JSX.Element {
  const fabrics = useResource(() => fabricsApi.list())
  const { canCreate, canDelete } = useLibraryPermissions()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove(id: string): Promise<void> {
    try {
      await fabricsApi.remove(id)
      fabrics.setData((current) => current?.filter((item) => item.id !== id))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Tecidos"
        description="O que você tem na loja para oferecer."
        actions={canCreate && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Novo tecido</Button>}
      />
      {(fabrics.error || error) && <Alert className="mb-4">{fabrics.error ?? error}</Alert>}
      {fabrics.loading && !fabrics.data ? (
        <SkeletonGrid aspect="aspect-square" />
      ) : fabrics.data?.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-5 w-5" />}
          title="Nenhum tecido cadastrado"
          description="Estique o tecido na mesa e fotografe de perto. Ele fica pronto para usar em qualquer simulação."
          action={canCreate && <Button onClick={() => setCreating(true)}>Fotografar tecido</Button>}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {fabrics.data?.map((fabric) => (
            <li key={fabric.id}>
              <FabricTile
                fabric={fabric}
                action={canDelete && <DeleteButton label={`o tecido ${fabric.name}`} onDelete={() => remove(fabric.id)} />}
              />
            </li>
          ))}
        </ul>
      )}
      <Dialog open={creating} onClose={() => setCreating(false)} title="Novo tecido">
        <FabricForm
          onCancel={() => setCreating(false)}
          onCreated={(item) => {
            fabrics.setData((current) => [item, ...(current ?? [])])
            setCreating(false)
          }}
        />
      </Dialog>
    </div>
  )
}

export function GarmentsPage(): JSX.Element {
  const garments = useResource(() => garmentsApi.list())
  const { canCreate, canDelete } = useLibraryPermissions()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove(id: string): Promise<void> {
    try {
      await garmentsApi.remove(id)
      garments.setData((current) => current?.filter((item) => item.id !== id))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Peças de referência"
        description="Modelos que as clientes trazem ou que a loja vende."
        actions={canCreate && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nova peça</Button>}
      />
      {(garments.error || error) && <Alert className="mb-4">{garments.error ?? error}</Alert>}
      {garments.loading && !garments.data ? (
        <SkeletonGrid />
      ) : garments.data?.length === 0 ? (
        <EmptyState
          icon={<Shirt className="h-5 w-5" />}
          title="Nenhuma peça cadastrada"
          description="Fotografe a peça no cabide ou salve o print que a cliente mandou."
          action={canCreate && <Button onClick={() => setCreating(true)}>Adicionar peça</Button>}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {garments.data?.map((garment) => (
            <li key={garment.id}>
              <GarmentTile
                garment={garment}
                action={canDelete && <DeleteButton label={`a peça ${garment.name}`} onDelete={() => remove(garment.id)} />}
              />
            </li>
          ))}
        </ul>
      )}
      <Dialog open={creating} onClose={() => setCreating(false)} title="Nova peça">
        <GarmentForm
          onCancel={() => setCreating(false)}
          onCreated={(item) => {
            garments.setData((current) => [item, ...(current ?? [])])
            setCreating(false)
          }}
        />
      </Dialog>
    </div>
  )
}

export function CustomersPage(): JSX.Element {
  const customers = useResource(() => customersApi.list())
  const { canCreate, canDelete, canEdit } = useLibraryPermissions()
  const [creating, setCreating] = useState(false)
  const [photoFor, setPhotoFor] = useState<Customer | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function remove(id: string): Promise<void> {
    try {
      await customersApi.remove(id)
      customers.setData((current) => current?.filter((item) => item.id !== id))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  function replace(updated: Customer): void {
    customers.setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)))
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Fotos para o provador. Só com autorização da cliente."
        actions={canCreate && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nova cliente</Button>}
      />
      {(customers.error || error) && <Alert className="mb-4">{customers.error ?? error}</Alert>}
      {customers.loading && !customers.data ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-[76px] animate-pulse rounded-card bg-muted" />
          ))}
        </div>
      ) : customers.data?.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="Nenhuma cliente cadastrada"
          description="Com a foto da cliente (e a autorização dela) você mostra a peça vestida nela."
          action={canCreate && <Button onClick={() => setCreating(true)}>Cadastrar cliente</Button>}
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-card border bg-card">
          {customers.data?.map((customer) => (
            <li key={customer.id} className="flex items-center gap-3 px-4 py-3">
              {customer.photoUrl ? (
                <img src={customer.photoUrl} alt="" className="h-[52px] w-10 shrink-0 rounded-md object-cover" />
              ) : (
                <span className="grid h-[52px] w-10 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                  <UserRound className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{customer.name}</p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {customer.phone ?? 'Sem telefone'}
                  {customer.photoConsentAt && (
                    <span className="hidden sm:inline">{` · autorizou em ${formatDate(customer.photoConsentAt)}`}</span>
                  )}
                </p>
              </div>
              {!customer.photoUrl && <Badge className="hidden sm:inline-flex">Sem foto</Badge>}
              {canEdit && (
                <Button variant="ghost" size="sm" onClick={() => setPhotoFor(customer)}>
                  {customer.photoUrl ? 'Trocar foto' : 'Pôr foto'}
                </Button>
              )}
              {canDelete && (
                <DeleteButton
                  label={`a cliente ${customer.name}? A foto e as provas de roupa dela também serão apagadas`}
                  onDelete={() => remove(customer.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)} title="Nova cliente">
        <CustomerForm
          onCancel={() => setCreating(false)}
          onCreated={(item) => {
            customers.setData((current) => [item, ...(current ?? [])].sort((a, b) => a.name.localeCompare(b.name)))
            setCreating(false)
          }}
        />
      </Dialog>

      {photoFor && (
        <CustomerPhotoDialog
          customer={photoFor}
          onClose={() => setPhotoFor(null)}
          onSaved={(updated) => {
            replace(updated)
            setPhotoFor(null)
          }}
        />
      )}
    </div>
  )
}

function CustomerPhotoDialog({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer
  onClose: () => void
  onSaved: (customer: Customer) => void
}) {
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [consent, setConsent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(): Promise<void> {
    if (!photo) return
    setSaving(true)
    setError(null)
    try {
      onSaved(await customersApi.updatePhoto(customer.id, photo, consent))
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Foto de ${customer.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => void save()} disabled={!photo || !consent} loading={saving}>Salvar foto</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}
        <ImageInput
          value={photo}
          onChange={setPhoto}
          label="Foto da cliente"
          hint="Corpo inteiro, de frente, roupa justa e fundo liso."
          aspect="aspect-[3/4] max-h-[45dvh] mx-auto w-full max-w-[16rem]"
        />
        <ConsentCheckbox checked={consent} onChange={setConsent} />
      </div>
    </Dialog>
  )
}
