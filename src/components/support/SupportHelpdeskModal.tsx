import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HeritageSite } from '../../types/heritage';
import { SearchableHeritageSelect } from '../common/SearchableHeritageSelect';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import {
  AI_SUPPORT_BOT_AUTHOR,
  SUPPORT_TICKETS_STORAGE_KEY,
  SUPPORT_TICKETS_UPDATED_EVENT,
  SUPPORT_TICKET_CATEGORIES,
  SupportTicketCategory,
  SupportTicketRecord,
  appendVisitorFollowUpMessage,
  checkAndRecordSubmissionRate,
  createSupportTicket,
  detectAdminEscalationIntent,
  escalateSupportTicketToAdmin,
  getMySupportTickets,
  getTicketConversationMessages,
  loadHydrogenCoresState,
  markSupportRepliesAsRead,
  processSupportTicketAiReply,
} from '../../utils/adminPlatformStore';
import {
  X,
  LifeBuoy,
  HelpCircle,
  Send,
  Inbox,
  ChevronDown,
  CheckCircle2,
  Clock,
  Landmark,
  Mail,
  User,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  Bot,
  Crown,
  Loader2,
  Lock,
} from 'lucide-react';

export type SupportModalTab = 'faq' | 'create' | 'tickets';

interface SupportHelpdeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: HeritageSite[];
  defaultTab?: SupportModalTab;
  defaultSiteId?: string;
  onOpenInteractiveGuide?: () => void;
  onNavigateToTickets?: () => void;
}

interface FaqAccordionItem {
  id: string;
  badge: string;
  question: string;
  steps: string[];
  tip: string;
}

const FAQ_ITEMS: FaqAccordionItem[] = [
  {
    id: 'faq-3d-xray',
    badge: 'MÔ HÌNH 3D',
    question: 'Cách xoay, phóng to, bóc tách kiến trúc và bật chế độ X-Ray trên 17 mô hình 3D.',
    steps: [
      'Đăng nhập tài khoản Google hoặc Facebook, chọn một di tích và nhấn vào tab Không gian 3D.',
      'Giữ chuột trái (hoặc 1 ngón tay trên điện thoại) kéo để xoay 360°; cuộn con lăn chuột (hoặc chụm/mở 2 ngón tay) để phóng to/thu nhỏ; giữ chuột phải để di chuyển góc nhìn.',
      'Trên thanh công cụ phía dưới mô hình 3D, bật chế độ X-Ray để nhìn xuyên kết cấu khung sườn, hoặc kéo thanh Bóc tách kiến trúc (Exploded View) để tách rời từng tầng mái, cột và nền móng.',
      'Nhấn các điểm neo (Hotspot) phát sáng trên công trình để đọc chú thích giải phẫu kiến trúc và đổi chế độ Vòm nền Studio / Ban ngày.',
    ],
    tip: 'Mẹo: Nếu muốn xem nhanh toàn cảnh, nhấn nút Tự động xoay (Auto Tour) ở góc dưới khung 3D.',
  },
  {
    id: 'faq-1815-spyglass',
    badge: 'BẢN ĐỒ 1815',
    question: 'Cách sử dụng Thấu kính Xuyên thời gian trên Bản đồ lịch sử 1815.',
    steps: [
      'Mở tab Bản đồ & Tuyến (yêu cầu đã đăng nhập), chọn biểu tượng Thấu kính 1815 / Đối chiếu Sài Gòn cổ ở góc bản đồ.',
      'Di chuyển con trỏ chuột (hoặc chạm kéo trên màn hình cảm ứng) để quét vòng tròn Thấu kính Xuyên thời gian trực tiếp lên bản đồ địa lý hiện đại.',
      'Bên trong vòng thấu kính sẽ hiển thị lớp họa đồ Thành Bát Quái – Gia Định năm 1815 trùng khớp tọa độ thực tế với mạng lưới đường phố ngày nay.',
      'Dùng nút tăng/giảm bán kính thấu kính hoặc chuyển qua lại các tuyến hành trình di sản để đối chiếu sự biến đổi đô thị qua hơn 2 thế kỷ.',
    ],
    tip: 'Mẹo: Kết hợp chế độ Bản đồ vệ tinh và Thấu kính 1815 để quan sát rõ dấu vết hào thành và kênh rạch cổ.',
  },
  {
    id: 'faq-auth-tickets',
    badge: 'TÀI KHOẢN & VÉ SỐ',
    question: 'Cách đăng nhập Google/Facebook, đặt Vé tham quan số và nhận Chứng nhận Học liệu.',
    steps: [
      'Nhấn nút Đăng nhập ở góc trên bên phải Header (hoặc bấm vào bất kỳ khu vực tham quan chuyên sâu nào) để mở cổng đăng nhập Google / Facebook.',
      'Sau khi đăng nhập thành công, vào tab Vé & Học liệu (EdTech) để khởi tạo Vé tham quan số QR định danh theo tên và email tài khoản của bạn.',
      'Tham gia Trắc nghiệm Kiến thức Di sản tại chuyên đề của từng di tích; khi đạt từ 80% câu trả lời đúng trở lên, hệ thống tự động cấp Huy hiệu và Chứng nhận Học liệu Số.',
      'Mở menu tài khoản ở góc phải Header → chọn Tài khoản & Vé của tôi để xem lại mã QR vé, lịch sử di tích đã khám phá và tải chứng nhận.',
    ],
    tip: 'Mẹo: Vé số và chứng nhận được lưu đồng bộ theo tài khoản để bạn kiểm tra lại bất kỳ lúc nào.',
  },
  {
    id: 'faq-media-audio',
    badge: 'VIDEO & THUYẾT MINH',
    question: 'Cách khắc phục khi video hoặc giọng đọc thuyết minh chưa phát.',
    steps: [
      'Với Trình phát Thuyết minh AI: Trình duyệt hiện đại chặn tự phát âm thanh nếu chưa có tương tác chuột; hãy nhấn nút Phát (Play) trực tiếp trên thanh Thuyết minh và kiểm tra âm lượng thiết bị.',
      'Nếu giọng đọc tiếng Việt/Anh/Hoa chưa phản hồi trên một số trình duyệt di động, hãy thử chuyển đổi kênh giọng đọc trong hộp thoại Thuyết minh hoặc bật loa ngoài.',
      'Với Video Tư liệu & Flycam YouTube: Đảm bảo kết nối mạng ổn định và tắt các tiện ích chặn khung nhúng (AdBlock/Tracking Protection) nếu trình phát YouTube báo lỗi kết nối.',
      'Nếu video vẫn không tải được trên mạng nội bộ bị hạn chế, hãy chuyển sang tab Kho Wikimedia Commons trong cùng cửa sổ Video Tư liệu hoặc gửi báo lỗi cho Ban Quản lý tại tab bên cạnh.',
    ],
    tip: 'Mẹo: Nếu gặp lỗi ở một di tích cụ thể, hãy chọn đúng tên di tích đó khi gửi phiếu báo lỗi để Admin kiểm tra nhanh nhất.',
  },
];

