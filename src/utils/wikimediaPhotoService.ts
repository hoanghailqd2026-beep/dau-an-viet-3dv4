import { useState, useEffect, useCallback } from 'react';
import type { HeritageSite } from '../types/heritage.ts';
import {
  DEFAULT_SITE_PHOTOS_BY_ID,
  DEFAULT_SITE_PHOTO_CAPTIONS,
  normalizeHighResPhotoUrl,
  sanitizeCustomSitePhotosMap,
} from '../data/heritagePhotos.ts';
import { pushCustomSitePhotosToCloud, pushSyncPatchToServer } from './serverSyncClient';

export { normalizeHighResPhotoUrl };

const CURATED_HD_PHOTO_MIGRATION_KEY = 'dau_an_viet_curated_hd_photos_migrated_v2';

export const CUSTOM_PHOTOS_STORAGE_KEY = 'heritage_custom_real_photos_v1';
export const PHOTO_CAPTIONS_STORAGE_KEY = 'dau_an_viet_photo_captions_v1';
export const WIKI_CACHE_STORAGE_KEY = 'heritage_wikimedia_api_cache_v5';
const LEGACY_WIKI_CACHE_KEYS = [
  'heritage_wikimedia_api_cache_v1',
  'heritage_wikimedia_api_cache_v2',
  'heritage_wikimedia_api_cache_v3',
  'heritage_wikimedia_api_cache_v4',
];
export const CUSTOM_PHOTOS_CHANGED_EVENT = 'heritage_custom_photos_changed';
export const PHOTO_CAPTIONS_UPDATED_EVENT = 'dau_an_viet_photo_captions_updated';
export const WIKIMEDIA_CACHE_UPDATED_EVENT = 'heritage_wikimedia_cache_updated';

export type PhotoSlotIndex = 0 | 1;

export interface SitePhotoSlotCaptions {
  vi?: string;
  en?: string;
  zh?: string;
}

export interface SitePhotoCaptionsOverride {
  slot0?: SitePhotoSlotCaptions;
  slot1?: SitePhotoSlotCaptions;
  updatedAt?: string;
}

export type PhotoCaptionOverridesMap = Record<string, SitePhotoCaptionsOverride>;

export interface CustomSitePhotoPair {
  photo1?: string;
  photo2?: string;
  updatedAt?: string;
}

export type CustomPhotosMap = Record<string, string | CustomSitePhotoPair>;

