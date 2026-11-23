/**
 * Building specification — every dimension used by the generator lives here.
 *
 * All values are metres. World axes: +x = east, +y = up, +z = south.
 * The entrance façade faces south (+z); the main block is centred on the origin.
 *
 * HOW THESE NUMBERS WERE OBTAINED
 * --------------------------------
 * The references are five marketing renders (/Building/Image 1–5), not drawings.
 * Image 1 was solved as a level two-point-perspective camera: the two horizontal
 * vanishing points give a focal length of ≈ 0.79 × image width (≈ 28 mm equivalent),
 * and the storey height was taken as 3.0 m to fix the scale. Positions along the
 * façades were then intersected from that camera. Images 2, 3 and 5 were used for
 * the rear, west side and roof, and to cross-check proportions.
 *
 * Images 2 and 3 were then solved the same way from 11–12 point correspondences
 * each (RMS 5–7 px at 1200 px width); rear elements were located by
 * back-projecting onto known planes and by triangulating between the two views.
 *
 * Measured (± roughly 5 %): façade width, window spacing/sizes, storey heights,
 * render/timber line, side-façade bay positions, eaves overhang, rear bay
 * positions and projections, NE portal frame, balcony extents.
 * Assumed (not determinable from the renders): wall thickness, reveal depths, slab
 * thicknesses, roof pitch, exact rear projection depths, chimney sizes, hidden rear
 * details that are occluded in every view. These are documented inline below.
 */

export const W = 18.0; // main block width (E–W), measured
export const D = 12.3; // main block depth (N–S) to the main rear wall line; images 2 and 3 solve to 12.24 / 12.32
export const HW = W / 2;
export const HD = D / 2;

export const WALL_T = 0.38; // assumed: external wall incl. insulation
export const PLINTH_H = 0.33; // ground-floor level above grade (plinth band height), measured
export const STOREY = 3.0; // assumed scale reference
export const FFL = [PLINTH_H, PLINTH_H + STOREY, PLINTH_H + 2 * STOREY] as const;

export const SILL = 0.85; // window sill above finished floor, measured
export const HEAD = 2.25; // window/door head above finished floor, measured
export const SOFFIT_Y = 9.1; // underside of the boxed eaves = top of walls, measured
/** White render below, horizontal timber cladding above: the line runs along the
 *  top-floor window sills on every façade (measured on images 1 and 3). */
export const RENDER_TOP = FFL[2] + SILL;

/* ---------------------------------------------------------------- roof */
export const OVERHANG = 1.5; // measured ≈ 1.5–1.8 m on image 1
export const FASCIA_H = 0.26;
export const ROOF_BASE_Y = SOFFIT_Y + FASCIA_H;
/** Long (front/back) roof slopes; solved from the aerial view (image 5) at ≈ 21°. */
export const ROOF_PITCH = (21.3 * Math.PI) / 180;
export const EAVE_X = HW + OVERHANG;
export const EAVE_Z = HD + OVERHANG;
/** Half-length of the ridge. Image 5 shows a ≈ 4 m ridge, shorter than an equal-pitch
 *  hip would give, so the hipped ends are slightly shallower (≈ 19°). */
export const RIDGE_HALF = 2.0;
export const ROOF_RISE = EAVE_Z * Math.tan(ROOF_PITCH);
export const HIP_END_PITCH = Math.atan(ROOF_RISE / (EAVE_X - RIDGE_HALF));

/* -------------------------------------------------------- front (south) */
/** Façade-local u runs from the west end (u = 0) to the east end (u = W). */
export const FRONT = {
  windowCentres: [HW - 6.3, HW - 3.3, HW + 3.3, HW + 6.3],
  windowW: 1.3,
  stair: { u0: HW - 1.3, u1: HW + 1.3 }, // central stair core strip, 2.6 m
  entrance: {
    recessDepth: 1.3, // from the visible depth of the west jamb in image 1
    head: 2.5, // underside of the grey lintel band
    lintelTop: 2.88,
  },
  stairGlazingTop: 8.6,
  stairSpandrel: 8.1, // dark band at the top of the stair glazing
  finSpacing: 0.115,
  landing: { depth: 1.3, top: 0.3 },
  ramp: { length: 4.0, width: 1.3 },
  downpipeU: W - 0.28,
} as const;

