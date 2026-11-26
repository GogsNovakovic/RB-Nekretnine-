import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VIEWER } from "./config";

const C = VIEWER.controls;
const deg = THREE.MathUtils.degToRad;

export interface KeepOut {
  /** Walls and attached parts below the eaves. */
  walls: THREE.Box3;
  /** Roof surface height at a plan position, or null outside the eaves. */
  roofTop: (x: number, z: number) => number | null;
}

/**
 * Orbit controls: full horizontal rotation, tilt from nearly overhead down to just
 * above eye level, wheel / pinch zoom, right-drag / two-finger pan, damping.
 * Auto-rotation is off.
 */
export function createControls(camera: THREE.PerspectiveCamera, dom: HTMLElement): OrbitControls {
  const controls = new OrbitControls(camera, dom);
  controls.enableDamping = true;
  controls.dampingFactor = C.damping;
  controls.rotateSpeed = C.rotateSpeed;
  controls.zoomSpeed = C.zoomSpeed;
  controls.panSpeed = C.panSpeed;
  controls.screenSpacePanning = true;
  controls.minDistance = C.minDistance;
  controls.minPolarAngle = deg(C.minPolar);
  controls.autoRotate = C.autoRotate;
  controls.zoomToCursor = false;
  return controls;
}

/**
 * Limits that depend on the building and the current distance. Call before every
 * `controls.update()`, then `keepOutside()` after it.
 */
export class Constraints {
  private readonly targetMin: THREE.Vector3;
  private readonly targetMax: THREE.Vector3;

  constructor(
    private readonly controls: OrbitControls,
    private readonly keepOut: KeepOut,
    bounds: THREE.Box3,
  ) {
    const s = C.panSlack;
    this.targetMin = new THREE.Vector3(bounds.min.x - s, 1, bounds.min.z - s);
    this.targetMax = new THREE.Vector3(bounds.max.x + s, bounds.max.y, bounds.max.z + s);
  }

  setMaxDistance(d: number): void {
    this.controls.maxDistance = d;
  }

  /** Lowest tilt: the camera may look slightly up at the building but never drops below eye height. */
  beforeUpdate(): void {
    const t = this.controls.target;
    const dist = this.controls.object.position.distanceTo(t);
    const below = THREE.MathUtils.clamp((t.y - C.minEyeHeight) / Math.max(dist, 1e-3), -1, 1);
    this.controls.maxPolarAngle = Math.PI / 2 + Math.asin(below);
  }

  /** Clamp the pan target and push the camera out of the walls and roof. Returns true if anything moved. */
  afterUpdate(): boolean {
    const cam = this.controls.object;
    const t = this.controls.target;
    let moved = false;
    if (!t.clone().clamp(this.targetMin, this.targetMax).equals(t)) {
      t.clamp(this.targetMin, this.targetMax);
      moved = true;
    }
    const p = cam.position;
    if (p.y < C.minEyeHeight * 0.5) {
      p.y = C.minEyeHeight * 0.5;
      moved = true;
    }
    const w = this.keepOut.walls;
    if (w.containsPoint(p)) {
      const pushes: [number, THREE.Vector3][] = [
        [p.x - w.min.x, new THREE.Vector3(w.min.x - p.x, 0, 0)],
        [w.max.x - p.x, new THREE.Vector3(w.max.x - p.x, 0, 0)],
        [p.z - w.min.z, new THREE.Vector3(0, 0, w.min.z - p.z)],
        [w.max.z - p.z, new THREE.Vector3(0, 0, w.max.z - p.z)],
      ];
      pushes.sort((a, b) => a[0] - b[0]);
      p.add(pushes[0][1]);
      moved = true;
    }
    const roof = this.keepOut.roofTop(p.x, p.z);
    if (roof !== null && p.y > w.max.y - 0.3 && p.y < roof + C.roofClearance) {
      p.y = roof + C.roofClearance;
      moved = true;
    }
    if (moved) cam.lookAt(t);
    return moved;
  }
}

/**
 * Keyboard access for the focused canvas: arrows orbit and tilt, + / − zoom,
 * R, Home or 0 resets the view.
 */
export function attachKeyboard(dom: HTMLElement, controls: OrbitControls, onChange: () => void, onReset: () => void): () => void {
  const sph = new THREE.Spherical();
  const off = new THREE.Vector3();
  const step = (dTheta: number, dPhi: number, zoom: number) => {
    off.copy(controls.object.position).sub(controls.target);
    sph.setFromVector3(off);
    sph.theta += dTheta;
    sph.phi = THREE.MathUtils.clamp(sph.phi + dPhi, controls.minPolarAngle, controls.maxPolarAngle);
    sph.radius = THREE.MathUtils.clamp(sph.radius * zoom, controls.minDistance, controls.maxDistance);
    off.setFromSpherical(sph);
    controls.object.position.copy(controls.target).add(off);
    controls.object.lookAt(controls.target);
    onChange();
  };
  const r = deg(C.keyRotate);
  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
      case "ArrowLeft":
        step(-r, 0, 1);
        break;
      case "ArrowRight":
        step(r, 0, 1);
        break;
      case "ArrowUp":
        step(0, -r, 1);
        break;
      case "ArrowDown":
        step(0, r, 1);
        break;
      case "+":
      case "=":
        step(0, 0, 1 / C.keyZoom);
        break;
      case "-":
      case "_":
        step(0, 0, C.keyZoom);
        break;
      case "r":
      case "R":
      case "Home":
      case "0":
        onReset();
        break;
      default:
        return;
    }
    e.preventDefault();
  };
  dom.addEventListener("keydown", onKey);
  return () => dom.removeEventListener("keydown", onKey);
}

/**
 * Double-click (mouse) or double-tap (touch, pen) without dragging. Implemented on
 * pointer events because touch browsers do not reliably fire `dblclick` on a canvas
 * with `touch-action: none`.
 */
export function attachDoubleTap(dom: HTMLElement, onDouble: () => void): () => void {
  const active = new Map<number, { x: number; y: number; t: number }>();
  let multi = false;
  let last: { x: number; y: number; t: number } | null = null;
  const down = (e: PointerEvent) => {
    active.set(e.pointerId, { x: e.clientX, y: e.clientY, t: e.timeStamp });
    if (active.size > 1) multi = true;
  };
  const up = (e: PointerEvent) => {
    const start = active.get(e.pointerId);
    active.delete(e.pointerId);
    if (!start) return;
    const wasMulti = multi;
    if (active.size === 0) multi = false;
    if (wasMulti || e.button > 0) return;
    const tap = e.timeStamp - start.t < 300 && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 10;
    if (!tap) {
      last = null;
      return;
    }
    if (last && e.timeStamp - last.t < 380 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 40) {
      last = null;
      onDouble();
    } else last = { x: e.clientX, y: e.clientY, t: e.timeStamp };
  };
  const cancel = (e: PointerEvent) => {
    active.delete(e.pointerId);
    if (active.size === 0) multi = false;
  };
  dom.addEventListener("pointerdown", down);
  dom.addEventListener("pointerup", up);
  dom.addEventListener("pointercancel", cancel);
  return () => {
    dom.removeEventListener("pointerdown", down);
    dom.removeEventListener("pointerup", up);
    dom.removeEventListener("pointercancel", cancel);
  };
}
