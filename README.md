# Casas y Espacios — Panel Web

Panel web interno para el equipo de una inmobiliaria colombiana. Permite a los asesores atender en tiempo real las conversaciones de WhatsApp que el bot de IA escala cuando no puede resolverlas por sí solo.

## Documentación

| Archivo                                   | Descripción                                           |
| ----------------------------------------- | ----------------------------------------------------- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)   | Estructura interna, capas y flujo de datos            |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md)     | Setup local, convenciones y cómo extender el proyecto |
| [API_GUIDE.md](docs/API_GUIDE.md)         | Referencia de todos los servicios y endpoints         |
| [CONFIGURATION.md](docs/CONFIGURATION.md) | Variables de entorno y configuración por ambiente     |

---

## Prerrequisitos

- Node.js `>=20.19.0` (ver `.nvmrc`)
- npm `>=10`
- Acceso a un proyecto de Supabase (auth)
- Backend FastAPI corriendo (ver repositorio `casas-y-espacios-agent`)

## Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales

# 3. Iniciar el servidor de desarrollo
npm run dev
# → http://localhost:5173
```

## Variables de entorno

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

Ver [CONFIGURATION.md](docs/CONFIGURATION.md) para la referencia completa.


## Comandos

```bash
npm run dev        # Servidor de desarrollo con HMR
npm run build      # Build de producción (tsc + vite build)
npm run lint       # Lint con ESLint
npm run preview    # Preview del build local
```

## Stack

| Tecnología            | Uso                  |
| --------------------- | -------------------- |
| React 19 + TypeScript | Framework UI         |
| Vite 8                | Build tool           |
| Tailwind CSS v4       | Estilos              |
| Zustand               | Estado global        |
| Axios                 | HTTP client          |
| Supabase JS           | Autenticación        |
| React Router v7       | Routing              |
| React Hook Form + Zod | Formularios          |
| shadcn/ui             | Componentes base     |
| Sonner                | Notificaciones toast |

## Deployment

El proyecto despliega automáticamente en **Vercel** al hacer push a `main`. Ver [CONFIGURATION.md](docs/CONFIGURATION.md) para detalles.
