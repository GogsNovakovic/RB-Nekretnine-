# Reference inspection

Covers every reference in the repo: `Building/`, `Building/Construction phases/`,
`Apartment floor plan/` and `reference/`. All 21 images were opened, and the 8 s video was
sampled at 0–7.9 s (9 frames). Details were checked on crops.

**Orientation.** No true orientation is supplied. Compass words are relative labels
taken from `lib/building/spec.ts`: the entrance façade is "south", so the camera of R01
is "SE", and so on.

## 1. Register

| ID | File | View | Visible parts | Geometric evidence | Material evidence | Uncertainties |
|---|---|---|---|---|---|---|
| **R01** | `Building/Image 1.png` (2120×1398) | SE oblique, eye level, level camera | Front (entrance) + east façade, eaves, soffit | 3 window rows, 2+2 windows per floor around the stair core; entrance recess, landing, ramp, handrails; east grey strip, recessed window bands; NE portal pier and cantilevered slabs end-on | White render, horizontal timber, grey plinth, timber soffit, grey gutters/downpipes, timber window frames | Entrance door split (single leaf + sidelight?); stair interior only faintly visible |
| **R02** | `Building/Image 2.png` (2136×1402) | NE oblique, eye level | East + rear façades | NE portal frame wrapping the corner, loggia, slabs open to the east; central box balconies ×2; west open balconies ×2; privacy screens; stepped terraces | Grey box balconies, glass balustrades + steel rails, timber screens, concrete terraces | West-bay balconies are strongly foreshortened |
| **R03** | `Building/Image 3.png` (2122×1388) | NW oblique, eye level | Rear + west façades | Same rear bays seen from the other side; sky visible *through* the portal (loggia open to the east); west façade mirrors the east one; NW downpipe | Same as R02 | SW corner of the west façade is far away and small |
| **R04a–d** | `Building/Image 4.png` (2146×1218) | 2×2 contact sheet: SE, NE, NW, aerial | Same as R01, R02, R03, R05 | None new: proportions match R01/R02 within reading error (front:east width 0.45 vs 0.43) | Same | Reframed at ~1070 px per panel, so lower resolution; not pixel-identical crops |
| **R05** | `Building/Image 5.png` (1864×1284) | Elevated view from the south, looking down at a steep angle | Whole roof, front façade ground + first floor, entrance path | Hip roof with a short ridge parallel to the front; 6 stacks; landing + steps (west half) + ramp running south (east half) | Red-maroon standing-seam metal, light-grey stacks with metal flues, herringbone pavers | Top floor hidden by the eave; the "grass" in the stair glazing is a reflection of the ground and path |
| **R06** | `Building/Positano Villa Overlooking the Sea.png` (1518×1036) | NE-ish oblique, more square-on to the rear than R02 | East + rear | Same massing and bay rhythm as the Set A rear (see §2); 6 large chimneys | Travertine-type stone, timber, terracotta tiles, dark window frames, wall lights | **AI-edited restyle.** Not the R02 camera; proportions unreliable |
| **R07** | `Building/Construction phases/09 - Finished villa 16x9 (crop).png` (1518×854) | Same as R06 | — | Crop of R06, nothing new | — | — |
| **R08** | `Building/Mediterranean Villa Construction Progress Storyboard.png` (1672×941) | 8 panels from a street/hillside camera | Villa from excavation to finished | None reliable: footprint, bay count and position change between panels | Stone, terracotta, timber | AI-generated |
| **R09–R16** | `Building/Construction phases/01–08 *.png` (414×467 each) | Same as R08 | — | Crops of the eight R08 panels | — | — |
| **R17** | `reference/hero-video compressed.mp4` (1920×1080, 8.0 s) | Locked-off street view, close to R08 | Villa timelapse, concrete pump to finished villa | None reliable: the building jumps sideways between 6 s and 7 s; the final villa has 3 balcony bays across the façade and 3 stacks, and matches neither R06 nor R08 | Stone, terracotta | AI-generated video |
| **R18** | `Apartment floor plan/Plan 1 .png` | AI-rendered 3D plan | 2-bed flat, ~80 m² | Same layout as R20 with different dimensions (kitchen 4.89×2.67 vs 5.38×2.34) | — | AI-generated; garbled caption ("TOTAL: 80 m2 / : 80 m2") |
| **R19** | `Apartment floor plan/Plan 2.png` | Coloured schematic | Same layout as R20 | No dimensions | — | — |
| **R20** | `Apartment floor plan/Plan 3.png` | Listing floor plan | Same 2-bed layout, ≈ 11.2 × 8.8 m outside (scaled from its labels), recessed side balcony 0.94 × 4.77 m, chimney breast | Not this building: captioned with a real address in Co. Dublin, and its openings don't match any Set A façade | — | — |
| **R21** | `Apartment floor plan/Plan 4.png` | Stock 1-bed plan, imperial units | Flat with internal stair | Unrelated (Google Images "800 × 600" badge still on it) | — | — |
| **R22** | `Apartment floor plan/Plan 5.png` | Stock single-storey 3-bed house plan, imperial units | House with porch and laundry | Unrelated | — | — |