export interface WikimediaCachedPhotoItem {
  url: string;
  title: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface WikimediaSiteCacheEntry {
  photos: WikimediaCachedPhotoItem[];
  fetchedAt: string;
  query: string;
}

export type WikimediaCacheMap = Record<string, WikimediaSiteCacheEntry>;

/**
 * Thứ tự chuẩn 17 di tích Đông Nam Bộ (01 -> 17)
 */
export const HERITAGE_SITE_IDS_ORDERED = [
  'HCM-DT-001',
  'HCM-DT-002',
  'HCM-DT-003',
  'HCM-DT-004',
  'HCM-DT-005',
  'HCM-DT-006',
  'HCM-DT-007',
  'HCM-DT-008',
  'HCM-DT-009',
  'HCM-DT-010',
  'HCM-DT-011',
  'HCM-DT-012',
  'BRVT-DT-001',
  'BRVT-DT-002',
  'BRVT-DT-003',
  'BD-DT-001',
  'BD-DT-002',
] as const;

export const HERITAGE_REAL_PHOTOS: Record<string, string> = {};

export function getHeritageRealPhoto(_siteIdOrOrder: string | number): string {
  return '';
}

export interface WikiPageConfig {
  viPage: string;
  enPage?: string;
  mediaListPage?: { lang: 'vi' | 'en'; title: string };
  /** Từ khóa tìm Ảnh 01 (ưu tiên toàn cảnh kiến trúc mặt tiền) */
  photo1Queries: string[];
  /** Từ khóa tìm Ảnh 02 (ưu tiên không gian nội thất / cận cảnh kiến trúc đặc trưng) */
  photo2Queries: string[];
  /** Danh sách hợp nhất để tương thích ngược UI Admin Studio */
  searchQueries: string[];
  curatedCommonsUrls: string[];
  creditLabel: string;
  captions: {
    vi: [string, string];
    en: [string, string];
    zh: [string, string];
  };
}

/**
 * Cấu hình bộ từ khóa kép (Ảnh 01: Toàn cảnh mặt tiền · Ảnh 02: Nội thất / Cận cảnh kiến trúc)
 * cho toàn bộ 17 di tích trong HERITAGE_SITES
 */
export const WIKIMEDIA_SITE_CONFIG: Record<string, WikiPageConfig> = {
  'HCM-DT-001': {
    viPage: 'Dinh_Độc_Lập',
    enPage: 'Independence_Palace',
    photo1Queries: [
      'Independence Palace Saigon facade architecture',
      'Independence Palace Ho Chi Minh City',
      'Reunification Palace Saigon',
    ],
    photo2Queries: [
      'Independence Palace Saigon interior hall',
      'Independence Palace interior',
      'Reunification Palace interior',
    ],
    searchQueries: [
      'Independence Palace Saigon facade architecture',
      'Independence Palace Saigon interior hall',
    ],
    curatedCommonsUrls: [],
    creditLabel: 'Wikimedia Commons · Dinh Độc Lập',
    captions: {
      vi: [
        'Toàn cảnh kiến trúc mặt tiền Dinh Độc Lập và khuôn viên trục đường Lê Duẩn',
        'Không gian nội thất đại sảnh khánh tiết và kiến trúc bên trong Dinh Độc Lập',
      ],
      en: [
        'Exterior facade architecture and grand grounds of the Independence Palace',
        'Ceremonial interior hall and modernist timber spaces inside the palace',
      ],
      zh: [
        '独立宫正立面全景与庭院建筑景观',
        '独立宫内部礼仪大厅与现代主义室内空间',
      ],
    },
  },
  'HCM-DT-002': {
    viPage: 'Nhà_hát_Thành_phố_Hồ_Chí_Minh',
    enPage: 'Municipal_Theatre,_Ho_Chi_Minh_City',
    photo1Queries: [
      'Saigon Opera House Municipal Theatre facade',
      'Saigon Opera House architecture',
      'Saigon Opera House',
    ],
    photo2Queries: [
      'Saigon Opera House interior auditorium',
      'Municipal Theatre Ho Chi Minh City',
      'Saigon Opera House 2014',
    ],
    searchQueries: [
      'Saigon Opera House Municipal Theatre facade',
      'Saigon Opera House interior auditorium',
    ],
    curatedCommonsUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/2/23/%C3%93pera%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_02.JPG',
      'https://vcdn1-vnexpress.vnecdn.net/2021/11/16/nha-hat-4-1539258640-jpeg-3925-1637063505.jpg?w=1020&h=0&q=100&dpr=2&fit=crop&s=ueXg7BQRZ40_2qf4mQESpg',
    ],
    creditLabel: 'Diego Delso (Wikimedia Commons) & Quỳnh Trần (VnExpress) · Nhà hát Thành phố',
    captions: {
      vi: [
        'Toàn cảnh mặt tiền Nhà hát Thành phố Hồ Chí Minh (2013) · Nguồn: Diego Delso / Wikimedia Commons',
        'Không gian khán phòng và mái vòm bên trong Nhà hát Thành phố · Nguồn: Quỳnh Trần / VnExpress',
      ],
      en: [
        'Facade of the Municipal Theatre of Ho Chi Minh City (2013) · Source: Diego Delso / Wikimedia Commons',
        'Interior Auditorium and Dome of Saigon Opera House · Source: Quynh Tran / VnExpress',
      ],
      zh: [
        '胡志明市大剧院正面全景（2013年）· 来源：Diego Delso / Wikimedia Commons',
        '胡志明市大剧院内部观众厅与穹顶结构 · 来源：Quỳnh Trần / VnExpress',
      ],
    },
  },
  'HCM-DT-003': {
    viPage: 'Bưu_điện_trung_tâm_Sài_Gòn',
    enPage: 'Saigon_Central_Post_Office',
    photo1Queries: [
      'Saigon Central Post Office exterior facade',
      'Saigon Central Post Office',
      'Central Post Office Ho Chi Minh City',
    ],
    photo2Queries: [
      'Saigon Central Post Office interior vaulted ceiling',
      'Saigon Central Post Office interior',
      'Central Post Office Ho Chi Minh City interior',
    ],
    searchQueries: [
      'Saigon Central Post Office exterior facade',
      'Saigon Central Post Office interior vaulted ceiling',
    ],
    curatedCommonsUrls: [
      'https://owa.bestprice.vn/images/destinations/uploads/buu-dien-thanh-pho-ho-chi-minh-60a1ec6764a14.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/a6/Saigon_Central_Post_Office.JPG',
    ],
    creditLabel: 'BestPrice Travel & Prenn (Wikimedia Commons) · Bưu điện Trung tâm Sài Gòn',
    captions: {
      vi: [
        'Toàn cảnh mặt tiền và đồng hồ trung tâm Bưu điện Trung tâm Sài Gòn',
        'Không gian đại sảnh và kết cấu mái vòm khung sắt bên trong Bưu điện Trung tâm Sài Gòn',
      ],
      en: [
        'Main Facade and Central Clock of Saigon Central Post Office',
        'Main Hall and Iron-truss Vaulted Ceiling of Saigon Central Post Office',
      ],
      zh: [
        '西贡中心邮政局正面与中央大钟全景',
        '西贡中心邮政局大厅与铁架拱顶结构',
      ],
    },
  },
  'HCM-DT-004': {
    viPage: 'Chợ_Bến_Thành',
    enPage: 'Bến_Thành_Market',
    photo1Queries: [
      'Ben Thanh Market Saigon clock tower facade',
      'Ben Thanh Market clock tower',
      'Ben Thanh Market Ho Chi Minh City',
    ],
    photo2Queries: [
      'Ben Thanh Market Ho Chi Minh City architecture',
      'Ben Thanh Market interior',
      'Ben Thanh Market 2023',
    ],
    searchQueries: [
      'Ben Thanh Market Saigon clock tower facade',
      'Ben Thanh Market Ho Chi Minh City architecture',
    ],
    curatedCommonsUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/9/91/Ben_Thanh_market_2.jpg',
      'https://vietnamspot.ru/images/articles/ho-chi-minh-prices/hero.jpg',
    ],
    creditLabel: 'Wikimedia Commons & VietnamSpot · Chợ Bến Thành',
    captions: {
      vi: [
        'Toàn cảnh mặt tiền Cửa Nam và Tháp đồng hồ Chợ Bến Thành',
        'Không gian kiến trúc mái vòm và các gian hàng truyền thống bên trong Chợ Bến Thành',
      ],
      en: [
        'South Gate Facade and Clock Tower of Ben Thanh Market',
        'Vaulted Roof Architecture and Traditional Stalls Inside Ben Thanh Market',
      ],
      zh: [
        '滨城市场南门正面与钟楼全景',
        '滨城市场内部拱顶结构与传统摊位风貌',
      ],
    },
  },
  'HCM-DT-005': {
    viPage: 'Nhà_thờ_Chính_tòa_Đức_Bà_Sài_Gòn',
    enPage: 'Notre-Dame_Cathedral_Basilica_of_Saigon',
    photo1Queries: [
      'Notre Dame Cathedral Basilica of Saigon exterior',
      'Notre-Dame Cathedral Basilica of Saigon',
      'Saigon Notre Dame Cathedral',
    ],
    photo2Queries: [
      'Notre Dame Cathedral Saigon twin bell towers',
      'Notre-Dame Cathedral Saigon',
      'Basilica of Our Lady Immaculate Saigon',
    ],
    searchQueries: [
      'Notre Dame Cathedral Basilica of Saigon exterior',
      'Notre Dame Cathedral Saigon twin bell towers',
    ],
    curatedCommonsUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/d/d7/Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_03.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/d/de/Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora%2C_Ciudad_Ho_Chi_Minh%2C_Vietnam%2C_2013-08-14%2C_DD_14.JPG',
    ],
    creditLabel: 'Diego Delso (Wikimedia Commons · CC BY-SA 3.0) · Nhà thờ Chính tòa Đức Bà Sài Gòn',
    captions: {
      vi: [
        'Mặt tiền hai tháp chuông Nhà thờ Chính tòa Đức Bà Sài Gòn và tượng Đức Mẹ Hòa Bình',
        'Không gian nội thất lòng chính điện và kết cấu vòm cuốn Roman – Gothic bên trong Nhà thờ Đức Bà Sài Gòn',
      ],
      en: [
        'Twin Bell Towers of Notre-Dame Cathedral Basilica of Saigon and Statue of Our Lady of Peace',
        'Main Nave Interior and Romanesque-Gothic Vaulted Arches of Notre-Dame Cathedral Basilica of Saigon',
      ],
      zh: [
        '西贡圣母大教堂双钟楼与和平圣母像全景',
        '西贡圣母大教堂主殿内部空间与罗曼—哥特式拱顶结构',
      ],
    },
  },
  'HCM-DT-006': {
    viPage: 'Bảo_tàng_Lịch_sử_Thành_phố_Hồ_Chí_Minh',
    enPage: 'Museum_of_Vietnamese_History',
    photo1Queries: [
      'Museum of Vietnamese History Ho Chi Minh City exterior',
      "Vietnam's History Museum in Ho Chi Minh City",
      'History Museum Ho Chi Minh City',
    ],
    photo2Queries: [
      'Museum of Vietnamese History Saigon courtyard architecture',
      'Bao tang Lich su Thanh pho Ho Chi Minh',
      'Museum of Vietnamese History Saigon',
    ],
    searchQueries: [
      'Museum of Vietnamese History Ho Chi Minh City exterior',
      'Museum of Vietnamese History Saigon courtyard architecture',
    ],
    curatedCommonsUrls: [],
    creditLabel: 'Wikimedia Commons · Bảo tàng Lịch sử TP.HCM',
    captions: {
      vi: [
        'Toàn cảnh mặt tiền tháp bát giác Đông Dương Bảo tàng Lịch sử TP.HCM',
        'Không gian sân vườn cổ thụ và trưng bày cổ vật Champa bên trong bảo tàng',
      ],
      en: [
        'Indochine octagonal pavilion exterior of the Museum of Vietnamese History',
        'Courtyard garden architecture and Champa sandstone galleries inside the museum',
      ],
      zh: [
        '胡志明市历史博物馆印支风格八角楼外立面全景',
        '历史博物馆庭院建筑与占婆砂岩文物展陈空间',
      ],
    },
  },
  'HCM-DT-007': {
    viPage: 'Bến_Nhà_Rồng',
    enPage: 'Nhà_Rồng_Harbor',
    photo1Queries: [
      'Nha Rong Wharf Ho Chi Minh Museum Saigon',
      'Ho Chi Minh Museum Nha Rong',
      'Ho Chi Minh Museum, Saigon',
    ],
    photo2Queries: [
      'Dragon House Wharf Saigon riverfront architecture',
      'Dragon Wharf Saigon',
      'Ben Nha Rong ve dem',
    ],
    searchQueries: [
      'Nha Rong Wharf Ho Chi Minh Museum Saigon',
      'Dragon House Wharf Saigon riverfront architecture',
    ],
    curatedCommonsUrls: [],
    creditLabel: 'Wikimedia Commons · Bến Nhà Rồng',
    captions: {
      vi: [
        'Toàn cảnh di tích Bến Nhà Rồng — Bảo tàng Hồ Chí Minh tại ngã ba sông',
        'Kiến trúc mái ngói âm dương với cặp Lưỡng Long chầu nguyệt ven sông Sài Gòn',
      ],
      en: [
        'Exterior view of Nha Rong Wharf (Dragon House) at the Saigon River confluence',
        'Waterfront colonial facade crowned by traditional twin dragon roof finials',
      ],
      zh: [
        '西贡河口芽龙港（胡志明博物馆）历史建筑全景',
        '临江法式柱廊与屋顶双龙朝月传统脊饰细部',
      ],
    },
  },
  'HCM-DT-008': {
    viPage: 'Lăng_Ông_(Bà_Chiểu)',
    enPage: 'Lê_Văn_Duyệt',
    photo1Queries: [
      'Tomb of Le Van Duyet Lang Ong Ba Chieu gate',
      'Lang Ong Ba Chieu gate',
      'Tomb of Le Van Duyet',
    ],
    photo2Queries: [
      'Lang Ong Ba Chieu temple roof architecture',
      'Lang Ong Ba Chieu',
      'Double Happiness gate at Tomb of Le Van Duyet',
    ],
    searchQueries: [
      'Tomb of Le Van Duyet Lang Ong Ba Chieu gate',
      'Lang Ong Ba Chieu temple roof architecture',
    ],
    curatedCommonsUrls: [],
    creditLabel: 'Wikimedia Commons · Lăng Tả quân Lê Văn Duyệt',
    captions: {
      vi: [
        'Cổng tam quan uy nghi tại khu di tích Lăng Ông Bà Chiểu (Lăng Tả quân)',
        'Cận cảnh mái ngói khảm sành sứ tinh xảo và điện thờ Lăng Ông Bà Chiểu',
      ],
      en: [
        'Ceremonial triple gate entrance at the Tomb of Marshal Le Van Duyet',
        'Intricate ceramic-mosaic roof ridges and temple courtyard of Lang Ong Ba Chieu',
      ],
      zh: [
        '黎文悦陵（嘉定翁陵）庄严三门牌坊正面全景',
        '黎文悦陵嵌瓷屋脊与传统祠堂建筑细节',
      ],
    },
  },
  'HCM-DT-009': {
    viPage: 'Địa_đạo_Củ_Chi',
    enPage: 'Củ_Chi_tunnels',
    mediaListPage: { lang: 'en', title: 'Củ_Chi_tunnels' },
    photo1Queries: [
      'Cu Chi Tunnels entrance forest',
      'Cu Chi tunnels',
      'Cu Chi tunnel Vietnam',
    ],
    photo2Queries: [
      'Cu Chi Tunnels underground bunker Vietnam',
      'Cu Chi Tunnels Vietnam war 2',
      'Cu Chi tunnels bunker',
    ],
    searchQueries: [
      'Cu Chi Tunnels entrance forest',
      'Cu Chi Tunnels underground bunker Vietnam',
    ],
    curatedCommonsUrls: [],
    creditLabel: 'Wikimedia Commons · Địa đạo Củ Chi',
    captions: {
      vi: [
        'Toàn cảnh khu rừng di tích và cửa hầm bí mật Địa đạo Củ Chi',
        'Không gian địa đạo lòng đất và công sự chiến đấu tại Củ Chi',
      ],
      en: [
        'Camouflaged forest entrance hatch to the subterranean Cu Chi Tunnels',
        'Underground bunker gallery and historic wartime earthworks at Cu Chi',
      ],
      zh: [
        '古芝地道林间伪装入口与地表遗址区全景',
        '古芝地道地下掩体与抗战地道内部结构实景',
      ],
    },
  },
  'HCM-DT-010': {
    viPage: 'Giồng_Cá_Vồ',
    enPage: 'Cần_Giờ_Mangrove_Forest',
    mediaListPage: { lang: 'vi', title: 'Văn_hóa_Óc_Eo' },
    photo1Queries: [
      'Can Gio Mangrove Forest Vietnam landscape',
      'Can Gio Mangrove',
      'Can Gio biosphere',
    ],
    photo2Queries: [
      'Museum of Vietnamese History Oc Eo',
      'Oc Eo artifacts Vietnam',
      'Can Gio forest Vietnam',
    ],
    searchQueries: [
      'Can Gio Mangrove Forest Vietnam landscape',
      'Museum of Vietnamese History Oc Eo',
    ],
    curatedCommonsUrls: [],
    creditLabel: 'Wikimedia Commons · Di chỉ Giồng Cá Vồ & Cần Giờ',
    captions: {
      vi: [
        'Cảnh quan vùng giồng cát rừng ngập mặn Cần Giờ quanh di chỉ Giồng Cá Vồ',
        'Hiện vật khảo cổ tiền Óc Eo — tư liệu khai quật từ khu mộ chum Cần Giờ',
      ],
      en: [
        'Coastal mangrove mound landscape surrounding Giong Ca Vo in Can Gio',
        'Prehistoric Oc Eo period artifacts preserved from southern coastal excavations',
      ],
      zh: [
        '芹苴红树林沙丘湿地——永嘉波考古遗址周边生态风貌',
        '南部沿海遗址出土的早期奥埃文化珍贵文物展品',
      ],
    },
  },
  'HCM-DT-011': {
    viPage: 'Chùa_Giác_Lâm',
    enPage: 'Giác_Lâm_Pagoda',
    photo1Queries: [
      'Giac Lam Pagoda Ho Chi Minh City gate',
      'Giac Lam Pagoda gate',
      'Giac Lam Pagoda',
    ],
    photo2Queries: [
      'Giac Lam Pagoda stupa architecture',
      'Giac Lam stupa',
      'Chua Giac Lam',
    ],
    searchQueries: [
      'Giac Lam Pagoda Ho Chi Minh City gate',
      'Giac Lam Pagoda stupa architecture',
    ],
    curatedCommonsUrls: [],
    creditLabel: 'Wikimedia Commons · Chùa Giác Lâm',
    captions: {
      vi: [
        'Cổng tam quan và mặt tiền cổ tự Chùa Giác Lâm (khởi dựng 1744)',
        'Kiến trúc Bảo tháp Xá Lợi 7 tầng và mái ngói truyền thống Chùa Giác Lâm',
      ],
      en: [
        'Historic entrance gate and grounds of Giac Lam Pagoda (est. 1744)',
        'Seven-tier Relics Stupa and timber temple roofs of Giac Lam Pagoda',
      ],
      zh: [
        '觉林寺三门山门与古刹正面全景（始建于1744年）',
        '觉林寺七层舍利宝塔与传统瓦顶建筑特写',
      ],
    },
  },
  'HCM-DT-012': {
    viPage: 'Hội_quán_Nghĩa_An',
    enPage: 'Cholon',
    mediaListPage: { lang: 'vi', title: 'Hội_quán_Nghĩa_An' },
    photo1Queries: [
      'Nghia An Assembly Hall Cholon Saigon',
      'Nghia An Hoi Quan Pagoda',
      'Nghia An Hoi Quan',
    ],
    photo2Queries: [
      'Nghia An Hoi Quan ceramic roof detail',
      'Nghia An Hoi Quan Pagoda (10018333403)',
      'Nghia An Pagoda Cholon',
    ],
    searchQueries: [
      'Nghia An Assembly Hall Cholon Saigon',
      'Nghia An Hoi Quan ceramic roof detail',
    ],
    curatedCommonsUrls: [],
    creditLabel: 'Wikimedia Commons · Hội quán Nghĩa An',
    captions: {
      vi: [
        'Toàn cảnh mặt tiền Hội quán Nghĩa An (Chùa Ông) tại khu Chợ Lớn',
        'Cận cảnh kiến trúc bờ nóc khảm gốm sứ Triều Châu và không gian nội tự',
      ],
      en: [
        'Main ceremonial hall facade of Nghia An Assembly Hall in historic Cholon',
        'Porcelain-mosaic Teochew roof craftsmanship and interior altar sanctuary',
      ],
      zh: [
        '堤岸义安会馆（关帝庙）传统建筑正立面全景',
        '义安会馆精致潮州嵌瓷屋脊与内部雕梁殿堂细部',
      ],
    },
  },
  'BRVT-DT-001': {
    viPage: 'Bạch_Dinh',
    enPage: 'Villa_Blanche',
    mediaListPage: { lang: 'vi', title: 'Bạch_Dinh' },
    photo1Queries: [
      'White Palace Vung Tau Bach Dinh exterior',
      'Vung Tau Bach Dinh',
      'Bach Dinh Vung Tau',
    ],
    photo2Queries: [
      'Bach Dinh Vung Tau architecture balcony',
      'VN-vungtau-bach-dinh-1',
      'Villa Blanche Vung Tau',
    ],
    searchQueries: [
      'White Palace Vung Tau Bach Dinh exterior',
      'Bach Dinh Vung Tau architecture balcony',
    ],
    curatedCommonsUrls: [],
    creditLabel: 'Wikimedia Commons · Bạch Dinh (Dinh Bảo Đại) Vũng Tàu',
    captions: {
      vi: [
        'Toàn cảnh ngoại thất biệt thự Bạch Dinh (Dinh Bảo Đại) trên sườn Núi Lớn',
        'Chi tiết ban công vòm cung kiểu Pháp và hành lang hướng vịnh Bãi Trước',
      ],
      en: [
        'Exterior view of Villa Blanche (Bach Dinh / White Palace) on Big Mountain',
        'Arched colonial veranda and balcony architecture overlooking Vung Tau Bay',
      ],
      zh: [
        '头顿大山白宫（保大行宫）法式外立面全景',
        '白宫经典法式拱券阳台与眺望前滩海湾走廊细节',
      ],
    },
  },
  'BRVT-DT-002': {
    viPage: 'Nhà_Lớn_Long_Sơn',
    mediaListPage: { lang: 'vi', title: 'Nhà_Lớn_Long_Sơn' },
    photo1Queries: [
      'Nha Lon Long Son Vung Tau architecture',
      'Nha Lon Long Son',
      'Long Son Big House',
    ],
    photo2Queries: [
      'Long Son Big House wooden pavilion Vung Tau',
      'Cau Long son, ba ria vung tau',
      'Long Son Vung Tau',
    ],
    searchQueries: [
      'Nha Lon Long Son Vung Tau architecture',
      'Long Son Big House wooden pavilion Vung Tau',
    ],
    curatedCommonsUrls: [],
    creditLabel: 'Wikimedia Commons · Nhà Lớn Long Sơn',
    captions: {
      vi: [
        'Quần thể kiến trúc gỗ truyền thống Đền Ông Trần tại Nhà Lớn Long Sơn',
        'Không gian đảo Long Sơn và quần thể đình đài cổ kính Bà Rịa - Vũng Tàu',
      ],
      en: [
        'Traditional Southern wooden architectural complex of Nha Lon Long Son',
        'Historic island landscape and communal wooden pavilions of Long Son',
      ],
      zh: [
        '龙山岛大屋（翁陈庙）南部传统木构建筑群全景',
        '巴地头顿龙山岛传统亭台院落与海岛风貌',
      ],
    },
  },
  'BRVT-DT-003': {
    viPage: 'Địa_đạo_Long_Phước',
    mediaListPage: { lang: 'en', title: 'Củ_Chi_tunnels' },
    photo1Queries: [
      'Long Phuoc Tunnels Ba Ria Vung Tau',
      'Cu Chi Tunnels Vietnam war',
      'Cu Chi tunnels entrance',
    ],
    photo2Queries: [
      'Cu Chi tunnels bunker',
      'Nguyễn Cư Trinh, Phú Mỹ, Tân Thành, Bà Rịa - Vũng Tàu',
      'Cu Chi Tunnels Vietnam war 2',
    ],
    searchQueries: [
      'Long Phuoc Tunnels Ba Ria Vung Tau',
      'Cu Chi tunnels bunker',
    ],
    curatedCommonsUrls: [],
    creditLabel: 'Wikimedia Commons · Di tích Địa đạo Long Phước & Bà Rịa - Vũng Tàu',
    captions: {
      vi: [
        'Di tích lịch sử cách mạng miền Đông tại vùng đất Bà Rịa - Vũng Tàu',
        'Cảnh quan vùng đất Long Phước — Bà Rịa gắn với hệ thống địa đạo kháng chiến',
      ],
      en: [
        'Revolutionary historical monument landscape in Ba Ria - Vung Tau',
        'Subterranean resistance base terrain of Long Phuoc in Ba Ria - Vung Tau',
      ],
      zh: [
        '巴地头顿省革命历史遗迹与纪念地标全景',
        '巴地龙福抗战地道遗址周边红土与生态地理景观',
      ],
    },
  },
  'BD-DT-001': {
    viPage: 'Nhà_cổ_Trần_Công_Vàng',
    mediaListPage: { lang: 'vi', title: 'Nhà_Lớn_Long_Sơn' },
    photo1Queries: [
      'Hoi Khanh Pagoda Thu Dau Mot Binh Duong',
      'Chua Hoi Khanh',
      'Chợ Thủ Dầu Một 1',
    ],
    photo2Queries: [
      'Thu Dau Mot Binh Duong',
      'Thu Dau Mot, Binh Duong, Vietnam 2013',
      'Phu Cuong Bridge, Thu Dau Mot, Binh Duong',
    ],
    searchQueries: [
      'Hoi Khanh Pagoda Thu Dau Mot Binh Duong',
      'Thu Dau Mot Binh Duong',
    ],
    curatedCommonsUrls: [],
    creditLabel: 'Wikimedia Commons · Di sản Kiến trúc Thủ Dầu Một (Bình Dương)',
    captions: {
      vi: [
        'Di sản kiến trúc truyền thống vùng Thủ Dầu Một, Bình Dương',
        'Cảnh quan đô thị di sản Thủ Dầu Một — không gian gắn với Nhà cổ Trần Công Vàng',
      ],
      en: [
        'Traditional Southern architectural heritage in historic Thu Dau Mot, Binh Duong',
        'Historic urban landscape of Thu Dau Mot surrounding the Tran Cong Vang House',
      ],
      zh: [
        '平阳省土龙木地区传统东方木构建筑遗产风貌',
        '土龙木历史城区风貌——陈公黄古宅所在地标区域',
      ],
    },
  },
  'BD-DT-002': {
    viPage: 'Tam_giác_sắt_(Việt_Nam)',
    enPage: 'Operation_Cedar_Falls',
    mediaListPage: { lang: 'en', title: 'Operation_Cedar_Falls' },
    photo1Queries: [
      'Phu Loi Prison relic Binh Duong',
      'Nhà tù Phú Lợi, lối vào di tích nhà tù',
      'Kiến trúc nhà Bia tưởng niệm ở nhà tù Phú Lợi-Bình Dương',
    ],
    photo2Queries: [
      'Operation Cedar Falls Iron Triangle Vietnam',
      'Jungle clearing, Operation Cedar Falls, 26 January 1967',
      'M48 in Operation Cedar Falls, 17 January 1967',
    ],
    searchQueries: [
      'Phu Loi Prison relic Binh Duong',
      'Operation Cedar Falls Iron Triangle Vietnam',
    ],
    curatedCommonsUrls: [],
    creditLabel: 'Wikimedia Commons · Di tích Lịch sử Bình Dương & Tam Giác Sắt',
    captions: {
      vi: [
        'Di tích lịch sử kháng chiến tiêu biểu tại tỉnh Bình Dương',
        'Tư liệu thực địa chiến khu Tam Giác Sắt — Tây Nam Bến Cát, Bình Dương',
      ],
      en: [
        'Preserved wartime historical memorial architecture in Binh Duong Province',
        'Historical archival field view of the Iron Triangle sector in Ben Cat, Binh Duong',
      ],
      zh: [
        '平阳省抗战历史纪念遗迹主体建筑实景',
        '平阳省槟吉“铁三角”地下抗战战区历史档案影像',
      ],
    },
  },
};

function notifyCustomPhotosUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CUSTOM_PHOTOS_CHANGED_EVENT));
  }
}

function notifyWikimediaCacheUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(WIKIMEDIA_CACHE_UPDATED_EVENT));
  }
}

/**
 * Xóa cache URL ảnh Wikimedia thế hệ cũ (v1 -> v4) để nạp trọn bộ ảnh HD 1600px mới,
 * đồng thời giữ nguyên 100% ảnh do Admin khóa thủ công trong heritage_custom_real_photos_v1.
 */
export function purgeLegacyWikimediaCaches(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const legacyKey of LEGACY_WIKI_CACHE_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }
  } catch {
    // ignore storage errors
  }
}

export function getDefaultWikimediaPhotos(_siteId: string): string[] {
  const cache = loadWikimediaCacheMap();
  const entry = cache[_siteId];
  if (!entry || !Array.isArray(entry.photos)) return [];
  return entry.photos.map((p) => p.url).filter(Boolean).slice(0, 2);
}

/**
 * Chuẩn hóa bản ghi ảnh tùy chỉnh (hỗ trợ ngược cả format cũ string lẫn format mới { photo1, photo2 })
 */
export function normalizeCustomPhotoSlot(
  entry: string | CustomSitePhotoPair | undefined | null
): { photo1: string; photo2: string; updatedAt?: string } {
  if (!entry) return { photo1: '', photo2: '' };
  if (typeof entry === 'string') {
    return { photo1: entry.trim(), photo2: '' };
  }
  if (typeof entry === 'object') {
    return {
      photo1: typeof entry.photo1 === 'string' ? entry.photo1.trim() : '',
      photo2: typeof entry.photo2 === 'string' ? entry.photo2.trim() : '',
      updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : undefined,
    };
  }
  return { photo1: '', photo2: '' };
}

