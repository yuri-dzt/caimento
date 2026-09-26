import { Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Dialog } from '../ui/Dialog'
import { Alert, SkeletonGrid } from '../ui/Feedback'

interface LibraryPickerProps<T extends { id: string }> {
  open: boolean
  onClose: () => void
  title: string
  items: T[] | undefined
  loading: boolean
  error: string | null
  selectedId: string | null
  onSelect: (item: T) => void
  renderTile: (item: T, selected: boolean, select: () => void) => ReactNode
  /** Formulário para cadastrar um novo item sem sair da tela */
  renderCreate?: (done: (item: T) => void, cancel: () => void) => ReactNode
  createLabel: string
  emptyText: string
  aspect?: string
}

/** Folha para escolher do acervo ou cadastrar na hora (foto nova) */
export function LibraryPicker<T extends { id: string }>(props: LibraryPickerProps<T>): JSX.Element {
  const { open, onClose, title, items, loading, error, selectedId, onSelect, renderTile, renderCreate } = props
  const [creating, setCreating] = useState(false)

  function close(): void {
    setCreating(false)
    onClose()
  }

  function pick(item: T): void {
    onSelect(item)
    close()
  }

  return (
    <Dialog open={open} onClose={close} title={creating ? props.createLabel : title} className="sm:max-w-2xl">
      {creating && renderCreate ? (
        renderCreate(pick, () => setCreating(false))
      ) : (
        <div className="flex flex-col gap-4">
          {error && <Alert>{error}</Alert>}
          {loading && !items ? (
            <SkeletonGrid count={6} aspect={props.aspect} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {renderCreate && (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className={`stitch-frame flex flex-col items-center justify-center gap-2 rounded-card text-[13px] font-medium text-primary ${props.aspect ?? 'aspect-[3/4]'}`}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Plus className="h-5 w-5" />
                  </span>
                  {props.createLabel}
                </button>
              )}
              {items?.map((item) => (
                <div key={item.id}>{renderTile(item, item.id === selectedId, () => pick(item))}</div>
              ))}
            </div>
          )}
          {items && items.length === 0 && <p className="text-center text-[13px] text-muted-foreground">{props.emptyText}</p>}
        </div>
      )}
    </Dialog>
  )
}
