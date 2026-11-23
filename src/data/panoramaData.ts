// =========================================================================
// SAIGON HERITAGE - BẢN ĐỒ DI SẢN VĂN HÓA VẬT THỂ TP.HCM
// QUẢN LÝ DỮ LIỆU TOÀN CẢNH VR 360° TỪ FILE panoramas.json DUY NHẤT
// =========================================================================

import rawPanoramas from './panoramas.json';

export type PanoramaType = 'field_360' | 'historical_archive' | 'reconstruction_ai';

export interface PanoramaHotspot {
  id: string;
  type: 'info' | 'transition';
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  theta: number; // yaw radians (-PI to PI)
  phi: number;   // pitch radians (-PI/2 to PI/2)
  targetViewpointId?: string;
  photoUrl?: string;
  sourceCredit?: string;
}

export interface HistoricalComparison {
  imageUrl: string;
  year: string;
  photographerOrSource: string;
  caption: string;
  captionEn: string;
}

export interface PanoramaViewpoint {
  id: string;
  name: string;
  nameEn: string;
  type: PanoramaType;
  imageUrl: string;
  previewUrl?: string;
  captureDate?: string;
  photographer?: string;
  organization?: string;
  license?: string;
  northHeadingDeg: number;
  initialLon: number;
  initialLat: number;
  initialFov?: number;
  miniMapCoords: { x: number; y: number };
  historicalComparison?: HistoricalComparison;
  hotspots: PanoramaHotspot[];
}

export interface SitePanoramaData {
  siteId: string;
  hasField360: boolean;
  defaultViewpointId?: string;
  viewpoints: PanoramaViewpoint[];
  emptyStateNotice?: {
    vi: string;
    en: string;
  };
}

export interface RawPanoramaItem {
  siteId: string;
  identifierCode: string;
  siteName: string;
  src: string | null;
  captureDate: string | null;
  photographer: string | null;
  organization: string | null;
  license: string | null;
  photoType: PanoramaType | null;
  northHeading: number;
  initialLon: number;
  initialLat: number;
  hotspots?: PanoramaHotspot[];
}

export type PanoramasRecord = Record<string, RawPanoramaItem>;
export const PANORAMAS_DATABASE: PanoramasRecord = rawPanoramas as PanoramasRecord;

/**
 * Lấy dữ liệu toàn cảnh 360° từ nguồn sự thật duy nhất (panoramas.json).
 * Nếu src là null hoặc không có -> hasField360 = false, không tự tạo đường dẫn hay credit giả.
 */
export function getSitePanoramaData(siteId: string): SitePanoramaData {
  const item = PANORAMAS_DATABASE[siteId];

  // Nếu không có bản ghi hoặc src = null -> Chưa có ảnh 360° thực địa
  if (!item || !item.src || typeof item.src !== 'string' || item.src.trim() === '') {
    return {
      siteId,
      hasField360: false,
      viewpoints: [],
      emptyStateNotice: {
        vi: 'Chưa có ảnh 360° thực địa cho di tích này.',
        en: 'No authentic 360° field panorama currently available for this monument.',
      },
    };
  }

  // Có ảnh thật hợp lệ được cung cấp trong panoramas.json
  const vp: PanoramaViewpoint = {
    id: `${siteId}-vp-1`,
    name: item.siteName,
    nameEn: item.siteName,
    type: item.photoType || 'field_360',
    imageUrl: item.src.trim(),
    captureDate: item.captureDate || undefined,
    photographer: item.photographer || undefined,
    organization: item.organization || undefined,
    license: item.license || undefined,
    northHeadingDeg: item.northHeading || 0,
    initialLon: item.initialLon || 0,
    initialLat: item.initialLat || 0,
    initialFov: 75,
    miniMapCoords: { x: 50, y: 50 },
    hotspots: item.hotspots || [],
  };

  return {
    siteId,
    hasField360: true,
    defaultViewpointId: vp.id,
    viewpoints: [vp],
  };
}
