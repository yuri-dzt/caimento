import { ArrowLeft, Download, RotateCcw, Share2, Trash2, UserRound } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CustomerForm } from '../components/catalog/forms'
import { LibraryPicker } from '../components/catalog/LibraryPicker'
import { CustomerTile } from '../components/catalog/tiles'
import { Button, buttonClasses } from '../components/ui/Button'
import { Alert, Badge } from '../components/ui/Feedback'
import { FabricTypeChip, StitchingOverlay, Swatch } from '../components/ui/Thread'
import { useAuth } from '../contexts/auth-context'
import { errorMessage } from '../services/api'
import { customersApi, simulationsApi } from '../services/resources'
import { isSimulationRunning, type Customer, type Simulation } from '../types/api'
import { SIMULATION_STATUS_LABEL, SIMULATION_TYPE_LABEL } from '../types/labels'
import { formatDateTime } from '../utils/format'
import { can, worksInAccount } from '../utils/permissions'
import { useResource } from '../utils/use-resource'
import { useSimulation } from '../utils/use-simulation'

// largura do quadro limitada pela altura da tela: o 4:5 inteiro cabe sem rolar
const FRAME_STYLE = {
  '--frame': 'min(36rem, calc((100dvh - 10rem) * 0.8))',
  maxWidth: 'var(--frame)',
} as CSSProperties

const STATUS_TONE = { PENDING: 'neutral', PROCESSING: 'primary', DONE: 'success', FAILED: 'danger' } as const

export function SimulationPage(): JSX.Element {
  const { id } = useParams()
  const { simulation, error } = useSimulation(id)

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <Alert>{error}</Alert>
      </div>
    )
  }

  if (!simulation) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
          <div className="mx-auto aspect-[4/5] w-full animate-pulse rounded-card bg-muted lg:w-[var(--frame)]" style={FRAME_STYLE} />
          <div className="h-48 animate-pulse rounded-card bg-muted" />
        </div>
      </div>
    )
  }

  return <SimulationView key={simulation.id} simulation={simulation} />
}

function BackLink() {
  return (
    <Link to="/historico" className="inline-flex h-9 w-fit items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Histórico
    </Link>
  )
}

