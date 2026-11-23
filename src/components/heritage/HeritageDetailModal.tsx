import React, { useState, useEffect } from 'react';
import { HeritageSite } from '../../types/heritage';
import { formatWGS84 } from '../../utils/coordinateConversion';
import { useI18n } from '../../i18n/I18nContext';
import { useAudioGuide } from '../../contexts/AudioGuideContext';
import { HeritageTypographicPlate } from '../common/HeritageTypographicPlate';
import { HeritageSmoothImage } from '../common/HeritageSmoothImage';
import { DragScrollRow } from '../common/DragScrollRow';
import { getHeritageColorBlock } from '../../utils/indochinePalette';
import { getSitePhotoCaption } from '../../utils/wikimediaPhotoService';
import { LockGlyph } from '../subscription/LockGlyph';
import { useSubscriptionPermissions } from '../../utils/subscriptionGatingStore';
import { useAuth } from '../../contexts/AuthContext';
import { useUserFavorites } from '../../utils/realtimeCloudSync';
import {
  Calendar,
  Clock,
  Ticket,
  Building,
  Volume2,
  Play,
  Pause,
  Box,
  X,
  Share2,
  BookOpen,
  Check,
  Navigation,
  Layers,
  FileCheck2,
  Film,
  ChevronLeft,
  ChevronRight,
  Heart,
} from 'lucide-react';

interface HeritageDetailModalProps {
  site: HeritageSite;
  onClose: () => void;
  onLaunch3D: () => void;
  onLaunchAudio: () => void;
  onLaunchVideo?: () => void;
  onNavigateToMap?: (site: HeritageSite) => void;
  onOpenPhotoManager?: (site: HeritageSite, initialSlot?: 0 | 1) => void;
  isHiddenForVisitors?: boolean;
}

