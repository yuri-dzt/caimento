import type { IJobQueue } from '../../contracts/services/job-queue'
import { logError } from '../../app/shared/log'

export type JobHandler = (simulationId: string) => Promise<void>

/**
 * Fila em memória com concorrência limitada. Serve para 1 instância.
 * Para várias instâncias: trocar por BullMQ/Redis implementando IJobQueue.
 * Se o processo cair, RecoverSimulationsUseCase reenfileira no boot.
 */
export class InProcessJobQueue implements IJobQueue {
  private readonly waiting: string[] = []
  private readonly known = new Set<string>()
  private running = 0
  private handler: JobHandler | null = null

  constructor(private readonly concurrency: number) {}

  /** Ligado no container depois de montar o use-case (evita dependência circular) */
  setHandler(handler: JobHandler): void {
    this.handler = handler
    this.drain()
  }

  enqueue(simulationId: string): void {
    if (this.known.has(simulationId)) return
    this.known.add(simulationId)
    this.waiting.push(simulationId)
    this.drain()
  }

  get size(): { waiting: number; running: number } {
    return { waiting: this.waiting.length, running: this.running }
  }

  private drain(): void {
    if (!this.handler) return
    while (this.running < this.concurrency && this.waiting.length > 0) {
      const simulationId = this.waiting.shift() as string
      this.running++
      void this.run(this.handler, simulationId)
    }
  }

  private async run(handler: JobHandler, simulationId: string): Promise<void> {
    try {
      await handler(simulationId)
    } catch (error) {
      logError('InProcessJobQueue.run', { simulationId }, error)
    } finally {
      this.running--
      this.known.delete(simulationId)
      this.drain()
    }
  }
}
