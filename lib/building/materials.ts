import * as THREE from "three";
import { grassTexture, pavingTexture, plinthTexture, rescaled, sidingTexture, stuccoTexture } from "./textures";

export type Materials = Record<string, THREE.Material>;

/** Bins whose meshes should neither cast nor receive shadows. */
export const NO_SHADOW = new Set(["glass", "railGlass", "interior", "interiorLit", "stairInterior"]);

/**
 * Material palette sampled from the renders: warm white render, grey accent
 * render, grey-brown timber cladding, brown window frames, zinc rainwater goods,
 * oxblood standing-seam roof and satin stainless railings.
 */
export function createMaterials(aniso: number): Materials {
  const stucco = stuccoTexture(aniso);
  const siding = sidingTexture(aniso);
  const plinth = plinthTexture(aniso);
  const paving = pavingTexture(aniso);
  const grass = grassTexture(aniso);

  const render = (color: string, rough = 0.95) =>
    new THREE.MeshStandardMaterial({ color, map: stucco.map, bumpMap: stucco.bump, bumpScale: 0.6, roughness: rough });

  const timber = (color: string, size = 2.56) => {
    const map = size === 2.56 ? siding.map : rescaled(siding.map, size);
    const bump = size === 2.56 ? siding.bump : rescaled(siding.bump!, size);
    return new THREE.MeshStandardMaterial({ color, map, bumpMap: bump, bumpScale: 1.2, roughness: 0.82 });
  };

  const interiorBase = { vertexColors: true, roughness: 1, side: THREE.FrontSide } as const;

  return {
    render: render("#f3f2ef"),
    renderGray: render("#8d9195", 0.9),
    concrete: render("#7d8084", 0.85),
    chimney: render("#9c9d9b", 0.9),
    wood: timber("#ffffff"),
    woodDark: timber("#d9c3b0", 1.8),
    soffit: timber("#d9c6b4", 1.6),
    fascia: timber("#b9a493", 1.2),
    frame: new THREE.MeshStandardMaterial({ color: "#5d3f2c", roughness: 0.55 }),
    sill: new THREE.MeshStandardMaterial({ color: "#c7c9ca", roughness: 0.45, metalness: 0.35 }),
    stone: new THREE.MeshStandardMaterial({ color: "#ffffff", map: plinth.map, bumpMap: plinth.bump, bumpScale: 1.2, roughness: 0.9 }),
    paving: new THREE.MeshStandardMaterial({ color: "#ffffff", map: paving.map, bumpMap: paving.bump, bumpScale: 0.8, roughness: 0.88 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#c3d0da",
      metalness: 0.8,
      roughness: 0.02,
      transparent: true,
      opacity: 0.86,
      envMapIntensity: 1.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    railGlass: new THREE.MeshPhysicalMaterial({
      color: "#e9eef1",
      metalness: 0.05,
      roughness: 0.22,
      transparent: true,
      opacity: 0.5,
      envMapIntensity: 1.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    steel: new THREE.MeshStandardMaterial({ color: "#c3c7cb", metalness: 0.95, roughness: 0.28 }),
    darkSteel: new THREE.MeshStandardMaterial({ color: "#3c4146", metalness: 0.7, roughness: 0.45 }),
    zinc: new THREE.MeshStandardMaterial({ color: "#8e9297", metalness: 0.7, roughness: 0.42 }),
    aluFin: new THREE.MeshStandardMaterial({ color: "#cdbb9d", metalness: 0.55, roughness: 0.42 }),
    aluFrame: new THREE.MeshStandardMaterial({ color: "#7d8287", metalness: 0.55, roughness: 0.48 }),
    spandrel: new THREE.MeshStandardMaterial({ color: "#3d3a38", metalness: 0.3, roughness: 0.6 }),
    roof: new THREE.MeshStandardMaterial({ color: "#7a2430", metalness: 0.15, roughness: 0.5, side: THREE.DoubleSide }),
    roofRib: new THREE.MeshStandardMaterial({ color: "#8a2e38", metalness: 0.2, roughness: 0.42 }),
    interior: new THREE.MeshStandardMaterial({ ...interiorBase, color: "#3e3833" }),
    interiorLit: new THREE.MeshStandardMaterial({ ...interiorBase, color: "#9a8470", emissive: "#ffb46e", emissiveIntensity: 0.4 }),
    stairInterior: new THREE.MeshStandardMaterial({ ...interiorBase, color: "#9a938a", emissive: "#ffcc90", emissiveIntensity: 0.12 }),
    grass: new THREE.MeshStandardMaterial({ color: "#ffffff", map: grass.map, roughness: 1 }),
  };
}