export const HeritageDetailModal: React.FC<HeritageDetailModalProps> = ({
  site,
  onClose,
  onLaunch3D,
  onLaunchAudio,
  onLaunchVideo,
  onNavigateToMap,
  onOpenPhotoManager,
  isHiddenForVisitors = false,
}) => {
  const { lang, t, formatDistrictName, getLocalizedSite } = useI18n();
  const { user, openAuthModal } = useAuth();
  const currentUserUid = user ? user.firebaseUid || user.userId || user.id : null;
  const { isFavorite, toggleFavorite } = useUserFavorites(currentUserUid);
  const siteFavorited = currentUserUid ? isFavorite(site.id) : false;
  const { permissions: sitePerms } = useSubscriptionPermissions(site.id);
  const {
    activeSiteId,
    activeChapter,
    isPlaying,
    isFloatingBarVisible,
    togglePlayPause,
  } = useAudioGuide();
  const locSite = getLocalizedSite(site);
  const [activePhotoIdx, setActivePhotoIdx] = useState<0 | 1>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const activeHeroPhoto = site.photos[activePhotoIdx] ?? (activePhotoIdx === 0 ? site.photos[0] : '') ?? '';
  const activePhotoCaption = getSitePhotoCaption(
    site,
    activePhotoIdx,
    (lang as 'vi' | 'en' | 'zh') || 'vi'
  );
  const isSiteAudioActive = activeSiteId === site.id && (isPlaying || isFloatingBarVisible);

  useEffect(() => {
    setActivePhotoIdx(0);
    setHeroImgFailed(false);
  }, [site.id]);

  useEffect(() => {
    setHeroImgFailed(false);
  }, [activeHeroPhoto, activePhotoIdx]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const block = getHeritageColorBlock(site, lang as 'vi' | 'en' | 'zh');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        lang === 'en'
          ? `Heritage Dossier: ${locSite.officialName}`
          : lang === 'zh'
          ? `遗产档案：${locSite.officialName}`
          : `Hồ sơ di sản: ${locSite.officialName}`
      }
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-[#171817]/65 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#F4EFE4] border border-[#171817]/20 rounded-t-[28px] sm:rounded-[32px] shadow-[0_32px_90px_rgba(23,24,23,0.35)] overflow-hidden sm:my-auto flex flex-col max-h-[85vh] sm:max-h-[92vh] text-[#171817] animate-apple-sheet"
      >
        {/* Sheet Header Bar */}
        <div
          className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-[#171817]/15"
          style={{ backgroundColor: block.bg, color: block.fg }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-xs font-semibold truncate">
              {lang === 'en'
                ? 'Heritage Dossier'
                : lang === 'zh'
                ? '物质文化遗产档案'
                : 'Hồ sơ Di sản Vật thể'}
            </span>
            <span className="opacity-40 hidden sm:inline">·</span>
            <span className="text-xs font-sans tabular-nums truncate hidden sm:inline" style={{ color: block.mutedFg }}>
              {site.identifierCode} · {block.label}
            </span>
            {isHiddenForVisitors && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#171817] border border-[#C9A46A] text-[#C9A46A] text-[10px] font-semibold shrink-0">
                {lang === 'en'
                  ? 'Tester Preview · Hidden'
                  : lang === 'zh'
                  ? '隐藏草稿 · 测试模式'
                  : 'Đang ẩn · Chế độ Tester'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (!currentUserUid) {
                  openAuthModal({
                    prompt:
                      'Đăng nhập tài khoản để lưu danh sách di tích yêu thích và đồng bộ trên mọi thiết bị.',
                  });
                  return;
                }
                toggleFavorite(site.id);
              }}
              style={{
                backgroundColor: siteFavorited ? '#A94F3D' : block.badgeBg,
                color: siteFavorited ? '#F7F3EB' : block.badgeFg,
                borderColor: siteFavorited ? '#A94F3D' : block.hairline,
              }}
              className="h-8 px-3 rounded-full border text-xs transition-all hover:opacity-90 flex items-center gap-1.5 font-medium cursor-pointer"
              title={
                siteFavorited
                  ? 'Bỏ lưu khỏi danh sách yêu thích'
                  : 'Lưu vào danh sách di tích yêu thích'
              }
            >
              <Heart className={`w-3.5 h-3.5 ${siteFavorited ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">
                {siteFavorited
                  ? lang === 'en'
                    ? 'Saved'
                    : lang === 'zh'
                    ? '已收藏'
                    : 'Đã lưu'
                  : lang === 'en'
                  ? 'Save'
                  : lang === 'zh'
                  ? '收藏'
                  : 'Yêu thích'}
              </span>
            </button>
            <button
              onClick={handleCopyLink}
              style={{
                backgroundColor: block.badgeBg,
                color: block.badgeFg,
                borderColor: block.hairline,
              }}
              className="h-8 px-3 rounded-full border text-xs transition-opacity hover:opacity-90 flex items-center gap-1.5 font-medium cursor-pointer"
              title={
                lang === 'en'
                  ? 'Share dossier link'
                  : lang === 'zh'
                  ? '分享档案链接'
                  : 'Chia sẻ hồ sơ'
              }
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="font-semibold">{t('common.copied')}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {lang === 'en' ? 'Share' : lang === 'zh' ? '分享' : 'Chia sẻ'}
                  </span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: block.badgeBg,
                color: block.badgeFg,
                borderColor: block.hairline,
              }}
              className="w-8 h-8 rounded-full border transition-opacity hover:opacity-85 cursor-pointer flex items-center justify-center"
              title={
                lang === 'en'
                  ? 'Close dossier (ESC)'
                  : lang === 'zh'
                  ? '关闭档案 (ESC)'
                  : 'Đóng hồ sơ (ESC)'
              }
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Audio Guide Banner */}
        {isSiteAudioActive && (
          <div className="px-5 sm:px-7 py-2.5 bg-[#EDE4D0] border-b border-[#171817]/15 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Volume2 className="w-4 h-4 text-[#A94F3D] shrink-0" />
              <div className="min-w-0 text-xs truncate">
                <span className="font-semibold text-[#A94F3D]">
                  {isPlaying
                    ? lang === 'zh'
                      ? '正在播放语音导览'
                      : lang === 'en'
                      ? 'Audio Guide Playing'
                      : 'Đang phát Thuyết minh'
                    : lang === 'zh'
                    ? '语音导览已暂停'
                    : lang === 'en'
                    ? 'Audio Guide Paused'
                    : 'Thuyết minh đang tạm dừng'}
                </span>
                {activeChapter?.title && (
                  <span className="text-[#171817]/80"> · {activeChapter.title}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={togglePlayPause}
                className="h-7 px-3 rounded-full bg-[#A94F3D] hover:bg-[#914030] text-[#D8C9A9] text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>
                  {isPlaying
                    ? lang === 'zh'
                      ? '暂停'
                      : lang === 'en'
                      ? 'Pause'
                      : 'Tạm dừng'
                    : lang === 'zh'
                    ? '继续'
                    : lang === 'en'
                    ? 'Resume'
                    : 'Tiếp tục'}
                </span>
              </button>
              <button
                type="button"
                onClick={onLaunchAudio}
                className="h-7 px-3 rounded-full bg-[#47796D] hover:bg-[#3A645A] text-[#171817] text-[11px] font-semibold cursor-pointer transition-colors"
              >
                {lang === 'zh' ? '演播室' : lang === 'en' ? 'Studio' : 'Phòng thu'}
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 space-y-6 heritage-scrollbar">
          {/* Hero Section */}
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#171817]/70 mb-2">
                <span className="font-semibold px-2.5 py-0.5 rounded-full bg-[#C9A46A]/45 border border-[#171817]/20 text-[#171817]">
                  {t(`rankings.${site.rankingLevel}`)}
                </span>
                <span>·</span>
                <span className="text-[#171817] font-medium">{t(`types.${site.type}`)}</span>
                <span>·</span>
                <span className="text-[#171817] font-medium">{formatDistrictName(site.address.district)}</span>

                {locSite.isPendingTranslation && (
                  <span className="px-2 py-0.5 rounded-full bg-[#C9A46A]/35 text-[#171817] text-[10px]">
                    {t('common.pendingTranslation')}
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl sm:text-4xl font-semibold tracking-tight text-[#171817] leading-tight">
                {locSite.officialName}
              </h1>
              {locSite.folkName && (
                <p className="text-xs sm:text-sm text-[#171817]/75 mt-1.5">
                  {lang === 'en'
                    ? 'Historical / Folk Name: '
                    : lang === 'zh'
                    ? '历史称谓 / 民间俗称：'
                    : 'Tên dân gian / Tên gọi lịch sử: '}
                  <span className="text-[#A94F3D] font-semibold">{locSite.folkName}</span>
                </p>
              )}
            </div>

            {/* Main Featured Photo & Interactive Launcher */}
            <div className="relative rounded-[24px] overflow-hidden bg-[#171817] border border-[#171817]/20 group shadow-md flex flex-col">
              <div className="relative aspect-video w-full overflow-hidden bg-[#171817]">
                {activeHeroPhoto && !heroImgFailed ? (
                  <HeritageSmoothImage
                    src={activeHeroPhoto}
                    alt={site.officialName}
                    waitTone="dark"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-[opacity,transform] duration-500"
                  />
                ) : (
                  <HeritageTypographicPlate
                    site={site}
                    variant="detail"
                    className="h-full"
                  />
                )}
                {onOpenPhotoManager && (
                  <button
                    type="button"
                    onClick={() => onOpenPhotoManager(site, activePhotoIdx)}
                    className="absolute top-3.5 right-3.5 z-10 px-3 py-1.5 rounded-full bg-[#F4EFE4]/95 hover:bg-[#C9A46A] text-[#171817] border border-[#171817]/25 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {lang === 'en'
                      ? 'Update Photo'
                      : lang === 'zh'
                      ? '更换实景照片'
                      : 'Đổi ảnh thật'}
                  </button>
                )}
              </div>

              {/* Thanh chú thích ảnh đa ngữ & chuyển đổi Ảnh 01 | 02 ngay dưới mép ảnh */}
              <div className="px-4 sm:px-5 py-2.5 bg-[#F4EFE4] border-t border-[#171817]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0 flex items-center gap-2 text-xs text-[#171817]/85">
                  <span className="font-sans font-semibold text-[11px] px-2 py-0.5 rounded-md bg-[#EDE4D0] border border-[#171817]/15 text-[#A94F3D] tabular-nums shrink-0">
                    {activePhotoIdx === 0 ? '01' : '02'}/02
                  </span>
                  <p className="truncate font-serif italic text-[12.5px] sm:text-[13px] text-[#171817]">
                    {activePhotoCaption}
                  </p>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev === 0 ? 1 : 0))}
                    aria-label={
                      lang === 'en' ? 'Previous photo' : lang === 'zh' ? '上一张照片' : 'Ảnh trước'
                    }
                    className="w-7 h-7 rounded-full border border-[#171817]/20 bg-[#EDE4D0] hover:bg-[#171817] hover:text-[#D8C9A9] text-[#171817] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx(0)}
                    className={`px-2.5 h-7 rounded-full text-[11px] font-sans font-semibold tabular-nums border transition-colors cursor-pointer ${
                      activePhotoIdx === 0
                        ? 'bg-[#171817] text-[#D8C9A9] border-[#171817]'
                        : 'bg-[#EDE4D0] text-[#171817] border-[#171817]/20 hover:border-[#A94F3D]'
                    }`}
                  >
                    01
                  </button>
                  <span className="text-[#171817]/30 text-xs select-none" aria-hidden="true">
                    |
                  </span>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx(1)}
                    className={`px-2.5 h-7 rounded-full text-[11px] font-sans font-semibold tabular-nums border transition-colors cursor-pointer ${
                      activePhotoIdx === 1
                        ? 'bg-[#171817] text-[#D8C9A9] border-[#171817]'
                        : 'bg-[#EDE4D0] text-[#171817] border-[#171817]/20 hover:border-[#A94F3D]'
                    }`}
                  >
                    02
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev === 1 ? 0 : 1))}
                    aria-label={
                      lang === 'en' ? 'Next photo' : lang === 'zh' ? '下一张照片' : 'Ảnh tiếp theo'
                    }
                    className="w-7 h-7 rounded-full border border-[#171817]/20 bg-[#EDE4D0] hover:bg-[#171817] hover:text-[#D8C9A9] text-[#171817] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom Quick Launchers on Crisp Archival Cream Bar */}
              <div className="p-3.5 sm:px-5 sm:py-3.5 bg-[#EDE4D0] border-t border-[#171817]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <div className="text-[11px] sm:text-xs text-[#171817] bg-[#F4EFE4] px-3.5 py-1.5 rounded-full border border-[#171817]/15 self-start sm:self-auto w-full sm:w-auto truncate">
                  <span className="text-[#171817]/65">
                    {lang === 'en' ? 'Decree: ' : lang === 'zh' ? '认定批文：' : 'Quyết định: '}
                  </span>
                  <span className="font-semibold text-[#A94F3D]">
                    {site.decisionDecreeNumber ||
                      (lang === 'en'
                        ? 'Ministry of Culture Recognized'
                        : lang === 'zh'
                        ? '越南文化体育与旅游部认定'
                        : 'Bộ Văn hóa - Thể thao & Du lịch')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                  {onNavigateToMap && (
                    <button
                      onClick={() => {
                        onNavigateToMap(site);
                        onClose();
                      }}
                      className="px-3.5 py-2 rounded-full bg-[#F4EFE4] hover:bg-[#D8C9A9] border border-[#171817]/20 text-[#171817] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#526D8B] shrink-0" />
                      <span className="truncate">
                        {lang === 'en' ? 'GIS Map' : lang === 'zh' ? 'GIS 地图' : 'Bản đồ GIS'}
                      </span>
                    </button>
                  )}
                  {site.has3D ? (
                    <button
                      onClick={onLaunch3D}
                      className="px-4 py-2 rounded-full bg-[#A94F3D] hover:bg-[#914030] text-[#D8C9A9] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Box className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {lang === 'en' ? 'Open 3D' : lang === 'zh' ? '打开 3D 空间' : 'Mở Không gian 3D'}
                      </span>
                    </button>
                  ) : null}
                  <button
                    onClick={onLaunchAudio}
                    className={`px-3.5 py-2 rounded-full bg-[#F4EFE4] hover:bg-[#D8C9A9] border border-[#171817]/20 text-[#171817] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      !sitePerms.canUseAudioGuide ? 'opacity-75' : ''
                    }`}
                  >
                    {!sitePerms.canUseAudioGuide ? (
                      <LockGlyph className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-[#A94F3D] shrink-0" />
                    )}
                    <span className="truncate">{lang === 'en' ? 'Audio' : lang === 'zh' ? '语音' : 'Thuyết minh'}</span>
                  </button>
                  {onLaunchVideo && (
                    <button
                      onClick={onLaunchVideo}
                      className="px-3.5 py-2 rounded-full bg-[#C9A46A] hover:bg-[#BE985D] border border-[#171817]/20 text-[#171817] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Film className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {lang === 'en' ? 'Documentary' : lang === 'zh' ? '纪录片' : 'Video Tư Liệu'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Gallery Selector Thumbnail Strip */}
            {site.photos.length > 1 && (
              <DragScrollRow className="flex items-center gap-2 overflow-x-auto flex-nowrap py-1 pb-2 heritage-scrollbar">
                {site.photos.slice(0, 2).map((photo, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setActivePhotoIdx(pIdx === 1 ? 1 : 0)}
                    className={`relative w-28 aspect-video rounded-xl overflow-hidden shrink-0 border-2 bg-[#E4D7BC] transition-all cursor-pointer ${
                      activePhotoIdx === pIdx
                        ? 'border-[#A94F3D] scale-105'
                        : 'border-[#171817]/20 hover:border-[#171817]/50 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <HeritageSmoothImage
                      src={photo}
                      alt={`${site.officialName} photo ${pIdx + 1}`}
                      loading="lazy"
                      waitTone="light"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className="w-full h-full object-cover object-center"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-[#171817]/85 text-[#D8C9A9] text-[10px] font-sans font-semibold tabular-nums">
                      {pIdx === 0 ? '01' : '02'}
                    </span>
                  </button>
                ))}
              </DragScrollRow>
            )}
          </div>

          {/* Technical Specifications Grid */}
          <div className="bg-[#EDE4D0] border border-[#171817]/15 rounded-[22px] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#171817]/15 pb-3">
              <h3 className="text-xs text-[#A94F3D] font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#A94F3D]" />
                <span>
                  {lang === 'en'
                    ? 'GIS Specifications & Conservation Geodesy'
                    : lang === 'zh'
                    ? 'GIS 测绘技术参数与保护大地测量'
                    : 'Thông số Kỹ thuật GIS & Trắc địa Bảo tồn'}
                </span>
              </h3>
              <span className="text-xs font-sans tabular-nums text-[#171817]/65 hidden sm:inline">
                {lang === 'en'
                  ? "Datum: VN-2000 (105°45')"
                  : lang === 'zh'
                  ? "基准面：VN-2000 (中央子午线 105°45')"
                  : "Hệ quy chiếu: VN-2000 (KTT 105°45')"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
              <div className="space-y-1">
                <span className="text-[#171817]/65 block text-xs font-medium font-sans">
                  {lang === 'en'
                    ? 'Relic Classification:'
                    : lang === 'zh'
                    ? '遗迹保护级别：'
                    : 'Xếp hạng di tích:'}
                </span>
                <div className="font-semibold text-[#171817] text-sm">
                  {t(`rankings.${site.rankingLevel}`)}
                </div>
                <div className="text-xs text-[#171817]/70">
                  {t(`types.${site.type}`)}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[#171817]/65 block text-xs font-medium font-sans">
                  {lang === 'en'
                    ? 'WGS-84 & VN-2000 Coordinates:'
                    : lang === 'zh'
                    ? 'WGS-84 与 VN-2000 坐标：'
                    : 'Tọa độ WGS-84 & VN-2000:'}
                </span>
                <div className="font-sans text-[#526D8B] font-semibold text-xs tabular-nums">
                  {formatWGS84(site.gps)}
                </div>
                <div className="font-sans text-[#171817]/70 text-[11px] tabular-nums mt-0.5">
                  VN-2000: X={site.vn2000.x.toLocaleString('vi-VN')} m | Y={site.vn2000.y.toLocaleString('vi-VN')} m
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[#171817]/65 block text-xs font-medium font-sans">
                  {lang === 'en' ? 'Address:' : lang === 'zh' ? '遗迹地址：' : 'Địa chỉ di tích:'}
                </span>
                <div className="text-[#171817] font-semibold text-sm">
                  {site.address.houseNumber} {site.address.street}
                </div>
                <div className="text-xs text-[#171817]/70">
                  {site.address.ward}, {formatDistrictName(site.address.district)}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[#171817]/65 block text-xs font-medium font-sans">
                  {lang === 'en'
                    ? 'Governing Authority:'
                    : lang === 'zh'
                    ? '主管与保护单位：'
                    : 'Cơ quan quản lý:'}
                </span>
                <div className="text-[#171817] font-semibold text-sm leading-snug">
                  {locSite.managementUnit}
                </div>
                <div className="text-[11px] text-[#47796D] font-sans font-semibold mt-0.5 flex items-center gap-1">
                  <FileCheck2 className="w-3 h-3" />
                  <span>
                    {lang === 'en'
                      ? 'Digitally Certified Dossier'
                      : lang === 'zh'
                      ? '数字化审定档案'
                      : 'Hồ sơ đã kiểm định số'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: History & Chronology */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[#171817] flex items-center gap-2 border-b border-[#171817]/15 pb-2.5">
              <BookOpen className="w-4 h-4 text-[#A94F3D]" />
              <span>
                {lang === 'en'
                  ? 'History & Historical Chronology'
                  : lang === 'zh'
                  ? '历史沿革与建筑年表'
                  : 'Lịch Sử & Niên Biểu Công Trình'}
              </span>
            </h3>

            <p className="text-[14.5px] sm:text-[15.5px] leading-[1.65] font-normal text-[#171817]/90">
              {locSite.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1">
              <div className="p-4 bg-[#EDE4D0] rounded-2xl border border-[#171817]/15 text-xs">
                <span className="text-[#171817]/65 block text-xs font-medium font-sans">
                  {lang === 'en'
                    ? 'Construction Chronology:'
                    : lang === 'zh'
                    ? '建造年代：'
                    : 'Niên đại xây dựng:'}
                </span>
                <div className="text-[#171817] font-semibold text-sm mt-1 tabular-nums">{locSite.chronology}</div>
              </div>
              <div className="p-4 bg-[#EDE4D0] rounded-2xl border border-[#171817]/15 text-xs">
                <span className="text-[#171817]/65 block text-xs font-medium font-sans">
                  {lang === 'en'
                    ? 'Architect / Builder:'
                    : lang === 'zh'
                    ? '建筑师 / 营造机构：'
                    : 'Tác giả / Kiến trúc sư:'}
                </span>
                <div className="text-[#171817] font-semibold text-sm mt-1">{locSite.architect}</div>
              </div>
            </div>

            {/* Timeline Milestones */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs text-[#A94F3D] font-semibold font-sans">
                {lang === 'en'
                  ? 'Major Historical Milestones'
                  : lang === 'zh'
                  ? '重要历史里程碑'
                  : 'Các Cột Mốc Lịch Sử Trọng Đại'}
              </h4>
              <div className="border-l-2 border-[#C9A46A] ml-2 space-y-3 pl-4 text-xs">
                {locSite.milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="relative p-3.5 sm:p-4 rounded-2xl border border-[#171817]/15 bg-[#EDE4D0] hover:border-[#A94F3D] transition-all"
                  >
                    <span className="absolute -left-[23px] top-4.5 w-2.5 h-2.5 rounded-full bg-[#A94F3D] ring-4 ring-[#F4EFE4]" />
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#C9A46A]/45 text-xs font-sans font-semibold text-[#171817] tabular-nums mb-1">
                      {m.year}
                    </span>
                    <p className="mt-1 text-[13.5px] sm:text-[14.5px] leading-[1.6] font-normal text-[#171817]/90">
                      {m.event}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Architecture & Conservation Status */}
          <div className="space-y-4 pt-4 border-t border-[#171817]/15">
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[#171817] flex items-center gap-2 border-b border-[#171817]/15 pb-2.5">
              <Building className="w-4 h-4 text-[#47796D]" />
              <span>
                {lang === 'en'
                  ? 'Architectural Highlights & Conservation'
                  : lang === 'zh'
                  ? '建筑特色与保护现状'
                  : 'Đặc Trưng Kiến Trúc & Hiện Trạng Bảo Tồn'}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#EDE4D0] rounded-2xl border border-[#171817]/15">
                <span className="text-[#171817]/65 block text-xs font-medium font-sans">
                  {lang === 'en'
                    ? 'Architectural Style:'
                    : lang === 'zh'
                    ? '建筑风格：'
                    : 'Phong cách kiến trúc:'}
                </span>
                <p className="text-[#171817] font-semibold mt-1 leading-snug">
                  {locSite.architecturalStyle}
                </p>
              </div>

              <div className="p-4 bg-[#EDE4D0] rounded-2xl border border-[#171817]/15">
                <span className="text-[#171817]/65 block text-xs font-medium font-sans">
                  {lang === 'en'
                    ? 'Conservation Status:'
                    : lang === 'zh'
                    ? '保护现状：'
                    : 'Tình trạng bảo tồn:'}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      site.conservationStatus === 'Good'
                        ? 'bg-[#47796D]'
                        : 'bg-[#A94F3D]'
                    }`}
                  />
                  <span className="text-[#171817] font-semibold">
                    {site.conservationStatus === 'Good'
                      ? lang === 'en'
                        ? 'Well Preserved / In Good Standing'
                        : lang === 'zh'
                        ? '保存完好 / 符合文物保护标准'
                        : 'Nguyên vẹn tốt / Đạt chuẩn di tích'
                      : site.conservationStatus === 'Under Restoration'
                      ? lang === 'en'
                        ? 'Currently Under Restoration'
                        : lang === 'zh'
                        ? '正在进行专项修缮'
                        : 'Đang đại trùng tu kỹ thuật cao'
                      : lang === 'en'
                      ? 'Restoration Required'
                      : lang === 'zh'
                      ? '需定期修缮维护'
                      : 'Cần tu bổ định kỳ'}
                  </span>
                </div>
                {locSite.conservationNotes && (
                  <p className="text-[11px] text-[#171817]/75 mt-1.5 leading-relaxed">
                    {locSite.conservationNotes}
                  </p>
                )}
              </div>

              <div className="p-4 bg-[#EDE4D0] rounded-2xl border border-[#171817]/15">
                <span className="text-[#171817]/65 block text-xs font-medium font-sans">
                  {lang === 'en'
                    ? 'Prominent Materials:'
                    : lang === 'zh'
                    ? '主要建筑材料：'
                    : 'Vật liệu chủ đạo:'}
                </span>
                <p className="text-[#171817] font-semibold mt-1 leading-snug">
                  {locSite.materials.join(', ')}
                </p>
              </div>
            </div>

            {locSite.dimensionsDescription && (
              <p className="text-xs text-[#171817] bg-[#C9A46A]/35 p-4 rounded-2xl border border-[#171817]/15 font-sans tabular-nums font-medium">
                {lang === 'en'
                  ? 'Spatial Dimensions: '
                  : lang === 'zh'
                  ? '空间与几何尺度：'
                  : 'Quy mô hình học trắc địa: '}
                {locSite.dimensionsDescription}
              </p>
            )}
          </div>

          {/* Section: Tourist Information & Visiting Regulations */}
          <div className="space-y-4 pt-4 border-t border-[#171817]/15">
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[#171817] flex items-center gap-2 border-b border-[#171817]/15 pb-2.5">
              <Calendar className="w-4 h-4 text-[#526D8B]" />
              <span>
                {lang === 'en'
                  ? 'Visitor Information & Regulations'
                  : lang === 'zh'
                  ? '参观指南与保护规定'
                  : 'Thông Tin Tham Quan & Nội Quy Di Tích'}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#EDE4D0] rounded-2xl border border-[#171817]/15 flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#A94F3D] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#171817]/65 block text-xs font-medium font-sans">
                    {lang === 'en'
                      ? 'Opening Hours:'
                      : lang === 'zh'
                      ? '开放时间：'
                      : 'Thời gian mở cửa:'}
                  </span>
                  <div className="text-[#171817] font-semibold text-sm mt-0.5 tabular-nums">{locSite.openingHours}</div>
                </div>
              </div>

              <div className="p-4 bg-[#EDE4D0] rounded-2xl border border-[#171817]/15 flex items-start gap-3">
                <Ticket className="w-4 h-4 text-[#47796D] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[#171817]/65 block text-xs font-medium font-sans">
                    {lang === 'en'
                      ? 'Admission Ticket:'
                      : lang === 'zh'
                      ? '参观门票：'
                      : 'Giá vé tham quan:'}
                  </span>
                  <div className="text-[#171817] font-semibold text-sm mt-0.5 tabular-nums">{locSite.ticketPrices}</div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-[#EDE4D0] rounded-2xl border border-[#171817]/15 text-xs space-y-2.5">
              <span className="text-[#A94F3D] font-semibold block font-sans text-xs">
                {lang === 'en'
                  ? 'Visitor Guidelines & Preservation Rules:'
                  : lang === 'zh'
                  ? '参观须知与文物保护守则：'
                  : 'Nội Quy & Lưu Ý Bảo Vệ Di Tích:'}
              </span>
              <ul className="list-disc list-inside text-[#171817]/85 space-y-1.5 font-normal leading-relaxed">
                {locSite.regulations.map((reg, i) => (
                  <li key={i}>{reg}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
