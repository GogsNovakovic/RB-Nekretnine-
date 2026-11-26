import * as THREE from "three";
import { MaterialSpec, PALETTE, TextureName } from "./palette";
import { TexturePair, pavingTexture, plinthTexture, rescaled, sidingTexture, stuccoTexture } from "./textures";

export type Materials = Record<string, THREE.Material>;

/** Material keys whose meshes neither cast nor receive shadows. */
export const NO_SHADOW: ReadonlySet<string> = new Set(Object.entries(PALETTE).filter(([, s]) => s.shadows === false).map(([k]) => k));

const GENERATORS: Record<TextureName, (aniso: number) => TexturePair> = {
  stucco: stuccoTexture,
  siding: sidingTexture,
  plinth: plinthTexture,
  paving: pavingTexture,
};

/** Build every material in PALETTE. Shared textures are generated once per name and tile size. */
export function createMaterials(aniso: number): Materials {
  const base = new Map<TextureName, TexturePair | null>();
  const scaled = new Map<string, { map: THREE.Texture; bump?: THREE.Texture }>();

  const textures = (name: TextureName, tile?: number) => {
    if (!base.has(name)) {
      try {
        base.set(name, GENERATORS[name](aniso));
      } catch (err) {
        // Optional detail: keep the model working with plain colours.
        console.warn(`Texture "${name}" unavailable, using plain colour`, err);
        base.set(name, null);
      }
    }
    const pair = base.get(name);
    if (!pair) return null;
    if (tile === undefined || tile === pair.size) return { map: pair.map, bump: pair.bump };
    const key = `${name}@${tile}`;
    let t = scaled.get(key);
    if (!t) {
      // keep the tile's aspect ratio: natural size is (1 / repeat.x) × (1 / repeat.y) metres
      const tileV = (tile * pair.map.repeat.x) / pair.map.repeat.y;
      t = { map: rescaled(pair.map, tile, tileV), bump: pair.bump ? rescaled(pair.bump, tile, tileV) : undefined };
      scaled.set(key, t);
    }
    return t;
  };

  const make = (s: MaterialSpec): THREE.Material => {
    const common = {
      color: s.color,
      roughness: s.roughness,
      metalness: s.metalness ?? 0,
      side: s.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
      vertexColors: s.vertexColors ?? false,
    };
    if (s.glass) {
      return new THREE.MeshPhysicalMaterial({
        ...common,
        transparent: true,
        opacity: s.glass.opacity,
        envMapIntensity: s.glass.envMapIntensity,
        depthWrite: false,
      });
    }
    const m = new THREE.MeshStandardMaterial(common);
    if (s.emissive) {
      m.emissive.set(s.emissive);
      m.emissiveIntensity = s.emissiveIntensity ?? 1;
    }
    const tex = s.texture ? textures(s.texture, s.tile) : null;
    if (tex) {
      m.map = tex.map;
      if (tex.bump) {
        m.bumpMap = tex.bump;
        m.bumpScale = s.bumpScale ?? 1;
      }
    }
    return m;
  };

  const out: Materials = {};
  for (const [key, spec] of Object.entries(PALETTE)) {
    out[key] = make(spec);
    out[key].name = key;
  }
  return out;
}
