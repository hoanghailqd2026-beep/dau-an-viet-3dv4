import * as THREE from 'three';

export type MuseumLightingMode = 'studio' | 'day' | 'golden' | 'night';

interface CachedCompassTextures {
  dark: THREE.CanvasTexture;
  light: THREE.CanvasTexture;
}

let cachedDustTexture: THREE.CanvasTexture | null = null;
let cachedHorizonAlphaTexture: THREE.CanvasTexture | null = null;
let cachedCompassTextures: CachedCompassTextures | null = null;

/**
 * Generates a soft radial champagne-gold glow sprite for floating dust & stars (cached once).
 */
export function getSoftGlowParticleTexture(): THREE.CanvasTexture {
  if (cachedDustTexture) return cachedDustTexture;

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0.0, 'rgba(255, 250, 238, 1.0)');
    grad.addColorStop(0.28, 'rgba(229, 196, 128, 0.85)');
    grad.addColorStop(0.65, 'rgba(201, 164, 106, 0.22)');
    grad.addColorStop(1.0, 'rgba(201, 164, 106, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.isCached = true;
  tex.needsUpdate = true;
  cachedDustTexture = tex;
  return tex;
}

/**
 * Generates a smooth radial alpha-fade texture so the outer plinth skirt melts into horizon fog.
 */
