import * as THREE from 'three';

export type GlbViewMode = 'original' | 'explode' | 'xray' | 'interior';

interface SavedMaterialState {
  transparent: boolean;
  opacity: number;
  depthWrite: boolean;
  side: THREE.Side;
  wireframe: boolean;
  clipShadows: boolean;
  color: THREE.Color | null;
  emissive: THREE.Color | null;
  emissiveIntensity: number | null;
}

interface TierSliceData {
  group: THREE.Group;
  modelClone: THREE.Object3D;
  materials: THREE.Material[];
  localLowerPlane: THREE.Plane | null;
  localUpperPlane: THREE.Plane | null;
  worldLowerPlane: THREE.Plane | null;
  worldUpperPlane: THREE.Plane | null;
  bandMinY: number;
  bandMaxY: number;
  baseOffsetY: number;
}

// Base tier offsets per architectural 4-tier anatomy specification
const BASE_TIER_OFFSETS: readonly [number, number, number, number] = [0, 0.45, 1.0, 1.6];

export interface GlbSectionControllerOptions {
  tierOffsets?: readonly [number, number, number, number];
  minExplodeWhenActive?: number;
  scaleByHeightDivisor?: number;
}

export class GlbSectionController {
  private readonly glbRoot: THREE.Object3D;
  private readonly meshGroup: THREE.Group;
  private readonly explodeRigGroup: THREE.Group;
  public readonly xrayOverlayGroup: THREE.Group;
  private readonly tierOffsets: readonly [number, number, number, number];
  private readonly minExplodeWhenActive: number;
  private readonly scaleByHeightDivisor: number;

  private readonly tiers: TierSliceData[] = [];
  private readonly guideLineGeometry: THREE.BufferGeometry;
  private readonly guideLineMaterial: THREE.LineBasicMaterial;
  private readonly guideLines: THREE.LineSegments;

  // Map storing each original THREE.Mesh's material reference + saved scalar/color attributes
  private readonly originalMaterialsMap = new Map<
    THREE.Mesh,
    THREE.Material | THREE.Material[]
  >();
  private readonly savedMaterials = new Map<THREE.Material, SavedMaterialState>();
  private readonly glbMaterials: THREE.Material[] = [];