## 2. Same building, same revision?

- **Set A: R01, R02, R03, R04, R05.** One set of CG renders of one design. Every
  cross-check agrees: 3 storeys; front symmetric about the stair core; east and west
  façades mirror each other; rear bays in the same order from both sides; stacks only
  in R05, which is consistent (§6). **This is the coherent geometry set.**
- **Set B: R06, R07.** An AI restyle of the Set A design, with the same rear bay order
  (east → west: corner block, box balconies, open balconies), the same east-side grey strip
  and timber-panel window bands, and 3 storeys. It **conflicts** with Set A on:
  - The NE portal is filled in with stone: the two-storey loggia becomes a wall with a
    projecting balcony and French doors.
  - The roof terrace above the portal is gone; the top floor there is a timber wall
    with a window.
  - The privacy screens are replaced by potted trees.
  - Six tall stone stacks with metal caps are visible from the ground. In Set A, nothing
    shows above the eaves.
  - The roof is terracotta tile and its surface is visible from eye level (it reads
    steeper).
  - The materials are swapped: stone instead of render, dark instead of timber window
    frames, and added wall lights.
- **Set C: R08–R17.** AI construction sequence of a Set B-style villa from a different
  camera. The building is not stable between panels or frames.
- **Set D: R18–R22.** Floor plans that are not of this building. R18–R20 show one real
  listing's layout; R21–R22 are unrelated stock plans.

**Decision:** model geometry from **Set A only**. Set B is a material/style variant of
the same massing. Keep it as a separate variant if it is ever wanted, and never blend it
into Set A. Sets C and D give no geometric evidence.

## 3. Massing and levels (Set A)

- One rectangular block, no wings, courtyards or setbacks in plan, apart from the rear
  additions: a projecting central bay, and the NE portal frame that stands proud of the
  rear and east walls (R02, R03).
- **Three storeys, checked against several clues:**
  - R01 has three window rows, with the entrance at the lowest.
  - R02/R03 show ground-floor doors onto the terraces plus two balcony levels.
  - The R01 stair glazing runs from above the entrance lintel to under the soffit.
  - R05 shows two rows below the eave, and the top-floor windows are hidden by it.
- **Horizontal lines that are not floors:** the render/timber line (top-floor sill), the
  plinth band, the entrance lintel band, the stair-glazing transom, the side window bands,
  and the fascia.
- No basement is visible (only a ~0.3 m plinth). No attic storey: no dormers or roof
  windows (R05).

## 4. Façades (Set A)

**Front, the entrance side** (R01, R04a, R05)
- Symmetric. A central stair-core strip of full-height glazing with dense vertical fins
  (~20 across), one transom near the render line and a dark band at the top. The core
  runs from above the entrance lintel to under the soffit.
- On each side of the core, 2 windows per floor, 12 in total. They are all the same
  size, slightly taller than wide, and stacked in vertical lines. Single sash with a
  timber frame, grey reveals and a slim light sill.
- Recessed entrance under a grey lintel band, with a glazed timber-framed door (§7).
- Downpipe on the front face at the SE corner. None at the SW corner of the front face
  (R01, R05).

