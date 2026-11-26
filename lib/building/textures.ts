import * as THREE from "three";
import { mulberry32 } from "./geom";

/**
 * Procedural, tileable canvas textures. UVs on the generated geometry are in
 * metres, so each texture declares the real-world size (m) of one tile and
 * `repeat` is set to 1 / size.
 */

export interface TexturePair {
  map: THREE.CanvasTexture;
  bump?: THREE.CanvasTexture;
  size: number;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas not available");
  return [c, ctx];
}

function finish(c: HTMLCanvasElement, size: number, color: boolean, aniso: number, sizeV = size): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / size, 1 / sizeV);
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}

/** Tileable value noise in [0,1] with `cells` lattice cells across (and `cellsY` down) the tile. */
function valueNoise(size: number, cells: number, rand: () => number, cellsY = cells): Float32Array {
  const grid = Array.from({ length: cells * cellsY }, () => rand());
  const out = new Float32Array(size * size);
  const s = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) {
    const gy = (y / size) * cellsY;
    const y0 = Math.floor(gy);
    const fy = s(gy - y0);
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * cells;
      const x0 = Math.floor(gx);
      const fx = s(gx - x0);
      const g = (i: number, j: number) => grid[((j % cellsY) * cells + (i % cells)) | 0];
      const a = g(x0, y0) + (g(x0 + 1, y0) - g(x0, y0)) * fx;
      const b = g(x0, y0 + 1) + (g(x0 + 1, y0 + 1) - g(x0, y0 + 1)) * fx;
      out[y * size + x] = a + (b - a) * fy;
    }
  }
  return out;
}

/** Fine render/stucco: near-white albedo variation + grain bump. Tint via material colour. */
export function stuccoTexture(aniso: number): TexturePair {
  const N = 512;
  const rand = mulberry32(11);
  const big = valueNoise(N, 6, rand);
  const mid = valueNoise(N, 24, rand);
  const [c, ctx] = makeCanvas(N, N);
  const [cb, ctxb] = makeCanvas(N, N);
  const img = ctx.createImageData(N, N);
  const bimg = ctxb.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    const grain = rand();
    const v = 236 + (big[i] - 0.5) * 10 + (mid[i] - 0.5) * 8 + (grain - 0.5) * 10;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v - 1;
    img.data[i * 4 + 3] = 255;
    const b = 128 + (grain - 0.5) * 150 + (mid[i] - 0.5) * 60;
    bimg.data[i * 4] = bimg.data[i * 4 + 1] = bimg.data[i * 4 + 2] = b;
    bimg.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  ctxb.putImageData(bimg, 0, 0);
  return { map: finish(c, 2, true, aniso), bump: finish(cb, 2, false, aniso), size: 2 };
}

/**
 * Horizontal timber cladding: 0.16 m boards with per-board tone, grain streaks,
 * butt joints and shadowed grooves. One tile = 2.56 m × 2.56 m (16 boards).
 */
