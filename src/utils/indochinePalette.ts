import { HeritageSite, TourRoute } from '../types/heritage';

/**
 * VIETNAM HERITAGE PALETTE (6-COLOR CURATORIAL SYSTEM)
 * Inspired by Musei Nazionali di Genova pigment color-blocking
 */
export const HERITAGE_PALETTE = {
  charcoal: '#171817',       // Đen than (Ink, hairlines, 3D WebGL stage)
  gold: '#C9A46A',           // Vàng đồng (Museum & Architectural heritage)
  terracotta: '#A94F3D',     // Đỏ gạch (History & Civic Administration, Primary CTA)
  teal: '#47796D',           // Xanh cổ (Culture & Performing Arts, Secondary CTA)
  slateBlue: '#526D8B',      // Xanh lam (Riverfront, Coastal & Maritime Port)
  ivory: '#D8C9A9',          // Trắng ngà (Main page canvas & archival surface)
  cream: '#EDE4D0',          // Kem giấy di sản (Soft tonal contrast surface)
  paperLight: '#F4EFE4',     // Giấy bảo tàng sáng (Cards & light editorial panels)
} as const;

export type HeritageThematicGroup =
  | 'history_admin'
  | 'culture_art'
  | 'river_port_sea'
  | 'museum_architecture';

export interface HeritageColorBlockSpec {
  group: HeritageThematicGroup;
  bg: string;
  fg: string;
  mutedFg: string;
  hairline: string;
  badgeBg: string;
  badgeFg: string;
  groupLabelVi: string;
  groupLabelEn: string;
  groupLabelZh: string;
}

export const HERITAGE_COLOR_BLOCKS: Record<HeritageThematicGroup, HeritageColorBlockSpec> = {
  history_admin: {
    group: 'history_admin',
    bg: '#A94F3D',
    fg: '#D8C9A9',
    mutedFg: 'rgba(216, 201, 169, 0.85)',
    hairline: 'rgba(216, 201, 169, 0.30)',
    badgeBg: 'rgba(23, 24, 23, 0.22)',
    badgeFg: '#D8C9A9',
    groupLabelVi: 'Lịch sử – Hành chính',
    groupLabelEn: 'History & Civic',
    groupLabelZh: '历史与行政遗产',
  },
  culture_art: {
    group: 'culture_art',
    bg: '#47796D',
    fg: '#171817',
    mutedFg: 'rgba(23, 24, 23, 0.80)',
    hairline: 'rgba(23, 24, 23, 0.24)',
    badgeBg: 'rgba(23, 24, 23, 0.12)',
    badgeFg: '#171817',
    groupLabelVi: 'Văn hóa – Nghệ thuật',
    groupLabelEn: 'Culture & Arts',
    groupLabelZh: '文化与艺术',
  },
  river_port_sea: {
    group: 'river_port_sea',
    bg: '#526D8B',
    fg: '#D8C9A9',
    mutedFg: 'rgba(216, 201, 169, 0.86)',
    hairline: 'rgba(216, 201, 169, 0.30)',
    badgeBg: 'rgba(23, 24, 23, 0.22)',
    badgeFg: '#D8C9A9',
    groupLabelVi: 'Ven sông – Biển đảo – Thương cảng',
    groupLabelEn: 'Riverfront & Maritime',
    groupLabelZh: '滨河与海港遗产',
  },
  museum_architecture: {
    group: 'museum_architecture',
    bg: '#C9A46A',
    fg: '#171817',
    mutedFg: 'rgba(23, 24, 23, 0.80)',
    hairline: 'rgba(23, 24, 23, 0.22)',
    badgeBg: 'rgba(23, 24, 23, 0.12)',
    badgeFg: '#171817',
    groupLabelVi: 'Bảo tàng – Di sản kiến trúc',
    groupLabelEn: 'Museum & Architecture',
    groupLabelZh: '博物馆与建筑遗产',
  },
};

