import React, { useState, useMemo } from 'react';
import { HeritageSite } from '../../types/heritage';
import {
  Layers,
  CheckSquare,
  Square,
  User,
  RotateCw,
  MousePointerClick,
} from 'lucide-react';

// ============================================================================
// 1. MULTI-LAYER GIS FILTER TYPES & DATA (BAUTEN / PERSONEN / EREIGNIS / QUELLEN / AUDIO)
// ============================================================================
export type GisLayerKey = 'bauten' | 'personen' | 'ereignis' | 'quellen' | 'audio';

export interface GisLayerConfig {
  key: GisLayerKey;
  code: string;
  labelVi: string;
  labelEn: string;
  labelZh: string;
  color: string;
  bgColor: string;
}

export const GIS_MULTI_LAYERS: GisLayerConfig[] = [
  {
    key: 'bauten',
    code: 'Kiến trúc',
    labelVi: 'Kiến trúc & Kết cấu công trình',
    labelEn: 'Architecture & Structural System',
    labelZh: '建筑与结构系统',
    color: '#C5A059',
    bgColor: 'rgba(197, 160, 89, 0.2)',
  },
  {
    key: 'personen',
    code: 'Nhân vật',
    labelVi: 'Nhân vật Lịch sử & Kiến trúc sư',
    labelEn: 'Historical Figures & Architects',
    labelZh: '历史人物与建筑师',
    color: '#E05A47',
    bgColor: 'rgba(224, 90, 71, 0.2)',
  },
  {
    key: 'ereignis',
    code: 'Sự kiện',
    labelVi: 'Sự kiện & Dấu mốc Lịch sử',
    labelEn: 'Historical Events & Milestones',
    labelZh: '历史事件与里程碑',
    color: '#D9822B',
    bgColor: 'rgba(217, 130, 43, 0.2)',
  },
  {
    key: 'quellen',
    code: 'Tư liệu',
    labelVi: 'Sử liệu & Lưu trữ gốc',
    labelEn: 'Primary Archival Sources',
    labelZh: '原始档案文献',
    color: '#3AA690',
    bgColor: 'rgba(58, 166, 144, 0.2)',
  },
  {
    key: 'audio',
    code: 'Thuyết minh',
    labelVi: 'Trạm Thuyết minh Âm thanh',
    labelEn: 'Spatial Audio Narration Stops',
    labelZh: '空间语音导览站',
    color: '#38BDF8',
    bgColor: 'rgba(56, 189, 248, 0.2)',
  },
];

export interface GisPinItem {
  id: string;
  layer: GisLayerKey;
  code: string;
  color: string;
  title: string;
  subtitle: string;
  detail: string;
  // Offset in lat/lng for 2D map & 3D relative coordinates
  latOffset: number;
  lngOffset: number;
  pos3D: [number, number, number];
}

export function buildGisPinsForSite(site: HeritageSite, lang: string = 'vi'): GisPinItem[] {
  const firstMilestone = site.milestones?.[0];
  const secondMilestone = site.milestones?.[1];
  const architectName = site.architect || 'Kiến trúc sư Đông Dương & Việt Nam';

  return [
    {
      id: `${site.id}-bauten`,
      layer: 'bauten',
      code: lang === 'en' ? 'Architecture' : 'Kiến trúc',
      color: '#C5A059',
      title:
        lang === 'en'
          ? `Architectural System: ${site.architecturalStyle}`
          : `Kết cấu Kiến trúc: ${site.architecturalStyle}`,
      subtitle: `${site.materials?.slice(0, 2).join(' · ') || 'Đá cổ & Gỗ quý'}`,
      detail:
        site.conservationNotes ||
        'Hệ kết cấu chịu lực nguyên bản bảo tồn theo tiêu chuẩn trùng tu di tích quốc gia.',
      latOffset: 0.00055,
      lngOffset: -0.00065,
      pos3D: [-1.8, 1.9, 1.4],
    },
    {
      id: `${site.id}-personen`,
      layer: 'personen',
      code: lang === 'en' ? 'Architect' : 'Nhân vật',
      color: '#E05A47',
      title:
        lang === 'en'
          ? `Key Figure / Architect: ${architectName.split('(')[0].trim()}`
          : `Nhân vật / Tác giả: ${architectName.split('(')[0].trim()}`,
      subtitle: site.chronology,
      detail: `Người định hình diện mạo công trình ${site.officialName} trong tiến trình lịch sử đô thị Nam Bộ.`,
      latOffset: -0.0005,
      lngOffset: 0.0007,
      pos3D: [1.9, 1.5, 1.5],
    },
    {
      id: `${site.id}-ereignis`,
      layer: 'ereignis',
      code: lang === 'en' ? 'Event' : 'Sự kiện',
      color: '#D9822B',
      title: firstMilestone
        ? `${firstMilestone.year} — Sự kiện Lịch sử`
        : `Dấu mốc Lịch sử (${site.commencementYear || '1868'})`,
      subtitle: site.rankingLevel,
      detail: firstMilestone?.event || site.summary,
      latOffset: 0.00065,
      lngOffset: 0.0006,
      pos3D: [1.7, 2.4, -1.2],
    },
    {
      id: `${site.id}-quellen`,
      layer: 'quellen',
      code: lang === 'en' ? 'Archive' : 'Tư liệu',
      color: '#3AA690',
      title:
        lang === 'en'
          ? `Archival Dossier #${site.identifierCode}`
          : `Lưu trữ gốc #${site.identifierCode}`,
      subtitle: site.decisionDecreeNumber || 'Tư liệu Bản vẽ & Địa bạ cổ',
      detail:
        secondMilestone?.event ||
        'Hồ sơ bản vẽ mặt cắt kiến trúc, ảnh chụp bưu thiếp Đông Dương và quyết định xếp hạng di tích.',
      latOffset: -0.0006,
      lngOffset: -0.00055,
      pos3D: [-1.7, 1.2, -1.5],
    },
    {
      id: `${site.id}-audio`,
      layer: 'audio',
      code: lang === 'en' ? 'Audio' : 'Thuyết minh',
      color: '#38BDF8',
      title:
        lang === 'en'
          ? `Spatial Audio Point: ${site.officialName}`
          : `Trạm Thuyết minh 3D: ${site.officialName}`,
      subtitle: 'Tần số âm thanh vòm 360° & Thuyết minh chuyên khảo',
      detail:
        'Bấm để nghe phân tích chuyên sâu về lịch sử kiến tạo, vật liệu địa chất và giai thoại di sản.',
      latOffset: 0.00015,
      lngOffset: 0.00085,
      pos3D: [0, 2.9, 1.8],
    },
  ];
}

