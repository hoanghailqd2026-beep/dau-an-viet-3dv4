import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Language } from '../../i18n/types';

export type GuideSectionId =
  | 'explore'
  | 'space3d'
  | 'map_routes'
  | 'catalog'
  | 'edtech'
  | 'audio';

export const GUIDE_SECTION_ORDER: GuideSectionId[] = [
  'explore',
  'space3d',
  'map_routes',
  'catalog',
  'edtech',
  'audio',
];

interface GuideCardCopy {
  title: string;
  caption: string;
}

interface GuideSectionCopy {
  tabLabel: string;
  modalTitle: string;
  cards: [GuideCardCopy, GuideCardCopy, GuideCardCopy];
}

interface GuideLocaleBundle {
  subtitle: string;
  closeLabel: string;
  confirmCta: string;
  buttonLabel: string;
  buttonAria: string;
  sections: Record<GuideSectionId, GuideSectionCopy>;
}

const GUIDE_CONTENT: Record<Language, GuideLocaleBundle> = {
  vi: {
    subtitle: '3 thao tác trực quan qua hình minh họa',
    closeLabel: 'Đóng hộp thoại hướng dẫn',
    confirmCta: 'Đã hiểu, bắt đầu khám phá',
    buttonLabel: 'Hướng dẫn',
    buttonAria: 'Mở hướng dẫn sử dụng khu vực này',
    sections: {
      explore: {
        tabLabel: 'Khám phá',
        modalTitle: 'Hướng dẫn khám phá Bảo tàng số Dấu Ấn Việt 3D',
        cards: [
          {
            title: '1. Chọn điểm đến di sản',
            caption: 'Lướt dải 17 di tích nổi bật và bấm Khám phá ngay để mở hồ sơ.',
          },
          {
            title: '2. Trải nghiệm mô hình 3D',
            caption: 'Xoay 360°, bóc tách tầng kiến trúc và quan sát không gian nội thất.',
          },
          {
            title: '3. Nghe thuyết minh & Hỏi AI',
            caption: 'Bật thuyết minh đa ngôn ngữ hoặc trò chuyện cùng Sử Quan Dấu Ấn.',
          },
        ],
      },
      space3d: {
        tabLabel: 'Không gian 3D',
        modalTitle: 'Hướng dẫn trải nghiệm Không gian 3D',
        cards: [
          {
            title: '1. Xoay & Thu phóng tự do',
            caption: 'Kéo chuột trái để xoay 360°, cuộn con lăn để phóng to chi tiết kiến trúc.',
          },
          {
            title: '2. Bóc tách 4 tầng & X-Ray',
            caption: 'Bấm chế độ Bóc tách hoặc X-Ray để nhìn xuyên kết cấu và nội thất bên trong.',
          },
          {
            title: '3. Tham quan tự động',
            caption: 'Bật Tự động tham quan để camera dẫn lối qua từng gian phòng trọng điểm.',
          },
        ],
      },
      map_routes: {
        tabLabel: 'Bản đồ & Tuyến',
        modalTitle: 'Hướng dẫn khám phá Bản đồ & Tuyến di sản',
        cards: [
          {
            title: '1. Chọn tuyến hành trình',
            caption: 'Lọc theo 9 tuyến di sản tại TP.HCM, Bình Dương và Bà Rịa - Vũng Tàu.',
          },
          {
            title: '2. Chạm điểm ghim trên bản đồ',
            caption: 'Bấm vào từng điểm di tích trên bản đồ để xem khoảng cách và thông tin nhanh.',
          },
          {
            title: '3. Chuyển tiếp vào mô hình 3D',
            caption: 'Từ thẻ điểm dừng trên bản đồ, bấm mở thẳng Không gian 3D tương ứng.',
          },
        ],
      },
      catalog: {
        tabLabel: 'Hồ sơ Di sản',
        modalTitle: 'Hướng dẫn tra cứu Hồ sơ Di sản',
        cards: [
          {
            title: '1. Chuyển đổi góc nhìn tra cứu',
            caption: 'Xem từng hồ sơ chi tiết hoặc lướt trục thời gian 300 năm (1698 - 2026).',
          },
          {
            title: '2. Tìm nhanh theo tên & vùng',
            caption: 'Gõ tên di tích không dấu hoặc lọc theo địa danh để tra cứu tức thì.',
          },
          {
            title: '3. Đọc sử liệu & Vào 3D',
            caption: 'Đọc niên đại, giá trị kiến trúc và bấm Khám phá bóc tách 3D ngay trong bài.',
          },
        ],
      },
      edtech: {
        tabLabel: 'Vé & Học liệu',
        modalTitle: 'Hướng dẫn chọn Vé & Kho Học liệu',
        cards: [
          {
            title: '1. Chọn gói trải nghiệm phù hợp',
            caption: 'So sánh quyền lợi giữa vé miễn phí, vé theo tuyến và vé trọn bộ 17 di tích.',
          },
          {
            title: '2. Thanh toán Nội địa & Quốc tế',
            caption: 'Hỗ trợ quét VietQR cho khách Việt Nam và PayPal/Thẻ quốc tế cho khách nước ngoài.',
          },
          {
            title: '3. Mở khóa 3D & Kho học liệu',
            caption: 'Kích hoạt ngay bóc tách 3D, thuyết minh đa ngôn ngữ và phiếu học tập lịch sử.',
          },
        ],
      },
      audio: {
        tabLabel: 'Thuyết minh',
        modalTitle: 'Hướng dẫn nghe Thuyết minh Di sản',
        cards: [
          {
            title: '1. Chọn ngôn ngữ thuyết minh',
            caption: 'Chuyển đổi linh hoạt giữa giọng đọc tiếng Việt, tiếng Anh và tiếng Trung.',
          },
          {
            title: '2. Chọn chương & Nghe audio',
            caption: 'Bấm Nghe thuyết minh ở từng chương để theo dõi câu chuyện theo từng phần.',
          },
          {
            title: '3. Nghe xuyên suốt khi xem 3D',
            caption: 'Trình phát tự thu gọn ở góc dưới để bạn vừa nghe vừa xoay mô hình 3D.',
          },
        ],
      },
    },
  },
  en: {
    subtitle: '3 visual cues through curated diagrams',
    closeLabel: 'Close guide dialog',
    confirmCta: 'Got it, start exploring',
    buttonLabel: 'Guide',
    buttonAria: 'Open visual guide for this section',
    sections: {
      explore: {
        tabLabel: 'Explore',
        modalTitle: 'Guide to Dấu Ấn Việt 3D Digital Museum',
        cards: [
          {
            title: '1. Choose a Heritage Destination',
            caption: 'Browse the 17 featured monument cards and click Explore Now to open dossiers.',
          },
          {
            title: '2. Experience 3D Models',
            caption: 'Orbit 360°, explode architectural layers, and inspect interior spaces.',
          },
          {
            title: '3. Audio Guide & Historiographer AI',
            caption: 'Enable multilingual narration or converse with Royal Historiographer AI.',
          },
        ],
      },
      space3d: {
        tabLabel: '3D Space',
        modalTitle: 'Guide to Interactive 3D Space',
        cards: [
          {
            title: '1. Free Orbit & Zoom',
            caption: 'Drag left mouse button to rotate 360° and scroll wheel to zoom into details.',
          },
          {
            title: '2. 4-Floor Dissection & X-Ray',
            caption: 'Toggle Exploded Layers or X-Ray mode to see straight through structures.',
          },
          {
            title: '3. Automated Guided Tour',
            caption: 'Activate Auto Tour so the camera glides smoothly across key chambers.',
          },
        ],
      },
      map_routes: {
        tabLabel: 'Map & Routes',
        modalTitle: 'Guide to Heritage Map & Routes',
        cards: [
          {
            title: '1. Pick a Heritage Route',
            caption: 'Filter across 9 curated routes spanning HCMC, Binh Duong, and Ba Ria - Vung Tau.',
          },
          {
            title: '2. Tap Map Markers',
            caption: 'Click any glowing monument pin on the map to preview distance and quick facts.',
          },
          {
            title: '3. Jump Straight into 3D',
            caption: 'Open the matching interactive 3D architectural model directly from any map stop.',
          },
        ],
      },
      catalog: {
        tabLabel: 'Dossiers',
        modalTitle: 'Guide to Heritage Dossiers & Chronicle',
        cards: [
          {
            title: '1. Switch Research Views',
            caption: 'Inspect individual dossiers or glide through the 300-Year Chronicle (1698 - 2026).',
          },
          {
            title: '2. Instant Search & Region Filter',
            caption: 'Type accent-free monument names or filter by province for instant lookup.',
          },
          {
            title: '3. Read Archives & Enter 3D',
            caption: 'Review historical dates, architectural value, and launch 3D Dissection inside.',
          },
        ],
      },
      edtech: {
        tabLabel: 'Tickets & EdTech',
        modalTitle: 'Guide to Digital Passes & Learning Packs',
        cards: [
          {
            title: '1. Select the Right Pass',
            caption: 'Compare benefits across Free Basic, Route Plus/Pro, and School Edu passes.',
          },
          {
            title: '2. Local & International Checkout',
            caption: 'Pay seamlessly via VietQR in Vietnam or PayPal & International Cards abroad.',
          },
          {
            title: '3. Unlock 3D & Study Resources',
            caption: 'Instantly activate 3D dissection, multilingual audio guides, and worksheets.',
          },
        ],
      },
      audio: {
        tabLabel: 'Audio Guide',
        modalTitle: 'Guide to Museum Audio Narration',
        cards: [
          {
            title: '1. Pick Narration Language',
            caption: 'Switch effortlessly between Vietnamese, English, and Chinese museum voices.',
          },
          {
            title: '2. Choose Chapters & Listen',
            caption: 'Tap Listen to Audio Guide on each chapter to follow the story part by part.',
          },
          {
            title: '3. Continuous Listening in 3D',
            caption: 'The player docks compactly at the corner so you can listen while orbiting 3D.',
          },
        ],
      },
    },
  },
  zh: {
    subtitle: '3 张图解快速掌握当前分区操作',
    closeLabel: '关闭指南弹窗',
    confirmCta: '已了解，开始探索',
    buttonLabel: '使用指南',
    buttonAria: '打开当前区域图解指南',
    sections: {
      explore: {
        tabLabel: '探索主页',
        modalTitle: '越印 3D 数字博物馆探索指南',
        cards: [
          {
            title: '1. 选择遗产目的地',
            caption: '滑动浏览 17 处精选遗迹卡片，点击立即探索打开完整档案。',
          },
          {
            title: '2. 体验 3D 建筑模型',
            caption: '360° 旋转、分层拆解建筑结构并观察室内空间细节。',
          },
          {
            title: '3. 语音导览与史官 AI',
            caption: '开启多语种博物馆语音导览，或与越印史官 AI 实时对话。',
          },
        ],
      },
      space3d: {
        tabLabel: '3D 空间',
        modalTitle: '3D 建筑交互空间使用指南',
        cards: [
          {
            title: '1. 自由旋转与缩放',
            caption: '左键拖拽 360° 旋转视角，滚动滚轮放大观察建筑工艺细节。',
          },
          {
            title: '2. 四层解构与 X-Ray 透视',
            caption: '切换分层拆解或 X-Ray 模式，透视建筑承重结构与内部格局。',
          },
          {
            title: '3. 自动导览巡航',
            caption: '开启自动巡览功能，镜头将沿着路径依次展示重点展厅。',
          },
        ],
      },
      map_routes: {
        tabLabel: '地图与路线',
        modalTitle: '遗产地图与主题路线指南',
        cards: [
          {
            title: '1. 选择主题遗产路线',
            caption: '按 9 条路线筛选胡志明市、平阳及巴地头顿地区历史遗迹。',
          },
          {
            title: '2. 点击地图发光坐标点',
            caption: '点击地图上的遗迹坐标，即时查看距离与核心历史简介。',
          },
          {
            title: '3. 一键直达 3D 模型',
            caption: '在地图站点信息卡中直接跳转进入对应的 3D 立体建筑空间。',
          },
        ],
      },
      catalog: {
        tabLabel: '遗产档案',
        modalTitle: '遗产档案与三百年编年史指南',
        cards: [
          {
            title: '1. 切换档案查阅视图',
            caption: '逐份阅读 17 处遗迹档案，或纵览 300 年历史长河 (1698 - 2026)。',
          },
          {
            title: '2. 按名称与地区快速检索',
            caption: '输入关键词或按省份地区筛选，即刻定位目标遗迹资料。',
          },
          {
            title: '3. 阅读史料并进入 3D',
            caption: '查阅建成年份与建筑价值，并在文内一键开启 3D 结构解构。',
          },
        ],
      },
      edtech: {
        tabLabel: '门票与教材',
        modalTitle: '数字门票与教学资源指南',
        cards: [
          {
            title: '1. 选择适合的体验方案',
            caption: '对比基础免费票、路线 Plus/Pro 票与学校教学全套权益。',
          },
          {
            title: '2. 本地与国际便捷支付',
            caption: '支持越南本地 VietQR 扫码及国际访客 PayPal/银行卡美元结算。',
          },
          {
            title: '3. 解锁 3D 与历史学案',
            caption: '即刻激活 3D 分层解构、多语种语音导览及历史学习单下载。',
          },
        ],
      },
      audio: {
        tabLabel: '语音导览',
        modalTitle: '博物馆多语种语音导览指南',
        cards: [
          {
            title: '1. 切换导览语言',
            caption: '在越南语、英语和中文专业博物馆配音之间自由切换。',
          },
          {
            title: '2. 选择章节收听讲解',
            caption: '点击各章节的收听导览按钮，分段聆听建筑与历史故事。',
          },
          {
            title: '3. 浏览 3D 时持续播放',
            caption: '播放器自动收起至屏幕角落，让您边聆听边旋转 3D 模型。',
          },
        ],
      },
    },
  },
};

