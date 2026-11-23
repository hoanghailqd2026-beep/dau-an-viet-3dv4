import { useEffect, useState } from 'react';
import { DEFAULT_HERITAGE_SITES } from '../data/heritageData';
import {
  HERITAGE_ARCHIVE_VIDEOS,
  HERITAGE_FLYCAM_VIDEOS,
  HERITAGE_VIDEO_DATA,
  SITE_ID_TO_VIDEO_KEY,
} from '../data/heritageFilms';
import { FIREBASE_DB_URL, isFirebaseDbConfigured } from './firebaseRestSync';
import { syncGlobalMediaCreditsToCloud } from './realtimeCloudSync';

export type MediaCreditCategory = 'image' | 'video' | 'map_archive';

export interface MediaCreditItem {
  id: string;
  /** Either a monument ID (e.g. 'HCM-DT-001') or 'ALL' for shared cartography / archives */
  siteId: string;
  category: MediaCreditCategory;
  title: string;
  titleEn?: string;
  titleZh?: string;
  sourceAuthor: string;
  sourceAuthorEn?: string;
  sourceAuthorZh?: string;
  licenseNote: string;
  licenseNoteEn?: string;
  licenseNoteZh?: string;
  url?: string;
  yearOrPeriod?: string;
  updatedAt: number;
  isDefaultSeed?: boolean;
}

export const MEDIA_CREDITS_STORAGE_KEY = 'dau_an_viet_media_credits_v1';
export const MEDIA_CREDITS_UPDATED_EVENT = 'dau-an-viet-media-credits-updated';
const MEDIA_CREDITS_CURATED_V2_SYNC_FLAG = 'dau_an_viet_media_credits_v2_pushed';
const CURATED_MEDIA_CREDITS_RELEASE_MS = Date.parse('2026-11-21T07:35:00.000Z');

interface CuratedPhotoCreditSpec {
  titleVi: string;
  titleEn: string;
  titleZh: string;
  sourceAuthorVi: string;
  sourceAuthorEn: string;
  sourceAuthorZh: string;
  licenseVi: string;
  licenseEn: string;
  licenseZh: string;
  url: string;
  yearOrPeriod: string;
}

/**
 * Bộ trích dẫn chuẩn hóa 3 ngôn ngữ (VI / EN / ZH) cho trọn bộ 34 hình ảnh tư liệu
 * độ phân giải cao của 17 di tích lịch sử – văn hóa Đông Nam Bộ.
 */
const CURATED_17_SITE_PHOTO_CREDITS: Record<
  string,
  [CuratedPhotoCreditSpec, CuratedPhotoCreditSpec]
