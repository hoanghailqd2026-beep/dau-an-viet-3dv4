import { Language } from '../i18n/types';

export interface CuratedAudioChapter {
  id: string;
  roman: string;
  title: string;
  durationSec: number;
  narration: string;
}

export interface SiteLanguageAudioScript {
  folioTitle: string;
  durationLabel: string;
  totalDurationSec: number;
  chapters: CuratedAudioChapter[];
}

export type MultilingualSiteAudioScripts = Record<Language, SiteLanguageAudioScript>;

export const AUDIO_GUIDE_SCRIPTS: Record<string, MultilingualSiteAudioScripts> = {
  'HCM-DT-001': {
    vi: {
      folioTitle: 'Dinh Độc Lập — Biểu tượng thống nhất và đỉnh cao kiến trúc Việt',
      durationLabel: '04:32',
      totalDurationSec: 272,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Khởi nguồn & Bối cảnh lịch sử',
          durationSec: 65,
          narration:
            'Chào mừng quý khách đến với Dinh Độc Lập, di tích lịch sử quốc gia đặc biệt giữa trái tim Thành phố Hồ Chí Minh. Tiền thân của công trình là Dinh Norodom được người Pháp khởi công vào năm 1868 trên khuôn viên rộng mười hai héc-ta. Sau sự kiện năm 1962, tòa dinh thự mới được tái thiết hoàn toàn theo đồ án của kiến trúc sư Ngô Viết Thụ và chính thức khánh thành năm 1966.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Giải phẫu Kiến trúc & Triết lý Phương Đông',
          durationSec: 82,
          narration:
            'Kiến trúc sư Ngô Viết Thụ, người Việt Nam đầu tiên đoạt giải Khôi nguyên La Mã, đã kết hợp tài tình kỹ thuật bê tông hiện đại với triết lý chiết tự phương Đông. Nhìn từ mặt tiền, hệ thống rèm hoa trúc bê tông ở tầng hai gợi hình ảnh chữ Cát tượng trưng cho sự tốt lành. Tổng thể mặt bằng các tầng tạo thành hình chữ Hưng và chữ Trung, còn mái hiên vươn cao thể hiện chữ Chủ vững chãi.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Dấu mốc 30 tháng 4 năm 1975',
          durationSec: 68,
          narration:
            'Trưa ngày 30 tháng 4 năm 1975, hai chiếc xe tăng mang số hiệu 390 và 843 đã tiến vào cổng chính Dinh Độc Lập, đánh dấu thời khắc lịch sử non sông thu về một mối. Bên dưới tòa dinh thự là hai tầng hầm chỉ huy kiên cố được trang bị hệ thống thông tin liên lạc thời chiến nguyên bản. Ngày nay, toàn bộ nội thất phòng Khánh tiết, phòng Trình quốc thư và Tứ phương vô sự lầu vẫn được bảo tồn nguyên vẹn.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Liên kết Di sản Đông Nam Bộ',
          durationSec: 57,
          narration:
            'Dinh Độc Lập là điểm hội tụ trung tâm trên trục di sản đô thị Quận 1 kết nối Nhà thờ Đức Bà, Bưu điện Trung tâm và Bảo tàng Lịch sử. Từ đây, du khách có thể mở rộng hành trình khám phá về Địa đạo Củ Chi, Bình Dương và Bà Rịa - Vũng Tàu.',
        },
      ],
    },
    en: {
      folioTitle: 'Independence Palace — Architectural Masterpiece & Landmark of Peace',
      durationLabel: '04:20',
      totalDurationSec: 260,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'Origins & Historical Context',
          durationSec: 62,
          narration:
            'Welcome to the Independence Palace, also known as the Reunification Hall, a Special National Monument at the heart of Ho Chi Minh City. Its predecessor, Norodom Palace, was first built in 1868 across a twelve-hectare park. Following its reconstruction beginning in 1962, the current modernist landmark was officially inaugurated in 1966.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'Architectural Anatomy & Eastern Philosophy',
          durationSec: 78,
          narration:
            'Designed by Grand Prix de Rome laureate architect Ngo Viet Thu, the palace blends tropical modernist concrete engineering with classical Eastern geometry. The signature second-floor facade features stylized bamboo-node stone louvers shaped to evoke the character for good fortune. Inside, grand ceremonial halls maximize natural airflow, daylight, and balanced Feng Shui proportions.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'The April 30, 1975 Turning Point',
          durationSec: 65,
          narration:
            'On April 30, 1975, tanks 390 and 843 breached the wrought-iron main gates, marking the historic reunification of Vietnam. Beneath the state reception chambers lie two fortified underground war bunkers complete with original radio arrays and situation maps. Every lacquer mural, conference table, and rooftop pavilion remains preserved in its authentic state.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'Southeast Inter-Regional Heritage Corridor',
          durationSec: 55,
          narration:
            'As the civic anchor of District One, Independence Palace connects seamlessly with Saigon Central Post Office, Notre-Dame Cathedral, and Dragon Wharf. Together, these landmarks form the gateway to the broader Southeast Vietnam heritage network stretching to Cu Chi, Binh Duong, and Vung Tau.',
        },
      ],
    },
    zh: {
      folioTitle: '独立宫 — 国家统一的历史丰碑与热带现代主义建筑巅峰',
      durationLabel: '04:15',
      totalDurationSec: 255,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '历史渊源与时代背景',
          durationSec: 60,
          narration:
            '欢迎来到位于胡志明市核心地带的特别国家级历史遗迹独立宫，又称统一会堂。其前身诺罗敦宫始建于一八六八年，坐落于十二公顷的绿荫园林之中。一九六二年启动重建工程，并于一九六六年正式落成。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '建筑解剖与东方哲学美学',
          durationSec: 75,
          narration:
            '独立宫由首位荣获罗马大奖的越南建筑师吴曰树主持设计，将二十世纪热带现代主义钢筋混凝土技术与东方传统风水哲学完美融合。二楼外立面标志性的竹节状混凝土遮阳花格窗，寓意“吉”字祥瑞；整座建筑平立面布局亦暗含“中”、“兴”、“主”等汉字意境。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '一九七五年四月三十日历史见证',
          durationSec: 65,
          narration:
            '一九七五年四月三十日中午，三百九十号与八百四十三号坦克冲入独立宫正门，宣告越南南北实现国家统一。主楼下方建有两层坚固的地下作战指挥掩体，至今完整保留了战时通讯电台、战略地图与国书递交大厅等历史原貌。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '东南部跨区域遗产走廊',
          durationSec: 55,
          narration:
            '作为第一郡城市文化轴线的核心枢纽，独立宫与中央邮局、红教堂及胡志明市历史博物馆交相辉映。以此为起点，可顺畅串联古芝地道、平阳古宅与头顿白宫，尽览越南东南部三百年遗产风华。',
        },
      ],
    },
  },

  'HCM-DT-002': {
    vi: {
      folioTitle: 'Nhà hát Thành phố — Thánh đường nghệ thuật Beaux-Arts giữa lòng Sài Gòn',
      durationLabel: '03:50',
      totalDurationSec: 230,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Khởi nguồn & Quảng trường Lam Sơn',
          durationSec: 56,
          narration:
            'Tọa lạc tại Công trường Lam Sơn, Nhà hát Thành phố Hồ Chí Minh được khởi công năm 1898 và khánh thành vào ngày đầu tiên của thế kỷ XX, mùng 1 tháng 1 năm 1900. Công trình do nhóm kiến trúc sư Pháp Félix Olivier, Ernest Guichard và Eugène Ferret thiết kế.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Nghệ thuật điêu khắc & Âm học khán phòng',
          durationSec: 66,
          narration:
            'Mặt tiền nhà hát lấy cảm hứng từ cung điện Petit Palais ở Paris với cặp tượng nữ thần nghệ thuật nâng đỡ vòm cửa chính và mái ngói đá đen Mansard cổ điển. Bên trong khán phòng hình móng ngựa ba tầng có sức chứa gần năm trăm khán giả, được tính toán âm học chuẩn mực châu Âu.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Hành trình phục dựng nguyên bản',
          durationSec: 58,
          narration:
            'Sau nhiều biến động của thế kỷ XX, nhân dịp kỷ niệm ba trăm năm Sài Gòn năm 1998, thành phố đã tiến hành đại trùng tu toàn bộ mặt tiền, khôi phục nguyên trạng các bức phù điêu thạch cao và tượng điêu khắc cổ. Năm 2012, công trình được xếp hạng Di tích Kiến trúc Nghệ thuật cấp Quốc gia.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Không gian biểu diễn đương đại',
          durationSec: 50,
          narration:
            'Ngày nay, Nhà hát Thành phố vẫn sáng đèn hằng tuần với các buổi hòa nhạc giao hưởng, ba-lê và nghệ thuật múa đương đại Việt Nam. Đây là điểm nhấn kiến trúc không thể bỏ qua trên trục đồng khởi hướng ra sông Sài Gòn.',
        },
      ],
    },
    en: {
      folioTitle: 'Saigon Opera House — A Century of Beaux-Arts Performing Arts',
      durationLabel: '03:45',
      totalDurationSec: 225,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'Origins on Lam Son Square',
          durationSec: 55,
          narration:
            'Standing proudly on Lam Son Square, the Municipal Theatre of Ho Chi Minh City broke ground in 1898 and opened on the very first day of the twentieth century, January 1, 1900. Designed by French architects Félix Olivier, Ernest Guichard, and Eugène Ferret, it became the cultural jewel of colonial Saigon.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'Flamboyant Facade & Acoustic Auditorium',
          durationSec: 65,
          narration:
            'Modeled after the Petit Palais in Paris, the facade showcases carved stone goddesses flanking the grand arched entrance beneath a slate Mansard roof. Inside, the three-tiered horseshoe auditorium seats nearly five hundred guests with finely tuned European acoustic engineering.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Centennial Restoration',
          durationSec: 55,
          narration:
            'During Saigon’s three-hundredth anniversary in 1998, artisans faithfully restored the ornate relief sculptures, Corinthian capitals, and interior plasterwork to their original 1900 drawings. In 2012, the theater was officially designated a National Architectural and Artistic Monument.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'Living Heritage Stage',
          durationSec: 50,
          narration:
            'Today, the Opera House continues to host symphony concerts, classical ballet, and contemporary Vietnamese theatrical productions. Its illuminated neoclassical arches anchor the historic Dong Khoi promenade.',
        },
      ],
    },
    zh: {
      folioTitle: '胡志明市大剧院 — 华丽的学院派百年声学殿堂',
      durationLabel: '03:40',
      totalDurationSec: 220,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '蓝山广场的历史起点',
          durationSec: 52,
          narration:
            '矗立在蓝山广场核心的胡志明市大剧院，于一八九八年破土动工，并在二十世纪第一天，即一九零零年一月一日正式盛大揭幕。建筑方案由法国建筑师费利克斯·奥利维耶等人共同设计。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '法式浮雕立面与声学剧场',
          durationSec: 64,
          narration:
            '大剧院正立面汲取了巴黎小皇宫的华丽学院派灵感，门廊两侧优雅的石雕艺术女神托起半圆拱券，顶部覆盖法式孟莎石板瓦穹顶。室内采用三层马蹄形包厢观众厅，可容纳约五百名观众，声学回响效果极佳。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '百年庆典原貌复原',
          durationSec: 54,
          narration:
            '一九九八年适逢西贡建城三百周年，文物修复专家依据一九零零年原始档案图纸，全面复原了外立面雕塑群与科林斯柱头装饰。二零一二年，大剧院正式获评国家级建筑艺术遗迹。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '当代城市艺术之心',
          durationSec: 50,
          narration:
            '时至今日，胡志明市大剧院依然定期上演交响音乐会、古典芭蕾与越南当代竹艺舞台剧，成为同起街历史风貌轴线上最璀璨的文化名片。',
        },
      ],
    },
  },

  'HCM-DT-003': {
    vi: {
      folioTitle: 'Bưu điện Trung tâm Sài Gòn — Nhịp cầu thư từ hơn 130 năm',
      durationLabel: '04:15',
      totalDurationSec: 255,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Công trình bưu chính cuối thế kỷ XIX',
          durationSec: 60,
          narration:
            'Bưu điện Trung tâm Sài Gòn được xây dựng từ năm 1886 đến năm 1891 tại số 2 Công xã Paris, ngay đối diện Nhà thờ Đức Bà. Công trình do kiến trúc sư Alfred Foulhoux chủ trì, tạo nên một tổ hợp hành chính bưu chính uy nghi bậc nhất Đông Dương thời bấy giờ.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Vòm thép Eiffel & Ngôn ngữ Tân Phục Hưng',
          durationSec: 72,
          narration:
            'Điểm nhấn kỹ thuật nổi bật nhất nằm ở sảnh chính rộng lớn với hệ thống vòm thép rèn hình bán nguyệt thanh thoát mang dấu ấn công nghệ kết cấu kim loại thời Gustave Eiffel. Phía trên mái hiên mặt tiền là chiếc đồng hồ La Mã cổ kính vẫn đều đặn điểm nhịp thời gian suốt hơn một thế kỷ.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Hai bức bản đồ cổ vẽ tay vô giá',
          durationSec: 68,
          narration:
            'Hai bên tường vòm của đại sảnh lưu giữ hai bức bản đồ địa lý vẽ tay vô giá từ năm 1892 và năm 1936, khắc họa mạng lưới đường dây điện báo nối liền Nam Kỳ và khu vực Đông Dương. Hàng quầy gỗ lim cổ điển cùng các bốt điện thoại bằng gỗ vẫn phục vụ du khách viết thư tay mỗi ngày.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Di sản sống giữa đô thị hiện đại',
          durationSec: 55,
          narration:
            'Trải qua hơn một trăm ba mươi năm hoạt động liên tục, Bưu điện Trung tâm vừa là một cơ sở bưu chính đang vận hành, vừa là điểm tham quan di sản hàng đầu tại Thành phố Hồ Chí Minh.',
        },
      ],
    },
    en: {
      folioTitle: 'Saigon Central Post Office — 130 Years of Architectural Grace',
      durationLabel: '03:55',
      totalDurationSec: 235,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'Nineteenth-Century Civic Landmark',
          durationSec: 55,
          narration:
            'Built between 1886 and 1891 across from Notre-Dame Cathedral on Paris Commune Square, Saigon Central Post Office stands as an iconic symbol of urban history. Designed under chief architect Alfred Foulhoux, its mustard-yellow facade blends European Renaissance Revival symmetry with tropical ornamental reliefs.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'Eiffel-Inspired Iron Vaulting',
          durationSec: 65,
          narration:
            'Stepping inside, visitors look up at a soaring barrel-vaulted canopy supported by slender green wrought-iron arches engineered in the era of Gustave Eiffel. Above the main portico, a classic Roman-numeral clock has kept time over the square for more than a century.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Historic Hand-Painted Maps',
          durationSec: 65,
          narration:
            'Flanking the vaulted hall are two monumental hand-painted maps dating from 1892 and 1936, charting Saigon’s early avenues and Indochina’s telegraph lines. Original ironwood service counters and antique telephone booths invite travelers to mail postcards back home.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'A Living Postal Heritage',
          durationSec: 50,
          narration:
            'After more than one hundred thirty years of uninterrupted service, the Central Post Office remains both an active postal hub and a centerpiece of District One’s heritage promenade.',
        },
      ],
    },
    zh: {
      folioTitle: '西贡中央邮局 — 跨越一百三十年的钢铁穹顶通信传奇',
      durationLabel: '03:50',
      totalDurationSec: 230,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '十九世纪末的邮政枢纽',
          durationSec: 55,
          narration:
            '西贡中央邮局建于一八八六年至一八九一年间，坐落于巴黎公社广场，与红教堂斜对而立。建筑由总建筑师阿尔弗雷德·富卢主持设计，醒目的黄赭色新文艺复兴立面极具历史辨识度。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '埃菲尔时代锻铁穹顶',
          durationSec: 65,
          narration:
            '步入宽阔的中央大厅，最令人叹为观止的是高挑优雅的绿色半圆形锻铁拱顶结构，体现了古斯塔夫·埃菲尔时代的工业钢铁美学。大门山花上方镶嵌着一枚百年罗马数字大钟，至今依然精准走时。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '百年手绘历史古地图',
          durationSec: 60,
          narration:
            '大厅两侧高墙上完整保留着绘于一八九二年与一九三六年的两幅珍贵手绘地图，清晰记录了昔日西贡市区街道与印度支那电报线路网络。厅内的百年硬木营业柜台与古典木制电话亭至今仍对外开放使用。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '仍在运营的活态文化遗产',
          durationSec: 50,
          narration:
            '历经一百三十余年风雨，西贡中央邮局既是一座正常办理邮政寄递业务的现代邮局，也是每一位到访胡志明市的旅人必至的建筑艺术圣地。',
        },
      ],
    },
  },

  'HCM-DT-004': {
    vi: {
      folioTitle: 'Chợ Bến Thành — Trái tim thương mại và ký ức Sài Gòn hơn 110 năm',
      durationLabel: '03:55',
      totalDurationSec: 235,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Từ chợ cũ ven sông đến Quảng trường Quách Thị Trang',
          durationSec: 58,
          narration:
            'Chợ Bến Thành mới được hãng thầu Brossard et Mopin khởi công năm 1912 trên vùng đầm lầy Bồ Rệt được san lấp và khánh thành tưng bừng vào tháng 3 năm 1914. Tên gọi Bến Thành bắt nguồn từ bến sông cạnh thành Gia Định xưa.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Tháp đồng hồ cửa Nam & Mái thông gió Đông Dương',
          durationSec: 65,
          narration:
            'Điểm nhận diện nổi tiếng nhất của ngôi chợ là tháp đồng hồ bốn mặt vươn cao tại cửa Nam. Toàn bộ nhà lồng rộng hơn mười ba nghìn mét vuông được thiết kế bằng khung thép kết hợp mái ngói xếp tầng nhiều khe hở giúp đối lưu gió nhiệt đới tự nhiên.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Mười hai bức phù điêu gốm Biên Hòa',
          durationSec: 62,
          narration:
            'Năm 1952, trên bốn cổng chính Đông, Tây, Nam, Bắc của chợ được gắn mười hai bức phù điêu gốm mỹ nghệ Biên Hòa miêu tả sinh động cá tôm, lúa gạo và sản vật trù phú của vùng đất Nam Bộ. Năm 2024, công trình chính thức được xếp hạng Di tích cấp Thành phố.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Giao lộ văn hóa và ẩm thực đương đại',
          durationSec: 50,
          narration:
            'Ngày nay, với gần một nghìn năm trăm gian hàng hoạt động suốt ngày đêm bên cạnh nhà ga Metro trung tâm, Chợ Bến Thành tiếp tục là biểu tượng giao thương sống động bậc nhất Thành phố Hồ Chí Minh.',
        },
      ],
    },
    en: {
      folioTitle: 'Ben Thanh Market — The Commercial Heartbeat of Saigon Since 1914',
      durationLabel: '03:45',
      totalDurationSec: 225,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'From Riverside Wharf to City Landmark',
          durationSec: 55,
          narration:
            'Constructed between 1912 and 1914 by contractor Brossard et Mopin atop reclaimed land at Quach Thi Trang Square, Ben Thanh Market inherited its name from the historic riverside landing near the former Gia Dinh Citadel.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'The South Gate Clock Tower & Tropical Ventilation',
          durationSec: 62,
          narration:
            'Its iconic four-faced clock tower rising above the South Gate is one of Saigon’s most recognizable civic emblems. Covering over thirteen thousand square meters, the steel-truss hall employs tiered louvered roofs engineered for continuous tropical cross-ventilation.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Twelve Bien Hoa Ceramic Bas-Reliefs',
          durationSec: 58,
          narration:
            'Added in 1952 above the four cardinal gates—East, West, South, and North—twelve vivid Bien Hoa ceramic relief panels celebrate the agriculture, rivers, and crafts of Southern Vietnam. In 2024, the market was formally recognized as a City-level Architectural Heritage Site.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'A Living Cultural Crossroads',
          durationSec: 50,
          narration:
            'With nearly fifteen hundred stalls offering textiles, coffee, handicrafts, and southern cuisine right beside the central Metro hub, Ben Thanh Market remains the vibrant soul of daily life in Ho Chi Minh City.',
        },
      ],
    },
    zh: {
      folioTitle: '槟城市场 — 跨越百年的西贡商贸心脏与四面钟楼',
      durationLabel: '03:40',
      totalDurationSec: 220,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '从河畔渡口到城市地标',
          durationSec: 54,
          narration:
            '槟城市场于一九一二年动工兴建，并在一九一四年三月盛大开业，坐落于胡志明市第一郡核心的郭氏庄广场。“槟城”之名源自昔日嘉定城旁繁华的河畔码头。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '南门四面钟楼与热带通风屋顶',
          durationSec: 60,
          narration:
            '南门高耸的三拱门四面钟楼，历经一个多世纪依然是西贡最具代表性的城市徽标。整座市场占地超过一万三千平方米，采用大跨度钢桁架与双层百叶红瓦屋顶设计，巧妙引入自然对流清风。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '十二幅边和陶瓷浮雕艺术',
          durationSec: 56,
          narration:
            '一九五二年，东、西、南、北四大正门上方镶嵌了十二幅精美的边和彩釉陶瓷浮雕，生动描绘了越南南部的稻米、渔产与风土物产。二零二四年，槟城市场正式入选胡志明市级历史建筑艺术遗迹。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '永不落幕的市井烟火',
          durationSec: 50,
          narration:
            '如今，拥有近一千五百个摊位的槟城市场紧邻市中心地铁枢纽，日夜熙攘不息，是海内外游客体验地道南越风情与美食文化的必游之地。',
        },
      ],
    },
  },

  'HCM-DT-005': {
    vi: {
      folioTitle: 'Nhà thờ Đức Bà Sài Gòn — Ngọn tháp đôi gạch đỏ Toulouse',
      durationLabel: '04:05',
      totalDurationSec: 245,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Viên đá đầu tiên năm 1877',
          durationSec: 58,
          narration:
            'Khởi công từ năm 1877 và khánh thành vào lễ Phục Sinh năm 1880 theo thiết kế của kiến trúc sư Jules Bourard, Nhà thờ Chính tòa Đức Bà Sài Gòn tọa lạc trang nghiêm tại Công xã Paris. Đến năm 1959, Tòa Thánh Vatican chính thức phong tước hiệu Vương cung Thánh đường.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Kết cấu gạch trần Toulouse & Hai tháp chuông',
          durationSec: 68,
          narration:
            'Điểm kỳ diệu nhất về vật liệu là toàn bộ tường ngoài được xây bằng gạch nung trần vận chuyển từ vùng Toulouse nước Pháp, không tô trát nhưng giữ sắc hồng đất son bền bỉ suốt gần một trăm năm mươi năm. Hai tháp chuông kẽm vươn cao hơn sáu mươi mét sở hữu sáu quả chuông đồng lớn.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Không gian thánh đường & Công trình đại trùng tu',
          durationSec: 64,
          narration:
            'Lòng thánh đường dài chín mươi ba mét kết hợp vòm cuốn Romanesque vững chãi và những ô cửa kính màu Gothic rực rỡ. Từ năm 2017 đến nay, công trình đang trải qua đợt đại trùng tu quy mô lớn với ngói và vật liệu phục chế đồng bộ từ châu Âu.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Dấu ấn kiến trúc Công xã Paris',
          durationSec: 55,
          narration:
            'Cùng với Bưu điện Trung tâm ngay bên cạnh, Vương cung Thánh đường Đức Bà tạo thành quần thể kiến trúc gạch đỏ và thép vàng kinh điển nhất tại trung tâm Thành phố Hồ Chí Minh.',
        },
      ],
    },
    en: {
      folioTitle: 'Notre-Dame Cathedral Basilica of Saigon — Twin Terracotta Spires',
      durationLabel: '03:55',
      totalDurationSec: 235,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'Cornerstone of 1877',
          durationSec: 55,
          narration:
            'Designed by French architect Jules Bourard, Notre-Dame Cathedral of Saigon broke ground in 1877 and was consecrated on Easter Sunday in 1880. In 1959, the Vatican elevated the landmark to the status of Minor Basilica.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'Toulouse Bricks & Twin Bell Towers',
          durationSec: 65,
          narration:
            'Constructed entirely from exposed fired bricks imported from Toulouse without exterior plaster, the walls have preserved their signature rose-terracotta hue for nearly a century and a half. In 1895, two zinc-clad spires reaching sixty meters were added, housing six resonant bronze bells.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Romanesque-Gothic Vaults & Ongoing Restoration',
          durationSec: 62,
          narration:
            'Stretching ninety-three meters in length, the basilica marries sturdy Romanesque stone arches with luminous stained-glass Gothic lancets. Since 2017, international heritage craftsmen have led a meticulous restoration using authentic European tiles and timber.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'Heart of Paris Commune Square',
          durationSec: 53,
          narration:
            'Standing side by side with the Central Post Office, Notre-Dame Cathedral anchors the most celebrated nineteenth-century architectural square in Ho Chi Minh City.',
        },
      ],
    },
    zh: {
      folioTitle: '西贡圣母大教堂 — 图卢兹红砖筑就的双塔宗座圣殿',
      durationLabel: '03:50',
      totalDurationSec: 230,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '一八七七年的奠基圣石',
          durationSec: 54,
          narration:
            '西贡圣母大教堂又称红教堂，由建筑师儒勒·布拉尔设计，于一八七七年奠基，一八八零年复活节正式落成。一九五九年，梵蒂冈教廷正式册封其为宗座圣殿。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '图卢兹红砖与双子钟楼',
          durationSec: 64,
          narration:
            '整座教堂最富传奇色彩之处在于其外墙全部采用法国图卢兹烧制的红砖砌筑，不施粉刷却历经近一个半世纪风雨而不生青苔，至今依然散发温暖的砖红光泽。一八九五年增建的双尖顶钟楼高达六十余米，内悬六口铸铜大钟。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '罗马式与哥特式交融的保护性修缮',
          durationSec: 60,
          narration:
            '主殿纵深九十三米，融合了罗马式拱券的厚重与哥特式尖肋花窗的崇高感。自二零一七年以来，国际古建团队采用法国原产陶瓦与木材对其展开了严谨的保护性大修。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '巴黎公社广场的百年守望',
          durationSec: 52,
          narration:
            '与毗邻的西贡中央邮局共同守望巴黎公社广场，红教堂始终是胡志明市天际线中最具诗意的文化象征。',
        },
      ],
    },
  },

  'HCM-DT-006': {
    vi: {
      folioTitle: 'Bảo tàng Lịch sử TP.HCM — Kiệt tác kiến trúc Đông Dương 1929',
      durationLabel: '04:00',
      totalDurationSec: 240,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Bảo tàng cổ nhất tại phương Nam',
          durationSec: 55,
          narration:
            'Được khởi công năm 1926 và khánh thành năm 1929 bên trong Thảo Cầm Viên Sài Gòn, Bảo tàng Lịch sử Thành phố Hồ Chí Minh là bảo tàng đầu tiên tại miền Nam. Ban đầu công trình mang tên Bảo tàng Blanchard de la Brosse, do kiến trúc sư Auguste Delaval thiết kế.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Tinh hoa phong cách Indochinois & Tháp Bát Giác',
          durationSec: 68,
          narration:
            'Công trình được xem là hình mẫu kinh điển của kiến trúc Đông Dương khi kết hợp bố cục đối xứng tân cổ điển Pháp với mái ngói âm dương cong vút, đầu đao chạm rồng phượng và hàng cửa sổ gỗ lấy gió nhiệt đới. Chính giữa mặt tiền là tòa tháp bát giác hai tầng mái mang triết lý Bát Quái phương Đông.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Kho tàng văn minh Óc Eo & Champa',
          durationSec: 64,
          narration:
            'Năm 1970, kiến trúc sư Nguyễn Bá Lăng thiết kế mở rộng thêm khu trưng bày phía sau với hồ nước thanh tịnh hình chữ U. Ngày nay, bảo tàng lưu giữ hơn bốn mươi nghìn hiện vật quý giá từ thời tiền sử, văn hóa Đông Sơn, Champa cho tới văn minh Phù Nam Óc Eo.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Kết nối hành trình tìm về cội nguồn',
          durationSec: 53,
          narration:
            'Từ các bộ sưu tập cổ vật tại Bảo tàng Lịch sử, du khách có thể kết nối trực tiếp đến di chỉ khảo cổ học Giồng Cá Vồ ở Cần Giờ để hiểu trọn vẹn bức tranh văn minh cổ Đông Nam Bộ.',
        },
      ],
    },
    en: {
      folioTitle: 'Museum of History — Sanctuary of Indochine Heritage Architecture',
      durationLabel: '03:50',
      totalDurationSec: 230,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'The Oldest Museum in Southern Vietnam',
          durationSec: 55,
          narration:
            'Built between 1926 and 1929 inside the Saigon Botanical Gardens, the Museum of History of Ho Chi Minh City is the oldest museum in southern Vietnam. Designed by French architect Auguste Delaval, it originally opened as the Blanchard de la Brosse Museum.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'The Indochine Synthesis & Octagonal Tower',
          durationSec: 65,
          narration:
            'The building epitomizes the Indochine architectural movement, marrying European structural symmetry with traditional Vietnamese curved tiled eaves, dragon-phoenix roof ornaments, and louvered verandas. Rising above the entrance is a distinctive two-tiered octagonal pavilion inspired by Eastern cosmology.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Treasures of Oc Eo & Champa Civilizations',
          durationSec: 60,
          narration:
            'Expanded in 1970 by Vietnamese architect Nguyen Ba Lang around a tranquil courtyard lake, the galleries safeguard more than forty thousand artifacts spanning Dong Son bronzes, Champa stone sculptures, and ancient Oc Eo maritime culture.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'Gateway to Ancient Southern Roots',
          durationSec: 50,
          narration:
            'Together with the archaeological harbor of Giong Ca Vo in Can Gio, this National Monument preserves the deepest timeline of human civilization across Southeast Vietnam.',
        },
      ],
    },
    zh: {
      folioTitle: '胡志明市历史博物馆 — 一九二九年印度支那风格建筑杰作',
      durationLabel: '03:45',
      totalDurationSec: 225,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '越南南部最古老的博物馆',
          durationSec: 52,
          narration:
            '胡志明市历史博物馆坐落于西贡动植物园内，于一九二六年动工、一九二九年正式落成，由法国建筑师奥古斯特·德拉瓦尔主持设计，是越南南部历史最悠久的综合博物馆。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '印度支那美学与八角重檐宝塔',
          durationSec: 64,
          narration:
            '这座建筑被公认为印度支那折衷主义风格的典范：法式对称体量上覆以中式与越式飞檐阴阳瓦，屋脊饰有龙凤浮雕，正门中央高耸的双层八角亭楼蕴含东方八卦哲学意象。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '扶南奥厄与占婆文明宝库',
          durationSec: 59,
          narration:
            '一九七零年由越南建筑师阮伯陵主持扩建后方U字形水庭展区。如今馆内珍藏逾四万件跨时代文物，涵盖东山铜鼓、占婆石刻以及两千年前奥厄港市黄金玉器珍品。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '溯源东南部千年文明链',
          durationSec: 50,
          narration:
            '胡志明市历史博物馆的出土馆藏与芹耶县榕鱼窝考古遗址相互印证，完整串联起越南东南部从史前走向海洋商贸时代的文明脉络。',
        },
      ],
    },
  },

  'HCM-DT-007': {
    vi: {
      folioTitle: 'Bến Nhà Rồng — Dấu son lịch sử ngày 5 tháng 6 năm 1911',
      durationLabel: '04:20',
      totalDurationSec: 260,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Thương cảng bên ngã ba sông Sài Gòn',
          durationSec: 62,
          narration:
            'Tọa lạc ngay ngã ba sông Sài Gòn và rạch Bến Nghé, Bến Nhà Rồng nguyên là trụ sở thương cảng của Hãng tàu vận tải đường biển Messageries Maritimes của Pháp, được xây dựng vào năm 1863. Từ thuở sơ khai, nơi đây là cửa ngõ hàng hải tấp nập nhất của vùng đất Gia Định.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Kiến trúc Đông Tây & Đôi rồng chầu mặt trời',
          durationSec: 68,
          narration:
            'Tòa nhà hai tầng kết hợp hành lang vòm cuốn phương Tây thông thoáng với bộ mái ngói truyền thống Việt Nam. Nổi bật trên nóc mái là hai tượng rồng bằng đất nung tráng men xanh uốn lượn hướng về mặt trăng theo mô-típ lưỡng long chầu nguyệt, tạo nên tên gọi thân thương Nhà Rồng.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Hành trình ba mươi năm tìm đường cứu nước',
          durationSec: 72,
          narration:
            'Ngày 5 tháng 6 năm 1911, từ chính bến cảng này, người thanh niên yêu nước Nguyễn Tất Thành khi ấy mới hai mươi mốt tuổi đã bước lên con tàu Amiral Latouche-Tréville với tên gọi Văn Ba, bắt đầu cuộc hành trình ba mươi năm bôn ba tìm đường giải phóng dân tộc.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Bảo tàng Hồ Chí Minh & Tầm nhìn ven sông',
          durationSec: 58,
          narration:
            'Từ năm 1979, Bến Nhà Rồng trở thành Bảo tàng Hồ Chí Minh chi nhánh Thành phố Hồ Chí Minh và được xếp hạng Di tích Lịch sử cấp Quốc gia. Không gian ven sông nơi đây là điểm khởi đầu thiêng liêng của tuyến tham quan lịch sử cách mạng Nam Bộ.',
        },
      ],
    },
    en: {
      folioTitle: 'Dragon Wharf (Ben Nha Rong) — Historic Departure of June 5, 1911',
      durationLabel: '04:00',
      totalDurationSec: 240,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'Gateway at the Confluence of the Saigon River',
          durationSec: 58,
          narration:
            'Built in 1863 at the confluence of the Saigon River and Ben Nghe Canal, this riverside mansion originally served as the port headquarters of the French shipping company Messageries Maritimes. For decades, it stood as the maritime threshold of southern Vietnam.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'East-West Fusion & Glazed Ceramic Dragons',
          durationSec: 62,
          narration:
            'The two-story structure combines arched colonial verandas with a traditional Vietnamese tiled roof crowned by two glazed terracotta dragons facing a flaming pearl. That distinctive rooftop motif gave the pier its enduring popular name: Nha Rong, the House of the Dragons.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'June 5, 1911: A Thirty-Year Journey Begins',
          durationSec: 68,
          narration:
            'On June 5, 1911, twenty-one-year-old patriot Nguyen Tat Thanh—later known to the world as President Ho Chi Minh—stepped aboard the French steamship Amiral Latouche-Tréville from this pier, embarking on a thirty-year voyage across continents to seek Vietnam’s independence.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'Preserving a Sacred National Monument',
          durationSec: 52,
          narration:
            'Designated a National Historical Monument and the Ho Chi Minh City branch of the Ho Chi Minh Museum, Dragon Wharf welcomes visitors from around the world to reflect along the historic Saigon waterfront.',
        },
      ],
    },
    zh: {
      folioTitle: '龙屋港（胡志明博物馆） — 1911年6月5日启航的历史圣地',
      durationLabel: '03:55',
      totalDurationSec: 235,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '西贡河口的历史商港',
          durationSec: 56,
          narration:
            '坐落于西贡河与𤅶牺牲涌交汇处的龙屋港，始建于一八六三年，原为法国海运公司（Messageries Maritimes）驻西贡港务总部，是昔日南圻重要的远洋航运门户。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '东西合璧与屋顶双龙戏珠',
          durationSec: 60,
          narration:
            '这座两层建筑以西式拱廊结构为主体，顶部却巧妙覆盖了传统越式红瓦，屋脊两侧饰有两尊釉面陶龙面向明珠朝拜，“龙屋”之名由此传世。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '一九一一年六月五日的救国远航',
          durationSec: 67,
          narration:
            '一九一一年六月五日，年仅二十一岁的爱国青年阮必成（即后来的胡志明主席）正是从这座码头登上“拉图什·特雷维尔海军上将号”轮船，毅然开启了历时三十载、踏遍五大洲探寻民族独立与解放道路的传奇征程。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '胡志明博物馆水岸走廊',
          durationSec: 52,
          narration:
            '自一九七九年起，龙屋港被列为国家级历史遗迹并辟为胡志明博物馆胡志明市分馆，成为人们缅怀历史与沿着西贡河畔溯源近代风云的起点。',
        },
      ],
    },
  },

  'HCM-DT-008': {
    vi: {
      folioTitle: 'Lăng Tả quân Lê Văn Duyệt — Mỹ thuật khảm sành sứ & hồn thiêng Gia Định',
      durationLabel: '04:30',
      totalDurationSec: 270,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Vị Tổng trấn khai mở thành Gia Định',
          durationSec: 65,
          narration:
            'Lăng Ông Bà Chiểu là khu lăng mộ và đền thờ Tả quân Lê Văn Duyệt, vị Tổng trấn công minh hai lần cai quản thành Gia Định đầu thế kỷ XIX. Sau khi ông qua đời năm 1832, khu lăng mộ được triều Nguyễn truy phục và tôn tạo trang nghiêm từ năm 1848 trên diện tích gần mười chín nghìn mét vuông.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Kiến trúc Trùng thiềm điệp ốc & Khảm sành sứ Cây Mai',
          durationSec: 76,
          narration:
            'Từ cổng Tam quan cổ kính bước qua bức bình phong chạm rồng hổ, du khách tiến vào cụm Tiền điện, Trung điện và Chính điện xây theo kiểu nhà trùng thiềm điệp ốc. Điểm nhấn rực rỡ nhất là nghệ thuật ghép mảnh sành sứ Cây Mai trên bờ nóc tạo hình lưỡng long tranh châu và bát tiên sống động dưới nắng phương Nam.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Không gian nội điện & Nghệ thuật sơn son thếp vàng',
          durationSec: 70,
          narration:
            'Bên trong Chính điện, hệ thống cột gỗ quý sơn son thếp vàng nâng đỡ hàng chục hoành phi, câu đối chạm lộng tinh xảo. Khu vực mộ song táng của Tả quân và phu nhân Đỗ Thị Phẫn mang dáng dấp nấm mộ cổ rùa đá truyền thống, tỏa bóng cây cổ thụ trầm mặc.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Di sản văn hóa phi vật thể Lễ hội Khai hạ',
          durationSec: 59,
          narration:
            'Hằng năm, Lễ hội Khai hạ Cầu an tại Lăng Ông Bà Chiểu thu hút hàng vạn người dân và đã được ghi danh là Di sản Văn hóa Phi vật thể Quốc gia, minh chứng cho lòng tri ân sâu sắc của cư dân phương Nam đối với bậc tiền nhân mở cõi.',
        },
      ],
    },
    en: {
      folioTitle: 'Tomb of Marshal Le Van Duyet — Imperial Viceroy Sanctuary',
      durationLabel: '04:05',
      totalDurationSec: 245,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'Guardian Viceroy of Old Gia Dinh',
          durationSec: 60,
          narration:
            'Affectionately known as Lang Ong Ba Chieu, this sacred sanctuary honors Marshal Le Van Duyet, the esteemed nineteenth-century Viceroy who stabilized and developed the Gia Dinh region. Restored by imperial decree in 1848, the complex spans nearly nineteen thousand square meters beneath ancient shade trees.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'Triple-Gate Portico & Broken-Ceramic Mosaic Roofs',
          durationSec: 68,
          narration:
            'Passing through the iconic triple-arch Tam Quan gate and dragon-tiger spirit screen, visitors enter a sequence of Front, Middle, and Main Halls connected under overlapping yin-yang tiled roofs. Above, master artisans crafted radiant dragon and phoenix motifs from broken Cay Mai ceramic shards.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Gilded Timber Sanctum & Twin Tortoise-Shell Tombs',
          durationSec: 62,
          narration:
            'Inside the sanctum, gilded red-lacquer columns frame delicately carved calligraphic plaques and ceremonial bronze altars. Behind the sanctuary rest the twin mortar-and-laterite tombs of Marshal Le Van Duyet and his consort.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'Living Heritage of the Khai Ha Festival',
          durationSec: 55,
          narration:
            'Recognized both as a National Historical Monument and home to the National Intangible Heritage Khai Ha New Year Festival, Lang Ong Ba Chieu remains a spiritual cornerstone of Ho Chi Minh City.',
        },
      ],
    },
    zh: {
      folioTitle: '黎文悦将军陵（巴沼翁陵） — 嘉定古城守护者的陶瓷嵌饰圣殿',
      durationLabel: '04:00',
      totalDurationSec: 240,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '开拓嘉定南疆的功勋总镇',
          durationSec: 58,
          narration:
            '巴沼翁陵是十九世纪初两次出任嘉定城总镇的名臣黎文悦将军及其夫人的陵寝与祀庙。将军于一八三二年逝世后，阮朝朝廷自一八四八年起重修陵园，占地近一万九千平方米，古木参天、香火鼎盛。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '重檐叠屋与梅树窑碎瓷镶嵌',
          durationSec: 66,
          narration:
            '步入古朴的三门牌坊，绕过龙虎照壁，便来到由前殿、中殿与正殿连缀而成的越南南部传统重檐叠屋建筑群。屋脊之上以西贡梅树窑彩色碎瓷片精妙拼贴出双龙戏珠与凤舞瑞云图，是南越民间工艺的绝世珍品。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '朱漆贴金正殿与龟背古墓',
          durationSec: 62,
          narration:
            '正殿之内，名贵红木圆柱朱漆贴金，高悬汉字匾额与镂空楹联。陵区内的龟背形石灰贝壳古墓依照传统堪舆礼制建造，端庄肃穆。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '国家级非物质文化遗产开夏祈安节',
          durationSec: 54,
          narration:
            '每年正月举办的翁陵开夏祈安庙会已获列为国家级非物质文化遗产，承载着胡志明市乃至整个南方民众饮水思源的文化信仰。',
        },
      ],
    },
  },

  'HCM-DT-009': {
    vi: {
      folioTitle: 'Địa đạo Củ Chi — Thành phố ngầm huyền thoại trong lòng đất thép',
      durationLabel: '05:10',
      totalDurationSec: 310,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Huyền thoại vùng đất thép Củ Chi',
          durationSec: 72,
          narration:
            'Địa đạo Củ Chi là kỳ quan quân sự độc nhất vô nhị được quân và dân huyện Củ Chi khởi đào từ năm 1948 và phát triển liên hoàn tới hơn hai trăm năm mươi ki-lô-mét đường hầm ngầm. Công trình đã được xếp hạng Di tích Quốc gia Đặc biệt và đang hoàn thiện hồ sơ đề cử Di sản Thế giới UNESCO.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Giải phẫu địa tầng đất sét đá ong 3 tầng',
          durationSec: 94,
          narration:
            'Hệ thống địa đạo được đào hoàn toàn thủ công trong tầng đất sét pha đá ong nằm trên nền phù sa cổ bền chắc như bê tông tự nhiên. Cấu trúc giải phẫu gồm ba tầng sâu từ ba mét đến mười hai mét dưới mặt đất, có khả năng chịu được sức rung chấn của bom đạn và xe tăng hạng nặng phía trên.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Bếp Hoàng Cầm, nắp hầm bí mật & lỗ thông hơi',
          durationSec: 84,
          narration:
            'Trong lòng địa đạo hội tụ đầy đủ phòng họp tác chiến, bệnh xá dã chiến, xưởng quân giới và giếng nước ngầm. Đặc biệt, hệ thống lỗ thông hơi ngụy trang khéo léo thành ụ mối tự nhiên, còn bếp Hoàng Cầm dẫn khói qua nhiều rãnh đất dài để tản tan thành sương mỏng sát mặt cỏ, giữ bí mật tuyệt đối suốt nhiều thập kỷ.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Vành đai ba hệ thống địa đạo Đông Nam Bộ',
          durationSec: 60,
          narration:
            'Cùng với Địa đạo Tam Giác Sắt bên bờ sông Sài Gòn ở Bình Dương và Địa đạo Long Phước tại Bà Rịa, Địa đạo Củ Chi tạo nên thế trận lòng đất liên vùng kỳ vĩ bảo vệ cửa ngõ Sài Gòn.',
        },
      ],
    },
    en: {
      folioTitle: 'Cu Chi Tunnels — The Legendary Subterranean City',
      durationLabel: '04:45',
      totalDurationSec: 285,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'Origins of the Iron Triangle & Steel Land',
          durationSec: 68,
          narration:
            'Beginning as isolated hideouts in 1948, the Cu Chi Tunnels expanded over two decades into an astonishing subterranean network exceeding two hundred fifty kilometers in length. Today, this Special National Monument stands on Vietnam’s tentative list for UNESCO World Heritage recognition.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'Three-Level Laterite Clay Engineering',
          durationSec: 86,
          narration:
            'Excavated entirely by hand with simple hoes and woven baskets, the tunnels cut through dense laterite clay resting atop ancient alluvial soil that hardens like natural concrete. Three interconnected levels descending from three to twelve meters underground withstood heavy artillery and armored tank loads above.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Hoang Cam Smokeless Stove & Camouflaged Vents',
          durationSec: 76,
          narration:
            'Far more than escape passages, the underground city housed surgical rooms, armories, meeting halls, and deep water wells. Diagonal air shafts disguised as termite mounds supplied oxygen, while ingenious Hoang Cam kitchens routed cooking smoke through long soil trenches so only faint mist emerged at dawn.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'The Southeast Subterranean Defense Triad',
          durationSec: 55,
          narration:
            'Linked strategically across the Saigon River with the Iron Triangle Tunnels in Binh Duong and Long Phuoc Tunnels in Ba Ria, Cu Chi anchors one of the most extraordinary inter-regional defense networks in modern history.',
        },
      ],
    },
    zh: {
      folioTitle: '古芝地道 — 铁血土地下三层二百五十公里地下长城传奇',
      durationLabel: '04:40',
      totalDurationSec: 280,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '钢铁土地的历史传奇',
          durationSec: 65,
          narration:
            '古芝地道始掘于一九四八年抗战时期，随后发展成全长超过二百五十公里的地下立体防卫城市。如今这里不仅是越南特别国家级历史遗迹，也正积极申报联合国教科文组织世界文化遗产名录。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '三层红土铁盘黏土工程奇迹',
          durationSec: 85,
          narration:
            '古芝军民仅凭简单锄具，在古老冲积层之上坚硬如天然混凝土的红土铁盘黏土中徒手开凿。地道深达地下三米至十二米，呈三层立体交错分布，能够承受地面重型火炮轰炸与坦克碾压而不塌陷。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '黄琴无烟灶与仿生蚁丘通风孔',
          durationSec: 75,
          narration:
            '地下网络内部完整设有作战会议室、野战手术室、兵工作坊与地下水井。伪装成天然白蚁丘的斜向通风孔源源不断输送新鲜空气，而独创的“黄琴灶”将炊烟引入漫长土沟消散为薄雾，令地面侦察难以察觉。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '东南部三大地下堡垒连线',
          durationSec: 55,
          narration:
            '隔西贡河与平阳省铁三角地道相望，并与巴地头顿省龙福地道遥相呼应，古芝地道共同铸就了护卫西贡门户的东南部地下长城。',
        },
      ],
    },
  },

  'HCM-DT-010': {
    vi: {
      folioTitle: 'Di chỉ Giồng Cá Vồ — Cảng thị mộ chum Tiền Óc Eo hơn 2.000 năm',
      durationLabel: '04:10',
      totalDurationSec: 250,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Gò đất cổ giữa rừng ngập mặn Cần Giờ',
          durationSec: 58,
          narration:
            'Nằm giữa vùng dự trữ sinh quyển rừng ngập mặn Cần Giờ, Di tích khảo cổ học Giồng Cá Vồ được phát hiện vào năm 1993 trên một giồng cát cổ cao nổi giữa đầm lầy ven biển. Các nghiên cứu xác định di chỉ có niên đại từ thế kỷ III trước Công nguyên đến thế kỷ I sau Công nguyên.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Địa tầng hố khai quật & Táng tục Mộ Chum',
          durationSec: 68,
          narration:
            'Tại đây, các nhà khảo cổ đã khai quật hàng trăm ngôi mộ chum gốm thô áo đỏ cỡ lớn chôn thẳng đứng trong lớp đất cát văn hóa Tiền Óc Eo. Bên trong các chum gốm là di cốt người cổ được an táng theo tư thế ngồi co, cùng nhiều đồ tùy táng vô giá.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Khuyên tai hai đầu thú & Thương cảng cổ',
          durationSec: 68,
          narration:
            'Những hiện vật độc bản như khuyên tai hai đầu thú bằng đá ngọc nephrite, vòng mã não, hạt chuỗi thủy tinh nhân tạo và trang sức vàng lá chứng tỏ Giồng Cá Vồ từng là một xưởng chế tác thủ công và cảng thị giao thương biển sầm uất cách đây hơn hai thiên niên kỷ.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Mạch nối khảo cổ học Tiền Óc Eo Nam Bộ',
          durationSec: 56,
          narration:
            'Được xếp hạng Di tích Khảo cổ học cấp Quốc gia từ năm 2000, Giồng Cá Vồ đóng vai trò bản lề giải mã cội nguồn cư dân cổ phương Nam, kết nối chặt chẽ với các bộ sưu tập cổ vật tại Bảo tàng Lịch sử Thành phố Hồ Chí Minh.',
        },
      ],
    },
    en: {
      folioTitle: 'Giong Ca Vo Archaeological Site — 2,000-Year-Old Pre-Oc Eo Port',
      durationLabel: '03:55',
      totalDurationSec: 235,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'Ancient Sand Mound in the Can Gio Biosphere',
          durationSec: 55,
          narration:
            'Hidden within the coastal mangrove biosphere of Can Gio District, Giong Ca Vo was discovered in 1993 atop a raised prehistoric sand ridge. Radiocarbon dating traces this settlement back to between the third century BCE and the first century CE.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'Stratigraphic Trenches & Terracotta Jar Burials',
          durationSec: 65,
          narration:
            'Excavations uncovered hundreds of large, egg-shaped red terracotta burial jars set vertically within Pre-Oc Eo cultural soil strata. Each jar safeguarded human remains alongside ritual pottery vessels and finely crafted personal ornaments.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Double-Headed Animal Jade Earrings & Maritime Trade',
          durationSec: 63,
          narration:
            'Remarkable finds—including double-headed animal nephrite jade earrings, carnelian beads, early glass ornaments, and gold leaf jewelry—reveal that Giong Ca Vo thrived as both an artisan workshop and an international maritime entrepôt over two thousand years ago.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'Preserving Southern Vietnam’s Prehistoric Dawn',
          durationSec: 52,
          narration:
            'Ranked as a National Archaeological Monument since 2000, Giong Ca Vo forms the earliest chronological anchor of our regional heritage collection alongside the Museum of History in District One.',
        },
      ],
    },
    zh: {
      folioTitle: '榕鱼窝考古遗址 — 两千年前的前奥厄海洋瓮葬港市',
      durationLabel: '03:50',
      totalDurationSec: 230,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '芹耶红树林间的史前古沙岗',
          durationSec: 52,
          narration:
            '坐落于芹耶红树林生态保护区内的榕鱼窝考古遗址，于一九九三年首次被发掘。考古测定表明，这片海滨高地遗址活跃于公元前三世纪至公元一世纪的前奥厄文化时期。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '文化地层与红陶瓮葬习俗',
          durationSec: 62,
          narration:
            '考古学家在深层沙土探方中发掘出数百座大型卵形红陶葬瓮。这些古陶瓮直立埋葬，内部保存着古人遗骸以及随葬陶器与精美玉石饰物，清晰还原了先民的丧葬礼仪。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '双兽首玉耳饰与海上丝路港市',
          durationSec: 64,
          narration:
            '遗址出土的软玉双兽首耳饰、玛瑙珠饰、古人造玻璃串珠以及金箔工艺品，证明两千多年前的榕鱼窝曾是一座兴盛的手工业玉雕作坊与海上贸易古港。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '南越史前文明的时间起点',
          durationSec: 52,
          narration:
            '自二零零零年获批为国家级考古遗迹以来，榕鱼窝始终是解码越南东南部早期人类海洋文明的重要钥匙，并与胡志明市历史博物馆藏品一脉相承。',
        },
      ],
    },
  },

  'HCM-DT-011': {
    vi: {
      folioTitle: 'Chùa Giác Lâm — Tổ đình Phật giáo Nam Bộ gần 300 năm tuổi',
      durationLabel: '04:15',
      totalDurationSec: 255,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Ngôi cổ tự lâu đời nhất đất Gia Định',
          durationSec: 60,
          narration:
            'Tọa lạc trên gò Cẩm Sơn thanh tịnh thuộc quận Tân Bình, Tổ đình Giác Lâm được cư sĩ Lý Thụy Long khởi dựng từ mùa xuân năm 1744 dưới thời chúa Nguyễn Phúc Khoát. Đây là một trong những ngôi chùa cổ xưa nhất còn tồn tại tại Thành phố Hồ Chí Minh.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Kiến trúc Chữ Tam & Mái bánh ít xếp tầng',
          durationSec: 68,
          narration:
            'Sau đợt đại trùng tu của Thiền sư Viên Quang năm 1798, chùa định hình quy chuẩn kiến trúc chữ Tam gồm Chính điện, Giảng đường và Nhà trai nối tiếp nhau qua chín mươi tám cột gỗ quý vững chãi. Hệ mái ngói liệt dốc thoáng tạo dáng hình bánh ít cổ truyền mộc mạc mà trang nghiêm.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Hơn một trăm pho tượng gỗ mít thếp vàng',
          durationSec: 68,
          narration:
            'Bước vào Chính điện, du khách được chiêm ngưỡng bộ sưu tập hơn một trăm mười ba pho tượng cổ tạc bằng gỗ mít thếp vàng, nổi bật là tượng Bồ tát Quan Thế Âm Chuẩn Đề mười tám tay và bộ Thập Bát La Hán sinh động. Bao lam chạm khắc tùng hạc, hoa sen tỏa nét tinh xảo của mỹ thuật điêu khắc thế kỷ XVIII.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Tháp Xá Lợi 7 tầng & Mạch nguồn kiến trúc gỗ',
          durationSec: 59,
          narration:
            'Bên cạnh cây bồ đề cổ thụ và Bảo tháp Xá Lợi bảy tầng cao ba mươi hai mét, Chùa Giác Lâm còn kết nối mật thiết về kỹ thuật mộc cổ truyền với Nhà Lớn Long Sơn và Nhà cổ Trần Công Vàng ở Bình Dương.',
        },
      ],
    },
    en: {
      folioTitle: 'Giac Lam Pagoda — Nearly 300 Years of Southern Buddhist Heritage',
      durationLabel: '04:00',
      totalDurationSec: 240,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'The Oldest Temple of Gia Dinh',
          durationSec: 58,
          narration:
            'Resting peacefully atop Cam Son Mound in Tan Binh District, Giac Lam Pagoda was founded in the spring of 1744 under the Nguyen Lords. It stands today as one of the oldest surviving Buddhist temples in Ho Chi Minh City.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'Three-Hall Alignment & Timber Joinery',
          durationSec: 64,
          narration:
            'Expanded in 1798 by Zen Master Vien Quang, the sanctuary follows the classic southern three-hall layout—Main Sanctuary, Dharma Lecture Hall, and Refectory—supported by ninety-eight towering ironwood and jackfruit pillars beneath gentle, overlapping clay-tile roofs.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Gilded Jackfruit-Wood Statues',
          durationSec: 64,
          narration:
            'Inside the candlelit sanctuary reside over one hundred thirteen antique wooden statues carved from seasoned jackfruit timber and finished in red lacquer and gold leaf, alongside finely pierced wooden screens depicting pine, crane, and lotus motifs.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'Seven-Tiered Stupa & Regional Timber Lineage',
          durationSec: 54,
          narration:
            'Framed by an ancient Bodhi tree and a thirty-two-meter seven-tiered relic stupa, Giac Lam Pagoda shares deep architectural kinship with Long Son Big House and the Tran Cong Vang Ancient House in Binh Duong.',
        },
      ],
    },
    zh: {
      folioTitle: '觉林寺 — 近三百年历史的南越禅宗古刹',
      durationLabel: '03:55',
      totalDurationSec: 235,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '嘉定地区最古老的禅林古刹',
          durationSec: 56,
          narration:
            '坐落于新平郡锦山高岗之上的觉林寺，始建于一七四四年阮主时期，是胡志明市现存历史最悠久、保存最完整的南部临济宗古刹。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '汉字“三”字布局与传统木构大殿',
          durationSec: 62,
          narration:
            '经一七九八年圆光禅师扩建重修后，全寺呈现出正殿、讲堂与斋堂纵向相接的“三”字形经典南越建筑格局。殿内九十八根粗壮木柱撑起厚重古朴的瓦顶，庭院绿树成荫，幽静肃穆。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '百余尊菠萝蜜木贴金古佛造像',
          durationSec: 64,
          narration:
            '正殿内部供奉着一百一十三尊清代与近代珍稀木雕古佛，皆由坚硬耐腐的菠萝蜜木雕琢而成，通体朱漆贴金。其中准提观音与十八罗汉造像神态各异，镂空松鹤莲花隔扇工艺精湛。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '七层舍利塔与南方木艺传承',
          durationSec: 53,
          narration:
            '古寺外矗立着三十二米高的七层舍利宝塔与百年菩提树。觉林寺的传统穿斗榫卯木工技艺，与头顿龙山大屋及平阳陈公黄古宅一脉相承。',
        },
      ],
    },
  },

  'HCM-DT-012': {
    vi: {
      folioTitle: 'Hội quán Nghĩa An — Tinh hoa chạm gỗ Triều Châu giữa lòng Chợ Lớn',
      durationLabel: '04:05',
      totalDurationSec: 245,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Di sản tín ngưỡng của bang Triều Châu',
          durationSec: 58,
          narration:
            'Tọa lạc tại số 678 Nguyễn Trãi, Quận 5, Hội quán Nghĩa An—còn được gọi là Chùa Ông—do cộng đồng người Hoa gốc Triều Châu khởi dựng từ đầu thế kỷ XIX nhằm thờ phụng Quan Thánh Đế Quân và gắn kết nghĩa tình đồng hương tại vùng Chợ Lớn.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Nóc mái gốm Cây Mai & Kiến trúc chữ Đinh',
          durationSec: 65,
          narration:
            'Công trình mang bố cục khép kín hài hòa gồm sân tiền cảnh, Tiền điện, sân thiên tỉnh lấy sáng tự nhiên và Chính điện. Trên bờ nóc mái ngói âm dương cong vút là hàng trăm tiểu tượng gốm men xanh ngọc sản xuất tại lò gốm Cây Mai Chợ Lớn từ đợt đại trùng tu năm 1902.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Nghệ thuật chạm lộng gỗ thếp vàng & Ngựa Xích Thố',
          durationSec: 66,
          narration:
            'Bên trong hội quán rực rỡ sắc vàng son của những bức bao lam gỗ căm xe chạm lộng đa tầng khắc họa điển tích Tam Quốc. Nổi bật ở gian Tiền điện là tượng ngựa Xích Thố tạc gỗ lớn oai nghiêm gắn liền với tục chui bụng ngựa cầu bình an vào dịp Rằm tháng Giêng hằng năm.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Điểm sáng giao lưu văn hóa Việt - Hoa',
          durationSec: 56,
          narration:
            'Được xếp hạng Di tích Kiến trúc Nghệ thuật cấp Quốc gia năm 1993, Hội quán Nghĩa An là viên ngọc di sản tiêu biểu trong tuyến khám phá kiến trúc tín ngưỡng Chợ Lớn - Sài Gòn.',
        },
      ],
    },
    en: {
      folioTitle: 'Nghia An Assembly Hall — Masterwork of Chaozhou Woodcarving',
      durationLabel: '03:50',
      totalDurationSec: 230,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'Sanctuary of the Chaozhou Community in Cho Lon',
          durationSec: 55,
          narration:
            'Standing on Nguyen Trai Street in the heart of Cho Lon, Nghia An Assembly Hall was established in the early nineteenth century by the Chaozhou Chinese community as both a civic guildhall and a temple honoring Guan Yu, patron of integrity and brotherhood.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'Cay Mai Glazed Ceramic Roofs & Skywell Courtyard',
          durationSec: 62,
          narration:
            'The sanctuary unfolds around an open central skywell courtyard that fills the timber halls with daylight and incense smoke. Along the curved eaves dance hundreds of emerald and cobalt ceramic figurines crafted by Saigon’s historic Cay Mai kilns during the 1902 restoration.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Gilded Timber Carvings & The Red Hare Steed',
          durationSec: 63,
          narration:
            'Inside, deep-relief gilded wooden screens depict episodes from the Romance of the Three Kingdoms in breathtaking detail. At the front hall stands the famous life-sized statue of the Red Hare warhorse, where visitors pass beneath its belly during Lunar New Year for blessings and good fortune.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'National Heritage of Cho Lon',
          durationSec: 50,
          narration:
            'Recognized as a National Architectural and Artistic Monument in 1993, Nghia An Assembly Hall shines as a living testament to centuries of Vietnamese and Chinese cultural harmony in Ho Chi Minh City.',
        },
      ],
    },
    zh: {
      folioTitle: '义安会馆（堤岸关帝庙） — 潮州木雕与梅树窑陶艺瑰宝',
      durationLabel: '03:45',
      totalDurationSec: 225,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '堤岸潮州先贤的忠义圣殿',
          durationSec: 54,
          narration:
            '位于第五郡阮廌街六百七十八号的义安会馆，俗称堤岸关帝庙，由潮州籍华侨先辈始建于十九世纪初，主祀关圣帝君，是凝聚西贡堤岸潮人社群的核心文化地标。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '天井采光与梅树窑屋脊彩塑',
          durationSec: 60,
          narration:
            '会馆采用传统“丁”字形格局，经前庭、前殿穿过开阔天井直入正殿，通风采光极佳。屋脊之上缀满了公元一九零二年大修时由本地梅树古窑烧制的青翠釉陶龙凤与戏曲人物群像，在阳光下流光溢彩。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '潮州金漆木雕与赤兔马民俗',
          durationSec: 61,
          narration:
            '殿内高悬多层镂空金漆木雕挂落与横匾，精雕三国演义经典典故。前殿左侧高大的木雕赤兔马威风凛凛，每年元宵节都会吸引成千上万民众前来钻马腹、摸马铃，祈求全年顺遂安康。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '堤岸多元文化交融典范',
          durationSec: 50,
          narration:
            '一九九三年获评为国家级建筑艺术遗迹，义安会馆至今香火缭绕，生动展现越中文化在西贡交汇共荣的百年历史记忆。',
        },
      ],
    },
  },

  'BRVT-DT-001': {
    vi: {
      folioTitle: 'Bạch Dinh (Villa Blanche) — Tuyệt tác Tân Cổ điển trên sườn Núi Lớn',
      durationLabel: '04:20',
      totalDurationSec: 260,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Dinh thự trắng trên nền pháo đài Phước Thắng',
          durationSec: 62,
          narration:
            'Tọa lạc trên sườn Núi Lớn ở độ cao gần hai mươi tám mét nhìn ra vịnh Bãi Trước Vũng Tàu, Bạch Dinh—tên Pháp là Villa Blanche—được Toàn quyền Đông Dương Paul Doumer cho khởi công vào năm 1898 và hoàn thành năm 1902 ngay trên nền pháo đài Phước Thắng cổ.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Ngôn ngữ kiến trúc Pháp & Phù điêu gốm sứ Hy Lạp',
          durationSec: 70,
          narration:
            'Tòa dinh thự ba tầng cao mười chín mét nổi bật với bức tường quét vôi trắng muốt dưới tán rừng hoa sứ cổ thụ và mái ngói đỏ Marseille. Bao quanh tầng thượng là tám bức tượng bán thân và phù điêu gốm men màu khắc họa thần thoại Hy Lạp cổ đại tinh xảo.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Ký ức Vua Thành Thái & Cổ vật gốm sứ Hòn Cau',
          durationSec: 70,
          narration:
            'Từ năm 1907 đến năm 1916, Bạch Dinh từng là nơi thực dân Pháp giam lỏng vị hoàng đế yêu nước Thành Thái trước khi đày sang đảo Réunion. Ngày nay, bên trong dinh trưng bày nhiều bộ sưu tập gốm sứ cổ đời Khang Hy được trục vớt từ tàu đắm vùng biển Hòn Cau - Côn Đảo.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Kết nối di sản kiến trúc Sài Gòn - Vũng Tàu',
          durationSec: 58,
          narration:
            'Ra đời cùng thời điểm với Nhà hát Thành phố Sài Gòn năm 1898, Bạch Dinh tạo thành mắt xích kiến trúc Tân Cổ điển duyên hải tuyệt đẹp trên tuyến hành trình di sản liên vùng.',
        },
      ],
    },
    en: {
      folioTitle: 'Villa Blanche (White Palace) — French Neoclassical Clifftop Sanctuary',
      durationLabel: '04:00',
      totalDurationSec: 240,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'Clifftop Villa Overlooking Front Beach',
          durationSec: 58,
          narration:
            'Perched nearly twenty-eight meters above sea level on the forested slope of Big Mountain in Vung Tau, Villa Blanche was commissioned in 1898 by Governor-General Paul Doumer atop the historic ruins of the Nguyen-era Phuoc Thang coastal battery.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'Chalk-White Walls & Ceramic Bust Medallions',
          durationSec: 65,
          narration:
            'Rising three stories under vibrant red Marseille clay tiles, the luminous white villa is framed by centuries-old frangipani trees. Its exterior facade showcases eight glazed European ceramic busts and classical reliefs inspired by Greek antiquity.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Emperor Thanh Thai & Maritime Porcelain Treasures',
          durationSec: 65,
          narration:
            'Between 1907 and 1916, Villa Blanche served as the place of house arrest for the patriotic Vietnamese Emperor Thanh Thai prior to his exile to Réunion Island. Today, its galleries exhibit Kangxi-era blue-and-white porcelain recovered from historic shipwrecks off Hon Cau.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'Architectural Twin to Colonial Saigon',
          durationSec: 52,
          narration:
            'Broken ground the very same year as Saigon’s Municipal Theatre in 1898, Villa Blanche completes the coastal French Neoclassical chapter of our Southeast Vietnam heritage route.',
        },
      ],
    },
    zh: {
      folioTitle: '头顿白宫（布朗什别墅） — 大山海岸之畔的法式新古典行宫',
      durationLabel: '03:55',
      totalDurationSec: 235,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '远眺前滩的海岸白宫',
          durationSec: 56,
          narration:
            '矗立于头顿市大山山腰二十八米高处的白宫，法语原名为布朗什别墅，由法国驻印度支那总督保罗·杜美于一八九八年在阮朝福胜炮台旧址之上兴建，一九零二年落成。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '马赛红瓦与古希腊彩釉浮雕',
          durationSec: 62,
          narration:
            '整座三层建筑掩映在百年鸡蛋花古林之间，通体洁白典雅，顶部覆以法国马赛红瓦。外立面环绕镶嵌着八尊源自欧洲工艺的彩釉陶雕半身像与古希腊神话人物浮雕，艺术气息浓郁。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '成泰帝历史记忆与昆仑岛出水古瓷',
          durationSec: 65,
          narration:
            '一九零七年至一九一六年，爱国皇帝成泰帝曾在此被法国殖民当局软禁十年，而后流放印度洋留尼汪岛。如今馆内陈列着从昆仑岛和梂岛海底古沉船打捞出的珍贵康熙年间青花瓷器。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '西贡与头顿的法式建筑共鸣',
          durationSec: 52,
          narration:
            '白宫与胡志明市大剧院同于一八九八年奠基，一山海一都会，共同构成了越南东南部最为经典的新古典主义建筑遗产旅游线路。',
        },
      ],
    },
  },

  'BRVT-DT-002': {
    vi: {
      folioTitle: 'Quần thể Nhà Lớn Long Sơn — Tinh hoa kiến trúc gỗ & văn hóa mở cõi',
      durationLabel: '04:35',
      totalDurationSec: 275,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Dấu ấn Ông Trần khai khẩn đảo Long Sơn',
          durationSec: 65,
          narration:
            'Tọa lạc trên xã đảo Long Sơn thanh bình của thành phố Vũng Tàu, Quần thể kiến trúc Nhà Lớn Long Sơn—thường gọi là Đền Ông Trần—do ông Lê Văn Mưu cùng cư dân khởi dựng từ năm 1910 đến năm 1929 trên diện tích rộng khoảng hai héc-ta.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Ba phân khu giật cấp trên sườn núi Nứa',
          durationSec: 74,
          narration:
            'Lợi dụng địa hình sườn núi Nứa, quần thể được bố trí giật cấp gồm Khu Đền thờ tôn nghiêm, Khu Nhà hội - nhà khách cộng đồng và Khu lầu dài, trường học, nhà bảo tồn ghe sấm. Toàn bộ khung sườn dựng hoàn toàn bằng gỗ căm xe và gỗ dầu liên kết mộng chốt cổ truyền.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Nếp sống hiếu khách & Di sản tủ thờ cẩn xà cừ',
          durationSec: 74,
          narration:
            'Bên trong Nhà Lớn lưu giữ hàng chục bộ trường kỷ, tủ thờ khảm ốc xà cừ hơn một trăm năm tuổi cùng không gian sinh hoạt cởi mở từng nuôi ăn ở miễn phí cho mọi lữ khách ghé đảo. Cư dân theo đạo Ông Trần vẫn giữ nếp sống mộc mạc với áo bà ba đen, tóc búi củ hành và lòng nhân ái cộng đồng.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Tam giác vàng kiến trúc gỗ Nam Bộ',
          durationSec: 62,
          narration:
            'Khi đặt cạnh Tổ đình Giác Lâm năm 1744 tại Thành phố Hồ Chí Minh và Nhà cổ Trần Công Vàng năm 1889 tại Bình Dương, Nhà Lớn Long Sơn hoàn thiện bức tranh tam giác vàng về kỹ thuật mộc cổ truyền vùng Đông Nam Bộ.',
        },
      ],
    },
    en: {
      folioTitle: 'Long Son Big House Complex — Vernacular Southern Timber Heritage',
      durationLabel: '04:10',
      totalDurationSec: 250,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'Master Le Van Muu and the Settling of Long Son Island',
          durationSec: 60,
          narration:
            'Nestled on tranquil Long Son Island near Vung Tau, the Long Son Big House Complex—revered locally as Ong Tran Temple—was built between 1910 and 1929 by pioneer leader Le Van Muu and island villagers across a two-hectare terraced hillside.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'Interconnected Timber Halls & Mortise-Tenon Joinery',
          durationSec: 68,
          narration:
            'Stepping harmoniously up the slope of Nua Mountain, the complex comprises a Sacred Sanctuary Zone, public assembly halls and guest houses, and traditional schools and granaries. Hundreds of seasoned ironwood pillars lock together using pure southern mortise-and-tenon carpentry.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Mother-of-Pearl Altars & Community Hospitality',
          durationSec: 66,
          narration:
            'Inside, century-old altars inlaid with glowing mother-of-pearl stand beside long communal dining tables where travelers have been welcomed free of charge for generations. Local followers preserve distinctive traditions of wearing black ba ba tunics, braided hair buns, and practicing selfless generosity.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'The Southern Timber Heritage Triangle',
          durationSec: 56,
          narration:
            'Alongside Giac Lam Pagoda in Ho Chi Minh City and the Tran Cong Vang Ancient House in Binh Duong, Long Son Big House anchors the living timber-craftsmanship triad of Southeast Vietnam.',
        },
      ],
    },
    zh: {
      folioTitle: '龙山大屋古建筑群 — 百年榫卯木构与淳朴开放的南越民风',
      durationLabel: '04:05',
      totalDurationSec: 245,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '陈爷开垦龙山岛的传奇',
          durationSec: 58,
          narration:
            '坐落于头顿市宁静龙山岛上的龙山大屋，当地尊称为陈爷庙，由乡贤黎文谋先生于一九一零年至一九二九年间率领乡民共同修建，占地约两公顷。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '依山错落的穿斗榫卯木结构群',
          durationSec: 66,
          narration:
            '顺应山坡地势，建筑群划分为庄严祭祀区、公共会堂客房区及免费学堂粮仓区三大板块。整座群落皆采用铁木与油木以传统榫卯技艺严丝合缝搭建而成，覆盖阴阳土瓦。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '螺钿镶嵌古器与好客古风',
          durationSec: 65,
          narration:
            '正殿之内保存着数十件百余年历史的螺钿镶嵌红木神龛与长条木榻。百年来，龙山大屋秉持慷慨布施、免费接待四方旅人食宿的古风，当地居民至今仍保持着身着黑衣婆衫、挽发髻的淳朴传统。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '东南部传统木构建筑金三角',
          durationSec: 56,
          narration:
            '与胡志明市觉林寺及平阳省陈公黄古宅遥相辉映，龙山大屋共同构成了越南东南部木雕与营造技艺最具代表性的文化遗产金三角。',
        },
      ],
    },
  },

  'BRVT-DT-003': {
    vi: {
      folioTitle: 'Địa đạo Long Phước — Pháo đài ngầm kiên cường cửa ngõ Bà Rịa',
      durationLabel: '04:45',
      totalDurationSec: 285,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Từ hầm bí mật 1948 đến mạng lưới liên ấp',
          durationSec: 65,
          narration:
            'Cùng ra đời từ năm 1948 như Địa đạo Củ Chi, Khu di tích Địa đạo Long Phước tại thành phố Bà Rịa bắt đầu từ những căn hầm bí mật tại năm ấp trong xã. Đến năm 1963, quân và dân Long Phước đã nối thông các cụm hầm thành mạng lưới xương sống liên hoàn dài nhiều ki-lô-mét.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Cấu trúc xương cá & Kích thước lòng hầm cơ động',
          durationSec: 78,
          narration:
            'Khác với nhiều địa đạo khác, đường xương sống của Địa đạo Long Phước nằm sâu cách mặt đất từ ba đến sáu mét với lòng hầm cao từ một mét năm đến một mét sáu, rộng tám tấc, giúp chiến sĩ di chuyển và vận chuyển thương binh rất linh hoạt. Từ trục chính tỏa ra các nhánh xương cá dẫn tới ụ chiến đấu, hầm cứu thương và kho lương thực.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Độ bền địa chất đất cát pha đá ong Bà Rịa',
          durationSec: 74,
          narration:
            'Được đào trong tầng đất thịt pha đá ong rắn chắc đặc trưng của vùng gò đồi Bà Rịa, hệ thống giếng thông hơi và cửa hầm ngụy trang bằng tre gỗ đã đứng vững trước những trận càn ác liệt kéo dài suốt hai cuộc kháng chiến, được công nhận Di tích Lịch sử cấp Quốc gia năm 1990.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Huyền thoại thế trận lòng đất Đông Nam Bộ',
          durationSec: 68,
          narration:
            'Ngày nay, tuyến tham quan liên vùng Củ Chi - Tam Giác Sắt - Long Phước tôn vinh trí tuệ quân sự nhân dân kiệt xuất xuyên suốt ba tỉnh thành vùng Đông Nam Bộ.',
        },
      ],
    },
    en: {
      folioTitle: 'Long Phuoc Tunnels — Tactical Underground Stronghold of Ba Ria',
      durationLabel: '04:10',
      totalDurationSec: 250,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'Five Villages Linked Underground Since 1948',
          durationSec: 58,
          narration:
            'Initiated in 1948 alongside the famous Cu Chi network, Long Phuoc Tunnels in Ba Ria began as concealed family bunkers across five neighboring hamlets. By 1963, local forces linked every cluster into a unified spine-and-rib subterranean defense corridor.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'Fishbone Gallery Design & Rapid Mobility',
          durationSec: 68,
          narration:
            'Carved three to six meters beneath the surface, Long Phuoc’s central trunk rises up to one point six meters high and eighty centimeters wide—generous enough for swift troop movement and stretcher evacuation. Side branches radiate like fishbones toward surface fighting pits, underground clinics, and grain vaults.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Resilient Lateritic Soil & National Recognition',
          durationSec: 66,
          narration:
            'Reinforced naturally by Ba Ria’s compact lateritic clay and discreet bamboo air shafts, the tunnels sheltered defenders through decades of fierce campaigns and earned National Historical Monument status in 1990.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'Part of the Inter-Regional Underground Triad',
          durationSec: 58,
          narration:
            'Today, Long Phuoc Tunnels join Cu Chi in Ho Chi Minh City and the Iron Triangle in Binh Duong along the celebrated Underground Cities inter-regional heritage route.',
        },
      ],
    },
    zh: {
      folioTitle: '龙福地道 — 贯穿巴地五村的鱼骨式地下钢铁防线',
      durationLabel: '04:00',
      totalDurationSec: 240,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '一九四八年诞生的巴地地下网络',
          durationSec: 56,
          narration:
            '与古芝地道同于一九四八年启建，位于巴地市的龙福地道最初由当地五个村落的秘密防空掩体发展而来，并于一九六三年全面打通连接成贯通全社的地下战略骨干网。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '高大主干道与“鱼骨式”战术分支',
          durationSec: 66,
          narration:
            '龙福地道主干道深埋地下三至六米，通道高达一米五至一米六、宽约零点八米，空间较一般地道更为宽敞，便于快速机动兵力与转运伤员；两侧呈“鱼骨式”延伸至地面隐蔽火力点、地下野战救护所与储粮室。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '坚固红壤与光荣抗战印记',
          durationSec: 62,
          narration:
            '依托巴地丘陵坚硬的红土铁盘黏土层及隐蔽竹木通风井，龙福地道历经漫长战火依然屹立不倒，并于一九九零年正式获评国家级历史遗迹。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '东南部地下城市主题路线枢纽',
          durationSec: 56,
          narration:
            '如今，龙福地道与古芝地道及平阳省铁三角地道共同串联起“东南部地下传奇”跨区域红色研学路线，向世人展现非凡的民间国防智慧。',
        },
      ],
    },
  },

  'BD-DT-001': {
    vi: {
      folioTitle: 'Nhà cổ Trần Công Vàng — Đỉnh cao chạm khắc gỗ Phú Cường - Thủ Dầu Một',
      durationLabel: '04:15',
      totalDurationSec: 255,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Ngôi nhà rường trăm tuổi bên sông Sài Gòn',
          durationSec: 60,
          narration:
            'Tọa lạc tại phường Phú Cường, thành phố Thủ Dầu Một, tỉnh Bình Dương, Nhà cổ Trần Công Vàng được xây dựng ròng rã suốt ba năm từ 1889 đến 1892. Ngôi nhà nằm gần bến sông Sài Gòn xưa, từng là tư gia bề thế của một gia tộc gắn bó với nghề thương mại vùng Đất Thủ.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Bố cục Chữ Đinh 5 gian 2 chái & 60 cột gỗ quý',
          durationSec: 68,
          narration:
            'Công trình rộng hơn ba trăm ba mươi mét vuông theo kiểu nhà rường chữ Đinh năm gian hai chái, lợp ngói âm dương thoáng mát. Toàn bộ bộ khung đồ sộ dựng bằng sáu mươi cột tròn gỗ căm xe và gỗ gõ đỏ đặt trên chân tảng đá xanh, liên kết mộng chốt không dùng đinh sắt.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Nghệ thuật chạm lộng Tứ linh & khảm xà cừ',
          durationSec: 68,
          narration:
            'Giá trị vô song của ngôi nhà nằm ở hệ thống bao lam, hương án và hoành phi chạm lộng xuyên thủng nhiều lớp với đề tài Tứ linh và Mai - Lan - Cúc - Trúc sơn son thếp vàng lộng lẫy. Đó là kết tinh tay nghề điêu luyện của hai nhóm thợ mộc tài hoa Đất Thủ và cố đô Huế cuối thế kỷ XIX.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Di sản kiến trúc dân gian liên vùng',
          durationSec: 59,
          narration:
            'Được xếp hạng Di tích Kiến trúc Nghệ thuật cấp Quốc gia năm 1993, Nhà cổ Trần Công Vàng nối liền mạch di sản kiến trúc gỗ Nam Bộ cùng Chùa Giác Lâm tại Thành phố Hồ Chí Minh và Nhà Lớn Long Sơn ở Vũng Tàu.',
        },
      ],
    },
    en: {
      folioTitle: 'Tran Cong Vang Ancient House — Masterpiece of Binh Duong Woodcarving',
      durationLabel: '03:55',
      totalDurationSec: 235,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'A Nineteenth-Century Mansion by the Saigon River',
          durationSec: 56,
          narration:
            'Set along historic Bach Dang Street in Thu Dau Mot City, Binh Duong Province, the Tran Cong Vang Ancient House took three full years of handcraftsmanship from 1889 to 1892 to complete.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'T-Shaped Timber Frame & Sixty Hardwood Columns',
          durationSec: 64,
          narration:
            'Spanning over three hundred thirty square meters in a classic five-bay, two-wing traditional layout, the house is supported by sixty cylindrical rosewood and ironwood pillars resting upon carved blue-stone plinths, locked entirely by traditional joinery without iron nails.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Openwork Relief Carvings & Mother-of-Pearl Inlay',
          durationSec: 62,
          narration:
            'Master carvers from Phu Cuong and royal Hue spent years sculpting multi-layered openwork screens, gilded altars, and calligraphic couplets depicting the Four Sacred Beasts and the Four Seasons of plum, orchid, chrysanthemum, and bamboo.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'Cornerstone of Southern Woodcraft Heritage',
          durationSec: 53,
          narration:
            'Protected as a National Architectural Monument since 1993, this residence completes the regional timber heritage corridor connecting Binh Duong with Ho Chi Minh City and Ba Ria - Vung Tau.',
        },
      ],
    },
    zh: {
      folioTitle: '陈公黄古宅 — 土龙木穿斗木雕与螺钿镶嵌百年豪宅',
      durationLabel: '03:50',
      totalDurationSec: 230,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '西贡河畔的百年名门府邸',
          durationSec: 54,
          narration:
            '坐落于平阳省土龙木市富强坊白藤街的陈公黄古宅，建于一八八九年至一八九二年间，由一代能工巧匠历时整整三年精雕细琢落成，见证了昔日土龙木商埠的繁华。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '五间两厢“丁”字构与六十根硬木立柱',
          durationSec: 62,
          narration:
            '古宅主屋占地逾三百三十平方米，遵循南方传统五间两厢“丁”字形格局，顶覆阴阳古瓦。全屋以六十根名贵格木与红木圆柱置放于青石柱础之上，通体以纯木榫卯咬合，未用一颗铁钉。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '四时花鸟镂空贴金绝技',
          durationSec: 62,
          narration:
            '屋中最令人赞叹的是汇聚土龙木木雕艺人绝技的多层镂空花格、神龛与汉字楹联：梅兰竹菊四季花卉与四灵瑞兽栩栩如生，历时百余年依然金碧生辉。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '国家级建筑艺术传承',
          durationSec: 52,
          narration:
            '自一九九三年列为国家级建筑艺术遗迹以来，陈公黄古宅与胡志明市觉林寺及头顿龙山大屋并称东南部三大传世木构艺术宝藏。',
        },
      ],
    },
  },

  'BD-DT-002': {
    vi: {
      folioTitle: 'Địa đạo Tam Giác Sắt — Mắt xích chiến lược Tây Nam Bến Cát',
      durationLabel: '04:50',
      totalDurationSec: 290,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHƯƠNG I',
          title: 'Vành đai đỏ An Tây - An Điền - Phú An',
          durationSec: 66,
          narration:
            'Nằm bên bờ sông Sài Gòn thuộc thành phố Bến Cát, tỉnh Bình Dương, Khu di tích Địa đạo Tam Giác Sắt kết nối ba xã kiên cường An Tây, An Điền và Phú An. Được khởi đào từ năm 1948, nơi đây chính là người anh em chiến lược đối diện trực tiếp với Địa đạo Củ Chi qua dòng sông Sài Gòn.',
        },
        {
          id: 'ch2',
          roman: 'CHƯƠNG II',
          title: 'Hơn 100 km hầm ngầm nhiều tầng sâu tới 9 mét',
          durationSec: 80,
          narration:
            'Từ những đoạn hầm bí mật ban đầu, quân và dân Tây Nam Bến Cát đã mở rộng thành mạng lưới đường hầm dài hơn một trăm ki-lô-mét gồm hai đến ba tầng, sâu từ bốn đến chín mét trong tầng đất sét đá ong rắn chắc. Các ụ chiến đấu nổi được bố trí dày đặc dọc trục xương sống cách nhau chỉ khoảng mười lăm mét.',
        },
        {
          id: 'ch3',
          roman: 'CHƯƠNG III',
          title: 'Bến vượt sông & Thế trận đánh bại chiến dịch Cedar Falls',
          durationSec: 80,
          narration:
            'Năm 1967, giữa vòng vây của chiến dịch càn quét quy mô lớn Cedar Falls, hệ thống địa đạo Tam Giác Sắt cùng các bến vượt sông Sài Gòn đã giúp lực lượng kháng chiến cơ động phối hợp nhịp nhàng với Củ Chi, làm thất bại ý đồ xóa sổ vùng căn cứ cửa ngõ Bắc Sài Gòn.',
        },
        {
          id: 'ch4',
          roman: 'CHƯƠNG IV',
          title: 'Hành trình về nguồn ven sông Sài Gòn',
          durationSec: 64,
          narration:
            'Được xếp hạng Di tích Lịch sử cấp Quốc gia năm 1996, khuôn viên rộng hai mươi ba héc-ta ngày nay bảo tồn đền tưởng niệm, sa bàn chiến dịch và đoạn hầm phục dựng giúp du khách trải nghiệm trọn vẹn mạch kết nối Củ Chi - Bến Cát - Long Phước.',
        },
      ],
    },
    en: {
      folioTitle: 'Iron Triangle Tunnels — Strategic Twin of Cu Chi in Binh Duong',
      durationLabel: '04:15',
      totalDurationSec: 255,
      chapters: [
        {
          id: 'ch1',
          roman: 'CHAPTER I',
          title: 'Across the River from Cu Chi',
          durationSec: 60,
          narration:
            'Positioned strategically along the eastern bank of the Saigon River in Ben Cat, Binh Duong Province, the Iron Triangle Tunnels unite the historic communes of An Tay, An Dien, and Phu An. Excavated starting in 1948, this bastion formed the vital strategic counterpart right across the river from Cu Chi.',
        },
        {
          id: 'ch2',
          roman: 'CHAPTER II',
          title: 'Over 100 Kilometers of Multi-Level Fortifications',
          durationSec: 68,
          narration:
            'Expanding across more than one hundred kilometers of passages, the Iron Triangle network descends four to nine meters through hardened lateritic earth in two and three stacked levels, studded with fortified fighting bunkers spaced roughly every fifteen meters.',
        },
        {
          id: 'ch3',
          roman: 'CHAPTER III',
          title: 'Resisting Operation Cedar Falls in 1967',
          durationSec: 69,
          narration:
            'During the massive 1967 Operation Cedar Falls campaign, concealed Saigon River crossing points allowed defenders in Ben Cat and Cu Chi to coordinate underground logistics and hold the northern gateway to Saigon against overwhelming odds.',
        },
        {
          id: 'ch4',
          roman: 'CHAPTER IV',
          title: 'Memorial Park Along the Saigon River Corridor',
          durationSec: 58,
          narration:
            'Designated a National Historical Monument in 1996, the twenty-three-hectare memorial site preserves reconstructed tunnel segments and battlefield dioramas linking Binh Duong directly with Cu Chi and Ba Ria - Vung Tau.',
        },
      ],
    },
    zh: {
      folioTitle: '铁三角地道 — 与古芝地道隔河呼应的槟吉地下防御枢纽',
      durationLabel: '04:10',
      totalDurationSec: 250,
      chapters: [
        {
          id: 'ch1',
          roman: '第一章',
          title: '安田、安西、富安三社红色阵地',
          durationSec: 58,
          narration:
            '坐落于平阳省槟吉市西贡河畔战略要冲的铁三角地道，串联起安田、安西与富安三座英雄乡社。自一九四八年动工开凿以来，这里与一河之隔的古芝地道形成唇齿相依的战略犄角。',
        },
        {
          id: 'ch2',
          roman: '第二章',
          title: '百公里多层地下工程纵深',
          durationSec: 66,
          narration:
            '槟吉西南军民在坚硬红土铁盘黏土中修筑了总长逾一百公里的双层乃至三层立体地道体系，深达地下四至九米，沿主干道每隔约十五米便设有一处隐蔽地面战斗掩体，攻防一体。',
        },
        {
          id: 'ch3',
          roman: '第三章',
          title: '西贡河渡口与一九六七年反扫荡传奇',
          durationSec: 68,
          narration:
            '一九六七年面对大规模雪松瀑布扫荡战役时，铁三角地道依托隐蔽的西贡河秘密渡口与古芝地道紧密联动，灵活机动保存主力，成功守住了西贡北大门的咽喉通道。',
        },
        {
          id: 'ch4',
          roman: '第四章',
          title: '跨区域历史研学纪念园区',
          durationSec: 58,
          narration:
            '一九九六年获列为国家级历史文化遗迹。如今占地二十三公顷的纪念园区保留了复原体验地道、战役沙盘与烈士纪念堂，生动串联起平阳、胡志明市与巴地头顿的三城历史印记。',
        },
      ],
    },
  },
};

export function getCuratedAudioScript(siteId: string, lang: Language | 'vn'): SiteLanguageAudioScript | null {
  const normalized: Language = lang === 'vn' ? 'vi' : lang;
  const entry = AUDIO_GUIDE_SCRIPTS[siteId];
  const baseScript = entry ? entry[normalized] || entry.vi : null;

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('dau_an_viet_audio_script_overrides_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as Record<
          string,
          {
            folioTitle?: string;
            chapters?: CuratedAudioChapter[];
          }
        >;
        const overrideKey = `${siteId}__${normalized}`;
        const override = parsed?.[overrideKey];
        if (override && Array.isArray(override.chapters) && override.chapters.length > 0) {
          const totalDurationSec = override.chapters.reduce(
            (sum, ch) => sum + Math.max(15, Number(ch.durationSec) || 60),
            0
          );
          const min = Math.floor(totalDurationSec / 60);
          const sec = totalDurationSec % 60;
          return {
            folioTitle:
              override.folioTitle?.trim() || baseScript?.folioTitle || siteId,
            durationLabel: `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`,
            totalDurationSec,
            chapters: override.chapters,
          };
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  return baseScript;
}
