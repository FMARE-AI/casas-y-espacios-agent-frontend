import { useEffect, useRef, useState } from 'react'
// @ts-ignore
import MicRecorder from 'mic-recorder-to-mp3-fixed'
import { conversationsService } from '../../services/conversations'
import type { Message } from '../../types'

interface AudioRecorderProps {
  conversationId: string
  onAudioSent: (message: Message) => void
  disabled?: boolean
  onStateChange?: (state: RecorderState) => void
}

type RecorderState =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'preview'
  | 'sending'
  | 'error'

const MAX_DURATION_SECONDS = 300 // 5 minutes

export default function AudioRecorder({
  conversationId,
  onAudioSent,
  disabled = false,
  onStateChange,
}: AudioRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const recorderRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // @ts-ignore
    recorderRef.current = new MicRecorder({ bitRate: 128 })
  }, [])

  async function startRecording() {
    setState('requesting_permission')
    setErrorMessage(null)

    try {
      await recorderRef.current.start()
      setState('recording')
      startTimer()
    } catch (error: any) {
      if (error?.name === 'NotAllowedError') {
        setErrorMessage('Debes permitir el acceso al micrófono para enviar audios')
      } else {
        setErrorMessage('No se pudo acceder al micrófono')
      }
      setState('error')
    }
  }

  function stopRecording() {
    if (!recorderRef.current) return
    recorderRef.current
      .stop()
      .getMp3()
      .then(([buffer, blob]: [any, Blob]) => {
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        setState('preview')
        stopTimer()
      })
      .catch((err: any) => {
        setErrorMessage('Error al detener la grabación')
        setState('error')
        stopTimer()
      })
  }

  function cancelRecording() {
    stopTimer()
    try {
      if (recorderRef.current) {
        recorderRef.current.stop()
      }
    } catch {}
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setElapsedSeconds(0)
    setState('idle')
  }

  async function sendAudio() {
    if (!audioBlob) return
    setState('sending')
    try {
      const { message } = await conversationsService.replyAudio(conversationId, audioBlob)
      onAudioSent(message)
      cancelRecording() // Clear state after success

      // Auto scroll to bottom
      setTimeout(() => {
        const feed = document.getElementById('chat-message-feed')
        if (feed) feed.scrollTop = feed.scrollHeight
      }, 50)
    } catch (error) {
      const err = error as { response?: { data?: { detail?: { code?: string } } } }
      const code = err.response?.data?.detail?.code
      if (code === 'FILE_TOO_LARGE') {
        setErrorMessage('El audio supera el límite de 16MB')
      } else if (code === 'FILE_TYPE_NOT_ALLOWED') {
        setErrorMessage('Tipo de audio no permitido')
      } else if (code === 'META_API_ERROR') {
        setErrorMessage('No se pudo enviar el audio a WhatsApp. Intenta nuevamente.')
      } else if (code === 'STORAGE_ERROR') {
        setErrorMessage('Error al subir el audio a almacenamiento. Intenta de nuevo.')
      } else if (code === 'BOT_IS_ACTIVE') {
        setErrorMessage('El bot tiene el control de esta conversación.')
      } else if (code === 'NOT_ASSIGNED') {
        setErrorMessage('No estás asignado a esta conversación.')
      } else {
        setErrorMessage('No se pudo enviar el audio. Intenta de nuevo.')
      }
      setState('error')
    }
  }

  function startTimer() {
    setElapsedSeconds(0)
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1
        if (next >= MAX_DURATION_SECONDS) {
          stopRecording()
          return prev
        }
        return next
      })
    }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // Stream release is managed by mic-recorder-to-mp3 internally

  function formatTime(seconds: number): string {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  // Notify state changes to parent
  useEffect(() => {
    onStateChange?.(state)
  }, [state, onStateChange])

  // RENDER PER STATE
  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled}
        className="p-2 text-[#8B8FA8] hover:text-white hover:bg-[#3A3A37] rounded transition disabled:opacity-40 disabled:cursor-not-allowed"
        title="Grabar audio"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>
    )
  }

  if (state === 'requesting_permission') {
    return (
      <div className="p-2">
        <div className="w-4 h-4 border-2 border-[#01A4E3] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (state === 'recording') {
    return (
      <div className="flex items-center gap-2 px-2">
        <span className="w-2 h-2 rounded-full bg-[#FF5B5B] animate-pulse" />
        <span className="text-[#FF5B5B] text-xs font-mono font-bold">
          {formatTime(elapsedSeconds)}
        </span>
        {elapsedSeconds >= MAX_DURATION_SECONDS - 30 && (
          <span className="text-[#FFB84D] text-[10px]">
            Límite próximo
          </span>
        )}
        <button
          type="button"
          onClick={stopRecording}
          className="p-1.5 bg-[#FF5B5B]/10 hover:bg-[#FF5B5B]/20 border border-[#FF5B5B]/30 rounded text-[#FF5B5B] transition"
          title="Detener grabación"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </button>
      </div>
    )
  }

  if (state === 'preview') {
    return (
      <div className="flex items-center gap-2 px-2 w-full">
        <audio
          src={audioUrl!}
          controls
          className="h-8 flex-1 min-w-0"
          style={{ accentColor: '#01A4E3' }}
        />
        <button
          type="button"
          onClick={sendAudio}
          className="p-2 bg-[#01A4E3] hover:bg-[#0190C8] text-white rounded transition shrink-0"
          title="Enviar audio"
        >
          <svg className="w-3.5 h-3.5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
        <button
          type="button"
          onClick={cancelRecording}
          className="p-2 text-[#8B8FA8] hover:text-[#FF5B5B] hover:bg-[#FF5B5B]/10 rounded transition shrink-0"
          title="Cancelar"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  if (state === 'sending') {
    return (
      <div className="flex items-center gap-2 px-2">
        <div className="w-3.5 h-3.5 border-2 border-[#01A4E3] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#8B8FA8] text-xs">Enviando audio...</span>
      </div>
    )
  }

  // error state
  return (
    <div className="flex items-center gap-2 px-2">
      <span className="text-[#FF5B5B] text-xs">{errorMessage}</span>
      <button
        type="button"
        onClick={sendAudio}
        className="text-[10px] text-[#01A4E3] hover:text-[#0190C8] font-bold uppercase transition"
      >
        Reintentar
      </button>
      <button
        type="button"
        onClick={cancelRecording}
        className="text-[10px] text-[#8B8FA8] hover:text-[#FF5B5B] transition ml-1"
      >
        Cancelar
      </button>
    </div>
  )
}