export function sidingTexture(aniso: number): TexturePair {
  const N = 512;
  const boards = 16;
  const bh = N / boards;
  const rand = mulberry32(23);
  // Grain runs along the boards: noise stretched ~20:1 horizontally.
  const fine = valueNoise(N, 6, rand, 128);
  const coarse = valueNoise(N, 3, rand, 24);
  const [c, ctx] = makeCanvas(N, N);
  const [cb, ctxb] = makeCanvas(N, N);
  const img = ctx.createImageData(N, N);
  const bimg = ctxb.createImageData(N, N);
  // Boards are long (one butt joint every few metres), with gentle board-to-board tone.
  const rows = Array.from({ length: boards }, () => ({
    tone: (rand() - 0.5) * 8,
    warm: (rand() - 0.5) * 6,
    phase: Math.floor(rand() * N),
    joints: rand() < 0.2 ? [Math.floor(rand() * N)] : [],
  }));
  for (let y = 0; y < N; y++) {
    const row = rows[Math.floor(y / bh)];
    const inBoard = (y % bh) / bh; // 0 = top of board, 1 = bottom edge
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const gx = (x + row.phase) % N;
      const g = fine[y * N + gx] * 0.6 + coarse[y * N + gx] * 0.4;
      const streak = coarse[((y + 7) % N) * N + gx];
      let r = 142 + row.tone + (g - 0.5) * 18 + streak * 6 + row.warm;
      let gg = 119 + row.tone * 0.85 + (g - 0.5) * 15 + streak * 5;
      let b = 105 + row.tone * 0.8 + (g - 0.5) * 12 + streak * 4 - row.warm * 0.5;
      let h = 150 - inBoard * 40 + (g - 0.5) * 20;
      // groove: dark shadow line at the bottom of each board, highlight at the top
      if (inBoard > 0.92) {
        r *= 0.58;
        gg *= 0.58;
        b *= 0.58;
        h = 20;
      } else if (inBoard < 0.06) {
        r *= 1.08;
        gg *= 1.08;
        b *= 1.08;
        h = 200;
      }
      if (row.joints.some((j) => Math.abs(x - j) < 1)) {
        r *= 0.72;
        gg *= 0.72;
        b *= 0.72;
        h = 60;
      }
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = gg;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 255;
      bimg.data[i * 4] = bimg.data[i * 4 + 1] = bimg.data[i * 4 + 2] = h;
      bimg.data[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctxb.putImageData(bimg, 0, 0);
  return { map: finish(c, 2.56, true, aniso), bump: finish(cb, 2.56, false, aniso), size: 2.56 };
}

/** Grey split-stone plinth: courses 0.11 m high, units 0.3–0.5 m long. Tile 1.6 × 0.66 m. */
export function plinthTexture(aniso: number): TexturePair {
  const Wp = 512;
  const Hp = 212;
  const rand = mulberry32(5);
  const [c, ctx] = makeCanvas(Wp, Hp);
  const [cb, ctxb] = makeCanvas(Wp, Hp);
  ctx.fillStyle = "#5d5f60";
  ctx.fillRect(0, 0, Wp, Hp);
  ctxb.fillStyle = "#202020";
  ctxb.fillRect(0, 0, Wp, Hp);
  const courses = 6;
  const ch = Hp / courses;
  for (let k = 0; k < courses; k++) {
    let x = -rand() * 120;
    while (x < Wp) {
      const len = 90 + rand() * 70;
      const t = 118 + rand() * 34;
      ctx.fillStyle = `rgb(${t},${t + 1},${t + 2})`;
      const y = k * ch + 2;
      for (const dx of [0, -Wp, Wp]) {
        ctx.fillRect(x + dx + 2, y, len - 4, ch - 4);
        ctxb.fillStyle = `rgb(${150 + rand() * 60},${150},${150})`;
        ctxb.fillRect(x + dx + 2, y, len - 4, ch - 4);
      }
      x += len;
    }
  }
  // speckle
  const img = ctx.getImageData(0, 0, Wp, Hp);
  for (let i = 0; i < Wp * Hp; i++) {
    const n = (rand() - 0.5) * 18;
    img.data[i * 4] += n;
    img.data[i * 4 + 1] += n;
    img.data[i * 4 + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  return { map: finish(c, 1.6, true, aniso, 0.66), bump: finish(cb, 1.6, false, aniso, 0.66), size: 1.6 };
}

/** Light grey concrete pavers 0.2 × 0.1 m in a herringbone-like stretcher bond. Tile 1.6 m. */
export function pavingTexture(aniso: number): TexturePair {
  const N = 512;
  const rand = mulberry32(9);
  const [c, ctx] = makeCanvas(N, N);
  const [cb, ctxb] = makeCanvas(N, N);
  ctx.fillStyle = "#6f6d6a";
  ctx.fillRect(0, 0, N, N);
  ctxb.fillStyle = "#303030";
  ctxb.fillRect(0, 0, N, N);
  const u = N / 8; // 0.2 m
  for (let by = 0; by < 8; by++) {
    for (let bx = 0; bx < 8; bx++) {
      const vertical = (bx + by) % 2 === 0;
      for (let k = 0; k < 2; k++) {
        const t = 150 + rand() * 28;
        ctx.fillStyle = `rgb(${t + 2},${t + 1},${t})`;
        ctxb.fillStyle = `rgb(${170 + rand() * 50},0,0)`;
        const [x, y, w, h] = vertical ? [bx * u + (k * u) / 2, by * u, u / 2, u] : [bx * u, by * u + (k * u) / 2, u, u / 2];
        ctx.fillRect(x + 1.5, y + 1.5, w - 3, h - 3);
        ctxb.fillRect(x + 1.5, y + 1.5, w - 3, h - 3);
      }
    }
  }
  const img = ctx.getImageData(0, 0, N, N);
  for (let i = 0; i < N * N; i++) {
    const n = (rand() - 0.5) * 14;
    img.data[i * 4] += n;
    img.data[i * 4 + 1] += n;
    img.data[i * 4 + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  return { map: finish(c, 1.6, true, aniso), bump: finish(cb, 1.6, false, aniso), size: 1.6 };
}

/** Return a clone of a tiling texture with a different real-world tile size. */
export function rescaled(t: THREE.Texture, size: number, sizeV = size): THREE.Texture {
  const c = t.clone();
  c.repeat.set(1 / size, 1 / sizeV);
  c.needsUpdate = true;
  return c;
}
