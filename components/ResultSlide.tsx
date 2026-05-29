/* ============================================================
   STEP 5 — RESULTADO
   ============================================================ */
import { waLink } from "@/lib/config";
import type { ResultData, Service } from "@/lib/types";
import Confetti from "./Confetti";
import { Ico, SvgIcon } from "./icons";

interface ResultSlideProps {
  service: Service;
  result: ResultData;
  onRestart: () => void;
}

export default function ResultSlide({ service, result, onRestart }: ResultSlideProps) {
  const tone = result.tone; // success | urgent | contact
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
      <a className="btn btn--wa" href={waLink(message)} target="_blank" rel="noopener noreferrer">
        {Ico.whatsapp} {isWin ? "Agendar por WhatsApp" : "Escribirnos por WhatsApp"}
      </a>
      <button type="button" className="btn btn--ghost" onClick={onRestart}>
        Empezar de nuevo
      </button>
    </div>
  );
}
