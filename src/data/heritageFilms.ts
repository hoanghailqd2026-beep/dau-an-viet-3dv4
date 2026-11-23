import { Language } from '../i18n/types';
import { HeritageSite } from '../types/heritage';

export type HeritageVideoKey =
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09'
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16'
  | '17';

export const HERITAGE_VIDEO_KEYS_ORDERED: readonly HeritageVideoKey[] = [
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

/**
 * Ánh xạ 1-đối-1 tuyệt đối giữa Mã Di sản toàn trang và Mã Video ("01" -> "17").
 * Tuyệt đối không dùng chỉ số mảng (array index) để tránh lệch di tích.
 */
export const SITE_ID_TO_VIDEO_KEY: Record<string, HeritageVideoKey> = {
  'HCM-DT-001': '01',
  'HCM-DT-002': '02',
  'HCM-DT-003': '03',
  'HCM-DT-004': '04',
  'HCM-DT-005': '05',
  'HCM-DT-006': '06',
  'HCM-DT-007': '07',
  'HCM-DT-008': '08',
  'HCM-DT-009': '09',
  'HCM-DT-010': '10',
  'HCM-DT-011': '11',
  'HCM-DT-012': '12',
  'BRVT-DT-001': '13',
  'BRVT-DT-002': '14',
  'BRVT-DT-003': '15',
  'BD-DT-001': '16',
  'BD-DT-002': '17',
};

export const VIDEO_KEY_TO_SITE_ID: Record<HeritageVideoKey, string> = {
  '01': 'HCM-DT-001',
  '02': 'HCM-DT-002',
  '03': 'HCM-DT-003',
  '04': 'HCM-DT-004',
  '05': 'HCM-DT-005',
  '06': 'HCM-DT-006',
  '07': 'HCM-DT-007',
  '08': 'HCM-DT-008',
  '09': 'HCM-DT-009',
  '10': 'HCM-DT-010',
  '11': 'HCM-DT-011',
  '12': 'HCM-DT-012',
  '13': 'BRVT-DT-001',
  '14': 'BRVT-DT-002',
  '15': 'BRVT-DT-003',
  '16': 'BD-DT-001',
  '17': 'BD-DT-002',
};

export type DocumentaryCameraEffect = 'zoom-in' | 'pan-right' | 'zoom-out' | 'pan-left';
export type DocumentaryPhotoSlot = 'historical' | 'real_primary' | 'real_secondary' | 'real_detail';

export interface DocumentaryScene {
  id: string;
  startSec: number;
  endSec: number;
  cameraEffect: DocumentaryCameraEffect;
  photoSlot: DocumentaryPhotoSlot;
  sceneLabel: Record<Language, string>;
  subtitle: Record<Language, string>;
}

export interface HeritageVideoEntry {
  id: HeritageVideoKey;
  siteId: string;
  name: Record<Language, string>;
  locationBadge: Record<Language, string>;
  historicalYear: string;
  architecturalStyle: Record<Language, string>;
  youtubeSearchQuery: string;
  durationSec: 45;
  scenes: [DocumentaryScene, DocumentaryScene, DocumentaryScene, DocumentaryScene];
}

export const DOCUMENTARY_TOTAL_DURATION_SEC = 45;

export const HERITAGE_VIDEO_DATA: Record<HeritageVideoKey, HeritageVideoEntry> = {
  '01': {
    id: '01',
    siteId: 'HCM-DT-001',
    name: {
      vi: 'Dinh Độc Lập',
      en: 'Independence Palace',
      zh: '独立宫',
    },
    locationBadge: {
      vi: 'Quận 1, TP. Hồ Chí Minh',
      en: 'District 1, Ho Chi Minh City',
      zh: '胡志明市第一郡',
    },
    historicalYear: '1868 – 1966',
    architecturalStyle: {
      vi: 'Kiến trúc Hiện đại Nhiệt đới · KTS. Ngô Viết Thụ',
      en: 'Tropical Modernism · Arch. Ngo Viet Thu',
      zh: '热带现代主义建筑 · 建筑师吴曰树',
    },
    youtubeSearchQuery: 'Dinh Độc Lập TP HCM phim tài liệu lịch sử kiến trúc',
    durationSec: 45,
    scenes: [
      {
        id: '01-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · TƯ LIỆU XƯA 1896', en: 'SCENE 01 · 1896 ARCHIVE', zh: '第一幕 · 1896历史档案' },
        subtitle: {
          vi: '1868 – 1962: Từ dấu tích Dinh Norodom cổ trên khuôn viên 12 hecta giữa trung tâm Sài Gòn xưa.',
          en: '1868 – 1962: Originating from the historic Norodom Palace on a 12-hectare estate in central Saigon.',
          zh: '1868–1962年：前身为西贡市中心占地12公顷的诺罗敦宫历史遗址。',
        },
      },
      {
        id: '01-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · MẶT ĐỨNG CHÍNH 1966', en: 'SCENE 02 · 1966 FACADE', zh: '第二幕 · 1966正立面' },
        subtitle: {
          vi: '1966: KTS. Ngô Viết Thụ kiến tạo rèm hoa đá chữ Cát – Hưng – Trung – Chủ hài hòa phong thủy phương Đông.',
          en: '1966: Arch. Ngo Viet Thu crafted auspicious stone bamboo-lattice facades rooted in Eastern philosophy.',
          zh: '1966年：建筑师吴曰树以竹节花格立面融合“吉、兴、中、主”东方哲学空间布局。',
        },
      },
      {
        id: '01-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · KẾT CẤU & HẦM B2', en: 'SCENE 03 · STRUCTURE & B2 BUNKER', zh: '第三幕 · 建筑与B2地下掩体' },
        subtitle: {
          vi: '30/4/1975: Xe tăng 390 & 843 tiến qua cổng chính, khép lại chiến tranh và thống nhất đất nước.',
          en: 'April 30, 1975: Tanks 390 and 843 entered the main gate, marking the historic reunification of Vietnam.',
          zh: '1975年4月30日：390号与843号坦克驶入正门，见证越南国家统一的历史转折。',
        },
      },
      {
        id: '01-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · DI SẢN QUỐC GIA ĐẶC BIỆT', en: 'SCENE 04 · SPECIAL NATIONAL MONUMENT', zh: '第四幕 · 国家级特别遗迹' },
        subtitle: {
          vi: 'Ngày nay: Di tích Quốc gia Đặc biệt lưu giữ nguyên vẹn phòng Khánh tiết, Trình quốc thư và Tứ phương vô sự lầu.',
          en: 'Today: A Special National Monument preserving original state reception halls and rooftop pavilion.',
          zh: '今日：作为国家级特别遗迹，完整保留国书递交大厅、庆节厅与四方无事楼。',
        },
      },
    ],
  },

  '02': {
    id: '02',
    siteId: 'HCM-DT-002',
    name: {
      vi: 'Nhà hát Thành phố',
      en: 'Saigon Opera House',
      zh: '胡志明市大剧院',
    },
    locationBadge: {
      vi: 'Quận 1, TP. Hồ Chí Minh',
      en: 'District 1, Ho Chi Minh City',
      zh: '胡志明市第一郡',
    },
    historicalYear: '1898 – 1900',
    architecturalStyle: {
      vi: 'Tân Cổ điển Flamboyant · Đệ tam Cộng hòa Pháp',
      en: 'Flamboyant Beaux-Arts · French Third Republic',
      zh: '华丽学院派新古典主义建筑',
    },
    youtubeSearchQuery: 'Nhà hát Thành phố Hồ Chí Minh phim tài liệu kiến trúc lịch sử',
    durationSec: 45,
    scenes: [
      {
        id: '02-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · BƯU ẢNH 1920', en: 'SCENE 01 · 1920 POSTCARD', zh: '第一幕 · 1920历史影像' },
        subtitle: {
          vi: '01/01/1900: Khánh thành tại Công trường Lam Sơn, lấy cảm hứng từ cung điện Petit Palais ở Paris.',
          en: 'Jan 1, 1900: Inaugurated on Lam Son Square, inspired by the Petit Palais in Paris.',
          zh: '1900年1月1日：于蓝山广场正式揭幕，灵感源自巴黎小皇宫。',
        },
      },
      {
        id: '02-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · MẶT TIỀN BEAUX-ARTS', en: 'SCENE 02 · BEAUX-ARTS FACADE', zh: '第二幕 · 学院派正立面' },
        subtitle: {
          vi: 'Cặp tượng nữ thần nghệ thuật nâng vòm cửa chính cùng hệ phù điêu đá khắc tinh xảo mang từ Pháp sang.',
          en: 'Sculpted stone goddesses flank the grand arched portico beneath authentic French relief carvings.',
          zh: '入口拱门两侧女神石雕与源自法国的精致浮雕相映成辉。',
        },
      },
      {
        id: '02-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · ÂM HỌC KHÁN PHÒNG', en: 'SCENE 03 · ACOUSTIC HALL', zh: '第三幕 · 声学观众厅' },
        subtitle: {
          vi: 'Khán phòng hình móng ngựa 3 tầng đạt chuẩn âm học châu Âu cổ điển, được đại trùng tu nguyên bản năm 1998.',
          en: 'Its 3-tier horseshoe auditorium features European acoustics and was faithfully restored in 1998.',
          zh: '三层马蹄形观众厅采用欧洲古典声学设计，并于1998年完成原貌修复。',
        },
      },
      {
        id: '02-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · THÁNH ĐƯỜNG NGHỆ THUẬT', en: 'SCENE 04 · PERFORMING ARTS ICON', zh: '第四幕 · 百年艺术殿堂' },
        subtitle: {
          vi: 'Di tích Kiến trúc Nghệ thuật cấp Quốc gia — trái tim biểu diễn giao hưởng và sân khấu đương đại TP.HCM.',
          en: 'National Architectural Monument — vibrant home to symphony concerts and contemporary stage arts.',
          zh: '国家级建筑艺术遗迹，至今仍是交响乐与当代舞台艺术的核心殿堂。',
        },
      },
    ],
  },

  '03': {
    id: '03',
    siteId: 'HCM-DT-003',
    name: {
      vi: 'Bưu điện Trung tâm Sài Gòn',
      en: 'Saigon Central Post Office',
      zh: '西贡中央邮局',
    },
    locationBadge: {
      vi: 'Quận 1, TP. Hồ Chí Minh',
      en: 'District 1, Ho Chi Minh City',
      zh: '胡志明市第一郡',
    },
    historicalYear: '1886 – 1891',
    architecturalStyle: {
      vi: 'Tân Cổ điển kết hợp vòm thép Eiffel',
      en: 'Neoclassical & Eiffel Iron Truss Vault',
      zh: '新古典主义与埃菲尔铁艺穹顶',
    },
    youtubeSearchQuery: 'Bưu điện Trung tâm Sài Gòn phim tài liệu kiến trúc lịch sử',
    durationSec: 45,
    scenes: [
      {
        id: '03-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · HÔTEL DES POSTES 1900', en: 'SCENE 01 · 1900 ARCHIVE', zh: '第一幕 · 1900邮政大楼' },
        subtitle: {
          vi: '1886 – 1891: Công trình do KTS. Villedieu thiết kế, kết nối mạng lưới điện tín Đông Dương với thế giới.',
          en: '1886 – 1891: Designed by Alfred Foulhoux & Villedieu as Indochina’s premier telegraph and postal hub.',
          zh: '1886–1891年：由建筑师维尔迪厄设计，曾是连通印支与世界的邮政电报枢纽。',
        },
      },
      {
        id: '03-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · ĐỒNG HỒ MẶT TIỀN', en: 'SCENE 02 · CLOCK FACADE', zh: '第二幕 · 正立面大钟' },
        subtitle: {
          vi: 'Mặt tiền vàng kem trang trọng với chiếc đồng hồ cổ khổng lồ và bảng danh nhân khoa học – phát minh nhân loại.',
          en: 'Ochre-gold Neoclassical facade crowned by a monumental mechanical clock and engraved plaques of inventors.',
          zh: '标志性的明黄外立面嵌有巨型古典时钟与人类科学先驱铭牌。',
        },
      },
      {
        id: '03-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · VÒM THÉP ĐẠI SẢNH', en: 'SCENE 03 · IRON ARCHED HALL', zh: '第三幕 · 铁艺拱顶大厅' },
        subtitle: {
          vi: 'Hệ vòm thép xanh ngọc vượt nhịp rộng, buồng điện thoại gỗ xưa và hai tấm bản đồ lịch sử Nam Kỳ 1892.',
          en: 'Sweeping seafoam iron roof arches shelter vintage wooden phone booths and 1892 Cochinchina telegraph maps.',
          zh: '大跨度蓝绿色铁艺穹顶之下，保留着百年木制电话亭与1892年历史地图。',
        },
      },
      {
        id: '03-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · NHỊP SỐNG BƯU CHÍNH 135 NĂM', en: 'SCENE 04 · 135 YEARS IN SERVICE', zh: '第四幕 · 135年活态遗产' },
        subtitle: {
          vi: 'Hơn 135 năm qua, Bưu điện Trung tâm vẫn hoạt động liên tục, đón hàng triệu lượt du khách gửi thư từ trái tim Sài Gòn.',
          en: 'For over 135 years, the post office has remained continuously active as a living architectural landmark.',
          zh: '一百三十五年来始终保持邮政运营，是西贡极具生命力的活态建筑遗产。',
        },
      },
    ],
  },

  '04': {
    id: '04',
    siteId: 'HCM-DT-004',
    name: {
      vi: 'Chợ Bến Thành',
      en: 'Ben Thanh Market',
      zh: '滨城市场',
    },
    locationBadge: {
      vi: 'Quận 1, TP. Hồ Chí Minh',
      en: 'District 1, Ho Chi Minh City',
      zh: '胡志明市第一郡',
    },
    historicalYear: '1912 – 1914',
    architecturalStyle: {
      vi: 'Kiến trúc Đông Dương sơ kỳ & Tháp đồng hồ 3 mặt',
      en: 'Early Indochine & Three-Faced Clock Tower',
      zh: '早期印支建筑与三面钟楼',
    },
    youtubeSearchQuery: 'Chợ Bến Thành TP HCM phim tài liệu lịch sử kiến trúc',
    durationSec: 45,
    scenes: [
      {
        id: '04-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · LES HALLES CENTRALES 1914', en: 'SCENE 01 · 1914 MARKET HALL', zh: '第一幕 · 1914中央市场' },
        subtitle: {
          vi: '1912 – 1914: Hãng Brossard & Mopin xây dựng trên nền ao Boresse cũ, thay thế ngôi chợ ven sông Bến Nghé.',
          en: '1912 – 1914: Built by Brossard & Mopin over reclaimed marshland to serve as Saigon’s grand central market.',
          zh: '1912–1914年：由布罗萨德与莫潘公司兴建，取代旧西贡河畔市场成为城市商贸中心。',
        },
      },
      {
        id: '04-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · THÁP ĐỒNG HỒ CỬA NAM', en: 'SCENE 02 · SOUTH GATE CLOCK TOWER', zh: '第二幕 · 南门钟楼' },
        subtitle: {
          vi: 'Biểu tượng Tháp đồng hồ Cửa Nam cùng 12 bức phù điêu gốm Biên Hòa khắc họa sản vật ba miền Nam Bộ.',
          en: 'Iconic South Gate clock tower adorned with 12 Bien Hoa ceramic reliefs depicting regional produce.',
          zh: '南门标志性钟楼与十二幅边和陶瓷浮雕，展现越南南部丰富的农渔物产。',
        },
      },
      {
        id: '04-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · 4 CỬA ĐÔNG TÂY NAM BẮC', en: 'SCENE 03 · FOUR CARDINAL GATES', zh: '第三幕 · 四方通廊结构' },
        subtitle: {
          vi: 'Diện tích 13.056 m² với 4 cửa chính Đông – Tây – Nam – Bắc và hệ mái vì kèo thép thông gió nhiệt đới.',
          en: 'Spanning 13,056 m² with four cardinal gates and a ventilated steel-truss hall tailored for the tropics.',
          zh: '占地一万三千余平方米，设东南西北四大正门与高挑通风的钢架大棚。',
        },
      },
      {
        id: '04-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · BIỂU TƯỢNG THƯƠNG MẠI SÀI GÒN', en: 'SCENE 04 · COMMERCIAL LANDMARK', zh: '第四幕 · 城市记忆地标' },
        subtitle: {
          vi: 'Hơn một thế kỷ giao thương sầm uất, Chợ Bến Thành trở thành biểu tượng văn hóa – du lịch đặc trưng của TP.HCM.',
          en: 'For over a century, Ben Thanh Market has stood as Ho Chi Minh City’s quintessential cultural landmark.',
          zh: '历经百余年商贸繁荣，滨城市场已成为胡志明市最具代表性的城市文化地标。',
        },
      },
    ],
  },

  '05': {
    id: '05',
    siteId: 'HCM-DT-005',
    name: {
      vi: 'Nhà thờ Chính tòa Đức Bà Sài Gòn',
      en: 'Notre-Dame Cathedral Basilica of Saigon',
      zh: '西贡圣母大教堂（红教堂）',
    },
    locationBadge: {
      vi: 'Quận 1, TP. Hồ Chí Minh',
      en: 'District 1, Ho Chi Minh City',
      zh: '胡志明市第一郡',
    },
    historicalYear: '1877 – 1880',
    architecturalStyle: {
      vi: 'Romanesque kết hợp Gothic · KTS. Jules Bourard',
      en: 'Romanesque Revival & Gothic · Arch. Jules Bourard',
      zh: '罗马式与哥特式复兴建筑',
    },
    youtubeSearchQuery: 'Nhà thờ Đức Bà Sài Gòn phim tài liệu lịch sử kiến trúc',
    durationSec: 45,
    scenes: [
      {
        id: '05-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · TƯ LIỆU 1900', en: 'SCENE 01 · 1900 ARCHIVE', zh: '第一幕 · 1900历史照片' },
        subtitle: {
          vi: '1877 – 1880: Khởi công theo đồ án KTS. Jules Bourard với toàn bộ gạch trần và vật liệu vận chuyển từ Marseille.',
          en: '1877 – 1880: Built to Jules Bourard’s design using exposed red bricks and materials shipped from Marseille.',
          zh: '1877–1880年：按建筑师朱尔斯·布拉尔设计建造，全套红砖与建材均自马赛海运而来。',
        },
      },
      {
        id: '05-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · HAI THÁP CHUÔNG 57,6M', en: 'SCENE 02 · TWIN 57.6M SPIRES', zh: '第二幕 · 57.6米双钟楼' },
        subtitle: {
          vi: '1895: Lắp đặt thêm hai tháp nhọn kẽm cao 57,6m cùng bộ 6 đại hồng chung đồng âm sắc hiếm có.',
          en: '1895: Twin octagonal zinc spires raised the bell towers to 57.6 m, housing six resonant French bronze bells.',
          zh: '1895年：加建两座高57.6米的八角锌顶尖塔，内部悬置六口法国铸造大铜钟。',
        },
      },
      {
        id: '05-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · HOA HỒNG KÍNH & HẬU CUNG', en: 'SCENE 03 · ROSE WINDOW & CHEVET', zh: '第三幕 · 玫瑰花窗与圣坛' },
        subtitle: {
          vi: 'Cửa sổ Hoa hồng Chartres, hệ vòm cuốn hành lang và hậu cung 5 nhà nguyện tỏa tia không cần cột chống phụ.',
          en: 'Featuring a Chartres-style rose window, vaulted nave arcades, and a five-chapel radiating apse.',
          zh: '正立面玫瑰花窗、拱廊中殿以及五座放射状礼拜堂构成庄严对称的建筑比例。',
        },
      },
      {
        id: '05-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · VƯƠNG CUNG THÁNH ĐƯỜNG', en: 'SCENE 04 · MINOR BASILICA', zh: '第四幕 · 宗座圣殿' },
        subtitle: {
          vi: '1962: Tòa thánh Vatican phong tước Vương cung Thánh đường — kiệt tác gạch trần đỏ rực qua gần 150 năm.',
          en: '1962: Elevated to Minor Basilica status — glowing red Marseille brickwork preserved for nearly 150 years.',
          zh: '1962年获教廷封为宗座圣殿，近一百五十年来砖石本色历久弥新。',
        },
      },
    ],
  },

  '06': {
    id: '06',
    siteId: 'HCM-DT-006',
    name: {
      vi: 'Bảo tàng Lịch sử Thành phố Hồ Chí Minh',
      en: 'Museum of Vietnamese History (HCMC)',
      zh: '胡志明市历史博物馆',
    },
    locationBadge: {
      vi: 'Quận 1, TP. Hồ Chí Minh',
      en: 'District 1, Ho Chi Minh City',
      zh: '胡志明市第一郡',
    },
    historicalYear: '1926 – 1929',
    architecturalStyle: {
      vi: 'Đông Dương (Indochinois) · KTS. Auguste Delaval',
      en: 'Indochine Style · Arch. Auguste Delaval',
      zh: '印支风格建筑 · 建筑师奥古斯特·德拉瓦尔',
    },
    youtubeSearchQuery: 'Bảo tàng Lịch sử Thành phố Hồ Chí Minh phim tài liệu kiến trúc',
    durationSec: 45,
    scenes: [
      {
        id: '06-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · MUSÉE BLANCHARD DE LA BROSSE 1929', en: 'SCENE 01 · 1929 MUSEUM', zh: '第一幕 · 1929布朗夏尔博物馆' },
        subtitle: {
          vi: '01/01/1929: Khánh thành với tên gọi Musée Blanchard de la Brosse ngay sát Thảo Cầm Viên Sài Gòn.',
          en: 'Jan 1, 1929: Inaugurated as Musée Blanchard de la Brosse beside the Saigon Botanical Gardens.',
          zh: '1929年1月1日：紧邻西贡动植物园落成，原名布朗夏尔·德·拉·布罗斯博物馆。',
        },
      },
      {
        id: '06-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · THÁP BÁT GIÁC ĐÔNG DƯƠNG', en: 'SCENE 02 · OCTAGONAL TOWER', zh: '第二幕 · 印支八角重檐塔' },
        subtitle: {
          vi: 'Tháp bát giác hai tầng mái ngói ống men ngọc kết hợp khung kết cấu bê tông cốt thép phương Tây.',
          en: 'Signature double-tiered octagonal tower crowned with glazed tiles over French reinforced concrete.',
          zh: '重檐八角宝塔融合琉璃瓦顶与法式钢筋混凝土结构，奠定印支建筑典范。',
        },
      },
      {
        id: '06-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · 40.000 HIỆN VẬT QUÝ', en: 'SCENE 03 · 40,000 ARTIFACTS', zh: '第三幕 · 四万余件馆藏珍品' },
        subtitle: {
          vi: 'Nơi lưu giữ hơn 40.000 hiện vật văn hóa Óc Eo, Chămpa, Đông Sơn và gốm sứ cổ khu vực Đông Nam Á.',
          en: 'Safeguarding over 40,000 archaeological treasures from Oc Eo, Champa, Dong Son, and Southeast Asia.',
          zh: '馆藏逾四万件珍贵文物，涵盖喔吪文化、占婆雕刻、东山铜鼓及东南亚古陶瓷。',
        },
      },
      {
        id: '06-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · KHO BÁU DI SẢN NAM BỘ', en: 'SCENE 04 · HERITAGE TREASURY', zh: '第四幕 · 南部历史文化宝库' },
        subtitle: {
          vi: 'Hành lang thoáng rộng mở ra sân vườn nhiệt đới, đưa người xem xuyên suốt 3.000 năm lịch sử dựng nước.',
          en: 'Open-air verandas and tropical courtyards frame a journey across 3,000 years of Vietnamese history.',
          zh: '通透回廊环绕热带园林，引领观众穿行于三千年历史文明长河之中。',
        },
      },
    ],
  },

  '07': {
    id: '07',
    siteId: 'HCM-DT-007',
    name: {
      vi: 'Bến Nhà Rồng – Bảo tàng Hồ Chí Minh',
      en: 'Nha Rong Wharf – Ho Chi Minh Museum',
      zh: '龙屋港（胡志明博物馆）',
    },
    locationBadge: {
      vi: 'Quận 4, TP. Hồ Chí Minh',
      en: 'District 4, Ho Chi Minh City',
      zh: '胡志明市第四郡',
    },
    historicalYear: '1862 – 1863',
    architecturalStyle: {
      vi: 'Kiến trúc Pháp thuộc & Mái Lưỡng long chầu nguyệt',
      en: 'French Colonial & Twin-Dragon Roof Crest',
      zh: '法式殖民建筑与双龙朝月屋脊',
    },
    youtubeSearchQuery: 'Bến Nhà Rồng Bảo tàng Hồ Chí Minh phim tài liệu lịch sử',
    durationSec: 45,
    scenes: [
      {
        id: '07-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · THƯƠNG CẢNG 1900', en: 'SCENE 01 · 1900 HARBOR', zh: '第一幕 · 1900年西贡港' },
        subtitle: {
          vi: '1863: Trụ sở Hãng vận tải biển Messageries Maritimes bên ngã ba sông Sài Gòn – rạch Bến Nghé.',
          en: '1863: Built as Messageries Maritimes Headquarters at the confluence of the Saigon River and Ben Nghe Canal.',
          zh: '1863年：建于西贡河与滨义涌交汇处，原为法国海运公司总部大楼。',
        },
      },
      {
        id: '07-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · LƯỠNG LONG CHẦU NGUYỆT', en: 'SCENE 02 · TWIN DRAGONS CREST', zh: '第二幕 · 双龙朝月屋顶' },
        subtitle: {
          vi: 'Độc đáo cặp rồng men gốm uốn lượn theo mô-típ Lưỡng long chầu nguyệt trên mái ngói âm dương Tây phương.',
          en: 'Distinctive ceramic twin-dragon roof ornament uniting Vietnamese symbolism with French colonial arcades.',
          zh: '西式拱廊建筑屋脊上巧妙融入越南传统陶瓷“双龙朝月”雕饰，因而得名龙屋。',
        },
      },
      {
        id: '07-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · DẤU MỐC 05/6/1911', en: 'SCENE 03 · JUNE 5, 1911 MILESTONE', zh: '第三幕 · 1911年6月5日启航' },
        subtitle: {
          vi: '05/6/1911: Từ cầu cảng này, người thanh niên Nguyễn Tất Thành lên tàu Amiral Latouche-Tréville ra đi tìm đường cứu nước.',
          en: 'June 5, 1911: From this pier, young Nguyen Tat Thanh boarded the Amiral Latouche-Tréville to seek national salvation.',
          zh: '1911年6月5日：青年阮必成从这座码头登上“拉图什-特雷维尔海军上将号”启程救国。',
        },
      },
      {
        id: '07-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · ĐỊA CHỈ ĐỎ BÊN SÔNG SÀI GÒN', en: 'SCENE 04 · SAIGON RIVER HERITAGE', zh: '第四幕 · 河畔历史纪念馆' },
        subtitle: {
          vi: 'Ngày nay là Bảo tàng Hồ Chí Minh chi nhánh TP.HCM, lưu giữ hàng nghìn hiện vật quý về cuộc đời Chủ tịch Hồ Chí Minh.',
          en: 'Today serving as the Ho Chi Minh Museum HCMC Branch, preserving priceless historical documents and artifacts.',
          zh: '如今为胡志明博物馆胡志明市分馆，珍藏数千件关于胡志明主席生平的珍贵文物。',
        },
      },
    ],
  },

  '08': {
    id: '08',
    siteId: 'HCM-DT-008',
    name: {
      vi: 'Lăng Tả quân Lê Văn Duyệt',
      en: 'Tomb of General Le Van Duyet (Lang Ong Ba Chieu)',
      zh: '黎文悦左军陵（翁婆沼陵）',
    },
    locationBadge: {
      vi: 'Quận Bình Thạnh, TP. Hồ Chí Minh',
      en: 'Binh Thanh District, Ho Chi Minh City',
      zh: '胡志明市平盛郡',
    },
    historicalYear: '1832 – 1848',
    architecturalStyle: {
      vi: 'Lăng miếu cổ truyền Nam Bộ & Nghệ thuật Khảm sành sứ',
      en: 'Traditional Southern Mausoleum & Porcelain Mosaic',
      zh: '南部传统陵庙与镶瓷工艺建筑',
    },
    youtubeSearchQuery: 'Lăng Ông Bà Chiểu Tả quân Lê Văn Duyệt phim tài liệu lịch sử',
    durationSec: 45,
    scenes: [
      {
        id: '08-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · GIA ĐỊNH XƯA 1920', en: 'SCENE 01 · 1920 GIA DINH', zh: '第一幕 · 1920嘉定古影' },
        subtitle: {
          vi: '1832 – 1848: An táng Đức Tả quân Lê Văn Duyệt, Tổng trấn Gia Định Thành có công lớn mở mang vùng đất Nam Bộ.',
          en: '1832 – 1848: Resting place of General Le Van Duyet, revered Viceroy of historic Gia Dinh Citadel.',
          zh: '1832–1848年：安葬嘉定城总镇黎文悦左军，纪念其开拓保护越南南部的卓越功勋。',
        },
      },
      {
        id: '08-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · CỔNG TAM QUAN CỔ', en: 'SCENE 02 · TAM QUAN GATE', zh: '第二幕 · 传统三门牌坊' },
        subtitle: {
          vi: 'Cổng Tam Quan dựng năm 1949 nổi bật với chữ Hán "Thượng Công Miếu" và mái ngói âm dương lưu ly.',
          en: 'The 1949 Tam Quan triple gate bears gilded calligraphy and sweeping Southern yin-yang ceramic roof tiles.',
          zh: '建于1949年的三门牌坊高悬“上公庙”匾额，覆盖绚丽釉面阴阳瓦顶。',
        },
      },
      {
        id: '08-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · NGHỆ THUẬT KHẢM SÀNH SỨ', en: 'SCENE 03 · PORCELAIN MOSAIC', zh: '第三幕 · 碎瓷镶嵌艺术' },
        subtitle: {
          vi: 'Kiệt tác chạm gỗ sơn son thếp vàng cùng nghệ thuật khảm mảnh sành sứ tứ linh Long – Lân – Quy – Phụng.',
          en: 'Exquisite gilded woodcarvings and intricate broken-porcelain mosaics of the Four Sacred Beasts.',
          zh: '殿内朱漆贴金木雕与龙麟龟凤四灵碎瓷镶嵌技艺堪称岭南绝技。',
        },
      },
      {
        id: '08-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · TÍN NGƯỠNG DÂN GIAN GIA ĐỊNH', en: 'SCENE 04 · LIVING FOLK HERITAGE', zh: '第四幕 · 嘉定民俗信仰核心' },
        subtitle: {
          vi: 'Di tích Lịch sử – Văn hóa cấp Quốc gia, điểm tựa tâm linh gắn bó sâu sắc với cư dân Sài Gòn – Gia Định.',
          en: 'A National Historical-Cultural Monument deeply cherished in Saigon – Gia Dinh’s living spiritual traditions.',
          zh: '作为国家级历史文化遗迹，数百年来始终是西贡—嘉定民众的重要精神纽带。',
        },
      },
    ],
  },

  '09': {
    id: '09',
    siteId: 'HCM-DT-009',
    name: {
      vi: 'Khu di tích lịch sử Địa đạo Củ Chi',
      en: 'Cu Chi Tunnels Historical Site',
      zh: '古芝地道历史遗迹区',
    },
    locationBadge: {
      vi: 'Huyện Củ Chi, TP. Hồ Chí Minh',
      en: 'Cu Chi District, Ho Chi Minh City',
      zh: '胡志明市古芝县',
    },
    historicalYear: '1948 – 1975',
    architecturalStyle: {
      vi: 'Công trình Quân sự Ngầm 3 tầng dưới lòng đất sét đá ong',
      en: '3-Level Subterranean Laterite-Clay Tunnel Network',
      zh: '红土层下三层地下军事防御体系',
    },
    youtubeSearchQuery: 'Địa đạo Củ Chi phim tài liệu lịch sử chiến tranh Việt Nam',
    durationSec: 45,
    scenes: [
      {
        id: '09-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · TƯ LIỆU ĐẤT THÉP 1967', en: 'SCENE 01 · 1967 IRON LAND ARCHIVE', zh: '第一幕 · 1967钢铁之地档案' },
        subtitle: {
          vi: '1948 – 1967: Khởi đầu từ những đoạn hầm tránh càn ở Tân Phú Trung – Phước Vĩnh An và phát triển thành "đô thị ngầm".',
          en: '1948 – 1967: Born as local shelter trenches and expanded into an undefeated underground fortress.',
          zh: '1948–1967年：从早期抗法防空洞逐步拓展为举世闻名的地下钢铁长城。',
        },
      },
      {
        id: '09-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · HỆ THỐNG 3 TẦNG 250 KM', en: 'SCENE 02 · 3-TIER 250 KM NETWORK', zh: '第二幕 · 250公里三层地道' },
        subtitle: {
          vi: 'Tổng chiều dài hơn 250 km đào hoàn toàn bằng tay trong tầng đất sét pha đá ong tự nhiên sâu 3 đến 12 mét.',
          en: 'Over 250 km hand-excavated across three levels (3 m to 12 m deep) in self-supporting laterite clay.',
          zh: '在坚硬红土中纯手工开挖深达3至12米的三层地道，总长超过250公里。',
        },
      },
      {
        id: '09-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · NẮP HẦM & BẾP HOÀNG CẦM', en: 'SCENE 03 · CONCEALED HATCH & STOVES', zh: '第三幕 · 伪装入口与黄琴灶' },
        subtitle: {
          vi: 'Tích hợp nắp hầm ngụy trang lá khô, ụ mối thông hơi, bếp Hoàng Cầm giấu khói và hầm quân y dã chiến.',
          en: 'Engineered with leaf-camouflaged hatches, termite-mound air vents, and smokeless Hoang Cam stoves.',
          zh: '配备落叶伪装入口、蚁丘式隐蔽通气孔、无烟黄琴灶与地下战地手术室。',
        },
      },
      {
        id: '09-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · KỲ TÍCH ĐỊA ĐẠO THẾ KỶ XX', en: 'SCENE 04 · 20TH-CENTURY MARVEL', zh: '第四幕 · 二十世纪地下奇迹' },
        subtitle: {
          vi: 'Di tích Quốc gia Đặc biệt — mắt xích trung tâm của Tuyến 1 nối liền Củ Chi, Tam Giác Sắt Bình Dương và Long Phước.',
          en: 'Special National Monument — centerpiece of Route 1 linking Cu Chi, Iron Triangle, and Long Phuoc.',
          zh: '国家级特别遗迹，串联平阳铁三角与巴地隆福地道构成完整的红色地下防线。',
        },
      },
    ],
  },

  '10': {
    id: '10',
    siteId: 'HCM-DT-010',
    name: {
      vi: 'Khu Di tích Khảo cổ học Giồng Cá Vồ',
      en: 'Giong Ca Vo Archaeological Site',
      zh: '榕卡沃考古遗址',
    },
    locationBadge: {
      vi: 'Huyện Cần Giờ, TP. Hồ Chí Minh',
      en: 'Can Gio District, Ho Chi Minh City',
      zh: '胡志明市芹蒢县',
    },
    historicalYear: 'Thế kỷ IV – I TCN (~2.500 năm)',
    architecturalStyle: {
      vi: 'Di chỉ Cư trú & Mộ chum Tiền Óc Eo giữa Rừng ngập mặn',
      en: 'Pre-Oc Eo Jar Burial & Mangrove Settlement Site',
      zh: '红树林古海岛瓮棺葬与前喔吪遗址',
    },
    youtubeSearchQuery: 'Di tích khảo cổ Giồng Cá Vồ Cần Giờ phim tài liệu',
    durationSec: 45,
    scenes: [
      {
        id: '10-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · ĐỊA TẦNG 2.500 NĂM', en: 'SCENE 01 · 2,500-YEAR STRATA', zh: '第一幕 · 2500年前古海岛地层' },
        subtitle: {
          vi: '~500 – 100 TCN: Giồng đất đỏ tự nhiên giữa Khu Dự trữ Sinh quyển Rừng ngập mặn Cần Giờ là nơi cư trú cổ xưa.',
          en: '~500 – 100 BCE: Elevated laterite mound inside the Can Gio Mangrove Biosphere Reserve served as an ancient settlement.',
          zh: '约公元前500–100年：坐落于芹蒢红树林生物圈保护区内的古代沿海聚落高地。',
        },
      },
      {
        id: '10-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · HỆ SINH THÁI CẦN GIỜ', en: 'SCENE 02 · CAN GIO BIOSPHERE', zh: '第二幕 · 芹蒢湿地生态' },
        subtitle: {
          vi: 'Khai quật năm 1993 – 1994 phát lộ hơn 300 mộ chum gốm cùng di cốt và công cụ lao động thời đại Sắt sớm.',
          en: '1993 – 1994 excavations uncovered over 300 ceramic burial jars alongside early Iron Age human remains.',
          zh: '1993–1994年考古发掘出土三百余座早期铁器时代陶制瓮棺墓葬与古人遗骸。',
        },
      },
      {
        id: '10-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · KHUYÊN TAI HAI ĐẦU THÚ', en: 'SCENE 03 · NEPHRITE EARRINGS', zh: '第三幕 · 双兽首玉耳坠' },
        subtitle: {
          vi: 'Cổ vật khuyên tai hai đầu thú bằng đá nephrite và hạt chuỗi thủy tinh chứng minh giao thương hàng hải cổ đại.',
          en: 'Two-headed animal nephrite earrings and glass beads reveal vibrant ancient maritime trade networks.',
          zh: '出土的双兽首软玉耳坠与玻璃珠串，印证古代海上丝绸之路的早期贸易网络。',
        },
      },
      {
        id: '10-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · CỘI NGUỒN SÀI GÒN – NAM BỘ', en: 'SCENE 04 · EARLIEST SAIGON ROOTS', zh: '第四幕 · 南部文明源头' },
        subtitle: {
          vi: 'Di tích Khảo cổ cấp Quốc gia — bằng chứng sống động nhất về lớp cư dân bản địa đầu tiên của vùng đất Sài Gòn.',
          en: 'National Archaeological Monument — pivotal evidence of the earliest prehistoric communities in the Saigon delta.',
          zh: '国家级考古遗迹，为探寻西贡河口最早先民史前文明提供了关键实证。',
        },
      },
    ],
  },

  '11': {
    id: '11',
    siteId: 'HCM-DT-011',
    name: {
      vi: 'Chùa Giác Lâm',
      en: 'Giac Lam Pagoda',
      zh: '觉林古寺',
    },
    locationBadge: {
      vi: 'Quận Tân Bình, TP. Hồ Chí Minh',
      en: 'Tan Binh District, Ho Chi Minh City',
      zh: '胡志明市新平郡',
    },
    historicalYear: '1744',
    architecturalStyle: {
      vi: 'Kiến trúc Chùa cổ Nam Bộ chữ Tam · 98 cột gỗ quý',
      en: 'Three-Hall Southern Timber Temple · 98 Ironwood Pillars',
      zh: '南部传统“三”字形98根木柱古刹',
    },
    youtubeSearchQuery: 'Chùa Giác Lâm Tân Bình ngôi chùa cổ nhất Sài Gòn phim tài liệu',
    durationSec: 45,
    scenes: [
      {
        id: '11-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · TỔ ĐÌNH 1744', en: 'SCENE 01 · FOUNDED 1744', zh: '第一幕 · 1744古刹源流' },
        subtitle: {
          vi: '1744: Do cư sĩ Lý Thụy Long khởi dựng trên gò Cẩm Sơn — ngôi Tổ đình Phật giáo cổ nhất còn lưu giữ tại TP.HCM.',
          en: '1744: Founded on Cam Son Mound — the oldest surviving Buddhist ancestral pagoda in Ho Chi Minh City.',
          zh: '1744年：始建于锦山丘岗之上，是胡志明市现存历史最悠久的佛教祖庭古刹。',
        },
      },
      {
        id: '11-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · KIẾN TRÚC CHỮ TAM 98 CỘT', en: 'SCENE 02 · 98-PILLAR HALL', zh: '第二幕 · 98柱三进大殿' },
        subtitle: {
          vi: 'Kiến trúc chữ Tam (Chính điện – Giảng đường – Trai đường) chống đỡ bởi 98 cột gỗ cẩm lai, gõ đỏ chạm khắc tinh vi.',
          en: 'Three-parallel timber halls supported by 98 carved rosewood and ironwood pillars joined without nails.',
          zh: '前殿、讲堂与斋堂呈“三”字形排列，由98根珍贵硬木雕柱以传统榫卯支撑。',
        },
      },
      {
        id: '11-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · 113 TƯỢNG PHẬT & BẢO THÁP', en: 'SCENE 03 · 113 STATUES & STUPA', zh: '第三幕 · 百尊古佛与舍利塔' },
        subtitle: {
          vi: 'Bảo tồn 113 pho tượng gỗ cổ thế kỷ XVIII–XIX cùng Tháp Xá Lợi 7 tầng hình lục giác uy nghiêm giữa vườn bồ đề.',
          en: 'Houses 113 antique wooden statues from the 18th–19th centuries alongside a seven-story hexagonal stupa.',
          zh: '寺内供奉113尊十八至十九世纪古木雕佛像，庭院耸立七层六角舍利宝塔。',
        },
      },
      {
        id: '11-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · BẢO TÀNG SỐNG NGHỆ THUẬT MỘC', en: 'SCENE 04 · LIVING WOODCRAFT MUSEUM', zh: '第四幕 · 南方木雕活态博物馆' },
        subtitle: {
          vi: '280 năm trầm mặc giữa lòng đô thị, Chùa Giác Lâm là đỉnh cao nghệ thuật điêu khắc gỗ và gốm Nam Bộ.',
          en: 'Standing serene for 280 years, Giac Lam Pagoda exemplifies Southern Vietnamese wooden temple craftsmanship.',
          zh: '历二百八十年沧桑依然古朴庄严，集中展现越南南部传统木雕与陶艺巅峰水准。',
        },
      },
    ],
  },

  '12': {
    id: '12',
    siteId: 'HCM-DT-012',
    name: {
      vi: 'Hội quán Nghĩa An',
      en: 'Nghia An Assembly Hall (Ong Pagoda)',
      zh: '义安会馆（关帝庙）',
    },
    locationBadge: {
      vi: 'Quận 5 (Chợ Lớn), TP. Hồ Chí Minh',
      en: 'District 5 (Cho Lon), Ho Chi Minh City',
      zh: '胡志明市第五郡（堤岸）',
    },
    historicalYear: 'Đầu thế kỷ XIX (~1820)',
    architecturalStyle: {
      vi: 'Miếu thờ Triều Châu · Gốm Cây Mai & Phù điêu Thếp vàng',
      en: 'Teochew Guildhall · Cay Mai Ceramics & Gilded Reliefs',
      zh: '潮州传统会馆 · 梅树陶塑与贴金木雕',
    },
    youtubeSearchQuery: 'Hội quán Nghĩa An Chùa Ông Quận 5 Chợ Lớn phim tài liệu',
    durationSec: 45,
    scenes: [
      {
        id: '12-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · DẤU ẤN CHỢ LỚN XƯA', en: 'SCENE 01 · HISTORIC CHO LON', zh: '第一幕 · 百年堤岸风貌' },
        subtitle: {
          vi: 'Đầu thế kỷ XIX: Cộng đồng người Hoa gốc Triều Châu lập Hội quán bên trục đường Nguyễn Trãi sầm uất vùng Chợ Lớn.',
          en: 'Early 19th century: Built by the Teochew community along historic Nguyen Trai Street in bustling Cho Lon.',
          zh: '十九世纪初：由堤岸潮州先民兴建于阮廌街核心商贸区，俗称堤岸关帝庙。',
        },
      },
      {
        id: '12-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · TƯỢNG GỐM CÂY MAI TRÊN MÁI', en: 'SCENE 02 · CAY MAI CERAMIC ROOFS', zh: '第二幕 · 屋脊梅树陶塑群像' },
        subtitle: {
          vi: 'Bờ nóc mái lợp ngói lưu ly trang trí quần thể tượng gốm Cây Mai sống động tích cổ "Lưỡng long tranh châu".',
          en: 'Glazed roof ridges crowned with vibrant Cay Mai ceramic figurines depicting classic theatrical legends.',
          zh: '琉璃瓦屋脊遍饰栩栩如生的传统彩釉陶塑“双龙抢珠”及戏曲人物群像。',
        },
      },
      {
        id: '12-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · BAO LAM THẾP VÀNG & QUAN CÔNG', en: 'SCENE 03 · GILDED CARVINGS', zh: '第三幕 · 贴金木雕与关公圣殿' },
        subtitle: {
          vi: 'Bên trong nổi bật tượng Quan Thánh Đế Quân, tượng ngựa Xích Thố gỗ cao gần 2m cùng hệ bao lam chạm lộng tinh xảo.',
          en: 'Inside stand the revered Guan Yu shrine, a nearly 2 m Red Hare timber steed, and intricate gilded latticework.',
          zh: '大殿正中供奉关圣帝君，两侧配有近两米高的木雕赤兔马与镂空贴金木雕花罩。',
        },
      },
      {
        id: '12-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · DI SẢN VĂN HÓA ĐA SẮC CHỢ LỚN', en: 'SCENE 04 · CHO LON LIVING HERITAGE', zh: '第四幕 · 多元文化共生遗产' },
        subtitle: {
          vi: 'Di tích Kiến trúc Nghệ thuật cấp Quốc gia — nơi giao thoa nghệ thuật gốm thủ công Sài Gòn – Chợ Lớn.',
          en: 'National Architectural Monument — an extraordinary showcase of Saigon – Cho Lon’s living craft heritage.',
          zh: '国家级建筑艺术遗迹，凝结着西贡—堤岸华人社群百余年的工匠智慧与信仰传承。',
        },
      },
    ],
  },

  '13': {
    id: '13',
    siteId: 'BRVT-DT-001',
    name: {
      vi: 'Bạch Dinh – Villa Blanche',
      en: 'White Palace (Bach Dinh – Villa Blanche)',
      zh: '头顿白宫（白色别墅）',
    },
    locationBadge: {
      vi: 'TP. Vũng Tàu, Bà Rịa - Vũng Tàu',
      en: 'Vung Tau City, Ba Ria - Vung Tau',
      zh: '巴地头顿省头顿市',
    },
    historicalYear: '1898 – 1902',
    architecturalStyle: {
      vi: 'Biệt thự Nghỉ dưỡng Cổ điển Pháp trên sườn Núi Lớn',
      en: 'French Neoclassical Hillside Villa · Cap Saint-Jacques',
      zh: '大山坡法式新古典海景行宫',
    },
    youtubeSearchQuery: 'Bạch Dinh Villa Blanche Vũng Tàu phim tài liệu lịch sử',
    durationSec: 45,
    scenes: [
      {
        id: '13-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · CAP SAINT-JACQUES 1920', en: 'SCENE 01 · 1920 VILLA BLANCHE', zh: '第一幕 · 1920圣雅克角白宫' },
        subtitle: {
          vi: '1898 – 1902: Khởi dựng trên nền pháo đài Phước Thắng cổ ở độ cao 27m sườn Núi Lớn hướng ra Bãi Trước Vũng Tàu.',
          en: '1898 – 1902: Erected atop the old Phuoc Thang fort 27 m up Big Mountain overlooking Vung Tau’s Front Beach.',
          zh: '1898–1902年：建于古福胜炮台旧址之上，依山面海俯瞰头顿前滩壮丽海湾。',
        },
      },
      {
        id: '13-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · TƯỜNG VÔI TRẮNG & NGÓI ĐỎ', en: 'SCENE 02 · WHITE FACADE & BUSTS', zh: '第二幕 · 白墙红瓦与古典雕像' },
        subtitle: {
          vi: 'Tòa biệt thự 3 tầng sơn trắng muốt với 8 pho tượng bán thân Hy Lạp – La Mã khảm sứ màu tinh xảo trên mặt đứng.',
          en: 'Three-story gleaming white facade embellished with eight glazed ceramic Greco-Roman classical busts.',
          zh: '三层纯白外立面嵌有八尊彩色釉面古典半身雕像，与红瓦屋顶交相辉映。',
        },
      },
      {
        id: '13-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · KÝ ỨC VUA THÀNH THÁI', en: 'SCENE 03 · EMPEROR THANH THAI', zh: '第三幕 · 成泰帝历史记忆' },
        subtitle: {
          vi: '1907 – 1916: Nơi ghi dấu giai đoạn bị quản thúc của vị vua yêu nước Thành Thái và trưng bày cổ vật gốm Hòn Cau.',
          en: '1907 – 1916: Remembered for the confinement of patriotic Emperor Thanh Thai, now displaying Hon Cau shipwreck porcelain.',
          zh: '1907–1916年：曾为爱国皇帝成泰帝软禁之处，现陈列罕见的漈州古沉船青花瓷珍品。',
        },
      },
      {
        id: '13-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · ĐIỂM HẸN TUYẾN PHÁP & ĐÔNG DƯƠNG', en: 'SCENE 04 · FRENCH HERITAGE ROUTE', zh: '第四幕 · 跨省法式遗产专线' },
        subtitle: {
          vi: 'Ẩn mình dưới rừng sứ đại thụ trăm năm, Bạch Dinh là cửa ngõ biển kết nối Tuyến 2 với Nhà hát & Bảo tàng TP.HCM.',
          en: 'Shaded by century-old frangipani trees, White Palace links Vung Tau to Saigon’s French architectural heritage.',
          zh: '隐映于百年鸡蛋花古树林荫中，白宫串联头顿海滨与胡志明市法式建筑群落。',
        },
      },
    ],
  },

  '14': {
    id: '14',
    siteId: 'BRVT-DT-002',
    name: {
      vi: 'Quần thể kiến trúc Nhà Lớn Long Sơn',
      en: 'Nha Lon Long Son Architectural Complex',
      zh: '龙山大屋建筑群',
    },
    locationBadge: {
      vi: 'Xã đảo Long Sơn, TP. Vũng Tàu',
      en: 'Long Son Island, Vung Tau',
      zh: '巴地头顿省头顿市龙山岛',
    },
    historicalYear: '1910 – 1929',
    architecturalStyle: {
      vi: 'Quần thể Nhà Gỗ Truyền thống Nam Bộ 2 ha · Ông Trần',
      en: '2-Hectare Traditional Southern Timber Complex',
      zh: '两公顷南部传统木构古建筑群',
    },
    youtubeSearchQuery: 'Nhà Lớn Long Sơn Đền Ông Trần Vũng Tàu phim tài liệu',
    durationSec: 45,
    scenes: [
      {
        id: '14-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · CÔNG CUỘC MỞ ĐẤT 1910', en: 'SCENE 01 · 1910 PIONEERING ERA', zh: '第一幕 · 1910开岛拓荒记忆' },
        subtitle: {
          vi: '1910 – 1929: Ông Trần (Lê Văn Mưu) cùng lưu dân mở đất đảo Long Sơn và dựng quần thể Nhà Lớn rộng 2 hecta.',
          en: '1910 – 1929: Pioneered by Ong Tran (Le Van Muu), uniting settlers to establish the 2-hectare Long Son complex.',
          zh: '1910–1929年：由“陈公”黎文谋率领先民开垦龙山岛并合力兴建占地两公顷的大屋建筑群。',
        },
      },
      {
        id: '14-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · QUẦN THỂ 3 KHU KIẾN TRÚC GỖ', en: 'SCENE 02 · THREE TIMBER COMPOUNDS', zh: '第二幕 · 三大木构功能区' },
        subtitle: {
          vi: 'Gồm 3 khu liên hoàn: Đền thờ Nhà Thánh, khu Nhà Hậu sinh hoạt cộng đồng và Lăng mộ Ông Trần tựa lưng núi Nứa.',
          en: 'Comprising three interconnected zones: Sacred Shrine Hall, communal residence, and Ong Tran’s mountain-backed tomb.',
          zh: '整体分为圣殿祭祀区、公共生活长屋区及依偎在Nứa山脚的陈公陵墓三大区域。',
        },
      },
      {
        id: '14-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · BỘ BÀN GHẾ CỔ & CỘT GỖ QUÝ', en: 'SCENE 03 · ANTIQUE TIMBER CRAFT', zh: '第三幕 · 百年硬木榫卯与古家具' },
        subtitle: {
          vi: 'Toàn bộ vì kèo bằng gỗ quý không dùng đinh sắt, lưu giữ hàng chục bộ trường kỷ khảm xà cừ hơn 100 năm tuổi.',
          en: 'Constructed with nail-free mortise-and-tenon timber joinery and century-old mother-of-pearl inlaid furniture.',
          zh: '建筑梁柱全部采用传统木榫无钉连接，内部珍藏数十套百年螺钿镶嵌古家具。',
        },
      },
      {
        id: '14-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · ĐẠO NGHĨA CỘNG ĐỒNG NAM BỘ', en: 'SCENE 04 · ISLAND HERITAGE', zh: '第四幕 · 南部淳朴乡土风貌' },
        subtitle: {
          vi: 'Di tích Lịch sử – Văn hóa Quốc gia lưu giữ nếp sống thuần hậu "búi tóc, áo bà ba đen, đi chân đất" độc nhất Nam Bộ.',
          en: 'National Monument preserving Long Son’s unique heritage of hospitality, black ba ba attire, and communal spirit.',
          zh: '国家级历史文化遗迹，至今保留着盘发、黑布衣、赤足迎客的南部独特民俗。',
        },
      },
    ],
  },

  '15': {
    id: '15',
    siteId: 'BRVT-DT-003',
    name: {
      vi: 'Khu di tích Địa đạo Long Phước',
      en: 'Long Phuoc Tunnels Historical Site',
      zh: '隆福地道历史遗迹区',
    },
    locationBadge: {
      vi: 'TP. Bà Rịa, Bà Rịa - Vũng Tàu',
      en: 'Ba Ria City, Ba Ria - Vung Tau',
      zh: '巴地头顿省巴地市',
    },
    historicalYear: '1948 – 1975',
    architecturalStyle: {
      vi: 'Hệ thống Địa đạo Kháng chiến 5 cụm ấp liên hoàn',
      en: '5-Hamlet Interconnected Subterranean Tunnel Base',
      zh: '五村联防地下抗战地道体系',
    },
    youtubeSearchQuery: 'Địa đạo Long Phước Bà Rịa Vũng Tàu phim tài liệu',
    durationSec: 45,
    scenes: [
      {
        id: '15-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · TƯ LIỆU KHÁNG CHIẾN 1948', en: 'SCENE 01 · 1948 RESISTANCE BASE', zh: '第一幕 · 1948抗战根据地' },
        subtitle: {
          vi: '1948: Quân dân xã Long Phước khởi đào những tuyến hầm bí mật đầu tiên ngay giữa đồng bằng duyên hải Bà Rịa.',
          en: '1948: Fighters and villagers in Long Phuoc began excavating clandestine defensive tunnels in Ba Ria.',
          zh: '1948年：巴地隆福军民依托地形挖掘隐蔽地道，铸就沿海平原坚固抗战堡垒。',
        },
      },
      {
        id: '15-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · LIÊN HOÀN 5 CỤM ẤP', en: 'SCENE 02 · 5-HAMLET TUNNEL GRID', zh: '第二幕 · 五村连通地道网' },
        subtitle: {
          vi: 'Phát triển thành mạng lưới địa đạo liên hoàn nối thông 5 cụm ấp: Đông, Tây, Nam, Bắc và Phước Hữu.',
          en: 'Expanded into an interconnected underground grid linking five hamlets: East, West, South, North, and Phuoc Huu.',
          zh: '逐步发展为连通东、西、南、北及福友五个村落的地下作战与隐蔽交通网络。',
        },
      },
      {
        id: '15-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · HẦM CHỮ A & CÔNG SỰ NGẦM', en: 'SCENE 03 · A-FRAME SHELTERS', zh: '第三幕 · 人字形地下掩体' },
        subtitle: {
          vi: 'Bố trí hầm chữ A chịu lực, giao thông hào ngầm sâu 3 – 4m cùng trạm quân y và kho lương thực bí mật.',
          en: 'Featuring reinforced A-frame shelters, 3–4 m deep communication shafts, underground clinics, and supply caches.',
          zh: '地下设有抗压人字形掩体、三至四米深交通坑道、地下医疗站与隐蔽粮库。',
        },
      },
      {
        id: '15-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · MẮT XÍCH VÀNH ĐAI ĐỎ', en: 'SCENE 04 · RED BELT CORRIDOR', zh: '第四幕 · 东南部地道走廊节点' },
        subtitle: {
          vi: 'Di tích Quốc gia — cùng Địa đạo Củ Chi và Tam Giác Sắt tạo nên vành đai lòng đất bất khuất miền Đông Nam Bộ.',
          en: 'National Monument — standing alongside Cu Chi and Iron Triangle as Southeast Vietnam’s subterranean shield.',
          zh: '国家级历史遗迹，与古芝地道、铁三角地道共同组成越南东南部不屈的地下防线。',
        },
      },
    ],
  },

  '16': {
    id: '16',
    siteId: 'BD-DT-001',
    name: {
      vi: 'Nhà cổ Trần Công Vàng',
      en: 'Tran Cong Vang Heritage House',
      zh: '陈功黄古宅',
    },
    locationBadge: {
      vi: 'TP. Thủ Dầu Một, Bình Dương',
      en: 'Thu Dau Mot City, Binh Duong',
      zh: '平阳省土龙木市',
    },
    historicalYear: '1889 – 1892',
    architecturalStyle: {
      vi: 'Nhà rường gỗ 5 gian 2 chái Nam Bộ · Chạm khắc Thủ Dầu Một',
      en: '5-Bay 2-Wing Southern Timber House · Thu Dau Mot Carving',
      zh: '平阳五间两厢传统红木雕花大屋',
    },
    youtubeSearchQuery: 'Nhà cổ Trần Công Vàng Thủ Dầu Một Bình Dương phim tài liệu',
    durationSec: 45,
    scenes: [
      {
        id: '16-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · DẤU ẤN PHÚ CƯỜNG 1892', en: 'SCENE 01 · 1892 PHU CUONG', zh: '第一幕 · 1892富强古宅' },
        subtitle: {
          vi: '1889 – 1892: Cụ Trần Công Vàng quy tụ các nghệ nhân mộc tài hoa nhất đất Thủ Dầu Một dựng nhà trong 3 năm liền.',
          en: '1889 – 1892: Built over three years by master Thu Dau Mot woodcarvers commissioned by Tran Cong Vang.',
          zh: '1889–1892年：陈功黄先生汇聚土龙木最顶尖木雕工匠，历时三年精雕细琢落成。',
        },
      },
      {
        id: '16-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · NHÀ CHỮ ĐINH 5 GIAN 2 CHÁI', en: 'SCENE 02 · T-SHAPED TIMBER FRAME', zh: '第二幕 · 五间两厢丁字布局' },
        subtitle: {
          vi: 'Mặt bằng hình chữ Đinh gồm 5 gian 2 chái rộng gần 1.300 m², lợp ngói âm dương trên hệ 36 cột gỗ căm xe – gõ đỏ.',
          en: 'T-shaped 5-bay 2-wing layout spanning ~1,300 m² supported by 36 solid cam xe and go do timber columns.',
          zh: '占地近1300平方米的“丁”字形五间两厢大屋，由36根珍贵硬木柱稳固支撑。',
        },
      },
      {
        id: '16-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · BAO LAM MAI LAN CÚC TRÚC', en: 'SCENE 03 · FOUR SEASONS WOODWORK', zh: '第三幕 · 梅兰菊竹镂空木雕' },
        subtitle: {
          vi: 'Từng vỉ kèo, bao lam, hoành phi đều chạm lộng hai mặt tinh xảo đề tài Mai – Lan – Cúc – Trúc, Bát Tiên, Tứ Linh.',
          en: 'Every truss, lintel, and altar screen showcases double-sided openwork carvings of the Four Seasons and Eight Immortals.',
          zh: '横梁、花罩与匾额双面镂空雕刻梅兰菊竹、八仙与四灵瑞兽，工艺精湛绝伦。',
        },
      },
      {
        id: '16-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · ĐỈNH CAO MỘC NGHỆ BÌNH DƯƠNG', en: 'SCENE 04 · BINH DUONG CRAFT PEAK', zh: '第四幕 · 平阳木雕艺术巅峰' },
        subtitle: {
          vi: 'Hơn 130 năm truyền qua nhiều thế hệ, ngôi nhà cổ là viên ngọc quý của nghệ thuật kiến trúc dân gian đất Thủ.',
          en: 'Preserved for over 130 years by the Tran family, standing as the crown jewel of Binh Duong timber heritage.',
          zh: '历经一百三十余年世代守护，至今仍是平阳土龙木传统民居建筑的璀璨瑰宝。',
        },
      },
    ],
  },

  '17': {
    id: '17',
    siteId: 'BD-DT-002',
    name: {
      vi: 'Khu di tích Địa đạo Tam Giác Sắt – Tây Nam Bến Cát',
      en: 'Iron Triangle Tunnels – Southwest Ben Cat',
      zh: '铁三角地道遗迹（滨吉西南）',
    },
    locationBadge: {
      vi: 'TP. Bến Cát, Bình Dương',
      en: 'Ben Cat City, Binh Duong',
      zh: '平阳省滨吉市',
    },
    historicalYear: '1948 – 1975',
    architecturalStyle: {
      vi: 'Chiến khu Rừng Sến & Địa đạo Chiến lược vùng Bến Cát',
      en: 'Strategic Resistance Tunnel & Command Zone',
      zh: '战略抗战地道与地下指挥中枢',
    },
    youtubeSearchQuery: 'Địa đạo Tam Giác Sắt Tây Nam Bến Cát Bình Dương phim tài liệu',
    durationSec: 45,
    scenes: [
      {
        id: '17-s1',
        startSec: 0,
        endSec: 11,
        cameraEffect: 'zoom-in',
        photoSlot: 'historical',
        sceneLabel: { vi: 'PHÂN CẢNH 01 · TƯ LIỆU TAM GIÁC SẮT 1967', en: 'SCENE 01 · 1967 IRON TRIANGLE', zh: '第一幕 · 1967铁三角历史影像' },
        subtitle: {
          vi: '1948 – 1967: Nằm tại vùng hợp lưu sông Sài Gòn – sông Thị Tính thuộc ba xã An Điền, An Tây và Phú An (Bến Cát).',
          en: '1948 – 1967: Anchored at the Saigon–Thi Tinh river confluence across An Dien, An Tay, and Phu An.',
          zh: '1948–1967年：雄踞西贡河与氏性河交汇处，扼守滨吉安田、安西与富安战略三角地带。',
        },
      },
      {
        id: '17-s2',
        startSec: 11,
        endSec: 22,
        cameraEffect: 'pan-right',
        photoSlot: 'real_primary',
        sceneLabel: { vi: 'PHÂN CẢNH 02 · TƯỢNG ĐÀI CHIẾN KHU LỊCH SỬ', en: 'SCENE 02 · IRON TRIANGLE MEMORIAL', zh: '第二幕 · 铁三角历史纪念区' },
        subtitle: {
          vi: 'Án ngữ cửa ngõ Tây Bắc Sài Gòn, Tam Giác Sắt đối diện bên kia sông với Địa đạo Củ Chi tạo thế gọng kìm bất khả xâm phạm.',
          en: 'Guarding Saigon’s northwest approach directly across the river from Cu Chi in an unbreakable twin-fortress defense.',
          zh: '扼守西贡西北门户，隔西贡河与古芝地道形成互为犄角的钢铁防线。',
        },
      },
      {
        id: '17-s3',
        startSec: 22,
        endSec: 34,
        cameraEffect: 'zoom-out',
        photoSlot: 'real_secondary',
        sceneLabel: { vi: 'PHÂN CẢNH 03 · HỆ THỐNG HẦM CHỈ HUY & GIAO THÔNG HÀO', en: 'SCENE 03 · COMMAND BUNKERS', zh: '第三幕 · 地下指挥部与交通壕' },
        subtitle: {
          vi: 'Hệ thống hầm bí mật, hầm họp chi ủy, kho quân lương và tuyến đường hầm chữ chi vượt qua nhiều chiến dịch càn quét lớn.',
          en: 'Zig-zag subterranean corridors, party committee bunkers, and underground depots withstood massive military sweeps.',
          zh: '迂回曲折的地下坑道、隐蔽指挥所与军粮库历经多次大规模清剿依然屹立不倒。',
        },
      },
      {
        id: '17-s4',
        startSec: 34,
        endSec: 45,
        cameraEffect: 'pan-left',
        photoSlot: 'real_detail',
        sceneLabel: { vi: 'PHÂN CẢNH 04 · BIỂU TƯỢNG ANH HÙNG BÌNH DƯƠNG', en: 'SCENE 04 · BINH DUONG HERITAGE', zh: '第四幕 · 巴地-平阳-西贡联动史诗' },
        subtitle: {
          vi: 'Di tích Quốc gia — điểm cuối hào hùng khép lại hành trình 17 Di sản Văn hóa – Lịch sử vùng Đông Nam Bộ.',
          en: 'National Monument — the heroic final chapter of Southeast Vietnam’s 17 iconic heritage landmarks.',
          zh: '国家级历史遗迹——为越南东南部十七处建筑与历史遗产数字巡礼画上豪迈句点。',
        },
      },
    ],
  },
};

