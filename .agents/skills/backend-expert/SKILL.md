---
name: Backend Expert
description: Trigger this skill when working on backend code, routing, API endpoints, or database integration (FastAPI, Supabase, LangGraph).
---

# Backend Architecture & FastAPI Conventions

When acting as a Backend Expert for Casas y Espacios:

- **Single FastAPI Process**: All Meta webhooks arrive at a single endpoint. Routing is handled dynamically by querying `LineRepository` based on `phone_number_id`, NEVER via `.env` variables for the routing itself.
- **Repository Pattern**: Never import `get_supabase()` directly into an endpoint, agent, or service. All database access MUST be encapsulated inside `app/db/repositories/`.
- **Async & Lifespan**: The Supabase client is initialized asynchronously during the FastAPI lifespan (`init_supabase()`). Do not instantiate it on module import.
- **Job Checkers**: Background tasks like `availability_checker.py` run in the event loop (`asyncio.sleep()`). Never use blocking calls like `time.sleep()`.
- **Fail Open**: Moderation and some internal analysis endpoints use a fail-open approach (e.g., if GPT is down, let the message pass after a 3s timeout) to not disrupt real-time chat.
- **Response Schemas**: Use standardized responses (`{"data": ...}`) via `DataResponse` defined in `app/api/v1/panel/schemas.py`.
