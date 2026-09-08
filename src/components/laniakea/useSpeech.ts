"use client";

import { useCallback, useEffect, useSyncExternalStore, useRef, useState } from "react";

interface UseSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

// Empty subscribe — we don't need to react to changes in `supported`,
// we just need a hydration-safe way to read it (returns false on the
// server and during hydration, then the real value on subsequent renders).
const emptySubscribe = () => () => {};
const getClientSnapshot = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;
const getServerSnapshot = () => false;

// Names of preferred male Russian voices across platforms.
// FreeTTS.ru labels the Yandex "ermilov" voice as "Дмитрий" (Dmitry).
// We look for this name (and close male Russian variants) in the system
// voice list so the audio tour sounds like the freetts.ru "Дмитрий" voice.
const PREFERRED_VOICE_NAMES = [
  "дмитрий",
  "dmitry",
  "dmitri",
  "ermilov",
  "эрмилов",
  // Other male Russian voices as fallbacks:
  "филипп",
  "filipp",
  "philip",
  "maxim",
  "максим",
  "юрий",
  "yuri",
  "yuriy",
  "захар",
  "zahar",
];

function pickRussianMaleVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;
  // First, find Russian voices
  const ruVoices = voices.filter(
    (v) => v.lang.toLowerCase().startsWith("ru") || v.lang.toLowerCase().includes("ru-"),
  );
  if (ruVoices.length === 0) return null;

  // Try to find one matching preferred names
  for (const preferred of PREFERRED_VOICE_NAMES) {
    const match = ruVoices.find((v) => {
      const name = v.name.toLowerCase();
      return name.includes(preferred);
    });
    if (match) return match;
  }

  // Fallback: prefer voices that look male (heuristic: common male names)
  // On Windows: "Microsoft Dmitry" or "Microsoft Pavel" — Dmitry is preferred
  const maleHints = ["pavel", "pav", "dmitry", "dmitrii", "dmitri"];
  for (const hint of maleHints) {
    const match = ruVoices.find((v) =>
      v.name.toLowerCase().includes(hint),
    );
    if (match) return match;
  }

  // Last resort: return first Russian voice
  return ruVoices[0];
}

/**
 * Web Speech API hook for text-to-speech narration.
 *
 * Voice selection mimics freetts.ru's "Дмитрий" voice:
 * FreeTTS.ru uses Yandex SpeechKit's "ermilov" voice under the hood and
 * labels it as "Дмитрий" in their UI. We replicate this by:
 *   1. Looking for a system voice whose name contains "Дмитрий"/"Dmitry"/
 *      "ermilov"/"Эрмилов" (or similar male Russian names as fallback).
 *   2. If no suitable system voice is found, the client can fall back to
 *      the /api/tts server endpoint (which calls Yandex SpeechKit directly
 *      with the "ermilov" voice) — see `speakViaAPI` below.
 *
 * `supported` is read via useSyncExternalStore so the SSR-rendered HTML
 * always matches the first client render (both return false). The real value
 * is only returned after hydration completes, avoiding hydration mismatches.
 */
export function useSpeech(options: UseSpeechOptions = {}) {
  const { lang = "ru-RU", rate = 0.95, pitch = 1, volume = 1 } = options;
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [currentText, setCurrentText] = useState("");
  const supported = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const estimatedDurationRef = useRef(0); // ms
  const startTimeRef = useRef(0);
  const modeRef = useRef<"webspeech" | "api" | null>(null);

  // Clear progress interval helper
  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current !== null) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Start progress tracking (estimates duration from text length + rate)
  const startProgressTracking = useCallback(
    (text: string, mode: "webspeech" | "api") => {
      clearProgressInterval();
      // Average Russian TTS rate: ~15 chars/sec at rate=1, scaled by `rate`
      const estSeconds = text.length / (15 * rate);
      estimatedDurationRef.current = estSeconds * 1000;
      startTimeRef.current = performance.now();
      modeRef.current = mode;
      setProgress(0);
      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = performance.now() - startTimeRef.current;
        const pct = Math.min(0.98, elapsed / estimatedDurationRef.current);
        setProgress(pct);
      }, 200);
    },
    [clearProgressInterval, rate],
  );

  // Finish progress (set to 1)
  const finishProgress = useCallback(() => {
    clearProgressInterval();
    setProgress(1);
    // Reset to 0 after a short delay so the bar can be reused
    setTimeout(() => setProgress(0), 500);
  }, [clearProgressInterval]);

  // Load voices (may be async)
  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    };
  }, [supported]);

  const speakViaAPI = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) return false;
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.startsWith("audio/")) return false;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (!audioElRef.current) {
          audioElRef.current = new Audio();
        }
        const audio = audioElRef.current;
        audio.src = url;
        audio.onplay = () => setSpeaking(true);
        audio.onended = () => {
          setSpeaking(false);
          setPaused(false);
          finishProgress();
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          setSpeaking(false);
          setPaused(false);
          finishProgress();
          URL.revokeObjectURL(url);
        };
        // For API mode, use real timeupdate events for accurate progress
        audio.ontimeupdate = () => {
          if (audio.duration && isFinite(audio.duration)) {
            setProgress(audio.currentTime / audio.duration);
          }
        };
        await audio.play();
        startProgressTracking(text, "api");
        return true;
      } catch {
        return false;
      }
    },
    [startProgressTracking, finishProgress],
  );

  const speakViaWebSpeech = useCallback(
    (text: string): boolean => {
      if (!supported) return false;
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      const voice = pickRussianMaleVoice(voicesRef.current);
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);
        startProgressTracking(text, "webspeech");
      };
      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
        finishProgress();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        setPaused(false);
        finishProgress();
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    },
    [supported, lang, rate, pitch, volume, startProgressTracking, finishProgress],
  );

  const speak = useCallback(
    (text: string) => {
      setCurrentText(text);
      const hasRussianVoice =
        voicesRef.current.some(
          (v) =>
            v.lang.toLowerCase().startsWith("ru") ||
            v.lang.toLowerCase().includes("ru-"),
        );

      if (supported && hasRussianVoice) {
        const ok = speakViaWebSpeech(text);
        if (ok) return;
      }

      void speakViaAPI(text);
    },
    [supported, speakViaWebSpeech, speakViaAPI],
  );

  const pause = useCallback(() => {
    if (modeRef.current === "api" && audioElRef.current) {
      audioElRef.current.pause();
      setPaused(true);
      return;
    }
    if (supported) {
      try {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          setPaused(true);
        }
      } catch {
        // ignore
      }
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (modeRef.current === "api" && audioElRef.current) {
      void audioElRef.current.play();
      setPaused(false);
      return;
    }
    if (supported) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setPaused(false);
        }
      } catch {
        // ignore
      }
    }
  }, [supported]);

  const stop = useCallback(() => {
    if (supported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
    setSpeaking(false);
    setPaused(false);
    clearProgressInterval();
    setProgress(0);
    setCurrentText("");
    modeRef.current = null;
  }, [supported, clearProgressInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearProgressInterval();
    };
  }, [clearProgressInterval]);

  return { speak, stop, pause, resume, speaking, paused, progress, currentText, supported };
}
