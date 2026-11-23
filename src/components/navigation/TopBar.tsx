import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Compass,
  Map,
  Box,
  Navigation,
  Clock,
  BookOpen,
} from 'lucide-react';

import { HeritageSite } from '../../types/heritage';
import { SearchModal } from './SearchModal';
import { HeritageBrandLogo } from './HeritageBrandLogo';
import { useI18n } from '../../i18n/I18nContext';
import { Flip3DText } from '../spatial/Ambient3DBackground';

export type ActiveNavTab = 'showcase' | 'map' | '3d' | 'tours' | 'timeline' | 'catalog';

interface TopBarProps {
  onOpenRoadmap: () => void;
  onOpenAdmin: () => void;
  onOpenRandomAR: () => void;
  onOpenStartupDemo?: () => void;
  activeView: ActiveNavTab;
  onChangeView: (view: ActiveNavTab) => void;
  onSelectSite?: (site: HeritageSite) => void;
}

interface NavItemConfig {
  id: ActiveNavTab;
  num: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
}

/**
 * CHỈ BÁO MÁI ĐAO CONG ĐÌNH/CHÙA NAM BỘ (SVG)
 * Nét 2px vàng đồng #C9A15B, hai đầu vút lên nhẹ, chấm vàng 4px ở tâm đỉnh mái
 */
export const CurvedRoofIndicator: React.FC<{
  width?: number;
  className?: string;
  opacity?: number;
}> = ({ width = 84, className = '', opacity = 1 }) => (
  <svg
    width={width}
    height={12}
    viewBox="0 0 84 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ opacity, overflow: 'visible' }}
    aria-hidden="true"
  >
    <path
      d="M4 2C26 9.5 58 9.5 80 2"
      stroke="#A94F3D"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <circle cx="42" cy="7.5" r="3" fill="#C9A46A" />
  </svg>
);

