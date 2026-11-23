import React, { useState } from 'react';
import { HeritageSite } from '../../types/heritage';
import {
  GuidedTourRoute,
  ResolvedGuidedTour,
  getGuidedStopTip,
  getLocalizedGuidedRoute,
} from '../../data/guidedTours';
import { DEFAULT_SITE_PHOTOS_BY_ID } from '../../data/heritagePhotos';
import { useI18n } from '../../i18n/I18nContext';
import { HeritageSmoothImage } from '../common/HeritageSmoothImage';
import { HeritageTypographicPlate } from '../common/HeritageTypographicPlate';
import {
  ArrowRight,
  Award,
  Box,
  CheckCircle2,
  Compass,
  Headphones,
  Lightbulb,
  Lock,
  MapPin,
  Star,
  Ticket,
  X,
} from 'lucide-react';

interface GuidedTourStarterSectionProps {
  tours: ResolvedGuidedTour[];
  isAuthenticated: boolean;
  masterpieceSite: HeritageSite | null;
  onStartTour: (tour: ResolvedGuidedTour) => void;
  onStartMasterpiece: () => void;
}

const HERITAGE_DOSSIER_BG_BY_INDEX = [
  'bg-[#A94F3D]',
  'bg-[#47796D]',
  'bg-[#526D8B]',
] as const;

interface EditorialRouteCopy {
  title: { vi: string; en: string; zh: string };
  summary: { vi: string; en: string; zh: string };
}

const EDITORIAL_ROUTE_COPY: Record<string, EditorialRouteCopy> = {
  'GUIDED-01': {
    title: {
      vi: 'Tuyến 01: Kiến trúc Đô thị Sài Gòn Xưa',
      en: 'Route 01: Historic Saigon Urban Architecture',
      zh: '路线 01：西贡历史都市建筑精华',
    },
    summary: {
      vi: 'Khám phá những công trình biểu tượng ngay trung tâm thành phố, giao thoa kiến trúc Đông - Tây.',
      en: 'Explore iconic downtown landmarks where Eastern and Western architectural styles harmonize.',
      zh: '探访市中心极具代表性的地标建筑，感受东西方建筑艺术的交融。',
    },
  },
  'GUIDED-02': {
    title: {
      vi: 'Tuyến 02: Ký ức Lịch sử & Kháng chiến',
      en: 'Route 02: Memory of History & Resistance',
      zh: '路线 02：历史记忆与抗战史诗',
    },
    summary: {
      vi: 'Tìm hiểu hệ thống địa đạo độc đáo và những dấu mốc hào hùng trong lịch sử dân tộc.',
      en: 'Discover subterranean tunnel networks and defining milestones of modern Vietnamese history.',
      zh: '探寻精妙的地下坑道体系与铭刻民族历史的重要里程碑。',
    },
  },
  'GUIDED-03': {
    title: {
      vi: 'Tuyến 03: Di sản Biển & Văn hóa Nam Bộ',
      en: 'Route 03: Maritime Heritage & Southern Culture',
      zh: '路线 03：海洋遗产与南部文化',
    },
    summary: {
      vi: 'Ngắm dinh thự ven biển, nhà cổ gỗ quý trăm năm và không gian tín ngưỡng đặc trưng phương Nam.',
      en: 'Admire coastal villas, century-old timber residences, and revered Southern cultural landmarks.',
      zh: '欣赏海滨行宫、百年木构古宅以及富有南部特色的传统信仰空间。',
    },
  },
};

