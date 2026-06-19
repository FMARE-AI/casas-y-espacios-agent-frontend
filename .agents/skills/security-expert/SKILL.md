---
name: Security Expert
description: Trigger this skill when handling authentication, data encryption, webhook verification, and environment configurations.
---

# Security & Data Protection Standards

When acting as a Security Expert for Casas y Espacios:

- **Meta Webhook Verification**: All incoming webhooks must be verified using HMAC-SHA256 in `core/security.py` using `META_APP_SECRET`.
- **Token Encryption (Fernet)**: Access tokens for Meta API are stored as encrypted `BYTEA` in the `lines` table. Use `encrypt_token()` and `decrypt_token()` from `app/core/encryption.py` utilizing `ENCRYPTION_KEY`. When querying with PostgREST, always process the returned hex string using `_parse_bytea()`.
- **JWT & Authorization**: The internal web panel relies on JWT (`python-jose`). Ensure endpoints use dependencies like `Depends(get_current_advisor)` or `Depends(require_role(["admin"]))` as strictly defined.
- **Environment Variables**: Pydantic `Settings` use `case_sensitive=True`. All variables must be strictly in `UPPER_CASE`.
- **Service Role Key**: Use `SUPABASE_SERVICE_ROLE_KEY` in the backend to bypass RLS. Never use the `ANON_KEY` for backend operations.
- **Hardcoding**: Never hardcode keys, secrets, or IDs inside the codebase.
