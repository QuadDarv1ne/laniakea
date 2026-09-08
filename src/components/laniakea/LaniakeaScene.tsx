"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  GREAT_ATTRACTOR,
  REGIONS,
  NEIGHBOR,
  MILKY_WAY,
  type RegionKey,
} from "./data";
import {
  fetchGalaxiesFromAPI,
  supergalacticToCartesian,
  GALAXY_TYPE_COLORS,
  GALAXY_TYPE_SIZE,
  type Galaxy,
} from "./realGalaxies";
import { GalaxyShaderPointsMaterial } from "./GalaxyShader";
import { SpiralGalaxy } from "./SpiralGalaxy";

export interface SelectionState {
  type: "region" | "greatAttractor" | "neighbor" | "milkyWay" | "galaxy" | "none";
  key?: RegionKey;
  galaxy?: Galaxy;
}

interface LaniakeaSceneProps {
  visibleRegions: Record<RegionKey, boolean>;
  showNeighbor: boolean;
  showFlows: boolean;
  showLaniakeaBoundary: boolean;
  showLabels: boolean;
  useRealGalaxies: boolean;
  onSelect: (s: SelectionState) => void;
  onGalaxyDataStateChange?: (
    state:
      | { status: "disabled" }
      | { status: "loading" }
      | { status: "ready"; count: number }
      | { status: "error"; message: string },
  ) => void;
}

// Convert supergalactic coords to scene coords with a scale factor
// Real Laniakea diameter: ~160 Mpc → scene uses ~30 unit radius for main body
// So scale = 0.2 (1 Mpc = 0.2 scene units) - makes it consistent with region centers
const SCENE_SCALE = 0.7; // 1 Mpc -> 0.7 scene units (so 100 Mpc = 70 units, full diameter ~160 Mpc -> ~112 units)
// Actually we want to keep close to current scene scale (Great Attractor at origin)
// where Local supercluster center is at scene [12, 4, -3]
// Real distance MW -> Virgo cluster core = ~16.5 Mpc, MW -> GA = ~62 Mpc
// If we set: GA at origin (Milky Way at distance 62 Mpc from GA),
// then MW position = real distance from GA * direction
// For scene scale, 1 Mpc -> 0.6 scene units looks good

// Actually, the existing region positions in data.ts are in arbitrary scene units.
// The cleanest approach: keep the SCENE_SCALE such that real data fits in the existing scene.
// Largest real distances in dataset: ~75 Mpc. Existing scene radius ~30.
// So 1 Mpc -> 0.4 scene units gives 75 * 0.4 = 30 (fits!)
const MPC_TO_SCENE = 0.55;

/**
 * Generate galaxy cloud points from REAL supergalactic coordinates
 */
function buildRealGalaxyField(galaxies: Galaxy[]) {
  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];
  const clickable: { galaxy: Galaxy; position: THREE.Vector3; idx: number }[] = [];

  // Milky Way is at our origin reference (sgl=0, sgb=0, distance=0)
  // But the rest of Laniakea is in supergalactic coords centered on US
  // The Great Attractor in our scene is at origin, so we need to subtract
  // MW position relative to GA, OR: render galaxies at their SG positions,
  // then offset so GA is at origin.
  //
  // Actually simpler: Milky Way is at distance=0 in our dataset (by definition).
  // The GA (Norma cluster) is at ~62 Mpc away from us, in direction (162°, -5°).
  // To put GA at scene origin, we subtract its position from every galaxy's position.

  const gaPos = supergalacticToCartesian(
    162.0,
    -5.0,
    62 * MPC_TO_SCENE, // GA distance from MW
  );

  for (let i = 0; i < galaxies.length; i++) {
    const g = galaxies[i];
    // Skip MW - we'll render it separately as MilkyWayMarker
    if (g.distance === 0 && g.name === "Milky Way") continue;

    const [gx, gy, gz] = supergalacticToCartesian(
      g.sgl,
      g.sgb,
      g.distance * MPC_TO_SCENE,
    );
    // Offset so GA is at scene origin
    const x = gx - gaPos[0];
    // Flatten Y slightly to keep the "pancake" feel (superclusters are flat)
    const y = (gy - gaPos[1]) * 0.5;
    const z = gz - gaPos[2];

    positions.push(x, y, z);

    const color = new THREE.Color(GALAXY_TYPE_COLORS[g.type]);
    colors.push(color.r, color.g, color.b);

    // Size: based on type and magnitude
    let size = GALAXY_TYPE_SIZE[g.type];
    if (g.magnitude !== undefined) {
      // Brighter galaxies (more negative magnitude) are larger
      const brightnessFactor = Math.max(0.4, Math.min(2.5, (22 + g.magnitude) / 4));
      size *= brightnessFactor;
    }
    sizes.push(size);

    // Track notable galaxies for click interaction (only those with names, not "Galaxy N")
    if (g.name && !g.name.startsWith("Galaxy ")) {
      clickable.push({ galaxy: g, position: new THREE.Vector3(x, y, z), idx: i });
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    sizes: new Float32Array(sizes),
    clickable,
  };
}

