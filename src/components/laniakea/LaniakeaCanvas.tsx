"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { Suspense } from "react";
import { LaniakeaScene, type SelectionState } from "./LaniakeaScene";
import { REGIONS, GREAT_ATTRACTOR, MILKY_WAY, type RegionKey } from "./data";
import { supergalacticToCartesian } from "./realGalaxies";

interface LaniakeaCanvasProps {
  visibleRegions: Record<RegionKey, boolean>;
  showNeighbor: boolean;
  showFlows: boolean;
  showLaniakeaBoundary: boolean;
  showLabels: boolean;
  useRealGalaxies: boolean;
  enableBloom: boolean;
  enableParallax: boolean;
  onSelect: (s: SelectionState) => void;
  onBackgroundClick: () => void;
  onCameraMove?: (pos: THREE.Vector3, target: THREE.Vector3) => void;
  onGalaxyDataStateChange?: Parameters<typeof LaniakeaScene>[0]["onGalaxyDataStateChange"];
  /** When this number changes, fly the camera to the tour point identified by `tourIndex`. */
  tourTrigger: number;
  /** Index of the target tour point. */
  tourIndex: number;
  /** When set, immediately apply this camera position */
  appliedCameraPos?: [number, number, number] | null;
  /** When set, immediately apply this camera target */
  appliedCameraTarget?: [number, number, number] | null;
  /** Ref callback that receives the underlying canvas DOM element (for screenshots). */
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}

interface TourPoint {
  position: [number, number, number];
  target: [number, number, number];
  label: string;
  key: string;
}

// MPC_TO_SCENE must match the value in LaniakeaScene.tsx
const MPC_TO_SCENE = 0.55;

// Compute MW position in scene space (when in real mode)
const GA_SCENE = supergalacticToCartesian(162.0, -5.0, 62 * MPC_TO_SCENE);
const MW_SCENE: [number, number, number] = [
  -GA_SCENE[0],
  -GA_SCENE[1] * 0.5,
  -GA_SCENE[2],
];

const TOUR_POINTS: TourPoint[] = [
  {
    position: [38, 22, 38],
    target: [0, 0, 0],
    label: "Обзор Ланиакеи",
    key: "overview",
  },
  {
    // Position camera close to Milky Way
    position: [
      MW_SCENE[0] + 8,
      MW_SCENE[1] + 5,
      MW_SCENE[2] + 8,
    ],
    target: MW_SCENE,
    label: "Млечный Путь",
    key: "milkyway",
  },
  {
    position: [10, 6, 12],
    target: GREAT_ATTRACTOR.position,
    label: "Великий аттрактор",
    key: "greatAttractor",
  },
  {
    position: [12, 6, 12],
    target: REGIONS[1].position,
    label: "Гидра-Центавр",
    key: "hydraCentaurus",
  },
  {
    position: [0, -2, 18],
    target: REGIONS[2].position,
    label: "Павлин-Индеец",
    key: "pavoIndus",
  },
  {
    position: [18, -4, -6],
    target: REGIONS[3].position,
    label: "Южное сверхскопление",
    key: "southern",
  },
  {
    position: [22, 10, 0],
    target: REGIONS[0].position,
    label: "Местное сверхскопление",
    key: "local",
  },
];

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Camera controller that smoothly flies to a tour point.
 * Watches `tourTrigger` - each increment starts an animation to TOUR_POINTS[tourIndex].
 * Uses refs only - no setState in effects.
 * Also reports camera moves up via onCameraMove callback (throttled).
 * Adds an idle parallax drift based on mouse position when no user interaction.
 */
