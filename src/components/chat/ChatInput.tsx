import { useEffect, useRef, useState } from 'react'
import { conversationsService } from '../../services/conversations'
import AudioRecorder from './AudioRecorder'
import type { Message } from '../../types'

interface ChatInputProps {
  conversationId: string
  clientName: string
  channel: string
  waitMinutes: number | null
  onMessageSent: (message: Message) => void
  onError: () => void
  variant?: string
}

type FileCategory = 'image' | 'document' | 'video'

const FILE_ICON_COLORS: Record<FileCategory, string> = {
  image:    'bg-[#01A4E3]/15 border-[#01A4E3]/30 text-[#01A4E3]',
  document: 'bg-[#FFB84D]/15 border-[#FFB84D]/30 text-[#FFB84D]',
  video:    'bg-[#00D4AA]/15 border-[#00D4AA]/30 text-[#00D4AA]',
}

const ACCEPT_MAP: Record<FileCategory, string> = {
  image:    'image/jpeg,image/png,image/webp',
  document: 'application/pdf,.docx,.doc',
  video:    'video/mp4,video/webm',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getCategoryFromFile(file: File): FileCategory {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'document'
}

function FileIcon({ category }: { category: FileCategory }) {
  if (category === 'image') return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
  if (category === 'video') return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}

export default function ChatInput({
  conversationId,
  clientName,
  channel,
  waitMinutes,
  onMessageSent,
  onError,
  variant = 'assigned',
}: ChatInputProps) {
  const [text, setText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileCategory, setFileCategory] = useState<FileCategory>('document')
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [recorderState, setRecorderState] = useState<string>('idle')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)

  // Close attach menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function openFilePicker(category: FileCategory) {
    setFileCategory(category)
    setAttachMenuOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.accept = ACCEPT_MAP[category]
      fileInputRef.current.click()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (file) {
      setSelectedFile(file)
      setFileCategory(getCategoryFromFile(file))
    }
    e.target.value = ''
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function sendMessage() {
    if (!text.trim() && !selectedFile) return
    setSending(true)
    setSendError(false)
    try {
      let message: Message
      if (selectedFile) {
        if (selectedFile.type.startsWith('audio/')) {
          const { message: m } = await conversationsService.replyAudio(conversationId, selectedFile)
          message = m
        } else {
          const { message: m } = await conversationsService.replyMedia(conversationId, selectedFile)
          message = m
        }
      } else {
        const { message: m } = await conversationsService.replyText(conversationId, text.trim())
        message = m
      }
      setText('')
      setSelectedFile(null)
      onMessageSent(message)
    } catch {
      setSendError(true)
      onError()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-3 bg-[#252522] border-t border-[#3A3A37] shrink-0 space-y-2">
      {/* Context bar */}
      <div
        id="chat-context-restriction-bar"
        className="bg-[#2E2E2B]/60 px-3 py-1.5 border border-[#3A3A37] rounded flex flex-wrap justify-between items-center text-[10px] sm:text-[11px] text-[#8B8FA8]"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#01A4E3]" />
          <span>
            Respondiendo a: <strong className="text-white">{clientName}</strong>
            {' • '}Línea {channel}
          </span>
        </div>
        {waitMinutes !== null && waitMinutes > 0 && (
          <div className="text-[#FFB84D] flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB84D] animate-pulse" />
            <span>⚠️ Esperando respuesta hace {waitMinutes} m</span>
          </div>
        )}
      </div>

      {/* Send error banner */}
      {sendError && (
        <div
          id="chat-send-error-banner"
          className="flex items-center justify-between p-3 bg-[#FF5B5B]/10 border border-[#FF5B5B]/30 rounded-lg text-xs text-[#FF5B5B] shadow-md animate-pulse"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>No pudimos enviar el mensaje. Revisa tu conexión e intenta de nuevo.</span>
          </span>
          <button
            type="button"
            onClick={() => { setSendError(false); sendMessage() }}
            className="shrink-0 ml-3 bg-[#FF5B5B]/20 hover:bg-[#FF5B5B]/40 text-[#FF5B5B] px-3 py-1.5 rounded font-bold text-[10px] uppercase border border-[#FF5B5B]/30 transition active:scale-95"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* File preview bar */}
      {selectedFile && (
        <div
          id="file-preview-bar"
          className="flex items-center justify-between p-2 bg-[#252522] border border-[#3A3A37] rounded text-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded border flex items-center justify-center ${FILE_ICON_COLORS[fileCategory]}`}>
              <FileIcon category={fileCategory} />
            </div>
            <div>
              <p className="text-white font-semibold truncate max-w-[180px]">{selectedFile.name}</p>
              <p className="text-[#8B8FA8] text-[10px]">{formatBytes(selectedFile.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="text-[#8B8FA8] hover:text-[#FF5B5B] transition p-1 rounded hover:bg-[#FF5B5B]/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Typing area */}
      <div
        id="chat-input-typing-area"
        className="relative flex items-start bg-[#2E2E2B] border border-[#3A3A37] rounded focus-within:border-[#01A4E3] transition p-2 gap-2"
      >
        {/* Attach button + dropdown */}
        {recorderState === 'idle' && (
          <div ref={attachMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setAttachMenuOpen((o) => !o)}
              className="p-2 text-[#8B8FA8] hover:text-white hover:bg-[#3A3A37] rounded transition"
              title="Adjuntar archivo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {attachMenuOpen && (
              <div
                id="attach-menu"
                className="absolute bottom-full left-0 mb-2 bg-[#252522] border border-[#3A3A37] rounded-lg shadow-xl z-50 w-44 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => openFilePicker('image')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#F0F0F5] hover:bg-[#2E2E2B] transition"
                >
                  <svg className="w-4 h-4 text-[#01A4E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Imagen</span>
                  <span className="text-[#8B8FA8] text-[10px] ml-auto">JPG, PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => openFilePicker('document')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#F0F0F5] hover:bg-[#2E2E2B] transition border-t border-[#3A3A37]"
                >
                  <svg className="w-4 h-4 text-[#FFB84D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Documento</span>
                  <span className="text-[#8B8FA8] text-[10px] ml-auto">PDF, DOCX</span>
                </button>
                <button
                  type="button"
                  onClick={() => openFilePicker('video')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#F0F0F5] hover:bg-[#2E2E2B] transition border-t border-[#3A3A37]"
                >
                  <svg className="w-4 h-4 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Video</span>
                  <span className="text-[#8B8FA8] text-[10px] ml-auto">MP4</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Audio recording mechanism */}
        <AudioRecorder
          conversationId={conversationId}
          onAudioSent={onMessageSent}
          disabled={variant !== 'assigned'}
          onStateChange={setRecorderState}
        />

        {recorderState === 'idle' && (
          <>
            {/* Textarea */}
            <textarea
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= 2000) setText(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu respuesta... (Enter para enviar, Shift+Enter para nueva línea)"
              className="flex-1 bg-transparent outline-none border-none text-xs text-white placeholder-[#8B8FA8] resize-none h-11 px-1 py-1 max-h-32"
            />

            {/* Counter + send */}
            <div className="flex items-center space-x-2 pl-2 border-l border-[#3A3A37] shrink-0">
              <span className="text-[10px] text-[#8B8FA8] font-mono">{text.length}/2000</span>
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || (!text.trim() && !selectedFile)}
                className="bg-[#01A4E3] hover:bg-[#0190C8] active:scale-95 text-white p-2 rounded transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