export function hasAnyCustomPhotoForSite(
  customMap: CustomPhotosMap,
  siteId: string
): boolean {
  const norm = normalizeCustomPhotoSlot(customMap[siteId]);
  return Boolean(norm.photo1 || norm.photo2);
}

/**
 * Đọc danh sách ảnh do người dùng/Admin tùy chỉnh trong localStorage
 */
export function loadCustomPhotosMap(): CustomPhotosMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CUSTOM_PHOTOS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const { cleaned, changed } = sanitizeCustomSitePhotosMap(parsed as Record<string, unknown>);
      if (changed) {
        try {
          window.localStorage.setItem(CUSTOM_PHOTOS_STORAGE_KEY, JSON.stringify(cleaned));
        } catch {
          // ignore storage quota errors
        }
      }
      return cleaned as CustomPhotosMap;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

export function loadWikimediaCacheMap(): WikimediaCacheMap {
  if (typeof window === 'undefined') return {};
  try {
    purgeLegacyWikimediaCaches();
    const raw = window.localStorage.getItem(WIKI_CACHE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as WikimediaCacheMap;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

function writeWikimediaCacheMap(nextCache: WikimediaCacheMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WIKI_CACHE_STORAGE_KEY, JSON.stringify(nextCache));
  } catch {
    // ignore quota errors
  }
  notifyWikimediaCacheUpdated();
}

function persistCustomPhotosMap(updated: CustomPhotosMap, shouldPushCloud = true): CustomPhotosMap {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CUSTOM_PHOTOS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore quota overflow
    }
  }
  notifyCustomPhotosUpdated();
  if (shouldPushCloud) {
    void pushCustomSitePhotosToCloud(updated);
  }
  return updated;
}

