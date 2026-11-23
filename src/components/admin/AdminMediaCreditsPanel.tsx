import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Search,
  RotateCcw,
  Save,
  X,
  Image as ImageIcon,
  Film,
  Map as MapIcon,
  Check,
  Database,
} from 'lucide-react';
import type { HeritageSite } from '../../types/heritage';
import { useI18n } from '../../i18n/I18nContext';
import {
  MediaCreditCategory,
  MediaCreditItem,
  deleteMediaCredit,
  resetMediaCreditsToDefault,
  upsertMediaCredit,
  useMediaCredits,
} from '../../utils/mediaCreditsStore';
import { SITE_ID_TO_VIDEO_KEY } from '../../data/heritageFilms';
import {
  HeritageOptionSearchSelect,
  HeritageSiteSearchSelect,
} from '../common/HeritageSiteSearchSelect';

interface AdminMediaCreditsPanelProps {
  sites: HeritageSite[];
  showToast: (type: 'ok' | 'err', text: string) => void;
}

interface MediaCreditFormState {
  id?: string;
  siteId: string;
  category: MediaCreditCategory;
  title: string;
  titleEn: string;
  titleZh: string;
  sourceAuthor: string;
  licenseNote: string;
  url: string;
  yearOrPeriod: string;
}

const EMPTY_FORM: MediaCreditFormState = {
  siteId: 'HCM-DT-001',
  category: 'image',
  title: '',
  titleEn: '',
  titleZh: '',
  sourceAuthor: '',
  licenseNote: 'Tư liệu giáo dục phi thương mại',
  url: '',
  yearOrPeriod: '',
};

const LICENSE_PRESETS = [
  'Tư liệu giáo dục phi thương mại',
  'CC BY-SA 4.0 · Tư liệu giáo dục phi thương mại',
  'Phạm vi công cộng (Public Domain)',
  'Trích dẫn tham khảo · Phim tài liệu lưu trữ',
];