// ============================================================================
// 2. HISTORICAL ERAS GENERATOR FOR CHÂTEAU D'AMBOISE 3D INTERFACE
// ============================================================================
export interface ChateauEraItem {
  id: string;
  shortPeriod: string;
  titleVi: string;
  titleEn: string;
  figureName: string;
  figureRole: string;
  figureYears: string;
  archNote: string;
  blueprintCaption: string;
}

export function getChateauErasForSite(site: HeritageSite): ChateauEraItem[] {
  const cleanArch = (site.architect || 'Kiến trúc sư Đông Dương').split('(')[0].trim();

  if (site.id === 'HCM-DT-001' || site.id === 'dinh-doc-lap') {
    return [
      {
        id: 'era-pre-1860',
        shortPeriod: 'Trước 1860 (Gia Định)',
        titleVi: 'Thành Bát Quái & Quy hoạch Gia Định Cổ (1790–1859)',
        titleEn: 'Bagua Citadel & Ancient Gia Dinh Planning (1790–1859)',
        figureName: 'Trần Văn Học & Olivier de Puymanel',
        figureRole: 'Quy hoạch Thành Quy (Thành Bát Quái) — Gia Định',
        figureYears: '1790–1835',
        archNote:
          'Khu đất cao trung tâm Thành Gia Định cổ với hệ thống hào nước và trục thần đạo hướng ra sông Sài Gòn trước khi người Pháp quy hoạch đại lộ Norodom.',
        blueprintCaption: 'Bản đồ Thành Bát Quái Gia Định năm 1815 (Trần Văn Học)',
      },
      {
        id: 'era-1868-1900',
        shortPeriod: '1868–1900 (Khởi dựng)',
        titleVi: 'Dinh Norodom — KTS. Achille-Antoine Hermitte (1868–1873)',
        titleEn: 'Norodom Palace — Arch. Achille-Antoine Hermitte (1868–1873)',
        figureName: 'KTS. Achille-Antoine Hermitte',
        figureRole: 'Kiến trúc sư Pháp (Tân Cổ điển Đế chế thứ hai)',
        figureYears: '1840–1870',
        archNote:
          'Khởi dựng ngày 23/2/1868 với mặt tiền rộng 80m theo phong cách Tân cổ điển Pháp, đá xanh Biên Hòa và vật liệu nhập khẩu từ Pháp.',
        blueprintCaption: 'Bưu thiếp cổ Dinh Norodom (Phủ Toàn quyền Đông Dương) năm 1898',
      },
      {
        id: 'era-1945-1954',
        shortPeriod: '1945–1954 (Chuyển giao)',
        titleVi: 'Giai đoạn Chuyển giao Lịch sử Đông Dương (1945–1954)',
        titleEn: 'Indochina Historical Transition Era (1945–1954)',
        figureName: 'Cao ủy Pháp & Chính quyền Sài Gòn',
        figureRole: 'Biến động Chính trị & Đô thị Sài Gòn',
        figureYears: '1945–1954',
        archNote:
          'Công trình chứng kiến sự chuyển giao quyền lực sau Thế chiến II và Hiệp định Genève 1954, đổi tên từ Dinh Norodom sang Dinh Độc Lập.',
        blueprintCaption: 'Không ảnh trục đại lộ Norodom (Lê Duẩn) năm 1950',
      },
      {
        id: 'era-1955-1975',
        shortPeriod: '1955–1975 (Tái thiết)',
        titleVi: 'KTS. Ngô Viết Thụ — Kiến trúc Hiện đại Phương Đông (1962–1966)',
        titleEn: 'Arch. Ngo Viet Thu — Oriental Modernist Masterpiece (1962–1966)',
        figureName: 'KTS. Ngô Viết Thụ (Khôi nguyên La Mã)',
        figureRole: 'Kiến trúc sư trưởng (Premier Grand Prix de Rome 1955)',
        figureYears: '1926–2000',
        archNote:
          'Thiết kế mới hoàn toàn năm 1962 theo chiết tự chữ CÁT (吉), chữ KHẨU (口), chữ TRUNG (忠) cùng hệ rèm hoa đá hình đốt trúc độc bản.',
        blueprintCaption: 'Bản vẽ mặt đứng chính chữ CÁT của KTS. Ngô Viết Thụ (1962)',
      },
      {
        id: 'era-1975-2026',
        shortPeriod: '1975–2026 (Bảo tồn)',
        titleVi: 'Hội Trường Thống Nhất — Di tích Quốc gia Đặc biệt (1975–2026)',
        titleEn: 'Reunification Hall — Special National Monument (1975–2026)',
        figureName: 'Hội đồng Bảo tồn Di sản Quốc gia',
        figureRole: 'Di tích Quốc gia Đặc biệt (Quyết định 1272/QĐ-TTg)',
        figureYears: '1975–2026',
        archNote:
          'Bảo tồn nguyên trạng 100 phòng chức năng, hầm chỉ huy ngầm chịu bom và số hóa không gian 3D / BIM phục vụ nghiên cứu quốc tế.',
        blueprintCaption: 'Mô hình số hóa BIM / Quang trắc 3D Hội Trường Thống Nhất (2026)',
      },
    ];
  }

  return [
    {
      id: 'era-1',
      shortPeriod: 'Trước 1860 (Gia Định)',
      titleVi: `Địa tầng Lịch sử Sơ khởi — ${site.address.district} (Trước 1860)`,
      titleEn: `Early Historical Stratum — ${site.address.district} (Pre-1860)`,
      figureName: 'Cư dân & Nghệ nhân Nam Bộ cổ',
      figureRole: 'Khai phá địa tầng văn hóa & giao thương đường thủy',
      figureYears: 'Thế kỷ XVIII – 1859',
      archNote: `Khu vực ${site.address.district} hình thành mạng lưới kênh rạch, làng nghề và cấu trúc phòng thủ truyền thống trên nền địa chất Đông Nam Bộ.`,
      blueprintCaption: `Bản đồ địa hình cổ khu vực ${site.address.district} (1815)`,
    },
    {
      id: 'era-2',
      shortPeriod: '1868–1900 (Khởi dựng)',
      titleVi: `${cleanArch} — Thời kỳ Kiến tạo Nguyên bản (${site.commencementYear || '1880–1900'})`,
      titleEn: `${cleanArch} — Original Construction Era (${site.commencementYear || '1880–1900'})`,
      figureName: cleanArch,
      figureRole: `Tác giả kiến trúc (${site.architecturalStyle})`,
      figureYears: site.chronology || 'Cuối thế kỷ XIX',
      archNote:
        site.milestones?.[0]?.event ||
        `Khởi dựng công trình theo phong cách ${site.architecturalStyle} với kỹ thuật vật liệu ${site.materials?.slice(0, 2).join(', ') || 'đá và gạch cổ'}.`,
      blueprintCaption: `Tư liệu bản vẽ & bưu thiếp cổ công trình (${site.commencementYear || 1900})`,
    },
    {
      id: 'era-3',
      shortPeriod: '1945–1954 (Biến động)',
      titleVi: `Biến chuyển Đô thị & Lịch sử Kháng chiến (1945–1954)`,
      titleEn: `Urban Transformation & Resistance Era (1945–1954)`,
      figureName: 'Chứng nhân Lịch sử Đông Nam Bộ',
      figureRole: 'Giai đoạn bản lề thế kỷ XX',
      figureYears: '1945–1954',
      archNote:
        site.milestones?.[1]?.event ||
        `Công trình đi qua giai đoạn lịch sử 1945–1954, ghi dấu nhiều sự kiện văn hóa – quân sự quan trọng tại ${site.address.district}.`,
      blueprintCaption: `Tư liệu ảnh lưu trữ giai đoạn 1945–1954`,
    },
    {
      id: 'era-4',
      shortPeriod: '1955–1975 (Cải tạo)',
      titleVi: `Giai đoạn 1955–1975 — Dấu ấn Lịch sử & Kỹ thuật`,
      titleEn: `1955–1975 Era — Historical & Structural Imprint`,
      figureName: cleanArch,
      figureRole: 'Bảo tồn & Mở rộng kết cấu công trình',
      figureYears: '1955–1975',
      archNote:
        site.milestones?.[2]?.event ||
        site.summary,
      blueprintCaption: `Hồ sơ khảo sát kiến trúc giai đoạn 1955–1975`,
    },
    {
      id: 'era-5',
      shortPeriod: '1975–2026 (Bảo tồn)',
      titleVi: `Trùng tu Khoa học & Số hóa Di sản 3D (1975–2026)`,
      titleEn: `Scientific Conservation & 3D Digital Twin (1975–2026)`,
      figureName: 'Viện Bảo tồn Di tích & Dấu Ấn Việt 3D',
      figureRole: site.rankingLevel,
      figureYears: '1975–2026',
      archNote:
        site.conservationNotes ||
        'Công trình được bảo tồn nghiêm ngặt và quét 3D/quang trắc độ chính xác cao phục vụ trưng bày bảo tàng số.',
      blueprintCaption: `Bản sao số 3D (Digital Twin) chuẩn WGS84 — Năm 2026`,
    },
  ];
}

