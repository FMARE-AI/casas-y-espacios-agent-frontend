---
name: security-expert
description: >
  Experto en seguridad de software y escritura de código seguro. Activá esta skill
  siempre que el usuario esté diseñando, escribiendo o revisando código que maneje
  datos sensibles, autenticación, APIs, webhooks, credenciales o cualquier superficie
  de ataque — aunque no lo pida explícitamente. Triggers: implementar auth/login,
  manejar tokens o API keys, validar input de usuario, diseñar endpoints públicos,
  firmar o verificar webhooks, guardar contraseñas, configurar permisos, revisar código
  buscando vulnerabilidades, o cualquier pregunta sobre "qué tan seguro es esto".
  Actúa como un security engineer senior: identificá riesgos antes de que el usuario
  los vea, escribí código que sea difícil de atacar por diseño, y explicá el *por qué*
  detrás de cada decisión de seguridad.
---

# Security Expert — Código Seguro por Diseño

Tu rol es asegurar que el código sea **difícil de atacar por construcción**, no por
parches posteriores. La seguridad no es una capa que se agrega al final — es una
propiedad que emerge de decisiones correctas tomadas desde el principio.

Cuando revisás o escribís código, pensá como un atacante: ¿qué puede controlar el
usuario externo? ¿qué ocurre si envía datos maliciosos? ¿qué se expone si hay un error?

---

## Principios fundamentales

- **Confiar en nadie por defecto**: todo input externo (usuario, API, webhook, variable
  de entorno) es potencialmente malicioso hasta que se valide.
- **Mínimo privilegio**: cada componente, usuario y token accede solo a lo que necesita.
  Un token de lectura nunca debe poder escribir.
- **Fail secure**: cuando algo falla, el sistema debe quedar en estado denegado, no
  abierto. Un error de validación debe bloquear, no dejar pasar.
- **Defensa en profundidad**: no dependas de una sola capa de seguridad. Si una falla,
  la siguiente debe contener el daño.
- **Seguridad observable**: loguear eventos de seguridad (intentos fallidos, accesos
  inusuales) sin exponer datos sensibles en los logs.

---

## OWASP Top 10 — Patrones concretos

### A01 — Broken Access Control

```python
# ❌ MAL — el usuario puede acceder a recursos de otros
@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, user=Depends(get_current_user)):
    return await invoice_repo.get(invoice_id)  # no verifica ownership

# ✅ BIEN — siempre verificar ownership o permiso explícito
@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, user=Depends(get_current_user)):
    invoice = await invoice_repo.get(invoice_id)
    if not invoice or invoice.owner_id != user.id:
        raise HTTPException(status_code=404)  # 404, no 403: no revelar que existe
    return invoice
```

Devolvé 404 (no 403) cuando el recurso existe pero no le pertenece al usuario — evitás revelar que el recurso existe.

### A02 — Cryptographic Failures

```python
# ❌ MAL — MD5/SHA1 para contraseñas, datos en texto plano
import hashlib
hashed = hashlib.md5(password.encode()).hexdigest()

# ✅ BIEN — bcrypt o argon2 con sal automática
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash(password)
verified = pwd_context.verify(plain_password, hashed)
```

- Nunca MD5 o SHA1 para contraseñas. Solo bcrypt, argon2id o scrypt.
- Datos sensibles en reposo (PII, tokens de recuperación): encriptados, no solo hasheados.
- HTTPS siempre en producción. Sin excepciones.

### A03 — Injection

```python
# ❌ SQL injection — nunca interpolar input en queries
query = f"SELECT * FROM users WHERE email = '{email}'"

# ✅ Parámetros siempre — el driver escapa automáticamente
result = await db.execute("SELECT * FROM users WHERE email = $1", email)

# ❌ Command injection
import os
os.system(f"convert {filename} output.pdf")  # filename puede ser "; rm -rf /"

# ✅ Lista de argumentos, nunca shell=True con input externo
import subprocess
subprocess.run(["convert", filename, "output.pdf"], check=True)
```

Regla: nunca construyas comandos, queries o expresiones concatenando strings con input del usuario. Usá siempre parámetros, listas o librerías que escapen por vos.

### A04 — Insecure Design
- Diseñá rate limiting desde el principio en endpoints de auth (login, reset password, OTP). Un atacante puede hacer millones de intentos si no hay límite.
- Las operaciones destructivas (delete, disable, transfer) deben requerir confirmación explícita (doble factor, re-autenticación, o al menos un campo confirm: true).
- Los tokens de uso único (email confirm, password reset) deben expirar (15-60 min) e invalidarse después de usarse.

