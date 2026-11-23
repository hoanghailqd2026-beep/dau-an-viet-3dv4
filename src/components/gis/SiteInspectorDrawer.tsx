import React from 'react';
import { HeritageSite } from '../../types/heritage';
import { formatWGS84, formatVN2000 } from '../../utils/coordinateConversion';
import { useI18n } from '../../i18n/I18nContext';
import { getHeritageColorBlock } from '../../utils/indochinePalette';
import { HeritageTypographicPlate } from '../common/HeritageTypographicPlate';
import { HeritageSmoothImage } from '../common/HeritageSmoothImage';
import { getSitePhotoCaption, PhotoSlotIndex } from '../../utils/wikimediaPhotoService';
import {
  X,
  MapPin,
  Clock,
  Ticket,
  Box,
  Volume2,
  BookOpen,
  Copy,
  Check,
  Compass,
  ChevronRight,
} from 'lucide-react';

interface SiteInspectorDrawerProps {
  site: HeritageSite;
  onClose: () => void;
  onOpen3D: (site: HeritageSite) => void;
  onOpenARAudio: (site: HeritageSite) => void;
  onOpenDetailModal?: (site: HeritageSite) => void;
}

export const SiteInspectorDrawer: React.FC<SiteInspectorDrawerProps> = ({
  site,
  onClose,
  onOpen3D,
  onOpenARAudio,
  onOpenDetailModal,
}) => {
  const { lang, t, formatDistrictName, getLocalizedSite } = useI18n();
  const locSite = getLocalizedSite(site);
  const [copied, setCopied] = React.useState(false);
  const [mobileSnap, setMobileSnap] = React.useState<'collapsed' | 'half' | 'full'>('half');
  const [activePhotoIdx, setActivePhotoIdx] = React.useState<PhotoSlotIndex>(0);
  const [imgFailed, setImgFailed] = React.useState(false);
  const touchStartYRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setActivePhotoIdx(0);
    setMobileSnap('half');
    setImgFailed(false);
  }, [site.id]);

  const rawPhoto = site.photos?.[activePhotoIdx] || '';

  React.useEffect(() => {
    setImgFailed(false);
  }, [site.id, activePhotoIdx, rawPhoto]);
  const hasRealPhoto = Boolean(rawPhoto && !imgFailed);
  const activeCaption = getSitePhotoCaption(site, activePhotoIdx, lang);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartYRef.current = null;
    if (deltaY < -35) {
      setMobileSnap((prev) => (prev === 'collapsed' ? 'half' : 'full'));
    } else if (deltaY > 35) {
      if (mobileSnap === 'full') setMobileSnap('half');
      else if (mobileSnap === 'half') setMobileSnap('collapsed');
      else onClose();
    }
  };

  const handleCopyCoord = () => {
    navigator.clipboard?.writeText(
      `${site.gps.lat.toFixed(6)}, ${site.gps.lng.toFixed(6)}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rankingBadgeText =
    site.rankingLevel === 'Special National'
      ? lang === 'zh'
        ? '★ 国家级特别遗迹'
        : lang === 'en'
        ? '★ Special National Monument'
        : '★ Di Tích Quốc Gia Đặc Biệt'
      : lang === 'zh'
      ? '国家级遗迹'
      : lang === 'en'
      ? 'National Monument'
      : 'Di Tích Cấp Quốc Gia';

  const mobileHeightClass =
    mobileSnap === 'collapsed'
      ? 'max-sm:h-[146px]'
      : mobileSnap === 'full'
      ? 'max-sm:h-[84dvh]'
      : 'max-sm:h-[50dvh]';

  const colorBlock = getHeritageColorBlock(site, lang);

  return (
    <div
      className={`absolute max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto top-3 right-3 bottom-16 sm:top-4 sm:right-4 sm:bottom-4 z-30 max-sm:w-full w-[calc(100vw-24px)] sm:w-96 md:w-[420px] ${mobileHeightClass} sm:h-auto bg-[#F4EFE4] border border-[#171817]/20 max-sm:rounded-t-3xl max-sm:rounded-b-none rounded-2xl shadow-[0_24px_60px_rgba(23,24,23,0.3)] flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-from-right pointer-events-auto text-[#171817]`}
    >
      {/* Mobile Drag Handle Bar & Snap Controls (< 640px only) */}
      <div
        className="sm:hidden shrink-0 pt-2 pb-1.5 px-4 bg-[#EDE4D0] border-b border-[#171817]/15 flex items-center justify-between cursor-pointer select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          setMobileSnap((prev) =>
            prev === 'collapsed' ? 'half' : prev === 'half' ? 'full' : 'collapsed'
          );
        }}
      >
        <span className="text-[11px] font-sans font-semibold text-[#A94F3D]">
          {mobileSnap === 'collapsed'
            ? lang === 'zh'
              ? '点击展开'
              : lang === 'en'
              ? 'Tap to expand'
              : 'Chạm để mở rộng'
            : mobileSnap === 'half'
            ? lang === 'zh'
              ? '滑动 / 点击全屏'
              : lang === 'en'
              ? 'Swipe / tap for full'
              : 'Chạm mở toàn phần'
            : lang === 'zh'
            ? '点击收起'
            : lang === 'en'
            ? 'Tap to minimize'
            : 'Chạm thu gọn'}
        </span>
        <div className="w-10 h-1.5 rounded-full bg-[#171817]/25" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="px-2 py-0.5 rounded-md bg-[#171817] text-[10px] text-[#D8C9A9] font-medium cursor-pointer"
        >
          {t('common.close')}
        </button>
      </div>

      {/* Compact Mobile Header when collapsed (< 640px & collapsed) */}
      {mobileSnap === 'collapsed' && (
        <div
          className="sm:hidden px-3.5 py-2 flex items-center justify-between gap-2 border-b border-[#171817]/15 bg-[#F4EFE4] cursor-pointer"
          onClick={() => setMobileSnap('half')}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#171817]/20 bg-[#171817]">
              {hasRealPhoto ? (
                <HeritageSmoothImage
                  src={rawPhoto}
                  alt={locSite.officialName}
                  waitTone="dark"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <HeritageTypographicPlate site={site} variant="compact" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-[#A94F3D] font-sans font-semibold truncate">
                {rankingBadgeText}
              </div>
              <h3 className="text-xs font-serif font-bold text-[#171817] truncate">
                {locSite.officialName}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header Media Banner (Clean un-scrimmed photo + Pigment Title Block below) */}
      <div
        className={`shrink-0 ${mobileSnap === 'collapsed' ? 'max-sm:hidden' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-[#171817]">
          {hasRealPhoto ? (
            <HeritageSmoothImage
              src={rawPhoto}
              alt={locSite.officialName}
              waitTone="dark"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <HeritageTypographicPlate site={site} variant="catalog" className="pt-8 pb-8" />
          )}

          {/* Top Floating Controls */}
          <div className="absolute top-2.5 sm:top-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[#171817]/20"
                style={{ backgroundColor: colorBlock.bg, color: colorBlock.fg }}
              >
                {rankingBadgeText}
              </span>

              {locSite.isPendingTranslation && (
                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-sans bg-[#C9A46A] text-[#171817] font-semibold border border-[#171817]/20">
                  {lang === 'zh' ? '待翻译' : lang === 'en' ? 'Not translated' : 'Chưa dịch'}
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#F4EFE4] hover:bg-[#EDE4D0] text-[#171817] transition-colors border border-[#171817]/20 cursor-pointer shadow-sm"
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom-right Ảnh 01 / Ảnh 02 Switcher for Map & Route Verification */}
          <div
            className="absolute bottom-2.5 right-3 z-20 inline-flex items-center bg-[#171817]/90 border border-[#D8C9A9]/35 p-0.5 rounded-lg shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {([0, 1] as const).map((slotIdx) => {
              const isActive = activePhotoIdx === slotIdx;
              const slotLabel =
                lang === 'zh'
                  ? `实景 0${slotIdx + 1}`
                  : lang === 'en'
                  ? `Photo 0${slotIdx + 1}`
                  : `Ảnh 0${slotIdx + 1}`;
              return (
                <button
                  key={slotIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIdx(slotIdx);
                  }}
                  aria-label={slotLabel}
                  className={`px-2 py-0.5 rounded-md font-sans text-[10px] font-semibold tabular-nums transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#C9A46A] text-[#171817]'
                      : 'text-[#D8C9A9]/80 hover:text-[#D8C9A9]'
                  }`}
                >
                  {slotLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subtle localized caption strip beneath photo */}
        <div className="px-4 py-1.5 bg-[#EDE4D0] border-b border-[#171817]/15 flex items-center justify-between gap-2 text-[10.5px] font-sans text-[#171817]/80">
          <span className="truncate">{activeCaption}</span>
          <span className="shrink-0 tabular-nums font-semibold text-[#A94F3D]">
            0{activePhotoIdx + 1} / 02
          </span>
        </div>

        {/* Genova Pigment Header Title Strip */}
        <div
          className="px-4 py-3 border-b border-[#171817]/15"
          style={{ backgroundColor: colorBlock.bg, color: colorBlock.fg }}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-sans font-semibold tabular-nums opacity-85">
            <span>{site.identifierCode}</span>
            <span>·</span>
            <span>{locSite.chronology.split('(')[0].trim()}</span>
          </div>
          <h3 className="text-base sm:text-xl font-serif font-bold leading-tight mt-0.5 line-clamp-2">
            {locSite.officialName}
          </h3>
          {locSite.folkName && (
            <p className="text-[11px] opacity-85 truncate mt-0.5">
              {locSite.folkName}
            </p>
          )}
        </div>
      </div>

      {/* 2. Primary Action Bar */}
      <div className="p-2.5 sm:p-3 border-b border-[#171817]/15 bg-[#EDE4D0] flex items-center gap-2 shrink-0">
        {site.has3D ? (
          <button
            onClick={() => onOpen3D(site)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#A94F3D] hover:bg-[#934232] text-[#D8C9A9] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Box className="w-4 h-4 shrink-0" />
            <span className="truncate">{lang === 'zh' ? '3D LiDAR 模型' : lang === 'en' ? '3D LiDAR Model' : 'Mô Hình 3D LiDAR'}</span>
          </button>
        ) : null}

        <button
          onClick={() => onOpenARAudio(site)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-[#47796D] hover:bg-[#3B665B] text-[#171817] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Volume2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{lang === 'zh' ? 'AR 语音导览' : lang === 'en' ? 'AR Audio Guide' : 'Thuyết Minh AR'}</span>
        </button>

        {onOpenDetailModal && (
          <button
            onClick={() => onOpenDetailModal(site)}
            className="py-2.5 px-3 rounded-xl bg-[#F4EFE4] hover:bg-[#D8C9A9] text-[#171817] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-[#171817]/20 active:scale-[0.98] cursor-pointer shrink-0"
            title={lang === 'zh' ? '打开遗产档案' : lang === 'en' ? 'Open heritage archive' : 'Mở hồ sơ di sản'}
          >
            <BookOpen className="w-4 h-4 text-[#A94F3D]" />
            <span>{lang === 'zh' ? '遗产档案' : lang === 'en' ? 'Heritage Archive' : 'Hồ Sơ'}</span>
          </button>
        )}
      </div>

      {/* 3. Scrollable Detail Content */}
      <div className={`flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 text-xs scrollbar-thin bg-[#F4EFE4] ${mobileSnap === 'collapsed' ? 'max-sm:hidden' : ''}`}>
        {/* Heritage Summary */}
        <div className="space-y-1.5">
          <span className="text-xs font-sans text-[#A94F3D] font-semibold block">
            {lang === 'zh' ? '历史概述与遗产价值' : lang === 'en' ? 'Historical Overview & Value' : 'Tổng quan Lịch sử & Giá trị'}
          </span>
          <p className="text-[#171817]/85 text-xs sm:text-[13px] leading-relaxed">
            {locSite.summary}
          </p>
        </div>

        {/* Spatial & Cadastral Coordinates Card */}
        <div className="p-3 bg-[#EDE4D0] rounded-xl border border-[#171817]/15 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans text-[#171817] font-semibold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#A94F3D]" />
              <span>{lang === 'zh' ? 'GIS 空间坐标' : lang === 'en' ? 'GIS Spatial Coordinates' : 'Tọa Độ Không Gian GIS'}</span>
            </span>
            <button
              onClick={handleCopyCoord}
              className="text-[11px] text-[#A94F3D] font-semibold hover:underline flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#47796D]" />
                  <span className="text-[#47796D]">{t('common.copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>{t('common.copy')}</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-1 font-sans text-[11px] tabular-nums">
            <div className="flex items-center justify-between text-[#171817]">
              <span className="text-[#171817]/60">WGS-84:</span>
              <span className="font-semibold text-[#171817]">{formatWGS84(site.gps)}</span>
            </div>
            <div className="flex items-center justify-between text-[#171817]">
              <span className="text-[#171817]/60">VN-2000 (HCMC):</span>
              <span className="font-semibold text-[#171817] truncate max-w-[220px]">
                {formatVN2000(site.vn2000)}
              </span>
            </div>
          </div>
        </div>

        {/* Architecture & Timeline Specs */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-[#EDE4D0] rounded-xl border border-[#171817]/15 space-y-1">
            <span className="text-[11px] text-[#171817]/65 font-semibold block">
              {lang === 'zh' ? '落成年代' : lang === 'en' ? 'Chronology' : 'Khánh Thành'}
            </span>
            <span className="text-[#171817] font-semibold text-xs block">
              {locSite.chronology.split('(')[0]}
            </span>
          </div>

          <div className="p-3 bg-[#EDE4D0] rounded-xl border border-[#171817]/15 space-y-1">
            <span className="text-[11px] text-[#171817]/65 font-semibold block">
              {lang === 'zh' ? '建筑师' : lang === 'en' ? 'Architect' : 'Kiến Trúc Sư'}
            </span>
            <span className="text-[#171817] font-semibold text-xs block truncate" title={locSite.architect}>
              {locSite.architect.split('(')[0]}
            </span>
          </div>
        </div>

        {/* Architectural Style */}
        <div className="p-3 bg-[#EDE4D0] rounded-xl border border-[#171817]/15 space-y-1">
          <span className="text-[11px] text-[#171817]/65 font-semibold block">
            {lang === 'zh' ? '建筑风格' : lang === 'en' ? 'Architectural Style' : 'Phong Cách Kiến Trúc'}
          </span>
          <p className="text-[#171817] text-xs leading-relaxed font-medium">
            {locSite.architecturalStyle}
          </p>
        </div>

        {/* Visiting Information */}
        <div className="p-3 bg-[#EDE4D0] rounded-xl border border-[#171817]/15 space-y-2">
          <span className="text-[11px] text-[#171817]/65 font-semibold block">
            {lang === 'zh' ? '参观信息' : lang === 'en' ? 'Visiting Information' : 'Thông Tin Tham Quan'}
          </span>
          <div className="space-y-1.5 text-[#171817]">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#A94F3D] shrink-0" />
              <span>{locSite.openingHours}</span>
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="w-3.5 h-3.5 text-[#47796D] shrink-0" />
              <span>{locSite.ticketPrices}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#526D8B] shrink-0" />
              <span className="truncate">{site.address.houseNumber} {site.address.street}, {site.address.ward}, {formatDistrictName(site.address.district)}</span>
            </div>
          </div>
        </div>

        {/* View Full Dossier CTA */}
        {onOpenDetailModal && (
          <button
            onClick={() => onOpenDetailModal(site)}
            className="w-full py-3 px-4 rounded-xl bg-[#171817] hover:bg-[#A94F3D] border border-[#171817] text-[#D8C9A9] text-xs font-semibold flex items-center justify-between transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C9A46A]" />
              <span>{lang === 'zh' ? '查看完整遗产档案与 3D 资料库' : lang === 'en' ? 'View Complete Heritage Archive & 3D Archive' : 'Xem Toàn Bộ Hồ Sơ Di Tích & Tư Liệu 3D'}</span>
            </div>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-all" />
          </button>
        )}
      </div>
    </div>
  );
};
