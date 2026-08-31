/* ============================================================
   LP — CÓMO FUNCIONA: la ruta en 3 pasos (secuencia real del
   producto) + la cita de la marca.
   ============================================================ */

const STEPS = [
  {
    t: "Responde y descubre si calificas",
    d: "Eliges tu trámite, ves un video corto y contestas unas preguntas simples desde tu celular.",
  },
  {
    t: "Llena tu caso guiado",
    d: "Completas tu información paso a paso, sin lenguaje complicado, y el sistema valida todo para que no se vaya con errores.",
  },
  {
    t: "Nuestro equipo te acompaña",
    d: "Estamos a tu lado en los momentos que importan, hasta que tu expediente queda completo.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="lp-how lp-section">
      <div className="lp-wrap">
        <div className="lp-section__head" data-reveal>
          <span className="lp-eyebrow lp-eyebrow--gold">Cómo funciona</span>
          <h2>
            Lleva tu propio caso <em>en tres pasos</em>
          </h2>
        </div>

        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <div
              className="lp-step"
              key={s.t}
              data-reveal
              style={{ "--d": `${i * 0.14}s` } as React.CSSProperties}
            >
              <span className="lp-step__n">0{i + 1}</span>
              <span className="lp-step__body">
                <span className="lp-step__t">{s.t}</span>
                <span className="lp-step__d">{s.d}</span>
              </span>
            </div>
          ))}
        </div>

        <blockquote className="lp-quote" data-reveal>
          <p>“Hazlo tú mismo. Pero con la tecnología y el respaldo correcto detrás.”</p>
          <footer>USA Latino Prime</footer>
        </blockquote>
      </div>
    </section>
  );
}
