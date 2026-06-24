# CLAUDE.md — Casas y Espacios Agent

Instrucciones de arquitectura, convenciones y restricciones para el modelo de IA que trabaja en este repositorio.
**Léelas antes de tocar cualquier archivo.**

---

## 1. Descripción del Proyecto

**Casas y Espacios Agent** es un sistema de automatización con IA conversacional para **Casas y Espacios Real Estate**, una agencia inmobiliaria colombiana. Atiende a clientes vía WhatsApp usando dos líneas independientes de la **Meta WhatsApp Cloud API**:

| Línea          | Agente           | Audiencia                                     | Estado             |
| -------------- | ---------------- | --------------------------------------------- | ------------------ |
| Administrativa | `administrative` | Propietarios (cartera, saldos, mantenimiento) | Fase 1 — activa    |
| Comercial      | `commercial`     | Prospectos (búsqueda y perfilamiento)         | Fase 2 — pendiente |

El bot resuelve el 80% de consultas sin intervención humana. Cuando detecta condiciones de escalado, transfiere al **Panel Web Interno** donde asesores atienden manualmente.

---

## 2. Stack y Dependencias

```
Python                      3.13+
FastAPI                     >=0.136.3
Uvicorn                     >=0.48.0 [standard]
LangGraph                   >=1.2.2
LangChain-OpenAI            >=1.2.2
langgraph-checkpoint-postgres >=3.1.0
openai                      (Whisper + GPT-4o-mini)
pydantic-settings           >=2.14.1
httpx                       >=0.28.1
supabase                    >=2.30.0
psycopg[binary]             (requerido en Windows para langgraph-checkpoint-postgres)
cryptography                (Fernet — encriptación del access_token de Meta)
python-jose                 (JWT — autenticación del panel web)
pytz                        (zonas horarias — horario de oficina)
python-dotenv               >=1.2.2
---
pytest                      >=9.0.3
pytest-asyncio              >=1.4.0
ruff                        >=0.15.15
```

Gestor de paquetes: **uv**. Nunca usar `pip install`.

- Prod: `uv add <paquete>`
- Dev: `uv add --dev <paquete>`

---

## 3. Decisiones Arquitecturales Inamovibles

### 3.1 Un solo proceso FastAPI

Un único proceso recibe todos los webhooks de Meta. El enrutamiento al agente correcto es interno por `phone_number_id` consultando la tabla `lines` en Supabase.

**Por qué:** Simplifica el despliegue en Railway (un Procfile, un contenedor). El `phone_number_id` no viene de `.env` — viene de BD para soportar múltiples líneas con tokens distintos.

### 3.2 Enrutamiento por `lines` en BD, no por variables de entorno

`app/core/router.py` consulta `LineRepository.get_by_phone_number_id()` para identificar la línea. El `access_token` de Meta viene de la tabla `lines` (encriptado con Fernet), no de `settings`.

**Por qué:** Permite múltiples líneas con tokens independientes. Las variables `ADMIN_PHONE_NUMBER_ID` y `COMMERCIAL_PHONE_NUMBER_ID` existen en config solo para referencias de bootstrap.

### 3.3 Patrón Repository — capa única de acceso a BD

Todo acceso a Supabase pasa por clases en `app/db/repositories/`. Ningún módulo fuera de `app/db/` llama al cliente de Supabase directamente.

**Por qué:** Si cambia el proveedor de BD, solo se reescriben los repositorios.

### 3.4 Cliente Supabase async inicializado en lifespan

`app/db/client.py` expone `init_supabase()` (async, llamado en el startup de FastAPI) y `get_supabase()` (sync, usado en repositorios). El cliente nunca se inicializa al importar — solo en startup.

**Por qué:** `create_async_client` es una coroutine. No se puede ejecutar al importar el módulo.

### 3.5 Mocks intercambiables por variable de entorno

`USE_MOCK_SIMI=true` activa `MockSIMIClient`. El agente siempre llama `get_simi_client()` desde `app/services/simi/__init__.py` — nunca importa el mock directamente.

**Por qué:** Desarrollo y tests sin credenciales reales. El grafo no sabe qué implementación está activa.

### 3.6 `bot_activo` como única fuente de verdad del handover

El campo `bot_activo` en `conversations` determina quién atiende. El webhook siempre llega a FastAPI. Si `bot_activo = false`, el mensaje se ignora silenciosamente. El handover es exclusivo del Panel Web — no hay keywords de texto.

### 3.7 `access_token` encriptado en BD con Fernet

Los tokens de Meta se almacenan como `BYTEA` encriptado en la tabla `lines`. La clave es `ENCRYPTION_KEY` en `.env`. Desencriptar con `decrypt_token()` de `app/core/encryption.py` antes de usarlos. PostgREST devuelve `BYTEA` como string hex `\x{hex}` — usar `_parse_bytea()` en `LineRepository`.

### 3.8 Settings con `case_sensitive=True` y nombres en UPPER_CASE

Todas las variables en `Settings` usan `UPPER_CASE` exacto (ej: `settings.OPENAI_API_KEY`, `settings.META_APP_SECRET`). El `.env` debe usar los mismos nombres.

### 3.9 System prompts de LLM en inglés

Todos los prompts de sistema pasados a modelos de lenguaje (GPT, Whisper, etc.) se escriben en inglés. Los mensajes al cliente final sí van en español.

### 3.10 Moderación: fail open

`app/services/moderation/client.py` analiza mensajes del asesor en background. Si GPT falla o tarda más de 3s → `is_appropriate=True`. Nunca bloquea el envío del mensaje.

