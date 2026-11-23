import React, { useState, useMemo, useCallback } from 'react';
import { HeritageSite } from '../../types/heritage';
import { useI18n } from '../../i18n/I18nContext';
import { HeritageTypographicPlate } from '../common/HeritageTypographicPlate';
import { HeritageSmoothImage } from '../common/HeritageSmoothImage';
import { getHeritageColorBlock } from '../../utils/indochinePalette';
import { useMuseumTilt3D } from '../../utils/useMuseumTilt3D';
import { CustomPhotosMap, hasAnyCustomPhotoForSite } from '../../utils/wikimediaPhotoService';
import {
  HeritageRegionFilter,
  matchesHeritageSiteQuery,
} from '../../utils/heritageSearch';
import { HeritageSearchCombobox } from '../common/HeritageSiteDropdown';
import { CascadeRevealCard } from '../common/CascadeRevealCard';
import { ArchivalSourcesTrigger } from '../common/ArchivalSourcesTrigger';
import {
  MapPin,
  Box,
  Compass,
  Plus,
  Camera,
  Volume2,
  Film,
} from 'lucide-react';

interface HeritageCatalogProps {
  sites: HeritageSite[];
  onSelectSiteOnMap: (site: HeritageSite) => void;
  onOpen3D: (site: HeritageSite) => void;
  onOpenARAudio: (site: HeritageSite) => void;
  onOpenDetailModal: (site: HeritageSite) => void;
  onOpenVideo?: (site: HeritageSite) => void;
  customPhotosMap?: CustomPhotosMap;
  hiddenSiteIds?: string[];
  onOpenPhotoManager?: (site: HeritageSite) => void;
  onOpenMediaCredits?: () => void;
}

interface HeritageCatalogCardProps {
  site: HeritageSite;
  index: number;
  lang: string;
  officialName: string;
  summary: string;
  districtLabel: string;
  regionLabel: string;
  rankingLabel: string;
  hasCustomOverride: boolean;
  isHiddenForVisitors?: boolean;
  onOpenDetailModal: (site: HeritageSite) => void;
  onOpenPhotoManager?: (site: HeritageSite) => void;
  onOpen3D: (site: HeritageSite) => void;
  onOpenARAudio: (site: HeritageSite) => void;
  onOpenVideo?: (site: HeritageSite) => void;
  onSelectSiteOnMap: (site: HeritageSite) => void;
}