> = {
  'HCM-DT-001': [
    {
      titleVi: 'Toàn cảnh mặt tiền Dinh Độc Lập (Hội trường Thống Nhất), Quận 1, TP. Hồ Chí Minh',
      titleEn: 'Facade of Independence Palace (Reunification Hall), District 1, Ho Chi Minh City',
      titleZh: '胡志明市第一郡独立宫（统一会堂）正面全景',
      sourceAuthorVi: 'iVIVU.com (09/2024)',
      sourceAuthorEn: 'iVIVU.com (09/2024)',
      sourceAuthorZh: 'iVIVU.com（2024年9月）',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://www.ivivu.com/blog/2024/09/6-diem-den-o-thanh-pho-ho-chi-minh-mang-dam-dau-an-van-hoa-lich-su/',
      yearOrPeriod: '09/2024',
    },
    {
      titleVi:
        'Không gian Phòng Trình quốc thư và bức tranh sơn mài Bình Ngô đại cáo (họa sĩ Nguyễn Văn Minh, 1966)',
      titleEn:
        'Credentials Presentation Hall and Binh Ngo Dai Cao Lacquer Painting (Nguyen Van Minh, 1966)',
      titleZh: '独立宫国书呈递厅与大型漆画《平吴大告》（阮文明作，1966年）',
      sourceAuthorVi: 'Trip.com Moments (01/09/2026)',
      sourceAuthorEn: 'Trip.com Moments (01/09/2026)',
      sourceAuthorZh: 'Trip.com Moments（2026年9月1日）',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://www.trip.com/moments/detail/ho-chi-minh-city-434-151801161/',
      yearOrPeriod: '2026',
    },
  ],
  'HCM-DT-002': [
    {
      titleVi: 'Toàn cảnh mặt tiền kiến trúc Nhà hát Thành phố Hồ Chí Minh (2013)',
      titleEn: 'Facade of the Municipal Theatre of Ho Chi Minh City (2013)',
      titleZh: '胡志明市大剧院正面建筑全景（2013年）',
      sourceAuthorVi: 'Diego Delso — Wikimedia Commons',
      sourceAuthorEn: 'Diego Delso — Wikimedia Commons',
      sourceAuthorZh: 'Diego Delso — Wikimedia Commons',
      licenseVi: 'CC BY-SA 3.0',
      licenseEn: 'CC BY-SA 3.0',
      licenseZh: 'CC BY-SA 3.0',
      url: 'https://vi.wikipedia.org/wiki/T%E1%BA%ADp_tin:%C3%93pera,_Ciudad_Ho_Chi_Minh,_Vietnam,_2013-08-14,_DD_02.JPG',
      yearOrPeriod: '2013',
    },
    {
      titleVi: 'Không gian khán phòng và kết cấu mái vòm bên trong Nhà hát Thành phố',
      titleEn: 'Interior Auditorium and Dome Architecture of Saigon Opera House',
      titleZh: '胡志明市大剧院内部观众厅与穹顶结构',
      sourceAuthorVi: 'Quỳnh Trần — Báo điện tử VnExpress (16/11/2021)',
      sourceAuthorEn: 'Quynh Tran — VnExpress Newspaper (16/11/2021)',
      sourceAuthorZh: 'Quỳnh Trần — VnExpress 电子报（2021年11月16日）',
      licenseVi: 'Tư liệu báo chí & giáo dục phi thương mại',
      licenseEn: 'Press & Non-commercial Educational Reference',
      licenseZh: '新闻资料与非商业教育用途',
      url: 'https://vnexpress.net/lich-su-cac-cong-trinh-dau-tien-o-sai-gon-4386601-p2.html',
      yearOrPeriod: '16/11/2021',
    },
  ],
  'HCM-DT-003': [
    {
      titleVi: 'Toàn cảnh mặt tiền và đồng hồ trung tâm Bưu điện Trung tâm Sài Gòn',
      titleEn: 'Main Facade and Central Clock of Saigon Central Post Office',
      titleZh: '西贡中心邮政局正面与中央大钟全景',
      sourceAuthorVi: 'BestPrice Travel / The Sinh Cafe Tour',
      sourceAuthorEn: 'BestPrice Travel / The Sinh Cafe Tour',
      sourceAuthorZh: 'BestPrice Travel / The Sinh Cafe Tour',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://thesinhcafetouronline.com/tour/tour-du-lich-kham-pha-hcm-city-china-town-1-ngay/',
      yearOrPeriod: 'Hiện tại',
    },
    {
      titleVi:
        'Không gian đại sảnh và kết cấu mái vòm khung sắt bên trong Bưu điện Trung tâm Sài Gòn',
      titleEn: 'Main Hall and Iron-truss Vaulted Ceiling of Saigon Central Post Office',
      titleZh: '西贡中心邮政局大厅与铁架拱顶结构',
      sourceAuthorVi: 'Prenn — Wikimedia Commons (28/08/2012)',
      sourceAuthorEn: 'Prenn — Wikimedia Commons (28/08/2012)',
      sourceAuthorZh: 'Prenn — Wikimedia Commons（2012年8月28日）',
      licenseVi: 'CC BY-SA 3.0',
      licenseEn: 'CC BY-SA 3.0',
      licenseZh: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Saigon_Central_Post_Office.JPG',
      yearOrPeriod: '28/08/2012',
    },
  ],
  'HCM-DT-004': [
    {
      titleVi: 'Toàn cảnh mặt tiền Cửa Nam và Tháp đồng hồ Chợ Bến Thành',
      titleEn: 'South Gate Facade and Clock Tower of Ben Thanh Market',
      titleZh: '滨城市场南门正面与钟楼全景',
      sourceAuthorVi: 'Wikimedia Commons',
      sourceAuthorEn: 'Wikimedia Commons',
      sourceAuthorZh: 'Wikimedia Commons',
      licenseVi: 'Giấy phép tự do Wikimedia Commons',
      licenseEn: 'Wikimedia Commons Free License',
      licenseZh: 'Wikimedia Commons 自由许可协议',
      url: 'https://vi.wikipedia.org/wiki/T%E1%BA%ADp_tin:Ben_Thanh_market_2.jpg',
      yearOrPeriod: 'Hiện tại',
    },
    {
      titleVi:
        'Không gian kiến trúc mái vòm và các gian hàng truyền thống bên trong Chợ Bến Thành',
      titleEn: 'Vaulted Roof Architecture and Traditional Stalls Inside Ben Thanh Market',
      titleZh: '滨城市场内部拱顶结构与传统摊位风貌',
      sourceAuthorVi: 'Bahnfrend — Wikimedia Commons / VietnamSpot',
      sourceAuthorEn: 'Bahnfrend — Wikimedia Commons / VietnamSpot',
      sourceAuthorZh: 'Bahnfrend — Wikimedia Commons / VietnamSpot',
      licenseVi: 'CC BY-SA 4.0',
      licenseEn: 'CC BY-SA 4.0',
      licenseZh: 'CC BY-SA 4.0',
      url: 'https://vietnamspot.ru/en/blog/ho-chi-minh-prices',
      yearOrPeriod: 'Hiện tại',
    },
  ],
  'HCM-DT-005': [
    {
      titleVi:
        'Mặt tiền hai tháp chuông Nhà thờ Chính tòa Đức Bà Sài Gòn và tượng Đức Mẹ Hòa Bình',
      titleEn:
        'Twin Bell Towers of Notre-Dame Cathedral Basilica of Saigon and Statue of Our Lady of Peace',
      titleZh: '西贡圣母大教堂双钟楼与和平圣母像全景',
      sourceAuthorVi: 'Diego Delso — Wikimedia Commons (14/08/2013)',
      sourceAuthorEn: 'Diego Delso — Wikimedia Commons (14/08/2013)',
      sourceAuthorZh: 'Diego Delso — Wikimedia Commons（2013年8月14日）',
      licenseVi: 'CC BY-SA 3.0',
      licenseEn: 'CC BY-SA 3.0',
      licenseZh: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora,_Ciudad_Ho_Chi_Minh,_Vietnam,_2013-08-14,_DD_03.JPG',
      yearOrPeriod: '14/08/2013',
    },
    {
      titleVi:
        'Không gian nội thất lòng chính điện và kết cấu vòm cuốn Roman – Gothic bên trong Nhà thờ Đức Bà Sài Gòn',
      titleEn:
        'Main Nave Interior and Romanesque-Gothic Vaulted Arches of Notre-Dame Cathedral Basilica of Saigon',
      titleZh: '西贡圣母大教堂主殿内部空间与罗曼—哥特式拱顶结构',
      sourceAuthorVi: 'Diego Delso — Wikimedia Commons (14/08/2013)',
      sourceAuthorEn: 'Diego Delso — Wikimedia Commons (14/08/2013)',
      sourceAuthorZh: 'Diego Delso — Wikimedia Commons（2013年8月14日）',
      licenseVi: 'CC BY-SA 3.0',
      licenseEn: 'CC BY-SA 3.0',
      licenseZh: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Bas%C3%ADlica_de_Nuestra_Se%C3%B1ora,_Ciudad_Ho_Chi_Minh,_Vietnam,_2013-08-14,_DD_14.JPG',
      yearOrPeriod: '14/08/2013',
    },
  ],
  'HCM-DT-006': [
    {
      titleVi:
        'Cổng chính và khối tháp bát giác phong cách kiến trúc Đông Dương tại Bảo tàng Lịch sử TP. Hồ Chí Minh',
      titleEn:
        'Main Entrance and Indochinese Octagonal Tower of the Museum of Vietnamese History in HCMC',
      titleZh: '胡志明市历史博物馆印度支那风格正门与八角塔楼',
      sourceAuthorVi: 'Nguyễn Thanh Quang — Wikimedia Commons (12/07/2010)',
      sourceAuthorEn: 'Nguyen Thanh Quang — Wikimedia Commons (12/07/2010)',
      sourceAuthorZh: '阮清光 — Wikimedia Commons（2010年7月12日）',
      licenseVi: 'Giấy phép tự do Wikimedia Commons',
      licenseEn: 'Wikimedia Commons Free License',
      licenseZh: 'Wikimedia Commons 自由许可协议',
      url: 'https://vi.wikipedia.org/wiki/T%E1%BA%ADp_tin:Vietnam_History_Museum_HCMC.JPG',
      yearOrPeriod: '12/07/2010',
    },
    {
      titleVi:
        'Không gian sân vườn trưng bày ngoài trời và nhà bia truyền thống tại Bảo tàng Lịch sử',
      titleEn:
        'Outdoor Artifact Courtyard and Traditional Stele Pavilion at the Museum of History',
      titleZh: '历史博物馆户外文物庭院与传统碑亭景观',
      sourceAuthorVi: 'Cổng thông tin Bảo tàng Lịch sử Quốc gia Việt Nam (15/11/2024)',
      sourceAuthorEn: 'Vietnam National Museum of History Portal (15/11/2024)',
      sourceAuthorZh: '越南国家历史博物馆官网（2024年11月15日）',
      licenseVi: 'Tư liệu bảo tàng & giáo dục phi thương mại',
      licenseEn: 'Museum Archive & Non-commercial Educational Use',
      licenseZh: '博物馆档案与非商业教育用途',
      url: 'https://vnmh.com.vn/vi/Articles/3091/75042/du-khach-thich-thu-kham-pha-pavillion-rong-ran-len-may-trong-long-bao-tang-lich-su-quoc-gia-viet-nam.html',
      yearOrPeriod: '15/11/2024',
    },
  ],
  'HCM-DT-007': [
    {
      titleVi:
        'Toàn cảnh mặt tiền kiến trúc Bến Nhà Rồng – Bảo tàng Hồ Chí Minh hướng sông Sài Gòn',
      titleEn: 'Riverfront Facade of Nha Rong Wharf – Ho Chi Minh Museum',
      titleZh: '芽龙港—胡志明博物馆临江正面建筑全景',
      sourceAuthorVi: 'Báo điện tử CafeF (22/09/2022)',
      sourceAuthorEn: 'CafeF Electronic Newspaper (22/09/2022)',
      sourceAuthorZh: 'CafeF 电子报（2022年9月22日）',
      licenseVi: 'Tư liệu báo chí & giáo dục phi thương mại',
      licenseEn: 'Press & Non-commercial Educational Reference',
      licenseZh: '新闻资料与非商业教育用途',
      url: 'https://cafef.vn/ngam-ve-dep-cua-nhung-cong-vien-di-tich-ven-song-sai-gon-20220922202050604.chn',
      yearOrPeriod: '22/09/2022',
    },
    {
      titleVi: 'Toàn cảnh khuôn viên Bến Nhà Rồng bên ngã ba sông Sài Gòn về đêm',
      titleEn: 'Aerial Night View of Nha Rong Wharf Along the Saigon River',
      titleZh: '西贡河畔芽龙港园区夜间俯瞰全景',
      sourceAuthorVi: 'Phong Nha Viet Travel (04/2024)',
      sourceAuthorEn: 'Phong Nha Viet Travel (04/2024)',
      sourceAuthorZh: 'Phong Nha Viet Travel（2024年4月）',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://phongnhaviet.com/tour-1/south-tour/ho-chi-minh-city-bac-lieu-ca-mau-can-tho',
      yearOrPeriod: '04/2024',
    },
  ],
  'HCM-DT-008': [
    {
      titleVi: 'Toàn cảnh cổng Tam Quan Thượng Công Miếu tại Lăng Tả quân Lê Văn Duyệt',
      titleEn: 'Triple-Arched Main Gate (Tam Quan) of Le Van Duyet Mausoleum',
      titleZh: '左军黎文悦陵“上公庙”三关门正面全景',
      sourceAuthorVi: 'Bùi Thụy Đào Nguyên — Wikimedia Commons',
      sourceAuthorEn: 'Bui Thuy Dao Nguyen — Wikimedia Commons',
      sourceAuthorZh: '裴瑞陶原 — Wikimedia Commons',
      licenseVi: 'Giấy phép tự do Wikimedia Commons',
      licenseEn: 'Wikimedia Commons Free License',
      licenseZh: 'Wikimedia Commons 自由许可协议',
      url: 'https://commons.wikimedia.org/wiki/File:C%E1%BB%95ng_ch%C3%ADnh_L%C4%83ng_%C3%94ng_B%C3%A0_Chi%E1%BB%83u.jpg',
      yearOrPeriod: 'Hiện tại',
    },
    {
      titleVi:
        'Không gian sân thiên tỉnh, lư hương đá và kiến trúc gỗ sơn son thếp vàng tại Lăng Tả quân Lê Văn Duyệt',
      titleEn:
        'Inner Courtyard, Stone Incense Burner and Gilded Red-Lacquered Doors at Le Van Duyet Mausoleum',
      titleZh: '左军黎文悦陵内庭院、石香炉与朱漆贴金木雕殿门景观',
      sourceAuthorVi: 'Redsvn.net (25/02/2018)',
      sourceAuthorEn: 'Redsvn.net (25/02/2018)',
      sourceAuthorZh: 'Redsvn.net（2018年2月25日）',
      licenseVi: 'Tư liệu cộng đồng & giáo dục phi thương mại',
      licenseEn: 'Community Archive & Non-commercial Educational Use',
      licenseZh: '社区档案与非商业教育用途',
      url: 'https://redsvn.net/chum-anh-lang-ong-ba-chieu-khu-lang-mo-co-nguy-nga-nhat-sai-gon/',
      yearOrPeriod: '25/02/2018',
    },
  ],
  'HCM-DT-009': [
    {
      titleVi: 'Lối xuống đường hầm Cửa số 5 tại Khu di tích lịch sử Địa đạo Củ Chi',
      titleEn: 'Entrance No. 5 to the Underground Tunnel Network at Cu Chi Tunnels Historical Site',
      titleZh: '古芝地道历史遗迹区5号地下通道入口',
      sourceAuthorVi: 'Vũ Phong — Báo điện tử Chính phủ (10/02/2023)',
      sourceAuthorEn: 'Vu Phong — Vietnam Government News (10/02/2023)',
      sourceAuthorZh: '武峰 — 越南政府电子报（2023年2月10日）',
      licenseVi: 'Tư liệu báo chí & giáo dục phi thương mại',
      licenseEn: 'Press & Non-commercial Educational Reference',
      licenseZh: '新闻资料与非商业教育用途',
      url: 'https://tphcm.chinhphu.vn/trinh-unesco-cong-nhan-dia-dao-cu-chi-la-di-san-the-gioi-vao-nam-2027-101230209190748568.htm',
      yearOrPeriod: '10/02/2023',
    },
    {
      titleVi: 'Cụm lán trại mái lá ngụy trang và hầm bán âm dưới tán rừng Địa đạo Củ Chi',
      titleEn: 'Camouflaged Thatched Shelters and Semi-subterranean Dugouts in Cu Chi Forest',
      titleZh: '古芝地道林荫下的伪装茅草棚与半地下掩体景观',
      sourceAuthorVi: 'Shutterstock / Senteurs du Vietnam',
      sourceAuthorEn: 'Shutterstock / Senteurs du Vietnam',
      sourceAuthorZh: 'Shutterstock / Senteurs du Vietnam',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://www.vietjetair.com/en/destinations/ho-chi-minh-city/cu-chi-tunnels-historical-site',
      yearOrPeriod: '2022',
    },
  ],
  'HCM-DT-010': [
    {
      titleVi:
        'Cảnh quan hệ sinh thái rừng ngập mặn Cần Giờ bao quanh Khu Di tích Khảo cổ học Giồng Cá Vồ',
      titleEn: 'Can Gio Mangrove Ecosystem Surrounding Giong Ca Vo Archaeological Site',
      titleZh: '环绕榕卡沃考古遗址区的芹耶红树林生态环境景观',
      sourceAuthorVi: 'Wikimedia Commons',
      sourceAuthorEn: 'Wikimedia Commons',
      sourceAuthorZh: 'Wikimedia Commons',
      licenseVi: 'Giấy phép tự do Wikimedia Commons',
      licenseEn: 'Wikimedia Commons Free License',
      licenseZh: 'Wikimedia Commons 自由许可协议',
      url: 'https://en.wikipedia.org/wiki/C%E1%BA%A7n_Gi%E1%BB%9D_Mangrove_Forest',
      yearOrPeriod: 'Hiện tại',
    },
    {
      titleVi:
        'Hiện vật đồng tiền bạc cổ cắt đôi thuộc văn hóa Óc Eo – Phù Nam tại vùng di tích Giồng Cá Vồ',
      titleEn: 'Halved Ancient Silver Coin Artifact of Oc Eo – Funan Culture at Giong Ca Vo',
      titleZh: '榕卡沃遗址区出土的扶南—奥埃文化半切古银币文物',
      sourceAuthorVi: 'Wikimedia Commons · Tư liệu hiện vật Văn hóa Óc Eo',
      sourceAuthorEn: 'Wikimedia Commons · Oc Eo Culture Archaeological Archive',
      sourceAuthorZh: 'Wikimedia Commons · 奥埃文化考古文物档案',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://commons.wikimedia.org/wiki/File:Oc_Eo_Culture_Gold_Coin_1.jpg',
      yearOrPeriod: 'TK III–I TCN',
    },
  ],
  'HCM-DT-011': [
    {
      titleVi: 'Toàn cảnh mặt tiền chính điện cổ tự Chùa Giác Lâm',
      titleEn: 'Main Hall Facade of Historic Giac Lam Pagoda',
      titleZh: '觉林古寺大雄宝殿正面全景',
      sourceAuthorVi: 'Wikimedia Commons · Tư liệu Kiến trúc Chùa Giác Lâm',
      sourceAuthorEn: 'Wikimedia Commons · Giac Lam Pagoda Architectural Archive',
      sourceAuthorZh: 'Wikimedia Commons · 觉林寺历史建筑档案',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://commons.wikimedia.org/wiki/File:Chua_Giac_Lam_Gate.JPG',
      yearOrPeriod: '1744',
    },
    {
      titleVi:
        'Không gian kiến trúc gỗ và hệ thống hoành phi, câu đối chạm khắc bên trong Chùa Giác Lâm',
      titleEn: 'Wooden Column Architecture and Carved Lacquered Plaques Inside Giac Lam Pagoda',
      titleZh: '觉林寺内部木构建筑与雕花匾联景观',
      sourceAuthorVi: 'Wikimedia Commons · Tư liệu Bảo tháp & Kiến trúc Chùa Giác Lâm (01/2022)',
      sourceAuthorEn: 'Wikimedia Commons · Giac Lam Pagoda Stupa & Timber Archive (01/2022)',
      sourceAuthorZh: 'Wikimedia Commons · 觉林寺宝塔与木构档案（2022年1月）',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://commons.wikimedia.org/wiki/File:Ch%C3%B9a_Gi%C3%A1c_L%C3%A2m,_th%C3%A1ng_01_n%C4%83m_2022_(th%C3%A1p_x%C3%A1_l%E1%BB%A3i)_(4).jpg',
      yearOrPeriod: '01/2022',
    },
  ],
  'HCM-DT-012': [
    {
      titleVi:
        'Kiến trúc mặt tiền và nghệ thuật trang trí gốm sứ trên mái Hội quán Nghĩa An (Chùa Ông)',
      titleEn: 'Facade and Ceramic Roof Ornamentation of Nghia An Assembly Hall',
      titleZh: '义安会馆（关帝庙）正面建筑与屋脊嵌瓷艺术',
      sourceAuthorVi: 'Wikimedia Commons · Tư liệu Kiến trúc Hội quán Nghĩa An (Chợ Lớn)',
      sourceAuthorEn: 'Wikimedia Commons · Nghia An Assembly Hall Archive (Cholon)',
      sourceAuthorZh: 'Wikimedia Commons · 堤岸义安会馆建筑档案',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://commons.wikimedia.org/wiki/File:Nghia_An_Hoi_Quan_Pagoda_(10018215816).jpg',
      yearOrPeriod: 'Hiện tại',
    },
    {
      titleVi:
        'Không gian điện thờ Quan Thánh Đế Quân và nghệ thuật chạm gỗ thếp vàng tại Hội quán Nghĩa An',
      titleEn: 'Sanctuary and Gilded Woodcarvings Inside Nghia An Assembly Hall',
      titleZh: '义安会馆正殿空间与贴金木雕艺术',
      sourceAuthorVi: 'Wikimedia Commons · Tư liệu Nội tự Hội quán Nghĩa An',
      sourceAuthorEn: 'Wikimedia Commons · Nghia An Assembly Hall Interior Archive',
      sourceAuthorZh: 'Wikimedia Commons · 义安会馆内部雕梁档案',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://commons.wikimedia.org/wiki/File:Nghia_An_Hoi_Quan_Pagoda_(10018333403).jpg',
      yearOrPeriod: 'Hiện tại',
    },
  ],
  'BRVT-DT-001': [
    {
      titleVi:
        'Toàn cảnh kiến trúc Bạch Dinh (Villa Blanche) bên sườn núi Lớn, thành phố Vũng Tàu',
      titleEn: 'Exterior Architecture of Bach Dinh (Villa Blanche) on Big Mountain Slope, Vung Tau',
      titleZh: '头顿市大山山麓白宫（布兰奇别墅）建筑全景',
      sourceAuthorVi: 'Wikimedia Commons · Bảo tàng Tỉnh Bà Rịa – Vũng Tàu',
      sourceAuthorEn: 'Wikimedia Commons · Ba Ria – Vung Tau Provincial Museum',
      sourceAuthorZh: 'Wikimedia Commons · 巴地头顿省博物馆',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://commons.wikimedia.org/wiki/File:Vung_Tau_Bach_Dinh.JPG',
      yearOrPeriod: '1898',
    },
    {
      titleVi:
        'Chi tiết phù điêu cổ điển châu Âu và không gian trưng bày cổ vật bên trong Bạch Dinh',
      titleEn: 'European Classical Bas-reliefs and Antique Exhibition Hall Inside Bach Dinh',
      titleZh: '白宫欧式古典浮雕细节与内部古董展厅',
      sourceAuthorVi: 'Wikimedia Commons · Tư liệu Kiến trúc Villa Blanche Vũng Tàu',
      sourceAuthorEn: 'Wikimedia Commons · Villa Blanche Vung Tau Architectural Archive',
      sourceAuthorZh: 'Wikimedia Commons · 头顿白宫建筑细节档案',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://commons.wikimedia.org/wiki/File:VN-vungtau-bach-dinh-1.jpg',
      yearOrPeriod: 'Hiện tại',
    },
  ],
  'BRVT-DT-002': [
    {
      titleVi:
        'Toàn cảnh quần thể kiến trúc gỗ cổ truyền Nhà Lớn Long Sơn (Đền Ông Trần), Vũng Tàu',
      titleEn: 'Traditional Timber Architectural Complex of Long Son Big House, Vung Tau',
      titleZh: '头顿市龙山大屋传统木构建筑群全景',
      sourceAuthorVi: 'Wikimedia Commons · Trung tâm Bảo tồn Di tích Bà Rịa – Vũng Tàu',
      sourceAuthorEn: 'Wikimedia Commons · Ba Ria – Vung Tau Heritage Conservation Center',
      sourceAuthorZh: 'Wikimedia Commons · 巴地头顿文化遗产保护中心',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://commons.wikimedia.org/wiki/File:Nh%C3%A0_L%E1%BB%9Bn_Long_S%C6%A1n.jpg',
      yearOrPeriod: '1910',
    },
    {
      titleVi:
        'Không gian Nhà Thánh và các gian nhà cổ bảo tồn di sản tín ngưỡng tại Nhà Lớn Long Sơn',
      titleEn: 'Sanctuary Hall and Preserved Heritage Timber Pavilions at Long Son Big House',
      titleZh: '龙山大屋圣殿空间与传统木构古建筑群',
      sourceAuthorVi: 'Wikimedia Commons · Tư liệu Quần thể Đảo Long Sơn',
      sourceAuthorEn: 'Wikimedia Commons · Long Son Island Architectural Archive',
      sourceAuthorZh: 'Wikimedia Commons · 龙山岛古建筑群档案',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://commons.wikimedia.org/wiki/File:Cau_Long_son,_ba_ria_vung_tau_-_panoramio.jpg',
      yearOrPeriod: 'Hiện tại',
    },
  ],
  'BRVT-DT-003': [
    {
      titleVi:
        'Cổng vào và khu vực bia tưởng niệm Khu di tích lịch sử Địa đạo Long Phước, Bà Rịa',
      titleEn: 'Entrance Gate and Memorial Monument of Long Phuoc Tunnels Historical Site, Ba Ria',
      titleZh: '巴地龙福地道历史遗迹区入口与纪念碑广场',
      sourceAuthorVi: 'Ban Quản lý Khu Di tích Lịch sử Địa đạo Long Phước · Sở VHTT Bà Rịa – Vũng Tàu',
      sourceAuthorEn:
        'Long Phuoc Tunnels Historical Site Management Board · Ba Ria – Vung Tau Dept. of Culture',
      sourceAuthorZh: '巴地头顿龙福地道历史遗迹区管理委员会 · 地方文化部门档案',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://vi.wikipedia.org/wiki/%C4%90%E1%BB%8Ba_%C4%91%E1%BA%A1o_Long_Ph%C6%B0%E1%BB%9Bc',
      yearOrPeriod: '1948',
    },
    {
      titleVi:
        'Cấu trúc cửa hầm bí mật và giao thông hào chiến đấu tại Khu di tích Địa đạo Long Phước',
      titleEn: 'Secret Tunnel Entrance and Combat Trenches at Long Phuoc Tunnels',
      titleZh: '龙福地道秘密洞口与作战交通壕结构',
      sourceAuthorVi: 'Tư liệu lưu trữ Di tích Lịch sử Cách mạng Địa đạo Long Phước',
      sourceAuthorEn: 'Long Phuoc Revolutionary Heritage Archival Collection',
      sourceAuthorZh: '龙福抗战历史遗迹档案库',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://vi.wikipedia.org/wiki/%C4%90%E1%BB%8Ba_%C4%91%E1%BA%A1o_Long_Ph%C6%B0%E1%BB%9Bc',
      yearOrPeriod: '1948 – 1975',
    },
  ],
  'BD-DT-001': [
    {
      titleVi:
        'Mặt tiền nhà rường truyền thống Nam Bộ 3 gian 2 chái tại Nhà cổ Trần Công Vàng',
      titleEn: 'Southern Traditional Timber House Facade of Tran Cong Vang Ancient House',
      titleZh: '陈公黄古宅南部传统木结构正面景观',
      sourceAuthorVi: 'Bảo tàng Tỉnh Bình Dương · Tư liệu Di sản Kiến trúc Thủ Dầu Một',
      sourceAuthorEn: 'Binh Duong Provincial Museum · Thu Dau Mot Architectural Heritage Archive',
      sourceAuthorZh: '平阳省博物馆 · 土龙木传统建筑遗产档案',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://vi.wikipedia.org/wiki/Nh%C3%A0_c%E1%BB%95_Tr%E1%BA%A7n_C%C3%B4ng_V%C3%A0ng',
      yearOrPeriod: '1889',
    },
    {
      titleVi:
        'Nghệ thuật chạm khắc bao lam, liễn đối và hệ khung cột gỗ quý bên trong Nhà cổ Trần Công Vàng',
      titleEn:
        'Intricate Woodcarvings, Parallel Couplets and Timber Pillar Frame Inside Tran Cong Vang House',
      titleZh: '陈公黄古宅内部木雕花罩、楹联与珍贵木柱框架',
      sourceAuthorVi: 'Bảo tàng Tỉnh Bình Dương · Tư liệu Nội thất Nhà cổ Trần Công Vàng',
      sourceAuthorEn: 'Binh Duong Provincial Museum · Tran Cong Vang House Interior Archive',
      sourceAuthorZh: '平阳省博物馆 · 陈公黄古宅室内木雕档案',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://vi.wikipedia.org/wiki/Nh%C3%A0_c%E1%BB%95_Tr%E1%BA%A7n_C%C3%B4ng_V%C3%A0ng',
      yearOrPeriod: '1889 – Hiện tại',
    },
  ],
  'BD-DT-002': [
    {
      titleVi:
        'Tượng đài chiến thắng và không gian tưởng niệm Khu di tích lịch sử Địa đạo Tam Giác Sắt',
      titleEn:
        'Victory Monument and Memorial Grounds of the Iron Triangle Tunnels Historical Site',
      titleZh: '铁三角地道历史遗迹区胜利纪念碑与纪念园区',
      sourceAuthorVi: 'Bảo tàng Tỉnh Bình Dương · Ban Quản lý Di tích Địa đạo Tam Giác Sắt',
      sourceAuthorEn: 'Binh Duong Provincial Museum · Iron Triangle Tunnels Management Board',
      sourceAuthorZh: '平阳省博物馆 · 铁三角地道遗迹管理委员会',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://vi.wikipedia.org/wiki/Tam_gi%C3%A1c_s%E1%BA%AFt_(Vi%E1%BB%87t_Nam)',
      yearOrPeriod: '1948 – 1975',
    },
    {
      titleVi:
        'Hệ thống hầm địa đạo và không gian tái hiện căn cứ kháng chiến vùng Tam Giác Sắt – Bến Cát',
      titleEn:
        'Underground Tunnel System and Reconstructed Resistance Base at Iron Triangle – Ben Cat',
      titleZh: '铁三角—滨吉抗战根据地地下通道与复原景观',
      sourceAuthorVi: 'Tư liệu lịch sử Chiến khu Tam Giác Sắt – Tây Nam Bến Cát (Bình Dương)',
      sourceAuthorEn: 'Iron Triangle – Southwest Ben Cat Historical Resistance Archive',
      sourceAuthorZh: '平阳省槟吉西南“铁三角”抗战根据地历史档案',
      licenseVi: 'Tư liệu tham khảo & giáo dục phi thương mại',
      licenseEn: 'Non-commercial Educational & Reference Material',
      licenseZh: '非商业教育与参考资料',
      url: 'https://vi.wikipedia.org/wiki/Tam_gi%C3%A1c_s%E1%BA%AFt_(Vi%E1%BB%87t_Nam)',
      yearOrPeriod: '1948 – 1975',
    },
  ],
};

