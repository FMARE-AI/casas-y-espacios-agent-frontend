# Design: Transferir Conversación

## Overview
This feature introduces a conversation transfer capability in the frontend. It allows the currently assigned advisor (or an admin) to transfer an active conversation to another available advisor. The layout changes include adding a "Transferir" button to the `ClientPanel`, creating a `TransferModal` component that lists active available advisors, updating the API client, and handling real-time WebSocket events (`conversation.transferred`).

## Components

### New / Modified Files

| File | Role | Change type |
|------|------|-------------|
| `src/types/index.ts` | Define `WSConversationTransferred` type and add `onConversationTransferred` to `WSHandlers`. | Modify |
| `src/services/conversations.ts` | Add `transfer` method calling `POST /api/v1/panel/conversations/{id}/transfer`. | Modify |
| `src/hooks/useWebSocket.ts` | Register `onConversationTransferred` callback and handle `conversation.transferred` event (chime sound for Advisor B, updating `myAssignedConversationIds`). | Modify |
| `src/components/chat/ClientPanel.tsx` | Add "Transferir" button with correct rendering conditions and `onTransfer` trigger. | Modify |
| `src/components/chat/TransferModal.tsx` | Create the transfer selection overlay modal with advisor listing, search/filter, reason text area, loading states, and cancellation handles. | Create |
| `src/pages/ChatPage.tsx` | Add state for `showTransferModal`, instantiate `<TransferModal />`, define transfer request handlers, and add `onConversationTransferred` WebSocket callback. | Modify |
| `src/pages/BandejaPage.tsx` | Add `onConversationTransferred` to `useWebSocket` parameters to trigger `loadConversations()`. | Modify |

### Key Abstractions

#### `TransferModal` Component (`src/components/chat/TransferModal.tsx`)
- Props:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onConfirm: (targetAdvisorId: string, reason: string | null) => Promise<void>`
  - `currentAdvisorId?: string`
  - `currentAssignedAdvisorId?: string`
- State:
  - `advisors: Advisor[]` (fetched on mount via `advisorsService.list()`)
  - `selectedAdvisorId: string | null`
  - `reason: string` (text field state)
  - `loading: boolean` (fetching advisors)
  - `submitting: boolean` (sending API request)
  - `error: string | null` (API error output)

### Data Flow

1. **User interaction**: An advisor/admin clicks "Transferir" on the `ClientPanel`.
2. **State trigger**: `showTransferModal` state is set to `true` in `ChatPage.tsx`.
3. **Fetch Available Advisors**: `TransferModal` mounts, calls `advisorsService.list()`.
4. **Filtering**:
   - `is_active === true`
   - `availability_status === 'available'`
   - `id !== currentAssignedAdvisorId`
   - `active_conversations < max_conversations`
5. **Selection & Action**: The user selects a target advisor, optionally enters a reason, and clicks "Confirmar transferencia".
6. **API Call**: `conversationsService.transfer(id, { target_advisor_id, reason })` is fired.
   - **Success (200)**: Close modal, trigger success toast, navigate back to `/bandeja`.
   - **Error**: API exception is caught, displayed in modal, modal stays open.
7. **Real-time Event**: WebSocket broadcast `conversation.transferred` is received by all clients:
   - **Advisor A (transferer)**: Navigates to `/bandeja` if in chat. Inbox removes the card automatically during list refresh.
   - **Advisor B (recipient)**: Plays chime sound, sets conversation as assigned to them, inbox lists the card on refresh.
   - **Admin**: Card shows reassignment.

### API / Interface Contracts

#### Service Method:
```typescript
async transfer(id: string, body: { target_advisor_id: string; reason?: string | null }): Promise<any> {
  const { data } = await apiClient.post(`/api/v1/panel/conversations/${id}/transfer`, body)
  return data.data
}
```

#### WebSocket Interface:
```typescript
export interface WSConversationTransferred {
  conversation_id: string
  source_advisor_id: string
  target_advisor_id: string
  target_advisor_name: string
  reason?: string | null
  channel?: string
}
```

### Edge Cases & Error Handling
- **No Advisors Available**: If the filtered advisor list is empty, show the empty state message: *"No hay asesores disponibles en este momento. Intenta de nuevo en unos minutos."* with a Cancel button.
- **Escape Key Prevention**: Listen to keydown event inside `TransferModal` to prevent the Escape key from closing the modal (consistent with `CloseConversationModal` / `ReturnBotModal`).
- **Endpoint 404/Not Implemented**: If the backend endpoint has not been deployed yet, fallback mock handles in the API client will catch it and resolve gracefully, or output a clear mock notification.

## Open Questions for Implementation
None. Design matches the requested details exactly.
