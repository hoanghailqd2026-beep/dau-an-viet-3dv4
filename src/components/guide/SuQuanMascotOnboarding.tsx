import React, { useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Language } from '../../i18n/types';

export const ONBOARDING_DONE_STORAGE_KEY = 'dauAnViet_onboardingDone';

export function getOnboardingDoneStorageKey(uid: string): string {
  return `${ONBOARDING_DONE_STORAGE_KEY}_${uid}`;
}

export type OnboardingStep = 1 | 2 | 3 | 4;

interface SuQuanMascotSvgProps {
  size?: 'lg' | 'sm';
  className?: string;
}

/**
 * Pure vector SVG mascot: "Sử Quan Dấu Ấn"
 * Palette:
 * - Charcoal khăn đóng: #171817 with heritage gold trim #C9A46A
 * - Museum jade áo tấc / áo dài ngũ thân: #47796D with terracotta collar #A94F3D
 * - Architectural blueprint scroll: #D8C9A9 with slate drafting ink #526D8B
 * Zero emojis, zero external image URLs.
 */
export const SuQuanMascotSvg: React.FC<SuQuanMascotSvgProps> = ({
  size = 'lg',
  className = '',
}) => {
  const dimensionClass =
    size === 'sm'
      ? 'w-[86px] h-[98px] sm:w-[96px] sm:h-[108px]'
      : 'w-[172px] h-[196px] sm:w-[192px] sm:h-[218px]';

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-end select-none shrink-0 ${dimensionClass} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 220 245"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        {/* Subtle floating elliptical ground shadow beneath feet */}
        <ellipse
          cx="110"
          cy="232"
          rx="52"
          ry="9"
          fill="#171817"
          className="animate-float-shadow"
        />

        {/* Floating character group */}
        <g className="animate-float">
          {/* Archival Compass Halo behind head */}
          <circle
            cx="110"
            cy="96"
            r="68"
            fill="#D8C9A9"
            fillOpacity="0.22"
            stroke="#C9A46A"
            strokeOpacity="0.45"
            strokeWidth="1.2"
            strokeDasharray="4 5"
          />
          <circle
            cx="110"
            cy="96"
            r="56"
            stroke="#47796D"
            strokeOpacity="0.18"
            strokeWidth="1"
          />

          {/* Lower Shoes / Hem Peek */}
          <ellipse cx="94" cy="212" rx="11" ry="5.5" fill="#171817" />
          <ellipse cx="126" cy="212" rx="11" ry="5.5" fill="#171817" />

          {/* Áo Tấc / Áo Dài Ngũ Thân Outer Robe (#47796D) */}
          <path
            d="M66 130C66 117 81 110 110 110C139 110 154 117 154 130L164 202C164 207 160 211 154 211H66C60 211 56 207 56 202L66 130Z"
            fill="#47796D"
            stroke="#171817"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Inner Five-Panel Lapel Shading & Diagonal Flap */}
          <path
            d="M110 113L146 138L152 211H110V113Z"
            fill="#3B665C"
            fillOpacity="0.65"
          />
          <path
            d="M95 118C105 123 128 131 146 142"
            stroke="#C9A46A"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Traditional Ngũ Thân Gold Buttons */}
          <circle cx="137" cy="136.5" r="2.6" fill="#C9A46A" stroke="#171817" strokeWidth="1" />
          <circle cx="144" cy="148" r="2.6" fill="#C9A46A" stroke="#171817" strokeWidth="1" />
          <circle cx="147" cy="161" r="2.6" fill="#C9A46A" stroke="#171817" strokeWidth="1" />

          {/* Lower Hem Heritage Gold Border */}
          <path
            d="M58 201H162"
            stroke="#C9A46A"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Wide Áo Tấc Sleeves */}
          <path
            d="M71 124C52 130 40 148 44 168C47 179 62 183 76 175L84 156"
            fill="#47796D"
            stroke="#171817"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M149 124C168 130 180 148 176 168C173 179 158 183 144 175L136 156"
            fill="#47796D"
            stroke="#171817"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Terracotta Sleeve Cuffs (#A94F3D) */}
          <path
            d="M46 164C51 172 62 175 73 171"
            stroke="#A94F3D"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M174 164C169 172 158 175 147 171"
            stroke="#A94F3D"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Standing Terracotta Collar (#A94F3D) with Gold Trim */}
          <path
            d="M91 108C91 104 99 102 110 102C121 102 129 104 129 108V121C129 125 121 128 110 128C99 128 91 125 91 121V108Z"
            fill="#A94F3D"
            stroke="#171817"
            strokeWidth="2.2"
          />
          <path
            d="M94 121C101 125 119 125 126 121"
            stroke="#C9A46A"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="110" cy="117" r="2.8" fill="#C9A46A" />

          {/* Architectural Blueprint Scroll (#D8C9A9) held in front */}
          <g>
            {/* Unrolled center blueprint sheet */}
            <rect
              x="71"
              y="148"
              width="78"
              height="40"
              rx="4"
              fill="#D8C9A9"
              stroke="#171817"
              strokeWidth="2"
            />
            {/* Blueprint inner drafting frame & Vietnamese arch motif (#526D8B) */}
            <rect
              x="77"
              y="153"
              width="66"
              height="30"
              rx="1.5"
              stroke="#526D8B"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <path
              d="M92 178V167C92 161.5 100 158 110 158C120 158 128 161.5 128 167V178"
              stroke="#526D8B"
              strokeWidth="1.4"
            />
            <path
              d="M86 164C98 161 122 161 134 164"
              stroke="#A94F3D"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <line x1="110" y1="154" x2="110" y2="181" stroke="#526D8B" strokeWidth="0.9" strokeOpacity="0.6" />
            <circle cx="110" cy="168" r="2.4" fill="#A94F3D" />

            {/* Left Rolled Cylinder + Gold Finials */}
            <rect
              x="61"
              y="144"
              width="13"
              height="48"
              rx="6.5"
              fill="#EDE4D0"
              stroke="#171817"
              strokeWidth="2"
            />
            <rect x="64" y="139" width="7" height="5" rx="2" fill="#C9A46A" stroke="#171817" strokeWidth="1.4" />
            <rect x="64" y="192" width="7" height="5" rx="2" fill="#C9A46A" stroke="#171817" strokeWidth="1.4" />

            {/* Right Rolled Cylinder + Gold Finials */}
            <rect
              x="146"
              y="144"
              width="13"
              height="48"
              rx="6.5"
              fill="#EDE4D0"
              stroke="#171817"
              strokeWidth="2"
            />
            <rect x="149" y="139" width="7" height="5" rx="2" fill="#C9A46A" stroke="#171817" strokeWidth="1.4" />
            <rect x="149" y="192" width="7" height="5" rx="2" fill="#C9A46A" stroke="#171817" strokeWidth="1.4" />

            {/* Warm Hands holding the scroll edges */}
            <ellipse cx="69" cy="168" rx="8.5" ry="7.5" fill="#F4D7BC" stroke="#171817" strokeWidth="2" />
            <ellipse cx="151" cy="168" rx="8.5" ry="7.5" fill="#F4D7BC" stroke="#171817" strokeWidth="2" />
          </g>

          {/* Ears */}
          <ellipse cx="70" cy="79" rx="6.5" ry="8.5" fill="#F0CCA9" stroke="#171817" strokeWidth="2" />
          <ellipse cx="150" cy="79" rx="6.5" ry="8.5" fill="#F0CCA9" stroke="#171817" strokeWidth="2" />

          {/* Friendly Head & Expressive Face */}
          <rect
            x="73"
            y="43"
            width="74"
            height="68"
            rx="34"
            fill="#F6DEC7"
            stroke="#171817"
            strokeWidth="2.2"
          />

          {/* Soft Warm Cheek Blush */}
          <ellipse cx="87" cy="87" rx="6.5" ry="3.8" fill="#A94F3D" fillOpacity="0.22" />
          <ellipse cx="133" cy="87" rx="6.5" ry="3.8" fill="#A94F3D" fillOpacity="0.22" />

          {/* Kind Arched Eyebrows */}
          <path
            d="M87 69C91 65.5 97 65.5 101 68.5"
            stroke="#171817"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M119 68.5C123 65.5 129 65.5 133 69"
            stroke="#171817"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Lively Eyes with Bright Catchlights */}
          <ellipse cx="95" cy="78" rx="4.8" ry="5.6" fill="#171817" />
          <circle cx="96.6" cy="76.2" r="1.8" fill="#FFFFFF" />
          <circle cx="93.6" cy="80.2" r="0.9" fill="#FFFFFF" />

          <ellipse cx="125" cy="78" rx="4.8" ry="5.6" fill="#171817" />
          <circle cx="126.6" cy="76.2" r="1.8" fill="#FFFFFF" />
          <circle cx="123.6" cy="80.2" r="0.9" fill="#FFFFFF" />

          {/* Gentle Nose Dot & Warm Welcoming Smile */}
          <path
            d="M108.5 84.5C109.5 85.8 110.5 85.8 111.5 84.5"
            stroke="#C98F6A"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M99 92.5C103.2 98.2 116.8 98.2 121 92.5"
            stroke="#171817"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Traditional Khăn Đóng (#171817) with Layered Folds & Gold Trim (#C9A46A) */}
          <g>
            {/* Upper Crown */}
            <path
              d="M68 54C68 32 85 20 110 20C135 20 152 32 152 54V60C140 53 125 49 110 49C95 49 80 53 68 60V54Z"
              fill="#171817"
              stroke="#171817"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Signature Crossed Front Folds (Chữ Nhân) */}
            <path
              d="M72 47C88 37 104 35 123 41"
              stroke="#343633"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M148 47C132 37 116 35 97 41"
              stroke="#343633"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Gold Rim Band (#C9A46A) */}
            <path
              d="M69 55C83 46.5 96 44 110 44C124 44 137 46.5 151 55"
              stroke="#C9A46A"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            {/* Central Heritage Gold Medallion */}
            <circle cx="110" cy="44" r="6" fill="#C9A46A" stroke="#171817" strokeWidth="1.8" />
            <circle cx="110" cy="44" r="2.2" fill="#A94F3D" />
          </g>
        </g>
      </svg>
    </div>
  );
};

