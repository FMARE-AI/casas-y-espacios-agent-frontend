import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { conversationsService } from "../services/conversations";
import { useToastStore } from "../store/toastStore";
import { useAuthStore } from "../store/authStore";
import type {
  Conversation,

  Message,
  WSConversationClosed,
  WSEscalationNew,
  WSEscalationAssigned,
  WSConversationTransferred,
} from "../types";
import MessageFeed from "../components/chat/MessageFeed";
import ChatInput from "../components/chat/ChatInput";
import ClientPanel, { type ChatVariant } from "../components/chat/ClientPanel";
import TransferModal from "../components/chat/TransferModal";
import CloseConversationModal, { type CloseData } from "../components/modals/CloseConversationModal";
import ReturnBotModal from "../components/modals/ReturnBotModal";
import { useWebSocket, consumePendingTransferReason } from "../hooks/useWebSocket";
import { ROUTES } from "../constants/routes";

function getInitials(name: string): string {
  try {
    const clean = name.trim();
    if (!clean) return "C";
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } catch {
    return "C";
  }
}

// ── Header status dot color ───────────────────────────────

const STATUS_DOT: Record<ChatVariant, string> = {
  assigned: "bg-warning",
  unassigned: "bg-error",
  bot: "bg-success",
  monitoring: "bg-warning",
};

// ── Page ──────────────────────────────────────────────────

