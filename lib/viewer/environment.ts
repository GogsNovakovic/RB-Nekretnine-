import * as THREE from "three";
import { VIEWER } from "./config";

const L = VIEWER.lighting;
const G = VIEWER.ground;
const deg = THREE.MathUtils.degToRad;

/** Unit vector for an (azimuth, elevation) pair in the building's axes (see config.ts). */
export function direction(azimuthDeg: number, elevationDeg: number): THREE.Vector3 {
  const a = deg(azimuthDeg);
  const e = deg(elevationDeg);
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
}

/** Direction towards the sun. */
export const SUN_DIR = direction(L.sunAzimuth, L.sunElevation);

/**
 * Pre-filtered environment for image-based light and reflections on glass and
 * metal. It is never drawn as a backdrop. A plain sky gradient with a soft darker
 * band at the horizon gives windows a readable reflection without modelling any
 * surroundings.
 */
export function createEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      zenith: { value: new THREE.Color("#3d72b8") },
      sky: { value: new THREE.Color("#8fb6dc") },
      horizon: { value: new THREE.Color("#e7e3dc") },
      band: { value: new THREE.Color("#5b6058") },
      ground: { value: new THREE.Color("#7b786f") },
      sunDir: { value: SUN_DIR },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 zenith, sky, horizon, band, ground, sunDir;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(horizon, sky, smoothstep(0.0, 0.25, h));
        col = mix(col, zenith, smoothstep(0.25, 0.9, h));
        // distant, featureless landscape band just above the horizon
        col = mix(col, band, (1.0 - smoothstep(0.0, 0.05, h)) * step(-0.002, h) * 0.85);
        col = mix(col, ground, smoothstep(0.0, -0.03, h));
        // sun glow
        float s = max(dot(d, normalize(sunDir)), 0.0);
        col += vec3(1.0, 0.9, 0.75) * (pow(s, 64.0) * 6.0 + pow(s, 6.0) * 0.25);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 64, 32), material);
  scene.add(sky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.01);
  pmrem.dispose();
  sky.geometry.dispose();
  material.dispose();
  return rt.texture;
}

/**
 * Daylight: one shadow-casting sun with its shadow box fitted to the building and
 * the ground it shades, a hemisphere fill, and a weak upward bounce.
 */
export function createLights(bounds: THREE.Box3, shadowMapSize: number) {
  const centre = bounds.getCenter(new THREE.Vector3());
  const radius = bounds.getBoundingSphere(new THREE.Sphere()).radius;

  const hemi = new THREE.HemisphereLight(L.skyColor, L.groundColor, L.fillIntensity);

  const sun = new THREE.DirectionalLight(L.sunColor, L.sunIntensity);
  sun.position.copy(centre).addScaledVector(SUN_DIR, radius * 3);
  sun.target.position.copy(centre);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);

  // Fit the orthographic shadow box to the building corners and their shadows on the ground.
  const cam = new THREE.OrthographicCamera();
  cam.position.copy(sun.position);
  cam.lookAt(centre);
  cam.updateMatrixWorld(true);
  const toLight = cam.matrixWorldInverse;
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
  const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  const p = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    p.set(i & 1 ? bounds.max.x : bounds.min.x, i & 2 ? bounds.max.y : bounds.min.y, i & 4 ? bounds.max.z : bounds.min.z);
    const ground = p.clone().addScaledVector(SUN_DIR, -p.y / SUN_DIR.y);
    for (const q of [p, ground]) {
      const l = q.clone().applyMatrix4(toLight);
      lo.min(l);
      hi.max(l);
    }
  }
  const pad = 0.5;
  const c = sun.shadow.camera;
  c.left = lo.x - pad;
  c.right = hi.x + pad;
  c.bottom = lo.y - pad;
  c.top = hi.y + pad;
  c.near = Math.max(0.1, -hi.z - pad);
  c.far = -lo.z + pad;
  c.updateProjectionMatrix();
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 2;

  const bounce = new THREE.DirectionalLight("#e1dfd8", L.bounceIntensity);
  bounce.position.copy(centre).add(new THREE.Vector3(-SUN_DIR.x, -1, -SUN_DIR.z).multiplyScalar(radius));
  bounce.target.position.copy(centre);

  return { sun, hemi, bounce };
}

/**
 * Ground: an invisible plane that only shows the sun shadow and a faint tint, fading
 * out radially so it has no visible edge, plus a soft contact shadow hugging the
 * footprint so the building sits on the ground even where the sun shadow falls
 * behind it.
 */
export function createGround(footprint: THREE.Box3): THREE.Group {
  const group = new THREE.Group();
  group.name = "Ground";
  const cx = (footprint.min.x + footprint.max.x) / 2;
  const cz = (footprint.min.z + footprint.max.z) / 2;

  const mat = new THREE.ShadowMaterial({ color: 0x000000, opacity: G.shadowOpacity, depthWrite: false });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFade = { value: new THREE.Vector4(cx, cz, G.fadeInner, G.fadeOuter) };
    sh.uniforms.uTint = { value: G.tint };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGroundPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGroundPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGroundPos;\nuniform vec4 uFade;\nuniform float uTint;")
      .replace(
        "gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );",
        `float fade = 1.0 - smoothstep(uFade.z, uFade.w, length(vGroundPos.xz - uFade.xy));
        float sh = opacity * (1.0 - getShadowMask());
        gl_FragColor = vec4(color, (sh + uTint * (1.0 - sh)) * fade);`,
      );
  };
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(G.fadeOuter * 2.2, G.fadeOuter * 2.2).rotateX(-Math.PI / 2), mat);
  plane.position.set(cx, 0, cz);
  plane.receiveShadow = true;
  plane.renderOrder = -2;
  plane.name = "shadowCatcher";
  group.add(plane);

  // Contact shadow: product of two smooth edge falloffs around the footprint rectangle.
  const s = G.contactSpread;
  const w = footprint.max.x - footprint.min.x + 2 * s;
  const d = footprint.max.z - footprint.min.z + 2 * s;
  const N = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = N;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const img = ctx.createImageData(N, N);
    const fall = (t: number, size: number) => {
      const m = Math.min(t, size - t); // metres from the outer edge
      const k = Math.min(1, Math.max(0, m / s));
      return k * k * (3 - 2 * k);
    };
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const a = fall(((i + 0.5) / N) * w, w) * fall(((j + 0.5) / N) * d, d);
        const o = (j * N + i) * 4;
        img.data[o] = img.data[o + 1] = img.data[o + 2] = 0;
        img.data[o + 3] = Math.round(255 * a);
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: G.contactOpacity, depthWrite: false, toneMapped: false }),
    );
    contact.position.set(cx, 0.004, cz);
    contact.renderOrder = -1;
    contact.name = "contactShadow";
    group.add(contact);
  }
  return group;
}
