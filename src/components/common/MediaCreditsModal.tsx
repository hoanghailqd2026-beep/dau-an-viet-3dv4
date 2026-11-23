import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Search,
  Check,
  Copy,
  ArrowUpRight,
  ArrowRight,
  Maximize2,
  Play,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { HeritageSite } from '../../types/heritage';
import { useI18n } from '../../i18n/I18nContext';
import {
  MediaCreditCategory,
  MediaCreditItem,
  useMediaCredits,
} from '../../utils/mediaCreditsStore';
import { SITE_ID_TO_VIDEO_KEY } from '../../data/heritageFilms';
import { useHeritageRealPhotos } from '../../utils/wikimediaPhotoService';
import { HeritageSiteSearchSelect } from './HeritageSiteSearchSelect';

export interface MediaCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: HeritageSite[];
  initialSiteId?: string | null;
  initialCategory?: 'ALL' | MediaCreditCategory;
}

type FilterCategory = 'ALL' | MediaCreditCategory;
type CitationFormat = 'archival' | 'apa';

interface LightboxSpecimen {
  id: string;
  src: string;
  accessionCode: string;
  yearDisplay: string;
  title: string;
  siteDisplay: string;
  sourceAuthor: string;
  licenseNote: string;
  url?: string;
  citation: string;
}

function extractYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      return id && id.length >= 6 ? id : null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return v;
      const match = parsed.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/);
      if (match?.[1]) return match[1];
    }
  } catch {
    const fallbackMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
    if (fallbackMatch?.[1]) return fallbackMatch[1];
  }
  return null;
}

function isDirectImageUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return true;
  if (trimmed.startsWith('/assets/') || trimmed.startsWith('/images/')) return true;
  const withoutQuery = trimmed.split('?')[0].split('#')[0].toLowerCase();
  if (/\.(jpg|jpeg|png|webp|avif|gif)$/i.test(withoutQuery)) {
    if (
      trimmed.includes('/wiki/File:') ||
      trimmed.includes('/wiki/T%E1%BB%87p:') ||
      trimmed.includes('/wiki/T%E1%BA%ADp_tin:')
    ) {
      return false;
    }
    return true;
  }
  return false;
}

function fallbackCopyText(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => fallbackCopyText(text));
  }
  return Promise.resolve(fallbackCopyText(text));
}

function extractChronologyDisplay(
  item: MediaCreditItem,
  site: HeritageSite | undefined,
  lang: 'vi' | 'en' | 'zh'
): string {
  const raw = (item.yearOrPeriod || '').trim();
  const years = raw.match(/\b(1[6-9]\d{2}|20\d{2})\b/g);
  if (years && years.length >= 2) {
    const first = years[0];
    const last = years[years.length - 1];
    return first.slice(0, 2) === last.slice(0, 2)
      ? `${first}–${last.slice(2)}`
      : `${first}–${last}`;
  }
  if (years && years.length === 1) {
    return years[0];
  }
  if (/^\d{1,2}:\d{2}/.test(raw)) {
    return raw;
  }
  if (/hiện tại|present|current|当代|现代/i.test(raw)) {
    return lang === 'en' ? 'Present' : lang === 'zh' ? '当代' : 'Hiện tại';
  }
  if (site?.commencementYear) {
    return String(site.commencementYear);
  }
  return raw || '—';
}

function extractArchiveCodeLabel(item: MediaCreditItem, lang: 'vi' | 'en' | 'zh'): string {
  const combined = `${item.id} ${item.sourceAuthor} ${item.title}`.toLowerCase();
  if (combined.includes('gallica') || combined.includes('bnf')) {
    return 'BNF GALLICA · TTLQG II';
  }
  if (combined.includes('anom')) {
    return 'ANOM · TTLQG II';
  }
  if (combined.includes('efeo')) {
    return 'EFEO · BẢO TÀNG LỊCH SỬ';
  }
  if (combined.includes('openstreetmap') || combined.includes('esri') || combined.includes('gis')) {
    return 'OSM · CARTO · ESRI GIS';
  }
  if (combined.includes('ngô viết thụ') || combined.includes('dinh')) {
    return 'HỘI TRƯỜNG THỐNG NHẤT · ARCHIVE';
  }
  if (combined.includes('thư viện khoa học')) {
    return 'TVKHTH TP.HCM · COMMONS';
  }
  return lang === 'en'
    ? 'NATIONAL ARCHIVES II'
    : lang === 'zh'
    ? '国家历史舆图馆藏'
    : 'TTLQG II · LƯU TRỮ ĐỒ BẢN';
}

function extractVideoChannelLabel(item: MediaCreditItem, lang: 'vi' | 'en' | 'zh'): string {
  const combined = `${item.title} ${item.sourceAuthor} ${item.titleEn || ''}`.toLowerCase();
  if (combined.includes('vtv')) return 'VTV';
  if (combined.includes('htv')) return 'HTV';
  if (combined.includes('flycam') || combined.includes('aerial') || combined.includes('4k')) {
    return lang === 'en'
      ? '4K Aerial Archive'
      : lang === 'zh'
      ? '4K 航拍档案'
      : 'Flycam 4K · Tư liệu lịch sử';
  }
  return lang === 'en'
    ? 'Historical Documentary'
    : lang === 'zh'
    ? '历史文献纪录片'
    : 'Tư liệu lịch sử';
}

interface CartographicPlateProps {
  yearDisplay: string;
  archiveCode: string;
  accessionCode: string;
  lang: 'vi' | 'en' | 'zh';
}

const AntiqueCartographicPlate: React.FC<CartographicPlateProps> = ({
  yearDisplay,
  archiveCode,
  accessionCode,
  lang,
}) => {
  const regionLabel =
    lang === 'en'
      ? 'SOUTHEAST VIETNAM SURVEY · 10°46′N 106°42′E'
      : lang === 'zh'
      ? '越南东南部历史测绘图 · 10°46′N 106°42′E'
      : 'TRẮC ĐỊA ĐÔNG NAM BỘ · 10°46′B 106°42′Đ';

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#162220] via-[#1A2528] to-[#101819] select-none overflow-hidden flex items-center justify-center">
      {/* Precision SVG Graticule, Neatline Border & Engraved Compass Rose */}
      <svg
        viewBox="0 0 480 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <radialGradient id="cartoVignettePlate" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#C9A46A" stopOpacity="0.11" />
            <stop offset="100%" stopColor="#0B1112" stopOpacity="0.50" />
          </radialGradient>
        </defs>
        <rect width="480" height="300" fill="url(#cartoVignettePlate)" />

        {/* Latitude / Longitude Graticule Lines */}
        <g stroke="#C9A46A" strokeOpacity="0.22" strokeWidth="0.6">
          {[48, 96, 144, 192, 240, 288, 336, 384, 432].map((x) => (
            <line key={`v-${x}`} x1={x} y1="14" x2={x} y2="286" />
          ))}
          {[50, 100, 150, 200, 250].map((y) => (
            <line key={`h-${y}`} x1="14" y1={y} x2="466" y2={y} />
          ))}
        </g>

        {/* Subtle Geodesic Triangulation Arcs */}
        <g fill="none" stroke="#C9A46A" strokeOpacity="0.18" strokeWidth="0.7" strokeDasharray="3 4">
          <circle cx="240" cy="150" r="88" />
          <circle cx="240" cy="150" r="132" />
          <line x1="14" y1="150" x2="466" y2="150" />
          <line x1="240" y1="14" x2="240" y2="286" />
        </g>

        {/* Double Archival Neatline Frame */}
        <rect
          x="10"
          y="10"
          width="460"
          height="280"
          fill="none"
          stroke="#C9A46A"
          strokeOpacity="0.44"
          strokeWidth="1"
        />
        <rect
          x="15"
          y="15"
          width="450"
          height="270"
          fill="none"
          stroke="#C9A46A"
          strokeOpacity="0.22"
          strokeWidth="0.6"
        />

        {/* Corner Registration Marks */}
        <g stroke="#C9A46A" strokeOpacity="0.58" strokeWidth="1">
          <path d="M22 28 V22 H28" fill="none" />
          <path d="M458 28 V22 H452" fill="none" />
          <path d="M22 272 V278 H28" fill="none" />
          <path d="M458 272 V278 H452" fill="none" />
        </g>

        {/* Engraved Compass Rose (Top-Right) */}
        <g transform="translate(418 68)" stroke="#C9A46A" fill="none">
          <circle cx="0" cy="0" r="24" strokeOpacity="0.36" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="19" strokeOpacity="0.20" strokeWidth="0.6" strokeDasharray="2 2" />
          <path
            d="M0 -28 L4 -4 L28 0 L4 4 L0 28 L-4 4 L-28 0 L-4 -4 Z"
            strokeOpacity="0.68"
            strokeWidth="0.9"
            fill="#C9A46A"
            fillOpacity="0.12"
          />
          <path
            d="M-14 -14 L-2 -2 M14 -14 L2 -2 M14 14 L2 2 M-14 14 L-2 2"
            strokeOpacity="0.42"
            strokeWidth="0.7"
          />
          <circle cx="0" cy="0" r="2.2" fill="#C9A46A" fillOpacity="0.82" />
          <text
            x="0"
            y="-31"
            textAnchor="middle"
            fill="#C9A46A"
            fillOpacity="0.88"
            fontSize="8"
            fontFamily="serif"
            letterSpacing="1"
          >
            N
          </text>
        </g>
      </svg>

      {/* Top-Left Archive Repository Seal */}
      <div className="absolute top-4 left-5 z-10 flex flex-col gap-0.5">
        <span className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-[var(--color-heritage-gold)]">
          {archiveCode}
        </span>
        <span className="font-mono text-[9px] tracking-[0.14em] text-[#D8C9A9]/60 tabular-nums">
          {accessionCode}
        </span>
      </div>

      {/* Central Monumental Chronology */}
      <div className="relative z-10 text-center px-6">
        <div className="inline-flex items-center gap-3 mb-1.5">
          <span className="w-8 h-[1px] bg-[#C9A46A]/45" />
          <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-[#D8C9A9]/75">
            {lang === 'en'
              ? 'CARTOGRAPHIC PLATE'
              : lang === 'zh'
              ? '历史舆图底版'
              : 'ĐỒ BẢN LƯU TRỮ'}
          </span>
          <span className="w-8 h-[1px] bg-[#C9A46A]/45" />
        </div>
        <div className="font-serif text-4xl sm:text-[44px] font-normal text-[#F7F3EB] tracking-[0.06em] tabular-nums leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
          {yearDisplay}
        </div>
      </div>

      {/* Bottom Geodesic Scale Legend */}
      <div className="absolute bottom-4 inset-x-5 z-10 flex items-center justify-between gap-2 text-[9px] font-mono tracking-[0.14em] text-[#D8C9A9]/65">
        <span className="truncate">{regionLabel}</span>
        <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
          <span className="w-4 h-[2px] bg-[#C9A46A]/65" />
          <span className="w-4 h-[2px] bg-[#C9A46A]/20" />
          <span className="w-4 h-[2px] bg-[#C9A46A]/65" />
        </div>
      </div>
    </div>
  );
};

