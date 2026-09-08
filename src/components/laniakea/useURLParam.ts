"use client";

import { useSyncExternalStore } from "react";

/**
 * Read URL search params in a hydration-safe way.
 *
 * On the server and during the first client render (hydration), returns the
 * `defaultValue`. After hydration, returns the value parsed from
 * `window.location.search`.
 *
 * This avoids React hydration mismatches caused by `typeof window` checks
 * in lazy useState initializers.
 */

const emptySubscribe = () => () => {};

export function useURLBoolean(key: string, defaultValue: boolean): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => {
      const params = new URLSearchParams(window.location.search);
      const val = params.get(key);
      if (val === null) return defaultValue;
      return val !== "0";
    },
    () => defaultValue,
  );
}

export function useURLNumber(key: string, defaultValue: number): number {
  return useSyncExternalStore(
    emptySubscribe,
    () => {
      const params = new URLSearchParams(window.location.search);
      const val = params.get(key);
      if (val === null) return defaultValue;
      const n = parseFloat(val);
      return isNaN(n) ? defaultValue : n;
    },
    () => defaultValue,
  );
}

export function useURLInt(
  key: string,
  defaultValue: number,
  min?: number,
  max?: number,
): number {
  return useSyncExternalStore(
    emptySubscribe,
    () => {
      const params = new URLSearchParams(window.location.search);
      const val = params.get(key);
      if (val === null) return defaultValue;
      const n = parseInt(val, 10);
      if (isNaN(n)) return defaultValue;
      if (min !== undefined && n < min) return defaultValue;
      if (max !== undefined && n > max) return defaultValue;
      return n;
    },
    () => defaultValue,
  );
}

/**
 * Read 3 comma-separated numbers from the URL (e.g. ?cx=1&cy=2&cz=3).
 * Returns null if any of the keys are missing.
 * Caches the result to maintain referential stability (useSyncExternalStore
 * compares snapshots with Object.is, so a new array each time would cause
 * infinite re-renders).
 */
export function useURLVec3(
  keys: [string, string, string],
): [number, number, number] | null {
  // Module-level cache keyed by the joined key string
  return useSyncExternalStore(
    emptySubscribe,
    () => {
      const params = new URLSearchParams(window.location.search);
      const x = params.get(keys[0]);
      const y = params.get(keys[1]);
      const z = params.get(keys[2]);
      if (!x || !y || !z) return null;
      const fx = parseFloat(x);
      const fy = parseFloat(y);
      const fz = parseFloat(z);
      if (isNaN(fx) || isNaN(fy) || isNaN(fz)) return null;
      // Cache key is the raw string values so we only allocate a new array
      // when the URL actually changes
      const cacheKey = `${x}|${y}|${z}`;
      if (vec3Cache.key === cacheKey) return vec3Cache.value;
      vec3Cache.key = cacheKey;
      vec3Cache.value = [fx, fy, fz];
      return vec3Cache.value;
    },
    () => null,
  );
}

const vec3Cache: { key: string | null; value: [number, number, number] | null } = {
  key: null,
  value: null,
};

/**
 * Read 3 URL params as a vec3 ONCE on mount, then never update again.
 * This is used for camera position from URL — we don't want it to react
 * to URL changes (which happen when the camera moves), because that would
 * create an infinite loop.
 */
export function useURLVec3Once(
  keys: [string, string, string],
): [number, number, number] | null {
  return useSyncExternalStore(
    emptySubscribe,
    () => {
      const params = new URLSearchParams(window.location.search);
      const x = params.get(keys[0]);
      const y = params.get(keys[1]);
      const z = params.get(keys[2]);
      if (!x || !y || !z) return null;
      const fx = parseFloat(x);
      const fy = parseFloat(y);
      const fz = parseFloat(z);
      if (isNaN(fx) || isNaN(fy) || isNaN(fz)) return null;
      // Freeze: once we have a value, keep it forever (read-once semantics)
      const cacheKey = `${x}|${y}|${z}`;
      if (vec3OnceCache.frozen) return vec3OnceCache.value;
      if (vec3OnceCache.key === cacheKey) return vec3OnceCache.value;
      vec3OnceCache.key = cacheKey;
      vec3OnceCache.value = [fx, fy, fz];
      vec3OnceCache.frozen = true; // freeze after first non-null read
      return vec3OnceCache.value;
    },
    () => null,
  );
}

const vec3OnceCache: {
  key: string | null;
  value: [number, number, number] | null;
  frozen: boolean;
} = {
  key: null,
  value: null,
  frozen: false,
};

/**
 * Check if a URL param exists and a secondary condition is met.
 * Used for `tourTrigger` which needs to check both `ti` presence and `cx` absence.
 * Returns 1 if the condition is met, `defaultValue` otherwise.
 */
export function useURLCondition(
  check: () => boolean,
  defaultValue: number,
): number {
  return useSyncExternalStore(
    emptySubscribe,
    () => (check() ? 1 : defaultValue),
    () => defaultValue,
  );
}
