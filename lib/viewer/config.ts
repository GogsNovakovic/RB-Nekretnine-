/**
 * Viewer settings: camera lens, framing, control limits, render quality, lighting
 * and ground. Angles are in degrees.
 *
 * Directions use the building's own axes (see lib/building/spec.ts): azimuth 0 looks
 * at the front façade, 90 at the right façade, 180 at the rear, 270 at the left.
 * Elevation is the camera's angle above the horizontal through the orbit target.
 */
export const VIEWER = {
  lens: {
    /** Vertical field of view on landscape screens. */
    fov: 30,
    /** On narrow (portrait) screens the vertical FOV widens so the horizontal FOV stays at least this. */
    minHorizontalFov: 36,
    near: 0.3,
    far: 600,
  },

  /** First-load framing: the whole building is fitted into the viewport from this direction. */
  start: { azimuth: 144.5, elevation: 3 },
  /** Fraction of the half-frame left clear on every side when fitting. */
  margin: 0.07,

  controls: {
    damping: 0.08,
    rotateSpeed: 0.6,
    zoomSpeed: 0.9,
    panSpeed: 0.7,
    /** Closest the camera may get to the orbit target (m). */
    minDistance: 10,
    /** Closest the camera may get to any wall (m) and to the roof surface (m). */
    wallClearance: 3,
    roofClearance: 1.5,
    /** Farthest zoom-out, as a multiple of the fitted first-load distance. */
    maxDistanceFactor: 2.0,
    /** Smallest angle from straight down (keeps the up-vector stable over the roof). */
    minPolar: 4,
    /** The camera may tilt below the target's height but never lower than this above the ground (m). */
    minEyeHeight: 1.2,
    /** How far the orbit target may be panned beyond the building's bounding box (m). */
    panSlack: 2,
    autoRotate: false,
    /** Keyboard steps. */
    keyRotate: 6,
    keyZoom: 1.12,
    resetMs: 900,
  },

  render: {
    maxPixelRatio: 2,
    /** Lower cap on touch devices (usually phones and tablets). */
    maxPixelRatioTouch: 1.5,
    shadowMapSize: 2048,
    shadowMapSizeTouch: 1024,
    /** "neutral" (Khronos PBR Neutral), "agx" or "aces". */
    toneMapping: "neutral" as "neutral" | "agx" | "aces",
    exposure: 1.0,
    /** Lower the pixel ratio in 0.25 steps (down to 1) if interaction falls below ~35 fps. */
    adaptive: true,
  },

  lighting: {
    /** Direction towards the sun. Azimuth 125 = from the rear-right; lights the rear and right façades. */
    sunAzimuth: 125,
    sunElevation: 50,
    sunColor: "#fff1df",
    sunIntensity: 2.4,
    /** Sky and ground fill (hemisphere light). */
    skyColor: "#dfe9f5",
    groundColor: "#8f8a7e",
    fillIntensity: 1.1,
    /** Image-based light from the procedural sky (also the source of glass reflections). */
    environmentIntensity: 0.75,
    /** Weak light from below: sunlit ground bouncing onto soffits and slab undersides. */
    bounceIntensity: 0.55,
  },

  ground: {
    /** Darkness of the sun shadow on the ground. */
    shadowOpacity: 0.22,
    /** Faint ground tint so the building has something to stand on when seen from above. */
    tint: 0.05,
    /** The ground fades out between these radii (m) from the building centre. */
    fadeInner: 10,
    fadeOuter: 22,
    /** Soft contact shadow under the footprint (ambient occlusion stand-in). */
    contactOpacity: 0.32,
    contactSpread: 2.2,
  },
} as const;
