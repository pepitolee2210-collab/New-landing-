"use client";

/* ============================================================
   Prime — widget del asesor virtual (lanzador + panel)
   Móvil: pantalla completa · Escritorio: tarjeta flotante.
   Modo ESCRIBIR (chat con streaming) y modo LLAMAR (CallView).
   Se muestra en la home y en /califica; no compite con el embudo.
   ============================================================ */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { waLink } from "@/lib/config";
import { getServiceBySlug } from "@/lib/services";
import { trackBrowser } from "@/lib/meta/pixel-client";
import { Ico } from "../icons";
import CallView from "./CallView";

interface Msg {
  id: string;
  role: "user" | "model";
  text: string;
  error?: boolean;
}

const GREETING =
  "Hola, soy Prime, el asesor de USA Latino Prime. Puedo resolver tus dudas sobre tu trámite. ¿En qué te ayudo?";
const QUICK = ["¿Califico para asilo?", "¿Cuánto cuesta?", "Visa Juvenil", "Hablar con una persona"];
const FALLBACK =
  "Estoy terminando de configurarme y todavía no puedo responder aquí. Escríbenos por WhatsApp y una persona del equipo te ayuda ahora mismo. {{whatsapp}}";
const ERROR_TEXT =
  "Se me cortó la conexión un momento. Inténtalo de nuevo o escríbenos por WhatsApp. {{whatsapp}}";
const STORAGE = "pa_msgs_v1";
const SHOW_ON = new Set(["/", "/califica"]);

const MicIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

let seq = 0;
const uid = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

/** Convierte el texto del modelo en nodos: negritas, saltos, tarjetas de servicio y WhatsApp. */
function renderRich(text: string, onWa: () => void): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\{\{svc:([a-z0-9-]+)\}\}|\{\{whatsapp\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  const pushText = (chunk: string) => {
    if (!chunk.trim()) return;
    const lines = chunk.split("\n").filter((l, i, arr) => !(l.trim() === "" && (i === 0 || i === arr.length - 1)));
    lines.forEach((line, li) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, pi) =>
        p.startsWith("**") && p.endsWith("**") ? <strong key={`b${k}-${li}-${pi}`}>{p.slice(2, -2)}</strong> : p,
      );
      out.push(
        <span key={`l${k}-${li}`} className="pa-line">
          {parts}
        </span>,
      );
    });
    k++;
  };
  while ((m = re.exec(text)) !== null) {
    pushText(text.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[1]) {
      const svc = getServiceBySlug(m[1]);
      if (svc) {
        out.push(
          <Link key={`s${k++}`} href={`/${svc.slug}`} className="pa-card">
            <span className="pa-card__t">
              <span className="pa-card__name">{svc.name}</span>
              <span className="pa-card__sub">Calificar ahora · 2 min</span>
            </span>
            {Ico.arrow}
          </Link>,
        );
      }
    } else {
      out.push(
        <a
          key={`w${k++}`}
          className="pa-btn pa-btn--wa pa-btn--inline"
          href={waLink("Hola, vengo del chat de Prime y quiero hablar con una persona sobre mi trámite.")}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWa}
        >
          {Ico.whatsapp} Hablar con una persona
        </a>,
      );
    }
  }
  pushText(text.slice(last));
  return out;
}

