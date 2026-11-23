import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  detectSoftwareWebGL,
  disposeThreeObject,
  loadAndNormalizeGlb,
} from '../../utils/threeGlbLoader';
import { Language } from '../../i18n/types';

interface GlbMiniStageProps {
  glbUrl: string;
  lang?: Language;
  className?: string;
}

export const GlbMiniStage: React.FC<GlbMiniStageProps> = ({
  glbUrl,
  lang = 'vi',
  className = 'w-full h-full',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !glbUrl) return;

    let disposed = false;
    let frameId = 0;
    let loadedRoot: THREE.Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;

    setStatus('loading');
    setErrorMessage('');

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 160;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x171817);
    scene.fog = new THREE.FogExp2(0x171817, 0.045);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.05, 100);
    camera.position.set(2.35, 1.55, 2.55);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    container.innerHTML = '';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';
    container.appendChild(renderer.domElement);

    // 3-Point Warm Museum Studio Lighting
    const hemi = new THREE.HemisphereLight(0xefe6d5, 0x262420, 0.85);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.6);
    keyLight.position.set(4, 6, 4);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      const d = 2.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xc9a46a, 0.9);
    rimLight.position.set(-4, 3, -3.5);
    scene.add(rimLight);

    // Ground Exhibition Plinth + Gold Rim Ring
    const plinthGeo = new THREE.CylinderGeometry(1.55, 1.65, 0.12, 48);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x232220,
      roughness: 0.72,
      metalness: 0.15,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = -0.06;
    plinthMesh.receiveShadow = true;
    scene.add(plinthMesh);

    const rimGeo = new THREE.TorusGeometry(1.56, 0.015, 8, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xc9a46a,
      roughness: 0.3,
      metalness: 0.85,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.005;
    scene.add(rimMesh);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 6.5;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.target.set(0, 0.5, 0);
    controls.autoRotate = !isSoftwareGl;
    controls.autoRotateSpeed = 1.4;
    controls.update();

    const onControlsStart = () => {
      controls.autoRotate = false;
      renderer.domElement.style.cursor = 'grabbing';
    };
    const onControlsEnd = () => {
      renderer.domElement.style.cursor = 'grab';
    };
    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('end', onControlsEnd);

    const stopPropagation = (e: Event) => e.stopPropagation();
    renderer.domElement.addEventListener('pointerdown', stopPropagation);
    renderer.domElement.addEventListener('wheel', stopPropagation, { passive: true });

    const clock = new THREE.Clock();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync && gl.deleteSync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (sync && state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync && gl.deleteSync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      if (mixer) mixer.update(delta);
      controls.update();
      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    const loadModel = async () => {
      try {
        const res = await loadAndNormalizeGlb(glbUrl, {
          targetMaxDim: 2.15,
          groundY: 0,
          maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
        });
        if (disposed) {
          disposeThreeObject(res.root);
          return;
        }
        loadedRoot = res.root;
        scene.add(res.root);

        const targetY = Math.max(0.25, res.center.y);
        controls.target.set(0, targetY, 0);
        const dist = Math.max(2.1, Math.max(res.normalizedSize.x, res.normalizedSize.y, res.normalizedSize.z) * 1.45);
        camera.position.set(dist * 0.85, targetY + dist * 0.55, dist * 0.95);
        controls.update();

        if (res.animations.length > 0) {
          mixer = new THREE.AnimationMixer(res.root);
          res.animations.forEach((clip) => mixer?.clipAction(clip).play());
        }

        if (!isSoftwareGl) {
          renderer.compile(scene, camera);
        }
        setStatus('ready');
      } catch (err) {
        if (disposed) return;
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Không tải được file .glb');
      }
    };
    void loadModel();

    const resizeObserver = new ResizeObserver(() => {
      if (disposed || !container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('end', onControlsEnd);
      renderer.domElement.removeEventListener('pointerdown', stopPropagation);
      renderer.domElement.removeEventListener('wheel', stopPropagation);
      controls.dispose();
      if (loadedRoot) {
        scene.remove(loadedRoot);
        disposeThreeObject(loadedRoot);
      }
      disposeThreeObject(scene);
      envTarget.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [glbUrl]);

  return (
    <div className={`relative overflow-hidden bg-[#171817] ${className}`}>
      <div ref={mountRef} className="w-full h-full" />

      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-[#171817]/85 text-[#D8C9A9] px-3 text-center">
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#C9A46A]">
            {lang === 'en' ? 'Loading 3D .GLB…' : lang === 'zh' ? '正在加载 3D .GLB…' : 'Đang nạp mô hình .GLB…'}
          </span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#171817] text-[#D8C9A9] px-4 text-center">
          <span className="text-[11px] font-semibold text-[#A94F3D] uppercase tracking-wider">
            {lang === 'en' ? 'Unable to load .glb' : lang === 'zh' ? '无法加载 .glb' : 'Lỗi nạp tệp .glb'}
          </span>
          <span className="text-[10px] text-[#D8C9A9]/70 mt-1 line-clamp-2">
            {errorMessage || (lang === 'en' ? 'Invalid GLB or CORS blocked' : 'File không hợp lệ hoặc link chặn CORS')}
          </span>
        </div>
      )}
    </div>
  );
};
