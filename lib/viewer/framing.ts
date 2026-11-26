import * as THREE from "three";

/**
 * Points used for framing: every vertex of the visible building, snapped to a
 * coarse grid and de-duplicated. That keeps a few thousand points, which fit the
 * real silhouette (hip roof, projections) much more tightly than the 8 corners of a
 * bounding box.
 */
export function collectFitPoints(root: THREE.Object3D, cell = 0.4): Float32Array {
  root.updateMatrixWorld(true);
  const seen = new Set<number>();
  const out: number[] = [];
  const v = new THREE.Vector3();
  const q = (x: number) => Math.round(x / cell) + 1024;
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || o instanceof THREE.InstancedMesh || !o.visible) return;
    if (o.parent?.name === "Interiors") return; // always inside the walls
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      const key = q(v.x) + q(v.y) * 2048 + q(v.z) * 4194304;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(v.x, v.y, v.z);
    }
  });
  return new Float32Array(out);
}

export interface Fit {
  target: THREE.Vector3;
  distance: number;
}

/**
 * Camera distance and orbit target that fit all `points` inside a perspective frame
 * seen from `dir` (unit vector from the target towards the camera), with `margin`
 * (fraction of the half-frame) left clear on every side. Both the width and the
 * height constraint are honoured. The target is then shifted so that the
 * projected building is centred in the frame, rather than assuming the model origin
 * is its visual centre.
 */
export function fitToView(points: Float32Array, dir: THREE.Vector3, vfovDeg: number, aspect: number, margin: number): Fit {
  const fwd = dir.clone().normalize().negate();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0); // looking straight down
  right.normalize();
  const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
  const ty = Math.tan(THREE.MathUtils.degToRad(vfovDeg) / 2) * (1 - margin);
  const tx = ty * aspect; // tan(hfov / 2) = tan(vfov / 2) × aspect

  const box = new THREE.Box3();
  const p = new THREE.Vector3();
  for (let i = 0; i < points.length; i += 3) box.expandByPoint(p.set(points[i], points[i + 1], points[i + 2]));
  const target = box.getCenter(new THREE.Vector3());

  const solve = () => {
    let d = 0;
    for (let i = 0; i < points.length; i += 3) {
      p.set(points[i] - target.x, points[i + 1] - target.y, points[i + 2] - target.z);
      const x = p.dot(right);
      const y = p.dot(up);
      const z = p.dot(fwd);
      d = Math.max(d, Math.abs(x) / tx - z, Math.abs(y) / ty - z);
    }
    return d;
  };

  let distance = solve();
  for (let iter = 0; iter < 6; iter++) {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < points.length; i += 3) {
      p.set(points[i] - target.x, points[i + 1] - target.y, points[i + 2] - target.z);
      const depth = distance + p.dot(fwd);
      const nx = p.dot(right) / (depth * tx);
      const ny = p.dot(up) / (depth * ty);
      x0 = Math.min(x0, nx);
      x1 = Math.max(x1, nx);
      y0 = Math.min(y0, ny);
      y1 = Math.max(y1, ny);
    }
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    if (Math.abs(cx) < 1e-3 && Math.abs(cy) < 1e-3) break;
    target.addScaledVector(right, cx * tx * distance).addScaledVector(up, cy * ty * distance);
    distance = solve();
  }
  return { target, distance };
}