export const AdminMediaCreditsPanel: React.FC<AdminMediaCreditsPanelProps> = ({
  sites,
  showToast,
}) => {
  const { lang, getLocalizedSite } = useI18n();
  const credits = useMediaCredits();

  const [filterCategory, setFilterCategory] = useState<'ALL' | MediaCreditCategory>('ALL');
  const [filterSiteId, setFilterSiteId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formState, setFormState] = useState<MediaCreditFormState>(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);

  const siteLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    sites.forEach((site, idx) => {
      const code = SITE_ID_TO_VIDEO_KEY[site.id] || String(idx + 1).padStart(2, '0');
      const loc = getLocalizedSite(site);
      map.set(site.id, `${code} · ${loc.officialName}`);
    });
    return map;
  }, [sites, getLocalizedSite]);

  const counts = useMemo(
    () => ({
      total: credits.length,
      image: credits.filter((c) => c.category === 'image').length,
      video: credits.filter((c) => c.category === 'video').length,
      map_archive: credits.filter((c) => c.category === 'map_archive').length,
    }),
    [credits]
  );

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return credits.filter((item) => {
      if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
      if (filterSiteId !== 'ALL' && item.siteId !== filterSiteId) return false;
      if (!q) return true;
      const siteText = siteLabelMap.get(item.siteId) || '';
      return [
        item.title,
        item.titleEn || '',
        item.titleZh || '',
        item.sourceAuthor,
        item.licenseNote,
        item.url || '',
        siteText,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [credits, filterCategory, filterSiteId, searchQuery, siteLabelMap]);

  const handleOpenCreate = () => {
    setFormState({
      ...EMPTY_FORM,
      siteId: filterSiteId !== 'ALL' ? filterSiteId : sites[0]?.id || 'HCM-DT-001',
      category: filterCategory !== 'ALL' ? filterCategory : 'image',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: MediaCreditItem) => {
    setFormState({
      id: item.id,
      siteId: item.siteId,
      category: item.category,
      title: item.title,
      titleEn: item.titleEn || '',
      titleZh: item.titleZh || '',
      sourceAuthor: item.sourceAuthor,
      licenseNote: item.licenseNote,
      url: item.url || '',
      yearOrPeriod: item.yearOrPeriod || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim() || !formState.sourceAuthor.trim()) {
      showToast(
        'err',
        lang === 'en'
          ? 'Please enter both Media Title and Source / Author.'
          : lang === 'zh'
          ? '请填写资料名称与来源/作者。'
          : 'Vui lòng nhập đầy đủ Tên tư liệu và Nguồn lưu trữ / Tác giả.'
      );
      return;
    }

    if (formState.url.trim() && !/^https?:\/\//i.test(formState.url.trim())) {
      showToast(
        'err',
        lang === 'en'
          ? 'Source URL must start with http:// or https://'
          : lang === 'zh'
          ? '原始链接必须以 http:// 或 https:// 开头。'
          : 'Đường link gốc phải bắt đầu bằng http:// hoặc https://'
      );
      return;
    }

    const isEditing = Boolean(formState.id);
    upsertMediaCredit({
      id: formState.id,
      siteId: formState.siteId,
      category: formState.category,
      title: formState.title.trim(),
      titleEn: formState.titleEn.trim() || undefined,
      titleZh: formState.titleZh.trim() || undefined,
      sourceAuthor: formState.sourceAuthor.trim(),
      licenseNote: formState.licenseNote.trim() || 'Tư liệu giáo dục phi thương mại',
      url: formState.url.trim() || undefined,
      yearOrPeriod: formState.yearOrPeriod.trim() || undefined,
    });

    setIsFormOpen(false);
    setFormState(EMPTY_FORM);
    showToast(
      'ok',
      isEditing
        ? lang === 'en'
          ? 'Updated media citation and synced to Firebase /mediaCredits.'
          : lang === 'zh'
          ? '已更新资料来源并同步至 Firebase /mediaCredits。'
          : 'Đã cập nhật nguồn tư liệu và đồng bộ lên Firebase /mediaCredits.'
        : lang === 'en'
        ? 'Added new media citation and synced to Firebase /mediaCredits.'
        : lang === 'zh'
        ? '已新增资料来源并同步至 Firebase /mediaCredits。'
        : 'Đã thêm nguồn tư liệu mới và đồng bộ lên Firebase /mediaCredits.'
    );
  };

  const handleDelete = (id: string) => {
    deleteMediaCredit(id);
    setConfirmDeleteId(null);
    showToast(
      'ok',
      lang === 'en'
        ? 'Removed citation and synced to Firebase /mediaCredits.'
        : lang === 'zh'
        ? '已删除该条目并同步至 Firebase /mediaCredits。'
        : 'Đã xóa mục nguồn tư liệu và đồng bộ lên Firebase /mediaCredits.'
    );
  };

  const handleResetDefaults = () => {
    resetMediaCreditsToDefault();
    setConfirmResetOpen(false);
    showToast(
      'ok',
      lang === 'en'
        ? 'Restored default 17-monument archival citations and synced to Firebase /mediaCredits.'
        : lang === 'zh'
        ? '已恢复17处古迹默认资料来源并同步至 Firebase /mediaCredits。'
        : 'Đã khôi phục bộ trích dẫn mặc định cho 17 di tích và đồng bộ lên Firebase /mediaCredits.'
    );
  };

  const renderCategoryBadge = (cat: MediaCreditCategory) => {
    if (cat === 'image') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#526D8B]/22 border border-[#526D8B]/60 text-[#A8C4E0] text-[10.5px] font-semibold">
          <ImageIcon className="w-3 h-3" />
          <span>{lang === 'en' ? 'Image' : lang === 'zh' ? '影像' : 'Hình ảnh'}</span>
        </span>
      );
    }
    if (cat === 'video') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#A94F3D]/22 border border-[#A94F3D]/60 text-[#E39A8B] text-[10.5px] font-semibold">
          <Film className="w-3 h-3" />
          <span>{lang === 'en' ? 'Video' : lang === 'zh' ? '视频' : 'Video'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#47796D]/22 border border-[#47796D]/60 text-[#9ED0C4] text-[10.5px] font-semibold">
        <MapIcon className="w-3 h-3" />
        <span>{lang === 'en' ? 'Map / Archive' : lang === 'zh' ? '地图/档案' : 'Bản đồ / Lưu trữ'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#161716] border border-[#C9A46A]/30 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C9A46A]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              {lang === 'en'
                ? 'Archival & Media Credits Registry'
                : lang === 'zh'
                ? '影像资料与版权来源管理中心'
                : 'Quản trị Nguồn Tư liệu & Bản quyền'}
            </span>
          </div>
          <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#F4EFE4]">
            {lang === 'en'
              ? 'Manage Images, Videos & Historical Archive Citations'
              : lang === 'zh'
              ? '管理17处古迹的图片、视频与古地图引用链接'
              : 'Quản lý trích dẫn Hình ảnh, Video & Bản đồ Lưu trữ (17 di tích)'}
          </h2>
          <p className="text-xs text-[#D8C9A9]/75 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#47796D] shrink-0" />
            <span>
              {lang === 'en'
                ? 'Real-time cloud synchronization path: Firebase /mediaCredits'
                : lang === 'zh'
                ? '实时云端同步路径：Firebase /mediaCredits'
                : 'Đồng bộ thời gian thực lên nhánh Firebase /mediaCredits cho toàn bộ du khách.'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="h-9 px-4 rounded-xl bg-[#C9A46A] hover:brightness-110 text-[#171817] text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              {lang === 'en'
                ? 'Add Media Credit'
                : lang === 'zh'
                ? '新增资料来源'
                : 'Thêm nguồn tư liệu'}
            </span>
          </button>

          {confirmResetOpen ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#A94F3D]/20 border border-[#A94F3D]/55">
              <span className="text-[11px] text-[#F4EFE4]">
                {lang === 'en' ? 'Restore 17-site defaults?' : lang === 'zh' ? '确认恢复默认？' : 'Khôi phục mặc định?'}
              </span>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-2 py-0.5 rounded-md bg-[#A94F3D] text-[#F4EFE4] text-[11px] font-semibold cursor-pointer"
              >
                {lang === 'en' ? 'Confirm' : lang === 'zh' ? '确定' : 'Xác nhận'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-2 py-0.5 rounded-md bg-white/10 text-[#D8C9A9] text-[11px] cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : lang === 'zh' ? '取消' : 'Hủy'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="h-9 px-3.5 rounded-xl bg-[#1C1D1B] hover:bg-white/[0.08] border border-[#C9A46A]/30 text-[#D8C9A9] text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C9A46A]" />
              <span>
                {lang === 'en'
                  ? 'Reset 17-Site Seed'
                  : lang === 'zh'
                  ? '恢复默认17处资料'
                  : 'Khôi phục mẫu 17 di tích'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: lang === 'en' ? 'Total Citations' : lang === 'zh' ? '资料总数' : 'Tổng mục trích dẫn',
            value: counts.total,
            accent: '#C9A46A',
          },
          {
            label: lang === 'en' ? 'Archival Images' : lang === 'zh' ? '实景/历史图片' : 'Hình ảnh tư liệu',
            value: counts.image,
            accent: '#526D8B',
          },
          {
            label: lang === 'en' ? 'Videos & Films' : lang === 'zh' ? '视频与纪录片' : 'Video & Phim tài liệu',
            value: counts.video,
            accent: '#A94F3D',
          },
          {
            label: lang === 'en' ? 'Maps & Archives' : lang === 'zh' ? '古地图与档案' : 'Bản đồ & Lưu trữ',
            value: counts.map_archive,
            accent: '#47796D',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl bg-[#161716] border border-white/[0.08] p-3.5 flex items-center justify-between gap-2"
          >
            <div>
              <div className="text-[11px] text-[#D8C9A9]/70">{kpi.label}</div>
              <div
                className="font-serif text-2xl font-semibold tabular-nums mt-0.5"
                style={{ color: kpi.accent }}
              >
                {kpi.value}
              </div>
            </div>
            <span
              className="w-2.5 h-8 rounded-full opacity-80"
              style={{ backgroundColor: kpi.accent }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      {/* Add / Edit Form Card */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitForm}
          className="rounded-2xl bg-[#171817] border border-[#C9A46A]/55 p-4 sm:p-5 space-y-4 animate-apple-sheet"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#C9A46A]/20 pb-3">
            <h3 className="font-serif text-base font-semibold text-[#F4EFE4]">
              {formState.id
                ? lang === 'en'
                  ? 'Edit Archival Media Citation'
                  : lang === 'zh'
                  ? '编辑资料来源记录'
                  : 'Chỉnh sửa nguồn tư liệu'
                : lang === 'en'
                ? 'Add New Archival Media Citation'
                : lang === 'zh'
                ? '新增资料来源记录'
                : 'Thêm nguồn tư liệu mới'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setFormState(EMPTY_FORM);
              }}
              className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-[#D8C9A9] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Monument Selector */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[#C9A46A]">
                {lang === 'en' ? 'Associated Monument' : lang === 'zh' ? '关联遗迹' : 'Di tích gắn liền'}
              </label>
              <HeritageSiteSearchSelect
                sites={sites}
                value={formState.siteId}
                onChange={(nextVal) => setFormState((prev) => ({ ...prev, siteId: nextVal }))}
                includeAllOption
                allOptionValue="ALL"
                allOptionLabel={
                  lang === 'en'
                    ? 'All / Regional Archive'
                    : lang === 'zh'
                    ? '全部 / 区域综合档案'
                    : 'Toàn vùng / Lưu trữ chung'
                }
              />
            </div>

            {/* Category Selector */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[#C9A46A]">
                {lang === 'en' ? 'Media Type' : lang === 'zh' ? '资料类型' : 'Loại tư liệu'}
              </label>
              <HeritageOptionSearchSelect
                value={formState.category}
                onChange={(nextVal) =>
                  setFormState((prev) => ({
                    ...prev,
                    category: nextVal as MediaCreditCategory,
                  }))
                }
                searchable={false}
                ariaLabel={lang === 'en' ? 'Media Type' : lang === 'zh' ? '资料类型' : 'Loại tư liệu'}
                options={[
                  {
                    value: 'image',
                    label:
                      lang === 'en'
                        ? 'Archival Photo (Image)'
                        : lang === 'zh'
                        ? '历史/实景影像 (Image)'
                        : 'Hình ảnh tư liệu',
                  },
                  {
                    value: 'video',
                    label:
                      lang === 'en'
                        ? 'Video / Documentary'
                        : lang === 'zh'
                        ? '视频/纪录片 (Video)'
                        : 'Video & Phim tài liệu',
                  },
                  {
                    value: 'map_archive',
                    label:
                      lang === 'en'
                        ? 'Historical Map / Archive'
                        : lang === 'zh'
                        ? '古地图与档案'
                        : 'Bản đồ & Lưu trữ',
                  },
                ]}
              />
            </div>

            {/* Year / Duration */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[#C9A46A]">
                {lang === 'en' ? 'Year / Duration (Optional)' : lang === 'zh' ? '年代 / 时长（可选）' : 'Niên đại / Thời lượng (Tùy chọn)'}
              </label>
              <input
                type="text"
                value={formState.yearOrPeriod}
                onChange={(e) => setFormState((prev) => ({ ...prev, yearOrPeriod: e.target.value }))}
                placeholder="VD: 1925, 1896–1900, 03:45..."
                className="w-full h-9 px-3 rounded-lg bg-[#1C1D1B] border border-[#C9A46A]/30 focus:border-[#C9A46A] focus:outline-none text-xs text-[#F4EFE4] placeholder:text-[#D8C9A9]/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Title VI */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[#C9A46A]">
                {lang === 'en' ? 'Media Title (Required)' : lang === 'zh' ? '资料名称（必填）' : 'Tên tư liệu (Bắt buộc)'}
              </label>
              <input
                type="text"
                required
                value={formState.title}
                onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="VD: Ảnh chụp mặt đứng Dinh Độc Lập 1966 / Clip Flycam 4K..."
                className="w-full h-9 px-3 rounded-lg bg-[#1C1D1B] border border-[#C9A46A]/30 focus:border-[#C9A46A] focus:outline-none text-xs text-[#F4EFE4] placeholder:text-[#D8C9A9]/40"
              />
            </div>

            {/* Source / Author */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[#C9A46A]">
                {lang === 'en'
                  ? 'Archive / Author / Channel (Required)'
                  : lang === 'zh'
                  ? '档案馆 / 作者 / 发布频道（必填）'
                  : 'Nguồn lưu trữ / Tác giả / Kênh phát hành (Bắt buộc)'}
              </label>
              <input
                type="text"
                required
                value={formState.sourceAuthor}
                onChange={(e) => setFormState((prev) => ({ ...prev, sourceAuthor: e.target.value }))}
                placeholder="VD: Wikimedia Commons / Trung tâm Lưu trữ Quốc gia II / YouTube..."
                className="w-full h-9 px-3 rounded-lg bg-[#1C1D1B] border border-[#C9A46A]/30 focus:border-[#C9A46A] focus:outline-none text-xs text-[#F4EFE4] placeholder:text-[#D8C9A9]/40"
              />
            </div>
          </div>

          {/* Optional EN / ZH titles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-[#D8C9A9]/75">
                English Title (Optional)
              </label>
              <input
                type="text"
                value={formState.titleEn}
                onChange={(e) => setFormState((prev) => ({ ...prev, titleEn: e.target.value }))}
                placeholder="Optional English title for EN visitors..."
                className="w-full h-9 px-3 rounded-lg bg-[#1C1D1B] border border-white/12 focus:border-[#C9A46A] focus:outline-none text-xs text-[#F4EFE4] placeholder:text-[#D8C9A9]/35"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-[#D8C9A9]/75">
                中文名称 (可选)
              </label>
              <input
                type="text"
                value={formState.titleZh}
                onChange={(e) => setFormState((prev) => ({ ...prev, titleZh: e.target.value }))}
                placeholder="供中文访客显示的标题（可选）..."
                className="w-full h-9 px-3 rounded-lg bg-[#1C1D1B] border border-white/12 focus:border-[#C9A46A] focus:outline-none text-xs text-[#F4EFE4] placeholder:text-[#D8C9A9]/35"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* License Note */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#C9A46A]">
                {lang === 'en'
                  ? 'Copyright / Usage Classification'
                  : lang === 'zh'
                  ? '版权分类 / 使用说明'
                  : 'Phân loại bản quyền / Ghi chú sử dụng'}
              </label>
              <input
                type="text"
                value={formState.licenseNote}
                onChange={(e) => setFormState((prev) => ({ ...prev, licenseNote: e.target.value }))}
                placeholder="VD: CC BY-SA 4.0 · Tư liệu giáo dục phi thương mại"
                className="w-full h-9 px-3 rounded-lg bg-[#1C1D1B] border border-[#C9A46A]/30 focus:border-[#C9A46A] focus:outline-none text-xs text-[#F4EFE4]"
              />
              <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap heritage-scrollbar pb-1">
                {LICENSE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormState((prev) => ({ ...prev, licenseNote: preset }))}
                    className="shrink-0 px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-[#C9A46A]/20 border border-white/10 text-[10px] text-[#D8C9A9]/80 hover:text-[#F4EFE4] cursor-pointer whitespace-nowrap"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Original URL */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[#C9A46A]">
                {lang === 'en'
                  ? 'Original Source Link (URL)'
                  : lang === 'zh'
                  ? '原始来源链接 (URL)'
                  : 'Đường link gốc (URL ảnh/video/bản đồ)'}
              </label>
              <input
                type="url"
                value={formState.url}
                onChange={(e) => setFormState((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://commons.wikimedia.org/... hoặc https://www.youtube.com/watch?v=..."
                className="w-full h-9 px-3 rounded-lg bg-[#1C1D1B] border border-[#C9A46A]/30 focus:border-[#C9A46A] focus:outline-none text-xs text-[#F4EFE4] placeholder:text-[#D8C9A9]/40"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setFormState(EMPTY_FORM);
              }}
              className="h-9 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-[#D8C9A9] cursor-pointer"
            >
              {lang === 'en' ? 'Cancel' : lang === 'zh' ? '取消' : 'Hủy bỏ'}
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-xl bg-[#C9A46A] hover:brightness-110 text-[#171817] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>
                {formState.id
                  ? lang === 'en'
                    ? 'Save & Sync Firebase'
                    : lang === 'zh'
                    ? '保存并同步 Firebase'
                    : 'Lưu thay đổi & Đồng bộ'
                  : lang === 'en'
                  ? 'Add & Sync Firebase'
                  : lang === 'zh'
                  ? '新增并同步 Firebase'
                  : 'Thêm mới & Đồng bộ Firebase'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Toolbar */}
      <div className="rounded-2xl bg-[#161716] border border-white/[0.08] p-3.5 space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap heritage-scrollbar pb-1">
          {(
            [
              ['ALL', lang === 'en' ? 'All' : lang === 'zh' ? '全部' : 'Tất cả', counts.total],
              ['image', lang === 'en' ? 'Images' : lang === 'zh' ? '图片' : 'Hình ảnh', counts.image],
              ['video', lang === 'en' ? 'Videos' : lang === 'zh' ? '视频' : 'Video', counts.video],
              [
                'map_archive',
                lang === 'en' ? 'Maps & Archives' : lang === 'zh' ? '地图与档案' : 'Bản đồ & Lưu trữ',
                counts.map_archive,
              ],
            ] as Array<['ALL' | MediaCreditCategory, string, number]>
          ).map(([id, label, count]) => {
            const active = filterCategory === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilterCategory(id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#C9A46A] border-[#C9A46A] text-[#171817]'
                    : 'bg-[#1C1D1B] border-white/10 text-[#D8C9A9]/80 hover:border-[#C9A46A]/45'
                }`}
              >
                {label} <span className="tabular-nums opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div className="md:col-span-5">
            <HeritageSiteSearchSelect
              sites={sites}
              value={filterSiteId}
              onChange={setFilterSiteId}
              includeAllOption
              allOptionValue="ALL"
            />
          </div>
          <div className="md:col-span-7 relative">
            <Search className="w-3.5 h-3.5 text-[#C9A46A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'en'
                  ? 'Search citation title, author, URL...'
                  : lang === 'zh'
                  ? '搜索标题、来源或链接...'
                  : 'Tìm kiếm tên tư liệu, nguồn lưu trữ, đường link...'
              }
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-[#1C1D1B] border border-white/12 focus:border-[#C9A46A] focus:outline-none text-xs text-[#F4EFE4] placeholder:text-[#D8C9A9]/40"
            />
          </div>
        </div>
      </div>

      {/* Citations Management List */}
      <div className="space-y-2.5">
        {filteredList.length === 0 ? (
          <div className="rounded-2xl bg-[#161716] border border-white/[0.08] p-8 text-center text-xs text-[#D8C9A9]/70">
            {lang === 'en'
              ? 'No media credits match your filter.'
              : lang === 'zh'
              ? '没有匹配的资料来源记录。'
              : 'Chưa có mục nguồn tư liệu nào khớp với bộ lọc.'}
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-[#161716] border border-white/[0.08] hover:border-[#C9A46A]/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            >
              <div className="min-w-0 space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {renderCategoryBadge(item.category)}
                  <span className="text-[11px] font-medium text-[#C9A46A] truncate">
                    {siteLabelMap.get(item.siteId) ||
                      (lang === 'en' ? 'Regional Archive' : lang === 'zh' ? '区域综合档案' : 'Lưu trữ toàn vùng')}
                  </span>
                  {item.yearOrPeriod && (
                    <span className="text-[10.5px] text-[#D8C9A9]/60 tabular-nums">
                      · {item.yearOrPeriod}
                    </span>
                  )}
                </div>

                <div className="text-sm font-semibold text-[#F4EFE4] leading-snug">
                  {item.title}
                </div>

                <div className="text-[11.5px] text-[#D8C9A9]/80">
                  <span className="text-[#D8C9A9]/55">
                    {lang === 'en' ? 'Source: ' : lang === 'zh' ? '来源：' : 'Nguồn: '}
                  </span>
                  {item.sourceAuthor}
                </div>

                <div className="text-[11px] text-[#D8C9A9]/60 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{item.licenseNote}</span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#C9A46A] hover:underline truncate max-w-[260px]"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.url}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Row Actions */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="h-8 px-2.5 rounded-lg bg-[#1C1D1B] hover:bg-[#C9A46A]/20 border border-white/12 hover:border-[#C9A46A]/50 text-[#D8C9A9] text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#C9A46A]" />
                  <span>{lang === 'en' ? 'Edit' : lang === 'zh' ? '编辑' : 'Sửa'}</span>
                </button>

                {confirmDeleteId === item.id ? (
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 px-2.5 rounded-lg bg-[#A94F3D] text-[#F4EFE4] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Delete' : lang === 'zh' ? '确认' : 'Xóa'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="h-8 w-8 rounded-lg bg-white/10 text-[#D8C9A9] flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(item.id)}
                    aria-label={lang === 'en' ? 'Delete citation' : lang === 'zh' ? '删除条目' : 'Xóa nguồn tư liệu'}
                    className="h-8 w-8 rounded-lg bg-[#1C1D1B] hover:bg-[#A94F3D]/25 border border-white/12 hover:border-[#A94F3D]/60 text-[#D8C9A9]/75 hover:text-[#E39A8B] flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminMediaCreditsPanel;