// ============================================================================
// 3. LISBOA ROMANA DIAGONAL BEFORE / AFTER SPLIT SLIDER OVERLAY
// ============================================================================
const CUSTOM_HISTORICAL_STORAGE_KEY = 'heritage_custom_historical_photos_v1';

interface HistoricalArchiveEntry {
  index: number;
  siteId: string;
  url?: string;
  title: string;
  titleEn: string;
  eraTag: string;
  caption: string;
  captionEn: string;
  credit: string;
  isFilteredArchival?: boolean;
  filterCss?: string;
}

const HISTORICAL_ARCHIVE_LIST: HistoricalArchiveEntry[] = [
  {
    index: 0,
    siteId: 'HCM-DT-001',
    title: 'Dinh Toàn quyền / Dinh Norodom (1896)',
    titleEn: 'Palais Norodom / Governor-General Palace (1896)',
    eraTag: '1896',
    caption: 'Dinh Toàn quyền Đông Dương tại Sài Gòn năm 1896 trước khi KTS Ngô Viết Thụ tái thiết năm 1962.',
    captionEn: 'Indochina Governor-General Palace in 1896 prior to Ngo Viet Thu’s 1962 reconstruction.',
    credit: 'Kho lưu trữ Đông Dương 1896',
  },
  {
    index: 1,
    siteId: 'HCM-DT-002',
    title: 'Théâtre Municipal de Saïgon (1920)',
    titleEn: 'Municipal Theatre of Saigon (1920)',
    eraTag: '1920',
    caption: 'Mặt tiền Nhà hát Lớn Sài Gòn năm 1920 với vòm cửa Baroque và phù điêu đắp nổi trên đường Catinat.',
    captionEn: 'Saigon Opera House facade in 1920 along historic Rue Catinat.',
    credit: 'Bưu ảnh Sài Gòn 1920',
  },
  {
    index: 2,
    siteId: 'HCM-DT-003',
    title: 'Hôtel des Postes de Saïgon (1900)',
    titleEn: 'Hôtel des Postes de Saïgon (1900)',
    eraTag: '1900',
    caption: 'Bưu điện Trung tâm Sài Gòn đầu thế kỷ XX với mặt đứng Tân Cổ điển Pháp và hệ khung vòm thép.',
    captionEn: 'Saigon Central Post Office circa 1900 with French Neoclassical facade and Eiffel iron truss.',
    credit: 'Tư liệu Bưu điện Sài Gòn 1900',
  },
  {
    index: 3,
    siteId: 'HCM-DT-004',
    title: 'Les Halles Centrales de Saïgon (1914)',
    titleEn: 'Les Halles Centrales de Saïgon (1914)',
    eraTag: '1914',
    caption: 'Chợ Mới Bến Thành năm khánh thành 1914 cùng tháp đồng hồ cửa Nam và quảng trường giao lộ trung tâm.',
    captionEn: 'Newly built Ben Thanh Market (Les Halles Centrales) in 1914 with its South Gate clock tower.',
    credit: 'Bưu ảnh Đông Dương 1914',
  },
  {
    index: 4,
    siteId: 'HCM-DT-005',
    title: 'Cathédrale Notre-Dame de Saïgon (1900)',
    titleEn: 'Cathédrale Notre-Dame de Saïgon (1900)',
    eraTag: '1900',
    caption: 'Vương cung Thánh đường Đức Bà Sài Gòn năm 1900 với hai tháp chuông gạch trần Marseille nguyên bản.',
    captionEn: 'Notre-Dame Cathedral of Saigon circa 1900 featuring original Marseille red brick spires.',
    credit: 'Tư liệu Sài Gòn xưa 1900',
  },
  {
    index: 5,
    siteId: 'HCM-DT-006',
    title: 'Musée Blanchard de la Brosse (1929)',
    titleEn: 'Musée Blanchard de la Brosse (1929)',
    eraTag: '1929',
    caption: 'Bảo tàng Blanchard de la Brosse năm 1929 — công trình khai sinh phong cách Kiến trúc Đông Dương.',
    captionEn: 'Blanchard de la Brosse Museum in 1929 — landmark of Ernest Hébrard’s Indochinese style.',
    credit: 'Tư liệu Bảo tàng 1929',
  },
  {
    index: 6,
    siteId: 'HCM-DT-007',
    title: 'Messageries Maritimes de Saïgon (1900)',
    titleEn: 'Messageries Maritimes de Saïgon (1900)',
    eraTag: '1900',
    caption: 'Trụ sở Hãng vận tải biển Messageries Maritimes (Bến Nhà Rồng) bên thương cảng Sài Gòn năm 1900.',
    captionEn: 'Messageries Maritimes Headquarters (Nha Rong Wharf) along Saigon River circa 1900.',
    credit: 'Tư liệu Cảng Sài Gòn 1900',
  },
  {
    index: 7,
    siteId: 'HCM-DT-008',
    title: 'Lăng Ông Bà Chiểu – Gia Định xưa (1920)',
    titleEn: 'Ba Chieu Mausoleum – Historic Gia Dinh (1920)',
    eraTag: '1920',
    caption: 'Tư liệu Lăng Tả quân Lê Văn Duyệt (Tombeau d’un Mandarin) vùng Gia Định xưa trên bưu ảnh 1920.',
    captionEn: 'Historic 1920 postcard of General Le Van Duyet Mausoleum in Gia Dinh.',
    credit: 'Bưu ảnh Gia Định 1920',
  },
  {
    index: 8,
    siteId: 'HCM-DT-009',
    title: 'Vùng Đất Thép Củ Chi (Tư liệu 1967)',
    titleEn: 'Cu Chi Iron Land Tunnels (1967 Archive)',
    eraTag: '1967',
    caption: 'Ảnh tư liệu cửa hầm bí mật vùng đất thép Củ Chi năm 1967 thuộc hồ sơ chiến dịch Cedar Falls (NARA).',
    captionEn: '1967 NARA archival photograph of a concealed Cu Chi tunnel entrance during Operation Cedar Falls.',
    credit: 'Kho lưu trữ Quốc gia NARA 1967',
  },
  {
    index: 9,
    siteId: 'HCM-DT-010',
    title: 'Di chỉ Mộ chum Cần Giờ (~2.500 năm trước)',
    titleEn: 'Giong Ca Vo Jar Burials (~2,500 Years BP)',
    eraTag: '~500 BCE',
    caption: 'Tư liệu khai quật & cổ vật mộ chum gốm Giồng Cá Vồ niên đại khoảng 2.500 năm trước.',
    captionEn: 'Archival documentation of Giong Ca Vo archaeological jar burial artifacts (~500 BCE).',
    credit: 'Tư liệu Khảo cổ Cần Giờ',
    isFilteredArchival: true,
    filterCss: 'sepia(0.85) contrast(1.15) brightness(0.86)',
  },
  {
    index: 10,
    siteId: 'HCM-DT-011',
    title: 'Tổ đình Giác Lâm (Dựng năm 1744)',
    titleEn: 'Giac Lam Ancestral Pagoda (Founded 1744)',
    eraTag: '1744',
    caption: 'Ngôi tổ đình cổ nhất vùng Gia Định (dựng năm 1744) phục chế tông phim lưu trữ đầu thế kỷ XX.',
    captionEn: 'Oldest pagoda in Gia Dinh (1744) presented in archival plate documentation.',
    credit: 'Tư liệu Tổ đình Giác Lâm',
    isFilteredArchival: true,
    filterCss: 'sepia(0.86) contrast(1.16) brightness(0.84) saturate(0.75)',
  },
  {
    index: 11,
    siteId: 'HCM-DT-012',
    title: 'Chùa Ông Chợ Lớn (Đầu thế kỷ XX)',
    titleEn: 'Cholon Quan Am / Nghia An Hall (Early 20C)',
    eraTag: 'ĐẦU TK XX',
    caption: 'Kiến trúc hội quán Triều Châu cổ kính vùng Chợ Lớn phục chế sắc độ ảnh phim đầu thế kỷ XX.',
    captionEn: 'Historic Cholon Teochew assembly architecture in archival plate documentation.',
    credit: 'Tư liệu Chợ Lớn',
    isFilteredArchival: true,
    filterCss: 'sepia(0.86) contrast(1.16) brightness(0.84) saturate(0.75)',
  },
  {
    index: 12,
    siteId: 'BRVT-DT-001',
    title: 'Villa Blanche – Cap Saint-Jacques (1920)',
    titleEn: 'Villa Blanche – Cap Saint-Jacques (1920)',
    eraTag: '1920',
    caption: 'Bạch Dinh bên sườn Núi Lớn hướng ra Bãi Trước Vũng Tàu trên bưu ảnh lưu trữ năm 1920.',
    captionEn: 'Villa Blanche overlooking Front Beach at Cap Saint-Jacques (Vung Tau) in 1920.',
    credit: 'Bưu ảnh Cap Saint-Jacques 1920',
  },
  {
    index: 13,
    siteId: 'BRVT-DT-002',
    title: 'Đền Ông Trần Long Sơn (1910–1929)',
    titleEn: 'Nha Lon Long Son Timber Complex (1910–1929)',
    eraTag: '1910–1929',
    caption: 'Quần thể kiến trúc gỗ truyền thống Nhà Lớn Long Sơn đầu thế kỷ XX.',
    captionEn: 'Traditional timber heritage complex of Nha Lon Long Son in early 20C archival plate.',
    credit: 'Tư liệu Di sản Long Sơn',
    isFilteredArchival: true,
    filterCss: 'sepia(0.88) contrast(1.18) brightness(0.82)',
  },
  {
    index: 14,
    siteId: 'BRVT-DT-003',
    title: 'Căn cứ Địa đạo Long Phước (1948–1968)',
    titleEn: 'Long Phuoc Resistance Tunnels (1948–1968)',
    eraTag: '1948–1968',
    caption: 'Hệ thống căn cứ địa đạo Long Phước thời kỳ kháng chiến trong hồ sơ lưu trữ lịch sử.',
    captionEn: 'Long Phuoc resistance tunnel base (1948–1968) in archival historical records.',
    credit: 'Tư liệu Kháng chiến Bà Rịa',
    isFilteredArchival: true,
    filterCss: 'grayscale(0.65) sepia(0.55) contrast(1.22) brightness(0.8)',
  },
  {
    index: 15,
    siteId: 'BD-DT-001',
    title: 'Nhà rường Thủ Dầu Một (1889–1892)',
    titleEn: 'Thu Dau Mot 5-Bay Heritage House (1889–1892)',
    eraTag: '1892',
    caption: 'Ngôi nhà rường gỗ 5 gian 2 chái họ Trần tại Phú Cường năm 1892.',
    captionEn: 'Traditional 1892 5-bay timber residence in Thu Dau Mot in archival plate documentation.',
    credit: 'Tư liệu Thủ Dầu Một 1892',
    isFilteredArchival: true,
    filterCss: 'sepia(0.9) contrast(1.18) brightness(0.82)',
  },
  {
    index: 16,
    siteId: 'BD-DT-002',
    title: 'Chiến khu Tam Giác Sắt Bến Cát (1967)',
    titleEn: 'Iron Triangle – Ben Cat War Zone (1967)',
    eraTag: '1967',
    caption: 'Tư liệu lịch sử vùng chiến khu Tam Giác Sắt – Tây Nam Bến Cát năm 1967 (Kho lưu trữ NARA).',
    captionEn: '1967 NARA historical archive record from the Iron Triangle – Ben Cat region.',
    credit: 'Kho lưu trữ Quốc gia NARA 1967',
  },
];

