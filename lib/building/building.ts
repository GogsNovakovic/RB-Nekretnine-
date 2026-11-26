import * as THREE from "three";
import { Ctx, boxBalcony, downpipe, glassBalustrade, glazedOpening, openBalcony, rampGeo, roomBox, timberFin } from "./components";
import { Bins, Frame, Rect, box, boxGeo, mulberry32, tube, wallWithHoles } from "./geom";
import { Materials, NO_SHADOW } from "./materials";
import { buildRoof } from "./roof";
import { D, EAVE_X, EAVE_Z, EVIDENCE, FFL, FRONT, HD, HEAD, HW, OVERHANG, PLINTH_H, REAR, RENDER_TOP, SCALE, SIDE, SILL, SOFFIT_Y, W, WALL_T, roofHeightAt } from "./spec";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Façade frames: u runs along the wall left→right as seen from outside, v up, w outwards. */
export const FRAMES = {
  front: Frame.facade(V(-HW, 0, HD), V(1, 0, 0), V(0, 0, 1)),
  right: Frame.facade(V(HW, 0, HD), V(0, 0, -1), V(1, 0, 0)),
  rear: Frame.facade(V(HW, 0, -HD), V(-1, 0, 0), V(0, 0, -1)),
  left: Frame.facade(V(-HW, 0, -HD), V(0, 0, 1), V(-1, 0, 0)),
};

const GUTTER_V = SOFFIT_Y + 0.14;

/**
 * Wall segment from u0..u1 whose outer face lies at local w = wFace, split into the
 * three horizontal material zones seen on every façade: stone plinth, white render
 * up to the top-floor sill line, horizontal timber cladding above.
 */
function zonedWall(ctx: Ctx, f: Frame, u0: number, u1: number, holes: Rect[], wFace = 0, top = SOFFIT_Y): void {
  const { bins } = ctx;
  const w0 = wFace - WALL_T;
  wallWithHoles(bins, "stone", f, { u0, u1, v0: 0, v1: PLINTH_H }, w0, wFace - 0.015, holes);
  wallWithHoles(bins, "render", f, { u0, u1, v0: PLINTH_H, v1: Math.min(RENDER_TOP, top) }, w0, wFace, holes);
  if (top > RENDER_TOP) wallWithHoles(bins, "wood", f, { u0, u1, v0: RENDER_TOP, v1: top }, w0, wFace, holes);
}

const win = (u0: number, u1: number, floor: number): Rect => ({ u0, u1, v0: FFL[floor] + SILL, v1: FFL[floor] + HEAD });
const door = (u0: number, u1: number, floor: number): Rect => ({ u0, u1, v0: FFL[floor], v1: FFL[floor] + HEAD });
const room = (floor: number) => ({ v0: FFL[floor], v1: FFL[floor] + 2.7 });

/** Standard window: grey-lined reveal in the render, deeper timber-lined reveal in the cladding. */
function stdWindow(ctx: Ctx, f: Frame, r: Rect, floor: number, wFace = 0): void {
  const top = floor === 2;
  glazedOpening(ctx, wFace ? f.offset(0, 0, wFace) : f, r, {
    inset: top ? 0.24 : 0.12,
    sill: true,
    lining: top ? null : "renderGray",
    wallT: WALL_T,
    room: room(floor),
  });
}

function stdDoor(ctx: Ctx, f: Frame, r: Rect, floor: number, panels: number, wFace = 0): void {
  glazedOpening(ctx, wFace ? f.offset(0, 0, wFace) : f, r, {
    inset: 0.14,
    panels,
    door: true,
    sliding: panels > 1,
    lining: "renderGray",
    wallT: WALL_T,
    room: room(floor),
  });
}

