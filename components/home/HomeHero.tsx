/* ============================================================
   LP — HERO "la portada del pasaporte"
   Titular serif por líneas + estela de la estrella + sellos de
   confianza + franja de stats. Contenido real de la marca.
   ============================================================ */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Ico } from "../icons";
import WhatsAppLink from "../WhatsAppLink";
import StarTrail from "./StarTrail";

const PROOF_AVATARS = ["/testimonios/1.jpeg", "/testimonios/4.jpeg", "/testimonios/5.jpeg"];

function ProofChip({ inline = false }: { inline?: boolean }) {
  return (
    <div className={"lp-hero__proof" + (inline ? " lp-hero__proof--inline" : "")}>
      <span className="lp-hero__proof-ava">
        {PROOF_AVATARS.map((src) => (
          <img key={src} src={src} alt="" loading="lazy" />
        ))}
      </span>
      <span className="lp-hero__proof-txt">
        <strong>+500 familias</strong>
        ya confiaron en UsaLatinoPrime
      </span>
    </div>
  );
}

export default function HomeHero() {
  return (
    <section className="lp-hero" id="inicio">
      <div className="lp-wrap lp-hero__grid">
        <div className="lp-hero__copy">
          <span className="lp-eyebrow lp-eyebrow--gold">Plataforma digital de inmigración</span>

          <h1 className="lp-hero__title" aria-label="Tu trámite migratorio, en tus manos">
            <span className="lp-hero__line">
              <span>Tu trámite migratorio,</span>
            </span>
            <span className="lp-hero__line">
              <span>
                <em>en tus manos</em>
              </span>
            </span>
          </h1>

          <p className="lp-hero__lead">
            UsaLatinoPrime no es un servicio tradicional: llevas tu propio caso desde el celular,
            guiado paso a paso, con validación automática y nuestro equipo a tu lado en los
            momentos clave.
          </p>

          <div className="lp-hero__cta">
            <Link className="lp-btn lp-btn--gold" href="/#servicios">
              Ver nuestros servicios {Ico.arrow}
            </Link>
            <WhatsAppLink
              className="lp-btn lp-btn--line"
              message="Hola, quiero información sobre sus servicios migratorios."
            >
              {Ico.whatsapp} Escríbenos
            </WhatsAppLink>
          </div>

          <div className="lp-hero__stamps" aria-label="Garantías de la plataforma">
            <span className="lp-stamp" style={{ "--tilt": "-1.2deg" } as React.CSSProperties}>
              {Ico.device} Desde tu celular
            </span>
            <span className="lp-stamp" style={{ "--tilt": "0.8deg" } as React.CSSProperties}>
              {Ico.lock} Validación automática
            </span>
            <span className="lp-stamp" style={{ "--tilt": "-0.6deg" } as React.CSSProperties}>
              {Ico.bolt} Acompañamiento humano
            </span>
          </div>

          {/* En móvil la prueba social entra en el flujo, bajo los sellos */}
          <ProofChip inline />
        </div>

        <div className="lp-hero__visual" aria-hidden="true">
          <StarTrail />
          <ProofChip />
        </div>
      </div>

      {/* Franja de stats (contenido actual de la marca) */}
      <div className="lp-hero__stats">
        <div className="lp-wrap lp-stats">
          <div className="lp-stat" data-reveal>
            <span className="lp-stat__num">
              1/10 <small>del costo</small>
            </span>
            <span className="lp-stat__label">
              de lo que cobra un servicio tradicional, sin honorarios de miles de dólares.
            </span>
          </div>
          <div className="lp-stat" data-reveal style={{ "--d": ".12s" } as React.CSSProperties}>
            <span className="lp-stat__num">
              <span data-count-to="100" data-count-suffix="%">
                100%
              </span>{" "}
              <small>guiado</small>
            </span>
            <span className="lp-stat__label">
              Llenas tu caso paso a paso y el sistema valida todo para que no se vaya con errores.
            </span>
          </div>
          <div className="lp-stat" data-reveal style={{ "--d": ".24s" } as React.CSSProperties}>
            <span className="lp-stat__num">
              Tecnología <small>de punta</small>
            </span>
            <span className="lp-stat__label">
              Termina tu expediente mucho más rápido de lo que lo haría un servicio tradicional.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
