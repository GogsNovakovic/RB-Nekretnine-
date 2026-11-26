/**
 * Building specification: every dimension the generator uses lives here.
 *
 * COORDINATES
 * -----------
 * Metres. Y is up and the finished ground is Y = 0. The main block is centred on
 * the origin in plan.
 *   front  = the entrance façade, facing +Z
 *   rear   = facing −Z
 *   right  = facing +X
 *   left   = facing −X
 * "Left" and "right" are as seen by someone standing in front of the entrance,
 * looking at the building. The references give no compass orientation, so none is
 * used here.
 *
 * HOW THESE NUMBERS WERE OBTAINED
 * --------------------------------
 * The references are five marketing renders (Building/Image 1–5), not drawings.
 *  - Image 1 (front-right view) was solved as a level two-point-perspective camera.
 *    Its two horizontal vanishing points give a focal length of ≈ 0.79 × image width
 *    (≈ 28 mm equivalent). Positions along the front and right façades were then
 *    intersected from that camera.
 *  - Images 2 and 3 (rear-right and rear-left views) were solved as level cameras
 *    from 11–12 point correspondences each (RMS 5–7 px at 1200 px width). Both give a
 *    depth of ≈ 12.3 m. Rear elements were located by back-projecting onto known
 *    planes and by triangulating between the two views.
 *  - Image 5 (aerial) was solved as a tilted camera, which also gives the roof pitch.
 *
 * SCALE: no dimension is given anywhere, so the storey height STOREY = 3.0 m is an
 * ESTIMATE that fixes the absolute scale. Every other length was measured relative
 * to it. Changing STOREY alone does not rescale the model: scale the whole
 * `building` group instead (see SCALE below).
 *
 * Tags used below:
 *   measured  ≈ ±5 % relative to the storey height
 *   estimate  plausible value; not visible or not measurable in any reference
 */

/** Uniform scale applied to the finished building group (1 = the 3.0 m storey estimate). */
export const SCALE = 1;

export const W = 18.0; // main block width (left–right), measured
export const D = 12.3; // main block depth (front–rear) to the main rear wall line; images 2 / 3 solve to 12.24 / 12.32
export const HW = W / 2;
export const HD = D / 2;

export const WALL_T = 0.38; // estimate: external wall incl. insulation
export const PLINTH_H = 0.33; // ground-floor level above grade (plinth band), measured
export const STOREY = 3.0; // ESTIMATE: fixes the absolute scale
/** Finished floor levels: ground, first, top. */
export const FFL = [PLINTH_H, PLINTH_H + STOREY, PLINTH_H + 2 * STOREY] as const;

export const SILL = 0.85; // window sill above finished floor, measured
export const HEAD = 2.25; // window / door head above finished floor, measured
export const SOFFIT_Y = 9.1; // underside of the boxed eaves = top of walls, measured
/** White render below, horizontal timber cladding above. The line runs along the
 *  top-floor window sills on every façade (measured on images 1 and 3). */
export const RENDER_TOP = FFL[2] + SILL;

/* ---------------------------------------------------------------- roof */
export const OVERHANG = 1.5; // measured ≈ 1.5–1.8 m on image 1
export const FASCIA_H = 0.26; // measured
export const ROOF_BASE_Y = SOFFIT_Y + FASCIA_H;
/** Front and rear roof slopes; solved from the aerial view (image 5) at ≈ 21°. */
export const ROOF_PITCH = (21.3 * Math.PI) / 180;
export const EAVE_X = HW + OVERHANG;
export const EAVE_Z = HD + OVERHANG;
/** Half-length of the ridge. Image 5 shows a ≈ 4 m ridge, shorter than an equal-pitch
 *  hip would give, so the hipped ends are slightly shallower (≈ 19°). */
export const RIDGE_HALF = 2.0;
export const ROOF_RISE = EAVE_Z * Math.tan(ROOF_PITCH);
export const HIP_END_PITCH = Math.atan(ROOF_RISE / (EAVE_X - RIDGE_HALF));
export const SEAM_SPACING = 0.5; // standing-seam rib spacing, measured on image 5 (≈ 36 ribs per long slope)

