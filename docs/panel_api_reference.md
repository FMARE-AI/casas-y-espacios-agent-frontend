# Panel Web — API Reference

## Overview

**Base URL:** `/api/v1/panel`

**Authentication:** All endpoints except the debug token endpoint require a JWT in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

**Response envelope:** All successful responses follow this structure:

```json
{ "data": { ... } }
```

All error responses follow this structure:

```json
{ "detail": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

---

## Authentication

The frontend authenticates via `POST /api/v1/panel/auth/token` — **never directly against Supabase Auth**. The backend validates the credentials, verifies the advisor is active in the `advisors` table, and returns the Supabase-issued JWT. Calling Supabase Auth directly from the frontend would bypass the `is_active` check, allowing deactivated advisors to obtain valid tokens.

The JWT is signed with **ES256** using Supabase's EC private key. FastAPI verifies it against the Supabase public JWK. The `sub` claim contains the advisor's UUID.

### POST /api/v1/panel/auth/token

**Auth required:** No

**Description:** Authenticates an advisor with email and password via Supabase Auth. Verifies the advisor exists in the `advisors` table and is active. Returns the ES256 JWT issued by Supabase.

**Request body:**

```json
{
  "email": "asesor@casasyespacios.co",
  "password": "secretpassword"
}
```

**Response 200:**

```json
{
  "access_token": "eyJhbGciOiJFUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJFUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "advisor_id": "550e8400-e29b-41d4-a716-446655440001",
  "full_name": "Ana Gómez",
  "role": "asesor",
  "must_change_password": false
}
```

**`must_change_password`:** `true` for newly created advisors. The frontend should redirect them to a password change screen. Set to `false` via `PATCH /advisors/me` after the new password is established.

**Errors:**

| HTTP | ErrorCode          | When                                                        |
| ---- | ------------------ | ----------------------------------------------------------- |
| 401  | `INVALID_TOKEN`    | Wrong email or password                                     |
| 401  | `INVALID_TOKEN`    | Supabase Auth user exists but no matching row in `advisors` |
| 403  | `ADVISOR_INACTIVE` | Advisor exists but `is_active = false`                      |
| 503  | `INVALID_TOKEN`    | Connection error to Supabase Auth                           |

---

### POST /api/v1/panel/auth/token/refresh

**Auth required:** No

**Description:** Renews the `access_token` using a valid `refresh_token`. The frontend interceptor should call this automatically before the `access_token` expires. On failure, the frontend must redirect to `/login`.

**Request body:**

```json
{
  "refresh_token": "eyJhbGciOiJFUzI1NiIs..."
}
```

**Response 200:**

```json
{
  "access_token": "eyJhbGciOiJFUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJFUzI1NiIs...",
  "expires_in": 3600,
  "token_type": "bearer"
}
```

**Errors:**

| HTTP | ErrorCode       | When                                                                    |
| ---- | --------------- | ----------------------------------------------------------------------- |
| 401  | `INVALID_TOKEN` | `refresh_token` invalid or expired — frontend must redirect to `/login` |
| 503  | `INVALID_TOKEN` | Connection error to Supabase Auth                                       |

---

## Conversations

### GET /api/v1/panel/conversations/

**Auth required:** Yes (any active advisor)

**Description:** Paginated list of conversations for the inbox tray. Ordered by `last_activity` DESC. Advisors see only conversations in their area or channel. Admins see all conversations.

**Query params:**

| Param     | Type      | Default | Description                                                              |
| --------- | --------- | ------- | ------------------------------------------------------------------------ |
| `status`  | `string`  | none    | Filter by status: `activa`, `escalada`, `cerrada`, or `mine` (see below) |
| `channel` | `string`  | none    | Filter by channel: `administrativa`, `comercial`                         |
| `limit`   | `integer` | 20      | Page size (1–100)                                                        |
| `offset`  | `integer` | 0       | Pagination offset                                                        |

**Response 200:**

```json
{
  "data": {
    "conversations": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "status": "escalada",
        "bot_activo": false,
        "channel": "administrativa",
        "last_activity": "2026-06-22T14:35:00+00:00",
        "intent": "cartera",
        "client": {
          "id": "550e8400-e29b-41d4-a716-446655440020",
          "phone_number": "+573001234567",
          "full_name": "Carlos Rodríguez",
          "document_id": "1020304050",
          "client_type": "propietario"
        },
        "escalation": {
          "id": "550e8400-e29b-41d4-a716-446655440030",
          "reason": "solicitud_usuario",
          "escalated_at": "2026-06-22T14:20:00+00:00",
          "wait_seconds": 900,
          "advisor": {
            "id": "550e8400-e29b-41d4-a716-446655440001",
            "full_name": "Ana Gómez",
            "area": "administrativa",
            "specialty": "financiera"
          }
        }
      }
    ],
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

**Errors:**

| HTTP | ErrorCode          | When                                            |
| ---- | ------------------ | ----------------------------------------------- |
| 400  | `INVALID_STATUS`   | `status` query param has an unrecognized value  |
| 400  | `INVALID_STATUS`   | `channel` query param has an unrecognized value |
| 401  | `INVALID_TOKEN`    | Missing or invalid JWT                          |
| 403  | `ADVISOR_INACTIVE` | Advisor account is deactivated                  |

**Notes:**

- The `escalation.wait_seconds` field is computed at request time as the number of seconds since `escalated_at`.
- An `escalation` object is included only if there is an unresolved escalation (`resolved_at IS NULL`).
- Advisors with `area = "ambas"` see conversations from both channels.
- **`status=mine`** is a special filter that returns only the conversations with an active escalation assigned to the authenticated advisor (i.e., the "My conversations" tab). It can be combined freely with `channel`. Admins using `mine` see only conversations assigned to themselves — not all conversations.

---

### GET /api/v1/panel/conversations/{conversation_id}

**Auth required:** Yes (any active advisor; area-restricted for non-admins)

**Description:** Full conversation detail with client info, active escalation, and paginated message history.

**Path params:**

| Param             | Type            | Description         |
| ----------------- | --------------- | ------------------- |
| `conversation_id` | `string` (UUID) | The conversation ID |

**Query params:**

| Param    | Type      | Default | Description                         |
| -------- | --------- | ------- | ----------------------------------- |
| `limit`  | `integer` | 50      | Number of messages to fetch (1–100) |
| `offset` | `integer` | 0       | Message pagination offset           |

**Response 200:**

```json
{
  "data": {
    "conversation": {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "status": "escalada",
      "bot_activo": false,
      "channel": "administrativa",
      "client": {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "full_name": "Carlos Rodríguez",
        "phone_number": "+573001234567",
        "document_id": "1020304050",
        "client_type": "propietario"
      },
      "escalation": {
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "reason": "solicitud_usuario",
        "summary": "Cliente solicita revisión de saldo de cartera correspondiente al mes de mayo.",
        "escalated_at": "2026-06-22T14:20:00+00:00",
        "advisor": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "full_name": "Ana Gómez"
        }
      },
      "messages": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440050",
          "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
          "wam_id": "wamid.HBgLNTczMDAxMjM0NTY3FQIAEhgWM0E4QjA2RjhDRjhCMzVCODk1NDUC",
          "direction": "inbound",
          "msg_type": "text",
          "content": "Buenos días, necesito información sobre mi cartera.",
          "media_url": null,
          "media_mime_type": null,
          "media_size_bytes": null,
          "transcription": null,
          "delivered_via": "webhook_meta",
          "timestamp": "2026-06-22T14:05:00+00:00",
          "created_at": "2026-06-22T14:05:01+00:00"
        }
      ],
      "total_messages": 8
    }
  }
}
```

**Errors:**

| HTTP | ErrorCode                   | When                                                     |
| ---- | --------------------------- | -------------------------------------------------------- |
| 401  | `INVALID_TOKEN`             | Missing or invalid JWT                                   |
| 403  | `ADVISOR_INACTIVE`          | Advisor account is deactivated                           |
| 403  | `CONVERSATION_OUTSIDE_AREA` | Advisor's area does not match the conversation's channel |
| 404  | `CONVERSATION_NOT_FOUND`    | No conversation with the given ID                        |

---

### GET /api/v1/panel/conversations/{conversation_id}/messages

**Auth required:** Yes (any active advisor; area-restricted for non-admins)

**Description:** Paginated message history for a conversation. Ordered by `timestamp` ASC (oldest first). Use this endpoint for infinite-scroll pagination after the initial load via the conversation detail endpoint.

**Path params:**

| Param             | Type            | Description         |
| ----------------- | --------------- | ------------------- |
| `conversation_id` | `string` (UUID) | The conversation ID |

**Query params:**

| Param    | Type      | Default | Description       |
| -------- | --------- | ------- | ----------------- |
| `limit`  | `integer` | 20      | Page size (1–100) |
| `offset` | `integer` | 0       | Pagination offset |

**Response 200:**

```json
{
  "data": {
    "messages": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440050",
        "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
        "wam_id": "wamid.HBgLNTczMDAxMjM0NTY3FQIAEhgWM0E4QjA2RjhDRjhCMzVCODk1NDUC",
        "direction": "inbound",
        "msg_type": "text",
        "content": "Buenos días, necesito información sobre mi cartera.",
        "media_url": null,
        "media_mime_type": null,
        "media_size_bytes": null,
        "transcription": null,
        "delivered_via": "webhook_meta",
        "timestamp": "2026-06-22T14:05:00+00:00",
        "created_at": "2026-06-22T14:05:01+00:00"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440051",
        "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
        "wam_id": "wamid.HBgLNTczMDAxMjM0NTY3FQIAEhgWM0E4QjA2RjhDRjhCMzVCODk1NDUD",
        "direction": "inbound",
        "msg_type": "audio",
        "content": null,
        "media_url": "https://xxxx.supabase.co/storage/v1/object/sign/casas-y-espacios-media/inbound/conv-uuid/wamid_audio?token=...",
        "media_mime_type": "audio/ogg; codecs=opus",
        "media_size_bytes": null,
        "transcription": "Hola, quiero saber cuánto debo de arriendo este mes.",
        "delivered_via": "webhook_meta",
        "timestamp": "2026-06-22T14:06:00+00:00",
        "created_at": "2026-06-22T14:06:01+00:00"
      }
    ],
    "total": 8,
    "limit": 20,
    "offset": 0
  }
}
```

