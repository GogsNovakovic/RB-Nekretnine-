import * as THREE from "three";
import { buildBuilding, cameraKeepOut, footprint } from "../building/building";
import { createMaterials } from "../building/materials";
import { VIEWER } from "./config";
import { Constraints, attachDoubleTap, attachKeyboard, createControls } from "./controls";
import { createEnvironment, createGround, createLights, direction } from "./environment";
import { Fit, collectFitPoints, fitToView } from "./framing";
import { MATCH, MatchCamera, VIEWS } from "./views";

export interface ViewerStats {
  drawCalls: number;
  triangles: number;
  meshes: number;
  pixelRatio: number;
  shadowMapSize: number;
  buildMs: number;
  /** Mean frame interval (ms) over the most recent continuous interaction, if any. */
  frameMs: number | null;
}

export interface Viewer {
  canvas: HTMLCanvasElement;
  /** Animate back to the fitted opening view. */
  reset(animate?: boolean): void;
  /** Enable or disable the controls; a locked canvas ignores the pointer and leaves the tab order. */
  setInteractive(on: boolean): void;
  /** Ease the camera `degrees` around the building over `durationMs`, multiplying its distance by `distanceFactor`. A pointer press cancels it. */
  orbitBy(degrees: number, durationMs: number, distanceFactor?: number): void;
  stats(): ViewerStats;
  dispose(): void;
}

/** Explicit opening view, in degrees (see config.ts for the axes). `fov` is the vertical field of view. */
export interface ViewAngles {
  azimuth: number;
  elevation: number;
  fov?: number;
}

export interface ViewerOptions {
  /** Reference-matching validation camera (img1, img2, img3, img5): fixed camera, no controls. */
  match?: string | null;
  /** Opening direction preset from views.ts (default "start"). */
  initialView?: string | null;
  /** Opening view: a preset name from views.ts or explicit angles. Takes precedence over `initialView`. */
  view?: string | ViewAngles | null;
  /** Fraction of the frame the fitted building may fill (default 1 − VIEWER.margin). */
  fitMargin?: number;
  /** Moves the rendered picture by these fractions of the canvas size; positive is right and down. */
  viewShift?: [number, number];
  /** Start with the controls enabled (default true). */
  interactive?: boolean;
  /** false: the mouse wheel scrolls the page and only zooms with Ctrl / Cmd held (trackpad pinch). Default true. */
  wheelZoom?: boolean;
  /** CSS touch-action for the canvas, applied after the controls set their own (default "none"). */
  touchAction?: string;
  onReady?: () => void;
  onError?: (reason: "webgl" | "build" | "context-lost") => void;
  /** First user interaction (used to fade the gesture hint). */
  onInteract?: () => void;
}

const R = VIEWER.render;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const TONE: Record<string, THREE.ToneMapping> = {
  neutral: THREE.NeutralToneMapping,
  agx: THREE.AgXToneMapping,
  aces: THREE.ACESFilmicToneMapping,
};

