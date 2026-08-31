"use client";

/* ============================================================
   LP — LA APP: teléfono con tilt al puntero + notificaciones
   flotantes. Badges de tiendas en "Próximamente" hasta que
   existan los links (NEXT_PUBLIC_APPSTORE_URL / PLAYSTORE_URL).
   ============================================================ */
import { useEffect, useRef } from "react";
import Image from "next/image";
import { Ico } from "../icons";

const APPSTORE_URL = process.env.NEXT_PUBLIC_APPSTORE_URL || "";
const PLAYSTORE_URL = process.env.NEXT_PUBLIC_PLAYSTORE_URL || "";

const AppleGlyph = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.79.06 2.26-.98 3.81-.84 1.3.11 2.28.62 2.92 1.56-2.67 1.6-2.24 5.12.19 6.05-.49 1.29-1.12 2.57-2 3.4zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const PlayGlyph = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 20.5V3.5c0-.59.34-1.11.84-1.35L13.69 12 3.84 21.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm3.35-4.31c.34.27.59.69.59 1.19s-.22.89-.57 1.16l-2.29 1.32-2.5-2.48 2.5-2.48 2.27 1.29zM6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z" />
  </svg>
);

function StoreBadge({ href, glyph, store }: { href: string; glyph: React.ReactNode; store: string }) {
  const live = href.trim().length > 0;
  const inner = (
    <>
      <span className="lp-store__glyph">{glyph}</span>
      <span className="lp-store__txt">
        <small>{live ? "Descárgala en" : "Próximamente en"}</small>
        <strong>{store}</strong>
      </span>
    </>
  );
  return live ? (
    <a className="lp-store" href={href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <span className="lp-store lp-store--soon" aria-disabled="true">
      {inner}
    </span>
  );
}

export default function AppSection() {
  const sceneRef = useRef<HTMLDivElement | null>(null);

  // Tilt del teléfono con el puntero (solo desktop con hover real).
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const onMove = (e: PointerEvent) => {
      const r = scene.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      scene.style.setProperty("--ry", `${(dx * 9).toFixed(2)}deg`);
      scene.style.setProperty("--rx", `${(-dy * 7).toFixed(2)}deg`);
    };
    const onLeave = () => {
      scene.style.setProperty("--ry", "0deg");
      scene.style.setProperty("--rx", "0deg");
    };
    scene.addEventListener("pointermove", onMove);
    scene.addEventListener("pointerleave", onLeave);
    return () => {
      scene.removeEventListener("pointermove", onMove);
      scene.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section id="app" className="lp-app lp-section">
      <div className="lp-wrap lp-app__grid">
        <div className="lp-app__copy" data-reveal>
          <span className="lp-eyebrow lp-eyebrow--gold">Nuestra aplicación</span>
          <h2>
            Tu caso, <em>en tu bolsillo</em>
          </h2>
          <p className="lp-app__lead">
            Muy pronto podrás llevar tu trámite completo desde nuestra app: avanzas paso a paso,
            subes tus documentos con la cámara y recibes avisos de cada movimiento de tu caso.
          </p>
          <div className="lp-app__points">
            <div className="lp-app__point">{Ico.check} Notificaciones de cada avance de tu trámite.</div>
            <div className="lp-app__point">{Ico.check} Tus documentos organizados y seguros en un solo lugar.</div>
            <div className="lp-app__point">{Ico.check} El mismo acompañamiento humano, ahora en tu celular.</div>
          </div>
          <div className="lp-app__stores">
            <StoreBadge href={APPSTORE_URL} glyph={AppleGlyph} store="App Store" />
            <StoreBadge href={PLAYSTORE_URL} glyph={PlayGlyph} store="Google Play" />
          </div>
        </div>

        <div className="lp-app__visual" data-reveal style={{ "--d": ".15s" } as React.CSSProperties}>
          <div className="lp-phone-scene" ref={sceneRef}>
            <div className="lp-phone" aria-hidden="true">
              <div className="lp-phone__screen">
                <span className="lp-phone__notch" />
                <div className="lp-phone__brand">
                  <Image src="/logo.png" alt="" width={48} height={38} />
                  <span>USA LATINO PRIME</span>
                </div>
                <div className="lp-phone__title">Tu trámite</div>
                <div className="lp-phone__progress">
                  <span />
                </div>
                <div className="lp-phone__row">{Ico.check} Formulario validado</div>
                <div className="lp-phone__row">{Ico.check} Documentos completos</div>
                <div className="lp-phone__row">{Ico.clock} Siguiente paso: revisión</div>
                <div className="lp-phone__doc">
                  <span>
                    EXPEDIENTE · <b>EN PROGRESO</b>
                  </span>
                  <span>PASO 3 DE 5 COMPLETADO</span>
                </div>
              </div>
            </div>

            <span className="lp-notif lp-notif--1" style={{ "--nd": "0s" } as React.CSSProperties}>
              {Ico.whatsapp} Mensaje de tu asesor
            </span>
            <span className="lp-notif lp-notif--gold lp-notif--2" style={{ "--nd": "1.6s" } as React.CSSProperties}>
              {Ico.bolt} Tu caso avanzó de etapa
            </span>
            <span className="lp-notif lp-notif--gold lp-notif--3" style={{ "--nd": "3.1s" } as React.CSSProperties}>
              {Ico.check} Documento validado
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