**Message field reference:**

| Field           | Type             | Description                                                                                                                                                              |
| --------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `msg_type`      | `string`         | `"text"`, `"audio"`, `"image"`, `"video"`, `"document"`                                                                                                                  |
| `content`       | `string \| null` | Text content. Non-null only for `msg_type = "text"`                                                                                                                      |
| `media_url`     | `string \| null` | Signed Supabase Storage URL (valid 1 year). Non-null for `audio`, `image`, `video`, `document`. Always a full HTTPS URL — never a raw Meta media ID                      |
| `transcription` | `string \| null` | Whisper transcription of the audio. Non-null only for `msg_type = "audio"` that the bot processed. `null` for audio sent by the advisor or processed before this feature |

**Audio rendering rule — important:**

When `msg_type = "audio"`, **always render an audio player** using `media_url`. Do **not** display `transcription` as message text — it is internal context used by the AI agent to maintain conversation history. If you want to offer a "show transcript" affordance (e.g., a toggle below the player), you may use `transcription` for that, but it should be hidden by default.

```
msg_type = "audio"  →  render <audio src={media_url} />  (transcription is NOT shown)
msg_type = "text"   →  render content as text
msg_type = "image"  →  render <img src={media_url} />
msg_type = "video"  →  render <video src={media_url} />
msg_type = "document" → render download link using media_url
```

**Errors:**

| HTTP | ErrorCode                   | When                                                     |
| ---- | --------------------------- | -------------------------------------------------------- |
| 401  | `INVALID_TOKEN`             | Missing or invalid JWT                                   |
| 403  | `CONVERSATION_OUTSIDE_AREA` | Advisor's area does not match the conversation's channel |
| 404  | `CONVERSATION_NOT_FOUND`    | No conversation with the given ID                        |

---

### POST /api/v1/panel/conversations/{conversation_id}/reply

**Auth required:** Yes (assigned advisor or admin)

**Description:** Sends a text message from the advisor to the client via the Meta WhatsApp API. Saves the message to the database, updates `last_activity`, emits a `message.new` WebSocket event, and runs background moderation on the message content.

**Path params:**

| Param             | Type            | Description         |
| ----------------- | --------------- | ------------------- |
| `conversation_id` | `string` (UUID) | The conversation ID |

**Request body:**

```json
{
  "text": "Hola Carlos, con gusto le ayudo con la información de su cartera."
}
```

| Field  | Type     | Constraints                              |
| ------ | -------- | ---------------------------------------- |
| `text` | `string` | Required, non-empty, max 4096 characters |

**Response 200:**

```json
{
  "data": {
    "message": {
      "id": "550e8400-e29b-41d4-a716-446655440055",
      "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
      "wam_id": "wamid.HBgLNTczMDAxMjM0NTY3FQIAEhgWM0E4QjA2RjhDRjhCMzVCODk1NDUB",
      "direction": "outbound_advisor",
      "msg_type": "text",
      "content": "Hola Carlos, con gusto le ayudo con la información de su cartera.",
      "media_url": null,
      "media_mime_type": null,
      "media_size_bytes": null,
      "delivered_via": "websocket_panel",
      "timestamp": "2026-06-22T14:36:00+00:00",
      "created_at": "2026-06-22T14:36:00+00:00"
    }
  }
}
```

**Errors:**

| HTTP | ErrorCode                   | When                                                                        |
| ---- | --------------------------- | --------------------------------------------------------------------------- |
| 400  | `EMPTY_MESSAGE`             | `text` is empty or whitespace only                                          |
| 400  | `MESSAGE_TOO_LONG`          | `text` exceeds 4096 characters                                              |
| 401  | `INVALID_TOKEN`             | Missing or invalid JWT                                                      |
| 403  | `ADVISOR_INACTIVE`          | Advisor account is deactivated                                              |
| 403  | `BOT_IS_ACTIVE`             | Bot currently controls the conversation                                     |
| 403  | `NOT_ASSIGNED`              | Advisor is not the assigned advisor for this conversation (non-admins only) |
| 403  | `CONVERSATION_OUTSIDE_AREA` | Conversation channel doesn't match the advisor's area                       |
| 404  | `CONVERSATION_NOT_FOUND`    | No conversation with the given ID                                           |
| 502  | `META_API_ERROR`            | WhatsApp API call failed or the line record was not found                   |

**Notes:**

- Background moderation runs asynchronously via `asyncio.create_task`. If moderation detects inappropriate content, a `behavior.alert` WebSocket event is emitted to admins only.
- The message is persisted and the WhatsApp delivery happens before the response is returned. If Meta API fails, no message is saved.
- Admins can reply to any conversation in their area regardless of assignment.

**WebSocket events emitted:**

- `message.new` — broadcast to all connected advisors

---

### POST /api/v1/panel/conversations/{conversation_id}/reply/media

**Auth required:** Yes (assigned advisor or admin)

**Description:** Sends a media file (image, video, or document) to the client. Uses `multipart/form-data`. Uploads the file to Supabase Storage, generates a signed URL valid for 1 year, then sends via Meta API.

**Path params:**

| Param             | Type            | Description         |
| ----------------- | --------------- | ------------------- |
| `conversation_id` | `string` (UUID) | The conversation ID |

**Request body:** `multipart/form-data`

| Field     | Type     | Description                             |
| --------- | -------- | --------------------------------------- |
| `file`    | `File`   | Required. The media file                |
| `caption` | `string` | Optional. Caption for images and videos |

**Allowed MIME types and size limits:**

