# 03 - Technical Design

## Files to Modify
1. `src/pages/BandejaPage.tsx`
2. `src/components/bandeja/ConversationCard.tsx` (New)
3. `src/components/bandeja/FilterBar.tsx` (New)
4. `src/components/bandeja/MetricsDashboard.tsx` (New)
5. `src/index.css`

## Component Breakdown

1. **`BandejaPage.tsx`**
   - **State**:
     - `conversations` (Array of Conversation), `total` (number), `isLoading` (boolean).
     - `statusFilter`, `channelFilter` for filtering logic.
     - `takeTarget` (conversation to be taken), `isTaking` (boolean).
   - **Local Components**:
     - `ConnectedAdvisors`: Static placeholder matching `id="connected-advisors-panel"`.
     - `TakeModal`: Confirmation dialog to assign a conversation.
     - `SkeletonCard`: Loading state.
     - `EmptyState`: UI when no conversations are found.
   - **Data Fetching**: `loadConversations()` called in `useEffect` when filters change. Uses `conversationsService.list(...)`.
   - **Take Logic**: Handles `MAX_CONVERSATIONS_REACHED` and `ALREADY_ASSIGNED` errors properly.

2. **`ConversationCard.tsx`**
   - Evaluates variant (A, A2, B, C) based on conversation status and advisor presence.
   - Wait time is dynamically calculated using `Date.now()` vs `escalation.escalated_at`.
   - Renders exact Tailwind classes depending on the variant.
   - Triggers `onTake` callback for variants A and A2.
   - Disables "Atender ya" button and shows a tooltip if the advisor has reached their active limit (`advisorActiveConversations >= advisorMaxConversations`).

3. **`FilterBar.tsx`**
   - Tab buttons to filter by `null` (Todas), `escalada`, `activa`, `cerrada`. Includes computed totals on badges.
   - Select dropdown for `channel`.
   - Refresh button calling `onRefresh`.

4. **`MetricsDashboard.tsx`**
   - Shown only if `role === 'admin'`.
   - Calculates `activas`, `escaladas`, and `atencion` from the `conversations` array via `.filter()`.

5. **`index.css`**
   - Append `@keyframes criticalPulse` and `.critical-pulse-card`.
   - Append `@keyframes wsPulse` and `.ws-pulse-dot`.
