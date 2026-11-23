import * as THREE from "three";
import { Bins, Frame, Rect, V3, box, boxGeo, quadGeo, tube } from "./geom";

export interface Ctx {
  bins: Bins;
  rand: () => number;
}

export interface GlazingOpts {
  /** Distance from the wall face back to the outer face of the frame. */
  inset: number;
  /** 1 = single-sash window, ≥2 = door/sliding leaves separated by mullions. */
  panels?: number;
  door?: boolean;
  sill?: boolean;
  /** Material that lines the reveal between the wall face and the frame (null = wall material shows). */
  lining?: string | null;
  /** Wall thickness; the room box starts behind it. */
  wallT: number;
  /** Floor and ceiling of the room behind (local v). */
  room?: { v0: number; v1: number };
  sliding?: boolean;
  frameKey?: string;
}

const FW = 0.07; // frame face width
const FD = 0.07; // frame depth
const SW = 0.055; // sash width

/**
 * A complete glazed opening placed in an existing wall hole `r`:
 * reveal lining, outer frame, sashes/leaves with mullions, glass, external sill
 * and a simple room volume behind so the glazing reads with real depth.
 */
export function glazedOpening(ctx: Ctx, f: Frame, r: Rect, o: GlazingOpts): void {
  const { bins } = ctx;
  const frameKey = o.frameKey ?? "frame";
  const wF = -o.inset;
  const wB = wF - FD;
  const panels = o.panels ?? 1;

  if (o.lining) {
    const t = 0.012;
    box(bins, o.lining, f, r.u0, r.u0 + t, r.v0, r.v1, wF, 0.002);
    box(bins, o.lining, f, r.u1 - t, r.u1, r.v0, r.v1, wF, 0.002);
    box(bins, o.lining, f, r.u0, r.u1, r.v1 - t, r.v1, wF, 0.002);
    if (o.door) box(bins, o.lining, f, r.u0, r.u1, r.v0, r.v0 + 0.012, wF, 0.002);
  }

  // outer frame
  const fb = o.door ? 0.045 : FW;
  box(bins, frameKey, f, r.u0, r.u0 + FW, r.v0, r.v1, wB, wF);
  box(bins, frameKey, f, r.u1 - FW, r.u1, r.v0, r.v1, wB, wF);
  box(bins, frameKey, f, r.u0 + FW, r.u1 - FW, r.v1 - FW, r.v1, wB, wF);
  box(bins, frameKey, f, r.u0 + FW, r.u1 - FW, r.v0, r.v0 + fb, wB, wF);

  const iu0 = r.u0 + FW;
  const iu1 = r.u1 - FW;
  const iv0 = r.v0 + fb;
  const iv1 = r.v1 - FW;
  const mw = panels > 1 ? 0.07 : 0;
  const pw = (iu1 - iu0 - (panels - 1) * mw) / panels;
  for (let i = 0; i < panels; i++) {
    const pu0 = iu0 + i * (pw + mw);
    const pu1 = pu0 + pw;
    if (i < panels - 1) box(bins, frameKey, f, pu1, pu1 + mw, iv0, iv1, wB + 0.005, wF - 0.005);
    const shift = o.sliding && i % 2 === 1 ? -0.025 : 0;
    const s0 = wB + 0.012 + shift;
    const s1 = wF - 0.012 + shift;
    // sash / leaf frame
    box(bins, frameKey, f, pu0, pu0 + SW, iv0, iv1, s0, s1);
    box(bins, frameKey, f, pu1 - SW, pu1, iv0, iv1, s0, s1);
    box(bins, frameKey, f, pu0 + SW, pu1 - SW, iv1 - SW, iv1, s0, s1);
    box(bins, frameKey, f, pu0 + SW, pu1 - SW, iv0, iv0 + SW * (o.door ? 1.6 : 1), s0, s1);
    // pane
    const gw = (s0 + s1) / 2;
    const gv0 = iv0 + SW * (o.door ? 1.6 : 1);
    bins.add(
      "glass",
      quadGeo(
        [
          new THREE.Vector3(pu0 + SW, gv0, gw),
          new THREE.Vector3(pu1 - SW, gv0, gw),
          new THREE.Vector3(pu1 - SW, iv1 - SW, gw),
          new THREE.Vector3(pu0 + SW, iv1 - SW, gw),
        ],
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
      ),
      f,
    );
  }

  if (o.sill) {
    box(bins, "sill", f, r.u0 - 0.035, r.u1 + 0.035, r.v0 - 0.04, r.v0 + 0.008, wF, 0.055);
  }

  if (o.room) roomBox(ctx, f, r.u0 - 0.5, r.u1 + 0.5, o.room.v0, o.room.v1, -o.wallT, -o.wallT - 2.4, ctx.rand() < 0.45);
}

