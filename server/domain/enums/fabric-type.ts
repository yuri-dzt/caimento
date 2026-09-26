export const FabricType = {
  COTTON: 'COTTON',
  LINEN: 'LINEN',
  KNIT: 'KNIT',
  SILK: 'SILK',
  SATIN: 'SATIN',
  CREPE: 'CREPE',
  CHIFFON: 'CHIFFON',
  DENIM: 'DENIM',
  LACE: 'LACE',
  VISCOSE: 'VISCOSE',
  WOOL: 'WOOL',
  LEATHER: 'LEATHER',
  OTHER: 'OTHER',
} as const

export type FabricType = (typeof FabricType)[keyof typeof FabricType]

export const FABRIC_TYPES = Object.values(FabricType) as [FabricType, ...FabricType[]]