/**
 * Tự động dọn các bản ghi ảnh mờ/cũ một lần duy nhất cho đợt phát hành 34 ảnh HD chuẩn
 * và đồng bộ lại bản sạch lên Firebase.
 */
export function ensureCuratedHdPhotosMigrated(): void {
  if (typeof window === 'undefined') return;
  try {
    const alreadyDone = window.localStorage.getItem(CURATED_HD_PHOTO_MIGRATION_KEY);
    if (alreadyDone === '1') return;

    const raw = window.localStorage.getItem(CUSTOM_PHOTOS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const { cleaned, changed } = sanitizeCustomSitePhotosMap(parsed);
    window.localStorage.setItem(CURATED_HD_PHOTO_MIGRATION_KEY, '1');
    if (changed) {
      persistCustomPhotosMap(cleaned as CustomPhotosMap, true);
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Lưu 1 ảnh tùy chỉnh (Ảnh 01 hoặc Ảnh 02) cho siteId vào localStorage và tự động đồng bộ CLOUD_API_URL
 */
export function saveCustomSitePhoto(
  siteId: string,
  photoDataOrUrl: string,
  slot: PhotoSlotIndex = 0
): CustomPhotosMap {
  const current = loadCustomPhotosMap();
  const prevNorm = normalizeCustomPhotoSlot(current[siteId]);
  const cleanedUrl = normalizeHighResPhotoUrl(photoDataOrUrl);
  const nextPair: CustomSitePhotoPair = {
    photo1: slot === 0 ? cleanedUrl : prevNorm.photo1,
    photo2: slot === 1 ? cleanedUrl : prevNorm.photo2,
    updatedAt: new Date().toISOString(),
  };

  if (!nextPair.photo1) delete nextPair.photo1;
  if (!nextPair.photo2) delete nextPair.photo2;

  const updated: CustomPhotosMap = { ...current };
  if (!nextPair.photo1 && !nextPair.photo2) {
    updated[siteId] = { photo1: '', photo2: '', updatedAt: nextPair.updatedAt };
  } else {
    updated[siteId] = nextPair;
  }

  const persisted = persistCustomPhotosMap(updated, true);

  // Silent background Auto-Push when Admin is authenticated with Firebase
  void Promise.all([
    import('../lib/firebaseAuth'),
    import('./cloudSync'),
  ]).then(async ([{ firebaseAuth }, { uploadAssetBinaryToFirebaseStorage, autoPushAssetUpdateInBackground, forcePushAllToCloud }]) => {
    if (!firebaseAuth.currentUser) return;
    if (cleanedUrl.startsWith('data:image/')) {
      try {
        const res = await fetch(cleanedUrl);
        const blob = await res.blob();
        const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
        await uploadAssetBinaryToFirebaseStorage('images', `${siteId}_${slot}`, blob, `${siteId}_${slot}.${ext}`);
      } catch (err) {
        console.error('[DauAnViet3D][AutoPushPhoto] Failed chunk-pushing uploaded image:', err);
      }
    } else {
      autoPushAssetUpdateInBackground(`Hình ảnh ${siteId}`, async () => {
        const res = await forcePushAllToCloud();
        return {
          ok: res.ok,
          detail: 'Đã cập nhật đường dẫn ảnh tư liệu lên Cloud',
          errorMessage: res.firstErrorMessage,
        };
      });
    }
  });

  return persisted;
}

/**
 * Tải tệp ảnh lên thẳng thư mục `public/images/heritage/` trên máy chủ dự án
 * và cập nhật `src/data/heritageData.ts` (không lưu data-URI cồng kềnh).
 */
export async function uploadHeritagePhotoToPublic(
  siteId: string,
  file: File,
  slot: PhotoSlotIndex = 0
): Promise<string | null> {
  try {
    const ext =
      file.type === 'image/png'
        ? 'png'
        : file.type === 'image/webp'
        ? 'webp'
        : 'jpg';
    const endpoint = `/api/assets/upload-image?siteId=${encodeURIComponent(
      siteId
    )}&slot=${slot}&ext=${ext}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: file,
    });
    if (!res.ok) return null;
    const payload = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      publicUrl?: string;
    };
    if (payload.ok && payload.publicUrl) {
      return `${payload.publicUrl}?t=${Date.now()}`;
    }
  } catch {
    // Fallback to client handling on static deployments
  }
  return null;
}

/**
 * Lưu đồng thời cả 2 slot ảnh tùy chỉnh (hoặc đặt lại slot trống về Wikimedia gốc)
 */
export function saveCustomSitePhotoPair(
  siteId: string,
  pair: { photo1?: string; photo2?: string }
): CustomPhotosMap {
  const current = loadCustomPhotosMap();
  const p1 = normalizeHighResPhotoUrl(pair.photo1 || '');
  const p2 = normalizeHighResPhotoUrl(pair.photo2 || '');
  const updated: CustomPhotosMap = {
    ...current,
    [siteId]: {
      photo1: p1,
      photo2: p2,
      updatedAt: new Date().toISOString(),
    },
  };
  const persisted = persistCustomPhotosMap(updated, true);

  void Promise.all([
    import('../lib/firebaseAuth'),
    import('./cloudSync'),
  ]).then(async ([{ firebaseAuth }, { uploadAssetBinaryToFirebaseStorage, autoPushAssetUpdateInBackground, forcePushAllToCloud }]) => {
    if (!firebaseAuth.currentUser) return;
    const slots: Array<{ url: string; slot: 0 | 1 }> = [
      { url: p1, slot: 0 },
      { url: p2, slot: 1 },
    ];
    let pushedBinary = false;
    for (const item of slots) {
      if (item.url.startsWith('data:image/')) {
        try {
          const res = await fetch(item.url);
          const blob = await res.blob();
          const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
          await uploadAssetBinaryToFirebaseStorage('images', `${siteId}_${item.slot}`, blob, `${siteId}_${item.slot}.${ext}`);
          pushedBinary = true;
        } catch (err) {
          console.error('[DauAnViet3D][AutoPushPhotoPair] Failed chunk-pushing image:', err);
        }
      }
    }
    if (!pushedBinary) {
      autoPushAssetUpdateInBackground(`Bộ ảnh ${siteId}`, async () => {
        const res = await forcePushAllToCloud();
        return {
          ok: res.ok,
          detail: 'Đã cập nhật bộ ảnh tư liệu lên Cloud',
          errorMessage: res.firstErrorMessage,
        };
      });
    }
  });

  return persisted;
}

/**
 * Xóa ảnh tùy chỉnh của 1 di tích (toàn bộ hoặc theo slot 0/1) để khôi phục về ảnh thật Wikimedia Commons
 */
export function removeCustomSitePhoto(
  siteId: string,
  slot?: PhotoSlotIndex
): CustomPhotosMap {
  const current = loadCustomPhotosMap();
  const prevNorm = normalizeCustomPhotoSlot(current[siteId]);
  const nowIso = new Date().toISOString();
  const updated: CustomPhotosMap = { ...current };

  if (slot === undefined) {
    updated[siteId] = { photo1: '', photo2: '', updatedAt: nowIso };
  } else {
    const next1 = slot === 0 ? '' : prevNorm.photo1;
    const next2 = slot === 1 ? '' : prevNorm.photo2;
    updated[siteId] = {
      photo1: next1,
      photo2: next2,
      updatedAt: nowIso,
    };
  }

  return persistCustomPhotosMap(updated, true);
}

/**
 * Xóa toàn bộ ảnh tùy chỉnh, khôi phục 100% ảnh gốc từ Wikimedia Commons
 */
export function clearAllCustomSitePhotos(): void {
  const nowIso = new Date().toISOString();
  const cleared: CustomPhotosMap = {};
  HERITAGE_SITE_IDS_ORDERED.forEach((id) => {
    cleared[id] = { photo1: '', photo2: '', updatedAt: nowIso };
  });
  persistCustomPhotosMap(cleared, true);
}

// ============================================================================
// HIGH-RES WIKIMEDIA COMMONS API FETCHER (1600px · LANDSCAPE · .JPG/.JPEG/.WEBP)
// ============================================================================
const EXCLUDED_WORD_BOUNDARY_RE =
  /(?:^|[\W_])(map|maps|plan|plans|logo|logos|flag|flags|portrait|portraits|coat_of_arms|locator|emblem|diagram|blueprint|floorplan|chart|seal|icon|collage|poster|stamp)(?:$|[\W_])|coat[\s_]of[\s_]arms|location[\s_]map|blank[\s_]map|map[\s_]of|bản[\s_]đồ|ban[\s_]do|sơ[\s_]đồ|so[\s_]do/i;

const EXCLUDED_NON_PHOTO_EXT_RE =
  /\.(svg|png|pdf|djvu|tiff?|ogg|ogv|webm|gif)(?:$|\?)/i;

const ALLOWED_PHOTO_EXT_RE = /\.(jpe?g|webp)(?:$|\?)/i;

function isValidHighResPhotoCandidate(
  title: string,
  originalUrl: string,
  resolvedUrl: string,
  mime?: string,
  width?: number,
  height?: number
): boolean {
  if (!originalUrl || !resolvedUrl) return false;

  const lowerTitle = (title || '').toLowerCase();
  const lowerOrigUrl = originalUrl.toLowerCase();

  // Loại bỏ hoàn toàn SVG, PNG biểu tượng, tài liệu PDF/TIFF/Video
  if (
    EXCLUDED_NON_PHOTO_EXT_RE.test(lowerTitle) ||
    EXCLUDED_NON_PHOTO_EXT_RE.test(lowerOrigUrl)
  ) {
    return false;
  }

  // Loại bỏ bản đồ (map), sơ đồ (plan), logo, flag, chân dung (portrait)
  if (
    EXCLUDED_WORD_BOUNDARY_RE.test(lowerTitle) ||
    EXCLUDED_WORD_BOUNDARY_RE.test(lowerOrigUrl)
  ) {
    return false;
  }

  // Chỉ chấp nhận ảnh chụp thực tế định dạng .jpg / .jpeg / .webp
  const hasValidExt =
    ALLOWED_PHOTO_EXT_RE.test(lowerOrigUrl) || ALLOWED_PHOTO_EXT_RE.test(lowerTitle);
  const lowerMime = (mime || '').toLowerCase();
  const hasValidMime =
    !lowerMime ||
    lowerMime === 'image/jpeg' ||
    lowerMime === 'image/jpg' ||
    lowerMime === 'image/webp';

  if (!hasValidExt || !hasValidMime) {
    return false;
  }

  // Bắt buộc ảnh khổ ngang độ phân giải cao (width > height và width >= 1000)
  if (typeof width !== 'number' || typeof height !== 'number') {
    return false;
  }
  if (width < 1000 || width <= height) {
    return false;
  }

  return true;
}

function stripHtmlTags(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface WikimediaApiPage {
  pageid?: number;
  title?: string;
  index?: number;
  imageinfo?: Array<{
    url?: string;
    thumburl?: string;
    mime?: string;
    width?: number;
    height?: number;
    extmetadata?: {
      ImageDescription?: { value?: string };
      ObjectName?: { value?: string };
    };
  }>;
}

const waitMs = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function queryWikimediaCommonsImages1600(
  query: string,
  attempt = 0
): Promise<WikimediaCachedPhotoItem[]> {
  const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query
  )}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=1600&format=json&origin=*`;

  const res = await fetch(endpoint);
  if (res.status === 429 && attempt < 2) {
    await waitMs(900 * (attempt + 1));
    return queryWikimediaCommonsImages1600(query, attempt + 1);
  }
  if (!res.ok) return [];

  const rawText = await res.text();
  if (!rawText || !rawText.trim().startsWith('{')) {
    if (attempt < 2 && /too many requests/i.test(rawText)) {
      await waitMs(1000 * (attempt + 1));
      return queryWikimediaCommonsImages1600(query, attempt + 1);
    }
    return [];
  }

  const data = JSON.parse(rawText) as {
    query?: { pages?: Record<string, WikimediaApiPage> };
  };
  const pagesObj = data?.query?.pages;
  if (!pagesObj || typeof pagesObj !== 'object') return [];

  const sortedPages = Object.values(pagesObj).sort(
    (a, b) => Number(a.index ?? 999) - Number(b.index ?? 999)
  );

  const validItems: WikimediaCachedPhotoItem[] = [];
  for (const page of sortedPages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const originalUrl = info.url || '';
    const resolved1600Url = info.thumburl || info.url || '';
    const title = page.title || '';

    if (
      !isValidHighResPhotoCandidate(
        title,
        originalUrl,
        resolved1600Url,
        info.mime,
        info.width,
        info.height
      )
    ) {
      continue;
    }

    const rawDesc =
      info.extmetadata?.ObjectName?.value || info.extmetadata?.ImageDescription?.value || '';
    const cleanedCaption = rawDesc ? stripHtmlTags(rawDesc).slice(0, 140) : undefined;
    validItems.push({
      url: resolved1600Url,
      title,
      width: info.width,
      height: info.height,
      caption: cleanedCaption || undefined,
    });
  }

  return validItems;
}

const inFlightSiteFetches = new Map<string, Promise<WikimediaCachedPhotoItem[]>>();

function normalizePhotoTitleKey(title: string): string {
  return (title || '').trim().toLowerCase();
}

function isDistinctCandidate(
  candidate: WikimediaCachedPhotoItem,
  other: WikimediaCachedPhotoItem | null
): boolean {
  if (!other) return true;
  if (candidate.url === other.url) return false;
  const k1 = normalizePhotoTitleKey(candidate.title);
  const k2 = normalizePhotoTitleKey(other.title);
  return !(k1 && k2 && k1 === k2);
}

function pickPreferredLandscape(
  items: WikimediaCachedPhotoItem[],
  exclude: WikimediaCachedPhotoItem | null = null
): WikimediaCachedPhotoItem | null {
  const candidates = items.filter((item) => isDistinctCandidate(item, exclude));
  if (candidates.length === 0) return null;
  const wide = candidates.find(
    (item) => item.width && item.height && item.width / item.height >= 1.22
  );
  return wide || candidates[0];
}

/**
 * Truy vấn trực tiếp Wikimedia Commons API ở chuẩn 1600px khổ ngang cho 1 di tích,
 * bảo đảm trả về đúng 2 ảnh thực tế (.jpg/.jpeg/.webp, width >= 1000, width > height)
 * mang 2 góc chụp & tiêu đề hoàn toàn khác nhau:
 *   - Ảnh 01: Toàn cảnh kiến trúc mặt tiền
 *   - Ảnh 02: Không gian nội thất / Cận cảnh kiến trúc đặc trưng
 */
export async function fetchHighResHeritagePhotos(
  site: Pick<HeritageSite, 'id' | 'officialName'>,
  forceRefresh = false
): Promise<WikimediaCachedPhotoItem[]> {
  if (typeof fetch !== 'function') return [];

  const siteId = site.id;

  if (!forceRefresh) {
    const cache = loadWikimediaCacheMap();
    const cached = cache[siteId];
    if (
      cached &&
      Array.isArray(cached.photos) &&
      cached.photos.length >= 2 &&
      cached.photos[0].url !== cached.photos[1].url &&
      normalizePhotoTitleKey(cached.photos[0].title) !==
        normalizePhotoTitleKey(cached.photos[1].title)
    ) {
      return cached.photos.slice(0, 2);
    }
  }

  const existingPromise = inFlightSiteFetches.get(siteId);
  if (existingPromise && !forceRefresh) {
    return existingPromise;
  }

  const runPromise = (async () => {
    const cfg = WIKIMEDIA_SITE_CONFIG[siteId];
    const q1List = cfg?.photo1Queries?.length
      ? cfg.photo1Queries
      : [site.officialName || siteId];
    const q2List = cfg?.photo2Queries?.length
      ? cfg.photo2Queries
      : [`${site.officialName || siteId} architecture`];

    let photo1: WikimediaCachedPhotoItem | null = null;
    let photo2: WikimediaCachedPhotoItem | null = null;
    const backupPool: WikimediaCachedPhotoItem[] = [];
    let usedQuery = q1List[0] || siteId;

    // 1. Tìm Ảnh 01 (Toàn cảnh mặt tiền)
    for (const q of q1List) {
      try {
        const items = await queryWikimediaCommonsImages1600(q);
        for (const item of items) {
          backupPool.push(item);
        }
        const picked1 = pickPreferredLandscape(items, null);
        if (picked1) {
          photo1 = picked1;
          usedQuery = q;
          break;
        }
      } catch {
        // Tiếp tục thử từ khóa kế tiếp
      }
      await waitMs(120);
    }

    // 2. Tìm Ảnh 02 (Nội thất / Cận cảnh kiến trúc đặc trưng — bắt buộc khác title & URL với Ảnh 01)
    for (const q of q2List) {
      try {
        const items = await queryWikimediaCommonsImages1600(q);
        for (const item of items) {
          backupPool.push(item);
        }
        if (!photo1) {
          photo1 = pickPreferredLandscape(items, null);
          if (photo1) {
            usedQuery = q;
          }
        }
        const picked2 = pickPreferredLandscape(items, photo1);
        if (picked2) {
          photo2 = picked2;
          break;
        }
      } catch {
        // Tiếp tục thử từ khóa kế tiếp
      }
      await waitMs(120);
    }

    // 3. Nếu bộ từ khóa 2 không cho kết quả bổ sung, chọn ứng viên khác biệt thứ 2 từ kho đã quét
    if (!photo1 && backupPool.length > 0) {
      photo1 = pickPreferredLandscape(backupPool, photo2);
    }
    if (!photo2 && photo1) {
      photo2 = pickPreferredLandscape(backupPool, photo1);
    }

    const collected: WikimediaCachedPhotoItem[] = [];
    if (photo1) collected.push(photo1);
    if (photo2) collected.push(photo2);

    if (collected.length > 0) {
      const latestCache = loadWikimediaCacheMap();
      writeWikimediaCacheMap({
        ...latestCache,
        [siteId]: {
          photos: collected.slice(0, 2),
          fetchedAt: new Date().toISOString(),
          query: usedQuery,
        },
      });
    }

    return collected.slice(0, 2);
  })();

  inFlightSiteFetches.set(siteId, runPromise);
  try {
    return await runPromise;
  } finally {
    inFlightSiteFetches.delete(siteId);
  }
}

/**
 * Tải đủ 2 ảnh chụp thật 1600px khổ ngang từ Wikimedia Commons API theo siteId
 */
export async function fetchWikimediaPhotosForSite(
  siteId: string,
  forceRefresh = false
): Promise<WikimediaCachedPhotoItem[]> {
  const cfg = WIKIMEDIA_SITE_CONFIG[siteId];
  return fetchHighResHeritagePhotos(
    {
      id: siteId,
      officialName: cfg?.searchQueries?.[0] || siteId,
    },
    forceRefresh
  );
}

let allSitesSyncPromise: Promise<void> | null = null;

/**
 * Đồng bộ tự động toàn bộ 17 di tích từ Wikimedia Commons API ở chuẩn 1600px.
 * Xóa cache cũ thế hệ v1-v4 trước khi đồng bộ (không đụng chạm ảnh Admin đã khóa thủ công).
 */
export async function syncAllWikimediaPhotos(forceRefresh = false): Promise<void> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return;
  if (allSitesSyncPromise && !forceRefresh) return allSitesSyncPromise;

  allSitesSyncPromise = (async () => {
    purgeLegacyWikimediaCaches();

    if (forceRefresh) {
      try {
        window.localStorage.removeItem(WIKI_CACHE_STORAGE_KEY);
        notifyWikimediaCacheUpdated();
      } catch {
        // ignore
      }
    }

    const cache = loadWikimediaCacheMap();
    const missingIds = HERITAGE_SITE_IDS_ORDERED.filter((id) => {
      const defaults = DEFAULT_SITE_PHOTOS_BY_ID[id];
      if (!forceRefresh && defaults?.[0] && defaults?.[1]) {
        return false;
      }
      if (!forceRefresh && (WIKIMEDIA_SITE_CONFIG[id]?.curatedCommonsUrls?.length || 0) >= 2) {
        return false;
      }
      if (forceRefresh) return true;
      const entry = cache[id];
      return (
        !entry ||
        !Array.isArray(entry.photos) ||
        entry.photos.length < 2 ||
        entry.photos[0].url === entry.photos[1].url
      );
    });

    if (missingIds.length === 0) return;

    // Nạp theo cặp 2 di tích kèm khoảng nghỉ nhẹ tránh vượt ngưỡng rate-limit của Wikimedia API
    const batchSize = 2;
    for (let i = 0; i < missingIds.length; i += batchSize) {
      const batch = missingIds.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map((siteId) => fetchWikimediaPhotosForSite(siteId, forceRefresh))
      );
      if (i + batchSize < missingIds.length) {
        await waitMs(180);
      }
    }
  })();

  try {
    await allSitesSyncPromise;
  } finally {
    allSitesSyncPromise = null;
  }
}

/**
 * Giữ tương thích ngược cho nút sync đơn lẻ
 */
export async function fetchWikipediaPhotoForSite(
  siteId: string,
  slot: PhotoSlotIndex = 0
): Promise<string | null> {
  const photos = await fetchWikimediaPhotosForSite(siteId, true);
  return photos[slot]?.url || photos[0]?.url || null;
}

export function loadPhotoCaptionOverrides(): PhotoCaptionOverridesMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PHOTO_CAPTIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as PhotoCaptionOverridesMap) : {};
  } catch {
    return {};
  }
}

