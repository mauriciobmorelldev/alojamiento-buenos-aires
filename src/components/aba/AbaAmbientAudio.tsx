"use client";

import { useEffect, useRef, useState } from "react";

const AUDIO_SRC = "/audio/por-una-cabeza.mp3";
const STORAGE_KEY = "aba_ambient_audio_enabled";
const REQUEST_EVENT = "aba:ambient-audio-request";
const TARGET_VOLUME = 0.075;

type AudioState = "idle" | "playing" | "muted" | "blocked" | "missing";

export default function AbaAmbientAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeRef = useRef<number | null>(null);
  const revealRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>("idle");

  useEffect(() => {
    setMounted(true);
    const firstFrame = window.requestAnimationFrame(() => {
      revealRef.current = window.requestAnimationFrame(() => setReady(true));
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (revealRef.current) window.cancelAnimationFrame(revealRef.current);
    };
  }, []);

  const clearFade = () => {
    if (fadeRef.current) {
      window.clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  };

  const fadeTo = (target: number, onDone?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    clearFade();

    fadeRef.current = window.setInterval(() => {
      const diff = target - audio.volume;
      if (Math.abs(diff) <= 0.008) {
        audio.volume = target;
        clearFade();
        onDone?.();
        return;
      }

      audio.volume = Math.max(0, Math.min(TARGET_VOLUME, audio.volume + Math.sign(diff) * 0.008));
    }, 70);
  };

  const startAudio = async () => {
    const audio = audioRef.current;
    if (!audio || audioState === "missing") return;

    try {
      audio.volume = Math.min(audio.volume, TARGET_VOLUME);
      await audio.play();
      window.localStorage.setItem(STORAGE_KEY, "true");
      setAudioState("playing");
      fadeTo(TARGET_VOLUME);
    } catch {
      setAudioState("blocked");
    }
  };

  const muteAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    window.localStorage.setItem(STORAGE_KEY, "false");
    fadeTo(0, () => {
      audio.pause();
      setAudioState("muted");
    });
  };

  const toggleAudio = () => {
    if (audioState === "playing") {
      muteAudio();
      return;
    }

    void startAudio();
  };

  useEffect(() => {
    if (!mounted) return;

    const shouldResume = window.localStorage.getItem(STORAGE_KEY) === "true";
    const requestStart = () => {
      void startAudio();
    };

    window.addEventListener(REQUEST_EVENT, requestStart);

    if (shouldResume) {
      void startAudio();
    } else {
      setAudioState("muted");
    }

    return () => {
      window.removeEventListener(REQUEST_EVENT, requestStart);
      clearFade();
    };
  }, [mounted]);

  if (!mounted || !ready) return null;

  const isPlaying = audioState === "playing";
  const label =
    audioState === "missing"
      ? "Audio no disponible"
      : isPlaying
        ? "Mutear tango"
        : "Activar tango";

  return (
    <>
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        preload="metadata"
        loop
        onError={() => setAudioState("missing")}
      />
      <button
        type="button"
        className={isPlaying ? "aba-ambient-audio is-playing" : "aba-ambient-audio"}
        onClick={toggleAudio}
        disabled={audioState === "missing"}
        aria-pressed={isPlaying}
        aria-label={label}
      >
        <span aria-hidden="true" className="aba-ambient-audio__icon">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M9 18.5a2.5 2.5 0 1 1-1.2-2.14V5.75l9.7-2.2v11.2a2.5 2.5 0 1 1-1.2-2.14V7.05l-7.3 1.66v9.79Z" />
          </svg>
        </span>
        <b>{isPlaying ? "Mutear" : "Tango"}</b>
      </button>
    </>
  );
}

export { REQUEST_EVENT as ABA_AMBIENT_AUDIO_REQUEST_EVENT };
