/* ============================================================
   STEP 1 — QUIÉNES SOMOS
   ============================================================ */
import { HERO_LEAD, HERO_TITLE } from "@/lib/config";
import { Ico } from "./icons";

export default function HeroSlide() {
  return (
    <div className="hero slide-anim">
      <div className="hero__left">
        <span className="slide-tag hero__kicker">Quiénes somos</span>
        <h1 dangerouslySetInnerHTML={{ __html: HERO_TITLE }} />
        <p className="hero__lead">{HERO_LEAD}</p>
        <blockquote className="hero__quote">
          “Hazlo tú mismo. Pero con la tecnología y el respaldo correcto detrás.”
        </blockquote>
        <div className="hero__pills">
          <span className="pill">{Ico.device} Desde tu celular</span>
          <span className="pill">{Ico.lock} Validación automática</span>
          <span className="pill">{Ico.bolt} Acompañamiento humano</span>
        </div>
      </div>
      <div className="hero__right">
        <div className="hero__stat">
          <div className="hero__stat-num">
            <span>1/10</span> del costo
          </div>
          <div className="hero__stat-label">
            de lo que cobra un bufete tradicional, sin honorarios de miles de dólares.
          </div>
        </div>
        <div className="hero__divider" />
        <div className="hero__stat">
          <div className="hero__stat-num">
            100% <span>guiado</span>
          </div>
          <div className="hero__stat-label">
            Llenas tu caso paso a paso y el sistema valida todo para que no se vaya con errores.
          </div>
        </div>
        <div className="hero__divider" />
        <div className="hero__stat">
          <div className="hero__stat-num">
            Tecnología <span>de punta</span>
          </div>
          <div className="hero__stat-label">
            Nuestra tecnología de punta te permite terminar tu expediente mucho más rápido que lo haría un bufete tradicional.
          </div>
        </div>
      </div>
    </div>
  );
}
