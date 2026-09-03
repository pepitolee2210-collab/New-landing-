"use client";

/* ============================================================
   /admin — Asesoras y reparto de leads
   · Tarjeta por asesora: número, estado (activa / pausada), leads de
     hoy, 7 y 30 días, y edición en línea.
   · Barra de reparto (30 días) para ver que van parejas.
   · Lista de leads con fecha y hora, asesora, origen y servicio.
   Un "lead" es la primera vez que una persona escribe (source=auto);
   los clics posteriores de la misma persona se muestran aparte como
   "repetidos" para no inflar la comparación.
   ============================================================ */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Advisor, Lead } from "@/lib/advisors";
import { getServiceById, getServiceBySlug } from "@/lib/services";
import { LEAD_KIND_LABEL, formatPhone, type LeadKind } from "@/lib/wa-route";
import { Ico } from "../icons";

const dateFmt = new Intl.DateTimeFormat("es-US", { day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("es-US", { hour: "numeric", minute: "2-digit" });

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(new RegExp("[" + String.fromCharCode(0x300) + "-" + String.fromCharCode(0x36f) + "]", "g"), "") // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

function isLead(l: Lead): boolean {
  return l.source === "auto";
}

interface Stats {
  today: number;
  d7: number;
  d30: number;
  repeat: number;
}

function statsFor(leads: Lead[], advisorId: string, now: number): Stats {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  const t7 = now - 7 * 864e5;
  const t30 = now - 30 * 864e5;
  const s: Stats = { today: 0, d7: 0, d30: 0, repeat: 0 };
  for (const l of leads) {
    if (l.advisor_id !== advisorId) continue;
    const t = new Date(l.created_at).getTime();
    if (!isLead(l)) {
      if (t >= t30) s.repeat += 1;
      continue;
    }
    if (t >= t30) s.d30 += 1;
    if (t >= t7) s.d7 += 1;
    if (t >= t0) s.today += 1;
  }
  return s;
}

export default function LeadsPanel() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<string | null>(null); // id en edición ("new" = alta)
  const [form, setForm] = useState({ name: "", whatsapp: "" });
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, l] = await Promise.all([
        fetch("/api/admin/advisors", { cache: "no-store" }),
        fetch("/api/admin/leads?days=30", { cache: "no-store" }),
      ]);
      if (a.status === 503 || l.status === 503) {
        setError("Falta conectar la base de datos (variables de Supabase).");
        return;
      }
      if (!a.ok || !l.ok) {
        setError("No se pudo leer la base de datos. Intenta de nuevo en unos segundos.");
        return;
      }
      setAdvisors((await a.json()) as Advisor[]);
      setLeads((await l.json()) as Lead[]);
      setNow(Date.now());
    } catch {
      setError("Sin conexión con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const t30 = now - 30 * 864e5;
    const per = new Map<string, number>();
    let total = 0;
    for (const l of leads) {
      if (!isLead(l) || new Date(l.created_at).getTime() < t30) continue;
      per.set(l.advisor_id, (per.get(l.advisor_id) ?? 0) + 1);
      total += 1;
    }
    return { per, total };
  }, [leads, now]);

  const visible = useMemo(
    () => leads.filter((l) => filter === "all" || l.advisor_id === filter).slice(0, 150),
    [leads, filter],
  );

  function startEdit(a: Advisor | null) {
    if (a) {
      setEditing(a.id);
      setForm({ name: a.name, whatsapp: formatPhone(a.whatsapp) });
    } else {
      setEditing("new");
      setForm({ name: "", whatsapp: "" });
    }
    setError(null);
  }

  async function save(id: string, active: boolean) {
    const name = form.name.trim();
    const whatsapp = form.whatsapp.replace(/\D/g, "");
    const realId = id === "new" ? slugify(name) : id;
    if (name.length < 2) return setError("Escribe el nombre.");
    if (!/^[0-9]{8,15}$/.test(whatsapp)) return setError("Número inválido: usa el formato +1 (xxx) xxx-xxxx.");
    if (!/^[a-z0-9-]{2,30}$/.test(realId)) return setError("Nombre inválido para crear la asesora.");
    if (id === "new" && advisors.some((a) => a.id === realId)) return setError("Ya existe una asesora con ese nombre.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/advisors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: realId, name, whatsapp, active }),
      });
      if (!res.ok) {
        setError("No se pudo guardar. Intenta de nuevo.");
        return;
      }
      setEditing(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggle(a: Advisor) {
    const actives = advisors.filter((x) => x.active && x.id !== a.id).length;
    if (a.active && actives === 0) {
      setError("No puedes pausar a la única asesora activa: los leads dejarían de repartirse.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/advisors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, name: a.name, whatsapp: a.whatsapp, active: !a.active }),
      });
      if (!res.ok) setError("No se pudo cambiar el estado. Intenta de nuevo.");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setSaving(true);
    try {
      await fetch("/api/admin/advisors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      setConfirmReset(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading && advisors.length === 0) {
    return <div className="admin__loading">Cargando…</div>;
  }

  return (
    <div className="ld">
      {error && <p className="admin__error">{error}</p>}

      {/* ---- Reparto ---- */}
      <section className="ld__split">
        <div className="ld__split-head">
          <div>
            <h2 className="ld__h">Reparto por turno</h2>
            <p className="ld__sub">
              Cada persona que escribe por primera vez va a la siguiente asesora activa, en orden. Queda fija con
              ella 30 días. Cifras de los últimos 30 días.
            </p>
          </div>
          <div className="ld__split-actions">
            <button type="button" className="btn btn--ghost admin__btn-sm" onClick={() => void load()} disabled={loading}>
              {loading ? "Actualizando…" : "Actualizar"}
            </button>
            {!confirmReset ? (
              <button type="button" className="btn btn--ghost admin__btn-sm" onClick={() => setConfirmReset(true)}>
                Reiniciar turnos
              </button>
            ) : (
              <span className="ld__confirm">
                ¿Poner los turnos a cero?
                <button type="button" className="btn btn--primary admin__btn-sm" onClick={() => void reset()} disabled={saving}>
                  Sí
                </button>
                <button type="button" className="btn btn--ghost admin__btn-sm" onClick={() => setConfirmReset(false)}>
                  No
                </button>
              </span>
            )}
          </div>
        </div>
        {totals.total > 0 ? (
          <div className="ld__bar" role="img" aria-label="Reparto de leads por asesora">
            {advisors
              .filter((a) => (totals.per.get(a.id) ?? 0) > 0)
              .map((a, i) => {
                const n = totals.per.get(a.id) ?? 0;
                const pct = Math.round((n / totals.total) * 100);
                return (
                  <span key={a.id} className="ld__bar-seg" data-i={i % 4} style={{ flexGrow: n }}>
                    <b>{a.name}</b> {n} · {pct}%
                  </span>
                );
              })}
          </div>
        ) : (
          <div className="ld__bar ld__bar--empty">Todavía no hay leads en los últimos 30 días.</div>
        )}
      </section>

      {/* ---- Asesoras ---- */}
      <section>
        <div className="ld__row-head">
          <h2 className="ld__h">Asesoras</h2>
          {editing !== "new" && (
            <button type="button" className="btn btn--ghost admin__btn-sm" onClick={() => startEdit(null)}>
              + Añadir asesora
            </button>
          )}
        </div>
        <div className="ld__grid">
          {advisors.map((a, i) => {
            const s = statsFor(leads, a.id, now);
            const isEdit = editing === a.id;
            return (
              <article key={a.id} className={"adv" + (a.active ? "" : " adv--off")} data-i={i % 4}>
                <header className="adv__head">
                  <span className="adv__avatar" aria-hidden="true">
                    {a.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="adv__who">
                    {isEdit ? (
                      <input
                        className="rate__input adv__input"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Nombre"
                        aria-label="Nombre"
                      />
                    ) : (
                      <strong>{a.name}</strong>
                    )}
                    {isEdit ? (
                      <input
                        className="rate__input adv__input"
                        value={form.whatsapp}
                        onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                        placeholder="+1 (xxx) xxx-xxxx"
                        inputMode="tel"
                        aria-label="WhatsApp"
                      />
                    ) : (
                      <span className="adv__phone">
                        {Ico.whatsapp} {formatPhone(a.whatsapp)}
                      </span>
                    )}
                  </div>
                  <span className={"adv__state" + (a.active ? " adv__state--on" : "")}>
                    {a.active ? "Activa" : "Pausada"}
                  </span>
                </header>

                <div className="adv__stats">
                  <div>
                    <b>{s.today}</b>
                    <span>hoy</span>
                  </div>
                  <div>
                    <b>{s.d7}</b>
                    <span>7 días</span>
                  </div>
                  <div>
                    <b>{s.d30}</b>
                    <span>30 días</span>
                  </div>
                  <div>
                    <b>{s.repeat}</b>
                    <span>repetidos</span>
                  </div>
                </div>

                <footer className="adv__actions">
                  {isEdit ? (
                    <>
                      <button type="button" className="btn btn--primary admin__btn-sm" disabled={saving} onClick={() => void save(a.id, a.active)}>
                        {Ico.check} Guardar
                      </button>
                      <button type="button" className="btn btn--ghost admin__btn-sm" onClick={() => setEditing(null)}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn btn--ghost admin__btn-sm" disabled={saving} onClick={() => startEdit(a)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className={"btn btn--ghost admin__btn-sm" + (a.active ? " adv__pause" : "")}
                        disabled={saving}
                        onClick={() => void toggle(a)}
                      >
                        {a.active ? "Pausar" : "Activar"}
                      </button>
                    </>
                  )}
                </footer>
              </article>
            );
          })}

          {editing === "new" && (
            <article className="adv adv--new">
              <header className="adv__head">
                <span className="adv__avatar" aria-hidden="true">
                  +
                </span>
                <div className="adv__who">
                  <input
                    className="rate__input adv__input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nombre"
                    aria-label="Nombre"
                    autoFocus
                  />
                  <input
                    className="rate__input adv__input"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="+1 (xxx) xxx-xxxx"
                    inputMode="tel"
                    aria-label="WhatsApp"
                  />
                </div>
              </header>
              <p className="ld__sub">Entra al reparto de inmediato como activa.</p>
              <footer className="adv__actions">
                <button type="button" className="btn btn--primary admin__btn-sm" disabled={saving} onClick={() => void save("new", true)}>
                  {Ico.check} Crear
                </button>
                <button type="button" className="btn btn--ghost admin__btn-sm" onClick={() => setEditing(null)}>
                  Cancelar
                </button>
              </footer>
            </article>
          )}
        </div>
      </section>

      {/* ---- Leads ---- */}
      <section>
        <div className="ld__row-head">
          <h2 className="ld__h">Leads recibidos</h2>
          <div className="admin__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              className={"admin__tab" + (filter === "all" ? " admin__tab--on" : "")}
              onClick={() => setFilter("all")}
            >
              Todas
            </button>
            {advisors.map((a) => (
              <button
                key={a.id}
                type="button"
                role="tab"
                aria-selected={filter === a.id}
                className={"admin__tab" + (filter === a.id ? " admin__tab--on" : "")}
                onClick={() => setFilter(a.id)}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="admin__empty">Aún no hay leads registrados en los últimos 30 días.</div>
        ) : (
          <div className="ld__table-wrap">
            <table className="ld__table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Asesora</th>
                  <th>Origen</th>
                  <th>Servicio</th>
                  <th>Página</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((l) => {
                  const adv = advisors.find((a) => a.id === l.advisor_id);
                  // Servicio explícito (cita / urgente) o deducido de la página del servicio.
                  const svc =
                    (l.service_id ? getServiceById(l.service_id) : undefined) ??
                    (l.path ? getServiceBySlug(l.path.replace(/^\/+|\/+$/g, "")) : undefined);
                  const d = new Date(l.created_at);
                  return (
                    <tr key={l.id} className={isLead(l) ? "" : "ld__tr--repeat"}>
                      <td>{dateFmt.format(d)}</td>
                      <td>{timeFmt.format(d)}</td>
                      <td>
                        <span className="rv__chip" data-i={Math.max(0, advisors.findIndex((a) => a.id === l.advisor_id)) % 4}>
                          {adv?.name ?? l.advisor_id}
                        </span>
                      </td>
                      <td>
                        {LEAD_KIND_LABEL[l.kind as LeadKind] ?? l.kind}
                        {!isLead(l) && <em className="ld__repeat"> · repetido</em>}
                      </td>
                      <td>{svc?.name ?? "—"}</td>
                      <td className="ld__path">{l.path ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="admin__hint">
          “Repetido” = la misma persona volvió a tocar WhatsApp; ya estaba asignada y no cuenta como lead nuevo. Las
          horas se muestran en la zona horaria de tu dispositivo.
        </p>
      </section>
    </div>
  );
}
