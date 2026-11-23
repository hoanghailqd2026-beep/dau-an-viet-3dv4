import { HeritageSite } from '../types/heritage';
import { Language } from '../i18n/types';

export interface GuidedTourRoute {
  id: string;
  badge: string;
  title: string;
  titleEn?: string;
  titleZh?: string;
  editorialTitle: string;
  editorialTitleEn: string;
  editorialTitleZh: string;
  subtitle: string;
  durationLabel: string;
  durationShort: string;
  durationShortEn: string;
  durationShortZh: string;
  theme: string;
  themeEn: string;
  themeZh: string;
  mappedTourId: string;
  siteIds: string[];
  stopTips: Record<string, string>;
  stopTipsEn: Record<string, string>;
  stopTipsZh: Record<string, string>;
}

export const GUIDED_TOUR_ROUTES: GuidedTourRoute[] = [
  {
    id: 'GUIDED-01',
    badge: 'Tuyến 1 · Kiến trúc Đô thị',
    title: 'Tuyến 1: Tinh hoa Kiến trúc Đô thị Xưa',
    titleEn: 'Route 01: Essence of Historic Urban Architecture',
    titleZh: '路线 01：西贡历史都市建筑精华',
    editorialTitle: 'Tinh hoa Kiến trúc Đô thị Xưa',
    editorialTitleEn: 'Essence of Historic Urban Architecture',
    editorialTitleZh: '西贡历史都市建筑精华',
    subtitle: 'Dinh Độc Lập → Nhà hát Thành phố → Bưu điện Trung tâm → Chợ Bến Thành',
    durationLabel: '~5 phút trải nghiệm',
    durationShort: '~5 PHÚT',
    durationShortEn: '~5 MIN',
    durationShortZh: '约5分钟',
    theme: 'Hiện đại Nhiệt đới & Beaux-Arts Sài Gòn',
    themeEn: 'Tropical Modernism & Saigon Beaux-Arts',
    themeZh: '热带现代主义与西贡布杂艺术风格',
    mappedTourId: 'TOUR-01',
    siteIds: ['HCM-DT-001', 'HCM-DT-002', 'HCM-DT-003', 'HCM-DT-004'],
    stopTips: {
      'HCM-DT-001':
        'Mẹo: Xoay 360° và thử bật chế độ X-Ray để xem rèm hoa đá đốt trúc và hầm chỉ huy bên trong.',
      'HCM-DT-002':
        'Mẹo: Bấm Video Tư Liệu và chuyển tab Kho Wikimedia Commons để khám phá khán phòng bên trong.',
      'HCM-DT-003':
        'Mẹo: Bật Bóc tách 3D hoặc Nội thất để chiêm ngưỡng vòm sắt Gustave Eiffel và sảnh chính.',
      'HCM-DT-004':
        'Mẹo: Mở Bản đồ 1815 để đối chiếu vị trí chợ xưa ven rạch và tháp đồng hồ trung tâm hiện nay.',
    },
    stopTipsEn: {
      'HCM-DT-001':
        'Tip: Rotate 360° and toggle X-Ray mode to inspect the bamboo stone lattice facade and underground command bunker.',
      'HCM-DT-002':
        'Tip: Open Archival Video and switch to the Wikimedia Commons tab to explore the interior auditorium.',
      'HCM-DT-003':
        'Tip: Enable 3D Exploded or Interior view to admire Gustave Eiffel’s iron vault and grand concourse.',
      'HCM-DT-004':
        'Tip: Open the 1815 Historical Map to compare the canal-side old market with today’s clock tower.',
    },
    stopTipsZh: {
      'HCM-DT-001':
        '提示：360°旋转并开启X光透视模式，即可查看竹节石花窗立面与地下指挥掩体。',
      'HCM-DT-002':
        '提示：点击历史影像并切换至维基共享资源库，探索剧院内部观众席大厅。',
      'HCM-DT-003':
        '提示：开启3D拆解或室内视角，欣赏居斯塔夫·埃菲尔铁艺穹顶与中央大厅。',
      'HCM-DT-004':
        '提示：打开1815年历史地图，对比昔日河畔旧市集与今日中心钟楼方位。',
    },
  },
  {
    id: 'GUIDED-02',
    badge: 'Tuyến 2 · Lịch sử & Kháng chiến',
    title: 'Tuyến 2: Ký ức Lịch sử & Kháng chiến',
    titleEn: 'Route 02: Memory of History & Resistance',
    titleZh: '路线 02：历史记忆与抗战史诗',
    editorialTitle: 'Ký ức Lịch sử & Kháng chiến',
    editorialTitleEn: 'Memory of History & Resistance',
    editorialTitleZh: '历史记忆与抗战史诗',
    subtitle: 'Địa đạo Củ Chi → Dinh Độc Lập → Bến Nhà Rồng → Địa đạo Tam Giác Sắt',
    durationLabel: '~5 phút trải nghiệm',
    durationShort: '~5 PHÚT',
    durationShortEn: '~5 MIN',
    durationShortZh: '约5分钟',
    theme: 'Địa đạo 3 tầng ngầm & Dấu mốc Thống nhất',
    themeEn: '3-Level Subterranean Tunnels & Reunification Landmarks',
    themeZh: '三层地下坑道与国家统一里程碑',
    mappedTourId: 'TOUR-03',
    siteIds: ['HCM-DT-009', 'HCM-DT-001', 'HCM-DT-007', 'BD-DT-002'],
    stopTips: {
      'HCM-DT-009':
        'Mẹo: Bật Nội thất hoặc Bóc tách 3D để quan sát mặt cắt 3 tầng hầm ngầm (-3m đến -10m).',
      'HCM-DT-001':
        'Mẹo: Chọn điểm ghim trên mô hình và thử X-Ray để khám phá Phòng Nội các và nóc Dinh lịch sử.',
      'HCM-DT-007':
        'Mẹo: Mở VR 360° hoặc Hồ sơ Di sản để khám phá kiến trúc cảng Nhà Rồng và bộ ảnh tư liệu 01 | 02.',
      'BD-DT-002':
        'Mẹo: Mở Bản đồ & Tuyến để thấy trục chiến lược nối hai bờ sông Sài Gòn về Bến Cát.',
    },
    stopTipsEn: {
      'HCM-DT-009':
        'Tip: Toggle Interior or 3D Exploded view to examine the 3-level subterranean cross-section (-3m to -10m).',
      'HCM-DT-001':
        'Tip: Select pins on the model and enable X-Ray to inspect the Cabinet Chamber and historic rooftop.',
      'HCM-DT-007':
        'Tip: Open VR 360° or the Heritage Dossier to explore Dragon Wharf’s architecture and 01 | 02 archive photos.',
      'BD-DT-002':
        'Tip: Open Map & Routes to trace the strategic corridor linking both banks of the Saigon River to Ben Cat.',
    },
    stopTipsZh: {
      'HCM-DT-009':
        '提示：切换室内或3D拆解模式，观察地下3米至10米的三层地道纵剖面。',
      'HCM-DT-001':
        '提示：点击模型标注点并开启X光透视，探访内阁会议厅与历史屋顶停机坪。',
      'HCM-DT-007':
        '提示：打开 VR 360° 或遗产档案，探索龙屋港建筑细节及 01 | 02 实景照片档案。',
      'BD-DT-002':
        '提示：打开地图与路线，查看连接西贡河两岸通往滨吉的战略走廊。',
    },
  },
  {
    id: 'GUIDED-03',
    badge: 'Tuyến 3 · Biển & Văn hóa Nam Bộ',
    title: 'Tuyến 3: Di sản Biển & Văn hóa Nam Bộ',
    titleEn: 'Route 03: Maritime Heritage & Southern Culture',
    titleZh: '路线 03：海洋遗产与南部民俗文化',
    editorialTitle: 'Di sản Biển & Văn hóa Nam Bộ',
    editorialTitleEn: 'Maritime Heritage & Southern Culture',
    editorialTitleZh: '海洋遗产与南部民俗文化',
    subtitle: 'Bạch Dinh → Nhà Lớn Long Sơn → Nhà cổ Trần Công Vàng → Chùa Giác Lâm',
    durationLabel: '~5 phút trải nghiệm',
    durationShort: '~5 PHÚT',
    durationShortEn: '~5 MIN',
    durationShortZh: '约5分钟',
    theme: 'Dinh thự Hướng biển & Kiến trúc Gỗ Mộng chốt',
    themeEn: 'Coastal Villa & Interlocking Timber Joinery Architecture',
    themeZh: '海滨行宫与纯榫卯木构建筑艺术',
    mappedTourId: 'TOUR-05',
    siteIds: ['BRVT-DT-001', 'BRVT-DT-002', 'BD-DT-001', 'HCM-DT-011'],
    stopTips: {
      'BRVT-DT-001':
        'Mẹo: Chuyển chế độ ánh sáng Hoàng hôn ở góc trên trái để ngắm Bạch Dinh trên sườn Núi Lớn.',
      'BRVT-DT-002':
        'Mẹo: Bật Bóc tách 3D để xem quần thể gỗ quý lắp ghép mộng chốt hoàn toàn không đinh sắt.',
      'BD-DT-001':
        'Mẹo: Phóng to hệ khung mái để quan sát kết cấu nhà chữ Đinh 64 cột gỗ Thủ Dầu Một.',
      'HCM-DT-011':
        'Mẹo: Nhấn Nghe thuyết minh để tìm hiểu lịch sử Tổ đình Giác Lâm (1744) và kiến trúc chữ Tam.',
    },
    stopTipsEn: {
      'BRVT-DT-001':
        'Tip: Switch lighting to Sunset in the top-left corner to view Villa Blanche on the Big Mountain slope.',
      'BRVT-DT-002':
        'Tip: Enable 3D Exploded mode to examine the precious timber complex joined entirely without iron nails.',
      'BD-DT-001':
        'Tip: Zoom into the roof truss to inspect the 64-pillar Dinh-shaped wooden frame of Thu Dau Mot.',
      'HCM-DT-011':
        'Tip: Tap Audio Guide to hear the history of Giac Lam Patriarchal Pagoda (1744) and its Tam-shaped layout.',
    },
    stopTipsZh: {
      'BRVT-DT-001':
        '提示：在左上角切换“黄昏”光照模式，欣赏大山山腰上的头顿白宫风貌。',
      'BRVT-DT-002':
        '提示：开启3D拆解模式，观赏完全不用铁钉的珍贵红木榫卯建筑群。',
      'BD-DT-001':
        '提示：放大屋架结构，细观土龙木六十四柱“丁”字形古宅木构体系。',
      'HCM-DT-011':
        '提示：点击收听语音导览，了解觉林古寺（1744年）历史与“三”字形禅院布局。',
    },
  },
];

