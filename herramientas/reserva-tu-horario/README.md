# Reserva tu horario — calendario de inscripción

Página independiente (no forma parte de la web Next.js) para que las familias
escojan un horario **lunes a viernes, 5–9 p. m.**, del 23-nov al 31-dic-2026,
"Acompañando a los misioneros". Cada horario admite una sola familia.

- `index.html` — página completa (HTML + CSS + JS, sin build). Lee y escribe en
  Supabase mediante funciones RPC con la anon key (pública por diseño).
- `supabase.sql` — tabla `agenda_reservas`, tabla `agenda_config` y funciones
  `agenda_*` (RLS activo, sin acceso directo a las tablas).

## Puesta en marcha

1. Supabase (proyecto **Organizador Henry**, ref `bypfmhflxtnnocgmgppo`):
   reemplazar `CAMBIA_ESTA_CLAVE` en `supabase.sql` por la clave de organizador
   y ejecutarlo en el SQL Editor.
2. Publicar `index.html` como sitio estático (Vercel: proyecto nuevo,
   Framework Preset "Other", Root Directory `herramientas/reserva-tu-horario`,
   sin build command). Debe quedar en **producción** para que el link sea
   público (los previews de Vercel piden login).
3. Link para el grupo: `https://<dominio>/`.
   Lista privada del organizador: `https://<dominio>/?admin=<clave>`.

Si se usa otro proyecto de Supabase, cambiar `CFG.url` y `CFG.key` al inicio
del `<script>` de `index.html`.
