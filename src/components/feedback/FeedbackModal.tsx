import React, { useEffect, useMemo, useState } from 'react';
import { HeritageSite } from '../../types/heritage';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import {
  FEEDBACK_HIGHLIGHT_TAGS,
  REVIEWS_UPDATED_EVENT,
  SUPPORT_TICKETS_UPDATED_EVENT,
  SupportTicketCategory,
  SupportTicketRecord,
  VisitorReviewRecord,
  checkAndRecordSubmissionRate,
  createSupportTicket,
  enrichVisitorReviewWithGeminiReply,
  getMySupportTickets,
  listVisitorReviews,
  submitVisitorReview,
} from '../../utils/adminPlatformStore';
import {
  X,
  CheckCircle2,
  Send,
  Landmark,
  ShieldCheck,
  LifeBuoy,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';
import { SearchableHeritageSelect } from '../common/SearchableHeritageSelect';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: HeritageSite[];
  defaultSiteId?: string;
  defaultTab?: 'feedback' | 'support';
}

type ModalTab = 'feedback' | 'support';
type VisitorAudienceId = 'visitor' | 'student' | 'educator';

const VISITOR_AUDIENCES: Array<{
  id: VisitorAudienceId;
  vi: string;
  en: string;
  zh: string;
}> = [
  {
    id: 'visitor',
    vi: 'Du khách tham quan',
    en: 'Museum Visitor',
    zh: '文化游客',
  },
  {
    id: 'student',
    vi: 'Học sinh / Sinh viên',
    en: 'Student',
    zh: '学生 / 大学生',
  },
  {
    id: 'educator',
    vi: 'Giáo viên / Nghiên cứu',
    en: 'Teacher / Researcher',
    zh: '教师 / 研究人员',
  },
];

const SUPPORT_TOPICS: Array<{
  id: SupportTicketCategory;
  vi: string;
  en: string;
  zh: string;
}> = [
  {
    id: 'account_tickets',
    vi: 'Hỗ trợ thanh toán & Mở khóa vé',
    en: 'Payment & Ticket Unlock',
    zh: '支付与门票解锁支持',
  },
  {
    id: 'tech_bug',
    vi: 'Sự cố hiển thị mô hình 3D',
    en: '3D Model Display Issue',
    zh: '3D 模型显示异常',
  },
  {
    id: 'history_feedback',
    vi: 'Đính chính & Trao đổi sử liệu',
    en: 'Historical Data & Fact-Check',
    zh: '史料勘误与学术交流',
  },
  {
    id: 'audio_narration',
    vi: 'Lỗi âm thanh / Thuyết minh',
    en: 'Audio & Narration Issue',
    zh: '音频与语音导览问题',
  },
  {
    id: 'account_other',
    vi: 'Vấn đề tài khoản & Khác',
    en: 'Account & Other Inquiries',
    zh: '账户与其他问题',
  },
];

const STAR_LABELS: Record<1 | 2 | 3 | 4 | 5, { vi: string; en: string; zh: string }> = {
  1: { vi: 'Cần cải thiện', en: 'Needs improvement', zh: '需要改进' },
  2: { vi: 'Tạm ổn', en: 'Fair', zh: '一般' },
  3: { vi: 'Hài lòng', en: 'Satisfied', zh: '满意' },
  4: { vi: 'Rất tốt', en: 'Very good', zh: '很好' },
  5: { vi: 'Trải nghiệm xuất sắc', en: 'Outstanding experience', zh: '卓越体验' },
};

