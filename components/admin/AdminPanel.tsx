"use client";

/* ============================================================
   /admin — Panel del equipo
   · Dueño (contraseña ADMIN_PASSWORD): Panel de leads, Contactos (CRM),
     Reseñas y Equipo.
   · Asesora (usuario + contraseña): solo sus Contactos.
   ============================================================ */
import { useCallback, useEffect, useState } from "react";
import { Ico } from "../icons";
import CrmPanel from "./CrmPanel";
import LeadsPanel from "./LeadsPanel";
import ReviewsPanel from "./ReviewsPanel";
import TeamPanel from "./TeamPanel";

export interface SessionInfo {
  uid: string;
  name: string;
  role: "owner" | "advisor";
  advisorId: string | null;
}

type View = "leads" | "crm" | "reviews" | "team";

const VIEWS: { key: View; label: string; owner: boolean }[] = [
  { key: "crm", label: "Contactos", owner: false },
  { key: "leads", label: "Leads y asesoras", owner: true },
  { key: "reviews", label: "Reseñas", owner: true },
  { key: "team", label: "Equipo", owner: true },
];

const TITLES: Record<View, string> = {
  crm: "Contactos",
  leads: "Leads y asesoras",
  reviews: "Reseñas de clientes",
  team: "Equipo y accesos",
};

export default function AdminPanel() {
  const [session, setSession] = useState<SessionInfo | null | undefined>(undefined); // undefined = comprobando
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [view, setView] = useState<View>("crm");
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch("/api/admin/login", { cache: "no-store" });
        if (!alive) return;
        if (res.ok) {
          const s = (await res.json()) as SessionInfo;
          setSession(s);
          try {
            const saved = window.localStorage.getItem("ulp_admin_view") as View | null;
            if (saved && VIEWS.some((v) => v.key === saved && (!v.owner || s.role === "owner"))) setView(saved);
          } catch {
            /* sin almacenamiento */
          }
        } else setSession(null);
      } catch {
        if (alive) setSession(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function go(v: View) {
    setView(v);
    try {
      window.localStorage.setItem("ulp_admin_view", v);
    } catch {
      /* sin almacenamiento */
    }
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: user.trim(), password }),
      });
      if (res.ok) {
        const me = await fetch("/api/admin/login", { cache: "no-store" });
        const s = (await me.json()) as SessionInfo;
        setPassword("");
        setSession(s);
        setView("crm");
      } else if (res.status === 503) setLoginError("Falta configurar el acceso en el servidor (ADMIN_PASSWORD o Supabase).");
      else if (res.status === 429) setLoginError("Demasiados intentos. Espera unos minutos.");
      else setLoginError(user.trim() ? "Usuario o contraseña incorrectos." : "Contraseña incorrecta.");
    } catch {
      setLoginError("Sin conexión con el servidor. Intenta de nuevo.");
    } finally {
      setLoggingIn(false);
    }
  }

  const logout = useCallback(async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setSession(null);
  }, []);

  const onPending = useCallback((n: number) => setPendingReviews(n), []);

  if (session === undefined) return <div className="admin__loading">Cargando…</div>;

  if (!session) {
    return (
      <form className="rate__card admin__login slide-anim" onSubmit={login}>
        <span className="slide-tag">Panel del equipo</span>
        <h1 className="rate__title">Entrar</h1>
        <p className="rate__sub">Asesoras: usuario y contraseña. Dueño: solo la contraseña.</p>
        <div className="rate__field">
          <label className="rate__label" htmlFor="admin-user">
            Usuario <small>(solo asesoras)</small>
          </label>
          <input id="admin-user" className="rate__input" autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} placeholder="vanessa" />
        </div>
        <div className="rate__field">
          <label className="rate__label" htmlFor="admin-pass">
            Contraseña
          </label>
          <input id="admin-pass" className="rate__input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {loginError && <p className="rate__error">{loginError}</p>}
        <button type="submit" className="btn btn--primary rate__send" disabled={loggingIn}>
          {loggingIn ? "Entrando…" : "Entrar"} {Ico.arrow}
        </button>
      </form>
    );
  }

  const views = VIEWS.filter((v) => !v.owner || session.role === "owner");
  const current = views.some((v) => v.key === view) ? view : "crm";

  return (
    <div className="admin slide-anim">
      <header className="admin__bar">
        <div className="admin__brand">
          <span className="admin__brand-dot" aria-hidden="true" />
          <div>
            <span className="admin__kicker">{session.role === "owner" ? "Panel del dueño" : `Hola, ${session.name}`}</span>
            <h1 className="admin__title">{TITLES[current]}</h1>
          </div>
        </div>
        {views.length > 1 && (
          <nav className="admin__views" aria-label="Sección">
            {views.map((v) => (
              <button
                key={v.key}
                type="button"
                className={"admin__view" + (current === v.key ? " admin__view--on" : "")}
                aria-current={current === v.key ? "page" : undefined}
                onClick={() => go(v.key)}
              >
                {v.label}
                {v.key === "reviews" && pendingReviews > 0 && <span className="admin__view-n">{pendingReviews}</span>}
              </button>
            ))}
          </nav>
        )}
        <div className="admin__bar-actions">
          <button type="button" className="btn btn--ghost admin__btn-sm" onClick={() => void logout()}>
            Salir
          </button>
        </div>
      </header>

      {current === "crm" && <CrmPanel session={session} />}
      {current === "leads" && session.role === "owner" && <LeadsPanel />}
      {current === "reviews" && session.role === "owner" && <ReviewsPanel onPending={onPending} />}
      {current === "team" && session.role === "owner" && <TeamPanel />}
    </div>
  );
}
