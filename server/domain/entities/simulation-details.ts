import type { FabricType } from '../enums/fabric-type'
import type { Simulation } from './simulation'

/** Simulação com o resumo das entidades ligadas (para listagem e detalhe) */
export interface SimulationDetails extends Simulation {
  garment: { id: string; name: string; imageKey: string } | null
  fabric: { id: string; name: string; fabricType: FabricType; imageKey: string } | null
  customer: { id: string; name: string } | null
}
