"use client";

/* ============================================================
   STEP 3 — VIDEO (reproducción obligatoria)
   - Autoplay al activarse el paso (tras elegir servicio).
   - Sin controles: no se puede pausar ni saltar.
   - Si el navegador bloquea el audio, arranca silenciado y muestra
     un botón "Activar sonido" (un toque del usuario).
   - Al terminar (onEnded) la app avanza automáticamente.
   ============================================================ */
import { useEffect, useRef, useState } from "react";
import { VIDEO_POSTER, VIDEO_URL } from "@/lib/config";
import type { Service } from "@/lib/types";
import { Ico } from "./icons";

interface VideoSlideProps {
  service: Service | null;
  /** true cuando este paso es el visible actualmente. */
  isActive: boolean;
  /** se llama cuando el video termina. */
  onEnded: () => void;
}

export default function VideoSlide({ service, isActive, onEnded }: VideoSlideProps) {
  const videoSrc = service?.video ?? VIDEO_URL;
  const ref = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [needsSound, setNeedsSound] = useState(false); // reproduciendo en silencio
  const [needsTap, setNeedsTap] = useState(false); // autoplay totalmente bloqueado
  const [progress, setProgress] = useState(0);

  const hasVideo = videoSrc.trim().length > 0 && !failed;

  // Reinicia el estado de error cuando cambia el video (otro servicio).
  useEffect(() => {
    setFailed(false);
  }, [videoSrc]);

  // Reproducción forzada cuando el paso está activo.
  useEffect(() => {
    const v = ref.current;
    if (!v || !hasVideo) return;

    if (!isActive) {
      v.pause();
      return;
    }

    setNeedsTap(false);
    setProgress(0);
    try {
      v.currentTime = 0;
    } catch {
      /* algunos navegadores aún no permiten seek: se ignora */
    }

    // 1) intenta con sonido (hay gesto del usuario al elegir el servicio)
    v.muted = false;
    const attempt = v.play();
    if (attempt && typeof attempt.then === "function") {
      attempt
        .then(() => setNeedsSound(false))
        .catch(() => {
          // 2) reintenta silenciado (el autoplay muteado casi siempre se permite)
          v.muted = true;
          setNeedsSound(true);
          v.play().catch(() => {
            // 3) ni silenciado: pide un toque
            setNeedsSound(false);
            setNeedsTap(true);
          });
        });
    }
  }, [isActive, videoSrc, hasVideo]);

  // No se puede pausar: si pausan y el paso sigue activo, reanuda.
  function handlePause() {
    const v = ref.current;
    if (v && isActive && !v.ended) {
      void v.play().catch(() => {});
    }
  }

  function enableSound() {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    setNeedsSound(false);
    void v.play().catch(() => {});
  }

  function startWithSound() {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    setNeedsTap(false);
    void v
      .play()
      .then(() => setNeedsSound(false))
      .catch(() => {});
  }

  return (
    <div className="video slide-anim">
      <div className="video__copy">
        <span className="slide-tag">Cómo funciona</span>
        <h2>Mira cómo llevas tu propio caso en minutos</h2>
        <p>
          {service
            ? `Antes de calificar para ${service.name}, mira este video. Continúas automáticamente al terminar.`
            : "Te mostramos lo simple que es llevar tu trámite desde el celular, paso a paso."}
        </p>
        <div className="video__points">
          <div className="video__point">{Ico.check} Llenas tu información guiado, sin lenguaje complicado.</div>
          <div className="video__point">{Ico.check} El sistema valida todo para que no se vaya con errores.</div>
          <div className="video__point">{Ico.check} Nuestro equipo te acompaña en los momentos que importan.</div>
        </div>
      </div>

      <div className="video__frame">
        {hasVideo ? (
          <>
            <video
              ref={ref}
              key={videoSrc}
              src={videoSrc}
              playsInline
              preload="auto"
              poster={VIDEO_POSTER || undefined}
              disablePictureInPicture
              controlsList="nodownload noplaybackrate nofullscreen"
              onContextMenu={(e) => e.preventDefault()}
              onEnded={onEnded}
              onPause={handlePause}
              onTimeUpdate={(e) => {
                const el = e.currentTarget;
                if (el.duration) setProgress((el.currentTime / el.duration) * 100);
              }}
              onError={() => setFailed(true)}
            />

            {/* Barra de progreso (no interactiva) */}
            <div className="video__progress" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>

            {/* Activar sonido cuando arranca silenciado */}
            {needsSound && (
              <button type="button" className="video__sound" onClick={enableSound}>
                {Ico.volume} Toca para activar el sonido
              </button>
            )}

            {/* Fallback: autoplay bloqueado, requiere un toque */}
            {needsTap && (
              <button type="button" className="video__tap" onClick={startWithSound}>
                <span className="video__play">{Ico.play}</span>
                Reproducir video
              </button>
            )}
          </>
        ) : (
          <div className="video__placeholder">
            <div className="video__play">{Ico.play}</div>
            <div className="video__ph-title">Tu video va aquí</div>
            <small>
              Sube tu archivo a <code>/public/videos/</code> y aparecerá en este marco.
              Por ahora es un espacio reservado.
            </small>
          </div>
        )}
      </div>
    </div>
  );
}