**East** (R01 from the south end, R02 from the north end)
- A grey vertical strip near the **front** end, running from the plinth to the render
  line. It has narrow windows on the ground and first floors with grey panels between
  them, and a narrow window above it in the timber zone.
- Ground and first floors: a recessed horizontal band of window + horizontal-timber
  panel + window, with white reveals.
- Top floor: 3 windows in the timber zone, two lined up over the band windows and the
  narrow one over the strip.
- North end: the east face of the portal pier. Between the pier and the main wall, the
  loggia slab (first floor) and terrace slab (top floor) cantilever out with glass
  balustrades. Downpipe at the junction.

**West** (R03, R04c)
- Mirrors the east façade: strip near the front end, two recessed bands, three top-floor
  windows.
- No portal: the façade runs straight to the NW corner. Downpipe at the NW corner.
  Whether there is one at the SW corner is not visible.

**Rear** (R02, R03, R04b–c), east to west:
1. **NE portal.** A white two-storey frame wrapping the corner, in front of a loggia:
   - First floor: a recessed balcony with a glass balustrade.
   - Ground floor: a 2-panel sliding door to the terrace.
   - The loggia is open to the east (sky visible through it in R03).
   - The top of the frame is a roof terrace: white parapet to the north (R03), glass to
     the east (R02).
2. **Central bay**, projecting (returns visible):
   - Grey box balconies on the first and top floors: solid grey side walls and soffit,
     glass front with a steel top rail.
   - A 3-panel sliding door on each level.
   - Ground floor: a 3-panel sliding door between two free-standing privacy screens made
     of horizontal timber slats.
3. **West bay.** Open cantilever balconies on the first and top floors (grey slab, glass
   on the front and returns, steel rail on posts) with 2-panel doors. A 2-panel door on
   the ground floor.

- Base: stepped concrete terraces with two treads along the rear.
- White render below the top-floor sill line, timber above. This includes the top-floor
  walls between the balconies.

## 5. Balconies, slabs, terraces

| Element | Where | Construction (observed) | Attachment |
|---|---|---|---|
| Box balcony | Rear central bay, 1F + top floor | Grey U-shaped box: deep soffit, solid side walls up to about rail height, glass front with steel rail and bottom shoe | Cantilevers from the central bay face; no posts |
| Open balcony | Rear west bay, 1F + top floor | Thin grey slab, glass panels with clamps, steel posts and top rail on the front and both returns | Cantilevers, no posts |
| Loggia balcony | Inside the NE portal, 1F | Glass balustrade on a grey slab edge; slab continues east past the pier line (R02) | Within the frame |
| Roof terrace | On top of the NE portal | White parapet (north), glass (east) | Slab on the portal frame |
| Ground terraces | Full rear length | Light-grey concrete, two steps down to the grass | On grade |

## 6. Roof

- **Hip roof**, all four slopes, with a **short ridge** parallel to the front (R05).
- Red-maroon **standing-seam metal**, seams running down the slope; hip and ridge caps
  in the same colour; dark metal edge (R05, R04d).
- **Low pitch:** the roof surface is never visible from eye level (R01–R03).
- **Deep boxed eaves.** The soffit boards run parallel to each wall and are mitred at the
  corners. Timber-faced fascia and a grey half-round gutter. The downpipes leave the
  gutter edge and run diagonally back across the soffit to the wall (R01 crop).
- **Six stacks** (R05):
  - two on the rear slope near the ridge;
  - two on the front slope just below the ridge ends, close to the hips;
  - one on each hipped end.

  Each is a light-grey rendered stack with a cap and stacked metal flue terminals.
- **Cross-check:** none of the six shows above the eaves in R01–R03. With the solved
  cameras in `lib/viewer/views.ts`, a stack stays hidden up to about **1.6 m** above the
  roof (front pair, from the R01 camera) and 2.2 m or more from R02/R03. So R05 and the
  eye-level views agree only if the stacks are short.
- No parapets, pergolas, rooflights or rooftop plant.

## 7. Entrance, ramp, details

- **Recess** below the stair glazing, under a grey lintel band.
  - R01 shows the inner face of the west jamb and a timber-framed glazed door with a
    narrow sidelight.
  - R05, from above, shows timber-framed glazing in 3 panels across the full recess
    width.
  - **The door/sidelight split is uncertain.**
