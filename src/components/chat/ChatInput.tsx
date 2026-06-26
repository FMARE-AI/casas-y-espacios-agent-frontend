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
  onTypingChange?: (isTyping: boolean) => void
}

const FILE_TYPES = {
  image: {
    label: 'Imagen',
    accept: 'image/jpeg,image/png,image/webp',
    maxMB: 5,
    iconColor: '#01A4E3',
  },
  document: {
    label: 'Documento',
    accept: 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    maxMB: 20,
    iconColor: '#FFB84D',
  },
  video: {
    label: 'Video',
    accept: 'video/mp4,video/3gpp',
    maxMB: 16,
    iconColor: '#00D4AA',
  },
}

const FILE_ICON_COLORS: Record<keyof typeof FILE_TYPES, string> = {
  image:    'bg-[#01A4E3]/15 border-[#01A4E3]/30 text-[#01A4E3]',
  document: 'bg-[#FFB84D]/15 border-[#FFB84D]/30 text-[#FFB84D]',
  video:    'bg-[#00D4AA]/15 border-[#00D4AA]/30 text-[#00D4AA]',
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    return mimeType.split('/')[1].toUpperCase()  // JPEG, PNG
  }
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('wordprocessingml')) return 'DOCX'
  if (mimeType.includes('spreadsheetml')) return 'XLSX'
  if (mimeType.startsWith('video/')) return 'MP4'
  return 'Archivo'
}

function getFileType(mimeType: string): keyof typeof FILE_TYPES | null {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.includes('pdf') ||
      mimeType.includes('wordprocessingml') ||
      mimeType.includes('spreadsheetml')) return 'document'
  return null
}