const MuseumStarIcon: React.FC<{
  filled: boolean;
  className?: string;
}> = ({ filled, className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? '#C9A46A' : 'none'}
    stroke={filled ? '#C9A46A' : '#8A8474'}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <polygon points="12 2.6 14.95 8.58 21.55 9.54 16.78 14.19 17.9 20.76 12 17.66 6.1 20.76 7.22 14.19 2.45 9.54 9.05 8.58 12 2.6" />
  </svg>
);

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  sites,
  defaultSiteId,
  defaultTab = 'feedback',
}) => {
  const { lang, getLocalizedSite } = useI18n();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<ModalTab>(defaultTab);

  // Tab 1: Experience Rating State
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [audience, setAudience] = useState<VisitorAudienceId>('visitor');
  const [selectedTags, setSelectedTags] = useState<string[]>([FEEDBACK_HIGHLIGHT_TAGS[0]]);
  const [favoriteSiteId, setFavoriteSiteId] = useState<string>(defaultSiteId || '');
  const [comment, setComment] = useState<string>('');
  const [submittedReview, setSubmittedReview] = useState<VisitorReviewRecord | null>(null);
  const [myReviews, setMyReviews] = useState<VisitorReviewRecord[]>([]);
  const [spamError, setSpamError] = useState<string | null>(null);

  // Tab 2: Customer Support State
  const [supportTopic, setSupportTopic] = useState<SupportTicketCategory>('account_tickets');
  const [supportSiteId, setSupportSiteId] = useState<string>(defaultSiteId || '');
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [supportEmail, setSupportEmail] = useState<string>(user?.email || '');
  const [supportPhone, setSupportPhone] = useState<string>('');
  const [supportName, setSupportName] = useState<string>(user?.displayName || '');
  const [supportError, setSupportError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicketRecord | null>(null);
  const [myTickets, setMyTickets] = useState<SupportTicketRecord[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(defaultTab);
    if (defaultSiteId && sites.some((s) => s.id === defaultSiteId)) {
      setFavoriteSiteId(defaultSiteId);
      setSupportSiteId(defaultSiteId);
    }
  }, [isOpen, defaultSiteId, defaultTab, sites]);

  useEffect(() => {
    setSubmittedReview(null);
    setSubmittedTicket(null);
    setComment('');
    setSupportMessage('');
    setSpamError(null);
    setSupportError(null);
    setSupportEmail(user?.email || '');
    setSupportName(user?.displayName || '');
  }, [user?.userId, user?.email, user?.displayName]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const syncMyReviews = () => {
      const all = listVisitorReviews();
      if (user) {
        setMyReviews(all.filter((r) => r.userId === user.userId));
      } else {
        setMyReviews(all.filter((r) => r.provider === 'guest').slice(0, 3));
      }
    };

    const syncMyTickets = () => {
      const mine = getMySupportTickets(user?.userId, user?.email);
      setMyTickets(mine.slice(0, 4));
    };

    syncMyReviews();
    syncMyTickets();
    window.addEventListener(REVIEWS_UPDATED_EVENT, syncMyReviews);
    window.addEventListener(SUPPORT_TICKETS_UPDATED_EVENT, syncMyTickets);

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener(REVIEWS_UPDATED_EVENT, syncMyReviews);
      window.removeEventListener(SUPPORT_TICKETS_UPDATED_EVENT, syncMyTickets);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, user, onClose]);

  const activeStarValue = (hoverRating ?? rating) as 1 | 2 | 3 | 4 | 5;
  const starLabel = STAR_LABELS[activeStarValue][lang];

  const favoriteSiteObj = useMemo(
    () => (favoriteSiteId ? sites.find((s) => s.id === favoriteSiteId) || null : null),
    [sites, favoriteSiteId]
  );

  const supportSiteObj = useMemo(
    () => (supportSiteId ? sites.find((s) => s.id === supportSiteId) || null : null),
    [sites, supportSiteId]
  );

  if (!isOpen || !user) return null;

  const selectedAudienceObj =
    VISITOR_AUDIENCES.find((item) => item.id === audience) || VISITOR_AUDIENCES[0];

  const resolvedVisitorName = user.displayName;
  const resolvedUid = user.firebaseUid || user.userId;

  const accountChannelDisplay =
    user.authMethod === 'judge_quick_access'
      ? 'Google · Ban Giám Khảo (Demo)'
      : user.email
      ? `${user.provider === 'google' ? 'Google' : 'Facebook'} · ${user.email}`
      : `${user.provider === 'google' ? 'Google' : 'Facebook'} · ${user.displayName}`;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSpamError(null);
    const rate = checkAndRecordSubmissionRate('feedback', accountChannelDisplay);
    if (!rate.allowed) {
      setSpamError(
        rate.threatLevel === 2
          ? `Lá chắn An ninh Mức 2: Phát hiện gửi đánh giá dồn dập bất thường. Vui lòng thử lại sau ${rate.retryAfterSec} giây.`
          : `Lá chắn chống Spam: Bạn đang gửi đánh giá quá nhanh liên tiếp. Vui lòng thử lại sau ${rate.retryAfterSec} giây.`
      );
      return;
    }

    const localizedFav = favoriteSiteObj ? getLocalizedSite(favoriteSiteObj) : null;
    const created = submitVisitorReview({
      userId: user.userId,
      uid: resolvedUid,
      userEmail: user.email,
      userName: user.displayName,
      visitorName: resolvedVisitorName,
      provider: user.provider,
      contactDisplay: accountChannelDisplay,
      visitorRole: audience,
      visitorRoleLabel: selectedAudienceObj.vi,
      rating,
      tags: selectedTags,
      favoriteSiteId: favoriteSiteObj?.id || 'system_all',
      favoriteSiteName:
        localizedFav?.officialName ||
        favoriteSiteObj?.officialName ||
        'Không chọn cụ thể / Toàn hệ thống',
      comment:
        comment.trim() ||
        (selectedTags.length > 0
          ? `Ấn tượng với ${selectedTags.join(', ')}.`
          : STAR_LABELS[rating].vi),
    });

    if (!created) return;
    setSubmittedReview(created);
    setComment('');
    void enrichVisitorReviewWithGeminiReply(created.id).then((updated) => {
      if (updated) {
        setSubmittedReview(updated);
      }
    });
  };

  const handleSubmitSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSupportError(null);

    const cleanEmail = (supportEmail || user.email || '').trim();
    const cleanDesc = supportMessage.trim();
    const cleanPhone = supportPhone.trim();

    if (!cleanDesc || cleanDesc.length < 6) {
      setSupportError(
        lang === 'en'
          ? 'Please enter at least 6 characters describing your support request.'
          : lang === 'zh'
          ? '请至少输入 6 个字符描述您需要支持的具体内容。'
          : 'Vui lòng mô tả chi tiết vấn đề cần hỗ trợ (tối thiểu 6 ký tự).'
      );
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setSupportError(
        lang === 'en'
          ? 'Please provide a valid email address so we can send our response.'
          : lang === 'zh'
          ? '请填写有效的电子邮箱以便接收处理回复。'
          : 'Vui lòng nhập địa chỉ email hợp lệ để Ban Quản lý gửi phản hồi hỗ trợ.'
      );
      return;
    }

    const rate = checkAndRecordSubmissionRate('support_ticket', cleanEmail);
    if (!rate.allowed) {
      setSupportError(
        rate.threatLevel === 2
          ? `Lá chắn An ninh Mức 2: Phát hiện gửi yêu cầu liên tiếp bất thường. Vui lòng thử lại sau ${rate.retryAfterSec} giây.`
          : `Lá chắn chống Spam: Bạn đang gửi yêu cầu quá nhanh. Vui lòng thử lại sau ${rate.retryAfterSec} giây.`
      );
      return;
    }

    const topicMeta = SUPPORT_TOPICS.find((t) => t.id === supportTopic) || SUPPORT_TOPICS[0];
    const localizedSupportSite = supportSiteObj ? getLocalizedSite(supportSiteObj) : null;
    const senderDisplayName = user.displayName || supportName.trim();

    const created = createSupportTicket({
      uid: resolvedUid,
      userEmail: user.email || cleanEmail,
      userName: user.displayName,
      senderUserId: user.userId,
      ownerEmail: user.email || cleanEmail,
      senderName: senderDisplayName,
      senderEmail: cleanEmail,
      senderPhone: cleanPhone || undefined,
      category: supportTopic,
      categoryLabelOverride: topicMeta.vi,
      relatedSiteId: supportSiteObj?.id,
      relatedSiteName: localizedSupportSite?.officialName || supportSiteObj?.officialName,
      description: cleanDesc,
    });

    if (!created) return;
    setSubmittedTicket(created);
    setSupportMessage('');
  };

  const renderTicketStatusBadge = (status: SupportTicketRecord['status']) => {
    if (status === 'resolved') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#47796D]/25 border border-[#47796D]/70 text-[11px] font-medium text-[#D8C9A9]">
          {lang === 'en' ? 'Resolved' : lang === 'zh' ? '已解决' : 'Đã giải quyết'}
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#526D8B]/25 border border-[#526D8B]/70 text-[11px] font-medium text-[#D8C9A9]">
          {lang === 'en' ? 'In Progress' : lang === 'zh' ? '处理中' : 'Đang xử lý'}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-[#C9A46A]/20 border border-[#C9A46A]/60 text-[11px] font-medium text-[#C9A46A]">
        {lang === 'en' ? 'Pending Support' : lang === 'zh' ? '待支持' : 'Chờ hỗ trợ'}
      </span>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        lang === 'en'
          ? 'Feedback & Customer Support'
          : lang === 'zh'
          ? '体验评价与客户支持'
          : 'Đánh giá & Hỗ trợ khách hàng Dấu Ấn Việt 3D'
      }
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto heritage-scrollbar rounded-3xl bg-[#1C1D1B] border border-[#C9A46A]/35 shadow-2xl text-[#D8C9A9] my-auto"
      >
        {/* Header + 2-Tab Switcher */}
        <div className="px-6 pt-5 pb-4 border-b border-[#C9A46A]/20 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#C9A46A] block">
                {activeTab === 'feedback'
                  ? lang === 'en'
                    ? 'Visitor Feedback · Dấu Ấn Việt 3D'
                    : lang === 'zh'
                    ? '访客体验反馈 · 越印 3D'
                    : 'Phản hồi & Đánh giá · Dấu Ấn Việt 3D'
                  : lang === 'en'
                  ? 'Customer Support · Dấu Ấn Việt 3D'
                  : lang === 'zh'
                  ? '客户支持服务 · 越印 3D'
                  : 'Trung tâm Hỗ trợ Khách hàng · Dấu Ấn Việt 3D'}
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#D8C9A9] leading-snug mt-1">
                {activeTab === 'feedback'
                  ? submittedReview
                    ? lang === 'en'
                      ? 'Thank You for Your Feedback'
                      : lang === 'zh'
                      ? '感谢您的宝贵反馈'
                      : 'Cảm ơn bạn đã gửi đánh giá'
                    : lang === 'en'
                    ? 'Rate Your Digital Museum Experience'
                    : lang === 'zh'
                    ? '评价您的数字博物馆体验'
                    : 'Đánh giá trải nghiệm Dấu Ấn Việt 3D'
                  : submittedTicket
                  ? lang === 'en'
                    ? 'Support Request Received'
                    : lang === 'zh'
                    ? '已收到您的支持请求'
                    : 'Đã tiếp nhận yêu cầu hỗ trợ'
                  : lang === 'en'
                  ? 'Request Visitor & Technical Support'
                  : lang === 'zh'
                  ? '提交参观与技术支持请求'
                  : 'Gửi yêu cầu Hỗ trợ Khách hàng'}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={
                lang === 'en'
                  ? 'Close dialog'
                  : lang === 'zh'
                  ? '关闭弹窗'
                  : 'Đóng hộp thoại'
              }
              className="w-9 h-9 rounded-full border border-[#C9A46A]/30 flex items-center justify-center text-[#D8C9A9] hover:border-[#C9A46A] hover:text-[#C9A46A] transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" strokeWidth={1.7} />
            </button>
          </div>

          {/* 2-Tab Pill Switcher */}
          <div
            role="tablist"
            aria-label={
              lang === 'en'
                ? 'Switch between Feedback and Support'
                : lang === 'zh'
                ? '切换评价与支持'
                : 'Chuyển giữa Đánh giá trải nghiệm và Hỗ trợ khách hàng'
            }
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-[#141514] border border-[#C9A46A]/25"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'feedback'}
              onClick={() => setActiveTab('feedback')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'feedback'
                  ? 'bg-[#C9A46A] text-[#171817] font-semibold shadow-sm'
                  : 'text-[#D8C9A9]/75 hover:text-[#D8C9A9] font-medium'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill={activeTab === 'feedback' ? '#171817' : 'none'}
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5 shrink-0"
                aria-hidden="true"
              >
                <polygon points="12 2.6 14.95 8.58 21.55 9.54 16.78 14.19 17.9 20.76 12 17.66 6.1 20.76 7.22 14.19 2.45 9.54 9.05 8.58 12 2.6" />
              </svg>
              <span>
                {lang === 'en'
                  ? 'Experience Rating'
                  : lang === 'zh'
                  ? '体验评价'
                  : 'Đánh giá trải nghiệm'}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'support'}
              onClick={() => setActiveTab('support')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-[#47796D] text-[#F7F3EB] font-semibold shadow-sm'
                  : 'text-[#D8C9A9]/75 hover:text-[#D8C9A9] font-medium'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
              <span>
                {lang === 'en'
                  ? 'Customer Support'
                  : lang === 'zh'
                  ? '客户支持'
                  : 'Hỗ trợ khách hàng'}
              </span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {activeTab === 'feedback' ? (
            <>
              {submittedReview ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#C9A46A]/45 bg-[#141514] p-5 space-y-3.5">
                    <div className="flex items-start gap-2.5 text-[#D8C9A9] text-sm font-semibold">
                      <CheckCircle2
                        className="w-5 h-5 text-[#47796D] shrink-0 mt-0.5"
                        strokeWidth={1.8}
                      />
                      <span>
                        {lang === 'en'
                          ? 'Your review has been saved to Firebase and synced to Admin Studio.'
                          : lang === 'zh'
                          ? '您的评价已保存至 Firebase 并同步至后台管理中心。'
                          : 'Cảm ơn bạn! Đánh giá đã được lưu lên hệ thống và đồng bộ về Quản lý Phản hồi khách hàng (Admin Studio).'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <MuseumStarIcon
                            key={star}
                            filled={star <= submittedReview.rating}
                            className="w-4 h-4"
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-[#C9A46A]">
                        {STAR_LABELS[submittedReview.rating][lang]}
                      </span>
                      {submittedReview.visitorRoleLabel && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#47796D]/25 border border-[#47796D]/60 text-[11px] text-[#D8C9A9]">
                          {submittedReview.visitorRoleLabel}
                        </span>
                      )}
                      <span className="text-[11px] tabular-nums text-[#D8C9A9]/60">
                        {new Date(submittedReview.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="text-xs text-[#D8C9A9]/80">
                      {lang === 'en'
                        ? 'Favorite monument: '
                        : lang === 'zh'
                        ? '最喜欢的遗迹：'
                        : 'Di tích yêu thích: '}
                      <strong className="text-[#D8C9A9]">{submittedReview.favoriteSiteName}</strong>
                    </div>

                    <p className="text-xs sm:text-sm text-[#D8C9A9]/90 leading-relaxed bg-[#191A18] rounded-xl p-3.5 border border-[#C9A46A]/15">
                      “{submittedReview.comment}”
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSubmittedReview(null)}
                      className="px-5 py-2.5 rounded-full bg-[#141514] border border-[#C9A46A]/35 hover:border-[#C9A46A] text-xs font-medium text-[#D8C9A9] cursor-pointer transition-colors"
                    >
                      {lang === 'en'
                        ? 'Submit Another Review'
                        : lang === 'zh'
                        ? '再写一条评价'
                        : 'Gửi thêm đánh giá khác'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-full bg-[#C9A46A] text-[#171817] text-xs font-semibold hover:brightness-110 cursor-pointer transition"
                    >
                      {lang === 'en'
                        ? 'Continue Exploring'
                        : lang === 'zh'
                        ? '继续探索'
                        : 'Quay lại tham quan'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-5">
                  {/* 1. Star Rating 1 - 5 */}
                  <div className="rounded-2xl bg-[#141514] border border-[#C9A46A]/20 p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-[#C9A46A] tracking-wide">
                        {lang === 'en'
                          ? '1. Overall Satisfaction (1 - 5 Stars)'
                          : lang === 'zh'
                          ? '1. 整体满意度评分（1 至 5 星）'
                          : '1. Mức độ hài lòng (1 đến 5 sao)'}
                      </label>
                      <span className="px-3 py-1 rounded-full bg-[#1C1D1B] border border-[#C9A46A]/40 text-xs font-medium text-[#C9A46A]">
                        {activeStarValue}/5 · {starLabel}
                      </span>
                    </div>

                    <div
                      className="flex items-center justify-center sm:justify-start gap-2.5 py-1"
                      onMouseLeave={() => setHoverRating(null)}
                    >
                      {([1, 2, 3, 4, 5] as const).map((star) => {
                        const isFilled = star <= activeStarValue;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => setRating(star)}
                            aria-label={`${star}/5 — ${STAR_LABELS[star][lang]}`}
                            className={`p-2 rounded-2xl border transition-all duration-200 cursor-pointer ${
                              isFilled
                                ? 'bg-[#C9A46A]/15 border-[#C9A46A]/70 scale-105'
                                : 'bg-[#191A18] border-[#C9A46A]/15 hover:border-[#C9A46A]/45'
                            }`}
                          >
                            <MuseumStarIcon
                              filled={isFilled}
                              className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-200"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Visitor Audience Selector */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-semibold text-[#C9A46A] tracking-wide">
                      {lang === 'en'
                        ? '2. Visitor Category'
                        : lang === 'zh'
                        ? '2. 您的身份类型'
                        : '2. Đối tượng trải nghiệm'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {VISITOR_AUDIENCES.map((item) => {
                        const isActive = audience === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setAudience(item.id)}
                            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#C9A46A] text-[#171817] border-[#C9A46A] font-semibold shadow-sm'
                                : 'bg-[#141514] text-[#D8C9A9]/85 border-[#C9A46A]/25 hover:border-[#C9A46A]/65 hover:text-[#D8C9A9]'
                            }`}
                          >
                            {item[lang]}
                          </button>
                        );
                      })}
                    </div>
                  </div>



                  {/* 3. Detailed Feedback Input */}
                  <div className="space-y-2">
                    <label
                      htmlFor="feedback-comment-input"
                      className="block text-xs font-semibold text-[#C9A46A] tracking-wide"
                    >
                      {lang === 'en'
                        ? '3. Detailed Feedback & Suggestions'
                        : lang === 'zh'
                        ? '3. 详细体验感受与改进建议'
                        : '3. Góp ý chi tiết của bạn'}
                    </label>
                    <textarea
                      id="feedback-comment-input"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        lang === 'en'
                          ? 'Share your thoughts on the 3D models, historical content, audio narration, or suggestions for improvement...'
                          : lang === 'zh'
                          ? '分享您对 3D 建筑模型、历史资料、语音导览的体验评价或优化建议...'
                          : 'Chia sẻ nhận xét về mô hình 3D, nội dung lịch sử, thuyết minh hoặc đề xuất cải thiện cho bảo tàng số...'
                      }
                      className="w-full p-3.5 rounded-2xl bg-[#141514] border border-[#C9A46A]/25 text-xs sm:text-sm text-[#D8C9A9] placeholder:text-[#D8C9A9]/40 focus:border-[#C9A46A] focus:outline-none resize-none"
                    />
                  </div>

                  {/* 4. Highlight Tags & Favorite Monument */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-2">
                      <label
                        htmlFor="feedback-favorite-site"
                        className="flex items-center gap-1.5 text-xs font-medium text-[#D8C9A9]/80"
                      >
                        <Landmark className="w-3.5 h-3.5 text-[#C9A46A]" strokeWidth={1.7} />
                        <span>
                          {lang === 'en'
                            ? 'Favorite Monument'
                            : lang === 'zh'
                            ? '最喜爱的遗迹'
                            : 'Di tích ấn tượng nhất'}
                        </span>
                      </label>
                      <SearchableHeritageSelect
                        id="feedback-favorite-site"
                        sites={sites}
                        value={favoriteSiteId}
                        onChange={setFavoriteSiteId}
                        includeSystemAllOption
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="block text-xs font-medium text-[#D8C9A9]/80">
                        {lang === 'en'
                          ? 'Highlights'
                          : lang === 'zh'
                          ? '亮点标签'
                          : 'Điểm nổi bật'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {FEEDBACK_HIGHLIGHT_TAGS.slice(0, 4).map((tag) => {
                          const active = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[#47796D] text-[#F7F3EB] border-[#47796D] font-medium'
                                  : 'bg-[#141514] text-[#D8C9A9]/75 border-[#C9A46A]/20 hover:border-[#C9A46A]/50'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {spamError && (
                    <div className="rounded-xl bg-[#A94F3D]/20 border border-[#A94F3D]/60 px-3.5 py-2.5 text-xs text-[#F7F3EB]">
                      {spamError}
                    </div>
                  )}

                  {/* Footer Submit Row */}
                  <div className="pt-2 border-t border-[#C9A46A]/15 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-[#D8C9A9]/65 flex items-center gap-1.5">
                      <ShieldCheck
                        className="w-3.5 h-3.5 text-[#C9A46A] shrink-0"
                        strokeWidth={1.7}
                      />
                      <span>
                        {lang === 'en'
                          ? 'Synced to Firebase & Admin Studio'
                          : lang === 'zh'
                          ? '同步至 Firebase 与管理中心'
                          : 'Đồng bộ Firebase & Admin Studio'}
                      </span>
                    </span>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-[#C9A46A] text-[#171817] font-semibold text-sm hover:brightness-110 transition inline-flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Send className="w-3.5 h-3.5" strokeWidth={1.8} />
                      <span>
                        {lang === 'en'
                          ? 'Submit Feedback'
                          : lang === 'zh'
                          ? '提交评价'
                          : 'Gửi đánh giá'}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* Previous Reviews Submitted */}
              {myReviews.length > 0 && (
                <div className="pt-4 border-t border-[#C9A46A]/15 space-y-2.5">
                  <div className="text-xs font-medium text-[#D8C9A9]/65">
                    {lang === 'en'
                      ? `Your Recent Reviews (${myReviews.length})`
                      : lang === 'zh'
                      ? `您的近期评价 (${myReviews.length})`
                      : `Lịch sử đánh giá gần đây (${myReviews.length})`}
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto heritage-scrollbar pr-1">
                    {myReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-2xl bg-[#141514] border border-[#C9A46A]/15 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <MuseumStarIcon
                                  key={s}
                                  filled={s <= rev.rating}
                                  className="w-3 h-3"
                                />
                              ))}
                            </div>
                            <span className="text-[11px] font-medium text-[#D8C9A9] ml-1">
                              {rev.favoriteSiteName}
                            </span>
                          </div>
                          <span className="text-[11px] tabular-nums text-[#D8C9A9]/50">
                            {new Date(rev.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-xs text-[#D8C9A9]/80">{rev.comment}</p>
                        {rev.adminReply && (
                          <div className="p-2.5 rounded-xl bg-[#191A18] border border-[#C9A46A]/30 text-xs space-y-1">
                            <div className="text-[11px] text-[#C9A46A] font-semibold">
                              Phản hồi từ Ban Quản lý Bảo tàng Số
                            </div>
                            <div className="text-[#D8C9A9]/90">{rev.adminReply}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ============================================================
               TAB 2: HỖ TRỢ KHÁCH HÀNG (CUSTOMER SUPPORT)
               ============================================================ */
            <>
              {submittedTicket ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#47796D]/60 bg-[#141514] p-5 space-y-3.5">
                    <div className="flex items-start gap-2.5 text-[#D8C9A9] text-sm font-semibold">
                      <CheckCircle2
                        className="w-5 h-5 text-[#47796D] shrink-0 mt-0.5"
                        strokeWidth={1.8}
                      />
                      <span>
                        {lang === 'en'
                          ? 'Your support request has been recorded and synced to Admin Studio.'
                          : lang === 'zh'
                          ? '您的支持请求已成功提交并同步至后台管理中心。'
                          : 'Yêu cầu hỗ trợ của bạn đã được ghi nhận lên hệ thống và đồng bộ về Quản lý Hỗ trợ Khách hàng (Admin Studio).'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#C9A46A] text-[#171817] text-[11px] font-bold tabular-nums">
                        {submittedTicket.ticketCode}
                      </span>
                      {renderTicketStatusBadge(submittedTicket.status)}
                      <span className="px-2.5 py-0.5 rounded-full bg-[#1C1D1B] border border-[#C9A46A]/30 text-[11px] text-[#D8C9A9]">
                        {submittedTicket.categoryLabel}
                      </span>
                      <span className="text-[11px] tabular-nums text-[#D8C9A9]/60">
                        {new Date(submittedTicket.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    {submittedTicket.relatedSiteName && (
                      <div className="text-xs text-[#D8C9A9]/80">
                        {lang === 'en'
                          ? 'Related monument: '
                          : lang === 'zh'
                          ? '相关遗迹：'
                          : 'Di tích liên quan: '}
                        <strong className="text-[#D8C9A9]">
                          {submittedTicket.relatedSiteName}
                        </strong>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#D8C9A9]/80">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#C9A46A]" strokeWidth={1.7} />
                        <span>{submittedTicket.senderEmail}</span>
                      </span>
                      {submittedTicket.senderPhone && (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#C9A46A]" strokeWidth={1.7} />
                          <span>{submittedTicket.senderPhone}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-[#D8C9A9]/90 leading-relaxed bg-[#191A18] rounded-xl p-3.5 border border-[#C9A46A]/15 whitespace-pre-line">
                      {submittedTicket.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSubmittedTicket(null)}
                      className="px-5 py-2.5 rounded-full bg-[#141514] border border-[#C9A46A]/35 hover:border-[#C9A46A] text-xs font-medium text-[#D8C9A9] cursor-pointer transition-colors"
                    >
                      {lang === 'en'
                        ? 'Send Another Request'
                        : lang === 'zh'
                        ? '提交另一条请求'
                        : 'Gửi thêm yêu cầu khác'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-full bg-[#47796D] text-[#F7F3EB] text-xs font-semibold hover:brightness-110 cursor-pointer transition"
                    >
                      {lang === 'en'
                        ? 'Done'
                        : lang === 'zh'
                        ? '完成'
                        : 'Hoàn tất'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitSupport} className="space-y-5">
                  {/* 1. Support Topic Quick Pills */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-semibold text-[#C9A46A] tracking-wide">
                      {lang === 'en'
                        ? '1. Support Topic'
                        : lang === 'zh'
                        ? '1. 需要支持的主题'
                        : '1. Chủ đề cần hỗ trợ'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SUPPORT_TOPICS.map((topic) => {
                        const active = supportTopic === topic.id;
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => setSupportTopic(topic.id)}
                            className={`px-3.5 py-2 rounded-full text-xs border transition-all cursor-pointer ${
                              active
                                ? 'bg-[#47796D] text-[#F7F3EB] border-[#47796D] font-semibold shadow-sm'
                                : 'bg-[#141514] text-[#D8C9A9]/85 border-[#C9A46A]/25 hover:border-[#C9A46A]/65 hover:text-[#D8C9A9] font-medium'
                            }`}
                          >
                            {topic[lang]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Related Monument (Optional) */}
                  <div className="space-y-2">
                    <label
                      htmlFor="support-related-site"
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#C9A46A] tracking-wide"
                    >
                      <Landmark className="w-3.5 h-3.5 text-[#C9A46A]" strokeWidth={1.7} />
                      <span>
                        {lang === 'en'
                          ? '2. Related Monument (optional)'
                          : lang === 'zh'
                          ? '2. 相关遗产遗迹（选填）'
                          : '2. Di tích liên quan (tùy chọn)'}
                      </span>
                    </label>
                    <SearchableHeritageSelect
                      id="support-related-site"
                      sites={sites}
                      value={supportSiteId}
                      onChange={setSupportSiteId}
                      includeSystemAllOption
                    />
                  </div>

                  {/* 3. Issue Description */}
                  <div className="space-y-2">
                    <label
                      htmlFor="support-message-input"
                      className="block text-xs font-semibold text-[#C9A46A] tracking-wide"
                    >
                      {lang === 'en'
                        ? '3. How Can We Help You?'
                        : lang === 'zh'
                        ? '3. 详细说明您需要支持的内容'
                        : '3. Nội dung cần hỗ trợ'}
                    </label>
                    <textarea
                      id="support-message-input"
                      rows={3}
                      required
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder={
                        lang === 'en'
                          ? 'Describe the issue, ticket code, 3D display glitch, or historical note you need help with...'
                          : lang === 'zh'
                          ? '请详细描述您遇到的问题、订单编号、3D 显示故障或史料勘误建议...'
                          : 'Mô tả chi tiết tình huống bạn gặp phải (mã vé, lỗi tải mô hình 3D, góp ý sử liệu hoặc sự cố âm thanh)...'
                      }
                      className="w-full p-3.5 rounded-2xl bg-[#141514] border border-[#C9A46A]/25 text-xs sm:text-sm text-[#D8C9A9] placeholder:text-[#D8C9A9]/40 focus:border-[#C9A46A] focus:outline-none resize-none"
                    />
                  </div>

                  {/* 4. Contact Details (Email + Optional Phone/Zalo) */}
                  <div className="space-y-2.5">
                    <span className="block text-xs font-semibold text-[#C9A46A] tracking-wide">
                      {lang === 'en'
                        ? '4. Contact Information for Our Reply'
                        : lang === 'zh'
                        ? '4. 接收回复的联系方式'
                        : '4. Thông tin liên hệ nhận phản hồi'}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label
                          htmlFor="support-contact-email"
                          className="flex items-center gap-1.5 text-[11px] font-medium text-[#D8C9A9]/75"
                        >
                          <Mail className="w-3 h-3 text-[#C9A46A]" strokeWidth={1.7} />
                          <span>
                            {lang === 'en'
                              ? 'Email Address *'
                              : lang === 'zh'
                              ? '电子邮箱 *'
                              : 'Email liên hệ *'}
                          </span>
                        </label>
                        <input
                          id="support-contact-email"
                          type="email"
                          required
                          value={supportEmail}
                          onChange={(e) => setSupportEmail(e.target.value)}
                          placeholder="example@email.com"
                          className="w-full h-10 px-3.5 rounded-xl bg-[#141514] border border-[#C9A46A]/25 text-xs sm:text-sm text-[#D8C9A9] placeholder:text-[#D8C9A9]/40 focus:border-[#C9A46A] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="support-contact-phone"
                          className="flex items-center gap-1.5 text-[11px] font-medium text-[#D8C9A9]/75"
                        >
                          <Phone className="w-3 h-3 text-[#C9A46A]" strokeWidth={1.7} />
                          <span>
                            {lang === 'en'
                              ? 'Phone / Zalo (optional)'
                              : lang === 'zh'
                              ? '电话 / Zalo（选填）'
                              : 'Số điện thoại / Zalo (tùy chọn)'}
                          </span>
                        </label>
                        <input
                          id="support-contact-phone"
                          type="tel"
                          value={supportPhone}
                          onChange={(e) => setSupportPhone(e.target.value)}
                          placeholder={
                            lang === 'en'
                              ? 'e.g. +84 9xx xxx xxx'
                              : lang === 'zh'
                              ? '例如：09xx xxx xxx'
                              : 'Ví dụ: 09xx xxx xxx'
                          }
                          className="w-full h-10 px-3.5 rounded-xl bg-[#141514] border border-[#C9A46A]/25 text-xs sm:text-sm text-[#D8C9A9] placeholder:text-[#D8C9A9]/40 focus:border-[#C9A46A] focus:outline-none"
                        />
                      </div>
                    </div>

                  </div>

                  {supportError && (
                    <div className="rounded-xl bg-[#A94F3D]/20 border border-[#A94F3D]/60 px-3.5 py-2.5 text-xs text-[#F7F3EB]">
                      {supportError}
                    </div>
                  )}

                  {/* Footer Submit Row */}
                  <div className="pt-2 border-t border-[#C9A46A]/15 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-[#D8C9A9]/65 flex items-center gap-1.5">
                      <ShieldCheck
                        className="w-3.5 h-3.5 text-[#47796D] shrink-0"
                        strokeWidth={1.7}
                      />
                      <span>
                        {lang === 'en'
                          ? 'Saved to Firebase /support_tickets & Admin Studio'
                          : lang === 'zh'
                          ? '保存至 Firebase 并同步至后台支持中心'
                          : 'Lưu về Firebase & Hỗ trợ khách hàng (Admin Studio)'}
                      </span>
                    </span>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-[#47796D] text-[#F7F3EB] font-semibold text-sm hover:brightness-110 transition inline-flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Send className="w-3.5 h-3.5" strokeWidth={1.8} />
                      <span>
                        {lang === 'en'
                          ? 'Submit Support Request'
                          : lang === 'zh'
                          ? '提交支持请求'
                          : 'Gửi yêu cầu hỗ trợ'}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* Recent Support Tickets */}
              {myTickets.length > 0 && (
                <div className="pt-4 border-t border-[#C9A46A]/15 space-y-2.5">
                  <div className="text-xs font-medium text-[#D8C9A9]/65 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C9A46A]" strokeWidth={1.7} />
                    <span>
                      {lang === 'en'
                        ? `Your Recent Support Tickets (${myTickets.length})`
                        : lang === 'zh'
                        ? `您近期提交的支持工单 (${myTickets.length})`
                        : `Yêu cầu hỗ trợ gần đây (${myTickets.length})`}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-44 overflow-y-auto heritage-scrollbar pr-1">
                    {myTickets.map((tk) => (
                      <div
                        key={tk.id}
                        className="p-3 rounded-2xl bg-[#141514] border border-[#C9A46A]/15 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-[#C9A46A] tabular-nums">
                              {tk.ticketCode}
                            </span>
                            {renderTicketStatusBadge(tk.status)}
                            <span className="text-[11px] text-[#D8C9A9]/80">
                              {tk.categoryLabel}
                            </span>
                          </div>
                          <span className="text-[11px] tabular-nums text-[#D8C9A9]/50">
                            {new Date(tk.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-xs text-[#D8C9A9]/85 line-clamp-2">{tk.description}</p>
                        {tk.adminReply && (
                          <div className="p-2.5 rounded-xl bg-[#191A18] border border-[#47796D]/45 text-xs space-y-1">
                            <div className="text-[11px] text-[#C9A46A] font-semibold">
                              Phản hồi từ Ban Quản lý Dấu Ấn Việt 3D
                            </div>
                            <div className="text-[#D8C9A9]/90">{tk.adminReply}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
