# Villa construction timelapse: prompts

## Step 0: make the 16:9 base (once)

Your reference image is 3:2. Pick one:

- **Better:** in your image tool, use "Expand / Outpaint to 16:9" on `Positano Villa Overlooking the Sea.png`. It adds scenery on the left and right and keeps the street and terrace at the bottom. Save the result as `09 - Finished villa 16x9.png`.
- **Fallback:** use `09 - Finished villa 16x9 (crop).png` from this folder. The scene is cropped, not expanded, so the street at the bottom is cut off.

## Step 1: generate the 8 phases

- Use an image *editing* model that keeps the uploaded image's layout, such as Nano Banana Pro (Gemini), GPT Image or Seedream.
- **Make each phase from the same 16:9 finished image, not from the previous phase.** That keeps the camera and background the same in every image.
- Paste the full prompt each time. Every prompt starts with the same lock text on purpose.
- After generating, flip through the images quickly. If the building shifts or the background changes in one of them, generate that one again.
- Save them as `01 ... 08` in this folder.

---

### 01 – Excavation (the hole)

```
Edit this image into a photo of the same site during construction. Keep the camera position, lens, framing, perspective, 16:9 aspect ratio and warm golden-hour sunlight exactly as they are. Everything outside the building plot stays exactly the same: the sky, the hillside town with the church dome, the cliffs, the sea and boats, the street, the tree, bougainvillea, stone wall and street lamp at the left edge, and the greenery at the right edge. The building must sit in exactly the same place, with the same footprint, height and outline as the finished villa. The villa's own landscaping (paved terrace, stone planters, potted trees, flower beds, the bougainvillea by the entrance) does not exist yet. Photorealistic construction-site photograph, sharp natural detail, no text, no labels, no watermark.

Stage: excavation. The villa is completely gone. The plot is cleared down to bare brown earth and pale limestone rock. A deep rectangular foundation pit is dug exactly within the villa's footprint, with stepped earth sides and exposed rock. A yellow tracked excavator stands in the pit with its bucket full of soil, a dump truck waits at the edge to be loaded, and piles of excavated soil sit beside the pit. Wooden survey stakes and string lines mark the building outline. Orange temporary site fencing runs along the street. Three or four workers in white hard hats and orange hi-vis vests, one looking through a survey level on a tripod. No concrete and no structure of any kind yet.
```

### 02 – Footings and rebar

```
Edit this image into a photo of the same site during construction. Keep the camera position, lens, framing, perspective, 16:9 aspect ratio and warm golden-hour sunlight exactly as they are. Everything outside the building plot stays exactly the same: the sky, the hillside town with the church dome, the cliffs, the sea and boats, the street, the tree, bougainvillea, stone wall and street lamp at the left edge, and the greenery at the right edge. The building must sit in exactly the same place, with the same footprint, height and outline as the finished villa. The villa's own landscaping (paved terrace, stone planters, potted trees, flower beds, the bougainvillea by the entrance) does not exist yet. Photorealistic construction-site photograph, sharp natural detail, no text, no labels, no watermark.

Stage: foundation reinforcement. The villa is completely gone. In its footprint is an open foundation pit with a flat grey layer of blinding concrete at the bottom. Timber formwork boards outline the strip footings and the foundation slab, filled with dense steel rebar mats and cages tied with wire. Bundles of rebar, stacked formwork boards and a small cement mixer stand on the site, with orange site fencing along the street. Four or five workers in white hard hats and orange hi-vis vests are bent over tying rebar. The yellow excavator is parked to one side. Nothing rises above ground level yet.
```

### 03 – Concrete foundation

```
Edit this image into a photo of the same site during construction. Keep the camera position, lens, framing, perspective, 16:9 aspect ratio and warm golden-hour sunlight exactly as they are. Everything outside the building plot stays exactly the same: the sky, the hillside town with the church dome, the cliffs, the sea and boats, the street, the tree, bougainvillea, stone wall and street lamp at the left edge, and the greenery at the right edge. The building must sit in exactly the same place, with the same footprint, height and outline as the finished villa. The villa's own landscaping (paved terrace, stone planters, potted trees, flower beds, the bougainvillea by the entrance) does not exist yet. Photorealistic construction-site photograph, sharp natural detail, no text, no labels, no watermark.

Stage: concrete foundation complete. The villa is completely gone. Across its whole footprint is a solid grey reinforced-concrete foundation slab with low foundation walls, poured to just above ground level. The outer faces of the foundation walls are coated in black bitumen waterproofing, and soil is partly backfilled around them. Rows of steel starter bars stick up from the slab where the columns and walls will rise. A concrete mixer truck and a truck-mounted concrete pump with its boom folded stand at the street side. Workers in hard hats and hi-vis vests smooth the fresh concrete with trowels and strip the timber formwork. Nothing is built above the foundation yet; the sky and hillside are fully visible where the building will be.
```

### 04 – Ground floor structure