  private readonly localInteriorPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 10);
  private readonly worldInteriorPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 10);

  private localBox = new THREE.Box3(
    new THREE.Vector3(-4, 0, -4),
    new THREE.Vector3(4, 8, 4)
  );
  private currentExplodeProgress = 0;
  private lastAppliedMode: GlbViewMode | null = null;
  private lastAppliedWireframe = false;
  private isDisposed = false;

  // Scratch vectors/matrices/quaternions to prevent GC inside requestAnimationFrame
  private readonly tmpInvMat = new THREE.Matrix4();
  private readonly tmpRelMat = new THREE.Matrix4();
  private readonly tmpCorner = new THREE.Vector3();
  private readonly tmpPos = new THREE.Vector3();
  private readonly tmpQuat = new THREE.Quaternion();
  private readonly tmpScale = new THREE.Vector3();

  constructor(
    glbRoot: THREE.Object3D,
    meshGroup: THREE.Group,
    options?: GlbSectionControllerOptions
  ) {
    this.glbRoot = glbRoot;
    this.meshGroup = meshGroup;
    this.tierOffsets = options?.tierOffsets ?? BASE_TIER_OFFSETS;
    this.minExplodeWhenActive =
      typeof options?.minExplodeWhenActive === 'number'
        ? options.minExplodeWhenActive
        : 0.05;
    this.scaleByHeightDivisor =
      typeof options?.scaleByHeightDivisor === 'number' && options.scaleByHeightDivisor > 0
        ? options.scaleByHeightDivisor
        : 5.5;

    // Dedicated sibling group for X-Ray edge overlays (never attached as mesh children)
    this.xrayOverlayGroup = new THREE.Group();
    this.xrayOverlayGroup.name = 'GlbXrayOverlayGroup';
    this.xrayOverlayGroup.visible = false;
    this.meshGroup.add(this.xrayOverlayGroup);

    // Dedicated sibling group for 4-tier clipping explode rig
    this.explodeRigGroup = new THREE.Group();
    this.explodeRigGroup.name = 'GlbExplode4TierRig';
    this.explodeRigGroup.visible = false;
    this.meshGroup.add(this.explodeRigGroup);

    // 4 vertical alignment guide lines (#C9A46A) at bounding box corners
    const initialPositions = new Float32Array(4 * 2 * 3);
    this.guideLineGeometry = new THREE.BufferGeometry();
    this.guideLineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(initialPositions, 3)
    );
    this.guideLineMaterial = new THREE.LineBasicMaterial({
      color: 0xc9a46a,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.guideLines = new THREE.LineSegments(
      this.guideLineGeometry,
      this.guideLineMaterial
    );
    this.guideLines.frustumCulled = false;
    this.guideLines.visible = false;
    this.guideLines.raycast = () => {};
    this.explodeRigGroup.add(this.guideLines);

    this.collectOriginalMaterials();
    this.buildFourTiers();
    this.recomputeBounds();
  }

  private collectOriginalMaterials(): void {
    this.glbRoot.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || !obj.geometry || !obj.material) return;
      if (obj.userData.isGlbXrayOverlay || obj.userData.isGlbTierClone) return;

      this.originalMaterialsMap.set(obj, obj.material);

      const matList = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of matList) {
        if (!this.savedMaterials.has(m)) {
          const anyMat = m as THREE.MeshStandardMaterial;
          this.savedMaterials.set(m, {
            transparent: Boolean(m.transparent),
            opacity: m.opacity !== undefined ? m.opacity : 1,
            depthWrite: m.depthWrite !== undefined ? m.depthWrite : true,
            side: m.side,
            wireframe: Boolean(anyMat.wireframe),
            clipShadows: Boolean(m.clipShadows),
            color: anyMat.color ? anyMat.color.clone() : null,
            emissive: anyMat.emissive ? anyMat.emissive.clone() : null,
            emissiveIntensity:
              typeof anyMat.emissiveIntensity === 'number'
                ? anyMat.emissiveIntensity
                : null,
          });
          this.glbMaterials.push(m);
        }
      }
    });
  }

  private cloneModelForTier(tierIndex: number): {
    clone: THREE.Object3D;
    materials: THREE.Material[];
  } {
    // Share geometries (zero duplicate vertex buffers) and clone materials per tier so clippingPlanes are isolated
    const clone = this.glbRoot.clone(true);
    const tierMaterials: THREE.Material[] = [];
    const tierMatMap = new Map<THREE.Material, THREE.Material>();

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.material) return;
      child.userData.isGlbTierClone = true;
      child.castShadow = true;
      child.receiveShadow = true;

      const cloneMat = (src: THREE.Material): THREE.Material => {
        let cloned = tierMatMap.get(src);
        if (!cloned) {
          cloned = src.clone();
          const saved = this.savedMaterials.get(src);
          if (saved) {
            cloned.transparent = saved.transparent;
            cloned.opacity = saved.opacity;
            cloned.depthWrite = saved.depthWrite;
            if ('wireframe' in cloned) {
              (cloned as THREE.MeshStandardMaterial).wireframe = false;
            }
          }
          cloned.side = THREE.DoubleSide;
          cloned.clipShadows = true;
          tierMatMap.set(src, cloned);
          tierMaterials.push(cloned);
        }
        return cloned;
      };

      if (Array.isArray(child.material)) {
        child.material = child.material.map(cloneMat);
      } else {
        child.material = cloneMat(child.material);
      }
    });

    clone.name = `GlbTierClone_${tierIndex}`;
    return { clone, materials: tierMaterials };
  }

  private buildFourTiers(): void {
    for (let i = 0; i < 4; i++) {
      const group = new THREE.Group();
      group.name = `GlbTierGroup_${i}`;
      const { clone, materials } = this.cloneModelForTier(i);
      group.add(clone);
      this.explodeRigGroup.add(group);

      const localLowerPlane =
        i === 0 ? null : new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const localUpperPlane =
        i === 3 ? null : new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
      const worldLowerPlane =
        i === 0 ? null : new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const worldUpperPlane =
        i === 3 ? null : new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);

      const activeWorldPlanes: THREE.Plane[] = [];
      if (worldLowerPlane) activeWorldPlanes.push(worldLowerPlane);
      if (worldUpperPlane) activeWorldPlanes.push(worldUpperPlane);

      for (const m of materials) {
        m.clippingPlanes = activeWorldPlanes;
        m.clipShadows = true;
        m.needsUpdate = true;
      }

      this.tiers.push({
        group,
        modelClone: clone,
        materials,
        localLowerPlane,
        localUpperPlane,
        worldLowerPlane,
        worldUpperPlane,
        bandMinY: 0,
        bandMaxY: 1,
        baseOffsetY: this.tierOffsets[i],
      });
    }
  }

  public syncTransform(scale: number, rotationYDeg: number): void {
    if (this.isDisposed) return;
    const rad = (rotationYDeg * Math.PI) / 180;
    this.glbRoot.scale.setScalar(scale);
    this.glbRoot.rotation.y = rad;

    this.xrayOverlayGroup.position.copy(this.glbRoot.position);
    this.xrayOverlayGroup.rotation.copy(this.glbRoot.rotation);
    this.xrayOverlayGroup.scale.copy(this.glbRoot.scale);

    for (const tier of this.tiers) {
      tier.modelClone.scale.setScalar(scale);
      tier.modelClone.rotation.y = rad;
    }

    this.recomputeBounds();
  }

  public recomputeBounds(): void {
    if (this.isDisposed) return;
    this.meshGroup.updateMatrixWorld(true);
    this.glbRoot.updateMatrixWorld(true);

    this.tmpInvMat.copy(this.meshGroup.matrixWorld).invert();
    const box = new THREE.Box3();

    this.glbRoot.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || !obj.geometry || obj.userData.isGlbXrayOverlay) {
        return;
      }
      if (!obj.geometry.boundingBox) {
        obj.geometry.computeBoundingBox();
      }
      const gBox = obj.geometry.boundingBox;
      if (!gBox || gBox.isEmpty()) return;

      this.tmpRelMat.multiplyMatrices(this.tmpInvMat, obj.matrixWorld);
      for (let ix = 0; ix < 2; ix++) {
        for (let iy = 0; iy < 2; iy++) {
          for (let iz = 0; iz < 2; iz++) {
            this.tmpCorner
              .set(
                ix === 0 ? gBox.min.x : gBox.max.x,
                iy === 0 ? gBox.min.y : gBox.max.y,
                iz === 0 ? gBox.min.z : gBox.max.z
              )
              .applyMatrix4(this.tmpRelMat);
            box.expandByPoint(this.tmpCorner);
          }
        }
      }
    });

    if (!box.isEmpty()) {
      this.localBox.copy(box);
    }

    const minY = this.localBox.min.y;
    const maxY = this.localBox.max.y;
    const height = Math.max(0.2, maxY - minY);
    const heightScale = Math.max(1, height / this.scaleByHeightDivisor);

    for (let i = 0; i < 4; i++) {
      const tier = this.tiers[i];
      tier.bandMinY = minY + (i / 4) * height;
      tier.bandMaxY = minY + ((i + 1) / 4) * height;
      tier.baseOffsetY = this.tierOffsets[i] * heightScale;
    }
  }

  public getExplodeProgress(): number {
    return this.currentExplodeProgress;
  }

  public getTierAnchorPointsWorld(
    outTier4: THREE.Vector3,
    outTier3: THREE.Vector3,
    outTier1: THREE.Vector3
  ): void {
    this.meshGroup.updateMatrixWorld(true);
    const centerX = (this.localBox.min.x + this.localBox.max.x) * 0.5;
    const centerZ = (this.localBox.min.z + this.localBox.max.z) * 0.5;
    const sizeX = Math.max(0.5, this.localBox.max.x - this.localBox.min.x);
    const sizeZ = Math.max(0.5, this.localBox.max.z - this.localBox.min.z);

    const t4 = this.tiers[3];
    const t3 = this.tiers[2];
    const t1 = this.tiers[0];

    const y4 = t4 ? (t4.bandMinY + t4.bandMaxY) * 0.5 + t4.group.position.y : this.localBox.max.y * 0.88;
    const y3 = t3 ? (t3.bandMinY + t3.bandMaxY) * 0.5 + t3.group.position.y : this.localBox.max.y * 0.62;
    const y1 = t1 ? (t1.bandMinY + t1.bandMaxY) * 0.5 + t1.group.position.y : this.localBox.min.y + 0.3;

    outTier4.set(centerX + sizeX * 0.08, y4, centerZ + sizeZ * 0.06);
    outTier3.set(centerX - sizeX * 0.18, y3, centerZ + sizeZ * 0.16);
    outTier1.set(centerX + sizeX * 0.2, y1, centerZ + sizeZ * 0.18);

    this.meshGroup.localToWorld(outTier4);
    this.meshGroup.localToWorld(outTier3);
    this.meshGroup.localToWorld(outTier1);
  }

  public getLocalBounds(): {
    min: THREE.Vector3;
    max: THREE.Vector3;
    center: THREE.Vector3;
    size: THREE.Vector3;
  } {
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    this.localBox.getCenter(center);
    this.localBox.getSize(size);
    return {
      min: this.localBox.min.clone(),
      max: this.localBox.max.clone(),
      center,
      size,
    };
  }

  public getInteriorCameraPreset(): {
    cameraPos: [number, number, number];
    targetPos: [number, number, number];
  } {
    const { min, center, size } = this.getLocalBounds();
    const height = Math.max(1, size.y);
    const maxHoriz = Math.max(6, size.x, size.z);
    const cutY = min.y + height * 0.65;
    const lookY = min.y + height * 0.34;
    return {
      cameraPos: [
        center.x + maxHoriz * 0.56,
        cutY + height * 0.42 + maxHoriz * 0.22,
        center.z + maxHoriz * 0.64,
      ],
      targetPos: [center.x, lookY, center.z],
    };
  }

  public getExplodeCameraPreset(): {
    cameraPos: [number, number, number];
    targetPos: [number, number, number];
  } {
    const { min, center, size } = this.getLocalBounds();
    const height = Math.max(1, size.y);
    const maxHoriz = Math.max(8, size.x, size.z);
    const topOffset = this.tiers[3]?.baseOffsetY ?? 1.6;
    return {
      cameraPos: [
        center.x + maxHoriz * 0.85,
        min.y + height * 0.9 + topOffset * 1.1 + maxHoriz * 0.28,
        center.z + maxHoriz * 0.98,
      ],
      targetPos: [center.x, min.y + height * 0.5 + topOffset * 0.45, center.z],
    };
  }

  private clearXrayOverlayGroup(): void {
    const toDispose = [...this.xrayOverlayGroup.children];
    for (const child of toDispose) {
      child.traverse((node) => {
        if (
          node instanceof THREE.LineSegments ||
          node instanceof THREE.Line ||
          node instanceof THREE.Mesh
        ) {
          node.geometry?.dispose();
          if (Array.isArray(node.material)) {
            node.material.forEach((mat) => mat.dispose());
          } else {
            node.material?.dispose();
          }
        }
      });
    }
    this.xrayOverlayGroup.clear();
    this.xrayOverlayGroup.visible = false;
  }

  private restoreGlbMaterials(): void {
    this.originalMaterialsMap.forEach((origMatRef, mesh) => {
      mesh.material = origMatRef;
    });

    for (const m of this.glbMaterials) {
      const saved = this.savedMaterials.get(m);
      if (!saved) continue;
      const anyMat = m as THREE.MeshStandardMaterial;
      m.transparent = saved.transparent;
      m.opacity = saved.opacity;
      m.depthWrite = saved.depthWrite;
      m.side = saved.side;
      m.clipShadows = saved.clipShadows;
      m.clippingPlanes = [];
      if ('wireframe' in anyMat) {
        anyMat.wireframe = saved.wireframe;
      }
      if (saved.color && anyMat.color) {
        anyMat.color.copy(saved.color);
      }
      if (saved.emissive && anyMat.emissive) {
        anyMat.emissive.copy(saved.emissive);
      }
      if (saved.emissiveIntensity !== null && 'emissiveIntensity' in anyMat) {
        anyMat.emissiveIntensity = saved.emissiveIntensity;
      }
      m.needsUpdate = true;
    }
  }

  /**
   * Completely clears X-Ray overlays, clipping planes, and 4-tier explode visibility,
   * and restores exact original materials before switching to any new mode.
   */
  public resetModelState(): void {
    if (this.isDisposed) return;

    // 1. Dispose & clear dedicated X-Ray overlay group
    this.clearXrayOverlayGroup();

    // 2. Restore original material parameters & clear clippingPlanes on glbRoot
    this.restoreGlbMaterials();

    // 3. Hide 4-tier explode rig & restore main glbRoot visibility
    this.explodeRigGroup.visible = false;
    this.guideLines.visible = false;
    this.glbRoot.visible = true;

    // 4. Force clean mode re-evaluation on next updateFrame
    this.lastAppliedMode = null;
    this.lastAppliedWireframe = false;
  }

  /**
   * Builds crisp X-Ray wireframe edge overlays ONCE when entering X-Ray mode.
   * Never executed inside requestAnimationFrame. Uses thresholdAngle = 25 for speed on dense .glb meshes.
   */
  private buildXrayOverlaysOnce(): void {
    this.clearXrayOverlayGroup();

    this.glbRoot.updateMatrixWorld(true);
    this.xrayOverlayGroup.position.copy(this.glbRoot.position);
    this.xrayOverlayGroup.rotation.copy(this.glbRoot.rotation);
    this.xrayOverlayGroup.scale.copy(this.glbRoot.scale);
    this.tmpInvMat.copy(this.glbRoot.matrixWorld).invert();

    const jadeLineMat = new THREE.LineBasicMaterial({
      color: 0x47796d,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
    const goldAccentMat = new THREE.LineBasicMaterial({
      color: 0xc9a46a,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    let meshIdx = 0;
    this.glbRoot.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || !obj.geometry) return;
      if (obj.userData.isGlbXrayOverlay || obj.userData.isGlbTierClone) return;

      try {
        const posAttr = obj.geometry.getAttribute('position');
        if (!posAttr || posAttr.count === 0) return;

        // Threshold 25° keeps architectural edges sharp while cutting vertex overhead on multi-MB .glb files
        const edgesGeo = new THREE.EdgesGeometry(obj.geometry, 25);
        const edgePos = edgesGeo.getAttribute('position');
        if (!edgePos || edgePos.count === 0) {
          edgesGeo.dispose();
          return;
        }

        const useGold = meshIdx % 4 === 1;
        const lineMat = (useGold ? goldAccentMat : jadeLineMat).clone();
        const edgeLines = new THREE.LineSegments(edgesGeo, lineMat);
        edgeLines.userData.isGlbXrayOverlay = true;
        edgeLines.raycast = () => {};
        edgeLines.renderOrder = 3;

        this.tmpRelMat.multiplyMatrices(this.tmpInvMat, obj.matrixWorld);
        this.tmpRelMat.decompose(this.tmpPos, this.tmpQuat, this.tmpScale);
        edgeLines.position.copy(this.tmpPos);
        edgeLines.quaternion.copy(this.tmpQuat);
        edgeLines.scale.copy(this.tmpScale);

        this.xrayOverlayGroup.add(edgeLines);
        meshIdx += 1;
      } catch (err) {
        console.warn('[GlbSectionController] Skipped X-Ray EdgesGeometry for mesh:', obj.name, err);
      }
    });

    jadeLineMat.dispose();
    goldAccentMat.dispose();
    this.xrayOverlayGroup.visible = this.xrayOverlayGroup.children.length > 0;
  }

  private applyModeAppearance(mode: GlbViewMode, isBlueprintWireframe: boolean): void {
    if (this.lastAppliedMode === mode && this.lastAppliedWireframe === isBlueprintWireframe) {
      return;
    }

    // Always execute full state cleanup & restoration BEFORE applying any new mode
    this.resetModelState();

    this.lastAppliedMode = mode;
    this.lastAppliedWireframe = isBlueprintWireframe;

    if (mode === 'xray') {
      this.glbRoot.visible = true;
      this.explodeRigGroup.visible = false;

      for (const m of this.glbMaterials) {
        m.transparent = true;
        m.opacity = 0.22;
        m.depthWrite = false;
        m.side = THREE.DoubleSide;
        m.clippingPlanes = [];
        m.needsUpdate = true;
      }

      this.buildXrayOverlaysOnce();
    } else if (mode === 'interior') {
      this.glbRoot.visible = true;
      this.explodeRigGroup.visible = false;

      for (const m of this.glbMaterials) {
        m.side = THREE.DoubleSide;
        m.clipShadows = true;
        m.clippingPlanes = [this.worldInteriorPlane];
        m.needsUpdate = true;
      }
    } else if (mode === 'explode') {
      this.glbRoot.visible = false;
      this.explodeRigGroup.visible = true;
    } else if (isBlueprintWireframe && mode === 'original') {
      this.glbRoot.visible = true;
      this.explodeRigGroup.visible = false;
      for (const m of this.glbMaterials) {
        const anyMat = m as THREE.MeshStandardMaterial;
        if ('wireframe' in anyMat) {
          anyMat.wireframe = true;
        }
        if (anyMat.color) anyMat.color.setHex(0xc9a46a);
        m.clippingPlanes = [];
        m.needsUpdate = true;
      }
    } else {
      // 'original' solid state already restored by resetModelState()
      this.glbRoot.visible = true;
      this.explodeRigGroup.visible = false;
    }
  }

  /**
   * Called every animation frame inside requestAnimationFrame.
   * Reads live viewModeRef value so clicks never stall behind React closures.
   */
  public updateFrame(
    viewMode: GlbViewMode,
    explodeTargetFactor: number,
    delta: number,
    options?: {
      isBlueprintWireframe?: boolean;
      customInteriorCutRatio?: number | null;
      tierVisibility?: readonly [boolean, boolean, boolean, boolean] | null;
    }
  ): boolean {
    if (this.isDisposed) return false;

    const isBlueprintWireframe = Boolean(options?.isBlueprintWireframe);
    const tierVisibility = options?.tierVisibility ?? null;
    this.meshGroup.updateMatrixWorld(true);

    // 1. Apply appearance cleanly ONLY when mode changes (builds X-Ray once, never in rAF loop)
    this.applyModeAppearance(viewMode, isBlueprintWireframe);

    // 2. Smooth 4-tier explode interpolation (snap cleanly when entering X-Ray or Interior)
    const clampedTarget = THREE.MathUtils.clamp(explodeTargetFactor, 0, 1);
    const targetProgress =
      viewMode === 'explode'
        ? Math.max(this.minExplodeWhenActive, clampedTarget)
        : 0;
    const prevProgress = this.currentExplodeProgress;
    if (viewMode === 'xray' || viewMode === 'interior') {
      this.currentExplodeProgress = 0;
    } else {
      const lerpAlpha = Math.min(1, Math.max(0.08, (delta || 0.016) * 8.5));
      this.currentExplodeProgress = THREE.MathUtils.lerp(
        this.currentExplodeProgress,
        targetProgress,
        lerpAlpha
      );
      if (Math.abs(this.currentExplodeProgress - targetProgress) < 0.004) {
        this.currentExplodeProgress = targetProgress;
      }
    }

    const showExplodeRig =
      (viewMode === 'explode' && targetProgress > 0.004) ||
      this.currentExplodeProgress > 0.004;

    if (showExplodeRig) {
      this.glbRoot.visible = false;
      this.explodeRigGroup.visible = true;
      this.xrayOverlayGroup.visible = false;

      for (let i = 0; i < 4; i++) {
        const tier = this.tiers[i];
        tier.group.visible = tierVisibility ? Boolean(tierVisibility[i]) : true;
        const dy = tier.baseOffsetY * this.currentExplodeProgress;
        tier.group.position.set(0, dy, 0);

        for (const m of tier.materials) {
          const stdMat = m as THREE.MeshStandardMaterial;
          if ('wireframe' in stdMat && stdMat.wireframe !== isBlueprintWireframe) {
            stdMat.wireframe = isBlueprintWireframe;
            stdMat.needsUpdate = true;
          }
        }

        if (tier.localLowerPlane && tier.worldLowerPlane) {
          tier.localLowerPlane.constant = -(tier.bandMinY + dy);
          tier.worldLowerPlane
            .copy(tier.localLowerPlane)
            .applyMatrix4(this.meshGroup.matrixWorld);
        }
        if (tier.localUpperPlane && tier.worldUpperPlane) {
          // Slight 0.001 overlap avoids hairline gaps at progress = 0
          tier.localUpperPlane.constant = tier.bandMaxY + dy + 0.001;
          tier.worldUpperPlane
            .copy(tier.localUpperPlane)
            .applyMatrix4(this.meshGroup.matrixWorld);
        }
      }

      // Update vertical #C9A46A corner alignment guide lines
      const showGuides = this.currentExplodeProgress > 0.02;
      this.guideLines.visible = showGuides;
      if (showGuides) {
        const { min, max } = this.localBox;
        const height = Math.max(0.2, max.y - min.y);
        const topLift = (this.tiers[3]?.baseOffsetY ?? 1.6) * this.currentExplodeProgress;
        const yBottom = min.y + height * 0.08;
        const yTop = min.y + height * 0.88 + topLift;

        const corners: Array<[number, number]> = [
          [min.x, min.z],
          [max.x, min.z],
          [min.x, max.z],
          [max.x, max.z],
        ];
        const attr = this.guideLineGeometry.getAttribute(
          'position'
        ) as THREE.BufferAttribute;
        for (let c = 0; c < 4; c++) {
          const [cx, cz] = corners[c];
          attr.setXYZ(c * 2, cx, yBottom, cz);
          attr.setXYZ(c * 2 + 1, cx, yTop, cz);
        }
        attr.needsUpdate = true;
        this.guideLineMaterial.opacity = Math.min(
          0.78,
          this.currentExplodeProgress * 0.85
        );
      }
    } else {
      this.explodeRigGroup.visible = false;
      this.guideLines.visible = false;
      this.glbRoot.visible = true;
    }

    // 3. Update Interior 35%-roof-cut plane in world space every frame (tracks parallax tilt)
    if (viewMode === 'interior') {
      const minY = this.localBox.min.y;
      const maxY = this.localBox.max.y;
      const height = Math.max(0.2, maxY - minY);
      const ratio =
        typeof options?.customInteriorCutRatio === 'number'
          ? THREE.MathUtils.clamp(options.customInteriorCutRatio, 0.15, 0.98)
          : 0.65;
      const cutY = minY + height * ratio;
      this.localInteriorPlane.constant = cutY;
      this.worldInteriorPlane
        .copy(this.localInteriorPlane)
        .applyMatrix4(this.meshGroup.matrixWorld);
    }

    return Math.abs(prevProgress - this.currentExplodeProgress) > 0.0005;
  }

  public dispose(): void {
    if (this.isDisposed) return;

    this.resetModelState();
    this.isDisposed = true;

    for (const tier of this.tiers) {
      for (const m of tier.materials) {
        m.clippingPlanes = [];
        m.dispose();
      }
      tier.materials.length = 0;
    }
    this.tiers.length = 0;

    this.guideLineGeometry.dispose();
    this.guideLineMaterial.dispose();
    this.meshGroup.remove(this.xrayOverlayGroup);
    this.meshGroup.remove(this.explodeRigGroup);
    this.originalMaterialsMap.clear();
    this.savedMaterials.clear();
    this.glbMaterials.length = 0;
  }
}
