# Clarification: Conectar envío de mensajes (texto, media, audio)

## Q&A and Design Decisions

### 1. Formato de Audio del Navegador y Backend
**Pregunta:** El grabador del navegador (`AudioRecorder.tsx`) graba como `audio/webm` (u otro formato soportado por el navegador), pero el backend solo permite `audio/ogg`, `audio/mpeg`, `audio/mp4`, `audio/aac`, `audio/amr`. ¿Cómo resolver esto?
**Decisión:** Convertiremos el Blob de audio en el frontend cambiando explícitamente su tipo MIME a `audio/ogg` al instanciar el nuevo Blob `new Blob([file], { type: 'audio/ogg' })` y adjuntándolo al `FormData` con el nombre de archivo `voice_note.ogg`. Esto fuerza al navegador a enviar el header `Content-Type: audio/ogg` para la parte del archivo multipart, cumpliendo con la validación de tipo MIME del backend.

### 2. Auto-scroll en ChatInput
**Pregunta:** Tras un envío exitoso, ¿cómo hacemos scroll al último mensaje? El feed del chat (`MessageFeed.tsx`) expone un `feedRef` pero éste es controlado internamente por `ChatPage.tsx` y no está expuesto a `ChatInput.tsx`.
**Decisión:** En lugar de modificar `ChatPage.tsx` para agregar scroll callbacks adicionales, `ChatInput` y `AudioRecorder` buscarán el contenedor de mensajes en el DOM mediante el ID `chat-message-feed` (el cual está definido en `MessageFeed.tsx`) y actualizarán su `scrollTop = scrollHeight` después de que el mensaje sea enviado exitosamente. Esto mantiene el principio de mínima modificación de archivos.

### 3. Evitar Content-Type en Axios
**Pregunta:** ¿Cómo nos aseguramos de que Axios no envíe `Content-Type: application/json` al enviar `FormData`?
**Decisión:** Axios tiene un header por defecto `Content-Type: application/json` en `apiClient` (`src/lib/axios.ts`). Para anularlo y permitir que el navegador genere automáticamente la cabecera `Content-Type: multipart/form-data; boundary=...`, pasaremos `headers: { 'Content-Type': undefined }` en las opciones de configuración de la petición. Axios descarta las cabeceras con valor `undefined`, lo que obliga al cliente HTTP subyacente (el navegador) a autodetectar el tipo `FormData` y agregar el boundary correcto.
