import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type V3 = readonly [number, number, number];
export interface Rect {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
}

const UP = new THREE.Vector3(0, 1, 0);

/**
 * A local coordinate frame. For façades: u runs along the wall (left→right seen
 * from outside), v is up, w points out of the wall. Always right-handed.
 */
export class Frame {
  constructor(readonly m: THREE.Matrix4) {}

  static world(): Frame {
    return new Frame(new THREE.Matrix4());
  }

  static facade(origin: THREE.Vector3, uAxis: THREE.Vector3, normal: THREE.Vector3): Frame {
    const m = new THREE.Matrix4().makeBasis(uAxis.clone().normalize(), UP, normal.clone().normalize());
    m.setPosition(origin);
    return new Frame(m);
  }

  /** Child frame whose origin is at local (u, v, w) and whose u-axis follows (du, dw) in the u–w plane. */
  segment(u: number, w: number, du: number, dw: number, v = 0): Frame {
    const len = Math.hypot(du, dw);
    const a = new THREE.Vector3(du / len, 0, dw / len);
    const n = new THREE.Vector3(-dw / len, 0, du / len);
    const local = new THREE.Matrix4().makeBasis(a, UP, n).setPosition(u, v, w);
    return new Frame(this.m.clone().multiply(local));
  }

  offset(du: number, dv: number, dw: number): Frame {
    return new Frame(this.m.clone().multiply(new THREE.Matrix4().makeTranslation(du, dv, dw)));
  }

  point(u: number, v: number, w: number): THREE.Vector3 {
    return new THREE.Vector3(u, v, w).applyMatrix4(this.m);
  }
}

/**
 * Collects geometry per structural section and material, then merges it into one
 * mesh per (section, material). The scene graph therefore follows the building's
 * structure (Building › Facades › Front …) while staying at a modest draw-call count.
 *
 * Sections nest: `bins.section("Roof", () => …)` adds everything generated inside the
 * callback to the "Roof" group under whatever section is currently open.
 */
export class Bins {
  private readonly parts = new Map<string, Map<string, THREE.BufferGeometry[]>>();
  private readonly objects = new Map<string, THREE.Object3D[]>();
  private path: string[] = [];

  section<T>(name: string, fn: () => T): T {
    this.path.push(name);
    try {
      return fn();
    } finally {
      this.path.pop();
    }
  }

  /** Run `fn` with an absolute section path (e.g. all interiors go to one group). */
  at<T>(path: string[], fn: () => T): T {
    const saved = this.path;
    this.path = [...path];
    try {
      return fn();
    } finally {
      this.path = saved;
    }
  }

