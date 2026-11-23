export type Vec3 = [number, number, number];

export interface ViewPreset {
  id: string;
  label: string;
  hint: string;
  position: Vec3;
  target: Vec3;
}

/** Orbit presets that frame the building like the reference renders. */
export const VIEWS: ViewPreset[] = [
  { id: "front", label: "Entrance", hint: "South-east, as image 1", position: [15.3, 1.9, 19.6], target: [1.6, 4.6, 1.6] },
  { id: "rearNE", label: "Rear NE", hint: "North-east, as image 2", position: [17.2, 1.9, -19.6], target: [1.2, 4.6, -2.0] },
  { id: "rearNW", label: "Rear NW", hint: "North-west, as image 3", position: [-17.6, 1.9, -17.6], target: [-1.6, 4.6, -1.6] },
  { id: "aerial", label: "Aerial", hint: "From above the entrance, as image 5", position: [0, 39, 27], target: [0, 5, -0.5] },
];

/**
 * Validation cameras reproducing the reference renders (open with ?match=img1 …).
 * Images 1–3 are level two-point perspectives with vertical lens shift: the
 * camera looks horizontally along `dir` and the horizon sits at `horizon` × image
 * height. `focal` is the focal length as a fraction of image width.
 * Image 1 was solved from vanishing points, images 2 and 3 from point
 * correspondences (Nelder–Mead, RMS 5–7 px); image 5 is a hand-tuned overlay.
 */
export interface MatchCamera {
  aspect: number;
  position: Vec3;
  dir?: [number, number];
  focal?: number;
  horizon?: number;
  target?: Vec3;
  fov?: number;
}

export const MATCH: Record<string, MatchCamera> = {
  img1: { aspect: 2120 / 1398, position: [15.28, 1.71, 19.78], dir: [-0.605, -0.797], focal: 0.7905, horizon: 0.7885 },
  img2: { aspect: 2136 / 1402, position: [18.458, 1.807, -17.669], dir: [-0.7128, 0.7013], focal: 0.7627, horizon: 0.7798 },
  img3: { aspect: 2122 / 1388, position: [-18.305, 1.779, -16.835], dir: [0.7238, 0.69], focal: 0.7783, horizon: 0.7907 },
  img5: { aspect: 1864 / 1284, position: [0.05, 34.0, 28.05], target: [0.1, 19.47, 14.3], fov: 37.2 },
};