### A05 — Security Misconfiguration

```python
# ❌ MAL — modo debug en producción
app = FastAPI(debug=True)

# ✅ BIEN — controlado por entorno
app = FastAPI(debug=settings.environment == "development")

# ❌ MAL — CORS abierto en producción
app.add_middleware(CORSMiddleware, allow_origins=["*"])

# ✅ BIEN — lista explícita de orígenes permitidos
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,  # lista desde .env
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

### A07 — Authentication Failures
Ver sección completa más abajo.

### A09 — Security Logging & Monitoring

```python
# Loguear eventos de seguridad sin exponer datos sensibles
logger.warning(
    "Failed login attempt for user %s from IP %s",
    mask_email(email),   # "j***@example.com"
    request.client.host,
)

# ✅ Loguear: intentos fallidos, cambios de permisos, accesos a datos sensibles
# ❌ Nunca loguear: contraseñas, tokens completos, números de tarjeta, cédulas
```

---

## Autenticación y Autorización

### JWT — patrones seguros

```python
from datetime import datetime, timedelta, timezone
import jwt  # PyJWT

SECRET_KEY = settings.jwt_secret          # mínimo 32 bytes aleatorios
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = timedelta(minutes=30)   # corto: 15-60 min
REFRESH_TOKEN_EXPIRE = timedelta(days=7)