/* ------------------------------------------------------------------ front */
function buildFront(ctx: Ctx): void {
  const f = FRAMES.front;
  const { bins } = ctx;
  const st = FRONT.stair;
  const e = FRONT.entrance;

  bins.section("Facades/Front", () => {
    const holes: Rect[] = [];
    const hw = FRONT.windowW / 2;
    for (let fl = 0; fl < 3; fl++) {
      for (const c of FRONT.windowCentres) {
        const r = win(c - hw, c + hw, fl);
        holes.push(r);
        stdWindow(ctx, f, r, fl);
      }
    }
    // Stair-core strip: one tall opening from grade to the top of the stair glazing.
    holes.push({ u0: st.u0, u1: st.u1, v0: 0, v1: FRONT.stairGlazingTop });
    zonedWall(ctx, f, 0.015, W - 0.015, holes);
    downpipe(ctx, f, FRONT.downpipeU, OVERHANG + 0.08, GUTTER_V);
  });

  bins.section("StairCore", () => {
    /* entrance recess under the grey lintel band */
    bins.section("Entrance", () => {
      const rd = -e.recessDepth;
      box(bins, "paving", f, st.u0, st.u1, 0, PLINTH_H, rd, 0);
      // grey recess cheeks: a thin lining inside the wall opening, thicker walls behind the external wall
      box(bins, "renderGray", f, st.u0, st.u0 + 0.012, PLINTH_H, e.head, -WALL_T, 0.002);
      box(bins, "renderGray", f, st.u1 - 0.012, st.u1, PLINTH_H, e.head, -WALL_T, 0.002);
      box(bins, "renderGray", f, st.u0 - 0.2, st.u0 + 0.012, PLINTH_H, e.head, rd, -WALL_T);
      box(bins, "renderGray", f, st.u1 - 0.012, st.u1 + 0.2, PLINTH_H, e.head, rd, -WALL_T);
      box(bins, "renderGray", f, st.u0, st.u1, e.head, e.lintelTop, rd, 0.07); // lintel band / canopy
    });

    bins.section("EntranceDoor", () => {
      const back = f.offset(0, 0, -e.recessDepth);
      const doorR: Rect = { u0: st.u0 + 0.12, u1: st.u1 - 0.12, v0: PLINTH_H, v1: e.head - 0.08 };
      wallWithHoles(bins, "renderGray", back, { u0: st.u0, u1: st.u1, v0: PLINTH_H, v1: e.head }, -0.25, 0, [doorR]);
      glazedOpening(ctx, back, doorR, { inset: 0.03, panelWidths: e.panels, door: true, wallT: 0.25, frameKey: "frame" });
      roomBox(ctx, back, st.u0 - 0.6, st.u1 + 0.6, PLINTH_H, PLINTH_H + 3.0, -0.25, -3.2, true, "stairInterior");
      // pull handle on the leaf
      const leafU = doorR.u0 + 0.07 + ((doorR.u1 - doorR.u0 - 0.14) * e.panels[0]) / e.panels.reduce((a, b) => a + b, 0) + 0.18;
      tube(bins, "steel", back, [[leafU, 0.95, 0.02], [leafU, 1.75, 0.02]], 0.015, 8);
    });

    /* stair glazing with vertical aluminium fins */
    bins.section("StairGlazing", () => {
      const g0 = e.lintelTop;
      const g1 = FRONT.stairGlazingTop;
      const fw = 0.06;
      box(bins, "aluFrame", f, st.u0, st.u0 + fw, g0, g1, -0.3, 0);
      box(bins, "aluFrame", f, st.u1 - fw, st.u1, g0, g1, -0.3, 0);
      box(bins, "aluFrame", f, st.u0 + fw, st.u1 - fw, g1 - fw, g1, -0.3, 0);
      box(bins, "aluFrame", f, st.u0 + fw, st.u1 - fw, g0, g0 + 0.05, -0.3, -0.02);
      box(bins, "aluFrame", f, (st.u0 + st.u1) / 2 - 0.03, (st.u0 + st.u1) / 2 + 0.03, g0, g1, -0.3, -0.2);
      for (const h of [FFL[1] + 0.6, FFL[2] + 0.6]) box(bins, "aluFrame", f, st.u0 + fw, st.u1 - fw, h, h + 0.05, -0.3, -0.2);
      bins.add("glass", boxGeo(st.u0 + fw, st.u1 - fw, g0 + 0.05, g1 - fw, -0.245, -0.24), f);
      const span = st.u1 - st.u0 - 2 * fw;
      const nFins = Math.floor(span / FRONT.finSpacing);
      const sp = span / nFins;
      for (let i = 0; i < nFins; i++) {
        const c = st.u0 + fw + sp * (i + 0.5);
        box(bins, "aluFin", f, c - 0.017, c + 0.017, g0 + 0.05, FRONT.stairSpandrel, -0.19, -0.03);
      }
      box(bins, "aluFin", f, st.u0 + fw, st.u1 - fw, RENDER_TOP - 0.03, RENDER_TOP + 0.03, -0.2, -0.012);
      box(bins, "spandrel", f, st.u0 + fw, st.u1 - fw, FRONT.stairSpandrel, g1 - fw, -0.24, -0.2);
    });

    /* stairwell seen through the glazing (inferred): dog-leg flights, half landings at the façade */
    bins.section("Stairwell", () => {
      const sw0 = st.u0 - 0.2;
      const sw1 = st.u1 + 0.2;
      const mid = (sw0 + sw1) / 2;
      roomBox(ctx, f, sw0, sw1, e.head, FRONT.stairGlazingTop + 0.3, -WALL_T, -WALL_T - 5.0, true, "stairInterior");
      for (let fl = 0; fl < 3; fl++) {
        const half = FFL[fl] + 1.5;
        if (half > e.head) box(bins, "concrete", f, sw0, sw1, half - 0.22, half, -WALL_T - 1.3, -WALL_T - 0.02);
        bins.add("concrete", rampGeo(sw0, mid - 0.05, -WALL_T - 3.6, -WALL_T - 1.3, FFL[fl], half, 0.25), f);
        if (fl < 2) {
          bins.add("concrete", rampGeo(mid + 0.05, sw1, -WALL_T - 3.6, -WALL_T - 1.3, FFL[fl + 1], half, 0.25), f);
          tube(bins, "steel", f, [[mid, half + 0.9, -WALL_T - 1.3], [mid, FFL[fl + 1] + 0.9, -WALL_T - 3.6]], 0.02, 8);
        }
      }
    });

    /* landing, steps (left half) and access ramp (right half) with handrails */
    bins.section("LandingAndRamp", () => {
      const L = FRONT.landing;
      const R = FRONT.ramp;
      const lu0 = st.u0 - 0.15;
      const lu1 = st.u1 + 0.15;
      box(bins, "paving", f, lu0, lu1, 0, L.top, 0, L.depth);
      box(bins, "paving", f, lu0, HW - 0.02, 0, L.top / 2, L.depth, L.depth + 0.36);
      box(bins, "paving", f, lu0 - 0.36, lu0, 0, L.top / 2, 0.15, L.depth + 0.36);
      const ru0 = lu1 - R.width;
      bins.add("paving", rampGeo(ru0, lu1, L.depth, L.depth + R.length, L.top, 0.0), f);
      const rampV = (w: number) => L.top - (L.top * (w - L.depth)) / R.length;
      for (const u of [ru0 + 0.06, lu1 - 0.06]) {
        const wa = L.depth + 0.15;
        const wb = L.depth + R.length - 0.25;
        tube(bins, "steel", f, [[u, rampV(wa), wa], [u, rampV(wa) + 0.92, wa]], 0.024, 8);
        tube(bins, "steel", f, [[u, rampV(wb), wb], [u, rampV(wb) + 0.92, wb]], 0.024, 8);
        tube(
          bins,
          "steel",
          f,
          [
            [u, rampV(wa) + 0.6, wa - 0.3],
            [u, rampV(wa) + 0.92, wa - 0.3],
            [u, rampV(wb) + 0.92, wb + 0.3],
            [u, rampV(wb) + 0.6, wb + 0.3],
          ],
          0.022,
          10,
        );
      }
    });
  });
}