export interface SectionGuideButtonProps {
  lang: Language;
  onClick: () => void;
  className?: string;
  compact?: boolean;
}

export const SectionGuideButton: React.FC<SectionGuideButtonProps> = ({
  lang,
  onClick,
  className = '',
  compact = false,
}) => {
  const bundle = GUIDE_CONTENT[lang] || GUIDE_CONTENT.vi;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={bundle.buttonAria}
      title={bundle.buttonLabel}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-[#171817] border border-[#C9A46A]/40 hover:border-[#C9A46A] hover:bg-[#222320] text-[#D8C9A9] hover:text-[#F7F3EB] text-xs font-medium shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
        compact ? 'w-9 h-9 p-0' : 'px-3.5 py-1.5'
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#C9A46A"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5 shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9.25" />
        <path d="M9.4 9.35a2.7 2.7 0 0 1 5.25.9c0 1.8-2.65 2.35-2.65 3.65" />
        <circle cx="12" cy="17.1" r="0.65" fill="#C9A46A" stroke="none" />
      </svg>
      {!compact && <span>{bundle.buttonLabel}</span>}
    </button>
  );
};

interface DiagramProps {
  section: GuideSectionId;
  cardIndex: 0 | 1 | 2;
  lang: Language;
}

const SectionDiagramSvg: React.FC<DiagramProps> = ({ section, cardIndex, lang }) => {
  /* =========================================================================
     SET 1: KHÁM PHÁ (EXPLORE)
     ========================================================================= */
  if (section === 'explore') {
    if (cardIndex === 0) {
      return (
        <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
          {/* Back Left Card (Jade #47796D) */}
          <g transform="translate(22, 24) rotate(-5 28 44)">
            <rect x="0" y="0" width="54" height="86" rx="10" fill="#47796D" fillOpacity="0.28" stroke="#47796D" strokeWidth="1.2" />
            <rect x="6" y="7" width="42" height="36" rx="6" fill="#141514" stroke="#C9A46A" strokeOpacity="0.25" strokeWidth="0.9" />
            <text x="8" y="55" fill="#D8C9A9" fillOpacity="0.7" fontSize="8" fontFamily="ui-monospace, monospace">02</text>
            <rect x="8" y="61" width="34" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.45" />
            <rect x="8" y="69" width="24" height="3.5" rx="1.75" fill="#D8C9A9" fillOpacity="0.28" />
          </g>

          {/* Back Right Card (Slate #526D8B) */}
          <g transform="translate(164, 24) rotate(5 28 44)">
            <rect x="0" y="0" width="54" height="86" rx="10" fill="#526D8B" fillOpacity="0.28" stroke="#526D8B" strokeWidth="1.2" />
            <rect x="6" y="7" width="42" height="36" rx="6" fill="#141514" stroke="#C9A46A" strokeOpacity="0.25" strokeWidth="0.9" />
            <text x="8" y="55" fill="#D8C9A9" fillOpacity="0.7" fontSize="8" fontFamily="ui-monospace, monospace">03</text>
            <rect x="8" y="61" width="34" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.45" />
            <rect x="8" y="69" width="24" height="3.5" rx="1.75" fill="#D8C9A9" fillOpacity="0.28" />
          </g>

          {/* Featured Center Card (Terracotta #A94F3D) with 01 | 02 photo switcher */}
          <g transform="translate(76, 12)">
            <rect x="0" y="0" width="88" height="106" rx="12" fill="#A94F3D" fillOpacity="0.34" stroke="#C9A46A" strokeWidth="1.5" />
            {/* Photo frame */}
            <rect x="7" y="8" width="74" height="46" rx="7" fill="#141514" stroke="#C9A46A" strokeOpacity="0.35" strokeWidth="1" />
            {/* Stylized temple roof silhouette inside photo */}
            <path d="M18 44 L44 26 L70 44 Z" fill="#C9A46A" fillOpacity="0.22" stroke="#C9A46A" strokeWidth="1.1" />
            <line x1="25" y1="44" x2="25" y2="50" stroke="#D8C9A9" strokeOpacity="0.55" strokeWidth="1.2" />
            <line x1="44" y1="36" x2="44" y2="50" stroke="#D8C9A9" strokeOpacity="0.55" strokeWidth="1.2" />
            <line x1="63" y1="44" x2="63" y2="50" stroke="#D8C9A9" strokeOpacity="0.55" strokeWidth="1.2" />

            {/* 01 | 02 photo switcher badge */}
            <rect x="47" y="12" width="30" height="12" rx="6" fill="#171817" stroke="#C9A46A" strokeOpacity="0.7" strokeWidth="0.9" />
            <text x="62" y="20.5" textAnchor="middle" fill="#D8C9A9" fontSize="6.6" fontWeight="700" fontFamily="ui-monospace, monospace">
              01|02
            </text>

            {/* Card title lines */}
            <rect x="9" y="62" width="46" height="5" rx="2.5" fill="#D8C9A9" fillOpacity="0.85" />
            <rect x="9" y="72" width="66" height="3.5" rx="1.75" fill="#D8C9A9" fillOpacity="0.45" />

            {/* Explore CTA pill */}
            <rect x="9" y="84" width="68" height="14" rx="7" fill="#171817" stroke="#C9A46A" strokeWidth="1" />
            <text x="43" y="93.5" textAnchor="middle" fill="#C9A46A" fontSize="7.2" fontWeight="600" fontFamily="system-ui, sans-serif">
              {lang === 'en' ? 'Explore →' : lang === 'zh' ? '立即探索 →' : 'Khám phá →'}
            </text>
          </g>

          {/* Subtle pointer cursor clicking CTA */}
          <path
            d="M150 95 L163 102 L157.5 104.5 L160.2 111.5 L157 113 L154.2 106 L150 110 Z"
            fill="#D8C9A9"
            stroke="#141514"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    if (cardIndex === 1) {
      return (
        <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
          <line x1="120" y1="10" x2="120" y2="98" stroke="#C9A46A" strokeOpacity="0.45" strokeWidth="1.1" strokeDasharray="3 3" />
          <path d="M64 86 C64 76 176 76 176 86 C176 96 64 96 64 86" fill="none" stroke="#C9A46A" strokeOpacity="0.42" strokeWidth="1.3" strokeDasharray="5 3" />
          <path d="M167 90 L175 86 L167 82" fill="none" stroke="#C9A46A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M73 82 L65 86 L73 90" fill="none" stroke="#C9A46A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <g transform="translate(120, 74)">
            <polygon points="0,-11 32,2 0,15 -32,2" fill="#526D8B" fillOpacity="0.3" stroke="#C9A46A" strokeWidth="1.3" strokeLinejoin="round" />
          </g>
          <g transform="translate(120, 50)">
            <polygon points="0,-11 30,2 0,15 -30,2" fill="#47796D" fillOpacity="0.34" stroke="#C9A46A" strokeWidth="1.4" strokeLinejoin="round" />
            <line x1="-18" y1="-2" x2="-18" y2="8" stroke="#D8C9A9" strokeOpacity="0.65" strokeWidth="1.1" />
            <line x1="0" y1="4" x2="0" y2="14" stroke="#D8C9A9" strokeOpacity="0.65" strokeWidth="1.1" />
            <line x1="18" y1="-2" x2="18" y2="8" stroke="#D8C9A9" strokeOpacity="0.65" strokeWidth="1.1" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" values="120,24; 120,19; 120,24" dur="2.8s" repeatCount="indefinite" />
            <polygon points="0,-13 28,0 0,13 -28,0" fill="#A94F3D" fillOpacity="0.4" stroke="#C9A46A" strokeWidth="1.5" strokeLinejoin="round" />
            <line x1="-28" y1="0" x2="28" y2="0" stroke="#C9A46A" strokeOpacity="0.45" strokeWidth="0.9" />
          </g>
          <g transform="translate(74, 105)">
            <rect x="0" y="0" width="92" height="19" rx="9.5" fill="#141514" stroke="#C9A46A" strokeOpacity="0.7" strokeWidth="1.1" />
            <text x="46" y="12.5" textAnchor="middle" fill="#C9A46A" fontSize="8.6" fontWeight="700" letterSpacing="0.08em" fontFamily="ui-monospace, monospace">
              {lang === 'en' ? '3D · DISSECT' : lang === 'zh' ? '3D · 分层解构' : '3D · BÓC TÁCH'}
            </text>
          </g>
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
        <g transform="translate(22, 34)">
          <rect x="0" y="0" width="64" height="64" rx="14" fill="#141514" stroke="#47796D" strokeOpacity="0.65" strokeWidth="1.3" />
          <path d="M16 36V31A16 16 0 0 1 48 31V36" fill="none" stroke="#D8C9A9" strokeWidth="1.9" strokeLinecap="round" />
          <rect x="14" y="33" width="7" height="14" rx="3" fill="#47796D" fillOpacity="0.45" stroke="#D8C9A9" strokeWidth="1.5" />
          <rect x="43" y="33" width="7" height="14" rx="3" fill="#47796D" fillOpacity="0.45" stroke="#D8C9A9" strokeWidth="1.5" />
          <rect x="25" y="37" width="2.4" height="8" rx="1.2" fill="#47796D">
            <animate attributeName="height" values="6;13;6" dur="1.3s" repeatCount="indefinite" />
            <animate attributeName="y" values="39;35.5;39" dur="1.3s" repeatCount="indefinite" />
          </rect>
          <rect x="29.5" y="34" width="2.4" height="14" rx="1.2" fill="#47796D">
            <animate attributeName="height" values="14;7;14" dur="1.1s" repeatCount="indefinite" />
            <animate attributeName="y" values="35;38.5;35" dur="1.1s" repeatCount="indefinite" />
          </rect>
          <rect x="34" y="36" width="2.4" height="10" rx="1.2" fill="#47796D">
            <animate attributeName="height" values="8;15;8" dur="1.45s" repeatCount="indefinite" />
            <animate attributeName="y" values="38;34.5;38" dur="1.45s" repeatCount="indefinite" />
          </rect>
          <rect x="38.5" y="38" width="2.4" height="6" rx="1.2" fill="#47796D">
            <animate attributeName="height" values="11;5;11" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="y" values="36.5;39.5;36.5" dur="1.2s" repeatCount="indefinite" />
          </rect>
        </g>
        <path d="M93 58 C97 62 97 70 93 74" fill="none" stroke="#47796D" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M99 53 C105 60 105 72 99 79" fill="none" stroke="#47796D" strokeOpacity="0.65" strokeWidth="1.4" strokeLinecap="round" />
        <g transform="translate(114, 24)">
          <path d="M12 0 H96 A12 12 0 0 1 108 12 V62 A12 12 0 0 1 96 74 H28 L12 86 V74 A12 12 0 0 1 0 62 V12 A12 12 0 0 1 12 0 Z" fill="#141514" stroke="#C9A46A" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="14" cy="18" r="3.5" fill="#C9A46A" />
          <text x="23" y="21.5" fill="#C9A46A" fontSize="9" fontWeight="700" fontFamily="system-ui, sans-serif">
            {lang === 'en' ? 'Historiographer' : lang === 'zh' ? '越印史官 AI' : 'Sử Quan Dấu Ấn'}
          </text>
          <line x1="12" y1="30" x2="96" y2="30" stroke="#C9A46A" strokeOpacity="0.22" strokeWidth="1" />
          <rect x="12" y="38" width="76" height="5" rx="2.5" fill="#D8C9A9" fillOpacity="0.55" />
          <rect x="12" y="48" width="58" height="5" rx="2.5" fill="#D8C9A9" fillOpacity="0.35" />
          <rect x="12" y="58" width="38" height="5" rx="2.5" fill="#47796D" fillOpacity="0.85" />
        </g>
      </svg>
    );
  }

  /* =========================================================================
     SET 2: KHÔNG GIAN 3D (3D SPACE)
     ========================================================================= */
  if (section === 'space3d') {
    if (cardIndex === 0) {
      return (
        <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
          {/* 360 degree orbit ring */}
          <ellipse cx="96" cy="68" rx="64" ry="26" fill="none" stroke="#C9A46A" strokeOpacity="0.48" strokeWidth="1.4" strokeDasharray="5 3.5" />
          <path d="M152 60 L160 66 L151 71" fill="none" stroke="#C9A46A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 75 L32 69 L41 64" fill="none" stroke="#C9A46A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

          {/* Architectural isometric pavilion wireframe */}
          <g transform="translate(96, 62)">
            <polygon points="0,-24 30,-10 0,4 -30,-10" fill="#A94F3D" fillOpacity="0.32" stroke="#C9A46A" strokeWidth="1.4" strokeLinejoin="round" />
            <polygon points="-24,-7 0,5 0,22 -24,10" fill="#47796D" fillOpacity="0.28" stroke="#D8C9A9" strokeOpacity="0.7" strokeWidth="1.2" />
            <polygon points="24,-7 0,5 0,22 24,10" fill="#526D8B" fillOpacity="0.28" stroke="#D8C9A9" strokeOpacity="0.7" strokeWidth="1.2" />
          </g>

          {/* 360° Badge */}
          <rect x="74" y="102" width="44" height="17" rx="8.5" fill="#141514" stroke="#C9A46A" strokeOpacity="0.65" strokeWidth="1" />
          <text x="96" y="113.5" textAnchor="middle" fill="#C9A46A" fontSize="8.8" fontWeight="700" fontFamily="ui-monospace, monospace">
            360°
          </text>

          {/* Right: Mouse drag & scroll wheel zoom icon */}
          <g transform="translate(182, 34)">
            <rect x="0" y="0" width="32" height="50" rx="16" fill="#141514" stroke="#D8C9A9" strokeWidth="1.5" />
            <line x1="16" y1="0" x2="16" y2="21" stroke="#D8C9A9" strokeOpacity="0.45" strokeWidth="1.1" />
            <line x1="0" y1="21" x2="32" y2="21" stroke="#D8C9A9" strokeOpacity="0.45" strokeWidth="1.1" />
            {/* Highlighted left click */}
            <path d="M16 1 A15 15 0 0 0 1 16 V20 H15 V1 Z" fill="#C9A46A" fillOpacity="0.42" />
            {/* Animated scroll wheel */}
            <rect x="14.2" y="8" width="3.6" height="8" rx="1.8" fill="#C9A46A">
              <animate attributeName="y" values="7;10.5;7" dur="1.6s" repeatCount="indefinite" />
            </rect>
            {/* Plus / Minus zoom indicators */}
            <text x="16" y="65" textAnchor="middle" fill="#D8C9A9" fillOpacity="0.75" fontSize="8.5" fontFamily="ui-monospace, monospace">
              + / -
            </text>
          </g>
        </svg>
      );
    }

    if (cardIndex === 1) {
      return (
        <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
          {/* Vertical stack axis */}
          <line x1="94" y1="10" x2="94" y2="112" stroke="#C9A46A" strokeOpacity="0.4" strokeWidth="1.1" strokeDasharray="2.5 2.5" />

          {/* 4 Exploded Floorplates */}
          <g transform="translate(94, 96)">
            <polygon points="0,-9 34,2 0,13 -34,2" fill="#526D8B" fillOpacity="0.35" stroke="#526D8B" strokeWidth="1.3" />
          </g>
          <g transform="translate(94, 73)">
            <polygon points="0,-9 34,2 0,13 -34,2" fill="#47796D" fillOpacity="0.35" stroke="#47796D" strokeWidth="1.3" />
          </g>
          <g transform="translate(94, 50)">
            <polygon points="0,-9 34,2 0,13 -34,2" fill="#C9A46A" fillOpacity="0.28" stroke="#C9A46A" strokeWidth="1.3" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" values="94,25; 94,21; 94,25" dur="2.6s" repeatCount="indefinite" />
            <polygon points="0,-10 32,1 0,12 -32,1" fill="#A94F3D" fillOpacity="0.42" stroke="#C9A46A" strokeWidth="1.4" />
          </g>

          {/* X-Ray scan beam sweeping right side */}
          <g transform="translate(152, 20)">
            <rect x="0" y="0" width="66" height="90" rx="10" fill="#141514" stroke="#526D8B" strokeOpacity="0.7" strokeWidth="1.3" />
            {/* Wireframe internal skeleton */}
            <rect x="13" y="16" width="40" height="48" fill="none" stroke="#526D8B" strokeOpacity="0.7" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="13" y1="32" x2="53" y2="32" stroke="#526D8B" strokeOpacity="0.7" strokeWidth="1" />
            <line x1="13" y1="48" x2="53" y2="48" stroke="#526D8B" strokeOpacity="0.7" strokeWidth="1" />
            <line x1="33" y1="16" x2="33" y2="64" stroke="#C9A46A" strokeOpacity="0.5" strokeWidth="1" />
            {/* Animated horizontal X-Ray beam */}
            <line x1="8" y1="26" x2="58" y2="26" stroke="#C9A46A" strokeWidth="1.8" strokeLinecap="round">
              <animate attributeName="y1" values="16;62;16" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="y2" values="16;62;16" dur="2.4s" repeatCount="indefinite" />
            </line>
            <text x="33" y="80" textAnchor="middle" fill="#D8C9A9" fontSize="8.5" fontWeight="700" letterSpacing="0.08em" fontFamily="ui-monospace, monospace">
              X-RAY
            </text>
          </g>
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
        {/* Subtle floor perspective grid */}
        <line x1="20" y1="106" x2="220" y2="106" stroke="#C9A46A" strokeOpacity="0.14" strokeWidth="1" />
        {/* Smooth cinematic camera spline */}
        <path
          d="M34 94 C64 42, 108 102, 144 56 C164 32, 192 42, 208 62"
          fill="none"
          stroke="#C9A46A"
          strokeWidth="1.8"
          strokeDasharray="5 3.5"
          strokeLinecap="round"
        />

        {/* Waypoint 01 */}
        <circle cx="34" cy="94" r="9" fill="#141514" stroke="#47796D" strokeWidth="1.5" />
        <text x="34" y="97" textAnchor="middle" fill="#D8C9A9" fontSize="7.5" fontWeight="700" fontFamily="ui-monospace, monospace">01</text>

        {/* Waypoint 02 */}
        <circle cx="144" cy="56" r="9" fill="#141514" stroke="#C9A46A" strokeWidth="1.5" />
        <text x="144" y="59" textAnchor="middle" fill="#C9A46A" fontSize="7.5" fontWeight="700" fontFamily="ui-monospace, monospace">02</text>

        {/* Waypoint 03 */}
        <circle cx="208" cy="62" r="9" fill="#141514" stroke="#A94F3D" strokeWidth="1.5" />
        <text x="208" y="65" textAnchor="middle" fill="#D8C9A9" fontSize="7.5" fontWeight="700" fontFamily="ui-monospace, monospace">03</text>

        {/* Camera icon gliding along upper curve */}
        <g transform="translate(76, 36)">
          <rect x="0" y="4" width="26" height="17" rx="4" fill="#141514" stroke="#C9A46A" strokeWidth="1.5" />
          <polygon points="26,9 35,5 35,20 26,16" fill="#C9A46A" fillOpacity="0.35" stroke="#C9A46A" strokeWidth="1.3" strokeLinejoin="round" />
          <circle cx="11" cy="12.5" r="3.5" fill="#47796D" stroke="#D8C9A9" strokeWidth="1" />
          {/* Camera frustum cone */}
          <path d="M36 6 L56 -2 L56 26 L36 19 Z" fill="#C9A46A" fillOpacity="0.1" />
        </g>

        {/* Auto Tour Pill */}
        <rect x="74" y="102" width="92" height="19" rx="9.5" fill="#141514" stroke="#47796D" strokeWidth="1.1" />
        <text x="120" y="114.5" textAnchor="middle" fill="#D8C9A9" fontSize="8.2" fontWeight="600" fontFamily="system-ui, sans-serif">
          {lang === 'en' ? 'AUTO TOUR' : lang === 'zh' ? '自动导览' : 'TỰ ĐỘNG BAY'}
        </text>
      </svg>
    );
  }

  /* =========================================================================
     SET 3: BẢN ĐỒ & TUYẾN (MAP & ROUTES)
     ========================================================================= */
  if (section === 'map_routes') {
    if (cardIndex === 0) {
      return (
        <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
          {/* Archival GIS grid */}
          <line x1="20" y1="32" x2="220" y2="32" stroke="#C9A46A" strokeOpacity="0.1" strokeWidth="1" />
          <line x1="20" y1="68" x2="220" y2="68" stroke="#C9A46A" strokeOpacity="0.1" strokeWidth="1" />
          <line x1="20" y1="104" x2="220" y2="104" stroke="#C9A46A" strokeOpacity="0.1" strokeWidth="1" />
          <line x1="78" y1="14" x2="78" y2="118" stroke="#C9A46A" strokeOpacity="0.1" strokeWidth="1" />
          <line x1="162" y1="14" x2="162" y2="118" stroke="#C9A46A" strokeOpacity="0.1" strokeWidth="1" />

          {/* Route curves across 3 provinces */}
          <path d="M32 92 Q78 52 124 66 T206 40" fill="none" stroke="#A94F3D" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M36 44 Q92 86 150 78 T206 96" fill="none" stroke="#47796D" strokeWidth="1.9" strokeDasharray="4 3" strokeLinecap="round" />
          <path d="M62 108 Q112 72 154 44" fill="none" stroke="#526D8B" strokeWidth="1.6" strokeDasharray="3 3" strokeLinecap="round" />

          {/* Colored heritage route nodes */}
          <circle cx="32" cy="92" r="5" fill="#A94F3D" stroke="#F7F3EB" strokeWidth="1.3" />
          <circle cx="124" cy="66" r="5.5" fill="#C9A46A" stroke="#171817" strokeWidth="1.3" />
          <circle cx="206" cy="40" r="5" fill="#A94F3D" stroke="#F7F3EB" strokeWidth="1.3" />
          <circle cx="36" cy="44" r="4.5" fill="#47796D" stroke="#D8C9A9" strokeWidth="1.2" />
          <circle cx="206" cy="96" r="4.5" fill="#47796D" stroke="#D8C9A9" strokeWidth="1.2" />
          <circle cx="62" cy="108" r="4.2" fill="#526D8B" stroke="#D8C9A9" strokeWidth="1.2" />

          {/* 9 Routes Badge */}
          <rect x="76" y="10" width="88" height="20" rx="10" fill="#141514" stroke="#C9A46A" strokeWidth="1.2" />
          <text x="120" y="23" textAnchor="middle" fill="#C9A46A" fontSize="8.8" fontWeight="700" fontFamily="ui-monospace, monospace">
            {lang === 'en' ? '9 ROUTES' : lang === 'zh' ? '9 条路线' : '9 TUYẾN DI SẢN'}
          </text>
        </svg>
      );
    }

    if (cardIndex === 1) {
      return (
        <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
          {/* Glowing coordinate ripple */}
          <circle cx="72" cy="86" r="14" fill="none" stroke="#A94F3D" strokeOpacity="0.6" strokeWidth="1.3">
            <animate attributeName="r" values="8;22;8" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.85;0.1;0.85" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <ellipse cx="72" cy="88" rx="12" ry="4.5" fill="#A94F3D" fillOpacity="0.3" />

          {/* Heritage Map Pin */}
          <path
            d="M72 44 C60 44 52 53 52 64 C52 76 72 90 72 90 C72 90 92 76 92 64 C92 53 84 44 72 44 Z"
            fill="#A94F3D"
            stroke="#F7F3EB"
            strokeWidth="1.5"
          />
          <circle cx="72" cy="63" r="6" fill="#141514" stroke="#C9A46A" strokeWidth="1.3" />

          {/* Connecting line to quick info card */}
          <line x1="90" y1="60" x2="112" y2="48" stroke="#C9A46A" strokeWidth="1.3" strokeDasharray="2.5 2.5" />

          {/* Floating Monument Quick Info Card */}
          <g transform="translate(112, 22)">
            <rect x="0" y="0" width="108" height="72" rx="12" fill="#141514" stroke="#C9A46A" strokeWidth="1.3" />
            <rect x="10" y="10" width="54" height="5" rx="2.5" fill="#D8C9A9" fillOpacity="0.85" />
            <rect x="10" y="21" width="84" height="3.8" rx="1.9" fill="#D8C9A9" fillOpacity="0.4" />
            <rect x="10" y="30" width="68" height="3.8" rx="1.9" fill="#D8C9A9" fillOpacity="0.3" />
            {/* Distance pill */}
            <rect x="10" y="45" width="44" height="16" rx="8" fill="#47796D" fillOpacity="0.3" stroke="#47796D" strokeWidth="1" />
            <text x="32" y="55.5" textAnchor="middle" fill="#D8C9A9" fontSize="8" fontWeight="600" fontFamily="ui-monospace, monospace">
              1.4 km
            </text>
            {/* Quick detail dot */}
            <rect x="60" y="45" width="38" height="16" rx="8" fill="#A94F3D" fillOpacity="0.35" stroke="#C9A46A" strokeOpacity="0.6" strokeWidth="1" />
            <text x="79" y="55.5" textAnchor="middle" fill="#D8C9A9" fontSize="7.6" fontWeight="600" fontFamily="system-ui, sans-serif">
              GPS
            </text>
          </g>
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
        {/* Left: Compass Rose */}
        <g transform="translate(56, 66)">
          <circle cx="0" cy="0" r="28" fill="#141514" stroke="#C9A46A" strokeWidth="1.4" />
          <circle cx="0" cy="0" r="22" fill="none" stroke="#C9A46A" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 3" />
          <polygon points="0,-17 5,0 0,5 -5,0" fill="#A94F3D" stroke="#D8C9A9" strokeWidth="0.9" />
          <polygon points="0,17 5,0 0,-5 -5,0" fill="#47796D" stroke="#D8C9A9" strokeWidth="0.9" />
          <circle cx="0" cy="0" r="2.6" fill="#C9A46A" />
        </g>

        {/* Bridge Arrow from Compass to 3D Model */}
        <path d="M90 66 H134" fill="none" stroke="#C9A46A" strokeWidth="1.8" strokeDasharray="4 3" strokeLinecap="round" />
        <path d="M128 60 L136 66 L128 72" fill="none" stroke="#C9A46A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Right: 3D Cube Space */}
        <g transform="translate(178, 64)">
          <polygon points="0,-28 28,-12 28,16 0,32 -28,16 -28,-12" fill="#141514" stroke="#C9A46A" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M-28 -12 L0 4 L28 -12" fill="none" stroke="#C9A46A" strokeWidth="1.3" />
          <line x1="0" y1="4" x2="0" y2="32" stroke="#C9A46A" strokeWidth="1.3" />
          <polygon points="0,-22 18,-12 0,-2 -18,-12" fill="#A94F3D" fillOpacity="0.45" />
          <text x="0" y="47" textAnchor="middle" fill="#C9A46A" fontSize="8.8" fontWeight="700" fontFamily="ui-monospace, monospace">
            3D
          </text>
        </g>
      </svg>
    );
  }

  /* =========================================================================
     SET 4: HỒ SƠ DI SẢN (CATALOG & CHRONICLE)
     ========================================================================= */
  if (section === 'catalog') {
    if (cardIndex === 0) {
      return (
        <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
          {/* Segmented Dual Switcher Pill */}
          <rect x="20" y="18" width="200" height="30" rx="15" fill="#141514" stroke="#C9A46A" strokeOpacity="0.45" strokeWidth="1.2" />
          <rect x="24" y="22" width="90" height="22" rx="11" fill="#A94F3D" />
          <text x="69" y="36" textAnchor="middle" fill="#F7F3EB" fontSize="8.6" fontWeight="700" fontFamily="system-ui, sans-serif">
            {lang === 'en' ? '17 Dossiers' : lang === 'zh' ? '17 份档案' : '17 Hồ sơ'}
          </text>
          <rect x="120" y="22" width="96" height="22" rx="11" fill="#47796D" fillOpacity="0.32" stroke="#47796D" strokeWidth="1" />
          <text x="168" y="36" textAnchor="middle" fill="#D8C9A9" fontSize="8.2" fontWeight="600" fontFamily="system-ui, sans-serif">
            {lang === 'en' ? '300-Yr Timeline' : lang === 'zh' ? '300年编年史' : '300 Năm'}
          </text>

          {/* Left preview: Dossier Grid */}
          <g transform="translate(26, 62)">
            <rect x="0" y="0" width="38" height="24" rx="5" fill="#141514" stroke="#A94F3D" strokeOpacity="0.7" strokeWidth="1.1" />
            <rect x="44" y="0" width="38" height="24" rx="5" fill="#141514" stroke="#C9A46A" strokeOpacity="0.4" strokeWidth="1.1" />
            <rect x="0" y="30" width="38" height="24" rx="5" fill="#141514" stroke="#C9A46A" strokeOpacity="0.4" strokeWidth="1.1" />
            <rect x="44" y="30" width="38" height="24" rx="5" fill="#141514" stroke="#47796D" strokeOpacity="0.6" strokeWidth="1.1" />
          </g>

          {/* Right preview: 1698 - 2026 Timeline */}
          <g transform="translate(124, 66)">
            <line x1="6" y1="24" x2="88" y2="24" stroke="#C9A46A" strokeWidth="1.4" />
            <circle cx="16" cy="24" r="4" fill="#47796D" stroke="#D8C9A9" strokeWidth="1" />
            <circle cx="48" cy="24" r="5" fill="#A94F3D" stroke="#F7F3EB" strokeWidth="1.2" />
            <circle cx="78" cy="24" r="4" fill="#C9A46A" />
            <text x="16" y="42" textAnchor="middle" fill="#D8C9A9" fillOpacity="0.7" fontSize="7.5" fontFamily="ui-monospace, monospace">1698</text>
            <text x="78" y="42" textAnchor="middle" fill="#D8C9A9" fillOpacity="0.7" fontSize="7.5" fontFamily="ui-monospace, monospace">2026</text>
          </g>
        </svg>
      );
    }

    if (cardIndex === 1) {
      return (
        <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
          {/* Search Bar */}
          <rect x="26" y="18" width="188" height="30" rx="15" fill="#141514" stroke="#C9A46A" strokeWidth="1.3" />
          <circle cx="44" cy="33" r="5.5" fill="none" stroke="#C9A46A" strokeWidth="1.5" />
          <line x1="48" y1="37" x2="52" y2="41" stroke="#C9A46A" strokeWidth="1.5" strokeLinecap="round" />
          <text x="60" y="36.5" fill="#D8C9A9" fontSize="9.5" fontFamily="system-ui, sans-serif">
            dinh doc lap
          </text>
          {/* Blinking cursor */}
          <rect x="118" y="26" width="1.6" height="14" fill="#C9A46A">
            <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite" />
          </rect>

          {/* Filter funnel arrows */}
          <path d="M120 52 V66" stroke="#C9A46A" strokeWidth="1.4" strokeDasharray="2.5 2.5" />
          <path d="M115 62 L120 68 L125 62" fill="none" stroke="#C9A46A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />

          {/* Filtered Highlighted Card: 01 Dinh Độc Lập */}
          <g transform="translate(36, 74)">
            <rect x="0" y="0" width="168" height="42" rx="12" fill="#141514" stroke="#A94F3D" strokeWidth="1.5" />
            <rect x="10" y="10" width="24" height="22" rx="6" fill="#A94F3D" />
            <text x="22" y="24.5" textAnchor="middle" fill="#F7F3EB" fontSize="9.5" fontWeight="700" fontFamily="ui-monospace, monospace">
              01
            </text>
            <text x="44" y="21" fill="#D8C9A9" fontSize="10.2" fontWeight="700" fontFamily="system-ui, sans-serif">
              {lang === 'en' ? 'Independence Palace' : lang === 'zh' ? '独立宫遗迹档案' : 'Dinh Độc Lập'}
            </text>
            <text x="44" y="33" fill="#C9A46A" fontSize="8" fontFamily="system-ui, sans-serif">
              {lang === 'en' ? 'Ho Chi Minh City · 1966' : lang === 'zh' ? '胡志明市 · 1966' : 'TP. Hồ Chí Minh · 1966'}
            </text>
          </g>
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
        {/* Left: Archival Scroll / Dossier Folio */}
        <g transform="translate(24, 18)">
          <rect x="0" y="0" width="84" height="96" rx="10" fill="#141514" stroke="#C9A46A" strokeOpacity="0.65" strokeWidth="1.3" />
          <rect x="12" y="14" width="44" height="6" rx="3" fill="#C9A46A" />
          <rect x="12" y="28" width="60" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.55" />
          <rect x="12" y="38" width="54" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.4" />
          <rect x="12" y="48" width="60" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.4" />
          <rect x="12" y="58" width="42" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.3" />
          {/* Seal stamp */}
          <circle cx="62" cy="76" r="10" fill="#A94F3D" fillOpacity="0.28" stroke="#A94F3D" strokeWidth="1.2" />
          <circle cx="62" cy="76" r="5" fill="none" stroke="#C9A46A" strokeWidth="0.9" />
        </g>

        {/* Right: Terracotta 3D Dissection Pill Button */}
        <g transform="translate(120, 44)">
          <rect x="0" y="0" width="102" height="36" rx="18" fill="#A94F3D" stroke="#C9A46A" strokeWidth="1.4" />
          {/* Mini 3D Cube Icon inside pill */}
          <path d="M18 11 L25 15 V23 L18 27 L11 23 V15 Z" fill="none" stroke="#F7F3EB" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M11 15 L18 19 L25 15" fill="none" stroke="#C9A46A" strokeWidth="1.1" />
          <line x1="18" y1="19" x2="18" y2="27" stroke="#C9A46A" strokeWidth="1.1" />
          <text x="61" y="21.5" textAnchor="middle" fill="#F7F3EB" fontSize="9.2" fontWeight="700" fontFamily="system-ui, sans-serif">
            {lang === 'en' ? '3D Dissect' : lang === 'zh' ? '3D 解构' : 'Bóc tách 3D'}
          </text>
        </g>

        {/* Subtle connecting link */}
        <path d="M108 62 H118" stroke="#C9A46A" strokeWidth="1.4" strokeDasharray="2 2" />
      </svg>
    );
  }

  /* =========================================================================
     SET 5: VÉ & HỌC LIỆU (TICKETS & EDTECH)
     ========================================================================= */
  if (section === 'edtech') {
    if (cardIndex === 0) {
      return (
        <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
          {/* Card 1: Cơ bản (#A94F3D) */}
          <g transform="translate(16, 28)">
            <rect x="0" y="0" width="60" height="82" rx="10" fill="#A94F3D" fillOpacity="0.32" stroke="#A94F3D" strokeWidth="1.3" />
            <text x="30" y="21" textAnchor="middle" fill="#D8C9A9" fontSize="8.5" fontWeight="700" fontFamily="system-ui, sans-serif">
              {lang === 'en' ? 'Basic' : lang === 'zh' ? '基础票' : 'Cơ bản'}
            </text>
            <line x1="10" y1="30" x2="50" y2="30" stroke="#D8C9A9" strokeOpacity="0.25" strokeWidth="1" />
            <rect x="12" y="40" width="36" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.55" />
            <rect x="12" y="50" width="28" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.35" />
            <rect x="14" y="64" width="32" height="10" rx="5" fill="#141514" stroke="#D8C9A9" strokeOpacity="0.4" strokeWidth="0.9" />
          </g>

          {/* Card 2 (Center Elevated): Plus / Pro (#47796D) */}
          <g transform="translate(86, 14)">
            <rect x="0" y="0" width="68" height="98" rx="12" fill="#47796D" fillOpacity="0.4" stroke="#C9A46A" strokeWidth="1.6" />
            <rect x="16" y="8" width="36" height="12" rx="6" fill="#C9A46A" />
            <text x="34" y="16.5" textAnchor="middle" fill="#171817" fontSize="7.4" fontWeight="700" fontFamily="ui-monospace, monospace">
              PRO
            </text>
            <text x="34" y="36" textAnchor="middle" fill="#F7F3EB" fontSize="9.2" fontWeight="700" fontFamily="system-ui, sans-serif">
              Plus / Pro
            </text>
            <line x1="10" y1="44" x2="58" y2="44" stroke="#C9A46A" strokeOpacity="0.35" strokeWidth="1" />
            <rect x="12" y="53" width="44" height="4.5" rx="2.25" fill="#D8C9A9" fillOpacity="0.75" />
            <rect x="12" y="63" width="36" height="4.5" rx="2.25" fill="#D8C9A9" fillOpacity="0.5" />
            <rect x="12" y="78" width="44" height="12" rx="6" fill="#C9A46A" />
          </g>

          {/* Card 3: Trường học (#526D8B) */}
          <g transform="translate(164, 28)">
            <rect x="0" y="0" width="60" height="82" rx="10" fill="#526D8B" fillOpacity="0.32" stroke="#526D8B" strokeWidth="1.3" />
            <text x="30" y="21" textAnchor="middle" fill="#D8C9A9" fontSize="8.2" fontWeight="700" fontFamily="system-ui, sans-serif">
              {lang === 'en' ? 'School' : lang === 'zh' ? '学校包' : 'Trường học'}
            </text>
            <line x1="10" y1="30" x2="50" y2="30" stroke="#D8C9A9" strokeOpacity="0.25" strokeWidth="1" />
            <rect x="12" y="40" width="36" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.55" />
            <rect x="12" y="50" width="28" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.35" />
            <rect x="14" y="64" width="32" height="10" rx="5" fill="#141514" stroke="#D8C9A9" strokeOpacity="0.4" strokeWidth="0.9" />
          </g>
        </svg>
      );
    }

    if (cardIndex === 1) {
      return (
        <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
          {/* Left: VietQR Square Matrix */}
          <g transform="translate(22, 18)">
            <rect x="0" y="0" width="82" height="94" rx="12" fill="#141514" stroke="#C9A46A" strokeWidth="1.3" />
            {/* QR Finder Squares */}
            <rect x="13" y="12" width="16" height="16" rx="2.5" fill="none" stroke="#D8C9A9" strokeWidth="1.8" />
            <rect x="18" y="17" width="6" height="6" fill="#C9A46A" />
            <rect x="53" y="12" width="16" height="16" rx="2.5" fill="none" stroke="#D8C9A9" strokeWidth="1.8" />
            <rect x="58" y="17" width="6" height="6" fill="#C9A46A" />
            <rect x="13" y="46" width="16" height="16" rx="2.5" fill="none" stroke="#D8C9A9" strokeWidth="1.8" />
            <rect x="18" y="51" width="6" height="6" fill="#C9A46A" />
            {/* Data dots */}
            <rect x="36" y="14" width="6" height="6" rx="1" fill="#D8C9A9" fillOpacity="0.7" />
            <rect x="36" y="26" width="8" height="8" rx="1" fill="#A94F3D" />
            <rect x="48" y="34" width="6" height="6" rx="1" fill="#D8C9A9" fillOpacity="0.7" />
            <rect x="38" y="48" width="8" height="6" rx="1" fill="#D8C9A9" fillOpacity="0.7" />
            <rect x="54" y="48" width="12" height="12" rx="1.5" fill="#47796D" />
            <text x="41" y="82" textAnchor="middle" fill="#C9A46A" fontSize="9.2" fontWeight="700" fontFamily="ui-monospace, monospace">
              VietQR
            </text>
          </g>

          {/* Right: International USD Card */}
          <g transform="translate(118, 28)">
            <rect x="0" y="0" width="102" height="72" rx="12" fill="#526D8B" fillOpacity="0.34" stroke="#C9A46A" strokeWidth="1.4" />
            {/* Gold EMV Chip */}
            <rect x="12" y="16" width="18" height="13" rx="3" fill="#C9A46A" fillOpacity="0.85" />
            <line x1="12" y1="22.5" x2="30" y2="22.5" stroke="#171817" strokeWidth="0.9" />
            <line x1="21" y1="16" x2="21" y2="29" stroke="#171817" strokeWidth="0.9" />
            {/* USD Pill */}
            <rect x="58" y="14" width="32" height="16" rx="8" fill="#141514" stroke="#C9A46A" strokeWidth="1" />
            <text x="74" y="24.5" textAnchor="middle" fill="#C9A46A" fontSize="8.2" fontWeight="700" fontFamily="ui-monospace, monospace">
              USD
            </text>
            {/* Card digits */}
            <rect x="12" y="44" width="16" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.7" />
            <rect x="33" y="44" width="16" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.7" />
            <rect x="54" y="44" width="16" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.7" />
            <rect x="75" y="44" width="14" height="4" rx="2" fill="#C9A46A" />
            <text x="12" y="61" fill="#D8C9A9" fillOpacity="0.7" fontSize="7.4" fontFamily="ui-monospace, monospace">
              PAYPAL · CARD
            </text>
          </g>
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
        {/* Left: Unlocked Learning Worksheets Folio */}
        <g transform="translate(26, 20)">
          <rect x="0" y="0" width="84" height="92" rx="11" fill="#141514" stroke="#47796D" strokeWidth="1.4" />
          {/* Unlocked Padlock */}
          <path d="M24 22 V17 a6 6 0 0 1 11.4 -2.5" fill="none" stroke="#C9A46A" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="18" y="22" width="18" height="14" rx="3" fill="#47796D" fillOpacity="0.55" stroke="#C9A46A" strokeWidth="1.2" />
          <rect x="44" y="21" width="28" height="4.5" rx="2.25" fill="#D8C9A9" fillOpacity="0.8" />
          <rect x="44" y="29" width="20" height="3.5" rx="1.75" fill="#D8C9A9" fillOpacity="0.45" />
          {/* Study lines */}
          <rect x="14" y="48" width="56" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.55" />
          <rect x="14" y="58" width="46" height="4" rx="2" fill="#D8C9A9" fillOpacity="0.4" />
          <rect x="14" y="72" width="38" height="11" rx="5.5" fill="#47796D" fillOpacity="0.45" stroke="#47796D" strokeWidth="1" />
          <text x="33" y="80" textAnchor="middle" fill="#D8C9A9" fontSize="7.2" fontWeight="700" fontFamily="ui-monospace, monospace">
            PDF
          </text>
        </g>

        {/* Right: Digital E-Ticket QR Pass */}
        <g transform="translate(126, 24)">
          <rect x="0" y="0" width="88" height="84" rx="12" fill="#141514" stroke="#C9A46A" strokeWidth="1.4" />
          {/* Ticket perforation notches */}
          <circle cx="0" cy="52" r="5" fill="#191A18" />
          <circle cx="88" cy="52" r="5" fill="#191A18" />
          <line x1="8" y1="52" x2="80" y2="52" stroke="#C9A46A" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 3" />
          {/* Mini QR pass icon */}
          <rect x="28" y="12" width="32" height="32" rx="4" fill="none" stroke="#C9A46A" strokeWidth="1.2" />
          <rect x="33" y="17" width="8" height="8" fill="#C9A46A" />
          <rect x="47" y="17" width="8" height="8" fill="#D8C9A9" fillOpacity="0.7" />
          <rect x="33" y="31" width="8" height="8" fill="#D8C9A9" fillOpacity="0.7" />
          <rect x="47" y="31" width="8" height="8" fill="#A94F3D" />
          <text x="44" y="71" textAnchor="middle" fill="#C9A46A" fontSize="8.4" fontWeight="700" fontFamily="ui-monospace, monospace">
            E-TICKET
          </text>
        </g>
      </svg>
    );
  }

  /* =========================================================================
     SET 6: THUYẾT MINH (AUDIO GUIDE)
     ========================================================================= */
  if (cardIndex === 0) {
    return (
      <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
        {/* Language Switcher Pill Card: VI · EN · ZH */}
        <rect x="22" y="34" width="196" height="46" rx="23" fill="#141514" stroke="#C9A46A" strokeOpacity="0.45" strokeWidth="1.3" />
        {/* VI Active */}
        <rect x="28" y="40" width="58" height="34" rx="17" fill="#C9A46A" />
        <text x="57" y="61" textAnchor="middle" fill="#171817" fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace">
          VI
        </text>
        {/* EN */}
        <rect x="92" y="40" width="56" height="34" rx="17" fill="#47796D" fillOpacity="0.22" stroke="#47796D" strokeOpacity="0.65" strokeWidth="1" />
        <text x="120" y="61" textAnchor="middle" fill="#D8C9A9" fontSize="11.5" fontWeight="600" fontFamily="ui-monospace, monospace">
          EN
        </text>
        {/* ZH */}
        <rect x="154" y="40" width="58" height="34" rx="17" fill="#526D8B" fillOpacity="0.22" stroke="#526D8B" strokeOpacity="0.65" strokeWidth="1" />
        <text x="183" y="61" textAnchor="middle" fill="#D8C9A9" fontSize="11.5" fontWeight="600" fontFamily="ui-monospace, monospace">
          ZH
        </text>

        {/* Sound wave arcs below */}
        <g transform="translate(88, 92)">
          <rect x="0" y="6" width="4" height="12" rx="2" fill="#47796D">
            <animate attributeName="height" values="8;16;8" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="y" values="8;4;8" dur="1.2s" repeatCount="indefinite" />
          </rect>
          <rect x="10" y="3" width="4" height="18" rx="2" fill="#C9A46A">
            <animate attributeName="height" values="18;8;18" dur="1.05s" repeatCount="indefinite" />
            <animate attributeName="y" values="3;8;3" dur="1.05s" repeatCount="indefinite" />
          </rect>
          <rect x="20" y="5" width="4" height="14" rx="2" fill="#47796D" />
          <rect x="30" y="2" width="4" height="20" rx="2" fill="#C9A46A">
            <animate attributeName="height" values="10;20;10" dur="1.3s" repeatCount="indefinite" />
            <animate attributeName="y" values="7;2;7" dur="1.3s" repeatCount="indefinite" />
          </rect>
          <rect x="40" y="6" width="4" height="12" rx="2" fill="#47796D" />
          <rect x="50" y="4" width="4" height="16" rx="2" fill="#C9A46A" />
          <rect x="60" y="7" width="4" height="10" rx="2" fill="#47796D" />
        </g>
      </svg>
    );
  }

  if (cardIndex === 1) {
    return (
      <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
        {/* Chapter Row 01 (Active) */}
        <g transform="translate(18, 16)">
          <rect x="0" y="0" width="204" height="32" rx="10" fill="#141514" stroke="#C9A46A" strokeWidth="1.4" />
          <text x="12" y="19.5" fill="#C9A46A" fontSize="9.2" fontWeight="700" fontFamily="ui-monospace, monospace">01</text>
          <rect x="30" y="13.5" width="76" height="5" rx="2.5" fill="#D8C9A9" fillOpacity="0.85" />
          {/* Audio Guide Pill */}
          <rect x="120" y="6" width="76" height="20" rx="10" fill="#47796D" />
          <path d="M130 18 V15 a4.5 4.5 0 0 1 9 0 V18" fill="none" stroke="#F7F3EB" strokeWidth="1.3" strokeLinecap="round" />
          <rect x="129" y="16.5" width="2.2" height="4" rx="1" fill="#F7F3EB" />
          <rect x="137.8" y="16.5" width="2.2" height="4" rx="1" fill="#F7F3EB" />
          <text x="167" y="19" textAnchor="middle" fill="#F7F3EB" fontSize="7.6" fontWeight="700" fontFamily="system-ui, sans-serif">
            {lang === 'en' ? 'Listen' : lang === 'zh' ? '收听' : 'Nghe'}
          </text>
        </g>

        {/* Chapter Row 02 */}
        <g transform="translate(18, 54)">
          <rect x="0" y="0" width="204" height="28" rx="9" fill="#141514" stroke="#C9A46A" strokeOpacity="0.28" strokeWidth="1.1" />
          <text x="12" y="17.5" fill="#D8C9A9" fillOpacity="0.65" fontSize="8.8" fontFamily="ui-monospace, monospace">02</text>
          <rect x="30" y="12" width="84" height="4.5" rx="2.25" fill="#D8C9A9" fillOpacity="0.5" />
          <rect x="132" y="6" width="64" height="16" rx="8" fill="#D8C9A9" fillOpacity="0.16" stroke="#C9A46A" strokeOpacity="0.45" strokeWidth="0.9" />
          <text x="164" y="16.8" textAnchor="middle" fill="#D8C9A9" fontSize="7.2" fontFamily="system-ui, sans-serif">
            {lang === 'en' ? 'Audio' : lang === 'zh' ? '章节' : 'Audio'}
          </text>
        </g>

        {/* Chapter Row 03 */}
        <g transform="translate(18, 88)">
          <rect x="0" y="0" width="204" height="28" rx="9" fill="#141514" stroke="#C9A46A" strokeOpacity="0.2" strokeWidth="1" />
          <text x="12" y="17.5" fill="#D8C9A9" fillOpacity="0.5" fontSize="8.8" fontFamily="ui-monospace, monospace">03</text>
          <rect x="30" y="12" width="66" height="4.5" rx="2.25" fill="#D8C9A9" fillOpacity="0.35" />
          <rect x="132" y="6" width="64" height="16" rx="8" fill="#D8C9A9" fillOpacity="0.1" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 240 132" className="w-full h-full" aria-hidden="true">
      {/* Mini 3D Viewport Frame */}
      <rect x="20" y="12" width="200" height="108" rx="12" fill="#141514" stroke="#C9A46A" strokeOpacity="0.32" strokeWidth="1.2" />
      {/* 3D Isometric Cube inside stage */}
      <g transform="translate(106, 52)">
        <polygon points="0,-24 28,-10 0,4 -28,-10" fill="#A94F3D" fillOpacity="0.35" stroke="#C9A46A" strokeWidth="1.3" strokeLinejoin="round" />
        <polygon points="-24,-7 0,5 0,20 -24,8" fill="#47796D" fillOpacity="0.3" stroke="#D8C9A9" strokeOpacity="0.6" strokeWidth="1.1" />
        <polygon points="24,-7 0,5 0,20 24,8" fill="#526D8B" fillOpacity="0.3" stroke="#D8C9A9" strokeOpacity="0.6" strokeWidth="1.1" />
      </g>

      {/* Docked Mini Audio Player Bar at bottom-right corner */}
      <g transform="translate(82, 84)">
        <rect x="0" y="0" width="130" height="28" rx="14" fill="#1C1D1B" stroke="#C9A46A" strokeWidth="1.4" />
        <circle cx="15" cy="14" r="8" fill="#47796D" />
        <rect x="12.5" y="10.5" width="2" height="7" rx="0.8" fill="#F7F3EB" />
        <rect x="16" y="10.5" width="2" height="7" rx="0.8" fill="#F7F3EB" />
        {/* Progress bar */}
        <rect x="29" y="10" width="54" height="3.5" rx="1.75" fill="#D8C9A9" fillOpacity="0.65" />
        <rect x="29" y="17" width="66" height="3" rx="1.5" fill="#D8C9A9" fillOpacity="0.2" />
        <rect x="29" y="17" width="40" height="3" rx="1.5" fill="#C9A46A" />
        {/* Live equalizer bars */}
        <rect x="104" y="11" width="2.4" height="7" rx="1.2" fill="#C9A46A">
          <animate attributeName="height" values="4;10;4" dur="1.1s" repeatCount="indefinite" />
          <animate attributeName="y" values="13;10;13" dur="1.1s" repeatCount="indefinite" />
        </rect>
        <rect x="109" y="9" width="2.4" height="10" rx="1.2" fill="#47796D">
          <animate attributeName="height" values="10;4;10" dur="0.95s" repeatCount="indefinite" />
          <animate attributeName="y" values="9;12;9" dur="0.95s" repeatCount="indefinite" />
        </rect>
        <rect x="114" y="11" width="2.4" height="7" rx="1.2" fill="#C9A46A">
          <animate attributeName="height" values="5;11;5" dur="1.25s" repeatCount="indefinite" />
          <animate attributeName="y" values="12;9;12" dur="1.25s" repeatCount="indefinite" />
        </rect>
      </g>
    </svg>
  );
};

interface InteractiveUserGuideModalProps {
  isOpen: boolean;
  lang: Language;
  initialSection?: GuideSectionId;
  onClose: () => void;
  onTry3D?: () => void;
  onTryExplore?: () => void;
  onOpenMap?: () => void;
  onOpenEdTech?: () => void;
}

export const InteractiveUserGuideModal: React.FC<InteractiveUserGuideModalProps> = ({
  isOpen,
  lang,
  initialSection = 'explore',
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState<GuideSectionId>(initialSection);

  useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection);
    }
  }, [isOpen, initialSection]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const bundle = GUIDE_CONTENT[lang] || GUIDE_CONTENT.vi;
  const currentSectionData = bundle.sections[activeSection] || bundle.sections.explore;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={currentSectionData.modalTitle}
      onClick={onClose}
      className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#1C1D1B] border border-[#C9A46A]/30 p-6 md:p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-serif text-xl md:text-2xl font-semibold text-[#D8C9A9] leading-snug">
              {currentSectionData.modalTitle}
            </h2>
            <p className="mt-1 text-xs md:text-sm text-[#D8C9A9]/65">
              {bundle.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={bundle.closeLabel}
            className="w-9 h-9 rounded-full border border-[#C9A46A]/30 flex items-center justify-center text-[#D8C9A9] hover:border-[#C9A46A] hover:text-[#C9A46A] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={1.7} />
          </button>
        </div>

        {/* 6-Section Quick Switcher Bar */}
        <div
          role="tablist"
          aria-label={bundle.buttonLabel}
          className="mt-4 pt-3.5 border-t border-[#C9A46A]/15 flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          {GUIDE_SECTION_ORDER.map((sectionId) => {
            const isSelected = activeSection === sectionId;
            return (
              <button
                key={sectionId}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveSection(sectionId)}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#C9A46A] text-[#171817] font-semibold shadow-sm'
                    : 'bg-[#141514] border border-[#C9A46A]/25 text-[#D8C9A9]/80 hover:text-[#D8C9A9] hover:border-[#C9A46A]/60 font-medium'
                }`}
              >
                {bundle.sections[sectionId].tabLabel}
              </button>
            );
          })}
        </div>

        {/* Body: 3 Visual Diagram Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {currentSectionData.cards.map((card, idx) => (
            <div
              key={`${activeSection}-${idx}`}
              className="bg-[#141514] border border-[#C9A46A]/20 rounded-2xl p-5 flex flex-col items-center text-center"
            >
              <div className="h-36 w-full rounded-xl bg-[#191A18] border border-[#C9A46A]/15 flex items-center justify-center mb-4 p-2 overflow-hidden">
                <SectionDiagramSvg
                  section={activeSection}
                  cardIndex={idx as 0 | 1 | 2}
                  lang={lang}
                />
              </div>
              <h3 className="text-sm font-semibold text-[#C9A46A] tracking-wide mb-1.5">
                {card.title}
              </h3>
              <p className="text-xs leading-relaxed text-[#D8C9A9]/80 m-0">
                {card.caption}
              </p>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-7 py-3 rounded-full bg-[#C9A46A] text-[#171817] font-semibold text-sm hover:brightness-110 transition cursor-pointer shadow-lg"
          >
            {bundle.confirmCta}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveUserGuideModal;
