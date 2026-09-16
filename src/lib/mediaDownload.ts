import { useToastStore } from '../store/toastStore'

function saveBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

// Supabase Storage signed URLs are cross-origin, so a plain <a download> is
// ignored by the browser and it just navigates/opens the file instead of
// saving it. Fetching as a blob and downloading the object URL forces a real
// save regardless of origin.
export async function downloadMedia(url: string | null, filename: string): Promise<void> {
  if (!url) {
    useToastStore.getState().showToast('No hay archivo para descargar', 'error')
    return
  }

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    saveBlob(blob, filename)
  } catch (error) {
    console.error('[downloadMedia] failed', { url, filename, error })
    useToastStore.getState().showToast('No se pudo descargar el archivo', 'error')
  }
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo decodificar la imagen'))
    }
    img.src = objectUrl
  })
}

// Bakes the given rotation (0/90/180/270) into the pixel data and downloads
// the result, so the saved file actually comes out rotated instead of just
// looking rotated in the viewer. The source blob is loaded via a blob: URL
// (always same-origin), so this never runs into a tainted-canvas/CORS error
// regardless of the Storage bucket's CORS config.
export async function downloadRotatedImage(
  url: string | null,
  filename: string,
  rotationDeg: 0 | 90 | 180 | 270,
): Promise<void> {
  if (!url) {
    useToastStore.getState().showToast('No hay archivo para descargar', 'error')
    return
  }
  if (rotationDeg === 0) {
    return downloadMedia(url, filename)
  }

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const sourceBlob = await response.blob()
    const img = await loadImageFromBlob(sourceBlob)

    const swapDimensions = rotationDeg === 90 || rotationDeg === 270
    const canvas = document.createElement('canvas')
    canvas.width = swapDimensions ? img.naturalHeight : img.naturalWidth
    canvas.height = swapDimensions ? img.naturalWidth : img.naturalHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context no disponible')

    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotationDeg * Math.PI) / 180)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)

    const mimeType = sourceBlob.type || 'image/png'
    const rotatedBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mimeType),
    )
    if (!rotatedBlob) throw new Error('No se pudo generar la imagen rotada')

    saveBlob(rotatedBlob, filename)
  } catch (error) {
    console.error('[downloadRotatedImage] failed', { url, filename, rotationDeg, error })
    useToastStore.getState().showToast('No se pudo descargar la imagen rotada', 'error')
  }
}