/* ------------------------------------------------------------ left / right */
function buildSide(ctx: Ctx, f: Frame, mirror: boolean, length: number, downpipeU: number): void {
  const { bins } = ctx;
  // s is measured from the front corner; u follows the façade frame.
  const U = (s0: number, s1: number): [number, number] => (mirror ? [D - s1, D - s0] : [s0, s1]);
  const holes: Rect[] = [];
  const gs = SIDE.greyStrip;
  const nc = (gs.s0 + gs.s1) / 2;
  const [n0, n1] = U(nc - SIDE.narrowW / 2, nc + SIDE.narrowW / 2);
  const [b0, b1] = U(SIDE.band.s0, SIDE.band.s1);
  const bw = SIDE.bandWindowW;
  const narrowHoles: Rect[] = [];

  for (let fl = 0; fl < 3; fl++) {
    const nr = win(n0, n1, fl);
    holes.push(nr);
    if (fl < 2) narrowHoles.push(nr);
    stdWindow(ctx, f, nr, fl);
    if (fl < 2) {
      // recessed band: window · timber panel · window behind one continuous sill
      const band = win(b0, b1, fl);
      holes.push(band);
      for (const [a, b] of [
        [b0, b0 + bw],
        [b1 - bw, b1],
      ]) {
        glazedOpening(ctx, f, { ...band, u0: a, u1: b }, { inset: 0.12, wallT: WALL_T, room: room(fl) });
      }
      box(bins, "wood", f, b0 + bw, b1 - bw, band.v0, band.v1, -0.17, -0.12);
      box(bins, "sill", f, b0 - 0.035, b1 + 0.035, band.v0 - 0.04, band.v0 + 0.008, -0.12, 0.055);
    } else {
      for (const [a, b] of [
        [b0, b0 + bw],
        [b1 - bw, b1],
      ]) {
        const r = win(a, b, fl);
        holes.push(r);
        stdWindow(ctx, f, r, fl);
      }
    }
  }
  zonedWall(ctx, f, WALL_T, length - WALL_T, holes);
  // painted grey vertical strip carrying the narrow windows
  const [g0, g1] = U(gs.s0, gs.s1);
  wallWithHoles(bins, "renderGray", f, { u0: g0, u1: g1, v0: PLINTH_H, v1: RENDER_TOP }, -0.01, 0.012, narrowHoles);

  downpipe(ctx, f, downpipeU, OVERHANG + 0.08, GUTTER_V);
}

