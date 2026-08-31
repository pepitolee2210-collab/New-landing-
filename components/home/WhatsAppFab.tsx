"use client";

/* ============================================================
   LP — Botón flotante de WhatsApp (siempre a mano en móvil)
   ============================================================ */
import { waLink } from "@/lib/config";
import { trackBrowser } from "@/lib/meta/pixel-client";
import { Ico } from "../icons";

export default function WhatsAppFab() {
  return (
    <a
      className="lp-fab"
      href={waLink("Hola, quiero información sobre sus servicios migratorios.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      onClick={() => trackBrowser("Contact")}
    >
      {Ico.whatsapp}
    </a>
  );
}
