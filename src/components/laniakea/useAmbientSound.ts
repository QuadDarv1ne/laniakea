"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Ambient cosmic background sound generator using the Web Audio API.
 *
 * Creates a layered "space drone" with:
 *   - A low-frequency sine drone (base note)
 *   - A higher fifth for harmonic richness
 *   - Slow LFO-modulated filter sweep for movement
 *   - Subtle white noise wash for "cosmic dust" texture
 *
 * No audio files needed — everything is synthesized procedurally.
 * This runs entirely in the browser, no network required.
 *
 * Usage:
 *   const { enabled, toggle, setEnabled } = useAmbientSound();
 *   // toggle() starts/stops; setEnabled(true/false) sets state
 */

const BASE_FREQ = 55; // A1 — deep, low drone
const FIFTH_FREQ = 82.4; // E2 — perfect fifth above

export function useAmbientSound() {
  const [enabled, setEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<{
    osc1?: OscillatorNode;
    osc2?: OscillatorNode;
    noise?: AudioBufferSourceNode;
    lfo?: OscillatorNode;
    lfoGain?: GainNode;
    filter?: BiquadFilterNode;
  }>({});

  // Create the audio graph (called once when first enabled)
  const setupAudio = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    if (typeof window === "undefined") return null;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // Low-pass filter for a warm, muffled sound
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    filter.Q.value = 1.5;
    filter.connect(masterGain);

    // Oscillator 1: low drone (sine)
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = BASE_FREQ;
    const osc1Gain = ctx.createGain();
    osc1Gain.gain.value = 0.35;
    osc1.connect(osc1Gain).connect(filter);
    osc1.start();

    // Oscillator 2: fifth (triangle for softer harmonic)
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.value = FIFTH_FREQ;
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.15;
    osc2.connect(osc2Gain).connect(filter);
    osc2.start();

    // LFO to slowly modulate the filter frequency (movement)
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.05; // very slow, 1 cycle per 20 sec
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200; // filter sweeps ±200 Hz
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    // White noise wash (cosmic dust texture)
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Brown noise (integrated white) for softer, ocean-like texture
      output[i] = (Math.random() * 2 - 1) * 0.02;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.4;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 600;
    noiseFilter.Q.value = 0.5;
    noise.connect(noiseFilter).connect(noiseGain).connect(masterGain);
    noise.start();

    nodesRef.current = { osc1, osc2, noise, lfo, lfoGain, filter };
    return ctx;
  }, []);

  const start = useCallback(() => {
    const ctx = setupAudio();
    if (!ctx || !masterGainRef.current) return;
    // Resume context if suspended (autoplay policy)
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    // Fade in over 2 seconds
    const now = ctx.currentTime;
    const gain = masterGainRef.current.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0.18, now + 2.0);
    setEnabled(true);
  }, [setupAudio]);

  const stop = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !masterGainRef.current) return;
    const now = ctx.currentTime;
    const gain = masterGainRef.current.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0, now + 1.5);
    setEnabled(false);
  }, []);

  const toggle = useCallback(() => {
    if (enabled) {
      stop();
    } else {
      start();
    }
  }, [enabled, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const ctx = audioCtxRef.current;
      if (ctx) {
        try {
          void ctx.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return { enabled, toggle, start, stop, setEnabled };
}