export default function ChatPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const advisor = useAuthStore((s) => s.advisor);
  const role = useAuthStore((s) => s.role);

  const fromAlert: boolean = location.state?.fromAlert ?? false;
  const alertAdvisorName: string | undefined = location.state?.advisorName;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showReturnedPill, setShowReturnedPill] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const feedRef = useRef<HTMLDivElement>(null);
  // Tracks how many messages (counted back from the most recent one) have been
  // loaded so far. offset=0 on the API means "the latest window", so this ref
  // doubles as the offset to request on the next "load older" page.
  const apiOffsetRef = useRef(0);
  const totalRef = useRef(0);
  // True after the first successful loadConversation — distinguishes the initial
  // load (where apiOffsetRef has no prior value worth preserving) from a WS-triggered
  // refresh (where the user may have already scrolled further back than the fresh fetch).
  const initializedRef = useRef(false);

  const loadConversation = useCallback(async () => {
    if (!conversationId) return;
    setIsLoading(true);
    try {
      const limit = fromAlert ? 100 : 50;
      const {
        conversation: conv,
        messages: msgs,
        total_messages: total,
      } = await conversationsService.getById(conversationId, limit);
      // offset=0 returns the most recent `limit` messages (server orders DESC
      // internally, then reverses to ASC for display) — no extra fetch needed.

      setConversation(conv);
      // Backend may not echo transfer_reason back on a plain GET — fall back to
      // whatever the conversation.transferred WS event cached for this conversation.
      if (conv.escalation && !conv.escalation.transfer_reason) {
        const cachedReason = consumePendingTransferReason(conv.id)
        if (cachedReason) {
          setConversation((prev) =>
            prev && prev.escalation && !prev.escalation.transfer_reason
              ? { ...prev, escalation: { ...prev.escalation, transfer_reason: cachedReason } }
              : prev
          )
        }
      }
      setShowReturnedPill(conv.bot_activo && conv.has_escalation_history);
      // Merge instead of replace. `msgs` is only the fresh window this call fetched
      // (the latest messages) — it does NOT include older history the user already
      // loaded via infinite scroll, nor messages added locally/via WS that the
      // fetch raced against. Preserve anything from `prev` that falls outside the
      // fresh window (older than its first message, or newer than its last) so a
      // WS-triggered refresh (escalation assigned/returned/new) never drops
      // already-visible messages.
      setMessages((prev) => {
        if (prev.length === 0) return msgs
        const serverIds = new Set(msgs.map((m) => m.id))
        const oldestNewTs = msgs.length
          ? new Date(msgs[0].created_at).getTime()
          : Infinity
        const newestNewTs = msgs.length
          ? new Date(msgs[msgs.length - 1].created_at).getTime()
          : -Infinity
        const preserved = prev.filter((m) => {
          if (serverIds.has(m.id)) return false
          const ts = new Date(m.created_at).getTime()
          return ts < oldestNewTs || ts > newestNewTs
        })
        if (preserved.length === 0) return msgs
        return [...preserved, ...msgs].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })
      totalRef.current = total;
      // On a refresh (not the initial load), keep the deepest point already
      // reached instead of resetting it back to just this fresh window's size.
      apiOffsetRef.current = initializedRef.current
        ? Math.max(msgs.length, apiOffsetRef.current)
        : msgs.length;
      initializedRef.current = true;
    } catch {
      // interceptor already showed the error toast
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, fromAlert]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversation();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadConversation]);

  // Messages emitted while the WS was down are lost — refetch on reconnection
  // so the open chat doesn't miss anything from the gap.
  useEffect(() => {
    const handleReconnected = () => {
      loadConversation();
    };
    window.addEventListener('ws:reconnected', handleReconnected);
    return () => window.removeEventListener('ws:reconnected', handleReconnected);
  }, [loadConversation]);

  // Ticks every minute so the "esperando respuesta" indicator in ChatInput stays live
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Reset unread count when the ASSIGNED ADVISOR opens this conversation.
  // Admin is excluded: admin viewing the chat must not clear the badge
  // that belongs to the assigned advisor.
  useEffect(() => {
    if (!conversationId || role === 'admin') return
    conversationsService.markAsSeen(conversationId)
      .then(() => {
        window.dispatchEvent(
          new CustomEvent('conversation:unread', {
            detail: { conversationId, unreadCount: 0 },
          })
        )
      })
      .catch(() => {})
  }, [conversationId, role])

  // Scroll to bottom after initial load — deferred to after paint so scrollHeight is correct
  useEffect(() => {
    if (isLoading) return;
    const raf = requestAnimationFrame(() => {
      if (feedRef.current) {
        feedRef.current.scrollTop = feedRef.current.scrollHeight;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [isLoading]);

  async function loadMoreMessages() {
    if (isLoadingMore || apiOffsetRef.current >= totalRef.current) return;
    const container = feedRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    setIsLoadingMore(true);
    try {
      // offset counts back from the most recent message, so requesting the next
      // page at the current offset returns the window immediately preceding
      // (older than) what's already loaded.
      const { messages: older } = await conversationsService.getMessages(
        conversationId!,
        { limit: 100, offset: apiOffsetRef.current },
      );
      apiOffsetRef.current += older.length;
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const filteredOlder = older.filter((m) => !existingIds.has(m.id));
        return [...filteredOlder, ...prev];
      });
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      }, 0);
    } catch {
      // silently fail
    } finally {
      setIsLoadingMore(false);
    }
  }

  // WS handlers — called by useWebSocket hook
  const onNewMessage = useCallback(
    (event: { message: Message & { conversation_id: string } }) => {
      if (event.message.conversation_id === conversationId) {
        setMessages((prev) => {
          // Guard against duplicates: the HTTP response already appended outbound messages
          if (prev.some((m) => m.id === event.message.id)) return prev;
          return [...prev, event.message];
        });

        // If the advisor is in the chat and the message is inbound, mark it as seen immediately
        if (event.message.direction === 'inbound' && role !== 'admin') {
          conversationsService.markAsSeen(conversationId)
            .then(() => {
              window.dispatchEvent(
                new CustomEvent('conversation:unread', {
                  detail: { conversationId, unreadCount: 0 },
                })
              );
            })
            .catch(() => {});
        }
      }
    },
    [conversationId, role],
  );

  const onConversationReturned = useCallback(
    (event: { conversation_id: string }) => {
      if (event.conversation_id === conversationId) {
        setShowReturnedPill(true);
        loadConversation();
      }
    },
    [conversationId, loadConversation],
  );

  const onConversationClosed = useCallback(
    (event: WSConversationClosed) => {
      if (event.conversation_id === conversationId) {
        navigate(ROUTES.BANDEJA);
      }
    },
    [conversationId, navigate],
  );

  const onEscalationAssigned = useCallback(
    (event: WSEscalationAssigned) => {
      if (event.conversation_id === conversationId) {
        loadConversation();
      }
    },
    [conversationId, loadConversation],
  );

  const onConversationTransferred = useCallback(
    (event: WSConversationTransferred) => {
      if (event.conversation_id === conversationId) {
        const selfId = useAuthStore.getState().advisor?.id;
        const isAdmin = useAuthStore.getState().advisor?.role === "admin";
        if (selfId && event.from_advisor?.id === selfId && !isAdmin) {
          navigate(ROUTES.BANDEJA);
        } else {
          loadConversation();
        }
      }
    },
    [conversationId, navigate, loadConversation],
  );

  const handleTransfer = useCallback(
    async (targetAdvisorId: string, reason: string | null) => {
      if (!conversationId) return;
      const result = await conversationsService.transfer(conversationId, {
        target_advisor_id: targetAdvisorId,
        reason,
      });
      setShowTransferModal(false);
      if (result?.escalation?.transfer_reason) {
        setConversation((prev) =>
          prev && prev.escalation
            ? { ...prev, escalation: { ...prev.escalation, transfer_reason: result.escalation.transfer_reason } }
            : prev
        );
      }
      useToastStore.getState().showToast(
        reason
          ? `Conversación transferida: "${reason.length > 60 ? reason.slice(0, 60) + '...' : reason}"`
          : "Conversación transferida exitosamente.",
        "success"
      );
      navigate(ROUTES.BANDEJA);
    },
    [conversationId, navigate]
  );

  // Covers auto-assign on escalation creation: the backend may emit a single
  // `escalation.new` with `advisor_id` already set, with no follow-up
  // `escalation.assigned` event, so this chat must also refresh on that event.
  const onEscalationNew = useCallback(
    (event: WSEscalationNew) => {
      if (event.conversation_id === conversationId) {
        loadConversation();
      }
    },
    [conversationId, loadConversation],
  );

  // Stable handlers object — prevents useWebSocket's effect from re-running on every render
  const wsHandlers = useMemo(
    () => ({
      onMessageNew: onNewMessage,
      onEscalationNew: onEscalationNew,
      onConversationReturned: onConversationReturned,
      onConversationClosed: onConversationClosed,
      onEscalationAssigned: onEscalationAssigned,
      onConversationTransferred: onConversationTransferred,
    }),
    [
      onNewMessage,
      onEscalationNew,
      onConversationReturned,
      onConversationClosed,
      onEscalationAssigned,
      onConversationTransferred,
    ],
  );

  // Hook up real-time websocket updates
  const { subscribeConversation, unsubscribeConversation } =
    useWebSocket(wsHandlers);

  // Subscribe to the conversation when it's known; unsubscribe on unmount or id change.
  // On unmount, call markAsSeen so messages that arrived while reading are cleared
  // server-side — otherwise BandejaPage refetches a stale unread_count > 0.
  useEffect(() => {
    if (!conversationId) return;
    subscribeConversation(conversationId);
    return () => {
      unsubscribeConversation();
      if (role !== 'admin') {
        conversationsService.markAsSeen(conversationId).catch(() => {})
      }
    };
  }, [conversationId, role, subscribeConversation, unsubscribeConversation]);

  // Auto-scroll when a new message is appended (not when old messages are prepended)
  const lastMessageIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMsg.id;
      if (feedRef.current) {
        feedRef.current.scrollTop = feedRef.current.scrollHeight;
      }
    }
  }, [messages]);

  // ── Optimistic UI helpers ──────────────────────────────────
  // ChatInput/AudioRecorder append a local placeholder message the instant the
  // advisor hits send (before the HTTP round-trip to Meta/Storage completes),
  // then reconcile it once the server responds. Matched by `_localId` since the
  // placeholder doesn't have a real message id yet.

  const addOptimisticMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m._localId && m._localId === msg._localId);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = msg;
        return next;
      }
      return [...prev, msg];
    });
  }, []);

  const confirmOptimisticMessage = useCallback(
    (localId: string, serverMessage: Message) => {
      setMessages((prev) => {
        // The WS `message.new` event may have already appended the real message
        // (race with the HTTP response) — drop the placeholder instead of duplicating.
        if (prev.some((m) => m.id === serverMessage.id)) {
          return prev.filter((m) => m._localId !== localId);
        }
        return prev.map((m) => (m._localId === localId ? serverMessage : m));
      });
    },
    [],
  );

  const failOptimisticMessage = useCallback((localId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m._localId === localId ? { ...m, _status: "failed" as const } : m)),
    );
  }, []);

  function extractErrorCode(err: unknown): string | undefined {
    const e = err as { response?: { data?: { detail?: { code?: string } } } };
    return e.response?.data?.detail?.code;
  }

  function extractErrorMessage(err: unknown): string | undefined {
    const e = err as {
      response?: { data?: { detail?: { message?: string } } };
    };
    return e.response?.data?.detail?.message;
  }


  async function handleTake() {
    if (!conversationId) return;
    setIsAssigning(true);
    try {
      await conversationsService.assign(conversationId);
      await loadConversation();
    } catch (err: unknown) {
      const code = extractErrorCode(err);
      if (code === "ALREADY_ASSIGNED") {
        useToastStore.getState().showToast("Otro asesor ya tomó esta conversación.", 'error');
        await loadConversation();
      } else if (code === "MAX_CONVERSATIONS_REACHED") {
        useToastStore.getState().showToast(
          extractErrorMessage(err) ??
            "Has alcanzado el límite de conversaciones simultáneas.",
          'error',
        );
      } else if (code === "CONVERSATION_NOT_ESCALATED") {
        useToastStore.getState().showToast("La conversación no está en estado escalado.", 'error');
      }
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleReturnBot() {
    if (!conversationId) return;
    setIsReturning(true);
    try {
      await conversationsService.returnToBot(conversationId);
      setShowReturnModal(false);
      await loadConversation();
    } catch (err: unknown) {
      const code = extractErrorCode(err);
      setShowReturnModal(false);
      if (code === "BOT_ALREADY_ACTIVE") {
        useToastStore.getState().showToast("El bot ya controla esta conversación.", 'info');
        await loadConversation();
      }
    } finally {
      setIsReturning(false);
    }
  }

  async function handleClose(data: CloseData) {
    if (!conversationId) return;
    setIsClosing(true);
    try {
      await conversationsService.close(conversationId, data);
      setShowCloseModal(false);
      navigate("/");
    } catch (err: unknown) {
      const code = extractErrorCode(err);
      if (code === "ALREADY_CLOSED") {
        useToastStore.getState().showToast("Esta conversación ya fue cerrada.", 'error');
      }
    } finally {
      setIsClosing(false);
    }
  }

  function getChatVariant(): ChatVariant {
    if (role === "admin") return "monitoring";
    if (!conversation) return "unassigned";
    if (conversation.escalation?.advisor?.id === advisor?.id) return "assigned";
    if (conversation.bot_activo) return "bot";
    return "unassigned";
  }

  const variant = getChatVariant();
  const isReadonly =
    variant === "unassigned" || variant === "bot" || variant === "monitoring";
  const clientName = conversation?.client.full_name ?? "Cliente";
  const channel = conversation?.channel ?? "";

  const waitSeconds = conversation?.escalation?.escalated_at
    ? Math.floor((now - new Date(conversation.escalation.escalated_at).getTime()) / 1000)
    : (conversation?.escalation?.wait_seconds ?? null);
  const hasAdvisor = !!conversation?.escalation?.advisor;
  const waitMinutes: number | null = hasAdvisor ? null : (waitSeconds !== null ? Math.floor(waitSeconds / 60) : null);

  return (
    <section
      id="screen-chat"
      className="flex-1 flex flex-col lg:flex-row relative min-h-0"
    >
      {/* ── Central column ── */}
      <div className="flex-1 flex flex-col bg-bg-main border-r border-border-default min-w-0 min-h-0">
        {/* Header */}
        <div className="bg-bg-secondary px-4 py-3 border-b border-border-default flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-bg-tertiary hover:bg-border-default border border-border-default rounded-control text-xs font-semibold text-text-secondary hover:text-white transition active:scale-[0.98] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="hidden sm:inline">Volver</span>
            </button>

            {/* Avatar del Cliente con Iniciales */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-blue to-success flex items-center justify-center text-xs font-extrabold text-white shrink-0 shadow-lg border border-border-default/35 select-none">
              {getInitials(clientName)}
            </div>

            <div>
              <h3 className="text-h3 text-text-primary flex items-center gap-1.5">
                {clientName}
                <span
                  id="chat-header-status-dot"
                  className={`w-2 h-2 rounded-full inline-block ${STATUS_DOT[variant]} ring-2 ring-bg-secondary`}
                  title={`Estado: ${variant}`}
                />
              </h3>
              <p className="text-[9px] text-text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500/20 border border-green-500/40 inline-block" />
                WhatsApp: {channel || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Monitoring pill */}
            {variant === "monitoring" && (
              <div
                id="monitoring-mode-pill"
                className="bg-warning/15 text-warning text-[10px] px-2.5 py-1 rounded font-black border border-warning/30 flex items-center gap-1 animate-pulse"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span>Monitoreo</span>
              </div>
            )}

            {/* Mobile details toggle */}
            <button
              type="button"
              onClick={() => setRightPanelOpen(true)}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 bg-bg-tertiary hover:bg-border-default border border-border-default rounded-control text-xs font-semibold text-text-secondary hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/90"
            >
              <svg
                className="w-4 h-4 text-brand-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Detalles</span>
            </button>
          </div>
        </div>

        {/* Message feed */}
        <MessageFeed
          messages={messages}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          showEscalationEvent={conversation?.status === "escalada"}
          showReturnedEvent={showReturnedPill}
          advisorName={fromAlert ? alertAdvisorName : advisor?.full_name}
          onScrollTop={loadMoreMessages}
          feedRef={feedRef}
        />

        {/* Input area or banners */}
        {!isReadonly ? (
          <ChatInput
            conversationId={conversationId!}
            clientName={clientName}
            channel={channel}
            waitMinutes={waitMinutes}
            currentAdvisorName={advisor?.full_name}
            onOptimisticMessage={addOptimisticMessage}
            onMessageConfirmed={confirmOptimisticMessage}
            onMessageFailed={failOptimisticMessage}
          />
        ) : (
          <div className="p-3 bg-bg-secondary border-t border-border-default shrink-0">
            {variant === "unassigned" && (
              <div
                id="chat-banner-readonly"
                className="p-2.5 bg-bg-tertiary text-center border border-border-default rounded text-xs text-warning font-semibold"
              >
                ⚠️ Modo de Solo Lectura • Debes tomar la conversación para
                responder.
              </div>
            )}
            {variant === "monitoring" && (
              <div
                id="chat-banner-monitoring"
                className="p-2.5 bg-warning/5 text-center border border-warning/20 rounded text-xs text-warning font-semibold"
              >
                👁️ Modo Monitoreo • Vista de solo lectura para administradores.
              </div>
            )}
            {variant === "bot" && (
              <div
                id="chat-banner-bot"
                className="p-2.5 bg-success/10 text-center border border-success/30 rounded text-xs text-success font-semibold"
              >
                {conversation?.has_escalation_history
                  ? "🤖 El bot retomó esta conversación."
                  : "🤖 El bot está gestionando esta conversación."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile backdrop ── */}
      {rightPanelOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-30 lg:hidden"
          onClick={() => setRightPanelOpen(false)}
        />
      )}

      {/* ── Right panel ── */}
      {conversation && (
        <div className={`${rightPanelOpen ? "flex" : "hidden"} lg:flex`}>
          <ClientPanel
            conversation={conversation}
            variant={variant}
            onTake={handleTake}
            onReturnBot={() => setShowReturnModal(true)}
            onCloseConversation={() => setShowCloseModal(true)}
            onTransfer={() => setShowTransferModal(true)}
            isTaking={isAssigning}
            isReturning={isReturning}
            isAdmin={role === 'admin'}
            onClose={() => setRightPanelOpen(false)}
          />
        </div>
      )}

      {/* ── Return-bot modal ── */}
      {showReturnModal && (
        <ReturnBotModal
          onConfirm={handleReturnBot}
          onCancel={() => setShowReturnModal(false)}
          isReturning={isReturning}
        />
      )}

      {/* ── Close conversation modal ── */}
      {showCloseModal && (
        <CloseConversationModal
          onConfirm={handleClose}
          onCancel={() => setShowCloseModal(false)}
          isClosing={isClosing}
        />
      )}

      {/* ── Transfer conversation modal ── */}
      {showTransferModal && (
        <TransferModal
          onConfirm={handleTransfer}
          onCancel={() => setShowTransferModal(false)}
          currentAssignedAdvisorId={conversation?.escalation?.advisor?.id}
        />
      )}
    </section>
  );
}
