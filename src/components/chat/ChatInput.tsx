import { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { conversationsService } from '../../services/conversations'
import AudioRecorder from './AudioRecorder'
import type { Message } from '../../types'

interface ChatInputProps {
  conversationId: string
  clientName: string
  channel: string
  waitMinutes: number | null
  currentAdvisorName?: string
  onOptimisticMessage: (message: Message) => void
  onMessageConfirmed: (localId: string, message: Message) => void
  onMessageFailed: (localId: string) => void
  variant?: string
  onTypingChange?: (isTyping: boolean) => void
}

function makeLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// WhatsApp Cloud API only supports jpeg and png for images.
// webp is excluded: Meta accepts the upload but silently drops delivery.
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png'])

const FILE_TYPES = {
  image: {
    label: 'Imagen',
    accept: 'image/jpeg,image/png',
    maxMB: 5,
    iconColor: '#01A4E3',
  },
  document: {
    label: 'Documento',
    accept: 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    maxMB: 50,
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

function getDocIconInfo(mimeType: string) {
  if (mimeType === 'application/pdf') {
    return { icon: '📕', color: '#FF5B5B', label: 'documento PDF' }
  }
  if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
    return { icon: '📘', color: '#01A4E3', label: 'documento Word' }
  }
  if (mimeType.includes('spreadsheetml') || mimeType.includes('ms-excel')) {
    return { icon: '📗', color: '#00D4AA', label: 'hoja de cálculo Excel' }
  }
  return { icon: '📄', color: '#8B8FA8', label: 'documento' }
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

interface DocxPreviewProps {
  file: File
}

function DocxPreview({ file }: DocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDocx() {
      if (active) {
        setLoading(true)
        setError(null)
      }
      try {
        if (!containerRef.current) return
        containerRef.current.innerHTML = ''
        const { renderAsync } = await import('docx-preview')
        
        if (active && containerRef.current) {
          await renderAsync(file, containerRef.current, undefined, {
            className: 'docx-rendered',
            inWrapper: false,
            ignoreWidth: false,
            ignoreHeight: false,
            experimental: true
          })
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        if (active) {
          setError('No se pudo renderizar la vista previa de Word.')
          setLoading(false)
        }
      }
    }

    loadDocx()

    return () => {
      active = false
    }
  }, [file])

  return (
    <div className="w-full h-full min-h-[420px] max-h-[58vh] overflow-auto rounded-lg border border-[#3A3A37]/30 bg-[#F8F9FA] p-4 sm:p-6 relative docx-preview-scroll">
      <style>{`
        /* Scrollbars inside the preview */
        .docx-preview-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .docx-preview-scroll::-webkit-scrollbar-track {
          background: #F8F9FA;
        }
        .docx-preview-scroll::-webkit-scrollbar-thumb {
          background: #CBD5E0;
          border-radius: 4px;
        }
        .docx-preview-scroll::-webkit-scrollbar-thumb:hover {
          background: #A0AEC0;
        }

        .docx-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          width: 100%;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .docx-container section.docx {
          background: white !important;
          color: #2D3748 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0, 0, 0, 0.05) !important;
          border-radius: 8px !important;
          padding: 24px !important;
          max-width: 800px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          min-height: auto !important;
          margin: 0 auto !important;
        }
        @media (min-width: 640px) {
          .docx-container section.docx {
            padding: 48px !important;
          }
        }
        
        /* Overrides inside docx to look polished and cohesive */
        .docx-container section.docx span, 
        .docx-container section.docx p, 
        .docx-container section.docx h1, 
        .docx-container section.docx h2, 
        .docx-container section.docx h3, 
        .docx-container section.docx h4,
        .docx-container section.docx td,
        .docx-container section.docx th {
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
          color: #1A202C !important;
        }
        
        .docx-container section.docx img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 4px;
        }

        .docx-container section.docx table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 15px 0 !important;
        }

        .docx-container section.docx td,
        .docx-container section.docx th {
          border: 1px solid #E2E8F0 !important;
          padding: 8px !important;
        }
      `}</style>

      {loading && (
        <div className="absolute inset-0 bg-[#2E2E2B]/95 flex flex-col items-center justify-center gap-3 z-20">
          <div className="w-8 h-8 border-4 border-[#01A4E3] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-white/90">Procesando y mejorando vista de Word...</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 bg-[#252522] flex flex-col items-center justify-center text-center p-4 z-20">
          <span className="text-3xl">📘</span>
          <p className="text-sm font-semibold text-white mt-3">{file.name}</p>
          <p className="text-xs text-[#FF5B5B] mt-1">{error}</p>
        </div>
      )}
      <div ref={containerRef} className="docx-container" />
    </div>
  )
}

interface ExcelWorkbook {
  SheetNames: string[]
  Sheets: Record<string, any>
}

interface ExcelPreviewProps {
  file: File
}

function ExcelPreview({ file }: ExcelPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheets, setSheets] = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState<string>('')
  const [sheetHtml, setSheetHtml] = useState<string>('')
  const workbookRef = useRef<ExcelWorkbook | null>(null)

  useEffect(() => {
    let active = true

    async function loadExcel() {
      if (active) {
        setLoading(true)
        setError(null)
      }
      try {
        const { read } = await import('xlsx')
        const arrayBuffer = await file.arrayBuffer()
        const workbook = read(arrayBuffer, { type: 'array' }) as ExcelWorkbook
        workbookRef.current = workbook

        if (active) {
          if (workbook.SheetNames.length === 0) {
            throw new Error('El archivo Excel no contiene hojas.')
          }
          setSheets(workbook.SheetNames)
          const firstSheet = workbook.SheetNames[0]
          setActiveSheet(firstSheet)
          renderSheet(workbook, firstSheet)
        }
      } catch (err) {
        console.error(err)
        if (active) {
          setError('No se pudo renderizar la vista previa de Excel.')
          setLoading(false)
        }
      }
    }

    loadExcel()

    return () => {
      active = false
    }
  }, [file])

  async function renderSheet(workbook: ExcelWorkbook, sheetName: string) {
    try {
      setLoading(true)
      const { utils } = await import('xlsx')
      const worksheet = workbook.Sheets[sheetName]
      
      const html = utils.sheet_to_html(worksheet, {
        editable: false,
        header: '',
        footer: ''
      })

      setSheetHtml(html)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setError('Error al cambiar de hoja.')
      setLoading(false)
    }
  }

  function handleSheetChange(sheetName: string) {
    if (workbookRef.current) {
      setActiveSheet(sheetName)
      renderSheet(workbookRef.current, sheetName)
    }
  }

  return (
    <div className="w-full h-full min-h-[420px] max-h-[58vh] flex flex-col rounded-lg border border-[#3A3A37]/30 bg-[#F8F9FA] relative text-black overflow-hidden">
      <style>{`
        /* Excel Table styling */
        .excel-table-container table {
          border-collapse: collapse !important;
          width: 100% !important;
          font-size: 11px !important;
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
          color: #2D3748 !important;
          background-color: white !important;
        }
        .excel-table-container tr:nth-child(even) {
          background-color: #F7FAFC !important;
        }
        .excel-table-container tr:hover {
          background-color: #EDF2F7 !important;
        }
        .excel-table-container td {
          border: 1px solid #E2E8F0 !important;
          padding: 6px 12px !important;
          white-space: nowrap !important;
          min-width: 60px !important;
          text-align: left !important;
        }
        
        /* Excel sheets tab styling */
        .excel-tabs::-webkit-scrollbar {
          height: 4px;
        }
        .excel-tabs::-webkit-scrollbar-track {
          background: #EDF2F7;
        }
        .excel-tabs::-webkit-scrollbar-thumb {
          background: #CBD5E0;
          border-radius: 2px;
        }
      `}</style>

      {/* Sheets Navigation Bar */}
      {sheets.length > 1 && (
        <div className="excel-tabs flex items-center gap-1.5 px-4 py-2 border-b border-[#E2E8F0] bg-white overflow-x-auto shrink-0 select-none">
          {sheets.map((sheet) => (
            <button
              key={sheet}
              type="button"
              onClick={() => handleSheetChange(sheet)}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border transition shrink-0 ${
                activeSheet === sheet
                  ? 'bg-[#00D4AA] border-[#00D4AA] text-white'
                  : 'bg-[#EDF2F7] border-[#E2E8F0] text-[#4A5568] hover:bg-[#E2E8F0]'
              }`}
            >
              {sheet}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 excel-table-container docx-preview-scroll">
        {loading && (
          <div className="absolute inset-0 bg-[#2E2E2B]/95 flex flex-col items-center justify-center gap-3 z-20">
            <div className="w-8 h-8 border-4 border-[#01A4E3] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-white/90">Cargando datos de Excel...</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-[#252522] flex flex-col items-center justify-center text-center p-4 z-20">
            <span className="text-3xl">📗</span>
            <p className="text-sm font-semibold text-white mt-3">{file.name}</p>
            <p className="text-xs text-[#FF5B5B] mt-1">{error}</p>
          </div>
        )}
        {!loading && !error && (
          // C-01: sanitize HTML generated by xlsx before injection to prevent XSS.
          // xlsx escapes cell content but DOMPurify ensures no event handlers or
          // script nodes can survive in edge cases or future library versions.
          <div
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sheetHtml) }}
            className="w-full inline-block min-w-full"
          />
        )}
      </div>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string, file?: File): string {
  const err = error as { response?: { data?: { detail?: { code?: string; message?: string } } } }
  const code = err.response?.data?.detail?.code
  const backendMsg = err.response?.data?.detail?.message

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
  currentAdvisorName,
  onOptimisticMessage,
  onMessageConfirmed,
  onMessageFailed,
  variant = 'assigned',
  onTypingChange,
}: ChatInputProps) {
  const [text, setText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [recorderState, setRecorderState] = useState<string>('idle')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Reused across a failed send's retry so the same optimistic bubble is
  // updated in place instead of a duplicate "sending" bubble appearing.
  const textRetryLocalIdRef = useRef<string | null>(null)
  const mediaRetryLocalIdRef = useRef<string | null>(null)

  // Auto-focus textarea when switching conversations, loading, or when recording ends
  useEffect(() => {
    if (variant === 'assigned' && recorderState === 'idle') {
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [conversationId, variant, recorderState])

  // Liberar el preview URL al desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

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

  function processFile(file: File) {
    // Detectar el tipo según el mime
    const type = getFileType(file.type)
    if (!type) {
      showError('Tipo de archivo no permitido')
      return
    }
    // WhatsApp only delivers jpeg and png — reject webp before hitting the backend
    if (type === 'image' && !ALLOWED_IMAGE_TYPES.has(file.type)) {
      showError('Solo se permiten imágenes JPEG o PNG. WhatsApp no soporta WebP.')
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

    // Revoke old URL if exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    if (type === 'image' || type === 'video' || type === 'document') {
      setPreviewModalOpen(true)
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
    // Limpiar el input para permitir seleccionar
    // el mismo archivo dos veces
    e.target.value = ''
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    if (variant !== 'assigned' || selectedFile) return
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          processFile(file)
        }
        return
      }
    }
  }

  function removeSelectedFile() {
    setSelectedFile(null)
    setPreviewModalOpen(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)
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
    const trimmed = text.trim()
    const localId = textRetryLocalIdRef.current ?? makeLocalId()
    textRetryLocalIdRef.current = null

    // Paint the bubble immediately — the HTTP round-trip (Meta + Storage + DB)
    // can take a few seconds and shouldn't block the perceived send.
    onOptimisticMessage({
      id: localId,
      conversation_id: conversationId,
      wam_id: null,
      direction: 'outbound_advisor',
      msg_type: 'text',
      content: trimmed,
      media_url: null,
      media_mime_type: null,
      media_size_bytes: null,
      transcription: null,
      delivered_via: 'panel',
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      advisor_name: currentAdvisorName ?? null,
      _localId: localId,
      _status: 'sending',
    })
    setText('')
    setSending(true)
    setSendError(null)

    setTimeout(() => {
      const feed = document.getElementById('chat-message-feed')
      if (feed) feed.scrollTop = feed.scrollHeight
    }, 50)

    try {
      const { message } = await conversationsService.replyText(conversationId, trimmed)
      onMessageConfirmed(localId, message)

      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    } catch (error) {
      onMessageFailed(localId)
      textRetryLocalIdRef.current = localId
      setText(trimmed)
      setSendError(getErrorMessage(error, 'No pudimos enviar el mensaje. Revisa tu conexión e intenta de nuevo.'))
    } finally {
      setSending(false)
    }
  }

  async function handleSend() {
    updateTypingStatus(false)
    if (selectedFile) {
      // PW-5 — enviar multimedia
      const file = selectedFile
      const caption = text.trim() || undefined
      const category = getFileType(file.type) ?? 'document'
      const localId = mediaRetryLocalIdRef.current ?? makeLocalId()
      mediaRetryLocalIdRef.current = null

      // Show the local blob preview as the bubble right away instead of
      // waiting for the file to upload to Storage and be delivered via Meta.
      onOptimisticMessage({
        id: localId,
        conversation_id: conversationId,
        wam_id: null,
        direction: 'outbound_advisor',
        msg_type: category,
        content: caption ?? null,
        media_url: previewUrl,
        media_mime_type: file.type,
        media_size_bytes: file.size,
        transcription: null,
        delivered_via: 'panel',
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        advisor_name: currentAdvisorName ?? null,
        _localId: localId,
        _status: 'sending',
        _fileName: file.name,
      })
      setPreviewModalOpen(false)
      setSending(true)
      setSendError(null)

      setTimeout(() => {
        const feed = document.getElementById('chat-message-feed')
        if (feed) feed.scrollTop = feed.scrollHeight
      }, 50)

      try {
        const { message } = await conversationsService.replyMedia(conversationId, file, caption)
        onMessageConfirmed(localId, message)
        removeSelectedFile()
        setText('')

        setTimeout(() => {
          textareaRef.current?.focus()
        }, 100)
      } catch (error) {
        onMessageFailed(localId)
        mediaRetryLocalIdRef.current = localId
        setSendError(getErrorMessage(error, 'No se pudo enviar el archivo.', file))
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
        className="bg-[#2E2E2B]/50 px-3.5 py-2 border border-[#3A3A37]/50 rounded-lg flex flex-wrap justify-between items-center text-[10px] sm:text-[11px] text-[#8B8FA8] shadow-sm"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#01A4E3] animate-pulse" />
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
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-[#2E2E2B]/95 border border-[#3A3A37] rounded-xl text-xs shadow-lg gap-3 animate-fade-in"
        >
          <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto">
            {/* Contenedor del Preview más grande para Imagen/Video */}
            {(activeCategory === 'image' || activeCategory === 'video') ? (
              <div className="w-24 h-24 sm:w-32 sm:h-20 rounded-lg overflow-hidden border border-white/10 bg-black flex-shrink-0 relative shadow">
                {activeCategory === 'image' ? (
                  <img
                    src={previewUrl ?? ''}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={previewUrl ?? ''}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                )}
              </div>
            ) : (
              // Documento
              <div className={`w-12 h-12 rounded-lg border flex items-center justify-center flex-shrink-0 shadow-sm ${FILE_ICON_COLORS[activeCategory]}`}>
                <FileIcon category={activeCategory} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-white font-bold truncate max-w-[200px] sm:max-w-[300px]" id="file-preview-name">
                {selectedFile.name}
              </p>
              <p className="text-[#8B8FA8] text-[10px] mt-0.5" id="file-preview-size">
                {formatFileSize(selectedFile.size)} • {getFileLabel(selectedFile.type)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeSelectedFile}
            className="text-[#8B8FA8] hover:text-[#FF5B5B] hover:bg-[#FF5B5B]/10 p-2 rounded-lg transition active:scale-95 flex-shrink-0 self-end sm:self-center border border-transparent hover:border-[#FF5B5B]/20"
            title="Quitar archivo"
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
        className="relative flex items-start bg-[#2E2E2B]/85 border border-[#3A3A37] rounded-xl focus-within:border-[#01A4E3] focus-within:ring-1 focus-within:ring-[#01A4E3]/25 shadow-inner transition duration-200 p-2 gap-2"
      >
        {/* Attach button + dropdown */}
        {recorderState === 'idle' && (
          <div ref={attachMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={toggleAttachMenu}
              disabled={variant !== 'assigned' || sending || selectedFile !== null}
              className="p-2.5 text-[#8B8FA8] hover:text-white hover:bg-[#3A3A37] rounded-lg transition active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              title="Adjuntar archivo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {attachMenuOpen && (
              <div
                id="attach-menu"
                className="absolute bottom-full left-0 mb-2 bg-[#252522] border border-[#3A3A37] rounded-xl shadow-2xl z-50 w-36 overflow-hidden animate-fade-in"
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
          currentAdvisorName={currentAdvisorName}
          onOptimisticMessage={onOptimisticMessage}
          onMessageConfirmed={onMessageConfirmed}
          onMessageFailed={onMessageFailed}
          disabled={variant !== 'assigned'}
          onStateChange={setRecorderState}
        />

        {recorderState === 'idle' && (
          <>
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              disabled={sending || variant !== 'assigned'}
              onChange={(e) => {
                const val = e.target.value
                if (val.length > 2000) {
                  setText(val.slice(0, 2000))
                  showError('El mensaje supera el límite de 2000 caracteres.')
                } else {
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
              onPaste={handlePaste}
              placeholder={
                selectedFile
                  ? 'Añade una descripción opcional...'
                  : 'Escribe tu respuesta... (Enter para enviar, Shift+Enter para nueva línea)'
              }
              className="flex-1 bg-transparent outline-none border-none text-xs text-white placeholder-[#8B8FA8]/70 resize-none h-11 px-1 py-1 max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Counter + send */}
            <div className="flex items-center space-x-2 pl-2 border-l border-[#3A3A37] shrink-0">
              <span className="text-[10px] text-[#8B8FA8] font-mono">{text.length}/2000</span>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || variant !== 'assigned' || (!text.trim() && !selectedFile)}
                className="bg-[#01A4E3] hover:bg-[#0190C8] active:scale-95 text-white p-2.5 rounded-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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

      {/* Media Preview Modal Overlay */}
      {previewModalOpen && selectedFile && previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fade-in" onClick={removeSelectedFile}>
          <div 
            className={`bg-[#252522] border border-[#3A3A37] rounded-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up transition-all duration-300 ${
              activeCategory === 'document' ? 'max-w-4xl' : 'max-w-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#3A3A37] flex items-center justify-between bg-[#2E2E2B]/60">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Confirmar envío de {activeCategory === 'image' ? 'imagen' : activeCategory === 'video' ? 'video' : getDocIconInfo(selectedFile.type).label}
              </h3>
              <button
                type="button"
                onClick={removeSelectedFile}
                className="text-[#8B8FA8] hover:text-white transition p-1.5 rounded-lg hover:bg-[#FF5B5B]/10 active:scale-95 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Media Display */}
            <div className={`flex-1 bg-black/45 flex items-center justify-center p-6 overflow-hidden relative transition-all duration-300 ${
              activeCategory === 'document' 
                ? 'min-h-[450px] h-[60vh] max-h-[65vh]' 
                : 'min-h-[250px] max-h-[50vh]'
            }`}>
              {activeCategory === 'image' ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-[45vh] rounded-lg object-contain shadow-md animate-fade-in"
                />
              ) : activeCategory === 'video' ? (
                <video
                  src={previewUrl}
                  controls
                  preload="auto"
                  playsInline
                  className="max-w-full max-h-[45vh] rounded-lg object-contain shadow-md bg-black animate-fade-in"
                />
              ) : selectedFile.type === 'application/pdf' ? (
                /* PDF Preview using iframe */
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  className="w-full h-full min-h-[420px] max-h-[58vh] rounded-lg border border-[#3A3A37]/20 bg-white shadow-md animate-fade-in"
                />
              ) : selectedFile.type.includes('word') || selectedFile.type.includes('msword') ? (
                /* Word Preview using DocxPreview component */
                <DocxPreview file={selectedFile} />
              ) : selectedFile.type.includes('spreadsheetml') || selectedFile.type.includes('excel') ? (
                /* Excel Preview using ExcelPreview component */
                <ExcelPreview file={selectedFile} />
              ) : (
                /* Document Preview Card (Excel or others) */
                <div className="flex flex-col items-center justify-center p-8 bg-[#252522]/90 border border-[#3A3A37] rounded-xl text-center gap-4 max-w-sm w-full shadow-2xl animate-scale-up">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl shadow-inner relative"
                    style={{
                      backgroundColor: `${getDocIconInfo(selectedFile.type).color}20`
                    }}
                  >
                    <div 
                      className="absolute inset-0 rounded-xl filter blur-md opacity-30 animate-pulse"
                      style={{
                        backgroundColor: getDocIconInfo(selectedFile.type).color
                      }}
                    />
                    <span className="relative z-10">{getDocIconInfo(selectedFile.type).icon}</span>
                  </div>
                  <div className="space-y-1.5 w-full">
                    <p className="text-sm font-semibold text-[#F0F0F5] break-all px-2 line-clamp-2">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-[#8B8FA8]">
                      {getDocIconInfo(selectedFile.type).label.charAt(0).toUpperCase() + getDocIconInfo(selectedFile.type).label.slice(1)} • {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Info & Caption Input */}
            <div className="p-4 border-t border-[#3A3A37] bg-[#2E2E2B]/40 space-y-3">
              <div className="flex items-center justify-between text-[10px] text-[#8B8FA8]">
                <span className="truncate max-w-[320px] font-semibold text-white/90">{selectedFile.name}</span>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>

              <div className="flex items-center gap-2 bg-[#252522] border border-[#3A3A37] rounded-xl px-3 py-2 focus-within:border-[#01A4E3] focus-within:ring-1 focus-within:ring-[#01A4E3]/25 transition duration-200 shadow-inner">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Añade un comentario o descripción (opcional)..."
                  className="flex-1 bg-transparent text-xs text-white outline-none placeholder-[#8B8FA8]/70"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={removeSelectedFile}
                  className="px-4 py-2 text-xs font-semibold text-[#8B8FA8] hover:text-white transition rounded-xl hover:bg-white/5 active:scale-95 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className="bg-[#01A4E3] hover:bg-[#0190C8] active:scale-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
                >
                  {sending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar</span>
                      <svg className="w-3.5 h-3.5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