export function getDefaultSitePhotoCaption(
  site: HeritageSite,
  slot: PhotoSlotIndex,
  lang: 'vi' | 'en' | 'zh' = 'vi'
): string {
  const staticCaption = DEFAULT_SITE_PHOTO_CAPTIONS[site.id]?.[lang]?.[slot];
  if (staticCaption) {
    return staticCaption;
  }
  const cfg = WIKIMEDIA_SITE_CONFIG[site.id];
  if (cfg?.captions?.[lang]?.[slot]) {
    return cfg.captions[lang][slot];
  }
  const numLabel = slot === 0 ? '01' : '02';
  if (lang === 'en') {
    return `Archival photograph ${numLabel} · ${site.officialName}`;
  }
  if (lang === 'zh') {
    return `实景档案照片 ${numLabel} · ${site.officialName}`;
  }
  return `Ảnh chụp thực tế ${numLabel} · ${site.officialName}`;
}

export function getSitePhotoCaptionOverride(
  siteId: string,
  slot: PhotoSlotIndex,
  lang: 'vi' | 'en' | 'zh' = 'vi'
): string {
  const map = loadPhotoCaptionOverrides();
  const entry = map[siteId];
  if (!entry) return '';
  const slotObj = slot === 0 ? entry.slot0 : entry.slot1;
  const val = slotObj?.[lang];
  return typeof val === 'string' ? val.trim() : '';
}

