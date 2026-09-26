import { FabricType } from '../../../domain/enums/fabric-type'

/**
 * Prompts da IA de imagem. Em inglês: os modelos seguem melhor instruções em
 * inglês. As instruções livres da usuária vão como estão (português).
 */

/** Comportamento físico de cada tecido: a IA não sabe o peso só pela foto */
const FABRIC_BEHAVIOR: Record<FabricType, string> = {
  [FabricType.COTTON]: 'woven cotton: medium weight, matte, soft structure, gentle natural creases',
  [FabricType.LINEN]: 'linen: crisp, matte, visible slub texture, natural wrinkles, relaxed drape',
  [FabricType.KNIT]: 'stretch knit (malha): soft, stretchy, follows the body closely, smooth fluid drape',
  [FabricType.SILK]: 'silk: lightweight, fluid drape, soft natural sheen, flowing folds',
  [FabricType.SATIN]: 'satin: smooth, glossy surface with strong highlights, fluid heavy drape',
  [FabricType.CREPE]: 'crepe: matte, slightly grainy surface, fluid drape, falls close to the body',
  [FabricType.CHIFFON]: 'chiffon: sheer, very light and airy, floaty soft folds, slightly translucent',
  [FabricType.DENIM]: 'denim: sturdy, heavy, structured, visible twill weave, stiff folds',
  [FabricType.LACE]: 'lace: openwork pattern with see-through areas, delicate, usually lined underneath',
  [FabricType.VISCOSE]: 'viscose: light, very fluid drape, soft matte to slight sheen, flowing movement',
  [FabricType.WOOL]: 'wool: medium to heavy weight, structured, soft matte surface, holds shape',
  [FabricType.LEATHER]: 'leather: thick, structured, smooth surface with subtle sheen, stiff folds',
  [FabricType.OTHER]: 'the fabric shown in the photo; infer weight and drape from its appearance',
}

export interface FabricSwapPromptInput {
  fabricType: FabricType
  fabricDescription: string | null
  instructions: string | null
}

export function buildFabricSwapPrompt(input: FabricSwapPromptInput): string {
  const lines = [
    'You are an expert fashion product photo editor.',
    'Image 1 is a reference photo of a garment.',
    'Image 2 is a close-up photo of a fabric swatch.',
    '',
    'Task: recreate the exact same garment from image 1, but sewn entirely from the fabric in image 2.',
    '',
    'Keep from image 1, unchanged: the cut, silhouette, neckline, sleeves, length, seams, darts, pleats, buttons, zippers, trims, fit, pose, model (if any), background, camera angle and lighting.',
    '',
    'Take from image 2: the exact color, print or pattern, weave, texture and sheen of the fabric.',
    `Fabric behavior: ${FABRIC_BEHAVIOR[input.fabricType]}. Drape, folds and weight must match this fabric.`,
    '',
    'Rules:',
    '- Keep the print at a realistic real-world scale relative to the garment. Do not enlarge or stretch motifs to fill the piece.',
    '- The pattern must follow the seams, folds and curves of the garment naturally, with correct perspective.',
    '- If a person wears the garment in image 1, keep that person identical (face, body, skin, hair).',
    '- Do not add text, logos, labels or watermarks.',
    '- Photorealistic result, high detail, like a real product photo.',
  ]

  if (input.fabricDescription) {
    lines.push('', `Fabric notes from the seamstress (Portuguese): "${input.fabricDescription}"`)
  }
  if (input.instructions) {
    lines.push('', `Extra instructions from the seamstress (Portuguese), follow them: "${input.instructions}"`)
  }

  return lines.join('\n')
}

export interface TryOnPromptInput {
  instructions: string | null
}

export function buildTryOnPrompt(input: TryOnPromptInput): string {
  const lines = [
    'You are an expert virtual try-on photo editor.',
    'Image 1 is a photo of a person (the customer).',
    'Image 2 is a photo of a garment.',
    '',
    'Task: generate a photorealistic photo of the person from image 1 wearing the garment from image 2.',
    '',
    'Rules:',
    '- Keep the identity of the person exactly: face, skin tone, hair, body shape and proportions. Do not slim, reshape, retouch or beautify the body or face.',
    '- Keep the pose and background of image 1 whenever possible.',
    '- Keep the garment design, color, print, fabric and details of image 2 exactly, only adapted to the body of the person with a realistic fit, folds and shadows.',
    '- The garment replaces the clothes the person is wearing in the same body area. Keep other clothing items unchanged.',
    '- Show the whole garment.',
    '- Do not add text, logos or watermarks.',
  ]

  if (input.instructions) {
    lines.push('', `Extra instructions from the seamstress (Portuguese), follow them: "${input.instructions}"`)
  }

  return lines.join('\n')
}
