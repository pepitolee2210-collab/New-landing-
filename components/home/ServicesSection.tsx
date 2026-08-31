/* ============================================================
   LP — SERVICIOS: fólders de expediente
   Cada fólder es el link a la URL propia del servicio (ads).
   La pestaña muestra el slug real; el sello aparece al hover.
   ============================================================ */
import Link from "next/link";
import { SERVICES } from "@/lib/services";
import { Ico, SvgIcon } from "../icons";

export default function ServicesSection() {
  return (
    <section id="servicios" className="lp-paper lp-section">
      <div className="lp-wrap">
        <div className="lp-section__head" data-reveal>
          <span className="lp-eyebrow lp-eyebrow--ink">Servicios</span>
          <h2>
            Elige tu trámite y descubre <em>si calificas</em>
          </h2>
          <p>
            Cubrimos los procesos migratorios y fiscales más importantes — desde la primera
            petición hasta tu Green Card — todo desde una sola plataforma.
          </p>
        </div>

        <div className="lp-folders">
          {SERVICES.map((s, i) => (
            <Link
              key={s.id}
              href={`/${s.slug}`}
              className="lp-folder"
              data-reveal
              style={{ "--d": `${(i % 3) * 0.09}s` } as React.CSSProperties}
            >
              <span className="lp-folder__tab">/{s.slug}</span>
              <span className="lp-folder__body">
                <span className="lp-folder__icon">
                  <SvgIcon name={s.icon} />
                </span>
                <span className="lp-folder__main">
                  <span className="lp-folder__tag">{s.tagline}</span>
                  <span className="lp-folder__name">{s.name}</span>
                  <span className="lp-folder__desc">{s.desc}</span>
                </span>
                <span className="lp-folder__cta">
                  <span className="lp-folder__cta-txt">Calificar ahora</span> {Ico.arrow}
                </span>
                <span className="lp-folder__seal" aria-hidden="true">
                  ★
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