export const HISTORICAL_ARCHIVE_BY_SITE: Record<string, HistoricalArchiveEntry> = Object.fromEntries(
  HISTORICAL_ARCHIVE_LIST.map((entry) => [entry.siteId, entry])
);

export function getHistoricalArchiveForSite(siteId: string): HistoricalArchiveEntry | undefined {
  return HISTORICAL_ARCHIVE_BY_SITE[siteId];
}

const CUSTOM_HISTORICAL_CHANGED_EVENT = 'heritage_custom_historical_photos_changed';

function loadCustomHistoricalMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CUSTOM_HISTORICAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getCustomHistoricalPhotoForSite(siteId: string): string | undefined {
  return loadCustomHistoricalMap()[siteId];
}

export function saveCustomHistoricalPhotoForSite(
  siteId: string,
  photoDataOrUrl: string
): Record<string, string> {
  const current = loadCustomHistoricalMap();
  const updated = { ...current, [siteId]: photoDataOrUrl };
  try {
    localStorage.setItem(CUSTOM_HISTORICAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CUSTOM_HISTORICAL_CHANGED_EVENT));
  }
  return updated;
}

export function removeCustomHistoricalPhotoForSite(siteId: string): Record<string, string> {
  const current = loadCustomHistoricalMap();
  const updated = { ...current };
  delete updated[siteId];
  try {
    localStorage.setItem(CUSTOM_HISTORICAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CUSTOM_HISTORICAL_CHANGED_EVENT));
  }
  return updated;
}