export function createViewer(container: HTMLElement, opts: ViewerOptions = {}): Viewer | null {
  const match: MatchCamera | undefined = opts.match ? MATCH[opts.match] : undefined;
  const touch = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  const maxDpr = touch ? R.maxPixelRatioTouch : R.maxPixelRatio;
  const shadowMapSize = touch ? R.shadowMapSizeTouch : R.shadowMapSize;

  let renderer: THREE.WebGLRenderer;
  try {
    // alpha: the canvas is transparent so the page behind it is the background
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (err) {
    console.error(err);
    opts.onError?.("webgl");
    return null;
  }
  let pixelRatio = Math.min(window.devicePixelRatio || 1, maxDpr);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = TONE[R.toneMapping];
  renderer.toneMappingExposure = R.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Static scene: shadows are rendered once and again only if the scene changes.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = "none";
  canvas.style.outline = "none";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "application");
  canvas.setAttribute("aria-roledescription", "3D viewer");
  canvas.setAttribute("aria-label", "3D model of the building exterior");
  container.appendChild(canvas);

  /* ------------------------------------------------------------ scene */
  const scene = new THREE.Scene();
  let building: THREE.Group;
  const t0 = performance.now();
  try {
    scene.environment = createEnvironment(renderer);
    scene.environmentIntensity = VIEWER.lighting.environmentIntensity;
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    building = buildBuilding(createMaterials(aniso));
  } catch (err) {
    console.error(err);
    renderer.dispose();
    canvas.remove();
    opts.onError?.("build");
    return null;
  }
  const buildMs = performance.now() - t0;
  scene.add(building);
  building.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(building);
  scene.add(createGround(footprint()));
  const { sun, hemi, bounce } = createLights(bounds, shadowMapSize);
  scene.add(sun, sun.target, hemi, bounce, bounce.target);
  const fitPoints = collectFitPoints(building);

  /* ----------------------------------------------------------- camera */
  const camera = new THREE.PerspectiveCamera(VIEWER.lens.fov, 1, VIEWER.lens.near, VIEWER.lens.far);
  // Must be registered before OrbitControls adds its own wheel listener, so it runs first and can stop it.
  const onWheelCapture = (e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) e.stopImmediatePropagation();
  };
  if (opts.wheelZoom === false) canvas.addEventListener("wheel", onWheelCapture, { capture: true, passive: true });
  const controls = createControls(camera, canvas);
  // OrbitControls has just set touch-action: none; override it only after that.
  if (opts.touchAction) canvas.style.touchAction = opts.touchAction;
  const limits = new Constraints(controls, cameraKeepOut(VIEWER.controls.wallClearance), bounds);
  if (match) controls.enabled = false;

  const viewSpec = (() => {
    const v = opts.view ?? opts.initialView;
    if (v && typeof v === "object") return v;
    return VIEWS[v ?? "start"] ?? VIEWS.start;
  })();
  const fixedFov = "fov" in viewSpec && typeof viewSpec.fov === "number" ? viewSpec.fov : null;
  const margin = typeof opts.fitMargin === "number" ? 1 - opts.fitMargin : VIEWER.margin;
  const shift = opts.viewShift ?? [0, 0];
  const startDir = direction(viewSpec.azimuth, viewSpec.elevation);
  const fitStart = (): Fit => fitToView(fitPoints, startDir, camera.fov, camera.aspect, margin);

  /** Vertical FOV: the lens on landscape screens, wider on portrait so the horizontal FOV holds. */
  const fovFor = (aspect: number) => {
    if (fixedFov !== null) return fixedFov;
    const minH = THREE.MathUtils.degToRad(VIEWER.lens.minHorizontalFov);
    const v = 2 * Math.atan(Math.tan(minH / 2) / aspect);
    return Math.max(VIEWER.lens.fov, THREE.MathUtils.radToDeg(v));
  };

  const applyMatch = (m: MatchCamera, w: number, h: number) => {
    camera.position.set(...m.position);
    if (m.dir && m.focal !== undefined && m.horizon !== undefined) {
      // level camera + vertical lens shift (two-point perspective, as in the renders)
      const f = m.focal * w;
      const fullH = 2 * m.horizon * h;
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(fullH / 2 / f));
      camera.aspect = w / fullH;
      camera.setViewOffset(w, fullH, 0, 0, w, h);
      camera.lookAt(m.position[0] + m.dir[0], m.position[1], m.position[2] + m.dir[1]);
    } else {
      camera.clearViewOffset();
      camera.fov = m.fov ?? 40;
      camera.aspect = w / h;
      camera.lookAt(...(m.target ?? [0, 4, 0]));
    }
    camera.updateProjectionMatrix();
  };

  /* ----------------------------------------------------- render loop */
  let raf = 0;
  let onScreen = true;
  let disposed = false;
  let ready = false;
  let pristine = true; // no user interaction since load / reset: resizes re-fit the view
  let tween: { p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3; start: number; dur: number } | null = null;
  let orbit: { from: THREE.Spherical; dTheta: number; r1: number; start: number; dur: number } | null = null;
  const orbitSph = new THREE.Spherical();
  const orbitOff = new THREE.Vector3();
  const intervals: number[] = [];
  let lastFrame = 0;
  let lastMean: number | null = null;

  const requestRender = () => {
    if (raf || disposed || !onScreen || document.hidden) return;
    raf = requestAnimationFrame(frame);
  };

  const frame = (now: number) => {
    raf = 0;
    let busy = false;
    if (!match) {
      if (tween) {
        const k = Math.min(1, (now - tween.start) / tween.dur);
        camera.position.lerpVectors(tween.p0, tween.p1, ease(k));
        controls.target.lerpVectors(tween.t0, tween.t1, ease(k));
        if (k >= 1) tween = null;
        busy = true;
      }
      if (orbit) {
        const k = Math.min(1, (now - orbit.start) / orbit.dur);
        const e = ease(k);
        orbitSph.set(orbit.from.radius + (orbit.r1 - orbit.from.radius) * e, orbit.from.phi, orbit.from.theta + orbit.dTheta * e);
        camera.position.copy(controls.target).add(orbitOff.setFromSpherical(orbitSph));
        camera.lookAt(controls.target);
        if (k >= 1) orbit = null;
        busy = true;
      }
      limits.beforeUpdate();
      busy = controls.update() || busy;
      busy = limits.afterUpdate() || busy;
    }
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      container.dataset.ready = "1";
      opts.onReady?.();
    }
    trackFrameRate(now, busy);
    if (busy) requestRender();
  };

  /** Adaptive resolution: while the view is moving, drop the pixel ratio if frames are slow. */
  const trackFrameRate = (now: number, busy: boolean) => {
    if (busy && lastFrame) {
      intervals.push(now - lastFrame);
      if (intervals.length >= 40) {
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        lastMean = mean;
        intervals.length = 0;
        if (R.adaptive && mean > 28 && pixelRatio > 1) {
          pixelRatio = Math.max(1, pixelRatio - 0.25);
          renderer.setPixelRatio(pixelRatio);
          resize();
        }
      }
    } else intervals.length = 0;
    lastFrame = busy ? now : 0;
  };

  const goTo = (fit: Fit, dir: THREE.Vector3, animate: boolean) => {
    const p1 = fit.target.clone().addScaledVector(dir, fit.distance);
    const t1 = fit.target.clone();
    limits.setMaxDistance(Math.max(fit.distance * VIEWER.controls.maxDistanceFactor, VIEWER.controls.minDistance * 2));
    if (animate) {
      tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1, t1, start: performance.now(), dur: VIEWER.controls.resetMs };
    } else {
      tween = null;
      camera.position.copy(p1);
      controls.target.copy(t1);
      camera.lookAt(t1);
    }
    requestRender();
  };

  const reset = (animate = true) => {
    if (match) return;
    pristine = true;
    orbit = null;
    goTo(fitStart(), startDir, animate);
  };

  const orbitBy = (degrees: number, durationMs: number, distanceFactor = 1) => {
    if (match) return;
    tween = null;
    pristine = false;
    const from = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    orbit = { from, dTheta: THREE.MathUtils.degToRad(degrees), r1: from.radius * distanceFactor, start: performance.now(), dur: Math.max(1, durationMs) };
    requestRender();
  };

  const setInteractive = (on: boolean) => {
    if (match) return;
    controls.enabled = on;
    canvas.style.pointerEvents = on ? "" : "none";
    canvas.tabIndex = on ? 0 : -1;
    if (!on && document.activeElement === canvas) canvas.blur();
  };
  setInteractive(opts.interactive !== false);

  /* ---------------------------------------------------------- resize */
  const resize = () => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    if (match) {
      applyMatch(match, w, h);
    } else {
      const oldFov = camera.fov;
      camera.aspect = w / h;
      camera.fov = fovFor(camera.aspect);
      if (shift[0] || shift[1]) camera.setViewOffset(w, h, -shift[0] * w, -shift[1] * h, w, h);
      camera.updateProjectionMatrix();
      if (pristine) {
        const fit = fitStart();
        goTo(fit, startDir, false);
      } else if (Math.abs(oldFov - camera.fov) > 1e-3) {
        // keep the apparent size when the lens changes (e.g. phone rotated)
        const k = Math.tan(THREE.MathUtils.degToRad(oldFov / 2)) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const off = camera.position.clone().sub(controls.target).multiplyScalar(k);
        camera.position.copy(controls.target).add(off);
      }
    }
    requestRender();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  /* ------------------------------------------------------ listeners */
  const onStart = () => {
    tween = null;
    orbit = null;
    if (pristine) {
      pristine = false;
      opts.onInteract?.();
    }
  };
  controls.addEventListener("start", onStart);
  controls.addEventListener("change", requestRender);
  // A press cancels a scripted orbit even if it never becomes a drag (e.g. a vertical swipe the page takes over).
  const onPointerDown = () => {
    orbit = null;
  };
  canvas.addEventListener("pointerdown", onPointerDown);
  const detachKeys = attachKeyboard(
    canvas,
    controls,
    () => {
      onStart();
      requestRender();
    },
    () => reset(true),
  );
  const detachTap = attachDoubleTap(canvas, () => reset(true));

  const io = new IntersectionObserver((entries) => {
    onScreen = entries.some((e) => e.isIntersecting);
    if (onScreen) requestRender();
  });
  io.observe(container);
  const onVisibility = () => {
    if (!document.hidden) requestRender();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
    opts.onError?.("context-lost");
  };
  const onRestored = () => {
    renderer.shadowMap.needsUpdate = true;
    ready = false;
    requestRender();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  requestRender();

  return {
    canvas,
    reset,
    setInteractive,
    orbitBy,
    stats() {
      let meshes = 0;
      building.traverse((o) => {
        if (o instanceof THREE.Mesh) meshes++;
      });
      return {
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        meshes,
        pixelRatio,
        shadowMapSize,
        buildMs: Math.round(buildMs),
        frameMs: lastMean === null ? null : Math.round(lastMean * 10) / 10,
      };
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("change", requestRender);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("wheel", onWheelCapture, { capture: true });
      detachKeys();
      detachTap();
      controls.dispose();
      const textures = new Set<THREE.Texture>();
      const materials = new Set<THREE.Material>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m);
        }
        if (o instanceof THREE.InstancedMesh) o.dispose();
      });
      for (const m of materials) {
        for (const v of Object.values(m)) if (v instanceof THREE.Texture) textures.add(v);
        m.dispose();
      }
      textures.forEach((t) => t.dispose());
      scene.environment?.dispose();
      sun.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
