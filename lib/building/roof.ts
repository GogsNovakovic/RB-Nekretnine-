import * as THREE from "three";
import type { Ctx } from "./components";
import { Frame, box, quadGeo, triGeo } from "./geom";
import type { Materials } from "./materials";
import { CHIMNEYS, EAVE_X, EAVE_Z, FASCIA_H, HD, HIP_END_PITCH, HW, REAR, RIDGE_HALF, RIDGE_Y, ROOF_BASE_Y, ROOF_PITCH, SOFFIT_Y, roofHeightAt } from "./spec";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/**
 * Hip roof over the main block: boxed timber soffit (boards run parallel to each
 * eave and mitre at the hips, as in image 1), timber fascia with zinc drip edge
 * and half-round gutters, standing-seam metal planes with real seam ribs, hip
 * and ridge cappings, and six rendered chimney / vent stacks.
 *
 * Static parts go into the shared bins; the seam ribs are returned as an
 * InstancedMesh.
 */
export function buildRoof(ctx: Ctx, materials: Materials): THREE.Object3D {
  const { bins } = ctx;
  const wf = Frame.world();
  const ex = EAVE_X;
  const ez = EAVE_Z;
  const y0 = SOFFIT_Y;

  /* soffit: four trapezoids meeting on the diagonals */
  const sq = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, uv: (p: THREE.Vector3) => [number, number]) =>
    bins.add("soffit", quadGeo([a, b, c, d], [uv(a), uv(b), uv(c), uv(d)]));
  const alongX = (p: THREE.Vector3): [number, number] => [p.x, p.z];
  const alongZ = (p: THREE.Vector3): [number, number] => [p.z, p.x];
  sq(V(-ex, y0, ez), V(-HW, y0, HD), V(HW, y0, HD), V(ex, y0, ez), alongX); // south
  sq(V(ex, y0, -ez), V(HW, y0, -HD), V(-HW, y0, -HD), V(-ex, y0, -ez), alongX); // north
  sq(V(ex, y0, ez), V(HW, y0, HD), V(HW, y0, -HD), V(ex, y0, -ez), alongZ); // east
  sq(V(-ex, y0, -ez), V(-HW, y0, -HD), V(-HW, y0, HD), V(-ex, y0, ez), alongZ); // west
  // over the NE roof terrace the top-floor wall is recessed: close the soffit back to it
  const lx = HW - REAR.central.u0;
  const lz = -HD + REAR.loggiaRecess;
  sq(V(HW, y0, -HD), V(HW, y0, lz), V(lx, y0, lz), V(lx, y0, -HD), alongX);

  /* fascia + drip edge */
  const t = 0.045;
  const yT = y0 + FASCIA_H;
  box(bins, "fascia", wf, -ex, ex, y0, yT, ez - t, ez);
  box(bins, "fascia", wf, -ex, ex, y0, yT, -ez, -ez + t);
  box(bins, "fascia", wf, ex - t, ex, y0, yT, -ez + t, ez - t);
  box(bins, "fascia", wf, -ex, -ex + t, y0, yT, -ez + t, ez - t);
  const dt = 0.06;
  box(bins, "zinc", wf, -ex - 0.02, ex + 0.02, yT - 0.03, yT + 0.03, ez - dt, ez + 0.02);
  box(bins, "zinc", wf, -ex - 0.02, ex + 0.02, yT - 0.03, yT + 0.03, -ez - 0.02, -ez + dt);
  box(bins, "zinc", wf, ex - dt, ex + 0.02, yT - 0.03, yT + 0.03, -ez + dt, ez - dt);
  box(bins, "zinc", wf, -ex - 0.02, -ex + dt, yT - 0.03, yT + 0.03, -ez + dt, ez - dt);

  /* half-round gutters (open top) */
  const gr = 0.075;
  const gy = y0 + 0.14;
  const gutter = (center: THREE.Vector3, dir: THREE.Vector3, len: number) => {
    const g = new THREE.CylinderGeometry(gr, gr, len, 14, 1, true, Math.PI / 2, Math.PI);
    const up = V(0, 1, 0);
    const xAxis = new THREE.Vector3().crossVectors(dir, up);
    g.applyMatrix4(new THREE.Matrix4().makeBasis(xAxis, dir, up).setPosition(center));
    bins.add("zinc", g);
  };
  gutter(V(0, gy, ez + gr), V(1, 0, 0), 2 * (ex + gr));
  gutter(V(0, gy, -ez - gr), V(1, 0, 0), 2 * (ex + gr));
  gutter(V(ex + gr, gy, 0), V(0, 0, 1), 2 * (ez + gr));
  gutter(V(-ex - gr, gy, 0), V(0, 0, 1), 2 * (ez + gr));

  /* roof planes */
  const rb = ROOF_BASE_Y;
  const rx = RIDGE_HALF;
  const ry = RIDGE_Y;
  const slope = ez / Math.cos(ROOF_PITCH);
  const slopeEnd = (ex - rx) / Math.cos(HIP_END_PITCH);
  bins.add("roof", quadGeo([V(-ex, rb, ez), V(ex, rb, ez), V(rx, ry, 0), V(-rx, ry, 0)], [[-ex, 0], [ex, 0], [rx, slope], [-rx, slope]]));
  bins.add("roof", quadGeo([V(ex, rb, -ez), V(-ex, rb, -ez), V(-rx, ry, 0), V(rx, ry, 0)], [[ex, 0], [-ex, 0], [-rx, slope], [rx, slope]]));
  bins.add("roof", triGeo(V(ex, rb, ez), V(ex, rb, -ez), V(rx, ry, 0), [[ez, 0], [-ez, 0], [0, slopeEnd]]));
  bins.add("roof", triGeo(V(-ex, rb, -ez), V(-ex, rb, ez), V(-rx, ry, 0), [[-ez, 0], [ez, 0], [0, slopeEnd]]));

  /* hip + ridge cappings */
  const capAlong = (a: THREE.Vector3, b: THREE.Vector3, w: number, h: number) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    dir.normalize();
    const xAxis = new THREE.Vector3().crossVectors(V(0, 1, 0), dir).normalize();
    const yAxis = new THREE.Vector3().crossVectors(dir, xAxis).normalize();
    const g = new THREE.BoxGeometry(w, h, len);
    g.translate(0, h / 2 - 0.01, len / 2);
    g.applyMatrix4(new THREE.Matrix4().makeBasis(xAxis, yAxis, dir).setPosition(a));
    bins.add("roofRib", g);
  };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) capAlong(V(sx * ex, rb, sz * ez), V(sx * rx, ry, 0), 0.16, 0.07);
  capAlong(V(-rx - 0.05, ry, 0), V(rx + 0.05, ry, 0), 0.2, 0.08);

  /* chimney / vent stacks */
  const half = 0.28;
  for (const [cx, cz] of CHIMNEYS) {
    const hs = [roofHeightAt(cx - half, cz - half), roofHeightAt(cx + half, cz - half), roofHeightAt(cx - half, cz + half), roofHeightAt(cx + half, cz + half)];
    const top = Math.max(...hs) + 0.95;
    box(bins, "chimney", wf, cx - half, cx + half, Math.min(...hs) - 0.25, top, cz - half, cz + half);
    box(bins, "zinc", wf, cx - half - 0.04, cx + half + 0.04, Math.max(...hs) - 0.05, Math.max(...hs) + 0.06, cz - half - 0.04, cz + half + 0.04);
    box(bins, "concrete", wf, cx - half - 0.06, cx + half + 0.06, top, top + 0.08, cz - half - 0.06, cz + half + 0.06);
    const pipe = new THREE.CylinderGeometry(0.085, 0.085, 0.42, 14);
    pipe.translate(cx, top + 0.08 + 0.21, cz);
    bins.add("zinc", pipe);
    const hood = new THREE.ConeGeometry(0.17, 0.14, 14);
    hood.translate(cx, top + 0.08 + 0.42 + 0.08, cz);
    bins.add("zinc", hood);
  }

  /* standing-seam ribs (instanced) */
  const ribGeo = new THREE.BoxGeometry(0.03, 0.04, 1);
  ribGeo.translate(0, 0.02, 0.5);
  const mats: THREE.Matrix4[] = [];
  const addRib = (start: THREE.Vector3, d: THREE.Vector3, n: THREE.Vector3, planLen: number, cos: number) => {
    if (planLen < 0.05) return;
    const len = planLen / cos;
    const x = new THREE.Vector3().crossVectors(n, d);
    const m = new THREE.Matrix4().makeBasis(x, n, d);
    m.scale(V(1, 1, len));
    m.setPosition(start);
    mats.push(m);
  };
  const spacing = 0.5;
  // long slopes: seams run up to the ridge, or to the hip line beyond the ridge ends
  const [c, s] = [Math.cos(ROOF_PITCH), Math.sin(ROOF_PITCH)];
  for (let x = -ex + spacing / 2; x < ex; x += spacing) {
    const planLen = Math.abs(x) <= rx ? ez : (ez * (ex - Math.abs(x))) / (ex - rx);
    addRib(V(x, rb, ez), V(0, s, -c), V(0, c, s), planLen, c);
    addRib(V(x, rb, -ez), V(0, s, c), V(0, c, -s), planLen, c);
  }
  // hipped ends
  const [ce, se] = [Math.cos(HIP_END_PITCH), Math.sin(HIP_END_PITCH)];
  for (let z = -ez + spacing / 2; z < ez; z += spacing) {
    const planLen = (1 - Math.abs(z) / ez) * (ex - rx);
    addRib(V(ex, rb, z), V(-ce, se, 0), V(se, ce, 0), planLen, ce);
    addRib(V(-ex, rb, z), V(ce, se, 0), V(-se, ce, 0), planLen, ce);
  }
  const ribs = new THREE.InstancedMesh(ribGeo, materials.roofRib, mats.length);
  mats.forEach((m, i) => ribs.setMatrixAt(i, m));
  ribs.instanceMatrix.needsUpdate = true;
  ribs.castShadow = true;
  ribs.receiveShadow = true;
  ribs.name = "roofSeams";
  return ribs;
}
