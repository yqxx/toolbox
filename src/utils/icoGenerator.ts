const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif']
const ICO_SIZES = [16, 32, 48, 64, 128, 256] as const

export const PREVIEW_SIZES = [16, 32, 48, 64, 80, 96, 112, 128, 256, 512] as const

export type PreviewSize = (typeof PREVIEW_SIZES)[number]

const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif']

export function isAcceptedImageType(type: string): boolean {
  return ACCEPTED_TYPES.includes(type)
}

export function isAcceptedImageFile(file: File): boolean {
  if (isAcceptedImageType(file.type)) return true
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  return ACCEPTED_EXTENSIONS.includes(ext)
}

export interface LoadedImage {
  image: HTMLImageElement
  url: string
}

export function loadImageFromFile(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    if (!isAcceptedImageFile(file)) {
      reject(new Error('仅支持 PNG、JPG、GIF 格式的图片'))
      return
    }

    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      resolve({ image: img, url })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败，请尝试其他文件'))
    }
    img.src = url
  })
}

function resizeToPng(image: HTMLImageElement, size: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('无法创建画布'))
      return
    }

    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(image, 0, 0, size, size)

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('图片转换失败'))
          return
        }
        resolve(new Uint8Array(await blob.arrayBuffer()))
      },
      'image/png',
    )
  })
}

export async function generateIco(image: HTMLImageElement): Promise<Blob> {
  const pngData = await Promise.all(ICO_SIZES.map((size) => resizeToPng(image, size)))

  const count = pngData.length
  const headerSize = 6
  const entrySize = 16
  const dataOffset = headerSize + entrySize * count

  let totalSize = dataOffset
  for (const data of pngData) {
    totalSize += data.length
  }

  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, count, true)

  let offset = dataOffset
  for (let i = 0; i < count; i++) {
    const size = ICO_SIZES[i]
    const entryOffset = headerSize + i * entrySize
    const dimension = size >= 256 ? 0 : size

    bytes[entryOffset] = dimension
    bytes[entryOffset + 1] = dimension
    bytes[entryOffset + 2] = 0
    bytes[entryOffset + 3] = 0
    view.setUint16(entryOffset + 4, 1, true)
    view.setUint16(entryOffset + 6, 32, true)
    view.setUint32(entryOffset + 8, pngData[i].length, true)
    view.setUint32(entryOffset + 12, offset, true)

    bytes.set(pngData[i], offset)
    offset += pngData[i].length
  }

  return new Blob([buffer], { type: 'image/x-icon' })
}

export function renderPreview(
  image: HTMLImageElement,
  size: number,
  canvas: HTMLCanvasElement,
): void {
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, size, size)
  ctx.drawImage(image, 0, 0, size, size)
}
