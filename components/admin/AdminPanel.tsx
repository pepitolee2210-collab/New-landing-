"use client";

/* ============================================================
   /admin — Panel de moderación de reseñas
   Login con contraseña (ADMIN_PASSWORD). Carga TODAS las reseñas
   una vez y filtra en cliente: así las pestañas muestran cifras,
   hay resumen (pendientes, publicadas, promedio) y buscador.
   Cada reseña muestra fecha y hora exactas (hora local del que
   mira el panel) más "hace X" relativo. Aprobar publica en la
   home al instante.
   ============================================================ */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Review, ReviewStatus } from "@/lib/reviews";
import { getServiceById } from "@/lib/services";
import { Ico } from "../icons";

type Tab = ReviewStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Publicadas" },
  { key: "rejected", label: "Rechazadas" },
];

const dateFmt = new Intl.DateTimeFormat("es-US", { day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("es-US", { hour: "numeric", minute: "2-digit" });

function fmtDate(iso: string): string {
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return "";
  }
}
function fmtTime(iso: string): string {
  try {
    return timeFmt.format(new Date(iso));
  } catch {
    return "";
  }
}
/** "hace 5 min", "hace 3 h", "ayer", "hace 4 días" (vacío si es muy antigua). */
function timeAgo(iso: string, now: number): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "ahora mismo";
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ayer";
  if (d < 31) return `hace ${d} días`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `hace ${mo} ${mo === 1 ? "mes" : "meses"}`;
  return "";
}

function Stars({ rating }: { rating: number }) {
  const r = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    <span className="rv__stars" aria-label={`${r} de 5 estrellas`}>
      {"★".repeat(r)}
      <span>{"★".repeat(5 - r)}</span>
    </span>
  );
}

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "Pendiente",
  approved: "Publicada",
  rejected: "Rechazada",
};