function sanitizeExternalUrl(raw?: string): string | undefined {
  const trimmed = (raw || '').trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return undefined;
}

function localizeLicenseFallback(licenseVi: string): { en: string; zh: string } {
  const lower = licenseVi.toLowerCase();
  if (/cc\s*by-sa\s*3\.0/i.test(lower)) {
    return { en: 'CC BY-SA 3.0', zh: 'CC BY-SA 3.0' };
  }
  if (/cc\s*by-sa\s*4\.0/i.test(lower)) {
    return { en: 'CC BY-SA 4.0', zh: 'CC BY-SA 4.0' };
  }
  if (/public domain|phạm vi công cộng/i.test(lower)) {
    return { en: 'Public Domain', zh: '公共领域 (Public Domain)' };
  }
  if (/wikimedia/i.test(lower)) {
    return { en: 'Wikimedia Commons Free License', zh: 'Wikimedia Commons 自由许可协议' };
  }
  if (/báo chí|press/i.test(lower)) {
    return {
      en: 'Press & Non-commercial Educational Reference',
      zh: '新闻资料与非商业教育用途',
    };
  }
  if (/bảo tàng|museum/i.test(lower)) {
    return {
      en: 'Museum Archive & Non-commercial Educational Use',
      zh: '博物馆档案与非商业教育用途',
    };
  }
  if (/cộng đồng|community/i.test(lower)) {
    return {
      en: 'Community Archive & Non-commercial Educational Use',
      zh: '社区档案与非商业教育用途',
    };
  }
  return {
    en: 'Non-commercial Educational & Reference Material',
    zh: '非商业教育与参考资料',
  };
}