const SITE_GROUP_MAP: Record<string, HeritageThematicGroup> = {
  // Nhóm Lịch sử – Hành chính (#A94F3D Đỏ gạch)
  'HCM-DT-001': 'history_admin', // Dinh Độc Lập
  'HCM-DT-008': 'history_admin', // Lăng Tả quân Lê Văn Duyệt
  'HCM-DT-009': 'history_admin', // Địa đạo Củ Chi
  'BRVT-DT-003': 'history_admin', // Địa đạo Long Phước
  'BD-DT-002': 'history_admin', // Địa đạo Tam Giác Sắt

  // Nhóm Văn hóa – Nghệ thuật (#47796D Xanh cổ)
  'HCM-DT-002': 'culture_art', // Nhà hát Thành phố
  'HCM-DT-011': 'culture_art', // Chùa Giác Lâm
  'HCM-DT-012': 'culture_art', // Hội quán Nghĩa An
  'BRVT-DT-002': 'culture_art', // Nhà Lớn Long Sơn

  // Nhóm Ven sông – Biển đảo – Thương cảng (#526D8B Xanh lam)
  'HCM-DT-007': 'river_port_sea', // Bến Nhà Rồng
  'HCM-DT-004': 'river_port_sea', // Chợ Bến Thành (giao thương bến Nghé)
  'HCM-DT-010': 'river_port_sea', // Giồng Cá Vồ Cần Giờ (duyên hải)
  'BRVT-DT-001': 'river_port_sea', // Bạch Dinh - Vũng Tàu (biển đảo)

  // Nhóm Bảo tàng – Di sản kiến trúc (#C9A46A Vàng đồng)
  'HCM-DT-003': 'museum_architecture', // Bưu điện Trung tâm Sài Gòn
  'HCM-DT-005': 'museum_architecture', // Nhà thờ Đức Bà Sài Gòn
  'HCM-DT-006': 'museum_architecture', // Bảo tàng Lịch sử TP.HCM
  'BD-DT-001': 'museum_architecture', // Nhà cổ Trần Công Vàng
};

export function getHeritageThematicGroup(
  siteOrId: HeritageSite | string
): HeritageThematicGroup {
  const id = typeof siteOrId === 'string' ? siteOrId : siteOrId.id;
  if (SITE_GROUP_MAP[id]) {
    return SITE_GROUP_MAP[id];
  }
  if (typeof siteOrId !== 'string') {
    if (siteOrId.type === 'History') return 'history_admin';
    if (siteOrId.type === 'Archaeology' || siteOrId.type === 'Scenic') {
      return 'river_port_sea';
    }
    return 'museum_architecture';
  }
  return 'museum_architecture';
}

export function getHeritageColorBlock(
  siteOrId: HeritageSite | string,
  lang: 'vi' | 'en' | 'zh' = 'vi'
): HeritageColorBlockSpec & { label: string } {
  const group = getHeritageThematicGroup(siteOrId);
  const spec = HERITAGE_COLOR_BLOCKS[group];
  const label =
    lang === 'en'
      ? spec.groupLabelEn
      : lang === 'zh'
      ? spec.groupLabelZh
      : spec.groupLabelVi;
  return { ...spec, label };
}

export interface IndochineCategoryMeta {
  categoryKey: 'military_special' | 'french_colonial' | 'sacred_archaeology' | 'regional';
  accentHex: string;
  deepHex: string;
  softBgRgba: string;
  borderRgba: string;
  textOnAccentHex: string;
  badgeLabel: string;
  shortTag: string;
}

export function getIndochineCategoryMeta(
  site: HeritageSite,
  lang: 'vi' | 'en' | 'zh' = 'vi'
): IndochineCategoryMeta {
  const block = getHeritageColorBlock(site, lang);

  const isInterRegional =
    site.address.city !== 'Thành phố Hồ Chí Minh' ||
    site.id.startsWith('BD-') ||
    site.id.startsWith('BRVT-');

  const isSacredOrArchaeology =
    site.type === 'Archaeology' ||
    site.id === 'HCM-DT-008' ||
    site.id === 'HCM-DT-010' ||
    site.id === 'HCM-DT-011' ||
    site.id === 'HCM-DT-012';

  const isSpecialOrMilitaryHistory =
    site.rankingLevel === 'Special National' || site.type === 'History';

  const softBgRgba =
    block.bg === '#A94F3D'
      ? 'rgba(169, 79, 61, 0.14)'
      : block.bg === '#47796D'
      ? 'rgba(71, 121, 109, 0.16)'
      : block.bg === '#526D8B'
      ? 'rgba(82, 109, 139, 0.16)'
      : 'rgba(201, 164, 106, 0.22)';

  const borderRgba =
    block.bg === '#A94F3D'
      ? 'rgba(169, 79, 61, 0.45)'
      : block.bg === '#47796D'
      ? 'rgba(71, 121, 109, 0.45)'
      : block.bg === '#526D8B'
      ? 'rgba(82, 109, 139, 0.45)'
      : 'rgba(201, 164, 106, 0.55)';

  if (
    site.rankingLevel === 'Special National' ||
    (isSpecialOrMilitaryHistory && !isInterRegional && !isSacredOrArchaeology)
  ) {
    return {
      categoryKey: 'military_special',
      accentHex: block.bg,
      deepHex: '#171817',
      softBgRgba,
      borderRgba,
      textOnAccentHex: block.fg,
      badgeLabel:
        site.rankingLevel === 'Special National'
          ? lang === 'en'
            ? 'SPECIAL NATIONAL MONUMENT'
            : lang === 'zh'
            ? '国家级特殊遗迹'
            : 'DI TÍCH QUỐC GIA ĐẶC BIỆT'
          : lang === 'en'
          ? 'HISTORICAL & CULTURAL MONUMENT'
          : lang === 'zh'
          ? '历史与文化遗迹'
          : 'DI TÍCH LỊCH SỬ - VĂN HÓA',
      shortTag: block.label,
    };
  }

  if (isInterRegional) {
    return {
      categoryKey: 'regional',
      accentHex: block.bg,
      deepHex: '#171817',
      softBgRgba,
      borderRgba,
      textOnAccentHex: block.fg,
      badgeLabel:
        lang === 'en'
          ? 'INTER-REGIONAL HERITAGE (SE VIETNAM)'
          : lang === 'zh'
          ? '跨区域遗产 (平阳 · 巴地头顿)'
          : 'DI TÍCH LIÊN VÙNG ĐÔNG NAM BỘ',
      shortTag: block.label,
    };
  }

  if (isSacredOrArchaeology) {
    return {
      categoryKey: 'sacred_archaeology',
      accentHex: block.bg,
      deepHex: '#171817',
      softBgRgba,
      borderRgba,
      textOnAccentHex: block.fg,
      badgeLabel:
        lang === 'en'
          ? 'SACRED ARCHITECTURE & ARCHAEOLOGY'
          : lang === 'zh'
          ? '宗教建筑与考古遗址'
          : 'KIẾN TRÚC TÍN NGƯỠNG & KHẢO CỔ',
      shortTag: block.label,
    };
  }

  return {
    categoryKey: 'french_colonial',
    accentHex: block.bg,
    deepHex: '#171817',
    softBgRgba,
    borderRgba,
    textOnAccentHex: block.fg,
    badgeLabel:
      lang === 'en'
        ? 'ARCHITECTURAL & ARTISTIC MONUMENT'
        : lang === 'zh'
        ? '建筑与艺术遗产'
        : 'KIẾN TRÚC NGHỆ THUẬT ĐÔNG DƯƠNG',
    shortTag: block.label,
  };
}