### 3.11 Job de disponibilidad en background

`app/jobs/availability_checker.py` actualiza `availability_status` de asesores cada 5 min. Corre como `asyncio.Task` creado en el lifespan de FastAPI. Usa `asyncio.sleep` — nunca bloquea el event loop.

### 3.12 Code and comments always in English

All code in this repository — including variable names, function names, class names, type aliases, inline comments, and docstrings — must be written in English. No Spanish in source code.

**Applies to:** every file in the repo (frontend and backend).

**Exceptions:**
- User-facing strings rendered in the UI (labels, error messages, toast notifications)
- String values sent to end users via WhatsApp
- Documentation files (`*.md`) — written in Spanish to match team communication

**Why:** Keeps the codebase readable for any developer regardless of language background, and consistent with the tooling ecosystem (libraries, error messages, stack traces) which is English-first.

---

## 4. Mapa de Módulos

```
app/
  main.py                     — Factory FastAPI; lifespan (Supabase + availability_checker)
  config.py                   — Pydantic Settings; case_sensitive=True; UPPER_CASE

  api/
    deps.py                   — require_valid_meta_signature (webhook); get_current_advisor,
                                 require_role (panel JWT)
    v1/
      webhooks.py             — GET/POST /webhook; delega a router, nada más
      panel/
        __init__.py           — panel_router (prefix /api/v1/panel)
        schemas.py            — TODOS los schemas del panel: DataResponse, ErrorCode,
                                 error_detail(), Request/Response schemas
        conversations.py      — PW-2..8: bandeja, reply, assign, return-bot
        advisors.py           — PW-9..12,20,21: perfil, CRUD asesores, disponibilidad
        alerts.py             — PW-13,14: behavior alerts
        schedules.py          — PW-15..18: horarios de inactividad
        websocket.py          — PW-19: WS /ws

  core/
    router.py                 — Despacha por phone_number_id via LineRepository;
                                 filtra change.field != "messages"; ignora statuses
    security.py               — verify_meta_signature() HMAC-SHA256
    encryption.py             — encrypt_token() / decrypt_token() con Fernet

  agents/
    administrative/
      state.py                — AdministrativeState (TypedDict, 22 campos, add_messages)
      prompts.py              — SYSTEM_PROMPT (en inglés)
      nodes.py                — call_llm, tools SIMI, transcribe_audio,
                                 check_availability_for_escalation
      graph.py                — Compila StateGraph; checkpointer PostgresSaver

  services/
    meta/
      client.py               — send_text_message(), send_media_message(), download_media()
                                 access_token siempre como parámetro, nunca de settings
      schemas.py              — MetaWebhookPayload y todos los sub-schemas
    simi/
      __init__.py             — get_simi_client() factory; SIMIClientProtocol
      client.py               — SIMIRealClient (NotImplementedError — sin credenciales)
      mock.py                 — MockSIMIClient con datos deterministas
      schemas.py              — SIMIClient, SIMIAccountStatus, SIMIRepairOrderResponse
    transcription/
      client.py               — transcribe() via OpenAI Whisper; fail con mensaje al cliente
    moderation/
      client.py               — analyze_message() via GPT-4o-mini; fail open; 3s timeout

  jobs/
    availability_checker.py   — Loop async: actualiza availability_status según horarios;
                                 check_advisors_available() para el nodo escalate

  db/
    client.py                 — init_supabase(), get_supabase(), execute_query(),
                                 get_storage(), health_check(), DatabaseError
    repositories/
      line.py                 — LineRepository: get_by_phone_number_id()
                                 (incluye _parse_bytea para BYTEA de PostgREST)
      client.py               — ClientRepository: get_by_phone_number, create,
                                 update_identity
      conversation.py         — ConversationRepository: get_active_by_client_id,
                                 get_by_phone_number, create, update_*, close
      message.py              — MessageRepository: create, get_by_conversation,
                                 exists_by_wam_id (deduplicación)
      escalation.py           — EscalationRepository: create, assign_advisor, resolve
      behavior_alert.py       — BehaviorAlertRepository: create, get_unreviewed,
                                 mark_reviewed
    migrations/
      001_initial.sql         — DDL completo: 8 tablas + índices + RLS + migraciones

  models/
    domain.py                 — FUENTE DE VERDAD de todos los enums y dataclasses:
                                 ClientType, ConversationStatus, ConversationIntent (8 valores),
                                 MessageDirection, MessageType, DeliveredVia, EscalationReason,
                                 Line, Client, Conversation, Message, Escalation,
                                 Advisor, BehaviorAlert, AdvisorSchedule
    conversation.py           — Re-exporta enums de domain.py (imports semánticos en agentes)
    user.py                   — Re-exporta ClientType + define IdentifiedClient (modelo del agente)

tests/
  conftest.py
  test_webhooks.py
  test_router.py
  agents/
    test_administrative_state.py
  services/
    test_meta_client.py
    test_simi_mock.py
    test_transcription.py
    test_moderation.py
  db/
    test_repositories.py      — mocks de Supabase; nunca BD real
  jobs/
    test_availability_checker.py
  models/
    test_meta_schemas.py
```

---

## 5. Schema de BD (tablas activas)

