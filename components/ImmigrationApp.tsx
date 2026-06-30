"use client";

/* ============================================================
   UsaLatinoPrime — App principal (stepper horizontal)
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { PHASES, WHATSAPP_DIGITS, WHATSAPP_DISPLAY } from "@/lib/config";
import { SERVICES } from "@/lib/services";
import type { Answers, Question } from "@/lib/types";
import { CONTENT_CATEGORY } from "@/lib/meta/events";
import { trackBrowser } from "@/lib/meta/pixel-client";
import { Ico } from "./icons";
import Progress from "./Progress";
import HeroSlide from "./HeroSlide";
import ServicesSlide from "./ServicesSlide";
import VideoSlide from "./VideoSlide";
import QuizSlide from "./QuizSlide";
import ResultSlide from "./ResultSlide";

type Slide =
  | { type: "hero"; phase: number }
  | { type: "services"; phase: number }
  | { type: "video"; phase: number }
  | { type: "quiz"; phase: number; q: Question; qi: number }
  | { type: "result"; phase: number };

export default function ImmigrationApp() {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [idx, setIdx] = useState(0);
  const [videoDone, setVideoDone] = useState(false);
  const stageRef = useRef<HTMLElement | null>(null);

  const service = useMemo(() => SERVICES.find((s) => s.id === serviceId) ?? null, [serviceId]);

  // Lista de slides (depende del servicio elegido).
  const slides = useMemo<Slide[]>(() => {
    const base: Slide[] = [
      { type: "hero", phase: 0 },
      { type: "services", phase: 1 },
      { type: "video", phase: 2 },
    ];
    if (!service) return base;
    const qs: Slide[] = service.questions.map((q, i) => ({ type: "quiz", phase: 3, q, qi: i }));
    return [...base, ...qs, { type: "result", phase: 4 }];
  }, [service]);

  const safeIdx = Math.min(idx, slides.length - 1);
  const cur = slides[safeIdx];

  const result = useMemo(
    () => (service ? service.evaluate(answers, service) : null),
    [service, answers],
  );

  // Reglas de navegación.
  const canNext = useCallback((): boolean => {
    if (!cur) return false;
    if (cur.type === "services") return !!service;
    if (cur.type === "video") return videoDone; // obligatorio ver el video completo
    if (cur.type === "quiz") {
      if (cur.q.kind === "checklist") return true; // checklist es opcional-completo
      const a = answers[cur.q.id];
      return a !== undefined && a !== null;
    }
    if (cur.type === "result") return false;
    return true;
  }, [cur, service, answers, videoDone]);

  const isLastBeforeResult = cur?.type === "quiz" && safeIdx === slides.length - 2;

  const go = useCallback(
    (n: number) => setIdx(Math.max(0, Math.min(n, slides.length - 1))),
    [slides.length],
  );
  const next = useCallback(() => {
    if (canNext()) go(safeIdx + 1);
  }, [canNext, go, safeIdx]);
  const prev = useCallback(() => go(safeIdx - 1), [go, safeIdx]);

  function pickService(id: string) {
    setServiceId(id);
    setAnswers({});
    setVideoDone(false); // hay que volver a ver el video del nuevo servicio
    // Señal de embudo: el usuario eligió un servicio.
    const picked = SERVICES.find((s) => s.id === id);
    if (picked) {
      trackBrowser("ViewContent", {
        content_ids: [picked.id],
        content_name: picked.name,
        content_category: CONTENT_CATEGORY,
      });
    }
    // avanza al video tras una breve pausa para que se note la selección
    setTimeout(() => setIdx(2), 260);
  }

  // El video terminó: se desbloquea y avanza a la primera pregunta.
  const handleVideoEnded = useCallback(() => {
    setVideoDone(true);
    if (service) trackBrowser("VideoCompleted", { content_name: service.name });
    setIdx((i) => Math.min(i + 1, slides.length - 1));
  }, [slides.length, service]);

  function answer(qid: string, val: string | string[], kind: Question["kind"]) {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
    if (kind !== "checklist") {
      setTimeout(() => setIdx((i) => Math.min(i + 1, slides.length - 1)), 320);
    }
  }

  function restart() {
    setServiceId(null);
    setAnswers({});
    setVideoDone(false);
    setIdx(0);
  }

  // Tras un "no califica": vuelve a la lista de servicios para elegir otro.
  const goToServices = useCallback(() => {
    setServiceId(null);
    setAnswers({});
    setVideoDone(false);
    setIdx(1);
  }, []);

  // Navegación con teclado.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && canNext()) next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [canNext, next, prev]);

  // Al cambiar de slide, vuelve arriba (clave en móvil, donde el contenido scrollea).
  useEffect(() => {
    stageRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [safeIdx]);

  const nextLabel = isLastBeforeResult ? "Ver resultado" : "Continuar";

  return (
    <div className="app">
      {/* Top bar */}
      <header className="topbar">
        <Image
          className="topbar__logo"
          src="/logo.png"
          alt="USA Latino Prime"
          width={59}
          height={46}
          priority
          style={{ width: "auto" }}
        />
        <div className="topbar__right">
          <a
            className="topbar__phone"
            href={`https://wa.me/${WHATSAPP_DIGITS}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackBrowser("Contact")}
          >
            {Ico.whatsapp}
            <span>{WHATSAPP_DISPLAY}</span>
          </a>
        </div>
      </header>

      {/* Progreso */}
      <Progress steps={PHASES.map((label) => ({ label }))} current={cur ? cur.phase : 0} />

      {/* Stage */}
      <main className="stage" ref={stageRef}>
        <div className="stage__viewport">
          <div className="stage__track" style={{ transform: `translateX(-${safeIdx * 100}%)` }}>
            {slides.map((sl, i) => (
              <section
                className="slide"
                key={i}
                data-screen-label={PHASES[sl.phase]}
                aria-hidden={i !== safeIdx}
              >
                <div className="slide__inner">
                  {sl.type === "hero" && <HeroSlide />}
                  {sl.type === "services" && (
                    <ServicesSlide services={SERVICES} onPick={pickService} selected={serviceId} />
                  )}
                  {sl.type === "video" && (
                    <VideoSlide
                      service={service}
                      isActive={cur?.type === "video"}
                      onEnded={handleVideoEnded}
                    />
                  )}
                  {sl.type === "quiz" && service && (
                    <QuizSlide
                      service={service}
                      question={sl.q}
                      qIndex={sl.qi}
                      qTotal={service.questions.length}
                      answer={answers[sl.q.id]}
                      onAnswer={(v) => answer(sl.q.id, v, sl.q.kind)}
                    />
                  )}
                  {sl.type === "result" && service && result && (
                    <ResultSlide
                      service={service}
                      result={result}
                      isActive={cur?.type === "result"}
                      onRestart={restart}
                      onTryOthers={goToServices}
                    />
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      {/* Navegación inferior */}
      {cur && cur.type !== "result" && (
        <nav className="navbar">
          {safeIdx > 0 ? (
            <button type="button" className="btn btn--ghost" onClick={prev}>
              {Ico.arrowL} <span className="navbar__back-label">Atrás</span>
            </button>
          ) : (
            <span />
          )}
          <span className="navbar__hint">
            {cur.type === "services" && !service
              ? "Selecciona un servicio para continuar"
              : cur.type === "video"
                ? "Mira el video para continuar"
                : cur.type === "quiz" && cur.q.kind === "checklist"
                  ? "Marca lo que tengas y continúa"
                  : cur.type === "quiz"
                    ? "Elige una respuesta"
                    : "Paso " + (safeIdx + 1) + " de " + slides.length}
          </span>
          <button type="button" className="btn btn--primary" onClick={next} disabled={!canNext()}>
            {nextLabel} {Ico.arrow}
          </button>
        </nav>
      )}
    </div>
  );
}
