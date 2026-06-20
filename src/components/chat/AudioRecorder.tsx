import { useEffect, useRef, useState } from 'react'
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  async function startRecording() {
    setState('requesting_permission')
    setErrorMessage(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })
      streamRef.current = stream

      const mimeType = getSupportedMimeType()
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        setState('preview')
        stopTimer()
        releaseStream()
      }

      recorder.start(100) // chunk every 100ms
      setState('recording')
      startTimer()
    } catch (error) {
      const err = error as { name?: string }
      if (err.name === 'NotAllowedError') {
        setErrorMessage('Debes permitir el acceso al micrófono para enviar audios')
      } else {
        setErrorMessage('No se pudo acceder al micrófono')
      }
      setState('error')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  function cancelRecording() {
    stopTimer()
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    releaseStream()
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
    } catch {
      setErrorMessage('No se pudo enviar el audio. Intenta de nuevo.')
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

  function releaseStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  function getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]
    return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm'
  }

  function formatTime(seconds: number): string {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
    const ss = String(seconds % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
      releaseStream()
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
        onClick={() => setState('idle')}
        className="text-[10px] text-[#8B8FA8] hover:text-white underline"
      >
        Reintentar
      </button>
    </div>
  )
}
