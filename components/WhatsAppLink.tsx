"use client";

/* ============================================================
   Enlace a WhatsApp con tracking de Contact (Pixel).
   Reutilizable desde componentes de servidor (hero, footer…).
   ============================================================ */
import type { ReactNode } from "react";
import { waLink } from "@/lib/config";
import { trackBrowser } from "@/lib/meta/pixel-client";

interface WhatsAppLinkProps {
  message: string;
  className?: string;
  children: ReactNode;
}

export default function WhatsAppLink({ message, className, children }: WhatsAppLinkProps) {
  return (
    <a
      className={className}
      href={waLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackBrowser("Contact")}
    >
      {children}
    </a>
  );
}
