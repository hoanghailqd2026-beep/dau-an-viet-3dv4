import type { HeritageSite } from '../types/heritage';

export type HeritageRegionFilter = 'all' | 'HCM' | 'BD' | 'BRVT';

/**
 * Normalize Vietnamese / Unicode text into accent-insensitive lowercase ASCII
 * so queries like "dinh doc lap", "quan 1", "vung tau", "cu chi", or "05" match reliably.
 */
export function normalizeHeritageSearchText(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function getHeritageRegionGroup(site: HeritageSite): 'HCM' | 'BD' | 'BRVT' {
  const idUpper = (site.id || '').toUpperCase();
  const cityNorm = normalizeHeritageSearchText(site.address?.city || '');
  const distNorm = normalizeHeritageSearchText(site.address?.district || '');

  if (idUpper.startsWith('BD-') || cityNorm.includes('binh duong') || distNorm.includes('thu dau mot')) {
    return 'BD';
  }
  if (
    idUpper.startsWith('BRVT-') ||
    cityNorm.includes('ba ria') ||
    cityNorm.includes('vung tau') ||
    distNorm.includes('vung tau') ||
    distNorm.includes('ba ria') ||
    distNorm.includes('con dao')
  ) {
    return 'BRVT';
  }
  return 'HCM';
}

export function getHeritageRegionDisplayLabel(
  region: 'HCM' | 'BD' | 'BRVT',
  lang: 'vi' | 'en' | 'zh'
): string {
  if (region === 'BD') {
    return lang === 'en' ? 'Binh Duong' : lang === 'zh' ? '平阳省' : 'Bình Dương';
  }
  if (region === 'BRVT') {
    return lang === 'en'
      ? 'Ba Ria - Vung Tau'
      : lang === 'zh'
      ? '巴地头顿省'
      : 'Bà Rịa - Vũng Tàu';
  }
  return lang === 'en' ? 'Ho Chi Minh City' : lang === 'zh' ? '胡志明市' : 'TP. Hồ Chí Minh';
}

export function getHeritageRegionChipLabel(
  region: HeritageRegionFilter,
  lang: 'vi' | 'en' | 'zh'
): string {
  if (region === 'all') {
    return lang === 'en' ? 'All' : lang === 'zh' ? '全部' : 'Tất cả';
  }
  if (region === 'HCM') {
    return lang === 'en' ? 'HCMC' : lang === 'zh' ? '胡志明市' : 'TP.HCM';
  }
  if (region === 'BD') {
    return lang === 'en' ? 'Binh Duong' : lang === 'zh' ? '平阳' : 'Bình Dương';
  }
  return lang === 'en' ? 'Ba Ria - Vung Tau' : lang === 'zh' ? '巴地头顿' : 'Bà Rịa - Vũng Tàu';
}

export function getHeritageSubtitle(
  site: HeritageSite,
  formatDistrictName: (d: string) => string,
  lang: 'vi' | 'en' | 'zh'
): string {
  const regionGroup = getHeritageRegionGroup(site);
  const regionLabel = getHeritageRegionDisplayLabel(regionGroup, lang);
  const districtText = site.address?.district ? formatDistrictName(site.address.district) : '';
  if (!districtText) return regionLabel;

  const normDist = normalizeHeritageSearchText(districtText);
  const normRegion = normalizeHeritageSearchText(regionLabel);
  if (normDist === normRegion || normDist.includes(normRegion)) {
    return districtText;
  }
  return `${districtText} · ${regionLabel}`;
}

export function matchesHeritageSiteQuery(params: {
  site: HeritageSite;
  canonicalIndex: number; // 0-based index in canonical site list (0..16 -> 01..17)
  rawQuery: string;
  localizedName?: string;
  localizedFolkName?: string;
  localizedSummary?: string;
}): boolean {
  const { site, canonicalIndex, rawQuery, localizedName, localizedFolkName, localizedSummary } =
    params;
  const qNorm = normalizeHeritageSearchText(rawQuery);
  if (!qNorm) return true;

  const paddedNum = String(canonicalIndex + 1).padStart(2, '0');
  const plainNum = String(canonicalIndex + 1);
  const regionGroup = getHeritageRegionGroup(site);
  const regionAliases =
    regionGroup === 'HCM'
      ? 'tp hcm tphcm ho chi minh sai gon saigon'
      : regionGroup === 'BD'
      ? 'binh duong bd'
      : 'ba ria vung tau brvt';

  // Exact 2-digit or 1-digit index match (e.g. "05" or "5")
  if (/^\d{1,2}$/.test(qNorm)) {
    const qInt = parseInt(qNorm, 10);
    if (qInt === canonicalIndex + 1) return true;
  }

  const haystack = normalizeHeritageSearchText(
    [
      paddedNum,
      plainNum,
      site.id,
      site.identifierCode,
      site.officialName,
      site.folkName,
      localizedName || '',
      localizedFolkName || '',
      site.address?.district || '',
      site.address?.city || '',
      site.address?.ward || '',
      site.address?.street || '',
      regionAliases,
      String(site.commencementYear || ''),
      site.chronology || '',
      site.architecturalStyle || '',
      localizedSummary || site.summary || '',
    ].join(' ')
  );

  if (haystack.includes(qNorm)) return true;

  // Multi-token AND match (e.g., "dinh q1" or "nha tho sai gon")
  const tokens = qNorm.split(' ').filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every((tok) => haystack.includes(tok));
  }

  return false;
}
