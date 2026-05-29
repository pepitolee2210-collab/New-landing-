/* ============================================================
   STEP 2 — SERVICIOS
   ============================================================ */
import type { Service } from "@/lib/types";
import { Ico, SvgIcon } from "./icons";

interface ServicesSlideProps {
  services: Service[];
  onPick: (id: string) => void;
  selected: string | null;
}

export default function ServicesSlide({ services, onPick, selected }: ServicesSlideProps) {
  return (
    <div className="services slide-anim">
      <div className="services__head">
        <span className="slide-tag">Servicios</span>
        <h2>Elige tu trámite y descubre si calificas</h2>
        <p>
          Cubrimos los procesos migratorios y fiscales más importantes — desde la primera petición
          hasta tu Green Card — todo desde una sola plataforma.
        </p>
      </div>
      <div className="services__grid">
        {services.map((s) => {
          const isSelected = selected === s.id;
          return (
            <button
              key={s.id}
              type="button"
              className={"svc-card" + (isSelected ? " svc-card--selected" : "")}
              aria-pressed={isSelected}
              onClick={() => onPick(s.id)}
            >
              <span className="svc-card__icon">
                <SvgIcon name={s.icon} />
              </span>
              <span className="svc-card__tag">{s.tagline}</span>
              <span className="svc-card__name">{s.name}</span>
              <span className="svc-card__desc">{s.desc}</span>
              <span className="svc-card__cta">
                {isSelected ? "Seleccionado" : "Calificar ahora"} {Ico.arrow}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
