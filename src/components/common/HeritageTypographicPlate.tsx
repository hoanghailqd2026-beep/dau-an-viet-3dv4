import React from 'react';
import { HeritageSite } from '../../types/heritage';
import { HERITAGE_SITE_IDS_ORDERED } from '../../utils/wikimediaPhotoService';
import { useI18n } from '../../i18n/I18nContext';
import { getHeritageColorBlock } from '../../utils/indochinePalette';

export interface HeritagePlatePalette {
  bg: string;
  fg: string;
  hairline: string;
  mutedFg: string;
  badgeBg: string;
}

/**
 * 4-color Vietnam Heritage Palette rotation:
 * - #A94F3D (Đỏ gạch)  -> text #D8C9A9
 * - #47796D (Xanh cổ)  -> text #171817
 * - #526D8B (Xanh lam) -> text #D8C9A9
 * - #C9A46A (Vàng đồng)-> text #171817
 */
export const HERITAGE_PLATE_PALETTES: readonly HeritagePlatePalette[] = [
  {
    bg: '#A94F3D',
    fg: '#D8C9A9',
    hairline: 'rgba(216, 201, 169, 0.30)',
    mutedFg: 'rgba(216, 201, 169, 0.85)',
    badgeBg: 'rgba(23, 24, 23, 0.18)',
  },
  {
    bg: '#47796D',
    fg: '#171817',
    hairline: 'rgba(23, 24, 23, 0.24)',
    mutedFg: 'rgba(23, 24, 23, 0.80)',
    badgeBg: 'rgba(23, 24, 23, 0.12)',
  },
  {
    bg: '#526D8B',
    fg: '#D8C9A9',
    hairline: 'rgba(216, 201, 169, 0.30)',
    mutedFg: 'rgba(216, 201, 169, 0.85)',
    badgeBg: 'rgba(23, 24, 23, 0.18)',
  },
  {
    bg: '#C9A46A',
    fg: '#171817',
    hairline: 'rgba(23, 24, 23, 0.24)',
    mutedFg: 'rgba(23, 24, 23, 0.80)',
    badgeBg: 'rgba(23, 24, 23, 0.12)',
  },
] as const;

export function getHeritageSiteArchiveIndex(siteId: string, fallbackIdx = 0): number {
  const found = (HERITAGE_SITE_IDS_ORDERED as readonly string[]).indexOf(siteId);
  return found >= 0 ? found : Math.max(0, fallbackIdx);
}

export function getHeritagePlatePalette(siteOrId: HeritageSite | string, _indexOverride?: number): HeritagePlatePalette {
  const block = getHeritageColorBlock(siteOrId);
  return {
    bg: block.bg,
    fg: block.fg,
    hairline: block.hairline,
    mutedFg: block.mutedFg,
    badgeBg: block.badgeBg,
  };
}

export interface HeritageTypographicPlateProps {
  site: HeritageSite;
  index?: number;
  variant?: 'hero' | 'catalog' | 'bento' | 'detail' | 'compact' | 'archival';
  titleOverride?: string;
  subtitleOverride?: string;
  badgeOverride?: string;
  className?: string;
}