function FileIcon({ category }: { category: keyof typeof FILE_TYPES }) {
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

function getErrorMessage(error: any, fallback: string, file?: File): string {
  const code = error.response?.data?.detail?.code
  const backendMsg = error.response?.data?.detail?.message

  switch (code) {
    case 'EMPTY_MESSAGE':
      return 'El mensaje no puede estar vacío o contener solo espacios.'
    case 'MESSAGE_TOO_LONG':
      return 'El mensaje supera el límite de 4096 caracteres.'
    case 'BOT_IS_ACTIVE':
      return 'El bot tiene el control de esta conversación.'
    case 'NOT_ASSIGNED':
      return 'No estás asignado a esta conversación.'
    case 'FILE_TOO_LARGE': {
      if (file) {
        const category = getFileType(file.type)
        const limitMB = category ? FILE_TYPES[category].maxMB : 20
        return `El archivo supera el límite de tamaño permitido (${limitMB} MB).`
      }
      return 'El archivo supera el límite de tamaño permitido.'
    }
    case 'FILE_TYPE_NOT_ALLOWED':
      return 'El tipo de archivo no está permitido.'
    case 'META_API_ERROR':
      return 'No se pudo enviar el mensaje a WhatsApp. Intenta nuevamente.'
    case 'STORAGE_ERROR':
      return 'Error de almacenamiento al subir el archivo. Intenta de nuevo.'
    default:
      return backendMsg || fallback
  }
}

export default function ChatInput({
  conversationId,
  clientName,
  channel,
  waitMinutes,
  onMessageSent,
  onError,
  variant = 'assigned',
  onTypingChange,
}: ChatInputProps) {
  const [text, setText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [recorderState, setRecorderState] = useState<string>('idle')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateTypingStatus = (status: boolean) => {
    if (typingTimeoutRef.current && !status) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    if (onTypingChange) {
      onTypingChange(status)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Cerrar al hacer clic fuera y con Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!attachMenuRef.current?.contains(e.target as Node)) {
        setAttachMenuOpen(false)
      }
    }
    function handleEscapeKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAttachMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [])

  function toggleAttachMenu() {
    setAttachMenuOpen((open) => !open)
  }

  function triggerFileInput(type: keyof typeof FILE_TYPES) {
    setAttachMenuOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.accept = FILE_TYPES[type].accept
      fileInputRef.current.click()
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Detectar el tipo según el mime
    const type = getFileType(file.type)
    if (!type) {
      showError('Tipo de archivo no permitido')
      return
    }
    // Validar tamaño
    const maxBytes = FILE_TYPES[type].maxMB * 1024 * 1024
    if (file.size > maxBytes) {
      showError(
        `El archivo supera el límite de ${FILE_TYPES[type].maxMB}MB`
      )
      return
    }
    setSelectedFile(file)
    // Limpiar el input para permitir seleccionar
    // el mismo archivo dos veces
    e.target.value = ''
  }

  function removeSelectedFile() {
    setSelectedFile(null)
  }

  function showError(message: string) {
    setSendError(message)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      updateTypingStatus(false)
      handleSend()
    }
  }

  async function sendTextMessage() {
    setSending(true)
    setSendError(null)
    try {
      const { message } = await conversationsService.replyText(conversationId, text.trim())
      onMessageSent(message)
      setText('')

      // Auto scroll to bottom
      setTimeout(() => {
        const feed = document.getElementById('chat-message-feed')
        if (feed) feed.scrollTop = feed.scrollHeight
      }, 50)
    } catch (error) {
      setSendError(getErrorMessage(error, 'No pudimos enviar el mensaje. Revisa tu conexión e intenta de nuevo.'))
      onError()
    } finally {
      setSending(false)
    }
  }

  async function handleSend() {
    updateTypingStatus(false)
    if (selectedFile) {
      // PW-5 — enviar multimedia
      setSending(true)
      setSendError(null)
      try {
        const { message } = await conversationsService
          .replyMedia(conversationId, selectedFile)
        onMessageSent(message)
        setSelectedFile(null)
        setText('')

        // Auto scroll to bottom
        setTimeout(() => {
          const feed = document.getElementById('chat-message-feed')
          if (feed) feed.scrollTop = feed.scrollHeight
        }, 50)
      } catch (error) {
        setSendError(getErrorMessage(error, 'No se pudo enviar el archivo.', selectedFile))
      } finally {
        setSending(false)
      }
      return
    }
    if (text.trim()) {
      // PW-4 — enviar texto (flujo existente)
      await sendTextMessage()
    }
  }

  const activeCategory = selectedFile ? (getFileType(selectedFile.type) ?? 'document') : 'document'

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
            <span>{sendError}</span>
          </span>
          <button
            type="button"
            onClick={() => { setSendError(null); handleSend() }}
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
            <div
              id="file-preview-icon"
              className={`w-8 h-8 rounded border overflow-hidden flex items-center justify-center ${FILE_ICON_COLORS[activeCategory]}`}
            >
              {activeCategory === 'image' ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileIcon category={activeCategory} />
              )}
            </div>
            <div>
              <p className="text-white font-semibold truncate max-w-[180px]" id="file-preview-name">
                {selectedFile.name}
              </p>
              <p className="text-[#8B8FA8] text-[10px]" id="file-preview-size">
                {formatFileSize(selectedFile.size)} • {getFileLabel(selectedFile.type)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeSelectedFile}
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
              onClick={toggleAttachMenu}
              disabled={variant !== 'assigned' || sending || selectedFile !== null}
              className="p-2 text-[#8B8FA8] hover:text-white hover:bg-[#3A3A37] rounded transition disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              title="Adjuntar archivo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {attachMenuOpen && (
              <div
                id="attach-menu"
                className="absolute bottom-full left-0 mb-2 bg-[#252522] border border-[#3A3A37] rounded-lg shadow-xl z-50 w-36 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => triggerFileInput('image')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#F0F0F5] hover:bg-[#2E2E2B] transition"
                >
                  <svg className="w-4 h-4 text-[#01A4E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Imagen</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerFileInput('document')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#F0F0F5] hover:bg-[#2E2E2B] transition border-t border-[#3A3A37]"
                >
                  <svg className="w-4 h-4 text-[#FFB84D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Documento</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerFileInput('video')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-[#F0F0F5] hover:bg-[#2E2E2B] transition border-t border-[#3A3A37]"
                >
                  <svg className="w-4 h-4 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Video</span>
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
              disabled={selectedFile !== null || sending || variant !== 'assigned'}
              onChange={(e) => {
                const val = e.target.value
                if (val.length <= 2000) {
                  setText(val)
                }

                if (!val.trim()) {
                  updateTypingStatus(false)
                } else {
                  updateTypingStatus(true)
                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current)
                  }
                  typingTimeoutRef.current = setTimeout(() => {
                    updateTypingStatus(false)
                  }, 1500)
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedFile
                  ? 'Archivo seleccionado para enviar'
                  : 'Escribe tu respuesta... (Enter para enviar, Shift+Enter para nueva línea)'
              }
              className="flex-1 bg-transparent outline-none border-none text-xs text-white placeholder-[#8B8FA8] resize-none h-11 px-1 py-1 max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Counter + send */}
            <div className="flex items-center space-x-2 pl-2 border-l border-[#3A3A37] shrink-0">
              <span className="text-[10px] text-[#8B8FA8] font-mono">{text.length}/2000</span>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || variant !== 'assigned' || (!text.trim() && !selectedFile)}
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
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
    </div>
  )
}