| Tabla               | Descripción                                                              |
| ------------------- | ------------------------------------------------------------------------ |
| `lines`             | Líneas WhatsApp; `access_token BYTEA` encriptado con Fernet              |
| `clients`           | Clientes identificados por `phone_number`                                |
| `advisors`          | Usuarios del panel; `role IN ('asesor', 'admin')`; `availability_status` |
| `conversations`     | Sesiones; `bot_activo`, `status`, `intent` (8 valores)                   |
| `messages`          | Historial por conversación; deduplicación por `wam_id`                   |
| `escalations`       | Eventos de handover; `advisor_id`, `resolved_at`                         |
| `ws_connections`    | Conexiones WebSocket activas del panel                                   |
| `behavior_alerts`   | Alertas de moderación de mensajes del asesor                             |
| `advisor_schedules` | Intervalos de inactividad configurables por asesor                       |

**Roles:** Solo `asesor` y `admin`. El admin reemplaza al gerente — puede crear asesores, monitorear todas las conversaciones y ver métricas.

---

## 6. Variables de Entorno

| Variable                              | Default          | Descripción                                              |
| ------------------------------------- | ---------------- | -------------------------------------------------------- |
| `SUPABASE_URL`                        | —                | URL HTTPS del proyecto (`https://xxx.supabase.co`)       |
| `SUPABASE_ANON_KEY`                   | —                | Anon key (solo para referencias, nunca usada en backend) |
| `SUPABASE_SERVICE_ROLE_KEY`           | —                | Service Role Key (bypasea RLS)                           |
| `SUPABASE_STORAGE_BUCKET`             | —                | Bucket de Storage                                        |
| `SUPABASE_DB_URL`                     | —                | URL postgres directa para LangGraph checkpointer         |
| `OPENAI_API_KEY`                      | —                | Clave OpenAI                                             |
| `OPENAI_MODEL`                        | `gpt-4o-mini`    | Modelo LLM                                               |
| `WHISPER_MODEL`                       | `whisper-1`      | Modelo de transcripción                                  |
| `META_VERIFY_TOKEN`                   | —                | Token handshake GET del webhook                          |
| `META_APP_SECRET`                     | —                | Secreto HMAC-SHA256                                      |
| `ADMIN_PHONE_NUMBER_ID`               | —                | phone_number_id línea administrativa                     |
| `COMMERCIAL_PHONE_NUMBER_ID`          | —                | phone_number_id línea comercial                          |
| `META_ACCESS_TOKEN`                   | —                | Token bootstrap (en prod viene de tabla `lines`)         |
| `META_API_VERSION`                    | `v19.0`          | Versión Graph API                                        |
| `ENCRYPTION_KEY`                      | —                | Clave Fernet para access_tokens en BD                    |
| `JWT_SECRET`                          | —                | Secret Supabase para validar JWT del panel               |
| `OFFICE_HOURS_START`                  | `08:00`          | Inicio horario de oficina                                |
| `OFFICE_HOURS_END`                    | `18:00`          | Fin horario de oficina                                   |
| `OFFICE_HOURS_TIMEZONE`               | `America/Bogota` | Zona horaria                                             |
| `AVAILABILITY_CHECK_INTERVAL_SECONDS` | `300`            | Intervalo del job de disponibilidad                      |
| `OUT_OF_HOURS_MESSAGE`                | (string)         | Mensaje cuando no hay asesores disponibles               |
| `SESSION_TIMEOUT_HOURS`               | `24`             | Expiración de sesión de conversación                     |
| `MAX_CLASSIFICATION_ATTEMPTS`         | `2`              | Intentos antes de escalar por no_clasificado             |
| `MAX_SIMI_FAILURES`                   | `2`              | Fallos SIMI antes de escalar                             |
| `MAX_CONVERSATIONS_PER_ADVISOR`       | `3`              | Límite de conversaciones simultáneas                     |
| `USE_MOCK_SIMI`                       | `true`           | Activa MockSIMIClient                                    |
| `USE_MOCK_WASI`                       | `true`           | Activa mock de WASI                                      |
| `MAX_IMAGE_SIZE_MB`                   | `5`              | Límite imágenes                                          |
| `MAX_VIDEO_SIZE_MB`                   | `16`             | Límite videos                                            |
| `MAX_DOCUMENT_SIZE_MB`                | `20`             | Límite documentos                                        |

---

## 7. Cómo Abordar Nuevas Features

### Cuándo usar SDD (Spec-Driven Development)

Usar SDD (`/sdd`) cuando la feature es **grande, ambigua o cross-cutting** (toca más de 3 archivos, tiene múltiples casos de borde, o requiere decisiones arquitecturales).

El ciclo SDD vive en `specs/<feature_name>/`:

1. `01-spec.md` — qué y por qué (sin implementación)
2. `02-clarification.md` — Q&A de ambigüedades resueltas
3. `03-design.md` — solución técnica; esperar aprobación explícita antes de codear
4. `04-implementation.md` — plan de tareas + log de ejecución

**Nunca empezar a codear antes de que el diseño esté aprobado.**

### Cuándo implementar directo

Features pequeñas y bien definidas (≤3 archivos, spec claro, sin ambigüedades) se implementan directamente sin SDD.

### Patrón para nuevos endpoints del panel (PW-\*)

1. Schema del request/response en `app/api/v1/panel/schemas.py`
2. Endpoint en el router correspondiente (`conversations.py`, `advisors.py`, etc.)
3. Lógica de negocio en el repositorio (`app/db/repositories/`)
4. Dependencia de auth: `Depends(get_current_advisor)` o `Depends(require_role(["admin"]))`
5. Errores: `raise HTTPException(status, detail=error_detail(ErrorCode.X, "mensaje"))`
6. Response: `{"data": {...}}` usando `DataResponse`

### Patrón para nuevos nodos del agente

