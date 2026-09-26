const MAX_SIDE = 2048
const QUALITY = 0.88
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Reduz a foto no próprio celular antes de subir: upload mais rápido,
 * custo menor na IA e converte formatos que o servidor não aceita (ex.: HEIC).
 */
export async function prepareImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    if (ACCEPTED.includes(file.type)) return file
    throw new Error('Não foi possível ler esta imagem. Tente tirar a foto de novo.')
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  // só JPEG pequeno passa direto; PNG/WEBP podem ter transparência e sempre são convertidos com fundo branco
  const alreadySmall = scale === 1 && file.size < 1.5 * 1024 * 1024 && file.type === 'image/jpeg'
  if (alreadySmall) {
    bitmap.close()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }
  // JPEG não tem transparência: fundo branco no lugar do preto padrão
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível preparar a imagem.'))),
      'image/jpeg',
      QUALITY,
    )
  })
}