/* --------------------------------------------------------------- front */
/** Front façade-local u runs from the left end (u = 0, x = −9) to the right end (u = W, x = +9). */
export const FRONT = {
  /** Two windows each side of the stair core on every floor (12 in all). */
  windowCentres: [HW - 6.3, HW - 3.3, HW + 3.3, HW + 6.3],
  windowW: 1.3,
  stair: { u0: HW - 1.3, u1: HW + 1.3 }, // central stair-core strip, 2.6 m, measured
  entrance: {
    recessDepth: 1.3, // from the visible depth of the left jamb in image 1
    head: 2.5, // underside of the grey lintel band
    lintelTop: 2.88,
    /** Door assembly across the back of the recess: sidelight · door leaf · sidelight.
     *  ESTIMATE: image 1 shows one glazed leaf plus a narrow sidelight; image 5 shows
     *  three panels across the recess. This layout satisfies both. */
    panels: [0.5, 1.1, 0.5],
  },
  stairGlazingTop: 8.6,
  stairSpandrel: 8.1, // dark band at the top of the stair glazing
  finSpacing: 0.115, // ≈ 20 vertical fins across the core, measured
  landing: { depth: 1.3, top: 0.3 },
  ramp: { length: 4.0, width: 1.3 }, // runs straight out from the façade (image 5)
  downpipeU: W - 0.28, // front-right corner only (images 1, 5)
} as const;

/* ---------------------------------------------------- sides (left / right) */
/** Distances measured from the FRONT corner of each side façade (s = 0 at the front
 *  corner, s = D at the rear corner). The left façade mirrors the right one. */
export const SIDE = {
  greyStrip: { s0: 2.75, s1: 3.7 }, // grey vertical strip carrying narrow windows
  narrowW: 0.6,
  band: { s0: 5.64, s1: 10.36 }, // recessed band: window + timber panel + window
  bandWindowW: 1.0,
} as const;

/* ---------------------------------------------------------------- rear */
/** Rear façade-local u runs from the right end (u = 0, x = +9) to the left end
 *  (u = W, x = −9), i.e. left to right as seen when facing the rear façade; u = HW − x.
 *  Depth w is measured outwards (towards −Z) from the main rear wall line z = −D/2,
 *  on which the rear-left bay and the rear-left corner sit. */
export const REAR = {
  /** Rear-right corner: the loggia's back wall (and the rear end of the right façade)
   *  sits this far in front of the main rear line. Image 1's right façade ends here. */
  loggiaRecess: 0.65,
  /** White portal frame wrapping the rear-right corner. Its rear face stands 1.15 m
   *  proud of the rear line and its right face 0.81 m proud of the right wall
   *  (triangulated). Two-storey loggia behind it, roof terrace on top. It is open to
   *  the right between the corner pier and the main block, where the loggia and
   *  terrace slabs cantilever out (sky visible through it in image 3). */
  portal: {
    u0: -0.81, // outer side face (x = 9.81)
    u1: 5.9, // inner end (x = 3.1)
    face: 1.15, // rear face
    cornerPier: { u1: 0.61, w0: 0.61 }, // 1.42 m wide, 0.54 m deep
    innerPier: { u0: 5.17 },
    beamBottom: 5.89,
    top: 7.29, // terrace parapet ≈ 0.96 m above the top floor
    beamT: 0.25, // estimate
    slabT: 0.45, // estimate
  },
  /** Central bay: projects 1.0 m on all floors (returns visible in images 2 and 3). */
  central: { u0: 5.9, u1: 12.4, projection: 1.0 },
  boxBalcony: { u0: 6.85, u1: 11.05, depth: 1.2, slabT: 0.4, cheek: 0.2 },
  centralDoor: { u0: 7.45, u1: 10.5 }, // three-leaf sliding door, centred on the building
  /** Rear-left bay on the main rear line: open balconies between the central bay and
   *  a point 0.4 m short of the rear-left corner. */
  openBalcony: { u0: 12.45, u1: 17.6, depth: 0.9, slabT: 0.32 },
  openDoor: { u0: 14.45, u1: 16.6 },
  loggiaDoor: { u0: 2.3, u1: 4.25 },
  loggiaWindow: { u0: 0.95, u1: 1.85 }, // ESTIMATE: mostly hidden behind the corner pier
  terraceDoor: { u0: 2.1, u1: 4.35 }, // top floor, behind the parapet
  terrace: { depthCentral: 3.2, depthSide: 2.6, top: 0.3, step: 0.35 },
  /** Timber privacy fins dividing the ground-floor terraces, perpendicular to the façade:
   *  one on the line of the portal's inner pier, one at the left-hand corner of the
   *  central bay. Orientation, positions and length come from overlaying images 2 and 3:
   *  the roots coincide in both views while the free ends swing to opposite sides. */
  screens: { length: 0.8, height: 2.2, thickness: 0.1, rightU: 5.535, leftInset: 0.12 },
} as const;

