# Building exterior — interactive 3D reconstruction

A browser viewer for the residential building shown in the five reference renders
(`Building/Image 1–5.png`). The whole exterior is generated in code with Three.js:
there are no imported models, photos or pre-rendered frames.

```bash
npm install
npm run dev        # http://localhost:3000
```

**Controls:** drag to orbit and tilt, scroll or pinch to zoom, right-drag or two fingers
to pan. Buttons jump to the reference viewpoints. The camera is kept outside the
walls, above the ground and above the roof.

## What is modelled

- A three-storey block (18.0 × 12.3 m) with a stone plinth, white render, and
  horizontal timber cladding above the top-floor sill line.
- A low hip roof in standing-seam metal with a boxed timber soffit. It has fascia,
  half-round gutters, downpipes, hip and ridge caps and six chimney stacks.
- Front: a central stair core with full-height glazing behind vertical fins. Below
  it is a recessed entrance with a grey lintel, glazed double doors, a landing and
  steps, and a ramp with stainless handrails. A simple stairwell is visible
  through the glass.
- Sides: a grey vertical strip with narrow windows, and recessed window bands with
  timber panels.
- Rear: a projecting central bay with box balconies and timber privacy screens, and
  shallow open balconies on the west bay. A white two-storey portal frame wraps the
  NE corner around a loggia with a roof terrace. Stepped terraces run along the base.
- Every window and door is a real opening. Each has a frame, sashes or sliding
  leaves, glass, a sill and a shallow room behind it, so the glazing keeps its
  depth from any angle.

## How the geometry was derived

All dimensions live in [`lib/building/spec.ts`](lib/building/spec.ts). Each value
there is marked as measured or assumed.

- **Image 1** was solved as a level two-point-perspective camera from its
  vanishing points.
- **Images 2 and 3** were solved from point correspondences (RMS 5–7 px). Rear
  features were then located by back-projection and two-view triangulation.
- **Image 5** (aerial) was solved as a tilted camera, which also gives the roof
  pitch (≈ 21°).
- **Scale** comes from an assumed 3.0 m storey height. Hidden details (wall
  thickness, slab depths, parts of the loggia) are reasonable assumptions, not
  survey data.

### Checking against the references

`/?match=img1`, `img2`, `img3` and `img5` render the model with the solved
reference camera and hide the overlay. Screenshot the page at the reference's
aspect ratio and lay it over the original to compare.

## Code layout

| Path | Purpose |
| --- | --- |
| `lib/building/spec.ts` | All dimensions, with notes on where each came from |
| `lib/building/geom.ts` | Façade frames, merging by material, wall-with-openings builder |
| `lib/building/components.ts` | Glazed openings, glass balustrades, balconies, downpipes, screens |
| `lib/building/building.ts` | Assembles the four façades, entrance and rear bays |
| `lib/building/roof.ts` | Hip roof, soffit, gutters, seams (instanced), chimneys |
| `lib/building/textures.ts` / `materials.ts` | Procedural canvas textures and materials |
| `lib/viewer/*` | Renderer, controls, camera limits, sky and lighting, view presets |
| `app/components/BuildingViewer.tsx` | Client component and overlay UI |
