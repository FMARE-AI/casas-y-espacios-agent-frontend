# Spec: Conectar envío de mensajes (texto, media, audio)

## Problem

En la interfaz de chat de Casas y Espacios Agent, el envío de mensajes de texto, archivos multimedia (imágenes, videos, documentos) y notas de voz (audio) no está conectado con la API del backend. Los métodos `replyText`, `replyMedia` y `replyAudio` en `conversationsService` lanzan un error `NOT IMPLEMENTED`.

Esto impide que los asesores se comuniquen con los clientes a través de WhatsApp, limitando el panel a un visor de solo lectura.

## Goals

- Implementar `conversationsService.replyText()` con `POST /conversations/{id}/reply`.
- Implementar `conversationsService.replyMedia()` con `POST /conversations/{id}/reply/media` (multipart/form-data).
- Implementar `conversationsService.replyAudio()` con `POST /conversations/{id}/reply/audio` (multipart/form-data).
- Conectar la UI de `ChatInput.tsx` y `AudioRecorder.tsx` para invocar estos servicios según corresponda.
- Manejar adecuadamente todos los códigos de error devueltos por el backend (`BOT_IS_ACTIVE`, `NOT_ASSIGNED`, `FILE_TOO_LARGE`, `FILE_TYPE_NOT_ALLOWED`, `META_API_ERROR`, `STORAGE_ERROR`).
- Agregar el mensaje enviado exitosamente al feed del chat localmente utilizando el objeto retornado en la respuesta.
- Limpiar el input/archivo/audio y realizar scroll al último mensaje tras un envío exitoso.
- Mostrar mensajes descriptivos en caso de error y mantener el contenido del input o archivo para permitir el reintento.

## Non-Goals

- Modificar la UI de visualización de los mensajes en el feed (`MessageBubble.tsx`).
- Modificar el backend o el webhook.
- Implementar el historial de mensajes o paginación (esto ya está resuelto en tareas previas).

## Expected Behavior

### 1. Envío de Texto (`replyText`)
- Al escribir texto y presionar Enter o el botón de enviar:
  - Invocar `POST /api/v1/panel/conversations/{id}/reply` con body `{ "text": string }`.
  - En caso de éxito (200), agregar el mensaje retornado a la conversación, limpiar el input y hacer scroll hacia abajo.
  - En caso de error, mostrar el banner de error con el código correspondiente mapeado a un mensaje amigable y ofrecer la opción de reintentar. El texto no debe limpiarse del textarea.

### 2. Envío de Multimedia (`replyMedia`)
- Al seleccionar una imagen, video o documento y presionar enviar:
  - Invocar `POST /api/v1/panel/conversations/{id}/reply/media` con un cuerpo `FormData` que contenga el archivo.
  - No setear manualmente el header `Content-Type` para permitir al navegador definir el multipart boundary correcto.
  - Validar límites locales de tamaño (5MB imágenes, 16MB videos, 20MB documentos) y MIME types permitidos.
  - En caso de error del backend (como `FILE_TOO_LARGE` o `FILE_TYPE_NOT_ALLOWED`), mostrar el banner con el límite correspondiente en MB.
  - En caso de éxito, limpiar el archivo seleccionado y hacer scroll hacia abajo.

### 3. Envío de Audio/Notas de Voz (`replyAudio`)
- Al grabar una nota de voz usando el componente `AudioRecorder`:
  - El navegador graba en un formato compatible (usualmente `audio/webm`).
  - Convertir o forzar el blob de audio al tipo `audio/ogg` y llamarlo `voice_note.ogg` para compatibilidad con WhatsApp y backend.
  - Invocar `POST /api/v1/panel/conversations/{id}/reply/audio` con `FormData` enviando el blob convertido.
  - Manejar el estado de carga (`sending`), éxito (limpiar y resetear el grabador), y error (mostrar error de audio con botón de reintento).

## Constraints

- Usar `apiClient` de `src/lib/axios.ts` para todas las llamadas HTTP.
- Evitar setear manualmente `Content-Type` en Axios para peticiones multipart. En Axios, definir `headers: { 'Content-Type': undefined }` sobreescribe el header predeterminado `application/json` y permite la detección automática de FormData.
- Las trazas y mensajes al usuario final deben estar en español.
- Pasar `npx tsc --noEmit` exitosamente.