/* ------------------------------------------------------------------- rear */
function buildRear(ctx: Ctx): void {
  const f = FRAMES.rear;
  const { bins } = ctx;
  const C = REAR.central;
  const P = C.projection;
  const R = -REAR.loggiaRecess; // w of the loggia's back wall
  const F = REAR.portal;

  /* rear-right corner: loggia back wall (recessed behind the main rear line) */
  bins.section("Facades/Rear", () => {
    const holes: Rect[] = [];
    for (const fl of [0, 1]) {
      const d = door(REAR.loggiaDoor.u0, REAR.loggiaDoor.u1, fl);
      const w = win(REAR.loggiaWindow.u0, REAR.loggiaWindow.u1, fl);
      holes.push(d, w);
      stdDoor(ctx, f, d, fl, 2, R);
      stdWindow(ctx, f, w, fl, R);
    }
    const td = door(REAR.terraceDoor.u0, REAR.terraceDoor.u1, 2);
    holes.push(td);
    stdDoor(ctx, f, td, 2, 2, R);
    zonedWall(ctx, f, 0, C.u0, holes, R);
  });

  /* central projecting bay with box balconies and timber privacy fins */
  bins.section("RearBays/CentralBay", () => {
    const holes: Rect[] = [];
    for (const fl of [0, 1, 2]) {
      const d = door(REAR.centralDoor.u0, REAR.centralDoor.u1, fl);
      holes.push(d);
      stdDoor(ctx, f, d, fl, 3, P);
    }
    zonedWall(ctx, f, C.u0, C.u1, holes, P);
    // returns: the right-hand one runs back to the recessed loggia wall, the left-hand one to the main rear line
    const retRight = Frame.facade(V(HW - C.u0, 0, -HD - R), V(0, 0, -1), V(1, 0, 0));
    zonedWall(ctx, retRight, 0, P - R - WALL_T, []);
    const retLeft = Frame.facade(V(HW - C.u1, 0, -HD - P + WALL_T), V(0, 0, 1), V(-1, 0, 0));
    zonedWall(ctx, retLeft, 0, P - WALL_T, []);
    const bb = REAR.boxBalcony;
    for (const fl of [1, 2]) boxBalcony(ctx, f, bb.u0, bb.u1, P, bb.depth, FFL[fl], bb.slabT, bb.cheek);
    // timber privacy fins at both corners of the bay, dividing the terraces
    const s = REAR.screens;
    const v0 = REAR.terrace.top;
    timberFin(ctx, f, s.rightU, F.face, F.face + s.length, v0, v0 + s.height, s.thickness);
    timberFin(ctx, f, C.u1 - s.leftInset, P, P + s.length, v0, v0 + s.height, s.thickness);
  });

  /* rear-left bay with open balconies */
  bins.section("RearBays/SideBay", () => {
    const holes: Rect[] = [];
    for (const fl of [0, 1, 2]) {
      const d = door(REAR.openDoor.u0, REAR.openDoor.u1, fl);
      holes.push(d);
      stdDoor(ctx, f, d, fl, 2);
    }
    zonedWall(ctx, f, C.u1, W, holes);
    const ob = REAR.openBalcony;
    for (const fl of [1, 2]) openBalcony(ctx, f, ob.u0, ob.u1, 0, ob.depth, FFL[fl], ob.slabT);
  });

  /* rear-right corner portal: two-storey loggia with a roof terrace above */
  bins.section("RearBays/CornerPortal", () => {
    const ep = F.cornerPier;
    const beam0 = F.face - F.beamT;
    const slab = F.slabT;
    box(bins, "render", f, F.u0, ep.u1, 0, F.top, ep.w0, F.face); // corner pier
    box(bins, "render", f, F.innerPier.u0, F.u1, 0, F.beamBottom, R, F.face); // inner pier / party wall
    box(bins, "render", f, F.u0, F.u1, F.beamBottom, F.top, beam0, F.face); // deep beam = terrace parapet
    // roof-terrace slab; its grey edge cantilevers sideways past the main wall between pier and block
    box(bins, "concrete", f, F.u0, F.u1, F.beamBottom, FFL[2], R, ep.w0);
    box(bins, "concrete", f, ep.u1, F.u1, F.beamBottom, FFL[2], ep.w0, beam0);
    box(bins, "deck", f, F.u0 + 0.02, F.u1, FFL[2], FFL[2] + 0.015, R, ep.w0);
    box(bins, "deck", f, ep.u1, F.u1, FFL[2], FFL[2] + 0.015, ep.w0, beam0);
    // first-floor loggia slab, same side cantilever
    const ls = F.face - 0.15;
    box(bins, "concrete", f, F.u0, F.innerPier.u0, FFL[1] - slab, FFL[1], R, ep.w0);
    box(bins, "concrete", f, ep.u1, F.innerPier.u0, FFL[1] - slab, FFL[1], ep.w0, ls);
    box(bins, "deck", f, F.u0 + 0.02, F.innerPier.u0, FFL[1], FFL[1] + 0.015, R, ep.w0);
    box(bins, "deck", f, ep.u1, F.innerPier.u0, FFL[1], FFL[1] + 0.015, ep.w0, ls - 0.02);
    glassBalustrade(ctx, f, [{ a: [ep.u1, ls + 0.018], b: [F.innerPier.u0, ls + 0.018], vBot: FFL[1] - slab + 0.1 }], FFL[1] + 1.06);
    // balustrades on the open right-hand side (read as small stacked balconies in images 1 and 2)
    const rf = FRAMES.right;
    const r0 = D + R + 0.02;
    const r1 = D + ep.w0;
    const we = -F.u0 + 0.018;
    glassBalustrade(ctx, rf, [{ a: [r0, we], b: [r1, we], vBot: FFL[1] - slab + 0.1 }], FFL[1] + 1.06);
    glassBalustrade(ctx, rf, [{ a: [r0, we], b: [r1, we], vBot: FFL[2] - slab + 0.1 }], FFL[2] + 1.06);
  });

  /* rear terraces: smooth concrete with two-riser edges */
  bins.section("Terraces", () => {
    const T = REAR.terrace;
    const st = T.step;
    const h = T.top;
    const e0 = F.u0 - 0.35;
    // central bay + loggia terrace (runs into the loggia up to its back wall)
    box(bins, "terrace", f, e0, C.u1, 0, h, R, T.depthCentral);
    box(bins, "terrace", f, e0 - st, C.u1 + st, 0, h / 2, T.depthCentral, T.depthCentral + st);
    box(bins, "terrace", f, e0 - st, e0, 0, h / 2, R - st, T.depthCentral);
    box(bins, "terrace", f, e0 - st, 0, 0, h / 2, R - st, R);
    box(bins, "terrace", f, C.u1, C.u1 + st, 0, h / 2, T.depthSide + st, T.depthCentral);
    // rear-left terrace
    box(bins, "terrace", f, C.u1, W, 0, h, 0, T.depthSide);
    box(bins, "terrace", f, C.u1, W + st, 0, h / 2, T.depthSide, T.depthSide + st);
    box(bins, "terrace", f, W, W + st, 0, h / 2, 0, T.depthSide);
  });
}