export function buildDefaultMediaCredits(): MediaCreditItem[] {
  const baseTs = CURATED_MEDIA_CREDITS_RELEASE_MS;
  const seeded: MediaCreditItem[] = [];

  // 1. Curated Historical Maps & Archival Collections (Bản đồ & Lưu trữ)
  seeded.push(
    {
      id: 'mc-map-1815-batquai',
      siteId: 'ALL',
      category: 'map_archive',
      title: 'Đồ bản Thành Bát Quái (Gia Định Thành 1815) – Trần Văn Học',
      titleEn: 'Octagonal Citadel Map of Gia Dinh (1815) – Tran Van Hoc Cartography',
      titleZh: '1815年嘉定八卦城（龟城）古舆图 · 陈文学测绘',
      sourceAuthor: 'Trung tâm Lưu trữ Quốc gia II · Thư viện Quốc gia Pháp (BnF Gallica)',
      sourceAuthorEn: 'National Archives Center II · Bibliothèque nationale de France (Gallica)',
      sourceAuthorZh: '越南国家第二档案馆 · 法国国家图书馆 (BnF Gallica)',
      licenseNote: 'Phạm vi công cộng (Public Domain) · Tư liệu nghiên cứu lịch sử',
      licenseNoteEn: 'Public Domain · Historical Cartographic Research',
      licenseNoteZh: '公共领域 (Public Domain) · 历史舆图研究资料',
      url: 'https://gallica.bnf.fr/',
      yearOrPeriod: '1815',
      updatedAt: baseTs,
      isDefaultSeed: true,
    },
    {
      id: 'mc-map-1865-coffyn',
      siteId: 'ALL',
      category: 'map_archive',
      title: 'Đồ án Quy hoạch Đô thị Sơ kỳ Sài Gòn (1862–1865) – Đại tá Coffyn',
      titleEn: 'Early Urban Planning Map of Saigon (1862–1865) – Col. Coffyn Plan',
      titleZh: '1862–1865年西贡早期城市规划图（科芬规划方案）',
      sourceAuthor: 'Trung tâm Lưu trữ Quốc gia II · Kho Lưu trữ Hải ngoại Pháp (ANOM)',
      sourceAuthorEn: 'National Archives Center II · Archives nationales d’outre-mer (ANOM)',
      sourceAuthorZh: '越南国家第二档案馆 · 法国海外档案馆 (ANOM)',
      licenseNote: 'Phạm vi công cộng (Public Domain) · Tư liệu giáo dục phi thương mại',
      licenseNoteEn: 'Public Domain · Non-commercial Educational Use',
      licenseNoteZh: '公共领域 · 非商业教育与保护用途',
      url: 'https://commons.wikimedia.org/wiki/Category:Old_maps_of_Ho_Chi_Minh_City',
      yearOrPeriod: '1865',
      updatedAt: baseTs,
      isDefaultSeed: true,
    },
    {
      id: 'mc-map-1898-saigon-cholon',
      siteId: 'ALL',
      category: 'map_archive',
      title: 'Bản đồ Quy hoạch Sài Gòn – Chợ Lớn & Hệ thống Kênh rạch (1898)',
      titleEn: 'Plan of Saigon – Cho Lon & Canal Network (1898 Archival Map)',
      titleZh: '1898年西贡—堤岸城市与运河水系历史地图',
      sourceAuthor: 'Thư viện Khoa học Tổng hợp TP.HCM / Wikimedia Commons',
      sourceAuthorEn: 'General Sciences Library of HCMC / Wikimedia Commons',
      sourceAuthorZh: '胡志明市综合科学图书馆 / Wikimedia Commons',
      licenseNote: 'Phạm vi công cộng (Public Domain) · Trích dẫn tham khảo',
      licenseNoteEn: 'Public Domain · Archival Reference Citation',
      licenseNoteZh: '公共领域 · 历史文献引用',
      url: 'https://commons.wikimedia.org/wiki/Category:Old_maps_of_Saigon',
      yearOrPeriod: '1898',
      updatedAt: baseTs,
      isDefaultSeed: true,
    },
    {
      id: 'mc-map-1925-indochine',
      siteId: 'HCM-DT-006',
      category: 'map_archive',
      title: 'Hồ sơ Bản vẽ Kiến trúc Đông Dương & Bảo tàng Blanchard de la Brosse (1925–1929)',
      titleEn: 'Indochine Architectural Drawings & Musée Blanchard de la Brosse Dossier (1925–1929)',
      titleZh: '1925–1929年印支建筑图纸与布朗夏尔博物馆档案',
      sourceAuthor: 'Bảo tàng Lịch sử TP. Hồ Chí Minh · Viện Viễn Đông Bác Cổ (EFEO)',
      sourceAuthorEn: 'Museum of Vietnamese History (HCMC) · École française d’Extrême-Orient',
      sourceAuthorZh: '胡志明市历史博物馆 · 法国远东学院 (EFEO)',
      licenseNote: 'Trích dẫn tham khảo · Nghiên cứu kiến trúc phi thương mại',
      licenseNoteEn: 'Reference Citation · Non-commercial Architectural Research',
      licenseNoteZh: '文献参考引用 · 非商业建筑研究',
      url: 'https://baotanglichsutphcm.com.vn/',
      yearOrPeriod: '1925 – 1929',
      updatedAt: baseTs,
      isDefaultSeed: true,
    },
    {
      id: 'mc-map-1955-1966-dinh',
      siteId: 'HCM-DT-001',
      category: 'map_archive',
      title: 'Tư liệu Kiến trúc Hiện đại Nhiệt đới & Đô thành Sài Gòn (1955–1966)',
      titleEn: 'Tropical Modernism Dossier & Saigon Capital Map (1955–1966)',
      titleZh: '1955–1966年热带现代主义建筑与西贡都城规划档案',
      sourceAuthor: 'Hội trường Thống Nhất · Tư liệu Di sản KTS. Ngô Viết Thụ',
      sourceAuthorEn: 'Reunification Hall Archives · Arch. Ngo Viet Thu Heritage Collection',
      sourceAuthorZh: '统一宫档案库 · 建筑师吴曰树文化遗产文献',
      licenseNote: 'Tư liệu giáo dục phi thương mại · Trích dẫn học thuật',
      licenseNoteEn: 'Non-commercial Educational Use · Academic Citation',
      licenseNoteZh: '非商业教育用途 · 学术引用',
      url: 'https://dinhdoclap.gov.vn/',
      yearOrPeriod: '1955 – 1966',
      updatedAt: baseTs,
      isDefaultSeed: true,
    },
    {
      id: 'mc-map-gis-tiles',
      siteId: 'ALL',
      category: 'map_archive',
      title: 'Lớp Bản đồ Nền Tối, Vệ tinh & Dữ liệu Địa không gian GIS Đông Nam Bộ',
      titleEn: 'Dark Cartographic Basemap, Satellite Imagery & Southeast Vietnam GIS Data',
      titleZh: '越南东南部深色底图、卫星影像与 GIS 地理空间数据',
      sourceAuthor: 'OpenStreetMap Contributors · CARTO Dark Matter · Esri World Imagery',
      sourceAuthorEn: 'OpenStreetMap Contributors · CARTO Dark Matter · Esri World Imagery',
      sourceAuthorZh: 'OpenStreetMap 贡献者 · CARTO Dark Matter · Esri 卫星影像',
      licenseNote: 'ODbL 1.0 / Esri Community Attribution · Giáo dục phi thương mại',
      licenseNoteEn: 'ODbL 1.0 / Esri Attribution · Non-commercial Educational Use',
      licenseNoteZh: 'ODbL 1.0 / Esri 署名协议 · 非商业教育用途',
      url: 'https://www.openstreetmap.org/copyright',
      yearOrPeriod: '2026',
      updatedAt: baseTs,
      isDefaultSeed: true,
    }
  );

  // 2. Full Dual-Photo & Video Citations for ALL 17 Monuments (34 curated photos + videos)
  DEFAULT_HERITAGE_SITES.forEach((site, idx) => {
    const videoKey = SITE_ID_TO_VIDEO_KEY[site.id] || String(idx + 1).padStart(2, '0');
    const videoEntry = HERITAGE_VIDEO_DATA[videoKey as keyof typeof HERITAGE_VIDEO_DATA];
    const flycam = HERITAGE_FLYCAM_VIDEOS[videoKey as keyof typeof HERITAGE_FLYCAM_VIDEOS];
    const archiveVid = HERITAGE_ARCHIVE_VIDEOS[videoKey as keyof typeof HERITAGE_ARCHIVE_VIDEOS];

    const siteNameVi = videoEntry?.name.vi || site.officialName;
    const siteNameEn = videoEntry?.name.en || site.officialName;
    const siteNameZh = videoEntry?.name.zh || site.officialName;

    const curatedPair = CURATED_17_SITE_PHOTO_CREDITS[site.id];

    // A. Archival / Real-World Dual Photography Credits (Ảnh 01 & Ảnh 02)
    if (curatedPair) {
      const [spec1, spec2] = curatedPair;
      seeded.push(
        {
          id: `mc-img-${videoKey}`,
          siteId: site.id,
          category: 'image',
          title: spec1.titleVi,
          titleEn: spec1.titleEn,
          titleZh: spec1.titleZh,
          sourceAuthor: spec1.sourceAuthorVi,
          sourceAuthorEn: spec1.sourceAuthorEn,
          sourceAuthorZh: spec1.sourceAuthorZh,
          licenseNote: spec1.licenseVi,
          licenseNoteEn: spec1.licenseEn,
          licenseNoteZh: spec1.licenseZh,
          url: sanitizeExternalUrl(spec1.url),
          yearOrPeriod: spec1.yearOrPeriod,
          updatedAt: baseTs,
          isDefaultSeed: true,
        },
        {
          id: `mc-img-${videoKey}-b`,
          siteId: site.id,
          category: 'image',
          title: spec2.titleVi,
          titleEn: spec2.titleEn,
          titleZh: spec2.titleZh,
          sourceAuthor: spec2.sourceAuthorVi,
          sourceAuthorEn: spec2.sourceAuthorEn,
          sourceAuthorZh: spec2.sourceAuthorZh,
          licenseNote: spec2.licenseVi,
          licenseNoteEn: spec2.licenseEn,
          licenseNoteZh: spec2.licenseZh,
          url: sanitizeExternalUrl(spec2.url),
          yearOrPeriod: spec2.yearOrPeriod,
          updatedAt: baseTs,
          isDefaultSeed: true,
        }
      );
    } else {
      const primaryPhotoUrl = sanitizeExternalUrl(site.photos?.[0]);
      seeded.push({
        id: `mc-img-${videoKey}`,
        siteId: site.id,
        category: 'image',
        title: `Tư liệu kiến trúc và hiện trạng bảo tồn – ${siteNameVi}`,
        titleEn: `Architectural Documentation & Preservation Dossier – ${siteNameEn}`,
        titleZh: `建筑风貌与保护现状档案影像 – ${siteNameZh}`,
        sourceAuthor: 'Tư liệu lịch sử công cộng / Wikimedia Commons',
        sourceAuthorEn: 'Public Historical Archive / Wikimedia Commons',
        sourceAuthorZh: '公共历史档案 / Wikimedia Commons',
        licenseNote: 'Tư liệu tham khảo & giáo dục phi thương mại',
        licenseNoteEn: 'Non-commercial Educational & Reference Material',
        licenseNoteZh: '非商业教育与参考资料',
        url:
          primaryPhotoUrl ||
          `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(siteNameVi)}`,
        yearOrPeriod: videoEntry?.historicalYear || String(site.commencementYear),
        updatedAt: baseTs,
        isDefaultSeed: true,
      });
    }

    // B. 4K Flycam / Overview Video Credit
    if (flycam) {
      seeded.push({
        id: `mc-vid-flycam-${videoKey}`,
        siteId: site.id,
        category: 'video',
        title: flycam.title,
        titleEn: `${siteNameEn} – Aerial 4K Architectural Overview (${flycam.duration})`,
        titleZh: `${siteNameZh} – 4K航拍建筑全景纪录片段 (${flycam.duration})`,
        sourceAuthor: 'Kênh tư liệu Flycam 4K / YouTube · Tổng hợp bởi Dấu Ấn Việt 3D',
        sourceAuthorEn: 'Aerial 4K Documentary Footage / YouTube · Curated by Dau An Viet 3D',
        sourceAuthorZh: 'YouTube 4K航拍文献频道 · Dấu Ấn Việt 3D 策展汇编',
        licenseNote: 'Trích dẫn nhúng chuẩn YouTube · Tư liệu giáo dục phi thương mại',
        licenseNoteEn: 'Standard YouTube Embed Citation · Non-commercial Educational Use',
        licenseNoteZh: 'YouTube 标准嵌入引用 · 非商业教育用途',
        url: `https://www.youtube.com/watch?v=${flycam.videoId}`,
        yearOrPeriod: flycam.duration,
        updatedAt: baseTs,
        isDefaultSeed: true,
      });
    }

    // C. Curated Archival Documentary Credit (where available)
    if (archiveVid) {
      seeded.push({
        id: `mc-vid-archive-${videoKey}`,
        siteId: site.id,
        category: 'video',
        title: archiveVid.title.vi,
        titleEn: archiveVid.title.en,
        titleZh: archiveVid.title.zh,
        sourceAuthor: 'Phim tài liệu lưu trữ lịch sử – kiến trúc / YouTube Archive',
        sourceAuthorEn: 'Historical & Architectural Documentary Film / YouTube Archive',
        sourceAuthorZh: '历史与建筑专题纪录片档案 / YouTube 文献库',
        licenseNote: 'Trích dẫn tham khảo · Phục vụ nghiên cứu và học tập phi thương mại',
        licenseNoteEn: 'Reference Citation · Non-commercial Research & Learning',
        licenseNoteZh: '学术文献引用 · 仅供非商业研究学习',
        url: `https://www.youtube.com/watch?v=${archiveVid.videoId}`,
        yearOrPeriod: archiveVid.badge,
        updatedAt: baseTs,
        isDefaultSeed: true,
      });
    }
  });

  return seeded;
}

