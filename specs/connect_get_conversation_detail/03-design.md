# Technical Design: Connect GET /conversations/{id} (TASK-4)

## Proposed Changes

### 1. TypeScript Types (`src/types/index.ts`)
Add the `transcription` property to the `Message` interface:
```typescript
export interface Message {
  id: string
  wam_id: string | null
  direction: MessageDirection
  msg_type: MessageType
  content: string | null
  media_url: string | null
  media_mime_type: string | null
  media_size_bytes: number | null
  transcription?: string | null // Whisper transcription for audio notes
  timestamp: string
  delivered_via: string
}
```

### 2. Service Implementations (`src/services/conversations.ts`)
Update `getById` and `getMessages` to make backend API calls using the authenticated `apiClient`:
```typescript
  async getById(id: string): Promise<{ conversation: Conversation; messages: Message[]; total_messages: number }> {
    const { data } = await apiClient.get(`/api/v1/panel/conversations/${id}`, {
      params: { limit: 50, offset: 0 },
    })
    const conversation = data.data.conversation
    return {
      conversation,
      messages: conversation.messages || [],
      total_messages: conversation.total_messages || 0,
    }
  },

  async getMessages(id: string, params?: PaginationParams): Promise<PaginatedMessages> {
    const { data } = await apiClient.get(`/api/v1/panel/conversations/${id}/messages`, { params })
    return data.data
  },
```

### 3. Chat Variant Logic (`src/pages/ChatPage.tsx`)
Refine the `getChatVariant` logic to match the business specifications exactly:
```typescript
  function getChatVariant(): ChatVariant {
    if (role === 'admin') return 'monitoring'
    if (!conversation) return 'unassigned'
    if (conversation.bot_activo) return 'bot'
    if (conversation.escalation?.advisor?.id === advisor?.id) return 'assigned'
    return 'unassigned'
  }
```

### 4. Message Type Rendering (`src/components/chat/MessageBubble.tsx`)
Modify `BubbleContent` and message bubbles to render media based on `msg_type` and use the signed `media_url` directly:
- **Audio Bubble:**
  Render the standard audio player. If a transcription is present, add a disclosure toggle (`<details>`) or small interactive button to show/hide the transcription, styling it neatly.
- **Image Bubble:**
  Render `<img src={media_url} />`.
- **Video Bubble:**
  Render `<video src={media_url} controls />`.
- **Document Bubble:**
  Render the file name or a default "Descargar documento" text with a download link (`<a href={media_url} target="_blank" />`).

### 5. Scroll Position Preservation (`src/pages/ChatPage.tsx`)
Update `loadMoreMessages` to:
1. Capture `feedRef.current.scrollHeight` prior to fetching/updating state.
2. Prepend the messages to the state: `setMessages((prev) => [...older, ...prev])`.
3. Wait for the browser layout pass using `requestAnimationFrame` (or nested `requestAnimationFrame`), then set `container.scrollTop = container.scrollHeight - prevScrollHeight`.
```typescript
  async function loadMoreMessages() {
    if (isLoadingMore || messages.length >= totalMessages) return
    const container = feedRef.current
    const prevScrollHeight = container ? container.scrollHeight : 0
    setIsLoadingMore(true)
    try {
      const { messages: older } = await conversationsService.getMessages(
        conversationId!,
        { limit: 50, offset: messages.length }
      )
      setMessages((prev) => [...older, ...prev])
      
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight
        }
      })
    } catch {
      // silently fail
    } finally {
      setIsLoadingMore(false)
    }
  }
```
