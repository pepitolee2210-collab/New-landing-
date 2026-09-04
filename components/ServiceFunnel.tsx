"use client";

/* ============================================================
   UsaLatinoPrime — Embudo de un servicio (página /slug)
   Cada servicio tiene su propia URL para campañas de Meta Ads.
   Recorrido: video (obligatorio) → preguntas → resultado.
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FUNNEL_PHASES } from "@/lib/config";
import { getServiceById } from "@/lib/services";
import type { Answers, Question } from "@/lib/types";
import { CONTENT_CATEGORY } from "@/lib/meta/events";
import { trackBrowser } from "@/lib/meta/pixel-client";
import { Ico } from "./icons";
import Progress from "./Progress";
import SiteHeader from "./SiteHeader";
import VideoSlide from "./VideoSlide";
import QuizSlide from "./QuizSlide";
import ResultSlide from "./ResultSlide";

type Slide =
  | { type: "video"; phase: number }
  | { type: "quiz"; phase: number; q: Question; qi: number }
  | { type: "result"; phase: number };

export default function ServiceFunnel({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const service = getServiceById(serviceId)!;

  const [answers, setAnswers] = useState<Answers>({});
  const [idx, setIdx] = useState(0);
  const [videoDone, setVideoDone] = useState(false);
  const stageRef = useRef<HTMLElement | null>(null);

  const slides = useMemo<Slide[]>(() => {
    const qs: Slide[] = service.questions.map((q, i) => ({ type: "quiz", phase: 1, q, qi: i }));
    return [{ type: "video", phase: 0 }, ...qs, { type: "result", phase: 2 }];
  }, [service]);

  const safeIdx = Math.min(idx, slides.length - 1);
  const cur = slides[safeIdx];

  const result = useMemo(() => service.evaluate(answers, service), [service, answers]);

  // Señal de embudo: el visitante aterrizó en la página del servicio
  // (equivale al antiguo "eligió un servicio", clave para los ads).
  const viewFiredRef = useRef(false);
  useEffect(() => {
    if (viewFiredRef.current) return;
    viewFiredRef.current = true;
    trackBrowser("ViewContent", {
      content_ids: [service.id],
      content_name: service.name,
      content_category: CONTENT_CATEGORY,
    });
  }, [service]);

  // Reglas de navegación.
  const canNext = useCallback((): boolean => {
    if (!cur) return false;
    if (cur.type === "video") return videoDone; // obligatorio ver el video completo
    if (cur.type === "quiz") {
      if (cur.q.kind === "checklist") return true; // checklist es opcional-completo
      const a = answers[cur.q.id];
      return a !== undefined && a !== null;
    }
    return false; // result: no hay "siguiente"
  }, [cur, answers, videoDone]);

  const isLastBeforeResult = cur?.type === "quiz" && safeIdx === slides.length - 2;

  const go = useCallback(
    (n: number) => setIdx(Math.max(0, Math.min(n, slides.length - 1))),
    [slides.length],
  );
  const next = useCallback(() => {
    if (canNext()) go(safeIdx + 1);
  }, [canNext, go, safeIdx]);
  const prev = useCallback(() => go(safeIdx - 1), [go, safeIdx]);

  // El video terminó: se desbloquea y avanza a la primera pregunta.
  const handleVideoEnded = useCallback(() => {
    setVideoDone(true);
    trackBrowser("VideoCompleted", { content_name: service.name });
    setIdx((i) => Math.min(i + 1, slides.length - 1));
  }, [slides.length, service]);

  function answer(qid: string, val: string | string[], kind: Question["kind"]) {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
    if (kind !== "checklist") {
      setTimeout(() => setIdx((i) => Math.min(i + 1, slides.length - 1)), 320);
    }
  }

  // Reinicia el embudo de ESTE servicio.
  function restart() {
    setAnswers({});
    setVideoDone(false);
    setIdx(0);
  }

  // "Ver otros servicios": a la sección de servicios de la home.
  const goToServices = useCallback(() => {
    router.push("/#servicios");
  }, [router]);

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
      <SiteHeader />

      {/* Progreso */}
      <Progress steps={FUNNEL_PHASES.map((label) => ({ label }))} current={cur ? cur.phase : 0} />

      {/* Stage */}
      <main className="stage" ref={stageRef}>
        <div className="stage__viewport">
          <div className="stage__track" style={{ transform: `translateX(-${safeIdx * 100}%)` }}>
            {slides.map((sl, i) => (
              <section
                className="slide"
                key={i}
                data-screen-label={FUNNEL_PHASES[sl.phase]}
                aria-hidden={i !== safeIdx}
              >
                <div className="slide__inner">
                  {sl.type === "video" && (
                    <VideoSlide
                      service={service}
                      isActive={cur?.type === "video"}
                      onEnded={handleVideoEnded}
                    />
                  )}
                  {sl.type === "quiz" && (
                    <QuizSlide
                      service={service}
                      question={sl.q}
                      qIndex={sl.qi}
                      qTotal={service.questions.length}
                      answer={answers[sl.q.id]}
                      onAnswer={(v) => answer(sl.q.id, v, sl.q.kind)}
                    />
                  )}
                  {sl.type === "result" && (
                    <ResultSlide
                      service={service}
                      result={result}
                      answers={answers}
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
            {cur.type === "video"
              ? "Mira el video para continuar"
              : cur.type === "quiz" && cur.q.kind === "checklist"
                ? "Marca lo que tengas y continúa"
                : "Elige una respuesta"}
          </span>
          <button type="button" className="btn btn--primary" onClick={next} disabled={!canNext()}>
            {nextLabel} {Ico.arrow}
          </button>
        </nav>
      )}
    </div>
  );
}