/* ------------------------------------------------------- sides (E / W) */
/** Distances measured from the FRONT corner of each side façade (s = 0 at the
 *  south corner, s = D at the north corner). Same layout mirrored E/W. */
export const SIDE = {
  greyStrip: { s0: 2.75, s1: 3.7 },
  narrowW: 0.6,
  band: { s0: 5.64, s1: 10.36 }, // window + timber panel + window
  bandWindowW: 1.0,
} as const;

/* -------------------------------------------------------- rear (north) */
/** North façade-local u runs from the east end (u = 0, x = +9) to the west end
 *  (u = W, x = −9); u = HW − x. Depth w is measured outwards (northwards) from
 *  the main rear wall line z = −D/2, which the west bay and NW corner sit on. */
export const REAR = {
  /** NE corner: the loggia bay's back wall (and the end of the east façade) sits
   *  this far behind the main rear line — image 1's east façade ends here. */
  loggiaRecess: 0.65,
  /** White portal frame wrapping the NE corner: north face 1.15 m proud of the
   *  rear line, east face 0.81 m proud of the east wall (triangulated). Two-storey
   *  loggia behind; roof terrace on top; open to the east between the corner pier
   *  and the main block, where the loggia and terrace slabs cantilever out. */
  frame: {
    u0: -0.81, // east face (x = 9.81)
    u1: 5.9, // west end (x = 3.1)
    face: 1.15, // north face
    eastPier: { u1: 0.61, w0: 0.61 }, // pier 1.42 m wide, 0.54 m deep
    westPier: { u0: 5.17 },
    beamBottom: 5.89,
    top: 7.29, // terrace parapet ≈ 0.96 m above the top floor
    beamT: 0.25,
    slabT: 0.45,
  },
  /** Central bay: projects 1.0 m on all floors (returns seen in images 2 and 3). */
  central: { u0: 5.9, u1: 12.4, projection: 1.0 },
  boxBalcony: { u0: 6.85, u1: 11.05, depth: 1.2 },
  centralDoor: { u0: 7.45, u1: 10.5 }, // three-leaf sliding door, centred on the building
  /** West bay on the main rear line: shallow open balconies between the central
   *  bay and a point 0.4 m short of the NW corner. */
  openBalcony: { u0: 12.45, u1: 17.6, depth: 0.9 },
  openDoor: { u0: 14.45, u1: 16.6 },
  loggiaDoor: { u0: 2.3, u1: 4.25 },
  loggiaWindow: { u0: 0.95, u1: 1.85 }, // assumed: mostly hidden behind the corner pier
  terraceDoor: { u0: 2.1, u1: 4.35 }, // top floor, behind the parapet
  terrace: { depthCentral: 3.2, depthWest: 2.6, top: 0.3 },
  screens: { width: 0.65, height: 2.15, gap: 0.55, standOff: 0.18 },
} as const;

/* ------------------------------------------------------------- roof top */
/** Chimney / ventilation stacks — six, positions read from the aerial view (image 5). */
export const CHIMNEYS: ReadonlyArray<readonly [number, number]> = [
  [-2.0, 0.9],
  [2.0, 0.9],
  [-2.65, -1.6],
  [2.65, -1.6],
  [-5.6, 0.4],
  [5.6, 0.4],
];

/** Height of the hip-roof surface at plan position (x, z): lower envelope of the four planes. */
export function roofHeightAt(x: number, z: number): number {
  const long = (EAVE_Z - Math.abs(z)) * Math.tan(ROOF_PITCH);
  const end = (EAVE_X - Math.abs(x)) * Math.tan(HIP_END_PITCH);
  return ROOF_BASE_Y + Math.max(0, Math.min(long, end, ROOF_RISE));
}

export const RIDGE_Y = ROOF_BASE_Y + ROOF_RISE;
