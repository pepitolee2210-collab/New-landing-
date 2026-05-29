/* ============================================================
   UsaLatinoPrime — Preguntas (quiz) y Resultado
   ============================================================ */
const { useState: useStateQ, useEffect: useEffectQ } = React;

/* ---- one question card ---- */
function QuizSlide({ service, question, qIndex, qTotal, answer, onAnswer }) {
  const Ico = window.ULPC.Ico;

  function renderYesNo() {
    const opts = [
      { v: "si", label: "Sí", cls: "opt--yes" },
      { v: "no", label: "No", cls: "opt--no" },
    ];
    return (
      <div className="quiz__options">
        {opts.map((o) => (
          <button key={o.v}
            className={"opt " + o.cls + (answer === o.v ? " opt--selected" : "")}
            onClick={() => onAnswer(o.v)}>
            <span className="opt__mark">{Ico.check}</span>
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  function renderChoice() {
    return (
      <div className="quiz__options">
        {question.options.map((o) => (
          <button key={o.value}
            className={"opt" + (answer === o.value ? " opt--selected" : "")}
            onClick={() => onAnswer(o.value)}>
            <span className="opt__mark">{Ico.check}</span>
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  function renderChecklist() {
    const sel = Array.isArray(answer) ? answer : [];
    const toggle = (id) => {
      const next = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id];
      onAnswer(next);
    };
    return (
      <div className="checklist">
        {question.items.map((it) => (
          <button key={it.id}
            className={"check" + (sel.includes(it.id) ? " check--on" : "")}
            onClick={() => toggle(it.id)}>
            <span className="check__box">{Ico.check}</span>
            {it.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="quiz slide-anim">
      <div className="quiz__head">
        <span className="quiz__svc-icon"><window.ULPC.SvgIcon name={service.icon} /></span>
        <div>
          <div className="quiz__svc-name">{service.name}</div>
          <div className="quiz__count">Pregunta {qIndex + 1} de {qTotal}</div>
        </div>
      </div>
      <div className="quiz__body">
        <h3 className="quiz__q">{question.text}</h3>
        {question.kind === "yesno" && renderYesNo()}
        {question.kind === "choice" && renderChoice()}
        {question.kind === "checklist" && renderChecklist()}
      </div>
    </div>
  );
}

/* ---- confetti ---- */
function Confetti({ go }) {
  if (!go) return null;
  const colors = ["#1b4fa0", "#d99b2b", "#efc44d", "#d8201f", "#2563c4", "#1e9e6a"];
  const bits = Array.from({ length: 60 }).map((_, i) => {
    const st = {
      left: Math.random() * 100 + "%",
      background: colors[i % colors.length],
      animationDuration: (2.4 + Math.random() * 2) + "s",
      animationDelay: Math.random() * 0.6 + "s",
      transform: `rotate(${Math.random() * 360}deg)`,
      borderRadius: Math.random() > 0.6 ? "50%" : "1px",
    };
    return <i key={i} style={st} />;
  });
  return <div className="confetti">{bits}</div>;
}

/* ---- result ---- */
function ResultSlide({ service, result, t, onRestart }) {
  const Ico = window.ULPC.Ico;
  const tone = result.tone; // success | urgent | contact
  const isWin = tone === "success" || tone === "urgent";

  const headline = tone === "success"
    ? "¡Felicidades!"
    : tone === "urgent"
      ? "Tu caso es urgente"
      : "Conversemos";
  const subhead = tone === "success"
    ? "Te ganaste una evaluación gratuita con un asesor"
    : tone === "urgent"
      ? "Estás en el momento crítico — actúa ahora"
      : "Cuéntanos tu caso y te ayudamos sin costo";

  const badgeIcon = tone === "contact" ? Ico.alert : tone === "urgent" ? Ico.clock : Ico.check;

  const waMsg = encodeURIComponent(
    `Hola UsaLatinoPrime 👋 Acabo de calificar en su página para el servicio: ${service.name}. ${isWin ? "Quiero agendar mi evaluación gratuita con un asesor." : "Quiero más información sobre mi caso."}`
  );
  const waLink = `https://wa.me/${(t.whatsapp || "").replace(/[^0-9]/g, "")}?text=${waMsg}`;

  return (
    <div className={"result slide-anim result--" + tone}>
      <Confetti go={isWin} />
      <div className="result__badge">{badgeIcon}</div>
      {tone === "success" && <span className="slide-tag result__win">Calificaste</span>}
      <h2>{headline}</h2>
      <p className="result__sub">{subhead}</p>
      <div className="result__svc"><window.ULPC.SvgIcon name={service.icon} /> {service.name}</div>
      <p className="result__msg">{result.message}</p>
      <a className="btn btn--wa" href={waLink} target="_blank" rel="noopener noreferrer">
        {Ico.whatsapp} {isWin ? "Agendar por WhatsApp" : "Escribirnos por WhatsApp"}
      </a>
      <button className="btn btn--ghost" onClick={onRestart}>Empezar de nuevo</button>
    </div>
  );
}

window.ULPQ = { QuizSlide, ResultSlide };
