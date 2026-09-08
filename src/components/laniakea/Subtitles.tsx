"use client";

import { useMemo } from "react";

interface SubtitlesProps {
  /** The full narration text currently being spoken */
  text: string;
  /** Whether speech is active */
  speaking: boolean;
  /** Progress 0..1 of the speech */
  progress: number;
  /** Whether subtitles are enabled by the user */
  enabled: boolean;
}

/**
 * Synchronized subtitles overlay.
 *
 * Splits the narration text into sentences and highlights the currently
 * spoken sentence based on the progress value. Shows a bottom overlay
 * with the current sentence and upcoming text dimmed.
 */

function splitIntoSentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?…])\s+/);
  return parts.filter((s) => s.trim().length > 0);
}

export function Subtitles({
  text,
  speaking,
  progress,
  enabled,
}: SubtitlesProps) {
  const sentences = useMemo(() => splitIntoSentences(text), [text]);

  // Derive current index directly from progress (no state needed)
  const currentIdx =
    sentences.length > 0
      ? Math.min(
          sentences.length - 1,
          Math.floor(progress * sentences.length),
        )
      : 0;

  if (!enabled || !speaking || !text) return null;

  const current = sentences[currentIdx] || text;
  const prev = currentIdx > 0 ? sentences[currentIdx - 1] : null;
  const next =
    currentIdx < sentences.length - 1 ? sentences[currentIdx + 1] : null;

  return (
    <div className="pointer-events-none absolute bottom-32 left-1/2 z-30 w-full max-w-2xl -translate-x-1/2 px-4 sm:bottom-40">
      <div className="mx-auto rounded-xl border border-[var(--cosmic-border)] bg-[var(--cosmic-card)] px-5 py-3 backdrop-blur-md">
        {/* Progress indicator line */}
        <div className="mb-2 flex items-center gap-2">
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-emerald-400 transition-all duration-200 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-white/50">
            {Math.round(progress * 100)}%
          </span>
        </div>

        {prev && (
          <p className="mb-1 text-[11px] leading-snug text-white/30">
            {prev}
          </p>
        )}

        <p className="text-sm font-medium leading-relaxed text-white">
          {current}
        </p>

        {next && (
          <p className="mt-1 text-[11px] leading-snug text-white/30">
            {next}
          </p>
        )}
      </div>
    </div>
  );
}