const HeritageCatalogCard: React.FC<HeritageCatalogCardProps> = React.memo(({
  site,
  index,
  lang,
  officialName,
  summary,
  districtLabel,
  regionLabel,
  rankingLabel,
  hasCustomOverride,
  isHiddenForVisitors = false,
  onOpenDetailModal,
  onOpenPhotoManager,
  onOpen3D,
  onOpenARAudio,
  onOpenVideo,
  onSelectSiteOnMap,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState<0 | 1>(0);
  const [imgFailed, setImgFailed] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(false);
  const mediaContainerRef = React.useRef<HTMLDivElement | null>(null);
  const rawPhoto = site.photos?.[activePhotoIdx] ?? (activePhotoIdx === 0 ? site.photos?.[0] : '') ?? '';
  React.useEffect(() => {
    setImgFailed(false);
  }, [rawPhoto, activePhotoIdx]);

  React.useEffect(() => {
    if (isCardVisible) return;
    const node = mediaContainerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsCardVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsCardVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px', threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isCardVisible]);

  const hasRealPhoto = Boolean(rawPhoto && !imgFailed);
  const tiltHandlers = useMuseumTilt3D(7);
  const block = getHeritageColorBlock(site, lang as 'vi' | 'en' | 'zh');

  return (
    <div className="group/dossier h-full rounded-[28px] [perspective:1000px] will-change-transform">
      <article
        onClick={() => onOpenDetailModal(site)}
        onMouseMove={tiltHandlers.onMouseMove}
        onMouseLeave={tiltHandlers.onMouseLeave}
        style={{ backgroundColor: block.bg, color: block.fg }}
        className="museum-tilt-card relative group h-full rounded-[28px] border border-[#171817]/20 group-hover/dossier:border-[#C9A46A]/85 flex flex-col overflow-hidden cursor-pointer shadow-[0_10px_28px_rgba(23,24,23,0.12)] group-hover/dossier:shadow-[0_26px_54px_-12px_rgba(23,24,23,0.28),0_10px_24px_-8px_rgba(201,164,106,0.26)]"
      >
        <div
          data-tilt-glow="true"
          className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300"
        />
      <div
        ref={mediaContainerRef}
        className="museum-tilt-z-img relative aspect-video w-full overflow-hidden bg-[#171817]"
        style={{ borderBottom: `1px solid ${block.hairline}` }}
      >
        {hasRealPhoto ? (
          <>
            {isCardVisible ? (
              <HeritageSmoothImage
                src={rawPhoto}
                alt={officialName}
                waitTone="dark"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover object-center transition-[opacity,transform] duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[#171817]" aria-hidden="true" />
            )}
            <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5 pr-20">
              <span className="px-3 py-1 rounded-full bg-[#F4EFE4]/95 border border-[#171817]/20 text-[11px] font-semibold text-[#171817]">
                {String(index + 1).padStart(2, '0')} · {regionLabel}
              </span>
              {hasCustomOverride && (
                <span className="px-2.5 py-1 rounded-full bg-[#C9A46A] text-[#171817] border border-[#171817]/25 text-[10px] font-semibold">
                  Custom
                </span>
              )}
              {isHiddenForVisitors && (
                <span className="px-2.5 py-1 rounded-full bg-[#171817] border border-[#C9A46A] text-[#C9A46A] text-[10px] font-semibold">
                  {lang === 'en'
                    ? 'Tester Preview · Hidden'
                    : lang === 'zh'
                    ? '隐藏草稿 · 测试模式'
                    : 'Đang ẩn · Chế độ Tester'}
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <HeritageTypographicPlate site={site} index={index} variant="catalog" />
            {(isHiddenForVisitors || hasCustomOverride) && (
              <div className="absolute bottom-3 left-4 flex flex-wrap items-center gap-2">
                {isHiddenForVisitors && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#171817] border border-[#C9A46A] text-[#C9A46A] text-[10px] font-semibold">
                    {lang === 'en'
                      ? 'Tester Preview · Hidden'
                      : lang === 'zh'
                      ? '隐藏草稿 · 测试模式'
                      : 'Đang ẩn · Chế độ Tester'}
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {/* Quick 01 | 02 photo toggle in top-right */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3.5 right-3.5 z-10 inline-flex items-center rounded-full bg-[#F4EFE4]/95 border border-[#171817]/25 p-0.5 shadow-sm"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActivePhotoIdx(0);
            }}
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-sans font-semibold tabular-nums transition-colors cursor-pointer ${
              activePhotoIdx === 0
                ? 'bg-[#171817] text-[#D8C9A9]'
                : 'text-[#171817]/75 hover:text-[#171817]'
            }`}
          >
            01
          </button>
          <span className="text-[#171817]/25 text-[10px] px-0.5 select-none" aria-hidden="true">
            |
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActivePhotoIdx(1);
            }}
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-sans font-semibold tabular-nums transition-colors cursor-pointer ${
              activePhotoIdx === 1
                ? 'bg-[#171817] text-[#D8C9A9]'
                : 'text-[#171817]/75 hover:text-[#171817]'
            }`}
          >
            02
          </button>
        </div>

        {onOpenPhotoManager && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPhotoManager(site);
            }}
            title={lang === 'en' ? 'Update real-world photo' : lang === 'zh' ? '更新实景照片' : 'Cập nhật ảnh chụp thực tế'}
            className="absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full bg-[#F4EFE4]/95 border border-[#171817]/20 text-[#171817] hover:bg-[#C9A46A] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="museum-tilt-preserve p-6 flex-1 flex flex-col justify-between">
        <div className="museum-tilt-z-title">
          <div className="flex items-center justify-between gap-2 font-sans text-xs font-medium mb-1.5">
            <span className="truncate tabular-nums" style={{ color: block.mutedFg }}>
              {site.identifierCode} · {rankingLabel}
            </span>
            <span className="tabular-nums shrink-0" style={{ color: block.mutedFg }}>
              {site.commencementYear}
            </span>
          </div>

          <h3
            className="font-serif text-xl sm:text-2xl font-medium tracking-tight leading-snug mb-2"
            style={{ fontVariantNumeric: 'lining-nums', color: block.fg }}
          >
            {officialName}
          </h3>

          <p className="font-sans text-xs flex items-start gap-1.5 mb-2" style={{ color: block.mutedFg }}>
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: block.fg }} />
            <span className="line-clamp-1">
              {districtLabel}, {site.address.city}
            </span>
          </p>

          <p className="font-sans text-xs sm:text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: block.mutedFg }}>
            {summary}
          </p>
        </div>

        <div
          className="pt-4 flex items-center justify-between gap-2"
          style={{ borderTop: `1px solid ${block.hairline}` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpen3D(site)}
              className="px-3.5 py-1.5 rounded-full bg-[#171817] hover:bg-[#171817]/90 text-[#D8C9A9] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenARAudio(site)}
              title={lang === 'en' ? 'Audio Guide' : lang === 'zh' ? '语音导览' : 'Thuyết minh'}
              style={{
                backgroundColor: block.badgeBg,
                color: block.badgeFg,
                borderColor: block.hairline,
              }}
              className="w-8 h-8 rounded-full border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            {onOpenVideo && (
              <button
                type="button"
                onClick={() => onOpenVideo(site)}
                title={
                  lang === 'en'
                    ? 'Documentary Video'
                    : lang === 'zh'
                    ? '历史纪录片'
                    : 'Video Tư Liệu'
                }
                style={{
                  backgroundColor: block.badgeBg,
                  color: block.badgeFg,
                  borderColor: block.hairline,
                }}
                className="px-2.5 h-8 rounded-full border text-[11px] font-medium flex items-center gap-1 transition-transform hover:scale-105 cursor-pointer whitespace-nowrap"
              >
                <Film className="w-3.5 h-3.5" />
                <span>
                  {lang === 'en' ? 'Video' : lang === 'zh' ? '视频' : 'Video Tư Liệu'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectSiteOnMap(site)}
              title={lang === 'en' ? 'Locate on Map' : lang === 'zh' ? '在地图定位' : 'Định vị trên Bản đồ'}
              style={{
                backgroundColor: block.badgeBg,
                color: block.badgeFg,
                borderColor: block.hairline,
              }}
              className="w-8 h-8 rounded-full border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenDetailModal(site)}
            title={lang === 'en' ? 'Open Dossier' : lang === 'zh' ? '打开档案' : 'Mở hồ sơ'}
            style={{
              backgroundColor: block.badgeBg,
              color: block.badgeFg,
              borderColor: block.hairline,
            }}
            className="w-9 h-9 rounded-full border flex items-center justify-center transition-transform group-hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      </article>
    </div>
  );
});

export const HeritageCatalog: React.FC<HeritageCatalogProps> = React.memo(({
  sites,
  onSelectSiteOnMap,
  onOpen3D,
  onOpenARAudio,
  onOpenDetailModal,
  onOpenVideo,
  customPhotosMap = {},
  hiddenSiteIds = [],
  onOpenPhotoManager,
  onOpenMediaCredits,
}) => {
  const { lang, t, formatDistrictName, getLocalizedSite } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRanking, setSelectedRanking] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  const getSiteRegionGroup = useCallback((site: HeritageSite): 'HCM' | 'BD' | 'BRVT' => {
    const cityStr = (site.address.city || '').toLowerCase();
    const idStr = site.id.toUpperCase();
    if (idStr.startsWith('BD-') || cityStr.includes('bình dương')) return 'BD';
    if (idStr.startsWith('BRVT-') || cityStr.includes('bà rịa') || cityStr.includes('vũng tàu')) return 'BRVT';
    return 'HCM';
  }, []);

  const getRegionLabel = useCallback((site: HeritageSite): string => {
    const grp = getSiteRegionGroup(site);
    if (grp === 'BD') return lang === 'en' ? 'Binh Duong' : lang === 'zh' ? '平阳省' : 'Bình Dương';
    if (grp === 'BRVT') return lang === 'en' ? 'Ba Ria - Vung Tau' : lang === 'zh' ? '巴地头顿省' : 'Bà Rịa - Vũng Tàu';
    return lang === 'en' ? 'Ho Chi Minh City' : lang === 'zh' ? '胡志明市' : 'TP. Hồ Chí Minh';
  }, [getSiteRegionGroup, lang]);

  const getRankingLabel = useCallback((level: HeritageSite['rankingLevel']): string => {
    if (level === 'Special National') {
      return lang === 'en' ? 'Special National' : lang === 'zh' ? '国家级特别遗迹' : 'Quốc gia Đặc biệt';
    }
    if (level === 'National') {
      return lang === 'en' ? 'National Monument' : lang === 'zh' ? '国家级遗迹' : 'Di tích Quốc gia';
    }
    return lang === 'en' ? 'Provincial / City' : lang === 'zh' ? '省市级遗迹' : 'Cấp Tỉnh / Thành phố';
  }, [lang]);

  const filteredSites = useMemo(() => {
    return sites.filter((site, idx) => {
      const locSite = getLocalizedSite(site);
      const matchesSearch = matchesHeritageSiteQuery({
        site,
        canonicalIndex: idx,
        rawQuery: searchQuery,
        localizedName: locSite.officialName,
        localizedFolkName: locSite.folkName,
        localizedSummary: locSite.summary,
      });

      const matchesRanking =
        selectedRanking === 'ALL' || site.rankingLevel === selectedRanking;

      const regionGroup = getSiteRegionGroup(site);
      const matchesRegion =
        selectedRegion === 'ALL' || regionGroup === selectedRegion;

      return matchesSearch && matchesRanking && matchesRegion;
    });
  }, [sites, searchQuery, selectedRanking, selectedRegion, getLocalizedSite, getSiteRegionGroup]);

  return (
    <div className="w-full bg-[#D8C9A9] text-[#171817]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="pb-8 border-b border-[#171817]/15">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[#A94F3D] mb-2">
                {lang === 'en'
                  ? 'Southeast Vietnam Heritage Dossiers'
                  : lang === 'zh'
                  ? '东南部历史建筑遗产名录'
                  : 'Hồ sơ Di sản Đông Nam Bộ'}
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-medium text-[#171817] tracking-tight leading-[1.08]">
                {lang === 'en'
                  ? 'Digital Heritage Dossiers.'
                  : lang === 'zh'
                  ? '数字化遗产档案库。'
                  : 'Danh Mục Hồ Sơ Di Sản Số.'}
              </h1>
              <p className="font-sans text-[#171817]/75 text-sm sm:text-base max-w-2xl mt-3 leading-relaxed">
                {lang === 'en'
                  ? 'Complete archival documentation, architectural drawings, verified Wikimedia Commons photography, and 3D digital twins of 17 representative monuments across Ho Chi Minh City, Binh Duong, and Ba Ria - Vung Tau.'
                  : lang === 'zh'
                  ? '完整收录胡志明市、平阳省与巴地头顿省17处代表性历史遗迹的建筑档案、维基共享资源实景照片及高精度3D数字孪生模型。'
                  : 'Hệ thống lưu trữ tư liệu lịch sử, bản vẽ kiến trúc, ảnh chụp thực tế Wikimedia Commons và mô hình số hóa 3D của 17 di tích tiêu biểu vùng TP. Hồ Chí Minh – Bình Dương – Bà Rịa - Vũng Tàu.'}
              </p>
            </div>

            <div className="flex items-center gap-6 rounded-[22px] border border-[#171817]/20 bg-[#EDE4D0] px-6 py-4 shrink-0">
              <div>
                <div className="text-xs font-medium text-[#171817]/70">
                  {lang === 'en' ? 'Showing Dossiers' : lang === 'zh' ? '显示档案' : 'Hiển thị hồ sơ'}
                </div>
                <div className="text-2xl font-semibold text-[#171817] tabular-nums mt-0.5">
                  {String(filteredSites.length).padStart(2, '0')}{' '}
                  <span className="text-sm font-normal text-[#171817]/65">
                    / {sites.length} {lang === 'en' ? 'sites' : lang === 'zh' ? '处' : 'di tích'}
                  </span>
                </div>
              </div>
              <div className="w-[1px] h-8 bg-[#171817]/15" />
              <div>
                <div className="text-xs font-medium text-[#171817]/70">
                  {lang === 'en' ? '3D Twins' : lang === 'zh' ? '3D模型' : 'Bản dựng 3D'}
                </div>
                <div className="text-2xl font-semibold text-[#A94F3D] tabular-nums mt-0.5">
                  100%{' '}
                  <span className="text-xs font-normal text-[#171817]/65">
                    {lang === 'en' ? 'Ready' : lang === 'zh' ? '就绪' : 'Sẵn sàng'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-6 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5">
          <HeritageSearchCombobox
            sites={sites}
            canonicalSites={sites}
            value={searchQuery}
            onChange={setSearchQuery}
            regionFilter={
              selectedRegion === 'ALL' ? 'all' : (selectedRegion as HeritageRegionFilter)
            }
            onRegionFilterChange={(reg) => setSelectedRegion(reg === 'all' ? 'ALL' : reg)}
            customPhotosMap={customPhotosMap}
            hiddenSiteIds={hiddenSiteIds}
            onSelectSite={(site) => onOpenDetailModal(site)}
            placeholder={
              lang === 'en'
                ? 'Search monument name, number (01–17), district...'
                : lang === 'zh'
                ? '搜索遗迹名称、编号 (01–17)、区域...'
                : 'Tìm kiếm tên di tích, mã số 01–17, địa danh...'
            }
            tone="light"
            className="flex-1 min-w-[240px]"
            inputClassName="py-2.5"
          />

          <div className="flex flex-wrap items-center gap-1 rounded-full bg-[#EDE4D0] border border-[#171817]/15 p-1">
            {[
              { id: 'ALL', label: lang === 'en' ? 'All' : lang === 'zh' ? '全部' : 'Tất cả' },
              {
                id: 'Special National',
                label: lang === 'en' ? 'Special National' : lang === 'zh' ? '国家级特别' : 'QG Đặc biệt',
              },
              {
                id: 'National',
                label: lang === 'en' ? 'National' : lang === 'zh' ? '国家级' : 'Quốc gia',
              },
              {
                id: 'City',
                label: lang === 'en' ? 'Provincial' : lang === 'zh' ? '省市级' : 'Cấp Tỉnh',
              },
            ].map((rank) => (
              <button
                key={rank.id}
                type="button"
                onClick={() => setSelectedRanking(rank.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  selectedRanking === rank.id
                    ? 'bg-[#A94F3D] text-[#D8C9A9]'
                    : 'text-[#171817]/75 hover:text-[#171817]'
                }`}
              >
                {rank.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-full bg-[#EDE4D0] border border-[#171817]/15 p-1">
            {[
              { id: 'ALL', label: lang === 'en' ? 'All Regions' : lang === 'zh' ? '全区域' : 'Toàn vùng' },
              { id: 'HCM', label: lang === 'en' ? 'HCMC' : lang === 'zh' ? '胡志明市' : 'TP.HCM' },
              { id: 'BD', label: lang === 'en' ? 'Binh Duong' : lang === 'zh' ? '平阳' : 'Bình Dương' },
              { id: 'BRVT', label: lang === 'en' ? 'Ba Ria - Vung Tau' : lang === 'zh' ? '巴地头顿' : 'BR-VT' },
            ].map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => setSelectedRegion(reg.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  selectedRegion === reg.id
                    ? 'bg-[#47796D] text-[#171817]'
                    : 'text-[#171817]/75 hover:text-[#171817]'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          {filteredSites.length === 0 ? (
            <div className="text-center py-20 rounded-[28px] border border-[#171817]/15 bg-[#F4EFE4]">
              <Compass className="w-10 h-10 text-[#A94F3D] mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-[#171817] mb-1">
                {lang === 'en'
                  ? 'No monuments match this search keyword'
                  : lang === 'zh'
                  ? '未找到符合该关键词的遗迹'
                  : 'Không tìm thấy di tích phù hợp với từ khóa này'}
              </h3>
              <p className="text-xs text-[#171817]/70 max-w-md mx-auto mb-5">
                {t('catalog.emptyDesc') || 'Hãy thử từ khóa khác hoặc đặt lại bộ lọc cấp độ / khu vực.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRanking('ALL');
                  setSelectedRegion('ALL');
                }}
                className="px-5 py-2.5 rounded-full bg-[#A94F3D] hover:bg-[#914030] text-[#D8C9A9] text-xs font-semibold transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Reset Filters' : lang === 'zh' ? '重置筛选' : 'Đặt lại bộ lọc'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSites.map((site, idx) => {
                const locSite = getLocalizedSite(site);
                return (
                  <CascadeRevealCard
                    key={site.id}
                    index={idx}
                    columnsPerRow={3}
                    delayStepMs={85}
                    className="h-full flex flex-col"
                  >
                    <HeritageCatalogCard
                      site={site}
                      index={idx}
                      lang={lang}
                      officialName={locSite.officialName}
                      summary={locSite.summary}
                      districtLabel={formatDistrictName(site.address.district)}
                      regionLabel={getRegionLabel(site)}
                      rankingLabel={getRankingLabel(site.rankingLevel)}
                      hasCustomOverride={hasAnyCustomPhotoForSite(customPhotosMap, site.id)}
                      isHiddenForVisitors={hiddenSiteIds.includes(site.id)}
                      onOpenDetailModal={onOpenDetailModal}
                      onOpenPhotoManager={onOpenPhotoManager}
                      onOpen3D={onOpen3D}
                      onOpenARAudio={onOpenARAudio}
                      onOpenVideo={onOpenVideo}
                      onSelectSiteOnMap={onSelectSiteOnMap}
                    />
                  </CascadeRevealCard>
                );
              })}
            </div>
          )}
        </div>

        {onOpenMediaCredits && (
          <div className="mt-8 pt-5 border-t border-[#171817]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#171817]/75">
            <span>
              {lang === 'en'
                ? 'All photographs, documentary clips, and historical archives are cited for non-commercial heritage education.'
                : lang === 'zh'
                ? '本馆所有实景照片、历史影像与文献资料均注明来源，仅作非商业文化遗产教育与研究之用。'
                : 'Toàn bộ hình ảnh thực tế, phim tư liệu và bản đồ cổ đều được trích dẫn minh bạch phục vụ giáo dục di sản phi thương mại.'}
            </span>
            <ArchivalSourcesTrigger
              onClick={onOpenMediaCredits}
              tone="light"
              className="self-start sm:self-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default HeritageCatalog;