/**
 * Chuẩn hóa bất kỳ mã nào ("01".."17", "1".."17", hoặc "HCM-DT-001".."BD-DT-002")
 * thành đúng mã khóa 1-đối-1 trong HERITAGE_VIDEO_DATA ("01" -> "17").
 */
export function resolveHeritageVideoId(
  siteOrId?: string | Pick<HeritageSite, 'id'> | null
): HeritageVideoKey {
  if (!siteOrId) return '01';
  const raw = (typeof siteOrId === 'string' ? siteOrId : siteOrId.id || '').trim();
  if (!raw) return '01';

  if (raw in HERITAGE_VIDEO_DATA) {
    return raw as HeritageVideoKey;
  }
  if (SITE_ID_TO_VIDEO_KEY[raw]) {
    return SITE_ID_TO_VIDEO_KEY[raw];
  }
  const numeric = Number(raw);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 17) {
    return String(numeric).padStart(2, '0') as HeritageVideoKey;
  }
  return '01';
}

export function getHeritageVideoEntry(
  siteOrId?: string | Pick<HeritageSite, 'id'> | null
): HeritageVideoEntry {
  const key = resolveHeritageVideoId(siteOrId);
  return HERITAGE_VIDEO_DATA[key];
}

export function getVideoCustomStorageKey(heritageId: HeritageVideoKey): string {
  return `video_custom_${heritageId}`;
}

