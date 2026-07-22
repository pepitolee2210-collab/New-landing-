/* ============================================================
   UsaLatinoPrime — Componentes UI
   ============================================================ */
const { useState, useEffect, useRef } = React;

/* ---- small inline icons ---- */
const Ico = {
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4 10-11"/></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  arrowL: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>,
  play: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>,
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>,
  whatsapp: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M.06 24l1.69-6.16a11.87 11.87 0 1 1 4.3 4.3zm6.6-3.8c1.55.92 2.7 1.47 4.85 1.47a9.87 9.87 0 1 0-8.36-4.6l.25.4-1 3.65 3.76-.98z"/><path d="M9.5 7.3c-.2-.45-.4-.46-.6-.47h-.5a1 1 0 0 0-.72.34A2.9 2.9 0 0 0 6.8 9.3c0 1.27.92 2.5 1.05 2.67.13.18 1.8 2.86 4.43 3.9 2.18.86 2.62.69 3.1.64.47-.04 1.5-.6 1.72-1.2.2-.58.2-1.08.15-1.18-.06-.1-.23-.16-.5-.3-.25-.13-1.5-.74-1.74-.82-.24-.1-.4-.13-.58.13-.17.26-.66.82-.8 1-.16.17-.3.2-.56.06a7.2 7.2 0 0 1-2.1-1.3 7.9 7.9 0 0 1-1.45-1.8c-.15-.27 0-.4.12-.54.12-.12.26-.3.4-.46.12-.16.16-.27.24-.45.08-.18.04-.34-.02-.47-.06-.13-.55-1.36-.77-1.85z"/></svg>,
  spark: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>,
  device: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/></svg>,
  lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>,
  bolt: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>,
};

function SvgIcon({ name, className }) {
  const html = window.ULP.ICONS[name] || '';
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ============================================================
   PROGRESS RAIL
   ============================================================ */
function Progress({ steps, current }) {
  return (
    <div className="progress">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={"progress__step" + (i === current ? " progress__step--active" : "")}>
            <div className={"progress__dot" + (i < current ? " progress__dot--done" : i === current ? " progress__dot--active" : "")}>
              {i < current ? Ico.check : i + 1}
            </div>
            <span className="progress__label">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={"progress__line" + (i < current ? " progress__line--filled" : "")}><span /></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ============================================================
   STEP 1 — QUIÉNES SOMOS
   ============================================================ */
function HeroSlide({ t }) {
  return (
    <div className="hero slide-anim">
      <div className="hero__left">
        <span className="slide-tag hero__kicker">Quiénes somos</span>
        <h1 dangerouslySetInnerHTML={{ __html: t.heroTitle }} />
        <p className="hero__lead">{t.heroLead}</p>
        <blockquote className="hero__quote">“Hazlo tú mismo. Pero con la tecnología y el respaldo correcto detrás.”</blockquote>
        <div className="hero__pills">
          <span className="pill">{Ico.device} Desde tu celular</span>
          <span className="pill">{Ico.lock} Validación automática</span>
          <span className="pill">{Ico.bolt} Acompañamiento humano</span>
        </div>
      </div>
      <div className="hero__right">
        <div className="hero__stat">
          <div className="hero__stat-num"><span>1/10</span> del costo</div>
          <div className="hero__stat-label">de lo que cobra un servicio tradicional, sin honorarios de miles de dólares.</div>
        </div>
        <div className="hero__divider" />
        <div className="hero__stat">
          <div className="hero__stat-num">100% <span>guiado</span></div>
          <div className="hero__stat-label">Llenas tu caso paso a paso y el sistema valida todo para que no se vaya con errores.</div>
        </div>
        <div className="hero__divider" />
        <div className="hero__stat">
          <div className="hero__stat-num">Equipo <span>legal</span></div>
          <div className="hero__stat-label">Plataforma desarrollada por profesionales legales, a tu lado en los momentos clave.</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STEP 2 — SERVICIOS
   ============================================================ */
function ServicesSlide({ services, onPick, selected }) {
  return (
    <div className="services slide-anim">
      <div className="services__head">
        <span className="slide-tag">Servicios</span>
        <h2>Elige tu trámite y descubre si calificas</h2>
        <p>Cubrimos los procesos migratorios y fiscales más importantes — desde la primera petición hasta tu Green Card — todo desde una sola plataforma.</p>
      </div>
      <div className="services__grid">
        {services.map((s) => (
          <button key={s.id}
            className="svc-card"
            style={selected === s.id ? { borderColor: "var(--primary)", boxShadow: "var(--card-shadow)" } : null}
            onClick={() => onPick(s.id)}>
            <span className="svc-card__icon"><SvgIcon name={s.icon} /></span>
            <span className="svc-card__tag">{s.tagline}</span>
            <span className="svc-card__name">{s.name}</span>
            <span className="svc-card__desc">{s.desc}</span>
            <span className="svc-card__cta">{selected === s.id ? "Seleccionado" : "Calificar ahora"} {Ico.arrow}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   STEP 3 — VIDEO
   ============================================================ */
function VideoSlide({ t, service }) {
  const hasVideo = t.videoUrl && t.videoUrl.trim().length > 0;
  return (
    <div className="video slide-anim">
      <div className="video__copy">
        <span className="slide-tag">Cómo funciona</span>
        <h2>Mira cómo llevas tu propio caso en minutos</h2>
        <p>{service ? `Antes de calificar para ${service.name}, te mostramos lo simple que es usar la plataforma.` : "Te mostramos lo simple que es llevar tu trámite desde el celular, paso a paso."}</p>
        <div className="video__points">
          <div className="video__point">{Ico.check} Llenas tu información guiado, sin lenguaje complicado.</div>
          <div className="video__point">{Ico.check} El sistema valida todo para que no se vaya con errores.</div>
          <div className="video__point">{Ico.check} Nuestro equipo te acompaña en los momentos que importan.</div>
        </div>
      </div>
      <div className="video__frame">
        {hasVideo ? (
          <video src={t.videoUrl} controls poster={t.videoPoster || undefined} />
        ) : (
          <div className="video__placeholder">
            <div className="video__play">{Ico.play}</div>
            <div className="video__ph-title">Tu video va aquí</div>
            <small>Sube tu archivo de video y lo coloco en este marco. Por ahora es un espacio reservado.</small>
          </div>
        )}
      </div>
    </div>
  );
}

window.ULPC = { Ico, SvgIcon, Progress, HeroSlide, ServicesSlide, VideoSlide };
