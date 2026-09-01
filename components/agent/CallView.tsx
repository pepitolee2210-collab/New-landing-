"use client";

/* ============================================================
   Prime — modo LLAMADA (voz en tiempo real con la Live API)
   Flujo: pide un token efímero al servidor → abre la sesión Live
   desde el navegador → micrófono (PCM 16 kHz) ↔ voz de Prime (24 kHz).
   Soporta interrupciones (barge-in) y transcripción en vivo.
   ============================================================ */
import { useEffect, useRef, useState } from "react";
import { waLink } from "@/lib/config";
import { trackBrowser } from "@/lib/meta/pixel-client";
import { Ico } from "../icons";
import { INPUT_RATE, OUTPUT_RATE, base64ToFloat32, floatTo16BitPCM, int16ToBase64, rms } from "./audio";

type Status = "connecting" | "listening" | "speaking" | "unavailable" | "error" | "ended";

interface CallViewProps {
  /** Vuelve al chat; recibe la duración en segundos. */
  onExit: (seconds: number) => void;
}

interface LiveSessionLike {
  close: () => void;
  sendRealtimeInput: (p: { audio: { data: string; mimeType: string } }) => void;
}

const MicIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
const MicOffIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 3l18 18M9 9v2a3 3 0 0 0 5.1 2.1M15 10V6a3 3 0 0 0-6 0M5 11a7 7 0 0 0 11.6 5.3M19 11a7 7 0 0 1-.4 2.3M12 18v3" />
  </svg>
);
const ChatIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
  </svg>
);

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function CallView({ onExit }: CallViewProps) {
  const [status, setStatus] = useState<Status>("connecting");
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [userText, setUserText] = useState("");
  const [modelText, setModelText] = useState("");

  const mutedRef = useRef(false);
  const secondsRef = useRef(0);
  const sessionRef = useRef<LiveSessionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxInRef = useRef<AudioContext | null>(null);
  const ctxOutRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const newTurnRef = useRef(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    function flushPlayback() {
      sourcesRef.current.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* ya detenido */
        }
      });
      sourcesRef.current.clear();
      nextPlayRef.current = 0;
    }

    function playChunk(b64: string) {
      const ctx = ctxOutRef.current;
      if (!ctx) return;
      const f32 = base64ToFloat32(b64);
      if (f32.length === 0) return;
      const buf = ctx.createBuffer(1, f32.length, OUTPUT_RATE);
      buf.copyToChannel(f32, 0);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      const start = Math.max(ctx.currentTime, nextPlayRef.current);
      src.start(start);
      nextPlayRef.current = start + buf.duration;
      sourcesRef.current.add(src);
      src.onended = () => {
        sourcesRef.current.delete(src);
        if (sourcesRef.current.size === 0 && aliveRef.current) setStatus("listening");
      };
      setStatus("speaking");
    }

    async function start() {
      try {
        const r = await fetch("/api/agent/voice-token", { method: "POST" });
        if (r.status === 503) {
          setStatus("unavailable");
          return;
        }
        if (!r.ok) throw new Error("token");
        const { token, model } = (await r.json()) as { token: string; model: string };

        const { GoogleGenAI, Modality } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: "v1alpha" } });

        // Micrófono
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (!aliveRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const ctxIn = new AudioContext({ sampleRate: INPUT_RATE });
        const ctxOut = new AudioContext({ sampleRate: OUTPUT_RATE });
        ctxInRef.current = ctxIn;
        ctxOutRef.current = ctxOut;
        await ctxIn.resume();
        await ctxOut.resume();

        const session = await ai.live.connect({
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              if (aliveRef.current) setStatus("listening");
            },
            onmessage: (msg) => {
              if (!aliveRef.current) return;
              const sc = msg.serverContent;
              if (!sc) return;
              if (sc.interrupted) flushPlayback();
              const inT = sc.inputTranscription?.text;
              if (inT) {
                if (newTurnRef.current) {
                  newTurnRef.current = false;
                  setUserText("");
                  setModelText("");
                }
                setUserText((t) => t + inT);
              }
              const outT = sc.outputTranscription?.text;
              if (outT) setModelText((t) => t + outT);
              const parts = sc.modelTurn?.parts ?? [];
              for (const p of parts) {
                const data = p.inlineData?.data;
                if (data) playChunk(data);
              }
              if (sc.turnComplete) newTurnRef.current = true;
            },
            onerror: () => {
              if (aliveRef.current) setStatus("error");
            },
            onclose: () => {
              if (aliveRef.current) setStatus((s) => (s === "error" || s === "unavailable" ? s : "ended"));
            },
          },
        });
        sessionRef.current = session;

        // Envío del micrófono en bloques de ~256 ms
        const source = ctxIn.createMediaStreamSource(stream);
        const processor = ctxIn.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        let frame = 0;
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          frame++;
          if (frame % 2 === 0) setLevel(mutedRef.current ? 0 : rms(input));
          if (mutedRef.current) return;
          const b64 = int16ToBase64(floatTo16BitPCM(input));
          try {
            session.sendRealtimeInput({ audio: { data: b64, mimeType: `audio/pcm;rate=${INPUT_RATE}` } });
          } catch {
            /* sesión cerrada */
          }
        };
        source.connect(processor);
        processor.connect(ctxIn.destination);

        trackBrowser("AgentCall", { content_name: "prime" });
        timer = setInterval(() => {
          secondsRef.current += 1;
          setSeconds(secondsRef.current);
        }, 1000);
      } catch {
        if (aliveRef.current) setStatus("error");
      }
    }

    void start();

    return () => {
      aliveRef.current = false;
      if (timer) clearInterval(timer);
      flushPlayback();
      try {
        processorRef.current?.disconnect();
      } catch {
        /* nada */
      }
      try {
        sessionRef.current?.close();
      } catch {
        /* nada */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void ctxInRef.current?.close();
      void ctxOutRef.current?.close();
    };
  }, []);

  function toggleMute() {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
  }

  const bars = [0.35, 0.7, 1, 0.55, 0.85, 0.4, 0.75, 0.3];
  const speaking = status === "speaking";
  const live = status === "listening" || status === "speaking";

  const title =
    status === "connecting"
      ? "Conectando con Prime…"
      : status === "listening"
        ? "Prime está escuchando…"
        : status === "speaking"
          ? "Prime está hablando"
          : status === "unavailable"
            ? "Las llamadas llegan muy pronto"
            : status === "ended"
              ? "Llamada finalizada"
              : "No pudimos conectar la llamada";

  const subtitle = live
    ? "Habla con naturalidad. Puedes interrumpirme cuando quieras."
    : status === "connecting"
      ? "Permite el micrófono cuando el navegador lo pida."
      : status === "unavailable"
        ? "Mientras tanto, escríbeme aquí o habla con el equipo por WhatsApp."
        : status === "error"
          ? "Revisa el permiso del micrófono o inténtalo de nuevo. También puedes escribirme."
          : "";

  return (
    <div className="pa-call">
      <div className="pa-call__top">
        <span className={"pa-call__pill" + (live ? " is-live" : "")}>
          <span className="pa-call__dot" />
          {live ? `En llamada · ${fmt(seconds)}` : "Llamada"}
        </span>
        <span className="pa-call__lang">ESPAÑOL</span>
      </div>

      <div className="pa-call__body">
        <div className={"pa-call__rings" + (speaking ? " is-speaking" : "")}>
          <span className="pa-ring pa-ring--1" />
          <span className="pa-ring pa-ring--2" />
          <span className="pa-ring pa-ring--3" />
          <span className="pa-call__glow" />
          <span className="pa-call__avatar">★</span>
        </div>

        <div className="pa-call__titles">
          <span className="pa-call__title">{title}</span>
          {subtitle && <span className="pa-call__sub">{subtitle}</span>}
        </div>

        {live && (userText || modelText) && (
          <div className="pa-call__caption">
            <span className="pa-call__caption-k">Transcripción en vivo</span>
            {userText && (
              <span>
                <strong>Tú:</strong> {userText}
              </span>
            )}
            {modelText && (
              <span>
                <strong>Prime:</strong> {modelText}
              </span>
            )}
          </div>
        )}

        {(status === "unavailable" || status === "error") && (
          <a
            className="pa-btn pa-btn--wa"
            href={waLink("Hola, quiero hablar con una persona sobre mi trámite.")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackBrowser("Contact")}
          >
            {Ico.whatsapp} Hablar por WhatsApp
          </a>
        )}

        {live && (
          <div className="pa-bars" aria-hidden="true">
            {bars.map((b, i) => (
              <span
                key={i}
                style={{ height: `${Math.max(6, Math.round(34 * b * (speaking ? 0.9 : 0.25 + level * 1.6)))}px` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="pa-call__controls">
        <button
          type="button"
          className={"pa-ctl" + (muted ? " is-on" : "")}
          onClick={toggleMute}
          aria-pressed={muted}
          disabled={!live}
        >
          <span className="pa-ctl__btn">{muted ? MicOffIcon : MicIcon}</span>
          <span className="pa-ctl__lbl">{muted ? "Activar" : "Silenciar"}</span>
        </button>
        <button type="button" className="pa-ctl pa-ctl--end" onClick={() => onExit(secondsRef.current)} aria-label="Colgar">
          <span className="pa-ctl__btn pa-ctl__btn--end">{Ico.phone}</span>
          <span className="pa-ctl__lbl">Colgar</span>
        </button>
        <button type="button" className="pa-ctl" onClick={() => onExit(secondsRef.current)}>
          <span className="pa-ctl__btn">{ChatIcon}</span>
          <span className="pa-ctl__lbl">Escribir</span>
        </button>
      </div>
    </div>
  );
}
