# Design: Audio Recording Component

## Overview
This design implements a microphone button and inline audio recorder embedded directly inside the chat input bar. It records audio using the standard browser `MediaRecorder` API, allows native controls preview, and handles backend replies via the existing `conversationsService.replyAudio`.

## Components

### New / Modified Files
| File | Role | Change type |
|------|------|-------------|
| [AudioRecorder.tsx](file:///C:/Users/Antho/Downloads/casas-y-espacios-agent-frontend/src/components/chat/AudioRecorder.tsx) | Main component handling permissions, recording lifecycle, visual sub-states, and upload API calls. | Create |
| [ChatInput.tsx](file:///C:/Users/Antho/Downloads/casas-y-espacios-agent-frontend/src/components/chat/ChatInput.tsx) | Integration of the `<AudioRecorder />` component in the typing bar. | Modify |

### Key Abstractions
- **AudioRecorder**: Receives `conversationId`, `onAudioSent`, and `disabled`. Manages state machine `RecorderState`:
  - `idle`: Microphone icon.
  - `requesting_permission`: Spinner waiting for user permission.
  - `recording`: Displays recording timer, warning label if remaining time < 30s, and a Stop button.
  - `preview`: Native playback audio preview, Send button, and Cancel/Close button.
  - `sending`: Upload progress indicator.
  - `error`: Error message panel and a Retry button.

### Data Flow
1. User clicks the Microphone button (state = `'idle'`).
2. Browser triggers prompt for mic permission (state = `'requesting_permission'`).
3. If permission granted, `MediaRecorder` starts, timer ticks every second (state = `'recording'`).
4. Timer hits 5m limit or user clicks Stop button: `MediaRecorder` stops.
5. Media chunks are assembled into a single Blob, URL created using `URL.createObjectURL(blob)` (state = `'preview'`).
6. User clicks Send: call `conversationsService.replyAudio(conversationId, blob)` (state = `'sending'`).
7. Once finished, calls `onAudioSent(message)` and resets back to `'idle'`.
8. User clicks Cancel: release mic stream, revoke URL, reset to `'idle'`.

### API / Interface Contracts

#### [AudioRecorderProps](file:///C:/Users/Antho/Downloads/casas-y-espacios-agent-frontend/src/components/chat/AudioRecorder.tsx#L9-L13)
```typescript
interface AudioRecorderProps {
  conversationId: string
  onAudioSent: (message: Message) => void
  disabled?: boolean
}
```

#### [ChatInputProps](file:///C:/Users/Antho/Downloads/casas-y-espacios-agent-frontend/src/components/chat/ChatInput.tsx#L5-L12)
```typescript
interface ChatInputProps {
  conversationId: string
  clientName: string
  channel: string
  waitMinutes: number | null
  onMessageSent: (message: Message) => void
  onError: () => void
  variant?: string // Defaults to 'assigned'
}
```

### Edge Cases & Error Handling
- **Mic Permission Denied**: transition to `'error'` and display `"Debes permitir el acceso al micrófono para enviar audios"`.
- **Mic Disconnected during Recording**: fallback generic error display.
- **Upload Failures**: transition to `'error'` with `"No se pudo enviar el audio. Intenta de nuevo."`.
- **Component Unmounting**: clear the recording interval and call `track.stop()` on all tracks to release hardware resources, and revoke blob URLs to avoid memory leaks.