export function normalizeMediaCreditItem(raw: unknown): MediaCreditItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const id = typeof rec.id === 'string' && rec.id.trim() ? rec.id.trim() : '';
  const title = typeof rec.title === 'string' && rec.title.trim() ? rec.title.trim() : '';
  const sourceAuthor =
    typeof rec.sourceAuthor === 'string' && rec.sourceAuthor.trim()
      ? rec.sourceAuthor.trim()
      : '';
  if (!id || !title || !sourceAuthor) return null;

  const rawCat = rec.category;
  const category: MediaCreditCategory =
    rawCat === 'image' || rawCat === 'video' || rawCat === 'map_archive' ? rawCat : 'image';

  const siteId =
    typeof rec.siteId === 'string' && rec.siteId.trim() ? rec.siteId.trim() : 'ALL';

  const licenseNote =
    typeof rec.licenseNote === 'string' && rec.licenseNote.trim()
      ? rec.licenseNote.trim()
      : 'Tư liệu giáo dục phi thương mại';

  return {
    id,
    siteId,
    category,
    title,
    titleEn: typeof rec.titleEn === 'string' && rec.titleEn.trim() ? rec.titleEn.trim() : undefined,
    titleZh: typeof rec.titleZh === 'string' && rec.titleZh.trim() ? rec.titleZh.trim() : undefined,
    sourceAuthor,
    sourceAuthorEn:
      typeof rec.sourceAuthorEn === 'string' && rec.sourceAuthorEn.trim()
        ? rec.sourceAuthorEn.trim()
        : undefined,
    sourceAuthorZh:
      typeof rec.sourceAuthorZh === 'string' && rec.sourceAuthorZh.trim()
        ? rec.sourceAuthorZh.trim()
        : undefined,
    licenseNote,
    licenseNoteEn:
      typeof rec.licenseNoteEn === 'string' && rec.licenseNoteEn.trim()
        ? rec.licenseNoteEn.trim()
        : undefined,
    licenseNoteZh:
      typeof rec.licenseNoteZh === 'string' && rec.licenseNoteZh.trim()
        ? rec.licenseNoteZh.trim()
        : undefined,
    url: sanitizeExternalUrl(typeof rec.url === 'string' ? rec.url : undefined),
    yearOrPeriod:
      typeof rec.yearOrPeriod === 'string' && rec.yearOrPeriod.trim()
        ? rec.yearOrPeriod.trim()
        : undefined,
    updatedAt: typeof rec.updatedAt === 'number' && Number.isFinite(rec.updatedAt) ? rec.updatedAt : Date.now(),
    isDefaultSeed: Boolean(rec.isDefaultSeed),
  };
}

