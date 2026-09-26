import { Camera, ImagePlus, RefreshCw } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { errorMessage } from '../../services/api'
import { cn } from '../../utils/cn'
import { prepareImage } from '../../utils/image'
import { Spinner } from './Spinner'

interface ImageInputProps {
  value: Blob | null
  onChange: (blob: Blob | null) => void
  /** Texto do quadro vazio, ex.: "Foto do tecido" */
  label: string
  hint?: string
  /** 'environment' = câmera traseira (tecido, peça); 'user' = frontal */
  capture?: 'environment' | 'user'
  aspect?: string
}

/** Quadro de foto em pesponto: tirar foto agora ou escolher da galeria */
export function ImageInput({
  value,
  onChange,
  label,
  hint,
  capture = 'environment',
  aspect = 'aspect-[4/5]',
}: ImageInputProps): JSX.Element {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const id = useId()

  useEffect(() => {
    if (!value) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  async function handleFile(file: File | undefined): Promise<void> {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      onChange(await prepareImage(file))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const inputProps = {
    type: 'file' as const,
    accept: 'image/*',
    className: 'sr-only',
    tabIndex: -1,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      void handleFile(event.target.files?.[0])
      event.target.value = ''
    },
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          'relative overflow-hidden rounded-card',
          aspect,
          preview ? 'bg-muted' : 'stitch-frame bg-card/60',
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="absolute bottom-2 right-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-card/90 px-3 text-[13px] font-medium shadow-lift backdrop-blur"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Trocar
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
            {busy ? (
              <Spinner className="h-6 w-6 text-primary" />
            ) : (
              <>
                <p id={id} className="text-sm font-medium">
                  {label}
                </p>
                {hint && <p className="-mt-2 text-[12px] text-muted-foreground">{hint}</p>}
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    aria-describedby={id}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-medium text-primary-foreground"
                  >
                    <Camera className="h-4 w-4" /> Tirar foto
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    aria-describedby={id}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-input bg-card px-4 text-[13px] font-medium"
                  >
                    <ImagePlus className="h-4 w-4" /> Galeria
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[13px] text-destructive" role="alert">
          {error}
        </p>
      )}
      <input ref={cameraRef} capture={capture} aria-label={`${label}: câmera`} {...inputProps} />
      <input ref={galleryRef} aria-label={`${label}: galeria`} {...inputProps} />
    </div>
  )
}