/** Plan footprint of the walls at ground level, in world units (for the contact shadow). */
export function footprint(): THREE.Box3 {
  const F = REAR.portal;
  return new THREE.Box3(V(-HW, 0, -HD - F.face), V(HW - F.u0, 0, HD)).applyMatrix4(new THREE.Matrix4().makeScale(SCALE, SCALE, SCALE));
}

/**
 * Space the camera must stay out of: the walls and everything attached to them
 * below the eaves (with a small clearance), and the roof above them.
 */
export function cameraKeepOut(clearance: number): { walls: THREE.Box3; roofTop: (x: number, z: number) => number | null } {
  const c = clearance;
  const zRear = -HD - REAR.central.projection - REAR.boxBalcony.depth;
  const walls = new THREE.Box3(V(-HW - c, -1, zRear - c), V(HW - REAR.portal.u0 + c, SOFFIT_Y + 0.05, HD + c)).applyMatrix4(
    new THREE.Matrix4().makeScale(SCALE, SCALE, SCALE),
  );
  const roofTop = (x: number, z: number) => {
    const lx = x / SCALE;
    const lz = z / SCALE;
    if (Math.abs(lx) > EAVE_X + c || Math.abs(lz) > EAVE_Z + c) return null;
    return roofHeightAt(lx, lz) * SCALE;
  };
  return { walls, roofTop };
}

