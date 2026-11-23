import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import { deriveGithubRawFallbackUrl } from '../data/bakedAssets';

export interface LoadedGlbResult {
  root: THREE.Group;
  animations: THREE.AnimationClip[];
  normalizedSize: THREE.Vector3;
  center: THREE.Vector3;
}

export interface LoadGlbOptions {
  targetMaxDim?: number;
  groundY?: number;
  maxAnisotropy?: number;
  fallbackUrls?: string[];
  onProgress?: (percent: number) => void;
}

let sharedDracoLoader: DRACOLoader | null = null;

function getSharedDracoLoader(): DRACOLoader {
  if (!sharedDracoLoader) {
    sharedDracoLoader = new DRACOLoader();
    sharedDracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  }
  return sharedDracoLoader;
}

/**
 * Probes the WebGL context renderer string once to detect software rasterizers (SwiftShader/llvmpipe)
 * so rendering cost (pixel ratio, shadows, antialias) can adapt cleanly without altering scene layout.
 */
export function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

/**
 * Loads a `.glb` / `.gltf` from `public/`, a session `blob:` URL, or an external GitHub/Cloud URL,
 * automatically falling back from jsDelivr CDN to `raw.githubusercontent.com` on error,
 * normalizes its bounding box so it centers at (X=0, Z=0) and rests flush on `groundY`, and configures PBR/shadows.
 */
export async function loadAndNormalizeGlb(
  url: string,
  options: LoadGlbOptions = {}
): Promise<LoadedGlbResult> {
  const { targetMaxDim = 24, groundY = 0, maxAnisotropy = 4, fallbackUrls = [], onProgress } = options;

  const loader = new GLTFLoader();
  loader.setCrossOrigin('anonymous');
  loader.setDRACOLoader(getSharedDracoLoader());

  const derivedRaw = deriveGithubRawFallbackUrl(url);
  const candidateUrls = Array.from(
    new Set([url, ...(derivedRaw ? [derivedRaw] : []), ...fallbackUrls].filter(Boolean))
  );

  let gltf: GLTF | null = null;
  let lastError: unknown = null;

  for (let idx = 0; idx < candidateUrls.length; idx++) {
    const candidate = candidateUrls[idx];
    try {
      if (candidate.startsWith('blob:') || candidate.startsWith('data:')) {
        onProgress?.(30);
        const resp = await fetch(candidate);
        if (!resp.ok) {
          throw new Error(`Không thể đọc dữ liệu .glb cục bộ (${resp.status})`);
        }
        const buffer = await resp.arrayBuffer();
        onProgress?.(75);
        gltf = await loader.parseAsync(buffer, '');
      } else {
        gltf = await loader.loadAsync(candidate, (evt) => {
          if (evt.total > 0) {
            onProgress?.(Math.min(92, Math.max(15, (evt.loaded / evt.total) * 90)));
          }
        });
      }
      break;
    } catch (err) {
      lastError = err;
      if (idx + 1 < candidateUrls.length) {
        console.warn(`[3D GLB Loader] Primary URL failed, falling back to ${candidateUrls[idx + 1]}:`, err);
      }
    }
  }

  if (!gltf) {
    throw lastError instanceof Error
      ? lastError
      : new Error('Không thể tải tệp mô hình 3D (.glb) từ CDN và nguồn dự phòng.');
  }
  onProgress?.(96);

  const rawScene = gltf.scene || gltf.scenes[0];
  if (!rawScene) {
    throw new Error('Tệp .glb không chứa cảnh 3D hợp lệ');
  }

  rawScene.updateMatrixWorld(true);

  const initialBox = new THREE.Box3().setFromObject(rawScene);
  const initialSize = new THREE.Vector3();
  const initialCenter = new THREE.Vector3();
  initialBox.getSize(initialSize);
  initialBox.getCenter(initialCenter);

  const maxAxis = Math.max(initialSize.x, initialSize.y, initialSize.z, 0.0001);
  const scaleFactor = targetMaxDim / maxAxis;

  // Wrap in a pivot Group so scaling & grounding never mutate internal GLTF animation tracks awkwardly
  const wrapper = new THREE.Group();
  wrapper.name = 'custom_glb_heritage_root';
  rawScene.scale.multiplyScalar(scaleFactor);
  rawScene.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(rawScene);
  const scaledCenter = new THREE.Vector3();
  scaledBox.getCenter(scaledCenter);

  rawScene.position.x -= scaledCenter.x;
  rawScene.position.z -= scaledCenter.z;
  rawScene.position.y += groundY - scaledBox.min.y;
  rawScene.updateMatrixWorld(true);

  const finalBox = new THREE.Box3().setFromObject(rawScene);
  const normalizedSize = new THREE.Vector3();
  const center = new THREE.Vector3();
  finalBox.getSize(normalizedSize);
  finalBox.getCenter(center);

  // Assign shadows, PBR environment reflections & anisotropic texture sharpness
  rawScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Approximate architectural elevation tier for exploded-view / floor filtering compatibility
      const meshBox = new THREE.Box3().setFromObject(child);
      const relY = normalizedSize.y > 0.01 ? (meshBox.min.y - groundY) / normalizedSize.y : 0;
      child.userData.elevationTier = relY > 0.62 ? 2 : relY > 0.22 ? 1 : 0;
      child.userData.origY = child.position.y;
      child.userData.isCustomGlbMesh = true;

      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (!mat) return;
        if ('envMapIntensity' in mat && typeof mat.envMapIntensity === 'number') {
          mat.envMapIntensity = Math.max(mat.envMapIntensity, 0.95);
        }
        const texKeys = ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap'] as const;
        texKeys.forEach((key) => {
          const tex = (mat as unknown as Record<string, unknown>)[key] as THREE.Texture | undefined;
          if (tex) {
            tex.anisotropy = Math.min(maxAnisotropy, 8);
            tex.needsUpdate = true;
          }
        });
      });
    }
  });

  wrapper.add(rawScene);
  return {
    root: wrapper,
    animations: gltf.animations || [],
    normalizedSize,
    center,
  };
}

/**
 * Properly disposes geometries, materials, and textures within an Object3D subtree.
 */
export function disposeThreeObject(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (
      child instanceof THREE.Mesh ||
      child instanceof THREE.Points ||
      child instanceof THREE.Line ||
      child instanceof THREE.LineSegments ||
      child instanceof THREE.LineLoop ||
      child instanceof THREE.Sprite
    ) {
      (child as THREE.Mesh).geometry?.dispose();
      const disposeMat = (m: THREE.Material) => {
        const anyMat = m as unknown as Record<string, unknown>;
        [
          'map',
          'bumpMap',
          'roughnessMap',
          'normalMap',
          'aoMap',
          'emissiveMap',
          'metalnessMap',
          'alphaMap',
        ].forEach((k) => {
          const tex = anyMat[k] as THREE.Texture | undefined;
          if (tex && typeof tex.dispose === 'function' && !tex.userData?.isCached) {
            tex.dispose();
          }
        });
        m.dispose();
      };
      const mat = (child as THREE.Mesh).material;
      if (Array.isArray(mat)) {
        mat.forEach(disposeMat);
      } else if (mat) {
        disposeMat(mat);
      }
    }
  });
}
