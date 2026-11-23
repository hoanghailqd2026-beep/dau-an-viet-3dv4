import { HeritageSite } from '../types/heritage';
import { Language } from '../i18n/types';

export interface LocalizedText {
  vi: string;
  en: string;
  zh: string;
}

export interface MonumentArchitectPersona {
  name: string;
  role: LocalizedText;
  greeting: LocalizedText;
  systemNote: string;
}

export interface MonumentEyewitnessPersona {
  name: string;
  era?: string;
  role: LocalizedText;
  greeting: LocalizedText;
  systemNote: string;
}

export interface MonumentMysteryConfig {
  title: LocalizedText;
  riddle: LocalizedText;
  hintTip: LocalizedText;
  targetHotspotIndex: number;
  targetCenter: [number, number, number];
  acceptRadius: number;
  revealMode: 'exploded' | 'xray';
  secretTitle: LocalizedText;
  secretStory: LocalizedText;
  stampCode: string;
}

export interface LivingDocentSiteConfig {
  architect: MonumentArchitectPersona;
  eyewitness: MonumentEyewitnessPersona;
  polymathSources: string;
  polymathContext: string;
  mystery: MonumentMysteryConfig;
}

export const LIVING_DOCENT_SITE_DATA: Record<string, LivingDocentSiteConfig> = {
  'HCM-DT-001': {
    architect: {
      name: 'KTS. Ngô Viết Thụ',
      role: {
        vi: 'Khôi nguyên La Mã 1955 · Tác giả Dinh Độc Lập',
        en: 'Prix de Rome Laureate · Architect of Independence Palace',
        zh: '罗马大奖得主 · 独立宫总建筑师吴曰树',
      },
      greeting: {
        vi: 'Tôi là KTS. Ngô Viết Thụ. Khi đặt bút vẽ Dinh Độc Lập năm 1962, tôi đã chiết tự chữ Hán (Cát 吉, Khẩu 口, Trung 中, Tam 三) để lồng triết lý phương Đông vào kết cấu bê tông hiện đại và bức rèm hoa đá đốt trúc.',
        en: 'I am architect Ngo Viet Thu. Designing the Palace in 1962, I embedded classical Confucian calligraphy (Ji 吉, Kou 口, Zhong 中) inside tropical modernist concrete and the stylized bamboo stone brise-soleil.',
        zh: '我是建筑师吴曰树。1962年设计独立宫时，我将“吉、口、中、三”等东方汉字意象融入现代热带混凝土框架与竹节石雕遮阳幕墙之中。',
      },
      systemNote:
        'KTS. Ngô Viết Thụ — phân tích bố cục chữ Cát/Khẩu/Trung, rèm hoa đá đốt trúc chắn nắng hướng Đông-Nam, sảnh Đại lễ và kỹ thuật kết cấu chịu lực.',
    },
    eyewitness: {
      name: 'Chiến sĩ Thông tin Boong-ke 1975',
      role: {
        vi: 'Nhân chứng thời khắc lịch sử 30/04/1975',
        en: 'Eyewitness at Command Bunker B1 (April 30, 1975)',
        zh: '1975年4月30日历史时刻地下掩体亲历者',
      },
      greeting: {
        vi: 'Tháng Tư năm 1975, từng nhịp tim dưới tầng hầm boong-ke B1 đều dội theo tiếng xích xe tăng ngoài cổng sắt. Chiếc trực thăng UH-1 trên sân thượng vừa cất cánh rời đi thì khoảnh khắc non sông thu về một mối đã điểm.',
        en: 'In April 1975, every pulse inside the reinforced concrete B1 bunker echoed the rumble of tanks outside the iron gates. Moments after the rooftop UH-1 lifted off, history turned its decisive page.',
        zh: '1975年4月，钢筋混凝土B1地下指挥室里能清晰听见大门外坦克履带的轰鸣。天台UH-1直升机起飞后不久，国家统一的钟声随即敲响。',
      },
      systemNote:
        'Nhân chứng trực tiếp tại Dinh Độc Lập tháng 4/1975 — kể lại không khí phòng họp Nội các, sự kiện ném bom 08/04/1975 trên sân đáp trực thăng và thời khắc 11h30 ngày 30/04/1975.',
    },
    polymathSources:
      'Hồ sơ Di tích Quốc gia Đặc biệt Dinh Độc Lập (Cục Di sản Văn hóa, QĐ 1272/QĐ-TTg); Tuyển tập Kiến trúc Hiện đại Nhiệt đới Đông Nam Á; Văn khố Quốc gia Việt Nam.',
    polymathContext:
      'Đặt Dinh Độc Lập (1962–1966) trong bối cảnh kiến trúc Modernism hậu chiến cùng thời với Chandigarh (Ấn Độ) và Brasília, phản ánh đỉnh cao Chiến tranh Lạnh tại Đông Nam Á.',
    mystery: {
      title: {
        vi: 'Dấu vết Ngày 08/04/1975 trên Tầng Thượng',
        en: 'Traces of April 8, 1975 on the Rooftop Deck',
        zh: '屋顶平台上的1975年4月8日历史印记',
      },
      riddle: {
        vi: 'Hãy xoay mô hình lên tầng cao nhất và bấm trúng vị trí **bãi đáp chữ H có hai vòng tròn đỏ** — nơi lưu dấu sự kiện ngày 08/04/1975 cùng chiếc trực thăng UH-1!',
        en: 'Rotate to the uppermost terrace and click the **H helipad marked with two red circles** — where the April 8, 1975 event and UH-1 helicopter sit!',
        zh: '旋转模型俯瞰最高天台，点击带有**两个红色圆环的H形直升机坪**（记录1975年4月8日事件与UH-1直升机所在位置）！',
      },
      hintTip: {
        vi: 'Gợi ý: Nhìn lên tầng thượng phía sau trục giữa (gần chiếc trực thăng UH-1).',
        en: 'Tip: Look at the upper roof deck behind the center axis near the UH-1 rotor.',
        zh: '提示：观察建筑最高层屋顶后半部、UH-1直升机所在的位置。',
      },
      targetHotspotIndex: 5,
      targetCenter: [0, 10.1, -5.6],
      acceptRadius: 6.2,
      revealMode: 'exploded',
      secretTitle: {
        vi: 'Hai Vòng Tròn Đỏ & Mệnh Lệnh Trong Boong-ke B1',
        en: 'The Two Red Circles & Secret B1 Bunker Link',
        zh: '双红圈标记与B1地下掩体密道',
      },
      secretStory: {
        vi: 'Hai vòng tròn đỏ trên sân thượng đánh dấu chính xác hai quả bom do phi công Nguyễn Thành Trung thả ngày 08/04/1975, ngay phía trên trục thang bộ dẫn thẳng xuống boong-ke thép chịu bom sâu dưới lòng dinh.',
        en: 'The two crimson circles preserve the exact impact spots of pilot Nguyen Thanh Trung’s April 8, 1975 strike, sitting directly above the reinforced stairwell descending into the steel-lined command bunker.',
        zh: '平台上的两个红色圆环精准标记了1975年4月8日飞行员阮成中投弹的位置，其正下方即是直通防弹钢门地下指挥掩体的竖井楼梯。',
      },
      stampCode: 'STAMP-01-DINHDOCLAP',
    },
  },

  'HCM-DT-002': {
    architect: {
      name: 'KTS. Eugène Ferret',
      role: {
        vi: 'Kiến trúc sư trưởng Nhà hát Thành phố (1898 - 1900)',
        en: 'Chief Architect of Saigon Opera House (1898 - 1900)',
        zh: '西贡大剧院总建筑师 · 尤金·费雷 (1898-1900)',
      },
      greeting: {
        vi: 'Tôi là Eugène Ferret. Tôi nâng toàn bộ nền Nhà hát lên cao 2 mét để cách âm với phố xá và tái hiện cửa vòm Petit Palais cùng cặp tượng Nữ thần Caryatids đúc nguyên bản tại Paris.',
        en: 'I am Eugène Ferret. I raised the theatre plinth two meters above street level for acoustic isolation and crowned the portico with Flamboyant Beaux-Arts arches and Parisian Caryatids.',
        zh: '我是建筑师尤金·费雷。我将剧院台基抬高两米以隔绝街道噪音，并将巴黎小皇宫式的华丽拱门与女神柱雕刻移植到西贡。',
      },
      systemNote:
        'KTS. Eugène Ferret — phân tích phong cách Flamboyant Beaux-Arts, kết cấu âm học 3 tầng khán phòng móng ngựa, vòm Tympanum và mái Mansard lợp ngói phiến Ardoise.',
    },
    eyewitness: {
      name: 'Nghệ sĩ Đêm Khai Mạc 01/01/1900',
      role: {
        vi: 'Nghệ sĩ Opera có mặt trong đêm diễn đầu tiên thế kỷ XX',
        en: 'Opera Performer on Opening Night (Jan 1, 1900)',
        zh: '1900年1月1日首演夜歌剧亲历者',
      },
      greeting: {
        vi: 'Đêm giao thừa chuyển giao thế kỷ 1900, ánh đèn pha lê từ vòm trần rọi xuống hàng ghế nhung đỏ khi bức màn nhung vừa kéo lên, tiếng vỗ tay vang dội khắp công trường Lam Sơn.',
        en: 'On the opening night of 1900, crystal chandeliers illuminated the red velvet stalls as applause echoed out onto Lam Son Square.',
        zh: '在1900年跨世纪首演之夜，水晶吊灯洒落在红丝绒座椅上，大幕拉开时掌声回荡在整座蓝山广场。',
      },
      systemNote:
        'Nghệ sĩ biểu diễn năm 1900 — tái hiện ký ức âm học khán phòng, sự kiện tháo dỡ tượng năm 1944 và cuộc đại phục dựng 1998 nhân 300 năm Sài Gòn.',
    },
    polymathSources:
      "Lưu trữ Quốc gia Hải ngoại Pháp (ANOM, Aix-en-Provence); Hồ sơ Đại tu Nhà hát Thành phố 1998 (Sở Văn hóa và Thể thao TP.HCM); Kiến trúc Đô thị Thuộc địa Đông Dương.",
    polymathContext:
      'Đặt Nhà hát Thành phố (1900) song hành cùng Petit Palais tại Triển lãm Thế giới Paris 1900 và Nhà hát Lớn Hà Nội trong làn sóng Beaux-Arts toàn cầu.',
    mystery: {
      title: {
        vi: 'Nữ Thần Nghệ Thuật Đỡ Vòm Cuốn Chính',
        en: 'The Caryatids Supporting the Grand Arch',
        zh: '托起主拱门的艺术女神柱',
      },
      riddle: {
        vi: 'Hãy xoay ra mặt tiền chính hướng công trường Lam Sơn và bấm trúng **Vòm cuốn lớn nơi hai tượng Nữ thần Caryatids** đang nâng đỡ ban công tầng hai!',
        en: 'Rotate to the main Lam Son Square facade and click the **Grand Arch portal framed by the two Caryatid goddesses**!',
        zh: '旋转至面向蓝山广场的正立面，点击**由两位艺术女神柱（Caryatids）托起的大拱门主入口**！',
      },
      hintTip: {
        vi: 'Gợi ý: Nằm ngay trung tâm mặt tiền phía trước (+Z), trên bậc tam cấp đá granite.',
        en: 'Tip: Located at the center of the front facade (+Z) above the granite steps.',
        zh: '提示：位于建筑正前方（+Z面）中央花岗岩台阶上方。',
      },
      targetHotspotIndex: 0,
      targetCenter: [-1.5, 7.5, 13.0],
      acceptRadius: 6.2,
      revealMode: 'exploded',
      secretTitle: {
        vi: 'Bí Mật Hồi Sinh Điêu Khắc Mặt Tiền Năm 1998',
        en: 'The 1998 Facade Sculpture Restoration Secret',
        zh: '1998年立面女神雕像复原之谜',
      },
      secretStory: {
        vi: 'Hai tượng Nữ thần Caryatids và thiên thần cánh chữ V từng bị gỡ bỏ năm 1944 để tránh bom đạn. Đến năm 1998, các nhà điêu khắc Việt Nam đã đối chiếu từng bức ảnh lưu trữ tại Paris để đúc lại nguyên bản từng nếp áo.',
        en: 'Removed in 1944 for wartime safety, the Caryatids and winged crest were painstakingly recast in 1998 by Vietnamese sculptors working from 19th-century archival plates in Paris.',
        zh: '这些立面雕塑曾在1944年战火中被拆除保护。直到1998年西贡建城300周年，越南雕塑家依据巴黎百年老照片逐毫复原重铸。',
      },
      stampCode: 'STAMP-02-OPERAHOUSE',
    },
  },

  'HCM-DT-003': {
    architect: {
      name: 'KTS. Alfred Foulhoux',
      role: {
        vi: 'Kiến trúc sư trưởng Bưu điện Trung tâm (1886 - 1891)',
        en: 'Chief Architect of Central Post Office (1886 - 1891)',
        zh: '西贡中心邮局总建筑师 · 富卢 (1886-1891)',
      },
      greeting: {
        vi: 'Tôi là Alfred Foulhoux. Để chống cái nóng nhiệt đới mà vẫn giữ sảnh giao dịch thênh thang không vướng cột giữa, tôi kết hợp hệ vòm thép rèn tiền chế kiểu Eiffel với mặt đứng Tân Phục Hưng vàng rực.',
        en: 'I am Alfred Foulhoux. To span the grand postal hall without central pillars, I married prefabricated wrought-iron barrel vaults in the spirit of Eiffel with a Renaissance Revival ochre facade.',
        zh: '我是建筑师富卢。为了让邮局大厅开阔无柱并兼顾热带散热，我将埃菲尔式的预制铁艺拱顶与文艺复兴复古赭黄立面巧妙结合。',
      },
      systemNote:
        'KTS. Alfred Foulhoux — phân tích hệ khung vòm thép rèn, trán tường đồng hồ La Mã và giải pháp cửa chớp lá sách xanh thông gió tự nhiên.',
    },
    eyewitness: {
      name: 'Nhân viên Điện tín Sài Gòn 1892',
      role: {
        vi: 'Người vận hành dây chuyền thư tín Đông Dương cuối TK XIX',
        en: 'Telegraph Clerk of 1892 Saigon',
        zh: '1892年西贡电报邮局资深职员',
      },
      greeting: {
        vi: 'Năm 1892, mỗi bức điện tín từ cảng Marseille đều chạy qua những đường dây trên hai tấm bản đồ vẽ tay ở sảnh chính này trước khi phân phát khắp Nam Kỳ và Cao Miên.',
        en: 'In 1892, every telegram arriving from Marseille traced the lines painted on our two grand hall maps before reaching every corner of Cochinchina.',
        zh: '1892年，每一封来自马赛的电报都沿着大厅墙上手绘地图标注的线路，迅速传遍南圻与高棉各地。',
      },
      systemNote:
        'Nhân viên bưu chính năm 1892 — kể chuyện về hai bức bản đồ vẽ tay "Saigon et ses environs 1892" và nhịp tích tắc chiếc đồng hồ cổ hơn 130 năm.',
    },
    polymathSources:
      'Hồ sơ Kiến trúc Công chính Nam Kỳ (ANOM); Kỷ yếu Bưu chính Viễn thông Đông Dương (1891); Cục Di sản Văn hóa.',
    polymathContext:
      'Gắn Bưu điện Trung tâm (1886–1891) với Cách mạng Công nghiệp lần 2 — kỷ nguyên thép rèn tiền chế, cáp điện báo xuyên đại dương và quy hoạch Paris-nhiệt đới.',
    mystery: {
      title: {
        vi: 'Nhịp Thời Gian Hơn 130 Năm Trên Mặt Tiền',
        en: '130-Year Heartbeat on the Central Pediment',
        zh: '屹立百余年的正门古钟山墙',
      },
      riddle: {
        vi: 'Hãy tìm và bấm trúng **trán tường chính giữa mang chiếc Đồng hồ La Mã cổ (1891)** trên đỉnh cổng vào Bưu điện!',
        en: 'Locate and click the **central Renaissance pediment housing the 1891 Roman-numeral clock** above the main entrance!',
        zh: '请找到并点击正门正上方山墙上的**1891年罗马数字复古大钟**！',
      },
      hintTip: {
        vi: 'Gợi ý: Ở phần trên mặt tiền chính giữa (+Z), ngay dưới chóp mái vòm.',
        en: 'Tip: Upper center of the front facade (+Z), right above the main arched doors.',
        zh: '提示：位于正门（+Z面）中央上方山墙位置。',
      },
      targetHotspotIndex: 0,
      targetCenter: [-1.0, 9.2, 8.5],
      acceptRadius: 6.0,
      revealMode: 'xray',
      secretTitle: {
        vi: 'Bộ Máy Đồng Hồ & Hai Tấm Bản Đồ Dây Thép 1892',
        en: 'The Clockwork & Twin 1892 Telegraph Maps',
        zh: '机械钟芯与1892年双幅手绘电报地图',
      },
      secretStory: {
        vi: 'Sau trán tường đồng hồ La Mã là mái vòm thép tiền chế nguyên khối giúp ánh sáng tự nhiên rọi thẳng xuống hai tấm bản đồ cổ vẽ tay năm 1892 và 1936 vẫn còn nguyên vẹn đến hôm nay.',
        en: 'Behind the clock gable spans a continuous iron barrel vault casting daylight onto the original 1892 and 1936 hand-painted telegraph maps inside.',
        zh: '古钟山墙背后紧接着整片镂空锻铁拱顶，将自然天光直接引入室内，照亮保存至今的1892年与1936年手绘电报线地图。',
      },
      stampCode: 'STAMP-03-POSTOFFICE',
    },
  },

  'HCM-DT-004': {
    architect: {
      name: 'Kỹ sư Trưởng Hãng Brossard et Mopin',
      role: {
        vi: 'Đơn vị thiết kế & thi công Chợ Mới Bến Thành (1912 - 1914)',
        en: 'Lead Structural Engineer · Brossard et Mopin (1914)',
        zh: '滨城市场承建方首席工程师 (1912-1914)',
      },
      greeting: {
        vi: 'Tôi là kỹ sư trưởng hãng Brossard et Mopin. Chúng tôi đóng hàng ngàn cọc móng trên vùng đầm lầy Boresse để dựng nhà lồng 13.000m² mái xếp tầng thông gió bốn hướng.',
        en: 'I led structural works for Brossard et Mopin. We stabilized the Boresse marshland to erect a 13,000 m² reinforced concrete hall with tiered tropical ventilation roofs.',
        zh: '我是工程总负责人。我们在博雷斯沼泽地上打入成千上万根桩基，建成了这座占地一万三千平方米、四向通风的阶梯式屋顶市场。',
      },
      systemNote:
        'Kỹ sư Brossard et Mopin — giải thích kết cấu móng trên đầm lầy Boresse, mái xếp tầng chống bức xạ nhiệt và tháp đồng hồ 4 mặt Cửa Nam.',
    },
    eyewitness: {
      name: 'Tiểu thương Cửa Nam Chợ Mới 1914',
      role: {
        vi: 'Thương nhân chứng kiến 3 ngày hội khánh thành 1914',
        en: 'South Gate Merchant during 1914 Inauguration',
        zh: '1914年滨城市场南门三日盛大开市见证人',
      },
      greeting: {
        vi: 'Tháng Ba năm 1914, cả Sài Gòn đổ về công trường trước Cửa Nam suốt ba ngày đêm pháo hoa mừng Chợ Mới. Gió sông thổi xuyên bốn cửa Đông Tây Nam Bắc khiến lòng chợ lúc nào cũng rộn rã mà mát rượi.',
        en: 'In March 1914, tens of thousands filled the South Gate plaza for three days of fireworks celebrating the New Market’s opening.',
        zh: '1914年3月，全西贡百姓涌向南门广场，连续三天三夜燃放烟花庆祝新市场落成，穿堂风让一千多个摊位始终凉爽热闹。',
      },
      systemNote:
        'Tiểu thương Chợ Bến Thành — chia sẻ ký ức chuyển từ chợ cũ bên rạch Bến Nghé sang chợ mới và bộ 12 phù điêu gốm Biên Hòa gắn năm 1952.',
    },
    polymathSources:
      'Địa chí Gia Định - Sài Gòn (Nguyễn Đình Tư); Hồ sơ Xếp hạng Di tích Chợ Bến Thành (QĐ 3982/QĐ-UBND); Tạp chí Mỹ thuật Gốm Biên Hòa.',
    polymathContext:
      'Kết nối Chợ Bến Thành (1914) với quy hoạch đường sắt Mỹ Tho - Sài Gòn và nghệ thuật gốm mỹ nghệ Biên Hòa thế kỷ XX.',
    mystery: {
      title: {
        vi: 'Ngọn Tháp Biểu Tượng Cửa Nam 1914',
        en: 'The Iconic 1914 South Gate Clock Tower',
        zh: '1914年南门标志性四面钟楼',
      },
      riddle: {
        vi: 'Hãy bấm trúng **Tháp Đồng Hồ Cửa Nam 4 mặt** — biểu tượng nhận diện nổi tiếng nhất của Chợ Bến Thành suốt hơn một thế kỷ!',
        en: 'Click directly on the **4-sided South Gate Clock Tower** — Saigon’s commercial icon for over a century!',
        zh: '请点击滨城市场最著名的百年地标——**南门四面钟楼**！',
      },
      hintTip: {
        vi: 'Gợi ý: Tháp nhô cao nhất phía chính diện Cửa Nam (+Z).',
        en: 'Tip: The tallest tower projecting out at the front South Gate (+Z).',
        zh: '提示：位于前方南门（+Z面）中央最高突出的钟塔。',
      },
      targetHotspotIndex: 0,
      targetCenter: [-1.5, 9.2, 11.0],
      acceptRadius: 6.2,
      revealMode: 'exploded',
      secretTitle: {
        vi: '12 Phù Điêu Gốm Biên Hòa & Nền Đầm Lầy Boresse',
        en: '12 Bien Hoa Ceramic Reliefs & Boresse Marsh',
        zh: '12幅边和陶瓷浮雕与博雷斯沼泽地基',
      },
      secretStory: {
        vi: 'Bên dưới 4 cổng và tháp đồng hồ là công trình trị thủy san lấp đầm lầy Bồ Rệt (Marais Boresse), còn trên 4 mặt cửa là 12 bức phù điêu gốm men Biên Hòa do các nghệ nhân Trường Bá Nghệ chế tác năm 1952.',
        en: 'Beneath the clock tower lies an engineered foundation over the former Boresse marsh, adorned since 1952 with 12 polychrome Bien Hoa ceramic reliefs celebrating southern produce.',
        zh: '钟楼下方凝聚了填平博雷斯沼泽的近代土木工程智慧，四座大门上方更镶嵌着1952年边和艺校烧制的12幅南圻物产彩陶浮雕。',
      },
      stampCode: 'STAMP-04-BENTHANH',
    },
  },

  'HCM-DT-005': {
    architect: {
      name: 'KTS. Jules Bourard',
      role: {
        vi: 'Kiến trúc sư Nhà thờ Chính tòa Đức Bà Sài Gòn (1877 - 1880)',
        en: 'Architect of Notre-Dame Cathedral Basilica (1877 - 1880)',
        zh: '西贡圣母大教堂总建筑师 · 儒勒·布拉尔',
      },
      greeting: {
        vi: 'Tôi là Jules Bourard. Tôi lựa chọn gạch trần nung tại Marseille (Toulouse) để mặt tường không cần tô trát vẫn giữ nguyên sắc hồng son qua nắng mưa nhiệt đới suốt hơn trăm năm.',
        en: 'I am Jules Bourard. I specified exposed terracotta bricks fired in France so the cathedral walls needed no plaster and resist tropical moss for over a century.',
        zh: '我是建筑师布拉尔。我坚持选用法国进口原色红砖砌筑外墙而不加粉刷，使其历经百年热带风雨依然保持温暖砖红、不生苔藓。',
      },
      systemNote:
        'KTS. Jules Bourard — phân tích kiến trúc Romanesque kết hợp Gothic, hậu cung Chevet 5 nhà nguyện tỏa tia, 6 quả chuông đồng và hai tháp kẽm 1895.',
    },
    eyewitness: {
      name: 'Người Thợ Rung Chuông Thánh Đường 1895',
      role: {
        vi: 'Chứng nhân ngày gắn 2 chóp tháp nhọn & 6 quả chuông đồng',
        en: 'Bell-Ringer of the 1895 Twin Spires Inauguration',
        zh: '1895年双尖塔与六座铜钟落成见证人',
      },
      greeting: {
        vi: 'Năm 1895, khi hai chóp nhọn bọc kẽm vươn lên độ cao 60,5 mét cùng 6 quả chuông đồng tổng trọng lượng gần 29 tấn cất tiếng ngân đầu tiên, thanh âm ấy vọng khắp bến Bạch Đằng.',
        en: 'In 1895, when the twin 60.5-meter zinc spires and six bronze bells chimed together for the first time, their resonance carried all the way to the Saigon River.',
        zh: '1895年，两座高达60.5米的镀锌尖塔与总重近29吨的六座铜钟首次同时鸣响，钟声回荡整座西贡河畔。',
      },
      systemNote:
        'Người chứng kiến dựng hai ngọn tháp chuông năm 1895 và sự kiện Tòa Thánh phong Vương cung Thánh đường năm 1959 cùng tượng Đức Mẹ Hòa Bình.',
    },
    polymathSources:
      'Văn khố Tổng Giáo phận TP.HCM; Lưu trữ Kiến trúc Tôn giáo Pháp tại châu Á (ANOM); Báo cáo Trùng tu Ngói Marseille & Kính màu Chartres.',
    polymathContext:
      'Đặt Nhà thờ Đức Bà Sài Gòn trong dòng chảy Neo-Romanesque & Gothic Revival thế kỷ XIX tại Pháp và Đông Dương.',
    mystery: {
      title: {
        vi: 'Bông Hồng Ánh Sáng Trên Mặt Tiền Gạch Đỏ',
        en: 'The Luminous Rose Window on the Terracotta Facade',
        zh: '红砖立面上的玫瑰花窗之谜',
      },
      riddle: {
        vi: 'Hãy quan sát mặt tiền chính giữa hai tháp chuông và bấm trúng **Cửa sổ Hoa Hồng (Rose Window)** nằm phía trên 3 cổng vòm Romanesque!',
        en: 'Look between the twin bell towers on the front facade and click the **circular Rose Window** above the three Romanesque portals!',
        zh: '观察双钟楼之间的正面立面，点击位于三座罗马式拱门正上方的**圆形玫瑰花窗**！',
      },
      hintTip: {
        vi: 'Gợi ý: Vòng tròn lớn bằng đá trắng và kính màu nằm giữa hai tháp chuông mặt trước (+Z).',
        en: 'Tip: The large circular stone-framed window centered between the front bell towers (+Z).',
        zh: '提示：位于正面（+Z）两座高塔正中间的圆形石框彩窗。',
      },
      targetHotspotIndex: 1,
      targetCenter: [0, 8.2, 11.2],
      acceptRadius: 6.2,
      revealMode: 'xray',
      secretTitle: {
        vi: 'Gạch Marseille Không Rêu Mốc & Hậu Cung 5 Nhà Nguyện',
        en: 'Marseille Bricks & The Five-Chapel Chevet',
        zh: '百年不褪马赛红砖与五瓣放射后殿',
      },
      secretStory: {
        vi: 'Gạch xây mặt tiền được chở bằng tàu thủy từ Pháp không hề tô trát mà vẫn tự miễn nhiễm với rêu mốc nhiệt đới, dẫn ánh sáng qua Cửa sổ Hoa Hồng vào tận Hậu cung 5 nhà nguyện tỏa hình cánh quạt ở mặt sau.',
        en: 'Imported kiln-fired French bricks resist tropical humidity without plaster, channeling light from the Rose Window deep down the nave toward the five radiating apse chapels.',
        zh: '法国窑烧红砖无需批荡即可天然抵御热带苔藓，日光穿过玫瑰花窗洒入中殿，直抵建筑后方罕见的五座放射状小礼拜堂。',
      },
      stampCode: 'STAMP-05-NOTREDAME',
    },
  },

  'HCM-DT-006': {
    architect: {
      name: 'KTS. Auguste Delaval',
      role: {
        vi: 'Tác giả Bảo tàng Blanchard de la Brosse / Bảo tàng Lịch sử (1929)',
        en: 'Architect of History Museum · Indochine Style (1929)',
        zh: '胡志明市历史博物馆建筑师 · 奥古斯特·德拉瓦尔',
      },
      greeting: {
        vi: 'Tôi là Auguste Delaval. Năm 1929, tôi muốn vượt qua lối sao chép thuần túy kiến trúc châu Âu để kiến tạo phong cách Đông Dương: bố cục đăng đối Pháp nâng đỡ khối Tháp Bát Giác 3 tầng mái chồng diêm thuần Việt.',
        en: 'I am Auguste Delaval. In 1929 I pioneered the Indochine synthesis here: classical French symmetry crowned by a triple-tiered octagonal Vietnamese pagoda roof.',
        zh: '我是建筑师德拉瓦尔。1929年我在此实践印度支那融合风格：以法式对称平面托起极具东方韵味的八角形三重檐宝塔顶。',
      },
      systemNote:
        'KTS. Auguste Delaval — giải thích triết lý Đông Dương học, các tầng cổ diêm lấy sáng thông gió tự nhiên và mở rộng cánh sau hình chữ U năm 1970 của KTS Nguyễn Bá Lăng.',
    },
    eyewitness: {
      name: 'Giám tuyển Cổ vật Năm 1929',
      role: {
        vi: 'Nhà nghiên cứu Hội Nghiên cứu Đông Dương (BSEI)',
        en: 'Curator of the Society for Indochinese Studies (1929)',
        zh: '1929年印度支那研究会文物策展人',
      },
      greeting: {
        vi: 'Ngày khánh thành năm 1929 giữa vườn Thảo Cầm Viên xanh mát, những pho tượng Champa, phù điêu Óc Eo và hàng súng thần công cổ được rước vào dưới mái bát giác thông thoáng, mở đầu kho tàng cổ sử phương Nam.',
        en: 'On opening day inside the Botanical Gardens in 1929, Champa sandstone deities and Oc Eo treasures took their place beneath our airy octagonal rotunda.',
        zh: '1929年在植物园绿荫中开馆时，占婆石雕、扶南喔哦古器与古铜炮陆续入藏八角大厅，开启了南圻考古与历史陈列的新纪元。',
      },
      systemNote:
        'Giám tuyển năm 1929 — chia sẻ về cổ vật Óc Eo, Champa, gốm sứ cổ và cuộc mở rộng cánh sau năm 1970.',
    },
    polymathSources:
      'Tập san Hội Nghiên cứu Đông Dương (BSEI, 1929); Hồ sơ Di tích Kiến trúc Nghệ thuật Quốc gia Bảo tàng Lịch sử TP.HCM; Địa chí Sài Gòn.',
    polymathContext:
      'Đặt Bảo tàng Lịch sử TP.HCM (1929) ngang hàng với Bảo tàng Lịch sử Quốc gia (Hà Nội) của Ernest Hébrard trong phong trào Kiến trúc Đông Dương.',
    mystery: {
      title: {
        vi: 'Ngọn Tháp Bát Giác Ba Tầng Chồng Diêm',
        en: 'The Triple-Tiered Octagonal Rotunda Crown',
        zh: '三重檐八角形中轴宝塔顶',
      },
      riddle: {
        vi: 'Hãy bấm trúng khối **Tháp Bát Giác 3 tầng mái ngói chồng diêm** vươn cao ngay tâm điểm tòa nhà Bảo tàng Lịch sử!',
        en: 'Click the **3-tiered octagonal pagoda rotunda** rising at the exact center of the museum!',
        zh: '请点击历史博物馆正中轴线最高处的**八角形三重檐宝塔穹顶**！',
      },
      hintTip: {
        vi: 'Gợi ý: Khối tháp bát giác màu đỏ gạch nằm ngay chính giữa nóc công trình.',
        en: 'Tip: The tall octagonal terracotta-tiled tower right at the center crown.',
        zh: '提示：位于建筑屋顶正中央的红瓦八角高塔。',
      },
      targetHotspotIndex: 0,
      targetCenter: [0, 9.5, 1.0],
      acceptRadius: 6.2,
      revealMode: 'exploded',
      secretTitle: {
        vi: 'Ống Khí Động Học Cổ Diêm & Bộ Sưu Tập Óc Eo',
        en: 'Natural Convection Chimneys & Oc Eo Heritage',
        zh: '重檐通风采光气道与喔哦古文明',
      },
      secretStory: {
        vi: 'Hai tầng cổ diêm bát giác không chỉ để trang trí: chúng tạo hiệu ứng ống khói đối lưu hút hơi nóng lên cao, giữ cho sảnh trưng bày tượng Champa và cổ vật Óc Eo bên dưới luôn mát mẻ mà không cần điều hòa cơ học.',
        en: 'The tiered octagonal clerestories act as passive thermal chimneys drawing hot air upward, naturally cooling the ancient Champa and Oc Eo galleries below.',
        zh: '八角塔的两层重檐窗格构成天然热压拔风烟囱，将室内热气向上排出，让下方的占婆与喔哦文物展厅终年保持阴凉恒温。',
      },
      stampCode: 'STAMP-06-HISTORYMUSEUM',
    },
  },

  'HCM-DT-007': {
    architect: {
      name: 'Kỹ sư Hãng Tàu Messageries Maritimes',
      role: {
        vi: 'Kiến trúc sư Trụ sở Thương cảng Nhà Rồng (1863)',
        en: 'Architect of Messageries Maritimes Dockyard (1863)',
        zh: '1863年龙屋港航运总部建筑师',
      },
      greeting: {
        vi: 'Năm 1863, chúng tôi xây trụ sở hãng vận tải biển với hành lang vòm cuốn thoáng mát bao quanh bốn mặt, nhưng trên đỉnh nóc lại đặt đôi rồng đất nung men ngọc để tôn kính văn hóa bản địa bên ngã ba sông.',
        en: 'In 1863 we framed this riverfront headquarters with French arcaded verandas yet crowned its ridge with Vietnamese glazed ceramic dragons honoring local culture.',
        zh: '1863年我们用四面法式拱廊抵御湿热，却在屋脊正中安放越南传统琉璃双龙戏珠，以此致敬西贡河口的本土文化。',
      },
      systemNote:
        'Kiến trúc sư năm 1863 — phân tích sự kết hợp hành lang vòm bán nguyệt Pháp với tượng Lưỡng Long Chầu Nguyệt gốm Cây Mai.',
    },
    eyewitness: {
      name: 'Hoa tiêu Thương cảng Sài Gòn 1911',
      role: {
        vi: 'Chứng nhân sáng ngày 05/06/1911 bên cầu tàu Amiral Latouche-Tréville',
        en: 'Saigon Harbor Pilot on June 5, 1911',
        zh: '1911年6月5日西贡龙屋码头引水员见证人',
      },
      greeting: {
        vi: 'Trưa ngày 5 tháng 6 năm 1911, dưới bóng đôi rồng xanh trên nóc sở tàu, tôi chứng kiến người thanh niên Nguyễn Tất Thành mang tên Văn Ba bước lên boong tàu Amiral Latouche-Tréville ra khơi.',
        en: 'On June 5, 1911, beneath the twin emerald dragons on our roof ridge, I watched young Nguyen Tat Thanh step aboard the Amiral Latouche-Tréville to sail into history.',
        zh: '1911年6月5日，就在屋顶双龙映照的码头旁，我亲眼目送青年阮必成以“文波”之名登上拉图什·特雷维尔号邮轮扬帆远航。',
      },
      systemNote:
        'Hoa tiêu năm 1911 — kể lại không khí thương cảng ngã ba sông Sài Gòn - rạch Bến Nghé và ý nghĩa bước ngoặt lịch sử 05/06/1911.',
    },
    polymathSources:
      'Bảo tàng Hồ Chí Minh - Chi nhánh TP.HCM; Văn khố Thương cảng Sài Gòn (1863–1911); Quyết định số 1288/VH-QĐ.',
    polymathContext:
      'Kết nối Bến Nhà Rồng (1863) với mạng lưới hàng hải Suez – Marseille – Sài Gòn – Viễn Đông thế kỷ XIX và hành trình 30 năm tìm đường cứu nước.',
    mystery: {
      title: {
        vi: 'Đôi Rồng Tráng Men Giữa Ngã Ba Sông',
        en: 'Twin Glazed Dragons Above the River Confluence',
        zh: '三岔河口屋脊上的琉璃双龙戏珠',
      },
      riddle: {
        vi: 'Hãy ngước nhìn lên nóc mái ngói cao nhất và bấm trúng biểu tượng **Đôi Rồng đất nung chầu mặt trăng (Lưỡng Long Chầu Nguyệt)** — nguồn gốc tên gọi "Bến Nhà Rồng"!',
        en: 'Look up at the highest roof ridge and click the **Twin Glazed Dragons flanking the moon** — the emblem that gave Dragon Wharf its name!',
        zh: '仰望最高屋脊正中，点击赋予这里“龙屋港”之名的**琉璃双龙戏珠雕塑**！',
      },
      hintTip: {
        vi: 'Gợi ý: Nằm trên đỉnh nóc mái ngói chính giữa tòa nhà (cao nhất theo trục Y).',
        en: 'Tip: Perched on the central peak of the main terracotta roof.',
        zh: '提示：位于主楼屋顶最高正脊的中央。',
      },
      targetHotspotIndex: 0,
      targetCenter: [0, 13.8, 0],
      acceptRadius: 6.8,
      revealMode: 'exploded',
      secretTitle: {
        vi: 'Biểu Tượng Gốm Cây Mai & Con Tàu Năm 1911',
        en: 'Cay Mai Ceramic Dragons & The 1911 Departure',
        zh: '梅树窑琉璃双龙与1911年启航史诗',
      },
      secretStory: {
        vi: 'Chính chi tiết đôi rồng đất nung tráng men theo đồ án Lưỡng Long Chầu Nguyệt của lò gốm cổ Chợ Lớn gắn trên nóc trụ sở hãng tàu Pháp đã khiến người Sài Gòn gọi nơi đây là "Nhà Rồng", nơi khởi hành chuyến hải trình ngày 05/06/1911.',
        en: 'Because traditional Cholon kiln dragons crowned a French shipping house, locals dubbed it Dragon House — the exact dock where Nguyen Tat Thanh departed on June 5, 1911.',
        zh: '正因为法式航运大楼屋脊上罕见地安放了堤岸梅树窑烧制的传统双龙戏珠，西贡市民亲切称其为“龙屋”，见证了1911年6月5日的历史性启航。',
      },
      stampCode: 'STAMP-07-NHARONG',
    },
  },

  'HCM-DT-008': {
    architect: {
      name: 'Nghệ nhân Khảm Sành Sứ Gia Định',
      role: {
        vi: 'Hiệp thợ tôn tạo Lăng Ông Bà Chiểu (1848 - 1914)',
        en: 'Master Mosaic Artisan of Le Van Duyet Mausoleum',
        zh: '嘉定左军陵陶瓷镶嵌首席匠师',
      },
      greeting: {
        vi: 'Tôi là nghệ nhân khảm mảnh sành sứ Cây Mai. Từng mảnh gốm men màu được chúng tôi cắt ghép bằng tay lên bờ nóc Tiền điện - Chính điện và đắp vữa ô dước bảo vệ hai ngôi mộ cổ hình mai rùa.',
        en: 'I crafted the mosaic ridge reliefs here, fitting hand-cut Cay Mai porcelain shards onto the twin temple roofs and sealing the ancestral turtle-shell tombs in traditional lime mortar.',
        zh: '我是梅树窑碎瓷镶嵌匠师。我们手工剪裁彩瓷碎片拼贴在重檐屋脊的龙凤瑞兽上，并用贝灰三合土筑起龟背古墓。',
      },
      systemNote:
        'Nghệ nhân Gia Định — phân tích nghệ thuật khảm sành sứ, kết cấu trùng thiềm điệp ốc Nam Bộ, nhà bia Phan Thanh Giản 1868 và mộ song táng.',
    },
    eyewitness: {
      name: 'Bô lão Lễ hội Khai hạ Gia Định',
      role: {
        vi: 'Người giữ đền chứng kiến lễ Khai hạ - Cầu an truyền thống',
        en: 'Temple Keeper of the Gia Dinh Khai Ha Festival',
        zh: '嘉定翁庙开夏祈安大典守陵长老',
      },
      greeting: {
        vi: 'Mỗi độ đầu Xuân tháng Giêng, tiếng trống tế lễ tại Lăng Ông lại ngân vang. Hàng vạn người dân Sài Gòn - Gia Định tụ về thắp nén nhang tri ân vị Tổng trấn đã mở mang vùng đất phương Nam trù phú.',
        en: 'Every New Year during the Khai Ha ceremony, ceremonial drums echo as generations of locals pay tribute to Marshal Le Van Duyet.',
        zh: '每年新春开夏大典，鼓乐齐鸣，数万嘉定西贡民众齐聚翁庙焚香拜谒这位安定南疆的一代名臣。',
      },
      systemNote:
        'Người giữ đền Lăng Ông — kể về công đức khai phá của Tả quân Lê Văn Duyệt, minh oan năm 1848 và Di sản Văn hóa Phi vật thể Lễ hội Khai hạ.',
    },
    polymathSources:
      'Gia Định thành thông chí (Trịnh Hoài Đức); Văn bia Phan Thanh Giản (1868); Hồ sơ Di sản Phi vật thể Quốc gia Lễ hội Khai hạ - Cầu an Lăng Lê Văn Duyệt.',
    polymathContext:
      'Liên kết Lăng Ông Bà Chiểu với vai trò thành Gia Định và quá trình giao thương - hòa hợp đa văn hóa Việt - Hoa tại Nam Bộ đầu thế kỷ XIX.',
    mystery: {
      title: {
        vi: 'Vòng Thành Đá Cổ Hình Mai Rùa',
        en: 'The Ancient Turtle-Shell Twin Tombs',
        zh: '石围墙内的龟背双塚合葬墓',
      },
      riddle: {
        vi: 'Hãy xoay ra phía sau Chính điện và bấm trúng **khu Mộ Song Táng hình nấm rùa** bằng vữa ô dước của Tả quân Lê Văn Duyệt và Phu nhân!',
        en: 'Rotate behind the Main Hall and click the **Twin Turtle-Shell Tombs** of Marshal Le Van Duyet and his consort!',
        zh: '旋转至正殿后方，点击石围墙内**左军黎文悦与夫人的龟背形合葬古墓**！',
      },
      hintTip: {
        vi: 'Gợi ý: Nằm ở khu vực phía sau cùng (-Z) bên trong vòng tường bao cổ.',
        en: 'Tip: Located at the rear courtyard (-Z) behind the main sanctuary.',
        zh: '提示：位于正殿最后方（-Z方向）的古石围墙内。',
      },
      targetHotspotIndex: 4,
      targetCenter: [0, 1.2, -11.8],
      acceptRadius: 5.8,
      revealMode: 'exploded',
      secretTitle: {
        vi: 'Tấm Bia Năm 1868 & Vữa Ô Dước Bền Hơn Hai Thế Kỷ',
        en: 'The 1868 Stele & Two-Century O Duoc Mortar',
        zh: '1868年潘清简碑刻与百年贝灰糯米浆工艺',
      },
      secretStory: {
        vi: 'Hai nấm mộ hình mai rùa được đắp bằng hợp chất vữa ô dước (vôi vỏ sò, cát, mật mía và nhựa bời lời) bền chắc như đá, giữ trọn vẹn linh khí từ năm 1832 qua lần minh oan 1848 và bài văn bia năm 1868.',
        en: 'Molded with o duoc — an ancient mortar of crushed oyster shells, molasses, and tree resin — the twin turtle-shell mounds have endured two centuries intact.',
        zh: '双塚采用贝壳灰、蔗糖与黏合草汁调制的传统“乌药灰”筑成，坚逾顽石，完整守护了一代名臣自1832年及1848年平反以来的历史记忆。',
      },
      stampCode: 'STAMP-08-LANGONG',
    },
  },

  'HCM-DT-009': {
    architect: {
      name: 'Chiến sĩ Công binh Đất Thép Củ Chi',
      role: {
        vi: 'Kỹ sư ngầm kiến tạo 250km Địa đạo 3 tầng (1948 - 1968)',
        en: 'Subterranean Sapper Engineer of Cu Chi (1948 - 1968)',
        zh: '古芝“钢铁土地”三层地下工事兵工',
      },
      greeting: {
        vi: 'Tôi là người trực tiếp cầm cuốc lưỡi ngắn khoét lòng đất sét pha đá ong Củ Chi. Địa tầng ở đây kết dính như bê tông tự nhiên, cho phép chúng tôi đào 3 tầng hầm sâu tới 10m chịu được bom B-52.',
        en: 'I carved these galleries by hand through Cu Chi’s laterite clay — soil as dense as natural concrete, allowing three subterranean levels down to 10 meters to withstand B-52 shockwaves.',
        zh: '我曾手持短锄亲手掘进古芝红壤风化岩土层。这种黏土天然坚固如混凝土，让我们得以向下开凿三层、深达十米的抗B-52地下网络。',
      },
      systemNote:
        'Chiến sĩ Công binh Củ Chi — phân tích địa chất đất sét pha đá ong (laterite), 3 tầng sâu -3m / -6m / -10m, góc cua chữ Z chống hơi độc và Bếp Hoàng Cầm.',
    },
    eyewitness: {
      name: 'Nữ Chiến sĩ Giao liên Củ Chi 1967',
      role: {
        vi: 'Nhân chứng sống qua trận càn Cedar Falls vùng Tam Giác Sắt',
        en: 'Tunnel Liaison Courier during 1967 Operation Cedar Falls',
        zh: '1967年“雪松瀑布”战役地下交通员亲历者',
      },
      greeting: {
        vi: 'Dưới ngọn đèn dầu hột vịt sâu 8 mét lòng đất, khói bếp Hoàng Cầm tản qua các rãnh đất ẩm hóa thành sương mỏng lúc mờ sáng. Đêm đến, chúng tôi lại luồn hầm ra bến sông bắt liên lạc sang Tam Giác Sắt.',
        en: 'Eight meters underground by tiny oil lamps, Hoang Cam stove smoke cooled through damp trenches into morning mist while couriers linked Cu Chi to the Iron Triangle across the Saigon River.',
        zh: '在地下八米微弱的油灯下，黄琴灶的炊烟经湿土沟槽冷却消散成清晨薄雾；夜幕降临时，我们便经水路密道联络对岸铁三角基地。',
      },
      systemNote:
        'Giao liên Củ Chi năm 1967 — kể chuyện sinh hoạt trong hầm trú ẩn B-52, hầm Quân y dã chiến và sợi dây liên hoàn Củ Chi - Tam Giác Sắt - Long Phước.',
    },
    polymathSources:
      'Hồ sơ Di tích Quốc gia Đặc biệt Địa đạo Củ Chi (QĐ 2367/QĐ-TTg); Hồ sơ Đệ trình Di sản Thế giới UNESCO; Lịch sử Chiến tranh Nhân dân Đông Nam Bộ.',
    polymathContext:
      'Đặt Địa đạo Củ Chi trong mạng lưới Vành đai Đỏ Đông Nam Bộ (Củ Chi - Tam Giác Sắt - Long Phước) và đối sánh với địa đạo Vịnh Mốc, chiến tranh phi đối xứng thế kỷ XX.',
    mystery: {
      title: {
        vi: 'Pháo Đài Tầng Sâu Nhất Chống Bom B-52',
        en: 'Deepest Level Shelter Against B-52 Shockwaves',
        zh: '抵御B-52轰炸的最深地下掩体层',
      },
      riddle: {
        vi: 'Hãy bật **X-Ray** hoặc xoay nhìn mặt cắt địa chất bên dưới và bấm trúng **Tầng 3 (-8m đến -10m): Hầm trú ẩn B-52 & Giếng nước ngầm** sâu nhất trong lòng đất!',
        en: 'Toggle **X-Ray** or inspect the lower geological cutaway and click **Level 3 (-10m): Deep B-52 Shelter & Underground Well**!',
        zh: '开启 **X-Ray透视** 或观察地下剖面最底层，点击**地下十米深的第三层B-52防空掩体与地下深井**！',
      },
      hintTip: {
        vi: 'Gợi ý: Nằm ở tầng sâu nhất phía dưới cùng (trục Y âm, dưới cả Bếp Hoàng Cầm và Hầm Quân y).',
        en: 'Tip: Located at the deepest bottom layer (negative Y, below Levels 1 and 2).',
        zh: '提示：位于整个地下剖面的最底部深层（Y轴最下方，低于指挥室和医疗室）。',
      },
      targetHotspotIndex: 3,
      targetCenter: [-2.5, -2.2, 9.5],
      acceptRadius: 6.2,
      revealMode: 'xray',
      secretTitle: {
        vi: 'Bí Mật Mặt Cắt Chữ Z & Lối Thoát Ra Sông Sài Gòn',
        en: 'Zigzag Blast Baffles & The Saigon River Escape',
        zh: '“之”字形防爆转角与通往西贡河密道',
      },
      secretStory: {
        vi: 'Ở tầng sâu 10 mét, đường hầm bẻ góc chữ Z 60–90 độ kèm nắp hầm kín hơi giúp triệt tiêu sóng xung kích và hơi ngạt, đồng thời thông với ngách thoát hiểm dẫn thẳng ra bờ sông Sài Gòn nối sang Tam Giác Sắt.',
        en: 'Ten meters below, sharp 60–90° zigzag bends and airtight trapdoors neutralized blast waves while connecting covertly to riverbanks leading toward the Iron Triangle.',
        zh: '在地下十米深处，坑道每隔一段便折成60至90度“之”字角并设密闭活门，彻底化解炸弹冲击波与毒气，暗道更直通西贡河渡口衔接对岸铁三角。',
      },
      stampCode: 'STAMP-09-CUCHI',
    },
  },

  'HCM-DT-010': {
    architect: {
      name: 'Nghệ nhân Tiền Óc Eo Cần Giờ',
      role: {
        vi: 'Cư dân chế tác Gốm Mộ Chum & Ngọc Nefrit (TK III TCN)',
        en: 'Pre-Oc Eo Master Potter & Jade Artisan (3rd c. BCE)',
        zh: '前喔哦文化陶罐葬器与玉石雕刻古匠人',
      },
      greeting: {
        vi: 'Hơn hai ngàn năm trước trên giồng đất cát giữa rừng ngập mặn Cần Giờ, chúng tôi nung những chiếc chum gốm áo đỏ cao lớn và mài khuyên tai hai đầu thú bằng đá ngọc làm đồ tùy táng cho người đi xa.',
        en: 'Over two millennia ago on this coastal sand mound in Can Gio, we fired towering terracotta burial jars and carved double-headed animal jade ear pendants.',
        zh: '两千多年前在这片红树林沙丘高地上，我们烧制红衣大陶瓮盛放先祖遗骨，并精琢双兽首碧玉耳饰作为随葬圣物。',
      },
      systemNote:
        'Cư dân Tiền Óc Eo — phân tích kỹ thuật bàn xoay gốm mộ chum, nghề chế tác trang sức đá mã não/nefrit và giao thương đường biển cổ.',
    },
    eyewitness: {
      name: 'Nhà Khảo cổ Đợt Khai quật 1994',
      role: {
        vi: 'Chuyên gia Bảo tàng Lịch sử khai mở di chỉ Giồng Cá Vồ',
        en: 'Lead Archaeologist of the 1994 Giong Ca Vo Excavation',
        zh: '1994年榕卡涡遗址发掘首席考古学者',
      },
      greeting: {
        vi: 'Khoảnh khắc bàn chải khảo cổ chạm vào miệng chiếc mộ chum thứ 300 dưới lớp cát giồng năm 1994, những hạt chuỗi mã não đỏ cam và khuyên tai hai đầu thú lóe sáng sau hơn 20 thế kỷ ngủ yên.',
        en: 'When our brushes cleared the rim of the 300th burial jar in 1994, carnelian beads and jade ornaments glistened after two thousand years underground.',
        zh: '1994年当我们刷去沙层揭开第300座陶瓮墓口时，沉睡了两千多年的红玛瑙珠与双兽首玉玦在阳光下重现光彩。',
      },
      systemNote:
        'Nhà khảo cổ học 1994 — trình bày địa tầng 3 lớp Giồng Cá Vồ và vị trí then chốt của Cần Giờ trên Con đường Tơ lụa trên biển cổ đại.',
    },
    polymathSources:
      'Hồ sơ Di tích Khảo cổ Quốc gia Giồng Cá Vồ (QĐ 38/2000/QĐ-BVHTT); Bảo tàng Lịch sử TP.HCM; Tạp chí Khảo cổ học Việt Nam.',
    polymathContext:
      'Liên kết táng tục Mộ Chum Giồng Cá Vồ với văn hóa Sa Huỳnh, Tiền Óc Eo và mạng lưới thương mại Ấn Độ Dương - Biển Đông cổ đại.',
    mystery: {
      title: {
        vi: 'Kho Tàng Hơn 300 Mộ Chum Tiền Sử',
        en: 'The Cluster of 300+ Ancient Burial Jars',
        zh: '三百余座两千年前古陶瓮墓群',
      },
      riddle: {
        vi: 'Hãy phóng to vào hố khai quật dưới mái che bảo tồn và bấm trúng **Quần thể Mộ Chum gốm cổ hình trứng** nằm trong địa tầng khảo cổ!',
        en: 'Zoom into the covered excavation trench and click the **Cluster of Ancient Egg-Shaped Ceramic Burial Jars**!',
        zh: '放大保护棚下的考古探方，点击土层中的**古卵形陶瓮墓葬群**！',
      },
      hintTip: {
        vi: 'Gợi ý: Nằm bên trong lưới dây hố khai quật ở trung tâm gò đất (-X nhẹ, chính giữa).',
        en: 'Tip: Inside the gridded excavation pit at the center of the sand mound.',
        zh: '提示：位于沙丘正中白色网格探方线内的陶罐群。',
      },
      targetHotspotIndex: 1,
      targetCenter: [-1.3, -0.4, 1.6],
      acceptRadius: 5.8,
      revealMode: 'xray',
      secretTitle: {
        vi: 'Khuyên Tai Hai Đầu Thú & Thương Cảng Biển 2.000 Năm',
        en: 'Two-Headed Jade Pendants & Maritime Hub',
        zh: '双兽首玉玦与两千年前海上丝路港口',
      },
      secretStory: {
        vi: 'Những chiếc mộ chum chứa khuyên tai hai đầu thú bằng đá ngọc nephrite và hạt mã não chứng minh cư dân Cần Giờ thời Tiền Óc Eo đã là mắt xích giao thương hàng hải sầm uất nối miền Trung Sa Huỳnh với Ấn Độ Dương.',
        en: 'Nephrite two-headed animal pendants and carnelian beads buried inside these jars prove ancient Can Gio residents traded across maritime routes linking Sa Huynh to the Indian Ocean.',
        zh: '瓮棺中出土的双兽首碧玉耳玦与红玛瑙珠证实，早在两千年前，芹耶先民便已融入连接沙黄文化与印度洋的繁忙海上丝路。',
      },
      stampCode: 'STAMP-10-GIONGCAVO',
    },
  },

  'HCM-DT-011': {
    architect: {
      name: 'Thiền sư Viên Quang & Thợ Mộc Nam Bộ',
      role: {
        vi: 'Người trùng tu Tổ đình Giác Lâm chữ Tam (1798)',
        en: 'Master Viên Quang & 1798 Woodwork Architects',
        zh: '1798年觉林古寺“三”字形木构重建主持圆光禅师',
      },
      greeting: {
        vi: 'Năm 1798, ta cùng các hiệp thợ mộc Nam Bộ dựng lại chùa Giác Lâm theo bố cục chữ Tam với 98 cột gỗ lim đặt trên chân tảng đá xanh, ghép mộng không đinh để ngôi chùa trường tồn qua hàng thế kỷ.',
        en: 'In 1798, our southern carpenters rebuilt Giac Lam Temple in the three-hall Tam layout supported by 98 ironwood pillars joined seamlessly without nails.',
        zh: '1798年我与南圻木匠以“三”字形布局重建觉林寺，九十八根铁力木巨柱稳立青石柱础之上，全榫卯无钉历经两百余年依然稳固。',
      },
      systemNote:
        'Thiền sư Viên Quang — giải thích kết cấu 98 cột gỗ quý, bao lam sơn son thếp vàng và bố cục Tiền đường - Chính điện - Nhà Tổ.',
    },
    eyewitness: {
      name: 'Hành giả Trồng Cây Bồ Đề 1953',
      role: {
        vi: 'Chứng nhân lễ chiết cành Bồ Đề từ Sri Lanka (1953) & dựng Bảo tháp 1993',
        en: 'Witness of the 1953 Sri Lankan Bodhi Planting',
        zh: '1953年斯里兰卡菩提圣树移栽与佛塔落成见证人',
      },
      greeting: {
        vi: 'Năm 1953, Đại đức Narada từ Tích Lan mang cành Bồ Đề chiết từ cội cây thiêng trao về sân chùa. Bốn mươi năm sau, Bảo tháp Xá lợi 7 tầng vươn cao bên tán cây tỏa bóng mát rượi.',
        en: 'In 1953, Venerable Narada brought a sacred Bodhi sapling from Sri Lanka to our courtyard; four decades later, the seven-story Relic Stupa rose beside its shade.',
        zh: '1953年斯里兰卡长老带来圣菩提树枝栽植于寺前；四十年后，七层六角舍利宝塔拔地而起，与古菩提树荫交相辉映。',
      },
      systemNote:
        'Nhân chứng tại Tổ đình Giác Lâm — kể về cây Bồ Đề 1953, Bảo tháp Xá lợi 7 tầng lục giác và bộ tượng Thập Bát La Hán gỗ mít thế kỷ XVIII.',
    },
    polymathSources:
      'Tổ đình Giác Lâm Ký sự (Ban Quản trị Di tích); Gia Định thành thông chí; Quyết định 1288/VH-QĐ công nhận Di tích Quốc gia (1988).',
    polymathContext:
      'Liên kết Giác Lâm (1744) — Nhà cổ Trần Công Vàng (Bình Dương) — Nhà Lớn Long Sơn (BR-VT) trong dòng chảy kiến trúc gỗ truyền thống Nam Bộ.',
    mystery: {
      title: {
        vi: 'Ngọn Tháp Lục Giác Bảy Tầng Tôn Trí Xá Lợi',
        en: 'The Seven-Tiered Hexagonal Relic Stupa',
        zh: '七层六角舍利宝塔之谜',
      },
      riddle: {
        vi: 'Hãy nhìn về góc sân trước bên trái ngôi chùa cổ và bấm trúng **Bảo tháp Xá lợi 7 tầng hình lục giác** uy nghiêm!',
        en: 'Look toward the front-left courtyard of the pagoda and click the **Seven-Story Hexagonal Relic Stupa**!',
        zh: '观察古寺前院左侧，点击高耸庄严的**七层六角舍利宝塔**！',
      },
      hintTip: {
        vi: 'Gợi ý: Tòa tháp cao 7 tầng nằm ở góc trước bên trái (-X, +Z).',
        en: 'Tip: The tall seven-tiered tower standing on the front-left corner (-X, +Z).',
        zh: '提示：位于前院左前方（-X, +Z）的最高七层塔。',
      },
      targetHotspotIndex: 0,
      targetCenter: [-11.2, 6.5, 7.5],
      acceptRadius: 6.0,
      revealMode: 'exploded',
      secretTitle: {
        vi: '98 Cột Gỗ Xuyên Trính & Tượng Gỗ Mít 1744',
        en: '98 Ironwood Pillars & 18th-Century Jackfruit Statues',
        zh: '九十八根穿斗木柱与1744年菠萝蜜木佛像',
      },
      secretStory: {
        vi: 'Từ chân Bảo tháp nhìn vào Chính điện là hơn 100 pho tượng gỗ mít cổ và hệ 98 cột gỗ lim nối bằng mộng xuyên trính từ năm 1744 — ngôi chùa cổ nhất Sài Gòn còn giữ nguyên bản sắc.',
        en: 'Facing the stupa stands Saigon’s oldest surviving pagoda hall from 1744, preserving 98 interlocked ironwood columns and over a hundred gilded jackfruit-wood statues.',
        zh: '由宝塔望入正殿，便是始建于1744年的西贡最古老禅院——98根铁力木柱与百余尊18世纪菠萝蜜木雕金身至今保存完好。',
      },
      stampCode: 'STAMP-11-GIACLAM',
    },
  },

  'HCM-DT-012': {
    architect: {
      name: 'Nghệ nhân Gốm Cây Mai & Thợ Chạm Triều Châu',
      role: {
        vi: 'Người kiến tạo Hội quán Nghĩa An Chợ Lớn (1820 - 1902)',
        en: 'Chaozhou Woodcarver & Cay Mai Ceramic Master (1902)',
        zh: '堤岸义安会馆潮州木雕与梅树窑琉璃匠师',
      },
      greeting: {
        vi: 'Chúng tôi ghép từng tượng tiểu cảnh gốm men Cây Mai rực rỡ trên bờ nóc cong vút và chạm lộng hàng trăm bao lam gỗ căm xe thếp vàng, mở sân Thiên Tỉnh đón ánh sáng rọi thẳng xuống Chính điện.',
        en: 'We crowned the sweeping ridges with polychrome Cay Mai ceramic opera figures and carved openwork gilded panels around the open-air skywell.',
        zh: '我们在飞檐屋脊铺满彩釉梅树窑戏曲陶塑，并于天井周围镂空精雕贴金木刻花罩，令天光自然洒入关帝正殿。',
      },
      systemNote:
        'Nghệ nhân Triều Châu — phân tích kiến trúc chữ Đinh, mái ngói lưu ly xanh ngọc, sân Thiên Tỉnh điều hòa vi khí hậu và bao lam Tam Quốc.',
    },
    eyewitness: {
      name: 'Thương nhân Bang Triều Châu Chợ Lớn 1902',
      role: {
        vi: 'Thành viên Hội quán chứng kiến đại trùng tu 1902 & tục Rằm tháng Giêng',
        en: 'Cho Lon Merchant of the 1902 Grand Renovation',
        zh: '1902年堤岸义安会馆大修与元宵庙会亲历商民',
      },
      greeting: {
        vi: 'Mỗi dịp Rằm tháng Giêng, khói nhang vòng quện trong khoảng sân Thiên Tỉnh, bà con Chợ Lớn lại xếp hàng bên Tiền điện xin sờ chuông và chui qua bụng tượng Ngựa Xích Thố cầu bình an suốt năm.',
        en: 'Each Lantern Festival, spiral incense coils smoke gently through our skywell as locals gather at the red steed Chitu for blessings of fortune and peace.',
        zh: '每逢正月十五元宵佳节，盘香袅袅萦绕天井，堤岸街坊齐聚前殿轻抚赤兔神驹、钻马腹祈求全年顺遂平安。',
      },
      systemNote:
        'Thương nhân Chợ Lớn — kể về cộng đồng người Hoa Triều Châu, Đại Hồng Chung cổ và truyền thống chui bụng ngựa Xích Thố đầu năm.',
    },
    polymathSources:
      'Hồ sơ Di tích Kiến trúc Nghệ thuật Quốc gia Hội quán Nghĩa An (QĐ 43-VH/QĐ); Nghệ thuật Gốm Cây Mai Sài Gòn - Chợ Lớn.',
    polymathContext:
      'Liên kết Hội quán Nghĩa An với lịch sử thương cảng Chợ Lớn thế kỷ XIX và sự giao thoa mỹ thuật gốm Cây Mai Nam Bộ.',
    mystery: {
      title: {
        vi: 'Thần Mã Đỏ Rực Nơi Tiền Điện',
        en: 'The Crimson Steed in the Front Sanctuary',
        zh: '前殿赤色神驹赤兔马',
      },
      riddle: {
        vi: 'Hãy bật chế độ **Nội thất** hoặc **X-Ray** nhìn vào Tiền điện bên trái và bấm trúng **Tượng Ngựa Xích Thố đỏ rực** gắn với tục cầu may Rằm tháng Giêng!',
        en: 'Enable **Interior** or **X-Ray** to peer into the left front hall and click the **Crimson Chitu Steed statue**!',
        zh: '开启 **室内剖面** 或 **X-Ray透视** 望向前殿左侧，点击正月十五祈福的**赤红色赤兔马塑像**！',
      },
      hintTip: {
        vi: 'Gợi ý: Đặt ở phía trước bên trái bên trong Tiền điện (-X, +Z).',
        en: 'Tip: Positioned inside the front-left pavilion (-X, +Z).',
        zh: '提示：位于前殿内左前方（-X, +Z）。',
      },
      targetHotspotIndex: 2,
      targetCenter: [-5.2, 1.8, 5.6],
      acceptRadius: 5.5,
      revealMode: 'exploded',
      secretTitle: {
        vi: 'Sân Thiên Tỉnh & Gốm Cây Mai Chợ Lớn 1902',
        en: 'The Skywell & 1902 Cay Mai Kiln Ceramics',
        zh: '天井微气候与1902年梅树窑巅峰彩陶',
      },
      secretStory: {
        vi: 'Từ tượng Ngựa Xích Thố ngước lên là sân Thiên Tỉnh đón nắng gió xua khói nhang vòng, bên trên đỉnh mái quy tụ hàng trăm nhân vật tuồng cổ bằng gốm men Cây Mai trứ danh của Chợ Lớn đầu thế kỷ XX.',
        en: 'Above the red steed opens the skywell venting spiral incense smoke naturally upward past the famed early-1900s Cay Mai kiln ridge figures.',
        zh: '自赤兔马仰望便是精巧的天井，它巧妙形成自然对流排散盘香烟雾，屋脊更汇集了百余尊二十世纪初堤岸梅树窑彩釉戏曲雕塑。',
      },
      stampCode: 'STAMP-12-NGHIAAN',
    },
  },

  'BRVT-DT-001': {
    architect: {
      name: 'Kiến trúc sư Công chính Đông Dương (1898)',
      role: {
        vi: 'Người kiến tạo Bạch Dinh (Villa Blanche) trên Núi Lớn Vũng Tàu',
        en: 'French Public Works Architect of Villa Blanche (1898)',
        zh: '巴地头顿白宫别墅总建筑师 (1898)',
      },
      greeting: {
        vi: 'Tôi chọn triền Núi Lớn cao 27,7m ngay trên nền pháo đài Phước Thắng xưa để dựng Villa Blanche trắng muốt 3 tầng, lợp ngói đỏ Marseille và gắn 8 tượng bán thân gốm sứ châu Âu quanh diềm mái.',
        en: 'High on Big Mountain above the former Phuoc Thang fortress, I sculpted this three-story white neoclassical villa crowned with Marseille tiles and eight classical ceramic busts.',
        zh: '我在大山东坡福胜古炮台遗址上设计了这座三层法式新古典白色别墅，配马赛红瓦与八尊欧式彩陶半身胸像装饰檐口。',
      },
      systemNote:
        'KTS Villa Blanche — phân tích tầng bán ngầm đá hộc trên sườn dốc Núi Lớn, vòm cuốn Tân Cổ điển và 8 phù điêu Hy Lạp - La Mã.',
    },
    eyewitness: {
      name: 'Thị vệ Dinh Ông Thượng 1907',
      role: {
        vi: 'Người chứng kiến những năm tháng Vua Thành Thái bị giam lỏng tại Bạch Dinh',
        en: 'Attendant during Emperor Thanh Thai’s Detention (1907)',
        zh: '1907年成泰皇帝软禁白宫期间随侍见证人',
      },
      greeting: {
        vi: 'Từ năm 1907 đến 1916, mỗi chiều hoàng hôn dưới tán hoa sứ cổ thụ trước Bạch Dinh, Đức Vua Thành Thái thường tựa lan can bên hàng thần công ngắm sóng Bãi Trước mà đau đáu nỗi niềm non nước.',
        en: 'From 1907 to 1916, Emperor Thanh Thai stood beside the sea-facing cannons under white frangipani trees, gazing across Front Beach in quiet defiance.',
        zh: '1907至1916年间，每当夕阳映照古鸡蛋花树下，成泰皇帝常倚在面向前滩的海防古炮旁，遥望沧海寄托故国深思。',
      },
      systemNote:
        'Thị vệ năm 1907 — kể chuyện Vua Thành Thái tại Villa Blanche, bộ sưu tập gốm sứ Hòn Cau đời Khang Hy và ý nghĩa lịch sử Vũng Tàu.',
    },
    polymathSources:
      'Bảo tàng Tỉnh Bà Rịa - Vũng Tàu; Hồ sơ Di tích Quốc gia Bạch Dinh (QĐ 983/QĐ-BVHTT); Khảo cổ Tàu đắm Hòn Cau.',
    polymathContext:
      'Kết nối Bạch Dinh Vũng Tàu với tuyến Kiến trúc Pháp & Đông Dương (Nhà hát TP.HCM - Bưu điện - Bảo tàng Lịch sử) dưới thời Toàn quyền Paul Doumer.',
    mystery: {
      title: {
        vi: 'Trận Địa Pháo Cổ Trên Nền Pháo Đài Phước Thắng',
        en: 'Sea-Facing Cannons on Historic Phuoc Thang Battery',
        zh: '福胜古炮台遗址上的面海大炮群',
      },
      riddle: {
        vi: 'Hãy xoay ra sân trước hướng về vịnh biển Bãi Trước và bấm trúng **Dãy Thần Công cổ** phòng thủ trên nền pháo đài Phước Thắng!',
        en: 'Rotate to the seaward front terrace and click the **row of Historic Cannons** guarding Front Beach!',
        zh: '旋转至面朝大海的前庭平台，点击拱卫头顿海湾的**福胜古炮群**！',
      },
      hintTip: {
        vi: 'Gợi ý: Xếp thành hàng dọc lan can phía trước dinh thự (+Z, sát mặt sân bậc dưới).',
        en: 'Tip: Lined up along the front seaside balustrade (+Z).',
        zh: '提示：整齐排列在别墅前方（+Z方向）临海石栏杆旁。',
      },
      targetHotspotIndex: 1,
      targetCenter: [0, 1.5, 10.6],
      acceptRadius: 6.5,
      revealMode: 'exploded',
      secretTitle: {
        vi: 'Pháo Đài Triều Nguyễn & Cổ Vật Tàu Đắm Hòn Cau',
        en: 'Nguyen Dynasty Battery & Hon Cau Shipwreck Porcelain',
        zh: '阮朝海防炮台与鸿沟沉船康熙青花瓷',
      },
      secretStory: {
        vi: 'Dãy thần công lưu dấu chiến lũy Phước Thắng thời Minh Mạng - Tự Đức canh giữ cửa biển Cần Giờ - Vũng Tàu, còn bên trong tầng 3 Bạch Dinh lưu giữ hàng ngàn hiện vật gốm men lam đời Khang Hy vớt từ tàu đắm Hòn Cau.',
        en: 'These cannons recall the Nguyen Dynasty battery defending the maritime gateway, while upstairs halls house Kangxi blue-and-white porcelain salvaged from the Hon Cau shipwreck.',
        zh: '这些古炮见证了阮朝福胜炮台扼守头顿与芹耶海口的峥嵘岁月，而楼上展厅更珍藏着从鸿沟古沉船打捞出的康熙青花瓷珍品。',
      },
      stampCode: 'STAMP-13-BACHDINH',
    },
  },

  'BRVT-DT-002': {
    architect: {
      name: 'Ông Trần (Lê Văn Mưu)',
      role: {
        vi: 'Người sáng lập & kiến tạo Quần thể Nhà Lớn Long Sơn (1910 - 1929)',
        en: 'Founder & Builder of Long Son Big House (1910 - 1929)',
        zh: '龙山大屋创立者与规划匠师 · 陈先生（黎文谋）',
      },
      greeting: {
        vi: 'Năm 1900, tôi chèo ghe Sấm đưa lưu dân ra đảo Long Sơn khai hoang, rồi từ 1910 cùng bà con dựng quần thể Nhà Lớn hoàn toàn bằng gỗ căm xe ghép mộng cổ truyền theo thế dựa lưng vào Núi Nứa.',
        en: 'In 1900 I sailed the Sampan boat to settle Long Son Island, later raising this interconnected timber complex without nails against the slope of Nua Mountain.',
        zh: '1900年我驾“雷舟”带领流民渡海开垦龙山岛，1910年起依山势以纯铁力木榫卯结构建起集庙堂、议事厅与义学于一体的大屋建筑群。',
      },
      systemNote:
        'Ông Trần (Lê Văn Mưu) — giải thích bố cục 3 phân khu Đền thờ - Nhà hội - Trường học chợ, kỹ thuật vì kèo không đinh và triết lý sống thuần hậu của người mở cõi.',
    },
    eyewitness: {
      name: 'Cư dân Mở Đất Đảo Long Sơn 1925',
      role: {
        vi: 'Thành viên cộng đồng Nhà Lớn chứng kiến Lễ Vía Ông Trần',
        en: 'Long Son Island Settler of the 1925 Community',
        zh: '1925年龙山岛拓荒社区及“大屋共济”生活见证人',
      },
      greeting: {
        vi: 'Ở Nhà Lớn từ thuở 1920, khách phương xa ghé đảo đều được ăn cơm miễn phí tại Nhà Hội, nghỉ trên sập gỗ mát rượi dưới mái ngói âm dương và nghe kể chuyện chiếc Ghe Sấm vượt sóng năm nào.',
        en: 'Since the 1920s, travelers arriving on Long Son were always welcomed with free communal meals inside the wooden halls beside the treasured Ghe Sam boat.',
        zh: '自二十世纪二十年代起，远方来客登上龙山岛总能在会馆享用免费斋饭，在阴凉的阴阳瓦木厅歇息，聆听当年雷舟渡海拓荒的传奇。',
      },
      systemNote:
        'Cư dân Long Sơn — chia sẻ về văn hóa hiếu khách miễn phí cơm nước, bộ tủ thờ cẩn xà cừ hơn 100 tuổi và lễ giỗ Ông Trần.',
    },
    polymathSources:
      'Hồ sơ Di tích Kiến trúc Nghệ thuật Quốc gia Nhà Lớn Long Sơn (QĐ 1371/QĐ-BVHTT); Văn hóa Mở cõi Nam Bộ (Sơn Nam).',
    polymathContext:
      'So sánh kỹ thuật mộc cổ truyền xuyên trính giữa Nhà Lớn Long Sơn (BR-VT), Chùa Giác Lâm (TP.HCM) và Nhà cổ Trần Công Vàng (Bình Dương).',
    mystery: {
      title: {
        vi: 'Con Thuyền Mở Đất Năm 1900',
        en: 'The 1900 Pioneer Boat of Island Settlement',
        zh: '1900年渡海拓荒的历史木船',
      },
      riddle: {
        vi: 'Hãy xoay sang sân bên trái cụm Đền Thờ và bấm trúng **Thuyền gỗ lịch sử Ghe Sấm** — chứng tích hành trình vượt sóng khai hoang đảo Long Sơn của Ông Trần!',
        en: 'Rotate toward the left terrace beside the Temple Hall and click the **Historic Wooden Ghe Sam Boat** that brought settlers to Long Son!',
        zh: '旋转至神殿左侧庭院，点击当年搭载先民登岛开荒的历史木船——**陈先生“雷舟”（Ghe Sam）**！',
      },
      hintTip: {
        vi: 'Gợi ý: Chiếc thuyền gỗ mũi nhọn nằm ở phía bên trái quần thể (-X, +Z).',
        en: 'Tip: The pointed wooden boat resting on the left side of the complex (-X, +Z).',
        zh: '提示：停放在建筑群左侧庭院（-X, +Z）的尖头木船。',
      },
      targetHotspotIndex: 4,
      targetCenter: [-10.6, 1.9, 8.2],
      acceptRadius: 5.8,
      revealMode: 'exploded',
      secretTitle: {
        vi: 'Vì Kèo Không Đinh & Tủ Thờ Cẩn Xà Cừ Trăm Năm',
        en: 'Nail-Free Timber Joinery & Mother-of-Pearl Altars',
        zh: '全榫卯无钉木构与百年螺钿镶嵌供桌',
      },
      secretStory: {
        vi: 'Chiếc Ghe Sấm dẫn đường năm 1900 nay nằm cạnh hệ thống 5 ngôi nhà nối tiếp bằng mộng gỗ không một chiếc đinh sắt, lưu giữ bộ tủ thờ cẩn xà cừ tinh xảo bậc nhất vùng Đông Nam Bộ.',
        en: 'The pioneer Ghe Sam boat stands beside five interconnected timber halls engineered purely with wooden mortise-and-tenon joints and antique mother-of-pearl altars.',
        zh: '这艘1900年领航渡海的木船旁，是由五座纯木榫卯无钉建筑连缀而成的殿堂，至今完好保存着东南部顶级的百年螺钿镶嵌供柜。',
      },
      stampCode: 'STAMP-14-LONGSON',
    },
  },

  'BRVT-DT-003': {
    architect: {
      name: 'Chiến sĩ Công binh Long Phước',
      role: {
        vi: 'Người thiết kế mạng Địa đạo Liên ấp Bà Rịa (1948 - 1963)',
        en: 'Tactical Tunnel Builder of Long Phuoc (1948 - 1963)',
        zh: '巴地龙福连村地下坑道工程师 (1948-1963)',
      },
      greeting: {
        vi: 'Khác với hầm hẹp ở Củ Chi, lòng Địa đạo Long Phước chúng tôi đào cao tới 1,6m giữa lớp đất đỏ bazan vững chắc và gia cố bằng khung hầm chữ A gỗ rừng để bộ đội cơ động chiến đấu nhanh xuyên 5 ấp.',
        en: 'Unlike narrow crawlways, we carved Long Phuoc’s basaltic-clay tunnels 1.6 meters high and braced chambers with A-frame timber ribs so troops could maneuver swiftly between five hamlets.',
        zh: '不同于狭窄坑道，我们在巴地玄武岩红土层中将龙福地道掘高至1.6米，并用林木“A”字架加固掩体，方便部队在五个村庄间快速机动。',
      },
      systemNote:
        'Công binh Long Phước — nhấn mạnh đặc trưng lòng hầm cao 1,5–1,6m, khung hầm chữ A gỗ chống pháo và mối liên kết tam giác Củ Chi - Tam Giác Sắt - Long Phước.',
    },
    eyewitness: {
      name: 'Nữ Y tá Hầm Quân Y Long Phước 1965',
      role: {
        vi: 'Nhân chứng cứu chữa thương binh dưới tầng hầm đất đỏ Bà Rịa',
        en: 'Subterranean Field Medic in 1965 Long Phuoc',
        zh: '1965年龙福地下战地医疗站女卫生员亲历者',
      },
      greeting: {
        vi: 'Phía trên là bụi tre tầm vông và ụ mối ngụy trang im lìm, còn dưới độ sâu 6 mét trong khoang hầm chữ A, chúng tôi soi đèn dầu gắp mảnh pháo và chuyền thuốc men xuyên qua ống tụt thông tầng.',
        en: 'Above ground lay silent bamboo thickets and decoy termite mounds; six meters below inside A-frame bunkers, we tended wounded soldiers by oil lamps.',
        zh: '地面上翠竹与伪装蚁丘静默如常，而在地下六米深的“A”字形木架掩体内，我们在油灯下经竖井传递药品救治伤员。',
      },
      systemNote:
        'Nữ Y tá Long Phước — tái hiện khoang Hầm Quân y (+X), Phòng họp Chi bộ và nắp hầm bí mật dưới bụi tre tầm vông.',
    },
    polymathSources:
      'Ban Quản lý Di tích TP. Bà Rịa; Hồ sơ Di tích Lịch sử Quốc gia Địa đạo Long Phước (QĐ 09/VH-QĐ); Lịch sử Lực lượng Vũ trang Bà Rịa - Vũng Tàu.',
    polymathContext:
      'Đặt Địa đạo Long Phước làm chốt cửa ngõ phía Đông Nam của hệ thống pháo đài ngầm Đông Nam Bộ cùng Củ Chi và Tam Giác Sắt.',
    mystery: {
      title: {
        vi: 'Khoang Hầm Chữ A Chống Đạn Pháo Hạng Nặng',
        en: 'The Timber A-Frame Shellproof Chamber',
        zh: '抗重炮轰击的“A”字形木构掩体',
      },
      riddle: {
        vi: 'Hãy xoay quan sát mặt cắt địa tầng bên trái (+Z) hoặc bật **X-Ray**, sau đó bấm trúng **Hầm Chữ A gia cố gỗ** chịu lực chống pháo kích!',
        en: 'Inspect the left subterranean cutaway or toggle **X-Ray** and click the **Timber A-Frame Reinforced Bunker**!',
        zh: '观察地下剖面左侧（或开启 **X-Ray透视**），点击抗重炮轰击的**“A”字形原木加固掩体**！',
      },
      hintTip: {
        vi: 'Gợi ý: Khoang hầm khung tam giác gỗ ở phần phía trước bên trái (-X, +Z).',
        en: 'Tip: The triangular timber-braced chamber on the front-left cutaway (-X, +Z).',
        zh: '提示：位于剖面前左方（-X, +Z）的三角形木梁结构室。',
      },
      targetHotspotIndex: 1,
      targetCenter: [-6.5, 3.2, 8.6],
      acceptRadius: 5.8,
      revealMode: 'xray',
      secretTitle: {
        vi: 'Mạng Lưới Liên Hoàn 5 Ấp & Đường Thoát Bụi Tre',
        en: 'Five-Hamlet Spine & Bamboo Trapdoor Network',
        zh: '五村串联主干道与簕竹伪装出口',
      },
      secretStory: {
        vi: 'Hệ thống khung chữ A chống sập giúp giữ vững các nút giao lộ nối thông 5 ấp xã Long Phước, ngụy trang ống thở bằng ụ mối tự nhiên ngay giữa lũy tre tầm vông làng quê Bà Rịa.',
        en: 'Load-bearing A-frame ribs secured subterranean crossroads linking all five Long Phuoc hamlets, hidden beneath natural termite-mound vents and wild bamboo.',
        zh: '高强度“A”字木框守住了连通龙福全乡五个村庄的地下枢纽，地面透气孔则巧妙藏身于天然蚁丘与巴地簕竹丛间。',
      },
      stampCode: 'STAMP-15-LONGPHUOC',
    },
  },

  'BD-DT-001': {
    architect: {
      name: 'Nghệ nhân Mộc Kim Bồng & Phú Cường',
      role: {
        vi: 'Hiệp thợ chạm khắc Nhà cổ Trần Công Vàng (1889 - 1892)',
        en: 'Master Woodcarver of Tran Cong Vang House (1889 - 1892)',
        zh: '1889年陈公黄古宅木雕首席工匠',
      },
      greeting: {
        vi: 'Suốt 3 năm ròng từ 1889 đến 1892, hiệp thợ chúng tôi đục chạm thủ công từng bức bao lam Tứ linh, Mai-Lan-Cúc-Trúc trên 60 cột gỗ căm xe và gõ đỏ đặt trên chân tảng đá xanh chạm hoa sen.',
        en: 'For three continuous years starting in 1889, our guild hand-carved openwork panels of the Four Mythical Creatures across 60 ironwood pillars resting on lotus-carved bluestone bases.',
        zh: '1889至1892年整整三年间，我们匠帮在六十根铁力木与红木柱上精雕细琢四灵与梅兰竹菊镂空花罩，柱脚稳托在莲花青石础上。',
      },
      systemNote:
        'Nghệ nhân Thủ Dầu Một — phân tích kết cấu nhà rường 5 gian 2 chái chữ Đinh, chạm lộng thếp vàng và kỹ thuật chống ẩm chân tảng đá xanh.',
    },
    eyewitness: {
      name: 'Hậu duệ Đời Thứ 4 Gia Tộc Họ Trần',
      role: {
        vi: 'Người gìn giữ ngôi nhà rường 130 năm bên sông Sài Gòn',
        en: '4th-Generation Guardian of the Tran Family Residence',
        zh: '西贡河畔百年陈氏古宅第四代守护人',
      },
      greeting: {
        vi: 'Hơn 130 mùa nước nổi sông Sài Gòn trôi qua, hương gỗ căm xe và ánh xà cừ trên tủ thờ gian chính vẫn óng ánh như thuở cụ Trần Công Vàng dựng nhà năm 1892.',
        en: 'Through 130 flood seasons along the Saigon River, the glow of ironwood pillars and mother-of-pearl ancestral altars endures just as it did in 1892.',
        zh: '西贡河畔百三十载风雨流转，正厅红木柱的温润光泽与供桌螺钿的流光依然如1892年祖辈落成那般典雅庄严。',
      },
      systemNote:
        'Người giữ nhà cổ họ Trần — giới thiệu không gian tiếp khách bộ trường kỷ, di sản làng mộc Thủ Dầu Một và bảo tồn chống mối mọt tự nhiên.',
    },
    polymathSources:
      'Bảo tàng Tỉnh Bình Dương; Hồ sơ Di tích Quốc gia Nhà cổ Trần Công Vàng (QĐ 43-VH/QĐ); Lịch sử Làng nghề Mộc Thủ Dầu Một.',
    polymathContext:
      'Đặt Nhà cổ Trần Công Vàng (1892) làm cầu nối mỹ thuật mộc cung đình Huế với văn hóa nhà vườn thương cảng Thủ Dầu Một - Gia Định.',
    mystery: {
      title: {
        vi: 'Tuyệt Tác Chạm Lộng Tứ Linh Thếp Vàng',
        en: 'Gilded Openwork Carving of the Four Sacred Beasts',
        zh: '正厅贴金镂空四灵木雕花罩',
      },
      riddle: {
        vi: 'Hãy bật **Nội thất** hoặc **Bóc tách 3D** mở mái ngói âm dương, sau đó bấm trúng **hệ Bao Lam chạm lộng Tứ Linh thếp vàng** treo giữa các cột chính điện!',
        en: 'Toggle **Interior** or **Exploded** to reveal inside the wooden halls and click the **Gilded Openwork Bao Lam Screen**!',
        zh: '开启 **室内剖面** 或 **分层剖解** 掀开阴阳瓦屋顶，点击正厅木柱间的**贴金镂空四灵花罩（Bao Lam）**！',
      },
      hintTip: {
        vi: 'Gợi ý: Nằm bên trong gian giữa trung tâm (X ≈ 0, Y ≈ 3.8, Z ≈ +2.8).',
        en: 'Tip: Hanging inside the central altar bay (X ≈ 0, Y ≈ 3.8, Z ≈ +2.8).',
        zh: '提示：悬于正中神龛开间内部（X≈0, Y≈3.8, Z≈+2.8）。',
      },
      targetHotspotIndex: 2,
      targetCenter: [0, 3.8, 2.8],
      acceptRadius: 5.5,
      revealMode: 'exploded',
      secretTitle: {
        vi: '3 Năm Đục Tay & Chân Tảng Đá Hoa Sen Chống Ẩm',
        en: 'Three Years of Hand Carving & Lotus Stone Damp-Proofing',
        zh: '三年精雕与防潮莲花青石柱础',
      },
      secretStory: {
        vi: 'Mỗi bức bao lam đục xuyên thủng hai mặt không ghép nối bằng keo, còn toàn bộ chân cột gỗ được kê trên đá xanh chạm cánh sen giúp cách ly hoàn toàn hơi ẩm từ sông Sài Gòn suốt hơn 130 năm.',
        en: 'Every double-sided openwork screen was chiseled from solid timber without glue, while lotus-carved bluestone plinths keep river humidity away from the columns.',
        zh: '每幅双面透雕花罩均由整块硬木凿空而成，所有木柱下皆垫以精雕莲纹青石柱础，百余年来彻底隔绝西贡河潮气。',
      },
      stampCode: 'STAMP-16-TRANCONGVANG',
    },
  },

  'BD-DT-002': {
    architect: {
      name: 'Chiến sĩ Công binh Tam Giác Sắt',
      role: {
        vi: 'Người đào 100km Địa đạo Tây Nam Bến Cát (1948 - 1967)',
        en: 'Tunnel Engineer of the Iron Triangle · Ben Cat (1948 - 1967)',
        zh: '平阳铁三角百公里地下工事兵工 (1948-1967)',
      },
      greeting: {
        vi: 'Ở bên kia sông Sài Gòn đối diện Củ Chi, chúng tôi đào hơn 100km hầm 2–3 tầng qua 3 xã An Tây - An Điền - Phú An và thiết kế hệ Bếp Hoàng Cầm tản khói ngầm dưới rừng cao su.',
        en: 'Directly across the Saigon River from Cu Chi, we excavated over 100 kilometers of multi-tier tunnels beneath the rubber plantations, complete with subterranean smoke-diffusing kitchens.',
        zh: '在西贡河对岸与古芝遥相呼应的滨吉三乡，我们在橡胶林下开凿了逾百公里多层地道，并构筑了将炊烟散于地下的黄琴灶系统。',
      },
      systemNote:
        'Công binh Tam Giác Sắt — phân tích hệ Bếp Hoàng Cầm tản khói ngầm, hầm chỉ huy chống càn Cedar Falls 1967 và ngách vượt sông sang Củ Chi.',
    },
    eyewitness: {
      name: 'Chiến sĩ Vượt Sông Chiến Dịch Cedar Falls 1967',
      role: {
        vi: 'Nhân chứng giữ vững Vành đai Đỏ An Tây - Phú An năm 1967',
        en: 'Defender of the Iron Triangle during 1967 Operation Cedar Falls',
        zh: '1967年“雪松瀑布”战役渡河保卫战亲历战士',
      },
      greeting: {
        vi: 'Tháng Giêng 1967, khi xe ủi và hàng chục ngàn quân đối phương cày xới rừng cao su Tam Giác Sắt, đội chúng tôi rút xuống tầng hầm 9m và nấu cơm bằng Bếp Hoàng Cầm không để lộ một vệt khói trên bầu trời.',
        en: 'In January 1967, as bulldozers swept the rubber groves above, our unit held out nine meters underground cooking silently on Hoang Cam stoves without a single telltale plume.',
        zh: '1967年1月敌军推土机席卷橡胶林时，我们在九米深的地下坚守，用黄琴灶生火做饭竟未让高空侦察机发现一丝炊烟。',
      },
      systemNote:
        'Chiến sĩ 1967 — kể chuyện đối đầu chiến dịch Cedar Falls, cửa thoát hiểm ven sông Sài Gòn và tinh thần "đất thép thành đồng" Bình Dương - TP.HCM.',
    },
    polymathSources:
      'Bảo tàng Tỉnh Bình Dương; Hồ sơ Di tích Quốc gia Địa đạo Tam Giác Sắt (QĐ 776/QĐ-BVHTT); Tài liệu Chiến dịch Cedar Falls (1967).',
    polymathContext:
      'Khẳng định vai trò song sinh chiến lược giữa Tam Giác Sắt (Bình Dương) — Củ Chi (TP.HCM) — Long Phước (BR-VT) trong cục diện Chiến tranh Lạnh.',
    mystery: {
      title: {
        vi: 'Căn Bếp Ngầm Không Khói Dưới Rừng Cao Su',
        en: 'The Smokeless Subterranean Kitchen',
        zh: '橡胶林下的无烟地下黄琴灶',
      },
      riddle: {
        vi: 'Hãy bật **X-Ray** nhìn vào tầng sâu mặt cắt phía trước và bấm trúng **Bếp Hoàng Cầm & Ống tản khói ngầm** — phát minh giúp nấu ăn dưới lòng đất mà máy bay trinh sát không thể phát hiện!',
        en: 'Toggle **X-Ray** to view the deeper front cutaway and click the **Hoang Cam Stove & Subterranean Smoke Diffuser**!',
        zh: '开启 **X-Ray透视** 观察地下深层剖面，点击令空中侦察机完全盲区的**黄琴灶与地下散烟管道**！',
      },
      hintTip: {
        vi: 'Gợi ý: Nằm ở tầng hầm dưới sâu chính diện phía trước (X ≈ +1.2, Y âm sâu -3.5, Z ≈ +8.5).',
        en: 'Tip: Situated in the deeper front-center chamber (negative Y ≈ -3.5, Z ≈ +8.5).',
        zh: '提示：位于前方正中偏下的深层室（Y≈-3.5, Z≈+8.5）。',
      },
      targetHotspotIndex: 3,
      targetCenter: [1.2, -3.5, 8.5],
      acceptRadius: 6.0,
      revealMode: 'xray',
      secretTitle: {
        vi: 'Nguyên Lý Tản Nhiệt Lòng Đất & Bến Vượt Sông Sài Gòn',
        en: 'Thermal Smoke Diffusion & Saigon River Crossing',
        zh: '地层散热消烟原理与西贡河秘渡口',
      },
      secretStory: {
        vi: 'Khói bếp chạy qua các ống dẫn dài quanh co trong đất ẩm bị làm nguội và lọc hết muội than trước khi thoát ra mặt đất như hơi sương, bảo toàn bí mật cho cả 100km đường hầm nối sang Củ Chi.',
        en: 'Cooking smoke wound through damp earthen ducts that cooled and trapped soot before emerging like harmless morning dew, shielding over 100km of tunnels linked to Cu Chi.',
        zh: '炊烟穿过潮湿土层中蜿蜒的长管，在冷却吸附烟尘后如晨雾般悄然渗出地面，守护着连接古芝的百公里地下通道。',
      },
      stampCode: 'STAMP-17-TAMGIACSAT',
    },
  },
};

