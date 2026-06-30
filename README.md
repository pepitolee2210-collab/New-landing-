# UsaLatinoPrime — Evaluación migratoria gratuita

Aplicación web (Next.js 14 · App Router · TypeScript) que guía al usuario por un
recorrido de 5 pasos —**Quiénes somos → Servicios → Video → Preguntas → Resultado**—
y lo lleva a contactar por WhatsApp según califique. Optimizada para **móvil**, que es
donde está la mayoría de los clientes.

> Implementada a partir del diseño exportado desde Claude Design (el bundle original
> se conserva en `project/` como referencia).

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- Tipografías con `next/font` (Source Sans 3 / Source Serif 4)
- Estilos en CSS con sistema de tokens por tema (tema **moderno** activo)
- Sin dependencias extra ni backend — listo para **Vercel**

## Puesta en marcha

```bash
npm install
npm run dev      # http://localhost:3000
```

Build de producción:

```bash
npm run build
npm start
```

## Configuración (variables de entorno)

Copia `.env.example` a `.env.local` (o configúralas en Vercel):

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `NEXT_PUBLIC_WHATSAPP` | Número de WhatsApp del negocio (con código de país) | `+1 (402) 824-8171` |
| `NEXT_PUBLIC_VIDEO_URL` | Ruta del video demo dentro de `/public` | `/videos/demo.mp4` |
| `NEXT_PUBLIC_VIDEO_POSTER` | Imagen de portada del video (opcional) | _(vacío)_ |

## Cómo subir el video

1. Coloca tu archivo en `public/videos/` (p. ej. `public/videos/demo.mp4`).
2. Asegúrate de que `NEXT_PUBLIC_VIDEO_URL` apunte a él (`/videos/demo.mp4` por defecto).
3. Mientras no exista el archivo, el paso de video muestra un placeholder elegante.

> Para videos pesados, considera alojarlos en un CDN/servicio de video y usar la URL externa.

## Despliegue en Vercel

1. Sube el repositorio a GitHub/GitLab.
2. En Vercel: **Add New → Project**, importa el repo (framework detectado: Next.js).
3. Añade las variables de entorno (`NEXT_PUBLIC_WHATSAPP`, etc.).
4. **Deploy**. No requiere configuración adicional.

## Estructura

```
app/                 Layout, página y estilos globales
  layout.tsx         Tipografías, metadatos, tema (data-style="moderno")
  page.tsx           Punto de entrada → <ImmigrationApp />
  globals.css        Sistema de estilos + rediseño móvil
components/          Componentes de UI (stepper, slides, quiz, resultado)
lib/                 Datos de servicios, tipos y configuración
public/              logo.png y carpeta videos/
project/             Bundle de diseño original (referencia, no se compila)
```

## Meta Pixel + Conversions API (CAPI)

La landing está instrumentada para **Meta Ads** (campañas de Ventas / lead-gen) con
**Pixel** (navegador) + **Conversions API** (servidor) y **deduplicación por `event_id`**.

**Pixel ID:** `1489091455876816`.

### Eventos que se envían

| Paso del embudo | Evento Meta | Canal |
| --- | --- | --- |
| Carga de la página | `PageView` | Navegador |
| Elegir un servicio | `ViewContent` | Navegador |
| Terminar el video | `VideoCompleted` (custom) | Navegador |
| Ver un resultado que califica | `EvaluationCompleted` (custom) | Navegador |
| **Clic al CTA de WhatsApp (resultado)** | **`Lead`** ← conversión clave | **Navegador + CAPI (deduplicado)** |
| Clic al WhatsApp del header | `Contact` | Navegador |

> La campaña de Ventas debe **optimizar por `Lead`**. El resto son señales de embudo
> y audiencias de remarketing. Esta landing no recolecta email/teléfono, así que el
> matching server-side usa `fbp`/`fbc`/IP/User-Agent + un `external_id` de primera
> parte (cookie `ulp_vid`).

### Variables de entorno (Meta)

Copia `.env.example` → `.env.local` (local) o configúralas en Vercel:

| Variable | Ámbito | Notas |
| --- | --- | --- |
| `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` | Público | Pixel ID. Tiene fallback en el código. |
| `FACEBOOK_CONVERSION_API_TOKEN` | **Secreto** | Token de la CAPI. Sin él, el CAPI hace _no-op_ seguro. |
| `FACEBOOK_GRAPH_API_VERSION` | Servidor | Opcional (default `v23.0`). |
| `FACEBOOK_TEST_EVENT_CODE` | Servidor | Solo QA. **Vacío en producción.** |
| `NEXT_PUBLIC_META_REQUIRE_CONSENT` | Público | `"1"` activa el banner opt-in (GDPR). Vacío = disparo directo (EE.UU.). |

### Cómo obtener el token de la CAPI

1. **business.facebook.com** → **Events Manager** (Administrador de eventos).
2. Selecciona el dataset/Pixel `1489091455876816`.
3. **Settings / Configuración** → **Conversions API** → **Generate access token**.
4. Copia el token (`EAA...`) en `FACEBOOK_CONVERSION_API_TOKEN`. **Es secreto** — no lo subas a git.
5. Para QA: pestaña **Test Events** → copia el `test_event_code` en `FACEBOOK_TEST_EVENT_CODE`.

### Verificación

- **Meta Pixel Helper** (extensión Chrome): debe detectar el Pixel y `PageView` una vez,
  `ViewContent` al elegir servicio, y `Lead` con `eventID` al clicar WhatsApp.
- **Test Events** (Events Manager): con `FACEBOOK_TEST_EVENT_CODE`, el `Lead` debe llegar
  **Browser + Server** y **deduplicarse** a un solo evento.

### Archivos relevantes

- `components/meta/MetaPixel.tsx` — snippet base del Pixel (montado en `app/layout.tsx`).
- `components/meta/ConsentBanner.tsx` — banner opt-in (Variante B, inactivo por defecto).
- `lib/meta/events.ts` — nombres de evento y Pixel ID compartidos.
- `lib/meta/pixel-client.ts` — helpers de navegador (cookies, track, beacon a CAPI).
- `lib/meta/capi.ts` — helper server-side (hashing + envío a Graph API).
- `app/api/meta/route.ts` — endpoint `POST /api/meta` que reenvía el evento a la CAPI.

## Cambiar de tema

El diseño incluye tres temas. Cambia el atributo `data-style` del `<html>` en
`app/layout.tsx` por `"clasico"`, `"institucional"` o `"moderno"`.