/** Inward-facing room volume (5 faces) with per-face tones via vertex colours. */
export function roomBox(ctx: Ctx, f: Frame, u0: number, u1: number, v0: number, v1: number, wFront: number, wBack: number, lit: boolean, key?: string): void {
  const V = (u: number, v: number, w: number) => new THREE.Vector3(u, v, w);
  const uv: [number, number][] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  const faces: [THREE.BufferGeometry, number][] = [
    [quadGeo([V(u0, v0, wBack), V(u1, v0, wBack), V(u1, v1, wBack), V(u0, v1, wBack)], uv), 0.92], // back wall
    [quadGeo([V(u0, v0, wFront), V(u1, v0, wFront), V(u1, v0, wBack), V(u0, v0, wBack)], uv), 0.55], // floor
    [quadGeo([V(u0, v1, wBack), V(u1, v1, wBack), V(u1, v1, wFront), V(u0, v1, wFront)], uv), 1.0], // ceiling
    [quadGeo([V(u0, v0, wFront), V(u0, v0, wBack), V(u0, v1, wBack), V(u0, v1, wFront)], uv), 0.78], // left
    [quadGeo([V(u1, v0, wBack), V(u1, v0, wFront), V(u1, v1, wFront), V(u1, v1, wBack)], uv), 0.72], // right
  ];
  const k = key ?? (lit ? "interiorLit" : "interior");
  for (const [g, tone] of faces) {
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    const warm = tone === 0.55 ? [0.75, 0.6, 0.45] : [1, 0.97, 0.93];
    for (let i = 0; i < n; i++) {
      col[i * 3] = tone * warm[0];
      col[i * 3 + 1] = tone * warm[1];
      col[i * 3 + 2] = tone * warm[2];
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    ctx.bins.add(k, g, f, true);
  }
}

export interface RailSegment {
  /** start / end in the parent's (u, w) plane; the glass faces the left-hand normal of the run */
  a: [number, number];
  b: [number, number];
  /** bottom edge of the glass */
  vBot: number;
}

/**
 * Frameless glass balustrade: toughened panels with bottom clamps, slim
 * stainless stanchions on the inside and a continuous round top rail.
 */
export function glassBalustrade(ctx: Ctx, f: Frame, segs: RailSegment[], vRail: number): void {
  const { bins } = ctx;
  const railPts: V3[] = [];
  segs.forEach((s, idx) => {
    const du = s.b[0] - s.a[0];
    const dw = s.b[1] - s.a[1];
    const len = Math.hypot(du, dw);
    const sf = f.segment(s.a[0], s.a[1], du, dw);
    const n = Math.max(1, Math.round(len / 1.15));
    const pl = len / n;
    for (let i = 0; i < n; i++) {
      const p0 = i * pl + 0.012;
      const p1 = (i + 1) * pl - 0.012;
      box(bins, "railGlass", sf, p0, p1, s.vBot, vRail - 0.05, -0.006, 0.006);
      // bottom clamps
      for (const c of [p0 + 0.18, p1 - 0.18]) if (p1 - p0 > 0.5) box(bins, "steel", sf, c - 0.03, c + 0.03, s.vBot + 0.03, s.vBot + 0.11, -0.03, -0.006);
    }
    for (let i = idx === 0 ? 0 : 1; i <= n; i++) {
      const p = Math.min(len - 0.02, Math.max(0.02, i * pl));
      tube(bins, "steel", sf, [[p, s.vBot + 0.02, -0.04], [p, vRail, -0.04]], 0.016, 8);
    }
    if (idx === 0) railPts.push([s.a[0], vRail, s.a[1]]);
    railPts.push([s.b[0], vRail, s.b[1]]);
  });
  tube(bins, "steel", f, railPts, 0.022, 10);
}

/** Cantilevered open balcony: grey slab, glass on the slab face, glass side returns. */
export function openBalcony(ctx: Ctx, f: Frame, u0: number, u1: number, wWall: number, depth: number, top: number): void {
  const slabT = 0.32;
  const wf = wWall + depth;
  box(ctx.bins, "concrete", f, u0, u1, top - slabT, top, wWall, wf);
  box(ctx.bins, "paving", f, u0 + 0.02, u1 - 0.02, top, top + 0.012, wWall, wf - 0.02);
  const s = 0.035;
  glassBalustrade(
    ctx,
    f,
    [
      { a: [u0 + s, wWall + 0.02], b: [u0 + s, wf + 0.018], vBot: top + 0.02 },
      { a: [u0 + s, wf + 0.018], b: [u1 - s, wf + 0.018], vBot: top - slabT + 0.1 },
      { a: [u1 - s, wf + 0.018], b: [u1 - s, wWall + 0.02], vBot: top + 0.02 },
    ],
    top + 1.06,
  );
}

/** Box balcony: thick grey slab and solid cheek walls framing a glass front. */
export function boxBalcony(ctx: Ctx, f: Frame, u0: number, u1: number, wWall: number, depth: number, top: number): void {
  const slabT = 0.4;
  const cheek = 0.2;
  const wf = wWall + depth;
  const { bins } = ctx;
  box(bins, "concrete", f, u0, u1, top - slabT, top, wWall, wf);
  box(bins, "concrete", f, u0, u0 + cheek, top, top + 1.1, wWall, wf);
  box(bins, "concrete", f, u1 - cheek, u1, top, top + 1.1, wWall, wf);
  box(bins, "paving", f, u0 + cheek, u1 - cheek, top, top + 0.012, wWall, wf - 0.02);
  glassBalustrade(ctx, f, [{ a: [u0 + cheek, wf + 0.016], b: [u1 - cheek, wf + 0.016], vBot: top - slabT + 0.12 }], top + 1.04);
}

/** Zinc downpipe: outlet from the gutter, swan-neck under the soffit, down the wall, shoe. */
export function downpipe(ctx: Ctx, f: Frame, u: number, gutterW: number, gutterV: number, wallW = 0.075): void {
  const pts: V3[] = [
    [u, gutterV, gutterW],
    [u, gutterV - 0.3, gutterW],
    [u, gutterV - 0.3 - (gutterW - wallW) * 0.75, wallW],
    [u, 0.32, wallW],
    [u, 0.12, wallW + 0.18],
  ];
  tube(ctx.bins, "zinc", f, pts, 0.05, 12);
  for (let v = 1.6; v < gutterV - 1.6; v += 2.2) box(ctx.bins, "zinc", f, u - 0.065, u + 0.065, v, v + 0.035, 0.0, wallW + 0.06);
}

/** Dark timber privacy / sliding-shutter panel standing proud of the wall. */
export function timberScreen(ctx: Ctx, f: Frame, u0: number, u1: number, v0: number, v1: number, w: number): void {
  const { bins } = ctx;
  box(bins, "darkSteel", f, u0 + 0.05, u1 - 0.05, v1, v1 + 0.04, w - 0.05, w + 0.01);
  const boards = Math.round((v1 - v0) / 0.155);
  const bh = (v1 - v0) / boards;
  for (let i = 0; i < boards; i++) {
    const b0 = v0 + i * bh;
    box(bins, "woodDark", f, u0, u1, b0 + 0.008, b0 + bh, w, w + 0.045);
  }
  box(bins, "woodDark", f, u0 + 0.04, u0 + 0.1, v0, v1, w - 0.03, w);
  box(bins, "woodDark", f, u1 - 0.1, u1 - 0.04, v0, v1, w - 0.03, w);
}

/**
 * Sloped slab: top surface at height `vAt0` where w = w0 and `vAt1` where w = w1
 * (w0 < w1). Without `thickness` the slab sits on the ground (ramps); with it,
 * the soffit follows the slope (stair flights).
 */
export function rampGeo(u0: number, u1: number, w0: number, w1: number, vAt0: number, vAt1: number, thickness?: number): THREE.BufferGeometry {
  const g = boxGeo(u0, u1, 0, 1, w0, w1);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const t = (p.getZ(i) - w0) / (w1 - w0);
    const top = vAt0 + (vAt1 - vAt0) * t;
    p.setY(i, p.getY(i) > 0.5 ? top : thickness === undefined ? -0.05 : top - thickness);
  }
  g.computeVertexNormals();
  return g;
}