export function saveSitePhotoCaptionOverride(
  siteId: string,
  slot: PhotoSlotIndex,
  lang: 'vi' | 'en' | 'zh',
  text: string
): PhotoCaptionOverridesMap {
  const current = loadPhotoCaptionOverrides();
  const prevSite = current[siteId] || {};
  const slotKey = slot === 0 ? 'slot0' : 'slot1';
  const prevSlot = { ...(prevSite[slotKey] || {}) };
  const cleaned = text.trim();
  if (cleaned) {
    prevSlot[lang] = cleaned;
  } else {
    delete prevSlot[lang];
  }

  const nextSite: SitePhotoCaptionsOverride = {
    ...prevSite,
    [slotKey]: prevSlot,
    updatedAt: new Date().toISOString(),
  };

  if (
    (!nextSite.slot0 || Object.keys(nextSite.slot0).length === 0) &&
    (!nextSite.slot1 || Object.keys(nextSite.slot1).length === 0)
  ) {
    delete current[siteId];
  } else {
    current[siteId] = nextSite;
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PHOTO_CAPTIONS_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore quota errors
    }
    window.dispatchEvent(new CustomEvent(PHOTO_CAPTIONS_UPDATED_EVENT));
  }
  void pushSyncPatchToServer({
    photoCaptionOverrides: current as unknown as Record<string, unknown>,
  });
  return current;
}

export function saveSitePhotoCaptionsBulk(
  siteId: string,
  slot: PhotoSlotIndex,
  captions: Partial<Record<'vi' | 'en' | 'zh', string>>
): PhotoCaptionOverridesMap {
  const current = loadPhotoCaptionOverrides();
  const prevSite = current[siteId] || {};
  const slotKey = slot === 0 ? 'slot0' : 'slot1';
  const nextSlot: SitePhotoSlotCaptions = { ...(prevSite[slotKey] || {}) };
  (['vi', 'en', 'zh'] as const).forEach((lng) => {
    const val = captions[lng];
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed) {
        nextSlot[lng] = trimmed;
      } else {
        delete nextSlot[lng];
      }
    }
  });

  const nextSite: SitePhotoCaptionsOverride = {
    ...prevSite,
    [slotKey]: nextSlot,
    updatedAt: new Date().toISOString(),
  };

  if (
    (!nextSite.slot0 || Object.keys(nextSite.slot0).length === 0) &&
    (!nextSite.slot1 || Object.keys(nextSite.slot1).length === 0)
  ) {
    delete current[siteId];
  } else {
    current[siteId] = nextSite;
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PHOTO_CAPTIONS_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore quota errors
    }
    window.dispatchEvent(new CustomEvent(PHOTO_CAPTIONS_UPDATED_EVENT));
  }
  void pushSyncPatchToServer({
    photoCaptionOverrides: current as unknown as Record<string, unknown>,
  });
  return current;
}