export interface FlycamVideoEntry {
  videoId: string;
  backupVideoId?: string;
  useNoCookie?: boolean;
  title: string;
  duration: string;
}

export const HERITAGE_FLYCAM_VIDEOS: Record<HeritageVideoKey, FlycamVideoEntry> = {
  '01': {
    videoId: 'oCHs_0kypGc',
    title: 'Dinh Độc Lập - Toàn cảnh kiến trúc FPV Flycam 4K',
    duration: '01:01',
  },
  '02': {
    videoId: 'dVe1NGbsaD0',
    title: 'Nhà hát Thành phố - Toàn cảnh kiến trúc Sài Gòn',
    duration: '03:02',
  },
  '03': {
    videoId: 'HwSAOI4nv8o',
    title: 'Bưu điện Trung tâm Sài Gòn - Footage 4K',
    duration: '01:39',
  },
  '04': {
    videoId: 'YBUILYxQOi4',
    title: 'Toàn cảnh Chợ Bến Thành từ góc nhìn Flycam',
    duration: '01:17',
  },
  '05': {
    videoId: 'Tr8ZHjs1p-w',
    title: 'Toàn cảnh Nhà thờ Đức Bà Sài Gòn - Flycam 4K',
    duration: '02:04',
  },
  '06': {
    videoId: 'DW_7kZvt0oU',
    backupVideoId: '6Xleo6OTde8',
    useNoCookie: true,
    title: 'Bảo tàng Lịch sử TP.HCM - Flycam toàn cảnh từ trên cao',
    duration: 'Flycam 4K',
  },
  '07': {
    videoId: '3Gm5J6WT0VU',
    title: 'Toàn cảnh Bến Nhà Rồng - Flycam 4K',
    duration: '01:38',
  },
  '08': {
    videoId: 'M5VIHU_tqdc',
    title: 'Flycam toàn cảnh Lăng Tả quân Lê Văn Duyệt',
    duration: '03:31',
  },
  '09': {
    videoId: 'CVW7vnwzkI4',
    title: 'Địa đạo Củ Chi qua ống kính Flycam 360 độ',
    duration: '04:05',
  },
  '10': {
    videoId: '79zsCck5QCI',
    title: 'Toàn cảnh Di tích khảo cổ học Giồng Cá Vồ',
    duration: '01:01',
  },
  '11': {
    videoId: 'Gx5c8-PBXj4',
    title: 'Không gian kiến trúc cổ tự Chùa Giác Lâm',
    duration: '03:34',
  },
  '12': {
    videoId: 'x8WBCHwdaxs',
    title: 'Kiến trúc nghệ thuật Hội quán Nghĩa An Chợ Lớn',
    duration: '03:48',
  },
  '13': {
    videoId: 'RUKLUlkLiw8',
    title: 'Bạch Dinh Vũng Tàu - Flycam 4K',
    duration: '01:59',
  },
  '14': {
    videoId: 'LJ6NwOsK-Zo',
    title: 'Toàn cảnh Quần thể kiến trúc Nhà Lớn Long Sơn',
    duration: '01:56',
  },
  '15': {
    videoId: 'cScgq15i490',
    title: 'Cận cảnh Di tích lịch sử Địa đạo Long Phước',
    duration: '04:26',
  },
  '16': {
    videoId: 'jUUz-2425Ck',
    title: 'Kiến trúc gỗ truyền thống Nhà cổ Trần Công Vàng',
    duration: '01:06',
  },
  '17': {
    videoId: '-TtWLESmGz0',
    title: 'Toàn cảnh Khu Di tích Địa đạo Tam Giác Sắt',
    duration: '01:00',
  },
};