  add(key: string, geo: THREE.BufferGeometry, frame?: Frame, keepColor = false): void {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    for (const name of Object.keys(g.attributes)) {
      if (name === "position" || name === "normal" || name === "uv") continue;
      if (keepColor && name === "color") continue;
      g.deleteAttribute(name);
    }
    if (!g.attributes.uv) {
      g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    g.clearGroups();
    if (frame) g.applyMatrix4(frame.m);
    const sec = this.path.join("/");
    let byMat = this.parts.get(sec);
    if (!byMat) this.parts.set(sec, (byMat = new Map()));
    let list = byMat.get(key);
    if (!list) byMat.set(key, (list = []));
    list.push(g);
  }

  /** Add a ready-made object (e.g. an InstancedMesh) to the current section. */
  addObject(obj: THREE.Object3D): void {
    const sec = this.path.join("/");
    let list = this.objects.get(sec);
    if (!list) this.objects.set(sec, (list = []));
    list.push(obj);
  }

  build(rootName: string, materials: Record<string, THREE.Material>, noShadow: ReadonlySet<string>): THREE.Group {
    const root = new THREE.Group();
    root.name = rootName;
    const groups = new Map<string, THREE.Group>([["", root]]);
    const groupFor = (sec: string): THREE.Group => {
      let g = groups.get(sec);
      if (g) return g;
      const cut = sec.lastIndexOf("/");
      const parent = groupFor(cut < 0 ? "" : sec.slice(0, cut));
      g = new THREE.Group();
      g.name = sec.slice(cut + 1);
      parent.add(g);
      groups.set(sec, g);
      return g;
    };
    for (const [sec, byMat] of this.parts) {
      const group = groupFor(sec);
      for (const [key, list] of byMat) {
        const mat = materials[key];
        if (!mat) throw new Error(`No material for "${key}"`);
        const merged = mergeGeometries(list, false);
        if (!merged) throw new Error(`Could not merge geometry for "${sec}/${key}"`);
        list.forEach((g) => g.dispose());
        merged.computeBoundingSphere();
        merged.computeBoundingBox();
        const mesh = new THREE.Mesh(merged, mat);
        mesh.name = key;
        const shadows = !noShadow.has(key);
        mesh.castShadow = shadows;
        mesh.receiveShadow = shadows;
        mesh.matrixAutoUpdate = false;
        group.add(mesh);
      }
    }
    for (const [sec, list] of this.objects) groupFor(sec).add(...list);
    this.parts.clear();
    this.objects.clear();
    return root;
  }
}

/**
 * Axis-aligned box in local coordinates with UVs expressed in metres, so that
 * tiling textures keep a constant real-world scale and stay continuous across
 * neighbouring pieces. Front/back faces map (u, v); reveals map (w, v).
 */
export function boxGeo(u0: number, u1: number, v0: number, v1: number, w0: number, w1: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const quad = (pts: V3[], n: V3, t: [number, number][]) => {
    for (const i of [0, 1, 2, 0, 2, 3]) {
      pos.push(...pts[i]);
      nor.push(...n);
      uv.push(...t[i]);
    }
  };
  quad([[u0, v0, w1], [u1, v0, w1], [u1, v1, w1], [u0, v1, w1]], [0, 0, 1], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
  quad([[u1, v0, w0], [u0, v0, w0], [u0, v1, w0], [u1, v1, w0]], [0, 0, -1], [[-u1, v0], [-u0, v0], [-u0, v1], [-u1, v1]]);
  quad([[u1, v0, w1], [u1, v0, w0], [u1, v1, w0], [u1, v1, w1]], [1, 0, 0], [[-w1, v0], [-w0, v0], [-w0, v1], [-w1, v1]]);
  quad([[u0, v0, w0], [u0, v0, w1], [u0, v1, w1], [u0, v1, w0]], [-1, 0, 0], [[w0, v0], [w1, v0], [w1, v1], [w0, v1]]);
  quad([[u0, v1, w1], [u1, v1, w1], [u1, v1, w0], [u0, v1, w0]], [0, 1, 0], [[u0, -w1], [u1, -w1], [u1, -w0], [u0, -w0]]);
  quad([[u0, v0, w0], [u1, v0, w0], [u1, v0, w1], [u0, v0, w1]], [0, -1, 0], [[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** Planar quad (a,b,c,d counter-clockwise seen from the front) with explicit UVs. */
export function quadGeo(pts: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3], uvs: [number, number][]): THREE.BufferGeometry {
  const n = new THREE.Vector3().subVectors(pts[1], pts[0]).cross(new THREE.Vector3().subVectors(pts[2], pts[0])).normalize();
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  for (const i of [0, 1, 2, 0, 2, 3]) {
    pos.push(pts[i].x, pts[i].y, pts[i].z);
    nor.push(n.x, n.y, n.z);
    uv.push(...uvs[i]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

export function triGeo(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, uvs: [number, number][]): THREE.BufferGeometry {
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs.flat(), 2));
  return g;
}

/** Convenience: add a local box to a bin. */
export function box(bins: Bins, key: string, f: Frame, u0: number, u1: number, v0: number, v1: number, w0: number, w1: number): void {
  if (u1 - u0 < 1e-5 || v1 - v0 < 1e-5 || w1 - w0 < 1e-5) return;
  bins.add(key, boxGeo(u0, u1, v0, v1, w0, w1), f);
}

/**
 * Solid wall slab (u0..u1 × v0..v1 × w0..w1) with rectangular openings cut through it.
 * The slab is split into a grid around the openings and greedily re-merged into as
 * few boxes as possible; the box faces adjacent to openings become the reveals.
 */
export function wallWithHoles(bins: Bins, key: string, f: Frame, r: Rect, w0: number, w1: number, holes: Rect[]): void {
  const eps = 1e-6;
  const clipped = holes
    .map((h) => ({ u0: Math.max(h.u0, r.u0), u1: Math.min(h.u1, r.u1), v0: Math.max(h.v0, r.v0), v1: Math.min(h.v1, r.v1) }))
    .filter((h) => h.u1 - h.u0 > eps && h.v1 - h.v0 > eps);
  const uniq = (a: number[]) => [...new Set(a.map((x) => Math.round(x * 1e5) / 1e5))].sort((p, q) => p - q);
  const us = uniq([r.u0, r.u1, ...clipped.flatMap((h) => [h.u0, h.u1])]);
  const vs = uniq([r.v0, r.v1, ...clipped.flatMap((h) => [h.v0, h.v1])]);
  const filled = (i: number, j: number) => {
    const cu = (us[i] + us[i + 1]) / 2;
    const cv = (vs[j] + vs[j + 1]) / 2;
    return !clipped.some((h) => cu > h.u0 && cu < h.u1 && cv > h.v0 && cv < h.v1);
  };
  type Open = { ia: number; ib: number; j0: number };
  let open: Open[] = [];
  const emit = (o: Open, j1: number) => box(bins, key, f, us[o.ia], us[o.ib], vs[o.j0], vs[j1], w0, w1);
  for (let j = 0; j < vs.length - 1; j++) {
    const runs: [number, number][] = [];
    let start = -1;
    for (let i = 0; i < us.length - 1; i++) {
      if (filled(i, j)) {
        if (start < 0) start = i;
      } else if (start >= 0) {
        runs.push([start, i]);
        start = -1;
      }
    }
    if (start >= 0) runs.push([start, us.length - 1]);
    const next: Open[] = [];
    for (const [ia, ib] of runs) {
      const k = open.findIndex((o) => o.ia === ia && o.ib === ib);
      if (k >= 0) {
        next.push(open[k]);
        open.splice(k, 1);
      } else next.push({ ia, ib, j0: j });
    }
    open.forEach((o) => emit(o, j));
    open = next;
  }
  open.forEach((o) => emit(o, vs.length - 1));
}

/** Cylinder between two local points. */
export function cylinderGeo(a: THREE.Vector3, b: THREE.Vector3, r: number, segs = 10, openEnded = false): THREE.BufferGeometry {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(r, r, len, segs, 1, openEnded);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

/** Round tube through a polyline of local points (straight runs, ball joints). */
export function tube(bins: Bins, key: string, f: Frame, pts: V3[], r: number, segs = 10): void {
  const p = pts.map(([u, v, w]) => new THREE.Vector3(u, v, w));
  for (let i = 0; i < p.length - 1; i++) bins.add(key, cylinderGeo(p[i], p[i + 1], r, segs, true), f);
  for (let i = 0; i < p.length; i++) {
    const s = new THREE.SphereGeometry(r, segs, Math.max(4, segs / 2));
    s.translate(p[i].x, p[i].y, p[i].z);
    bins.add(key, s, f);
  }
}

/** Deterministic PRNG so the generated building is identical on every load. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
