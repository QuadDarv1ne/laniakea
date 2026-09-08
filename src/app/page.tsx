"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as THREE from "three";
import { LaniakeaCanvas, TOUR_POINTS } from "@/components/laniakea/LaniakeaCanvas";
import {
  InfoPanel,
  ControlPanel,
  LegendCard,
} from "@/components/laniakea/Panels";
import { AboutDialog } from "@/components/laniakea/AboutDialog";
import { TimelineDialog } from "@/components/laniakea/TimelineDialog";
import { ComparisonDialog } from "@/components/laniakea/ComparisonDialog";
import { Subtitles } from "@/components/laniakea/Subtitles";
import type { SelectionState } from "@/components/laniakea/LaniakeaScene";
import { REGIONS, type RegionKey } from "@/components/laniakea/data";
import { TOUR_NARRATION } from "@/components/laniakea/realGalaxies";
import { useSpeech } from "@/components/laniakea/useSpeech";
import { useAmbientSound } from "@/components/laniakea/useAmbientSound";
import { MiniMap } from "@/components/laniakea/MiniMap";
import { ScaleRuler } from "@/components/laniakea/ScaleRuler";
import { OnboardingOverlay } from "@/components/laniakea/OnboardingOverlay";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Telescope,
  Compass,
  Layers,
  X,
  Star,
  Volume2,
  VolumeX,
  Share2,
  Check,
  Camera,
  Play,
  Pause,
  Music,
  History,
  Orbit,
  Download,
  Captions,
} from "lucide-react";

const INITIAL_REGIONS: Record<RegionKey, boolean> = {
  local: true,
  hydraCentaurus: true,
  pavoIndus: true,
  southern: true,
};

const TOUR_STOPS = [
  { label: "Обзор Ланиакеи", hint: "Сверхскопление целиком — 4 главных региона", narrationKey: "overview" },
  { label: "Млечный Путь", hint: "Наша Галактика — мы на периферии Ланиакеи", narrationKey: "milkyway" },
  { label: "Великий аттрактор", hint: "Гравитационный центр, к которому движутся галактики", narrationKey: "greatAttractor" },
  { label: "Гидра-Центавр", hint: "Самая массивная часть Ланиакеи", narrationKey: "hydraCentaurus" },
  { label: "Павлин-Индеец", hint: "Южное крыло сверхскопления", narrationKey: "pavoIndus" },
  { label: "Южное сверхскопление", hint: "Скопления Печи и Эридана", narrationKey: "southern" },
  { label: "Местное сверхскопление", hint: "Местная группа, скопление Девы", narrationKey: "local" },
];

// Maps a flyTo key (from timeline events) to a tour index.
const FLY_TO_TOUR_INDEX: Record<string, number> = {
  overview: 0,
  milkyway: 1,
  greatAttractor: 2,
  hydraCentaurus: 3,
  pavoIndus: 4,
  southern: 5,
  local: 6,
};

