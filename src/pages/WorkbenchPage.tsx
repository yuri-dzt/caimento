import { ChevronDown, Equal, Plus, Shirt, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CustomerForm, FabricForm, GarmentForm } from '../components/catalog/forms'
import { LibraryPicker } from '../components/catalog/LibraryPicker'
import { CustomerTile, FabricTile, GarmentTile } from '../components/catalog/tiles'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Feedback'
import { Textarea } from '../components/ui/Field'
import { FabricTypeChip, Swatch } from '../components/ui/Thread'
import { errorMessage } from '../services/api'
import { customersApi, fabricsApi, garmentsApi, simulationsApi } from '../services/resources'
import type { Customer, Fabric, Garment } from '../types/api'
import { cn } from '../utils/cn'
import { useResource } from '../utils/use-resource'

const MAX_INSTRUCTIONS = 1000

type Mode = 'swap' | 'tryon'

const MODE_COPY: Record<Mode, { tab: string; description: string; action: string; ready: string; placeholder: string }> = {
  swap: {
    tab: 'Trocar tecido',
    description: 'Escolha o modelo e o tecido. A IA costura a peça pronta.',
    action: 'Costurar simulação',
    ready: 'Pronto para costurar',
    placeholder: 'A peça pronta aparece aqui',
  },
  tryon: {
    tab: 'Só provar',
    description: 'Escolha a peça e a cliente. A IA mostra a cliente vestindo a peça.',
    action: 'Provar na cliente',
    ready: 'Pronto para provar',
    placeholder: 'A cliente vestida aparece aqui',
  },
}

/**
 * Bancada: tela principal do produto. Dois modos:
 * - Trocar tecido: peça + tecido = peça pronta no tecido novo
 * - Só provar: peça + cliente = cliente vestindo a peça como ela é
 * Aceita ?modo=provar&peca=&tecido=&cliente=&ajuste= para "gerar de novo".
 */
