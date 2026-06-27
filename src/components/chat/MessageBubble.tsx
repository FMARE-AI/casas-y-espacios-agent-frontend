import { memo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { Message } from '../../types'

interface MessageBubbleProps {
  message: Message
  advisorName?: string
}

function formatTime(iso: string): string {
  try {
    return format(parseISO(iso), 'HH:mm')
  } catch {
    return ''
  }
}

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

function getFileName(url: string | null, mimeType: string | null = null): string {
  if (!url) return 'Archivo'
  try {
    const parts = url.split('/')
    const last = parts[parts.length - 1]
    const name = last.split('?')[0]
    const decodedName = decodeURIComponent(name) || 'Archivo'

    // Separar nombre base y extensión (buscando un punto seguido de 1-5 caracteres alfanuméricos al final)
    const matchExt = decodedName.match(/\.[a-zA-Z0-9]{1,5}$/)
    const extIndex = matchExt ? matchExt.index : -1
    const baseName = extIndex !== -1 ? decodedName.slice(0, extIndex) : decodedName
    let ext = extIndex !== -1 ? decodedName.slice(extIndex).toLowerCase() : ''

    // Si no tiene extensión en la URL pero tenemos mimeType, intentar deducir la extensión
    if (!ext && mimeType) {
      const mimeExtensions: Record<string, string> = {
        'application/pdf': '.pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.ms-excel': '.xls',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'video/mp4': '.mp4',
        'video/3gpp': '.3gp',
        'audio/ogg': '.ogg',
        'audio/mpeg': '.mp3',
        'audio/mp4': '.m4a',
        'audio/aac': '.aac',
        'audio/amr': '.amr',
      }
      ext = mimeExtensions[mimeType] ?? ''
    }

    let cleanBase = baseName

    // Quitar prefijo de timestamp (ej: 1719543592_ o 1719543592-)
    cleanBase = cleanBase.replace(/^\d{10,15}[_-]/, '')

    // Quitar sufijo de timestamp (ej: _1719543592 o -1719543592)
    cleanBase = cleanBase.replace(/[_-]\d{10,15}$/, '')

    // Identificar si es un wamid, un UUID, un hash hexadecimal o alfanumérico largo
    const isWamid = /^wamid\./i.test(cleanBase) || cleanBase.includes('wamid')
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanBase)
    const isHash = /^[0-9a-f]{24,}$/i.test(cleanBase) || /^[a-zA-Z0-9]{30,}$/.test(cleanBase)
    const isDigits = /^\d+$/.test(cleanBase)
    const isGenericDocument = cleanBase.endsWith('_document') || cleanBase.endsWith('_image') || cleanBase.endsWith('_video') || cleanBase.endsWith('_audio')

    if (!cleanBase || isWamid || isUuid || isHash || isDigits || isGenericDocument) {
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
      // Deducir el nombre si no coincide con las extensiones directas
      let defaultName = standardNames[ext]
      if (!defaultName) {
        if (cleanBase.endsWith('_document') || (mimeType && mimeType.includes('pdf'))) {
          defaultName = 'Documento'
        } else if (cleanBase.endsWith('_image') || (mimeType && mimeType.startsWith('image/'))) {
          defaultName = 'Imagen'
        } else if (cleanBase.endsWith('_video') || (mimeType && mimeType.startsWith('video/'))) {
          defaultName = 'Video'
        } else if (cleanBase.endsWith('_audio') || (mimeType && mimeType.startsWith('audio/'))) {
          defaultName = 'Audio'
        } else {
          defaultName = 'Archivo'
        }
      }
      cleanBase = defaultName
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

// ── Media placeholders ────────────────────────────────────

const ImageBubble = memo(function ImageBubble({ msg }: { msg: Message }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (msg.media_url) {
    return (
      <div className="flex flex-col gap-1.5 max-w-[240px]">
        <img
          src={msg.media_url}
          alt={msg.content ?? 'Imagen'}
          className="rounded-lg w-full h-auto max-h-[300px] object-cover cursor-pointer hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all duration-200"
          onClick={() => setIsExpanded(true)}
        />
        {msg.content && (
          <p className="text-sm text-[#F0F0F5] px-1 whitespace-pre-wrap">
            {msg.content}
          </p>
        )}

        {isExpanded && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fade-in"
            onClick={() => setIsExpanded(false)}
          >
            {/* Botón Cerrar */}
            <button
              type="button"
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition duration-200 z-50"
              onClick={() => setIsExpanded(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Contenedor imagen grande */}
            <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <img
                src={msg.media_url}
                alt={msg.content ?? 'Imagen'}
                className="max-w-full max-h-full rounded-lg object-contain shadow-2xl cursor-default"
              />
            </div>

            {/* Caption */}
            {msg.content && (
              <p className="mt-4 text-sm text-[#F0F0F5] bg-black/60 px-4 py-2 rounded-xl border border-white/5 max-w-xl text-center shadow-lg">
                {msg.content}
              </p>
            )}
          </div>
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

const DocumentBubble = memo(function DocumentBubble({ msg }: { msg: Message }) {
  const isAdvisor = msg.direction === 'outbound_advisor'
  return (
    <div className="flex flex-col gap-2.5 min-w-[220px] p-2">
      <a
        href={msg.media_url ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-3 border rounded-xl p-3 transition duration-200 no-underline group shadow-inner ${
          isAdvisor 
            ? 'bg-black/10 border-white/20 hover:bg-black/20 hover:border-white/30' 
            : 'bg-black/15 border-white/5 hover:border-white/10 hover:bg-black/25'
        }`}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 shadow-sm transition group-hover:scale-105"
          style={{
            backgroundColor: `${getFileIcon(msg.media_mime_type).color}20`
          }}
        >
          {getFileIcon(msg.media_mime_type).icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate transition ${
            isAdvisor ? 'text-white group-hover:text-white' : 'text-[#F0F0F5] group-hover:text-white'
          }`}>
            {getFileName(msg.media_url, msg.media_mime_type)}
          </p>
          <p className={`text-[10px] mt-0.5 font-medium ${
            isAdvisor ? 'text-white/70' : 'text-[#8B8FA8]'
          }`}>
            {getFileTypeLabel(msg.media_mime_type)}
            {msg.media_size_bytes && ` • ${formatFileSize(msg.media_size_bytes)}`}
          </p>
        </div>
        <div className={`w-7 h-7 rounded-full border flex items-center justify-center transition duration-200 flex-shrink-0 shadow-sm animate-fade-in ${
          isAdvisor 
            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30' 
            : 'bg-white/5 border-white/5 text-[#8B8FA8] group-hover:text-[#F0F0F5] group-hover:border-white/10'
        }`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
      </a>
      {msg.content && (
        <p className={`mt-2 px-1 text-sm whitespace-pre-wrap leading-relaxed ${
          isAdvisor ? 'text-white font-medium animate-fade-in' : 'text-[#F0F0F5]'
        }`}>
          {msg.content}
        </p>
      )}
    </div>
  )
})

const AudioBubble = memo(function AudioBubble({ msg }: { msg: Message }) {
  if (msg.media_url) {
    return (
      <div className="p-1.5 min-w-[220px] flex flex-col items-stretch gap-2.5">
        <audio
          src={msg.media_url}
          controls
          className="h-8 w-full max-w-[240px] shadow-sm rounded-lg"
          style={{ accentColor: '#01A4E3' }}
        />
        {msg.transcription && (
          <details className="text-[10px] text-[#8B8FA8] cursor-pointer select-none">
            <summary className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition outline-none font-bold">
              <svg className="w-3.5 h-3.5 text-[#01A4E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
              <span>Ver transcripción</span>
            </summary>
            <div className="mt-2 p-2.5 bg-black/15 border-l-2 border-[#01A4E3] rounded-r-lg whitespace-pre-wrap leading-relaxed text-[11px] text-[#F0F0F5]/85 cursor-text select-text shadow-inner">
              {msg.transcription}
            </div>
          </details>
        )}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-[#8B8FA8]">
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
      </svg>
      <span className="text-xs">Mensaje de voz</span>
    </div>
  )
})

const VideoBubble = memo(function VideoBubble({ msg }: { msg: Message }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isAdvisor = msg.direction === 'outbound_advisor'

  if (msg.media_url) {
    return (
      <div className="flex flex-col gap-1.5 max-w-[240px]">
        <div className="rounded-xl overflow-hidden border border-[#3A3A37]/60 shadow-md bg-black w-full max-h-[320px] flex items-center justify-center relative group/video">
          <video
            controls
            preload="metadata"
            playsInline
            className="w-full min-h-[135px] max-h-[320px] object-contain bg-black"
          >
            <source src={msg.media_url} type={msg.media_mime_type ?? 'video/mp4'} />
            Tu navegador no soporta la reproducción de video.
          </video>

          {/* Botón flotante para expandir */}
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/85 rounded-lg text-white/95 opacity-0 group-hover/video:opacity-100 transition duration-200 shadow-lg border border-white/10 z-10 flex items-center justify-center cursor-pointer"
            title="Ver en grande"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
        </div>
        
        {/* Enlace de descarga de respaldo siempre visible */}
        <div className={`flex items-center justify-between px-1 text-[10px] border-b pb-1 ${
          isAdvisor ? 'text-white/70 border-white/20' : 'text-[#8B8FA8] border-white/5'
        }`}>
          <span className="font-semibold uppercase tracking-wider text-[9px]">Video</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className={`font-bold flex items-center transition cursor-pointer ${
                isAdvisor ? 'text-white hover:text-white/80' : 'text-[#01A4E3] hover:text-[#01B4F3]'
              }`}
            >
              <span>Ver en grande</span>
            </button>
            <span className={isAdvisor ? 'text-white/25' : 'text-white/10'}>•</span>
            <a
              href={msg.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-bold flex items-center gap-1 transition ${
                isAdvisor ? 'text-white hover:text-white/80' : 'text-[#01A4E3] hover:text-[#01B4F3]'
              }`}
            >
              <span>Descargar</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          </div>
        </div>

        {msg.content && (
          <p className={`mt-2.5 px-1 text-sm whitespace-pre-wrap leading-relaxed ${
            isAdvisor ? 'text-white font-medium animate-fade-in' : 'text-[#F0F0F5]'
          }`}>
            {msg.content}
          </p>
        )}

        {isExpanded && (
          <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in"
            onClick={() => setIsExpanded(false)}
          >
            {/* Botón Cerrar */}
            <button
              type="button"
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition duration-200 z-50 cursor-pointer"
              onClick={() => setIsExpanded(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Contenedor del video expandido */}
            <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <video
                src={msg.media_url}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-full rounded-lg object-contain shadow-2xl bg-black"
              />
            </div>

            {/* Caption */}
            {msg.content && (
              <p className="mt-4 text-sm text-[#F0F0F5] bg-black/60 px-4 py-2 rounded-xl border border-white/5 max-w-xl text-center shadow-lg">
                {msg.content}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1.5 max-w-[240px]">
      <div className="w-48 h-32 bg-[#3A3A37] rounded-xl flex items-center justify-center border border-[#3A3A37]/60 shadow-md">
        <svg className="w-10 h-10 text-[#8B8FA8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      {msg.content && (
        <p className="text-sm text-[#F0F0F5] px-1 whitespace-pre-wrap leading-relaxed">
          {msg.content}
        </p>
      )}
    </div>
  )
})

// ── Bubble content ────────────────────────────────────────

const BubbleContent = memo(function BubbleContent({ msg, isDocument }: { msg: Message; isDocument: boolean }) {
  if (isDocument) return <DocumentBubble msg={msg} />
  switch (msg.msg_type) {
    case 'image': return <ImageBubble msg={msg} />
    case 'audio': return <AudioBubble msg={msg} />
    case 'video': return <VideoBubble msg={msg} />
    default: return (
      <p className="text-sm leading-relaxed">{msg.content}</p>
    )
  }
})

// ── Main component ────────────────────────────────────────

export default memo(function MessageBubble({ message, advisorName }: MessageBubbleProps) {
  const time = formatTime(message.timestamp)
  const isDocument = message.msg_type === 'document'

  if (message.direction === 'inbound') {
    return (
      <div className="flex flex-col items-start max-w-[75%] space-y-0.5 shrink-0">
        <div className={`bg-[#2E2E2B] text-[#F0F0F5] rounded-xl rounded-tl-none ${isDocument ? '' : 'p-3'} leading-relaxed shadow-sm border border-white/5`}>
          <BubbleContent msg={message} isDocument={isDocument} />
        </div>
        <span className="text-[9px] text-[#8B8FA8] ml-1">{time} • Cliente</span>
      </div>
    )
  }

  if (message.direction === 'outbound_bot') {
    return (
      <div className="flex flex-col items-end max-w-[75%] ml-auto space-y-0.5 shrink-0">
        <div className={`bg-[#1F2937] text-[#F0F0F5] rounded-xl rounded-tr-none ${isDocument ? '' : 'p-3'} leading-relaxed border border-[#3A3A37]/60 shadow-sm`}>
          <div className="flex items-center space-x-1 text-[#00D4AA] font-medium text-[10px] uppercase tracking-wider opacity-80 mb-1 px-3 pt-3">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Bot</span>
          </div>
          <div className={isDocument ? '' : 'px-3 pb-3'}>
            <BubbleContent msg={message} isDocument={isDocument} />
          </div>
        </div>
        <span className="text-[9px] text-[#8B8FA8] mr-1">{time}</span>
      </div>
    )
  }

  // outbound_advisor
  return (
    <div className="flex flex-col items-end max-w-[75%] ml-auto space-y-0.5 shrink-0">
      <div className={`bg-gradient-to-br from-[#01B4F3] to-[#01A4E3] text-white rounded-xl rounded-tr-none ${isDocument ? '' : 'p-3'} leading-relaxed shadow-md border border-[#01A4E3]/10`}>
        <BubbleContent msg={message} isDocument={isDocument} />
      </div>
      <span className="text-[9px] text-[#8B8FA8] mr-1">
        {time}{advisorName ? ` • ${advisorName}` : ''}
      </span>
    </div>
  )
})
