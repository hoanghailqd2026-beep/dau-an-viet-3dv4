import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { useMediaCredits } from '../../utils/mediaCreditsStore';

export interface ArchivalSourcesTriggerProps {
  onClick: () => void;
  /** 'light' for warm heritage paper surfaces, 'dark' for dark glass / map / 3D / dark drawers */
  tone?: 'light' | 'dark';
  /** Optional explicit count override (defaults to live archival registry count) */
  count?: number;
  /** Optional full-width row layout for mobile slide-over menus */
  fullWidth?: boolean;
  /** Optional elevated glass backdrop when floating above canvas/page content */
  floating?: boolean;
  className?: string;
}

/**
 * Museum Archival Colophon Trigger ("Nguồn tư liệu" / "Archival Sources" / "文献与版权来源").
 * Architectural 4px-radius dossier tab with thin-stroke folio SVG, live archival index count,
 * diagonal external-index arrow, and ink-press hover transition.
 */
export const ArchivalSourcesTrigger: React.FC<ArchivalSourcesTriggerProps> = ({
  onClick,
  tone = 'light',
  count,
  fullWidth = false,
  floating = false,
  className = '',
}) => {
  const { lang } = useI18n();
  const credits = useMediaCredits();
  const resolvedCount = typeof count === 'number' ? count : credits.length;

  const label =
    lang === 'en'
      ? 'Archival Sources'
      : lang === 'zh'
      ? '文献与版权来源'
      : 'Nguồn tư liệu';

  const ariaTitle =
    lang === 'en'
      ? `Archival Sources (${resolvedCount} catalogued items)`
      : lang === 'zh'
      ? `文献与版权来源（共 ${resolvedCount} 条馆藏记录）`
      : `Nguồn tư liệu & Bản quyền (${resolvedCount} mục lưu trữ)`;

  const isLight = tone === 'light';

  const surfaceClasses = isLight
    ? floating
      ? 'border-[#171817]/25 bg-[#F7F3EB]/85 backdrop-blur-md text-[#171817] hover:bg-[#171817] hover:border-[#171817] hover:text-[#F7F3EB] shadow-[0_6px_20px_rgba(23,24,23,0.12)]'
      : 'border-[#171817]/25 bg-[#F7F3EB]/45 text-[#171817] hover:bg-[#171817] hover:border-[#171817] hover:text-[#F7F3EB]'
    : floating
    ? 'bg-[#171817]/75 backdrop-blur-md border-[#C9A46A]/35 hover:border-[#C9A46A] hover:bg-[#171817]/95 text-[#D8C9A9] hover:text-[#F7F3EB] shadow-[0_8px_24px_rgba(0,0,0,0.45)]'
    : 'bg-[#171817]/75 backdrop-blur-md border-[#C9A46A]/35 hover:border-[#C9A46A] hover:bg-[#171817]/95 text-[#D8C9A9] hover:text-[#F7F3EB]';

  const iconColorClasses = isLight
    ? 'text-[#A94F3D] group-hover:text-[#C9A46A]'
    : 'text-[#C9A46A]';

  const countBadgeClasses = isLight
    ? 'text-[#A94F3D] bg-[#A94F3D]/10 group-hover:text-[#C9A46A] group-hover:bg-[#C9A46A]/15'
    : 'text-[#C9A46A] bg-[#C9A46A]/15 group-hover:bg-[#C9A46A]/22';

  const arrowColorClasses = isLight
    ? 'text-[#171817]/50 group-hover:text-[#C9A46A]'
    : 'text-[#C9A46A]/70 group-hover:text-[#C9A46A]';

  return (
    <button
      type="button"
      onClick={onClick}
      title={ariaTitle}
      aria-label={ariaTitle}
      className={`inline-flex items-center ${
        fullWidth ? 'w-full justify-between' : 'justify-center'
      } gap-2 min-h-[36px] px-3.5 py-1.5 rounded-[4px] border transition-all duration-300 cursor-pointer whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C9A46A] ${surfaceClasses} ${className}`}
    >
      <span className="inline-flex items-center gap-2 min-w-0">
        {/* Thin-stroke 1.4px Museum Dossier / Archival Folio SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-3.5 h-3.5 shrink-0 transition-colors duration-300 ${iconColorClasses}`}
          aria-hidden="true"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M8.5 7h7" />
          <path d="M8.5 11h5" />
        </svg>

        <span className="text-[13px] font-medium tracking-[0.02em] leading-none">
          {label}
        </span>
      </span>

      <span className="inline-flex items-center gap-1.5 shrink-0">
        <span
          className={`text-[10.5px] font-mono tabular-nums px-1.5 py-[1px] rounded-[2px] leading-tight transition-colors duration-300 ${countBadgeClasses}`}
        >
          {resolvedCount}
        </span>

        <span
          aria-hidden="true"
          className={`text-xs leading-none transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${arrowColorClasses}`}
        >
          ↗
        </span>
      </span>
    </button>
  );
};

export default ArchivalSourcesTrigger;