1. Estado nuevo: agregar campo a `AdministrativeState` en `state.py`
2. Nodo: función async `nombre_nodo(state: AdministrativeState) -> dict` en `nodes.py`
3. Nunca importar repositorios desde el grafo directamente — usar `get_simi_client()`, `get_supabase()`, etc.
4. Nodo siempre devuelve dict parcial con solo los campos que modificó

### Patrón para nuevas migraciones de BD

1. Ejecutar el SQL en Supabase SQL Editor
2. Agregar el DDL al final de `001_initial.sql` en la sección `MIGRACIONES POSTERIORES AL SCHEMA INICIAL`
3. Usar `ADD COLUMN IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS` para idempotencia
4. Agregar el dataclass correspondiente en `app/models/domain.py`
5. Si tiene enums: definirlos en `domain.py`, re-exportar desde `conversation.py` o `user.py` si son relevantes para el agente

---

## 8. Estado Actual

### Infraestructura

| Componente                             | Estado                              |
| -------------------------------------- | ----------------------------------- |
| FastAPI + Uvicorn                      | ✅                                  |
| Supabase AsyncClient                   | ✅                                  |
| Railway deploy (dev/prod)              | ✅                                  |
| HMAC-SHA256 webhook verification       | ✅                                  |
| Encriptación access_token (Fernet)     | ✅                                  |
| JWT auth panel (python-jose)           | ✅                                  |
| LangGraph checkpointer (PostgresSaver) | ✅ instalado, pendiente de conectar |

### Agente Administrativo (Fase 1)

| Componente                                    | Estado                               |
| --------------------------------------------- | ------------------------------------ |
| AdministrativeState (22 campos)               | ✅                                   |
| Router por phone_number_id via LineRepository | ✅                                   |
| Tools SIMI (MockSIMIClient)                   | ✅                                   |
| Transcripción Whisper (esqueleto)             | ✅ nodo pendiente de access_token    |
| Nodo check_availability_for_escalation        | ✅ helper listo                      |
| Grafo completo                                | ⬜ Bloqueado hasta credenciales SIMI |
| Integración SIMI real                         | ⬜ Bloqueado (sin credenciales)      |

### Panel Web Interno — Backend (Bloque PW)

| Componente                                          | Estado                                      |
| --------------------------------------------------- | ------------------------------------------- |
| Estructura módulo `/panel`                          | ✅                                          |
| Schemas centralizados                               | ✅                                          |
| get_current_advisor / require_role                  | ✅                                          |
| GET /conversations/ + /{id} + /{id}/messages        | ✅                                          |
| POST /reply + /reply/media + /reply/audio           | ✅                                          |
| PATCH /assign + /return-bot + /close                | ✅                                          |
| GET /advisors/me + /advisors/                       | ✅                                          |
| POST /advisors/ (crear asesor)                      | ✅                                          |
| PATCH /advisors/me + /advisors/me/availability      | ✅                                          |
| PATCH /advisors/{id} (admin edita asesor)           | ✅                                          |
| GET /metrics (admin only)                           | ✅                                          |
| GET /behavior-alerts/ + PATCH /{id}/review          | ✅                                          |
| GET/POST /schedules/ + PATCH/DELETE /{id}           | ✅                                          |
| WebSocketManager + /ws endpoint                     | ✅                                          |
| POST /auth/token (debug sin password — solo dev)    | ✅ sin guard de settings.DEBUG — ver nota   |

> **Nota conocida:** `POST /auth/token` no tiene guard de `settings.DEBUG`. En producción, incluir ese router solo si `DEBUG=True`. `POST /advisors/` no valida `specialty` contra `area` — esa validación solo existe en `PATCH /advisors/{id}`.

### Panel Web Interno — Frontend (React)

| Componente                                          | Estado                                             |
| --------------------------------------------------- | -------------------------------------------------- |
| Auth (Supabase + mock login)                        | ✅ mock: `asesor@mock.com` o `admin@mock.com` / `123` |
| authStore (session, advisor, role, isLoading)       | ✅                                                 |
| wsStore (status, reconnectAttempt, escalation, alerts) | ✅ + decrementAlerts (FE-12)                    |
| useWebSocket (singleton, backoff exponencial)       | ✅                                                 |
| EscalationToast + sonido Web Audio API              | ✅                                                 |
| ProtectedRoute (guard + WS init + toasts)           | ✅                                                 |
| BandejaPage (lista + filtros + modal tomar)         | ✅ con fallback mock                               |
| ChatPage (historial + reply texto)                  | ✅                                                 |
| ChatInput (texto + adjuntos + audio)                | ✅                                                 |
| AudioRecorder (MediaRecorder API, webm)             | ✅                                                 |
| MessageBubble (text/image/video/document/audio)     | ✅                                                 |
| conversationsService (HTTP + mock fallback)         | ✅ list con mock; resto sin fallback               |
| alertsService (list, markReviewed)                  | ✅ sin fallback mock en markReviewed               |
| GestionPage (admin) — tabla asesores + CRUD         | ✅ FE-11                                           |
| BehaviorAlertsPanel (admin-only, FE-12)             | ✅ filtros, WS reload, mock fallback               |
| **Integración real con backend (fase activa)**      | 🔄 En progreso                                     |
| Conexión real WebSocket con backend                 | ⬜ Pendiente (token mock rechazado en dev)         |
| HistorialPage                                       | ⬜ Pendiente                                       |
| PerfilPage                                          | ⬜ Pendiente                                       |

### Servicios