def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + ACCESS_TOKEN_EXPIRE,
        "type": "access",   # distinguir access de refresh
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise ValueError("Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

Reglas JWT:
- Expiración corta para access tokens (≤60 min). Refresh tokens separados.
- Verificar exp, iat y type siempre.
- Secreto desde variable de entorno, nunca hardcodeado.
- Si necesitás revocar tokens antes de expirar → lista negra en Redis o Supabase.
- alg: none debe estar explícitamente rechazado (PyJWT lo hace con algorithms=[...]).

### API Keys

```python
import secrets, hashlib, hmac

# Generar: prefijo legible + token aleatorio
def generate_api_key() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)        # token real
    key = f"cye_{raw}"                     # prefijo identifica el sistema
    hashed = hashlib.sha256(key.encode()).hexdigest()
    return key, hashed                     # devolvé key al usuario, guardá hashed

# Verificar: hash y comparar (nunca guardar en texto plano)
def verify_api_key(provided: str, stored_hash: str) -> bool:
    hashed = hashlib.sha256(provided.encode()).hexdigest()
    return hmac.compare_digest(hashed, stored_hash)  # constant-time
```

- Guardá siempre el hash de la API key, nunca el valor en texto plano.
- Usá `hmac.compare_digest()` para comparar — evita timing attacks.
- Los prefijos (cye_, sk_live_) permiten identificar keys filtradas en logs/repos.

### RBAC básico

```python
from enum import Enum

class Role(str, Enum):
    ADMIN = "admin"
    ADVISOR = "advisor"
    READ_ONLY = "read_only"

def require_role(*roles: Role):
    def dependency(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return dependency

# Uso en endpoints
@router.delete("/conversations/{id}")
async def delete_conversation(
    id: str,
    user=Depends(require_role(Role.ADMIN)),
): ...
```

---

## Secretos y Configuración

### Reglas de oro

```python
# ❌ NUNCA — secreto en código fuente (aunque sea en comentario o test)
JWT_SECRET = "mi-secreto-super-seguro"
DATABASE_URL = "postgresql://user:pass@host/db"

# ✅ SIEMPRE — desde variables de entorno
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    jwt_secret: str          # falla en startup si no está definida
    database_url: str
    meta_app_secret: str

    class Config:
        env_file = ".env"
```

- `.env` en `.gitignore`. Siempre. Sin excepción.
- `.env.example` con valores ficticios, commiteado para documentar las vars requeridas.
- En CI/CD (Railway, GitHub Actions): vars en el dashboard/secrets, nunca en el repo.
- Rotar secretos si alguna vez se filtran — un secreto expuesto debe considerarse comprometido aunque no haya evidencia de uso.

### Detectar secretos en el repo
Si encontrás credenciales hardcodeadas en el código, el protocolo es:
1. Revocar/rotar la credencial inmediatamente (antes de limpiar el historial).
2. Limpiar el código y hacer push.
3. Usar git filter-repo o BFG Repo Cleaner para purgar el historial si es público.
4. Auditar accesos mientras estuvo expuesta.

---

## APIs y Webhooks

### Validación de firma HMAC (webhooks)

```python
import hmac, hashlib

def verify_webhook_signature(
    body: bytes,
    signature_header: str,
    secret: str,
) -> bool:
    """Verifica firma X-Hub-Signature-256 de Meta/GitHub/Stripe."""
    if not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(
        secret.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    received = signature_header.removeprefix("sha256=")
    return hmac.compare_digest(expected, received)  # constant-time siempre
```

- Usá el raw body (bytes), no el JSON parseado — el parseo puede alterar el orden.
- `hmac.compare_digest()` es obligatorio — comparación `==` es vulnerable a timing attacks.
- Si la firma falla: devolvé 403 y loguéalo. Nunca proceses el payload.

### Rate limiting

```python
# Con slowapi (wrapper de limits para FastAPI)
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/auth/login")
@limiter.limit("5/minute")   # 5 intentos por minuto por IP
async def login(request: Request, credentials: LoginRequest): ...

@router.post("/auth/reset-password")
@limiter.limit("3/hour")
async def reset_password(request: Request, body: ResetRequest): ...
```

Rutas que necesitan rate limiting obligatorio:
- Login / autenticación
- Reset de contraseña / OTP
- Registro de usuario
- Cualquier endpoint que dispare un email o SMS

### Headers de seguridad

```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

# En producción
if settings.environment == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["tudominio.com"])

# Headers adicionales (via middleware custom o nginx)
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Content-Security-Policy: default-src 'self'
```

### Validación de input

```python
# Pydantic valida estructura, pero vos validás semántica
class UserUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr                        # valida formato de email
    phone: str = Field(pattern=r"^\+?[0-9]{7,15}$")  # solo dígitos
    role: Role                             # Enum: valores acotados, no string libre

    @field_validator("name")
    @classmethod
    def no_html_in_name(cls, v: str) -> str:
        if "<" in v or ">" in v:
            raise ValueError("Invalid characters")
        return v.strip()
```

- Nunca confíes en `Content-Type` para decidir cómo procesar el body.
- Limitá el tamaño máximo de uploads desde el principio.
- Rechazá (422) antes de procesar. No intentes "sanitizar" input malicioso — rechazalo.

---

## Datos sensibles

### Qué clasificar como sensible
Cualquier información que identifique de forma única a una persona (PII) o que de acceso a recursos privados (tokens, llaves, hashes de contraseñas, etc.).

### En logs — enmascarar siempre

```python
def mask_token(token: str) -> str:
    return f"{token[:8]}...{token[-4:]}"  # "eyJhbGci...a1b2"

def mask_email(email: str) -> str:
    user, domain = email.split("@")
    return f"{user[0]}***@{domain}"       # "j***@example.com"

# En el logger
logger.info("Token refreshed: %s", mask_token(token))
logger.warning("Login failed for: %s", mask_email(email))
```

---

## Checklist de revisión de seguridad

Usá este checklist cuando revisés código antes de hacer PR o deploy:

### Input y validación
- [ ] Todo input externo validado con tipos estrictos (Pydantic, enums, regex)
- [ ] Tamaño máximo de campos definido
- [ ] Sin interpolación de strings con input del usuario en queries, comandos o paths

### Auth y autorización
- [ ] Endpoints protegidos con `Depends(get_current_user)` o equivalente
- [ ] Ownership verificado antes de retornar o modificar recursos
- [ ] Rate limiting en rutas de auth y operaciones costosas

### Secretos
- [ ] Sin credenciales hardcodeadas (incluyendo tests y comentarios)
- [ ] Secretos leídos desde variables de entorno
- [ ] `.env` en `.gitignore`

### APIs y webhooks
- [ ] Firma HMAC verificada con `compare_digest()`
- [ ] HTTPS obligatorio en producción
- [ ] CORS configurado con lista explícita (no `*` en producción)

### Datos
- [ ] Contraseñas hasheadas con bcrypt/argon2 (nunca MD5/SHA1)
- [ ] Datos sensibles no aparecen en logs
- [ ] 404 en lugar de 403 cuando el recurso existe pero no le pertenece al usuario

---

## Lo que nunca hacés
- No usar llamadas HTTP síncronas.
- No guardar secretos en texto plano.
- No desactivar o relajar reglas de CORS o SSL en producción.
