export interface IJobQueue {
  enqueue(simulationId: string): void
}