| Componente                           | Estado              |
| ------------------------------------ | ------------------- |
| Meta client (texto, media, descarga) | ✅                  |
| SIMI MockClient                      | ✅                  |
| SIMI RealClient                      | ⬜ Sin credenciales |
| Moderación (GPT-4o-mini)             | ✅                  |
| Transcripción (Whisper)              | ✅                  |
| Job disponibilidad asesores          | ✅                  |

### BD

| Tablas                                            | Estado |
| ------------------------------------------------- | ------ |
| lines, clients, advisors, conversations, messages | ✅     |
| escalations, ws_connections, behavior_alerts      | ✅     |
| advisor_schedules                                 | ✅     |
| advisors.availability_status                      | ✅     |
| Repositorios (5 + behavior_alert)                 | ✅     |

---

## 9. Convenciones de Código

### Nombrado

- Funciones: `snake_case`, descriptivas del qué. `get_owner_balance`, no `fetch`.
- Clases: `PascalCase`. Repositorios no terminan en "Repository" necesariamente — un archivo por aggregate.
- Variables de entorno: `UPPER_CASE` en `Settings` y en `.env`.
- Enums: `str, Enum` — valores son strings nativos usables directamente en queries Supabase.

### Manejo de errores

- Repositorios: loguear con `logger.error` antes de propagar como `DatabaseError`.
- Endpoints panel: `raise HTTPException(status, detail=error_detail(ErrorCode.X, "msg"))`.
- Servicios externos (Meta, SIMI, Whisper): excepción tipada específica (`MetaAPIError`, `TranscriptionError`).
- Jobs y moderación: **fail open** — si falla, continuar sin bloquear.
- El endpoint `/webhook` siempre devuelve `{"status": "ok"}` a Meta.

### Logging

- `logger = logging.getLogger(__name__)` en cada módulo.
- `DEBUG`: trazas de estado LangGraph, checks de moderación.
- `INFO`: eventos de negocio (mensaje recibido, escalado, status cambiado).
- `ERROR`: fallos en llamadas externas con contexto suficiente para debugging.
- No usar `print()` en producción.

### Formato

- Ruff: `uv run ruff check . --fix && uv run ruff format .`
- Line length: 100

### Updates en Supabase

- Métodos `-> None`: no encadenar `.select()` — no se valida "record not found".
- Métodos `-> Model`: encadenar `.select()` y verificar `if not response.data`.
- PostgREST devuelve `BYTEA` como string hex `\x...` — siempre usar `_parse_bytea()`.

---

## 10. Lo que NUNCA Debes Hacer

```python
# ❌ Llamada directa a Supabase fuera de app/db/
from app.db.client import get_supabase
supabase = get_supabase()
await supabase.table("conversations").select("*").execute()

# ✅ Usar el repositorio
from app.db.repositories.conversation import ConversationRepository
await ConversationRepository().get_active_by_client_id(client_id)
```

```python
# ❌ Importar mock directamente desde el agente
from app.services.simi import mock as simi_mock
owner = await simi_mock.get_owner_by_cedula(cedula)

# ✅ Usar la factory
from app.services.simi import get_simi_client
client = await get_simi_client().validate_client(document_id)
```

```python
# ❌ Settings en minúsculas
headers = {"Authorization": f"Bearer {settings.meta_access_token}"}

# ✅ Settings en UPPER_CASE
headers = {"Authorization": f"Bearer {settings.META_ACCESS_TOKEN}"}
```

```python
# ❌ Schema inline en endpoint del panel
@router.post("/reply")
async def reply(text: str = Body(...)):  # schema inline

# ✅ Schema desde schemas.py
from app.api.v1.panel.schemas import ReplyTextRequest
@router.post("/reply")
async def reply(body: ReplyTextRequest):
```

```python
# ❌ System prompt en español
SYSTEM_PROMPT = "Eres un moderador de mensajes..."

# ✅ System prompt en inglés
SYSTEM_PROMPT = "You are a message moderation system..."
```

- No usar la `SUPABASE_ANON_KEY` en backend — siempre `SUPABASE_SERVICE_ROLE_KEY`.
- No hacer llamadas HTTP síncronas — siempre `async/await` con `httpx.AsyncClient`.
- No usar `pip install` — siempre `uv add`.
- No añadir lógica de negocio en endpoints — delegar a repositorios y servicios.
- No mezclar lógica entre `agents/administrative/` y `agents/commercial/`.
- No poner `datetime.utcnow()` — usar `datetime.now(timezone.utc)`.

---

## 11. Flujo de Desarrollo Local

