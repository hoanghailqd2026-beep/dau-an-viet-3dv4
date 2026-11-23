import { DEFAULT_HERITAGE_3D_CONFIG, type Heritage3DModelMode } from './heritage3DConfig';

export const GITHUB_ASSETS_REPO = 'hoanghailqd2026-beep/dauanviet3d-assets';
export const GITHUB_ASSETS_BRANCH = 'main';
export const GITHUB_ASSETS_CDN_BASE = `https://cdn.jsdelivr.net/gh/${GITHUB_ASSETS_REPO}@${GITHUB_ASSETS_BRANCH}`;
export const GITHUB_ASSETS_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_ASSETS_REPO}/${GITHUB_ASSETS_BRANCH}`;
export const GITHUB_ASSETS_CONTENTS_API = `https://api.github.com/repos/${GITHUB_ASSETS_REPO}/contents/`;
export const GITHUB_ASSETS_MANIFEST_READY_EVENT = 'dau-an-viet:github-assets-manifest-ready';

const GITHUB_MANIFEST_CACHE_KEY = 'dau_an_viet_gh_assets_manifest_v1';

export function buildGithubCdnUrl(fileName: string): string {
  return `${GITHUB_ASSETS_CDN_BASE}/${encodeURIComponent(fileName)}`;
}

export function buildGithubRawUrl(fileName: string): string {
  return `${GITHUB_ASSETS_RAW_BASE}/${encodeURIComponent(fileName)}`;
}

/**
 * Given any jsDelivr URL pointing to our public GitHub assets repo,
 * derives the corresponding raw.githubusercontent.com fallback URL.
 */
export function deriveGithubRawFallbackUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/^https?:\/\/cdn\.jsdelivr\.net\/gh\/([^/]+)\/([^/@]+)@([^/]+)\/(.+)$/i);
  if (!match) return null;
  const [, owner, repo, branch, encodedPath] = match;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodedPath}`;
}

interface GithubRepoContentItem {
  name: string;
  download_url?: string | null;
  type?: string;
}

interface ResolvedGithubFileEntry {
  exactName: string;
  downloadUrl: string | null;
}

function normalizeExactUnicodeKey(input: string): string {
  return input.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeAsciiFoldKey(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export interface BakedModelSettings {
  position: [number, number, number];
  scale: number;
  rotationY: number;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  explosionFactor: number;
  layerOffsets: [number, number, number, number];
  mode: Heritage3DModelMode;
}

export interface BakedAssetEntry {
  siteId: string;
  code: string;
  slug: string;
  officialName: string;
  /** Exact 3D model filename on GitHub main branch */
  modelFileName: string;
  /** Primary jsDelivr CDN URL for the 3D .glb model */
  modelUrl: string;
  /** Automatic raw.githubusercontent.com fallback URL for the 3D .glb model */
  modelRawFallbackUrl: string;
  /** Ordered fallback URLs checked if primary CDN fails */
  modelFallbackUrls: string[];
  /** Standardized filename for migration references */
  recommendedModelFileName: string;
  /** Exact Vietnamese voice narration .m4a filename on GitHub main branch */
  audioFileName: string;
  /** Primary jsDelivr CDN URL for the Vietnamese .m4a voice recording */
  audioUrl: string;
  /** Automatic raw.githubusercontent.com fallback URL for the Vietnamese .m4a voice recording */
  audioRawFallbackUrl: string;
  /** Ordered fallback audio URLs checked if primary CDN fails */
  audioFallbackUrls: string[];
  /** Standardized filename for migration references */
  recommendedAudioFileName: string;
  /** Fine-tuned 3D placement, camera, and architectural dissection settings */
  modelSettings: BakedModelSettings;
  /** ISO timestamp of the baked configuration version */
  updatedAt: string;
}

export const BAKED_ASSETS_VERSION = '2026.11.22-github-cdn-v4';
export const BAKED_ASSETS_UPDATED_AT = '2026-11-22T08:40:00.000Z';

interface BakedSiteSeed {
  siteId: string;
  code: string;
  slug: string;
  officialName: string;
  githubModelFile: string;
  githubAudioFile: string;
  explosionFactor?: number;
  layerOffsets?: [number, number, number, number];
}

const BAKED_SITE_SEEDS: readonly BakedSiteSeed[] = [
  {
    siteId: 'HCM-DT-001',
    code: '01',
    slug: '01-dinh-doc-lap',
    officialName: 'Dinh Độc Lập',
    githubModelFile: 'dinhdoclap.glb',
    githubAudioFile: 'Dinh độc lập.m4a',
    explosionFactor: 1.0,
    layerOffsets: [0, 0.45, 1.0, 1.6],
  },
  {
    siteId: 'HCM-DT-002',
    code: '02',
    slug: '02-nha-hat-thanh-pho',
    officialName: 'Nhà hát Thành phố',
    githubModelFile: 'nhahatthanhpho.glb',
    githubAudioFile: 'Nhà hát tp.m4a',
    explosionFactor: 1.0,
    layerOffsets: [0, 0.45, 1.0, 1.6],
  },
  {
    siteId: 'HCM-DT-003',
    code: '03',
    slug: '03-buu-dien-trung-tam',
    officialName: 'Bưu điện Trung tâm Sài Gòn',
    githubModelFile: 'buudientrungtam-v1.glb',
    githubAudioFile: 'Bưu điện.m4a',
    explosionFactor: 1.0,
    layerOffsets: [0, 0.45, 1.0, 1.6],
  },
  {
    siteId: 'HCM-DT-004',
    code: '04',
    slug: '04-cho-ben-thanh',
    officialName: 'Chợ Bến Thành',
    githubModelFile: 'chobenthanh-v1.glb',
    githubAudioFile: 'Chợ bến thành.m4a',
    explosionFactor: 1.0,
    layerOffsets: [0, 0.45, 1.0, 1.6],
  },
  {
    siteId: 'HCM-DT-005',
    code: '05',
    slug: '05-nha-tho-duc-ba',
    officialName: 'Nhà thờ Chính tòa Đức Bà Sài Gòn',
    githubModelFile: 'nhathoducba-v1.glb',
    githubAudioFile: 'Nha tho dba.m4a',
    explosionFactor: 1.05,
    layerOffsets: [0, 0.45, 1.05, 1.7],
  },
  {
    siteId: 'HCM-DT-006',
    code: '06',
    slug: '06-bao-tang-lich-su',
    officialName: 'Bảo tàng Lịch sử Thành phố Hồ Chí Minh',
    githubModelFile: 'baotangtphcm-v1.glb',
    githubAudioFile: 'Btang lsu.m4a',
    explosionFactor: 1.0,
    layerOffsets: [0, 0.45, 1.0, 1.6],
  },
  {
    siteId: 'HCM-DT-007',
    code: '07',
    slug: '07-ben-nha-rong',
    officialName: 'Bến Nhà Rồng - Bảo tàng Hồ Chí Minh',
    githubModelFile: 'bennharong.glb',
    githubAudioFile: 'Ben nrong.m4a',
    explosionFactor: 1.0,
    layerOffsets: [0, 0.45, 1.0, 1.6],
  },
  {
    siteId: 'HCM-DT-008',
    code: '08',
    slug: '08-lang-le-van-duyet',
    officialName: 'Lăng Tả quân Lê Văn Duyệt',
    githubModelFile: 'langtaquanlevanduyet-v1.glb',
    githubAudioFile: 'Lăng.m4a',
    explosionFactor: 1.0,
    layerOffsets: [0, 0.45, 1.0, 1.6],
  },
  {
    siteId: 'HCM-DT-009',
    code: '09',
    slug: '09-dia-dao-cu-chi',
    officialName: 'Khu di tích lịch sử Địa đạo Củ Chi',
    githubModelFile: 'diadaocuchi-v1.glb',
    githubAudioFile: 'Địa đạo.m4a',
    explosionFactor: 1.1,
    layerOffsets: [0, 0.5, 1.1, 1.75],
  },
  {
    siteId: 'HCM-DT-010',
    code: '10',
    slug: '10-giong-ca-vo',
    officialName: 'Khu Di tích Khảo cổ học Giồng Cá Vồ',
    githubModelFile: 'Giongcavvo-v1.glb',
    githubAudioFile: 'Giong ca vo.m4a',
    explosionFactor: 1.0,
    layerOffsets: [0, 0.45, 1.0, 1.6],
  },
  {
    siteId: 'HCM-DT-011',
    code: '11',
    slug: '11-chua-giac-lam',
    officialName: 'Chùa Giác Lâm',
    githubModelFile: 'chuagiaclam-v1.glb',
    githubAudioFile: 'Chùa Giác Lâm.m4a',
    explosionFactor: 1.0,
    layerOffsets: [0, 0.45, 1.0, 1.6],
  },
  {
    siteId: 'HCM-DT-012',
    code: '12',
    slug: '12-hoi-quan-nghia-an',
    officialName: 'Hội quán Nghĩa An',
    githubModelFile: 'hoiquannghiaan-v1.glb',
    githubAudioFile: 'Hội quán.m4a',
    explosionFactor: 1.0,
    layerOffsets: [0, 0.45, 1.0, 1.6],
  },
  {
    siteId: 'BRVT-DT-001',
    code: '13',
    slug: '13-bach-dinh',
    officialName: 'Bạch Dinh - Villa Blanche',
    githubModelFile: 'dinhbaodai.glb',
    githubAudioFile: 'Bach dinh.m4a',
    explosionFactor: 1.0,
    layerOffsets: [0, 0.45, 1.0, 1.6],
  },
  {
    siteId: 'BRVT-DT-002',
    code: '14',
    slug: '14-nha-lon-long-son',
    officialName: 'Quần thể kiến trúc Nhà Lớn Long Sơn',
    githubModelFile: 'nhalonlongson-v1.glb',
    githubAudioFile: 'Nh lon lson.m4a',
    explosionFactor: 1.0,
    layerOffsets: [0, 0.45, 1.0, 1.6],
  },
  {
    siteId: 'BRVT-DT-003',
    code: '15',
    slug: '15-dia-dao-long-phuoc',
    officialName: 'Khu di tích Địa đạo Long Phước',
    githubModelFile: 'diadaolongphuoc-v1.glb',
    githubAudioFile: 'Đ long phc.m4a',
    explosionFactor: 1.1,
    layerOffsets: [0, 0.5, 1.1, 1.75],
  },
  {
    siteId: 'BD-DT-001',
    code: '16',
    slug: '16-nha-co-tran-cong-vang',
    officialName: 'Nhà cổ Trần Công Vàng',
    githubModelFile: 'nhacotrancongvang-v1.glb',
    githubAudioFile: 'Nhà cổ.m4a',
    explosionFactor: 1.0,
    layerOffsets: [0, 0.45, 1.0, 1.6],
  },
  {
    siteId: 'BD-DT-002',
    code: '17',
    slug: '17-dia-dao-tam-giac-sat',
    officialName: 'Khu di tích Địa đạo Tam Giác Sắt - Tây Nam Bến Cát',
    githubModelFile: 'diadaotamgiacsat-v1.glb',
    githubAudioFile: 'Bến cát.m4a',
    explosionFactor: 1.1,
    layerOffsets: [0, 0.5, 1.1, 1.75],
  },
];

function buildBakedEntry(seed: BakedSiteSeed): BakedAssetEntry {
  const cfg = DEFAULT_HERITAGE_3D_CONFIG[seed.siteId];
  const modelUrl = buildGithubCdnUrl(seed.githubModelFile);
  const modelRawFallbackUrl = buildGithubRawUrl(seed.githubModelFile);
  const audioUrl = buildGithubCdnUrl(seed.githubAudioFile);
  const audioRawFallbackUrl = buildGithubRawUrl(seed.githubAudioFile);

  const modelFallbackUrls = Array.from(
    new Set(
      [modelRawFallbackUrl, cfg?.glbUrl || ''].filter(
        (u): u is string => Boolean(u && u !== modelUrl)
      )
    )
  );

  const audioFallbackUrls = [audioRawFallbackUrl];

  return {
    siteId: seed.siteId,
    code: seed.code,
    slug: seed.slug,
    officialName: seed.officialName,
    modelFileName: seed.githubModelFile,
    modelUrl,
    modelRawFallbackUrl,
    modelFallbackUrls,
    recommendedModelFileName: seed.githubModelFile,
    audioFileName: seed.githubAudioFile,
    audioUrl,
    audioRawFallbackUrl,
    audioFallbackUrls,
    recommendedAudioFileName: seed.githubAudioFile,
    modelSettings: {
      position: [0, 0, 0],
      scale: typeof cfg?.scale === 'number' && Number.isFinite(cfg.scale) ? cfg.scale : 1,
      rotationY:
        typeof cfg?.rotationY === 'number' && Number.isFinite(cfg.rotationY) ? cfg.rotationY : 0,
      cameraPos: cfg?.cameraPos || [22, 18, 34],
      cameraTarget: cfg?.cameraTarget || [0, 6, 0],
      explosionFactor: seed.explosionFactor ?? 1.0,
      layerOffsets: seed.layerOffsets ?? [0, 0.45, 1.0, 1.6],
      mode: cfg?.mode || 'interactive_3d_museum',
    },
    updatedAt: BAKED_ASSETS_UPDATED_AT,
  };
}

/**
 * Central Permanent Source of Truth for all 17 Southeast Vietnam heritage monuments.
 * Locked directly to public GitHub CDN (jsDelivr primary + raw.githubusercontent.com fallback)
 * for permanent playback across every device, incognito session, and Remix copy.
 */
export const BAKED_ASSETS: Record<string, BakedAssetEntry> = Object.fromEntries(
  BAKED_SITE_SEEDS.map((seed) => [seed.siteId, buildBakedEntry(seed)])
);

export const BAKED_ASSETS_LIST: readonly BakedAssetEntry[] = BAKED_SITE_SEEDS.map(
  (seed) => BAKED_ASSETS[seed.siteId]
);

const resolvedGithubAudioBySite: Record<string, ResolvedGithubFileEntry> = {};
const resolvedGithubModelBySite: Record<string, ResolvedGithubFileEntry> = {};
let githubManifestPromise: Promise<void> | null = null;
let githubManifestHydrated = false;

function indexGithubContentsIntoSiteMaps(items: GithubRepoContentItem[]): void {
  const byUnicodeKey = new Map<string, GithubRepoContentItem>();
  const byAsciiKey = new Map<string, GithubRepoContentItem>();

  for (const item of items) {
    if (!item || typeof item.name !== 'string') continue;
    byUnicodeKey.set(normalizeExactUnicodeKey(item.name), item);
    byAsciiKey.set(normalizeAsciiFoldKey(item.name), item);
  }

  for (const seed of BAKED_SITE_SEEDS) {
    const audioMatch =
      byUnicodeKey.get(normalizeExactUnicodeKey(seed.githubAudioFile)) ||
      byAsciiKey.get(normalizeAsciiFoldKey(seed.githubAudioFile));
    if (audioMatch) {
      resolvedGithubAudioBySite[seed.siteId] = {
        exactName: audioMatch.name,
        downloadUrl: typeof audioMatch.download_url === 'string' ? audioMatch.download_url : null,
      };
    }

    const modelMatch =
      byUnicodeKey.get(normalizeExactUnicodeKey(seed.githubModelFile)) ||
      byAsciiKey.get(normalizeAsciiFoldKey(seed.githubModelFile));
    if (modelMatch) {
      resolvedGithubModelBySite[seed.siteId] = {
        exactName: modelMatch.name,
        downloadUrl: typeof modelMatch.download_url === 'string' ? modelMatch.download_url : null,
      };
    }
  }
}

function hydrateManifestFromSessionStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.sessionStorage.getItem(GITHUB_MANIFEST_CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { items?: GithubRepoContentItem[] };
    if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
      indexGithubContentsIntoSiteMaps(parsed.items);
      githubManifestHydrated = true;
      return true;
    }
  } catch {
    // ignore storage parse failures
  }
  return false;
}

/**
 * Queries the public GitHub Contents API once per session (cached in sessionStorage)
 * to discover exact Unicode filenames (NFC vs NFD) and download_url for all 17 .m4a and 17 .glb files.
 */
export function preloadGithubAssetsManifest(): Promise<void> {
  if (githubManifestHydrated) return Promise.resolve();
  if (hydrateManifestFromSessionStorage()) return Promise.resolve();
  if (githubManifestPromise) return githubManifestPromise;
  if (typeof fetch !== 'function') return Promise.resolve();

  githubManifestPromise = fetch(GITHUB_ASSETS_CONTENTS_API, {
    headers: { Accept: 'application/vnd.github+json' },
  })
    .then(async (res) => {
      if (!res.ok) return;
      const data = (await res.json()) as unknown;
      if (!Array.isArray(data)) return;
      const compactItems: GithubRepoContentItem[] = data
        .filter((it): it is GithubRepoContentItem => Boolean(it && typeof (it as GithubRepoContentItem).name === 'string'))
        .map((it) => ({
          name: it.name,
          download_url: it.download_url || null,
          type: it.type,
        }));
      if (compactItems.length === 0) return;

      indexGithubContentsIntoSiteMaps(compactItems);
      githubManifestHydrated = true;

      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem(
            GITHUB_MANIFEST_CACHE_KEY,
            JSON.stringify({ fetchedAt: Date.now(), items: compactItems })
          );
        } catch {
          // ignore sessionStorage quota errors
        }
        window.dispatchEvent(new CustomEvent(GITHUB_ASSETS_MANIFEST_READY_EVENT));
      }
    })
    .catch(() => {
      // Silently fall back to built-in NFC/NFD CDN & raw URL candidates
    })
    .finally(() => {
      githubManifestPromise = null;
    });

  return githubManifestPromise;
}

// Hydrate from sessionStorage immediately and refresh from GitHub Contents API in the background
if (typeof window !== 'undefined') {
  hydrateManifestFromSessionStorage();
  void preloadGithubAssetsManifest();
}

export function getBakedAsset(siteId: string): BakedAssetEntry | null {
  return BAKED_ASSETS[siteId] || null;
}

function buildNormalizedGithubCandidates(
  fileName: string,
  resolved: ResolvedGithubFileEntry | undefined
): string[] {
  const nfcName = fileName.normalize('NFC');
  const nfdName = fileName.normalize('NFD');
  const candidates: string[] = [];

  // 1. Primary: jsDelivr CDN with exact filename discovered via GitHub Contents API
  if (resolved?.exactName) {
    candidates.push(buildGithubCdnUrl(resolved.exactName));
  }
  // 2. Normalized NFC & NFD on jsDelivr CDN (handles macOS NFD vs Windows/Linux NFC filenames)
  candidates.push(buildGithubCdnUrl(nfcName));
  if (nfdName !== nfcName) {
    candidates.push(buildGithubCdnUrl(nfdName));
  }
  // 3. Exact download_url returned by GitHub Contents API (raw.githubusercontent.com)
  if (resolved?.downloadUrl) {
    candidates.push(resolved.downloadUrl);
  }
  // 4. Direct raw.githubusercontent.com with NFC & NFD encodings
  candidates.push(buildGithubRawUrl(nfcName));
  if (nfdName !== nfcName) {
    candidates.push(buildGithubRawUrl(nfdName));
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

export function getBakedModelCandidateUrls(siteId: string): string[] {
  const entry = BAKED_ASSETS[siteId];
  if (!entry) return [];
  const normalizedCandidates = buildNormalizedGithubCandidates(
    entry.modelFileName,
    resolvedGithubModelBySite[siteId]
  );
  return Array.from(
    new Set([...normalizedCandidates, entry.modelUrl, entry.modelRawFallbackUrl, ...entry.modelFallbackUrls].filter(Boolean))
  );
}

export function getBakedAudioCandidateUrls(siteId: string): string[] {
  const entry = BAKED_ASSETS[siteId];
  if (!entry) return [];
  const normalizedCandidates = buildNormalizedGithubCandidates(
    entry.audioFileName,
    resolvedGithubAudioBySite[siteId]
  );
  return Array.from(
    new Set([...normalizedCandidates, entry.audioUrl, entry.audioRawFallbackUrl, ...entry.audioFallbackUrls].filter(Boolean))
  );
}

export function getAudioCandidateUrlsForSite(siteId: string): string[] {
  return getBakedAudioCandidateUrls(siteId);
}

