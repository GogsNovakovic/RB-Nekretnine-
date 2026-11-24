import * as THREE from "three";
import { mulberry32 } from "../building/geom";

/** Sun direction (towards the sun): low south-western dusk sun, as in the renders. */
export const SUN_DIR = new THREE.Vector3(-0.62, 0.5, 0.6).normalize();

const SKY = {
  zenith: new THREE.Color("#1d4f9c"),
  mid: new THREE.Color("#3f86cf"),
  horizon: new THREE.Color("#f3c99a"),
  ground: new THREE.Color("#5a5a4e"),
};

function skyMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: "Sky",
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      zenith: { value: SKY.zenith },
      mid: { value: SKY.mid },
      horizon: { value: SKY.horizon },
      ground: { value: SKY.ground },
      sunDir: { value: SUN_DIR },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 zenith, mid, horizon, ground, sunDir;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(horizon, mid, smoothstep(0.0, 0.22, h));
        col = mix(col, zenith, smoothstep(0.18, 0.85, h));
        float s = max(dot(d, normalize(vec3(sunDir.x, 0.0, sunDir.z))), 0.0);
        col += vec3(1.0, 0.62, 0.32) * pow(s, 6.0) * 0.55 * (1.0 - smoothstep(0.0, 0.35, h));
        col = mix(col, ground, smoothstep(0.0, -0.06, h));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

function createSky(): THREE.Mesh {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), skyMaterial());
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  sky.name = "sky";
  return sky;
}

/** Pre-filtered environment map used only for reflections on glass and metal (never drawn as a backdrop). */
export function createEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene();
  scene.add(createSky());
  const ground = new THREE.Mesh(new THREE.CircleGeometry(600, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#66665a" }));
  ground.position.y = -2;
  scene.add(ground);
  // dark tree belts on the horizon give the glazing realistic reflections
  const trees = createTreeLine();
  trees.traverse((o) => {
    if (o instanceof THREE.Mesh) o.material = new THREE.MeshBasicMaterial({ color: "#1f2a17" });
  });
  scene.add(trees);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.02);
  pmrem.dispose();
  scene.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  return rt.texture;
}

/** Invisible ground plane that only shows the building's shadow, so it doesn't float. */
export function createShadowCatcher(): THREE.Mesh {
  const g = new THREE.PlaneGeometry(120, 120).rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(g, new THREE.ShadowMaterial({ color: "#000000", opacity: 0.22 }));
  mesh.receiveShadow = true;
  mesh.name = "shadowCatcher";
  return mesh;
}

export function createLights(): { sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight; bounce: THREE.DirectionalLight } {
  const hemi = new THREE.HemisphereLight("#d6e4f5", "#7d7b6e", 1.35);
  const sun = new THREE.DirectionalLight("#ffe2c4", 2.3);
  sun.position.copy(SUN_DIR).multiplyScalar(60);
  sun.target.position.set(0, 3, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const c = sun.shadow.camera;
  c.left = -22;
  c.right = 22;
  c.top = 22;
  c.bottom = -22;
  c.near = 10;
  c.far = 120;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  // Light bounced off the sunlit meadow: lifts the timber soffit and slab undersides
  // the way global illumination does in the reference renders.
  const bounce = new THREE.DirectionalLight("#d5d8da", 1.0);
  bounce.position.set(-6, -30, 12);
  bounce.target.position.set(0, 0, 0);
  return { sun, hemi, bounce };
}

/** Distant belts of deciduous trees on the horizon for scale and context (as in the renders). */
function createTreeLine(): THREE.Group {
  const rand = mulberry32(77);
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const push = (g: THREE.BufferGeometry, rgb: [number, number, number]) => {
    const ng = g.index ? g.toNonIndexed() : g;
    const p = ng.attributes.position.array as Float32Array;
    const n = ng.attributes.normal.array as Float32Array;
    for (let i = 0; i < p.length; i++) {
      pos.push(p[i]);
      nor.push(n[i]);
    }
    for (let i = 0; i < p.length / 3; i++) col.push(...rgb);
    g.dispose();
    if (ng !== g) ng.dispose();
  };
  const belts = 26;
  for (let b = 0; b < belts; b++) {
    const ang = (b / belts) * Math.PI * 2 + rand() * 0.2;
    const r = 230 + rand() * 170;
    const trees = 4 + Math.floor(rand() * 9);
    const len = 20 + rand() * 50;
    for (let k = 0; k < trees; k++) {
      const along = (rand() - 0.5) * len;
      const x = Math.cos(ang) * r - Math.sin(ang) * along + (rand() - 0.5) * 8;
      const z = Math.sin(ang) * r + Math.cos(ang) * along + (rand() - 0.5) * 8;
      const h = 9 + rand() * 10;
      const shade = 0.75 + rand() * 0.35;
      const green: [number, number, number] = [0.07 * shade, 0.1 * shade, 0.055 * shade];
      for (let blob = 0; blob < 4; blob++) {
        const rad = (0.35 + rand() * 0.25) * h * 0.55;
        const g = new THREE.IcosahedronGeometry(rad, 2);
        g.scale(1, 0.85 + rand() * 0.3, 1);
        g.translate(x + (rand() - 0.5) * rad, h * (0.62 + rand() * 0.3), z + (rand() - 0.5) * rad);
        push(g, green);
      }
      const trunk = new THREE.CylinderGeometry(0.25, 0.4, h * 0.6, 5);
      trunk.translate(x, h * 0.3, z);
      push(trunk, [0.12, 0.1, 0.08]);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  const group = new THREE.Group();
  group.add(mesh);
  group.name = "treeLine";
  return group;
}
