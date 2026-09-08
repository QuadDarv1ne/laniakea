"use client";

import * as THREE from "three";
import { useMemo } from "react";

/**
 * Custom shader material that renders galaxy points as soft round glowing dots
 * instead of hard square pixels. Each point has:
 *   - A circular falloff (gaussian-like) so edges fade smoothly
 *   - A bright core that triggers Bloom postprocessing for real glow
 *   - Per-point size and color (via attributes)
 *
 * This is the single biggest visual quality upgrade — square points look
 * "digital", round glowing points look like real stars/galaxies.
 */

const vertexShader = /* glsl */ `
  attribute float size;
  attribute vec3 color;

  varying vec3 vColor;
  varying float vSize;

  uniform float uPixelRatio;
  uniform float uSizeScale;

  void main() {
    vColor = color;
    vSize = size * uSizeScale;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation: closer points are bigger (perspective)
    gl_PointSize = vSize * uPixelRatio * (300.0 / -mvPosition.z);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vSize;

  void main() {
    // Convert from pixel coords to [-1, 1] range centered on the point
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float dist = length(uv);

    // Discard outside the unit circle (makes the point round, not square)
    if (dist > 1.0) discard;

    // Soft radial falloff: bright core, fading edges
    // Use a combination of gaussian and power for a nice glow
    float core = exp(-dist * dist * 8.0);       // tight bright core
    float glow = pow(1.0 - dist, 2.5) * 0.6;     // soft outer glow
    float alpha = core + glow;

    // Brightness boost for the center so Bloom picks it up
    float brightness = 1.0 + core * 1.5;

    vec3 finalColor = vColor * brightness;
    // Clamp to avoid blowing out completely white (keeps color visible)
    finalColor = min(finalColor, vec3(2.5));

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export interface GalaxyShaderMaterialProps {
  sizeScale?: number;
  transparent?: boolean;
  depthWrite?: boolean;
  blending?: THREE.BlendingMode;
}

export function useGalaxyShaderMaterial(
  props: GalaxyShaderMaterialProps = {},
) {
  const {
    sizeScale = 1.0,
    transparent = true,
    depthWrite = false,
    blending = THREE.AdditiveBlending,
  } = props;

  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: {
          value:
            typeof window !== "undefined"
              ? Math.min(window.devicePixelRatio, 2)
              : 1,
        },
        uSizeScale: { value: sizeScale },
      },
      vertexShader,
      fragmentShader,
      transparent,
      depthWrite,
      depthTest: true,
      blending,
    });
    return m;
  }, [sizeScale, transparent, depthWrite, blending]);

  return material;
}

/**
 * Component version of the galaxy shader material — attaches to a <points> element.
 * Usage:
 *   <points>
 *     <bufferGeometry>...</bufferGeometry>
 *     <primitive object={material} attach="material" />
 *   </points>
 */
export function GalaxyShaderPointsMaterial(
  props: GalaxyShaderMaterialProps,
) {
  const material = useGalaxyShaderMaterial(props);
  return <primitive object={material} attach="material" />;
}
