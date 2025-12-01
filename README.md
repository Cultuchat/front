# CultuChat - Asistente Cultural Inteligente

**CultuChat** es una plataforma web que combina inteligencia artificial con scraping automático para ayudarte a descubrir eventos culturales en Lima, Perú. Utiliza OpenAI para chat inteligente y una arquitectura 100% Supabase.

> 🚀 **Estado del Proyecto**: ✅ Arquitectura 100% Supabase implementada
> - Frontend Next.js conectado a Supabase
> - Edge Functions para chat y scraping
> - OpenAI API integrado (**OBLIGATORIO**)
> - Autenticación con Supabase Auth
> - Sin backend tradicional (FastAPI eliminado)
>
> 📖 **Inicio Rápido**: Ver [QUICKSTART.md](./QUICKSTART.md) para deploy en 10 minutos

## Características Principales

- **Chatbot Inteligente**: Conversa con IA usando OpenAI y obtén recomendaciones personalizadas
- **Exploración de Eventos**: Navega por conciertos, exposiciones, teatro, danza y más
- **Mapa Interactivo**: Encuentra eventos cercanos a tu ubicación con Leaflet
- **Filtros Avanzados**: Filtra por fecha, categoría, precio y ubicación
- **Sistema de Favoritos**: Guarda tus eventos favoritos (requiere login)
- **Scraping Automático**: Actualización cada 12 horas de 7 fuentes culturales
- **Autenticación**: Login con email o Google (Supabase Auth)

## Tecnologías Utilizadas

### Frontend
- **Next.js 15** - Framework React con App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos utility-first
- **Leaflet & React-Leaflet** - Mapas interactivos
- **Supabase Auth** - Autenticación

### Backend (100% Supabase)
- **Supabase PostgreSQL** - Base de datos managed
- **Edge Functions (Deno)** - Serverless backend
- **OpenAI API** - Chat inteligente (**OBLIGATORIO**)
- **Firecrawl** - Web scraping estructurado
- **Vercel Cron** - Scraping programado cada 12h

## Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18+)
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en [Vercel](https://vercel.com) (gratis)

### APIs Necesarias (**OBLIGATORIAS**)
- **OpenAI API Key**: **REQUERIDA** - [Obtener aquí](https://platform.openai.com/api-keys)
- **Firecrawl API Key**: **REQUERIDA** - [Obtener aquí](https://firecrawl.dev)

## Instalación y Configuración

### ⚡ Quick Start (10 minutos)

Lee [QUICKSTART.md](./QUICKSTART.md) para instrucciones rápidas.

### 📖 Setup Completo

Lee [SETUP.md](./SETUP.md) para la guía detallada paso a paso.

### Resumen Rápido

```bash
# 1. Clonar repositorio
git clone <url-del-repositorio>
cd front-1

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus claves de Supabase

# 4. Ejecutar en desarrollo
npm run dev
```

**Importante**: Necesitas configurar Supabase primero (base de datos y Edge Functions). Ver [SETUP.md](./SETUP.md).

## Estructura del Proyecto

```
front-1/
├── src/                         # Frontend Next.js
│   ├── app/                     # App Router (páginas)
│   │   ├── (main)/             # Rutas principales
│   │   │   ├── chat/           # Chat con IA
│   │   │   ├── eventos/        # Explorar eventos
│   │   │   ├── mapa/           # Mapa de eventos
│   │   │   ├── perfil/         # Perfil de usuario
│   │   │   └── ...
│   │   ├── auth/               # Autenticación (Supabase)
│   │   │   ├── login/          # Login
│   │   │   ├── signup/         # Registro
│   │   │   └── callback/       # OAuth callback
│   │   └── api/cron/           # Vercel Cron jobs
│   ├── components/             # Componentes React
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Cliente Supabase
│   └── types/                  # TypeScript types
│
├── supabase/                   # Backend Supabase
│   ├── functions/              # Edge Functions
│   │   ├── chat/              # Chat con OpenAI
│   │   └── scrape/            # Scraping con Firecrawl
│   └── migrations/            # Migraciones SQL
│
├── public/                     # Archivos estáticos
├── QUICKSTART.md              # Deploy en 10 min
├── SETUP.md                   # Guía completa
├── ARQUITECTURA.md            # Documentación técnica
└── README.md                  # Este archivo
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo

# Producción
npm run build        # Build optimizado
npm run start        # Servidor de producción

# Calidad
npm run lint         # ESLint
```

## Supabase Edge Functions

```bash
# Deploy functions
npx supabase functions deploy chat --no-verify-jwt
npx supabase functions deploy scrape --no-verify-jwt

# Ver logs
npx supabase functions logs chat
npx supabase functions logs scrape

# Configurar secrets
npx supabase secrets set OPENAI_API_KEY=sk-xxx
npx supabase secrets set FIRECRAWL_API_KEY=fc-xxx
```

## Deploy en Producción

### Vercel (Recomendado)

1. Push a GitHub
2. Importar proyecto en [Vercel](https://vercel.com)
3. Configurar variables de entorno
4. Deploy automático

Ver [SETUP.md](./SETUP.md) para detalles.

## Costos Mensuales

```
Supabase Free Tier: $0/mes
Vercel Hobby: $0/mes
OpenAI (gpt-4o-mini): $3-5/mes
Firecrawl: $29-49/mes

TOTAL: ~$32-54/mes
```

## Fuentes de Eventos

El scraper obtiene eventos de:
1. Joinnus Conciertos
2. Joinnus Teatro
3. Teleticket
4. Centro Cultural PUCP
5. ICPNA
6. MALI (Museo de Arte de Lima)
7. MAC Lima

Actualización automática cada 12 horas vía Vercel Cron.

## Arquitectura

Esta app usa una **arquitectura 100% Supabase** sin backend tradicional:

- ✅ PostgreSQL managed (Supabase)
- ✅ Edge Functions serverless (reemplazan FastAPI)
- ✅ OpenAI para chat inteligente
- ✅ Firecrawl para scraping
- ✅ Vercel Cron para scraping programado
- ❌ No FastAPI, no Docker, no Celery
- ❌ No Pinecone (PostgreSQL full-text search es suficiente)

Ver [ARQUITECTURA.md](./ARQUITECTURA.md) para detalles técnicos.

## Autenticación

- **Email/Password**: Registro nativo de Supabase
- **Google OAuth**: Login con Google (opcional)
- **Sin login**: La app funciona sin autenticación, pero no puedes guardar favoritos

## Solución de Problemas

### Error: "Missing Supabase environment variables"
→ Verifica `.env.local` y reinicia `npm run dev`

### Chat no funciona
→ Verifica que `OPENAI_API_KEY` esté configurado en Supabase secrets

### Scraping no funciona
→ Verifica que `FIRECRAWL_API_KEY` esté configurado en Supabase secrets

### Ver más
→ Revisa [SETUP.md](./SETUP.md) sección Troubleshooting

## Documentación

- [QUICKSTART.md](./QUICKSTART.md) - Deploy en 10 minutos
- [SETUP.md](./SETUP.md) - Guía completa de configuración
- [ARQUITECTURA.md](./ARQUITECTURA.md) - Documentación técnica
- [supabase/README.md](./supabase/README.md) - Edge Functions

## Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.

## Próximas Características

- [ ] Sistema de favoritos con Supabase Auth
- [ ] Notificaciones push
- [ ] Sistema de reseñas
- [ ] Más fuentes de eventos
- [ ] App móvil (React Native)
- [ ] Exportar a Google Calendar

---

Desarrollado con ❤️ para la comunidad cultural de Lima