export const HeritageTypographicPlate: React.FC<HeritageTypographicPlateProps> = React.memo(({
  site,
  index,
  variant = 'catalog',
  titleOverride,
  subtitleOverride,
  badgeOverride,
  className = '',
}) => {
  const { lang, t, getLocalizedSite, formatDistrictName } = useI18n();
  const loc = getLocalizedSite(site);
  const resolvedIdx = getHeritageSiteArchiveIndex(site.id, index ?? 0);
  const palette = getHeritagePlatePalette(site, resolvedIdx);
  const indexPadded = String(resolvedIdx + 1).padStart(2, '0');

  const cleanTitle = (titleOverride || loc.officialName).split(/\s*[（(]/)[0];
  const typeLabel = badgeOverride || t(`types.${site.type}`);
  const yearLabel =
    site.commencementYear < 0
      ? `${Math.abs(site.commencementYear)} ${lang === 'zh' ? 'BCE' : lang === 'en' ? 'BCE' : 'TCN'}`
      : String(site.commencementYear);
  const districtLabel = subtitleOverride || `${formatDistrictName(site.address.district)} · ${site.address.city}`;

  // Compact plate for tiny square/rectangular thumbnails (40x40 -> 80x56)
  if (variant === 'compact') {
    return (
      <div
        className={`relative w-full h-full flex flex-col justify-between p-1.5 overflow-hidden select-none ${className}`}
        style={{
          backgroundColor: palette.bg,
          color: palette.fg,
          border: `1px solid ${palette.hairline}`,
        }}
      >
        <div
          className="flex items-center justify-between text-[8.5px] font-sans font-medium tracking-wider uppercase leading-none opacity-85"
          style={{ borderBottom: `1px solid ${palette.hairline}`, paddingBottom: '2px' }}
        >
          <span className="tabular-nums">{site.identifierCode.split('-').slice(-1)[0]}</span>
          <span className="tabular-nums">{yearLabel}</span>
        </div>
        <div className="flex items-end justify-between leading-none pt-0.5">
          <span
            className="font-serif text-lg sm:text-xl font-normal tracking-tight leading-none tabular-nums"
            style={{ fontVariantNumeric: 'lining-nums' }}
          >
            {indexPadded}
          </span>
        </div>
      </div>
    );
  }

  // Archival historical comparison plate (used in Xua & Nay empty slot)
  if (variant === 'archival') {
    return (
      <div
        className={`relative w-full h-full flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none ${className}`}
        style={{
          backgroundColor: '#171817',
          color: '#D8C9A9',
        }}
      >
        <div
          className="w-full h-full flex flex-col justify-between p-5 sm:p-8"
          style={{ border: '1px solid rgba(216, 201, 169, 0.26)' }}
        >
          <div
            className="flex items-center justify-between gap-3 pb-3 text-[11px] font-sans uppercase tracking-[0.14em]"
            style={{ borderBottom: '1px solid rgba(216, 201, 169, 0.22)', color: 'rgba(216, 201, 169, 0.8)' }}
          >
            <span>{badgeOverride || (lang === 'en' ? 'ARCHIVAL PLATE' : lang === 'zh' ? '历史档案图版' : 'BẢN ĐỒ HỒ SƠ LƯU TRỮ')}</span>
            <span className="tabular-nums">{yearLabel}</span>
          </div>

          <div className="my-auto py-4 text-center space-y-2">
            <div
              className="font-serif text-5xl sm:text-7xl font-normal leading-none tracking-tight tabular-nums opacity-90"
              style={{ fontVariantNumeric: 'lining-nums' }}
            >
              {indexPadded}
            </div>
            <div className="font-serif text-xl sm:text-3xl font-normal tracking-tight leading-snug max-w-2xl mx-auto">
              {cleanTitle}
            </div>
            <p className="font-sans text-xs opacity-75 max-w-xl mx-auto line-clamp-2">
              {districtLabel}
            </p>
          </div>

          <div
            className="flex items-center justify-between gap-2 pt-3 text-[11px] font-sans"
            style={{ borderTop: '1px solid rgba(216, 201, 169, 0.22)', color: 'rgba(216, 201, 169, 0.72)' }}
          >
            <span className="truncate">{typeLabel}</span>
            <span className="tabular-nums shrink-0">{site.identifierCode}</span>
          </div>
        </div>
      </div>
    );
  }

  // Hero strip card plate (matches Van Gogh Museum card proportions: top index + type plate, crisp divider, bottom space reserved for overlay card footer or clean full plate)
  if (variant === 'hero') {
    return (
      <div
        className={`relative w-full h-full flex flex-col justify-between p-5 overflow-hidden select-none ${className}`}
        style={{
          backgroundColor: palette.bg,
          color: palette.fg,
        }}
      >
        <div
          className="w-full flex flex-col justify-between flex-1 p-4"
          style={{ border: `1px solid ${palette.hairline}` }}
        >
          <div
            className="flex items-start justify-between gap-2 pb-3"
            style={{ borderBottom: `1px solid ${palette.hairline}` }}
          >
            <span
              className="font-serif text-5xl leading-none font-normal tracking-tight tabular-nums"
              style={{ fontVariantNumeric: 'lining-nums' }}
            >
              {indexPadded}
            </span>
            <div className="text-right space-y-0.5">
              <div className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] tabular-nums">
                {yearLabel}
              </div>
              <div className="font-sans text-[10px] tracking-[0.06em] opacity-80 tabular-nums">
                {site.identifierCode}
              </div>
            </div>
          </div>

          <div className="pt-3 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="font-sans text-[11px] font-medium uppercase tracking-[0.1em] opacity-85 line-clamp-1">
                {typeLabel}
              </div>
              <div className="font-sans text-[11.5px] opacity-80 line-clamp-1">
                {districtLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detail modal / 16:9 archival hero banner plate
  if (variant === 'detail') {
    return (
      <div
        className={`relative w-full h-full flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none ${className}`}
        style={{
          backgroundColor: palette.bg,
          color: palette.fg,
        }}
      >
        <div
          className="w-full h-full flex flex-col justify-between p-4 sm:p-6"
          style={{ border: `1px solid ${palette.hairline}` }}
        >
          <div
            className="flex items-center justify-between gap-3 pb-2.5 text-[11px] font-sans font-medium uppercase tracking-[0.12em]"
            style={{ borderBottom: `1px solid ${palette.hairline}` }}
          >
            <span className="truncate">{typeLabel}</span>
            <span className="tabular-nums shrink-0">{site.identifierCode} · {yearLabel}</span>
          </div>

          <div className="my-auto py-2 flex items-end justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <h4
                className="font-serif text-xl sm:text-3xl font-normal leading-[1.15] tracking-tight line-clamp-2"
                style={{ fontVariantNumeric: 'lining-nums' }}
              >
                {cleanTitle}
              </h4>
              <p className="font-sans text-xs opacity-80 truncate">{districtLabel}</p>
            </div>
            <span
              className="font-serif text-5xl sm:text-7xl font-normal leading-none tracking-tight tabular-nums shrink-0"
              style={{ fontVariantNumeric: 'lining-nums' }}
            >
              {indexPadded}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Bento & Catalog top frame plate
  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between p-4 overflow-hidden select-none ${className}`}
      style={{
        backgroundColor: palette.bg,
        color: palette.fg,
      }}
    >
      <div
        className="w-full h-full flex flex-col justify-between p-3.5 sm:p-4"
        style={{ border: `1px solid ${palette.hairline}` }}
      >
        <div
          className="flex items-center justify-between gap-2 pb-2 text-[10.5px] font-sans font-medium uppercase tracking-[0.1em]"
          style={{ borderBottom: `1px solid ${palette.hairline}` }}
        >
          <span className="truncate">{typeLabel}</span>
          <span className="tabular-nums shrink-0">{yearLabel}</span>
        </div>

        <div className="my-auto pt-2 flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div
              className="font-serif text-lg sm:text-xl font-normal leading-snug line-clamp-2"
              style={{ fontVariantNumeric: 'lining-nums' }}
            >
              {cleanTitle}
            </div>
            <div className="font-sans text-[11px] opacity-80 truncate mt-0.5">
              {districtLabel}
            </div>
          </div>
          <span
            className="font-serif text-4xl sm:text-5xl font-normal leading-none tracking-tight tabular-nums shrink-0"
            style={{ fontVariantNumeric: 'lining-nums' }}
          >
            {indexPadded}
          </span>
        </div>
      </div>
    </div>
  );
});