```bash
# 1. Instalar dependencias
uv sync

# 2. Configurar .env
cp .env.example .env
# Completar con valores reales

# 3. Migraciones (si es proyecto nuevo)
# Supabase Panel → SQL Editor → pegar 001_initial.sql

# 4. Levantar el servidor
uv run uvicorn app.main:app --reload --port 8000

# 5. Tests
python -m pytest tests/ -v

# 6. Linting
uv run ruff check . --fix && uv run ruff format .

# 7. Verificar conexión Supabase
supabase db query --linked "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

Para recibir webhooks de Meta localmente:

```bash
ngrok http 8000
# Meta for Developers → WhatsApp → Configuration → Webhook URL:
# https://xxxx.ngrok-free.app/api/v1/webhook
# Verify Token: valor de META_VERIFY_TOKEN en .env
```

---

## 12. Frontend — Stack y Estructura

Este repositorio es el **panel web interno** (React). Vive separado del backend FastAPI.

```
React 18 + TypeScript + Vite
Zustand                     (estado global — authStore, wsStore)
React Router v6             (enrutamiento)
Supabase JS v2              (auth)
Tailwind CSS                (estilos)
sonner                      (toasts)
Web Audio API               (sonido de notificaciones — sin assets externos)
MediaRecorder API           (grabación de audio)
```

**Gestor de paquetes:** `npm`. No usar `yarn` ni `pnpm`.

---

## 13. Frontend — Mapa de Módulos

```
src/
  App.tsx                    — Root: AuthInit + gate isLoading + Routes
  main.tsx                   — Entry point

  hooks/
    useAuth.ts               — Sync Supabase Auth ↔ authStore; mock login; deps: []
    useWebSocket.ts          — Ciclo de vida WS; backoff exponencial; socket singleton global

  store/
    authStore.ts             — session, advisor, role, isLoading, isFirstLogin, sessionExpired
    wsStore.ts               — status, reconnectAttempt, pendingEscalation, unreadAlerts;
                               incrementAlerts / decrementAlerts / resetAlerts

  pages/
    BandejaPage.tsx          — Lista de conversaciones; handlers WS para escalation.new
    ChatPage.tsx             — Vista de chat; adjuntos; grabación de audio
    LoginPage.tsx            — Login real (Supabase) + mock (asesor@mock.com / 123, admin@mock.com / 123)
    HistorialPage.tsx
    PerfilPage.tsx
    GestionPage.tsx          — Solo role=admin; tabla asesores + CRUD + BehaviorAlertsPanel

  components/
    layout/
      ProtectedRoute.tsx     — Guard de sesión; inicializa WS; monta EscalationToast
      Sidebar.tsx
    chat/
      AudioRecorder.tsx      — Graba audio via MediaRecorder; emite Blob webm
      ChatInput.tsx          — Input compuesto: texto + adjunto + audio
      MessageBubble.tsx      — Renderiza text/image/video/document/audio
    bandeja/
      ConversationCard.tsx
      FilterBar.tsx
      MetricsDashboard.tsx
    gestion/
      BehaviorAlertsPanel.tsx — Panel alertas comportamiento (admin-only); filtros por asesor
                                y severidad; reload silencioso por WS; mock fallback en mount
    shared/
      EscalationToast.tsx    — Toast de nueva escalación + sonido (Web Audio API)
      SuccessToast.tsx       — Toast de operaciones exitosas
      SessionExpiredModal.tsx

  services/
    conversations.ts         — Todas las llamadas HTTP al backend + fallback mock
    alerts.ts                — alertsService: list({ reviewed, limit }) + markReviewed(id)
    index.ts                 — Re-exporta conversationsService

  lib/
    supabase.ts              — Cliente Supabase (singleton)
    axios.ts                 — Axios con header Authorization automático

  types/                     — Tipos TypeScript compartidos (Conversation, Message, etc.)
  constants/
    routes.ts                — ROUTES object (evita strings hardcodeados en navegación)
```

---

## 14. Frontend — Capa de Mocks (mientras el backend no está conectado)

### Login mock

Mientras el backend no tenga auth real, se usa:

| Email | Password | Token | Rol |
|---|---|---|---|
| `asesor@mock.com` | `123` | `mock-token-asesor` | `asesor` |
| `admin@mock.com` | `123` | `mock-token-admin` | `admin` |

La sesión mock **solo vive en el store de Zustand** — no se persiste en Supabase. Al refrescar la página se pierde y hay que volver a hacer login.

### API mock

`conversationsService.list()` devuelve una conversación demo hardcodeada si la llamada al backend falla. El resto de endpoints (`getById`, `replyText`, `assign`, etc.) **no tienen fallback** — fallarán explícitamente si el backend no está disponible.

Para `replyText`, `replyMedia` y `replyAudio`, si el `id === 'demo'` se devuelve un mensaje local sin llamar al backend.

### WebSocket mock

El hook `useWebSocket` siempre intenta conectar a `VITE_WS_BASE_URL`. Si no está configurada, usa `wss://casasyespaciosagent.up.railway.app/...`. Con token mock la conexión será rechazada y el hook activará el backoff exponencial normalmente. El banner "Reconectar Canal" aparecerá — es el comportamiento esperado en desarrollo.

---

## 15. Frontend — Reglas de Hooks y Estado Global

Estas reglas existen porque **dos bugs críticos** fueron introducidos por violarlas. Leerlas antes de tocar cualquier hook o store.

### Regla 1 — Zustand: nunca uses el store completo como dependencia

`useAuthStore()` sin selector devuelve el **objeto de estado entero**. Cada vez que cualquier campo cambia, el objeto es nuevo. Usarlo como dependencia de `useCallback` o `useEffect` crea un loop infinito.

```tsx
// ❌ NUNCA — store cambia en cada render que modifica cualquier campo
const store = useAuthStore()
const fn = useCallback(() => {
  store.setAdvisor(...)
}, [store])   // <- nueva ref en cada estado → loop

useEffect(() => { ... }, [store, fn])  // <- re-corre en cada cambio de estado
```

```tsx
// ✅ CORRECTO — selector fino o getState() para writes dentro de effects
const session = useAuthStore((s) => s.session)       // selector fino para lectura reactiva
useAuthStore.getState().setAdvisor(...)              // imperativo para writes en effects
```

### Regla 2 — Nunca pongas en deps un valor del store que escribes dentro del effect

Si un `useEffect` llama a `setReconnectAttempt(n + 1)` y `reconnectAttempt` está en sus deps, el effect se re-ejecuta en cada incremento — el backoff queda anulado.