/* ------------------------------------------------------------- roof top */
/** Six chimney / vent stacks, positions read from the aerial view (image 5), as plan
 *  (x, z): two on the rear slope near the ridge, two on the front slope below the
 *  ridge ends, one on each hipped end. */
export const CHIMNEYS: ReadonlyArray<readonly [number, number]> = [
  [-2.0, 0.9],
  [2.0, 0.9],
  [-2.65, -1.6],
  [2.65, -1.6],
  [-5.6, 0.4],
  [5.6, 0.4],
];
/** Stack size. None of the stacks shows above the eaves in the eye-level renders,
 *  which caps the overall height at ≈ 1.6 m above the roof for the front pair (sight
 *  lines from the image 1 camera). Height is an ESTIMATE within that limit. */
export const CHIMNEY = { half: 0.28, height: 0.7, capT: 0.08, flueH: 0.36, flueR: 0.085, hoodR: 0.16, hoodH: 0.12 } as const;

/** Height of the hip-roof surface at plan position (x, z): lower envelope of the four planes. */
export function roofHeightAt(x: number, z: number): number {
  const long = (EAVE_Z - Math.abs(z)) * Math.tan(ROOF_PITCH);
  const end = (EAVE_X - Math.abs(x)) * Math.tan(HIP_END_PITCH);
  return ROOF_BASE_Y + Math.max(0, Math.min(long, end, ROOF_RISE));
}

export const RIDGE_Y = ROOF_BASE_Y + ROOF_RISE;

/**
 * Evidence register for the major parts, keyed by the group names used in the scene
 * graph. "inferred" parts are hidden or ambiguous in every reference: each sits in a
 * group of its own so it can be replaced without touching the rest.
 */
export const EVIDENCE: Record<string, { status: "observed" | "inferred"; note: string }> = {
  Front: { status: "observed", note: "images 1, 4, 5" },
  Entrance: { status: "observed", note: "recess, lintel, landing, steps, ramp: images 1, 5" },
  EntranceDoor: { status: "inferred", note: "panel split ambiguous between images 1 and 5" },
  Stairwell: { status: "inferred", note: "only faintly visible through the stair glazing" },
  Right: { status: "observed", note: "images 1, 2" },
  Left: { status: "observed", note: "images 3, 4; mirrors the right façade" },
  Rear: { status: "observed", note: "images 2, 3" },
  CornerPortal: { status: "observed", note: "images 1, 2, 3; inner loggia window is an estimate" },
  CentralBay: { status: "observed", note: "images 2, 3" },
  SideBay: { status: "observed", note: "images 2, 3" },
  Terraces: { status: "observed", note: "images 2, 3" },
  Roof: { status: "observed", note: "images 1–5; stack height is an estimate" },
  Interiors: { status: "inferred", note: "simple rooms behind the glazing so windows keep their depth" },
};