export interface CuratedArchiveVideoEntry {
  videoId: string;
  backupVideoId?: string;
  embedHost: 'youtube-nocookie' | 'youtube';
  badge: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  backupLabel?: Record<Language, string>;
}

export const HERITAGE_ARCHIVE_VIDEOS: Partial<Record<HeritageVideoKey, CuratedArchiveVideoEntry>> = {
  '02': {
    videoId: 'lIlrxYWONBc',
    embedHost: 'youtube',
    badge: '01:33',
    title: {
      vi: 'Tư liệu kiến trúc & nội thất khán phòng Nhà hát Thành phố',
      en: 'Saigon Opera House Architecture & Auditorium Archive',
      zh: '胡志明市大剧院建筑与观众厅文献资料',
    },
    description: {
      vi: 'Tư liệu lịch sử, kiến trúc mặt tiền & nội thất khán phòng Nhà hát Thành phố (01:33)',
      en: 'Historical documentary, Beaux-Arts facade & auditorium interior of Saigon Opera House (01:33)',
      zh: '胡志明市大剧院历史文献、正立面建筑与观众厅实景影像 (01:33)',
    },
  },
  '04': {
    videoId: 'ir3iI9apC7M',
    backupVideoId: 'rBVK9Uh8h0s',
    embedHost: 'youtube-nocookie',
    badge: '1912–1914',
    title: {
      vi: 'Phim tư liệu lịch sử Chợ Bến Thành (Les Halles Centrales 1912–1914)',
      en: 'Ben Thanh Market Historical Documentary (Les Halles Centrales 1912–1914)',
      zh: '滨城市场历史文献纪录片（1912–1914 中央市场）',
    },
    description: {
      vi: 'Phân cảnh tư liệu lịch sử 1912–1914 Les Halles Centrales & hành trình hơn một thế kỷ Chợ Bến Thành',
      en: '1912–1914 Les Halles Centrales archival documentary & over a century of Ben Thanh Market',
      zh: '1912–1914年中央市场历史文献影像与百年商贸地标记忆',
    },
    backupLabel: {
      vi: 'Nguồn dự phòng (rBVK9Uh8h0s)',
      en: 'Backup Source (rBVK9Uh8h0s)',
      zh: '备用片源 (rBVK9Uh8h0s)',
    },
  },
  '05': {
    videoId: 'kzDKNI-Ygho',
    backupVideoId: 'VhM5z3u1CFc',
    embedHost: 'youtube-nocookie',
    badge: '1877–1880',
    title: {
      vi: 'Phim tư liệu lịch sử xây dựng Nhà thờ Đức Bà Sài Gòn (1877–1880)',
      en: 'Saigon Notre-Dame Cathedral Construction Documentary (1877–1880)',
      zh: '西贡圣母大教堂建造历史纪录片（1877–1880）',
    },
    description: {
      vi: 'Phim tư liệu lịch sử quá trình xây dựng & kiến trúc gạch trần Nhà thờ Chính tòa Đức Bà Sài Gòn (1877–1880)',
      en: 'Archival 16:9 documentary on the construction & Marseille brickwork of Notre-Dame Cathedral (1877–1880)',
      zh: '1877–1880年西贡圣母大教堂红砖建筑建造历程高清文献纪录片（16:9横屏）',
    },
    backupLabel: {
      vi: 'Nguồn dự phòng (VhM5z3u1CFc)',
      en: 'Backup Source (VhM5z3u1CFc)',
      zh: '备用片源 (VhM5z3u1CFc)',
    },
  },
  '06': {
    videoId: 'hcCsk5AzU1c',
    backupVideoId: '50-uXfCnNSU',
    embedHost: 'youtube-nocookie',
    badge: '04:08 · 4K',
    title: {
      vi: 'Bảo tàng Lịch sử TP.HCM — Cinematic 4K & Kiến trúc Đông Dương',
      en: 'Museum of Vietnamese History (HCMC) — Cinematic 4K & Indochine Documentary',
      zh: '胡志明市历史博物馆 — 4K文献纪录片与印支建筑专题',
    },
    description: {
      vi: 'Phim tư liệu Cinematic 4K Bảo tàng Lịch sử TP.HCM & chuyên đề kiến trúc Đông Dương (1926–1929)',
      en: 'Cinematic 4K archival film on HCMC Museum of Vietnamese History & Indochine architecture',
      zh: '胡志明市历史博物馆 4K 电影级文献纪录片与1926–1929印支建筑艺术专题',
    },
    backupLabel: {
      vi: 'Kiến trúc Đông Dương (50-uXfCnNSU)',
      en: 'Indochine Architecture (50-uXfCnNSU)',
      zh: '印支建筑专题 (50-uXfCnNSU)',
    },
  },
  '07': {
    videoId: 'Jg1Qgyan1Aw',
    backupVideoId: 'dwgmJhWnU-Q',
    embedHost: 'youtube-nocookie',
    badge: '1863–1911',
    title: {
      vi: 'Phim tư liệu lịch sử Bến Nhà Rồng – Bảo tàng Hồ Chí Minh (1863–1911)',
      en: 'Nha Rong Wharf – Ho Chi Minh Museum Historical Documentary (1863–1911)',
      zh: '龙屋港—胡志明博物馆历史文献纪录片（1863–1911）',
    },
    description: {
      vi: 'Phim tư liệu lịch sử thương cảng Bến Nhà Rồng (1863–1911) & dấu mốc ngày 05/06/1911',
      en: 'Archival documentary on Nha Rong Wharf (1863–1911) & the June 5, 1911 voyage',
      zh: '1863–1911年龙屋港商埠历史与1911年6月5日启航文献纪录片',
    },
    backupLabel: {
      vi: 'Nguồn dự phòng (dwgmJhWnU-Q)',
      en: 'Backup Source (dwgmJhWnU-Q)',
      zh: '备用片源 (dwgmJhWnU-Q)',
    },
  },
  '08': {
    videoId: 'KZRikyLDXIQ',
    backupVideoId: '57OonwEqKV8',
    embedHost: 'youtube-nocookie',
    badge: '1832–1848',
    title: {
      vi: 'Phim tư liệu lịch sử & kiến trúc Lăng Tả quân Lê Văn Duyệt',
      en: 'Tomb of General Le Van Duyet Historical & Architectural Documentary',
      zh: '黎文悦左军陵（翁婆沼陵）历史与建筑纪录片',
    },
    description: {
      vi: 'Phim tư liệu lịch sử & nghệ thuật khảm sành sứ Lăng Tả quân Lê Văn Duyệt (Lăng Ông Bà Chiểu)',
      en: 'Historical & porcelain-mosaic architectural documentary on Lang Ong Ba Chieu',
      zh: '黎文悦左军陵历史沿革与南部传统碎瓷镶嵌建筑艺术文献纪录片',
    },
    backupLabel: {
      vi: 'Nguồn dự phòng (57OonwEqKV8)',
      en: 'Backup Source (57OonwEqKV8)',
      zh: '备用片源 (57OonwEqKV8)',
    },
  },
  '13': {
    videoId: '5j2sWPF5pEk',
    backupVideoId: '60ewWwijtJc',
    embedHost: 'youtube-nocookie',
    badge: '1898–1907',
    title: {
      vi: 'Phim tư liệu lịch sử & kiến trúc Bạch Dinh Vũng Tàu',
      en: 'Bach Dinh (Villa Blanche) Vung Tau Historical & Architectural Documentary',
      zh: '头顿白宫（布兰琪别墅）历史与建筑文献纪录片',
    },
    description: {
      vi: 'Phim tư liệu lịch sử & kiến trúc Tân Cổ điển Pháp Bạch Dinh (Villa Blanche) trên Núi Lớn Vũng Tàu',
      en: 'Historical & Neoclassical architectural documentary on Bach Dinh (Villa Blanche), Vung Tau',
      zh: '头顿大山布兰琪别墅（白宫）历史渊源与法式新古典建筑文献纪录片',
    },
    backupLabel: {
      vi: 'Nguồn dự phòng (60ewWwijtJc)',
      en: 'Backup Source (60ewWwijtJc)',
      zh: '备用片源 (60ewWwijtJc)',
    },
  },
};