export function removeSitePhotoCaptionOverrides(
  siteId: string,
  slot?: PhotoSlotIndex
): PhotoCaptionOverridesMap {
  const current = loadPhotoCaptionOverrides();
  if (!current[siteId]) return current;
  if (slot === undefined) {
    delete current[siteId];
  } else {
    const nextSite: SitePhotoCaptionsOverride = {
      ...current[siteId],
      updatedAt: new Date().toISOString(),
    };
    if (slot === 0) delete nextSite.slot0;
    else delete nextSite.slot1;
    if (!nextSite.slot0 && !nextSite.slot1) {
      delete current[siteId];
    } else {
      current[siteId] = nextSite;
    }
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PHOTO_CAPTIONS_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent(PHOTO_CAPTIONS_UPDATED_EVENT));
  }
  void pushSyncPatchToServer({
    photoCaptionOverrides: current as unknown as Record<string, unknown>,
  });
  return current;
}

/**
 * Lấy chú thích ảnh thật (ưu tiên chú thích Admin chỉnh sửa, fallback về cấu hình mặc định VI / EN / ZH)
 */
export function getSitePhotoCaption(
  site: HeritageSite,
  slot: PhotoSlotIndex,
  lang: 'vi' | 'en' | 'zh' = 'vi'
): string {
  const override = getSitePhotoCaptionOverride(site.id, slot, lang);
  if (override) {
    return override;
  }
  return getDefaultSitePhotoCaption(site, slot, lang);
}

/**
 * Trả về chi tiết 2 slot ảnh (01 & 02) theo thứ tự ưu tiên:
 * 1. Ảnh Admin cấu hình trong Admin Studio (localStorage / CLOUD_API_URL)
 * 2. Ảnh thật Wikimedia Commons 1600px đã cache
 * 3. Chuỗi rỗng '' (hiển thị HeritageTypographicPlate khi đang tải hoặc offline)
 */
export function resolveSitePhotoSlots(
  siteId: string,
  customMap: CustomPhotosMap,
  wikiCache?: WikimediaCacheMap
): {
  slots: [string, string];
  sources: ['custom' | 'wikimedia' | 'none', 'custom' | 'wikimedia' | 'none'];
  wikiUrls: [string, string];
  customUrls: [string, string];
} {
  const cache = wikiCache ?? loadWikimediaCacheMap();
  const wikiPhotos = cache[siteId]?.photos || [];
  const defaultPhotos = DEFAULT_SITE_PHOTOS_BY_ID[siteId];
  const curatedUrls = WIKIMEDIA_SITE_CONFIG[siteId]?.curatedCommonsUrls || [];
  const isLockedDefault1 = Boolean(defaultPhotos?.[0] || curatedUrls[0]);
  const isLockedDefault2 = Boolean(defaultPhotos?.[1] || curatedUrls[1]);
  const wikiUrl1 = isLockedDefault1
    ? defaultPhotos?.[0] || curatedUrls[0] || ''
    : wikiPhotos[0]?.url || defaultPhotos?.[0] || '';
  const wikiUrl2 = isLockedDefault2
    ? defaultPhotos?.[1] || curatedUrls[1] || ''
    : wikiPhotos[1]?.url || defaultPhotos?.[1] || '';

  const customNorm = normalizeCustomPhotoSlot(customMap[siteId]);
  const url1 = normalizeHighResPhotoUrl(customNorm.photo1 || wikiUrl1 || '');
  const url2 = normalizeHighResPhotoUrl(customNorm.photo2 || wikiUrl2 || '');

  const src1: 'custom' | 'wikimedia' | 'none' = customNorm.photo1
    ? 'custom'
    : wikiUrl1
    ? 'wikimedia'
    : 'none';
  const src2: 'custom' | 'wikimedia' | 'none' = customNorm.photo2
    ? 'custom'
    : wikiUrl2
    ? 'wikimedia'
    : 'none';

  return {
    slots: [url1, url2],
    sources: [src1, src2],
    wikiUrls: [wikiUrl1, wikiUrl2],
    customUrls: [customNorm.photo1, customNorm.photo2],
  };
}

/**
 * Kết hợp danh sách 2 ảnh thật từ Single Source of Truth (luôn ưu tiên ảnh Admin > Wikimedia Commons API)
 */
export function resolveSitePhotos(
  site: HeritageSite,
  customMap: CustomPhotosMap,
  wikiCache?: WikimediaCacheMap
): string[] {
  const { slots } = resolveSitePhotoSlots(site.id, customMap, wikiCache);
  return slots.filter(Boolean);
}

/**
 * Hook dùng chung đồng bộ tức thì mọi thay đổi ảnh Admin & cache Wikimedia Commons trên toàn website
 */
export function useHeritageRealPhotos() {
  const [customPhotosMap, setCustomPhotosMap] = useState<CustomPhotosMap>(() =>
    loadCustomPhotosMap()
  );
  const [wikimediaCacheMap, setWikimediaCacheMap] = useState<WikimediaCacheMap>(() =>
    loadWikimediaCacheMap()
  );
  const [captionRevision, setCaptionRevision] = useState<number>(0);

  useEffect(() => {
    purgeLegacyWikimediaCaches();
    ensureCuratedHdPhotosMigrated();

    const syncCustomFromStorage = () => {
      setCustomPhotosMap(loadCustomPhotosMap());
    };
    const syncWikiFromStorage = () => {
      setWikimediaCacheMap(loadWikimediaCacheMap());
    };
    const syncCaptionsFromStorage = () => {
      setCaptionRevision((r) => r + 1);
    };
    const handleStorageEvent = (e: StorageEvent) => {
      if (!e.key || e.key === CUSTOM_PHOTOS_STORAGE_KEY) {
        syncCustomFromStorage();
      }
      if (!e.key || e.key === WIKI_CACHE_STORAGE_KEY) {
        syncWikiFromStorage();
      }
      if (!e.key || e.key === PHOTO_CAPTIONS_STORAGE_KEY) {
        syncCaptionsFromStorage();
      }
    };

    window.addEventListener(CUSTOM_PHOTOS_CHANGED_EVENT, syncCustomFromStorage);
    window.addEventListener(WIKIMEDIA_CACHE_UPDATED_EVENT, syncWikiFromStorage);
    window.addEventListener(PHOTO_CAPTIONS_UPDATED_EVENT, syncCaptionsFromStorage);
    window.addEventListener('storage', handleStorageEvent);

    // Tự động tải và cache trọn bộ 34 ảnh 1600px từ Wikimedia Commons API cho 17 di tích
    void syncAllWikimediaPhotos(false);

    return () => {
      window.removeEventListener(CUSTOM_PHOTOS_CHANGED_EVENT, syncCustomFromStorage);
      window.removeEventListener(WIKIMEDIA_CACHE_UPDATED_EVENT, syncWikiFromStorage);
      window.removeEventListener(PHOTO_CAPTIONS_UPDATED_EVENT, syncCaptionsFromStorage);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const getSitePhoto = useCallback(
    (siteIdOrOrder: string | number, slot: PhotoSlotIndex = 0) => {
      if (typeof siteIdOrOrder === 'string') {
        const { slots } = resolveSitePhotoSlots(
          siteIdOrOrder,
          customPhotosMap,
          wikimediaCacheMap
        );
        return slots[slot] || slots[0] || '';
      }
      return getHeritageRealPhoto(siteIdOrOrder);
    },
    [customPhotosMap, wikimediaCacheMap]
  );

  const updateSitePhoto = useCallback(
    (siteId: string, photoDataOrUrl: string, slot: PhotoSlotIndex = 0) => {
      const updated = saveCustomSitePhoto(siteId, photoDataOrUrl, slot);
      setCustomPhotosMap(updated);
      return updated;
    },
    []
  );

  const resetSitePhoto = useCallback((siteId: string, slot?: PhotoSlotIndex) => {
    const updated = removeCustomSitePhoto(siteId, slot);
    setCustomPhotosMap(updated);
    return updated;
  }, []);

  const resetAllSitePhotos = useCallback(() => {
    clearAllCustomSitePhotos();
    setCustomPhotosMap(loadCustomPhotosMap());
  }, []);

  return {
    customPhotosMap,
    setCustomPhotosMap,
    wikimediaCacheMap,
    captionRevision,
    getSitePhoto,
    updateSitePhoto,
    resetSitePhoto,
    resetAllSitePhotos,
    refreshWikimediaPhotos: () => syncAllWikimediaPhotos(true),
  };
}

/**
 * Nén ảnh tải lên từ máy tính sang DataURL chất lượng cao (tối đa 1600px)
 */
export function compressImageFileToDataUrl(
  file: File,
  maxWidth = 1600,
  quality = 0.86
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
    reader.onload = () => {
      const resultStr = reader.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(resultStr);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(resultStr);
        }
      };
      img.onerror = () => resolve(resultStr);
      img.src = resultStr;
    };
    reader.readAsDataURL(file);
  });
}