```tsx
// ❌ NUNCA — setReconnectAttempt está dentro del effect y reconnectAttempt en las deps
const reconnectAttempt = useWSStore((s) => s.reconnectAttempt)
useEffect(() => {
  ws.onclose = () => {
    setReconnectAttempt(reconnectAttempt + 1)  // cambia el store
    setTimeout(connect, delay)
  }
  connect()
}, [reconnectAttempt])  // <- re-corre inmediatamente, saltea el setTimeout
```

```tsx
// ✅ CORRECTO — leer con getState() dentro del callback, fuera de las deps
useEffect(() => {
  ws.onclose = () => {
    const attempt = useWSStore.getState().reconnectAttempt  // lectura imperativa
    setReconnectAttempt(attempt + 1)
    setTimeout(connect, delay)
  }
  connect()
}, [])  // <- no depende del valor que se escribe
```

### Regla 3 — useAuth tiene deps vacíos: no los toques

`src/hooks/useAuth.ts` tiene `useEffect(..., [])`. Esta es una decisión intencional. El effect:
- Se suscribe a `supabase.auth.onAuthStateChange` una sola vez
- Llama `getSession()` una sola vez al montar

Si agregas deps al array, `getSession()` se vuelve a llamar en cada cambio de estado, lo que borra la sesión mock (Supabase devuelve `null` para tokens fake) y expulsa al usuario al login.

**Todas las escrituras al store dentro de este effect usan `useAuthStore.getState()`** — no el `store` del closure.

### Regla 4 — useWebSocket tiene un socket global: no lo dupliques

`socket`, `isConnecting` y `reconnectTimeout` son variables de **módulo** (fuera del hook). Hay exactamente **un** socket activo en toda la app. El hook tiene un guard `if (socket || isConnecting) return` para evitar conexiones duplicadas.

No llames `new WebSocket(...)` directamente fuera de `useWebSocket`. No montes `useWebSocket` en más de un lugar con lógica de conexión (solo en `ProtectedRoute` para la conexión base).

### Regla 5 — Handlers de WS: useCallback con deps estables

Al pasar `handlers` a `useWebSocket({ onEscalationNew: fn })`, si `fn` es una función creada inline en cada render, el effect de registro se re-ejecuta en cada render. Usar `useCallback` o definir la función fuera del componente.

```tsx
// ❌ NUNCA — nueva referencia en cada render
useWebSocket({
  onEscalationNew: (data) => { loadConversations() }
})

// ✅ CORRECTO — función estable
const handleEscalation = useCallback((data: WSEscalationNew) => {
  loadConversations()
}, [loadConversations])

useWebSocket({ onEscalationNew: handleEscalation })
```

---

## 16. Frontend — Lo que NUNCA Debes Hacer

```tsx
// ❌ Store completo como dependencia de hook
const store = useAuthStore()
useEffect(() => { ... }, [store])
useCallback(() => { ... }, [store])

// ✅ Selector fino o getState()
const session = useAuthStore((s) => s.session)
useEffect(() => { useAuthStore.getState().setLoading(false) }, [])
```

```tsx
// ❌ Valor del store que se escribe dentro del effect, puesto en las deps
const attempt = useWSStore((s) => s.reconnectAttempt)
useEffect(() => {
  setReconnectAttempt(attempt + 1)
}, [attempt])

// ✅ Leer con getState() dentro del callback
useEffect(() => {
  const attempt = useWSStore.getState().reconnectAttempt
  setReconnectAttempt(attempt + 1)
}, [])
```

```tsx
// ❌ Agregar deps al useEffect de useAuth.ts
useEffect(() => { ... }, [store, setHardcodedAdvisor])  // rompe el login mock

// ✅ Mantener deps vacíos — es intencional
useEffect(() => { ... }, [])
```

```tsx
// ❌ Instanciar WebSocket fuera del hook
const ws = new WebSocket(url)  // duplica el socket global

// ✅ Solo a través de useWebSocket()
const { reconnect } = useWebSocket()
```

```tsx
// ❌ Navegar a rutas hardcodeadas
navigate('/bandeja')

// ✅ Usar las constantes
import { ROUTES } from '../constants/routes'
navigate(ROUTES.BANDEJA)
```

- No hacer llamadas HTTP directas con `fetch` — siempre usar `conversationsService` (que usa el `apiClient` de axios con auth automática).
- No mezclar lógica de presentación con llamadas a la API — la lógica de fetch va en el `useEffect` de la página, no dentro de componentes hijo.
- No usar `localStorage` directamente para guardar la sesión — Supabase Auth lo maneja internamente.
- No importar `socket` del módulo `useWebSocket` — es una variable privada del módulo.

---

## 17. Integración Frontend-Backend — Reglas Críticas

Esta sección rige toda la integración entre el panel React y la API FastAPI. El contrato está definido en `docs/panel_api_reference.md` — ese documento es la fuente de verdad.

### 17.1 Autenticación

El token JWT viene de `supabase.auth.signInWithPassword()` → `session.access_token`. Se pasa en cada llamada como `Authorization: Bearer <jwt>`. El hook `useAuth.ts` y el cliente axios en `src/lib/axios.ts` ya lo inyectan automáticamente — no volver a agregar el header manualmente.

El **WebSocket** es la única excepción: el JWT va como query param, no como header:

```
wss://<host>/api/v1/panel/ws?token=<jwt>
```

Si el servidor cierra con código `4001` → JWT inválido o expirado → redirigir al login inmediatamente.

