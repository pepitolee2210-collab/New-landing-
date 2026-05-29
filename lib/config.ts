/* ============================================================
   UsaLatinoPrime — Configuración del sitio
   Valores sensibles/ajustables vía variables de entorno
   (con fallback a los valores reales del negocio).
   ============================================================ */

const RAW_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? "+1 (402) 824-8171";

/** Número tal cual para mostrar en pantalla. */
export const WHATSAPP_DISPLAY = RAW_WHATSAPP;

/** Sólo dígitos, para construir enlaces https://wa.me/<digits>. */
export const WHATSAPP_DIGITS = RAW_WHATSAPP.replace(/[^0-9]/g, "");

/**
 * Video de fallback general (cuando un servicio no define el suyo).
 * Vacío por defecto: cada servicio ya trae su propio video, así que no
 * intentamos cargar un archivo inexistente.
 */
export const VIDEO_URL = process.env.NEXT_PUBLIC_VIDEO_URL ?? "";

/** Imagen de portada opcional del video. */
export const VIDEO_POSTER = process.env.NEXT_PUBLIC_VIDEO_POSTER ?? "";

/** Fases del recorrido (stepper). */
export const PHASES = [
  "Quiénes somos",
  "Servicios",
  "Video",
  "Preguntas",
  "Resultado",
] as const;

/** Contenido del hero (admite <em> para resaltar). */
export const HERO_TITLE = "Tu trámite migratorio, <em>en tus manos</em>";
export const HERO_LEAD =
  "UsaLatinoPrime es una plataforma digital de inmigración — no un bufete tradicional. " +
  "Llevas tu propio caso desde el celular, guiado paso a paso, con validación automática " +
  "y nuestro equipo a tu lado en los momentos clave.";

/**
 * Construye el enlace de WhatsApp con un mensaje pre-redactado.
 */
export function waLink(message: string): string {
  return `https://wa.me/${WHATSAPP_DIGITS}?text=${encodeURIComponent(message)}`;
}
