import { DEFAULT_HERITAGE_SITES } from './heritageData.ts';

export interface SitePhotoCaptionSet {
  vi: [string, string];
  en: [string, string];
  zh: [string, string];
}

/**
 * 34 URL anh chup thuc te do phan giai cao & chu thich VI/EN/ZH
 * duoc doc truc tiep tu nguon goc mac dinh DEFAULT_HERITAGE_SITES (heritageData.ts).
 */
export const DEFAULT_SITE_PHOTOS_BY_ID: Record<string, [string, string]> = Object.fromEntries(
  DEFAULT_HERITAGE_SITES.map((site) => [
    site.id,
    [site.photos?.[0] || '', site.photos?.[1] || ''] as [string, string],
  ])
);

export const DEFAULT_SITE_PHOTO_CAPTIONS: Record<string, SitePhotoCaptionSet> = Object.fromEntries(
  DEFAULT_HERITAGE_SITES.map((site) => [
    site.id,
    site.photoCaptionsByLang || {
      vi: [
        `Ảnh chụp thực tế 01 · ${site.officialName}`,
        `Ảnh chụp thực tế 02 · ${site.officialName}`,
      ],
      en: [
        `Archival photograph 01 · ${site.officialName}`,
        `Archival photograph 02 · ${site.officialName}`,
      ],
      zh: [
        `实景档案照片 01 · ${site.officialName}`,
        `实景档案照片 02 · ${site.officialName}`,
      ],
    },
  ])
);

/**
 * Mốc phát hành bộ 34 ảnh tư liệu gốc độ phân giải cao cho 17 di tích.
 * Các bản ghi customSitePhotos cũ hơn mốc này hoặc trỏ tới link ảnh mờ/thumb cũ trên Firebase
 * sẽ tự động được dọn sạch để hiển thị đúng bộ ảnh HD chuẩn mới.
 */
export const CURATED_HD_PHOTO_RELEASE_ISO = '2026-11-21T07:35:00.000Z';

/**
 * Tự động loại bỏ các tham số nén/thu nhỏ URL không ký (như w=300, width=400, thumb=1,
 * /zoom/700_438/, hoặc Wikimedia /thumb/.../NNNpx-...) để hiển thị ảnh gốc sắc nét tối đa.
 * Giữ nguyên tuyệt đối các đường dẫn CDN có chữ ký bảo mật (s=, signature=, token=, sig=, proc=).
 */
export function normalizeHighResPhotoUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);

    // Upgrade known HTTPS-capable archives to avoid mixed-content blocking
    if (parsed.protocol === 'http:' && /(?:^|\.)redsvn\.net$/i.test(parsed.hostname)) {
      parsed.protocol = 'https:';
    }

    const hasSignature =
      parsed.searchParams.has('s') ||
      parsed.searchParams.has('sig') ||
      parsed.searchParams.has('signature') ||
      parsed.searchParams.has('token') ||
      parsed.searchParams.has('auth') ||
      parsed.searchParams.has('proc');

    // 1. Upgrade Wikimedia /commons/thumb/.../NNNpx-File -> full original file on upload.wikimedia.org
    if (
      /wikimedia\.org$/i.test(parsed.hostname) &&
      parsed.pathname.includes('/commons/thumb/')
    ) {
      const thumbMatch = parsed.pathname.match(
        /^(.*\/commons)\/thumb\/([^/]+\/[^/]+\/[^/]+)\/\d+px-[^/]+$/i
      );
      if (thumbMatch) {
        return `https://upload.wikimedia.org/wikipedia/commons/${thumbMatch[2]}`;
      }
    }

    // 2. Strip cdnchinhphu.vn /zoom/WxH/ resizing path to load full original HD file
    if (/cdnchinhphu\.vn$/i.test(parsed.hostname) && /^\/zoom\/\d+_\d+\//i.test(parsed.pathname)) {
      parsed.pathname = parsed.pathname.replace(/^\/zoom\/\d+_\d+\//i, '/');
      return parsed.toString();
    }

    // 3. Strip small thumbnail query parameters and WordPress resize suffixes on unsigned URLs
    if (!hasSignature) {
      let mutated = false;
      for (const key of ['w', 'width', 'h', 'height', 'size', 'resize']) {
        const val = parsed.searchParams.get(key);
        if (val) {
          const num = parseInt(val, 10);
          if (Number.isFinite(num) && num > 0 && num <= 1200) {
            parsed.searchParams.delete(key);
            mutated = true;
          }
        }
      }
      if (parsed.searchParams.has('thumb') || parsed.searchParams.has('thumbnail')) {
        parsed.searchParams.delete('thumb');
        parsed.searchParams.delete('thumbnail');
        mutated = true;
      }
      // Strip WordPress thumbnail crop suffix like -300x200.jpg or -600x400.png
      if (/-\d{2,3}x\d{2,3}\.(jpe?g|png|webp)$/i.test(parsed.pathname)) {
        parsed.pathname = parsed.pathname.replace(/-\d{2,3}x\d{2,3}(\.(?:jpe?g|png|webp))$/i, '$1');
        mutated = true;
      }
      if (mutated || parsed.toString() !== trimmed) {
        return parsed.toString();
      }
    } else if (parsed.toString() !== trimmed) {
      return parsed.toString();
    }
  } catch {
    // Keep original URL if parsing fails
  }

  return trimmed;
}