interface StationSelectors {
  primarySelectors: string[];
  secondarySelectors?: string[];
}

const STATION_SELECTORS: Record<2 | 3 | 4, StationSelectors> = {
  2: {
    primarySelectors: ['[data-onboarding-target="monuments"]'],
  },
  3: {
    primarySelectors: [
      '[data-onboarding-target="space3d"]',
      '[data-onboarding-target="nav-space3d"]',
    ],
  },
  4: {
    primarySelectors: ['[data-onboarding-target="suquan-chat"]'],
    secondarySelectors: ['[data-onboarding-target="nav-dossier"]'],
  },
};

interface OnboardingLocaleCopy {
  skipTour: string;
  back: string;
  next: string;
  finish: string;
  startTour: string;
  progressAria: (step: OnboardingStep) => string;
  langSwitcherAria: string;
  step1: {
    kicker: string;
    title: string;
    body: string;
    footerCaption: string;
  };
  stations: Record<2 | 3 | 4, { title: string; body: string }>;
}

const ONBOARDING_COPY: Record<Language, OnboardingLocaleCopy> = {
  vi: {
    skipTour: 'Bỏ qua hướng dẫn',
    back: 'Quay lại',
    next: 'Tiếp theo',
    finish: 'Hoàn tất & Khám phá',
    startTour: 'Bắt đầu tham quan',
    progressAria: (s) => `Bước ${s} trên 4`,
    langSwitcherAria: 'Chọn ngôn ngữ hướng dẫn',
    step1: {
      kicker: 'SỬ QUAN DẤU ẤN · BẢO TÀNG SỐ ĐÔNG NAM BỘ',
      title: 'Chào mừng đến với Dấu Ấn Việt 3D!',
      body: 'Ta là Sử Quan Dấu Ấn — người gác kho tàng kiến trúc. Hãy để ta dẫn bạn dạo một vòng khám phá bảo tàng số chỉ trong 30 giây nhé!',
      footerCaption: 'Hành trình 4 trạm · Khám phá kiến trúc 3D & Lịch sử 300 năm',
    },
    stations: {
      2: {
        title: 'Trạm 2/4 – Kho tàng 17 Di tích Biểu tượng',
        body: 'Tại đây quy tụ 17 công trình kiến trúc đặc sắc từ Sài Gòn – Gia Định đến Đông Nam Bộ. Hãy chạm vào bất kỳ di tích nào để mở Hồ sơ Di sản.',
      },
      3: {
        title: 'Trạm 3/4 – Trình xem 3D & Chế độ X-Ray',
        body: 'Xoay 360 độ, bóc tách từng tầng kiến trúc hoặc bật chế độ X-Ray xuyên thấu để quan sát kết cấu nội thất và đường hầm ẩn sâu bên trong.',
      },
      4: {
        title: 'Trạm 4/4 – Dòng chảy 300 năm & Hỏi đáp Sử Quan',
        body: 'Kéo thanh thời gian để đối chiếu bản đồ cổ năm 1815 với hiện tại, hoặc trò chuyện trực tiếp cùng ta bất cứ lúc nào để giải đáp lịch sử.',
      },
    },
  },
  en: {
    skipTour: 'Skip tour',
    back: 'Back',
    next: 'Next',
    finish: 'Finish & Explore',
    startTour: 'Start Tour',
    progressAria: (s) => `Step ${s} of 4`,
    langSwitcherAria: 'Choose tour language',
    step1: {
      kicker: 'IMPERIAL HISTORIAN · SOUTHEASTERN DIGITAL MUSEUM',
      title: 'Welcome to Dấu Ấn Việt 3D!',
      body: 'I am the Imperial Historian — guardian of this architectural treasury. Let me guide you on a 30-second tour of our digital museum!',
      footerCaption: '4-Stop Journey · Explore 3D Architecture & 300 Years of History',
    },
    stations: {
      2: {
        title: 'Stop 2/4 – Treasury of 17 Iconic Heritage Sites',
        body: 'Here gather 17 remarkable architectural landmarks from Saigon – Gia Dinh to the Southeast region. Tap any site to open its Heritage Dossier.',
      },
      3: {
        title: 'Stop 3/4 – 3D Viewer & X-Ray Mode',
        body: 'Rotate 360 degrees, separate architectural layers, or activate X-Ray mode to look right through walls into interior halls and underground tunnels.',
      },
      4: {
        title: 'Stop 4/4 – 300-Year Timeline & Historian Assistant',
        body: 'Slide the timeline to compare the historic 1815 map with the present day, or chat with me anytime to explore deeper historical stories.',
      },
    },
  },
  zh: {
    skipTour: '跳过导览',
    back: '上一步',
    next: '下一步',
    finish: '完成并探索',
    startTour: '开始导览',
    progressAria: (s) => `第 ${s} 步，共 4 步`,
    langSwitcherAria: '选择导览语言',
    step1: {
      kicker: '印记史官 · 东南部数字博物馆',
      title: '欢迎来到 Dấu Ấn Việt 3D！',
      body: '吾乃印记史官——这座建筑宝库的守护者。请随我开启一段30秒的数字博物馆导览之旅吧！',
      footerCaption: '四站式导览 · 探索3D建筑与三百年历史',
    },
    stations: {
      2: {
        title: '第 2/4 站 – 17座标志性历史遗迹宝库',
        body: '这里汇聚了从西贡—嘉定到东南部地区的17座杰出建筑地标。点击任意遗迹即可打开完整遗产档案。',
      },
      3: {
        title: '第 3/4 站 – 3D全景模型与X光透视模式',
        body: '360度自由旋转、分层拆解建筑结构，或开启X光透视模式，直视深藏于建筑内部的厅堂与地下隧道。',
      },
      4: {
        title: '第 4/4 站 – 三百年历史长河与史官问答',
        body: '拖动时间轴对比1815年古地图与现代风貌，或随时与我对话，深入探寻每座遗迹背后的历史故事。',
      },
    },
  },
};