const TOUR_COLOR_SPECS: Record<
  string,
  { primaryHex: string; fgHex: string; softBgRgba: string; nameVi: string }
> = {
  '#A94F3D': {
    primaryHex: '#A94F3D',
    fgHex: '#D8C9A9',
    softBgRgba: 'rgba(169, 79, 61, 0.18)',
    nameVi: 'Đỏ son',
  },
  '#47796D': {
    primaryHex: '#47796D',
    fgHex: '#D8C9A9',
    softBgRgba: 'rgba(71, 121, 109, 0.20)',
    nameVi: 'Xanh cổ',
  },
  '#526D8B': {
    primaryHex: '#526D8B',
    fgHex: '#D8C9A9',
    softBgRgba: 'rgba(82, 109, 139, 0.20)',
    nameVi: 'Xanh chàm',
  },
  '#C9A46A': {
    primaryHex: '#C9A46A',
    fgHex: '#171817',
    softBgRgba: 'rgba(201, 164, 106, 0.24)',
    nameVi: 'Vàng đồng',
  },
};

const TOUR_ID_DEFAULT_HEX: Record<string, string> = {
  'TOUR-01': '#A94F3D',
  'TOUR-02': '#526D8B',
  'TOUR-03': '#C9A46A',
  'TOUR-04': '#47796D',
  'TOUR-05': '#526D8B',
  'TOUR-06': '#47796D',
  'TOUR-07': '#A94F3D',
  'TOUR-08': '#47796D',
  'TOUR-09': '#C9A46A',
};

const TOUR_BLOCK_CYCLE = [
  TOUR_COLOR_SPECS['#A94F3D'],
  TOUR_COLOR_SPECS['#526D8B'],
  TOUR_COLOR_SPECS['#C9A46A'],
  TOUR_COLOR_SPECS['#47796D'],
];

export function getTourRouteIndochineColor(
  tourOrId?: TourRoute | string | null,
  indexFallback = 0
): {
  primaryHex: string;
  secondaryHex: string;
  fgHex: string;
  softBgRgba: string;
  nameVi: string;
} {
  const explicitHex =
    tourOrId && typeof tourOrId !== 'string' ? tourOrId.colorHex?.toUpperCase() : undefined;
  const id = typeof tourOrId === 'string' ? tourOrId : tourOrId?.id || '';
  const mappedHex = explicitHex || (id ? TOUR_ID_DEFAULT_HEX[id] : undefined);

  let picked = mappedHex ? TOUR_COLOR_SPECS[mappedHex] : undefined;
  if (!picked) {
    let idx = indexFallback;
    if (id) {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
      }
      idx = hash;
    }
    picked = TOUR_BLOCK_CYCLE[Math.abs(idx) % TOUR_BLOCK_CYCLE.length];
  }

  return {
    primaryHex: picked.primaryHex,
    secondaryHex: '#C9A46A',
    fgHex: picked.fgHex,
    softBgRgba: picked.softBgRgba,
    nameVi: picked.nameVi,
  };
}
