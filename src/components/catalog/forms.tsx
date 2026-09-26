import { useState, type FormEvent } from 'react'
import { errorMessage } from '../../services/api'
import { customersApi, fabricsApi, garmentsApi } from '../../services/resources'
import { FABRIC_TYPES, type Customer, type Fabric, type FabricType, type Garment } from '../../types/api'
import { FABRIC_TYPE_LABEL } from '../../types/labels'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Feedback'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { ImageInput } from '../ui/ImageInput'

interface FormProps<T> {
  onCreated: (item: T) => void
  onCancel: () => void
}

function FormActions({ submitting, disabled, label, onCancel }: {
  submitting: boolean
  disabled: boolean
  label: string
  onCancel: () => void
}) {
  return (
    <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="ghost" onClick={onCancel} disabled={submitting}>
        Cancelar
      </Button>
      <Button type="submit" loading={submitting} disabled={disabled}>
        {label}
      </Button>
    </div>
  )
}

export function GarmentForm({ onCreated, onCancel }: FormProps<Garment>): JSX.Element {
  const [image, setImage] = useState<Blob | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (!image) return
    setSubmitting(true)
    setError(null)
    try {
      onCreated(await garmentsApi.create({ name, description, image }))
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <ImageInput
        value={image}
        onChange={setImage}
        label="Foto da peça"
        hint="Peça inteira, de frente. Vale print do Instagram."
        aspect="aspect-[4/5] max-h-[42dvh] mx-auto w-full max-w-xs"
      />
      <Field label="Nome da peça">
        {(id) => (
          <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Vestido midi com babado" required />
        )}
      </Field>
      <Field label="Observações (opcional)">
        {(id) => (
          <Textarea id={id} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="Ex.: modelo da cliente Ana, tamanho M" />
        )}
      </Field>
      <FormActions submitting={submitting} disabled={!image || !name.trim()} label="Salvar peça" onCancel={onCancel} />
    </form>
  )
}

export function FabricForm({ onCreated, onCancel }: FormProps<Fabric>): JSX.Element {
  const [image, setImage] = useState<Blob | null>(null)
  const [name, setName] = useState('')
  const [fabricType, setFabricType] = useState<FabricType | ''>('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (!image || !fabricType) return
    setSubmitting(true)
    setError(null)
    try {
      onCreated(await fabricsApi.create({ name, fabricType, description, image }))
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <ImageInput
        value={image}
        onChange={setImage}
        label="Foto do tecido"
        hint="Estique o tecido e fotografe de perto, com luz boa. Se tiver estampa, pegue uns 20 cm."
        aspect="aspect-square max-h-[40dvh] mx-auto w-full max-w-xs"
      />
      <Field label="Nome do tecido">
        {(id) => (
          <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Linho floral azul" required />
        )}
      </Field>
      <Field label="Tipo" hint="Ajuda a IA a acertar o caimento e o brilho.">
        {(id) => (
          <Select id={id} value={fabricType} onChange={(e) => setFabricType(e.target.value as FabricType)} required>
            <option value="" disabled>
              Escolha o tipo
            </option>
            {FABRIC_TYPES.map((type) => (
              <option key={type} value={type}>
                {FABRIC_TYPE_LABEL[type]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Observações (opcional)">
        {(id) => (
          <Textarea id={id} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="Ex.: tem elastano, é mais encorpado" />
        )}
      </Field>
      <FormActions
        submitting={submitting}
        disabled={!image || !name.trim() || !fabricType}
        label="Salvar tecido"
        onCancel={onCancel}
      />
    </form>
  )
}

export function ConsentCheckbox({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-control bg-muted px-3.5 py-3 text-[13px] leading-snug">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
      />
      <span>
        A cliente autorizou usar esta foto para simular roupas. A foto fica só nesta loja e é apagada quando a cliente
        for excluída.
      </span>
    </label>
  )
}

export function CustomerForm({ onCreated, onCancel }: FormProps<Customer>): JSX.Element {
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      onCreated(await customersApi.create({ name, phone, notes, photo, photoConsent: consent }))
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <Field label="Nome da cliente">
        {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" required />}
      </Field>
      <Field label="WhatsApp (opcional)">
        {(id) => (
          <Input id={id} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
        )}
      </Field>
      <ImageInput
        value={photo}
        onChange={setPhoto}
        label="Foto da cliente (opcional)"
        hint="Corpo inteiro, de frente, roupa justa e fundo liso."
        aspect="aspect-[3/4] max-h-[40dvh] mx-auto w-full max-w-[16rem]"
      />
      {photo && <ConsentCheckbox checked={consent} onChange={setConsent} />}
      <Field label="Observações (opcional)">
        {(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Medidas, preferências..." />}
      </Field>
      <FormActions
        submitting={submitting}
        disabled={!name.trim() || (Boolean(photo) && !consent)}
        label="Salvar cliente"
        onCancel={onCancel}
      />
    </form>
  )
}
