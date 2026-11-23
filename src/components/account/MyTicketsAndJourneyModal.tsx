import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { HeritageSite } from '../../types/heritage';
import { TOUR_ROUTES } from '../../data/tours';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { getCurrentFirebaseProviderIds } from '../../lib/firebaseAuth';
import {
  IssuedPassRecord,
  PASSES_UPDATED_EVENT,
  RegisteredVisitorRecord,
  VISITORS_UPDATED_EVENT,
  buildAccountTransferCode,
  fetchUsersFromCloudApi,
  getUserIssuedPasses,
  getVisitorRecord,
} from '../../utils/adminPlatformStore';
import {
  AdminLoginAuditEntry,
  LOGIN_AUDIT_UPDATED_EVENT,
  PERSONAL_PROFILE_UPDATED_EVENT,
  PERSONAL_TICKETS_UPDATED_EVENT,
  PERSONAL_VISIT_HISTORY_UPDATED_EVENT,
  UserVisitHistoryEntry,
  clearPersonalVisitHistory,
  formatVietnamLoginTimestamp,
  getCurrentSessionLoginAudit,
  loadLocalPersonalProfile,
  loadPersonalVisitHistory,
  pullPersonalProfileFromFirebase,
  pullPersonalTicketsFromFirebase,
  pullPersonalVisitHistoryFromFirebase,
} from '../../utils/accountActivityStore';
import {
  X,
  Ticket,
  Compass,
  Box,
  Route,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  QrCode,
  Copy,
  Smartphone,
  User,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
  Clock,
  Headphones,
  Trash2,
  Laptop,
  Tablet,
  MapPin,
  Save,
  Shield,
  Calendar,
  Mail,
  RotateCcw,
} from 'lucide-react';
import { sendOrderThankYouEmail } from '../../utils/emailAutoSender';
import {
  PAYMENT_ORDERS_UPDATED_EVENT,
  PaymentOrderRecord,
  getPlanDisplayName,
  loadPaymentOrders,
  updatePaymentOrderEmailStatus,
} from '../../utils/subscriptionGatingStore';

interface MyTicketsAndJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: HeritageSite[];
  onOpen3D: (site: HeritageSite) => void;
  onOpenMapRoutes: () => void;
  onGoToTickets: () => void;
  onOpenAdminLoginAudit?: () => void;
  onOpenGateLetter?: () => void;
}

type AccountCenterTab = 'settings' | 'history' | 'tickets';

