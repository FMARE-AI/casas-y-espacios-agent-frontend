# Design: Especificación de Diseño Técnico

Este documento detalla el diseño técnico para mejorar la visualización de documentos y media con captions en `src/components/chat/MessageBubble.tsx`.

## 1. Cambios Propuestos en `MessageBubble.tsx`

### 1.1 Helpers Adicionales
Se eliminará el helper síncrono `formatBytes` y se añadirán los siguientes en la sección superior de helpers:

```typescript
function getFileTypeLabel(mimeType: string | null): string {
  if (!mimeType) return 'Archivo'
  const MIME_LABELS: Record<string, string> = {
    // Imágenes
    'image/jpeg':                'Imagen JPEG',
    'image/png':                 'Imagen PNG',
    'image/webp':                'Imagen WebP',
    // Videos
    'video/mp4':                 'Video MP4',
    'video/3gpp':                'Video 3GP',
    // Documentos
    'application/pdf':           'Documento PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                                 'Documento Word',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                                 'Hoja de cálculo Excel',
    'application/msword':        'Documento Word',
    'application/vnd.ms-excel':  'Hoja de cálculo Excel',
    // Audio
    'audio/ogg':                 'Nota de voz',
    'audio/mpeg':                'Audio MP3',
    'audio/mp4':                 'Audio',
    'audio/aac':                 'Audio AAC',
    'audio/amr':                 'Nota de voz',
  }
  return MIME_LABELS[mimeType] ?? 'Archivo'
}

function getFileIcon(mimeType: string | null): { icon: string; color: string } {
  if (!mimeType) {
    return { icon: '📄', color: '#8B8FA8' }
  }
  if (mimeType === 'application/pdf') {
    return { icon: '📕', color: '#FF5B5B' }
  }
  if (mimeType.includes('wordprocessingml') ||
      mimeType.includes('msword')) {
    return { icon: '📘', color: '#01A4E3' }
  }
  if (mimeType.includes('spreadsheetml') ||
      mimeType.includes('ms-excel')) {
    return { icon: '📗', color: '#00D4AA' }
  }
  if (mimeType.startsWith('video/')) {
    return { icon: '🎥', color: '#FFB84D' }
  }
  if (mimeType.startsWith('audio/')) {
    return { icon: '🎤', color: '#01A4E3' }
  }
  return { icon: '📄', color: '#8B8FA8' }
}

function getFileName(url: string | null): string {
  if (!url) return 'Archivo'
  try {
    const parts = url.split('/')
    const last = parts[parts.length - 1]
    const name = last.split('?')[0]
    const decodedName = decodeURIComponent(name) || 'Archivo'

    // Separar nombre base y extensión
    const extIndex = decodedName.lastIndexOf('.')
    const baseName = extIndex !== -1 ? decodedName.slice(0, extIndex) : decodedName
    const ext = extIndex !== -1 ? decodedName.slice(extIndex).toLowerCase() : ''

    let cleanBase = baseName

    // Quitar prefijo de timestamp (ej: 1719543592_ o 1719543592-)
    cleanBase = cleanBase.replace(/^\d{10,15}[_-]/, '')

    // Quitar sufijo de timestamp (ej: _1719543592 o -1719543592)
    cleanBase = cleanBase.replace(/[_-]\d{10,15}$/, '')

    // Identificar UUIDs, hashes hexadecimales largos, o secuencias puramente numéricas
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanBase)
    const isHash = /^[0-9a-f]{24,}$/i.test(cleanBase)
    const isDigits = /^\d+$/.test(cleanBase)

    if (!cleanBase || isUuid || isHash || isDigits) {
      const standardNames: Record<string, string> = {
        '.pdf': 'Documento',
        '.docx': 'Documento Word',
        '.doc': 'Documento Word',
        '.xlsx': 'Hoja de Cálculo',
        '.xls': 'Hoja de Cálculo',
        '.csv': 'Archivo CSV',
        '.pptx': 'Presentación',
        '.ppt': 'Presentación',
        '.png': 'Imagen',
        '.jpg': 'Imagen',
        '.jpeg': 'Imagen',
        '.webp': 'Imagen',
        '.mp4': 'Video',
        '.3gp': 'Video',
        '.ogg': 'Audio',
        '.mp3': 'Audio',
        '.wav': 'Audio',
        '.m4a': 'Audio',
      }
      cleanBase = standardNames[ext] ?? 'Archivo'
    }

    return cleanBase + ext
  } catch {
    return 'Archivo'
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
```