const COMPACT_LANG_OPTIONS: Array<{ id: Language; label: string }> = [
  { id: 'vi', label: 'VI' },
  { id: 'en', label: 'EN' },
  { id: 'zh', label: 'ZH' },
];

export function getOnboardingLockedPrompt(lang: Language): string {
  if (lang === 'en') {
    return 'The Imperial Historian guided tour is available for signed-in accounts only. Please sign in to begin.';
  }
  if (lang === 'zh') {
    return '印记史官导览功能仅限已登录账户使用，请先登录以开启导览。';
  }
  return 'Tính năng Sử Quan dẫn đường tham quan chỉ dành cho tài khoản đã đăng nhập. Vui lòng đăng nhập để bắt đầu.';
}

function isElementVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function findFirstVisibleElement(selectors: string[]): HTMLElement | null {
  for (const selector of selectors) {
    const matches = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const visible = matches.find(isElementVisible);
    if (visible) return visible;
  }
  return null;
}

interface SuQuanMascotOnboardingProps {
  isOpen: boolean;
  step: OnboardingStep;
  language?: Language;
  onChangeLanguage?: (nextLang: Language) => void;
  onChangeStep: (nextStep: OnboardingStep) => void;
  onComplete: () => void;
  onSkip: () => void;
  onEnsureExploreView: () => void;
}

