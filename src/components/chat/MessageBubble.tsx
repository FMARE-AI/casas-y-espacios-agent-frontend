import { memo } from 'react'
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

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Media placeholders ────────────────────────────────────

const ImageBubble = memo(function ImageBubble({ msg }: { msg: Message }) {
  if (msg.media_url) {
    return (
      <div className="rounded overflow-hidden border border-[#3A3A37] max-w-[240px]">
        <img
          src={msg.media_url}
          alt={msg.content ?? 'Imagen'}
          className="w-full h-auto max-h-48 object-cover cursor-pointer hover:opacity-90 transition"
          onClick={() => window.open(msg.media_url!, '_blank')}
        />
        {msg.content && <p className="text-[#F0F0F5] text-xs p-2">{msg.content}</p>}
      </div>
    )
  }
  return (
    <div className="rounded overflow-hidden border border-[#3A3A37]">
      <div className="w-48 h-32 bg-[#3A3A37] flex items-center justify-center">
        <svg className="w-8 h-8 text-[#8B8FA8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      {msg.content && <p className="text-[#F0F0F5] text-xs p-2">{msg.content}</p>}
    </div>
  )
})

const DocumentBubble = memo(function DocumentBubble({ msg }: { msg: Message }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-white text-xs font-semibold truncate max-w-[140px]">
          {msg.content ?? 'Documento'}
        </p>
        <p className="text-white/70 text-[10px]">
          {msg.media_mime_type ?? 'PDF'} • {formatBytes(msg.media_size_bytes)}
        </p>
      </div>
      {msg.media_url && (
        <a
          href={msg.media_url}
          target="_blank"
          rel="noreferrer"
          className="text-white/80 hover:text-white ml-auto shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      )}
    </div>
  )
})

const AudioBubble = memo(function AudioBubble({ msg }: { msg: Message }) {
  if (msg.media_url) {
    return (
      <div className="p-1 min-w-[200px] flex flex-col items-stretch">
        <audio
          src={msg.media_url}
          controls
          className="h-8 w-full max-w-[240px] mb-1"
          style={{ accentColor: '#01A4E3' }}
        />
        {msg.transcription && (
          <details className="mt-2 text-[10px] text-[#8B8FA8] cursor-pointer select-none">
            <summary className="hover:text-[#F0F0F5] transition outline-none font-bold flex items-center gap-1 list-none [&::-webkit-details-marker]:hidden">
              <svg className="w-3.5 h-3.5 text-[#01A4E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
              <span>Ver transcripción</span>
            </summary>
            <p className="mt-2 pl-2 border-l border-[#3A3A37] whitespace-pre-wrap leading-normal text-[#8B8FA8] cursor-text select-text">
              {msg.transcription}
            </p>
          </details>
        )}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
      </svg>
      <span className="text-xs">Mensaje de voz</span>
    </div>
  )
})

const VideoBubble = memo(function VideoBubble({ msg }: { msg: Message }) {
  if (msg.media_url) {
    return (
      <div className="rounded overflow-hidden border border-[#3A3A37] max-w-[240px]">
        <video
          src={msg.media_url}
          controls
          className="w-full h-auto max-h-48 object-cover"
        />
        {msg.content && <p className="text-[#F0F0F5] text-xs p-2">{msg.content}</p>}
      </div>
    )
  }
  return (
    <div className="w-48 h-32 bg-[#3A3A37] rounded flex items-center justify-center">
      <svg className="w-10 h-10 text-[#8B8FA8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
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
        <div className={`bg-[#2E2E2B] text-[#F0F0F5] rounded-lg rounded-tl-none ${isDocument ? '' : 'p-3'} leading-relaxed`}>
          <BubbleContent msg={message} isDocument={isDocument} />
        </div>
        <span className="text-[9px] text-[#8B8FA8] ml-1">{time} • Cliente</span>
      </div>
    )
  }

  if (message.direction === 'outbound_bot') {
    return (
      <div className="flex flex-col items-end max-w-[75%] ml-auto space-y-0.5 shrink-0">
        <div className={`bg-[#1F2937] text-[#F0F0F5] rounded-lg rounded-tr-none ${isDocument ? '' : 'p-3'} leading-relaxed border border-[#3A3A37]`}>
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
      <div className={`bg-[#01A4E3] text-white rounded-lg rounded-tr-none ${isDocument ? '' : 'p-3'} leading-relaxed`}>
        <BubbleContent msg={message} isDocument={isDocument} />
      </div>
      <span className="text-[9px] text-[#8B8FA8] mr-1">
        {time}{advisorName ? ` • ${advisorName}` : ''}
      </span>
    </div>
  )
})
