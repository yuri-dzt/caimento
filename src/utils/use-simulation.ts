import { useEffect, useState } from 'react'
import { errorMessage } from '../services/api'
import { simulationsApi } from '../services/resources'
import { isSimulationRunning, type Simulation } from '../types/api'

const POLL_MS = 2500

/** Carrega a simulação e acompanha por polling enquanto está na fila ou costurando */
export function useSimulation(id: string | undefined): {
  simulation: Simulation | null
  error: string | null
  setSimulation: (simulation: Simulation) => void
} {
  const [simulation, setSimulation] = useState<Simulation | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    let timer: number | undefined
    setSimulation(null)
    setError(null)

    const tick = async (): Promise<void> => {
      try {
        const current = await simulationsApi.get(id)
        if (cancelled) return
        setSimulation(current)
        if (isSimulationRunning(current)) timer = window.setTimeout(tick, POLL_MS)
      } catch (err) {
        if (!cancelled) setError(errorMessage(err))
      }
    }

    void tick()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [id])

  return { simulation, error, setSimulation }
}
