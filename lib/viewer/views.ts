export type Vec3 = [number, number, number];

/**
 * Optional opening directions (`?view=` in the URL). The distance and target are
 * always fitted to the building, so each preset frames the whole exterior.
 * Azimuth / elevation follow lib/viewer/config.ts.
 */
export const VIEWS: Record<string, { azimuth: number; elevation: number; label: string }> = {
  start: { azimuth: 144.5, elevation: 3, label: "Rear-right three-quarter view" },
  front: { azimuth: 37, elevation: 3, label: "Front-right, as image 1" },
  rearRight: { azimuth: 138, elevation: 3, label: "Rear-right, as image 2" },
  rearLeft: { azimuth: 225, elevation: 3, label: "Rear-left, as image 3" },
  aerial: { azimuth: 0, elevation: 47, label: "From above the entrance, as image 5" },
};

/**
 * Validation cameras reproducing the reference renders (open with ?match=img1 …).
 * Images 1–3 are level two-point perspectives with vertical lens shift: the
 * camera looks horizontally along `dir` and the horizon sits at `horizon` × image
 * height. `focal` is the focal length as a fraction of image width.
 * Image 1 was solved from vanishing points, images 2 and 3 from point
 * correspondences (Nelder–Mead, RMS 5–7 px); image 5 is a hand-tuned overlay.
 */
export interface MatchCamera {
  /** Reference image width / height; the validation view is letterboxed to it. */
  aspect: number;
  image: string;
  position: Vec3;
  dir?: [number, number];
  focal?: number;
  horizon?: number;
  target?: Vec3;
  fov?: number;
}

export const MATCH: Record<string, MatchCamera> = {
  img1: { aspect: 2120 / 1398, image: "/validation/img1.jpg", position: [15.28, 1.71, 19.78], dir: [-0.605, -0.797], focal: 0.7905, horizon: 0.7885 },
  img2: { aspect: 2136 / 1402, image: "/validation/img2.jpg", position: [18.458, 1.807, -17.669], dir: [-0.7128, 0.7013], focal: 0.7627, horizon: 0.7798 },
  img3: { aspect: 2122 / 1388, image: "/validation/img3.jpg", position: [-18.305, 1.779, -16.835], dir: [0.7238, 0.69], focal: 0.7783, horizon: 0.7907 },
  img5: { aspect: 1864 / 1284, image: "/validation/img5.jpg", position: [0.05, 34.0, 28.05], target: [0.1, 19.47, 14.3], fov: 37.2 },
};