function SimulationView({ simulation }: { simulation: Simulation }): JSX.Element {
  const { me } = useAuth()
  const navigate = useNavigate()
  const [actionError, setActionError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const running = isSimulationRunning(simulation)
  const done = simulation.status === 'DONE' && simulation.resultUrl
  const inAccount = worksInAccount(me)
  const canCreate = inAccount && can(me, 'create')
  const title = simulation.customer
    ? `${SIMULATION_TYPE_LABEL[simulation.type]}: ${simulation.customer.name}`
    : SIMULATION_TYPE_LABEL[simulation.type]

  // variação volta para a bancada preenchida. Prova feita a partir de uma troca de tecido
  // não tem variação aqui: ela é refeita pela tela da troca de tecido de origem.
  const directTryOn = simulation.type === 'TRY_ON' && !simulation.sourceSimulationId
  const canRetry = canCreate && (simulation.type === 'FABRIC_SWAP' || directTryOn)
  const retryParams = new URLSearchParams()
  if (directTryOn) retryParams.set('modo', 'provar')
  if (simulation.garment) retryParams.set('peca', simulation.garment.id)
  if (simulation.fabric && !directTryOn) retryParams.set('tecido', simulation.fabric.id)
  if (simulation.customer) retryParams.set('cliente', simulation.customer.id)
  if (simulation.instructions) retryParams.set('ajuste', simulation.instructions)

  async function handleDelete(): Promise<void> {
    if (!window.confirm('Excluir esta simulação? A imagem será apagada.')) return
    setDeleting(true)
    try {
      await simulationsApi.remove(simulation.id)
      navigate('/historico', { replace: true })
    } catch (err) {
      setActionError(errorMessage(err))
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <BackLink />

      <div className="grid items-start gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-10">
        {/* resultado */}
        <div className="relative mx-auto w-full overflow-hidden rounded-card bg-muted shadow-float lg:mx-0 lg:w-[var(--frame)]" style={FRAME_STYLE}>
          <div className="aspect-[4/5]">
            {done ? (
              <img src={simulation.resultUrl ?? undefined} alt={`Resultado: ${title}`} className="h-full w-full object-cover" />
            ) : (
              simulation.garment?.imageUrl && (
                <img src={simulation.garment.imageUrl} alt="" className="h-full w-full object-cover opacity-40 blur-[2px]" />
              )
            )}
          </div>
          {running && (
            <StitchingOverlay label={simulation.status === 'PENDING' ? 'Na fila para costurar...' : 'Costurando a peça...'} />
          )}
          {done && (
            <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[12px] font-medium shadow-lift backdrop-blur">
              Simulação por IA
            </span>
          )}
          {simulation.status === 'FAILED' && (
            <div className="absolute inset-0 grid place-items-center bg-card/80 p-6 text-center">
              <div className="max-w-xs">
                <p className="text-[15px] font-semibold">Não deu para costurar desta vez</p>
                <p className="mt-1 text-[13px] text-muted-foreground">{simulation.errorMessage}</p>
                {canRetry && (
                  <Link to={`/?${retryParams.toString()}`} className={buttonClasses('primary', 'md', 'mt-4')}>
                    <RotateCcw className="h-4 w-4" /> Tentar de novo
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* detalhes e ações */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[simulation.status]}>{SIMULATION_STATUS_LABEL[simulation.status]}</Badge>
              <span className="text-[13px] text-muted-foreground">{formatDateTime(simulation.createdAt)}</span>
            </div>
            <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
          </div>

          {done && (
            <div className="flex flex-wrap gap-2">
              <ShareButton simulation={simulation} onError={setActionError} />
              <a
                href={simulation.resultUrl ?? undefined}
                download={`caimento-${simulation.id}.png`}
                className={buttonClasses('secondary')}
              >
                <Download className="h-4 w-4" /> Baixar
              </a>
              {canRetry && (
                <Link to={`/?${retryParams.toString()}`} className={buttonClasses('secondary')}>
                  <RotateCcw className="h-4 w-4" /> Gerar variação
                </Link>
              )}
            </div>
          )}

          {actionError && <Alert>{actionError}</Alert>}

          <MadeWith simulation={simulation} />

          {done && simulation.type === 'FABRIC_SWAP' && canCreate && <TryOnPanel simulation={simulation} />}

          {can(me, 'delete') && !running && (
            <Button variant="ghost" className="w-fit text-destructive hover:bg-destructive/10" loading={deleting} onClick={() => void handleDelete()}>
              <Trash2 className="h-4 w-4" /> Excluir simulação
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function MadeWith({ simulation }: { simulation: Simulation }) {
  const { garment, fabric, customer } = simulation
  return (
    <section className="rounded-card border bg-card p-4">
      <h2 className="text-[13px] font-medium text-muted-foreground">Feito com</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {garment && (
          <li className="flex items-center gap-3">
            <img src={garment.imageUrl ?? undefined} alt="" className="h-14 w-11 shrink-0 rounded-md bg-muted object-cover" />
            <div className="min-w-0">
              <p className="text-[12px] text-muted-foreground">Modelo</p>
              <p className="truncate text-sm font-medium">{garment.name}</p>
            </div>
          </li>
        )}
        {fabric && (
          <li className="flex items-center gap-3">
            <Swatch src={fabric.imageUrl} alt="" className="h-12 w-12 shrink-0" />
            <div className="min-w-0">
              <p className="text-[12px] text-muted-foreground">Tecido</p>
              <p className="truncate text-sm font-medium">{fabric.name}</p>
            </div>
            <FabricTypeChip type={fabric.fabricType} className="ml-auto" />
          </li>
        )}
        {customer && (
          <li className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[12px] text-muted-foreground">Cliente</p>
              <p className="text-sm font-medium">{customer.name}</p>
            </div>
          </li>
        )}
        {!garment && !fabric && <li className="text-[13px] text-muted-foreground">Peça e tecido foram removidos do acervo.</li>}
      </ul>
      {simulation.sourceSimulationId && (
        <Link to={`/simulacoes/${simulation.sourceSimulationId}`} className="mt-3 inline-block text-[13px] font-medium text-primary">
          Ver a troca de tecido original
        </Link>
      )}
      {simulation.instructions && (
        <div className="mt-4 border-t pt-3">
          <p className="text-[12px] text-muted-foreground">Ajustes pedidos</p>
          <p className="mt-0.5 whitespace-pre-line text-sm">{simulation.instructions}</p>
        </div>
      )}
    </section>
  )
}

/** Segunda etapa: vestir a peça gerada na foto da cliente */
function TryOnPanel({ simulation }: { simulation: Simulation }) {
  const navigate = useNavigate()
  const customers = useResource(() => customersApi.list())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function tryOn(): Promise<void> {
    if (!customer) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await simulationsApi.create({
        type: 'TRY_ON',
        customerId: customer.id,
        sourceSimulationId: simulation.id,
      })
      navigate(`/simulacoes/${created.id}`)
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-card bg-accent/70 p-4">
      <h2 className="text-[15px] font-semibold">Provar na cliente</h2>
      <p className="mt-0.5 text-[13px] text-muted-foreground">Veste esta peça na foto da cliente.</p>

      <div className="mt-4 flex items-center gap-3">
        {customer?.photoUrl ? (
          <img src={customer.photoUrl} alt="" className="h-16 w-12 rounded-md object-cover" />
        ) : (
          <span className="stitch-frame grid h-16 w-12 place-items-center rounded-md text-muted-foreground">
            <UserRound className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{customer?.name ?? 'Nenhuma cliente escolhida'}</p>
          <button type="button" onClick={() => setPickerOpen(true)} className="text-[13px] font-medium text-primary">
            {customer ? 'Trocar cliente' : 'Escolher cliente'}
          </button>
        </div>
        <Button onClick={() => void tryOn()} disabled={!customer} loading={submitting}>
          Provar
        </Button>
      </div>
      {error && <Alert className="mt-3">{error}</Alert>}

      <LibraryPicker<Customer>
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Escolher cliente"
        items={customers.data}
        loading={customers.loading}
        error={customers.error}
        selectedId={customer?.id ?? null}
        onSelect={setCustomer}
        createLabel="Nova cliente"
        emptyText="Nenhuma cliente ainda."
        renderTile={(item, selected, select) => <CustomerTile customer={item} selected={selected} onClick={select} />}
        renderCreate={(done, cancel) => (
          <CustomerForm
            onCancel={cancel}
            onCreated={(item) => {
              customers.setData((current) => [item, ...(current ?? [])])
              if (item.photoUrl) done(item)
              else cancel()
            }}
          />
        )}
      />
    </section>
  )
}

/** Compartilha a imagem (WhatsApp etc.) pelo menu nativo do celular; sem suporte, baixa */
function ShareButton({ simulation, onError }: { simulation: Simulation; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false)
  if (typeof navigator.share !== 'function') return null

  async function share(): Promise<void> {
    if (!simulation.resultUrl) return
    setBusy(true)
    try {
      const blob = await (await fetch(simulation.resultUrl)).blob()
      const file = new File([blob], `caimento-${simulation.id}.${blob.type.split('/')[1] ?? 'png'}`, { type: blob.type })
      const data = { files: [file], title: 'Simulação Caimento', text: 'Olha como fica a peça (simulação).' }
      if (navigator.canShare?.(data)) await navigator.share(data)
      else await navigator.share({ title: data.title, text: data.text, url: window.location.href })
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) onError('Não foi possível compartilhar. Use Baixar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button onClick={() => void share()} loading={busy}>
      <Share2 className="h-4 w-4" /> Compartilhar
    </Button>
  )
}