export const TopBar: React.FC<TopBarProps> = ({
  onOpenRandomAR,
  onOpenStartupDemo,
  activeView,
  onChangeView,
  onSelectSite,
}) => {
  const { lang, setLang, t } = useI18n();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  const searchButtonRef = useRef<HTMLButtonElement>(null);

  // 6 Editorial Nav Items (Pure Typography, No Icons)
  const navItems: NavItemConfig[] = useMemo(
    () => [
      {
        id: 'showcase',
        num: '01',
        label: lang === 'en' ? 'Explore' : lang === 'zh' ? '探索' : 'Khám phá',
        icon: Compass,
        subtitle: t('showcase.heroDesc'),
      },
      {
        id: 'map',
        num: '02',
        label: lang === 'en' ? 'Map' : lang === 'zh' ? '地图' : 'Bản đồ',
        icon: Map,
        subtitle: t('map.spatialAnalysis'),
      },
      {
        id: '3d',
        num: '03',
        label: lang === 'en' ? '3D Space' : lang === 'zh' ? '3D 空间' : 'Không gian 3D',
        icon: Box,
        subtitle: t('common.view3D'),
      },
      {
        id: 'tours',
        num: '04',
        label: lang === 'en' ? 'Heritage Routes' : lang === 'zh' ? '遗产路线' : 'Tuyến di sản',
        icon: Navigation,
        subtitle: t('tours.subHeader'),
      },
      {
        id: 'timeline',
        num: '05',
        label: lang === 'en' ? 'Chronicle' : lang === 'zh' ? '历史编年' : 'Biên niên sử',
        icon: Clock,
        subtitle: t('timeline.subtitle'),
      },
      {
        id: 'catalog',
        num: '06',
        label: lang === 'en' ? 'Heritage Dossier' : lang === 'zh' ? '遗产档案' : 'Hồ sơ di sản',
        icon: BookOpen,
        subtitle: t('catalog.subtitle'),
      },
    ],
    [lang, t]
  );

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close modal on Escape key, plus shortcut '/'
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === '/' &&
        !isSearchModalOpen &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)
      ) {
        event.preventDefault();
        setIsSearchModalOpen(true);
        return;
      }

      if (event.key === 'Escape') {
        setIsSearchModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchModalOpen]);

  const handleSelectNav = (viewId: ActiveNavTab) => {
    onChangeView(viewId);
    setIsSearchModalOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full max-w-[100vw] h-16 md:h-20 border-b border-[#171817]/15 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 lg:gap-8 text-[#171817] select-none transition-colors duration-200 ${
          isScrolled ? 'bg-[#D8C9A9]/98' : 'bg-[#D8C9A9]/95'
        }`}
      >
        <div className="flex items-center shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleSelectNav('showcase');
            }}
            aria-label="Dấu Ấn Việt 3D"
            className="group focus:outline-none focus-visible:ring-1 focus-visible:ring-[#A94F3D] py-1 cursor-pointer"
            title={t('app.title')}
          >
            <HeritageBrandLogo
              variant="roof_curved"
              layout="horizontal"
              size={24}
              animated={false}
              showSubtitle={true}
            />
          </a>
        </div>

        <nav
          className="hidden md:flex items-center justify-center gap-5 lg:gap-8 min-w-0 overflow-x-auto no-scrollbar"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`group text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors duration-200 cursor-pointer py-1 ${
                  isActive
                    ? 'text-[#A94F3D] font-semibold border-b-2 border-[#A94F3D] pb-1'
                    : 'text-[#171817]/75 hover:text-[#171817] border-b-2 border-transparent pb-1'
                }`}
              >
                <Flip3DText text={item.label} active={isActive} />
              </button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-5 lg:gap-6 shrink-0 whitespace-nowrap">
          <button
            ref={searchButtonRef}
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="group text-xs font-medium text-[#171817]/75 hover:text-[#171817] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title={lang === 'vi' ? 'Tìm kiếm di sản (/)' : lang === 'zh' ? '搜索文化遗产 (/)' : 'Search heritage (/)'}
          >
            <Flip3DText text={lang === 'vi' ? 'Tìm kiếm' : lang === 'zh' ? '搜索' : 'Search'} />
          </button>

          <button
            type="button"
            onClick={onOpenRandomAR}
            className="group text-xs font-medium text-[#171817]/75 hover:text-[#A94F3D] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title={t('ar.title')}
          >
            <Flip3DText text={lang === 'vi' ? 'Thuyết minh' : lang === 'zh' ? '语音导览' : 'Audio Guide'} />
          </button>

          {onOpenStartupDemo && (
            <button
              type="button"
              onClick={onOpenStartupDemo}
              className="group hidden xl:inline-block text-xs font-medium text-[#171817]/75 hover:text-[#A94F3D] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Flip3DText text={lang === 'zh' ? '展览通行证' : lang === 'en' ? 'Exhibition Pass' : 'Vé & Học liệu'} />
            </button>
          )}

          <span className="h-3.5 w-px bg-[#171817]/20 shrink-0" aria-hidden="true" />

          <div
            className="flex items-center gap-2 text-xs font-medium shrink-0"
            role="group"
            aria-label="Language selection"
          >
            <button
              type="button"
              onClick={() => setLang('vi')}
              className={`cursor-pointer transition-colors ${
                lang === 'vi'
                  ? 'text-[#A94F3D] font-bold'
                  : 'text-[#171817]/65 hover:text-[#171817] font-normal'
              }`}
              aria-pressed={lang === 'vi'}
            >
              VI
            </button>
            <span className="text-[#171817]/25 font-light select-none" aria-hidden="true">
              /
            </span>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`cursor-pointer transition-colors ${
                lang === 'en'
                  ? 'text-[#A94F3D] font-bold'
                  : 'text-[#171817]/65 hover:text-[#171817] font-normal'
              }`}
              aria-pressed={lang === 'en'}
            >
              EN
            </button>
            <span className="text-[#171817]/25 font-light select-none" aria-hidden="true">
              /
            </span>
            <button
              type="button"
              onClick={() => setLang('zh')}
              className={`cursor-pointer transition-colors ${
                lang === 'zh'
                  ? 'text-[#A94F3D] font-bold'
                  : 'text-[#171817]/65 hover:text-[#171817] font-normal'
              }`}
              aria-pressed={lang === 'zh'}
            >
              ZH
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center gap-3 shrink-0 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="text-xs font-medium text-[#171817]/75 hover:text-[#171817] cursor-pointer"
          >
            {lang === 'vi' ? 'Tìm' : lang === 'zh' ? '搜索' : 'Search'}
          </button>

          <button
            type="button"
            onClick={onOpenRandomAR}
            className="text-xs font-medium text-[#A94F3D] hover:text-[#171817] cursor-pointer"
          >
            Audio
          </button>

          <span className="h-3 w-px bg-[#171817]/20" aria-hidden="true" />

          <div
            className="flex items-center gap-1.5 text-[11px] font-medium"
            role="group"
            aria-label="Language selection"
          >
            <button
              type="button"
              onClick={() => setLang('vi')}
              className={lang === 'vi' ? 'text-[#A94F3D] font-bold cursor-pointer' : 'text-[#171817]/65 cursor-pointer'}
            >
              VI
            </button>
            <span className="text-[#171817]/25">/</span>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={lang === 'en' ? 'text-[#A94F3D] font-bold cursor-pointer' : 'text-[#171817]/65 cursor-pointer'}
            >
              EN
            </button>
            <span className="text-[#171817]/25">/</span>
            <button
              type="button"
              onClick={() => setLang('zh')}
              className={lang === 'zh' ? 'text-[#A94F3D] font-bold cursor-pointer' : 'text-[#171817]/65 cursor-pointer'}
            >
              ZH
            </button>
          </div>
        </div>
      </header>

      {/* MODAL TÌM KIẾM ĐIỀU HƯỚNG NHANH */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigateView={handleSelectNav}
        onSelectSite={onSelectSite}
        triggerRef={searchButtonRef}
      />
    </>
  );
};