export const GuidedTourStarterSection: React.FC<GuidedTourStarterSectionProps> = ({
  tours,
  isAuthenticated,
  masterpieceSite,
  onStartTour,
  onStartMasterpiece,
}) => {
  const { lang, getLocalizedSite } = useI18n();
  const [failedPhotoMap, setFailedPhotoMap] = useState<Record<string, boolean>>({});

  if (tours.length === 0 && !masterpieceSite) return null;

  const masterpieceShortName = masterpieceSite
    ? getLocalizedSite(masterpieceSite).officialName.split(/\s*[（(]/)[0].trim()
    : lang === 'en'
    ? 'Independence Palace'
    : lang === 'zh'
    ? '独立宫'
    : 'Dinh Độc Lập';

  const kickerLabel =
    lang === 'en'
      ? 'FOR FIRST-TIME VISITORS'
      : lang === 'zh'
      ? '新手入门导览'
      : 'DÀNH CHO NGƯỜI MỚI BẮT ĐẦU';

  const headingText =
    lang === 'en'
      ? 'First time visiting? Choose a way to explore'
      : lang === 'zh'
      ? '首次到访？请选择一种探索方式'
      : 'Lần đầu ghé thăm? Hãy chọn một cách khám phá';

  const descriptionText =
    lang === 'en'
      ? 'Get acquainted quickly with one iconic landmark, or follow a 4-stop itinerary with narration and interactive 3D models.'
      : lang === 'zh'
      ? '您可以先快速体验一座代表性地标建筑，或跟随预设的 4 站式语音解说与交互式 3D 古迹路线深度游览。'
      : 'Bạn có thể làm quen nhanh với 1 công trình tiêu biểu, hoặc đi theo lộ trình 4 di tích có sẵn thuyết minh và mô hình 3D tương tác.';

  const ctaLabel =
    lang === 'en'
      ? `Quick Start: ${masterpieceShortName}`
      : lang === 'zh'
      ? `快速体验：${masterpieceShortName}`
      : `Trải nghiệm nhanh: ${masterpieceShortName}`;

  const ctaSubHint =
    lang === 'en'
      ? 'Recommended 1-minute orientation'
      : lang === 'zh'
      ? '推荐 1 分钟快速上手体验'
      : 'Gợi ý làm quen trong 1 phút';

  const onboardingSteps = [
    {
      icon: Compass,
      title:
        lang === 'en'
          ? 'Step 01 · Choose a destination'
          : lang === 'zh'
          ? '步骤 01 · 选择目的地'
          : 'Bước 01 · Chọn điểm đến',
      desc:
        lang === 'en'
          ? 'Freely pick any of 17 monuments or follow a curated 4-stop route.'
          : lang === 'zh'
          ? '自由选择 17 处遗迹之一，或跟随预设的 4 站精华路线。'
          : 'Chọn tự do 1 trong 17 di tích hoặc đi theo tuyến 4 điểm được sắp xếp sẵn.',
    },
    {
      icon: Box,
      title:
        lang === 'en'
          ? 'Step 02 · Interact in 3D'
          : lang === 'zh'
          ? '步骤 02 · 交互式 3D 模型'
          : 'Bước 02 · Tương tác mô hình 3D',
      desc:
        lang === 'en'
          ? 'Rotate 360°, separate architectural tiers, and toggle X-Ray structural view.'
          : lang === 'zh'
          ? '360 度旋转视角、逐层拆解建筑结构并开启 X 光透视模式。'
          : 'Xoay 360 độ, bóc tách từng tầng kiến trúc và bật chế độ X-Ray xuyên kết cấu.',
    },
    {
      icon: Headphones,
      title:
        lang === 'en'
          ? 'Step 03 · Listen & Ask the Historiographer'
          : lang === 'zh'
          ? '步骤 03 · 语音讲解与史官讲解'
          : 'Bước 03 · Nghe kể chuyện & Hỏi Sử Quan',
      desc:
        lang === 'en'
          ? 'Listen to automatic audio narration and chat live with the Royal Historiographer.'
          : lang === 'zh'
          ? '收听自动语音导览，并与史官讲解实时对话交流。'
          : 'Nghe thuyết minh tự động và trò chuyện trực tiếp với Sử Quan Dấu Ấn.',
    },
  ];

  return (
    <section
      id="guided-tour-concierge"
      aria-label={headingText}
      className="rounded-2xl bg-[#D8C9A9] text-[#171817] border border-[#171817]/15 p-6 sm:p-10"
    >
      {/* 1. Streamlined 2-Column Editorial Header + Consolidated Quick Experience CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-7 border-b border-[#171817]/15 items-start lg:items-center">
        <div className="lg:col-span-8">
          <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#A94F3D] mb-2.5">
            {kickerLabel}
          </div>
          <h3 className="font-serif text-3xl sm:text-[38px] font-normal leading-[1.18] tracking-tight text-[#171817] text-balance">
            {headingText}
          </h3>
          <p className="mt-3 text-[15px] leading-[1.65] text-[#171817]/80 max-w-2xl">
            {descriptionText}
          </p>
        </div>

        <div className="lg:col-span-4 lg:flex lg:flex-col lg:items-end">
          {masterpieceSite && (
            <>
              <button
                type="button"
                onClick={onStartMasterpiece}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#A94F3D] hover:bg-[#171817] text-[#D8C9A9] text-sm font-medium transition-colors inline-flex items-center justify-center gap-2.5 group cursor-pointer sm:whitespace-nowrap shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171817]"
              >
                {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />}
                <span>{ctaLabel}</span>
                <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              <span className="mt-2 block text-xs text-[#171817]/70 text-center lg:text-right">
                {ctaSubHint}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 2. "3 Bước Trải Nghiệm Bảo Tàng Số" Horizontal Guide Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-7">
        {onboardingSteps.map((step) => {
          const StepIcon = step.icon;
          return (
            <div
              key={step.title}
              className="rounded-xl bg-[#171817]/5 border border-[#171817]/15 p-4 flex items-start gap-3.5"
            >
              <div className="w-9 h-9 rounded-lg bg-[#171817] text-[#C9A46A] flex items-center justify-center shrink-0">
                <StepIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[#171817] leading-snug">
                  {step.title}
                </div>
                <p className="mt-1 text-xs leading-[1.55] text-[#171817]/75">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Editorial Photo Cards for the 3 Curated Journeys */}
      {tours.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-7">
          {tours.map((item, idx) => {
            const { route, stops } = item;
            const localizedRoute = getLocalizedGuidedRoute(route, lang);
            const editorialCopy = EDITORIAL_ROUTE_COPY[route.id];
            const cardTitle = editorialCopy
              ? editorialCopy.title[lang]
              : localizedRoute.editorialTitle;
            const cardSummary = editorialCopy
              ? editorialCopy.summary[lang]
              : localizedRoute.theme;

            const stopNames = stops.map((s) =>
              getLocalizedSite(s).officialName.split(/\s*[（(]/)[0].trim()
            );

            const accentBgClass =
              HERITAGE_DOSSIER_BG_BY_INDEX[idx % HERITAGE_DOSSIER_BG_BY_INDEX.length];

            const leadSite = stops[0];
            const coverPhotoUrl =
              leadSite?.photos?.[0] ||
              (leadSite ? DEFAULT_SITE_PHOTOS_BY_ID[leadSite.id]?.[0] : '') ||
              '';
            const photoKey = `${route.id}:${coverPhotoUrl}`;
            const hasCoverPhoto = Boolean(coverPhotoUrl && !failedPhotoMap[photoKey]);

            const badgeLabel =
              lang === 'en'
                ? `ROUTE 0${idx + 1} · ${stops.length} STOPS · ${localizedRoute.durationShort}`
                : lang === 'zh'
                ? `路线 0${idx + 1} · ${stops.length} 站 · ${localizedRoute.durationShort}`
                : `TUYẾN 0${idx + 1} · ${stops.length} ĐIỂM · ${localizedRoute.durationShort}`;

            const startLabel =
              lang === 'en'
                ? `Start ${stops.length}-Stop Journey`
                : lang === 'zh'
                ? `开启 ${stops.length} 站探索之旅`
                : `Bắt đầu hành trình ${stops.length} điểm`;

            return (
              <article
                key={route.id}
                className="rounded-2xl overflow-hidden bg-[#171817] text-[#D8C9A9] shadow-lg border border-[#171817]/20 flex flex-col justify-between group transition-transform duration-300 hover:-translate-y-1"
              >
                {/* Cover Photo (h-44) with zoom-on-hover and Route Badge */}
                <div>
                  <div
                    onClick={() => onStartTour(item)}
                    className="relative h-44 w-full overflow-hidden bg-[#171817] cursor-pointer"
                  >
                    {hasCoverPhoto ? (
                      <HeritageSmoothImage
                        src={coverPhotoUrl}
                        alt={cardTitle}
                        loading="lazy"
                        waitTone="dark"
                        onError={() =>
                          setFailedPhotoMap((prev) => ({ ...prev, [photoKey]: true }))
                        }
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : leadSite ? (
                      <HeritageTypographicPlate
                        site={leadSite}
                        variant="bento"
                        className="w-full h-full"
                      />
                    ) : null}

                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#171817] via-[#171817]/25 to-transparent pointer-events-none"
                    />

                    <span
                      className={`absolute top-3.5 left-3.5 z-10 px-3 py-1 rounded-full ${accentBgClass} text-[#D8C9A9] text-[10.5px] font-semibold tracking-[0.08em] uppercase tabular-nums shadow-md`}
                    >
                      {badgeLabel}
                    </span>
                  </div>

                  {/* Card Body: Serif Title + Concise Description + 4-Stop Numbered Roadmap */}
                  <div className="p-5 flex-1">
                    <h4 className="font-serif text-[20px] sm:text-[21px] leading-[1.3] font-medium text-[#D8C9A9]">
                      {cardTitle}
                    </h4>

                    <p className="mt-2 text-[13px] leading-[1.6] text-[#D8C9A9]/75">
                      {cardSummary}
                    </p>

                    <ol className="mt-4 pt-3.5 border-t border-[#D8C9A9]/12 space-y-2">
                      {stopNames.map((stopName, stopIdx) => (
                        <li
                          key={`${route.id}-stop-${stopIdx}`}
                          className="flex items-center gap-2.5 min-w-0"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#C9A46A]/15 border border-[#C9A46A]/65 text-[#C9A46A] text-[10.5px] font-semibold tabular-nums flex items-center justify-center shrink-0">
                            {stopIdx + 1}
                          </span>
                          <span className="text-xs sm:text-[13px] font-medium text-[#D8C9A9]/95 truncate">
                            {stopName}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Card Bottom Full-Width Route CTA */}
                <div className="px-5 pb-5 pt-1">
                  <button
                    type="button"
                    onClick={() => onStartTour(item)}
                    className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 ${accentBgClass} text-[#D8C9A9] hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A46A]`}
                  >
                    {!isAuthenticated && (
                      <Lock className="w-3.5 h-3.5 text-[#D8C9A9] shrink-0" />
                    )}
                    <span>{startLabel}</span>
                    <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

interface GuidedTourWelcomeModalProps {
  isOpen: boolean;
  visitorName: string;
  tours: ResolvedGuidedTour[];
  hasMasterpiece: boolean;
  onClose: () => void;
  onSelectTour: (tour: ResolvedGuidedTour) => void;
  onStartMasterpiece: () => void;
}

export const GuidedTourWelcomeModal: React.FC<GuidedTourWelcomeModalProps> = ({
  isOpen,
  visitorName,
  tours,
  hasMasterpiece,
  onClose,
  onSelectTour,
  onStartMasterpiece,
}) => {
  const { lang, getLocalizedSite } = useI18n();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        lang === 'en'
          ? 'Choose a curated itinerary tailored for you'
          : lang === 'zh'
          ? '为您精选专属主题游览路线'
          : 'Chọn hành trình gợi ý dành riêng cho bạn'
      }
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-sm bg-[#D8C9A9] text-[#171817] border border-[#171817]/20 p-6 sm:p-8 space-y-6 my-auto animate-apple-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#171817]/15 pb-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#A94F3D] block">
              {lang === 'en'
                ? `WELCOME ${visitorName} TO DẤU ẤN VIỆT 3D`
                : lang === 'zh'
                ? `欢迎 ${visitorName} 来到越南印记 3D`
                : `CHÀO MỪNG ${visitorName} ĐẾN VỚI DẤU ẤN VIỆT 3D`}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#171817]">
              {lang === 'en'
                ? 'First time visiting? Choose a curated itinerary tailored for you'
                : lang === 'zh'
                ? '首次到访？为您精选专属主题游览路线'
                : 'Lần đầu ghé thăm? Chọn hành trình gợi ý dành riêng cho bạn'}
            </h3>
            <p className="text-xs sm:text-sm text-[#171817]/75">
              {lang === 'en'
                ? 'Step-by-step guided narration across 3D monument stations with X-Ray dissection, the 1815 map, and audio guides.'
                : lang === 'zh'
                ? '分站式 3D 古迹导览将带您深入探索 X 光透视剖面、1815 年历史地图与同步语音解说。'
                : 'Trợ lý dẫn đường sẽ đưa bạn đi qua từng chặng di tích 3D kèm mẹo tương tác X-Ray, Bản đồ 1815 và thuyết minh.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
            className="w-8 h-8 rounded-sm bg-[#171817]/10 hover:bg-[#171817] text-[#171817] hover:text-[#D8C9A9] flex items-center justify-center cursor-pointer shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tours.map((item, idx) => {
            const { route, stops } = item;
            const localizedRoute = getLocalizedGuidedRoute(route, lang);
            const bgClass =
              HERITAGE_DOSSIER_BG_BY_INDEX[idx % HERITAGE_DOSSIER_BG_BY_INDEX.length];

            return (
              <button
                key={route.id}
                type="button"
                onClick={() => onSelectTour(item)}
                className={`text-left rounded-sm ${bgClass} p-5 flex flex-col justify-between gap-4 transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer group`}
              >
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#C9A46A] tabular-nums">
                    {localizedRoute.durationShort} · {stops.length}{' '}
                    {lang === 'en' ? 'STOPS' : lang === 'zh' ? '站' : 'CHẶNG'}
                  </div>
                  <div className="font-serif text-lg text-[#D8C9A9] leading-snug">
                    {localizedRoute.editorialTitle}
                  </div>
                  <div className="text-xs text-[#D8C9A9]/85 leading-relaxed">
                    {stops
                      .map((s) => getLocalizedSite(s).officialName.split(/\s*[（(]/)[0].trim())
                      .join(' → ')}
                  </div>
                </div>
                <div className="text-xs font-semibold text-[#D8C9A9] group-hover:text-[#C9A46A] inline-flex items-center gap-1.5 pt-3 border-t border-[#D8C9A9]/20 transition-colors">
                  <span>
                    {lang === 'en'
                      ? 'Select itinerary'
                      : lang === 'zh'
                      ? '选择此路线'
                      : 'Chọn tuyến này'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#171817]/15">
          {hasMasterpiece ? (
            <button
              type="button"
              onClick={onStartMasterpiece}
              className="px-5 py-3 rounded-sm bg-[#171817] hover:bg-[#A94F3D] text-[#D8C9A9] text-xs font-medium inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>
                {lang === 'en'
                  ? 'Explore opening masterpiece'
                  : lang === 'zh'
                  ? '立即探索代表性杰作'
                  : 'Khám phá ngay kiệt tác tiêu biểu nhất'}
              </span>
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-sm border border-[#171817]/25 hover:bg-[#171817]/10 text-xs font-medium text-[#171817] cursor-pointer transition-colors"
          >
            {lang === 'en'
              ? 'Explore on my own'
              : lang === 'zh'
              ? '稍后，我先自由浏览'
              : 'Để sau, tôi tự khám phá'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface GuidedTourProgressBarProps {
  route: GuidedTourRoute;
  stops: HeritageSite[];
  stepIndex: number;
  positionClassName: string;
  onNextStep: () => void;
  onOpenAudioGuide: (site: HeritageSite) => void;
  onExitTour: () => void;
}

export const GuidedTourProgressBar: React.FC<GuidedTourProgressBarProps> = ({
  route,
  stops,
  stepIndex,
  positionClassName,
  onNextStep,
  onOpenAudioGuide,
  onExitTour,
}) => {
  const { lang, getLocalizedSite } = useI18n();

  if (stops.length === 0) return null;

  const safeIndex = Math.min(Math.max(0, stepIndex), stops.length - 1);
  const currentStop = stops[safeIndex];
  const currentSiteName = getLocalizedSite(currentStop).officialName;
  const localizedRoute = getLocalizedGuidedRoute(route, lang);
  const isLastStep = safeIndex >= stops.length - 1;
  const progressPct = Math.round(((safeIndex + 1) / stops.length) * 100);
  const tipText = getGuidedStopTip(route, currentStop.id, lang);

  return (
    <aside
      aria-label={
        lang === 'en'
          ? 'Guided itinerary navigation bar'
          : lang === 'zh'
          ? '导览路线导航栏'
          : 'Thanh dẫn đường lộ trình tham quan'
      }
      className={`fixed z-30 w-[calc(100%-1.5rem)] max-w-[780px] rounded-2xl bg-[#161618]/92 backdrop-blur-2xl border border-[#C5A059]/45 shadow-[0_18px_48px_rgba(0,0,0,0.85)] overflow-hidden transition-all ${positionClassName}`}
    >
      {/* Thin Champagne Gold progress rail */}
      <div className="h-[2px] w-full bg-white/[0.08]">
        <div
          className="h-full bg-[#C5A059] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Route name + Step progress + Interactive Tip */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span className="inline-flex items-center gap-1 font-medium text-[#C5A059] whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{localizedRoute.editorialTitle}</span>
            </span>
            <span className="text-white/25 hidden sm:inline">·</span>
            <span className="font-semibold text-[#F5F5F7] tabular-nums truncate">
              {lang === 'en'
                ? `Stop ${safeIndex + 1} / ${stops.length}: ${currentSiteName}`
                : lang === 'zh'
                ? `第 ${safeIndex + 1} / ${stops.length} 站：${currentSiteName}`
                : `Chặng ${safeIndex + 1} / ${stops.length}: ${currentSiteName}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#A1A1A6]">
            <Lightbulb className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
            <span className="truncate">{tipText}</span>
          </div>
        </div>

        {/* Right: Audio Guide + Next Stop / Complete + Exit */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenAudioGuide(currentStop)}
            className="px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-[#F5F5F7] text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Headphones className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
            <span>
              {lang === 'en'
                ? 'Audio Guide'
                : lang === 'zh'
                ? '语音导览'
                : 'Nghe thuyết minh'}
            </span>
          </button>

          <button
            type="button"
            onClick={onNextStep}
            className="px-3.5 py-1.5 rounded-full bg-[#C5A059] hover:bg-[#D5B26B] text-[#121110] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>
              {isLastStep
                ? lang === 'en'
                  ? 'Complete Journey'
                  : lang === 'zh'
                  ? '完成路线之旅'
                  : 'Hoàn thành hành trình'
                : lang === 'en'
                ? 'Next Monument →'
                : lang === 'zh'
                ? '下一处古迹 →'
                : 'Di tích tiếp theo →'}
            </span>
          </button>

          <button
            type="button"
            onClick={onExitTour}
            className="px-2.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-[#A1A1A6] hover:text-[#F5F5F7] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
            title={
              lang === 'en'
                ? 'Exit guided mode'
                : lang === 'zh'
                ? '退出导览模式'
                : 'Thoát chế độ dẫn đường'
            }
          >
            {lang === 'en' ? '✕ Exit' : lang === 'zh' ? '✕ 退出' : '✕ Thoát tuyến'}
          </button>
        </div>
      </div>
    </aside>
  );
};

interface GuidedTourCompletionModalProps {
  completedRoute: { route: GuidedTourRoute; stopCount: number } | null;
  onClose: () => void;
  onGoToTicketsAndCertificate: () => void;
  onOpenFeedback: () => void;
}

export const GuidedTourCompletionModal: React.FC<GuidedTourCompletionModalProps> = ({
  completedRoute,
  onClose,
  onGoToTicketsAndCertificate,
  onOpenFeedback,
}) => {
  const { lang } = useI18n();

  if (!completedRoute) return null;

  const localizedRoute = getLocalizedGuidedRoute(completedRoute.route, lang);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        lang === 'en'
          ? 'Heritage Journey Completed'
          : lang === 'zh'
          ? '遗产探索路线已完成'
          : 'Hoàn thành Hành trình Di sản'
      }
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[28px] bg-[#161618] border border-[#C5A059]/55 p-6 sm:p-8 text-[#F5F5F7] shadow-[0_32px_90px_rgba(0,0,0,0.92)] space-y-5 my-auto animate-apple-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/20 border border-[#C5A059]/50 flex items-center justify-center text-[#C5A059]">
            <Award className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-[#A1A1A6] hover:text-[#F5F5F7] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'en'
                ? 'Synced completed itinerary to your profile & Admin Studio'
                : lang === 'zh'
                ? '已将路线完成记录同步至个人档案与管理后台'
                : 'Đã đồng bộ hoàn thành lộ trình vào hồ sơ & Admin Studio'}
            </span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#F5F5F7]">
            {lang === 'en'
              ? 'You have completed the Heritage Journey'
              : lang === 'zh'
              ? '您已圆满完成本次遗产探索之旅'
              : 'Bạn đã hoàn thành Hành trình Di sản!'}
          </h3>
          <p className="text-xs sm:text-sm text-[#A1A1A6] leading-relaxed">
            {lang === 'en' ? (
              <>
                Congratulations on visiting all{' '}
                <strong className="text-[#F5F5F7] tabular-nums">
                  {completedRoute.stopCount} monument stops
                </strong>{' '}
                in <strong className="text-[#C5A059]">{localizedRoute.editorialTitle}</strong>.
              </>
            ) : lang === 'zh' ? (
              <>
                祝贺您完整游览了{' '}
                <strong className="text-[#C5A059]">{localizedRoute.editorialTitle}</strong> 的全部{' '}
                <strong className="text-[#F5F5F7] tabular-nums">
                  {completedRoute.stopCount} 处古迹站点
                </strong>
                。
              </>
            ) : (
              <>
                Chúc mừng bạn đã đi qua toàn bộ{' '}
                <strong className="text-[#F5F5F7] tabular-nums">
                  {completedRoute.stopCount} chặng di tích
                </strong>{' '}
                thuộc <strong className="text-[#C5A059]">{localizedRoute.editorialTitle}</strong>.
              </>
            )}
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={onGoToTicketsAndCertificate}
            className="w-full py-3 px-5 rounded-full bg-[#C5A059] hover:bg-[#D5B26B] text-[#121110] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Ticket className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'en'
                ? 'Claim Pass & Journey Certificate'
                : lang === 'zh'
                ? '领取数字门票与旅程证书'
                : 'Nhận Vé & Chứng nhận Hành trình'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenFeedback}
            className="w-full py-3 px-5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-[#F5F5F7] text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Star className="w-4 h-4 text-[#C5A059] fill-[#C5A059] shrink-0" />
            <span>
              {lang === 'en'
                ? 'Submit Experience Feedback'
                : lang === 'zh'
                ? '提交游览体验评价'
                : 'Gửi đánh giá trải nghiệm'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