export default function AdminPanel() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = comprobando
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [all, setAll] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reviews?status=all", { cache: "no-store" });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (res.status === 503) {
        setAuthed(true);
        setConfigured(false);
        return;
      }
      if (res.ok) {
        setAuthed(true);
        setConfigured(true);
        setAll((await res.json()) as Review[]);
        setNow(Date.now());
      } else {
        setAuthed(true);
        setError("No se pudo leer la base de datos. Intenta de nuevo en unos segundos.");
      }
    } catch {
      setError("Sin conexión con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // "hace X" se refresca solo cada minuto
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    for (const r of all) if (r.status) c[r.status] += 1;
    return c;
  }, [all]);

  const avg = useMemo(() => {
    const pub = all.filter((r) => r.status === "approved");
    if (pub.length === 0) return null;
    return pub.reduce((s, r) => s + r.rating, 0) / pub.length;
  }, [all]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((r) => r.status === tab)
      .filter((r) => {
        if (!q) return true;
        const svc = r.service_id ? getServiceById(r.service_id)?.name ?? "" : "";
        return (
          r.name.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q) ||
          svc.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [all, tab, query]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setPassword("");
      setAuthed(true);
      void load();
    } else if (res.status === 503) {
      setLoginError("Falta configurar ADMIN_PASSWORD en el servidor.");
    } else {
      setLoginError("Contraseña incorrecta.");
    }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
    setAll([]);
  }

  async function setStatus(id: string, status: ReviewStatus) {
    setBusy((b) => new Set(b).add(id));
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setAll((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
      } else {
        setError("No se pudo guardar el cambio. Intenta de nuevo.");
      }
    } finally {
      setBusy((b) => {
        const n = new Set(b);
        n.delete(id);
        return n;
      });
    }
  }

  // ---- Comprobando sesión ----
  if (authed === null) {
    return <div className="admin__loading">Cargando…</div>;
  }

  // ---- Login ----
  if (!authed) {
    return (
      <form className="rate__card admin__login slide-anim" onSubmit={login}>
        <span className="slide-tag">Panel privado</span>
        <h1 className="rate__title">Administración de reseñas</h1>
        <div className="rate__field">
          <label className="rate__label" htmlFor="admin-pass">
            Contraseña
          </label>
          <input
            id="admin-pass"
            className="rate__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </div>
        {loginError && <p className="rate__error">{loginError}</p>}
        <button type="submit" className="btn btn--primary rate__send">
          Entrar {Ico.arrow}
        </button>
      </form>
    );
  }

  // ---- Sin Supabase configurado ----
  if (!configured) {
    return (
      <div className="rate__card admin__login slide-anim">
        <span className="slide-tag">Panel privado</span>
        <h1 className="rate__title">Falta conectar la base de datos</h1>
        <p className="rate__sub">
          Configura <code>SUPABASE_URL</code>, <code>SUPABASE_ANON_KEY</code> y{" "}
          <code>SUPABASE_ADMIN_SECRET</code> (ver <code>supabase/setup.sql</code>) y vuelve a
          cargar esta página.
        </p>
      </div>
    );
  }

  // ---- Panel ----
  return (
    <div className="admin slide-anim">
      <header className="admin__bar">
        <div className="admin__brand">
          <span className="admin__brand-dot" aria-hidden="true" />
          <div>
            <span className="admin__kicker">Panel privado</span>
            <h1 className="admin__title">Reseñas de clientes</h1>
          </div>
        </div>
        <div className="admin__bar-actions">
          <button
            type="button"
            className="btn btn--ghost admin__btn-sm"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
          <button type="button" className="btn btn--ghost admin__btn-sm" onClick={logout}>
            Salir
          </button>
        </div>
      </header>

      <section className="admin__stats" aria-label="Resumen">
        <div className={"stat stat--pending" + (counts.pending > 0 ? " stat--alert" : "")}>
          <span className="stat__n">{counts.pending}</span>
          <span className="stat__l">Por revisar</span>
        </div>
        <div className="stat stat--approved">
          <span className="stat__n">{counts.approved}</span>
          <span className="stat__l">Publicadas en la home</span>
        </div>
        <div className="stat stat--avg">
          <span className="stat__n">
            {avg === null ? "—" : avg.toFixed(1)}
            <span className="stat__star" aria-hidden="true">
              ★
            </span>
          </span>
          <span className="stat__l">Promedio publicado</span>
        </div>
        <div className="stat">
          <span className="stat__n">{all.length}</span>
          <span className="stat__l">Recibidas en total</span>
        </div>
      </section>

      <div className="admin__toolbar">
        <div className="admin__tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={"admin__tab" + (tab === t.key ? " admin__tab--on" : "")}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className="admin__tab-n">{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <label className="admin__search">
          <span className="sr-only">Buscar</span>
          <input
            type="search"
            placeholder="Buscar por nombre, servicio o texto…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="admin__error">{error}</p>}

      {loading && all.length === 0 ? (
        <div className="admin__loading">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="admin__empty">
          {query
            ? "Ninguna reseña coincide con la búsqueda."
            : tab === "pending"
              ? "No hay reseñas por revisar. Todo al día. 🎉"
              : tab === "approved"
                ? "Aún no has publicado ninguna reseña."
                : "No hay reseñas rechazadas."}
        </div>
      ) : (
        <div className="admin__list">
          {items.map((r) => {
            const svc = r.service_id ? getServiceById(r.service_id) : undefined;
            const isBusy = busy.has(r.id);
            const ago = timeAgo(r.created_at, now);
            return (
              <article className={"rv rv--" + (r.status ?? "pending")} key={r.id}>
                <div className="rv__side">
                  <span className="rv__big">{r.rating}</span>
                  <Stars rating={r.rating} />
                </div>
                <div className="rv__body">
                  <div className="rv__who">
                    <strong>{r.name}</strong>
                    {svc && <span className="rv__chip">{svc.name}</span>}
                    <span className={"rv__state rv__state--" + (r.status ?? "pending")}>
                      {STATUS_LABEL[r.status ?? "pending"]}
                    </span>
                  </div>
                  <p className="rv__text">“{r.comment}”</p>
                  <div className="rv__time">
                    {Ico.calendar}
                    <span>{fmtDate(r.created_at)}</span>
                    <span className="rv__sep" aria-hidden="true">
                      ·
                    </span>
                    {Ico.clock}
                    <span>{fmtTime(r.created_at)}</span>
                    {ago && <em>{ago}</em>}
                  </div>
                </div>
                <div className="rv__actions">
                  {r.status !== "approved" && (
                    <button
                      type="button"
                      className="btn btn--primary rv__btn"
                      disabled={isBusy}
                      onClick={() => setStatus(r.id, "approved")}
                    >
                      {Ico.check} Publicar
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      type="button"
                      className="btn btn--ghost rv__btn rv__btn--no"
                      disabled={isBusy}
                      onClick={() => setStatus(r.id, "rejected")}
                    >
                      {Ico.close} {r.status === "approved" ? "Quitar de la home" : "Rechazar"}
                    </button>
                  )}
                  {r.status === "rejected" && (
                    <button
                      type="button"
                      className="btn btn--ghost rv__btn"
                      disabled={isBusy}
                      onClick={() => setStatus(r.id, "pending")}
                    >
                      Devolver a pendientes
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="admin__hint">
        Las horas se muestran en la zona horaria de tu dispositivo. Al publicar, la reseña aparece en
        la home al instante; se muestran las 12 más recientes.
      </p>
    </div>
  );
}