```
Edit this image into a photo of the same site during construction. Keep the camera position, lens, framing, perspective, 16:9 aspect ratio and warm golden-hour sunlight exactly as they are. Everything outside the building plot stays exactly the same: the sky, the hillside town with the church dome, the cliffs, the sea and boats, the street, the tree, bougainvillea, stone wall and street lamp at the left edge, and the greenery at the right edge. The building must sit in exactly the same place, with the same footprint, height and outline as the finished villa. The villa's own landscaping (paved terrace, stone planters, potted trees, flower beds, the bougainvillea by the entrance) does not exist yet. Photorealistic construction-site photograph, sharp natural detail, no text, no labels, no watermark.

Stage: ground floor structure. On the concrete foundation stand the ground-floor columns and walls in raw grey reinforced concrete, in the exact positions of the finished villa's ground-floor walls, with open gaps where the glass doors will be. Above them the first-floor slab is being formed: plywood decking held up by a dense forest of steel props, with a rebar mat being laid on top. Steel scaffolding is starting to go up along the front. Workers in white hard hats and orange hi-vis vests carry rebar and plywood; a small mobile crane lifts a bundle of rebar. The upper floors and the roof do not exist yet, so the sky and the hillside town are visible where they will be.
```

### 05 – Full concrete frame

```
Edit this image into a photo of the same site during construction. Keep the camera position, lens, framing, perspective, 16:9 aspect ratio and warm golden-hour sunlight exactly as they are. Everything outside the building plot stays exactly the same: the sky, the hillside town with the church dome, the cliffs, the sea and boats, the street, the tree, bougainvillea, stone wall and street lamp at the left edge, and the greenery at the right edge. The building must sit in exactly the same place, with the same footprint, height and outline as the finished villa. The villa's own landscaping (paved terrace, stone planters, potted trees, flower beds, the bougainvillea by the entrance) does not exist yet. Photorealistic construction-site photograph, sharp natural detail, no text, no labels, no watermark.

Stage: complete concrete frame. The full raw grey reinforced-concrete skeleton of the villa stands at its final height: ground floor, first floor and second floor, with columns, floor slabs, the stair core and the flat roof slab, matching the finished villa's shape exactly. The cantilevered concrete balcony slabs stick out of the front facade (three on the first floor, two on the right side of the second floor). There are no walls yet, so you can see through the floors between the columns, with steel props still under the top slab. Steel scaffolding with wooden planks wraps the front and left side. Workers stand on the slabs and the scaffolding; a mobile crane lifts formwork. No pitched roof yet, no windows, no cladding.
```

### 06 – Walls and roof frame

```
Edit this image into a photo of the same site during construction. Keep the camera position, lens, framing, perspective, 16:9 aspect ratio and warm golden-hour sunlight exactly as they are. Everything outside the building plot stays exactly the same: the sky, the hillside town with the church dome, the cliffs, the sea and boats, the street, the tree, bougainvillea, stone wall and street lamp at the left edge, and the greenery at the right edge. The building must sit in exactly the same place, with the same footprint, height and outline as the finished villa. The villa's own landscaping (paved terrace, stone planters, potted trees, flower beds, the bougainvillea by the entrance) does not exist yet. Photorealistic construction-site photograph, sharp natural detail, no text, no labels, no watermark.

Stage: walls and roof framing. The concrete frame is filled in with walls of red clay hollow blocks, with rough window and door openings in the exact positions and sizes of the finished villa (no glass yet). The balcony slabs are bare concrete with no railings. On top, the timber hip roof is being built: ridge beam, hip rafters and rafters with the deep overhanging eaves of the final roof, partly covered with boards and dark underlay membrane. The chimneys are built in raw grey block in their final positions. Scaffolding with green safety netting wraps the building. Pallets of blocks and cement bags sit on the ground; workers in hard hats are on the scaffolding and on the roof.
```

### 07 – Roof done, windows in, facade in progress

```
Edit this image into a photo of the same site during construction. Keep the camera position, lens, framing, perspective, 16:9 aspect ratio and warm golden-hour sunlight exactly as they are. Everything outside the building plot stays exactly the same: the sky, the hillside town with the church dome, the cliffs, the sea and boats, the street, the tree, bougainvillea, stone wall and street lamp at the left edge, and the greenery at the right edge. The building must sit in exactly the same place, with the same footprint, height and outline as the finished villa. The villa's own landscaping (paved terrace, stone planters, potted trees, flower beds, the bougainvillea by the entrance) does not exist yet. Photorealistic construction-site photograph, sharp natural detail, no text, no labels, no watermark.

Stage: roof finished, facade in progress. The hip roof is fully covered in terracotta clay tiles, the chimneys are rendered and capped, and the dark gutters and downpipes are fitted, exactly as in the finished villa. The black-framed windows and glass doors are installed, still with protective film and stickers on the glass, dark unlit interiors. Facade work is under way: the cream travertine stone cladding covers the lower part of the walls and is climbing upward, the rest is still plain grey render; the horizontal timber cladding on the top floor is partly fitted. Scaffolding still stands on the front facade, with workers fixing stone panels. The balconies have bare slab edges with temporary yellow safety rails, no glass railings yet. The ground in front is rough dirt and gravel with pallets of stone panels.
```