| MIME type                                                                 | Max size |
| ------------------------------------------------------------------------- | -------- |
| `image/jpeg`                                                              | 5 MB     |
| `image/png`                                                               | 5 MB     |
| `image/webp`                                                              | 5 MB     |
| `video/mp4`                                                               | 16 MB    |
| `video/3gpp`                                                              | 16 MB    |
| `application/pdf`                                                         | 20 MB    |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | 20 MB    |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`       | 20 MB    |

**Response 200:**

```json
{
  "data": {
    "message": {
      "id": "550e8400-e29b-41d4-a716-446655440056",
      "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
      "wam_id": "wamid.HBgLNTczMDAxMjM0NTY3FQIAEhgWM0E4QjA2RjhDRjhCMzVCODk1NDUC",
      "direction": "outbound_advisor",
      "msg_type": "image",
      "content": "Estado de cuenta mayo 2026",
      "media_url": "https://xxxx.supabase.co/storage/v1/object/sign/outbound/...",
      "media_mime_type": "image/jpeg",
      "media_size_bytes": 204800,
      "delivered_via": "websocket_panel",
      "timestamp": "2026-06-22T14:37:00+00:00",
      "created_at": "2026-06-22T14:37:00+00:00"
    }
  }
}
```

**Errors:**

| HTTP | ErrorCode                   | When                                                    |
| ---- | --------------------------- | ------------------------------------------------------- |
| 400  | `FILE_TYPE_NOT_ALLOWED`     | MIME type is not in the allowed list                    |
| 400  | `FILE_TOO_LARGE`            | File exceeds the size limit for its MIME type           |
| 401  | `INVALID_TOKEN`             | Missing or invalid JWT                                  |
| 403  | `BOT_IS_ACTIVE`             | Bot currently controls the conversation                 |
| 403  | `NOT_ASSIGNED`              | Advisor is not the assigned advisor                     |
| 403  | `CONVERSATION_OUTSIDE_AREA` | Conversation channel doesn't match advisor's area       |
| 404  | `CONVERSATION_NOT_FOUND`    | No conversation with the given ID                       |
| 502  | `META_API_ERROR`            | WhatsApp API call failed                                |
| 503  | `STORAGE_ERROR`             | Supabase Storage upload or signed URL generation failed |

**Notes:**

- If Meta API fails after the file has already been uploaded to Storage, the file remains in Storage but no message is created. This is a known trade-off.
- `msg_type` in the response is derived from the MIME type: `image/*` → `"image"`, `video/*` → `"video"`, everything else → `"document"`.

**WebSocket events emitted:**

- `message.new` — broadcast to all connected advisors

---

### POST /api/v1/panel/conversations/{conversation_id}/reply/audio

**Auth required:** Yes (assigned advisor or admin)

**Description:** Sends a voice note to the client. Uses `multipart/form-data`. Uploads the audio to Supabase Storage and sends via Meta API.

**Path params:**

| Param             | Type            | Description         |
| ----------------- | --------------- | ------------------- |
| `conversation_id` | `string` (UUID) | The conversation ID |

**Request body:** `multipart/form-data`

| Field  | Type   | Description              |
| ------ | ------ | ------------------------ |
| `file` | `File` | Required. The audio file |

**Allowed MIME types:** `audio/ogg`, `audio/mpeg`, `audio/mp4`, `audio/aac`, `audio/amr`

**Max size:** 16 MB

**Response 200:**

```json
{
  "data": {
    "message": {
      "id": "550e8400-e29b-41d4-a716-446655440057",
      "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
      "wam_id": "wamid.HBgLNTczMDAxMjM0NTY3FQIAEhgWM0E4QjA2RjhDRjhCMzVCODk1NDUD",
      "direction": "outbound_advisor",
      "msg_type": "audio",
      "content": null,
      "media_url": "https://xxxx.supabase.co/storage/v1/object/sign/outbound/...",
      "media_mime_type": "audio/ogg",
      "media_size_bytes": 102400,
      "delivered_via": "websocket_panel",
      "timestamp": "2026-06-22T14:38:00+00:00",
      "created_at": "2026-06-22T14:38:00+00:00"
    }
  }
}
```

**Errors:**

| HTTP | ErrorCode                   | When                                                    |
| ---- | --------------------------- | ------------------------------------------------------- |
| 400  | `FILE_TYPE_NOT_ALLOWED`     | MIME type is not in the allowed audio list              |
| 400  | `FILE_TOO_LARGE`            | Audio file exceeds 16 MB                                |
| 401  | `INVALID_TOKEN`             | Missing or invalid JWT                                  |
| 403  | `BOT_IS_ACTIVE`             | Bot currently controls the conversation                 |
| 403  | `NOT_ASSIGNED`              | Advisor is not the assigned advisor                     |
| 403  | `CONVERSATION_OUTSIDE_AREA` | Conversation channel doesn't match advisor's area       |
| 404  | `CONVERSATION_NOT_FOUND`    | No conversation with the given ID                       |
| 502  | `META_API_ERROR`            | WhatsApp API call failed or line not found              |
| 502  | `STORAGE_ERROR`             | Supabase Storage upload or signed URL generation failed |

**WebSocket events emitted:**

- `message.new` — broadcast to all connected advisors

---

### PATCH /api/v1/panel/conversations/{conversation_id}/assign

**Auth required:** Yes (any active advisor)

**Description:** The authenticated advisor self-assigns to an escalated conversation. No request body. The advisor becomes the assigned advisor on the active escalation record, and the conversation status is set to `activa`.

**Path params:**

| Param             | Type            | Description                |
| ----------------- | --------------- | -------------------------- |
| `conversation_id` | `string` (UUID) | The conversation to assign |

**Response 200:**

```json
{
  "data": {
    "escalation": {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "advisor_id": "550e8400-e29b-41d4-a716-446655440001",
      "advisor_name": "Ana Gómez"
    }
  }
}
```

**Errors:**

| HTTP | ErrorCode                    | When                                                              |
| ---- | ---------------------------- | ----------------------------------------------------------------- |
| 401  | `INVALID_TOKEN`              | Missing or invalid JWT                                            |
| 403  | `ADVISOR_INACTIVE`           | Advisor account is deactivated                                    |
| 403  | `CONVERSATION_OUTSIDE_AREA`  | Conversation's channel is outside the advisor's area              |
| 404  | `CONVERSATION_NOT_FOUND`     | No conversation with the given ID                                 |
| 409  | `CONVERSATION_NOT_ESCALATED` | Conversation status is not `escalada` or has no active escalation |
| 409  | `ALREADY_ASSIGNED`           | Another advisor is already assigned to this escalation            |
| 409  | `MAX_CONVERSATIONS_REACHED`  | Advisor has reached their `max_conversations` limit               |

**Notes:**

- The `MAX_CONVERSATIONS_REACHED` error message includes the current and maximum counts: `"Tienes X de Y conversaciones activas — llegaste al límite"`.
- After a successful assign, the conversation `status` transitions from `escalada` → `activa`.
- Race condition: two advisors clicking "take conversation" simultaneously can both pass the `ALREADY_ASSIGNED` check if the read happens before either write completes. There is no optimistic lock on this operation.

**WebSocket events emitted:**

- `escalation.assigned` — broadcast to all connected advisors

---

### PATCH /api/v1/panel/conversations/{conversation_id}/return-bot

**Auth required:** Yes (assigned advisor or admin)

**Description:** Returns control of the conversation to the bot. Sets `bot_activo = true`, status to `activa`, and resolves the active escalation. No request body.

**Path params:**

| Param             | Type            | Description                           |
| ----------------- | --------------- | ------------------------------------- |
| `conversation_id` | `string` (UUID) | The conversation to return to the bot |

**Response 200:**

```json
{
  "data": {
    "conversation": {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "bot_activo": true,
      "status": "activa"
    }
  }
}
```

**Errors:**

| HTTP | ErrorCode                | When                                          |
| ---- | ------------------------ | --------------------------------------------- |
| 401  | `INVALID_TOKEN`          | Missing or invalid JWT                        |
| 403  | `ADVISOR_INACTIVE`       | Advisor account is deactivated                |
| 403  | `BOT_ALREADY_ACTIVE`     | Bot already controls this conversation        |
| 403  | `NOT_ASSIGNED`           | Non-admin advisor is not the assigned advisor |
| 404  | `CONVERSATION_NOT_FOUND` | No conversation with the given ID             |

**WebSocket events emitted:**

- `conversation.returned` — broadcast to all connected advisors

---

### PATCH /api/v1/panel/conversations/{conversation_id}/close

**Auth required:** Yes (assigned advisor or admin)

**Description:** Closes the conversation permanently and records how it was resolved. Sets `status = "cerrada"`, `bot_activo = false`, `closed_by = "asesor"`, and `closed_at = now()`. Resolves any active escalation. The request body is optional — omitting it applies the defaults (`resolution_type = "otro"`, `client_satisfied = "sin_confirmar"`).

**Path params:**

| Param             | Type            | Description               |
| ----------------- | --------------- | ------------------------- |
| `conversation_id` | `string` (UUID) | The conversation to close |

**Request body (all fields optional):**

```json
{
  "resolution_type": "consulta_cartera_resuelta",
  "resolution_notes": "El propietario confirmó recibo del estado de cuenta.",
  "client_satisfied": "si"
}
```

| Field              | Type               | Default           | Constraints                                                 |
| ------------------ | ------------------ | ----------------- | ----------------------------------------------------------- |
| `resolution_type`  | `string`           | `"otro"`          | Must be one of the `ResolutionType` enum values (see below) |
| `resolution_notes` | `string` or `null` | `null`            | Optional, max 1000 characters                               |
| `client_satisfied` | `string`           | `"sin_confirmar"` | `"si"`, `"no"`, or `"sin_confirmar"`                        |

**`resolution_type` allowed values:**

| Value                            | When to use                                        |
| -------------------------------- | -------------------------------------------------- |
| `consulta_cartera_resuelta`      | Cartera/balance inquiry answered satisfactorily    |
| `pago_acordado`                  | Payment agreement reached with the owner           |
| `orden_mantenimiento_creada`     | Maintenance work order created in SIMI             |
| `queja_pqrs_registrada`          | Complaint or PQR formally registered               |
| `informacion_contrato_entregada` | Lease or contract information delivered            |
| `derivado_otro_canal`            | Client redirected to another channel or department |
| `sin_respuesta_cliente`          | Client stopped responding                          |
| `consulta_resuelta_confirmada`   | Client explicitly confirmed the issue is resolved  |
| `otro`                           | Default. Use when no other type fits               |

**Response 200:**

```json
{
  "data": {
    "conversation": {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "status": "cerrada",
      "resolution_type": "consulta_cartera_resuelta",
      "resolution_notes": "El propietario confirmó recibo del estado de cuenta.",
      "client_satisfied": "si",
      "closed_by": "asesor",
      "closed_at": "2026-06-23T14:30:00+00:00"
    }
  }
}
```

**Errors:**

| HTTP | ErrorCode                | When                                                              |
| ---- | ------------------------ | ----------------------------------------------------------------- |
| 400  | `INVALID_STATUS`         | `resolution_type` or `client_satisfied` has an unrecognized value |
| 401  | `INVALID_TOKEN`          | Missing or invalid JWT                                            |
| 403  | `ADVISOR_INACTIVE`       | Advisor account is deactivated                                    |
| 403  | `NOT_ASSIGNED`           | Non-admin advisor is not the assigned advisor                     |
| 404  | `CONVERSATION_NOT_FOUND` | No conversation with the given ID                                 |
| 409  | `ALREADY_CLOSED`         | Conversation status is already `cerrada`                          |
| 422  | _(Pydantic)_             | `resolution_notes` exceeds 1000 characters                        |

**Notes:**

- `closed_by` is always set to `"asesor"` by this endpoint. Bot-initiated closure (see below) sets `"bot"`.
- The bot can close conversations in two ways: (1) the inactivity job closes after no client response to a follow-up message, and (2) the AI agent closes proactively when it detects a farewell or satisfaction signal from the client (e.g., "gracias, ya quedó", "adiós"). Both cases emit `conversation.closed` via WebSocket with `closed_by: "bot"` and no `advisor_id`.
- `resolution_notes` accepts `null` — sending `null` or omitting the field stores `NULL` in the database.

**WebSocket events emitted:**

- `conversation.closed` — broadcast to all connected advisors

---

## Advisors

### GET /api/v1/panel/advisors/me

**Auth required:** Yes (any active advisor)

**Description:** Returns the full profile of the authenticated advisor, including the current active conversation count fetched via Supabase RPC.

**Response 200:**

```json
{
  "data": {
    "advisor": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "ana.gomez@casasyespacios.co",
      "full_name": "Ana Gómez",
      "role": "asesor",
      "area": "administrativa",
      "specialty": "financiera",
      "max_conversations": 3,
      "active_conversations": 1,
      "availability_status": "available",
      "is_active": true,
      "must_change_password": true
    }
  }
}
```

**Errors:**

| HTTP | ErrorCode          | When                           |
| ---- | ------------------ | ------------------------------ |
| 401  | `INVALID_TOKEN`    | Missing or invalid JWT         |
| 403  | `ADVISOR_INACTIVE` | Advisor account is deactivated |

**Notes:**

- `active_conversations` may return `0` if the Supabase RPC call fails — the failure is logged as a warning but does not surface as an error.
- `must_change_password` is `true` for newly created advisors. The `FirstLoginPage` flow sets it to `false` via `PATCH /advisors/me` after the advisor establishes their permanent password.

---

### GET /api/v1/panel/advisors/

**Auth required:** Yes (admin only)

**Description:** Lists all advisors in the system with their current active conversation count. All query params are optional and combinable.

**Query params:**

| Param       | Type      | Default | Description                                            |
| ----------- | --------- | ------- | ------------------------------------------------------ |
| `role`      | `string`  | none    | Filter by role: `asesor` or `admin`                    |
| `area`      | `string`  | none    | Filter by area: `administrativa`, `comercial`, `ambas` |
| `is_active` | `boolean` | none    | Filter by active status                                |

**Response 200:**

```json
{
  "data": {
    "advisors": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "email": "ana.gomez@casasyespacios.co",
        "full_name": "Ana Gómez",
        "role": "asesor",
        "area": "administrativa",
        "specialty": "financiera",
        "max_conversations": 3,
        "active_conversations": 2,
        "availability_status": "available",
        "is_active": true
      }
    ]
  }
}
```

**Errors:**

| HTTP | ErrorCode             | When                   |
| ---- | --------------------- | ---------------------- |
| 401  | `INVALID_TOKEN`       | Missing or invalid JWT |
| 403  | `FORBIDDEN`           | Caller is not an admin |
| 500  | `SUPABASE_AUTH_ERROR` | Database query failed  |

**Notes:**

- `active_conversations` is fetched via a separate RPC call per advisor. If the call fails for a given advisor, their count is set to `0`.

---

### POST /api/v1/panel/advisors/

**Auth required:** Yes (admin only)

**HTTP status on success:** 201 Created

**Description:** Creates a new advisor. Registers the user in Supabase Auth (creating a verified account) and inserts a row in the `advisors` table. If the profile insert fails after Auth user creation, the Auth user is rolled back.

**Request body:**

```json
{
  "email": "nuevo.asesor@casasyespacios.co",
  "password": "securepassword123",
  "full_name": "Luis Martínez",
  "role": "asesor",
  "area": "administrativa",
  "specialty": "mantenimiento_contratos",
  "max_conversations": 3
}
```

| Field               | Type               | Constraints                                               |
| ------------------- | ------------------ | --------------------------------------------------------- |
| `email`             | `string`           | Required                                                  |
| `password`          | `string`           | Required, min 8 characters                                |
| `full_name`         | `string`           | Required, min 1 character                                 |
| `role`              | `string`           | Required, must be `"asesor"` or `"admin"`                 |
| `area`              | `string`           | Required: `"administrativa"`, `"comercial"`, or `"ambas"` |
| `specialty`         | `string` or `null` | Optional. Must be valid for the given area (see notes)    |
| `max_conversations` | `integer`          | Default 3, range 1–10                                     |

**Response 201:**

```json
{
  "data": {
    "advisor": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "email": "nuevo.asesor@casasyespacios.co",
      "full_name": "Luis Martínez",
      "role": "asesor",
      "area": "administrativa",
      "specialty": "mantenimiento_contratos",
      "max_conversations": 3,
      "active_conversations": 0,
      "availability_status": "available",
      "is_active": true
    }
  }
}
```

**Errors:**

| HTTP | ErrorCode              | When                                                       |
| ---- | ---------------------- | ---------------------------------------------------------- |
| 401  | `INVALID_TOKEN`        | Missing or invalid JWT                                     |
| 403  | `FORBIDDEN`            | Caller is not an admin                                     |
| 409  | `EMAIL_ALREADY_EXISTS` | An advisor with this email already exists in Supabase Auth |
| 502  | `SUPABASE_AUTH_ERROR`  | Supabase Auth or DB error during creation                  |

**Notes — Specialty/Area validation:** This endpoint does NOT validate `specialty` against `area`. That validation only runs in `PATCH /{advisor_id}`. Valid combinations:

| Area             | Allowed specialties                                 |
| ---------------- | --------------------------------------------------- |
| `comercial`      | `"comercial"`, `null`                               |
| `administrativa` | `"financiera"`, `"mantenimiento_contratos"`, `null` |
| `ambas`          | `null` only                                         |

---

### PATCH /api/v1/panel/advisors/me

**Auth required:** Yes (any active advisor)

**Description:** Updates the authenticated advisor's own profile. Supports changing `full_name` and/or password. All fields are optional.

**Request body:**

```json
{
  "full_name": "Ana María Gómez",
  "current_password": "oldpassword123",
  "new_password": "newpassword456",
  "must_change_password": false
}
```

| Field                  | Type                | Constraints                                                     |
| ---------------------- | ------------------- | --------------------------------------------------------------- |
| `full_name`            | `string` or `null`  | Optional, min 1 character                                       |
| `current_password`     | `string` or `null`  | Required if `new_password` is provided                          |
| `new_password`         | `string` or `null`  | Optional, min 8 characters                                      |
| `must_change_password` | `boolean` or `null` | Optional. Only `false` is accepted — sending `true` returns 422 |

**Response 200:**

```json
{
  "data": {
    "advisor": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "ana.gomez@casasyespacios.co",
      "full_name": "Ana María Gómez",
      "role": "asesor",
      "area": "administrativa",
      "specialty": "financiera",
      "max_conversations": 3,
      "active_conversations": 1,
      "availability_status": "available",
      "is_active": true,
      "must_change_password": false
    }
  }
}
```

**Errors:**

| HTTP | ErrorCode                  | When                                                             |
| ---- | -------------------------- | ---------------------------------------------------------------- |
| 400  | `INVALID_CURRENT_PASSWORD` | `new_password` was provided but `current_password` was omitted   |
| 400  | `INVALID_CURRENT_PASSWORD` | `current_password` is incorrect                                  |
| 401  | `INVALID_TOKEN`            | Missing or invalid JWT                                           |
| 403  | `ADVISOR_INACTIVE`         | Advisor account is deactivated                                   |
| 422  | _(Pydantic)_               | `must_change_password: true` was sent — only `false` is accepted |
| 500  | `SUPABASE_AUTH_ERROR`      | Database or Auth update failed                                   |

**Notes:**

- `must_change_password` only accepts `false`. Use this after the advisor sets their permanent password on `FirstLoginPage`. Sending `true` returns 422.

---

### PATCH /api/v1/panel/advisors/me/availability

**Auth required:** Yes (any active advisor)

**Description:** Immediately changes the advisor's `availability_status`. Optionally accepts a `minutes` parameter to auto-restore `available` after the specified duration.

**Request body:**

```json
{
  "availability_status": "break",
  "minutes": 30
}
```

| Field                 | Type                | Constraints                                                                    |
| --------------------- | ------------------- | ------------------------------------------------------------------------------ |
| `availability_status` | `string`            | Required: `"available"`, `"break"`, or `"offline"`                             |
| `minutes`             | `integer` or `null` | Optional, range 1–480. Only meaningful when status is `"break"` or `"offline"` |

**Response 200:**

```json
{
  "data": {
    "availability_status": "break"
  }
}
```

**Errors:**

| HTTP | ErrorCode             | When                                                       |
| ---- | --------------------- | ---------------------------------------------------------- |
| 400  | `INVALID_STATUS`      | `availability_status` is not one of the three valid values |
| 401  | `INVALID_TOKEN`       | Missing or invalid JWT                                     |
| 403  | `ADVISOR_INACTIVE`    | Advisor account is deactivated                             |
| 500  | `SUPABASE_AUTH_ERROR` | Database update failed                                     |

**Notes:**

- When setting `"available"`, `status_until` is always set to `null` regardless of `minutes`.
- The `minutes` field causes `status_until` to be stored as a naive Bogotá local time. The background availability checker job uses it to auto-restore the status.

**WebSocket events emitted:**

- `advisor.status_changed` — broadcast to all connected advisors

---

### PATCH /api/v1/panel/advisors/{advisor_id}

**Auth required:** Yes (admin only)

**Description:** Edits any advisor's profile. Partial update — only fields present in the request body are modified. An admin cannot edit themselves via this endpoint (must use `/me` instead).

**Path params:**

| Param        | Type            | Description           |
| ------------ | --------------- | --------------------- |
| `advisor_id` | `string` (UUID) | The advisor to update |

**Request body (all fields optional):**

```json
{
  "full_name": "Luis Antonio Martínez",
  "role": "admin",
  "area": "ambas",
  "specialty": null,
  "max_conversations": 5,
  "is_active": false
}
```

| Field               | Type                | Constraints                                            |
| ------------------- | ------------------- | ------------------------------------------------------ |
| `full_name`         | `string` or `null`  | Optional, min 1 character                              |
| `role`              | `string` or `null`  | Optional: `"asesor"` or `"admin"`                      |
| `area`              | `string` or `null`  | Optional: `"administrativa"`, `"comercial"`, `"ambas"` |
| `specialty`         | `string` or `null`  | Optional. Validated against effective area             |
| `max_conversations` | `integer` or `null` | Optional, range 1–10                                   |
| `is_active`         | `boolean` or `null` | Optional                                               |

**Response 200:**

```json
{
  "data": {
    "advisor": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "email": "luis.martinez@casasyespacios.co",
      "full_name": "Luis Antonio Martínez",
      "role": "asesor",
      "area": "ambas",
      "specialty": null,
      "max_conversations": 5,
      "active_conversations": 1,
      "availability_status": "available",
      "is_active": false
    },
    "warning": "El asesor tenía 1 conversaciones activas al momento de ser desactivado"
  }
}
```

**Errors:**

| HTTP | ErrorCode                    | When                                                    |
| ---- | ---------------------------- | ------------------------------------------------------- |
| 400  | `INVALID_SPECIALTY_FOR_AREA` | `specialty` is not valid for the effective area         |
| 401  | `INVALID_TOKEN`              | Missing or invalid JWT                                  |
| 403  | `FORBIDDEN`                  | Caller is not an admin                                  |
| 403  | `CANNOT_EDIT_YOURSELF`       | Admin tried to edit their own account via this endpoint |
| 404  | `ADVISOR_NOT_FOUND`          | No advisor with the given ID                            |
| 500  | `SUPABASE_AUTH_ERROR`        | Database update failed                                  |

**Notes:**

- `"warning"` is present and non-null only when the advisor was deactivated (`is_active: false`) while having active conversations. Display this warning to the admin.
- Specialty validation: when `specialty` is in the request body, the effective area is `body.area` if also present, otherwise the current advisor's area from DB.

---

## Metrics

### GET /api/v1/panel/metrics

**Auth required:** Yes (admin only)

**Description:** Returns 7 real-time operational metrics for the admin dashboard in a single database round-trip via the `get_dashboard_metrics()` Supabase RPC function.

**Response 200:**

```json
{
  "data": {
    "metrics": {
      "activas": 2,
      "escaladas": 2,
      "en_atencion": 1,
      "tiempo_promedio_min": 10,
      "bot_ok_pct": 50,
      "capacidad_actual": 1,
      "capacidad_total": 9
    }
  }
}
```

**Metric definitions:**

| Field                 | Type    | Description                                                                                                                                       |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activas`             | integer | Conversations where the bot is actively resolving (`status='activa'` AND `bot_activo=true`)                                                       |
| `escaladas`           | integer | Conversations waiting or being attended by an advisor (`status='escalada'`). Includes `en_atencion`                                               |
| `en_atencion`         | integer | Subset of `escaladas` that already have an assigned advisor (`escalation.advisor_id IS NOT NULL`)                                                 |
| `tiempo_promedio_min` | integer | Average minutes elapsed since `escalated_at` for unresolved active escalations. `0` when none exist                                               |
| `bot_ok_pct`          | integer | Percentage of conversations closed in the last 24h that the bot resolved without escalating. `0` when no conversations were closed in that period |
| `capacidad_actual`    | integer | Active escalations with an assigned advisor right now (occupied capacity slots)                                                                   |
| `capacidad_total`     | integer | Sum of `max_conversations` across all active advisors with `role='asesor'`. Admins are excluded                                                   |

**Errors:**

| HTTP | ErrorCode        | When                     |
| ---- | ---------------- | ------------------------ |
| 401  | `INVALID_TOKEN`  | Missing or invalid JWT   |
| 403  | `FORBIDDEN`      | Caller is not an admin   |
| 500  | `SUPABASE_ERROR` | RPC function call failed |

**Notes:**

- `escaladas` ≥ `en_atencion` — they are not mutually exclusive.
- Returns all zeros (not an error) when the database has no data.
- `capacidad_total` only counts advisors with `role='asesor'` — admins are never included.

---

## Behavior Alerts

### GET /api/v1/panel/behavior-alerts/

**Auth required:** Yes (admin only)

**Description:** Paginated list of behavior alerts generated by background moderation of advisor messages. Defaults to unreviewed alerts.

**Query params:**

| Param        | Type            | Default | Description                                         |
| ------------ | --------------- | ------- | --------------------------------------------------- |
| `reviewed`   | `boolean`       | `false` | `false` = pending review; `true` = already reviewed |
| `advisor_id` | `string` (UUID) | none    | Filter alerts for a specific advisor                |
| `limit`      | `integer`       | 20      | Page size (1–100)                                   |
| `offset`     | `integer`       | 0       | Pagination offset                                   |

**Response 200:**

```json
{
  "data": {
    "alerts": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440060",
        "advisor": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "full_name": "Ana Gómez"
        },
        "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
        "message_content": "El contenido del mensaje del asesor que fue marcado",
        "alert_type": "tono_agresivo",
        "severity": "media",
        "detected_at": "2026-06-22T14:36:01+00:00",
        "reviewed": false,
        "reviewed_by": null,
        "reviewed_at": null
      }
    ],
    "total": 3
  }
}
```

**Errors:**

| HTTP | ErrorCode       | When                   |
| ---- | --------------- | ---------------------- |
| 401  | `INVALID_TOKEN` | Missing or invalid JWT |
| 403  | `FORBIDDEN`     | Caller is not an admin |

**Notes:**

- `total` is the full matching row count, ignoring `limit`/`offset`.
- `alert_type` values: `lenguaje_inapropiado`, `tono_agresivo`, `comportamiento_inadecuado`
- `severity` values: `baja`, `media`, `alta`

---

### PATCH /api/v1/panel/behavior-alerts/{alert_id}/review

**Auth required:** Yes (admin only)

**Description:** Marks a behavior alert as reviewed. The reviewing admin's ID is taken from the JWT — no request body required.

**Path params:**

| Param      | Type            | Description                   |
| ---------- | --------------- | ----------------------------- |
| `alert_id` | `string` (UUID) | The alert to mark as reviewed |

**Response 200:**

```json
{
  "data": {
    "alert": {
      "id": "550e8400-e29b-41d4-a716-446655440060",
      "advisor": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "full_name": "Ana Gómez"
      },
      "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
      "message_content": "El contenido del mensaje del asesor que fue marcado",
      "alert_type": "tono_agresivo",
      "severity": "media",
      "detected_at": "2026-06-22T14:36:01+00:00",
      "reviewed": true,
      "reviewed_by": "550e8400-e29b-41d4-a716-446655440099",
      "reviewed_at": "2026-06-22T15:00:00+00:00"
    }
  }
}
```

**Errors:**

| HTTP | ErrorCode          | When                            |
| ---- | ------------------ | ------------------------------- |
| 401  | `INVALID_TOKEN`    | Missing or invalid JWT          |
| 403  | `FORBIDDEN`        | Caller is not an admin          |
| 404  | `ALERT_NOT_FOUND`  | No alert with the given ID      |
| 409  | `ALREADY_REVIEWED` | Alert has already been reviewed |

**Notes:**

- `reviewed_by` in the response is the admin's UUID, not their name. The frontend must resolve the name from the advisors list if needed.

---

## Schedules (Inactivity Intervals)

### GET /api/v1/panel/schedules/

**Auth required:** Yes (any active advisor)

**Description:** Lists inactivity interval schedules. Advisors see only their own. Admins can use the `advisor_id` query param to view another advisor's schedules.

**Query params:**

| Param        | Type            | Description                                                                                  |
| ------------ | --------------- | -------------------------------------------------------------------------------------------- |
| `advisor_id` | `string` (UUID) | Admin-only: view a specific advisor's schedules. Non-admins: this param is silently ignored. |

**Response 200:**

```json
{
  "data": {
    "schedules": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440070",
        "advisor_id": "550e8400-e29b-41d4-a716-446655440001",
        "label": "Almuerzo",
        "start_time": "12:00",
        "end_time": "13:00",
        "days_of_week": [1, 2, 3, 4, 5],
        "is_active": true
      }
    ]
  }
}
```

**Errors:**

| HTTP | ErrorCode          | When                           |
| ---- | ------------------ | ------------------------------ |
| 401  | `INVALID_TOKEN`    | Missing or invalid JWT         |
| 403  | `ADVISOR_INACTIVE` | Advisor account is deactivated |

---

### POST /api/v1/panel/schedules/

**Auth required:** Yes (any active advisor)

**HTTP status on success:** 201 Created

**Description:** Creates a new inactivity interval for the authenticated advisor. The schedule is created with `is_active = true`.

**Request body:**

```json
{
  "label": "Almuerzo",
  "start_time": "12:00",
  "end_time": "13:00",
  "days_of_week": [1, 2, 3, 4, 5]
}
```

| Field          | Type             | Constraints                                                         |
| -------------- | ---------------- | ------------------------------------------------------------------- |
| `label`        | `string`         | Required, 1–50 characters                                           |
| `start_time`   | `string`         | Required, format `HH:MM` (24h)                                      |
| `end_time`     | `string`         | Required, format `HH:MM` (24h)                                      |
| `days_of_week` | `array[integer]` | Required, at least 1 element. Values: 1 (Monday) through 7 (Sunday) |

**Response 201:**

```json
{
  "data": {
    "schedule": {
      "id": "550e8400-e29b-41d4-a716-446655440070",
      "advisor_id": "550e8400-e29b-41d4-a716-446655440001",
      "label": "Almuerzo",
      "start_time": "12:00",
      "end_time": "13:00",
      "days_of_week": [1, 2, 3, 4, 5],
      "is_active": true
    }
  }
}
```

**Errors:**

| HTTP | ErrorCode            | When                                                |
| ---- | -------------------- | --------------------------------------------------- |
| 400  | `INVALID_TIME_RANGE` | `start_time` >= `end_time`                          |
| 400  | `INVALID_DAYS`       | One or more values in `days_of_week` is outside 1–7 |
| 401  | `INVALID_TOKEN`      | Missing or invalid JWT                              |
| 403  | `ADVISOR_INACTIVE`   | Advisor account is deactivated                      |
| 500  | `DATABASE_ERROR`     | Insert returned no data                             |

---

### PATCH /api/v1/panel/schedules/{schedule_id}

**Auth required:** Yes (any active advisor; own schedules only, or admin for any)

**Description:** Partial update for an inactivity interval. Only fields present in the request body are modified. Time range validation is applied against the merged final state.

**Path params:**

| Param         | Type            | Description            |
| ------------- | --------------- | ---------------------- |
| `schedule_id` | `string` (UUID) | The schedule to update |

**Request body (all fields optional):**

```json
{
  "label": "Break tarde",
  "start_time": "15:30",
  "end_time": "15:45",
  "days_of_week": [1, 2, 3, 4, 5, 6],
  "is_active": false
}
```

**Response 200:**

```json
{
  "data": {
    "schedule": {
      "id": "550e8400-e29b-41d4-a716-446655440070",
      "advisor_id": "550e8400-e29b-41d4-a716-446655440001",
      "label": "Break tarde",
      "start_time": "15:30",
      "end_time": "15:45",
      "days_of_week": [1, 2, 3, 4, 5, 6],
      "is_active": false
    }
  }
}
```

**Errors:**

| HTTP | ErrorCode            | When                                                        |
| ---- | -------------------- | ----------------------------------------------------------- |
| 400  | `INVALID_TIME_RANGE` | Resulting `start_time` >= resulting `end_time`              |
| 400  | `INVALID_DAYS`       | A value in `days_of_week` is outside 1–7                    |
| 401  | `INVALID_TOKEN`      | Missing or invalid JWT                                      |
| 403  | `ADVISOR_INACTIVE`   | Advisor account is deactivated                              |
| 403  | `NOT_YOUR_SCHEDULE`  | Non-admin advisor trying to edit another advisor's schedule |
| 404  | `SCHEDULE_NOT_FOUND` | No schedule with the given ID                               |

**Notes:**

- Sending an empty body (no fields) is valid — the current schedule is returned unchanged without hitting the DB.
- DB stores times as `HH:MM:SS`. The API normalizes the output to `HH:MM`.

---

### DELETE /api/v1/panel/schedules/{schedule_id}

**Auth required:** Yes (any active advisor; own schedules only, or admin for any)

**HTTP status on success:** 204 No Content

**Description:** Permanently deletes an inactivity interval. No response body.

**Path params:**

| Param         | Type            | Description            |
| ------------- | --------------- | ---------------------- |
| `schedule_id` | `string` (UUID) | The schedule to delete |

**Response 204:** No body.

**Errors:**

| HTTP | ErrorCode            | When                                                          |
| ---- | -------------------- | ------------------------------------------------------------- |
| 401  | `INVALID_TOKEN`      | Missing or invalid JWT                                        |
| 403  | `ADVISOR_INACTIVE`   | Advisor account is deactivated                                |
| 403  | `NOT_YOUR_SCHEDULE`  | Non-admin advisor trying to delete another advisor's schedule |
| 404  | `SCHEDULE_NOT_FOUND` | No schedule with the given ID                                 |

---

## WebSocket

### Connection

**URL:** `wss://<host>/api/v1/panel/ws?token=<jwt>`

**Protocol:** WebSocket

**Auth:** Pass the JWT as a **query parameter** (`?token=`). Bearer header auth is not supported for WebSocket connections. The server closes with code `4001` if the token is invalid, expired, or the advisor is inactive.

**Connection lifecycle:**

1. Client opens connection with JWT in query string.
2. Server validates JWT, fetches advisor from DB, rejects inactive advisors.
3. Server accepts the connection, registers it in the in-memory `WebSocketManager`.
4. Server upserts a `ws_connections` record in the DB.
5. Server broadcasts `advisor.connected` to all advisors.
6. If the connecting advisor has `role = "asesor"`, server sends `queue.pending` **directly** to that advisor (not a broadcast) if there are unassigned escalations in their area. Admins never receive this event.
7. Client enters the message loop (ping/subscribe/unsubscribe).
8. On disconnect, the server removes the connection, deletes the DB record, and broadcasts `advisor.disconnected`.

**Connection example:**

```javascript
const ws = new WebSocket(
  `wss://casasyespacios-agent.railway.app/api/v1/panel/ws?token=${jwt}`,
);

ws.onmessage = (event) => {
  const { event: eventType, data } = JSON.parse(event.data);
  console.log(eventType, data);
};
```

---

### Client → Server Messages

The client sends JSON text frames. All messages have a `type` field.

#### ping

Sent by the client to keep the connection alive. The server responds with `{"type": "pong"}` and updates `last_ping_at` in the DB.

```json
{ "type": "ping" }
```

**Server response:**

```json
{ "type": "pong" }
```

#### subscribe_conversation

Subscribe to a specific conversation. Use when the advisor opens a chat view.

```json
{
  "type": "subscribe_conversation",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440010"
}
```

No direct server response. The subscription state is tracked server-side in memory.

#### unsubscribe_conversation

Resets the advisor's subscription back to inbox level. Use when the advisor closes a chat view.

```json
{ "type": "unsubscribe_conversation" }
```

No direct server response.

---

### Server → Client Events

All server events have this envelope:

```json
{ "event": "<event_type>", "data": { ... } }
```

#### advisor.connected

Emitted to **all connected advisors** when a new advisor opens a WebSocket connection.

```json
{
  "event": "advisor.connected",
  "data": {
    "advisor_id": "550e8400-e29b-41d4-a716-446655440001",
    "advisor_name": "Ana Gómez",
    "advisor_role": "asesor",
    "advisor_area": "administrativa"
  }
}
```

#### advisor.disconnected

Emitted to **all connected advisors** when an advisor's connection closes.

```json
{
  "event": "advisor.disconnected",
  "data": {
    "advisor_id": "550e8400-e29b-41d4-a716-446655440001",
    "advisor_name": "Ana Gómez"
  }
}
```

#### advisor.status_changed

Emitted to **all connected advisors** when an advisor changes their availability status via `PATCH /advisors/me/availability`.

```json
{
  "event": "advisor.status_changed",
  "data": {
    "advisor_id": "550e8400-e29b-41d4-a716-446655440001",
    "availability_status": "break",
    "full_name": "Ana Gómez",
    "area": "administrativa",
    "specialty": "financiera"
  }
}
```

#### message.new

Emitted to **all connected advisors** when an advisor sends a message via the panel, or when an inbound message arrives from a client via the webhook pipeline.

```json
{
  "event": "message.new",
  "data": {
    "message": {
      "id": "550e8400-e29b-41d4-a716-446655440055",
      "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
      "wam_id": "wamid.HBgLNTczMDAxMjM0NTY3FQIAEhgWM0E4QjA2RjhDRjhCMzVCODk1NDUB",
      "direction": "outbound_advisor",
      "msg_type": "text",
      "content": "Hola Carlos, con gusto le ayudo.",
      "media_url": null,
      "media_mime_type": null,
      "media_size_bytes": null,
      "delivered_via": "websocket_panel",
      "timestamp": "2026-06-22T14:36:00+00:00",
      "created_at": "2026-06-22T14:36:00+00:00"
    }
  }
}
```

#### escalation.assigned

Emitted to **all connected advisors** when an advisor self-assigns via `PATCH /conversations/{id}/assign`.

```json
{
  "event": "escalation.assigned",
  "data": {
    "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
    "escalation_id": "550e8400-e29b-41d4-a716-446655440030",
    "advisor_id": "550e8400-e29b-41d4-a716-446655440001",
    "advisor_name": "Ana Gómez"
  }
}
```

#### conversation.returned

Emitted to **all connected advisors** when an advisor returns a conversation to bot control via `PATCH /conversations/{id}/return-bot`.

```json
{
  "event": "conversation.returned",
  "data": {
    "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
    "advisor_id": "550e8400-e29b-41d4-a716-446655440001",
    "advisor_name": "Ana Gómez"
  }
}
```

#### conversation.closed

Emitted to **all connected advisors** when a conversation is closed — either by an advisor via `PATCH /conversations/{id}/close`, or by the bot automatically.

**Advisor-initiated** (`closed_by: "asesor"`):

```json
{
  "event": "conversation.closed",
  "data": {
    "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
    "advisor_id": "550e8400-e29b-41d4-a716-446655440001",
    "advisor_name": "Ana Gómez",
    "resolution_type": "consulta_cartera_resuelta",
    "closed_by": "asesor",
    "closed_at": "2026-06-23T14:30:00+00:00"
  }
}
```

**Bot-initiated** (`closed_by: "bot"`): emitted when the AI agent detects a farewell or satisfaction signal from the client, or when the inactivity job closes after no response. `advisor_id` and `advisor_name` are absent.

```json
{
  "event": "conversation.closed",
  "data": {
    "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
    "closed_by": "bot",
    "reason": "resolved"
  }
}
```

Always handle `conversation.closed` defensively — check for `closed_by` before reading `advisor_id`.

#### escalation.new

Emitted to **all connected advisors** when the bot escalates a conversation — either assigned to a specific advisor or placed in the unassigned queue.

```json
{
  "event": "escalation.new",
  "data": {
    "conversation_id": "550e8400-e29b-41d4-a716-446655440010",
    "advisor_id": "550e8400-e29b-41d4-a716-446655440001",
    "reason": "solicitud_usuario",
    "channel": "administrativa"
  }
}
```

| Field             | Type                      | Description                                                     |
| ----------------- | ------------------------- | --------------------------------------------------------------- |
| `conversation_id` | `string` (UUID)           | The escalated conversation                                      |
| `advisor_id`      | `string` (UUID) or `null` | Assigned advisor, or `null` when placed in the unassigned queue |
| `reason`          | `string` or `null`        | The escalation reason. May be `null` if unclassified            |
| `channel`         | `string`                  | `"administrativa"` or `"comercial"`                             |

**When `advisor_id` is `null`:** the conversation is in the unassigned queue — any available advisor in the channel can take it via `PATCH /conversations/{id}/assign`.

**When `advisor_id` is set:** the bot auto-assigned to the lowest-load available advisor. Other advisors should update the conversation card to reflect the new assignment.

---

#### queue.pending

Emitted **only to the connecting advisor** (not a broadcast) immediately after `advisor.connected`, when there are unassigned escalations waiting in their area. Sent once at connection time. Never sent to admins.

```json
{
  "event": "queue.pending",
  "data": {
    "count": 3,
    "message": "Tienes 3 conversaciones esperando en la bandeja."
  }
}
```

| Field     | Type      | Description                                                |
| --------- | --------- | ---------------------------------------------------------- |
| `count`   | `integer` | Number of unassigned escalations in the advisor's area     |
| `message` | `string`  | Human-readable message for display in a toast notification |

**Area filtering:**

- `area = "administrativa"` → only counts escalations from the administrative channel.
- `area = "comercial"` → only counts escalations from the commercial channel.
- `area = "ambas"` → counts escalations from both channels.

**Frontend behaviour:** show an informational toast with `data.message` and trigger a bandeja refresh so the inbox reflects the current queue state. This event covers the case where escalations arrived while the advisor was offline.

---

#### behavior.alert

Emitted to **admin advisors only** when background moderation detects inappropriate content in an advisor message.

```json
{
  "event": "behavior.alert",
  "data": {
    "alert_id": "550e8400-e29b-41d4-a716-446655440060"
  }
}
```

**Note:** This event only contains the `alert_id`. The frontend must call `GET /behavior-alerts/` to fetch the full alert details. The payload is minimal to avoid broadcasting sensitive message content to all admins.

---

## Enums Reference

### ConversationStatus

| Value      | When it applies                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `activa`   | Conversation is ongoing. Either the bot is handling it (`bot_activo = true`) or an advisor is actively responding (`bot_activo = false`). |
| `escalada` | The bot triggered a handover and the conversation is waiting for an advisor to take it. The escalation record has no `advisor_id` yet.    |
| `cerrada`  | Conversation has ended. No further messages can be sent. `closed_at` is set.                                                              |

### ConversationIntent

| Value             | Description                                                                    | Routed to                                    |
| ----------------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| `cartera`         | Portfolio/receivables management questions                                     | Advisor specialty: `financiera`              |
| `pagos`           | Payment inquiries and processing                                               | Advisor specialty: `financiera`              |
| `facturacion`     | Billing and invoice requests                                                   | Advisor specialty: `financiera`              |
| `disputa_cobro`   | Billing dispute or charge contestation                                         | Advisor specialty: `financiera`              |
| `mantenimiento`   | Property maintenance requests                                                  | Advisor specialty: `mantenimiento_contratos` |
| `contratos`       | Lease or contract questions                                                    | Advisor specialty: `mantenimiento_contratos` |
| `quejas_inmueble` | Property complaints                                                            | Advisor specialty: `mantenimiento_contratos` |
| `comercial`       | Commercial/sales inquiries (prospects)                                         | Advisor specialty: `comercial`               |
| `faq`             | Frequently asked questions the bot resolves alone                              | No escalation                                |
| `sin_clasificar`  | Bot could not classify the intent after `MAX_CLASSIFICATION_ATTEMPTS` attempts | Channel: `administrativa`                    |

### AdvisorRole

| Value    | Permissions                                                                                                                                                                                                                                                                |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `asesor` | Sees only conversations in their area. Can reply, assign, return-bot, close (own), manage own profile and schedules.                                                                                                                                                       |
| `admin`  | Sees all conversations regardless of channel. Can reply to any assigned conversation, close any conversation, manage all advisors (CRUD), view and review behavior alerts, view any advisor's schedules. Cannot use `PATCH /advisors/{id}` on themselves — must use `/me`. |

### AdvisorArea

| Value            | Description                                                             |
| ---------------- | ----------------------------------------------------------------------- |
| `administrativa` | Handles the administrative WhatsApp line (owners, maintenance, billing) |
| `comercial`      | Handles the commercial WhatsApp line (prospects, sales)                 |
| `ambas`          | Handles both lines. Advisor sees all conversations.                     |

### AdvisorSpecialty

| Value                     | Valid for area   | Description                                             |
| ------------------------- | ---------------- | ------------------------------------------------------- |
| `financiera`              | `administrativa` | Cartera, pagos, facturación, disputas                   |
| `mantenimiento_contratos` | `administrativa` | Mantenimiento de inmuebles y contratos de arrendamiento |
| `comercial`               | `comercial`      | Atención a prospectos y gestión comercial               |
| `null`                    | All areas        | General advisor — handles any intent within the channel |

### AvailabilityStatus

| Value       | Description                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `available` | Advisor is online and available to receive new escalations                                                                      |
| `break`     | Advisor is temporarily unavailable. New escalations will not be auto-routed to them. `status_until` may be set to auto-restore. |
| `offline`   | Advisor is offline. Same routing behavior as `break`.                                                                           |

### MessageDirection

| Value              | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `inbound`          | Message received from the client via WhatsApp                |
| `outbound_bot`     | Message sent to the client by the AI agent                   |
| `outbound_advisor` | Message sent to the client by a human advisor from the panel |

### MessageType

| Value      | Description                                         |
| ---------- | --------------------------------------------------- |
| `text`     | Plain text message                                  |
| `image`    | Image (JPEG, PNG, WebP)                             |
| `video`    | Video (MP4, 3GPP)                                   |
| `document` | Document (PDF, DOCX, XLSX)                          |
| `audio`    | Voice note or audio file (OGG, MPEG, MP4, AAC, AMR) |

### DeliveredVia

| Value             | Description                                                                           |
| ----------------- | ------------------------------------------------------------------------------------- |
| `webhook_meta`    | Message delivered via the Meta WhatsApp webhook (inbound from client or bot outbound) |
| `websocket_panel` | Message sent by an advisor from the internal panel                                    |

### EscalationReason

| Value                   | Description                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `solicitud_usuario`     | Client explicitly requested to speak with a human advisor              |
| `no_clasificado`        | Bot could not classify the intent after the maximum number of attempts |
| `error_simi`            | SIMI external service failed the maximum number of times               |
| `frustracion_detectada` | LLM detected frustration signals in the client's messages              |

### ClientType

| Value         | Description                            |
| ------------- | -------------------------------------- |
| `inquilino`   | Tenant                                 |
| `propietario` | Property owner                         |
| `prospecto`   | Commercial prospect (not yet a client) |
| `desconocido` | Identity not yet established           |

---

## Frontend Integration Guide

### Authentication Flow

Always authenticate through the backend endpoint — never call Supabase Auth directly from the frontend. The backend enforces the `is_active` check before returning the token.

```javascript
// 1. Sign in via backend
const response = await fetch("/api/v1/panel/auth/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

if (!response.ok) {
  const error = await response.json();
  // error.detail.code === "INVALID_TOKEN" → wrong credentials
  // error.detail.code === "ADVISOR_INACTIVE" → account disabled
  showLoginError(error.detail.message);
  return;
}

const data = await response.json();

// 2. Store the token
localStorage.setItem("panel_token", data.access_token);

// 3. Redirect to password change if required
if (data.must_change_password) {
  redirectToFirstLoginPage();
  return;
}

// 4. Use in every API call
const headers = {
  Authorization: `Bearer ${localStorage.getItem("panel_token")}`,
  "Content-Type": "application/json",
};

// 5. Handle token expiry (Supabase tokens expire in 1 hour)
// When any API call returns 401, redirect to login
// No automatic refresh — the advisor must log in again
```

---

### Loading the Inbox

```javascript
// 1. Fetch the advisor profile first (to know role, area, name)
const profile = await fetch("/api/v1/panel/advisors/me", { headers }).then(
  (r) => r.json(),
);

// 2. Fetch conversations
const inbox = await fetch("/api/v1/panel/conversations/?limit=20&offset=0", {
  headers,
}).then((r) => r.json());

// conversations in inbox.data.conversations, total in inbox.data.total
```

Use `status=escalada` to show only the escalation queue, or omit to show all conversations.

---

### Rendering Messages

Each message object has a `msg_type` field that determines how it should be displayed. Use `msg_type` — not `content` or `media_url` nullability — as the source of truth for rendering decisions.

```javascript
function renderMessage(msg) {
  switch (msg.msg_type) {
    case "text":
      return <TextBubble text={msg.content} direction={msg.direction} />;

    case "audio":
      // Always render an audio player. Do NOT display transcription as text.
      // transcription is internal context for the AI — hidden from the advisor by default.
      return <AudioPlayer src={msg.media_url} direction={msg.direction} />;

    case "image":
      return <img src={msg.media_url} alt="Imagen" />;

    case "video":
      return <video src={msg.media_url} controls />;

    case "document":
      return (
        <a href={msg.media_url} target="_blank">
          Descargar documento
        </a>
      );

    default:
      return null;
  }
}
```

**`media_url` is always a signed Supabase Storage URL** (valid for 1 year) for any non-text message — never a raw Meta media ID. You can use it directly in `<img>`, `<audio>`, `<video>`, or `<a>` tags.

**`transcription`** is populated only for inbound audio messages processed by the bot. It contains the Whisper transcription text. Do not show it as message content — it exists so the AI has context across turns. You may optionally expose it as a collapsible "Ver transcripción" toggle beneath the audio player.

---

### Opening a Chat

```javascript
// Fetch conversation detail with first 50 messages
const detail = await fetch(
  `/api/v1/panel/conversations/${conversationId}?limit=50&offset=0`,
  { headers },
).then((r) => r.json());

// Register the subscription on the WebSocket
ws.send(
  JSON.stringify({
    type: "subscribe_conversation",
    conversation_id: conversationId,
  }),
);

// Load older messages on scroll (infinite scroll upward)
const older = await fetch(
  `/api/v1/panel/conversations/${conversationId}/messages?limit=20&offset=50`,
  { headers },
).then((r) => r.json());
```

---

### Sending a Message

**Text:**

```javascript
const response = await fetch(
  `/api/v1/panel/conversations/${conversationId}/reply`,
  {
    method: "POST",
    headers,
    body: JSON.stringify({ text: "Tu respuesta aquí" }),
  },
).then((r) => r.json());

// response.data.message contains the saved message object
```

**Media (image, video, document):**

```javascript
const formData = new FormData();
formData.append("file", file); // File object from input
formData.append("caption", "Adjunto el estado de cuenta"); // optional

const response = await fetch(
  `/api/v1/panel/conversations/${conversationId}/reply/media`,
  {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` }, // NO Content-Type — let browser set multipart boundary
    body: formData,
  },
).then((r) => r.json());
```

**Audio (voice note):**

```javascript
const formData = new FormData();
formData.append("file", audioBlob, "voice_note.ogg");

const response = await fetch(
  `/api/v1/panel/conversations/${conversationId}/reply/audio`,
  {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: formData,
  },
).then((r) => r.json());
```

---

### Taking / Returning a Conversation

**Taking (self-assign):**

```javascript
const response = await fetch(
  `/api/v1/panel/conversations/${conversationId}/assign`,
  { method: "PATCH", headers },
).then((r) => r.json());
```

**Returning to bot:**

```javascript
const response = await fetch(
  `/api/v1/panel/conversations/${conversationId}/return-bot`,
  { method: "PATCH", headers },
).then((r) => r.json());
```

**Closing:**

```javascript
// With full resolution data (from the modal)
const response = await fetch(
  `/api/v1/panel/conversations/${conversationId}/close`,
  {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      resolution_type: "consulta_cartera_resuelta",
      resolution_notes: "El propietario confirmó recibo.",
      client_satisfied: "si",
    }),
  },
).then((r) => r.json());

// Without body — applies defaults (resolution_type: "otro", client_satisfied: "sin_confirmar")
const response = await fetch(
  `/api/v1/panel/conversations/${conversationId}/close`,
  { method: "PATCH", headers },
).then((r) => r.json());

// response.data.conversation includes: status, resolution_type, resolution_notes,
// client_satisfied, closed_by, closed_at
```

---

### WebSocket Integration

```javascript
const jwt = localStorage.getItem("panel_token");
const ws = new WebSocket(
  `wss://<host>/api/v1/panel/ws?token=${encodeURIComponent(jwt)}`,
);

// Keepalive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "ping" }));
  }
}, 30000);

ws.onmessage = (event) => {
  const { event: type, data } = JSON.parse(event.data);

  switch (type) {
    case "message.new":
      // Append message to the active conversation if it matches
      if (data.message.conversation_id === currentConversationId) {
        appendMessage(data.message);
      }
      // Update unread badge on conversation list
      updateConversationLastActivity(data.message.conversation_id);
      break;

    case "escalation.new":
      // New escalation arrived from the bot
      if (data.advisor_id) {
        // Auto-assigned — update the card to show the assigned advisor
        updateConversationAssignment(
          data.conversation_id,
          data.advisor_id,
          null,
        );
      } else {
        // Unassigned queue — add or highlight in the inbox
        addToUnassignedQueue(data.conversation_id, data.channel);
        showToast(`Nueva conversación en cola (${data.channel})`, "warning");
      }
      break;

    case "queue.pending":
      // Received once at connection time when unassigned escalations exist.
      // Only sent to role='asesor' — never to admins.
      showToast(data.message, "info", { duration: 6000 });
      // Reload the inbox so it reflects the current queue state
      refreshBandeja();
      break;

    case "escalation.assigned":
      // An advisor self-assigned via the panel — update the conversation card
      updateConversationAssignment(
        data.conversation_id,
        data.advisor_id,
        data.advisor_name,
      );
      break;

    case "conversation.returned":
      // Conversation returned to bot control
      markConversationReturnedToBot(data.conversation_id);
      break;

    case "conversation.closed":
      // Remove from inbox or update status indicator
      markConversationClosed(data.conversation_id);
      break;

    case "advisor.status_changed":
      // Update advisor availability badge in the team view
      updateAdvisorStatus(data.advisor_id, data.availability_status);
      break;

    case "advisor.connected":
    case "advisor.disconnected":
      // Update online presence indicators
      updateAdvisorPresence(data.advisor_id, type === "advisor.connected");
      break;

    case "behavior.alert":
      // Admin-only: show notification badge and fetch the new alert
      if (currentAdvisorRole === "admin") {
        showBehaviorAlertNotification(data.alert_id);
        refreshBehaviorAlerts();
      }
      break;
  }
};

ws.onclose = (event) => {
  if (event.code === 4001) {
    // Invalid JWT — redirect to login
    redirectToLogin();
  } else {
    // Reconnect with exponential backoff
    scheduleReconnect();
  }
};
```

---

### Loading Admin Dashboard Metrics

```javascript
// Admin-only — returns 403 for non-admins
const result = await apiCall("/api/v1/panel/metrics");
const metrics = result.data.metrics;
// metrics.activas, metrics.escaladas, metrics.en_atencion,
// metrics.tiempo_promedio_min, metrics.bot_ok_pct,
// metrics.capacidad_actual, metrics.capacidad_total
```

---

### Global Error Handling

```javascript
async function apiCall(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("panel_token")}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    const code = error.detail?.code;
    const message = error.detail?.message;

    switch (response.status) {
      case 401:
        showModal("Sesión expirada. Por favor inicia sesión nuevamente.");
        redirectToLogin();
        break;

      case 403:
        if (code === "ADVISOR_INACTIVE") {
          showModal(
            "Tu cuenta ha sido desactivada. Contacta a un administrador.",
          );
          redirectToLogin();
        } else if (code === "FORBIDDEN") {
          showToast("No tienes permiso para realizar esta acción.", "error");
        } else if (code === "CONVERSATION_OUTSIDE_AREA") {
          showToast("Esta conversación no pertenece a tu área.", "warning");
        } else if (code === "BOT_IS_ACTIVE") {
          showToast("El bot tiene el control de esta conversación.", "warning");
        } else if (code === "NOT_ASSIGNED") {
          showToast("No estás asignado a esta conversación.", "warning");
        } else if (code === "BOT_ALREADY_ACTIVE") {
          showToast("El bot ya controla esta conversación.", "info");
        } else {
          showToast(message || "Acceso denegado.", "error");
        }
        break;

      case 404:
        showEmptyState("El recurso no fue encontrado.");
        break;

      case 409:
        if (code === "ALREADY_ASSIGNED") {
          showToast("Otro asesor tomó esta conversación primero.", "warning");
        } else if (code === "MAX_CONVERSATIONS_REACHED") {
          showToast(message, "warning"); // message includes counts
        } else if (code === "ALREADY_CLOSED") {
          showToast("Esta conversación ya fue cerrada.", "info");
        } else if (code === "ALREADY_REVIEWED") {
          showToast("Esta alerta ya fue revisada.", "info");
        } else if (code === "CONVERSATION_NOT_ESCALATED") {
          showToast("La conversación no está en estado escalado.", "warning");
        } else {
          showToast(
            message || "Conflicto al procesar la solicitud.",
            "warning",
          );
        }
        break;

      case 500:
        showToast("Error interno del servidor. Intenta nuevamente.", "error");
        break;

      case 502:
        if (code === "META_API_ERROR") {
          showToast(
            "No se pudo enviar el mensaje a WhatsApp. Intenta nuevamente.",
            "error",
          );
        } else if (code === "STORAGE_ERROR") {
          showToast(
            "Error al guardar el archivo. Intenta nuevamente.",
            "error",
          );
        } else {
          showToast("Error de comunicación con un servicio externo.", "error");
        }
        break;

      case 503:
        showToast("Servicio de almacenamiento no disponible.", "error");
        break;

      default:
        showToast(`Error inesperado (${response.status}).`, "error");
    }

    throw new Error(code || `HTTP ${response.status}`);
  }

  return response.json();
}
```

---

## Inconsistencies Found

The following gaps were found between the current code and the CLAUDE.md specification:

1. **CLAUDE.md marks PW-2..6 (`bandeja`, `reply`, `media`) as `⬜ Pendientes`** but all of these endpoints (`GET /conversations/`, `GET /{id}`, `POST /reply`, `POST /reply/media`, `POST /reply/audio`) are fully implemented in the code.

2. **CLAUDE.md marks PW-12 (`PATCH /advisors/{id}`) as `⬜ Pendiente`** but it is fully implemented in the code.

3. **CLAUDE.md marks PW-13..18 (alerts + schedules) as `⬜ Pendientes`** but all of these endpoints are fully implemented in the code.

4. **CLAUDE.md marks PW-21 (`PATCH /advisors/me/availability`) as `⬜ Pendiente`** but it is fully implemented in the code.

5. **`POST /api/v1/panel/advisors/` does not validate `specialty` against `area`** — The `_validate_specialty_area` helper exists and is used by `PATCH /{advisor_id}`, but it is not called during `POST /`. It is possible to create an advisor with an invalid area/specialty combination.

6. **`behavior.alert` WebSocket event payload contains only `alert_id`** — This is an intentional design choice per the code comment, but it requires the frontend to make a follow-up API call to get the full alert. This is not documented anywhere in CLAUDE.md.

7. **`AdvisorRepository.update_availability` stores `status_until` as a naive Bogotá local time** — The `status_until` value returned from any endpoint echoing the advisor object will be a naive ISO string without a timezone suffix. Frontend code that parses this field must not assume UTC.
