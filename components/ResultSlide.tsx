"use client";

/* ============================================================
   STEP 5 — RESULTADO
   tones: success | urgent (califican) · contact (revisión) · denied (no califica)
   ============================================================ */
import { useEffect, useRef } from "react";
import { waLink } from "@/lib/config";
import type { ResultData, Service } from "@/lib/types";
import { newEventId, trackBrowser, trackLeadDeduped } from "@/lib/meta/pixel-client";
import Confetti from "./Confetti";
import SocialProof from "./SocialProof";
import { Ico, SvgIcon } from "./icons";

interface ResultSlideProps {
  service: Service;
  result: ResultData;
  /** true cuando el resultado es el paso visible. */
  isActive: boolean;
  onRestart: () => void;
  /** vuelve a la lista de servicios (usado tras un "no califica"). */
  onTryOthers: () => void;
}

/** Tiempo antes de llevar automáticamente al usuario a otros servicios. */
const DENIED_REDIRECT_MS = 8000;

export default function ResultSlide({ service, result, isActive, onRestart, onTryOthers }: ResultSlideProps) {
  const tone = result.tone;

  // "No califica": redirección automática a otros servicios (solo cuando es visible).
  useEffect(() => {
    if (tone !== "denied" || !isActive) return;
    const id = setTimeout(onTryOthers, DENIED_REDIRECT_MS);
    return () => clearTimeout(id);
  }, [tone, isActive, onTryOthers]);

  // Id de evento estable por vista de resultado (deduplicación Pixel ↔ CAPI).
  const eventIdRef = useRef<string>("");
  if (!eventIdRef.current) eventIdRef.current = newEventId();
  const leadFiredRef = useRef(false);

  // Señal de embudo: el usuario llegó a un resultado que califica.
  const evalFiredRef = useRef(false);
  useEffect(() => {
    if (!isActive || evalFiredRef.current) return;
    const win = tone === "success" || tone === "urgent";
    if (!win) return;
    evalFiredRef.current = true;
    trackBrowser("EvaluationCompleted", {
      content_name: service.name,
      status: tone,
    });
  }, [isActive, tone, service]);

  // Conversión clave: clic al CTA de WhatsApp → Lead (Pixel + CAPI deduplicado).
  // El <a target="_blank"> deja viva la pestaña, así que NO hace falta
  // preventDefault ni delay; el guard evita doble disparo por doble-clic.
  function onWhatsAppClick() {
    if (leadFiredRef.current) return;
    leadFiredRef.current = true;
    trackLeadDeduped(eventIdRef.current, {
      content_name: service.name,
      content_ids: [service.id],
    });
  }

  // ---- Caso especial: NO CALIFICA ----
  if (tone === "denied") {
    return (
      <div className="result result--denied slide-anim">
        <div className="result__badge">{Ico.heart}</div>
        <h2>Gracias por tu confianza</h2>
        <p className="result__sub">{result.message}</p>
        <div className="result__svc">
          <SvgIcon name={service.icon} /> {service.name}
        </div>
        <p className="result__msg">
          ¡No te desanimes! Tenemos muchos otros servicios que podrían ser justo lo que necesitas.
        </p>
        <button type="button" className="btn btn--primary" onClick={onTryOthers}>
          {Ico.compass} Ver otros servicios
        </button>
        <div className="result__countdown" aria-hidden="true">
          <span />
        </div>
        <p className="result__redirect">Te llevamos a otros servicios en unos segundos…</p>
      </div>
    );
  }

  // ---- Califican / revisión ----
  const isWin = tone === "success" || tone === "urgent";

  const headline = tone === "success" ? "¡Felicidades!" : tone === "urgent" ? "Tu caso es urgente" : "Conversemos";
  const subhead =
    tone === "success"
      ? "Te ganaste una evaluación gratuita con un asesor"
      : tone === "urgent"
        ? "Estás en el momento crítico — actúa ahora"
        : "Cuéntanos tu caso y te ayudamos sin costo";

  const badgeIcon = tone === "contact" ? Ico.alert : tone === "urgent" ? Ico.clock : Ico.check;

  const message =
    `Hola UsaLatinoPrime 👋 Acabo de calificar en su página para el servicio: ${service.name}. ` +
    (isWin
      ? "Quiero agendar mi evaluación gratuita con un asesor."
      : "Quiero más información sobre mi caso.");

  return (
    <div className={"result slide-anim result--" + tone}>
      <Confetti go={isWin} />
      <div className="result__badge">{badgeIcon}</div>
      {tone === "success" && <span className="slide-tag result__win">Calificaste</span>}
      <h2>{headline}</h2>
      <p className="result__sub">{subhead}</p>
      <div className="result__svc">
        <SvgIcon name={service.icon} /> {service.name}
      </div>
      <p className="result__msg">{result.message}</p>
      {isWin && <SocialProof />}
      <a
        className="btn btn--wa"
        href={waLink(message, service.whatsappDigits)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onWhatsAppClick}
      >
        {Ico.whatsapp} {isWin ? "Agendar por WhatsApp" : "Escribirnos por WhatsApp"}
      </a>
      <button type="button" className="btn btn--ghost" onClick={onRestart}>
        Empezar de nuevo
      </button>
    </div>
  );
}
