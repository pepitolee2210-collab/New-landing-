/* ============================================================
   UsaLatinoPrime — Autenticación del panel /admin (SOLO servidor)
   Un solo admin con contraseña (env ADMIN_PASSWORD). La sesión es una
   cookie httpOnly cuyo valor es un hash derivado de la contraseña:
   si cambias la contraseña, todas las sesiones caducan solas.
   ============================================================ */
import { createHash, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "ulp_admin";

/** Token de sesión derivado de ADMIN_PASSWORD (null si no está configurada). */
export function adminToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHash("sha256").update(`ulp-admin:${pw}`).digest("hex");
}

/** Comparación en tiempo constante (evita filtrar longitud/prefijos). */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** ¿La petición trae una sesión de admin válida? */
export function isAdminRequest(req: NextRequest): boolean {
  const token = adminToken();
  if (!token) return false;
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!cookie) return false;
  return safeEqual(cookie, token);
}