`POST /api/v1/panel/auth/token` es un endpoint de desarrollo que emite un JWT **sin verificar password**. Solo usarlo para pruebas locales. Nunca en el flujo de producción.

### 17.2 Envelope de respuesta

Toda respuesta exitosa sigue este formato:

```json
{ "data": { ... } }
```

Toda respuesta de error:

```json
{ "detail": { "code": "ERROR_CODE", "message": "Mensaje legible" } }
```

Acceder siempre a `response.data.X`, nunca a `response.X` directamente. Manejar errores leyendo `error.detail.code`.

### 17.3 Renderizado de mensajes

Usar **`msg_type`** como fuente de verdad para decidir cómo renderizar — no la nulabilidad de `content` o `media_url`.

| `msg_type`   | Cómo renderizar                                             |
| ------------ | ----------------------------------------------------------- |
| `text`       | Texto plano con `content`                                   |
| `audio`      | `<audio src={media_url} />` — **nunca mostrar transcription** |
| `image`      | `<img src={media_url} />`                                   |
| `video`      | `<video src={media_url} controls />`                        |
| `document`   | `<a href={media_url}>Descargar</a>`                         |

**`transcription`** es contexto interno del agente de IA (Whisper). No es contenido de mensaje para el asesor. Si se quiere exponer, solo como toggle colapsado "Ver transcripción" — nunca como texto del bubble.

**`media_url`** es siempre una URL firmada de Supabase Storage (válida 1 año). Usable directamente en `<img>`, `<audio>`, `<video>`, `<a>`. Nunca es un ID de media de Meta.

### 17.4 Subida de archivos (multipart)

Para `POST /reply/media` y `POST /reply/audio`, usar `FormData`. **No poner `Content-Type`** en el header — el browser lo setea automáticamente con el boundary correcto:

```tsx
// ✅ CORRECTO
const formData = new FormData()
formData.append('file', file)
await apiClient.post(`/conversations/${id}/reply/media`, formData, {
  headers: { Authorization: `Bearer ${token}` } // solo Authorization, sin Content-Type
})

// ❌ NUNCA
headers: { 'Content-Type': 'multipart/form-data' }  // rompe el boundary
```

### 17.5 WebSocket — eventos del servidor

Todos los eventos tienen el envelope `{ "event": "<tipo>", "data": { ... } }`.

Eventos relevantes para el frontend:

| Evento                | Acción esperada en el frontend                                               |
| --------------------- | ---------------------------------------------------------------------------- |
| `message.new`         | Append al chat si `conversation_id` coincide; actualizar badge en la bandeja |
| `escalation.new`      | Mostrar `EscalationToast`; recargar lista de conversaciones                  |
| `escalation.assigned` | Actualizar tarjeta — quitar de cola sin asignar                              |
| `conversation.returned` | Marcar conversación con ícono de bot                                       |
| `conversation.closed` | Quitar de bandeja o actualizar estado                                        |
| `advisor.status_changed` | Actualizar badge de disponibilidad en vista de equipo                     |
| `behavior.alert`      | Solo admins: mostrar badge + llamar `GET /behavior-alerts/` para detalles   |

**`conversation.closed` defensivo:** `advisor_id` y `advisor_name` están ausentes cuando `closed_by === "bot"`. Siempre verificar `closed_by` antes de leer esos campos.

**`behavior.alert`** solo trae `alert_id` — no el contenido completo. Diseñado así para no difundir contenido de mensajes sensibles a todos los admins conectados. Llamar a `GET /behavior-alerts/` después de recibirlo.

El cliente debe enviar `{ "type": "ping" }` cada 30 segundos. El servidor responde `{ "type": "pong" }`.

Al abrir un chat, enviar `subscribe_conversation` con el `conversation_id`. Al cerrar el chat, enviar `unsubscribe_conversation`.

### 17.6 Casos de borde conocidos

| Situación | Comportamiento |
|---|---|
| `PATCH /assign` con dos asesores simultáneos | Posible race condition — el segundo recibe `ALREADY_ASSIGNED` (409). Mostrar: "Otro asesor tomó esta conversación primero." |
| `status_until` en respuestas de asesor | Es hora local de Bogotá sin timezone suffix. No asumir UTC al parsear. |
| Asesor desactivado mientras tiene conversaciones activas | La respuesta de `PATCH /advisors/{id}` incluye `"warning"` no-nulo — mostrarlo al admin. |
| `active_conversations` en perfil de asesor | Puede ser `0` si el RPC de Supabase falla — no es un error, es un fallback silencioso. |
| Cerrar conversación sin body | Aplica defaults: `resolution_type = "otro"`, `client_satisfied = "sin_confirmar"`. Válido y correcto. |

### 17.7 Quitar mocks progresivamente

El orden recomendado para conectar el frontend al backend real:

1. **Auth**: ya funciona con Supabase real — eliminar el mock login una vez el equipo tenga credenciales de prueba.
2. **`GET /conversations/`**: reemplazar el fallback mock en `conversationsService.list()`.
3. **`GET /conversations/{id}`**: conectar `ChatPage` al endpoint real.
4. **Reply (texto, media, audio)**: el `id === 'demo'` guard puede removerse cuando el chat use conversaciones reales.
5. **WebSocket**: cambiar la URL a la del backend real; el token JWT de Supabase ya es válido.
6. **`GET /advisors/me`**: conectar al cargar `ProtectedRoute` para tener el perfil real.
7. **Resto de endpoints**: alerts, schedules, metrics — conectar en orden de prioridad del equipo.

No eliminar todos los mocks a la vez — hacerlo endpoint por endpoint para detectar regresiones.
