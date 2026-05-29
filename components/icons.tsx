/* ============================================================
   UsaLatinoPrime — Iconos
   ============================================================ */
import type { ReactElement } from "react";
import { ICONS } from "@/lib/services";
import type { IconName } from "@/lib/types";

/* ---- Iconos inline reutilizables (UI) ---- */
export const Ico: Record<string, ReactElement> = {
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4 10-11" /></svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  ),
  arrowL: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z" /></svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M.06 24l1.69-6.16a11.87 11.87 0 1 1 4.3 4.3zm6.6-3.8c1.55.92 2.7 1.47 4.85 1.47a9.87 9.87 0 1 0-8.36-4.6l.25.4-1 3.65 3.76-.98z" /><path d="M9.5 7.3c-.2-.45-.4-.46-.6-.47h-.5a1 1 0 0 0-.72.34A2.9 2.9 0 0 0 6.8 9.3c0 1.27.92 2.5 1.05 2.67.13.18 1.8 2.86 4.43 3.9 2.18.86 2.62.69 3.1.64.47-.04 1.5-.6 1.72-1.2.2-.58.2-1.08.15-1.18-.06-.1-.23-.16-.5-.3-.25-.13-1.5-.74-1.74-.82-.24-.1-.4-.13-.58.13-.17.26-.66.82-.8 1-.16.17-.3.2-.56.06a7.2 7.2 0 0 1-2.1-1.3 7.9 7.9 0 0 1-1.45-1.8c-.15-.27 0-.4.12-.54.12-.12.26-.3.4-.46.12-.16.16-.27.24-.45.08-.18.04-.34-.02-.47-.06-.13-.55-1.36-.77-1.85z" /></svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
  ),
  device: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
  ),
  volume: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
  ),
};

/* ---- Icono de servicio (SVG almacenado como string en ICONS) ---- */
export function SvgIcon({ name, className }: { name: IconName; className?: string }) {
  const html = ICONS[name] ?? "";
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