function getHorizonFadeAlphaTexture(): THREE.CanvasTexture {
  if (cachedHorizonAlphaTexture) return cachedHorizonAlphaTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const half = size / 2;
    const grad = ctx.createRadialGradient(half, half, half * 0.28, half, half, half);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.92)');
    grad.addColorStop(0.48, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(0.78, 'rgba(255, 255, 255, 0.12)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.userData.isCached = true;
  tex.needsUpdate = true;
  cachedHorizonAlphaTexture = tex;
  return tex;
}

function drawCompassRoseCanvas(variant: 'dark' | 'light'): HTMLCanvasElement {
  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.492;

  const isDark = variant === 'dark';

  // 1. Stone / Architectural Base Radial Surface
  const baseGrad = ctx.createRadialGradient(cx, cy, size * 0.06, cx, cy, maxR);
  if (isDark) {
    baseGrad.addColorStop(0.0, '#22201D');
    baseGrad.addColorStop(0.55, '#1B1A18');
    baseGrad.addColorStop(0.88, '#171817');
    baseGrad.addColorStop(1.0, '#141514');
  } else {
    baseGrad.addColorStop(0.0, '#EBE3D4');
    baseGrad.addColorStop(0.55, '#E2D8C6');
    baseGrad.addColorStop(0.88, '#D5C9B4');
    baseGrad.addColorStop(1.0, '#CBBFA9');
  }
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // Subtle radial architectural micro-grain (deterministic, light touch)
  ctx.save();
  ctx.globalAlpha = isDark ? 0.032 : 0.035;
  for (let i = 0; i < 2400; i++) {
    const ang = (i * 137.508) % (Math.PI * 2);
    const rad = Math.sqrt((i % 997) / 997) * maxR;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();

  const goldPrimary = isDark ? 'rgba(201, 164, 106, 0.58)' : 'rgba(122, 92, 42, 0.65)';
  const goldSecondary = isDark ? 'rgba(201, 164, 106, 0.24)' : 'rgba(122, 92, 42, 0.28)';
  const goldFaint = isDark ? 'rgba(201, 164, 106, 0.12)' : 'rgba(122, 92, 42, 0.14)';
  const textFill = isDark ? '#DFC286' : '#5E4419';

  // 2. Concentric Geodetic Rings
  const ringRadii = [0.18, 0.34, 0.52, 0.72, 0.855, 0.905, 0.968];
  ringRadii.forEach((ratio, idx) => {
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * ratio, 0, Math.PI * 2);
    ctx.strokeStyle =
      idx === 4 || idx === 6 ? goldPrimary : idx % 2 === 0 ? goldSecondary : goldFaint;
    ctx.lineWidth = idx === 6 ? 3.5 : idx === 4 ? 2.2 : 1.5;
    if (idx === 1 || idx === 3) {
      ctx.setLineDash([8, 12]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // 3. Cardinal & Intercardinal Geodetic Crosshairs
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const isCardinal = i % 2 === 0;
    const rStart = maxR * (isCardinal ? 0.18 : 0.34);
    const rEnd = maxR * 0.855;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * rStart, cy + Math.sin(angle) * rStart);
    ctx.lineTo(cx + Math.cos(angle) * rEnd, cy + Math.sin(angle) * rEnd);
    ctx.strokeStyle = isCardinal ? goldSecondary : goldFaint;
    ctx.lineWidth = isCardinal ? 2.0 : 1.2;
    ctx.stroke();
  }

  // 4. Precision 360° Geodetic Azimuth Ticks around Outer Band
  const tickOuter = maxR * 0.905;
  for (let deg = 0; deg < 360; deg += 5) {
    const rad = ((deg - 90) * Math.PI) / 180;
    const isMajor = deg % 30 === 0;
    const isMid = deg % 10 === 0;
    const tickLen = isMajor ? 28 : isMid ? 16 : 9;
    const tickInner = tickOuter - tickLen;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * tickInner, cy + Math.sin(rad) * tickInner);
    ctx.lineTo(cx + Math.cos(rad) * tickOuter, cy + Math.sin(rad) * tickOuter);
    ctx.strokeStyle = isMajor ? goldPrimary : goldSecondary;
    ctx.lineWidth = isMajor ? 3.0 : isMid ? 1.8 : 1.0;
    ctx.stroke();

    if (isMajor && deg % 90 !== 0) {
      ctx.save();
      const labelR = maxR * 0.935;
      ctx.translate(cx + Math.cos(rad) * labelR, cy + Math.sin(rad) * labelR);
      ctx.rotate(rad + Math.PI / 2);
      ctx.font = '500 24px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = goldPrimary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${deg}°`, 0, 0);
      ctx.restore();
    }
  }

  // 5. Compass Rose Cardinal Letters (B - Đ - N - T)
  const cardinals: Array<{ label: string; sub: string; deg: number }> = [
    { label: 'B', sub: '0°', deg: 0 },
    { label: 'Đ', sub: '90°', deg: 90 },
    { label: 'N', sub: '180°', deg: 180 },
    { label: 'T', sub: '270°', deg: 270 },
  ];

  cardinals.forEach(({ label, deg }) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    const badgeR = maxR * 0.935;
    const bx = cx + Math.cos(rad) * badgeR;
    const by = cy + Math.sin(rad) * badgeR;

    const dR = maxR * 0.878;
    const dx = cx + Math.cos(rad) * dR;
    const dy = cy + Math.sin(rad) * dR;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(rad + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fillStyle = deg === 0 ? '#A94F3D' : textFill;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rad + Math.PI / 2);
    ctx.font = '600 44px "Lora", Georgia, serif';
    ctx.fillStyle = deg === 0 ? (isDark ? '#F5EFE6' : '#8C2D19') : textFill;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  return canvas;
}

/**
 * Generates and caches both Dark (Studio/Night) and Light (Day/Sunset)
 * Geodetic & Compass Diorama Plinth textures once per session.
 */
export function getDioramaCompassTextures(maxAnisotropy: number): CachedCompassTextures {
  if (cachedCompassTextures) return cachedCompassTextures;

  const darkTex = new THREE.CanvasTexture(drawCompassRoseCanvas('dark'));
  darkTex.colorSpace = THREE.SRGBColorSpace;
  darkTex.anisotropy = Math.min(16, Math.max(1, maxAnisotropy));
  darkTex.userData.isCached = true;
  darkTex.needsUpdate = true;

  const lightTex = new THREE.CanvasTexture(drawCompassRoseCanvas('light'));
  lightTex.colorSpace = THREE.SRGBColorSpace;
  lightTex.anisotropy = Math.min(16, Math.max(1, maxAnisotropy));
  lightTex.userData.isCached = true;
  lightTex.needsUpdate = true;

  cachedCompassTextures = { dark: darkTex, light: lightTex };
  return cachedCompassTextures;
}

/**
 * Pre-bakes 4 lightweight PMREMGenerator environment reflection textures
 * synchronized to Studio, Day, Golden Sunset, and Night lighting modes.
 */
export interface MuseumEnvironmentMapCache {
  studio: THREE.WebGLRenderTarget;
  day: THREE.WebGLRenderTarget;
  golden: THREE.WebGLRenderTarget;
  night: THREE.WebGLRenderTarget;
  dispose: () => void;
}

function buildModeReflectionEnvTarget(
  pmremGenerator: THREE.PMREMGenerator,
  config: {
    bgHex: number;
    ceilingHex: number;
    floorHex: number;
    keyPanelHex: number;
    fillPanelHex: number;
    rimPanelHex: number;
  }
): THREE.WebGLRenderTarget {
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(config.bgHex);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const planeGeo = new THREE.PlaneGeometry(1, 1);
  const disposables: THREE.Material[] = [];

  const makeMat = (hex: number) => {
    const m = new THREE.MeshBasicMaterial({ color: hex, side: THREE.DoubleSide });
    disposables.push(m);
    return m;
  };

  // Upper ceiling softbox
  const ceiling = new THREE.Mesh(planeGeo, makeMat(config.ceilingHex));
  ceiling.position.set(0, 12, 0);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.scale.set(22, 22, 1);
  envScene.add(ceiling);

  // Warm/cool ground bounce plane
  const floor = new THREE.Mesh(planeGeo, makeMat(config.floorHex));
  floor.position.set(0, -10, 0);
  floor.rotation.x = -Math.PI / 2;
  floor.scale.set(24, 24, 1);
  envScene.add(floor);

  // Key studio / solar panel
  const keyPanel = new THREE.Mesh(boxGeo, makeMat(config.keyPanelHex));
  keyPanel.position.set(11, 8, 10);
  keyPanel.lookAt(0, 0, 0);
  keyPanel.scale.set(9, 6, 0.4);
  envScene.add(keyPanel);

  // Opposite fill panel
  const fillPanel = new THREE.Mesh(boxGeo, makeMat(config.fillPanelHex));
  fillPanel.position.set(-12, 5, 7);
  fillPanel.lookAt(0, 0, 0);
  fillPanel.scale.set(8, 5, 0.4);
  envScene.add(fillPanel);

  // Architectural rim accent panel
  const rimPanel = new THREE.Mesh(boxGeo, makeMat(config.rimPanelHex));
  rimPanel.position.set(-5, 6, -13);
  rimPanel.lookAt(0, 0, 0);
  rimPanel.scale.set(10, 4.5, 0.4);
  envScene.add(rimPanel);

  const rt = pmremGenerator.fromScene(envScene, 0.04);

  boxGeo.dispose();
  planeGeo.dispose();
  disposables.forEach((m) => m.dispose());

  return rt;
}

export function createMuseumEnvironmentMaps(
  renderer: THREE.WebGLRenderer
): MuseumEnvironmentMapCache {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const studio = buildModeReflectionEnvTarget(pmremGenerator, {
    bgHex: 0x1b1916,
    ceilingHex: 0x4b4335,
    floorHex: 0x171817,
    keyPanelHex: 0xfff3de,
    fillPanelHex: 0xc9a46a,
    rimPanelHex: 0x9eb4cc,
  });

  const day = buildModeReflectionEnvTarget(pmremGenerator, {
    bgHex: 0xaec6da,
    ceilingHex: 0x7fa3c4,
    floorHex: 0xd8cdb8,
    keyPanelHex: 0xfffbf0,
    fillPanelHex: 0xe8dfce,
    rimPanelHex: 0xc5daee,
  });

  const golden = buildModeReflectionEnvTarget(pmremGenerator, {
    bgHex: 0x5c362c,
    ceilingHex: 0x283342,
    floorHex: 0x3b261d,
    keyPanelHex: 0xffc67d,
    fillPanelHex: 0xa94f3d,
    rimPanelHex: 0xc9a46a,
  });

  const night = buildModeReflectionEnvTarget(pmremGenerator, {
    bgHex: 0x121925,
    ceilingHex: 0x0e1117,
    floorHex: 0x161d29,
    keyPanelHex: 0x9bb8df,
    fillPanelHex: 0x304564,
    rimPanelHex: 0xe2ba78,
  });

  pmremGenerator.dispose();

  return {
    studio,
    day,
    golden,
    night,
    dispose: () => {
      studio.dispose();
      day.dispose();
      golden.dispose();
      night.dispose();
    },
  };
}

export interface SkyDomeUniforms {
  [uniform: string]: THREE.IUniform<unknown>;
  uTopColor: THREE.IUniform<THREE.Color>;
  uMidColor: THREE.IUniform<THREE.Color>;
  uHorizonColor: THREE.IUniform<THREE.Color>;
  uLowerColor: THREE.IUniform<THREE.Color>;
  uGlowColor: THREE.IUniform<THREE.Color>;
  uGlowIntensity: THREE.IUniform<number>;
  uGlowDir: THREE.IUniform<THREE.Vector3>;
  uBandGlowIntensity: THREE.IUniform<number>;
}

export function createMuseumSkyDome(): {
  mesh: THREE.Mesh;
  uniforms: SkyDomeUniforms;
} {
  const uniforms: SkyDomeUniforms = {
    uTopColor: { value: new THREE.Color(0x171817) },
    uMidColor: { value: new THREE.Color(0x211e19) },
    uHorizonColor: { value: new THREE.Color(0x2b261e) },
    uLowerColor: { value: new THREE.Color(0x171817) },
    uGlowColor: { value: new THREE.Color(0xc9a46a) },
    uGlowIntensity: { value: 0.24 },
    uGlowDir: { value: new THREE.Vector3(-0.24, 0.14, -0.96).normalize() },
    uBandGlowIntensity: { value: 0.12 },
  };

  const geo = new THREE.SphereGeometry(210, 36, 28);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uLowerColor;
      uniform vec3 uGlowColor;
      uniform float uGlowIntensity;
      uniform vec3 uGlowDir;
      uniform float uBandGlowIntensity;
      varying vec3 vWorldDir;

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = clamp(dir.y, -0.45, 1.0);

        // Smooth architectural sky dome gradient matching horizon FogExp2
        float belowHorizon = smoothstep(-0.32, 0.0, h);
        float lowerMix = smoothstep(0.0, 0.28, h);
        float upperMix = smoothstep(0.22, 0.88, h);

        vec3 sky = mix(uLowerColor, uHorizonColor, belowHorizon);
        sky = mix(sky, uMidColor, lowerMix);
        sky = mix(sky, uTopColor, upperMix);

        // Museum gallery cyclorama soft bronze-gold halo around the horizon behind center
        float horizonBand = exp(-pow((h - 0.05) * 4.2, 2.0));
        sky += uGlowColor * horizonBand * uBandGlowIntensity;

        // Directional solar / stage spotlight aura
        float align = max(0.0, dot(dir, normalize(uGlowDir)));
        float softHalo = pow(align, 4.2);
        float horizonBoost = 1.0 - smoothstep(0.0, 0.7, abs(h));
        sky += uGlowColor * softHalo * uGlowIntensity * (0.45 + 0.55 * horizonBoost);

        gl_FragColor = vec4(sky, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  mesh.userData.isGround = true;

  return { mesh, uniforms };
}

/**
 * Creates 120 ultra-fine floating atmospheric light motes (GPU-friendly single draw call)
 * that provide subtle 3D spatial depth across all 4 lighting modes.
 */
export function createStudioBronzeDust(count = 120): THREE.Points {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = i * 2.3999632;
    const radius = 9 + Math.sqrt(t) * 34;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 1.2 + ((i * 7.13) % 23.0);
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xc9a46a,
    map: getSoftGlowParticleTexture(),
    size: 0.36,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: true,
  });

  const points = new THREE.Points(geo, mat);
  points.userData.isGround = true;
  return points;
}

/**
 * Creates subtle pinpoint stars in the upper night sky dome for Night mode.
 */
export function createNightStarfield(count = 240): THREE.Points {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const coolStar = new THREE.Color(0xdde9ff);
  const warmStar = new THREE.Color(0xffe7bd);

  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    const y = 0.12 + u * 0.86;
    const rHoriz = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * 2.3999632 + ((i % 7) - 3) * 0.12;
    const radius = 162 + (i % 15);

    positions[i * 3] = Math.cos(phi) * rHoriz * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(phi) * rHoriz * radius;

    const c = i % 5 === 0 ? warmStar : coolStar;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    map: getSoftGlowParticleTexture(),
    size: 1.08,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.84,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });

  const stars = new THREE.Points(geo, mat);
  stars.visible = false;
  stars.userData.isGround = true;
  return stars;
}

