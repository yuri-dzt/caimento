/**
 * Borda de tesoura de picotar (zigue-zague nos 4 lados) como clip-path.
 * Pensado para amostras quadradas; em retângulos os dentes esticam um pouco.
 */
function buildPinkedPolygon(teeth: number, depth: number): string {
  const points: string[] = []
  const step = 100 / teeth
  const p = (x: number, y: number): void => {
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`)
  }

  for (let i = 0; i < teeth; i++) {
    p(i * step, depth)
    p(i * step + step / 2, 0)
  }
  for (let i = 0; i < teeth; i++) {
    p(100 - depth, i * step)
    p(100, i * step + step / 2)
  }
  for (let i = 0; i < teeth; i++) {
    p(100 - i * step, 100 - depth)
    p(100 - i * step - step / 2, 100)
  }
  for (let i = 0; i < teeth; i++) {
    p(depth, 100 - i * step)
    p(0, 100 - i * step - step / 2)
  }
  return `polygon(${points.join(', ')})`
}

export const PINKED_CLIP = buildPinkedPolygon(16, 3)