function CameraRig({
  tourTrigger,
  tourIndex,
  controlsRef,
  appliedCameraPos,
  appliedCameraTarget,
  onCameraMove,
  enableParallax,
}: {
  tourTrigger: number;
  tourIndex: number;
  controlsRef: React.MutableRefObject<any>;
  appliedCameraPos?: [number, number, number] | null;
  appliedCameraTarget?: [number, number, number] | null;
  onCameraMove?: (pos: THREE.Vector3, target: THREE.Vector3) => void;
  enableParallax: boolean;
}) {
  const { camera, gl } = useThree();
  const animatingRef = useRef(false);
  const startTimeRef = useRef(0);
  const startPosRef = useRef(new THREE.Vector3());
  const endPosRef = useRef(new THREE.Vector3());
  const startTargetRef = useRef(new THREE.Vector3());
  const endTargetRef = useRef(new THREE.Vector3());
  const lastReportRef = useRef(0);

  // Parallax state
  const lastInteractionRef = useRef(performance.now());
  const mouseRef = useRef({ x: 0, y: 0 });
  const parallaxOffsetRef = useRef(new THREE.Vector3());
  const baseCameraPosRef = useRef(new THREE.Vector3());
  const tempVecRef = useRef(new THREE.Vector3());

  // Track mouse position for parallax (window-level)
  useEffect(() => {
    if (!enableParallax) return;
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to [-1, 1]
      const w = window.innerWidth;
      const h = window.innerHeight;
      mouseRef.current.x = (e.clientX / w) * 2 - 1;
      mouseRef.current.y = (e.clientY / h) * 2 - 1;
      // Any mouse movement counts as interaction for a brief moment
      lastInteractionRef.current = performance.now();
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [enableParallax]);

  // Listen for OrbitControls interaction (start/stop)
  useEffect(() => {
    if (!enableParallax) return;
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      lastInteractionRef.current = performance.now();
    };
    controls.addEventListener("start", onStart);
    return () => {
      controls.removeEventListener("start", onStart);
    };
  }, [enableParallax, controlsRef]);

  // Tour trigger - fly to TOUR_POINTS[tourIndex]
  useEffect(() => {
    if (tourTrigger === 0) return;
    const idx =
      ((tourIndex % TOUR_POINTS.length) + TOUR_POINTS.length) %
      TOUR_POINTS.length;
    const tp = TOUR_POINTS[idx];
    if (!tp) return;
    startPosRef.current.copy(camera.position);
    endPosRef.current.set(...tp.position);
    if (controlsRef.current) {
      startTargetRef.current.copy(controlsRef.current.target);
    }
    endTargetRef.current.set(...tp.target);
    startTimeRef.current = performance.now();
    animatingRef.current = true;
    lastInteractionRef.current = performance.now();
  }, [tourTrigger, tourIndex, camera, controlsRef]);

  // Applied camera position (from URL state) - instant snap, no animation
  useEffect(() => {
    if (!appliedCameraPos) return;
    camera.position.set(...appliedCameraPos);
    if (controlsRef.current && appliedCameraTarget) {
      controlsRef.current.target.set(...appliedCameraTarget);
      controlsRef.current.update();
    }
  }, [appliedCameraPos, appliedCameraTarget, camera, controlsRef]);

  useFrame(() => {
    const now = performance.now();

    if (animatingRef.current) {
      const duration = 1800; // ms
      const elapsed = now - startTimeRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(t);

      camera.position.lerpVectors(
        startPosRef.current,
        endPosRef.current,
        eased,
      );
      if (controlsRef.current) {
        const newTarget = new THREE.Vector3().lerpVectors(
          startTargetRef.current,
          endTargetRef.current,
          eased,
        );
        controlsRef.current.target.copy(newTarget);
        controlsRef.current.update();
      }

      if (t >= 1) {
        animatingRef.current = false;
      }
    } else if (enableParallax) {
      // Idle parallax: after 2s of no interaction, drift camera slightly based on mouse
      const idleTime = now - lastInteractionRef.current;
      const idleFactor = Math.min(1, Math.max(0, (idleTime - 1500) / 1500));
      if (idleFactor > 0) {
        // Save base position if we just entered idle
        if (baseCameraPosRef.current.lengthSq() === 0) {
          baseCameraPosRef.current.copy(camera.position);
        }
        // Compute target parallax offset: small drift (±2 units)
        const targetX = mouseRef.current.x * 2.5;
        const targetY = -mouseRef.current.y * 1.5; // inverted Y (mouse down = camera down)
        // Lerp the parallax offset toward the target
        parallaxOffsetRef.current.x +=
          (targetX - parallaxOffsetRef.current.x) * 0.04;
        parallaxOffsetRef.current.y +=
          (targetY - parallaxOffsetRef.current.y) * 0.04;
        parallaxOffsetRef.current.z = 0;
        // Apply offset scaled by idleFactor (fade in).
        // Use a temp Vector3 and copy to camera.position to avoid mutating
        // individual components of a hook-returned value.
        const newX =
          baseCameraPosRef.current.x + parallaxOffsetRef.current.x * idleFactor;
        const newY =
          baseCameraPosRef.current.y + parallaxOffsetRef.current.y * idleFactor;
        const newZ = baseCameraPosRef.current.z;
        tempVecRef.current.set(newX, newY, newZ);
        camera.position.copy(tempVecRef.current);
        if (controlsRef.current) {
          controlsRef.current.update();
        }
      } else {
        // Reset base position when not idle
        if (baseCameraPosRef.current.lengthSq() > 0) {
          // Restore base position smoothly
          tempVecRef.current.copy(camera.position);
          tempVecRef.current.lerp(baseCameraPosRef.current, 0.1);
          camera.position.copy(tempVecRef.current);
          if (controlsRef.current) controlsRef.current.update();
          // Once close enough, clear
          if (camera.position.distanceTo(baseCameraPosRef.current) < 0.05) {
            camera.position.copy(baseCameraPosRef.current);
            baseCameraPosRef.current.set(0, 0, 0);
            parallaxOffsetRef.current.set(0, 0, 0);
          }
        }
      }
    }

    // Throttled reporting of camera position (for URL syncing)
    if (onCameraMove && controlsRef.current) {
      if (now - lastReportRef.current > 500) {
        lastReportRef.current = now;
        // Only report if not currently in parallax drift (to avoid URL spam)
        const idleTime = now - lastInteractionRef.current;
        if (idleTime < 1500) {
          onCameraMove(
            camera.position.clone(),
            controlsRef.current.target.clone(),
          );
        }
      }
    }
  });

  return null;
}