export function getLivingDocentSiteData(site: HeritageSite): LivingDocentSiteConfig {
  if (LIVING_DOCENT_SITE_DATA[site.id]) {
    return LIVING_DOCENT_SITE_DATA[site.id];
  }
  return {
    architect: {
      name: site.architect || 'Kiến trúc sư & Nghệ nhân Di sản',
      role: {
        vi: `Chủ thể kiến tạo ${site.officialName}`,
        en: `Master Builder of ${site.officialName}`,
        zh: `${site.officialName} 建筑匠师`,
      },
      greeting: {
        vi: `Tôi là người trực tiếp thiết kế ${site.officialName} theo phong cách ${site.architecturalStyle}.`,
        en: `I oversaw the design of ${site.officialName} in the ${site.architecturalStyle} tradition.`,
        zh: `我主持建造了融合${site.architecturalStyle}风格的${site.officialName}。`,
      },
      systemNote: `Kiến trúc sư công trình ${site.officialName}.`,
    },
    eyewitness: {
      name: `Nhân chứng Lịch sử tại ${site.officialName}`,
      era: site.chronology,
      role: {
        vi: `Chứng nhân qua các dấu mốc ${site.chronology}`,
        en: `Historical Witness (${site.chronology})`,
        zh: `${site.chronology} 历史亲历者`,
      },
      greeting: {
        vi: `Tôi đã chứng kiến những thăng trầm lịch sử sống động nhất tại ${site.officialName}.`,
        en: `I witnessed the defining historical milestones at ${site.officialName}.`,
        zh: `我亲眼见证了${site.officialName}历经岁月沧桑的历史时刻。`,
      },
      systemNote: `Nhân chứng trực tiếp gắn bó với ${site.officialName}.`,
    },
    polymathSources:
      'Gia Định thành thông chí (Trịnh Hoài Đức); Lịch sử khẩn hoang miền Nam (Sơn Nam); Cục Di sản Văn hóa.',
    polymathContext: site.summary,
    mystery: {
      title: {
        vi: `Giải mã Điểm nhấn ${site.officialName}`,
        en: `Decode the Landmark Feature`,
        zh: `解码地标核心建筑密码`,
      },
      riddle: {
        vi: `Hãy xoay mô hình và bấm trực tiếp lên phần kiến trúc tiêu biểu nhất của ${site.officialName}!`,
        en: `Orbit the 3D model and click directly on the signature structure of ${site.officialName}!`,
        zh: `旋转3D模型，直接点击${site.officialName}最具代表性的核心构件！`,
      },
      hintTip: {
        vi: 'Gợi ý: Tập trung vào khối kiến trúc trung tâm của công trình.',
        en: 'Tip: Focus on the central architectural focal point.',
        zh: '提示：重点观察建筑主体的核心位置。',
      },
      targetHotspotIndex: 0,
      targetCenter: [0, 4, 0],
      acceptRadius: 6.5,
      revealMode: 'exploded',
      secretTitle: {
        vi: `Hồ sơ Di sản ${site.officialName}`,
        en: `Heritage Dossier Unlocked`,
        zh: `历史秘档已解锁`,
      },
      secretStory: {
        vi: site.summary,
        en: site.summary,
        zh: site.summary,
      },
      stampCode: `STAMP-${site.id}`,
    },
  };
}