const LEGACY_OVERRIDDEN_LOCAL_PATHS = new Set<string>([
  '/assets/aistudio/image_2f647def.png',
  '/assets/aistudio/image_1fdfa5e2.png',
  '/assets/aistudio/image_294e0c94.png',
  '/assets/aistudio/image_0e28586d.png',
  '/assets/aistudio/image_286c792c.png',
  '/assets/aistudio/image_f4d6e7f1.png',
  '/assets/aistudio/image_385f742f.png',
  '/assets/aistudio/image_40fa41b7.png',
  '/images/heritage/HCM-DT-004-2.jpg',
  '/images/heritage/HCM-DT-007-1.jpg',
  '/images/heritage/HCM-DT-007-2.jpg',
  '/images/heritage/HCM-DT-009-1.jpg',
  '/images/heritage/HCM-DT-009-2.jpg',
]);

export function isLegacyBlurryPhotoOverrideUrl(rawUrl?: string): boolean {
  const url = (rawUrl || '').trim();
  if (!url) return false;
  const cleanPath = url.split('?')[0].split('#')[0];
  if (LEGACY_OVERRIDDEN_LOCAL_PATHS.has(cleanPath)) return true;
  if (/thumb\.wikimedia\.org/i.test(url)) return true;
  if (/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\//i.test(url)) return true;
  if (/cdnchinhphu\.vn\/zoom\/\d+_\d+\//i.test(url)) return true;
  return false;
}

/**
 * Dọn sạch các override ảnh mờ/cũ lưu từ phiên bản trước trong localStorage hoặc Firebase,
 * giữ nguyên 100% các ảnh mới được Admin tải lên hoặc cập nhật sau mốc phát hành bộ ảnh HD chuẩn.
 */
export function sanitizeCustomSitePhotosMap(rawMap: Record<string, unknown>): {
  cleaned: Record<string, unknown>;
  changed: boolean;
} {
  const cleaned: Record<string, unknown> = {};
  let changed = false;

  for (const [siteId, entry] of Object.entries(rawMap || {})) {
    if (!entry) continue;

    if (typeof entry === 'string') {
      // Legacy single-string entries predate the curated HD release; drop so curated HD defaults apply
      changed = true;
      continue;
    }

    if (typeof entry === 'object') {
      const pair = entry as { photo1?: unknown; photo2?: unknown; updatedAt?: unknown };
      const updatedAt = typeof pair.updatedAt === 'string' ? pair.updatedAt : '';
      const isPredatingRelease = !updatedAt || updatedAt < CURATED_HD_PHOTO_RELEASE_ISO;

      const raw1 = typeof pair.photo1 === 'string' ? pair.photo1.trim() : '';
      const raw2 = typeof pair.photo2 === 'string' ? pair.photo2.trim() : '';

      const drop1 = Boolean(raw1) && (isPredatingRelease || isLegacyBlurryPhotoOverrideUrl(raw1));
      const drop2 = Boolean(raw2) && (isPredatingRelease || isLegacyBlurryPhotoOverrideUrl(raw2));

      const next1 = drop1 ? '' : normalizeHighResPhotoUrl(raw1);
      const next2 = drop2 ? '' : normalizeHighResPhotoUrl(raw2);

      if (drop1 || drop2 || next1 !== raw1 || next2 !== raw2) {
        changed = true;
      }

      if (next1 || next2) {
        cleaned[siteId] = {
          ...(next1 ? { photo1: next1 } : {}),
          ...(next2 ? { photo2: next2 } : {}),
          updatedAt: updatedAt || new Date().toISOString(),
        };
      } else if (raw1 || raw2) {
        // Record was cleared; emit empty slot timestamped now so Firebase overwrites legacy blurry links
        cleaned[siteId] = {
          photo1: '',
          photo2: '',
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  return { cleaned, changed };
}

