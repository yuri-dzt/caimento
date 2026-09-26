import { Check, ImageOff, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Customer, Fabric, Garment } from '../../types/api'
import { cn } from '../../utils/cn'
import { FabricTypeChip, Swatch } from '../ui/Thread'

interface TileProps {
  selected?: boolean
  onClick?: () => void
  action?: ReactNode
}

function TileShell({
  selected,
  onClick,
  children,
  label,
}: {
  selected?: boolean
  onClick?: () => void
  children: ReactNode
  label: string
}) {
  const className = cn(
    'group relative flex w-full flex-col gap-2 rounded-card text-left outline-offset-4',
    onClick && 'cursor-pointer',
  )
  const check = selected && (
    <span className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift">
      <Check className="h-4 w-4" strokeWidth={3} />
    </span>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className={className} aria-pressed={selected} aria-label={label}>
      {check}
      {children}
    </button>
  ) : (
    <div className={className}>{children}</div>
  )
}

export function PhotoFrame({
  src,
  alt,
  aspect = 'aspect-[3/4]',
  selected,
  children,
}: {
  src: string | null
  alt: string
  aspect?: string
  selected?: boolean
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card bg-muted transition-shadow',
        aspect,
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      {src ? (
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
      ) : (
        <div className="grid h-full place-items-center text-muted-foreground">
          <ImageOff className="h-6 w-6" />
        </div>
      )}
      {children}
    </div>
  )
}

export function GarmentTile({ garment, selected, onClick, action }: TileProps & { garment: Garment }) {
  return (
    <TileShell selected={selected} onClick={onClick} label={garment.name}>
      <PhotoFrame src={garment.imageUrl} alt={garment.name} selected={selected} />
      <div className="flex items-start justify-between gap-2 px-0.5">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug">{garment.name}</p>
        {action}
      </div>
    </TileShell>
  )
}

export function FabricTile({ fabric, selected, onClick, action }: TileProps & { fabric: Fabric }) {
  return (
    <TileShell selected={selected} onClick={onClick} label={fabric.name}>
      <div className={cn('rounded-card p-1.5 transition-colors', selected ? 'bg-accent' : 'bg-card shadow-lift')}>
        <Swatch src={fabric.imageUrl} alt={fabric.name} />
      </div>
      <div className="flex items-start justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[13px] font-medium leading-snug">{fabric.name}</p>
          <FabricTypeChip type={fabric.fabricType} className="mt-1" />
        </div>
        {action}
      </div>
    </TileShell>
  )
}

export function CustomerTile({ customer, selected, onClick }: TileProps & { customer: Customer }) {
  const usable = Boolean(customer.photoUrl && customer.photoConsentAt)
  return (
    <TileShell selected={selected} onClick={usable ? onClick : undefined} label={customer.name}>
      <div className={cn('relative', !usable && 'opacity-60')}>
        {customer.photoUrl ? (
          <PhotoFrame src={customer.photoUrl} alt={customer.name} selected={selected} />
        ) : (
          <div className="stitch-frame grid aspect-[3/4] place-items-center rounded-card text-muted-foreground">
            <UserRound className="h-7 w-7" />
          </div>
        )}
      </div>
      <div className="px-0.5">
        <p className="truncate text-[13px] font-medium">{customer.name}</p>
        {!usable && <p className="text-[12px] text-muted-foreground">Sem foto</p>}
      </div>
    </TileShell>
  )
}
