import type { HeritageHotspotFeature } from '../types/heritage.ts';
import { DEFAULT_HERITAGE_SITES } from './heritageData.ts';

export type Heritage3DModelMode = 'glb_only' | 'interactive_3d_museum';

export interface Heritage3DTransform {
  scale: number;
  rotationY: number;
  updatedAt?: string;
}

export interface Heritage3DConfigEntry {
  siteId: string;
  mode: Heritage3DModelMode;
  glbUrl: string;
  scale: number;
  rotationY: number;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  hotspots: HeritageHotspotFeature[];
}

export const TRANSFORMS_3D_STORAGE_KEY = 'dau_an_viet_3d_transforms_v1';
export const HOTSPOTS_3D_STORAGE_KEY = 'dau_an_viet_3d_hotspots_v1';
export const CONFIG_3D_UPDATED_EVENT = 'dau-an-viet-3d-config-updated';

/**
 * Cau hinh 3D tinh (Remix-resilient) cho toan bo 17 di tich Dong Nam Bo,
 * doc truc tiep tu nguon goc mac dinh DEFAULT_HERITAGE_SITES (src/data/heritageData.ts).
 */
export const DEFAULT_HERITAGE_3D_CONFIG: Record<string, Heritage3DConfigEntry> = Object.fromEntries(
  DEFAULT_HERITAGE_SITES.map((site) => {
    const cfg = site.config3D;
    return [
      site.id,
      {
        siteId: site.id,
        mode:
          cfg?.mode ||
          (site.id === 'HCM-DT-001' || site.id === 'BRVT-DT-001'
            ? 'glb_only'
            : 'interactive_3d_museum'),
        glbUrl: cfg?.glbUrl || site.model3DUrl || '',
        scale: typeof cfg?.scale === 'number' && Number.isFinite(cfg.scale) ? cfg.scale : 1,
        rotationY:
          typeof cfg?.rotationY === 'number' && Number.isFinite(cfg.rotationY)
            ? cfg.rotationY
            : 0,
        cameraPos: cfg?.cameraPos || [22, 18, 34],
        cameraTarget: cfg?.cameraTarget || [0, 6, 0],
        hotspots: Array.isArray(cfg?.hotspots) ? cfg.hotspots : [],
      } satisfies Heritage3DConfigEntry,
    ];
  })
);

export function loadSaved3DTransforms(): Record<string, Heritage3DTransform> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(TRANSFORMS_3D_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, Heritage3DTransform>;
  } catch {
    return {};
  }
}

export function getSite3DTransform(siteId: string): Heritage3DTransform {
  const saved = loadSaved3DTransforms()[siteId];
  const cfg = DEFAULT_HERITAGE_3D_CONFIG[siteId];
  return {
    scale:
      typeof saved?.scale === 'number' && Number.isFinite(saved.scale)
        ? saved.scale
        : cfg?.scale ?? 1,
    rotationY:
      typeof saved?.rotationY === 'number' && Number.isFinite(saved.rotationY)
        ? saved.rotationY
        : cfg?.rotationY ?? 0,
    updatedAt: saved?.updatedAt,
  };
}

export function saveSite3DTransform(
  siteId: string,
  scale: number,
  rotationY: number
): Record<string, Heritage3DTransform> {
  const current = loadSaved3DTransforms();
  const next: Record<string, Heritage3DTransform> = {
    ...current,
    [siteId]: {
      scale: Number(scale.toFixed(2)),
      rotationY: Math.round(rotationY),
      updatedAt: new Date().toISOString(),
    },
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(TRANSFORMS_3D_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  }
  return next;
}

export function resetSite3DTransform(siteId: string): Heritage3DTransform {
  const cfg = DEFAULT_HERITAGE_3D_CONFIG[siteId];
  const baseScale = cfg?.scale ?? 1;
  const baseRotationY = cfg?.rotationY ?? 0;
  saveSite3DTransform(siteId, baseScale, baseRotationY);
  return { scale: baseScale, rotationY: baseRotationY };
}

export function loadSaved3DHotspots(): Record<string, HeritageHotspotFeature[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(HOTSPOTS_3D_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, HeritageHotspotFeature[]>;
  } catch {
    return {};
  }
}

export function getSite3DHotspots(siteId: string): HeritageHotspotFeature[] | null {
  const saved = loadSaved3DHotspots()[siteId];
  if (Array.isArray(saved) && saved.length > 0) {
    return saved;
  }
  const cfgHotspots = DEFAULT_HERITAGE_3D_CONFIG[siteId]?.hotspots;
  return Array.isArray(cfgHotspots) && cfgHotspots.length > 0 ? cfgHotspots : null;
}

export function saveSite3DHotspots(
  siteId: string,
  hotspots: HeritageHotspotFeature[]
): Record<string, HeritageHotspotFeature[]> {
  const current = loadSaved3DHotspots();
  const next: Record<string, HeritageHotspotFeature[]> = {
    ...current,
    [siteId]: hotspots,
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(HOTSPOTS_3D_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(CONFIG_3D_UPDATED_EVENT, { detail: { siteId } }));
    } catch {
      // ignore storage quota errors
    }
  }
  return next;
}
