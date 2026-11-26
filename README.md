# Building exterior: interactive 3D model

A browser viewer for the residential building in the five reference renders
(`Building/Image 1–5.png`). The whole exterior is generated in code with Three.js
(pinned to 0.181.2). There are no imported models, photos or pre-rendered frames, and
no external services, fonts or assets are needed to display it.

```bash
npm install
npm run dev                      # http://localhost:3000
npm run build && npm start       # production build
```

## Using the viewer

| Action | Mouse | Touch | Keyboard (canvas focused) |
| --- | --- | --- | --- |
| Rotate / tilt | drag | one-finger drag | arrow keys |
| Zoom | scroll | pinch | `+` / `-` |
| Pan | right-drag | two-finger drag | — |
| Reset view | double-click | double-tap | `R`, `Home` or `0` |

On first load, the camera frames the whole building from a rear-right three-quarter view.
The fit is computed from the model's own geometry, the field of view and the screen shape,
so it holds on any window size. Portrait screens get a wider lens. Rotation is unlimited.
Tilt runs from almost straight down to just above eye level, and the camera never goes
below the ground. Zoom and pan stop well before the building can be lost, and the camera
stays at least 3 m from the walls. Auto-rotation is off. The page has no buttons; a
one-line gesture hint fades after the first interaction.

URL options:

- `?view=front | rearRight | rearLeft | aerial` opens from another direction (`lib/viewer/views.ts`).
- `?match=img1 | img2 | img3 | img5` shows the model through the camera solved for that
  reference render, letterboxed to the reference's aspect ratio. Controls are off in this
  mode.
- `&overlay=0.5` lays the reference over it at that opacity, for checking.

## Modelling specification

**Coordinates.** Metres. Y is up and the ground is Y = 0. The front (entrance) façade faces
+Z. Left and right are as seen from in front of the entrance, so the right façade faces +X.
The references give no compass orientation, so none is used.

**Scale.** No dimension is given anywhere. One storey is *assumed* to be 3.0 m, and every
other length was measured relative to it from the solved reference cameras. `SCALE` in
`lib/building/spec.ts` rescales the finished model.

| | |
| --- | --- |
| Main volume | One block, 18.0 × 12.3 m in plan, walls 9.1 m to the soffit |
| Floor levels | 0.33 · 3.33 · 6.33 m (ground, first, top); render below the top-floor sill line (7.18 m), timber cladding above |
| Front | Central stair core: full-height glazing with ≈ 20 bronze fins, recessed entrance under a grey lintel, landing, steps and ramp. Two windows each side on every floor (12 in all) |
| Sides | Mirror images: a grey vertical strip with narrow windows near the front, recessed window + timber panel + window bands on the lower two floors, three top-floor windows |
| Rear, right to left | White two-storey portal frame wrapping the rear-right corner (loggia, roof terrace above, open to the right); central bay projecting 1.0 m with grey box balconies; side bay with open glass balconies; two timber privacy fins; stepped concrete terraces |
| Roof | Hip roof, 21.3° front/rear and ≈ 19° ends, short 4 m ridge, 1.5 m boxed timber eaves, maroon standing-seam metal, half-round gutters, six rendered stacks |
| Materials | White and grey render, horizontal timber, coursed stone plinth, timber window frames, zinc, stainless rails, clear and satin glass (`lib/building/palette.ts`) |

**Inferred, not observed:** the absolute scale, wall and slab thicknesses, the entrance
door split (modelled as sidelight · leaf · sidelight), the stairwell and simple rooms seen
through the glazing, the small loggia window behind the corner pier, and the stack height.
They are listed in `EVIDENCE` in `lib/building/spec.ts`, which also tags the matching scene
groups (`userData.evidence`). Inferred parts sit in groups of their own so they can be
replaced. `Building/REFERENCES.md` has the full reference inspection.

## Code layout

| Path | Purpose |
| --- | --- |
| `lib/building/spec.ts` | Every dimension and layout, each marked measured or estimate; evidence register |
| `lib/building/palette.ts` | Material settings: colour, roughness, metalness, texture and tile size |
| `lib/building/building.ts` | Assembles the façades, stair core, rear bays and terraces into the scene graph |
| `lib/building/components.ts` | Glazed openings, balustrades, balconies, privacy fins, downpipes |
| `lib/building/roof.ts` | Soffit, fascia and gutters, roof planes, caps, stacks, instanced seams |
| `lib/building/geom.ts` | Façade frames, wall-with-openings builder, per-section mesh merging |
| `lib/building/textures.ts` / `materials.ts` | Procedural textures (plain-colour fallback) and the material factory |
| `lib/viewer/config.ts` | Lens, framing, control limits, render quality, lighting and ground |
| `lib/viewer/views.ts` | Opening directions and the solved reference cameras |
| `lib/viewer/framing.ts` | Fits the building into the viewport for any direction and aspect |
| `lib/viewer/controls.ts` | Orbit controls, limits, keyboard, double-tap reset |
| `lib/viewer/environment.ts` | Sun with fitted shadows, sky fill, reflection-only sky, fading ground shadow |
| `lib/viewer/createViewer.ts` | Renderer, render-on-demand loop, resize, visibility, disposal |
| `app/components/BuildingViewer.tsx` | Mounts the viewer; loading and error states, gesture hint |
| `public/validation/` | Downscaled reference renders for `?overlay=` |

Scene graph: `Building` › `Facades` (Front, Right, Left, Rear) · `StairCore` (Entrance,
EntranceDoor, StairGlazing, Stairwell, LandingAndRamp) · `RearBays` (CornerPortal,
CentralBay, SideBay) · `Terraces` · `Roof` (Soffit, Edge, Covering, Stacks) · `Interiors`.
Each leaf group holds one merged mesh per material.

## Validation

Each of `?match=img1`, `img2`, `img3` and `img5` was compared with its reference at 50 %
overlay in Chrome. Silhouette, eaves, floor lines, window rows and counts, the stair core,
ramp, side strips and bands, the portal, balconies, terraces and the six stacks register
in all four. The overlays also corrected one earlier error: the rear privacy screens
are fins perpendicular to the façade, not flat panels. A full orbit, overhead and
eye-level views were checked for missing faces, glass sorting and clipping.

Measured on an Apple M4 MacBook in Chrome 158 at device pixel ratio 2 (2824 × 1492
drawing buffer):

- 99 draw calls, ≈ 22.7k triangles, building generated in 60–75 ms;
- a steady 16.7 ms frame interval (the 60 Hz display limit) while the camera moves;
- no frames rendered while the view is idle.

Not tested: real phones or tablets (touch gestures and the touch quality settings were
only checked through the code path and a narrow desktop window), Safari and Firefox.

## Limitations

- Lighting is a neutral daylight setup, not the warm sunset grading of the renders. Colours
  in the palette are base colours, so the model looks cooler than the references.
- The ground is a shadow-only plane. By request, there is no grass, sky or other
  surroundings.
- Interiors are simple boxes, there only to keep the windows from looking flat.