export const MyTicketsAndJourneyModal: React.FC<MyTicketsAndJourneyModalProps> = ({
  isOpen,
  onClose,
  sites,
  onOpen3D,
  onOpenMapRoutes,
  onGoToTickets,
  onOpenAdminLoginAudit,
  onOpenGateLetter,
}) => {
  const { lang, getLocalizedSite, getLocalizedTour } = useI18n();
  const {
    user,
    isAdmin,
    isTesterPro,
    userTier,
    updateUserProfile,
    changeUserPassword,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AccountCenterTab>('settings');

  // Personal Profile State (Tab 1)
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName || '');
  const [phoneInput, setPhoneInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  // Smart Password Change State (Tab 1)
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdNotice, setPwdNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Current Admin Login Session Card State
  const [currentAudit, setCurrentAudit] = useState<AdminLoginAuditEntry | null>(() =>
    getCurrentSessionLoginAudit()
  );

  // Cross-Device Sync Code State
  const [transferCodeCopied, setTransferCodeCopied] = useState(false);
  const [generatedTransferCode, setGeneratedTransferCode] = useState<string>('');

  // Visit History State (Tab 2)
  const [visitHistory, setVisitHistory] = useState<UserVisitHistoryEntry[]>(() =>
    user?.userId ? loadPersonalVisitHistory(user.userId) : []
  );
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [visitorRecord, setVisitorRecord] = useState<RegisteredVisitorRecord | null>(() =>
    getVisitorRecord(user?.userId)
  );

  // Tickets & QR Overlay State (Tab 3)
  const [passes, setPasses] = useState<IssuedPassRecord[]>(() =>
    getUserIssuedPasses(user?.userId, user?.email)
  );
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrderRecord[]>(() =>
    loadPaymentOrders()
  );
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [activeQrPass, setActiveQrPass] = useState<IssuedPassRecord | null>(null);
  const [resendingPassId, setResendingPassId] = useState<string | null>(null);
  const [resendPassNotice, setResendPassNotice] = useState<
    Record<string, { type: 'ok' | 'err'; text: string }>
  >({});

  // Determine whether user is Google-linked only (no password provider)
  const isGoogleLinkedAccount = useMemo(() => {
    if (!user) return false;
    const providerIds = getCurrentFirebaseProviderIds();
    if (providerIds.includes('google.com') && !providerIds.includes('password')) {
      return true;
    }
    if (user.authMethod === 'oauth_sdk' && user.provider === 'google') {
      return true;
    }
    return false;
  }, [user]);

  const mergePasses = (
    localPasses: IssuedPassRecord[],
    remotePasses: IssuedPassRecord[]
  ): IssuedPassRecord[] => {
    const map = new Map<string, IssuedPassRecord>();
    for (const item of [...localPasses, ...remotePasses]) {
      if (!item) continue;
      const key = item.code || item.id;
      if (key && !map.has(key)) {
        map.set(key, item);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
  };

  // Sync user-scoped state whenever user changes or modal opens
  useEffect(() => {
    if (!user) return;
    const localProfile = loadLocalPersonalProfile(user.userId);
    setDisplayNameInput(localProfile?.displayName || user.displayName || '');
    setPhoneInput(localProfile?.phone || '');
    setVisitHistory(loadPersonalVisitHistory(user.userId));
    setPasses(getUserIssuedPasses(user.userId, user.email));
    setVisitorRecord(getVisitorRecord(user.userId));
    setCurrentAudit(getCurrentSessionLoginAudit());
    setProfileNotice(null);
    setPwdNotice(null);
    setTransferCodeCopied(false);
    setGeneratedTransferCode('');
    setConfirmClearHistory(false);
    setActiveQrPass(null);
  }, [user?.userId, user?.email, user?.displayName]);

  useEffect(() => {
    if (!isOpen || !user) return;

    const syncLocalAll = () => {
      const localProfile = loadLocalPersonalProfile(user.userId);
      if (localProfile?.phone !== undefined) {
        setPhoneInput((prev) => (prev ? prev : localProfile.phone));
      }
      setVisitHistory(loadPersonalVisitHistory(user.userId));
      setVisitorRecord(getVisitorRecord(user.userId));
      setPasses((prev) => mergePasses(getUserIssuedPasses(user.userId, user.email), prev));
      setPaymentOrders(loadPaymentOrders());
      setCurrentAudit(getCurrentSessionLoginAudit());
    };

    syncLocalAll();

    // Pull latest from Firebase Realtime Database
    void pullPersonalProfileFromFirebase(user.userId).then((remote) => {
      if (remote) {
        if (remote.displayName) setDisplayNameInput(remote.displayName);
        if (typeof remote.phone === 'string') setPhoneInput(remote.phone);
      }
    });

    void pullPersonalVisitHistoryFromFirebase(user.userId).then((remoteHistory) => {
      setVisitHistory(remoteHistory);
    });

    void Promise.all([
      fetchUsersFromCloudApi(),
      pullPersonalTicketsFromFirebase(user.userId),
    ]).then(([, remoteTickets]) => {
      setPasses(mergePasses(getUserIssuedPasses(user.userId, user.email), remoteTickets));
      setVisitorRecord(getVisitorRecord(user.userId));
    });

    window.addEventListener(PASSES_UPDATED_EVENT, syncLocalAll);
    window.addEventListener(PAYMENT_ORDERS_UPDATED_EVENT, syncLocalAll);
    window.addEventListener(VISITORS_UPDATED_EVENT, syncLocalAll);
    window.addEventListener(PERSONAL_PROFILE_UPDATED_EVENT, syncLocalAll);
    window.addEventListener(PERSONAL_VISIT_HISTORY_UPDATED_EVENT, syncLocalAll);
    window.addEventListener(PERSONAL_TICKETS_UPDATED_EVENT, syncLocalAll);
    window.addEventListener(LOGIN_AUDIT_UPDATED_EVENT, syncLocalAll);

    return () => {
      window.removeEventListener(PASSES_UPDATED_EVENT, syncLocalAll);
      window.removeEventListener(PAYMENT_ORDERS_UPDATED_EVENT, syncLocalAll);
      window.removeEventListener(VISITORS_UPDATED_EVENT, syncLocalAll);
      window.removeEventListener(PERSONAL_PROFILE_UPDATED_EVENT, syncLocalAll);
      window.removeEventListener(PERSONAL_VISIT_HISTORY_UPDATED_EVENT, syncLocalAll);
      window.removeEventListener(PERSONAL_TICKETS_UPDATED_EVENT, syncLocalAll);
      window.removeEventListener(LOGIN_AUDIT_UPDATED_EVENT, syncLocalAll);
    };
  }, [isOpen, user?.userId, user?.email]);

  const findMatchingOrderForPass = (pass: IssuedPassRecord): PaymentOrderRecord | undefined => {
    const passTime = Date.parse(pass.issuedAt);
    return (
      paymentOrders.find((order) => order.schoolCode && order.schoolCode === pass.code) ||
      paymentOrders.find((order) => {
        const sameEmail =
          order.email &&
          user?.email &&
          order.email.toLowerCase().trim() === user.email.toLowerCase().trim();
        const sameAmount = order.amountDisplay === pass.amountLabel;
        const closeTime =
          Number.isFinite(passTime) &&
          Math.abs(Date.parse(order.createdAt) - passTime) < 1000 * 60 * 5;
        return sameEmail && (sameAmount || closeTime);
      })
    );
  };

  const handleResendPassEmail = async (pass: IssuedPassRecord) => {
    if (resendingPassId) return;
    const matchedOrder = findMatchingOrderForPass(pass);
    const recipientEmail = (matchedOrder?.email || pass.ownerEmail || user?.email || '').trim();
    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      setResendPassNotice((prev) => ({
        ...prev,
        [pass.id]: {
          type: 'err',
          text: 'Không tìm thấy địa chỉ Gmail hợp lệ gắn với vé này.',
        },
      }));
      return;
    }

    setResendingPassId(pass.id);
    setResendPassNotice((prev) => {
      const next = { ...prev };
      delete next[pass.id];
      return next;
    });

    const planName = matchedOrder
      ? matchedOrder.planName || getPlanDisplayName(matchedOrder.planTier)
      : pass.label;
    const scope = matchedOrder?.scopeLabel || pass.routeTitle || pass.label;
    const orderCode = matchedOrder?.orderId || pass.code;
    const amount = matchedOrder?.amountDisplay || pass.amountLabel;

    const result = await sendOrderThankYouEmail(
      {
        toEmail: recipientEmail,
        customerName:
          matchedOrder?.customerName || pass.ownerName || user?.displayName || 'Quý khách',
        planName,
        scope,
        orderCode,
        amount,
      },
      { requireEnabled: false }
    );

    setResendingPassId(null);

    if (result.ok) {
      if (matchedOrder) {
        updatePaymentOrderEmailStatus(matchedOrder.orderId, true);
      }
      setResendPassNotice((prev) => ({
        ...prev,
        [pass.id]: {
          type: 'ok',
          text: `Đã gửi lại thư cảm ơn tới ${recipientEmail}.`,
        },
      }));
    } else {
      setResendPassNotice((prev) => ({
        ...prev,
        [pass.id]: {
          type: 'err',
          text: result.error || 'Không thể gửi lại thư cảm ơn. Vui lòng thử lại sau.',
        },
      }));
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeQrPass) {
          setActiveQrPass(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, activeQrPass, onClose]);

  const myPasses = useMemo(() => (user ? passes : []), [passes, user]);

  // Generate QR codes for tickets
  useEffect(() => {
    if (!isOpen || myPasses.length === 0) return;
    let cancelled = false;
    const generateAll = async () => {
      const next: Record<string, string> = {};
      for (const pass of myPasses) {
        try {
          const payload = JSON.stringify({
            app: 'DAU-AN-VIET-3D',
            code: pass.code,
            holder: pass.ownerName,
            contact: pass.ownerContactMasked,
            route: pass.routeTitle || pass.label,
            status: pass.status,
            issuedAt: pass.issuedAt,
          });
          next[pass.id] = await QRCode.toDataURL(payload, {
            width: 240,
            margin: 1,
            color: { dark: '#171817', light: '#F4EFE4' },
          });
        } catch {
          // ignore QR generation failure
        }
      }
      if (!cancelled) {
        setQrMap(next);
      }
    };
    void generateAll();
    return () => {
      cancelled = true;
    };
  }, [isOpen, myPasses]);

  if (!isOpen || !user) return null;

  const exploredIds = visitorRecord?.exploredSiteIds || [];
  const completedRouteIds = visitorRecord?.completedRouteIds || [];
  const exploredSites = sites.filter((s) => exploredIds.includes(s.id));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileNotice(null);
    const trimmedName = displayNameInput.trim();
    if (trimmedName.length < 2) {
      setProfileNotice({
        type: 'err',
        text:
          lang === 'en'
            ? 'Display name must be at least 2 characters.'
            : lang === 'zh'
            ? '显示名称至少需要 2 个字符。'
            : 'Tên hiển thị cần có tối thiểu 2 ký tự.',
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateUserProfile({
        displayName: trimmedName,
        phone: phoneInput.trim(),
      });
      if (!res.ok) {
        setProfileNotice({
          type: 'err',
          text:
            res.error ||
            (lang === 'en'
              ? 'Unable to save profile.'
              : lang === 'zh'
              ? '无法保存资料。'
              : 'Không thể lưu thay đổi hồ sơ.'),
        });
      } else {
        setProfileNotice({
          type: 'ok',
          text:
            lang === 'en'
              ? 'Account profile saved and synchronized.'
              : lang === 'zh'
              ? '账户资料已保存并同步。'
              : 'Đã lưu và đồng bộ thông tin tài khoản thành công.',
        });
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdNotice(null);

    if (!currentPwd.trim()) {
      setPwdNotice({
        type: 'err',
        text:
          lang === 'en'
            ? 'Please enter your current password.'
            : lang === 'zh'
            ? '请输入当前密码。'
            : 'Vui lòng nhập mật khẩu hiện tại.',
      });
      return;
    }
    if (newPwd.length < 6) {
      setPwdNotice({
        type: 'err',
        text:
          lang === 'en'
            ? 'New password must be at least 6 characters.'
            : lang === 'zh'
            ? '新密码至少需要 6 个字符。'
            : 'Mật khẩu mới phải có tối thiểu 6 ký tự.',
      });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdNotice({
        type: 'err',
        text:
          lang === 'en'
            ? 'Password confirmation does not match.'
            : lang === 'zh'
            ? '两次输入的新密码不一致。'
            : 'Xác nhận mật khẩu mới chưa trùng khớp.',
      });
      return;
    }

    setIsChangingPwd(true);
    try {
      const res = await changeUserPassword(currentPwd, newPwd);
      if (!res.ok) {
        setPwdNotice({
          type: 'err',
          text:
            res.error ||
            (lang === 'en'
              ? 'Current password is incorrect.'
              : lang === 'zh'
              ? '当前密码不正确。'
              : 'Mật khẩu hiện tại chưa chính xác.'),
        });
      } else {
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
        setPwdNotice({
          type: 'ok',
          text:
            lang === 'en'
              ? 'Password updated successfully.'
              : lang === 'zh'
              ? '密码已成功更新。'
              : 'Đổi mật khẩu thành công.',
        });
      }
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleClearVisitHistory = async () => {
    await clearPersonalVisitHistory(user.userId);
    setVisitHistory([]);
    setConfirmClearHistory(false);
  };

  const renderSessionDeviceIcon = (deviceType: AdminLoginAuditEntry['deviceType']) => {
    if (deviceType === 'mobile') return <Smartphone className="w-4 h-4 text-[#47796D] shrink-0" />;
    if (deviceType === 'tablet') return <Tablet className="w-4 h-4 text-[#47796D] shrink-0" />;
    return <Laptop className="w-4 h-4 text-[#47796D] shrink-0" />;
  };

  const getTicketStatusMeta = (status: IssuedPassRecord['status']) => {
    if (status === 'verified') {
      return {
        label: lang === 'en' ? 'Used' : lang === 'zh' ? '已使用' : 'Đã sử dụng',
        badgeClass: 'bg-[#526D8B]/15 text-[#526D8B] border-[#526D8B]/35',
      };
    }
    if (status === 'revoked') {
      return {
        label: lang === 'en' ? 'Revoked' : lang === 'zh' ? '已作废' : 'Đã thu hồi',
        badgeClass: 'bg-[#A94F3D]/15 text-[#A94F3D] border-[#A94F3D]/35',
      };
    }
    return {
      label: lang === 'en' ? 'Confirmed' : lang === 'zh' ? '已确认' : 'Đã xác nhận',
      badgeClass: 'bg-[#47796D] text-[#F4EFE4] border-[#47796D]',
    };
  };

  const modalTitle =
    lang === 'en'
      ? 'My Account & Tickets'
      : lang === 'zh'
      ? '我的账户与门票'
      : 'Tài khoản & Vé của tôi';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={modalTitle}
      onClick={onClose}
      className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 bg-[#171817]/80"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[94vw] sm:w-full max-w-4xl max-h-[85vh] sm:max-h-[89dvh] bg-[#D8C9A9] border border-[#171817]/25 rounded-sm flex flex-col overflow-hidden text-[#171817] animate-apple-sheet relative"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#171817]/20 bg-[#EDE3CE] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`relative overflow-hidden w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isAdmin
                  ? 'bg-[#171817] text-[#C9A46A] border-2 border-[#C9A46A]'
                  : 'bg-[#C9A46A] text-[#171817] border border-[#171817]/20'
              }`}
            >
              <span>{user.avatarInitials}</span>
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#A94F3D]">
                {lang === 'en'
                  ? 'Personal Heritage Center · Dấu Ấn Việt 3D'
                  : lang === 'zh'
                  ? '个人遗产档案中心 · Dấu Ấn Việt 3D'
                  : 'Trung tâm Hồ sơ Cá nhân · Dấu Ấn Việt 3D'}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <h2 className="text-base sm:text-xl font-serif font-semibold text-[#171817] truncate">
                  {modalTitle}
                </h2>
                {isAdmin ? (
                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#C9A46A] text-[#171817] border border-[#171817]/20 shrink-0">
                    {lang === 'en' ? 'Administrator' : lang === 'zh' ? '管理员' : 'Quản trị viên'}
                  </span>
                ) : isTesterPro ? (
                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#47796D] text-[#D8C9A9] shrink-0">
                    Tester Pro
                  </span>
                ) : userTier === 'pro' ? (
                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#171817] border border-[#C9A46A] text-[#C9A46A] shrink-0">
                    Pro
                  </span>
                ) : userTier === 'plus' ? (
                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#526D8B] text-[#D8C9A9] shrink-0">
                    Plus
                  </span>
                ) : (
                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#171817]/10 text-[#171817]/80 shrink-0">
                    {lang === 'en' ? 'Visitor' : lang === 'zh' ? '访客' : 'Du khách'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenGateLetter && (
              <button
                type="button"
                onClick={onOpenGateLetter}
                title={
                  lang === 'en'
                    ? 'Re-read Project Welcome Letter'
                    : lang === 'zh'
                    ? '重读项目欢迎信'
                    : 'Đọc lại Thư ngỏ dự án'
                }
                className="h-8 px-3 rounded-full bg-[#171817] hover:bg-[#A94F3D] text-[#C9A46A] hover:text-[#F4EFE4] border border-[#C9A46A]/45 text-[11.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.65"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5 shrink-0"
                  aria-hidden="true"
                >
                  <path d="M4.5 3.5h8.5L16.5 7v9.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" />
                  <path d="M12.5 3.5V7.5h4" />
                  <path d="M6.8 10.5h6.4" />
                  <path d="M6.8 13.5h4.2" />
                </svg>
                <span>
                  {lang === 'en'
                    ? 'Project Letter'
                    : lang === 'zh'
                    ? '重读欢迎信'
                    : 'Đọc lại Thư ngỏ dự án'}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
              className="w-8 h-8 rounded-sm bg-[#D8C9A9] hover:bg-[#A94F3D] text-[#171817] hover:text-[#D8C9A9] border border-[#171817]/20 flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-Tab Navigation Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-1.5 bg-[#E6DAC0] border-b border-[#171817]/18 flex items-center gap-1.5 overflow-x-auto flex-nowrap heritage-scrollbar touch-pan-x shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-xs sm:text-[13px] font-semibold border-b-2 transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#A94F3D] text-[#A94F3D] bg-[#D8C9A9]/70 rounded-t-sm'
                : 'border-transparent text-[#171817]/70 hover:text-[#171817]'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>
              {lang === 'en'
                ? 'Account Settings'
                : lang === 'zh'
                ? '账户设置'
                : 'Cài đặt tài khoản'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs sm:text-[13px] font-semibold border-b-2 transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#A94F3D] text-[#A94F3D] bg-[#D8C9A9]/70 rounded-t-sm'
                : 'border-transparent text-[#171817]/70 hover:text-[#171817]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>
              {lang === 'en'
                ? 'Visit History'
                : lang === 'zh'
                ? '参观历史'
                : 'Lịch sử tham quan'}
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] tabular-nums bg-[#171817]/10 text-[#171817]/80">
              {visitHistory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2.5 text-xs sm:text-[13px] font-semibold border-b-2 transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'tickets'
                ? 'border-[#A94F3D] text-[#A94F3D] bg-[#D8C9A9]/70 rounded-t-sm'
                : 'border-transparent text-[#171817]/70 hover:text-[#171817]'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 shrink-0" />
            <span>
              {lang === 'en'
                ? 'Ticket History'
                : lang === 'zh'
                ? '购票记录'
                : 'Lịch sử mua vé'}
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] tabular-nums bg-[#A94F3D]/15 text-[#A94F3D]">
              {myPasses.length}
            </span>
          </button>
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 min-h-0 overflow-y-auto heritage-scrollbar p-5 sm:p-6 space-y-5 bg-[#D8C9A9]">
          {/* ================================================================
              TAB 1: CÀI ĐẶT TÀI KHOẢN
          ================================================================ */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              {/* Profile Info Form */}
              <form
                onSubmit={handleSaveProfile}
                className="rounded-sm bg-[#EDE3CE] border border-[#171817]/18 p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#171817]/12">
                  <div>
                    <h3 className="text-sm sm:text-base font-serif font-semibold text-[#171817]">
                      {lang === 'en'
                        ? 'Profile & Contact Information'
                        : lang === 'zh'
                        ? '个人资料与联系方式'
                        : 'Thông tin hồ sơ & Liên hệ'}
                    </h3>
                    <p className="text-xs text-[#171817]/70 mt-0.5">
                      {lang === 'en'
                        ? 'Synchronized with Firebase Authentication & Cloud Profile.'
                        : lang === 'zh'
                        ? '与 Firebase 账户和云端资料同步。'
                        : 'Đồng bộ trực tiếp với tài khoản của bạn trên hệ thống đám mây.'}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-[#47796D] inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{user.email || (user.provider === 'google' ? 'Google' : 'Facebook')}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="account-display-name"
                      className="block text-xs font-semibold text-[#171817]"
                    >
                      {lang === 'en'
                        ? 'Display Name'
                        : lang === 'zh'
                        ? '显示名称'
                        : 'Tên hiển thị'}
                    </label>
                    <input
                      id="account-display-name"
                      type="text"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder={
                        lang === 'en' ? 'Your full name' : lang === 'zh' ? '请输入姓名' : 'Nhập họ tên hiển thị'
                      }
                      className="w-full px-3.5 py-2 rounded-sm bg-[#F4EFE4] border border-[#171817]/20 text-xs sm:text-sm text-[#171817] focus:outline-none focus:border-[#A94F3D]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="account-phone"
                      className="block text-xs font-semibold text-[#171817]"
                    >
                      {lang === 'en'
                        ? 'Contact Phone Number'
                        : lang === 'zh'
                        ? '联系电话'
                        : 'Số điện thoại liên hệ'}
                    </label>
                    <input
                      id="account-phone"
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="0901 234 567"
                      className="w-full px-3.5 py-2 rounded-sm bg-[#F4EFE4] border border-[#171817]/20 text-xs sm:text-sm text-[#171817] tabular-nums focus:outline-none focus:border-[#A94F3D]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-xs font-semibold text-[#171817]/75">Email</span>
                    <div className="px-3.5 py-2 rounded-sm bg-[#E5D9BF] border border-[#171817]/15 text-xs sm:text-sm text-[#171817]/75 truncate">
                      {user.email || '—'}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-xs font-semibold text-[#171817]/75">
                      {lang === 'en' ? 'Account Role' : lang === 'zh' ? '账户角色' : 'Vai trò tài khoản'}
                    </span>
                    <div className="px-3.5 py-2 rounded-sm bg-[#E5D9BF] border border-[#171817]/15 text-xs sm:text-sm text-[#171817] font-medium">
                      {isAdmin
                        ? lang === 'en'
                          ? 'Administrator · Dấu Ấn Việt 3D'
                          : lang === 'zh'
                          ? '管理员 · Dấu Ấn Việt 3D'
                          : 'Quản trị viên · Dấu Ấn Việt 3D'
                        : lang === 'en'
                        ? 'Heritage Visitor'
                        : lang === 'zh'
                        ? '遗产访客'
                        : 'Du khách'}
                    </div>
                  </div>
                </div>

                {profileNotice && (
                  <div
                    className={`px-3.5 py-2 rounded-sm text-xs font-medium border ${
                      profileNotice.type === 'ok'
                        ? 'bg-[#47796D]/15 border-[#47796D]/40 text-[#2E5249]'
                        : 'bg-[#A94F3D]/15 border-[#A94F3D]/40 text-[#843728]'
                    }`}
                  >
                    {profileNotice.text}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-4 py-2 rounded-sm bg-[#171817] hover:bg-[#A94F3D] disabled:opacity-60 text-[#D8C9A9] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {isSavingProfile
                        ? lang === 'en'
                          ? 'Saving...'
                          : lang === 'zh'
                          ? '保存中...'
                          : 'Đang lưu...'
                        : lang === 'en'
                        ? 'Save Profile'
                        : lang === 'zh'
                        ? '保存资料'
                        : 'Lưu thông tin'}
                    </span>
                  </button>
                </div>
              </form>

              {/* Smart Security & Password Section */}
              <section className="rounded-sm bg-[#EDE3CE] border border-[#171817]/18 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#171817]/12">
                  <Lock className="w-4 h-4 text-[#A94F3D] shrink-0" />
                  <div>
                    <h3 className="text-sm sm:text-base font-serif font-semibold text-[#171817]">
                      {lang === 'en'
                        ? 'Password & Account Security'
                        : lang === 'zh'
                        ? '密码与账户安全'
                        : 'Đổi mật khẩu & Bảo mật'}
                    </h3>
                  </div>
                </div>

                {isGoogleLinkedAccount ? (
                  <div className="rounded-sm bg-[#F4EFE4] border border-[#47796D]/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-[#47796D] inline-flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {lang === 'en'
                            ? 'Protected by Google Account'
                            : lang === 'zh'
                            ? '由 Google 账户直接保护'
                            : 'Bảo mật trực tiếp qua Google'}
                        </span>
                      </div>
                      <p className="text-xs text-[#171817]/80 leading-relaxed">
                        {lang === 'en'
                          ? 'Your account is linked and secured directly through Google. To change your password or 2-step verification, manage it in your Google Security settings.'
                          : lang === 'zh'
                          ? '您的账户已直接关联并由 Google 保护。如需更改密码或两步验证，请前往 Google 安全中心管理。'
                          : 'Tài khoản của bạn đang liên kết và bảo mật trực tiếp qua Google. Bạn có thể quản lý mật khẩu và xác minh 2 bước tại trang bảo mật của Google.'}
                      </p>
                    </div>
                    <a
                      href="https://myaccount.google.com/security"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-sm bg-[#171817] hover:bg-[#47796D] text-[#D8C9A9] text-xs font-semibold inline-flex items-center justify-center gap-2 shrink-0 transition-colors"
                    >
                      <span>
                        {lang === 'en'
                          ? 'Google Security'
                          : lang === 'zh'
                          ? '前往 Google 安全'
                          : 'Quản lý tại Google'}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="account-current-pwd"
                          className="block text-xs font-semibold text-[#171817]"
                        >
                          {lang === 'en'
                            ? 'Current Password'
                            : lang === 'zh'
                            ? '当前密码'
                            : 'Mật khẩu hiện tại'}
                        </label>
                        <div className="relative">
                          <input
                            id="account-current-pwd"
                            type={showCurrentPwd ? 'text' : 'password'}
                            value={currentPwd}
                            onChange={(e) => setCurrentPwd(e.target.value)}
                            autoComplete="current-password"
                            className="w-full pl-3 pr-9 py-2 rounded-sm bg-[#F4EFE4] border border-[#171817]/20 text-xs text-[#171817] focus:outline-none focus:border-[#A94F3D]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPwd((p) => !p)}
                            aria-label="Hiện/ẩn mật khẩu hiện tại"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#171817]/55 hover:text-[#171817] cursor-pointer"
                          >
                            {showCurrentPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="account-new-pwd"
                          className="block text-xs font-semibold text-[#171817]"
                        >
                          {lang === 'en'
                            ? 'New Password (min 6)'
                            : lang === 'zh'
                            ? '新密码（至少6位）'
                            : 'Mật khẩu mới (>= 6 ký tự)'}
                        </label>
                        <div className="relative">
                          <input
                            id="account-new-pwd"
                            type={showNewPwd ? 'text' : 'password'}
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                            autoComplete="new-password"
                            className="w-full pl-3 pr-9 py-2 rounded-sm bg-[#F4EFE4] border border-[#171817]/20 text-xs text-[#171817] focus:outline-none focus:border-[#A94F3D]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPwd((p) => !p)}
                            aria-label="Hiện/ẩn mật khẩu mới"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#171817]/55 hover:text-[#171817] cursor-pointer"
                          >
                            {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="account-confirm-pwd"
                          className="block text-xs font-semibold text-[#171817]"
                        >
                          {lang === 'en'
                            ? 'Confirm New Password'
                            : lang === 'zh'
                            ? '确认新密码'
                            : 'Xác nhận mật khẩu mới'}
                        </label>
                        <input
                          id="account-confirm-pwd"
                          type={showNewPwd ? 'text' : 'password'}
                          value={confirmPwd}
                          onChange={(e) => setConfirmPwd(e.target.value)}
                          autoComplete="new-password"
                          className="w-full px-3 py-2 rounded-sm bg-[#F4EFE4] border border-[#171817]/20 text-xs text-[#171817] focus:outline-none focus:border-[#A94F3D]"
                        />
                      </div>
                    </div>

                    {pwdNotice && (
                      <div
                        className={`px-3.5 py-2 rounded-sm text-xs font-medium border ${
                          pwdNotice.type === 'ok'
                            ? 'bg-[#47796D]/15 border-[#47796D]/40 text-[#2E5249]'
                            : 'bg-[#A94F3D]/15 border-[#A94F3D]/40 text-[#843728]'
                        }`}
                      >
                        {pwdNotice.text}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isChangingPwd}
                        className="px-4 py-2 rounded-sm bg-[#A94F3D] hover:bg-[#8E3F30] disabled:opacity-60 text-[#D8C9A9] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          {isChangingPwd
                            ? lang === 'en'
                              ? 'Updating...'
                              : lang === 'zh'
                              ? '更新中...'
                              : 'Đang cập nhật...'
                            : lang === 'en'
                            ? 'Update Password'
                            : lang === 'zh'
                            ? '更改密码'
                            : 'Cập nhật mật khẩu'}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </section>

              {/* Admin-Only Current Login Session Card */}
              {isAdmin && currentAudit && (
                <section className="rounded-sm bg-[#171817] border border-[#C9A46A]/45 p-4 sm:p-5 text-[#D8C9A9] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C9A46A]">
                          <Shield className="w-3.5 h-3.5" />
                          <span>
                            {lang === 'en'
                              ? 'Current Admin Login Session'
                              : lang === 'zh'
                              ? '当前管理员登录会话'
                              : 'Phiên đăng nhập Quản trị viên hiện tại'}
                          </span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#47796D] text-[#F4EFE4] text-[10px] font-semibold">
                          {lang === 'en' ? 'Active' : lang === 'zh' ? '在线' : 'Phiên hiện tại'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#D8C9A9]/80 pt-1">
                        <span className="inline-flex items-center gap-1.5">
                          {renderSessionDeviceIcon(currentAudit.deviceType)}
                          <span>
                            {currentAudit.deviceLabel} · {currentAudit.os} · {currentAudit.browser}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-[#C9A46A]" />
                          <span>{currentAudit.formattedTimeVn}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#A94F3D]" />
                          <span>{currentAudit.locationDisplay}</span>
                        </span>
                      </div>
                    </div>

                    {onOpenAdminLoginAudit && (
                      <button
                        type="button"
                        onClick={onOpenAdminLoginAudit}
                        className="px-3.5 py-2 rounded-sm bg-[#C9A46A] hover:bg-[#D7B57E] text-[#171817] text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                      >
                        <span>
                          {lang === 'en'
                            ? 'Open Login Audit Log'
                            : lang === 'zh'
                            ? '打开登录审计日志'
                            : 'Mở Nhật ký Đăng nhập'}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Cross-Device Account Sync Code (Preserved) */}
              <section className="rounded-sm bg-[#EDE3CE] border border-[#171817]/18 p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-sm bg-[#C9A46A] border border-[#171817]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Smartphone className="w-4 h-4 text-[#171817]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-serif font-semibold text-[#171817]">
                        {lang === 'en'
                          ? 'Cross-Device Account Sync Code'
                          : lang === 'zh'
                          ? '跨设备账户同步码'
                          : 'Mã Đồng Bộ Tài Khoản Liên Thiết Bị'}
                      </h3>
                      <p className="text-xs text-[#171817]/75 leading-relaxed mt-0.5">
                        {lang === 'en'
                          ? 'Export a portable DAV3D- code containing your tier badge, QR tickets, certificates, and exploration progress.'
                          : lang === 'zh'
                          ? '将您的账户等级、二维码门票、证书与探索进度打包为 DAV3D- 同步码，立即恢复到其他设备。'
                          : 'Đóng gói toàn bộ hồ sơ, hạng tài khoản, vé QR, chứng nhận và tiến độ tham quan thành mã DAV3D- để kích hoạt trên thiết bị khác.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const code = buildAccountTransferCode({
                        id: user.id,
                        userId: user.userId,
                        provider: user.provider,
                        email: user.email,
                        displayName: user.displayName,
                        role: user.role,
                        isPrimaryAdmin: user.isPrimaryAdmin,
                        authMethod: user.authMethod,
                      });
                      setGeneratedTransferCode(code);
                      try {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          await navigator.clipboard.writeText(code);
                        }
                      } catch {
                        // fallback input remains visible
                      }
                      setTransferCodeCopied(true);
                      window.setTimeout(() => setTransferCodeCopied(false), 4000);
                    }}
                    className="px-4 py-2 rounded-sm bg-[#171817] hover:bg-[#A94F3D] text-[#D8C9A9] text-xs font-semibold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-colors"
                  >
                    {transferCodeCopied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'en'
                            ? 'Sync Code Copied'
                            : lang === 'zh'
                            ? '已复制同步码'
                            : 'Đã sao chép Mã Đồng Bộ'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'en'
                            ? 'Generate & Copy Sync Code'
                            : lang === 'zh'
                            ? '生成并复制同步码'
                            : 'Tạo & Sao chép Mã Đồng Bộ'}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {generatedTransferCode && (
                  <div className="pt-2 border-t border-[#171817]/15 space-y-1.5">
                    <div className="text-[11px] text-[#171817]/75">
                      {lang === 'en' ? (
                        <>
                          Paste the code below into{' '}
                          <strong className="text-[#171817]">Restore via Sync Code</strong> on your
                          other device:
                        </>
                      ) : lang === 'zh' ? (
                        <>
                          将下方同步码粘贴至新设备登录窗口的{' '}
                          <strong className="text-[#171817]">通过同步码恢复</strong> 栏位：
                        </>
                      ) : (
                        <>
                          Dán chuỗi mã bên dưới vào mục{' '}
                          <strong className="text-[#171817]">Khôi phục bằng Mã Đồng Bộ</strong> tại
                          cổng Đăng nhập trên thiết bị mới:
                        </>
                      )}
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={generatedTransferCode}
                      onFocus={(e) => e.currentTarget.select()}
                      aria-label="Mã Đồng Bộ Tài Khoản Liên Thiết Bị"
                      className="w-full px-3 py-2 rounded-sm bg-[#F4EFE4] border border-[#171817]/20 font-sans text-xs tabular-nums text-[#171817] focus:outline-none focus:border-[#A94F3D]"
                    />
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ================================================================
              TAB 2: LỊCH SỬ THAM QUAN
          ================================================================ */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Auto-Recorded Personal Visit Timeline */}
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#A94F3D]" />
                    <h3 className="text-sm sm:text-base font-serif font-semibold text-[#171817]">
                      {lang === 'en'
                        ? `Recent Visit Timeline (${visitHistory.length})`
                        : lang === 'zh'
                        ? `近期参观时间线 (${visitHistory.length})`
                        : `Dòng thời gian tham quan gần đây (${visitHistory.length})`}
                    </h3>
                  </div>

                  {visitHistory.length > 0 && (
                    !confirmClearHistory ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClearHistory(true)}
                        className="px-3 py-1.5 rounded-sm bg-[#EDE3CE] hover:bg-[#A94F3D] text-[#A94F3D] hover:text-[#D8C9A9] border border-[#A94F3D]/35 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'en'
                            ? 'Clear History'
                            : lang === 'zh'
                            ? '清除记录'
                            : 'Xóa lịch sử cá nhân'}
                        </span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#A94F3D]/15 border border-[#A94F3D]/40">
                        <span className="text-[11px] font-medium text-[#843728]">
                          {lang === 'en' ? 'Clear all?' : lang === 'zh' ? '确认清除？' : 'Xác nhận xóa?'}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleClearVisitHistory()}
                          className="px-2 py-0.5 rounded-sm bg-[#A94F3D] text-[#D8C9A9] text-[11px] font-semibold cursor-pointer"
                        >
                          {lang === 'en' ? 'Yes' : lang === 'zh' ? '确认' : 'Xóa'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearHistory(false)}
                          className="px-2 py-0.5 rounded-sm bg-[#EDE3CE] text-[#171817] text-[11px] cursor-pointer"
                        >
                          {lang === 'en' ? 'Cancel' : lang === 'zh' ? '取消' : 'Hủy'}
                        </button>
                      </div>
                    )
                  )}
                </div>

                {visitHistory.length === 0 ? (
                  <div className="rounded-sm border border-dashed border-[#171817]/25 bg-[#EDE3CE] p-6 text-center space-y-2">
                    <Compass className="w-7 h-7 text-[#526D8B] mx-auto" />
                    <p className="text-xs sm:text-sm text-[#171817]/80">
                      {lang === 'en'
                        ? 'Your 3D exploration and museum audio guide sessions will be automatically recorded here.'
                        : lang === 'zh'
                        ? '您在 3D 空间参观或收听博物馆语音导览的记录将自动保存在此处。'
                        : 'Mỗi khi bạn tham quan Không gian 3D hoặc nghe Thuyết minh bảo tàng, lịch sử sẽ tự động được ghi nhận tại đây.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {visitHistory.map((item) => {
                      const matchedSite = sites.find((s) => s.id === item.siteId);
                      const displaySiteName = matchedSite
                        ? getLocalizedSite(matchedSite).officialName
                        : item.siteName;
                      const is3d = item.activityType === '3d_explore';

                      return (
                        <div
                          key={item.id}
                          className="rounded-sm bg-[#EDE3CE] border border-[#171817]/18 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10.5px] font-semibold ${
                                  is3d
                                    ? 'bg-[#526D8B]/15 text-[#38506B] border border-[#526D8B]/35'
                                    : 'bg-[#C9A46A]/30 text-[#171817] border border-[#C9A46A]'
                                }`}
                              >
                                {is3d ? (
                                  <Box className="w-3 h-3" />
                                ) : (
                                  <Headphones className="w-3 h-3" />
                                )}
                                <span>
                                  {is3d
                                    ? lang === 'en'
                                      ? 'Explored in 3D'
                                      : lang === 'zh'
                                      ? '已探索 3D'
                                      : 'Đã khám phá 3D'
                                    : lang === 'en'
                                    ? 'Listened to Audio Guide'
                                    : lang === 'zh'
                                    ? '已收听语音讲解'
                                    : 'Đã nghe thuyết minh'}
                                </span>
                              </span>
                              <span className="text-[11px] text-[#171817]/65 tabular-nums">
                                {formatVietnamLoginTimestamp(item.visitedAt)}
                              </span>
                            </div>

                            <div className="text-sm font-serif font-semibold text-[#171817] truncate">
                              {displaySiteName}
                            </div>
                            <div className="text-[11px] text-[#171817]/70 truncate">
                              {item.routeTitle}
                            </div>
                          </div>

                          {matchedSite && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpen3D(matchedSite);
                              }}
                              className="px-3.5 py-1.5 rounded-sm bg-[#171817] hover:bg-[#A94F3D] text-[#D8C9A9] text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                            >
                              <span>
                                {lang === 'en'
                                  ? 'Visit Again'
                                  : lang === 'zh'
                                  ? '再次参观'
                                  : 'Tham quan lại'}
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Preserved Progress Overview: 17 3D Models */}
              <section className="space-y-3 pt-4 border-t border-[#171817]/18">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#526D8B]" />
                    <h3 className="text-sm font-serif font-semibold text-[#171817]">
                      {lang === 'en'
                        ? `17 3D Heritage Models Explored (${exploredSites.length}/${sites.length})`
                        : lang === 'zh'
                        ? `17 座 3D 遗产模型探索进度 (${exploredSites.length}/${sites.length})`
                        : `Tiến độ Tham quan 17 Mô hình 3D (${exploredSites.length}/${sites.length})`}
                    </h3>
                  </div>
                  <span className="text-[11px] font-sans text-[#171817]/70 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#47796D]" />
                    <span>
                      {lang === 'en' ? 'Auto-tracked' : lang === 'zh' ? '自动记录' : 'Tự động ghi nhận'}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {sites.map((site) => {
                    const visited = exploredIds.includes(site.id);
                    const loc = getLocalizedSite(site);
                    return (
                      <button
                        key={site.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpen3D(site);
                        }}
                        className={`p-3 rounded-sm border text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          visited
                            ? 'bg-[#47796D]/15 border-[#47796D] hover:bg-[#47796D]/25'
                            : 'bg-[#EDE3CE] border-[#171817]/18 hover:border-[#171817]/45'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-sans tabular-nums text-[#171817]/65">
                            {site.id}
                          </div>
                          <div className="text-xs font-medium text-[#171817] truncate">
                            {loc.officialName}
                          </div>
                        </div>
                        {visited ? (
                          <CheckCircle2 className="w-4 h-4 text-[#47796D] shrink-0" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#171817]/60 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Preserved Progress Overview: 9 Heritage Routes */}
              <section className="space-y-3 pt-4 border-t border-[#171817]/18">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-[#47796D]" />
                    <h3 className="text-sm font-serif font-semibold text-[#171817]">
                      {lang === 'en'
                        ? `9 Heritage Routes (${completedRouteIds.length}/${TOUR_ROUTES.length} completed)`
                        : lang === 'zh'
                        ? `9 条遗产路线 (${completedRouteIds.length}/${TOUR_ROUTES.length} 已完成)`
                        : `9 Tuyến Di sản Liên vùng (${completedRouteIds.length}/${TOUR_ROUTES.length} hoàn thành)`}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenMapRoutes();
                    }}
                    className="text-xs font-semibold text-[#A94F3D] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'en'
                        ? 'Open Map & Routes'
                        : lang === 'zh'
                        ? '打开地图与路线'
                        : 'Mở Bản đồ & Tuyến'}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TOUR_ROUTES.map((tour) => {
                    const done = completedRouteIds.includes(tour.id);
                    const locTour = getLocalizedTour(tour);
                    return (
                      <div
                        key={tour.id}
                        className={`p-3.5 rounded-sm border flex items-center justify-between gap-3 ${
                          done
                            ? 'bg-[#47796D]/15 border-[#47796D]'
                            : 'bg-[#EDE3CE] border-[#171817]/18'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#171817] truncate">
                            {locTour.title}
                          </div>
                          <div className="text-[11px] font-sans text-[#171817]/70 mt-0.5 tabular-nums">
                            {tour.sites.length}{' '}
                            {lang === 'en' ? 'stops' : lang === 'zh' ? '站' : 'trạm'} · ~
                            {tour.distanceKm} km
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-sans font-semibold shrink-0 ${
                            done ? 'text-[#47796D]' : 'text-[#171817]/60'
                          }`}
                        >
                          {done
                            ? lang === 'en'
                              ? 'Completed'
                              : lang === 'zh'
                              ? '已完成'
                              : 'Hoàn thành'
                            : lang === 'en'
                            ? 'In Progress'
                            : lang === 'zh'
                            ? '未完成'
                            : 'Chưa xong'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* ================================================================
              TAB 3: LỊCH SỬ MUA VÉ
          ================================================================ */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-[#A94F3D]" />
                  <h3 className="text-sm sm:text-base font-serif font-semibold text-[#171817]">
                    {lang === 'en'
                      ? `Booked E-Tickets & Certificates (${myPasses.length})`
                      : lang === 'zh'
                      ? `已预订电子门票与证书 (${myPasses.length})`
                      : `Danh sách Vé điện tử & Chứng nhận đã đặt (${myPasses.length})`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToTickets();
                  }}
                  className="px-3.5 py-1.5 rounded-sm bg-[#A94F3D] hover:bg-[#8E3F30] text-[#D8C9A9] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>
                    {lang === 'en'
                      ? 'Book More Tickets'
                      : lang === 'zh'
                      ? '继续购票'
                      : 'Đặt thêm vé mới'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {myPasses.length === 0 ? (
                <div className="rounded-sm border border-dashed border-[#171817]/25 bg-[#EDE3CE] p-8 text-center space-y-3">
                  <QrCode className="w-8 h-8 text-[#A94F3D] mx-auto" />
                  <p className="text-xs sm:text-sm text-[#171817]/80 max-w-md mx-auto">
                    {lang === 'en'
                      ? 'You have not booked any digital tickets or certificates yet. Visit Tickets & Study Materials to issue your personalized QR pass.'
                      : lang === 'zh'
                      ? '您尚未预订任何电子门票或证书。前往“门票与资料”领取专属二维码通票。'
                      : 'Tài khoản của bạn chưa có vé tham quan hoặc chứng nhận nào. Đặt vé trong mục Vé & Học liệu để nhận mã QR định danh riêng.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToTickets();
                    }}
                    className="px-5 py-2 rounded-sm bg-[#171817] hover:bg-[#A94F3D] text-[#D8C9A9] text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {lang === 'en'
                      ? 'Book Ticket & Get QR Now'
                      : lang === 'zh'
                      ? '立即预订并获取二维码'
                      : 'Đặt vé & Nhận mã QR ngay'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {myPasses.map((pass) => {
                    const statusMeta = getTicketStatusMeta(pass.status);
                    return (
                      <div
                        key={pass.id}
                        className="rounded-sm bg-[#EDE3CE] border border-[#171817]/20 p-4 flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-sans font-bold text-xs tabular-nums text-[#A94F3D]">
                              {pass.code}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-sm border text-[10.5px] font-semibold ${statusMeta.badgeClass}`}
                            >
                              {statusMeta.label}
                            </span>
                          </div>

                          <div className="text-sm font-serif font-semibold text-[#171817] line-clamp-2">
                            {pass.routeTitle || pass.label}
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-[#171817]/75">
                            <div className="inline-flex items-center gap-1.5 tabular-nums">
                              <Calendar className="w-3.5 h-3.5 text-[#526D8B] shrink-0" />
                              <span>{new Date(pass.issuedAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="text-right tabular-nums">
                              <span>
                                {lang === 'en' ? 'Qty: 1 ticket' : lang === 'zh' ? '数量：1 张' : 'Số lượng: 1 vé'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#171817]/12 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-[#171817]/60">
                                {lang === 'en' ? 'Total' : lang === 'zh' ? '总计' : 'Tổng tiền'}
                              </div>
                              <div className="text-xs font-bold text-[#A94F3D] tabular-nums">
                                {pass.amountLabel}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                disabled={resendingPassId === pass.id}
                                onClick={() => void handleResendPassEmail(pass)}
                                className="px-3 py-1.5 rounded-full bg-[#F4EFE4] hover:bg-[#C9A46A]/25 border border-[#171817]/25 text-[#171817] text-[11px] font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                              >
                                {resendingPassId === pass.id ? (
                                  <RotateCcw className="w-3 h-3 text-[#A94F3D] animate-spin" />
                                ) : (
                                  <Mail className="w-3 h-3 text-[#A94F3D]" />
                                )}
                                <span>
                                  {resendingPassId === pass.id
                                    ? 'Đang gửi...'
                                    : lang === 'en'
                                    ? 'Resend Thank-You Email'
                                    : lang === 'zh'
                                    ? '重发感谢邮件'
                                    : 'Gửi lại thư cảm ơn'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setActiveQrPass(pass)}
                                className="px-3.5 py-1.5 rounded-sm bg-[#171817] hover:bg-[#47796D] text-[#D8C9A9] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <QrCode className="w-3.5 h-3.5 text-[#C9A46A]" />
                                <span>
                                  {lang === 'en'
                                    ? 'View Ticket QR'
                                    : lang === 'zh'
                                    ? '查看门票二维码'
                                    : 'Xem mã QR vé'}
                                </span>
                              </button>
                            </div>
                          </div>

                          {resendPassNotice[pass.id] && (
                            <div
                              className={`text-[11px] leading-snug px-2.5 py-1.5 rounded-sm border ${
                                resendPassNotice[pass.id].type === 'ok'
                                  ? 'bg-[#47796D]/15 border-[#47796D]/45 text-[#171817]'
                                  : 'bg-[#A94F3D]/15 border-[#A94F3D]/45 text-[#A94F3D]'
                              }`}
                            >
                              {resendPassNotice[pass.id].text}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Focused QR E-Ticket Detail Overlay */}
        {activeQrPass && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`QR ${activeQrPass.code}`}
            onClick={() => setActiveQrPass(null)}
            className="absolute inset-0 z-20 bg-[#171817]/80 flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-sm bg-[#F4EFE4] border-2 border-[#C9A46A] p-5 space-y-4 text-[#171817] shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#171817]/15">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-[#A94F3D] uppercase tracking-wider">
                    {lang === 'en'
                      ? 'Official Digital E-Ticket'
                      : lang === 'zh'
                      ? '官方电子门票'
                      : 'Vé điện tử chính thức · Dấu Ấn Việt 3D'}
                  </div>
                  <div className="text-base font-serif font-semibold text-[#171817] mt-0.5">
                    {activeQrPass.routeTitle || activeQrPass.label}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveQrPass(null)}
                  aria-label="Đóng mã QR"
                  className="w-7 h-7 rounded-sm bg-[#EDE3CE] hover:bg-[#A94F3D] text-[#171817] hover:text-[#D8C9A9] flex items-center justify-center cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-center">
                <div className="w-52 h-52 rounded-sm bg-white p-2.5 border border-[#C9A46A] flex items-center justify-center">
                  {qrMap[activeQrPass.id] ? (
                    <img
                      src={qrMap[activeQrPass.id]}
                      alt={`QR ${activeQrPass.code}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-24 h-24 text-[#171817]" />
                  )}
                </div>
              </div>

              <div className="rounded-sm bg-[#EDE3CE] border border-[#171817]/15 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#171817]/70">
                    {lang === 'en' ? 'Ticket Code' : lang === 'zh' ? '票号' : 'Mã vé'}
                  </span>
                  <span className="font-bold text-[#A94F3D] tabular-nums">{activeQrPass.code}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#171817]/70">
                    {lang === 'en' ? 'Holder' : lang === 'zh' ? '持票人' : 'Chủ vé'}
                  </span>
                  <span className="font-semibold text-[#171817] truncate">
                    {activeQrPass.ownerName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#171817]/70">
                    {lang === 'en' ? 'Issued' : lang === 'zh' ? '出票时间' : 'Thời gian cấp'}
                  </span>
                  <span className="tabular-nums text-[#171817]">
                    {formatVietnamLoginTimestamp(activeQrPass.issuedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#171817]/70">
                    {lang === 'en' ? 'Amount' : lang === 'zh' ? '金额' : 'Tổng tiền'}
                  </span>
                  <span className="font-bold text-[#A94F3D] tabular-nums">
                    {activeQrPass.amountLabel}
                  </span>
                </div>
              </div>

              {resendPassNotice[activeQrPass.id] && (
                <div
                  className={`text-[11px] leading-snug px-3 py-2 rounded-sm border ${
                    resendPassNotice[activeQrPass.id].type === 'ok'
                      ? 'bg-[#47796D]/15 border-[#47796D]/45 text-[#171817]'
                      : 'bg-[#A94F3D]/15 border-[#A94F3D]/45 text-[#A94F3D]'
                  }`}
                >
                  {resendPassNotice[activeQrPass.id].text}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  disabled={resendingPassId === activeQrPass.id}
                  onClick={() => void handleResendPassEmail(activeQrPass)}
                  className="flex-1 py-2 px-3 rounded-full border border-[#171817]/30 bg-[#EDE3CE] hover:bg-[#C9A46A]/30 text-[#171817] text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {resendingPassId === activeQrPass.id ? (
                    <RotateCcw className="w-3.5 h-3.5 text-[#A94F3D] animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5 text-[#A94F3D]" />
                  )}
                  <span>
                    {resendingPassId === activeQrPass.id
                      ? 'Đang gửi...'
                      : lang === 'en'
                      ? 'Resend Thank-You Email'
                      : lang === 'zh'
                      ? '重发感谢邮件'
                      : 'Gửi lại thư cảm ơn'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveQrPass(null)}
                  className="flex-1 py-2 px-3 rounded-sm bg-[#171817] hover:bg-[#A94F3D] text-[#D8C9A9] text-xs font-semibold cursor-pointer transition-colors"
                >
                  {lang === 'en' ? 'Close E-Ticket' : lang === 'zh' ? '关闭电子票' : 'Đóng vé điện tử'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
