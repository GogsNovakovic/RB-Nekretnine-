import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildBuilding } from "../building/building";
import { createMaterials } from "../building/materials";
import { EAVE_X, EAVE_Z, HD, HW, REAR, SOFFIT_Y, roofHeightAt } from "../building/spec";
import { createEnvironment, createGround, createLights, createSky, createTreeLine } from "./environment";
import { MATCH, MatchCamera, VIEWS } from "./views";

export interface Viewer {
  setView(id: string, animate?: boolean): void;
  setAutoRotate(on: boolean): void;
  dispose(): void;
}

export interface ViewerOptions {
  /** Reference-matching validation camera id (img1, img2, img3, img5) or "custom". */
  match?: string | null;
  /** For match = "custom": explicit camera (inspection screenshots). */
  custom?: MatchCamera;
  initialView?: string;
  onReady?: () => void;
  onViewChange?: (id: string | null) => void;
}

const TARGET_MIN = new THREE.Vector3(-7, 1.2, -6);
const TARGET_MAX = new THREE.Vector3(7, 9, 5);
/** Solid volume the camera may not enter (walls + rear projections), below the eaves. */
const SOLID = { x0: -HW - 0.45, x1: HW - REAR.frame.u0 + 0.4, z0: -HD - REAR.central.projection - REAR.boxBalcony.depth - 0.4, z1: HD + 0.35, y1: SOFFIT_Y + 0.05 };

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createViewer(container: HTMLElement, opts: ViewerOptions = {}): Viewer {
  const match = opts.match === "custom" ? opts.custom : opts.match ? MATCH[opts.match] : undefined;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.touchAction = "none";
  renderer.domElement.setAttribute("aria-label", "Interactive 3D model of the building exterior. Drag to orbit, scroll or pinch to zoom.");
  renderer.domElement.setAttribute("role", "img");
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = createEnvironment(renderer);
  scene.environmentIntensity = 0.85;
  scene.fog = new THREE.Fog("#d9c3a6", 170, 560);

  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const materials = createMaterials(aniso);
  const building = buildBuilding(materials);
  scene.add(building);
  scene.add(createGround(materials.grass));
  scene.add(createSky());
  scene.add(createTreeLine());
  const { sun, hemi, bounce } = createLights();
  scene.add(sun, sun.target, hemi, bounce, bounce.target);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 2500);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.minDistance = 11;
  controls.maxDistance = 85;
  controls.minPolarAngle = 0.02;
  controls.maxPolarAngle = Math.PI / 2 - 0.025;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.7;
  controls.screenSpacePanning = true;
  controls.autoRotateSpeed = 0.55;

  let tween: { p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3; start: number; dur: number } | null = null;
  controls.addEventListener("start", () => {
    if (tween) tween = null;
    opts.onViewChange?.(null);
  });

  const applyMatch = (m: MatchCamera, w: number, h: number) => {
    camera.position.set(...m.position);
    if (m.dir && m.focal !== undefined && m.horizon !== undefined) {
      // level camera + vertical lens shift (two-point perspective like the renders)
      const f = m.focal * w;
      const hy = m.horizon * h;
      const fullH = 2 * hy;
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

  const resize = () => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    if (match) applyMatch(match, w, h);
    else {
      camera.aspect = w / h;
      // keep the building comfortably framed on tall phone screens
      camera.fov = w / h < 0.8 ? 55 : 40;
      camera.updateProjectionMatrix();
    }
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  const setView = (id: string, animate = true) => {
    const v = VIEWS.find((x) => x.id === id) ?? VIEWS[0];
    const p1 = new THREE.Vector3(...v.position);
    const t1 = new THREE.Vector3(...v.target);
    if (!animate) {
      camera.position.copy(p1);
      controls.target.copy(t1);
      controls.update();
      tween = null;
    } else {
      tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1, t1, start: performance.now(), dur: 1300 };
    }
    opts.onViewChange?.(v.id);
  };

  if (match) {
    controls.enabled = false;
  } else {
    setView(opts.initialView ?? "front", false);
  }

  /** Keep the camera outside walls, roof and ground. */
  const keepOutside = (p: THREE.Vector3) => {
    if (p.y < 0.35) p.y = 0.35;
    const inFootprint = p.x > SOLID.x0 && p.x < SOLID.x1 && p.z > SOLID.z0 && p.z < SOLID.z1;
    if (inFootprint && p.y < SOLID.y1) {
      const pushes = [
        [SOLID.x0 - p.x, 0],
        [SOLID.x1 - p.x, 0],
        [0, SOLID.z0 - p.z],
        [0, SOLID.z1 - p.z],
      ].sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
      p.x += pushes[0][0];
      p.z += pushes[0][1];
    }
    if (Math.abs(p.x) < EAVE_X + 0.2 && Math.abs(p.z) < EAVE_Z + 0.2) {
      const minY = roofHeightAt(p.x, p.z) + 0.8;
      if (p.y > SOFFIT_Y - 0.2 && p.y < minY) p.y = minY;
    }
  };

  let frames = 0;
  renderer.setAnimationLoop((now) => {
    if (!match) {
      if (tween) {
        const t = Math.min(1, (now - tween.start) / tween.dur);
        const k = ease(t);
        camera.position.lerpVectors(tween.p0, tween.p1, k);
        controls.target.lerpVectors(tween.t0, tween.t1, k);
        if (t >= 1) tween = null;
      }
      controls.update();
      controls.target.clamp(TARGET_MIN, TARGET_MAX);
      keepOutside(camera.position);
      camera.lookAt(controls.target);
    }
    renderer.render(scene, camera);
    if (++frames === 3) {
      container.dataset.ready = "1";
      opts.onReady?.();
    }
  });

  return {
    setView,
    setAutoRotate(on: boolean) {
      controls.autoRotate = on;
    },
    dispose() {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      controls.dispose();
      const textures = new Set<THREE.Texture>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of ms) {
            for (const v of Object.values(m)) if (v instanceof THREE.Texture) textures.add(v);
            m.dispose();
          }
        }
      });
      textures.forEach((t) => t.dispose());
      scene.environment?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
