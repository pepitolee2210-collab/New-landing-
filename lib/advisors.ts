/* ============================================================
   UsaLatinoPrime — Asesoras y leads (Supabase vía REST, SOLO servidor)
   · Reparto por TURNO ESTRICTO: la RPC ulp_assign_advisor elige la
     asesora activa con menos leads (bloqueo de fila → dos clics a la
     vez nunca caen en la misma) y suma uno a su contador.
   · La asignación ocurre en el primer clic real a WhatsApp, no en la
     visita: ambas reciben la misma cantidad de personas que escriben.
   · Sin Supabase todo cae al número general de lib/config.ts.
   Esquema: supabase/advisors.sql
   ============================================================ */
import { WHATSAPP_DIGITS } from "@/lib/config";
import type { LeadKind } from "@/lib/wa-route";

export interface Advisor {
  id: string;
  name: string;
  whatsapp: string; // solo dígitos
  /** Turnos en el reparto (1..10): con 4/4/2 salen 4, 4 y 2 de cada 10 leads. */
  weight: number;
  active: boolean;
  assigned_count: number;
  last_assigned_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AdvisorPick = Pick<Advisor, "id" | "name" | "whatsapp">;

export type LeadSource = "auto" | "sticky" | "default";

export interface Lead {
  id: string;
  created_at: string;
  advisor_id: string;
  kind: LeadKind;
  path: string | null;
  service_id: string | null;
  source: LeadSource;
}

export const ADVISOR_COOKIE = "ulp_adv";
export const ADVISOR_COOKIE_DAYS = 30;

/** Sin base de datos (o sin asesoras activas) se usa el número general. */
export const DEFAULT_ADVISOR: AdvisorPick = { id: "default", name: "Equipo", whatsapp: WHATSAPP_DIGITS };

const SUPABASE_URL = (process.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
const ADMIN_SECRET = process.env.SUPABASE_ADMIN_SECRET ?? "";

export const advisorsEnabled = Boolean(SUPABASE_URL && ANON_KEY);

function headers(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

const ID_RE = /^[a-z0-9-]{2,30}$/;
export function isAdvisorId(v: unknown): v is string {
  return typeof v === "string" && ID_RE.test(v);
}

/** Memo corto de asesoras activas por id (evita una lectura por clic repetido). */
const activeMemo = new Map<string, { at: number; data: AdvisorPick | null }>();
const ACTIVE_TTL_MS = 20_000;

/** Devuelve la asesora si existe y está activa (RLS solo expone las activas). */
export async function getActiveAdvisor(id: string): Promise<AdvisorPick | null> {
  if (!advisorsEnabled || !isAdvisorId(id)) return null;
  const m = activeMemo.get(id);
  if (m && Date.now() - m.at < ACTIVE_TTL_MS) return m.data;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/ulp_advisors?select=id,name,whatsapp&id=eq.${encodeURIComponent(id)}&limit=1`,
      { headers: headers(), cache: "no-store", signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as AdvisorPick[];
    const data = rows[0] ?? null;
    activeMemo.set(id, { at: Date.now(), data });
    return data;
  } catch {
    return null;
  }
}

/** Siguiente asesora por turno (null si no hay ninguna activa o falla la BD). */
export async function assignAdvisor(): Promise<AdvisorPick | null> {
  if (!advisorsEnabled) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ulp_assign_advisor`, {
      method: "POST",
      headers: headers(),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
      body: "{}",
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as AdvisorPick[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Registra un lead (cualquier clic a WhatsApp con asesora asignada). */
export async function insertLead(input: {
  advisorId: string;
  kind: LeadKind;
  path: string | null;
  serviceId: string | null;
  source: LeadSource;
}): Promise<boolean> {
  if (!advisorsEnabled) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ulp_leads`, {
      method: "POST",
      headers: headers({ Prefer: "return=minimal" }),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
      body: JSON.stringify({
        advisor_id: input.advisorId,
        kind: input.kind,
        path: input.path,
        service_id: input.serviceId,
        source: input.source,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Limitador simple por IP para /ir/whatsapp (memoria del proceso). */
const buckets = new Map<string, { n: number; reset: number }>();
export function leadRateLimit(key: string, max = 40, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  b.n += 1;
  return b.n <= max;
}

// ---------------- Administración (RPC con secreto) ----------------

/** Llama a una RPC de admin. ok=false si falla la red, la BD o el secreto. */
async function rpc<T>(
  fn: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; data: T | null }> {
  if (!advisorsEnabled || !ADMIN_SECRET) return { ok: false, data: null };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: headers(),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ p_secret: ADMIN_SECRET, ...body }),
    });
    if (!res.ok) return { ok: false, data: null };
    const text = await res.text();
    return { ok: true, data: (text ? JSON.parse(text) : null) as T };
  } catch {
    return { ok: false, data: null };
  }
}

export async function adminListAdvisors(): Promise<Advisor[] | null> {
  const r = await rpc<Advisor[]>("ulp_admin_advisors_list", {});
  return r.ok ? (r.data ?? []) : null;
}

export async function adminUpsertAdvisor(a: {
  id: string;
  name: string;
  whatsapp: string;
  weight: number;
  active: boolean;
}): Promise<boolean> {
  const r = await rpc<unknown>("ulp_admin_advisor_upsert", {
    p_id: a.id,
    p_name: a.name,
    p_whatsapp: a.whatsapp,
    p_weight: a.weight,
    p_active: a.active,
  });
  activeMemo.delete(a.id); // que /ir/whatsapp vea el cambio (pausa/número) al instante
  return r.ok;
}

export async function adminResetCounters(): Promise<boolean> {
  return (await rpc<unknown>("ulp_admin_advisors_reset", {})).ok;
}

export async function adminListLeads(days = 30, limit = 500): Promise<Lead[] | null> {
  const r = await rpc<Lead[]>("ulp_admin_leads_list", { p_days: days, p_limit: limit });
  return r.ok ? (r.data ?? []) : null;
}