/**
 * Miniature engraved cartographic plate used strictly inside the 60% index list
 * for historical map entries so maps never borrow monument facade photography.
 */
const MiniCartographicThumb: React.FC = () => (
  <div
    aria-hidden="true"
    className="w-full h-full bg-gradient-to-br from-[#172422] via-[#1B272B] to-[#11191A] flex items-center justify-center relative"
  >
    <svg viewBox="0 0 56 38" className="w-full h-full">
      <rect x="2.5" y="2.5" width="51" height="33" fill="none" stroke="#C9A46A" strokeOpacity="0.4" strokeWidth="0.7" />
      <line x1="28" y1="3" x2="28" y2="35" stroke="#C9A46A" strokeOpacity="0.22" strokeWidth="0.6" />
      <line x1="3" y1="19" x2="53" y2="19" stroke="#C9A46A" strokeOpacity="0.22" strokeWidth="0.6" />
      <circle cx="28" cy="19" r="9" fill="none" stroke="#C9A46A" strokeOpacity="0.45" strokeWidth="0.7" strokeDasharray="2 2" />
      <path d="M28 11 L29.8 17.2 L36 19 L29.8 20.8 L28 27 L26.2 20.8 L20 19 L26.2 17.2 Z" fill="#C9A46A" fillOpacity="0.72" />
    </svg>
  </div>
);