export function LaniakeaCanvas({
  visibleRegions,
  showNeighbor,
  showFlows,
  showLaniakeaBoundary,
  showLabels,
  useRealGalaxies,
  enableBloom,
  enableParallax,
  onSelect,
  onBackgroundClick,
  onCameraMove,
  onGalaxyDataStateChange,
  tourTrigger,
  tourIndex,
  appliedCameraPos,
  appliedCameraTarget,
  onCanvasReady,
}: LaniakeaCanvasProps) {
  const controlsRef = useRef<any>(null);

  return (
    <Canvas
      camera={{ position: [38, 22, 38], fov: 50, near: 0.1, far: 500 }}
      // preserveDrawingBuffer is required for canvas.toDataURL() screenshots
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      onPointerMissed={() => onBackgroundClick()}
      onCreated={({ gl }) => {
        // Report the canvas element up so the parent can take screenshots
        onCanvasReady?.(gl.domElement);
      }}
      dpr={[1, 2]}
    >
      <color attach="background" args={["#02030a"]} />
      <fog attach="fog" args={["#02030a", 100, 220]} />

      <Suspense fallback={null}>
        <LaniakeaScene
          visibleRegions={visibleRegions}
          showNeighbor={showNeighbor}
          showFlows={showFlows}
          showLaniakeaBoundary={showLaniakeaBoundary}
          showLabels={showLabels}
          useRealGalaxies={useRealGalaxies}
          onSelect={onSelect}
          onGalaxyDataStateChange={onGalaxyDataStateChange}
        />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        panSpeed={0.6}
        minDistance={6}
        maxDistance={130}
        target={[0, 0, 0]}
        onChange={() => {
          if (onCameraMove && controlsRef.current) {
            onCameraMove(
              controlsRef.current.object.position.clone(),
              controlsRef.current.target.clone(),
            );
          }
        }}
      />

      <CameraRig
        tourTrigger={tourTrigger}
        tourIndex={tourIndex}
        controlsRef={controlsRef}
        appliedCameraPos={appliedCameraPos}
        appliedCameraTarget={appliedCameraTarget}
        onCameraMove={onCameraMove}
        enableParallax={enableParallax}
      />

      {/* Postprocessing: Bloom for real glow on bright objects, Vignette for depth */}
      {enableBloom && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={1.4}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={0.85}
            levels={8}
          />
          <Vignette eskil={false} offset={0.2} darkness={0.8} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  );
}

export { TOUR_POINTS };
