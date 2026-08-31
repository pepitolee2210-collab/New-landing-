"use client";

/* ============================================================
   /admin — Panel de moderación de reseñas
   Login con contraseña (ADMIN_PASSWORD). Pestañas: pendientes /
   aprobadas / rechazadas. Aprobar publica en la home al instante.
   ============================================================ */
import { useCallback, useEffect, useState } from "react";
import type { Review, ReviewStatus } from "@/lib/reviews";
import { getServiceById } from "@/lib/services";
import { Ico } from "../icons";

type Tab = ReviewStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobadas" },
  { key: "rejected", label: "Rechazadas" },
];

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-US", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function AdminPanel() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = comprobando
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const load = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?status=${t}`, { cache: "no-store" });
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
        setItems((await res.json()) as Review[]);
      }
    } catch {
      /* la UI muestra la lista anterior */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

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
      void load(tab);
    } else if (res.status === 503) {
      setLoginError("Falta configurar ADMIN_PASSWORD en el servidor.");
    } else {
      setLoginError("Contraseña incorrecta.");
    }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
    setItems([]);
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
        setItems((list) => list.filter((r) => r.id !== id));
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
      <div className="admin__head">
        <div>
          <span className="slide-tag">Panel privado</span>
          <h1 className="rate__title">Reseñas</h1>
        </div>
        <button type="button" className="btn btn--ghost" onClick={logout}>
          Salir
        </button>
      </div>

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
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin__loading">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="admin__empty">
          {tab === "pending"
            ? "No hay reseñas pendientes. 🎉"
            : "No hay reseñas en esta pestaña."}
        </div>
      ) : (
        <div className="admin__list">
          {items.map((r) => {
            const svc = r.service_id ? getServiceById(r.service_id) : undefined;
            const isBusy = busy.has(r.id);
            return (
              <article className="admin-card" key={r.id}>
                <header className="admin-card__top">
                  <span className="review-card__stars">
                    {"★".repeat(r.rating)}
                    <span className="review-card__stars-off">{"★".repeat(5 - r.rating)}</span>
                  </span>
                  <span className="admin-card__date">{fmtDate(r.created_at)}</span>
                </header>
                <p className="admin-card__text">“{r.comment}”</p>
                <footer className="admin-card__foot">
                  <span className="admin-card__who">
                    <strong>{r.name}</strong>
                    {svc ? ` · ${svc.name}` : ""}
                  </span>
                  <span className="admin-card__actions">
                    {tab !== "approved" && (
                      <button
                        type="button"
                        className="btn btn--primary admin-card__btn"
                        disabled={isBusy}
                        onClick={() => setStatus(r.id, "approved")}
                      >
                        {Ico.check} Aprobar
                      </button>
                    )}
                    {tab !== "rejected" && (
                      <button
                        type="button"
                        className="btn btn--ghost admin-card__btn admin-card__btn--no"
                        disabled={isBusy}
                        onClick={() => setStatus(r.id, "rejected")}
                      >
                        {Ico.close} Rechazar
                      </button>
                    )}
                    {tab === "rejected" && (
                      <button
                        type="button"
                        className="btn btn--ghost admin-card__btn"
                        disabled={isBusy}
                        onClick={() => setStatus(r.id, "pending")}
                      >
                        Devolver a pendientes
                      </button>
                    )}
                  </span>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