export interface ResolvedGuidedTour {
  route: GuidedTourRoute;
  stops: HeritageSite[];
}

/**
 * Resolves guided routes strictly from currently public heritage sites,
 * stripping out any monument ID hidden in `dau_an_viet_hidden_heritages`.
 */
export function resolvePublicGuidedTours(
  allPublicOrAllowedSites: HeritageSite[],
  hiddenSiteIds: string[]
): ResolvedGuidedTour[] {
  const hiddenSet = new Set(hiddenSiteIds);
  const siteMap = new Map<string, HeritageSite>();
  for (const s of allPublicOrAllowedSites) {
    if (!hiddenSet.has(s.id)) {
      siteMap.set(s.id, s);
    }
  }

  return GUIDED_TOUR_ROUTES.map((route) => {
    const stops = route.siteIds
      .map((id) => siteMap.get(id))
      .filter((s): s is HeritageSite => Boolean(s));
    return { route, stops };
  }).filter((item) => item.stops.length > 0);
}

export function getLocalizedGuidedRoute(route: GuidedTourRoute, lang: Language) {
  if (lang === 'en') {
    return {
      title: route.titleEn || route.title,
      editorialTitle: route.editorialTitleEn || route.editorialTitle,
      durationShort: route.durationShortEn || route.durationShort,
      theme: route.themeEn || route.theme,
    };
  }
  if (lang === 'zh') {
    return {
      title: route.titleZh || route.title,
      editorialTitle: route.editorialTitleZh || route.editorialTitle,
      durationShort: route.durationShortZh || route.durationShort,
      theme: route.themeZh || route.theme,
    };
  }
  return {
    title: route.title,
    editorialTitle: route.editorialTitle,
    durationShort: route.durationShort,
    theme: route.theme,
  };
}

export function getGuidedStopTip(
  route: GuidedTourRoute,
  siteId: string,
  lang: Language = 'vi'
): string {
  if (lang === 'en') {
    return (
      route.stopTipsEn[siteId] ||
      route.stopTips[siteId] ||
      'Tip: Rotate 360°, enable X-Ray mode, or open the 1815 Map to compare historical spaces.'
    );
  }
  if (lang === 'zh') {
    return (
      route.stopTipsZh[siteId] ||
      route.stopTips[siteId] ||
      '提示：360°旋转模型、开启X光透视模式或打开1815年历史地图对照空间格局。'
    );
  }
  return (
    route.stopTips[siteId] ||
    'Mẹo: Xoay 360°, bật chế độ X-Ray hoặc mở Bản đồ 1815 để đối chiếu không gian lịch sử.'
  );
}