export interface CustomVideoUrlEntry {
  kind: 'youtube' | 'video';
  embedUrl: string;
  originalUrl: string;
  videoId?: string;
  updatedAt: number;
}

/**
 * Trích xuất videoId từ mọi định dạng link YouTube (watch?v=, youtu.be/, shorts/, live/, embed/)
 * và chuyển đổi thành https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0
 */
export function parseCustomVideoUrl(rawUrl: string): CustomVideoUrlEntry | null {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return null;

  const ytMatch =
    trimmed.match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtube-nocookie\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/i
    ) || null;

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      kind: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
      originalUrl: trimmed,
      updatedAt: Date.now(),
    };
  }

  return {
    kind: 'video',
    embedUrl: trimmed,
    originalUrl: trimmed,
    updatedAt: Date.now(),
  };
}

export function loadCustomVideoUrlForHeritage(
  heritageId: HeritageVideoKey
): CustomVideoUrlEntry | null {
  try {
    const raw = localStorage.getItem(getVideoCustomStorageKey(heritageId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && typeof parsed.embedUrl === 'string') {
      return parsed as CustomVideoUrlEntry;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function saveCustomVideoUrlForHeritage(
  heritageId: HeritageVideoKey,
  rawUrl: string
): CustomVideoUrlEntry | null {
  const entry = parseCustomVideoUrl(rawUrl);
  if (!entry) return null;
  try {
    localStorage.setItem(getVideoCustomStorageKey(heritageId), JSON.stringify(entry));
  } catch {
    // ignore quota error
  }
  return entry;
}

export function removeCustomVideoUrlForHeritage(heritageId: HeritageVideoKey): void {
  try {
    localStorage.removeItem(getVideoCustomStorageKey(heritageId));
  } catch {
    // ignore
  }
}

// =========================================================================
// IndexedDB Storage cho file .MP4 từ máy tính (theo khóa video_custom_${heritageId})
// =========================================================================
const VIDEO_IDB_NAME = 'heritage_cinema_videos_idb_v1';
const VIDEO_IDB_STORE = 'custom_videos';
const VIDEO_IDB_VERSION = 1;

export interface StoredLocalVideoRecord {
  key: string;
  heritageId: HeritageVideoKey;
  fileName: string;
  mimeType: string;
  blob: Blob;
  updatedAt: number;
}

function openVideoDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB không khả dụng trên trình duyệt này'));
      return;
    }
    const req = window.indexedDB.open(VIDEO_IDB_NAME, VIDEO_IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(VIDEO_IDB_STORE)) {
        db.createObjectStore(VIDEO_IDB_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Không thể mở IndexedDB'));
  });
}

export async function saveLocalVideoToIndexedDB(
  heritageId: HeritageVideoKey,
  file: File
): Promise<StoredLocalVideoRecord> {
  const db = await openVideoDatabase();
  const record: StoredLocalVideoRecord = {
    key: getVideoCustomStorageKey(heritageId),
    heritageId,
    fileName: file.name,
    mimeType: file.type || 'video/mp4',
    blob: file,
    updatedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_IDB_STORE, 'readwrite');
    const store = tx.objectStore(VIDEO_IDB_STORE);
    const putReq = store.put(record);
    putReq.onsuccess = () => resolve(record);
    putReq.onerror = () => reject(putReq.error || new Error('Lưu video vào IndexedDB thất bại'));
    tx.oncomplete = () => db.close();
  });
}

