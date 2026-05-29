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
| `NEXT_PUBLIC_WHATSAPP` | Número de WhatsApp del negocio (con código de país) | `+1 (385) 456-4470` |
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

## Cambiar de tema

El diseño incluye tres temas. Cambia el atributo `data-style` del `<html>` en
`app/layout.tsx` por `"clasico"`, `"institucional"` o `"moderno"`.