/**
 * Background starfield - sparse points across a large sphere shell.
 */
function Starfield({ count = 4000 }: { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 80 + Math.random() * 80;
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  const positions2 = useMemo(() => {
    const n = Math.floor(count / 6);
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 60 + Math.random() * 30;
      arr[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={positions.length / 3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={0.16}
          sizeAttenuation
          transparent
          opacity={0.45}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions2, 3]}
            count={positions2.length / 3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#cde7ff"
          size={0.32}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/**
 * Particle cloud from real galaxy data with per-point colors and sizes.
 * Renders galaxies as point sprites using a custom shader for soft round points.
 */
function RealGalaxyCloud({
  positions,
  colors,
  sizes,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  onClick?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}) {
  return (
    <points
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={colors.length / 3}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={sizes.length}
        />
      </bufferGeometry>
      <GalaxyShaderPointsMaterial sizeScale={1.0} />
    </points>
  );
}

/**
 * Schematic galaxy cloud (fallback / stylized mode)
 */
function SchematicGalaxyCloud({
  positions,
  colors,
  sizes,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  onClick?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}) {
  return (
    <points
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={colors.length / 3}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={sizes.length}
        />
      </bufferGeometry>
      <GalaxyShaderPointsMaterial sizeScale={1.0} />
    </points>
  );
}

/**
 * Wireframe ellipsoid representing the boundary of one region.
 */
function RegionBoundary({
  center,
  radius,
  color,
}: {
  center: [number, number, number];
  radius: [number, number, number];
  color: string;
}) {
  const geom = useMemo(() => new THREE.SphereGeometry(1, 24, 16), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(geom), [geom]);
  return (
    <group position={center} scale={[radius[0], radius[1] * 0.6, radius[2]]}>
      <lineSegments geometry={edges}>
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </lineSegments>
    </group>
  );
}

/**
 * Great Attractor - a glowing pulsing sphere with spinning accretion-like rings.
 */
function GreatAttractorMesh({
  onSelect,
  showLabel,
}: {
  onSelect: () => void;
  showLabel: boolean;
}) {
  const innerRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const glow2Ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (innerRef.current) {
      const s = 1 + Math.sin(t * 1.5) * 0.1;
      innerRef.current.scale.setScalar(s);
    }
    if (glowRef.current) {
      const s = 1.6 + Math.sin(t * 1.5 + 0.5) * 0.14;
      glowRef.current.scale.setScalar(s);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.22 + (Math.sin(t * 1.5) + 1) * 0.06;
    }
    if (glow2Ref.current) {
      const s = 2.6 + Math.sin(t * 1.5 + 1.0) * 0.2;
      glow2Ref.current.scale.setScalar(s);
      (glow2Ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.08 + (Math.sin(t * 1.5 + 1) + 1) * 0.03;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.4;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.25;
      ring2Ref.current.rotation.y = Math.PI / 4 + Math.sin(t * 0.4) * 0.15;
    }
  });

  return (
    <group position={GREAT_ATTRACTOR.position}>
      {/* Inner core */}
      <mesh
        ref={innerRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial color="#fff5d6" toneMapped={false} />
      </mesh>
      {/* Inner glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial
          color="#ffb347"
          transparent
          opacity={0.25}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Outer wider halo */}
      <mesh ref={glow2Ref}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial
          color="#ff7e3f"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Spinning ring 1 */}
      <mesh ref={ringRef}>
        <ringGeometry args={[1.3, 1.5, 64]} />
        <meshBasicMaterial
          color="#ffb347"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Spinning ring 2 */}
      <mesh ref={ring2Ref}>
        <ringGeometry args={[1.8, 1.9, 64]} />
        <meshBasicMaterial
          color="#ffd6a5"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight color="#ffb347" intensity={3} distance={25} />

      {showLabel && (
        <Html
          position={[0, 2.4, 0]}
          center
          distanceFactor={28}
          occlude={false}
          zIndexRange={[20, 0]}
        >
          <div className="pointer-events-none select-none whitespace-nowrap rounded-full border border-amber-300/40 bg-amber-500/20 px-3 py-1 text-center backdrop-blur-md">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-100">
              Великий аттрактор
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Animated flow lines + traveling particles representing galaxy motion toward Great Attractor.
 */
function FlowLines({ count = 22 }: { count?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const { lineObjects, materials, particleObjs, particles } = useMemo(() => {
    const lines: THREE.Line[] = [];
    const mats: THREE.LineDashedMaterial[] = [];
    const parts: {
      mesh: THREE.Mesh;
      curve: THREE.CatmullRomCurve3;
      speed: number;
      offset: number;
    }[] = [];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 16 + Math.random() * 14;
      const start = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.6,
        r * Math.cos(phi),
      );
      const end = new THREE.Vector3(
        GREAT_ATTRACTOR.position[0] + (Math.random() - 0.5) * 0.5,
        GREAT_ATTRACTOR.position[1] + (Math.random() - 0.5) * 0.5,
        GREAT_ATTRACTOR.position[2] + (Math.random() - 0.5) * 0.5,
      );
      const mid = start
        .clone()
        .add(end)
        .multiplyScalar(0.5)
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
          ),
        );
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const pts = curve.getPoints(60);
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = new THREE.LineDashedMaterial({
        color: new THREE.Color("#ffd6a5"),
        transparent: true,
        opacity: 0.4,
        dashSize: 0.5,
        gapSize: 0.45,
        depthWrite: false,
      });
      m.userData.offset = (i * 0.13) % 1;
      const line = new THREE.Line(g, m);
      line.computeLineDistances();
      lines.push(line);
      mats.push(m);

      const pgeom = new THREE.SphereGeometry(0.12, 8, 8);
      const pmat = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ffe8b0"),
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(pgeom, pmat);
      parts.push({
        mesh,
        curve,
        speed: 0.04 + Math.random() * 0.04,
        offset: Math.random(),
      });
    }
    return {
      lineObjects: lines,
      materials: mats,
      particleObjs: parts,
      particles: parts,
    };
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    materials.forEach((m) => {
      m.opacity = 0.3 + (Math.sin(t * 1.5 + m.userData.offset * 6) + 1) * 0.2;
    });
    particles.forEach((p) => {
      const u = 1 - ((t * p.speed + p.offset) % 1);
      const pos = p.curve.getPointAt(u);
      p.mesh.position.copy(pos);
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.95 * (u < 0.15 ? u / 0.15 : 1);
    });
  });

  return (
    <group ref={groupRef}>
      {lineObjects.map((l, i) => (
        <primitive key={`l-${i}`} object={l} />
      ))}
      {particleObjs.map((p, i) => (
        <primitive key={`p-${i}`} object={p.mesh} />
      ))}
    </group>
  );
}

/**
 * Marker showing Milky Way position. Bright pulsing star with beam toward Great Attractor.
 * In real-galaxy mode, computes position from real coordinates so the marker matches the data.
 */
function MilkyWayMarker({
  position,
  onSelect,
  showLabel,
}: {
  position: [number, number, number];
  onSelect: () => void;
  showLabel: boolean;
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const halo2Ref = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  const { beamLength, beamQuat } = useMemo(() => {
    const mw = new THREE.Vector3(...position);
    const ga = new THREE.Vector3(...GREAT_ATTRACTOR.position);
    const dir = ga.clone().sub(mw);
    const length = dir.length();
    const quat = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    quat.setFromUnitVectors(up, dir.clone().normalize());
    return { beamLength: length, beamQuat: quat };
  }, [position]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (coreRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.2;
      coreRef.current.scale.setScalar(s);
    }
    if (haloRef.current) {
      const s = 1.6 + Math.sin(t * 2 + 0.5) * 0.25;
      haloRef.current.scale.setScalar(s);
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.4 + (Math.sin(t * 2) + 1) * 0.1;
    }
    if (halo2Ref.current) {
      const s = 3 + Math.sin(t * 2 + 1.2) * 0.4;
      halo2Ref.current.scale.setScalar(s);
      (halo2Ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.1 + (Math.sin(t * 2 + 1) + 1) * 0.04;
    }
    if (beamRef.current) {
      const m = beamRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.18 + (Math.sin(t * 1.2) + 1) * 0.07;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={coreRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshBasicMaterial color="#e8f4ff" toneMapped={false} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial
          color="#7ec8ff"
          transparent
          opacity={0.5}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={halo2Ref}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial
          color="#5db0ff"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={beamRef} position={[0, 0, 0]} quaternion={beamQuat}>
        <cylinderGeometry args={[0.025, 0.025, beamLength, 8]} />
        <meshBasicMaterial
          color="#a8d8ff"
          transparent
          opacity={0.25}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight color="#a8d8ff" intensity={1.5} distance={12} />

      {showLabel && (
        <Html
          position={[0, 1.8, 0]}
          center
          distanceFactor={28}
          occlude={false}
          zIndexRange={[20, 0]}
        >
          <div className="pointer-events-none select-none whitespace-nowrap rounded-full border border-sky-300/60 bg-sky-500/25 px-3 py-1 text-center backdrop-blur-md">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-100">
              Млечный Путь — мы здесь
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Clickable marker for notable named galaxies (M31, M87, etc.)
 * Spiral galaxies (Milky Way, Andromeda, M33) render as 3D rotating spirals.
 * Elliptical/cluster_core types render as glowing spheres.
 * Shows a hover tooltip with the galaxy name.
 */
function NamedGalaxyMarker({
  galaxy,
  position,
  onSelect,
}: {
  galaxy: Galaxy;
  position: [number, number, number];
  onSelect: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 1.5 + galaxy.sgl) * 0.15;
      ref.current.scale.setScalar(s);
    }
  });
  const color = GALAXY_TYPE_COLORS[galaxy.type];
  const distanceLy = (galaxy.distance * 3.262).toFixed(1);
  const isSpiral = galaxy.type === "spiral";

  // Scale spiral size by distance (closer = bigger)
  const spiralScale = Math.max(1.0, 3.0 - galaxy.distance * 0.02);

  return (
    <group position={position}>
      {/* For spiral galaxies, render a 3D rotating spiral disc */}
      {isSpiral && (
        <group
          scale={spiralScale}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
            setHovered(true);
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
            setHovered(false);
          }}
        >
          <SpiralGalaxy
            particleCount={3500}
            armCount={2}
            armTwist={3.5}
            discSize={1.6}
            bulgeSize={0.4}
            // Negative rotation = clockwise when viewed from above (north galactic pole).
            // The Milky Way rotates clockwise as seen from the north pole,
            // which is how we see it from inside (Sun orbits counter-clockwise
            // on the sky). This matches the real galactic rotation direction.
            rotationSpeed={-0.15}
            tilt={0.15}
          />
        </group>
      )}

      {/* For non-spiral galaxies, render a glowing sphere */}
      {!isSpiral && (
        <>
          <mesh
            ref={ref}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
              setHovered(true);
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
              setHovered(false);
            }}
          >
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} />
          </mesh>
          {/* subtle glow */}
          <mesh>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.18}
              side={THREE.BackSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, 1.5, 0]}
          center
          distanceFactor={20}
          occlude={false}
          zIndexRange={[30, 0]}
        >
          <div className="pointer-events-none select-none whitespace-nowrap rounded-md border border-white/20 bg-black/80 px-2.5 py-1.5 backdrop-blur-md">
            <div className="text-[11px] font-semibold text-white">
              {galaxy.name}
            </div>
            <div className="text-[10px] text-white/60">
              {distanceLy} млн св. лет
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * 3D label above a region center.
 */
function RegionLabel({
  position,
  text,
  color,
  visible,
}: {
  position: [number, number, number];
  text: string;
  color: string;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <Html
      position={[position[0], 5, position[2]]}
      center
      distanceFactor={40}
      occlude={false}
      zIndexRange={[15, 0]}
    >
      <div
        className="pointer-events-none select-none whitespace-nowrap rounded-full border bg-black/40 px-3 py-1 backdrop-blur-md"
        style={{ borderColor: `${color}66` }}
      >
        <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color }}>
          {text}
        </span>
      </div>
    </Html>
  );
}

/**
 * Outer translucent shell showing approximate boundary of Laniakea.
 */
function LaniakeaBoundary() {
  return (
    <mesh scale={[28, 12, 24]}>
      <sphereGeometry args={[1, 32, 24]} />
      <meshBasicMaterial
        color="#4cc9f0"
        transparent
        opacity={0.06}
        side={THREE.BackSide}
        depthWrite={false}
        wireframe
      />
    </mesh>
  );
}

/**
 * Main Laniakea scene contents.
 * When useRealGalaxies=true, fetches the ~18,000 galaxy dataset from /api/galaxies
 * and builds the cloud from real published supergalactic coords.
 * Otherwise, uses the schematic ellipsoidal distributions.
 */
export function LaniakeaScene({
  visibleRegions,
  showNeighbor,
  showFlows,
  showLaniakeaBoundary,
  showLabels,
  useRealGalaxies,
  onSelect,
  onGalaxyDataStateChange,
}: LaniakeaSceneProps) {
  // Async galaxy field state
  const [realField, setRealField] = useState<{
    positions: Float32Array;
    colors: Float32Array;
    sizes: Float32Array;
    clickable: { galaxy: Galaxy; position: THREE.Vector3; idx: number }[];
  } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch the full dataset from /api/galaxies when real mode is enabled.
  // The initial galaxyDataState is already "loading", so we don't need to
  // call onGalaxyDataStateChange synchronously in the effect body (which
  // would trigger setState-in-effect and potentially cause render loops).
  // We only call it from async callbacks (which is allowed by React).
  useEffect(() => {
    if (!useRealGalaxies) {
      // Schedule via microtask to avoid setState-in-effect
      Promise.resolve().then(() => {
        onGalaxyDataStateChange?.({ status: "disabled" });
      });
      return;
    }
    let cancelled = false;
    // Schedule the "loading" notification via microtask so it doesn't
    // run synchronously in the effect body (avoids setState-in-effect).
    Promise.resolve().then(() => {
      if (!cancelled) onGalaxyDataStateChange?.({ status: "loading" });
    });
    fetchGalaxiesFromAPI()
      .then((galaxies) => {
        if (cancelled) return;
        try {
          const field = buildRealGalaxyField(galaxies);
          setRealField(field);
          onGalaxyDataStateChange?.({ status: "ready", count: galaxies.length });
        } catch (buildErr) {
          setFetchError(
            buildErr instanceof Error ? buildErr.message : String(buildErr),
          );
          onGalaxyDataStateChange?.({
            status: "error",
            message: String(buildErr),
          });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setFetchError(err?.message ?? "Failed to load");
        onGalaxyDataStateChange?.({ status: "error", message: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [useRealGalaxies, onGalaxyDataStateChange]);

  // Schematic galaxy field (original)
  const schematicData = useMemo(() => {
    return REGIONS.map((r) => {
      const { positions, colors, sizes } = galaxyPoints(
        r.count,
        r.position,
        r.radius,
        r.color,
        r.coreColor,
      );
      return { def: r, positions, colors, sizes };
    });
  }, []);

  const neighborData = useMemo(
    () => galaxyPoints(
      NEIGHBOR.count,
      NEIGHBOR.position,
      NEIGHBOR.radius,
      NEIGHBOR.color,
      NEIGHBOR.coreColor,
    ),
    [],
  );

  // Milky Way position in real mode = position computed from real supergalactic coords
  // MW is at origin of our reference frame, then offset by GA position to put GA at scene origin
  const milkyWayPos: [number, number, number] = useMemo(() => {
    if (!useRealGalaxies) return MILKY_WAY.position;
    // MW is at sgl=0, sgb=0, distance=0 -> [0,0,0]
    // After offset by -gaPos, MW becomes at -gaPos
    const gaPos = supergalacticToCartesian(162.0, -5.0, 62 * MPC_TO_SCENE);
    return [-gaPos[0], -gaPos[1] * 0.5, -gaPos[2]];
  }, [useRealGalaxies]);

  return (
    <>
      <Starfield count={4000} />

      <ambientLight intensity={0.35} />
      <pointLight position={[20, 20, 20]} intensity={0.6} color="#88aaff" />
      <pointLight position={[-20, -10, -10]} intensity={0.3} color="#ff8866" />

      {showLaniakeaBoundary && <LaniakeaBoundary />}

      {/* Render either real galaxy field or schematic clouds */}
      {useRealGalaxies && realField ? (
        <>
          <RealGalaxyCloud
            positions={realField.positions}
            colors={realField.colors}
            sizes={realField.sizes}
            onClick={(e) => {
              e.stopPropagation();
              // If clicked near a named galaxy, select it
              if (realField.clickable.length > 0) {
                // Pick the closest named galaxy to intersection point
                const p = e.point;
                let closest = realField.clickable[0];
                let minDist = Infinity;
                for (const c of realField.clickable) {
                  const d = c.position.distanceTo(p);
                  if (d < minDist) {
                    minDist = d;
                    closest = c;
                  }
                }
                if (minDist < 3) {
                  onSelect({ type: "galaxy", galaxy: closest.galaxy });
                  return;
                }
              }
              // Otherwise default to selecting the largest region
              onSelect({ type: "region", key: "hydraCentaurus" });
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          />

          {/* Markers for notable named galaxies */}
          {realField.clickable.map(({ galaxy, position }, i) => (
            <NamedGalaxyMarker
              key={`g-${i}`}
              galaxy={galaxy}
              position={[position.x, position.y, position.z]}
              onSelect={() => onSelect({ type: "galaxy", galaxy })}
            />
          ))}
        </>
      ) : (
        // Schematic mode: per-region clouds
        schematicData.map(({ def, positions, colors, sizes }) =>
          visibleRegions[def.key] ? (
            <group key={def.key}>
              <SchematicGalaxyCloud
                positions={positions}
                colors={colors}
                sizes={sizes}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect({ type: "region", key: def.key });
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  document.body.style.cursor = "auto";
                }}
              />
              <RegionBoundary
                center={def.position}
                radius={def.radius}
                color={def.color}
              />
              <RegionLabel
                position={def.position}
                text={def.name}
                color={def.color}
                visible={showLabels}
              />
            </group>
          ) : null,
        )
      )}

      {/* Neighbor (schematic, only when shown and only in schematic mode) */}
      {showNeighbor && !useRealGalaxies && (
        <group>
          <SchematicGalaxyCloud
            positions={neighborData.positions}
            colors={neighborData.colors}
            sizes={neighborData.sizes}
            onClick={(e) => {
              e.stopPropagation();
              onSelect({ type: "neighbor" });
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
            }}
          />
          <RegionBoundary
            center={NEIGHBOR.position}
            radius={NEIGHBOR.radius}
            color={NEIGHBOR.color}
          />
          <RegionLabel
            position={NEIGHBOR.position}
            text={NEIGHBOR.name + " (сосед)"}
            color={NEIGHBOR.color}
            visible={showLabels}
          />
        </group>
      )}

      {/* Milky Way marker (always visible - it's our home) */}
      <MilkyWayMarker
        position={milkyWayPos}
        onSelect={() => onSelect({ type: "milkyWay" })}
        showLabel={showLabels}
      />

      {/* Great Attractor */}
      <GreatAttractorMesh
        onSelect={() => onSelect({ type: "greatAttractor" })}
        showLabel={showLabels}
      />

      {/* Flow lines + particles */}
      {showFlows && <FlowLines count={22} />}
    </>
  );
}

/* ---------- Helper: schematic galaxy points (kept for fallback mode) ---------- */

function galaxyPoints(
  count: number,
  center: [number, number, number],
  radius: [number, number, number],
  color: string,
  coreColor: string,
): { positions: Float32Array; colors: Float32Array; sizes: Float32Array } {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const cEdge = new THREE.Color(color);
  const cCore = new THREE.Color(coreColor);
  for (let i = 0; i < count; i++) {
    let x = 0;
    let y = 0;
    let z = 0;
    for (let k = 0; k < 3; k++) {
      x += Math.random() - 0.5;
      y += Math.random() - 0.5;
      z += Math.random() - 0.5;
    }
    x /= 3;
    y /= 3;
    z /= 3;
    const r = Math.pow(Math.random(), 0.55);
    positions[i * 3 + 0] = center[0] + x * radius[0] * 2 * r;
    positions[i * 3 + 1] = center[1] + y * radius[1] * 2 * r * 0.6;
    positions[i * 3 + 2] = center[2] + z * radius[2] * 2 * r;
    const t = Math.min(1, r * 1.4);
    const cr = cCore.r + (cEdge.r - cCore.r) * t;
    const cg = cCore.g + (cEdge.g - cCore.g) * t;
    const cb = cCore.b + (cEdge.b - cCore.b) * t;
    colors[i * 3 + 0] = cr;
    colors[i * 3 + 1] = cg;
    colors[i * 3 + 2] = cb;
    sizes[i] = 0.5 + Math.random() * 0.5 + (1 - r) * 0.8;
  }
  return { positions, colors, sizes };
}