export const SupportHelpdeskModal: React.FC<SupportHelpdeskModalProps> = ({
  isOpen,
  onClose,
  sites,
  defaultTab = 'faq',
  defaultSiteId,
  onOpenInteractiveGuide,
  onNavigateToTickets,
}) => {
  const { user, isAdmin, isTesterPro, userTier, entitlements, openAuthModal } = useAuth();
  const { lang, getLocalizedSite } = useI18n();

  const [activeTab, setActiveTab] = useState<SupportModalTab>(defaultTab);
  const [openFaqId, setOpenFaqId] = useState<string>(FAQ_ITEMS[0].id);

  // Create Ticket form state
  const [senderName, setSenderName] = useState<string>('');
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [category, setCategory] = useState<SupportTicketCategory>('account_tickets');
  const [relatedSiteId, setRelatedSiteId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<SupportTicketRecord | null>(null);

  // My Tickets state & Hydrogen Concierge interactive chat state
  const [myTickets, setMyTickets] = useState<SupportTicketRecord[]>([]);
  const [isConciergeAnalyzing, setIsConciergeAnalyzing] = useState(false);
  const [aiAutoRepliedNotice, setAiAutoRepliedNotice] = useState<string | null>(null);
  const [followUpDrafts, setFollowUpDrafts] = useState<Record<string, string>>({});
  const [typingTicketId, setTypingTicketId] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
      setIsConciergeAnalyzing(false);
      setTypingTicketId(null);
      return;
    }
    setActiveTab(defaultTab);
    setFormError(null);
    setCreatedTicket(null);
    setAiAutoRepliedNotice(null);
    setIsConciergeAnalyzing(false);
    setTypingTicketId(null);
    if (defaultSiteId && sites.some((s) => s.id === defaultSiteId)) {
      setRelatedSiteId(defaultSiteId);
    } else {
      setRelatedSiteId('');
    }
  }, [isOpen, defaultTab, defaultSiteId, sites]);

  // Reset transient state & auto-fill name/email when logged-in account switches
  useEffect(() => {
    setCreatedTicket(null);
    setFollowUpDrafts({});
    setAiAutoRepliedNotice(null);
    setFormError(null);
    if (user) {
      setSenderName(user.displayName || '');
      setSenderEmail(user.email || '');
    } else {
      setSenderName('');
      setSenderEmail('');
    }
  }, [user?.userId, user?.email, user?.displayName]);

  // Auto-fill name & email when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (user) {
      setSenderName(user.displayName || '');
      setSenderEmail(user.email || '');
    }
  }, [isOpen, user]);

  // Sync user's tickets & clear unread dot when viewing Tab 3
  useEffect(() => {
    if (!isOpen) return;
    const syncTickets = () => {
      const list = getMySupportTickets(user?.userId, user?.email);
      setMyTickets(list);
      if (activeTab === 'tickets') {
        const unreadResolvedIds = list
          .filter((t) => t.status === 'resolved' && Boolean(t.adminReply) && !t.visitorReadReply)
          .map((t) => t.id);
        if (unreadResolvedIds.length > 0) {
          markSupportRepliesAsRead(unreadResolvedIds);
        }
      }
    };
    syncTickets();
    const onStorage = (e: StorageEvent) => {
      if (e.key === SUPPORT_TICKETS_STORAGE_KEY) syncTickets();
    };
    window.addEventListener(SUPPORT_TICKETS_UPDATED_EVENT, syncTickets);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SUPPORT_TICKETS_UPDATED_EVENT, syncTickets);
      window.removeEventListener('storage', onStorage);
    };
  }, [isOpen, activeTab, user?.userId, user?.email]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const unreadReplyCount = useMemo(
    () =>
      myTickets.filter(
        (t) => t.status === 'resolved' && Boolean(t.adminReply) && !t.visitorReadReply
      ).length,
    [myTickets]
  );

  if (!isOpen) return null;

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError(
        'Tính năng Đánh giá trải nghiệm và Hỗ trợ khách hàng hiện đang khóa. Vui lòng đăng nhập tài khoản để tiếp tục.'
      );
      return;
    }

    const cleanName = senderName.trim() || user.displayName;
    const cleanEmail = (senderEmail.trim() || user.email).trim();
    const cleanDesc = description.trim();

    if (!cleanName) {
      setFormError('Vui lòng nhập Họ và tên để Ban Quản lý tiện xưng hô khi phản hồi.');
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Vui lòng nhập địa chỉ Email hợp lệ để nhận thông báo phản hồi.');
      return;
    }
    if (cleanDesc.length < 10) {
      setFormError('Vui lòng mô tả chi tiết vấn đề (tối thiểu 10 ký tự) để chúng tôi hỗ trợ chính xác.');
      return;
    }

    const rate = checkAndRecordSubmissionRate('support_ticket', cleanEmail || cleanName);
    if (!rate.allowed) {
      setFormError(
        rate.threatLevel === 2
          ? `Lá chắn An ninh Mức 2: Phát hiện gửi phiếu dồn dập bất thường. Hệ thống đã tạm khóa biểu mẫu ${rate.retryAfterSec} giây và phát cảnh báo khẩn cấp tới Quản trị viên.`
          : `Lá chắn chống Spam Mức 1: Bạn vừa gửi yêu cầu quá nhanh liên tiếp. Biểu mẫu tạm khóa ${rate.retryAfterSec} giây và đã báo cáo tới Ban Quản lý.`
      );
      return;
    }

    const siteObj = relatedSiteId ? sites.find((s) => s.id === relatedSiteId) : undefined;
    const siteName = siteObj ? getLocalizedSite(siteObj).officialName : undefined;

    const created = createSupportTicket({
      uid: user.firebaseUid || user.userId,
      userEmail: user.email || cleanEmail,
      userName: user.displayName,
      senderUserId: user.userId,
      ownerEmail: user.email || cleanEmail,
      senderName: cleanName,
      senderEmail: cleanEmail,
      category,
      relatedSiteId: siteObj?.id,
      relatedSiteName: siteName,
      description: cleanDesc,
      supportTier: entitlements.supportTier,
      retentionDays: entitlements.supportRetentionDays,
    });

    if (!created) return;
    setCreatedTicket(created);
    setDescription('');
    setMyTickets(getMySupportTickets(user.userId, user.email));

    const conciergeEnabled = loadHydrogenCoresState().concierge.enabled;
    const wantsHumanAdmin = detectAdminEscalationIntent(cleanDesc);
    if (conciergeEnabled || wantsHumanAdmin) {
      setIsConciergeAnalyzing(true);
      try {
        const res = await processSupportTicketAiReply(created.id, sites, cleanDesc, false);
        setMyTickets(getMySupportTickets(user?.userId, user?.email));
        setAiAutoRepliedNotice(
          res.escalated
            ? `Phiếu ${created.ticketCode} đã chuyển sang trạng thái "Chờ Quản trị viên phản hồi" và thông báo ưu tiên tới Ban Quản lý.`
            : `${AI_SUPPORT_BOT_AUTHOR} đã giải đáp trực tiếp yêu cầu của bạn và đồng bộ bản sao tới Quản trị viên.`
        );
        setActiveTab('tickets');
      } finally {
        setIsConciergeAnalyzing(false);
      }
    }
  };

  const handleVisitorFollowUp = async (ticket: SupportTicketRecord) => {
    if (!user) return;
    const text = (followUpDrafts[ticket.id] || '').trim();
    if (!text) return;

    const rate = checkAndRecordSubmissionRate(
      'support_ticket',
      ticket.senderEmail || ticket.senderName
    );
    if (!rate.allowed) {
      setAiAutoRepliedNotice(
        `Lá chắn chống Spam: Bạn đang gửi quá nhanh. Vui lòng chờ ${rate.retryAfterSec} giây trước khi nhắn tiếp.`
      );
      return;
    }

    appendVisitorFollowUpMessage(ticket.id, ticket.senderName, text);
    setFollowUpDrafts((prev) => ({ ...prev, [ticket.id]: '' }));
    setMyTickets(getMySupportTickets(user?.userId, user?.email));

    const wantsHumanAdmin = detectAdminEscalationIntent(text);
    if (loadHydrogenCoresState().concierge.enabled || wantsHumanAdmin) {
      setTypingTicketId(ticket.id);
      try {
        const res = await processSupportTicketAiReply(ticket.id, sites, text, true);
        setMyTickets(getMySupportTickets(user?.userId, user?.email));
        setAiAutoRepliedNotice(
          res.escalated
            ? `Đã chuyển phiếu ${ticket.ticketCode} sang chế độ ưu tiên "Chờ Quản trị viên phản hồi".`
            : `${AI_SUPPORT_BOT_AUTHOR} đã trả lời tiếp tại phiếu ${ticket.ticketCode} và đồng bộ bản sao tới Quản trị viên.`
        );
      } finally {
        setTypingTicketId((prev) => (prev === ticket.id ? null : prev));
      }
    } else {
      setAiAutoRepliedNotice(
        `Tin nhắn bổ sung tại phiếu ${ticket.ticketCode} đã được gửi tới Quản trị viên.`
      );
    }
  };

  const handleEscalateToAdmin = (ticket: SupportTicketRecord) => {
    escalateSupportTicketToAdmin(ticket.id, ticket.senderName);
    setMyTickets(getMySupportTickets(user?.userId, user?.email));
    setAiAutoRepliedNotice(
      `Đã chuyển trực tiếp phiếu ${ticket.ticketCode} sang trạng thái "Chờ Quản trị viên phản hồi" và gửi thông báo tới Quản trị viên.`
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Trung tâm Hỗ trợ Du khách Dấu Ấn Việt 3D"
      onClick={onClose}
      className="fixed inset-0 z-[1230] flex items-center justify-center p-3 sm:p-5 bg-[#171817]/85 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[94vw] sm:w-full max-w-3xl max-h-[85vh] sm:max-h-[88dvh] flex flex-col rounded-2xl bg-[#171817] border border-[#C9A46A]/45 overflow-hidden text-[#D8C9A9] animate-apple-sheet"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#C9A46A]/20 bg-[#171817] flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#C9A46A]">
              <span className="inline-flex items-center gap-1.5">
                <LifeBuoy className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {lang === 'en'
                    ? 'Visitor Support Center · Dấu Ấn Việt 3D'
                    : lang === 'zh'
                    ? '访客支持中心 · Dấu Ấn Việt 3D'
                    : 'Trung tâm Hỗ trợ Du khách · Dấu Ấn Việt 3D'}
                </span>
              </span>
              {isAdmin ? (
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#C9A46A] text-[#171817]">
                  {lang === 'en' ? 'Administrator' : lang === 'zh' ? '管理员' : 'Quản trị viên'}
                </span>
              ) : isTesterPro ? (
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#47796D] text-[#D8C9A9]">
                  Tester Pro
                </span>
              ) : entitlements.supportTier === 'vip_fast_track' || userTier === 'pro' ? (
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#171817] border border-[#C9A46A] text-[#C9A46A]">
                  {lang === 'en'
                    ? 'Pro · 49k · Fast-Track'
                    : lang === 'zh'
                    ? 'Pro · 49k · 极速优先'
                    : 'Pro · 49k · Ưu tiên nhanh'}
                </span>
              ) : entitlements.supportTier === 'standard_19k' || userTier === 'plus' ? (
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#526D8B] text-[#D8C9A9]">
                  {lang === 'en'
                    ? 'Plus · 19k (30-Day History)'
                    : lang === 'zh'
                    ? 'Plus · 19k（保留 30 天）'
                    : 'Plus · 19k (Lưu 30 ngày)'}
                </span>
              ) : (
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#171817] border border-[#C9A46A]/60 text-[#C9A46A]">
                  {lang === 'en'
                    ? 'Free · FAQ Only'
                    : lang === 'zh'
                    ? '免费版 · 仅查看常见问题'
                    : 'Miễn phí · Chỉ xem FAQ'}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#D8C9A9] tracking-tight mt-1">
              {lang === 'en'
                ? 'Visitor Support Center'
                : lang === 'zh'
                ? '访客支持中心'
                : 'Trung tâm Hỗ trợ Du khách'}
            </h2>
            <p className="text-xs text-[#D8C9A9]/75 mt-0.5">
              {lang === 'en'
                ? 'Browse quick guides, report issues, or track direct replies from Curators.'
                : lang === 'zh'
                ? '查阅快速指南、提交故障反馈或追踪管理团队的直接回复。'
                : 'Tra cứu hướng dẫn nhanh, báo lỗi kỹ thuật hoặc theo dõi phản hồi trực tiếp từ Ban Quản lý.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng Trung tâm Hỗ trợ"
            className="w-8 h-8 rounded-full bg-white/[0.07] hover:bg-white/[0.15] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Navigation Tabs */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-[#C9A46A]/15 bg-[#171817] flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-3.5 py-2 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-[#C9A46A] text-[#171817] font-semibold'
                : 'bg-[#D8C9A9]/8 text-[#D8C9A9]/75 hover:text-[#D8C9A9] hover:bg-[#D8C9A9]/15'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Hướng dẫn nhanh &amp; FAQ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCreatedTicket(null);
              setActiveTab('create');
            }}
            className={`px-3.5 py-2 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#C9A46A] text-[#171817] font-semibold'
                : 'bg-[#D8C9A9]/8 text-[#D8C9A9]/75 hover:text-[#D8C9A9] hover:bg-[#D8C9A9]/15'
            }`}
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span>Gửi yêu cầu / Báo lỗi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`px-3.5 py-2 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-[#C9A46A] text-[#171817] font-semibold'
                : 'bg-[#D8C9A9]/8 text-[#D8C9A9]/75 hover:text-[#D8C9A9] hover:bg-[#D8C9A9]/15'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 shrink-0" />
            <span>Theo dõi phản hồi ({myTickets.length})</span>
            {unreadReplyCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#47796D] text-[#D8C9A9] text-[10px] font-bold leading-none">
                {unreadReplyCount} mới
              </span>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 flex-1 min-h-0 overflow-y-auto heritage-scrollbar space-y-5">
          {/* TAB 1: FAQ ACCORDION */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="space-y-2.5">
                {FAQ_ITEMS.map((item) => {
                  const isExpanded = openFaqId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isExpanded
                          ? 'bg-[#19191E] border-[#C5A059]/45 shadow-[0_8px_28px_rgba(0,0,0,0.45)]'
                          : 'bg-black/40 border-white/[0.08] hover:border-white/[0.18]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isExpanded ? '' : item.id)}
                        aria-expanded={isExpanded}
                        className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer"
                      >
                        <div className="min-w-0 space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/35 text-[10.5px] font-medium text-[#C5A059]">
                            {item.badge}
                          </span>
                          <div className="text-xs sm:text-sm font-semibold text-[#F5F5F7] leading-snug">
                            {item.question}
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-[#C5A059] shrink-0 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <div
                        className={`grid transition-all duration-300 ease-out ${
                          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] space-y-3">
                            <ol className="space-y-2 text-xs text-[#D1D1D6] leading-relaxed">
                              {item.steps.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-2.5">
                                  <span className="w-5 h-5 rounded-full bg-[#C5A059]/18 border border-[#C5A059]/40 text-[#E8CA68] font-sans tabular-nums text-[10.5px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                            <div className="px-3 py-2 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 text-[11px] text-[#F5EFE6]">
                              {item.tip}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl bg-black/45 border border-white/[0.08] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-[#F5F5F7]">
                    Bạn cần hướng dẫn trực quan hoặc gửi yêu cầu riêng?
                  </div>
                  <div className="text-[11px] text-[#86868B]">
                    Đội ngũ Ban Quản lý tiếp nhận và phản hồi trực tiếp qua phiếu hỗ trợ.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {onOpenInteractiveGuide && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenInteractiveGuide();
                      }}
                      className="px-3.5 py-2 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.12] text-xs font-medium text-[#F5F5F7] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Hướng dẫn 4 bước</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 rounded-full bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi yêu cầu hỗ trợ</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE SUPPORT TICKET */}
          {activeTab === 'create' && (
            <>
              {!user ? (
                <div className="rounded-2xl border border-[#C9A46A]/40 bg-[#1C1D1B] p-6 space-y-4 text-[#D8C9A9]">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#A94F3D]/15 border border-[#A94F3D]/40 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-[#A94F3D]" strokeWidth={1.8} />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-serif text-lg font-semibold text-[#D8C9A9]">
                        {lang === 'en'
                          ? 'Sign In Required'
                          : lang === 'zh'
                          ? '需要登录账户'
                          : 'Yêu cầu đăng nhập tài khoản'}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#D8C9A9]/85 leading-relaxed">
                        Tính năng Đánh giá trải nghiệm và Hỗ trợ khách hàng hiện đang khóa. Vui lòng đăng nhập tài khoản để tiếp tục.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => openAuthModal()}
                      className="px-5 py-2.5 rounded-full bg-[#C9A46A] hover:brightness-110 text-[#171817] text-xs font-semibold cursor-pointer transition-all"
                    >
                      Đăng nhập ngay
                    </button>
                  </div>
                </div>
              ) : !entitlements.canSubmitSupportTicket && !isAdmin && !isTesterPro ? (
                <div className="rounded-2xl border border-[#C9A46A]/45 bg-[#171817] p-6 space-y-4">
                  <div className="space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-[#171817] border border-[#C9A46A] text-[#C9A46A] text-[10.5px] font-semibold">
                      {lang === 'en'
                        ? 'Free Tier · FAQ Viewing Enabled'
                        : lang === 'zh'
                        ? '免费版 · 可查阅常见问题'
                        : 'Gói Khám phá 0đ · Chỉ hỗ trợ xem FAQ'}
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-[#D8C9A9]">
                      {lang === 'en'
                        ? 'Upgrade Your Pass to Submit Support Requests'
                        : lang === 'zh'
                        ? '升级门票即可向管理员提交支持请求'
                        : 'Nâng cấp gói vé để gửi yêu cầu hỗ trợ tới Admin'}
                    </h3>
                    <p className="text-xs text-[#D8C9A9]/80 leading-relaxed">
                      {lang === 'en'
                        ? 'Free Explorer accounts can read all 4 FAQ guides above. Unlock direct Admin ticket submission (30-day archive) with the 19k Route Pass, or Fast-Track AI & Admin priority with the 49k VIP Pass.'
                        : lang === 'zh'
                        ? '免费账户可随时阅读以上 4 项常见问题指南。购买 19k 路线票可向管理员提交工单（保留 30 天），购买 49k VIP 票可享极速优先支持。'
                        : 'Tài khoản Miễn phí có thể tra cứu đầy đủ 4 mục Hướng dẫn nhanh & FAQ. Để mở khóa tính năng Gửi yêu cầu hỗ trợ tới Admin (lưu 30 ngày) hãy chọn Vé Tuyến 19k, hoặc chọn Vé VIP 49k để nhận Hỗ trợ Ưu tiên Nhanh (Fast-Track).'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#526D8B]/20 border border-[#526D8B]/55 space-y-1">
                      <div className="font-semibold text-[#D8C9A9] flex items-center gap-2">
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#526D8B] text-[#D8C9A9]">Plus</span>
                        <span>19.000đ · {lang === 'en' ? 'Standard' : lang === 'zh' ? '标准版' : 'Tiêu chuẩn'}</span>
                      </div>
                      <div className="text-[#D8C9A9]/75">
                        {lang === 'en'
                          ? 'Submit Admin tickets · 30-day archive · Gemini 3.5 Flash'
                          : lang === 'zh'
                          ? '向管理员提交工单 · 保存 30 天 · Gemini 3.5 Flash'
                          : 'Gửi yêu cầu hỗ trợ Admin · Lưu 30 ngày · Gemini 3.5 Flash'}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#A94F3D]/20 border border-[#C9A46A]/55 space-y-1">
                      <div className="font-semibold text-[#D8C9A9] flex items-center gap-2">
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#171817] border border-[#C9A46A] text-[#C9A46A]">Pro</span>
                        <span>49.000đ · {lang === 'en' ? 'Fast-Track' : lang === 'zh' ? '极速优先' : 'Ưu tiên nhanh'}</span>
                      </div>
                      <div className="text-[#D8C9A9]/75">
                        {lang === 'en'
                          ? 'Fast-Track AI & Admin Priority · Unlimited Gemini 4 Hydrogen'
                          : lang === 'zh'
                          ? 'AI 与管理员极速优先支持 · 无限量 Gemini 4 Hydrogen'
                          : 'Hỗ trợ Ưu tiên Nhanh (Fast-Track) từ AI & Admin (90 ngày)'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('faq')}
                      className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-[#D8C9A9] cursor-pointer"
                    >
                      {lang === 'en' ? 'Back to FAQ' : lang === 'zh' ? '返回常见问题' : 'Xem lại Hướng dẫn FAQ'}
                    </button>
                    {onNavigateToTickets && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigateToTickets();
                        }}
                        className="px-5 py-2 rounded-full bg-[#C9A46A] hover:bg-[#D8C9A9] text-[#171817] text-xs font-bold cursor-pointer transition-colors"
                      >
                        {lang === 'en'
                          ? 'Open Tickets & EdTech'
                          : lang === 'zh'
                          ? '前往门票与数字教材'
                          : 'Mở trang Vé & Học liệu'}
                      </button>
                    )}
                  </div>
                </div>
              ) : createdTicket ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#C5A059]/55 bg-gradient-to-br from-[#231D12] via-[#171614] to-[#121215] p-5 space-y-3">
                    <div className="flex items-start gap-2.5 text-emerald-300 text-sm font-semibold">
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>
                        Yêu cầu của bạn đã được Trợ lý AI tiếp nhận và chuyển thẳng tới hộp thư Quản trị viên.
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-full bg-[#C5A059] text-black font-sans tabular-nums text-xs font-bold">
                        Mã phiếu: {createdTicket.ticketCode}
                      </span>
                      {createdTicket.aiPriority && (
                        <span className="px-2.5 py-1 rounded-full bg-[#0071E3]/20 border border-[#0071E3]/40 text-sky-200 text-[11px] font-semibold">
                          AI Phân loại: Ưu tiên {createdTicket.aiPriority}
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-semibold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Đang chờ xử lý</span>
                      </span>
                      <span className="text-[11px] font-sans tabular-nums text-[#86868B]">
                        {new Date(createdTicket.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="text-xs text-[#D1D1D6] space-y-1">
                      <div>
                        Nhóm vấn đề: <strong className="text-[#F5F5F7]">{createdTicket.categoryLabel}</strong>
                      </div>
                      {createdTicket.relatedSiteName && (
                        <div>
                          Di tích liên quan:{' '}
                          <strong className="text-[#F5F5F7]">{createdTicket.relatedSiteName}</strong>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-[#F5F5F7]/90 leading-relaxed bg-black/40 rounded-xl p-3 border border-white/[0.06]">
                      “{createdTicket.description}”
                    </p>

                    {isConciergeAnalyzing && (
                      <div className="rounded-xl bg-[#0071E3]/15 border border-[#0071E3]/45 px-4 py-3 flex items-center gap-3 text-xs text-sky-200 animate-pulse">
                        <Loader2 className="w-4 h-4 text-[#C5A059] animate-spin shrink-0" />
                        <div className="space-y-0.5">
                          <div className="font-semibold text-[#F5F5F7]">
                            Trợ lý Hỗ trợ đang đọc câu hỏi &amp; soạn giải đáp...
                          </div>
                          <div className="text-[11px] text-sky-200/80">
                            Đang phân tích ngữ cảnh, đối chiếu thông tin di tích và chuyển bạn tới hội thoại trực tiếp.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isConciergeAnalyzing && (
                    <div className="flex flex-wrap items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCreatedTicket(null)}
                        className="px-4 py-2.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-xs font-medium text-[#F5F5F7] cursor-pointer transition-colors"
                      >
                        Gửi yêu cầu khác
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('tickets')}
                        className="px-5 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                      >
                        <Inbox className="w-3.5 h-3.5" />
                        <span>Theo dõi trạng thái phiếu</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  {!user && (
                    <div className="rounded-xl bg-[#0071E3]/12 border border-[#0071E3]/35 px-3.5 py-2.5 text-xs text-sky-200 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
                      <span>
                        Bạn có thể gửi yêu cầu ngay cả khi chưa đăng nhập (ví dụ: gặp sự cố khi đăng nhập Google / Facebook).
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="support-sender-name"
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#A1A1A6]"
                      >
                        <User className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Họ và tên *</span>
                      </label>
                      <input
                        id="support-sender-name"
                        type="text"
                        required
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Nhập họ tên của bạn..."
                        className="w-full h-11 px-3.5 rounded-xl bg-black/55 border border-white/[0.14] text-xs sm:text-sm text-[#F5F5F7] placeholder:text-[#636366] focus:border-[#C5A059] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="support-sender-email"
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#A1A1A6]"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Email liên hệ *</span>
                      </label>
                      <input
                        id="support-sender-email"
                        type="email"
                        required
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full h-11 px-3.5 rounded-xl bg-black/55 border border-white/[0.14] text-xs sm:text-sm text-[#F5F5F7] placeholder:text-[#636366] focus:border-[#C5A059] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="support-category"
                        className="block text-xs font-semibold text-[#A1A1A6]"
                      >
                        Nhóm vấn đề *
                      </label>
                      <select
                        id="support-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
                        className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/[0.14] text-xs sm:text-sm text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none cursor-pointer"
                      >
                        {SUPPORT_TICKET_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="support-related-site"
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#A1A1A6]"
                      >
                        <Landmark className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Di tích liên quan (tùy chọn)</span>
                      </label>
                      <SearchableHeritageSelect
                        id="support-related-site"
                        sites={sites}
                        value={relatedSiteId}
                        onChange={setRelatedSiteId}
                        includeSystemAllOption
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="support-description"
                      className="block text-xs font-semibold text-[#A1A1A6]"
                    >
                      Mô tả chi tiết *
                    </label>
                    <textarea
                      id="support-description"
                      rows={4}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Mô tả rõ tình huống, bước thao tác gặp lỗi, hoặc thông tin đoàn tham quan / góp ý sử liệu của bạn..."
                      className="w-full p-3.5 rounded-2xl bg-black/55 border border-white/[0.14] text-xs sm:text-sm text-[#F5F5F7] placeholder:text-[#636366] focus:border-[#C5A059] focus:outline-none resize-none"
                    />
                  </div>

                  {formError && (
                    <div className="rounded-xl bg-[#FF453A]/15 border border-[#FF453A]/45 px-3.5 py-2.5 text-xs text-[#FF8A80] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-[#86868B] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                      <span>Đồng bộ tức thì về Ban Quản lý (Admin Studio)</span>
                    </span>
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-full bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all shadow-lg"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi yêu cầu hỗ trợ</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* TAB 3: MY SUPPORT TICKETS & CONVERSATION THREAD */}
          {activeTab === 'tickets' && (
            <div className="space-y-3.5">
              {aiAutoRepliedNotice && (
                <div className="rounded-2xl bg-emerald-500/14 border border-emerald-400/45 px-4 py-3 flex items-start justify-between gap-3 text-xs text-emerald-100">
                  <div className="flex items-start gap-2.5">
                    <Bot className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{aiAutoRepliedNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiAutoRepliedNotice(null)}
                    aria-label="Đóng thông báo"
                    className="text-emerald-200/75 hover:text-white cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {myTickets.length === 0 ? (
                <div className="py-12 px-6 text-center rounded-2xl bg-black/35 border border-white/[0.07] space-y-3">
                  <Inbox className="w-9 h-9 text-[#C5A059]/60 mx-auto" />
                  <div className="text-sm font-semibold text-[#F5F5F7]">
                    Bạn chưa có yêu cầu hỗ trợ nào
                  </div>
                  <p className="text-xs text-[#86868B] max-w-md mx-auto">
                    Khi bạn gửi yêu cầu hỗ trợ hoặc báo lỗi kỹ thuật, phiếu sẽ tự động cấp mã theo dõi và hiển thị phản hồi trực tiếp tại đây.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 rounded-full bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Tạo yêu cầu hỗ trợ đầu tiên</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myTickets.map((ticket) => {
                    const isResolved = ticket.status === 'resolved';
                    const messages = getTicketConversationMessages(ticket);
                    const draftText = followUpDrafts[ticket.id] || '';
                    const isTyping = typingTicketId === ticket.id;

                    return (
                      <article
                        key={ticket.id}
                        className={`rounded-2xl p-4 sm:p-5 border space-y-3.5 ${
                          ticket.escalatedToAdmin
                            ? 'bg-gradient-to-br from-[#231516] via-[#171416] to-black/60 border-[#FF453A]/50'
                            : 'bg-black/45 border-white/[0.09]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#C5A059]/18 border border-[#C5A059]/45 font-sans tabular-nums text-[11px] font-bold text-[#E8CA68]">
                              {ticket.ticketCode}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 ${
                                isResolved
                                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                                  : ticket.status === 'in_progress'
                                  ? 'bg-[#526D8B]/25 border border-[#526D8B]/60 text-[#D8C9A9]'
                                  : 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                              }`}
                            >
                              {isResolved ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              <span>
                                {isResolved
                                  ? 'Đã giải quyết'
                                  : ticket.status === 'in_progress'
                                  ? 'Đang xử lý'
                                  : ticket.escalatedToAdmin
                                  ? 'Chờ Quản trị viên phản hồi'
                                  : 'Chờ hỗ trợ'}
                              </span>
                            </span>
                            {ticket.escalatedToAdmin && (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#FF453A]/20 border border-[#FF453A]/55 text-[#FF8A80] text-[10.5px] font-bold">
                                Ưu tiên Admin xử lý
                              </span>
                            )}
                            {ticket.supportTier === 'tester_report' && (
                              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#47796D] text-[#D8C9A9]">
                                Tester Pro
                              </span>
                            )}
                            {ticket.supportTier === 'vip_fast_track' && (
                              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#A94F3D] border border-[#C9A46A] text-[#D8C9A9]">
                                {lang === 'en'
                                  ? 'Pro · 49k · Fast-Track'
                                  : lang === 'zh'
                                  ? 'Pro · 49k · 极速优先'
                                  : 'Pro · 49k · Ưu tiên nhanh'}
                              </span>
                            )}
                            {ticket.supportTier === 'standard_19k' && (
                              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#526D8B] text-[#D8C9A9]">
                                Plus · 19k
                              </span>
                            )}
                            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.09] text-[10.5px] text-[#D1D1D6]">
                              {ticket.categoryLabel}
                            </span>
                            {typeof ticket.retentionDays === 'number' && ticket.retentionDays > 0 && (
                              <span className="text-[10.5px] text-[#C9A46A]/85 tabular-nums">
                                Lưu {ticket.retentionDays} ngày
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-sans tabular-nums text-[#86868B]">
                            {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        {ticket.relatedSiteName && (
                          <div className="text-xs text-[#A1A1A6] flex items-center gap-1.5">
                            <Landmark className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                            <span>
                              Di tích liên quan:{' '}
                              <strong className="text-[#F5F5F7]">{ticket.relatedSiteName}</strong>
                            </span>
                          </div>
                        )}

                        {/* Conversation Thread */}
                        <div className="space-y-2.5">
                          {messages.map((msg) => {
                            const isAi = msg.senderRole === 'ai_concierge';
                            const isAdminMsg = msg.senderRole === 'admin';
                            return (
                              <div
                                key={msg.id}
                                className={`p-3.5 rounded-xl border space-y-1.5 ${
                                  isAdminMsg
                                    ? 'bg-[#C5A059]/14 border-[#C5A059]/50'
                                    : isAi
                                    ? 'bg-[#0E1B2A]/85 border-[#0071E3]/45'
                                    : 'bg-[#111114] border-white/[0.07]'
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
                                  {isAi ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0071E3]/25 border border-[#0071E3]/50 font-sans font-semibold text-sky-200">
                                      <Bot className="w-3 h-3 text-sky-300" />
                                      <span>{AI_SUPPORT_BOT_AUTHOR}</span>
                                    </span>
                                  ) : isAdminMsg ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C5A059]/25 border border-[#C5A059]/55 font-sans font-semibold text-[#F2D388]">
                                      <Crown className="w-3 h-3 text-[#C5A059]" />
                                      <span>Quản trị viên Dấu Ấn Việt 3D</span>
                                    </span>
                                  ) : (
                                    <span className="font-sans font-semibold text-[#A1A1A6]">
                                      {msg.senderLabel}
                                    </span>
                                  )}
                                  <span className="font-sans tabular-nums text-[#86868B]">
                                    {new Date(msg.createdAt).toLocaleString('vi-VN')}
                                  </span>
                                </div>
                                <div className="text-xs sm:text-[13px] text-[#F5EFE6] leading-relaxed whitespace-pre-line">
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })}

                          {isTyping && (
                            <div className="p-3 rounded-xl bg-[#0E1B2A]/75 border border-[#0071E3]/40 flex items-center gap-2.5 text-xs text-sky-200 animate-pulse">
                              <Loader2 className="w-3.5 h-3.5 text-sky-300 animate-spin shrink-0" />
                              <span>{AI_SUPPORT_BOT_AUTHOR} đang phân tích câu hỏi &amp; soạn phản hồi...</span>
                            </div>
                          )}

                          {messages.length === 1 && !isTyping && (
                            <div className="text-[11px] text-[#86868B] italic flex items-center gap-1.5 pt-0.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                              <span>
                                Ban Quản lý đã tiếp nhận phiếu {ticket.ticketCode} và sẽ phản hồi sớm nhất tại mục này.
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Follow-up Question Input + Direct Admin Escalation */}
                        <div className="pt-2 border-t border-white/[0.07] space-y-2.5">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleVisitorFollowUp(ticket);
                            }}
                            className="flex flex-col sm:flex-row gap-2"
                          >
                            <input
                              type="text"
                              value={draftText}
                              onChange={(e) =>
                                setFollowUpDrafts((prev) => ({
                                  ...prev,
                                  [ticket.id]: e.target.value,
                                }))
                              }
                              placeholder="Hỏi tiếp ngay trong phiếu này (Trợ lý Hỗ trợ sẽ đọc ngữ cảnh & trả lời ngắn gọn)..."
                              className="flex-1 h-10 px-3.5 rounded-full bg-[#111114] border border-white/[0.12] text-xs text-[#F5F5F7] placeholder:text-[#636366] focus:border-[#C5A059] focus:outline-none"
                            />
                            <button
                              type="submit"
                              disabled={!draftText.trim() || isTyping}
                              className="h-10 px-4 rounded-full bg-[#C5A059] hover:bg-[#D4B06A] disabled:opacity-45 text-black text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Nhắn tiếp</span>
                            </button>
                          </form>

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10.5px] text-[#86868B]">
                              Mọi hội thoại đều đồng bộ về hộp thư Quản trị viên.
                            </span>

                            {ticket.escalatedToAdmin ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF453A]/15 border border-[#FF453A]/40 text-[11px] font-medium text-[#FF8A80]">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Đã chuyển ưu tiên trực tiếp cho Quản trị viên</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEscalateToAdmin(ticket)}
                                className="px-3 py-1 rounded-full bg-white/[0.04] hover:bg-amber-500/15 border border-white/[0.1] hover:border-amber-400/45 text-[11px] text-[#A1A1A6] hover:text-amber-200 transition-colors cursor-pointer"
                              >
                                Chưa hài lòng? Chuyển trực tiếp cho Quản trị viên
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