export const MediaCreditsModal: React.FC<MediaCreditsModalProps> = ({
  isOpen,
  onClose,
  sites,
  initialSiteId = null,
  initialCategory = 'ALL',
}) => {
  const { lang, setLang, getLocalizedSite } = useI18n();
  const credits = useMediaCredits();
  const { getSitePhoto } = useHeritageRealPhotos();

  const [activeCategory, setActiveCategory] = useState<FilterCategory>(initialCategory);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [citationFormat, setCitationFormat] = useState<CitationFormat>('archival');
  const [failedPrimaryMedia, setFailedPrimaryMedia] = useState<Record<string, boolean>>({});
  const [lightboxItem, setLightboxItem] = useState<LightboxSpecimen | null>(null);
  const [lightboxZoomed, setLightboxZoomed] = useState<boolean>(false);

  const listContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedSiteId(initialSiteId || 'ALL');
    setActiveCategory(initialCategory || 'ALL');
    setSearchQuery('');
    setCopiedId(null);
    setLightboxItem(null);
    setLightboxZoomed(false);
    setMobileDrawerOpen(false);
    setSelectedCreditId(null);
  }, [isOpen, initialSiteId, initialCategory]);

  useEffect(() => {
    if (!copiedId) return;
    const timer = window.setTimeout(() => setCopiedId(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  const siteInfoMap = useMemo(() => {
    const map = new Map<string, { code: string; name: string; site: HeritageSite }>();
    sites.forEach((site, idx) => {
      const loc = getLocalizedSite(site);
      const num = SITE_ID_TO_VIDEO_KEY[site.id] || String(idx + 1).padStart(2, '0');
      map.set(site.id, {
        code: num,
        name: loc.officialName,
        site,
      });
    });
    return map;
  }, [sites, getLocalizedSite]);

  // Deterministic accession codes (e.g. ARC-01·IMG-01, ARC-REG·MAP-01)
  const accessionCodeMap = useMemo(() => {
    const counts = new Map<string, number>();
    const totals = new Map<string, number>();

    const makeGroupKey = (item: MediaCreditItem) => {
      const siteCode =
        item.siteId === 'ALL' ? 'REG' : siteInfoMap.get(item.siteId)?.code || 'GEN';
      const catTag =
        item.category === 'image' ? 'IMG' : item.category === 'video' ? 'VID' : 'MAP';
      return `${siteCode}·${catTag}`;
    };

    credits.forEach((item) => {
      const key = makeGroupKey(item);
      totals.set(key, (totals.get(key) || 0) + 1);
    });

    const result = new Map<string, string>();
    credits.forEach((item) => {
      const key = makeGroupKey(item);
      const nextIdx = (counts.get(key) || 0) + 1;
      counts.set(key, nextIdx);
      const total = totals.get(key) || 1;
      const suffix = total > 1 ? `-${String(nextIdx).padStart(2, '0')}` : '';
      result.set(item.id, `ARC-${key}${suffix}`);
    });

    return result;
  }, [credits, siteInfoMap]);

  const getLocalizedField = useCallback(
    (item: MediaCreditItem, field: 'title' | 'sourceAuthor' | 'licenseNote'): string => {
      if (field === 'title') {
        if (lang === 'en') return item.titleEn || item.title;
        if (lang === 'zh') return item.titleZh || item.title;
        return item.title;
      }
      if (field === 'sourceAuthor') {
        if (lang === 'en') return item.sourceAuthorEn || item.sourceAuthor;
        if (lang === 'zh') return item.sourceAuthorZh || item.sourceAuthor;
        return item.sourceAuthor;
      }
      if (lang === 'en') return item.licenseNoteEn || item.licenseNote;
      if (lang === 'zh') return item.licenseNoteZh || item.licenseNote;
      return item.licenseNote;
    },
    [lang]
  );

  const getCategoryDisplayName = useCallback(
    (category: MediaCreditCategory): string => {
      if (category === 'image') {
        return lang === 'en' ? 'Archival Photograph' : lang === 'zh' ? '档案影像' : 'Hình ảnh tư liệu';
      }
      if (category === 'video') {
        return lang === 'en' ? 'Documentary Video' : lang === 'zh' ? '专题影像视频' : 'Video / Phim tài liệu';
      }
      return lang === 'en' ? 'Historical Map & Archive' : lang === 'zh' ? '历史舆图与档案' : 'Bản đồ & Lưu trữ';
    },
    [lang]
  );

  const getSiteDisplay = useCallback(
    (item: MediaCreditItem): string => {
      const siteInfo = siteInfoMap.get(item.siteId);
      if (siteInfo) {
        return `${siteInfo.code} · ${siteInfo.name}`;
      }
      return lang === 'en'
        ? 'Southeast Vietnam Regional Archive'
        : lang === 'zh'
        ? '越南东南部区域综合档案'
        : 'Lưu trữ Toàn vùng Đông Nam Bộ';
    },
    [siteInfoMap, lang]
  );

  const resolveSitePhotoFallback = useCallback(
    (targetSiteId: string, slot: 0 | 1 = 0): string | null => {
      const resolved = getSitePhoto(targetSiteId, slot);
      if (resolved) return resolved;
      const siteObj = siteInfoMap.get(targetSiteId)?.site;
      return siteObj?.photos?.[slot] || siteObj?.photos?.[0] || null;
    },
    [getSitePhoto, siteInfoMap]
  );

  /**
   * Resolves media strictly by archival category:
   * - image: exact slot photograph (0 or 1) of the monument
   * - video: YouTube frame (with monument photo fallback)
   * - map_archive: ONLY a true direct map image file if provided — NEVER borrows building facade photos
   */
  const resolveInspectorMedia = useCallback(
    (item: MediaCreditItem): { kind: 'photo' | 'video' | 'cartographic_plate'; src: string | null } => {
      const primaryFailed = Boolean(failedPrimaryMedia[item.id]);

      if (item.category === 'image') {
        if (item.siteId !== 'ALL') {
          const isSecondSlot =
            item.id.endsWith('-b') || item.id.includes('slot-1') || item.id.includes('slot2');
          const slotIndex: 0 | 1 = isSecondSlot ? 1 : 0;
          const slotPhoto = resolveSitePhotoFallback(item.siteId, slotIndex);
          if (slotPhoto && !primaryFailed) {
            return { kind: 'photo', src: slotPhoto };
          }
        }
        if (!primaryFailed && isDirectImageUrl(item.url)) {
          return { kind: 'photo', src: item.url || null };
        }
        if (item.siteId !== 'ALL') {
          const fallback = resolveSitePhotoFallback(item.siteId, 0);
          if (fallback && !primaryFailed) {
            return { kind: 'photo', src: fallback };
          }
        }
        return { kind: 'photo', src: null };
      }

      if (item.category === 'video') {
        const ytId = extractYouTubeVideoId(item.url);
        if (ytId && !primaryFailed) {
          return { kind: 'video', src: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` };
        }
        if (item.siteId !== 'ALL') {
          return { kind: 'video', src: resolveSitePhotoFallback(item.siteId, 0) };
        }
        return { kind: 'video', src: null };
      }

      if (!primaryFailed && isDirectImageUrl(item.url)) {
        return { kind: 'photo', src: item.url || null };
      }
      return { kind: 'cartographic_plate', src: null };
    },
    [failedPrimaryMedia, resolveSitePhotoFallback]
  );

  const buildCitation = useCallback(
    (
      item: MediaCreditItem,
      siteDisplay: string,
      accessionCode: string,
      format: CitationFormat
    ): string => {
      const title = getLocalizedField(item, 'title');
      const source = getLocalizedField(item, 'sourceAuthor');
      const license = getLocalizedField(item, 'licenseNote');
      const year = item.yearOrPeriod || (lang === 'en' ? 'n.d.' : lang === 'zh' ? '年代不详' : 'kh.n.');
      const urlSegment = item.url ? ` ${item.url}` : '';

      if (format === 'apa') {
        const mediaTag =
          item.category === 'video'
            ? lang === 'en'
              ? '[Documentary video]'
              : lang === 'zh'
              ? '[专题影像]'
              : '[Phim tư liệu]'
            : item.category === 'map_archive'
            ? lang === 'en'
              ? '[Archival map]'
              : lang === 'zh'
              ? '[历史舆图]'
              : '[Bản đồ lưu trữ]'
            : lang === 'en'
            ? '[Archival photograph]'
            : lang === 'zh'
            ? '[档案照片]'
            : '[Ảnh tư liệu]';

        return `${source} (${year}). ${title} ${mediaTag}. ${siteDisplay}. Dấu Ấn Việt 3D.${urlSegment}`;
      }

      const period = item.yearOrPeriod ? ` (${item.yearOrPeriod})` : '';
      if (lang === 'en') {
        return `${source}. "${title}"${period}. ${siteDisplay}. ${license}. Archival ID: ${accessionCode}. Dau An Viet 3D Heritage Archive.${urlSegment}`;
      }
      if (lang === 'zh') {
        return `${source}. 《${title}》${period}. ${siteDisplay}. ${license}. 档案编号：${accessionCode}. Dấu Ấn Việt 3D 数字文化遗产档案馆。${urlSegment}`;
      }
      return `${source}. "${title}"${period}. ${siteDisplay}. ${license}. Ký hiệu lưu trữ: ${accessionCode}. Phụ lục Lưu trữ Dấu Ấn Việt 3D.${urlSegment}`;
    },
    [getLocalizedField, lang]
  );

  const categoryCounts = useMemo(() => {
    const scoped =
      selectedSiteId === 'ALL'
        ? credits
        : credits.filter((c) => c.siteId === selectedSiteId || c.siteId === 'ALL');
    return {
      ALL: scoped.length,
      image: scoped.filter((c) => c.category === 'image').length,
      video: scoped.filter((c) => c.category === 'video').length,
      map_archive: scoped.filter((c) => c.category === 'map_archive').length,
    };
  }, [credits, selectedSiteId]);

  const filteredCredits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return credits.filter((item) => {
      if (activeCategory !== 'ALL' && item.category !== activeCategory) {
        return false;
      }
      if (selectedSiteId !== 'ALL') {
        const matchesSite =
          item.siteId === selectedSiteId ||
          (activeCategory === 'map_archive' && item.siteId === 'ALL');
        if (!matchesSite) return false;
      }
      if (!q) return true;
      const siteInfo = siteInfoMap.get(item.siteId);
      const accession = accessionCodeMap.get(item.id) || '';
      const haystack = [
        accession,
        item.title,
        item.titleEn || '',
        item.titleZh || '',
        item.sourceAuthor,
        item.sourceAuthorEn || '',
        item.sourceAuthorZh || '',
        item.licenseNote,
        item.licenseNoteEn || '',
        item.licenseNoteZh || '',
        item.yearOrPeriod || '',
        siteInfo?.name || '',
        siteInfo?.code || '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [credits, activeCategory, selectedSiteId, searchQuery, siteInfoMap, accessionCodeMap]);

  const activeIndex = useMemo(() => {
    if (filteredCredits.length === 0) return -1;
    if (selectedCreditId) {
      const idx = filteredCredits.findIndex((c) => c.id === selectedCreditId);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [filteredCredits, selectedCreditId]);

  const activeItem = activeIndex >= 0 ? filteredCredits[activeIndex] : null;

  useEffect(() => {
    if (filteredCredits.length === 0) {
      if (selectedCreditId !== null) setSelectedCreditId(null);
      return;
    }
    if (!selectedCreditId || !filteredCredits.some((c) => c.id === selectedCreditId)) {
      setSelectedCreditId(filteredCredits[0].id);
    }
  }, [filteredCredits, selectedCreditId]);

  // All inspectable photo specimens in current filter (for Lightbox Prev/Next browsing)
  const lightboxableItems = useMemo(() => {
    return filteredCredits
      .map((item) => {
        const media = resolveInspectorMedia(item);
        if (media.kind !== 'photo' || !media.src) return null;
        const accessionCode = accessionCodeMap.get(item.id) || 'ARC';
        const siteInfo = siteInfoMap.get(item.siteId);
        const siteDisplay = getSiteDisplay(item);
        return {
          id: item.id,
          src: media.src,
          accessionCode,
          yearDisplay: extractChronologyDisplay(item, siteInfo?.site, lang),
          title: getLocalizedField(item, 'title'),
          siteDisplay,
          sourceAuthor: getLocalizedField(item, 'sourceAuthor'),
          licenseNote: getLocalizedField(item, 'licenseNote'),
          url: item.url,
          citation: buildCitation(item, siteDisplay, accessionCode, citationFormat),
        } as LightboxSpecimen;
      })
      .filter((x): x is LightboxSpecimen => x !== null);
  }, [
    filteredCredits,
    resolveInspectorMedia,
    accessionCodeMap,
    siteInfoMap,
    getSiteDisplay,
    lang,
    getLocalizedField,
    buildCitation,
    citationFormat,
  ]);

  const scrollItemIntoView = useCallback((creditId: string) => {
    const container = listContainerRef.current;
    if (!container) return;
    const row = container.querySelector<HTMLElement>(`[data-credit-row="${CSS.escape(creditId)}"]`);
    if (row) {
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, []);

  const stepActiveItem = useCallback(
    (delta: -1 | 1) => {
      if (filteredCredits.length === 0 || activeIndex < 0) return;
      const nextIdx = Math.min(Math.max(activeIndex + delta, 0), filteredCredits.length - 1);
      if (nextIdx === activeIndex) return;
      const nextItem = filteredCredits[nextIdx];
      setSelectedCreditId(nextItem.id);
      scrollItemIntoView(nextItem.id);
    },
    [filteredCredits, activeIndex, scrollItemIntoView]
  );

  const stepLightboxItem = useCallback(
    (delta: -1 | 1) => {
      if (!lightboxItem || lightboxableItems.length <= 1) return;
      const currentIdx = lightboxableItems.findIndex((x) => x.id === lightboxItem.id);
      if (currentIdx < 0) return;
      const nextIdx = (currentIdx + delta + lightboxableItems.length) % lightboxableItems.length;
      const nextSpecimen = lightboxableItems[nextIdx];
      setLightboxItem(nextSpecimen);
      setLightboxZoomed(false);
      setSelectedCreditId(nextSpecimen.id);
      scrollItemIntoView(nextSpecimen.id);
    },
    [lightboxItem, lightboxableItems, scrollItemIntoView]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTypingField =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (e.key === 'Escape') {
        if (lightboxItem) {
          setLightboxItem(null);
          setLightboxZoomed(false);
        } else if (mobileDrawerOpen) {
          setMobileDrawerOpen(false);
        } else {
          onClose();
        }
        return;
      }

      if (lightboxItem) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          stepLightboxItem(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          stepLightboxItem(1);
        }
        return;
      }

      if (isTypingField) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        stepActiveItem(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        stepActiveItem(-1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, lightboxItem, mobileDrawerOpen, onClose, stepActiveItem, stepLightboxItem]);

  if (!isOpen) return null;

  const categoryTabs: Array<{
    id: FilterCategory;
    label: string;
    count: number;
  }> = [
    {
      id: 'ALL',
      label: lang === 'en' ? 'All' : lang === 'zh' ? '全部' : 'Tất cả',
      count: categoryCounts.ALL,
    },
    {
      id: 'image',
      label: lang === 'en' ? 'Photographs' : lang === 'zh' ? '档案影像' : 'Hình ảnh',
      count: categoryCounts.image,
    },
    {
      id: 'video',
      label: lang === 'en' ? 'Video' : lang === 'zh' ? '专题视频' : 'Video',
      count: categoryCounts.video,
    },
    {
      id: 'map_archive',
      label: lang === 'en' ? 'Maps & Archives' : lang === 'zh' ? '舆图档案' : 'Bản đồ',
      count: categoryCounts.map_archive,
    },
  ];

  const handleCopyCitation = async (itemId: string, citationText: string) => {
    const ok = await copyTextToClipboard(citationText);
    if (ok) {
      setCopiedId(itemId);
    }
  };

  const handleSelectRow = (itemId: string, openMobileSheet: boolean) => {
    setSelectedCreditId(itemId);
    if (openMobileSheet) {
      setMobileDrawerOpen(true);
    }
  };

  const renderInspectorPanel = (item: MediaCreditItem, isMobileSheet = false) => {
    const accessionCode = accessionCodeMap.get(item.id) || 'ARC';
    const siteInfo = siteInfoMap.get(item.siteId);
    const siteDisplay = getSiteDisplay(item);
    const title = getLocalizedField(item, 'title');
    const sourceAuthor = getLocalizedField(item, 'sourceAuthor');
    const licenseNote = getLocalizedField(item, 'licenseNote');
    const yearDisplay = extractChronologyDisplay(item, siteInfo?.site, lang);
    const media = resolveInspectorMedia(item);
    const citationText = buildCitation(item, siteDisplay, accessionCode, citationFormat);
    const isCopied = copiedId === item.id;

    const openLightbox = () => {
      if (media.kind !== 'photo' || !media.src) return;
      setLightboxZoomed(false);
      setLightboxItem({
        id: item.id,
        src: media.src,
        accessionCode,
        yearDisplay,
        title,
        siteDisplay,
        sourceAuthor,
        licenseNote,
        url: item.url,
        citation: citationText,
      });
    };

    const canPrev = activeIndex > 0;
    const canNext = activeIndex >= 0 && activeIndex < filteredCredits.length - 1;
    const positionLabel =
      filteredCredits.length > 0
        ? `${String(activeIndex + 1).padStart(2, '0')} / ${String(filteredCredits.length).padStart(2, '0')}`
        : '00 / 00';

    return (
      <div className="flex flex-col justify-between h-full gap-4">
        <div>
          {/* Desktop Curatorial Inspection Bar */}
          {!isMobileSheet && (
            <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-[#C9A46A]/15">
              <div className="flex items-center gap-2 min-w-0 text-[10.5px] tracking-[0.18em] uppercase">
                <span className="text-[var(--color-heritage-gold)] font-medium whitespace-nowrap">
                  {lang === 'en'
                    ? 'Curatorial Table'
                    : lang === 'zh'
                    ? '档案阅览台'
                    : 'Bàn soi tư liệu'}
                </span>
                <span className="text-[#D8C9A9]/30" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono tabular-nums text-[#D8C9A9]/65 whitespace-nowrap">
                  {positionLabel}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={!canPrev}
                  onClick={() => stepActiveItem(-1)}
                  aria-label={
                    lang === 'en' ? 'Previous record' : lang === 'zh' ? '上一条记录' : 'Mục tư liệu trước'
                  }
                  className="w-8 h-8 rounded-md border border-[#C9A46A]/20 hover:border-[#C9A46A]/55 disabled:opacity-30 disabled:cursor-not-allowed text-[#D8C9A9]/80 hover:text-[#F7F3EB] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.6} />
                </button>
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={() => stepActiveItem(1)}
                  aria-label={
                    lang === 'en' ? 'Next record' : lang === 'zh' ? '下一条记录' : 'Mục tư liệu kế tiếp'
                  }
                  className="w-8 h-8 rounded-md border border-[#C9A46A]/20 hover:border-[#C9A46A]/55 disabled:opacity-30 disabled:cursor-not-allowed text-[#D8C9A9]/80 hover:text-[#F7F3EB] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={1.6} />
                </button>
              </div>
            </div>
          )}

          {/* Exhibition Visual Frame (16:10 Museum Gallery Showcase) */}
          <div className="aspect-[16/10] w-full rounded-lg overflow-hidden border border-[#C9A46A]/28 bg-[#0B0C0B] shadow-[0_14px_34px_rgba(0,0,0,0.5)] relative mb-4 group">
            {media.kind === 'cartographic_plate' ? (
              <AntiqueCartographicPlate
                yearDisplay={yearDisplay}
                archiveCode={extractArchiveCodeLabel(item, lang)}
                accessionCode={accessionCode}
                lang={lang}
              />
            ) : media.kind === 'video' ? (
              <div className="relative w-full h-full bg-[#0B0C0B]">
                {media.src ? (
                  <img
                    src={media.src}
                    alt={title}
                    referrerPolicy="no-referrer"
                    onError={() => {
                      if (!failedPrimaryMedia[item.id]) {
                        setFailedPrimaryMedia((prev) => ({ ...prev, [item.id]: true }));
                      }
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#1B1D1B] to-[#0E0F0E]" />
                )}

                {/* Measured dark scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0A]/90 via-[#0A0B0A]/38 to-[#0A0B0A]/18" />

                {/* Centered thin-stroke antique gold play ring */}
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={
                      lang === 'en'
                        ? `Watch archival video: ${title}`
                        : lang === 'zh'
                        ? `播放档案视频：${title}`
                        : `Mở video tư liệu: ${title}`
                    }
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="w-14 h-14 rounded-full border border-[#C9A46A]/85 bg-[#141514]/70 backdrop-blur-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-hover:bg-[#141514]/90 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
                      <Play
                        className="w-5 h-5 text-[var(--color-heritage-gold)] translate-x-[1.5px]"
                        strokeWidth={1.5}
                      />
                    </span>
                  </a>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="w-14 h-14 rounded-full border border-[#C9A46A]/75 bg-[#141514]/70 flex items-center justify-center">
                      <Play
                        className="w-5 h-5 text-[var(--color-heritage-gold)] translate-x-[1.5px]"
                        strokeWidth={1.5}
                      />
                    </span>
                  </div>
                )}

                {/* Unboxed Bottom Video Provenance Scrim Line */}
                <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between gap-2 text-[10.5px] font-mono tracking-[0.12em] uppercase text-[#F7F3EB]/90 pointer-events-none">
                  <span className="truncate">{extractVideoChannelLabel(item, lang)}</span>
                  {item.yearOrPeriod && (
                    <span className="text-[var(--color-heritage-gold)] tabular-nums shrink-0">
                      {item.yearOrPeriod}
                    </span>
                  )}
                </div>
              </div>
            ) : media.src ? (
              <div className="relative w-full h-full bg-[#0B0C0B]">
                <img
                  src={media.src}
                  alt={title}
                  referrerPolicy="no-referrer"
                  onClick={openLightbox}
                  onError={() => {
                    if (!failedPrimaryMedia[item.id]) {
                      setFailedPrimaryMedia((prev) => ({ ...prev, [item.id]: true }));
                    }
                  }}
                  className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02]"
                />

                {/* Subtle museum mat inner frame */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2 border border-[#F7F3EB]/12 rounded-[4px]"
                />

                {/* Full-screen loupe inspection button */}
                <button
                  type="button"
                  onClick={openLightbox}
                  aria-label={
                    lang === 'en'
                      ? 'Enlarge image fullscreen'
                      : lang === 'zh'
                      ? '全屏放大查看影像'
                      : 'Soi ảnh toàn màn hình'
                  }
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#141514]/86 hover:bg-[#141514] border border-[#C9A46A]/45 text-[11px] font-medium text-[#F7F3EB] hover:text-[var(--color-heritage-gold)] backdrop-blur-md transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.6} />
                  <span>
                    {lang === 'en' ? 'Inspect' : lang === 'zh' ? '全屏细览' : 'Soi chi tiết'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#1C1D1B] to-[#111211]">
                <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--color-heritage-gold)] uppercase">
                  {accessionCode}
                </span>
                <p className="mt-2 font-serif text-base text-[#D8C9A9]/80 max-w-xs leading-snug">
                  {title}
                </p>
              </div>
            )}
          </div>

          {/* Unboxed Accession Metadata Lead Line */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono tracking-[0.11em] uppercase">
            <span className="text-[var(--color-heritage-gold)] font-medium">{accessionCode}</span>
            <span className="text-[#D8C9A9]/30" aria-hidden="true">
              ·
            </span>
            <span className="text-[#D8C9A9]/80 tabular-nums">{yearDisplay}</span>
            <span className="text-[#D8C9A9]/30" aria-hidden="true">
              ·
            </span>
            <span className="text-[#D8C9A9]/60">{getCategoryDisplayName(item.category)}</span>
          </div>

          {/* Full Monograph Serif Title (Never truncated, balanced wrapping) */}
          <h3 className="mt-2 text-[18px] sm:text-[19px] font-serif font-normal text-[#F7F3EB] leading-snug text-balance">
            {title}
          </h3>

          {/* Complete 4-Row Bibliographic Provenance Table (Zero truncation) */}
          <dl className="mt-4 border-y border-[#C9A46A]/16 divide-y divide-[#C9A46A]/10 text-xs">
            <div className="py-2.5 grid grid-cols-1 sm:grid-cols-[124px_1fr] gap-1 sm:gap-3">
              <dt className="text-[#D8C9A9]/55 text-[11px] font-medium pt-0.5">
                {lang === 'en' ? 'Monument' : lang === 'zh' ? '所属古迹' : 'Di tích'}
              </dt>
              <dd className="text-[#F7F3EB] leading-relaxed break-words">{siteDisplay}</dd>
            </div>

            <div className="py-2.5 grid grid-cols-1 sm:grid-cols-[124px_1fr] gap-1 sm:gap-3">
              <dt className="text-[#D8C9A9]/55 text-[11px] font-medium pt-0.5">
                {lang === 'en'
                  ? 'Archive & Author'
                  : lang === 'zh'
                  ? '馆藏单位与作者'
                  : 'Đơn vị & Tác giả'}
              </dt>
              <dd className="text-[#F7F3EB] leading-relaxed break-words">{sourceAuthor}</dd>
            </div>

            <div className="py-2.5 grid grid-cols-1 sm:grid-cols-[124px_1fr] gap-1 sm:gap-3">
              <dt className="text-[#D8C9A9]/55 text-[11px] font-medium pt-0.5">
                {lang === 'en'
                  ? 'Period / Runtime'
                  : lang === 'zh'
                  ? '年代与时长'
                  : 'Niên đại / Thời lượng'}
              </dt>
              <dd className="text-[#D8C9A9]/90 tabular-nums leading-relaxed break-words">
                {item.yearOrPeriod || yearDisplay}
              </dd>
            </div>

            <div className="py-2.5 grid grid-cols-1 sm:grid-cols-[124px_1fr] gap-1 sm:gap-3">
              <dt className="text-[#D8C9A9]/55 text-[11px] font-medium pt-0.5">
                {lang === 'en'
                  ? 'Copyright License'
                  : lang === 'zh'
                  ? '版权许可协议'
                  : 'Giấy phép bản quyền'}
              </dt>
              <dd className="text-[#D8C9A9]/90 leading-relaxed break-words">{licenseNote}</dd>
            </div>
          </dl>

          {/* Academic Citation Box with Format Switcher (Archival / APA) */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] tracking-[0.06em] text-[var(--color-heritage-gold)] font-medium">
                {lang === 'en'
                  ? 'Academic Citation'
                  : lang === 'zh'
                  ? '标准学术引用'
                  : 'Trích dẫn chuẩn học thuật'}
              </span>
              <div
                role="group"
                aria-label={
                  lang === 'en' ? 'Citation format' : lang === 'zh' ? '引文格式' : 'Định dạng trích dẫn'
                }
                className="inline-flex items-center rounded-md bg-[#0C0D0C] border border-[#C9A46A]/20 p-0.5 text-[10.5px]"
              >
                <button
                  type="button"
                  onClick={() => setCitationFormat('archival')}
                  className={`px-2 py-0.5 rounded-[4px] transition-colors cursor-pointer whitespace-nowrap ${
                    citationFormat === 'archival'
                      ? 'bg-[#C9A46A]/20 text-[#F7F3EB] font-medium'
                      : 'text-[#D8C9A9]/55 hover:text-[#F7F3EB]'
                  }`}
                >
                  {lang === 'en' ? 'Archival' : lang === 'zh' ? '馆藏体例' : 'Lưu trữ'}
                </button>
                <button
                  type="button"
                  onClick={() => setCitationFormat('apa')}
                  className={`px-2 py-0.5 rounded-[4px] transition-colors cursor-pointer whitespace-nowrap ${
                    citationFormat === 'apa'
                      ? 'bg-[#C9A46A]/20 text-[#F7F3EB] font-medium'
                      : 'text-[#D8C9A9]/55 hover:text-[#F7F3EB]'
                  }`}
                >
                  APA 7
                </button>
              </div>
            </div>
            <div className="bg-[#0D0E0D] border border-[#C9A46A]/18 rounded-lg p-3 text-xs text-[#D8C9A9]/82 italic leading-relaxed select-all break-words">
              {citationText}
            </div>
          </div>
        </div>

        {/* Action Strip */}
        <div
          className={`flex flex-wrap items-center gap-2.5 pt-2 ${
            isMobileSheet ? 'pb-1' : 'border-t border-[#C9A46A]/14 pt-4'
          }`}
        >
          <button
            type="button"
            onClick={() => void handleCopyCitation(item.id, citationText)}
            className={`flex-1 min-w-[146px] min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border ${
              isCopied
                ? 'bg-[var(--color-heritage-jade)] border-[var(--color-heritage-jade)] text-[#F7F3EB]'
                : 'bg-[#141514] border-[#C9A46A]/32 text-[#F7F3EB] hover:border-[#C9A46A] hover:text-[var(--color-heritage-gold)]'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                <span>
                  {lang === 'en' ? 'Copied' : lang === 'zh' ? '已复制引文' : 'Đã sao chép'}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 shrink-0 opacity-85" strokeWidth={1.6} />
                <span>
                  {lang === 'en'
                    ? 'Copy citation'
                    : lang === 'zh'
                    ? '复制学术引文'
                    : 'Sao chép trích dẫn'}
                </span>
              </>
            )}
          </button>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[146px] min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-heritage-gold)] hover:bg-[#D8B982] text-[#171817] text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <span>
                {lang === 'en'
                  ? 'Open original source'
                  : lang === 'zh'
                  ? '打开原始出处'
                  : 'Mở liên kết gốc'}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            </a>
          )}
        </div>
      </div>
    );
  };

  const lightboxIndex = lightboxItem
    ? lightboxableItems.findIndex((x) => x.id === lightboxItem.id)
    : -1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        lang === 'en'
          ? 'Archival Curatorial Inspector and Media Credits'
          : lang === 'zh'
          ? '博物馆双栏档案阅览室与版权目录'
          : 'Phòng Soi Tư liệu Bảo tàng & Bản quyền'
      }
      onClick={onClose}
      className="fixed inset-0 z-[1300] bg-[#080908]/82 backdrop-blur-lg flex items-center justify-center p-2 sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-[1280px] w-full h-[90vh] sm:h-[86vh] bg-[#141514]/96 bg-[radial-gradient(ellipse_at_0%_0%,rgba(201,164,106,0.09),transparent_48%),radial-gradient(ellipse_at_100%_100%,rgba(71,121,109,0.06),transparent_44%)] backdrop-blur-2xl border border-[#C9A46A]/32 rounded-2xl shadow-[0_32px_90px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-[#F7F3EB] animate-apple-sheet"
      >
        {/* Architectural Top Double Hairline (Vietnam Heritage Cinnabar + Antique Gold) */}
        <div aria-hidden="true" className="w-full shrink-0 flex flex-col">
          <div className="h-[2px] w-full bg-[var(--color-heritage-terracotta)]" />
          <div className="h-[1px] w-full bg-transparent" />
          <div className="h-[1px] w-full bg-[#C9A46A]/55" />
        </div>

        {/* ================================================================
            1. SINGLE-ROW COMPACT MUSEUM MASTHEAD
           ================================================================ */}
        <header className="px-4 sm:px-6 py-3.5 border-b border-[#C9A46A]/15 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.22em] text-[var(--color-heritage-gold)] uppercase font-medium truncate">
              {lang === 'en'
                ? 'HERITAGE ARCHIVAL ANNEX · DAU AN VIET 3D'
                : lang === 'zh'
                ? '文化遗产档案附录 · DẤU ẤN VIỆT 3D'
                : 'PHỤ LỤC LƯU TRỮ DI SẢN · DẤU ẤN VIỆT 3D'}
            </p>
            <h2 className="mt-0.5 text-xl sm:text-2xl md:text-[26px] font-serif font-normal text-[#F7F3EB] tracking-tight leading-tight">
              {lang === 'en'
                ? 'Archival & Media Credits'
                : lang === 'zh'
                ? '文献资料与版权目录'
                : 'Nguồn Tư liệu & Bản quyền'}
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Synchronized Trilingual Switcher (VI | EN | ZH) */}
            <div
              role="group"
              aria-label="Language"
              className="inline-flex items-center text-[11px] tracking-[0.14em] uppercase"
            >
              {(['vi', 'en', 'zh'] as const).map((code, idx) => (
                <React.Fragment key={code}>
                  {idx > 0 && (
                    <span className="mx-1.5 text-[#C9A46A]/25 select-none" aria-hidden="true">
                      |
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setLang(code)}
                    className={`px-1 py-1.5 transition-colors cursor-pointer ${
                      lang === code
                        ? 'text-[var(--color-heritage-gold)] font-semibold underline decoration-[var(--color-heritage-gold)] decoration-2 underline-offset-4'
                        : 'text-[#D8C9A9]/48 hover:text-[#F7F3EB]'
                    }`}
                  >
                    {code}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={
                lang === 'en'
                  ? 'Close archival inspector'
                  : lang === 'zh'
                  ? '关闭档案阅览室'
                  : 'Đóng cổng nguồn tư liệu'
              }
              className="w-10 h-10 rounded-lg border border-[#C9A46A]/22 hover:border-[#C9A46A]/65 text-[#D8C9A9]/75 hover:text-[#F7F3EB] flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C9A46A]"
            >
              <X className="w-4 h-4" strokeWidth={1.6} />
            </button>
          </div>
        </header>

        {/* ================================================================
            2. UNIFIED SINGLE-BAND CONTROL TOOLBAR
           ================================================================ */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#181917]/95 border-b border-[#C9A46A]/15 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-5">
            {/* Left: Minimalist Text Category Tabs with Antique Gold Underline */}
            <nav
              role="tablist"
              aria-label={
                lang === 'en'
                  ? 'Archive categories'
                  : lang === 'zh'
                  ? '档案分类'
                  : 'Phân loại tư liệu'
              }
              className="flex items-center flex-nowrap overflow-x-auto heritage-scrollbar gap-5 sm:gap-6 py-0.5"
            >
              {categoryTabs.map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={`relative shrink-0 py-1.5 text-[13px] tracking-wide transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'font-medium text-[#F7F3EB]'
                        : 'font-normal text-[#D8C9A9]/55 hover:text-[#F7F3EB]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <sup
                      className={`ml-1 text-[10px] font-mono tabular-nums ${
                        isActive ? 'text-[var(--color-heritage-gold)] font-semibold' : 'text-[#D8C9A9]/42'
                      }`}
                    >
                      {tab.count}
                    </sup>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 right-0 -bottom-[2px] h-[2px] bg-[var(--color-heritage-gold)]"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right: Custom Searchable Monument Combobox + Dark Keyword Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2.5 shrink-0">
              <div className="lg:w-60 xl:w-64">
                <HeritageSiteSearchSelect
                  sites={sites}
                  value={selectedSiteId}
                  onChange={setSelectedSiteId}
                  includeAllOption
                  allOptionValue="ALL"
                  size="sm"
                  variant="dark"
                  ariaLabel={
                    lang === 'en'
                      ? 'Filter by heritage monument'
                      : lang === 'zh'
                      ? '按古迹筛选'
                      : 'Tìm kiếm và lọc theo di tích'
                  }
                />
              </div>

              <div className="lg:w-56 xl:w-64 relative flex items-center h-8 rounded-xl bg-[#101110] border border-[#C9A46A]/25 hover:border-[#C9A46A]/50 focus-within:border-[#C9A46A] px-2.5 transition-colors">
                <Search
                  className="w-3.5 h-3.5 text-[#C9A46A]/75 mr-2 shrink-0 pointer-events-none"
                  strokeWidth={1.6}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'en'
                      ? 'Search title, archive, year...'
                      : lang === 'zh'
                      ? '搜索题名、馆藏机构或年代...'
                      : 'Tìm tên tư liệu, nguồn, năm...'
                  }
                  className="flex-1 min-w-0 h-full bg-transparent text-xs text-[#F7F3EB] placeholder:text-[#D8C9A9]/42 focus:outline-none pr-1"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={
                      lang === 'en' ? 'Clear search' : lang === 'zh' ? '清除搜索' : 'Xóa từ khóa'
                    }
                    className="text-[#D8C9A9]/55 hover:text-[var(--color-heritage-gold)] cursor-pointer p-0.5 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.7} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            3. ASYMMETRIC SPLIT-PANE CURATORIAL WORKSPACE (60% / 40%)
           ================================================================ */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* LEFT PANE (60% Desktop / 100% Mobile): Curatorial Archival Index */}
          <div className="w-full md:w-[60%] flex flex-col min-h-0 bg-[#141514]/70">
            {/* Subtle Sticky Ledger Column Header */}
            <div className="hidden sm:grid sm:grid-cols-[72px_56px_1fr_auto] items-center gap-3.5 px-4 sm:px-6 py-2 border-b border-[#C9A46A]/12 bg-[#161715]/90 text-[10.5px] tracking-[0.12em] uppercase text-[#D8C9A9]/48 shrink-0 select-none">
              <span>{lang === 'en' ? 'Period' : lang === 'zh' ? '年代' : 'Niên đại'}</span>
              <span>{lang === 'en' ? 'Plate' : lang === 'zh' ? '图版' : 'Bản lưu'}</span>
              <span>
                {lang === 'en'
                  ? 'Title & Monument Provenance'
                  : lang === 'zh'
                  ? '档案题名与所属古迹'
                  : 'Nhan đề & Nguồn di tích'}
              </span>
              <span className="text-right">
                {lang === 'en' ? 'Accession' : lang === 'zh' ? '馆藏号' : 'Ký hiệu'}
              </span>
            </div>

            {/* Scrollable Catalog Entries */}
            <div
              ref={listContainerRef}
              className="flex-1 min-h-0 overflow-y-auto heritage-scrollbar divide-y divide-[#C9A46A]/10"
            >
              {filteredCredits.length === 0 ? (
                <div className="py-20 px-6 text-center space-y-3">
                  <p className="font-serif text-lg text-[#F7F3EB]">
                    {lang === 'en'
                      ? 'No matching archival records found.'
                      : lang === 'zh'
                      ? '未检索到符合条件的档案记录。'
                      : 'Không tìm thấy mục tư liệu phù hợp trong danh mục.'}
                  </p>
                  <p className="text-xs text-[#D8C9A9]/58 max-w-sm mx-auto leading-relaxed">
                    {lang === 'en'
                      ? 'Try clearing your keyword filter or switching back to all 17 monuments.'
                      : lang === 'zh'
                      ? '请尝试清除关键词或切换回全部 17 处文化遗产。'
                      : 'Hãy thử xóa từ khóa tìm kiếm hoặc chọn lại toàn bộ 17 di tích.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('ALL');
                      setSelectedSiteId('ALL');
                      setSearchQuery('');
                    }}
                    className="mt-1 inline-flex items-center px-4 py-2 rounded-lg border border-[#C9A46A]/45 text-xs font-medium text-[var(--color-heritage-gold)] hover:bg-[#C9A46A]/10 transition-colors cursor-pointer"
                  >
                    {lang === 'en'
                      ? 'Reset all filters'
                      : lang === 'zh'
                      ? '重置全部筛选'
                      : 'Đặt lại toàn bộ bộ lọc'}
                  </button>
                </div>
              ) : (
                filteredCredits.map((item) => {
                  const isSelected = activeItem?.id === item.id;
                  const siteInfo = siteInfoMap.get(item.siteId);
                  const siteDisplay = getSiteDisplay(item);
                  const title = getLocalizedField(item, 'title');
                  const sourceAuthor = getLocalizedField(item, 'sourceAuthor');
                  const yearDisplay = extractChronologyDisplay(item, siteInfo?.site, lang);
                  const categoryLabel = getCategoryDisplayName(item.category);
                  const accessionCode = accessionCodeMap.get(item.id) || 'ARC';
                  const rowMedia = resolveInspectorMedia(item);

                  return (
                    <button
                      key={item.id}
                      data-credit-row={item.id}
                      type="button"
                      onClick={() =>
                        handleSelectRow(
                          item.id,
                          typeof window !== 'undefined' && window.innerWidth < 768
                        )
                      }
                      aria-current={isSelected ? 'true' : undefined}
                      className={`w-full text-left px-4 sm:px-6 py-3.5 cursor-pointer transition-colors duration-150 grid grid-cols-[52px_1fr_auto] sm:grid-cols-[72px_56px_1fr_auto] items-center gap-3 sm:gap-3.5 focus-visible:outline-none focus-visible:bg-[#C9A46A]/12 ${
                        isSelected
                          ? 'bg-[#C9A46A]/[0.11] shadow-[inset_0_0_0_1px_rgba(201,164,106,0.28)]'
                          : 'hover:bg-[#C9A46A]/[0.045]'
                      }`}
                    >
                      {/* Chronology Column (Desktop / Tablet) */}
                      <span
                        className={`hidden sm:block font-serif text-[15px] tabular-nums leading-snug ${
                          isSelected ? 'text-[var(--color-heritage-gold)] font-medium' : 'text-[#C9A46A]/82'
                        }`}
                      >
                        {yearDisplay}
                      </span>

                      {/* Contact-Sheet Micro-Plate Thumbnail (56×38px) */}
                      <div
                        className={`w-[52px] h-[36px] sm:w-[56px] sm:h-[38px] rounded-[4px] overflow-hidden border bg-[#0E0F0E] shrink-0 relative ${
                          isSelected ? 'border-[#C9A46A]/70' : 'border-[#C9A46A]/22'
                        }`}
                      >
                        {rowMedia.kind === 'cartographic_plate' ? (
                          <MiniCartographicThumb />
                        ) : rowMedia.src ? (
                          <>
                            <img
                              src={rowMedia.src}
                              alt=""
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              onError={() => {
                                if (!failedPrimaryMedia[item.id]) {
                                  setFailedPrimaryMedia((prev) => ({ ...prev, [item.id]: true }));
                                }
                              }}
                              className="w-full h-full object-cover"
                            />
                            {rowMedia.kind === 'video' && (
                              <span
                                aria-hidden="true"
                                className="absolute inset-0 bg-black/45 flex items-center justify-center"
                              >
                                <Play
                                  className="w-3.5 h-3.5 text-[#F7F3EB] translate-x-[0.5px]"
                                  strokeWidth={1.8}
                                />
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full bg-[#191B19] flex items-center justify-center text-[9px] font-mono text-[#C9A46A]/65">
                            {item.category === 'video' ? 'VID' : 'IMG'}
                          </div>
                        )}
                      </div>

                      {/* Main Title & Unboxed Provenance Metadata */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 sm:hidden mb-0.5 text-[11px] font-serif text-[var(--color-heritage-gold)] tabular-nums">
                          <span>{yearDisplay}</span>
                          <span className="text-[#C9A46A]/35" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-mono text-[10px] text-[#D8C9A9]/60">
                            {accessionCode}
                          </span>
                        </div>
                        <div
                          className={`text-[14px] sm:text-[14.5px] font-medium leading-snug break-words ${
                            isSelected ? 'text-[#F7F3EB]' : 'text-[#F7F3EB]/88'
                          }`}
                        >
                          {title}
                        </div>
                        <div className="text-xs text-[#D8C9A9]/62 mt-1 leading-relaxed break-words">
                          <span>{siteDisplay}</span>
                          <span className="mx-1.5 text-[#C9A46A]/35" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-[#D8C9A9]/52">{categoryLabel}</span>
                          <span className="hidden xl:inline mx-1.5 text-[#C9A46A]/30" aria-hidden="true">
                            ·
                          </span>
                          <span className="hidden xl:inline text-[#D8C9A9]/45">{sourceAuthor}</span>
                        </div>
                      </div>

                      {/* Right Accession Index + Active Direction Indicator */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={`hidden sm:inline-block font-mono text-[10.5px] tracking-[0.06em] tabular-nums whitespace-nowrap ${
                            isSelected ? 'text-[var(--color-heritage-gold)]' : 'text-[#D8C9A9]/42'
                          }`}
                        >
                          {accessionCode}
                        </span>
                        <span className="shrink-0">
                          {isSelected ? (
                            <ArrowRight
                              className="w-4 h-4 text-[var(--color-heritage-gold)] hidden md:block"
                              strokeWidth={1.7}
                            />
                          ) : (
                            <span className="w-4 h-4 hidden md:block" aria-hidden="true" />
                          )}
                          <ChevronRight
                            className="w-4 h-4 text-[#C9A46A]/70 md:hidden"
                            strokeWidth={1.6}
                          />
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANE (40% Desktop): "Bàn Soi Tư liệu" Curatorial Inspection Table */}
          <aside className="hidden md:flex md:w-[40%] bg-[#111211]/95 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,164,106,0.08),transparent_52%)] border-l border-[#C9A46A]/18 p-5 lg:p-6 flex-col justify-between overflow-y-auto heritage-scrollbar">
            {activeItem ? (
              renderInspectorPanel(activeItem, false)
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <p className="font-serif text-base text-[#D8C9A9]/72">
                  {lang === 'en'
                    ? 'Select an entry on the left to inspect its full archival record.'
                    : lang === 'zh'
                    ? '请选择左侧目录中的任意条目以查阅完整档案详情。'
                    : 'Chọn một mục tư liệu bên trái để soi chi tiết hồ sơ và bản quyền.'}
                </p>
              </div>
            )}
          </aside>
        </div>

        {/* ================================================================
            4. QUIET ARCHIVAL COLOPHON FOOTER
           ================================================================ */}
        <footer className="px-4 sm:px-6 py-2.5 border-t border-[#C9A46A]/15 bg-[#101110]/95 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#D8C9A9]/58 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono tabular-nums tracking-wide">
              {lang === 'en'
                ? `${filteredCredits.length} / ${credits.length} catalogued entries`
                : lang === 'zh'
                ? `显示 ${filteredCredits.length} / ${credits.length} 条馆藏目录`
                : `Hiển thị ${filteredCredits.length} / ${credits.length} mục tư liệu lưu trữ`}
            </span>
            <span className="hidden md:inline text-[#C9A46A]/30" aria-hidden="true">
              ·
            </span>
            <span className="hidden md:inline text-[#D8C9A9]/42 font-mono text-[10.5px]">
              {lang === 'en'
                ? '↑ ↓ Browse · Esc Close'
                : lang === 'zh'
                ? '↑ ↓ 切换档案 · Esc 关闭'
                : '↑ ↓ Chuyển mục · Esc Đóng'}
            </span>
          </div>
          <span className="tracking-wide text-[#D8C9A9]/48">
            {lang === 'en'
              ? 'Non-commercial heritage education & research · Dau An Viet 3D'
              : lang === 'zh'
              ? '非商业文化遗产教育与研究 · Dấu Ấn Việt 3D'
              : 'Phục vụ giáo dục di sản & nghiên cứu phi thương mại · Dấu Ấn Việt 3D'}
          </span>
        </footer>
      </div>

      {/* ================================================================
          5. MOBILE BOTTOM SHEET INSPECTOR DRAWER (< 768px)
         ================================================================ */}
      {mobileDrawerOpen && activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={getLocalizedField(activeItem, 'title')}
          onClick={(e) => {
            e.stopPropagation();
            setMobileDrawerOpen(false);
          }}
          className="fixed inset-0 z-[1380] md:hidden bg-black/78 backdrop-blur-sm flex items-end"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[88vh] bg-[#141514] border-t border-[#C9A46A]/35 rounded-t-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-[#F7F3EB]"
          >
            {/* Top Handle & Drawer Header */}
            <div className="pt-2.5 pb-3 px-5 border-b border-[#C9A46A]/15 flex flex-col gap-2 shrink-0 bg-[#181917]">
              <div className="w-10 h-1 rounded-full bg-[#C9A46A]/35 mx-auto" aria-hidden="true" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[var(--color-heritage-gold)]">
                    {lang === 'en'
                      ? 'CURATORIAL TABLE'
                      : lang === 'zh'
                      ? '档案阅览台'
                      : 'BÀN SOI TƯ LIỆU'}
                  </span>
                  <span className="text-[#D8C9A9]/30" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[10.5px] font-mono tabular-nums text-[#D8C9A9]/65">
                    {String(activeIndex + 1).padStart(2, '0')} / {String(filteredCredits.length).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={activeIndex <= 0}
                    onClick={() => stepActiveItem(-1)}
                    aria-label={
                      lang === 'en' ? 'Previous record' : lang === 'zh' ? '上一条记录' : 'Mục trước'
                    }
                    className="w-9 h-9 rounded-lg border border-[#C9A46A]/25 disabled:opacity-30 text-[#D8C9A9]/80 hover:text-[#F7F3EB] flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" strokeWidth={1.6} />
                  </button>
                  <button
                    type="button"
                    disabled={activeIndex >= filteredCredits.length - 1}
                    onClick={() => stepActiveItem(1)}
                    aria-label={
                      lang === 'en' ? 'Next record' : lang === 'zh' ? '下一条记录' : 'Mục kế tiếp'
                    }
                    className="w-9 h-9 rounded-lg border border-[#C9A46A]/25 disabled:opacity-30 text-[#D8C9A9]/80 hover:text-[#F7F3EB] flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" strokeWidth={1.6} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    aria-label={
                      lang === 'en' ? 'Close detail drawer' : lang === 'zh' ? '关闭详情抽屉' : 'Đóng chi tiết tư liệu'
                    }
                    className="w-9 h-9 rounded-lg border border-[#C9A46A]/25 text-[#D8C9A9]/75 hover:text-[#F7F3EB] flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" strokeWidth={1.6} />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Detail Content */}
            <div className="flex-1 min-h-0 overflow-y-auto heritage-scrollbar p-5">
              {renderInspectorPanel(activeItem, true)}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          6. DARK MUSEUM FULL-SCREEN LIGHTBOX WITH OPTICAL ZOOM & STEPPER
         ================================================================ */}
      {lightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.title}
          onClick={(e) => {
            e.stopPropagation();
            setLightboxItem(null);
            setLightboxZoomed(false);
          }}
          className="fixed inset-0 z-[1450] bg-[#060706]/94 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141514] border border-[#C9A46A]/35 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-[0_32px_96px_rgba(0,0,0,0.96)] text-[#F7F3EB]"
          >
            {/* Top Bar */}
            <div className="px-4 sm:px-5 py-3 border-b border-[#C9A46A]/15 flex items-center justify-between gap-3 bg-[#181917]">
              <div className="flex items-center gap-2.5 min-w-0 text-xs">
                <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--color-heritage-gold)] shrink-0">
                  {lightboxItem.accessionCode}
                </span>
                <span className="text-[#C9A46A]/30" aria-hidden="true">
                  ·
                </span>
                <span className="font-serif text-[#D8C9A9] tabular-nums shrink-0">
                  {lightboxItem.yearDisplay}
                </span>
                <span className="text-[#C9A46A]/30 hidden sm:inline" aria-hidden="true">
                  ·
                </span>
                <span className="text-[#D8C9A9]/72 truncate hidden sm:inline">
                  {lightboxItem.siteDisplay}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {lightboxableItems.length > 1 && lightboxIndex >= 0 && (
                  <span className="hidden sm:inline-block mr-1.5 font-mono text-[11px] tabular-nums text-[#D8C9A9]/55">
                    {String(lightboxIndex + 1).padStart(2, '0')} / {String(lightboxableItems.length).padStart(2, '0')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setLightboxZoomed((prev) => !prev)}
                  aria-label={
                    lightboxZoomed
                      ? lang === 'en'
                        ? 'Reset zoom'
                        : lang === 'zh'
                        ? '还原比例'
                        : 'Thu về tỷ lệ gốc'
                      : lang === 'en'
                      ? 'Zoom in'
                      : lang === 'zh'
                      ? '放大细览'
                      : 'Phóng đại chi tiết'
                  }
                  className={`h-9 px-2.5 rounded-lg border text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    lightboxZoomed
                      ? 'border-[var(--color-heritage-gold)] bg-[#C9A46A]/15 text-[var(--color-heritage-gold)]'
                      : 'border-[#C9A46A]/25 text-[#D8C9A9]/80 hover:border-[#C9A46A] hover:text-[#F7F3EB]'
                  }`}
                >
                  {lightboxZoomed ? (
                    <ZoomOut className="w-3.5 h-3.5" strokeWidth={1.6} />
                  ) : (
                    <ZoomIn className="w-3.5 h-3.5" strokeWidth={1.6} />
                  )}
                  <span className="font-mono text-[11px] tabular-nums">
                    {lightboxZoomed ? '1.8×' : '1.0×'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLightboxItem(null);
                    setLightboxZoomed(false);
                  }}
                  aria-label={
                    lang === 'en' ? 'Close fullscreen view' : lang === 'zh' ? '关闭全屏预览' : 'Đóng xem toàn màn hình'
                  }
                  className="w-9 h-9 rounded-lg border border-[#C9A46A]/25 hover:border-[#C9A46A] text-[#D8C9A9]/75 hover:text-[#F7F3EB] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" strokeWidth={1.6} />
                </button>
              </div>
            </div>

            {/* Stage with Optical Zoom & Prev/Next Controls */}
            <div className="relative bg-[#0A0B0A] flex items-center justify-center max-h-[62vh] overflow-auto heritage-scrollbar p-3">
              {lightboxableItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => stepLightboxItem(-1)}
                    aria-label={
                      lang === 'en' ? 'Previous photograph' : lang === 'zh' ? '上一张影像' : 'Ảnh tư liệu trước'
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#141514]/82 hover:bg-[#141514] border border-[#C9A46A]/35 text-[#F7F3EB] hover:text-[var(--color-heritage-gold)] flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" strokeWidth={1.6} />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepLightboxItem(1)}
                    aria-label={
                      lang === 'en' ? 'Next photograph' : lang === 'zh' ? '下一张影像' : 'Ảnh tư liệu kế tiếp'
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#141514]/82 hover:bg-[#141514] border border-[#C9A46A]/35 text-[#F7F3EB] hover:text-[var(--color-heritage-gold)] flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" strokeWidth={1.6} />
                  </button>
                </>
              )}

              <img
                src={lightboxItem.src}
                alt={lightboxItem.title}
                referrerPolicy="no-referrer"
                onClick={() => setLightboxZoomed((prev) => !prev)}
                className={`rounded transition-transform duration-300 ease-out select-none ${
                  lightboxZoomed
                    ? 'max-w-none w-[155%] sm:w-[140%] cursor-zoom-out'
                    : 'max-w-full max-h-[58vh] object-contain cursor-zoom-in'
                }`}
              />
            </div>

            {/* Provenance & Actions */}
            <div className="p-4 sm:p-5 space-y-3 bg-[#171817] border-t border-[#C9A46A]/15">
              <h3 className="font-serif text-base sm:text-lg text-[#F7F3EB] leading-snug text-balance">
                {lightboxItem.title}
              </h3>
              <p className="text-xs leading-relaxed text-[#D8C9A9]/78">
                <span className="text-[var(--color-heritage-gold)] font-medium">
                  {lightboxItem.siteDisplay}
                </span>
                <span className="mx-1.5 text-[#C9A46A]/35">—</span>
                <span>{lightboxItem.sourceAuthor}</span>
                {lightboxItem.licenseNote && (
                  <>
                    <span className="mx-1.5 text-[#C9A46A]/35">·</span>
                    <span>{lightboxItem.licenseNote}</span>
                  </>
                )}
              </p>

              <div className="pt-3 border-t border-[#C9A46A]/12 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => void handleCopyCitation(lightboxItem.id, lightboxItem.citation)}
                  className={`min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    copiedId === lightboxItem.id
                      ? 'bg-[var(--color-heritage-jade)] border-[var(--color-heritage-jade)] text-[#F7F3EB]'
                      : 'bg-[#121312] border-[#C9A46A]/32 text-[#F7F3EB] hover:border-[#C9A46A]'
                  }`}
                >
                  {copiedId === lightboxItem.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>
                        {lang === 'en' ? 'Copied' : lang === 'zh' ? '已复制引文' : 'Đã sao chép'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 opacity-80" strokeWidth={1.6} />
                      <span>
                        {lang === 'en'
                          ? 'Copy citation'
                          : lang === 'zh'
                          ? '复制学术引文'
                          : 'Sao chép trích dẫn'}
                      </span>
                    </>
                  )}
                </button>

                {lightboxItem.url && (
                  <a
                    href={lightboxItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-heritage-gold)] hover:bg-[#D8B982] text-[#171817] text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <span>
                      {lang === 'en'
                        ? 'Open original source'
                        : lang === 'zh'
                        ? '打开原始出处'
                        : 'Mở liên kết gốc'}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaCreditsModal;