### 1.2 Modificación de `ImageBubble`
Se rediseñará para mostrar la imagen con una altura máxima aumentada de `max-h-[300px]` (`max-h-48` anterior) para una mejor visualización, y los captions se mostrarán de forma externa a la imagen con tipografía consistente:

```tsx
const ImageBubble = memo(function ImageBubble({ msg }: { msg: Message }) {
  if (msg.media_url) {
    return (
      <div className="flex flex-col gap-1.5 max-w-[240px]">
        <img
          src={msg.media_url}
          alt={msg.content ?? 'Imagen'}
          className="rounded-lg w-full h-auto max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition"
          onClick={() => window.open(msg.media_url!, '_blank')}
        />
        {msg.content && (
          <p className="text-sm text-[#F0F0F5] px-1 whitespace-pre-wrap">
            {msg.content}
          </p>
        )}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1.5 max-w-[240px]">
      <div className="rounded overflow-hidden border border-[#3A3A37]">
        <div className="w-48 h-32 bg-[#3A3A37] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#8B8FA8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      {msg.content && (
        <p className="text-sm text-[#F0F0F5] px-1 whitespace-pre-wrap">
          {msg.content}
        </p>
      )}
    </div>
  )
})
```

### 1.3 Modificación de `DocumentBubble`
Se rediseña la tarjeta con un fondo `bg-black/20` con efecto hover, íconos y colores según el tipo de archivo, y el caption (`content`) renderizado de forma externa con alineación de texto y diseño limpio:

```tsx
const DocumentBubble = memo(function DocumentBubble({ msg }: { msg: Message }) {
  return (
    <div className="flex flex-col gap-2 min-w-[200px] p-2">
      <a
        href={msg.media_url ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-black/20 rounded-lg p-3 hover:bg-black/30 transition no-underline group"
      >
        {/* Ícono de tipo de archivo con fondo del color respectivo en baja opacidad */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{
            backgroundColor: `${getFileIcon(msg.media_mime_type).color}20`
          }}
        >
          {getFileIcon(msg.media_mime_type).icon}
        </div>
        {/* Información del archivo */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#F0F0F5] truncate">
            {getFileName(msg.media_url)}
          </p>
          <p className="text-[10px] text-[#8B8FA8] mt-0.5">
            {getFileTypeLabel(msg.media_mime_type)}
            {msg.media_size_bytes && ` • ${formatFileSize(msg.media_size_bytes)}`}
          </p>
        </div>
        {/* Ícono de descarga */}
        <div className="text-[#8B8FA8] group-hover:text-[#F0F0F5] transition flex-shrink-0">
          ↓
        </div>
      </a>
      {/* Caption si existe */}
      {msg.content && (
        <p className="text-sm text-[#F0F0F5] px-1 whitespace-pre-wrap">
          {msg.content}
        </p>
      )}
    </div>
  )
})
```

### 1.4 Modificación de `VideoBubble`
Se alineará el comportamiento y renderizado del caption para que sea coherente con las burbujas de imagen y documento:

```tsx
const VideoBubble = memo(function VideoBubble({ msg }: { msg: Message }) {
  if (msg.media_url) {
    return (
      <div className="flex flex-col gap-1.5 max-w-[240px]">
        <div className="rounded overflow-hidden border border-[#3A3A37]">
          <video
            src={msg.media_url}
            controls
            className="w-full h-auto max-h-48 object-cover"
          />
        </div>
        {msg.content && (
          <p className="text-sm text-[#F0F0F5] px-1 whitespace-pre-wrap">
            {msg.content}
          </p>
        )}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1.5 max-w-[240px]">
      <div className="w-48 h-32 bg-[#3A3A37] rounded flex items-center justify-center">
        <svg className="w-10 h-10 text-[#8B8FA8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      {msg.content && (
        <p className="text-sm text-[#F0F0F5] px-1 whitespace-pre-wrap">
          {msg.content}
        </p>
      )}
    </div>
  )
})
```

## 2. Impacto y Verificación

* **TypeScript:** Los tipos de datos de `Message` se respetan de manera transparente, no es necesario hacer casts adicionales o alterar tipos.
* **Estilos:** Se utiliza Tailwind puro integrado en el tema oscuro del chat, por lo que mantendrá consistencia con los colores de fondo actuales (`#2E2E2B` para inbound, `#1F2937` para outbound_bot, y `#01A4E3` para outbound_advisor).
* **Compilación:** Verificación con `npx tsc --noEmit`.