// Round to 1 decimal to keep URL short
const r1 = (n: number) => Math.round(n * 10) / 10;

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [visibleRegions, setVisibleRegions] =
    useState<Record<RegionKey, boolean>>(INITIAL_REGIONS);
  const [showNeighbor, setShowNeighbor] = useState(false);
  const [showFlows, setShowFlows] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  // Initialize with defaults (same on server and client → no hydration mismatch).
  // URL params are applied after mount via the urlInit effect below.
  const [useRealGalaxies, setUseRealGalaxies] = useState(true);
  const [enableBloom, setEnableBloom] = useState(true);
  const [enableParallax, setEnableParallax] = useState(true);

  const [selection, setSelection] = useState<SelectionState>({
    type: "none",
  });
  const [aboutOpen, setAboutOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);

  // Galaxy data loading state (for showing a loading indicator)
  const [galaxyDataState, setGalaxyDataState] = useState<
    | { status: "disabled" }
    | { status: "loading" }
    | { status: "ready"; count: number }
    | { status: "error"; message: string }
  >({ status: "loading" });

  // Ref to the canvas DOM element (for screenshots)
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const [screenshotTaken, setScreenshotTaken] = useState(false);

  const [panelsOpen, setPanelsOpen] = useState(false);
  const [tourTrigger, setTourTrigger] = useState(0);
  const [tourIndex, setTourIndex] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Applied camera position from URL — null on server and first client render,
  // then read once after mount. We use a ref to ensure we only read once.
  const [appliedCameraPos, setAppliedCameraPos] = useState<
    [number, number, number] | null
  >(null);
  const [appliedCameraTarget, setAppliedCameraTarget] = useState<
    [number, number, number] | null
  >(null);

  const {
    speak,
    stop: stopSpeech,
    pause: pauseSpeech,
    resume: resumeSpeech,
    speaking,
    paused: speechPaused,
    progress: speechProgress,
    currentText: speechCurrentText,
    supported: speechSupported,
  } = useSpeech({ lang: "ru-RU", rate: 0.92, pitch: 1 });
  const {
    enabled: ambientEnabled,
    toggle: toggleAmbient,
  } = useAmbientSound();

  // ---- One-time URL param initialization (runs after mount) ----
  // This reads URL search params and applies them to state. It only runs once
  // (guarded by urlInitRef). Using setState here is safe because it only
  // happens once and doesn't create a loop. The ESLint rule
  // react-hooks/set-state-in-effect is overly strict for this one-shot pattern.
  const urlInitRef = useRef(false);
  useEffect(() => {
    if (urlInitRef.current) return;
    urlInitRef.current = true;
    const params = new URLSearchParams(window.location.search);

    /* eslint-disable react-hooks/set-state-in-effect -- one-time URL init, guarded by ref */
    // Boolean toggles
    const real = params.get("real");
    if (real !== null) setUseRealGalaxies(real !== "0");
    const bloom = params.get("bloom");
    if (bloom !== null) setEnableBloom(bloom !== "0");
    const parallax = params.get("parallax");
    if (parallax !== null) setEnableParallax(parallax !== "0");

    // Tour index
    const ti = params.get("ti");
    if (ti) {
      const idx = parseInt(ti, 10);
      if (!isNaN(idx) && idx >= 0 && idx < TOUR_STOPS.length) {
        setTourIndex(idx);
        const hasCam = !!params.get("cx");
        if (!hasCam) setTourTrigger(1);
      }
    }

    // Camera position
    const cx = params.get("cx");
    const cy = params.get("cy");
    const cz = params.get("cz");
    if (cx && cy && cz) {
      const fx = parseFloat(cx);
      const fy = parseFloat(cy);
      const fz = parseFloat(cz);
      if (!isNaN(fx) && !isNaN(fy) && !isNaN(fz)) {
        setAppliedCameraPos([fx, fy, fz]);
      }
    }
    const tx = params.get("tx");
    const ty = params.get("ty");
    const tz = params.get("tz");
    if (tx && ty && tz) {
      const fx = parseFloat(tx);
      const fy = parseFloat(ty);
      const fz = parseFloat(tz);
      if (!isNaN(fx) && !isNaN(fy) && !isNaN(fz)) {
        setAppliedCameraTarget([fx, fy, fz]);
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // ---- Camera position tracking (for mini-map + scale ruler) ----
  const [cameraPos, setCameraPos] = useState<THREE.Vector3 | null>(null);
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null);
  const cameraUpdateThrottleRef = useRef(0);

  // ---- Camera move handler (debounced URL update + mini-map/scale update) ----
  const lastUrlUpdateRef = useRef(0);
  const handleCameraMove = useCallback(
    (pos: THREE.Vector3, target: THREE.Vector3) => {
      // Update mini-map/scale ruler more frequently (every ~150ms)
      const now = performance.now();
      if (now - cameraUpdateThrottleRef.current > 150) {
        cameraUpdateThrottleRef.current = now;
        setCameraPos(pos.clone());
        setCameraTarget(target.clone());
      }

      // URL update is throttled to 1 per 800ms
      if (now - lastUrlUpdateRef.current < 800) return;
      lastUrlUpdateRef.current = now;

      const params = new URLSearchParams(window.location.search);
      params.set("cx", r1(pos.x).toString());
      params.set("cy", r1(pos.y).toString());
      params.set("cz", r1(pos.z).toString());
      params.set("tx", r1(target.x).toString());
      params.set("ty", r1(target.y).toString());
      params.set("tz", r1(target.z).toString());
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    },
    [lastUrlUpdateRef],
  );

  const handleSelect = useCallback((s: SelectionState) => {
    setSelection(s);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelection({ type: "none" });
  }, []);

  const handleToggleRegion = useCallback((key: RegionKey, value: boolean) => {
    setVisibleRegions((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Tour navigation with audio narration
  const goToTourStop = useCallback(
    (newIndex: number, withAudio: boolean) => {
      const safeIndex = ((newIndex % TOUR_STOPS.length) + TOUR_STOPS.length) % TOUR_STOPS.length;
      setTourIndex(safeIndex);
      setTourTrigger((t) => t + 1);
      // Update URL with tour index
      const params = new URLSearchParams(window.location.search);
      params.set("ti", safeIndex.toString());
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
      // Audio narration
      if (withAudio && speechSupported) {
        const stop = TOUR_STOPS[safeIndex];
        const narration = TOUR_NARRATION[stop.narrationKey];
        if (narration) speak(narration);
      }
    },
    [speechSupported, speak],
  );

  const handleNextTour = useCallback(() => {
    goToTourStop(tourIndex + 1, audioEnabled);
  }, [tourIndex, audioEnabled, goToTourStop]);

  const handlePrevTour = useCallback(() => {
    goToTourStop(tourIndex - 1, audioEnabled);
  }, [tourIndex, audioEnabled, goToTourStop]);

  const handleResetView = useCallback(() => {
    setTourIndex(0);
    setTourTrigger((t) => t + 1);
    if (audioEnabled && speechSupported) {
      stopSpeech();
    }
  }, [audioEnabled, speechSupported, stopSpeech]);

  // Fly camera to a tour point when a timeline event is clicked
  const handleTimelineFlyTo = useCallback(
    (target: string) => {
      const idx = FLY_TO_TOUR_INDEX[target];
      if (idx === undefined) return;
      setTourIndex(idx);
      setTourTrigger((t) => t + 1);
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        params.set("ti", idx.toString());
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, "", newUrl);
      }
      if (audioEnabled && speechSupported) {
        const stop = TOUR_STOPS[idx];
        const narration = TOUR_NARRATION[stop.narrationKey];
        if (narration) speak(narration);
      }
    },
    [audioEnabled, speechSupported, speak],
  );

  // Navigate to a scene coordinate (from mini-map click)
  const handleMiniMapNavigate = useCallback(
    (target: [number, number, number], label: string) => {
      // Find the closest tour point to this target
      let closestIdx = 0;
      let closestDist = Infinity;
      TOUR_STOPS.forEach((stop, i) => {
        const stopTarget = TOUR_POINTS[i]?.target;
        if (stopTarget) {
          const dx = stopTarget[0] - target[0];
          const dy = stopTarget[1] - target[1];
          const dz = stopTarget[2] - target[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = i;
          }
        }
      });
      setTourIndex(closestIdx);
      setTourTrigger((t) => t + 1);
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        params.set("ti", closestIdx.toString());
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, "", newUrl);
      }
    },
    [],
  );

  // Export tour data to JSON
  const handleExportTour = useCallback(() => {
    const tourData = {
      title: "Ланиакея — аудио-тур",
      generatedAt: new Date().toISOString(),
      stops: TOUR_STOPS.map((stop, i) => ({
        index: i + 1,
        label: stop.label,
        hint: stop.hint,
        narration: TOUR_NARRATION[stop.narrationKey] || "",
        cameraTarget: TOUR_POINTS[i]?.target || null,
        cameraPosition: TOUR_POINTS[i]?.position || null,
      })),
    };
    const blob = new Blob([JSON.stringify(tourData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "laniakea-tour.json";
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev;
      if (!next) {
        stopSpeech();
      } else if (speechSupported) {
        // Start narrating current stop
        const stop = TOUR_STOPS[tourIndex];
        const narration = TOUR_NARRATION[stop.narrationKey];
        if (narration) speak(narration);
      }
      return next;
    });
  }, [tourIndex, speechSupported, speak, stopSpeech]);

  const handleShareLink = useCallback(async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Fallback: select URL in address bar
      setShareCopied(false);
    }
  }, []);

  // ---- Screenshot handler ----
  const handleScreenshot = useCallback(() => {
    const canvas = canvasElRef.current;
    if (!canvas) return;
    try {
      // Force a re-render of the current frame to ensure buffer is fresh
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
      link.download = `laniakea-${ts}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setScreenshotTaken(true);
      setTimeout(() => setScreenshotTaken(false), 2000);
    } catch (err) {
      console.error("Screenshot failed:", err);
    }
  }, []);

  // ---- Keyboard shortcuts ----
  // ArrowLeft/ArrowRight: prev/next tour, Space: toggle audio, R: reset,
  // S: screenshot, L: toggle labels, B: toggle bloom, P: toggle parallax, M: find Milky Way
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in an input/textarea/contenteditable
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      // Ignore if a modifier is pressed (let browser shortcuts work)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          handleNextTour();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrevTour();
          break;
        case " ":
        case "Spacebar":
          e.preventDefault();
          if (speechSupported) {
            if (audioEnabled) {
              stopSpeech();
              setAudioEnabled(false);
            } else {
              setAudioEnabled(true);
              const stop = TOUR_STOPS[tourIndex];
              const narration = TOUR_NARRATION[stop.narrationKey];
              if (narration) speak(narration);
            }
          }
          break;
        case "r":
        case "R":
        case "к":
        case "К":
          e.preventDefault();
          handleResetView();
          break;
        case "s":
        case "S":
        case "ы":
        case "Ы":
          e.preventDefault();
          handleScreenshot();
          break;
        case "l":
        case "L":
        case "д":
        case "Д":
          e.preventDefault();
          setShowLabels((v) => !v);
          break;
        case "b":
        case "B":
        case "и":
        case "И":
          e.preventDefault();
          setEnableBloom((v) => !v);
          break;
        case "p":
        case "P":
        case "з":
        case "З":
          e.preventDefault();
          setEnableParallax((v) => !v);
          break;
        case "m":
        case "M":
        case "ь":
        case "Ь":
          e.preventDefault();
          setSelection({ type: "milkyWay" });
          goToTourStop(1, audioEnabled);
          break;
        case "?":
          e.preventDefault();
          setAboutOpen(true);
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    tourIndex,
    audioEnabled,
    speechSupported,
    handleNextTour,
    handlePrevTour,
    handleResetView,
    handleScreenshot,
    goToTourStop,
    speak,
    stopSpeech,
  ]);

  // Update URL when toggling real galaxies / bloom / parallax.
  // Skip the first run (mount) so we don't overwrite URL params before
  // the mount effect above has a chance to apply them to state.
  const urlSyncSkipRef = useRef(true);
  useEffect(() => {
    if (urlSyncSkipRef.current) {
      urlSyncSkipRef.current = false;
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set("real", useRealGalaxies ? "1" : "0");
    params.set("bloom", enableBloom ? "1" : "0");
    params.set("parallax", enableParallax ? "1" : "0");
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [useRealGalaxies, enableBloom, enableParallax]);

  const currentStop = TOUR_STOPS[tourIndex];

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#02030a] text-foreground">
      {/* 3D Canvas - full screen */}
      <div className="absolute inset-0">
        <LaniakeaCanvas
          visibleRegions={visibleRegions}
          showNeighbor={showNeighbor}
          showFlows={showFlows}
          showLaniakeaBoundary={showBoundary}
          showLabels={showLabels}
          useRealGalaxies={useRealGalaxies}
          enableBloom={enableBloom}
          enableParallax={enableParallax}
          onSelect={handleSelect}
          onBackgroundClick={handleBackgroundClick}
          onCameraMove={handleCameraMove}
          onGalaxyDataStateChange={setGalaxyDataState}
          onCanvasReady={(el) => {
            canvasElRef.current = el;
          }}
          tourTrigger={tourTrigger}
          tourIndex={tourIndex}
          appliedCameraPos={appliedCameraPos}
          appliedCameraTarget={appliedCameraTarget}
        />
      </div>

      {/* Loading indicator while galaxy data is fetching from API */}
      {useRealGalaxies && galaxyDataState.status === "loading" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-black/60 px-5 py-3 backdrop-blur-md">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
            <span className="text-xs text-white/80">
              Загрузка каталога галактик…
            </span>
          </div>
        </div>
      )}
      {useRealGalaxies && galaxyDataState.status === "ready" && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-10 -translate-x-1/2 sm:bottom-28">
          <div className="pointer-events-none rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 backdrop-blur-md">
            <span className="text-[10px] font-medium text-emerald-200">
              ✓ {galaxyDataState.count.toLocaleString("ru-RU")} галактик загружено
            </span>
          </div>
        </div>
      )}
      {useRealGalaxies && galaxyDataState.status === "error" && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-10 -translate-x-1/2 sm:bottom-28">
          <div className="pointer-events-none rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 backdrop-blur-md">
            <span className="text-[10px] font-medium text-red-200">
              Ошибка загрузки: используется резервный режим
            </span>
          </div>
        </div>
      )}

      {/* Top gradient overlay for header legibility */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#02030a]/95 via-[#02030a]/60 to-transparent" />

      {/* Header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/10 backdrop-blur-md">
            <Telescope className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              Ланиакея
            </h1>
            <p className="text-[11px] text-white/60 sm:text-xs">
              Интерактивная 3D-карта сверхскопления галактик
            </p>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Mobile-only toggle for panels */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-white/15 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white sm:hidden"
            onClick={() => setPanelsOpen((v) => !v)}
            title={panelsOpen ? "Скрыть панели" : "Показать панели"}
          >
            {panelsOpen ? (
              <X className="h-3.5 w-3.5" />
            ) : (
              <Layers className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Audio toggle */}
          {speechSupported && (
            <div className="relative flex items-center">
              <Button
                variant="outline"
                size="sm"
                className={`h-9 backdrop-blur-md ${
                  audioEnabled
                    ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25 hover:text-emerald-50"
                    : "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                }`}
                onClick={handleToggleAudio}
                title={
                  audioEnabled
                    ? "Выключить аудио-тур (голос: Дмитрий)"
                    : "Включить аудио-тур (голос: Дмитрий)"
                }
              >
                {speaking ? (
                  <Volume2 className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
                ) : audioEnabled ? (
                  <Volume2 className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <VolumeX className="mr-1.5 h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {audioEnabled ? "Дмитрий" : "Аудио-тур"}
                </span>
              </Button>

              {/* Pause/Resume button when speaking */}
              {speaking && (
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-1 h-9 w-9 border-white/15 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    if (speechPaused) {
                      resumeSpeech();
                    } else {
                      pauseSpeech();
                    }
                  }}
                  title={speechPaused ? "Продолжить" : "Пауза"}
                >
                  {speechPaused ? (
                    <Play className="h-3.5 w-3.5" />
                  ) : (
                    <Pause className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}

              {/* Progress bar (shown while speaking) */}
              {speaking && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-200 ease-out"
                    style={{ width: `${Math.round(speechProgress * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Ambient sound toggle */}
          <Button
            variant="outline"
            size="sm"
            className={`h-9 backdrop-blur-md ${
              ambientEnabled
                ? "border-purple-400/40 bg-purple-400/15 text-purple-100 hover:bg-purple-400/25 hover:text-purple-50"
                : "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            }`}
            onClick={toggleAmbient}
            title={
              ambientEnabled
                ? "Выключить космический ambuent"
                : "Включить космический ambuent (звук космоса)"
            }
          >
            <Music className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden md:inline">
              {ambientEnabled ? "Ambient" : "Космос"}
            </span>
          </Button>

          {/* Share button */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-white/15 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
            onClick={handleShareLink}
            title="Скопировать ссылку на этот вид (или Ctrl+L)"
          >
            {shareCopied ? (
              <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {shareCopied ? "Скопировано" : "Поделиться"}
            </span>
          </Button>

          {/* Screenshot button */}
          <Button
            variant="outline"
            size="sm"
            className={`h-9 backdrop-blur-md ${
              screenshotTaken
                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                : "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            }`}
            onClick={handleScreenshot}
            title="Сохранить PNG (горячая клавиша: S)"
          >
            {screenshotTaken ? (
              <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Camera className="mr-1.5 h-3.5 w-3.5" />
            )}
            <span className="hidden md:inline">
              {screenshotTaken ? "Сохранено" : "Снимок"}
            </span>
          </Button>

          {/* Find Milky Way */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-sky-400/30 bg-sky-400/10 text-sky-100 backdrop-blur-md hover:bg-sky-400/20 hover:text-sky-50"
            onClick={() => {
              setSelection({ type: "milkyWay" });
              goToTourStop(1, audioEnabled);
            }}
            title="Показать нашу Галактику"
          >
            <Star className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden md:inline">Найти нас</span>
          </Button>

          {/* Reset view */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-white/15 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
            onClick={handleResetView}
            title="Сбросить вид"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden lg:inline">Сбросить вид</span>
          </Button>

          {/* Timeline */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-white/15 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
            onClick={() => setTimelineOpen(true)}
            title="Таймлайн открытий (Hubble 1929 → Tully 2014)"
          >
            <History className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden lg:inline">История</span>
          </Button>

          {/* Comparison */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-white/15 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
            onClick={() => setComparisonOpen(true)}
            title="Сравнение с соседними сверхскоплениями"
          >
            <Orbit className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden lg:inline">Сравнение</span>
          </Button>

          {/* Subtitles toggle */}
          {speechSupported && (
            <Button
              variant="outline"
              size="icon"
              className={`h-9 w-9 backdrop-blur-md ${
                subtitlesEnabled
                  ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25 hover:text-emerald-50"
                  : "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => setSubtitlesEnabled((v) => !v)}
              title={subtitlesEnabled ? "Выключить субтитры" : "Включить субтитры"}
            >
              <Captions className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Export tour JSON */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-white/15 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
            onClick={handleExportTour}
            title="Экспорт данных тура в JSON"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>

          {/* About */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-white/15 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
            onClick={() => setAboutOpen(true)}
          >
            <Compass className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden lg:inline">О проекте</span>
          </Button>
        </div>
      </header>

      {/* Left panel: controls + legend */}
      <aside
        className={`absolute left-3 right-3 top-20 z-20 max-h-[calc(100vh-9rem)] space-y-3 overflow-y-auto pb-2 sm:left-5 sm:right-auto sm:top-24 sm:w-72 sm:max-h-[calc(100vh-7rem)] sm:overflow-y-auto sm:pb-0 ${
          panelsOpen ? "block" : "hidden sm:block"
        }`}
      >
        <ControlPanel
          visibleRegions={visibleRegions}
          showNeighbor={showNeighbor}
          showFlows={showFlows}
          showLaniakeaBoundary={showBoundary}
          showLabels={showLabels}
          useRealGalaxies={useRealGalaxies}
          enableBloom={enableBloom}
          enableParallax={enableParallax}
          onToggleRegion={handleToggleRegion}
          onToggleNeighbor={setShowNeighbor}
          onToggleFlows={setShowFlows}
          onToggleBoundary={setShowBoundary}
          onToggleLabels={setShowLabels}
          onToggleRealGalaxies={setUseRealGalaxies}
          onToggleBloom={setEnableBloom}
          onToggleParallax={setEnableParallax}
        />
        <LegendCard
          onShowInfo={() => setAboutOpen(true)}
          useRealGalaxies={useRealGalaxies}
        />
        <MiniMap
          cameraPos={cameraPos}
          cameraTarget={cameraTarget}
          tourIndex={tourIndex}
          onNavigate={handleMiniMapNavigate}
        />
      </aside>

      {/* Right panel: info on selection */}
      <aside
        className={`absolute right-3 top-20 z-30 w-72 sm:right-5 sm:top-24 sm:w-80 ${
          selection.type === "none" ? "hidden sm:block" : ""
        }`}
      >
        {selection.type !== "none" ? (
          <InfoPanel
            selection={selection}
            onClose={() => setSelection({ type: "none" })}
          />
        ) : (
          <div className="hidden rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:block">
            <p className="text-xs leading-relaxed text-white/70">
              <span className="font-medium text-amber-300">Подсказка:</span>{" "}
              вращайте сцену мышью, прокрутите для зума. Нажмите на цветную
              область, великую галактику или на Великий аттрактор, чтобы узнать
              больше.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/60">
              <div className="flex items-center gap-1.5">
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80">
                  ЛКМ
                </kbd>
                <span>вращать</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80">
                  Колесо
                </kbd>
                <span>зум</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80">
                  ПКМ
                </kbd>
                <span>двигать</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80">
                  Клик
                </kbd>
                <span>инфо</span>
              </div>
            </div>

            {/* Hotkeys section */}
            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-amber-300/80">
                Горячие клавиши
              </p>
              <div className="space-y-1 text-[11px] text-white/60">
                <HotkeyRow keys={["←", "→"]} action="тур назад/вперёд" />
                <HotkeyRow keys={["Space"]} action="аудио (голос: Дмитрий)" />
                <HotkeyRow keys={["M"]} action="найти нас" />
                <HotkeyRow keys={["R"]} action="сброс вида" />
                <HotkeyRow keys={["S"]} action="снимок PNG" />
                <HotkeyRow keys={["B"]} action="Bloom" />
                <HotkeyRow keys={["L"]} action="подписи" />
                <HotkeyRow keys={["P"]} action="параллакс" />
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Tour bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-14 z-30 flex justify-center px-4 sm:bottom-16">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-2 py-2 backdrop-blur-md sm:gap-3 sm:px-4">
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            onClick={handlePrevTour}
            title="Предыдущая точка"
            aria-label="Предыдущая точка"
          >
            <Crosshair className="h-4 w-4 rotate-180" />
          </button>
          <div className="min-w-0 flex-1 px-1 text-center sm:px-2">
            <p className="truncate text-xs font-semibold text-amber-200">
              {currentStop.label}
            </p>
            <p className="hidden truncate text-[10px] text-white/55 sm:block">
              {currentStop.hint}
            </p>
          </div>
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
            onClick={handleNextTour}
            title="Следующая точка"
            aria-label="Следующая точка"
          >
            <Crosshair className="h-4 w-4" />
          </button>
          {/* Tour counter */}
          <div className="ml-1 hidden items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60 sm:flex">
            {tourIndex + 1} / {TOUR_STOPS.length}
          </div>
        </div>
      </div>

      {/* Bottom stats footer */}
      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-4 sm:px-6 sm:pb-5">
        <div className="pointer-events-auto mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-5 gap-y-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-md">
          <Stat label="Диаметр" value="~520 млн св. лет" />
          <Dot />
          <Stat label="Галактик" value="~100 000" />
          <Dot />
          <Stat label="Масса" value="10¹⁷ M☉" />
          <Dot />
          <Stat label="Карта" value="2014" />
          <Dot />
          <Stat label="Каталог" value="Cosmicflows-2" />
        </div>
      </footer>

      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />

      {/* Timeline of discoveries dialog */}
      <TimelineDialog
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
        onFlyTo={handleTimelineFlyTo}
      />

      {/* Comparison with neighboring superclusters */}
      <ComparisonDialog open={comparisonOpen} onOpenChange={setComparisonOpen} />

      {/* Synchronized subtitles during audio narration */}
      <Subtitles
        text={speechCurrentText}
        speaking={speaking}
        progress={speechProgress}
        enabled={subtitlesEnabled}
      />

      {/* Scale ruler (shows real Mpc distances based on zoom) */}
      <ScaleRuler cameraPos={cameraPos} cameraTarget={cameraTarget} />

      {/* First-visit onboarding overlay */}
      <OnboardingOverlay
        onTourStart={() => {
          setTourIndex(1);
          setTourTrigger((t) => t + 1);
          setSelection({ type: "milkyWay" });
        }}
      />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-wide text-white/40">
        {label}
      </span>
      <span className="text-xs font-medium text-white/90">{value}</span>
    </div>
  );
}

function Dot() {
  return (
    <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:inline-block" />
  );
}

function Crosshair({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function HotkeyRow({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{action}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/80"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}