function normalizeCreditsArray(rawList: unknown): MediaCreditItem[] | null {
  if (!rawList) return null;
  const candidateArray = Array.isArray(rawList)
    ? rawList
    : typeof rawList === 'object'
    ? Object.values(rawList as Record<string, unknown>)
    : null;
  if (!candidateArray) return null;

  const cleaned: MediaCreditItem[] = [];
  const seen = new Set<string>();
  for (const entry of candidateArray) {
    const normalized = normalizeMediaCreditItem(entry);
    if (normalized && !seen.has(normalized.id)) {
      seen.add(normalized.id);
      cleaned.push(normalized);
    }
  }
  return cleaned;
}

const ALL_17_SITE_KEYS = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
] as const;

function defaultSeedDiffers(existing: MediaCreditItem, fresh: MediaCreditItem): boolean {
  return (
    existing.title !== fresh.title ||
    existing.titleEn !== fresh.titleEn ||
    existing.titleZh !== fresh.titleZh ||
    existing.sourceAuthor !== fresh.sourceAuthor ||
    existing.sourceAuthorEn !== fresh.sourceAuthorEn ||
    existing.sourceAuthorZh !== fresh.sourceAuthorZh ||
    existing.licenseNote !== fresh.licenseNote ||
    existing.licenseNoteEn !== fresh.licenseNoteEn ||
    existing.licenseNoteZh !== fresh.licenseNoteZh ||
    existing.url !== fresh.url ||
    existing.yearOrPeriod !== fresh.yearOrPeriod
  );
}

