import { History, Scissors } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { buttonClasses } from '../components/ui/Button'
import { Alert, Badge, EmptyState, SkeletonGrid } from '../components/ui/Feedback'
import { PageHeader } from '../components/ui/PageHeader'
import { Spinner } from '../components/ui/Spinner'
import { Swatch } from '../components/ui/Thread'
import { useAuth } from '../contexts/auth-context'
import { simulationsApi } from '../services/resources'
import { isSimulationRunning, type Simulation, type SimulationType } from '../types/api'
import { SIMULATION_STATUS_LABEL, SIMULATION_TYPE_LABEL } from '../types/labels'
import { cn } from '../utils/cn'
import { formatRelative } from '../utils/format'
import { can, worksInAccount } from '../utils/permissions'
import { useResource } from '../utils/use-resource'

const FILTERS: Array<{ value: SimulationType | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Todas' },
  { value: 'FABRIC_SWAP', label: 'Troca de tecido' },
  { value: 'TRY_ON', label: 'Provador' },
]

export function HistoryPage(): JSX.Element {
  const { me } = useAuth()
  const [filter, setFilter] = useState<SimulationType | 'ALL'>('ALL')
  const simulations = useResource(
    () => simulationsApi.list(filter === 'ALL' ? {} : { type: filter }),
    [filter],
  )
  const canCreate = worksInAccount(me) && can(me, 'create')

  return (
    <div>
      <PageHeader
        title="Histórico"
        description="Tudo o que já foi simulado na loja."
        actions={
          canCreate && (
            <Link to="/" className={buttonClasses('primary', 'md', 'hidden sm:inline-flex')}>
              <Scissors className="h-4 w-4" /> Nova simulação
            </Link>
          )
        }
      />

      <div role="tablist" aria-label="Filtrar" className="mb-5 inline-flex rounded-full bg-muted p-1">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={cn(
              'h-9 rounded-full px-3.5 text-[13px] font-medium transition-colors',
              filter === item.value ? 'bg-card text-foreground shadow-lift' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {simulations.error && <Alert className="mb-4">{simulations.error}</Alert>}

      {simulations.loading && !simulations.data ? (
        <SkeletonGrid />
      ) : simulations.data?.length === 0 ? (
        <EmptyState
          icon={<History className="h-5 w-5" />}
          title="Nenhuma simulação ainda"
          description="Escolha um modelo e um tecido na bancada. Cada resultado fica guardado aqui."
          action={
            canCreate && (
              <Link to="/" className={buttonClasses()}>
                Ir para a bancada
              </Link>
            )
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
          {simulations.data?.map((simulation) => (
            <li key={simulation.id}>
              <SimulationCard simulation={simulation} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SimulationCard({ simulation }: { simulation: Simulation }) {
  const running = isSimulationRunning(simulation)
  const image = simulation.resultUrl ?? simulation.garment?.imageUrl ?? null
  const subtitle = simulation.customer?.name ?? simulation.fabric?.name ?? simulation.garment?.name ?? ''

  return (
    <Link to={`/simulacoes/${simulation.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-muted">
        {image && (
          <img
            src={image}
            alt=""
            loading="lazy"
            className={cn(
              'h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]',
              !simulation.resultUrl && 'opacity-40 blur-[1px]',
            )}
          />
        )}
        {running && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-[12px] font-medium shadow-lift">
              <Spinner className="h-3.5 w-3.5 text-stitch" /> {SIMULATION_STATUS_LABEL[simulation.status]}
            </span>
          </span>
        )}
        {simulation.status === 'FAILED' && (
          <Badge tone="danger" className="absolute left-2 top-2">
            Falhou
          </Badge>
        )}
        {simulation.fabric && simulation.type === 'FABRIC_SWAP' && (
          <Swatch
            src={simulation.fabric.imageUrl}
            alt=""
            className="absolute bottom-2 right-2 h-11 w-11 shadow-lift ring-2 ring-card"
          />
        )}
      </div>
      <div className="px-0.5">
        <p className="truncate text-[13px] font-medium">{subtitle}</p>
        <p className="text-[12px] text-muted-foreground">
          {SIMULATION_TYPE_LABEL[simulation.type]} · {formatRelative(simulation.createdAt)}
        </p>
      </div>
    </Link>
  )
}
