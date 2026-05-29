# TODO — UsaLatinoPrime (Next.js)

## Hecho
- [x] Scaffold Next.js 14 (App Router) + TypeScript
- [x] Portar diseño (HTML/JSX prototipo) a componentes TSX tipados
- [x] Sistema de estilos con tema **moderno** fijo (sin panel de tweaks de diseño)
- [x] Tipografías con next/font (Source Sans 3 / Source Serif 4)
- [x] WhatsApp configurable (`NEXT_PUBLIC_WHATSAPP`, default +1 385 456-4470)
- [x] Video como archivo local con fallback a placeholder
- [x] **Rediseño móvil**: app-shell 100dvh, safe-areas, nav inferior, progreso compacto,
      hero reorganizado, servicios 1 columna, touch targets ≥52px, reduce-motion

## Pendiente del usuario
- [ ] Subir el/los video(s) a `public/videos/` (`demo.mp4`)
- [ ] Verificar el número de WhatsApp en producción (Vercel env vars)
- [ ] Conectar dominio en Vercel

## Posibles mejoras futuras
- [ ] Analítica de conversión (clics a WhatsApp por servicio)
- [ ] Video distinto por servicio
- [ ] Tests e2e del flujo de calificación