### 08 – Exterior finishing and landscaping

```
Edit this image into a photo of the same site during construction. Keep the camera position, lens, framing, perspective, 16:9 aspect ratio and warm golden-hour sunlight exactly as they are. Everything outside the building plot stays exactly the same: the sky, the hillside town with the church dome, the cliffs, the sea and boats, the street, the tree, bougainvillea, stone wall and street lamp at the left edge, and the greenery at the right edge. The building must sit in exactly the same place, with the same footprint, height and outline as the finished villa. Photorealistic construction-site photograph, sharp natural detail, no text, no labels, no watermark.

Stage: final finishing and landscaping. The scaffolding is gone and the building exterior looks exactly like the finished villa: travertine stone and timber cladding, terracotta roof with chimneys, black-framed windows, glass balcony railings and wall lights (switched off). The balconies are empty, with no furniture or plants, and the windows show bare, unlit interiors without curtains. In front, workers in hard hats and hi-vis vests are laying the pale stone paving of the terrace and building the low stone planter walls; part of the terrace is still a bare sand bed. Pallets of paving stones, a small skid-steer loader, wheelbarrows, and a few potted olive trees wrapped in plastic waiting on a pallet. The bougainvillea and flower beds are not planted yet.
```

### 09 – Finished villa

No prompt needed: this is your 16:9 finished image from Step 0.

---

## Step 2: Seedance video

**Images to upload (in this order):** `01 - Excavation` → `02 - Foundation rebar` → `03 - Concrete foundation` → `04 - Ground floor frame` → `05 - Concrete frame` → `06 - Walls and roof frame` → `07 - Roof and facade` → `08 - Finished`. These are cut from the ChatGPT storyboard.
**Do not upload `09 - Finished villa 16x9 (crop).png`.** It shows the building from a different camera angle, so the video would jump at the end.

**Settings:** 16:9 · longest duration available (the timeline below assumes 15 s) · highest resolution.

```
A photorealistic construction timelapse of one villa on a Mediterranean coastal hillside, filmed from a locked-off tripod, 16:9. The camera never moves: no pan, tilt, zoom, dolly, shake or cuts. The framing, perspective, light and the whole background stay identical from the first frame to the last: the sky, the hillside town, the cliffs, the sea and boats, the street, the stone gate pillar with its lamp and the bougainvillea in the foreground never change. The wide 16:9 frame continues the same scenery naturally beyond the edges of the reference images.

The reference images are the construction stages in order, from the open excavation to the finished villa. The video passes through every stage in that order and matches each one exactly, with continuous construction work filling the time between stages. The building always stays in the same place and grows only up from its own foundation; it never slides, morphs or jumps.

0–1.5s: the empty, levelled plot behind the site fence; an excavator digs and dump trucks haul soil away until the foundation pit is open.
1.5–3.5s: workers lay timber formwork and tie dense steel rebar across the pit.
3.5–5.5s: a concrete pump pours the foundation slab; workers spread and smooth the concrete, starter bars stand up.
5.5–7s: ground-floor columns rise, steel props and decking go up, the first-floor slab is poured.
7–8.5s: the second floor rises, scaffolding climbs with it, block walls start filling the frame.
8.5–10s: the top floor and the roof frame go up, the walls close in, window openings appear.
10–12s: terracotta tiles cover the roof, the chimneys are finished, windows are fitted, stone and timber cladding cover the facade, glass railings go on the balconies.
12–15s: the scaffolding comes down, workers pave the terrace, build the stone planters and plant olive trees and flowers, the site is swept clean; hold on the finished villa, matching the last reference image.

Timelapse style: many workers in white hard hats and orange hi-vis vests move in fast, slightly motion-blurred bursts; excavators, mixer trucks, the concrete pump, a mobile crane, wheelbarrows and pallets of material arrive, work and vanish within seconds, while the building itself grows smoothly and steadily. The sunlight stays the same bright, warm daylight throughout, with only soft cloud drift in the sky. Realistic materials, real construction methods, natural colours, sharp detail.

No camera movement, no zoom, no cuts, no change to the background, sky, sea or street, no building drift or morphing, no distorted people, no text, no logos, no watermark.
```

**If the result drifts:**
- Camera still moves → put the sentence "The camera never moves" at the very start of the prompt, and turn off any "camera motion" or "dynamic" setting in the tool.
- Video looks soft, or the building wobbles → the storyboard panels are small (414 × 467 px each). In the same ChatGPT chat that made the storyboard, ask for each panel on its own: "Make panel 1 as a single full-size landscape image, same camera, same scene, nothing else changed." Repeat for panels 2–8, then send them to me to crop to 16:9.
- Stages are skipped or blend into each other → generate two clips instead (01–04, then 04–08) and join them, using 04 as the last frame of clip one and the first frame of clip two.
- Background changes → shorten the timeline lines and repeat the "background stays identical" sentence at the end.
