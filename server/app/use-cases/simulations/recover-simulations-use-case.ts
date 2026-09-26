import type { ISimulationRepository } from '../../../contracts/repositories/simulation-repository'
import type { IJobQueue } from '../../../contracts/services/job-queue'
import { SimulationStatus } from '../../../domain/enums/simulation'

/**
 * Roda no boot: simulações que estavam em andamento quando o servidor caiu
 * voltam para a fila. O limite de tentativas evita loop infinito.
 */
export class RecoverSimulationsUseCase {
  constructor(
    private readonly simulationRepository: ISimulationRepository,
    private readonly jobQueue: IJobQueue,
  ) {}

  async execute(): Promise<number> {
    await this.simulationRepository.resetProcessing()
    const pending = await this.simulationRepository.listByStatus([SimulationStatus.PENDING])
    for (const simulation of pending) this.jobQueue.enqueue(simulation.id)
    return pending.length
  }
}
