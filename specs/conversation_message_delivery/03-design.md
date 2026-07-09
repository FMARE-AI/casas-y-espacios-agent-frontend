# Design: Conectar envío de mensajes (texto, media, audio)

## 1. Services Changes (`src/services/conversations.ts`)

Actualizar los métodos `replyText`, `replyMedia` y `replyAudio` en `conversationsService` para invocar al backend usando `apiClient`:

```typescript
  async replyText(id: string, text: string): Promise<{ message: Message }> {
    const { data } = await apiClient.post(`/api/v1/panel/conversations/${id}/reply`, { text })
    return data.data
  },

  async replyMedia(id: string, file: File, caption?: string): Promise<{ message: Message }> {
    const formData = new FormData()
    formData.append('file', file)
    if (caption) {
      formData.append('caption', caption)
    }
    const { data } = await apiClient.post(`/api/v1/panel/conversations/${id}/reply/media`, formData, {
      headers: {
        'Content-Type': undefined,
      },
    })
    return data.data
  },

  async replyAudio(id: string, file: Blob): Promise<{ message: Message }> {
    const formData = new FormData()
    // Forzamos el tipo MIME a audio/ogg para compatibilidad
    const audioFile = new Blob([file], { type: 'audio/ogg' })
    formData.append('file', audioFile, 'voice_note.ogg')
    const { data } = await apiClient.post(`/api/v1/panel/conversations/${id}/reply/audio`, formData, {
      headers: {
        'Content-Type': undefined,
      },
    })
    return data.data
  },
```

## 2. Component Changes (`src/components/chat/ChatInput.tsx`)

### 2.1 Mapeo de errores y lógica de envío
Agregar la función helper `getErrorMessage` para procesar y personalizar los mensajes de error:

```typescript
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
```

### 2.2 Actualización de `sendTextMessage` y `handleSend`
Asegurarse de limpiar inputs únicamente tras envíos exitosos, realizar auto-scroll del contenedor `#chat-message-feed` y capturar los errores de manera amigable:

```typescript
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
      setSending(true)
      setSendError(null)
      try {
        const { message } = await conversationsService.replyMedia(conversationId, selectedFile)
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
      await sendTextMessage()
    }
  }
```

## 3. Component Changes (`src/components/chat/AudioRecorder.tsx`)

Actualizar la función `sendAudio` para capturar errores, mostrar mensajes descriptivos y proveer un botón de "Reintentar" que no destruya la grabación previa:

```typescript
  async function sendAudio() {
    if (!audioBlob) return
    setState('sending')
    try {
      const { message } = await conversationsService.replyAudio(conversationId, audioBlob)
      onAudioSent(message)
      cancelRecording() // Limpia el estado solo al completarse con éxito
      
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
```

Modificar el renderizado del estado de error para permitir la reintentación directa:

```typescript
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
```