/**
 * Generate the complete exterior.
 *
 * Scene graph (each leaf group holds one merged mesh per material):
 *   Building
 *   ├─ Facades     Front · Right · Left · Rear (walls, windows, sills, downpipes)
 *   ├─ StairCore   Entrance · EntranceDoor · StairGlazing · Stairwell · LandingAndRamp
 *   ├─ RearBays    CornerPortal · CentralBay · SideBay
 *   ├─ Terraces
 *   ├─ Roof        Soffit · Edge · Covering · Stacks (+ instanced seams)
 *   └─ Interiors   simple rooms behind the glazing (inferred)
 * Groups carry `userData.evidence` ("observed" | "inferred") from EVIDENCE in spec.ts.
 */
export function buildBuilding(materials: Materials): THREE.Group {
  const bins = new Bins();
  const ctx: Ctx = { bins, rand: mulberry32(2024) };
  buildFront(ctx);
  const rightLen = D - REAR.loggiaRecess; // right façade ends at the recessed loggia wall
  bins.section("Facades/Right", () => buildSide(ctx, FRAMES.right, false, rightLen, rightLen - 0.25));
  bins.section("Facades/Left", () => buildSide(ctx, FRAMES.left, true, D, 0.28));
  buildRear(ctx);
  bins.section("Roof", () => buildRoof(ctx, materials));
  const root = bins.build("Building", materials, NO_SHADOW);
  root.traverse((o) => {
    const ev = EVIDENCE[o.name];
    if (ev) o.userData.evidence = ev.status;
  });
  root.scale.setScalar(SCALE);
  return root;
}