// ============================================================================
// 4. MULTI-LAYER GIS CHECKBOX FILTER PANEL (BAUTEN / PERSONEN / EREIGNIS / QUELLEN / AUDIO)
// ============================================================================
interface GisMultiLayerPanelProps {
  activeLayers: Record<GisLayerKey, boolean>;
  onToggleLayer: (key: GisLayerKey) => void;
  lang: string;
  compact?: boolean;
}

export const GisMultiLayerPanel: React.FC<GisMultiLayerPanelProps> = ({
  activeLayers,
  onToggleLayer,
  lang,
  compact = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(compact);

  return (
    <div className="bg-[#141210]/95 border border-[#C5A059]/45 backdrop-blur-md text-[#F4F1EA] shadow-2xl w-72 sm:w-80 select-none">
      <button
        type="button"
        onClick={() => setIsCollapsed((v) => !v)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between border-b border-[#F4F1EA]/12 hover:bg-[#1E1B18] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
          <span className="font-sans text-xs font-semibold text-[#C5A059]">
            {lang === 'en'
              ? '3D GIS Multi-layer Filter'
              : lang === 'zh'
              ? '3D GIS 多图层过滤器'
              : 'Bảng lọc GIS đa lớp'}
          </span>
        </div>
        <span className="font-sans tabular-nums text-xs text-[#E6E1D6]/70">
          {isCollapsed ? '[+]' : '[–]'}
        </span>
      </button>

      {!isCollapsed && (
        <div className="p-3 space-y-1.5">
          {GIS_MULTI_LAYERS.map((layer) => {
            const isChecked = !!activeLayers[layer.key];
            const label =
              lang === 'en' ? layer.labelEn : lang === 'zh' ? layer.labelZh : layer.labelVi;
            return (
              <button
                key={layer.key}
                type="button"
                onClick={() => onToggleLayer(layer.key)}
                className={`w-full px-2.5 py-1.5 flex items-center justify-between text-left transition-colors cursor-pointer border ${
                  isChecked
                    ? 'bg-[#1F1C18] border-[#C5A059]/40 text-[#F4F1EA]'
                    : 'bg-transparent border-transparent text-[#A39E93] hover:text-[#F4F1EA]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isChecked ? (
                    <CheckSquare className="w-3.5 h-3.5 shrink-0" style={{ color: layer.color }} />
                  ) : (
                    <Square className="w-3.5 h-3.5 shrink-0 text-[#A39E93]/50" />
                  )}
                  <span className="text-[11px] leading-tight truncate">{label}</span>
                </div>
                <span
                  className="ml-2 px-1.5 py-0.5 font-serif italic font-bold text-[10px] shrink-0 border"
                  style={{
                    color: layer.color,
                    borderColor: layer.color,
                    backgroundColor: layer.bgColor,
                  }}
                >
                  [i]
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 5. CHÂTEAU D'AMBOISE 3D SPATIAL INTERFACE HUD
//    - Top-Center Gold Era Banner
//    - Top-Left 3D Spatial Compass (N - E - S - W)
//    - Bottom Historical Era Selector Bar + "So sánh (Comparer)"
//    - Bottom-Right Historical Figure / Architect & Archival Card
// ============================================================================
interface ChateauAmboiseHUDProps {
  site: HeritageSite;
  lang: string;
  cameraAzimuthDeg: number;
  selectedEraIndex: number;
  onSelectEraIndex: (idx: number) => void;
  onOpenLisboaCompare?: () => void;
  isCrownOrbitActive: boolean;
  onToggleCrownOrbit: () => void;
}

export const ChateauAmboiseHUD: React.FC<ChateauAmboiseHUDProps> = ({
  site,
  lang,
  cameraAzimuthDeg,
  selectedEraIndex,
  onSelectEraIndex,
  isCrownOrbitActive,
  onToggleCrownOrbit,
}) => {
  const eras = useMemo(() => getChateauErasForSite(site), [site]);
  const currentEra = eras[selectedEraIndex] || eras[eras.length - 1];
  const [showFigureCard, setShowFigureCard] = useState<boolean>(true);

  return (
    <>
      {/* 1. TOP-CENTER CLASSIC GOLD ERA BANNER (CHÂTEAU D'AMBOISE STYLE) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center max-w-[92vw]">
        <div className="bg-[#C5A059] text-[#141210] px-6 sm:px-8 py-2 font-serif shadow-[0_8px_30px_rgba(0,0,0,0.65)] border border-[#F4F1EA]/40 text-center">
          <div className="text-[11px] font-sans font-medium opacity-80">
            {lang === 'en'
              ? 'Spatial Heritage Chronology'
              : 'Niên biểu Không gian 3D · Di sản Đông Nam Bộ'}
          </div>
          <div className="text-sm sm:text-base font-bold">
            {lang === 'en' ? currentEra.titleEn : currentEra.titleVi}
          </div>
        </div>
      </div>

      {/* 2. TOP-LEFT 3D SPATIAL COMPASS ROSE (N - E - S - W) ROTATING WITH CAMERA AZIMUTH */}
      <div className="absolute top-20 left-5 z-30 pointer-events-auto flex items-center gap-3">
        <div
          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#141210]/90 border border-[#C5A059]/60 shadow-xl flex items-center justify-center backdrop-blur-md"
          title="La bàn Không gian 3D xoay theo góc Camera thực tế"
        >
          <div
            className="relative w-full h-full flex items-center justify-center transition-transform duration-150 ease-out"
            style={{
              transform: `rotateX(28deg) rotateZ(${-cameraAzimuthDeg}deg)`,
            }}
          >
            <span className="absolute top-1 text-[10px] font-sans font-bold text-[#E05A47]">
              N
            </span>
            <span className="absolute right-1.5 text-[9px] font-sans text-[#C5A059]">
              E
            </span>
            <span className="absolute bottom-1 text-[9px] font-sans text-[#E6E1D6]/80">
              S
            </span>
            <span className="absolute left-1.5 text-[9px] font-sans text-[#C5A059]">
              W
            </span>
            {/* Compass needle */}
            <svg className="w-8 h-8" viewBox="0 0 32 32">
              <polygon points="16,4 20,16 16,14 12,16" fill="#E05A47" />
              <polygon points="16,28 20,16 16,18 12,16" fill="#C5A059" />
              <circle cx="16" cy="16" r="2.2" fill="#F4F1EA" />
            </svg>
          </div>
          <div className="absolute -bottom-5 inset-x-0 text-center font-sans tabular-nums text-[10px] text-[#C5A059]">
            {Math.round(((cameraAzimuthDeg % 360) + 360) % 360)}°
          </div>
        </div>

        {/* Quick toggle for X-Ray Crown Orbit & Lisboa Split */}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onToggleCrownOrbit}
            className={`px-3 py-1.5 font-sans text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
              isCrownOrbitActive
                ? 'bg-[#C5A059] text-[#141210] border-[#F4F1EA] font-bold shadow-[0_0_20px_rgba(197,160,89,0.5)]'
                : 'bg-[#141210]/90 text-[#E6E1D6] border-[#C5A059]/50 hover:border-[#C5A059]'
            }`}
          >
            <span>🌐</span>
            <span>
              {lang === 'en'
                ? 'X-Ray Crown & Orbital Arc'
                : 'Giải phẫu Đỉnh Mái & Quỹ đạo'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. BOTTOM-RIGHT HISTORICAL FIGURE / ARCHITECT & ARCHIVAL CARD (CHÂTEAU D'AMBOISE STYLE) */}
      <div className="absolute bottom-36 right-5 z-25 pointer-events-auto max-w-xs sm:max-w-sm hidden md:block">
        {showFigureCard ? (
          <div className="bg-[#141210]/95 border border-[#C5A059]/55 p-4 text-[#F4F1EA] shadow-2xl backdrop-blur-md">
            <div className="flex items-start justify-between gap-3 border-b border-[#F4F1EA]/12 pb-3">
              <div className="flex items-center gap-3">
                {/* Portrait Medallion */}
                <div className="w-12 h-12 shrink-0 bg-[#231E18] border border-[#C5A059] flex flex-col items-center justify-center text-[#C5A059]">
                  <User className="w-6 h-6" />
                  <span className="text-[9px] font-sans tabular-nums">
                    {currentEra.figureYears.slice(0, 9)}
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-sans font-medium text-[#C5A059]">
                    {currentEra.figureRole}
                  </div>
                  <h4 className="font-serif text-sm sm:text-base font-semibold text-[#F4F1EA]">
                    {currentEra.figureName}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFigureCard(false)}
                className="text-[#A39E93] hover:text-[#C5A059] text-xs font-sans cursor-pointer"
                title="Thu gọn thẻ nhân vật"
              >
                [–]
              </button>
            </div>

            <p className="text-xs text-[#E6E1D6]/90 leading-relaxed mt-2.5">
              {currentEra.archNote}
            </p>

            <div className="mt-2.5 pt-2 border-t border-[#F4F1EA]/10 flex items-center justify-between text-[11px] font-sans text-[#C5A059]">
              <span className="truncate">{currentEra.blueprintCaption}</span>
            </div>

            {/* 3D Interaction Gesture Guide */}
            <div className="mt-2.5 pt-2 border-t border-[#F4F1EA]/10 flex items-center justify-between text-[11px] font-sans text-[#A39E93]">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-[#C5A059]" /> Xoay 360°
              </span>
              <span className="flex items-center gap-1">
                <MousePointerClick className="w-3 h-3 text-[#C5A059]" /> Bấm [+] để mổ xẻ
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowFigureCard(true)}
            className="px-3.5 py-2 bg-[#141210]/95 border border-[#C5A059]/60 text-[#C5A059] font-sans text-xs font-medium cursor-pointer"
          >
            [+] {currentEra.figureName}
          </button>
        )}
      </div>

      {/* 4. BOTTOM HISTORICAL ERA TIMELINE BAR */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-25 pointer-events-auto w-[95vw] max-w-5xl">
        <div className="bg-[#141210]/95 border border-[#C5A059]/50 px-3 py-1.5 backdrop-blur-md shadow-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 overflow-x-auto heritage-scrollbar">
          <span className="hidden lg:inline font-serif italic text-xs text-[#E6E1D6]/75 shrink-0 px-2">
            {lang === 'en' ? 'Select a historical era:' : 'Chọn một giai đoạn lịch sử:'}
          </span>

          {/* 5 Historical Era Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap heritage-scrollbar pb-1 touch-pan-x">
            {eras.map((era, idx) => {
              const isSelected = idx === selectedEraIndex;
              return (
                <button
                  key={era.id}
                  type="button"
                  onClick={() => onSelectEraIndex(idx)}
                  className={`px-3 py-1.5 font-sans tabular-nums text-xs shrink-0 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#C5A059] text-[#141210] border-[#F4F1EA] font-bold'
                      : 'bg-[#1B1815] text-[#E6E1D6]/80 border-[#F4F1EA]/15 hover:border-[#C5A059]/60 hover:text-[#F4F1EA]'
                  }`}
                >
                  {era.shortPeriod}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