export function WorkbenchPage(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const garments = useResource(() => garmentsApi.list())
  const fabrics = useResource(() => fabricsApi.list())
  const customers = useResource(() => customersApi.list())

  const [mode, setMode] = useState<Mode>(params.get('modo') === 'provar' ? 'tryon' : 'swap')
  const [garmentId, setGarmentId] = useState<string | null>(params.get('peca'))
  const [fabricId, setFabricId] = useState<string | null>(params.get('tecido'))
  const [customerId, setCustomerId] = useState<string | null>(params.get('cliente'))
  const [instructions, setInstructions] = useState(params.get('ajuste') ?? '')
  const [showInstructions, setShowInstructions] = useState(Boolean(params.get('ajuste')))
  const [picker, setPicker] = useState<'garment' | 'fabric' | 'customer' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const garment = garments.data?.find((item) => item.id === garmentId) ?? null
  const fabric = fabrics.data?.find((item) => item.id === fabricId) ?? null
  const customer = customers.data?.find((item) => item.id === customerId) ?? null

  // item removido do acervo não fica selecionado
  useEffect(() => {
    if (garments.data && garmentId && !garment) setGarmentId(null)
    if (fabrics.data && fabricId && !fabric) setFabricId(null)
    if (customers.data && customerId && !customer) setCustomerId(null)
  }, [garments.data, fabrics.data, customers.data, garmentId, fabricId, customerId, garment, fabric, customer])

  const ready = Boolean(garment && (mode === 'swap' ? fabric : customer))
  const copy = MODE_COPY[mode]

  async function generate(): Promise<void> {
    if (!ready || !garment) return
    setSubmitting(true)
    setError(null)
    try {
      const trimmed = instructions.trim() || null
      const simulation = await simulationsApi.create(
        mode === 'swap'
          ? { type: 'FABRIC_SWAP', garmentId: garment.id, fabricId, instructions: trimmed }
          : { type: 'TRY_ON', garmentId: garment.id, customerId, instructions: trimmed },
      )
      navigate(`/simulacoes/${simulation.id}`)
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] sm:text-[26px]">Nova simulação</h1>
        <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
      </header>

      <div role="tablist" aria-label="Tipo de simulação" className="grid grid-cols-2 rounded-full bg-muted p-1 sm:w-fit">
        {(['swap', 'tryon'] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={mode === item}
            onClick={() => setMode(item)}
            className={cn(
              'h-10 rounded-full px-5 text-[13px] font-medium transition-colors',
              mode === item ? 'bg-card text-foreground shadow-lift' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {MODE_COPY[item].tab}
          </button>
        ))}
      </div>

      {(garments.error || fabrics.error || customers.error) && (
        <Alert>{garments.error ?? fabrics.error ?? customers.error}</Alert>
      )}

      {/* bancada: peça + tecido = resultado */}
      <section className="grid grid-cols-2 items-start gap-3 sm:gap-5 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <Station
          label="Modelo"
          emptyTitle="Escolher peça"
          emptyText="Foto do modelo que a cliente quer"
          loading={garments.loading && !garments.data}
          onOpen={() => setPicker('garment')}
          filled={
            garment && (
              <SelectedPhoto src={garment.imageUrl} alt={garment.name} caption={garment.name} />
            )
          }
        />

        <Joiner icon={<Plus className="h-4 w-4" />} />

        {mode === 'tryon' ? (
          <Station
            label="Cliente"
            emptyTitle="Escolher cliente"
            emptyText="Foto de corpo inteiro, com autorização"
            loading={customers.loading && !customers.data}
            onOpen={() => setPicker('customer')}
            filled={customer && <SelectedPhoto src={customer.photoUrl} alt={customer.name} caption={customer.name} />}
          />
        ) : (
          <Station
            label="Tecido"
            emptyTitle="Escolher tecido"
            emptyText="Foto do tecido que você tem"
            loading={fabrics.loading && !fabrics.data}
            onOpen={() => setPicker('fabric')}
            filled={
              fabric && (
                <div className="flex flex-col gap-2">
                  <div className="rounded-card bg-card p-2 shadow-lift">
                    <Swatch src={fabric.imageUrl} alt={fabric.name} />
                  </div>
                  <div className="px-0.5">
                    <p className="truncate text-[13px] font-medium">{fabric.name}</p>
                    <FabricTypeChip type={fabric.fabricType} className="mt-1" />
                  </div>
                </div>
              )
            }
          />
        )}

        <Joiner icon={<Equal className="h-4 w-4" />} />

        {/* prévia do resultado (só desktop: no celular o botão fixo cumpre esse papel) */}
        <div className="hidden lg:flex lg:flex-col lg:gap-2">
          <span className="text-[13px] font-medium text-muted-foreground">Resultado</span>
          <div
            className={cn(
              'stitch-frame grid aspect-[4/5] place-items-center rounded-card p-6 text-center transition-colors',
              ready ? 'bg-accent/60' : 'bg-card/40',
            )}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Shirt className={cn('h-8 w-8', ready && 'text-primary')} strokeWidth={1.5} />
              <p className="text-[13px]">{ready ? copy.ready : copy.placeholder}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ajustes opcionais */}
      <section className="rounded-card border bg-card">
        <button
          type="button"
          onClick={() => setShowInstructions((value) => !value)}
          aria-expanded={showInstructions}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        >
          <span>
            <span className="block text-sm font-medium">Ajustes para a IA</span>
            <span className="block text-[13px] text-muted-foreground">Opcional. Ex.: manga curta, comprimento no joelho.</span>
          </span>
          <ChevronDown className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform', showInstructions && 'rotate-180')} />
        </button>
        {showInstructions && (
          <div className="px-4 pb-4">
            <Textarea
              aria-label="Ajustes para a IA"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              maxLength={MAX_INSTRUCTIONS}
              placeholder="Descreva o que mudar na peça, do jeito que você explicaria para uma colega."
            />
            <p className="mt-1.5 text-right text-[12px] tabular-nums text-muted-foreground">
              {instructions.length}/{MAX_INSTRUCTIONS}
            </p>
          </div>
        )}
      </section>

      {error && <Alert>{error}</Alert>}

      {/* ação: fixa acima das abas no celular */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t bg-background/90 px-4 py-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-6xl items-center gap-3 lg:justify-end">
          <p className="hidden text-[13px] text-muted-foreground sm:block lg:mr-auto">
            O resultado é uma simulação: cores e caimento podem variar do real.
          </p>
          <Button size="lg" className="w-full lg:w-auto" disabled={!ready} loading={submitting} onClick={() => void generate()}>
            {mode === 'swap' ? <Sparkles className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
            {copy.action}
          </Button>
        </div>
      </div>
      <div className="h-16 lg:hidden" aria-hidden="true" />

      <LibraryPicker<Garment>
        open={picker === 'garment'}
        onClose={() => setPicker(null)}
        title="Escolher peça"
        items={garments.data}
        loading={garments.loading}
        error={garments.error}
        selectedId={garmentId}
        onSelect={(item) => setGarmentId(item.id)}
        createLabel="Nova foto de peça"
        emptyText="Nenhuma peça ainda. Fotografe a primeira."
        renderTile={(item, selected, select) => <GarmentTile garment={item} selected={selected} onClick={select} />}
        renderCreate={(done, cancel) => (
          <GarmentForm
            onCancel={cancel}
            onCreated={(item) => {
              garments.setData((current) => [item, ...(current ?? [])])
              done(item)
            }}
          />
        )}
      />

      <LibraryPicker<Customer>
        open={picker === 'customer'}
        onClose={() => setPicker(null)}
        title="Escolher cliente"
        items={customers.data}
        loading={customers.loading}
        error={customers.error}
        selectedId={customerId}
        onSelect={(item) => setCustomerId(item.id)}
        createLabel="Nova cliente"
        emptyText="Nenhuma cliente ainda. Cadastre com foto e autorização."
        renderTile={(item, selected, select) => <CustomerTile customer={item} selected={selected} onClick={select} />}
        renderCreate={(done, cancel) => (
          <CustomerForm
            onCancel={cancel}
            onCreated={(item) => {
              customers.setData((current) => [item, ...(current ?? [])])
              // sem foto não dá para provar: volta para a lista
              if (item.photoUrl) done(item)
              else cancel()
            }}
          />
        )}
      />

      <LibraryPicker<Fabric>
        open={picker === 'fabric'}
        onClose={() => setPicker(null)}
        title="Escolher tecido"
        items={fabrics.data}
        loading={fabrics.loading}
        error={fabrics.error}
        selectedId={fabricId}
        onSelect={(item) => setFabricId(item.id)}
        createLabel="Nova foto de tecido"
        emptyText="Nenhum tecido ainda. Fotografe o primeiro."
        aspect="aspect-square"
        renderTile={(item, selected, select) => <FabricTile fabric={item} selected={selected} onClick={select} />}
        renderCreate={(done, cancel) => (
          <FabricForm
            onCancel={cancel}
            onCreated={(item) => {
              fabrics.setData((current) => [item, ...(current ?? [])])
              done(item)
            }}
          />
        )}
      />
    </div>
  )
}

function Station({
  label,
  emptyTitle,
  emptyText,
  filled,
  loading,
  onOpen,
}: {
  label: string
  emptyTitle: string
  emptyText: string
  filled: ReactNode
  loading: boolean
  onOpen: () => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        {filled && (
          <button type="button" onClick={onOpen} className="-mr-2 hidden h-8 rounded-full px-2 text-[13px] font-medium text-primary hover:bg-accent sm:block">
            Trocar
          </button>
        )}
      </div>
      {loading ? (
        <div className="aspect-[4/5] animate-pulse rounded-card bg-muted" />
      ) : filled ? (
        <button type="button" onClick={onOpen} className="text-left" aria-label={`Trocar ${label.toLowerCase()}`}>
          {filled}
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="stitch-frame group flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-card bg-card/60 p-4 text-center transition-colors hover:bg-card"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform group-hover:scale-105">
            <Plus className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">{emptyTitle}</span>
          <span className="text-[12px] leading-snug text-muted-foreground">{emptyText}</span>
        </button>
      )}
    </div>
  )
}

function SelectedPhoto({ src, alt, caption }: { src: string | null; alt: string; caption: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[4/5] overflow-hidden rounded-card bg-muted shadow-lift">
        {src && <img src={src} alt={alt} className="h-full w-full object-cover" />}
      </div>
      <p className="truncate px-0.5 text-[13px] font-medium">{caption}</p>
    </div>
  )
}

function Joiner({ icon }: { icon: ReactNode }) {
  return (
    <div className="hidden h-full items-center pt-6 lg:flex" aria-hidden="true">
      <span className="grid h-9 w-9 place-items-center rounded-full border bg-card text-muted-foreground">{icon}</span>
    </div>
  )
}
