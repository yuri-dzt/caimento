import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../services/api'

export interface Resource<T> {
  data: T | undefined
  error: string | null
  loading: boolean
  reload: () => Promise<void>
  setData: (updater: (current: T | undefined) => T | undefined) => void
}

/** Carrega um recurso da API com estado de loading/erro e recarga manual */
export function useResource<T>(loader: () => Promise<T>, deps: unknown[] = []): Resource<T> {
  const [data, setDataState] = useState<T | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDataState(await loaderRef.current())
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const setData = useCallback((updater: (current: T | undefined) => T | undefined) => {
    setDataState((current) => updater(current))
  }, [])

  return { data, error, loading, reload, setData }
}