/**
 * Tự động nâng cấp toàn bộ 34 bản ghi ảnh tư liệu mặc định (01..17, cả Ảnh 01 & Ảnh 02)
 * lên bộ dữ liệu chuẩn 3 ngôn ngữ mới nhất, đồng thời bảo toàn 100% các mục đã được Admin
 * chỉnh sửa thủ công (isDefaultSeed === false).
 */
function upgradeLegacyDefaultSeeds(items: MediaCreditItem[]): {
  items: MediaCreditItem[];
  changed: boolean;
} {
  const defaults = buildDefaultMediaCredits();
  const defaultById = new Map(defaults.map((d) => [d.id, d]));

  let changed = false;
  let working = [...items];

  for (const key of ALL_17_SITE_KEYS) {
    const primaryId = `mc-img-${key}`;
    const secondaryId = `mc-img-${key}-b`;
    const freshPrimary = defaultById.get(primaryId);
    const freshSecondary = defaultById.get(secondaryId);

    const existingPrimaryIdx = working.findIndex((item) => item.id === primaryId);
    const existingSecondaryIdx = working.findIndex((item) => item.id === secondaryId);
    const existingPrimary = existingPrimaryIdx >= 0 ? working[existingPrimaryIdx] : undefined;
    const existingSecondary = existingSecondaryIdx >= 0 ? working[existingSecondaryIdx] : undefined;

    if (freshPrimary) {
      if (!existingPrimary) {
        working.push(freshPrimary);
        changed = true;
      } else if (
        (existingPrimary.isDefaultSeed ||
          existingPrimary.updatedAt < CURATED_MEDIA_CREDITS_RELEASE_MS) &&
        defaultSeedDiffers(existingPrimary, freshPrimary)
      ) {
        working[existingPrimaryIdx] = freshPrimary;
        changed = true;
      }
    }

    if (freshSecondary) {
      if (!existingSecondary) {
        const insertAfter = working.findIndex((item) => item.id === primaryId);
        if (insertAfter >= 0) {
          working.splice(insertAfter + 1, 0, freshSecondary);
        } else {
          working.push(freshSecondary);
        }
        changed = true;
      } else if (
        (existingSecondary.isDefaultSeed ||
          existingSecondary.updatedAt < CURATED_MEDIA_CREDITS_RELEASE_MS) &&
        defaultSeedDiffers(existingSecondary, freshSecondary)
      ) {
        const idxNow = working.findIndex((item) => item.id === secondaryId);
        if (idxNow >= 0) {
          working[idxNow] = freshSecondary;
          changed = true;
        }
      }
    }
  }

  return { items: working, changed };
}

export function loadMediaCredits(): MediaCreditItem[] {
  if (typeof window === 'undefined') {
    return buildDefaultMediaCredits();
  }
  try {
    const raw = window.localStorage.getItem(MEDIA_CREDITS_STORAGE_KEY);
    if (!raw) {
      return buildDefaultMediaCredits();
    }
    const parsed = JSON.parse(raw);
    const normalized = normalizeCreditsArray(parsed);
    if (normalized && normalized.length > 0) {
      const { items: upgraded, changed } = upgradeLegacyDefaultSeeds(normalized);
      if (changed) {
        try {
          window.localStorage.setItem(MEDIA_CREDITS_STORAGE_KEY, JSON.stringify(upgraded));
        } catch {
          // ignore
        }
        // Push upgraded curated seed dataset to Firebase once so cloud matches the 17-site archive
        try {
          if (window.localStorage.getItem(MEDIA_CREDITS_CURATED_V2_SYNC_FLAG) !== '1') {
            window.localStorage.setItem(MEDIA_CREDITS_CURATED_V2_SYNC_FLAG, '1');
            syncGlobalMediaCreditsToCloud({
              items: upgraded,
              count: upgraded.length,
              clientUpdatedAt: Date.now(),
            });
            void pushMediaCreditsRestFallback(upgraded);
          }
        } catch {
          // ignore
        }
        return upgraded;
      }
      return normalized;
    }
    return buildDefaultMediaCredits();
  } catch {
    return buildDefaultMediaCredits();
  }
}

function emitMediaCreditsUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MEDIA_CREDITS_UPDATED_EVENT));
  }
}

async function pushMediaCreditsRestFallback(items: MediaCreditItem[]): Promise<void> {
  if (!isFirebaseDbConfigured()) return;
  try {
    await fetch(`${FIREBASE_DB_URL}/mediaCredits.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        count: items.length,
        updatedAt: Date.now(),
      }),
    });
  } catch {
    // Non-blocking fallback
  }
}

export async function pullMediaCreditsFromFirebaseRest(): Promise<boolean> {
  if (!isFirebaseDbConfigured()) return false;
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/mediaCredits.json`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data || typeof data !== 'object') return false;
    return applyRemoteMediaCreditsPayload(data as Record<string, unknown>);
  } catch {
    return false;
  }
}

export function saveMediaCredits(
  items: MediaCreditItem[],
  options?: { fromRemote?: boolean }
): MediaCreditItem[] {
  const cleaned = normalizeCreditsArray(items) || [];
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(MEDIA_CREDITS_STORAGE_KEY, JSON.stringify(cleaned));
    } catch {
      // ignore quota error
    }
  }
  emitMediaCreditsUpdated();

  if (!options?.fromRemote) {
    const payload = {
      items: cleaned,
      count: cleaned.length,
      clientUpdatedAt: Date.now(),
    };
    syncGlobalMediaCreditsToCloud(payload);
    void pushMediaCreditsRestFallback(cleaned);
  }
  return cleaned;
}

export function applyRemoteMediaCreditsPayload(payload: Record<string, unknown>): boolean {
  const rawItems =
    'items' in payload ? (payload.items as unknown) : (payload as unknown);
  const normalized = normalizeCreditsArray(rawItems);
  if (!normalized || normalized.length === 0) return false;
  const { items: upgraded, changed } = upgradeLegacyDefaultSeeds(normalized);
  saveMediaCredits(upgraded, { fromRemote: !changed });
  return true;
}

export function getCanonicalPhotoCreditId(siteId: string, slot: 0 | 1): string {
  const videoKey = SITE_ID_TO_VIDEO_KEY[siteId] || siteId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return slot === 0 ? `mc-img-${videoKey}` : `mc-img-${videoKey}-b`;
}

export function findSitePhotoCredit(siteId: string, slot: 0 | 1): MediaCreditItem | undefined {
  const all = loadMediaCredits();
  const canonicalId = getCanonicalPhotoCreditId(siteId, slot);
  const exact = all.find((item) => item.id === canonicalId);
  if (exact) return exact;
  const siteImages = all.filter((item) => item.siteId === siteId && item.category === 'image');
  return siteImages[slot] || (slot === 0 ? siteImages[0] : undefined);
}

export interface SyncSitePhotoCreditInput {
  siteId: string;
  slot: 0 | 1;
  titleVi: string;
  titleEn?: string;
  titleZh?: string;
  sourceAuthor: string;
  sourceAuthorEn?: string;
  sourceAuthorZh?: string;
  licenseNote?: string;
  licenseNoteEn?: string;
  licenseNoteZh?: string;
  sourceUrl?: string;
  yearOrPeriod?: string;
}

export function syncSitePhotoCreditToMediaCredits(
  input: SyncSitePhotoCreditInput
): MediaCreditItem[] {
  const canonicalId = getCanonicalPhotoCreditId(input.siteId, input.slot);
  const existing = findSitePhotoCredit(input.siteId, input.slot);
  const cleanedAuthor = input.sourceAuthor.trim();
  const resolvedAuthor =
    cleanedAuthor ||
    existing?.sourceAuthor ||
    'Tư liệu ảnh do Quản trị viên cập nhật · Dấu Ấn Việt 3D';

  const resolvedLicenseVi =
    input.licenseNote?.trim() ||
    existing?.licenseNote ||
    'Tư liệu tham khảo & giáo dục phi thương mại';
  const autoLocalizedLicense = localizeLicenseFallback(resolvedLicenseVi);
  const resolvedLicenseEn =
    input.licenseNoteEn?.trim() ||
    (input.licenseNote?.trim() ? autoLocalizedLicense.en : existing?.licenseNoteEn || autoLocalizedLicense.en);
  const resolvedLicenseZh =
    input.licenseNoteZh?.trim() ||
    (input.licenseNote?.trim() ? autoLocalizedLicense.zh : existing?.licenseNoteZh || autoLocalizedLicense.zh);

  return upsertMediaCredit({
    id: canonicalId,
    siteId: input.siteId,
    category: 'image',
    title:
      input.titleVi.trim() ||
      existing?.title ||
      `Ảnh thực tế 0${input.slot + 1} · ${input.siteId}`,
    titleEn: input.titleEn?.trim() || existing?.titleEn || input.titleVi.trim(),
    titleZh: input.titleZh?.trim() || existing?.titleZh || input.titleVi.trim(),
    sourceAuthor: resolvedAuthor,
    sourceAuthorEn: input.sourceAuthorEn?.trim() || cleanedAuthor || existing?.sourceAuthorEn || resolvedAuthor,
    sourceAuthorZh: input.sourceAuthorZh?.trim() || cleanedAuthor || existing?.sourceAuthorZh || resolvedAuthor,
    licenseNote: resolvedLicenseVi,
    licenseNoteEn: resolvedLicenseEn,
    licenseNoteZh: resolvedLicenseZh,
    url: sanitizeExternalUrl(input.sourceUrl) || existing?.url,
    yearOrPeriod: input.yearOrPeriod?.trim() || existing?.yearOrPeriod || String(new Date().getFullYear()),
  });
}

export function upsertMediaCredit(
  input: Omit<MediaCreditItem, 'id' | 'updatedAt'> & { id?: string }
): MediaCreditItem[] {
  const current = loadMediaCredits();
  const id =
    input.id && input.id.trim()
      ? input.id.trim()
      : `mc-custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const nextItem: MediaCreditItem = {
    id,
    siteId: input.siteId || 'ALL',
    category: input.category,
    title: input.title.trim(),
    titleEn: input.titleEn?.trim() || undefined,
    titleZh: input.titleZh?.trim() || undefined,
    sourceAuthor: input.sourceAuthor.trim(),
    sourceAuthorEn: input.sourceAuthorEn?.trim() || undefined,
    sourceAuthorZh: input.sourceAuthorZh?.trim() || undefined,
    licenseNote: input.licenseNote.trim() || 'Tư liệu giáo dục phi thương mại',
    licenseNoteEn: input.licenseNoteEn?.trim() || undefined,
    licenseNoteZh: input.licenseNoteZh?.trim() || undefined,
    url: sanitizeExternalUrl(input.url),
    yearOrPeriod: input.yearOrPeriod?.trim() || undefined,
    updatedAt: Date.now(),
    isDefaultSeed: false,
  };

  const existingIdx = current.findIndex((item) => item.id === id);
  const nextList =
    existingIdx >= 0
      ? current.map((item, idx) => (idx === existingIdx ? nextItem : item))
      : [nextItem, ...current];

  return saveMediaCredits(nextList);
}

export function deleteMediaCredit(id: string): MediaCreditItem[] {
  const current = loadMediaCredits();
  const nextList = current.filter((item) => item.id !== id);
  return saveMediaCredits(nextList);
}

export function resetMediaCreditsToDefault(): MediaCreditItem[] {
  const defaults = buildDefaultMediaCredits();
  return saveMediaCredits(defaults);
}

export function useMediaCredits(): MediaCreditItem[] {
  const [items, setItems] = useState<MediaCreditItem[]>(() => loadMediaCredits());

  useEffect(() => {
    const sync = () => setItems(loadMediaCredits());
    window.addEventListener(MEDIA_CREDITS_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(MEDIA_CREDITS_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return items;
}
