/**
 * Material settings: one entry per material key used by the geometry generator.
 *
 * Colours are base albedo (sRGB), not the tints sampled from the renders. Those
 * renders include warm low sun, blue sky and colour grading (see Building/REFERENCES.md
 * §8). Lighting and reflections are set in lib/viewer/config.ts, so nothing here
 * bakes in light or shadow.
 *
 * `texture` names a procedural tiling texture (lib/building/textures.ts). Geometry
 * UVs are in metres, so `tile` is the real-world size of one texture tile. If a
 * texture cannot be generated, the material falls back to its plain colour.
 */

export type TextureName = "stucco" | "siding" | "plinth" | "paving";

export interface MaterialSpec {
  color: string;
  roughness: number;
  metalness?: number;
  texture?: TextureName;
  /** Tile size in metres (default: the texture's natural size). */
  tile?: number;
  bumpScale?: number;
  /** Glass: physically based, sorted and blended. */
  glass?: { opacity: number; envMapIntensity: number };
  emissive?: string;
  emissiveIntensity?: number;
  /** Per-vertex tone (simple interiors). */
  vertexColors?: boolean;
  doubleSide?: boolean;
  /** Cast and receive shadows (default true). */
  shadows?: boolean;
}

export const PALETTE: Record<string, MaterialSpec> = {
  /* walls */
  render: { color: "#f3f1ec", roughness: 0.95, texture: "stucco", bumpScale: 0.5 }, // white render
  renderGray: { color: "#6b6f76", roughness: 0.9, texture: "stucco", bumpScale: 0.5 }, // grey accent strips, reveals, lintel
  wood: { color: "#ffffff", roughness: 0.82, texture: "siding", bumpScale: 1.0 }, // horizontal timber cladding
  stone: { color: "#ffffff", roughness: 0.9, texture: "plinth", bumpScale: 1.0 }, // coursed plinth band

  /* slabs and paving */
  concrete: { color: "#74777c", roughness: 0.88, texture: "stucco", bumpScale: 0.35 }, // balcony slabs and boxes, stair flights
  terrace: { color: "#bdbbb6", roughness: 0.85, texture: "stucco", tile: 3, bumpScale: 0.15 }, // rear terraces, smooth concrete
  deck: { color: "#a9a8a4", roughness: 0.85, texture: "stucco", tile: 3, bumpScale: 0.15 }, // balcony and loggia floors
  paving: { color: "#ffffff", roughness: 0.88, texture: "paving", bumpScale: 0.7 }, // herringbone pavers at the entrance

  /* timber */
  woodDark: { color: "#8c7768", roughness: 0.8, texture: "siding", tile: 1.8, bumpScale: 1.0 }, // rear privacy fins
  soffit: { color: "#d2b8a4", roughness: 0.85, texture: "siding", tile: 1.6, bumpScale: 0.6 }, // boxed eaves
  fascia: { color: "#b9a08d", roughness: 0.82, texture: "siding", tile: 1.2, bumpScale: 0.4 },
  frame: { color: "#734f37", roughness: 0.55 }, // timber window and door frames

  /* metal */
  sill: { color: "#c9cbcc", roughness: 0.45, metalness: 0.35 },
  steel: { color: "#c6cacd", roughness: 0.3, metalness: 0.9 }, // handrails, balustrade rails
  darkSteel: { color: "#3c4146", roughness: 0.45, metalness: 0.7 },
  zinc: { color: "#9ca1a6", roughness: 0.4, metalness: 0.65 }, // gutters, downpipes, flues
  aluFin: { color: "#cdbb9d", roughness: 0.42, metalness: 0.55 }, // stair-core fins (bronze anodised)
  aluFrame: { color: "#7d8287", roughness: 0.48, metalness: 0.55 },
  spandrel: { color: "#3d3a38", roughness: 0.6, metalness: 0.3 },

  /* roof */
  roof: { color: "#63282d", roughness: 0.55, metalness: 0.15, doubleSide: true }, // maroon standing-seam metal
  roofRib: { color: "#6e2e33", roughness: 0.5, metalness: 0.15 },
  chimney: { color: "#c3c1bc", roughness: 0.9, texture: "stucco", bumpScale: 0.4 },

  /* glazing */
  glass: { color: "#6f838d", roughness: 0.03, metalness: 0.5, glass: { opacity: 0.8, envMapIntensity: 1.45 }, doubleSide: true, shadows: false },
  railGlass: { color: "#eef2f3", roughness: 0.25, metalness: 0.05, glass: { opacity: 0.5, envMapIntensity: 1.0 }, doubleSide: true, shadows: false },

  /* simple rooms behind the glass (inferred) */
  interior: { color: "#4a433d", roughness: 1, vertexColors: true, shadows: false },
  interiorLit: { color: "#9a8470", roughness: 1, vertexColors: true, emissive: "#ffb46e", emissiveIntensity: 0.28, shadows: false },
  stairInterior: { color: "#9a938a", roughness: 1, vertexColors: true, emissive: "#ffcc90", emissiveIntensity: 0.1, shadows: false },
};
