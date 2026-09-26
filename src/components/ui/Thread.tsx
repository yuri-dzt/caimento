import type { FabricType } from '../../types/api'
import { FABRIC_TYPE_LABEL, FABRIC_TYPE_THREAD } from '../../types/labels'
import { cn } from '../../utils/cn'
import { PINKED_CLIP } from '../../utils/pinked'

/** Carretel desenhado: a cor da linha identifica o tipo de tecido */
export function Spool({ colorClass, className }: { colorClass: string; className?: string }): JSX.Element {
  return (
    <span className={cn('relative inline-flex h-4 w-3 shrink-0 flex-col items-center', className)} aria-hidden="true">
      <span className="h-[3px] w-full rounded-[1px] bg-foreground/70" />
      <span className={cn('w-[72%] flex-1', colorClass)}>
        <span className="block h-full w-full bg-[repeating-linear-gradient(0deg,transparent_0_2px,hsl(0_0%_0%/0.18)_2px_3px)]" />
      </span>
      <span className="h-[3px] w-full rounded-[1px] bg-foreground/70" />
    </span>
  )
}

export function FabricTypeChip({ type, className }: { type: FabricType; className?: string }): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-muted py-0.5 pl-2 pr-2.5 text-[12px] font-medium text-foreground',
        className,
      )}
    >
      <Spool colorClass={FABRIC_TYPE_THREAD[type]} />
      {FABRIC_TYPE_LABEL[type]}
    </span>
  )
}

/** Amostra de tecido com borda de tesoura de picotar */
export function Swatch({
  src,
  alt,
  className,
}: {
  src: string | null
  alt: string
  className?: string
}): JSX.Element {
  return (
    <div className={cn('aspect-square overflow-hidden bg-muted', className)} style={{ clipPath: PINKED_CLIP }}>
      {src && <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />}
    </div>
  )
}

/**
 * Costura em andamento: uma linha carmim pesponta a moldura enquanto a IA gera.
 * O único movimento autoral do produto; o resto só troca estado.
 */
export function StitchingOverlay({ label }: { label: string }): JSX.Element {
  return (
    <div className="absolute inset-0 grid place-items-center bg-card/70 backdrop-blur-[1px]" role="status">
      <svg
        className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect
          x="0.5"
          y="0.5"
          width="99"
          height="99"
          rx="2"
          fill="none"
          pathLength="100"
          className="stroke-stitch"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="1.6 1"
          style={{ animation: 'stitch-sew 6s cubic-bezier(0.2, 0.7, 0.2, 1) infinite' }}
        />
      </svg>
      <div className="relative flex flex-col items-center gap-3 px-6 text-center">
        <SpoolWinding />
        <p className="text-[15px] font-semibold">{label}</p>
        <p className="max-w-[16rem] text-[13px] text-muted-foreground">Leva de 10 a 60 segundos. Pode continuar usando o app.</p>
      </div>
      <style>{`
        @keyframes stitch-sew {
          0% { stroke-dashoffset: 100; opacity: 1; }
          85% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function SpoolWinding(): JSX.Element {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden="true">
      <rect x="12" y="6" width="24" height="5" rx="2" className="fill-primary" />
      <rect x="12" y="37" width="24" height="5" rx="2" className="fill-primary" />
      <rect x="16" y="11" width="16" height="26" className="fill-stitch" />
      <g className="animate-[spool-lines_0.9s_linear_infinite]">
        {[13, 17, 21, 25, 29, 33, 37].map((y) => (
          <line key={y} x1="16" x2="32" y1={y} y2={y - 2} stroke="hsl(0 0% 0% / 0.22)" strokeWidth="1.2" />
        ))}
      </g>
      <style>{`@keyframes spool-lines { from { transform: translateY(0) } to { transform: translateY(4px) } }`}</style>
    </svg>
  )
}
