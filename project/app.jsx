/* ============================================================
   UsaLatinoPrime — App principal (stepper horizontal)
   ============================================================ */
const { useState: useS, useEffect: useE, useRef: useR } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "style": "clasico",
  "accent": "#c8901f",
  "whatsapp": "+1 555 000 0000",
  "videoUrl": "",
  "videoPoster": "",
  "heroTitle": "Tu trámite migratorio, <em>en tus manos</em>",
  "heroLead": "UsaLatinoPrime es una plataforma digital de inmigración — no un servicio tradicional. Llevas tu propio caso desde el celular, guiado paso a paso, con validación automática y nuestro equipo a tu lado en los momentos clave."
}/*EDITMODE-END*/;

const STYLE_OPTIONS = ["clasico", "institucional", "moderno"];
const STYLE_LABELS = { clasico: "Clásico", institucional: "Institucional", moderno: "Moderno" };
const ACCENT_OPTIONS = ["#c8901f", "#d8201f", "#1b4fa0", "#1e9e6a"];

const PHASES = ["Quiénes somos", "Servicios", "Video", "Preguntas", "Resultado"];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const { Progress, HeroSlide, ServicesSlide, VideoSlide, Ico } = window.ULPC;
  const { QuizSlide, ResultSlide } = window.ULPQ;
  const SERVICES = window.ULP.SERVICES;

  const [serviceId, setServiceId] = useS(null);
  const [answers, setAnswers] = useS({});
  const [idx, setIdx] = useS(0);

  const service = SERVICES.find((s) => s.id === serviceId) || null;

  // apply style + accent to <html>
  useE(() => {
    document.documentElement.setAttribute("data-style", t.style);
  }, [t.style]);
  useE(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
    // derive a soft tint from accent
    document.documentElement.style.setProperty("--accent-soft", t.accent + "22");
  }, [t.accent]);

  // build slide list
  const base = [
    { type: "hero", phase: 0 },
    { type: "services", phase: 1 },
    { type: "video", phase: 2 },
  ];
  let slides = base;
  if (service) {
    const qs = service.questions.map((q, i) => ({ type: "quiz", phase: 3, q, qi: i }));
    slides = [...base, ...qs, { type: "result", phase: 4 }];
  }
  const safeIdx = Math.min(idx, slides.length - 1);
  const cur = slides[safeIdx];

  // result
  const result = service ? service.evaluate(answers, service) : null;

  // navigation gates
  function canNext() {
    if (!cur) return false;
    if (cur.type === "services") return !!service;
    if (cur.type === "quiz") {
      const a = answers[cur.q.id];
      if (cur.q.kind === "checklist") return true; // checklist optional-complete
      return a !== undefined && a !== null;
    }
    if (cur.type === "result") return false;
    return true;
  }
  const isLastBeforeResult = cur && cur.type === "quiz" && safeIdx === slides.length - 2;

  function go(n) {
    const clamped = Math.max(0, Math.min(n, slides.length - 1));
    setIdx(clamped);
  }
  function next() { if (canNext()) go(safeIdx + 1); }
  function prev() { go(safeIdx - 1); }

  function pickService(id) {
    setServiceId(id);
    setAnswers({});
    // auto-advance to video shortly
    setTimeout(() => setIdx(2), 260);
  }

  function answer(qid, val, kind) {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
    if (kind !== "checklist") {
      setTimeout(() => setIdx((i) => Math.min(i + 1, slides.length - 1)), 320);
    }
  }

  function restart() {
    setServiceId(null);
    setAnswers({});
    setIdx(0);
  }

  // keyboard nav
  useE(() => {
    const h = (e) => {
      if (e.key === "ArrowRight" && canNext()) next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const nextLabel = isLastBeforeResult ? "Ver resultado" : cur && cur.type === "services" ? "Continuar" : "Continuar";

  return (
    <div className="app">
      {/* Top bar */}
      <header className="topbar">
        <img className="topbar__logo" src="assets/logo.png" alt="USA Latino Prime" />
        <div className="topbar__right">
          <a className="topbar__phone" href={`https://wa.me/${(t.whatsapp || "").replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
            {Ico.whatsapp}<span>{t.whatsapp}</span>
          </a>
        </div>
      </header>

      {/* Progress */}
      <Progress steps={PHASES.map((label) => ({ label }))} current={cur ? cur.phase : 0} />

      {/* Stage */}
      <main className="stage">
        <div className="stage__viewport">
          <div className="stage__track" style={{ transform: `translateX(-${safeIdx * 100}%)` }}>
            {slides.map((sl, i) => (
              <section className="slide" key={i} data-screen-label={PHASES[sl.phase]} aria-hidden={i !== safeIdx}>
                <div className="slide__inner">
                  {sl.type === "hero" && <HeroSlide t={t} />}
                  {sl.type === "services" && (
                    <ServicesSlide services={SERVICES} onPick={pickService} selected={serviceId} />
                  )}
                  {sl.type === "video" && <VideoSlide t={t} service={service} />}
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
                    <ResultSlide service={service} result={result} t={t} onRestart={restart} />
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      {/* Nav */}
      {cur && cur.type !== "result" && (
        <nav className="navbar">
          {safeIdx > 0 ? (
            <button className="btn btn--ghost" onClick={prev}>{Ico.arrowL} Atrás</button>
          ) : <span />}
          <span className="navbar__hint">
            {cur.type === "services" && !service ? "Selecciona un servicio para continuar" :
             cur.type === "quiz" && cur.q.kind === "checklist" ? "Marca lo que tengas y continúa" :
             cur.type === "quiz" ? "Elige una respuesta" : "Paso " + (safeIdx + 1) + " de " + slides.length}
          </span>
          <button className="btn btn--primary" onClick={next} disabled={!canNext()}>
            {nextLabel} {Ico.arrow}
          </button>
        </nav>
      )}

      {/* Tweaks */}
      <TweaksPanel>
        <TweakSection label="Estilo visual" />
        <TweakRadio label="Tema" value={t.style}
          options={STYLE_OPTIONS.map((s) => ({ value: s, label: STYLE_LABELS[s] }))}
          onChange={(v) => setTweak("style", v)} />
        <TweakColor label="Color de acento" value={t.accent} options={ACCENT_OPTIONS}
          onChange={(v) => setTweak("accent", v)} />

        <TweakSection label="Contacto" />
        <TweakText label="WhatsApp" value={t.whatsapp} onChange={(v) => setTweak("whatsapp", v)} />

        <TweakSection label="Contenido" />
        <TweakText label="Titular" value={t.heroTitle} onChange={(v) => setTweak("heroTitle", v)} />
        <TweakText label="Video (URL)" value={t.videoUrl} onChange={(v) => setTweak("videoUrl", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
