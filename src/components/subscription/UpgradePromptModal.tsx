import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Layers, ShieldCheck, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  GatedFeatureKey,
  OPEN_UPGRADE_PROMPT_EVENT,
  PLAN_PRICING,
  PlanCheckoutRequest,
  UpgradePromptDetail,
  getSiteNameById,
  navigateToPricingPlan,
  openPlanCheckoutModal,
  setPendingCheckoutRequest,
  useSubscriptionPermissions,
} from '../../utils/subscriptionGatingStore';
import { LockGlyph } from './LockGlyph';

interface UpgradePromptModalProps {
  onNavigateToPricing?: (req: PlanCheckoutRequest) => void;
}

function resolveFeatureCopy(
  key: GatedFeatureKey,
  lang: 'vi' | 'en' | 'zh',
  customLabel?: string
): { title: string; subtitle: string; unlocksWith: string } {
  const map: Record<
    GatedFeatureKey,
    { vi: [string, string, string]; en: [string, string, string]; zh: [string, string, string] }
  > = {
    '3d_explode': {
      vi: [
        'Bóc tách 4 tầng kiến trúc 3D',
        'Quan sát kết cấu mái, khung chịu lực, tầng chính và nền móng di tích theo góc nhìn chuyên gia bảo tồn.',
        'Vé Khám Phá 3D & Thuyết Minh (Plus 19.000đ hoặc Pro 49.000đ)',
      ],
      en: [
        '4-Layer 3D Architectural Exploded View',
        'Inspect roof structure, load-bearing frame, main floor, and foundation like a heritage conservator.',
        '3D Exploration & Audio Pass (Plus 19,000 VND / $1 or Pro 49,000 VND / $2)',
      ],
      zh: [
        '3D 四层建筑结构拆解视图',
        '以文物保护专家视角拆解屋顶、承重结构、主层与地基。',
        '3D 探索与语音导览通行证（Plus $1 或 Pro $2）',
      ],
    },
    '3d_xray': {
      vi: [
        'Chế độ X-Ray xuyên kết cấu',
        'Phân tích hình học khung xương, trục đối xứng và kết cấu chịu lực bên trong công trình di sản.',
        'Vé Khám Phá 3D & Thuyết Minh (Plus 19.000đ hoặc Pro 49.000đ)',
      ],
      en: [
        'X-Ray Structural Inspection Mode',
        'Examine wireframe geometry, structural symmetry, and hidden interior frameworks.',
        '3D Exploration & Audio Pass (Plus 19,000 VND / $1 or Pro 49,000 VND / $2)',
      ],
      zh: [
        'X-Ray 透视结构模式',
        '透视查看历史建筑的几何骨架、对称轴与内部承重结构。',
        '3D 探索与语音导览通行证（Plus $1 或 Pro $2）',
      ],
    },
    '3d_interior': {
      vi: [
        'Chế độ Khám phá Nội thất 3D',
        'Bước vào không gian nội thất và chiêm ngưỡng chi tiết phòng ốc, vật liệu gốc của công trình.',
        'Vé Khám Phá 3D & Thuyết Minh (Plus 19.000đ hoặc Pro 49.000đ)',
      ],
      en: [
        '3D Interior Walkthrough Mode',
        'Step inside curated interior spaces and explore authentic architectural materials.',
        '3D Exploration & Audio Pass (Plus 19,000 VND / $1 or Pro 49,000 VND / $2)',
      ],
      zh: [
        '3D 室内空间探索模式',
        '步入建筑内部，近距离欣赏历史展厅与原真材质细节。',
        '3D 探索与语音导览通行证（Plus $1 或 Pro $2）',
      ],
    },
    audio_guide: {
      vi: [
        'Thuyết minh âm thanh đa ngôn ngữ',
        'Trải nghiệm giọng đọc giám tuyển bảo tàng song hành 3 ngôn ngữ (Việt · Anh · Trung) cho từng di tích.',
        'Vé Khám Phá 3D & Thuyết Minh (Plus 19.000đ hoặc Pro 49.000đ)',
      ],
      en: [
        'Multilingual Museum Audio Guide',
        'Listen to curated heritage narrations in Vietnamese, English, and Chinese for every landmark.',
        '3D Exploration & Audio Pass (Plus 19,000 VND / $1 or Pro 49,000 VND / $2)',
      ],
      zh: [
        '多语言博物馆语音导览',
        '聆听越南语、英语、中文三语策展级历史古迹语音讲解。',
        '3D 探索与语音导览通行证（Plus $1 或 Pro $2）',
      ],
    },
    ai_advanced: {
      vi: [
        'Sử Quan Dấu Ấn nâng cao (Gemini 3.5 Flash)',
        'Mở khóa năng lực tra cứu sử liệu nhanh, thuyết minh đa chiều và hỏi đáp không giới hạn mỗi ngày cùng Sử Quan Dấu Ấn.',
        'Vé Plus (19.000đ · Gemini 3.5 Flash) hoặc Vé Pro (49.000đ · Gemini 3.5 Flash & 4 Hydrogen)',
      ],
      en: [
        'Enhanced Royal Historiographer (Gemini 3.5 Flash)',
        'Unlock fast archival research, multi-angle narration, and unlimited daily historical conversations.',
        'Plus Pass (19,000 VND / $1 · Gemini 3.5 Flash) or Pro Pass (49,000 VND / $2 · Gemini 3.5 Flash & 4 Hydrogen)',
      ],
      zh: [
        '进阶史官讲解（Gemini 3.5 Flash）',
        '解锁快速史料检索、多维导览与每日无限次史官问答服务。',
        'Plus 通票（$1 · Gemini 3.5 Flash）或 Pro 通票（$2 · Gemini 3.5 Flash & 4 Hydrogen）',
      ],
    },
    ai_hydrogen: {
      vi: [
        'Sử Quan Dấu Ấn chuyên sâu (Gemini 4 Hydrogen)',
        'Mô hình Gemini 4 Hydrogen dành riêng cho gói Vé Pro (49.000đ) và Gói Trường Học, hỗ trợ đối thoại sử học chuyên sâu, đối sánh liên vùng và phân tích kết cấu 3D nâng cao trên toàn bộ 17 di tích.',
        'Vé Pro Toàn Diện (49.000đ · $2 USD) hoặc Gói Học Liệu Trường Học',
      ],
      en: [
        'Deep Royal Historiographer (Gemini 4 Hydrogen)',
        'Gemini 4 Hydrogen is exclusive to Pro Pass (49,000 VND / $2) and School EdTech licenses, unlocking deep archival synthesis and advanced 3D analysis across all 17 landmarks.',
        'Pro All-Access Pass (49,000 VND / $2 USD) or School EdTech License',
      ],
      zh: [
        '深度史官讲解（Gemini 4 Hydrogen）',
        'Gemini 4 Hydrogen 专属于 Pro 通票（$2）与学校授权，解锁全部 17 处遗迹的深度史学考据与高级 3D 结构分析。',
        'Pro 全域通票（$2 USD）或学校数字教材授权',
      ],
    },
    ai_daily_limit: {
      vi: [
        'Đã hết 5 lượt hỏi đáp cơ bản hôm nay',
        'Gói Vé Tham Quan Cơ Bản (0đ) hỗ trợ tối đa 5 câu hỏi/ngày trên Gemini 2.5 Flash. Nâng cấp Vé Plus (19.000đ) để mở Gemini 3.5 Flash hoặc Vé Pro (49.000đ) để mở cả Gemini 3.5 Flash & 4 Hydrogen.',
        'Vé Plus (19.000đ · Gemini 3.5 Flash) hoặc Vé Pro (49.000đ · Gemini 3.5 Flash & 4 Hydrogen)',
      ],
      en: [
        'Daily Limit Reached (5/5 Basic Questions)',
        'Basic Pass ($0) includes 5 questions/day on Gemini 2.5 Flash. Upgrade to Plus ($1) for Gemini 3.5 Flash or Pro ($2) for Gemini 3.5 Flash & 4 Hydrogen.',
        'Plus Pass ($1 · Gemini 3.5 Flash) or Pro Pass ($2 · Gemini 3.5 Flash & 4 Hydrogen)',
      ],
      zh: [
        '今日基础问答次数已达上限（5/5）',
        '基础通票（免费）每日限 5 次 Gemini 2.5 Flash 问答。升级 Plus（$1）解锁 Gemini 3.5 Flash，或升级 Pro（$2）解锁 Gemini 3.5 Flash & 4 Hydrogen。',
        'Plus 通票（$1）或 Pro 通票（$2）',
      ],
    },
    journey_stamp: {
      vi: [
        'Lưu dấu hành trình Di sản',
        'Đóng dấu hộ chiếu di sản, lưu giữ tiến độ khám phá 17 công trình và đồng bộ trọn đời theo tài khoản.',
        'Vé Khám Phá 3D & Thuyết Minh (Plus 19.000đ hoặc Pro 49.000đ)',
      ],
      en: [
        'Heritage Journey Passport Stamping',
        'Stamp your digital heritage passport and sync your 17-landmark progress permanently.',
        '3D Exploration & Audio Pass (Plus 19,000 VND / $1 or Pro 49,000 VND / $2)',
      ],
      zh: [
        '遗产探索护照印章记录',
        '点亮数字护照印章，永久云端同步 17 处地标探索足迹。',
        '3D 探索与语音导览通行证（Plus $1 或 Pro $2）',
      ],
    },
    digital_certificate: {
      vi: [
        'Thẻ chứng nhận tham quan số',
        'Cấp thẻ chứng nhận hoàn thành hành trình có mã định danh QR và in ấn lưu niệm chuẩn bảo tàng.',
        'Vé Khám Phá 3D & Thuyết Minh (Plus 19.000đ hoặc Pro 49.000đ)',
      ],
      en: [
        'Digital Heritage Completion Certificate',
        'Receive an official QR-verified museum completion certificate ready to archive or print.',
        '3D Exploration & Audio Pass (Plus 19,000 VND / $1 or Pro 49,000 VND / $2)',
      ],
      zh: [
        '数字文化遗产参观证书',
        '获取带官方二维码防伪编号的博物馆参观完成证书，支持存档与打印。',
        '3D 探索与语音导览通行证（Plus $1 或 Pro $2）',
      ],
    },
    school_edtech: {
      vi: [
        'Kho Học Liệu & Trình Chiếu Trường Học',
        'Bao gồm Kho tư liệu mở, Phiếu học tập 3 tỉnh (TP.HCM · Bình Dương · Bà Rịa - Vũng Tàu), Bộ câu hỏi ôn tập tương tác và Trình chiếu bóc tách 3D trên lớp học.',
        'Gói Học Liệu Trường Học (5.000.000đ / Trường / Năm)',
      ],
      en: [
        'School EdTech Archive & Classroom 3D Mode',
        'Includes Open Heritage Archive, 3-Province Worksheets, Interactive Quizzes, and Classroom 3D Projection with School Activation Code.',
        'School EdTech License (5,000,000 VND / $199 USD per School / Year)',
      ],
      zh: [
        '学校数字教材库与课堂 3D 演示模式',
        '包含开放史料库、三省市学习工作单、互动测验题库与课堂 3D 拆解投屏演示权限。',
        '学校年度数字教材授权（5,000,000 VND / $199 USD / 年）',
      ],
    },
  };

  const entry = map[key]?.[lang] || map['3d_explode'][lang];
  return {
    title: customLabel || entry[0],
    subtitle: entry[1],
    unlocksWith: entry[2],
  };
}

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
  onNavigateToPricing,
}) => {
  const { lang } = useI18n();
  const { user, openAuthModal } = useAuth();
  const [detail, setDetail] = useState<UpgradePromptDetail | null>(null);
  const { permissions } = useSubscriptionPermissions(detail?.siteId);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const custom = e as CustomEvent<UpgradePromptDetail>;
      if (custom.detail) {
        setDetail(custom.detail);
      }
    };
    window.addEventListener(OPEN_UPGRADE_PROMPT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_UPGRADE_PROMPT_EVENT, onOpen);
  }, []);

  if (!detail) return null;

  const isSchoolRequired = detail.requiredPlan === 'school';
  const isProOnlyFeature = detail.featureKey === 'ai_hydrogen' || detail.requiredPlan === 'pro';
  const isPlusMismatch =
    detail.featureKey !== 'ai_hydrogen' &&
    Boolean(detail.isPlusScopeMismatch || permissions.isPlusScopeLockedForSite);
  const isPlusUpgradingForHydrogen =
    detail.featureKey === 'ai_hydrogen' && permissions.effectiveRole === 'plus';
  const siteName = detail.siteName || (detail.siteId ? getSiteNameById(detail.siteId) : undefined);
  const copy = resolveFeatureCopy(detail.featureKey, lang, detail.featureLabel);

  const recommendedTier: 'plus' | 'pro' | 'school' = isSchoolRequired
    ? 'school'
    : isPlusMismatch || isProOnlyFeature
    ? 'pro'
    : 'pro';

  const handleUnlockDirect = (targetTier: 'plus' | 'pro' | 'school') => {
    const req: PlanCheckoutRequest = {
      planTier: targetTier,
      siteId: targetTier === 'plus' ? detail.siteId : undefined,
      plusScopeType: targetTier === 'plus' && detail.siteId ? 'site' : 'route',
    };
    setDetail(null);
    if (!user) {
      setPendingCheckoutRequest(req);
      openAuthModal({
        prompt:
          lang === 'en'
            ? 'Please sign in to activate and permanently store your digital ticket.'
            : lang === 'zh'
            ? '请登录账号以激活并永久保存您的电子门票。'
            : 'Vui lòng đăng nhập tài khoản để kích hoạt và lưu trữ vé điện tử vĩnh viễn.',
      });
      return;
    }
    openPlanCheckoutModal(req);
  };

  const handleGoToPricingSection = () => {
    const req: PlanCheckoutRequest = {
      planTier: recommendedTier,
      siteId: detail.siteId,
    };
    setDetail(null);
    if (onNavigateToPricing) {
      onNavigateToPricing(req);
    } else {
      navigateToPricingPlan(req);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-prompt-title"
      onClick={() => setDetail(null)}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-[#171817] border border-[#C9A46A]/45 shadow-2xl overflow-hidden text-[#D8C9A9]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bronze Accent Hairline */}
        <div className="h-1 w-full bg-gradient-to-r from-[#A94F3D] via-[#C9A46A] to-[#47796D]" />

        <div className="p-6 sm:p-7">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#C9A46A]/12 border border-[#C9A46A]/40 flex items-center justify-center text-[#C9A46A] shrink-0">
                <LockGlyph className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A46A]">
                  {isSchoolRequired
                    ? lang === 'en'
                      ? 'SCHOOL EDTECH LICENSE REQUIRED'
                      : lang === 'zh'
                      ? '需要学校数字教材授权'
                      : 'QUYỀN HẠN HỌC LIỆU TRƯỜNG HỌC'
                    : lang === 'en'
                    ? 'PREMIUM HERITAGE FEATURE'
                    : lang === 'zh'
                    ? '尊享文化遗产功能'
                    : 'TÍNH NĂNG TRẢI NGHIỆM NÂNG CAO'}
                </p>
                <h3
                  id="upgrade-prompt-title"
                  className="text-lg sm:text-xl font-serif font-bold text-[#F5EFE6] mt-0.5 leading-snug"
                >
                  {copy.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDetail(null)}
              className="p-1.5 rounded-lg text-[#D8C9A9]/60 hover:text-[#F5EFE6] hover:bg-white/5 transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Plus -> Pro Upgrade Notice specifically for Gemini 4 Hydrogen */}
          {isPlusUpgradingForHydrogen && (
            <div className="mb-4 rounded-xl bg-[#A94F3D]/15 border border-[#C9A46A]/45 px-4 py-3 text-xs text-[#F5EFE6] leading-relaxed">
              <span className="font-semibold text-[#C9A46A]">
                {lang === 'en'
                  ? 'Plus Pass includes Gemini 3.5 Flash: '
                  : lang === 'zh'
                  ? 'Plus 通票当前包含 Gemini 3.5 Flash：'
                  : 'Gói Plus (19.000đ) hiện mở khóa Gemini 3.5 Flash: '}
              </span>
              {lang === 'en'
                ? 'Upgrade to Pro (49,000 VND / $2) to unlock Gemini 4 Hydrogen and full access across all 17 monuments.'
                : lang === 'zh'
                ? '请升级至 Pro 通票（49,000 VND / $2）以解锁 Gemini 4 Hydrogen 与全部 17 处遗迹权限。'
                : 'Hãy nâng cấp lên gói Pro (49.000đ) để mở khóa Gemini 4 Hydrogen cùng trọn bộ 17 di tích.'}
            </div>
          )}

          {/* Plus Scope Notice if User owns Plus for another landmark */}
          {isPlusMismatch && siteName && !isSchoolRequired && (
            <div className="mb-4 rounded-xl bg-[#A94F3D]/15 border border-[#A94F3D]/45 px-4 py-3 text-xs text-[#F5EFE6] leading-relaxed">
              <span className="font-semibold text-[#C9A46A]">
                {lang === 'en'
                  ? 'Outside your Plus Ticket scope: '
                  : lang === 'zh'
                  ? '超出当前 Plus 通行证范围：'
                  : 'Di tích ngoài phạm vi vé Plus hiện tại: '}
              </span>
              {lang === 'en'
                ? `${siteName} is not included in your current Plus ticket. Upgrade to Pro (49,000 VND / $2) to unlock all 17 landmarks permanently, or add a Plus pass for this landmark.`
                : lang === 'zh'
                ? `「${siteName}」不在您已购的 Plus 单点/单线范围内。建议升级 Pro（$2）永久解锁全部 17 处地标。`
                : `“${siteName}” chưa nằm trong di tích/tuyến Plus bạn đã mua. Nâng cấp lên Vé Pro (49.000đ) để mở khóa trọn bộ 17 di tích, hoặc mua thêm Vé Plus cho di tích này.`}
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-[#D8C9A9]/85 leading-relaxed mb-5">{copy.subtitle}</p>

          {/* Package Recommendation Box */}
          <div className="rounded-xl bg-[#1F211F] border border-[#C9A46A]/25 p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A46A] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {lang === 'en'
                  ? 'Unlocked by Package'
                  : lang === 'zh'
                  ? '所属解锁套餐'
                  : 'Tính năng thuộc gói'}
              </span>
              <span className="text-[11px] font-mono text-[#47796D] bg-[#47796D]/15 border border-[#47796D]/35 px-2 py-0.5 rounded">
                {lang === 'en' ? 'Instant Unlock' : lang === 'zh' ? '即时解锁' : 'Mở khóa tức thì'}
              </span>
            </div>

            <p className="text-sm font-semibold text-[#F5EFE6]">{copy.unlocksWith}</p>

            {isSchoolRequired ? (
              <ul className="space-y-1.5 text-xs text-[#D8C9A9]/80 pt-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#47796D] shrink-0" />
                  <span>
                    {lang === 'en'
                      ? 'Full Pro 3D & Audio access across all 17 landmarks + Classroom 3D Projection'
                      : lang === 'zh'
                      ? '全 17 处地标 Pro 权限 + 课堂 3D 拆解投屏演示'
                      : 'Trọn quyền Vé Pro trên 17 di tích + Trình chiếu bóc tách 3D trên lớp học'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#47796D] shrink-0" />
                  <span>
                    {lang === 'en'
                      ? 'Open Archive, 3-Province Worksheets, Interactive Quizzes & School Code'
                      : lang === 'zh'
                      ? '开放史料库、三省学习单、互动测验与学校激活码'
                      : 'Kho tư liệu mở, Phiếu học tập 3 tỉnh, Bộ câu hỏi ôn tập & Mã kích hoạt trường'}
                  </span>
                </li>
              </ul>
            ) : detail.featureKey === 'ai_hydrogen' ? (
              <button
                type="button"
                onClick={() => handleUnlockDirect('pro')}
                className="w-full text-left rounded-lg border border-[#C9A46A]/75 bg-[#C9A46A]/12 hover:bg-[#C9A46A]/20 p-3.5 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#F5EFE6]">
                    {lang === 'en'
                      ? 'Pro Pass · All 17 Landmarks + Gemini 4 Hydrogen'
                      : lang === 'zh'
                      ? 'Pro 全域通票 · 全部 17 处遗迹 + Gemini 4 Hydrogen'
                      : 'Vé Pro (49.000đ) · Toàn bộ 17 di tích & Gemini 4 Hydrogen'}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#C9A46A] shrink-0 ml-2">
                    {lang === 'vi' ? PLAN_PRICING.pro.vndLabel : PLAN_PRICING.pro.usdLabel}
                  </span>
                </div>
                <p className="text-[11px] text-[#D8C9A9]/80 leading-snug">
                  {lang === 'en'
                    ? 'Unlock Gemini 3.5 Flash & Gemini 4 Hydrogen permanently across all 17 heritage sites.'
                    : lang === 'zh'
                    ? '永久解锁全部 17 处遗产地标的 Gemini 3.5 Flash 与 Gemini 4 Hydrogen。'
                    : 'Mở khóa vĩnh viễn Sử Quan Dấu Ấn chuyên sâu (Gemini 3.5 Flash & 4 Hydrogen) và toàn bộ 17 di tích.'}
                </p>
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleUnlockDirect('plus')}
                  className="text-left rounded-lg border border-[#C9A46A]/30 bg-[#171817]/80 hover:border-[#C9A46A] p-3 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#F5EFE6]">Vé Plus</span>
                    <span className="text-xs font-mono font-bold text-[#C9A46A]">
                      {lang === 'vi' ? PLAN_PRICING.plus.vndLabel : PLAN_PRICING.plus.usdLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#D8C9A9]/70 leading-snug">
                    {lang === 'en'
                      ? '1 landmark or 1 route · Gemini 3.5 Flash'
                      : lang === 'zh'
                      ? '1 处古迹或 1 条路线 · Gemini 3.5 Flash'
                      : '1 di tích hoặc 1 tuyến · Gemini 3.5 Flash'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleUnlockDirect('pro')}
                  className="text-left rounded-lg border border-[#C9A46A]/70 bg-[#C9A46A]/10 hover:bg-[#C9A46A]/18 p-3 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#F5EFE6]">Vé Pro · 17 Di tích</span>
                    <span className="text-xs font-mono font-bold text-[#C9A46A]">
                      {lang === 'vi' ? PLAN_PRICING.pro.vndLabel : PLAN_PRICING.pro.usdLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#D8C9A9]/80 leading-snug">
                    {lang === 'en'
                      ? 'All 17 landmarks · Gemini 3.5 & 4 Hydrogen'
                      : lang === 'zh'
                      ? '全部 17 处地标 · Gemini 3.5 & 4 Hydrogen'
                      : 'Toàn bộ 17 di tích · Gemini 3.5 & 4 Hydrogen'}
                  </p>
                </button>
              </div>
            )}
          </div>

          {/* Unauthenticated Auth Requirement Notice */}
          {!user && (
            <div className="mb-4 rounded-xl bg-[#C9A46A]/10 border border-[#C9A46A]/40 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-[#C9A46A] leading-relaxed">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="#C9A46A"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 shrink-0"
                aria-hidden="true"
              >
                <rect x="4" y="9" width="12" height="8" rx="2" />
                <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
              </svg>
              <span>
                {lang === 'en'
                  ? 'Please sign in to activate and permanently store your digital ticket.'
                  : lang === 'zh'
                  ? '请登录账号以激活并永久保存您的电子门票。'
                  : 'Vui lòng đăng nhập tài khoản để kích hoạt và lưu trữ vé điện tử vĩnh viễn.'}
              </span>
            </div>
          )}

          {/* Primary & Secondary Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleUnlockDirect(recommendedTier)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#A94F3D] hover:bg-[#934232] text-[#F5EFE6] font-bold text-sm transition-colors shadow-lg cursor-pointer"
            >
              {!user && (
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 shrink-0"
                  aria-hidden="true"
                >
                  <rect x="4" y="9" width="12" height="8" rx="2" />
                  <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
                </svg>
              )}
              <span>
                {!user
                  ? lang === 'en'
                    ? 'Sign In to Unlock'
                    : lang === 'zh'
                    ? '登录以解锁'
                    : 'Đăng nhập để mở khóa'
                  : lang === 'en'
                  ? 'Unlock Now'
                  : lang === 'zh'
                  ? '立即解锁'
                  : 'Mở khóa ngay'}
              </span>
              {user && <ArrowRight className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleGoToPricingSection}
              className="px-4 py-3 rounded-xl border border-[#C9A46A]/35 text-[#D8C9A9] hover:text-[#F5EFE6] hover:border-[#C9A46A]/70 text-xs font-semibold transition-colors cursor-pointer"
            >
              {lang === 'en'
                ? 'Compare All Plans'
                : lang === 'zh'
                ? '查看全部套餐'
                : 'Xem bảng gói chi tiết'}
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#D8C9A9]/55">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#47796D]" />
              {lang === 'en'
                ? 'Supports VietQR (VND) & Global USD (PayPal · Apple Pay · Card)'
                : lang === 'zh'
                ? '支持 VietQR（越南盾）与全球美元支付（PayPal · Apple Pay · 信用卡）'
                : 'Hỗ trợ VietQR (VNĐ) & Thanh toán Quốc tế (USD · PayPal · Apple Pay · Thẻ)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