export async function loadLocalVideoFromIndexedDB(
  heritageId: HeritageVideoKey
): Promise<StoredLocalVideoRecord | null> {
  try {
    const db = await openVideoDatabase();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(VIDEO_IDB_STORE, 'readonly');
      const store = tx.objectStore(VIDEO_IDB_STORE);
      const getReq = store.get(getVideoCustomStorageKey(heritageId));
      getReq.onsuccess = () => {
        resolve((getReq.result as StoredLocalVideoRecord | undefined) || null);
      };
      getReq.onerror = () => reject(getReq.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function deleteLocalVideoFromIndexedDB(
  heritageId: HeritageVideoKey
): Promise<void> {
  try {
    const db = await openVideoDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(VIDEO_IDB_STORE, 'readwrite');
      const store = tx.objectStore(VIDEO_IDB_STORE);
      const delReq = store.delete(getVideoCustomStorageKey(heritageId));
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    // ignore cleanup error
  }
}

// ============================================================================
// WIKIMEDIA COMMONS LIVE VIDEO API (origin=* CORS-ENABLED ARCHIVE SEARCH)
// ============================================================================
export interface WikimediaVideoQueryConfig {
  primaryQuery: string;
  fallbackQuery: string;
}

export const WIKIMEDIA_VIDEO_QUERIES: Record<HeritageVideoKey, WikimediaVideoQueryConfig> = {
  '01': {
    primaryQuery: '"Independence Palace" OR "Reunification Palace" Saigon',
    fallbackQuery: 'Saigon 1975 OR Vietnam',
  },
  '02': {
    primaryQuery: '"Saigon Opera House" OR "Municipal Theatre" Ho Chi Minh',
    fallbackQuery: 'Saigon architecture',
  },
  '03': {
    primaryQuery: '"Saigon Central Post Office"',
    fallbackQuery: 'Saigon historical',
  },
  '04': {
    primaryQuery: '"Ben Thanh Market" Saigon',
    fallbackQuery: 'Saigon market',
  },
  '05': {
    primaryQuery: '"Notre-Dame Cathedral" Saigon',
    fallbackQuery: 'Saigon cathedral',
  },
  '06': {
    primaryQuery: '"History Museum" Ho Chi Minh OR Saigon',
    fallbackQuery: 'Ho Chi Minh City museum',
  },
  '07': {
    primaryQuery: '"Nha Rong" OR "Ho Chi Minh Museum" Saigon',
    fallbackQuery: 'Saigon river port',
  },
  '08': {
    primaryQuery: '"Le Van Duyet" OR "Ba Chieu" Saigon',
    fallbackQuery: 'Saigon temple',
  },
  '09': {
    primaryQuery: '"Cu Chi tunnels"',
    fallbackQuery: 'Cu Chi Vietnam',
  },
  '10': {
    primaryQuery: '"Can Gio" mangrove Vietnam',
    fallbackQuery: 'Vietnam mangrove',
  },
  '11': {
    primaryQuery: '"Giac Lam Pagoda" OR Saigon pagoda',
    fallbackQuery: 'Vietnam pagoda',
  },
  '12': {
    primaryQuery: '"Nghia An" OR Cholon Saigon',
    fallbackQuery: 'Cholon Saigon',
  },
  '13': {
    primaryQuery: '"Bach Dinh" OR "Vung Tau"',
    fallbackQuery: 'Vung Tau Vietnam',
  },
  '14': {
    primaryQuery: '"Long Son" OR "Vung Tau"',
    fallbackQuery: 'Vung Tau Vietnam',
  },
  '15': {
    primaryQuery: '"Long Phuoc" OR "Ba Ria" Vung Tau',
    fallbackQuery: 'Ba Ria Vung Tau',
  },
  '16': {
    primaryQuery: '"Thu Dau Mot" OR "Binh Duong" traditional house',
    fallbackQuery: 'Binh Duong Vietnam',
  },
  '17': {
    primaryQuery: '"Ben Cat" OR "Iron Triangle" Vietnam',
    fallbackQuery: 'Vietnam War tunnel OR Binh Duong',
  },
};

export type WikimediaVideoFormat = 'mp4' | 'webm' | 'ogv' | 'video';

export interface WikimediaVideoItem {
  pageId: number;
  title: string;
  fileName: string;
  url: string;
  mime: string;
  format: WikimediaVideoFormat;
  sizeBytes?: number;
  description?: string;
  artist?: string;
  license?: string;
  descriptionUrl?: string;
}

export interface WikimediaVideoFetchResult {
  heritageId: HeritageVideoKey;
  queryUsed: string;
  usedFallbackQuery: boolean;
  items: WikimediaVideoItem[];
}

const wikimediaVideoCache = new Map<HeritageVideoKey, WikimediaVideoFetchResult>();

function stripHtmlTags(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function detectVideoFormat(url: string, mime: string): WikimediaVideoFormat {
  const lowerUrl = url.toLowerCase();
  const lowerMime = mime.toLowerCase();
  if (lowerUrl.endsWith('.mp4') || lowerMime.includes('mp4')) return 'mp4';
  if (lowerUrl.endsWith('.webm') || lowerMime.includes('webm')) return 'webm';
  if (lowerUrl.endsWith('.ogv') || lowerUrl.endsWith('.ogg') || lowerMime.includes('ogg')) return 'ogv';
  return 'video';
}

function getFormatPriority(fmt: WikimediaVideoFormat): number {
  if (fmt === 'mp4') return 0;
  if (fmt === 'webm') return 1;
  if (fmt === 'video') return 2;
  return 3; // .ogv last because Chromium/Safari support varies
}

async function queryWikimediaCommonsVideos(
  searchQuery: string,
  signal?: AbortSignal
): Promise<WikimediaVideoItem[]> {
  const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrsearch=filetype:video+${encodeURIComponent(
    searchQuery
  )}&gsrlimit=6&prop=imageinfo&iiprop=url|size|mime|extmetadata`;

  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error(`Wikimedia API HTTP ${response.status}`);
  }
  const json = await response.json();
  const pages = json?.query?.pages;
  if (!pages || typeof pages !== 'object') {
    return [];
  }

  const parsed: WikimediaVideoItem[] = [];
  Object.values(pages).forEach((page: any) => {
    const info = page?.imageinfo?.[0];
    if (!info?.url) return;
    const rawTitle = String(page.title || 'File:Video');
    const fileName = rawTitle.replace(/^File:/i, '').trim();
    const mime = String(info.mime || '');
    const format = detectVideoFormat(String(info.url), mime);
    const meta = info.extmetadata || {};

    parsed.push({
      pageId: Number(page.pageid || 0),
      title: fileName.replace(/\.(webm|ogv|ogg|mp4)$/i, '').replace(/_/g, ' '),
      fileName,
      url: String(info.url),
      mime,
      format,
      sizeBytes: typeof info.size === 'number' ? info.size : undefined,
      description: stripHtmlTags(meta.ImageDescription?.value || meta.ObjectName?.value),
      artist: stripHtmlTags(meta.Artist?.value),
      license: stripHtmlTags(meta.LicenseShortName?.value),
      descriptionUrl: info.descriptionurl ? String(info.descriptionurl) : undefined,
    });
  });

  // Sort so browser-native MP4/WebM play before OGV
  parsed.sort((a, b) => getFormatPriority(a.format) - getFormatPriority(b.format));
  return parsed;
}

export async function fetchWikimediaVideosForHeritage(
  heritageId: HeritageVideoKey,
  signal?: AbortSignal
): Promise<WikimediaVideoFetchResult> {
  if (HERITAGE_ARCHIVE_VIDEOS[heritageId]) {
    return {
      heritageId,
      queryUsed: `curated-archive-${heritageId}`,
      usedFallbackQuery: false,
      items: [],
    };
  }

  const cached = wikimediaVideoCache.get(heritageId);
  if (cached) return cached;

  const queryCfg = WIKIMEDIA_VIDEO_QUERIES[heritageId];
  let items = await queryWikimediaCommonsVideos(queryCfg.primaryQuery, signal);
  let usedFallbackQuery = false;
  let queryUsed = queryCfg.primaryQuery;

  if (items.length === 0 && queryCfg.fallbackQuery) {
    usedFallbackQuery = true;
    queryUsed = queryCfg.fallbackQuery;
    items = await queryWikimediaCommonsVideos(queryCfg.fallbackQuery, signal);
  }

  const result: WikimediaVideoFetchResult = {
    heritageId,
    queryUsed,
    usedFallbackQuery,
    items,
  };
  if (items.length > 0) {
    wikimediaVideoCache.set(heritageId, result);
  }
  return result;
}

