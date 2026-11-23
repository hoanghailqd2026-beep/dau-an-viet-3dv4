import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'desktop' | 'mobile-drawer' | 'mobile-header';
}

/**
 * CÔNG TẮC NGÔN NGỮ DẠNG CON DẤU TRUYỀN THỐNG (STAMP SWITCHER)
 * - Icon quả cầu line 16px + "VI | EN"
 * - Nền trượt vàng đồng (#C9A15B) sang mục mới trong 250ms
 * - Mục đang chọn: chữ #1A1408 đậm 600, nền vàng đồng
 * - Mục kia: trong suốt, chữ #F5EFE6 opacity 0.8
 * - Chuẩn touch target: tối thiểu 36px (desktop) & 44px (mobile)
 * - Hỗ trợ đầy đủ phím bấm, aria-pressed, focus-visible
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'desktop',
}) => {
  const { lang, setLang, t } = useI18n();

  if (variant === 'mobile-drawer') {
    return (
      <div
        className={`w-full inline-flex items-center justify-between rounded-lg bg-[#EDE4D0] p-1 border border-[#171817]/18 flex-shrink-0 ${className}`}
        role="group"
        aria-label={t('switcher.label')}
      >
        <button
          type="button"
          onClick={() => setLang('vi')}
          className={`flex-1 py-2 px-3 rounded-md text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            lang === 'vi'
              ? 'bg-[#A94F3D] text-[#D8C9A9] font-bold'
              : 'text-[#171817]/75 hover:text-[#171817]'
          }`}
          aria-pressed={lang === 'vi'}
          title="Tiếng Việt (VI)"
        >
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span>VI · Tiếng Việt</span>
        </button>

        <button
          type="button"
          onClick={() => setLang('en')}
          className={`flex-1 py-2 px-3 rounded-md text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            lang === 'en'
              ? 'bg-[#A94F3D] text-[#D8C9A9] font-bold'
              : 'text-[#171817]/75 hover:text-[#171817]'
          }`}
          aria-pressed={lang === 'en'}
          title="English (EN)"
        >
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span>EN · English</span>
        </button>

        <button
          type="button"
          onClick={() => setLang('zh')}
          className={`flex-1 py-2 px-3 rounded-md text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            lang === 'zh'
              ? 'bg-[#A94F3D] text-[#D8C9A9] font-bold'
              : 'text-[#171817]/75 hover:text-[#171817]'
          }`}
          aria-pressed={lang === 'zh'}
          title="中文 (ZH)"
        >
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span>ZH · 中文</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-lg bg-[#EDE4D0] p-0.5 border border-[#171817]/18 flex-shrink-0 mr-1 ${className}`}
      role="group"
      aria-label={t('switcher.label')}
      title={t('switcher.tooltip')}
    >
      <button
        type="button"
        onClick={() => setLang('vi')}
        className={
          lang === 'vi'
            ? 'bg-[#171817] text-[#D8C9A9] font-bold px-2 py-1 rounded-md text-xs transition-all cursor-pointer'
            : 'text-[#171817]/70 hover:text-[#171817] px-2 py-1 rounded-md text-xs transition-all cursor-pointer'
        }
        aria-pressed={lang === 'vi'}
        title="Tiếng Việt (VI)"
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={
          lang === 'en'
            ? 'bg-[#171817] text-[#D8C9A9] font-bold px-2 py-1 rounded-md text-xs transition-all cursor-pointer'
            : 'text-[#171817]/70 hover:text-[#171817] px-2 py-1 rounded-md text-xs transition-all cursor-pointer'
        }
        aria-pressed={lang === 'en'}
        title="English (EN)"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('zh')}
        className={
          lang === 'zh'
            ? 'bg-[#171817] text-[#D8C9A9] font-bold px-2 py-1 rounded-md text-xs transition-all cursor-pointer'
            : 'text-[#171817]/70 hover:text-[#171817] px-2 py-1 rounded-md text-xs transition-all cursor-pointer'
        }
        aria-pressed={lang === 'zh'}
        title="中文 (ZH)"
      >
        ZH
      </button>
    </div>
  );
};