/**
 * Evaluates a user's 3D Raycaster click against the mystery target center and returns
 * either `matched: true` or smart directional feedback in VI/EN/ZH.
 */
export function evaluateMysteryRayClick(
  hitPoint: [number, number, number],
  targetCenter: [number, number, number],
  acceptRadius: number,
  lang: Language
): { matched: boolean; distance: number; feedback: string } {
  const dx = hitPoint[0] - targetCenter[0];
  const dy = hitPoint[1] - targetCenter[1];
  const dz = hitPoint[2] - targetCenter[2];
  const distance = Math.hypot(dx, dy, dz);

  if (distance <= acceptRadius) {
    return {
      matched: true,
      distance,
      feedback:
        lang === 'en'
          ? 'Exact structural match! Unlocking architectural anatomy & stamping your Heritage Passport.'
          : lang === 'zh'
          ? '精准命中目标构件！正在展开三维解剖结构并加盖遗产护照印章。'
          : 'Chính xác tuyệt đối! Đang kích hoạt giải phẫu cấu trúc 3D và đóng dấu Hộ chiếu Di sản.',
    };
  }

  // Generate directional hint comparing hitPoint vs targetCenter
  const hints: string[] = [];
  if (Math.abs(dy) >= 2.2) {
    if (dy < 0) {
      hints.push(
        lang === 'en'
          ? 'look higher up'
          : lang === 'zh'
          ? '再往高处找一点'
          : 'tìm ở tầng cao hơn một chút'
      );
    } else {
      hints.push(
        lang === 'en'
          ? 'look lower down'
          : lang === 'zh'
          ? '再往低处/深层找一点'
          : 'nhìn xuống thấp hoặc sâu hơn một chút'
      );
    }
  }
  if (Math.abs(dz) >= 3.0) {
    if (dz < 0) {
      hints.push(
        lang === 'en'
          ? 'move toward the front facade'
          : lang === 'zh'
          ? '移向正前方立面'
          : 'xoay về phía mặt tiền / đằng trước hơn'
      );
    } else {
      hints.push(
        lang === 'en'
          ? 'look further toward the rear'
          : lang === 'zh'
          ? '移向建筑后方'
          : 'xoay ra phía sau công trình hơn'
      );
    }
  }
  if (Math.abs(dx) >= 3.0) {
    if (dx < 0) {
      hints.push(
        lang === 'en'
          ? 'shift slightly to the right'
          : lang === 'zh'
          ? '略微向右侧移动'
          : 'dịch sang bên phải thêm chút'
      );
    } else {
      hints.push(
        lang === 'en'
          ? 'shift slightly to the left'
          : lang === 'zh'
          ? '略微向左侧移动'
          : 'dịch sang bên trái thêm chút'
      );
    }
  }

  const directionPhrase =
    hints.length > 0
      ? hints.join(', ')
      : lang === 'en'
      ? 'click right on the highlighted zone'
      : lang === 'zh'
      ? '请紧贴提示方位再点击一次'
      : 'bấm sát hơn vào điểm gợi ý';

  const proximityNote =
    distance <= acceptRadius * 1.6
      ? lang === 'en'
        ? 'Very close!'
        : lang === 'zh'
        ? '非常接近了！'
        : 'Rất gần rồi!'
      : lang === 'en'
      ? 'Not quite there yet.'
      : lang === 'zh'
      ? '位置还有些偏差。'
      : 'Vị trí này chưa đúng.';

  return {
    matched: false,
    distance,
    feedback:
      lang === 'en'
        ? `${proximityNote} Hint: ${directionPhrase}.`
        : lang === 'zh'
        ? `${proximityNote} 提示：${directionPhrase}。`
        : `${proximityNote} Gợi ý: Hãy ${directionPhrase}.`,
  };
}