- **Landing** the width of the core. Steps go down to the south on its west half; a
  **ramp** runs south on its east half, perpendicular to the façade (R05). In R01 the
  ramp appears to run down and to the left, which is the same southward direction seen
  in perspective.
- Two steel **handrails** with looped ends (R01).
- **Paving:** grey pavers in a herringbone pattern on the landing and ramp (R05).
- **Plinth:** grey band with brick-like coursing on the front (R01). It reads as plain
  concrete on the rear (R02, R03).

## 8. Materials

Colours are mean sRGB as rendered, under sunset grading: they are tints, not albedo.

| Family | Where | Sampled | Finish |
|---|---|---|---|
| Render | Walls below the top-floor sill line | Lit `#E3D3DD`, shade `#7E8FAD` (R01) → neutral white | Matte, fine grain |
| Timber cladding | Top floor, side window bands | `#805F57` lit (R01) | Matte, visible grain, horizontal boards |
| Timber soffit | Eaves | `#453229` in shade (R01) | Matte boards |
| Timber screens | Rear privacy screens | `#362B2E` (R02) → darker stain than the cladding | Matte slats |
| Grey accent | Side strips, box balconies, slab edges, lintel, reveals | `#424B5C` / `#4F515E` (R01, R02) | Matte |
| Plinth | Base band | `#807A79` (R01) | Textured, coursed |
| Concrete | Terraces, landing | `#8A8595` (R02) | Smooth |
| Roof metal | All slopes | `#6C3948` lit, `#55374A` on the end slopes (R05) | Semi-gloss |
| Stacks | Roof | `#8F7E83` (R05) → light grey | Matte render |
| Glass, windows | All openings | Strong sky/sunset reflections | Clear, reflective |
| Glass, balustrades | All balconies | Lighter than the sky; the doors behind are visible | Clear to lightly satin, exact opacity unknown |
| Metal | Rails, gutters, downpipes, flues | Grey/silver | Brushed |

No weathering anywhere: these are clean CG renders.

## 9. Observed, inferred, unknown

- **Observed:**
  - storey count, opening counts and their alignment on every façade;
  - the rear bay order;
  - balcony types and how they attach;
  - roof type, short ridge, stack count and placement;
  - the entrance arrangement;
  - material families.
- **Inferred:**
  - the loggia is open to the east (R03 sky plus R02 slab ends);
  - the central rear bay projects (returns visible);
  - the stair-core "grass" in R05 is a reflection;
  - the stacks are no more than about 1.6 m tall (sightline calculation);
  - the side strips are flush or only slightly recessed.
- **Unknown:**
  - absolute scale (the existing spec assumes a 3.0 m storey);
  - wall, slab and reveal thicknesses;
  - the SW downpipe;
  - the exact entrance door configuration;
  - the interior and stair layout;
  - flat layout and count per floor (six stacks would fit 2 flats × 3 floors, but
    nothing confirms it);
  - balustrade glass opacity.

## 10. Assumptions

1. Set A is the design of record. Set B is a restyle and does not override it (R01–R05
   vs R06).
2. The east and west façades are mirror images, including the top-floor window
   positions (R01, R02, R03).
3. Hidden faces repeat what is seen on their visible counterparts, e.g. the far side of
   each box balcony (R02, R03).
4. The four Image 4 panels add no independent geometry (R04 vs R01, R02, R05).
5. Stack height is capped at about 1.6 m above the roof by its absence in the eye-level
   views (R01–R03, R05).
6. The floor plans are not used for the exterior (R18–R22).

## 11. Points to check in the current model

- **Stack height.** In `roof.ts` each stack is 0.95 m plus cap, flue and hood, so the
  hood tips reach about 1.7 m above the roof at the stack centre. That is just over the
  ~1.62 m limit for the front pair from the R01 camera. The tips may just show above the
  eaves in `?match=img1`; the gutter lip may hide them. Check that view.
- **Entrance door.** The README says "glazed double doors". R01 suggests a single leaf
  plus a sidelight, and R05 suggests 3 panels across the recess. Not settled by the
  references.
