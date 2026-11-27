/**
 * Embeddable entry point. Bundled by scripts/build-viewer.mjs into dist/viewer.js
 * (IIFE, global `BuildingViewer`, Three.js included) for pages without a bundler:
 *
 *   const v = BuildingViewer.mountViewer(element, { view: { azimuth: 150, elevation: 4, fov: 30 }, interactive: false });
 *   v.setInteractive(true); v.orbitBy(-24, 2200, 1.24); v.reset(); v.dispose();
 *
 * The viewer fills `container` (give it a size) and renders only when something changes.
 */
import { createViewer, type ViewAngles } from "./createViewer";

export interface MountOptions {
  /** A preset name from views.ts or explicit angles in degrees. */
  view?: string | ViewAngles;
  /** Start unlocked (default true). */
  interactive?: boolean;
  /** false: the wheel scrolls the page; Ctrl / Cmd + wheel and trackpad pinch still zoom. */
  wheelZoom?: boolean;
  /** CSS touch-action for the canvas, e.g. "pan-y" so a vertical swipe scrolls the page. */
  touchAction?: string;
  /** Fraction of the frame the fitted building fills. */
  fitMargin?: number;
  /** [x, y] picture shift as fractions of the stage size; positive is right and down. */
  viewShift?: [number, number];
  onReady?: () => void;
  onError?: (reason: "webgl" | "build" | "context-lost") => void;
  onInteract?: () => void;
}

export interface MountedViewer {
  canvas: HTMLCanvasElement;
  setInteractive(on: boolean): void;
  /** Animate back to `options.view`. */
  reset(): void;
  orbitBy(degrees: number, durationMs: number, distanceFactor?: number): void;
  dispose(): void;
}

/** Throws if WebGL or the model cannot be created, so callers can fall back to a static picture. */
export function mountViewer(container: HTMLElement, options: MountOptions = {}): MountedViewer {
  let failure: string | null = null;
  const viewer = createViewer(container, {
    ...options,
    onError: (reason) => {
      failure = reason;
      options.onError?.(reason);
    },
  });
  if (!viewer) throw new Error(`Building viewer could not start (${failure ?? "unknown"})`);
  return {
    canvas: viewer.canvas,
    setInteractive: viewer.setInteractive,
    reset: () => viewer.reset(true),
    orbitBy: viewer.orbitBy,
    dispose: viewer.dispose,
  };
}

/** True if the browser can create a WebGL2 context. */
export function supportsWebGL2(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
