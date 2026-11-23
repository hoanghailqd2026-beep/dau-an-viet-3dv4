import React, { useEffect, useState } from 'react';
import { HeritageSite } from '../../types/heritage';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { useLabs, LABS_FEATURES_META } from '../../contexts/LabsContext';
import {
  submitVisitorReview,
  pushSyncPatchToServer,
  listVisitorReviews,
} from '../../utils/adminPlatformStore';
import { X, Check } from 'lucide-react';

export const DauAnLabsModal: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useI18n();
  const {
    hasLabsAccess,
    settings,
    toggleLabsFeature,
    isLabsModalOpen,
    closeLabsModal,
    openQuickNote,
  } = useLabs();

  useEffect(() => {
    if (!isLabsModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLabsModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLabsModalOpen, closeLabsModal]);

  if (!isLabsModalOpen || !hasLabsAccess || !user) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dau-an-labs-title"
      onClick={closeLabsModal}
    >
      <div
        className="w-full max-w-xl bg-[#0E0E10] text-[#FAF8F5] rounded-2xl border border-white/[0.08] shadow-[0_32px_90px_rgba(0,0,0,0.88)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimalist Editorial Header */}
        <div className="px-6 sm:px-7 pt-6 pb-5 border-b border-white/[0.08] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <span
              className="w-[2px] h-10 bg-[#C8A96E] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-[#C8A96E] tracking-wide">
                {lang === 'en'
                  ? 'Dấu Ấn Labs · Early Access'
                  : lang === 'zh'
                  ? 'Dấu Ấn Labs · 抢先体验'
                  : 'Dấu Ấn Labs · Thẩm định sớm'}
              </div>
              <h2
                id="dau-an-labs-title"
                className="font-serif text-[22px] sm:text-[24px] font-medium text-[#FAF8F5] leading-tight tracking-tight mt-0.5"
              >
                {lang === 'en'
                  ? 'Dấu Ấn Experimental Labs'
                  : lang === 'zh'
                  ? '越印创新实验室 (Labs)'
                  : 'Phòng Thí nghiệm Dấu Ấn (Labs)'}
              </h2>
              <p className="text-[13px] text-[#8E8E93] leading-relaxed mt-1.5">
                {lang === 'en'
                  ? 'Early-access sandbox for experimental 3D reconstruction and interactive curation technologies'
                  : lang === 'zh'
                  ? '抢先体验正在研发中的 3D 数字复原与交互策展实验技术'
                  : 'Không gian trải nghiệm trước các công nghệ phục dựng và tương tác đang phát triển'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeLabsModal}
            className="w-8 h-8 rounded-full border border-white/[0.08] hover:border-white/20 text-[#8E8E93] hover:text-[#FAF8F5] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label={
              lang === 'en'
                ? 'Close Dấu Ấn Labs'
                : lang === 'zh'
                ? '关闭越印实验室'
                : 'Đóng Phòng Thí nghiệm Dấu Ấn'
            }
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Numbered Live Switches */}
        <div className="divide-y divide-white/[0.08] px-6 sm:px-7">
          {LABS_FEATURES_META.map((item) => {
            const isOn = Boolean(settings[item.key]);
            const itemTitle =
              lang === 'en' ? item.titleEn : lang === 'zh' ? item.titleZh : item.title;
            const itemDesc =
              lang === 'en'
                ? item.descriptionEn
                : lang === 'zh'
                ? item.descriptionZh
                : item.description;
            return (
              <div
                key={item.key}
                className="py-4.5 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <span
                    className={`font-serif text-sm tabular-nums pt-0.5 shrink-0 transition-colors ${
                      isOn ? 'text-[#C8A96E]' : 'text-[#8E8E93]'
                    }`}
                  >
                    {item.number}.
                  </span>
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-[#FAF8F5] leading-snug">
                      {itemTitle}
                    </div>
                    <p className="text-[12.5px] text-[#8E8E93] leading-relaxed mt-1">
                      {itemDesc}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  aria-label={itemTitle}
                  onClick={() => toggleLabsFeature(item.key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 cursor-pointer mt-0.5 ${
                    isOn
                      ? 'bg-[#C8A96E] border-[#C8A96E]'
                      : 'bg-[#27272A] border-white/[0.08]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ${
                      isOn
                        ? 'translate-x-6 bg-[#0E0E10]'
                        : 'translate-x-1 bg-[#8E8E93]'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Minimalist Footer */}
        <div className="px-6 sm:px-7 py-4 border-t border-white/[0.08] bg-[#131316] flex flex-wrap items-center justify-between gap-3">
          <div className="text-[12px] text-[#8E8E93]">
            {lang === 'en'
              ? 'Reviewer account: '
              : lang === 'zh'
              ? '测试账户：'
              : 'Tài khoản thẩm định: '}
            <span className="text-[#FAF8F5] font-medium">{user.displayName}</span>
            {user.role === 'admin'
              ? lang === 'en'
                ? ' · Administrator'
                : lang === 'zh'
                ? ' · 管理员'
                : ' · Quản trị viên'
              : ' · Beta Tester'}
          </div>

          <div className="flex items-center gap-2.5">
            {settings.quickNotesWidget && (
              <button
                type="button"
                onClick={() => {
                  closeLabsModal();
                  openQuickNote();
                }}
                className="px-3.5 py-1.5 rounded-lg border border-[#C8A96E]/50 text-[#C8A96E] hover:bg-[#C8A96E]/10 text-[12px] font-medium transition-colors cursor-pointer"
              >
                {lang === 'en'
                  ? 'Open Labs Notes'
                  : lang === 'zh'
                  ? '打开 Labs 笔记'
                  : 'Mở Ghi chú Labs'}
              </button>
            )}
            <button
              type="button"
              onClick={closeLabsModal}
              className="px-4 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-white text-[#0E0E10] text-[12px] font-semibold transition-colors cursor-pointer"
            >
              {lang === 'en' ? 'Done' : lang === 'zh' ? '完成' : 'Hoàn tất'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LabsQuickNoteModalProps {
  sites: HeritageSite[];
  currentSite: HeritageSite;
}

const LABS_CATEGORIES_BY_LANG = {
  vi: [
    'Ánh sáng Giờ Vàng 3D',
    'Lưới Kỹ thuật Wireframe',
    'Sử Quan Dấu Ấn Labs',
    'Bố cục & Trải nghiệm Chung',
  ],
  en: [
    'Golden Hour 3D Lighting',
    'Architectural Wireframe Mesh',
    'Royal Historiographer Labs',
    'General Layout & Experience',
  ],
  zh: [
    '黄金时刻 3D 光照',
    '建筑工程线框网格',
    '史官讲解 Labs 版',
    '整体布局与交互体验',
  ],
} as const;

export const LabsQuickNoteModal: React.FC<LabsQuickNoteModalProps> = ({
  sites,
  currentSite,
}) => {
  const { user } = useAuth();
  const { lang, getLocalizedSite } = useI18n();
  const { hasLabsAccess, isQuickNoteOpen, closeQuickNote } = useLabs();

  const categories = LABS_CATEGORIES_BY_LANG[lang];
  const [siteId, setSiteId] = useState<string>(currentSite.id);
  const [categoryIdx, setCategoryIdx] = useState<number>(0);
  const [noteType, setNoteType] = useState<'observation' | 'bug'>('observation');
  const [noteText, setNoteText] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    setSiteId(currentSite.id);
  }, [currentSite.id]);

  useEffect(() => {
    if (!isQuickNoteOpen) return;
    setSubmitted(false);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeQuickNote();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isQuickNoteOpen, closeQuickNote]);

  if (!isQuickNoteOpen || !hasLabsAccess || !user) return null;

  const targetSite = sites.find((s) => s.id === siteId) || currentSite;
  const activeCategoryLabel = categories[categoryIdx] || categories[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = noteText.trim();
    if (!cleaned) return;

    const prefix = noteType === 'bug' ? '[Báo lỗi Labs]' : '[Thẩm định Labs]';
    submitVisitorReview({
      userId: user.userId,
      uid: user.firebaseUid || user.userId,
      userEmail: user.email,
      userName: user.displayName,
      visitorName: `${user.displayName} (Labs)`,
      provider: user.provider,
      contactDisplay: user.email || user.displayName,
      rating: noteType === 'bug' ? 3 : 5,
      tags: ['Dấu Ấn Labs', activeCategoryLabel],
      favoriteSiteId: targetSite.id,
      favoriteSiteName: targetSite.officialName,
      comment: `${prefix} [${activeCategoryLabel}] ${cleaned}`,
    });

    void pushSyncPatchToServer({
      visitorReviews: listVisitorReviews() as unknown as Array<Record<string, unknown>>,
    });

    setNoteText('');
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-[82] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="labs-quick-note-title"
      onClick={closeQuickNote}
    >
      <div
        className="w-full max-w-md bg-[#0E0E10] text-[#FAF8F5] rounded-2xl border border-white/[0.08] shadow-[0_28px_80px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4 border-b border-white/[0.08] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="w-[2px] h-8 bg-[#C8A96E] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <div className="text-[11px] font-medium text-[#C8A96E]">
                {lang === 'en'
                  ? 'Dấu Ấn Labs · Quick Evaluation'
                  : lang === 'zh'
                  ? 'Dấu Ấn Labs · 快速评审'
                  : 'Dấu Ấn Labs · Thẩm định Nhanh'}
              </div>
              <h3
                id="labs-quick-note-title"
                className="font-serif text-[19px] font-medium text-[#FAF8F5] leading-snug mt-0.5"
              >
                {lang === 'en'
                  ? 'Quick Evaluation Note'
                  : lang === 'zh'
                  ? '快速评审笔记'
                  : 'Ghi chú Thẩm định Nhanh'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={closeQuickNote}
            className="w-8 h-8 rounded-full border border-white/[0.08] hover:border-white/20 text-[#8E8E93] hover:text-[#FAF8F5] flex items-center justify-center cursor-pointer transition-colors"
            aria-label={
              lang === 'en'
                ? 'Close Labs Notes'
                : lang === 'zh'
                ? '关闭 Labs 笔记'
                : 'Đóng Ghi chú Labs'
            }
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl border border-[#C8A96E]/35 bg-[#161618] space-y-1.5">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#C8A96E]">
                <Check className="w-4 h-4" />
                <span>
                  {lang === 'en'
                    ? 'Note sent to Admin Studio'
                    : lang === 'zh'
                    ? '已将笔记发送至 Admin Studio'
                    : 'Đã gửi ghi chú về Admin Studio'}
                </span>
              </div>
              <p className="text-[12.5px] text-[#8E8E93] leading-relaxed">
                {lang === 'en'
                  ? 'Your feedback has been saved to Reviews & Feedback in Admin Studio under the Dấu Ấn Labs tag.'
                  : lang === 'zh'
                  ? '您的评审意见已附带 Dấu Ấn Labs 标签保存至 Admin Studio 的评价与反馈中心。'
                  : 'Nhận xét của bạn đã được lưu vào mục Đánh giá & Phản hồi trong Admin Studio với nhãn Dấu Ấn Labs.'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-3.5 py-2 rounded-lg border border-white/[0.08] text-[12px] text-[#FAF8F5] hover:bg-white/[0.05] cursor-pointer"
              >
                {lang === 'en'
                  ? 'Add another note'
                  : lang === 'zh'
                  ? '继续添加笔记'
                  : 'Ghi thêm ghi chú'}
              </button>
              <button
                type="button"
                onClick={closeQuickNote}
                className="px-4 py-2 rounded-lg bg-[#C8A96E] text-[#0E0E10] text-[12px] font-semibold cursor-pointer"
              >
                {lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNoteType('observation')}
                className={`py-2 px-3 rounded-lg border text-[12px] font-medium cursor-pointer transition-colors ${
                  noteType === 'observation'
                    ? 'border-[#C8A96E] bg-[#C8A96E]/12 text-[#C8A96E]'
                    : 'border-white/[0.08] text-[#8E8E93] hover:text-[#FAF8F5]'
                }`}
              >
                {lang === 'en'
                  ? 'Feature Observation'
                  : lang === 'zh'
                  ? '功能体验反馈'
                  : 'Nhận xét tính năng'}
              </button>
              <button
                type="button"
                onClick={() => setNoteType('bug')}
                className={`py-2 px-3 rounded-lg border text-[12px] font-medium cursor-pointer transition-colors ${
                  noteType === 'bug'
                    ? 'border-[#C8A96E] bg-[#C8A96E]/12 text-[#C8A96E]'
                    : 'border-white/[0.08] text-[#8E8E93] hover:text-[#FAF8F5]'
                }`}
              >
                {lang === 'en'
                  ? 'Report a Bug'
                  : lang === 'zh'
                  ? '报告异常问题'
                  : 'Báo lỗi phát sinh'}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] text-[#8E8E93]">
                {lang === 'en'
                  ? 'Experimental Module'
                  : lang === 'zh'
                  ? '实验功能模块'
                  : 'Phân hệ thử nghiệm'}
              </label>
              <select
                value={categoryIdx}
                onChange={(e) => setCategoryIdx(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg bg-[#161618] border border-white/[0.08] focus:border-[#C8A96E] text-[12.5px] text-[#FAF8F5] outline-none"
              >
                {categories.map((cat, idx) => (
                  <option key={cat} value={idx}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] text-[#8E8E93]">
                {lang === 'en'
                  ? 'Monument Under Review'
                  : lang === 'zh'
                  ? '当前考察遗迹'
                  : 'Di tích đang quan sát'}
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[#161618] border border-white/[0.08] focus:border-[#C8A96E] text-[12.5px] text-[#FAF8F5] outline-none"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {getLocalizedSite(s).officialName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] text-[#8E8E93]">
                {lang === 'en'
                  ? 'Evaluation Notes'
                  : lang === 'zh'
                  ? '评审笔记内容'
                  : 'Nội dung ghi chú thẩm định'}
              </label>
              <textarea
                rows={4}
                required
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'Share feedback on 3D lighting, wireframe mesh, Royal Historiographer responses, or UI layout...'
                    : lang === 'zh'
                    ? '记录您对 3D 光照、线框模型、史官讲解回复或界面体验的建议...'
                    : 'Ghi lại cảm nhận ánh sáng, lưới mô hình 3D, phản hồi Sử Quan Dấu Ấn hoặc lỗi giao diện...'
                }
                className="w-full p-3 rounded-lg bg-[#161618] border border-white/[0.08] focus:border-[#C8A96E] text-[12.5px] text-[#FAF8F5] placeholder:text-[#636366] outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeQuickNote}
                className="px-3.5 py-2 rounded-lg border border-white/[0.08] text-[12px] text-[#8E8E93] hover:text-[#FAF8F5] cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : lang === 'zh' ? '取消' : 'Hủy'}
              </button>
              <button
                type="submit"
                disabled={!noteText.trim()}
                className="px-4 py-2 rounded-lg bg-[#C8A96E] hover:bg-[#D4B87E] disabled:opacity-40 text-[#0E0E10] text-[12px] font-semibold cursor-pointer transition-colors"
              >
                {lang === 'en'
                  ? 'Send to Admin Studio'
                  : lang === 'zh'
                  ? '发送至 Admin Studio'
                  : 'Gửi về Admin Studio'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