export const SuQuanMascotOnboarding: React.FC<SuQuanMascotOnboardingProps> = ({
  isOpen,
  step,
  language,
  onChangeLanguage,
  onChangeStep,
  onComplete,
  onSkip,
  onEnsureExploreView,
}) => {
  const { lang: contextLang, setLang: setContextLang } = useI18n();
  const activeLang: Language = language ?? contextLang ?? 'vi';
  const handleSelectLanguage = (nextLang: Language) => {
    if (onChangeLanguage) {
      onChangeLanguage(nextLang);
    } else {
      setContextLang(nextLang);
    }
  };

  const copy = ONBOARDING_COPY[activeLang] || ONBOARDING_COPY.vi;

  // Highlight active DOM station & scroll smoothly on Steps 2, 3, 4
  useEffect(() => {
    if (!isOpen || step === 1) return;

    onEnsureExploreView();

    const selectors = STATION_SELECTORS[step];
    const highlightedElements: HTMLElement[] = [];

    const timer = window.setTimeout(() => {
      const primaryEl = findFirstVisibleElement(selectors.primarySelectors);
      if (primaryEl) {
        primaryEl.classList.add('onboarding-spotlight-ring');
        highlightedElements.push(primaryEl);

        const pos = window.getComputedStyle(primaryEl).position;
        if (pos !== 'fixed' && pos !== 'sticky') {
          primaryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      if (selectors.secondarySelectors?.length) {
        const secondaryEl = findFirstVisibleElement(selectors.secondarySelectors);
        if (secondaryEl && secondaryEl !== primaryEl) {
          secondaryEl.classList.add('onboarding-spotlight-ring');
          highlightedElements.push(secondaryEl);
        }
      }
    }, 120);

    return () => {
      window.clearTimeout(timer);
      highlightedElements.forEach((el) => el.classList.remove('onboarding-spotlight-ring'));
    };
  }, [isOpen, step, onEnsureExploreView]);

  // Allow Escape to skip onboarding cleanly
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onSkip]);

  if (!isOpen) return null;

  const renderProgressDashes = (currentStep: OnboardingStep) => (
    <div
      className="flex items-center gap-1.5"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={4}
      aria-valuenow={currentStep}
      aria-label={copy.progressAria(currentStep)}
    >
      {([1, 2, 3, 4] as OnboardingStep[]).map((idx) => {
        const isCurrent = idx === currentStep;
        const isDone = idx < currentStep;
        return (
          <span
            key={idx}
            className={`h-2 rounded-full transition-all duration-300 ${
              isCurrent
                ? 'w-9 bg-[#47796D]'
                : isDone
                ? 'w-6 bg-[#C9A46A]'
                : 'w-5 bg-[#171817]/15'
            }`}
          />
        );
      })}
      <span className="ml-1.5 text-[11px] font-semibold tabular-nums text-[#171817]/60">
        {currentStep}/4
      </span>
    </div>
  );

  const renderCompactLangSwitcher = () => (
    <div
      role="group"
      aria-label={copy.langSwitcherAria}
      className="inline-flex items-center p-0.5 rounded-full bg-[#EDE4D0] border border-[#171817]/15 shrink-0"
    >
      {COMPACT_LANG_OPTIONS.map((opt, idx) => {
        const isSelected = activeLang === opt.id;
        return (
          <React.Fragment key={opt.id}>
            {idx > 0 && (
              <span
                aria-hidden="true"
                className="text-[9px] text-[#171817]/25 select-none px-0.5"
              >
                |
              </span>
            )}
            <button
              type="button"
              onClick={() => handleSelectLanguage(opt.id)}
              aria-pressed={isSelected}
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-[#171817] text-[#C9A46A] shadow-xs'
                  : 'text-[#171817]/65 hover:text-[#171817]'
              }`}
            >
              {opt.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );

  // =========================================================================
  // STEP 1/4: CENTERED DUOLINGO-STYLE WELCOME MODAL
  // =========================================================================
  if (step === 1) {
    return (
      <div
        className="fixed inset-0 z-[96] bg-[#171817]/60 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="suquan-welcome-title"
      >
        <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto heritage-scrollbar rounded-3xl bg-[#F7F3EB] border border-[#C9A46A]/55 shadow-[0_28px_84px_rgba(23,24,23,0.48)] text-[#171817]">
          {/* Top Bar: 4-step Progress Dashes + Compact VI | EN | ZH Switcher + Skip Button */}
          <div className="px-5 sm:px-8 pt-5 pb-4 border-b border-[#171817]/10 flex flex-wrap items-center justify-between gap-3">
            {renderProgressDashes(1)}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {renderCompactLangSwitcher()}
              <button
                type="button"
                onClick={onSkip}
                className="text-xs sm:text-sm font-medium text-[#171817]/65 hover:text-[#A94F3D] transition-colors cursor-pointer whitespace-nowrap"
              >
                {copy.skipTour}
              </button>
            </div>
          </div>

          {/* 2-Column Body: Mascot Left + Speech Bubble Right */}
          <div className="px-6 sm:px-8 py-6 sm:py-8 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-center">
            <div className="flex flex-col items-center justify-center">
              <SuQuanMascotSvg size="lg" />
            </div>

            <div className="relative bg-white rounded-2xl p-5 sm:p-6 shadow-[0_12px_32px_rgba(23,24,23,0.08)] border border-[#171817]/10">
              {/* Directional speech bubble tail: left on desktop, top on mobile */}
              <span
                aria-hidden="true"
                className="hidden md:block absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rotate-45 bg-white border-l border-b border-[#171817]/10"
              />
              <span
                aria-hidden="true"
                className="md:hidden block absolute left-1/2 -translate-x-1/2 -top-2.5 w-5 h-5 rotate-45 bg-white border-l border-t border-[#171817]/10"
              />

              <p className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A94F3D]">
                {copy.step1.kicker}
              </p>
              <h2
                id="suquan-welcome-title"
                className="relative z-10 font-serif text-xl sm:text-2xl font-semibold text-[#171817] mt-1.5 leading-snug"
              >
                {copy.step1.title}
              </h2>
              <p className="relative z-10 text-sm sm:text-[15px] leading-relaxed text-[#171817]/80 mt-3">
                {copy.step1.body}
              </p>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="px-6 sm:px-8 py-4 sm:py-5 bg-[#EDE4D0]/70 border-t border-[#171817]/10 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#171817]/65">
              {copy.step1.footerCaption}
            </span>
            <button
              type="button"
              onClick={() => {
                onEnsureExploreView();
                onChangeStep(2);
              }}
              className="bg-[#47796D] hover:bg-[#3b665c] text-[#F7F3EB] rounded-full px-7 py-3 text-sm font-medium shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{copy.startTour}</span>
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 shrink-0"
                aria-hidden="true"
              >
                <path d="M4 10h12" />
                <path d="M11 5l5 5-5 5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STEPS 2/4, 3/4, 4/4: COMPACT FLOATING COMPANION WITH MINI MASCOT
  // =========================================================================
  const station = copy.stations[step];
  const isFinalStep = step === 4;

  return (
    <aside
      role="dialog"
      aria-live="polite"
      aria-label={station.title}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl shadow-2xl rounded-3xl bg-[#F7F3EB]/98 backdrop-blur-md border-2 border-[#C9A46A]/65 text-[#171817] overflow-hidden"
    >
      {/* Top Progress Strip + Compact VI | EN | ZH Switcher + Skip */}
      <div className="px-4 sm:px-5 pt-3.5 pb-2.5 border-b border-[#171817]/10 flex flex-wrap items-center justify-between gap-2.5">
        {renderProgressDashes(step)}
        <div className="flex items-center gap-2.5">
          {renderCompactLangSwitcher()}
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-medium text-[#171817]/65 hover:text-[#A94F3D] transition-colors cursor-pointer whitespace-nowrap"
          >
            {copy.skipTour}
          </button>
        </div>
      </div>

      {/* Mini Mascot + Speech Bubble */}
      <div className="px-4 sm:px-5 py-4 flex items-center gap-3.5 sm:gap-4">
        <SuQuanMascotSvg size="sm" />

        <div className="relative flex-1 min-w-0 bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-[#171817]/10">
          {/* Left-pointing speech tail */}
          <span
            aria-hidden="true"
            className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-white border-l border-b border-[#171817]/10"
          />
          <p className="relative z-10 text-[11px] font-semibold text-[#A94F3D] tracking-wide">
            {station.title}
          </p>
          <p className="relative z-10 text-xs sm:text-[13.5px] leading-relaxed text-[#171817]/85 mt-1.5">
            {station.body}
          </p>
        </div>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="px-4 sm:px-5 py-3 bg-[#EDE4D0]/70 border-t border-[#171817]/10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onChangeStep((step - 1) as OnboardingStep)}
          className="px-4 py-2 rounded-full border border-[#171817]/20 hover:bg-[#171817]/8 text-xs font-medium text-[#171817]/80 transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5 shrink-0"
            aria-hidden="true"
          >
            <path d="M16 10H4" />
            <path d="M9 15l-5-5 5-5" />
          </svg>
          <span>{copy.back}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (isFinalStep) {
              onComplete();
            } else {
              onChangeStep((step + 1) as OnboardingStep);
            }
          }}
          className="bg-[#47796D] hover:bg-[#3b665c] text-[#F7F3EB] rounded-full px-5 sm:px-6 py-2 text-xs sm:text-sm font-medium shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>{isFinalStep ? copy.finish : copy.next}</span>
          {!isFinalStep ? (
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5 shrink-0"
              aria-hidden="true"
            >
              <path d="M4 10h12" />
              <path d="M11 5l5 5-5 5" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5 shrink-0"
              aria-hidden="true"
            >
              <path d="M4 10.5l4 4 8-9" />
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
};