export default function AgentWidget({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "call">("chat");
  const [msgs, setMsgs] = useState<Msg[]>([{ id: "g", role: "model", text: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const trackedRef = useRef(false);

  // Restaura la conversación de la sesión.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE);
      if (raw) {
        const saved = JSON.parse(raw) as Msg[];
        if (Array.isArray(saved) && saved.length > 0) setMsgs(saved);
      }
    } catch {
      /* sin storage */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE, JSON.stringify(msgs.slice(-40)));
    } catch {
      /* sin storage */
    }
  }, [msgs]);

  // Scroll al final y foco.
  useEffect(() => {
    if (!open || view !== "chat") return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs, open, view]);
  useEffect(() => {
    if (open && view === "chat") inputRef.current?.focus();
  }, [open, view]);

  // Esc cierra. Bloqueo del scroll de fondo a prueba de iOS: el body se fija
  // conservando la posición, y se restaura al cerrar.
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    const y = window.scrollY;
    const b = document.body.style;
    const prev = { position: b.position, top: b.top, left: b.left, right: b.right, width: b.width };
    b.position = "fixed";
    b.top = `-${y}px`;
    b.left = "0";
    b.right = "0";
    b.width = "100%";
    document.documentElement.classList.add("pa-lock");
    return () => {
      window.removeEventListener("keydown", h);
      b.position = prev.position;
      b.top = prev.top;
      b.left = prev.left;
      b.right = prev.right;
      b.width = prev.width;
      document.documentElement.classList.remove("pa-lock");
      window.scrollTo(0, y);
    };
  }, [open]);

  // Móvil: el panel se ajusta al área realmente visible (encima del teclado).
  // iOS no encoge 100dvh al abrir el teclado; VisualViewport sí lo refleja.
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    const panel = panelRef.current;
    if (!vv || !panel) return;
    const mobile = window.matchMedia("(max-width: 640px)");
    const apply = () => {
      if (!mobile.matches) {
        panel.style.removeProperty("--pa-vvh");
        panel.style.removeProperty("--pa-top");
        return;
      }
      panel.style.setProperty("--pa-vvh", `${Math.round(vv.height)}px`);
      panel.style.setProperty("--pa-top", `${Math.round(vv.offsetTop)}px`);
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    mobile.addEventListener("change", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      mobile.removeEventListener("change", apply);
    };
  }, [open, view]);

  const onWa = useCallback(() => trackBrowser("Contact"), []);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;
      if (!trackedRef.current) {
        trackedRef.current = true;
        trackBrowser("AgentChat", { content_name: "prime" });
      }
      setInput("");
      const userMsg: Msg = { id: uid(), role: "user", text };
      const modelId = uid();
      const history = [...msgs, userMsg];
      setMsgs([...history, { id: modelId, role: "model", text: "" }]);
      setBusy(true);

      const patch = (t: string, error = false) =>
        setMsgs((cur) => cur.map((m) => (m.id === modelId ? { ...m, text: t, error } : m)));

      try {
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history
              .filter((m) => m.id !== "g" && !m.error && m.text.trim())
              .map((m) => ({ role: m.role, text: m.text })),
          }),
        });
        if (res.status === 503) {
          patch(FALLBACK);
          return;
        }
        if (!res.ok || !res.body) {
          patch(ERROR_TEXT, true);
          return;
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          if (acc.includes("[[error]]")) {
            patch(acc.replace("[[error]]", "").trim() || ERROR_TEXT, true);
            return;
          }
          patch(acc);
        }
        if (!acc.trim()) patch(ERROR_TEXT, true);
      } catch {
        patch(ERROR_TEXT, true);
      } finally {
        setBusy(false);
      }
    },
    [busy, msgs],
  );

  function quick(q: string) {
    if (q === "Hablar con una persona") {
      onWa();
      window.open(waLink("Hola, quiero hablar con una persona sobre mi trámite."), "_blank", "noopener");
      return;
    }
    void send(q);
  }

  function endCall(seconds: number) {
    setView("chat");
    if (seconds > 0) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      setMsgs((cur) => [
        ...cur,
        {
          id: uid(),
          role: "model",
          text: `Llamada finalizada (${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}). Si quieres, seguimos por aquí o te paso con una persona. {{whatsapp}}`,
        },
      ]);
    }
  }

  if (!enabled || !pathname || !SHOW_ON.has(pathname)) return null;

  return (
    <>
      {/* Lanzador */}
      {!open && (
        <button type="button" className="pa-launch" onClick={() => setOpen(true)} aria-label="Abrir el asesor Prime">
          <span className="pa-launch__ava">
            ★<span className="pa-launch__dot" />
          </span>
          <span className="pa-launch__txt">
            <strong>Pregúntale a Prime</strong>
            <small>Resuelve tus dudas al instante</small>
          </span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="pa-panel" role="dialog" aria-label="Asesor Prime" ref={panelRef}>
          {view === "call" ? (
            <CallView onExit={endCall} />
          ) : (
            <>
              <header className="pa-head">
                <span className="pa-head__ava">
                  ★<span className="pa-head__dot" />
                </span>
                <span className="pa-head__t">
                  <span className="pa-head__name">Prime</span>
                  <span className="pa-head__sub">Asesor virtual · responde al instante</span>
                </span>
                <button type="button" className="pa-head__call" onClick={() => setView("call")} aria-label="Llamar a Prime">
                  {Ico.phone}
                </button>
                <button type="button" className="pa-head__x" onClick={() => setOpen(false)} aria-label="Cerrar">
                  {Ico.close}
                </button>
              </header>

              <div className="pa-list" ref={listRef}>
                {msgs.map((m, i) => (
                  <div key={m.id} className={"pa-msg pa-msg--" + m.role + (m.error ? " is-error" : "")}>
                    {m.role === "model" && m.text === "" ? (
                      <span className="pa-typing" aria-label="Prime está escribiendo">
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : m.role === "model" ? (
                      renderRich(m.text, onWa)
                    ) : (
                      m.text
                    )}
                    {i === 0 && m.id === "g" && (
                      <div className="pa-quick">
                        {QUICK.map((q) => (
                          <button key={q} type="button" className="pa-chip" onClick={() => quick(q)}>
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form
                className="pa-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
              >
                <div className="pa-input__row">
                  <input
                    ref={inputRef}
                    className="pa-input__field"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu duda…"
                    maxLength={1500}
                    autoComplete="off"
                    enterKeyHint="send"
                    onFocus={() => setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }), 250)}
                  />
                  <button type="button" className="pa-input__mic" onClick={() => setView("call")} aria-label="Hablar por voz">
                    {MicIcon}
                  </button>
                  <button type="submit" className="pa-input__send" disabled={!input.trim() || busy} aria-label="Enviar">
                    {Ico.arrow}
                  </button>
                </div>
                <span className="pa-input__note">
                  Prime orienta; no sustituye asesoría legal. Un humano te atiende por WhatsApp si lo pides.
                </span>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