export interface DioramaPlinthRefs {
  group: THREE.Group;
  lowerMat: THREE.MeshStandardMaterial;
  upperMat: THREE.MeshStandardMaterial;
  deckMat: THREE.MeshStandardMaterial;
  surfaceMat: THREE.MeshStandardMaterial;
  bronzeTrimMat: THREE.MeshStandardMaterial;
  horizonApronMat: THREE.MeshBasicMaterial;
  compassTextures: CachedCompassTextures;
}

/**
 * Builds the Multi-Tier Architectural Diorama Plinth with brushed champagne bronze rim,
 * soft radial horizon-blend apron, and 2048px Geodetic & Compass Rose surface texture.
 */
export function createArchitecturalDioramaPlinth(
  stageBaseY: number,
  maxAnisotropy: number,
  hasBunkerCutaway = false
): DioramaPlinthRefs {
  const group = new THREE.Group();
  group.position.y = stageBaseY;

  const compassTextures = getDioramaCompassTextures(maxAnisotropy);

  // Matte Champagne Bronze Bevel Material (#C9A46A)
  const bronzeTrimMat = new THREE.MeshStandardMaterial({
    color: 0xc9a46a,
    metalness: 0.72,
    roughness: 0.28,
  });

  // 1. Lower Expansive Plinth Skirt (blends smoothly into horizon fog)
  const lowerMat = new THREE.MeshStandardMaterial({
    color: 0x1b1a18,
    roughness: 0.92,
    metalness: 0.08,
  });

  // 2. Stepped Architectural Gallery Pedestal
  const upperMat = new THREE.MeshStandardMaterial({
    color: 0x201f1d,
    roughness: 0.86,
    metalness: 0.12,
  });

  // 3. Main Exhibition Podium Deck
  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x262422,
    roughness: 0.82,
    metalness: 0.14,
  });

  // 4. Planar Geodetic & Compass Rose Exhibition Surface
  const surfaceMat = new THREE.MeshStandardMaterial({
    map: compassTextures.dark,
    roughness: 0.84,
    metalness: 0.12,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  // 5. Radial Horizon Fade Apron (dissolves plinth outer rim smoothly into horizon fog)
  const horizonApronMat = new THREE.MeshBasicMaterial({
    color: 0x221f19,
    alphaMap: getHorizonFadeAlphaTexture(),
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    fog: true,
  });
  const horizonApron = new THREE.Mesh(new THREE.CircleGeometry(118, 64), horizonApronMat);
  horizonApron.rotation.x = -Math.PI / 2;
  horizonApron.position.y = -2.44;
  horizonApron.userData.isGround = true;
  group.add(horizonApron);

  if (hasBunkerCutaway) {
    const addPitHole = (shape: THREE.Shape) => {
      const hole = new THREE.Path();
      hole.moveTo(-6.4, 5.4);
      hole.lineTo(6.4, 5.4);
      hole.lineTo(6.4, 11.6);
      hole.lineTo(-6.4, 11.6);
      hole.closePath();
      shape.holes.push(hole);
    };

    const lowerShape = new THREE.Shape();
    lowerShape.absarc(0, 0, 52.0, 0, Math.PI * 2, false);
    addPitHole(lowerShape);
    const lowerGeo = new THREE.ExtrudeGeometry(lowerShape, {
      depth: 2.2,
      bevelEnabled: false,
      curveSegments: 72,
    });
    lowerGeo.rotateX(-Math.PI / 2);
    const lowerSkirt = new THREE.Mesh(lowerGeo, lowerMat);
    lowerSkirt.position.y = -2.42;
    lowerSkirt.receiveShadow = true;
    lowerSkirt.userData.isGround = true;
    group.add(lowerSkirt);

    const upperShape = new THREE.Shape();
    upperShape.absarc(0, 0, 43.6, 0, Math.PI * 2, false);
    addPitHole(upperShape);
    const upperGeo = new THREE.ExtrudeGeometry(upperShape, {
      depth: 0.44,
      bevelEnabled: false,
      curveSegments: 72,
    });
    upperGeo.rotateX(-Math.PI / 2);
    const middleTerrace = new THREE.Mesh(upperGeo, upperMat);
    middleTerrace.position.y = -0.5;
    middleTerrace.receiveShadow = true;
    middleTerrace.userData.isGround = true;
    group.add(middleTerrace);

    const deckShape = new THREE.Shape();
    deckShape.absarc(0, 0, 37.6, 0, Math.PI * 2, false);
    addPitHole(deckShape);
    const deckGeo = new THREE.ExtrudeGeometry(deckShape, {
      depth: 0.16,
      bevelEnabled: false,
      curveSegments: 72,
    });
    deckGeo.rotateX(-Math.PI / 2);
    const mainDeck = new THREE.Mesh(deckGeo, deckMat);
    mainDeck.position.y = -0.155;
    mainDeck.receiveShadow = true;
    mainDeck.userData.isGround = true;
    group.add(mainDeck);

    const discR = 36.82;
    const discShape = new THREE.Shape();
    discShape.absarc(0, 0, discR, 0, Math.PI * 2, false);
    addPitHole(discShape);
    const discGeo = new THREE.ShapeGeometry(discShape, 96);
    const posAttr = discGeo.attributes.position;
    const uvArr = new Float32Array(posAttr.count * 2);
    for (let i = 0; i < posAttr.count; i++) {
      const sx = posAttr.getX(i);
      const sy = posAttr.getY(i);
      uvArr[i * 2] = sx / (discR * 2) + 0.5;
      uvArr[i * 2 + 1] = sy / (discR * 2) + 0.5;
    }
    discGeo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
    discGeo.rotateX(-Math.PI / 2);
    const compassDisc = new THREE.Mesh(discGeo, surfaceMat);
    compassDisc.position.y = 0.005;
    compassDisc.receiveShadow = true;
    compassDisc.userData.isGround = true;
    group.add(compassDisc);
  } else {
    const lowerSkirt = new THREE.Mesh(
      new THREE.CylinderGeometry(47.5, 56.5, 2.2, 72),
      lowerMat
    );
    lowerSkirt.position.y = -1.32;
    lowerSkirt.receiveShadow = true;
    lowerSkirt.userData.isGround = true;
    group.add(lowerSkirt);

    const middleTerrace = new THREE.Mesh(
      new THREE.CylinderGeometry(41.8, 45.6, 0.44, 72),
      upperMat
    );
    middleTerrace.position.y = -0.28;
    middleTerrace.receiveShadow = true;
    middleTerrace.userData.isGround = true;
    group.add(middleTerrace);

    const mainDeck = new THREE.Mesh(
      new THREE.CylinderGeometry(36.9, 38.6, 0.16, 72),
      deckMat
    );
    mainDeck.position.y = -0.075;
    mainDeck.receiveShadow = true;
    mainDeck.userData.isGround = true;
    group.add(mainDeck);

    const compassDisc = new THREE.Mesh(new THREE.CircleGeometry(36.82, 96), surfaceMat);
    compassDisc.rotation.x = -Math.PI / 2;
    compassDisc.position.y = 0.005;
    compassDisc.receiveShadow = true;
    compassDisc.userData.isGround = true;
    group.add(compassDisc);
  }

  // Subtle Lower Bronze Step Collar
  const lowerBronzeCollar = new THREE.Mesh(
    new THREE.TorusGeometry(41.85, 0.11, 10, 96),
    bronzeTrimMat
  );
  lowerBronzeCollar.rotation.x = Math.PI / 2;
  lowerBronzeCollar.position.y = -0.07;
  lowerBronzeCollar.userData.isGround = true;
  group.add(lowerBronzeCollar);

  // Beveled Champagne Bronze Outer Frame Rim (#C9A46A)
  const topBronzeRim = new THREE.Mesh(
    new THREE.TorusGeometry(36.92, 0.19, 14, 96),
    bronzeTrimMat
  );
  topBronzeRim.rotation.x = Math.PI / 2;
  topBronzeRim.position.y = -0.002;
  topBronzeRim.receiveShadow = true;
  topBronzeRim.userData.isGround = true;
  group.add(topBronzeRim);

  return {
    group,
    lowerMat,
    upperMat,
    deckMat,
    surfaceMat,
    bronzeTrimMat,
    horizonApronMat,
    compassTextures,
  };
}

export interface MuseumEnvironmentRefs {
  skyUniforms: SkyDomeUniforms;
  studioDust: THREE.Points;
  nightStars: THREE.Points;
  plinth: DioramaPlinthRefs;
  dirLight: THREE.DirectionalLight;
  backDirLight: THREE.DirectionalLight;
  studioRimLight: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
  hemiLight: THREE.HemisphereLight;
  nightSpots: THREE.SpotLight[];
  envMaps?: MuseumEnvironmentMapCache;
}

/**
 * Updates Sky Dome shader uniforms, FogExp2, PMREMGenerator environment reflections,
 * Lights, Floating Light Dust Motes, Starfield, and Plinth Compass Blend in place at 60FPS.
 */
export function applyMuseumEnvironmentPreset(
  mode: MuseumLightingMode,
  scene: THREE.Scene,
  refs: MuseumEnvironmentRefs
): void {
  const {
    skyUniforms,
    studioDust,
    nightStars,
    plinth,
    dirLight,
    backDirLight,
    studioRimLight,
    ambient,
    hemiLight,
    nightSpots,
    envMaps,
  } = refs;

  scene.background = null;

  const ensureFog = (hex: number, density: number) => {
    if (scene.fog && scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.setHex(hex);
      scene.fog.density = density;
    } else {
      scene.fog = new THREE.FogExp2(hex, density);
    }
  };

  const dustMat = studioDust.material as THREE.PointsMaterial;

  if (mode === 'studio') {
    // 1) STUDIO — Triển lãm Bảo tàng (#171817 -> #2B261E / #C9A46A 12% spotlight aura)
    skyUniforms.uTopColor.value.setHex(0x171817);
    skyUniforms.uMidColor.value.setHex(0x1f1c18);
    skyUniforms.uHorizonColor.value.setHex(0x2b261e);
    skyUniforms.uLowerColor.value.setHex(0x171817);
    skyUniforms.uGlowColor.value.setHex(0xc9a46a);
    skyUniforms.uGlowIntensity.value = 0.24;
    skyUniforms.uBandGlowIntensity.value = 0.12;
    skyUniforms.uGlowDir.value.set(-0.24, 0.14, -0.96).normalize();

    ensureFog(0x231f19, 0.0052);
    if (envMaps) scene.environment = envMaps.studio.texture;

    ambient.color.setHex(0xf5ead8);
    ambient.intensity = 0.62;
    hemiLight.color.setHex(0xd8c9a9);
    hemiLight.groundColor.setHex(0x1b1916);
    hemiLight.intensity = 0.8;
    dirLight.color.setHex(0xfff6ea);
    dirLight.intensity = 1.58;
    dirLight.position.set(32, 38, 32);
    backDirLight.color.setHex(0xc9a46a);
    backDirLight.intensity = 1.18;
    backDirLight.position.set(-26, 26, -38);
    studioRimLight.color.setHex(0xd8e2ef);
    studioRimLight.intensity = 0.45;
    nightSpots.forEach((s) => (s.intensity = 0));

    studioDust.visible = true;
    dustMat.color.setHex(0xc9a46a);
    dustMat.opacity = 0.42;
    dustMat.size = 0.36;
    nightStars.visible = false;

    plinth.lowerMat.color.setHex(0x1c1a17);
    plinth.upperMat.color.setHex(0x22201d);
    plinth.deckMat.color.setHex(0x282522);
    plinth.horizonApronMat.color.setHex(0x231f19);
    plinth.horizonApronMat.opacity = 0.88;
    if (plinth.surfaceMat.map !== plinth.compassTextures.dark) {
      plinth.surfaceMat.map = plinth.compassTextures.dark;
      plinth.surfaceMat.needsUpdate = true;
    }
  } else if (mode === 'day') {
    // 2) NGÀY — Ban ngày Đông Nam Bộ (#7FA3C4 zenith -> #E8DFCE warm ivory horizon)
    skyUniforms.uTopColor.value.setHex(0x7fa3c4);
    skyUniforms.uMidColor.value.setHex(0xb8cbdc);
    skyUniforms.uHorizonColor.value.setHex(0xe8dfce);
    skyUniforms.uLowerColor.value.setHex(0xd8cdb8);
    skyUniforms.uGlowColor.value.setHex(0xfff8e8);
    skyUniforms.uGlowIntensity.value = 0.2;
    skyUniforms.uBandGlowIntensity.value = 0.06;
    skyUniforms.uGlowDir.value.set(0.45, 0.36, 0.78).normalize();

    ensureFog(0xe8dfce, 0.0046);
    if (envMaps) scene.environment = envMaps.day.texture;

    ambient.color.setHex(0xfff9ee);
    ambient.intensity = 0.66;
    hemiLight.color.setHex(0x9fc4e4);
    hemiLight.groundColor.setHex(0xb5a68e);
    hemiLight.intensity = 0.96;
    dirLight.color.setHex(0xfff8ea);
    dirLight.intensity = 1.82;
    dirLight.position.set(34, 46, 30);
    backDirLight.color.setHex(0xe8f0f8);
    backDirLight.intensity = 0.65;
    backDirLight.position.set(-28, 28, -36);
    studioRimLight.color.setHex(0xc8dcf5);
    studioRimLight.intensity = 0.28;
    nightSpots.forEach((s) => (s.intensity = 0));

    studioDust.visible = true;
    dustMat.color.setHex(0xfff8e6);
    dustMat.opacity = 0.26;
    dustMat.size = 0.32;
    nightStars.visible = false;

    plinth.lowerMat.color.setHex(0xd4cab8);
    plinth.upperMat.color.setHex(0xdcd3c2);
    plinth.deckMat.color.setHex(0xe3dbcc);
    plinth.horizonApronMat.color.setHex(0xe8dfce);
    plinth.horizonApronMat.opacity = 0.9;
    if (plinth.surfaceMat.map !== plinth.compassTextures.light) {
      plinth.surfaceMat.map = plinth.compassTextures.light;
      plinth.surfaceMat.needsUpdate = true;
    }
  } else if (mode === 'golden') {
    // 3) HOÀNG HÔN — Chiều tà Đông Dương (#283342 -> #A94F3D -> #C9A46A horizon)
    skyUniforms.uTopColor.value.setHex(0x283342);
    skyUniforms.uMidColor.value.setHex(0xa94f3d);
    skyUniforms.uHorizonColor.value.setHex(0xc9a46a);
    skyUniforms.uLowerColor.value.setHex(0x52342a);
    skyUniforms.uGlowColor.value.setHex(0xe6b672);
    skyUniforms.uGlowIntensity.value = 0.36;
    skyUniforms.uBandGlowIntensity.value = 0.14;
    skyUniforms.uGlowDir.value.set(0.68, 0.14, 0.72).normalize();

    ensureFog(0xc9a46a, 0.0052);
    if (envMaps) scene.environment = envMaps.golden.texture;

    ambient.color.setHex(0xf2ae72);
    ambient.intensity = 0.52;
    hemiLight.color.setHex(0xd98462);
    hemiLight.groundColor.setHex(0x3b241a);
    hemiLight.intensity = 0.76;
    dirLight.color.setHex(0xffbe73);
    dirLight.intensity = 1.98;
    dirLight.position.set(48, 12, 24);
    backDirLight.color.setHex(0xc97b68);
    backDirLight.intensity = 0.86;
    backDirLight.position.set(-32, 18, -40);
    studioRimLight.color.setHex(0xffcf8f);
    studioRimLight.intensity = 0.44;
    nightSpots.forEach((s) => (s.intensity = 0));

    studioDust.visible = true;
    dustMat.color.setHex(0xe8be7d);
    dustMat.opacity = 0.4;
    dustMat.size = 0.38;
    nightStars.visible = false;

    plinth.lowerMat.color.setHex(0x8c7058);
    plinth.upperMat.color.setHex(0xa2866d);
    plinth.deckMat.color.setHex(0xb89c82);
    plinth.horizonApronMat.color.setHex(0xc29c64);
    plinth.horizonApronMat.opacity = 0.85;
    if (plinth.surfaceMat.map !== plinth.compassTextures.light) {
      plinth.surfaceMat.map = plinth.compassTextures.light;
      plinth.surfaceMat.needsUpdate = true;
    }
  } else {
    // 4) ĐÊM — Đêm di sản (#0E1117 -> #1C2533 + twinkling stars + silver-blue moonlight)
    skyUniforms.uTopColor.value.setHex(0x0e1117);
    skyUniforms.uMidColor.value.setHex(0x141b26);
    skyUniforms.uHorizonColor.value.setHex(0x1c2533);
    skyUniforms.uLowerColor.value.setHex(0x0e1117);
    skyUniforms.uGlowColor.value.setHex(0x6c8cb8);
    skyUniforms.uGlowIntensity.value = 0.16;
    skyUniforms.uBandGlowIntensity.value = 0.08;
    skyUniforms.uGlowDir.value.set(-0.35, 0.28, -0.89).normalize();

    ensureFog(0x1c2533, 0.0054);
    if (envMaps) scene.environment = envMaps.night.texture;

    ambient.color.setHex(0x25354f);
    ambient.intensity = 0.32;
    hemiLight.color.setHex(0x365078);
    hemiLight.groundColor.setHex(0x0e131c);
    hemiLight.intensity = 0.42;
    dirLight.color.setHex(0xa7c4e8);
    dirLight.intensity = 0.52;
    dirLight.position.set(-24, 38, 28);
    backDirLight.color.setHex(0x7c9ec9);
    backDirLight.intensity = 0.4;
    backDirLight.position.set(24, 24, -36);
    studioRimLight.color.setHex(0x9ec0eb);
    studioRimLight.intensity = 0.36;
    nightSpots.forEach((s) => (s.intensity = 5.6));

    studioDust.visible = true;
    dustMat.color.setHex(0xa8c6eb);
    dustMat.opacity = 0.34;
    dustMat.size = 0.33;
    nightStars.visible = true;

    plinth.lowerMat.color.setHex(0x131a25);
    plinth.upperMat.color.setHex(0x182130);
    plinth.deckMat.color.setHex(0x1e2839);
    plinth.horizonApronMat.color.setHex(0x1c2533);
    plinth.horizonApronMat.opacity = 0.9;
    if (plinth.surfaceMat.map !== plinth.compassTextures.dark) {
      plinth.surfaceMat.map = plinth.compassTextures.dark;
      plinth.surfaceMat.needsUpdate = true;
    }
  }
}
