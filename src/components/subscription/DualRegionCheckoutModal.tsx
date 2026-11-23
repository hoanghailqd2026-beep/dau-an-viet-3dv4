import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Globe,
  Mail,
  QrCode,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth, type AuthUser } from '../../contexts/AuthContext';
import { DEFAULT_HERITAGE_SITES } from '../../data/heritageSites';
import { TOUR_ROUTES } from '../../data/tours';
import { HeritageSitePickerDropdown } from '../common/HeritageSiteDropdown';
import {
  sendOrderThankYouEmail,
  type EmailSendResult,
} from '../../utils/emailAutoSender';
import {
  OPEN_PLAN_CHECKOUT_EVENT,
  PAYMENT_QR_CONFIG_UPDATED_EVENT,
  PLAN_PRICING,
  PaymentMethodType,
  PaymentOrderRecord,
  PaymentQrConfig,
  PlanCheckoutRequest,
  completePlanPurchase,
  consumePendingCheckoutRequest,
  generateTransferMemo,
  getPlanDisplayName,
  loadPaymentQrConfig,
  pullPaymentQrConfigFromFirebase,
  setPendingCheckoutRequest,
  updatePaymentOrderEmailStatus,
} from '../../utils/subscriptionGatingStore';

interface DualRegionCheckoutModalProps {
  externalRequest?: PlanCheckoutRequest | null;
  onCloseExternal?: () => void;
  onPurchaseSuccess?: (order: PaymentOrderRecord) => void;
}

type CheckoutRegionTab = 'vn_vietqr' | 'intl_usd';
type IntlPaymentSubMethod = 'express' | 'card';

// Clean minimal SVG brand marks (zero emojis)
const VietQrBadgeSvg: React.FC = () => (
  <svg viewBox="0 0 92 24" className="h-5 w-auto" aria-label="VietQR">
    <rect x="0.5" y="0.5" width="91" height="23" rx="4" fill="#FFFFFF" stroke="#D1D5DB" />
    <text
      x="12"
      y="16"
      fill="#A94F3D"
      fontSize="12"
      fontWeight="800"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
      letterSpacing="-0.4"
    >
      Viet
    </text>
    <text
      x="38"
      y="16"
      fill="#1E3A8A"
      fontSize="12"
      fontWeight="900"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
      letterSpacing="-0.2"
    >
      QR
    </text>
    <rect x="61" y="6" width="3" height="3" fill="#A94F3D" />
    <rect x="66" y="6" width="3" height="3" fill="#1E3A8A" />
    <rect x="61" y="11" width="3" height="3" fill="#1E3A8A" />
    <rect x="66" y="11" width="3" height="3" fill="#A94F3D" />
    <rect x="71" y="6" width="3" height="8" fill="#1E3A8A" />
    <rect x="76" y="6" width="3" height="3" fill="#A94F3D" />
    <rect x="76" y="11" width="3" height="3" fill="#1E3A8A" />
  </svg>
);

const Napas247BadgeSvg: React.FC = () => (
  <svg viewBox="0 0 96 24" className="h-5 w-auto" aria-label="Napas 247">
    <rect x="0.5" y="0.5" width="95" height="23" rx="4" fill="#FFFFFF" stroke="#D1D5DB" />
    <text
      x="9"
      y="15.5"
      fill="#0F4C81"
      fontSize="10.5"
      fontWeight="800"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
    >
      napas
    </text>
    <text
      x="46"
      y="15.5"
      fill="#16A34A"
      fontSize="10.5"
      fontWeight="900"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
    >
      247
    </text>
    <path d="M72 15.5L78 8.5H83L77 15.5H72Z" fill="#0F4C81" />
    <path d="M80 15.5L86 8.5H89L83 15.5H80Z" fill="#16A34A" />
  </svg>
);

const AppleLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
  </svg>
);

const GoogleGLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.56-5.15 3.56-8.65z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28V6.62H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.38l4-3.1z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.94 1.19 15.23 0 12 0 7.31 0 3.26 2.69 1.29 6.62l4 3.1C6.23 6.88 8.88 4.77 12 4.77z"
    />
  </svg>
);

const PayPalMarkSvg: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto' }) => (
  <svg viewBox="0 0 76 20" className={className} aria-label="PayPal">
    <text
      x="0"
      y="15"
      fill="#003087"
      fontSize="15"
      fontWeight="900"
      fontStyle="italic"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
    >
      Pay
    </text>
    <text
      x="28"
      y="15"
      fill="#0079C1"
      fontSize="15"
      fontWeight="900"
      fontStyle="italic"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
    >
      Pal
    </text>
  </svg>
);

const CardBrandBadgesSvg: React.FC = () => (
  <div className="flex items-center gap-1.5">
    {/* Visa */}
    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-white text-[#1A1F71] text-[9px] font-black italic tracking-tighter border border-black/10">
      VISA
    </span>
    {/* Mastercard */}
    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-white border border-black/10">
      <svg viewBox="0 0 24 14" className="h-2.5 w-auto" aria-label="Mastercard">
        <circle cx="8" cy="7" r="6" fill="#EB001B" />
        <circle cx="16" cy="7" r="6" fill="#F79E1B" fillOpacity="0.88" />
      </svg>
    </span>
    {/* Discover */}
    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-white text-[#171817] text-[8px] font-extrabold tracking-tight border border-black/10">
      DISCOVER
    </span>
  </div>
);

const ExpressBrandBadgesSvg: React.FC = () => (
  <div className="flex items-center gap-1.5">
    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#FFC439] text-[#003087] text-[8.5px] font-black italic">
      PayPal
    </span>
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black text-white text-[8.5px] font-semibold">
      <AppleLogoSvg className="w-2.5 h-2.5" />
      Pay
    </span>
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-[#171817] text-[8.5px] font-bold border border-black/15">
      <GoogleGLogoSvg className="w-2.5 h-2.5" />
      Pay
    </span>
  </div>
);

export const DualRegionCheckoutModal: React.FC<DualRegionCheckoutModalProps> = ({
  externalRequest,
  onCloseExternal,
  onPurchaseSuccess,
}) => {
  const { lang } = useI18n();
  const { user, isAuthModalOpen, openAuthModal, refreshEntitlements } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const [internalRequest, setInternalRequest] = useState<PlanCheckoutRequest | null>(null);
  const activeRequest = externalRequest ?? internalRequest;

  const [regionTab, setRegionTab] = useState<CheckoutRegionTab>(
    lang === 'vi' ? 'vn_vietqr' : 'intl_usd'
  );
  const [intlMethod, setIntlMethod] = useState<IntlPaymentSubMethod>('express');

  // Plan scope customization inside modal (especially for Plus & School)
  const [selectedTier, setSelectedTier] = useState<'plus' | 'pro' | 'school'>('pro');
  const [plusScopeType, setPlusScopeType] = useState<'site' | 'route'>('route');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(DEFAULT_HERITAGE_SITES[0].id);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(TOUR_ROUTES[0].id);
  const [schoolName, setSchoolName] = useState<string>('');
  const [schoolProvince, setSchoolProvince] = useState<string>('TP. Hồ Chí Minh');

  // VietQR state
  const [qrConfig, setQrConfig] = useState<PaymentQrConfig>(() => loadPaymentQrConfig());
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState<string>('');
  const [transferMemo, setTransferMemo] = useState<string>(() => generateTransferMemo('pro'));
  const [copiedMemo, setCopiedMemo] = useState<boolean>(false);

  // International Card form state
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvc, setCardCvc] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardError, setCardError] = useState<string>('');

  // Processing & Completed state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<PaymentOrderRecord | null>(null);
  const [receiptEmail, setReceiptEmail] = useState<string>(user?.email || '');
  const [receiptEmailError, setReceiptEmailError] = useState<string>('');
  const [lastEmailResult, setLastEmailResult] = useState<EmailSendResult | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState<boolean>(false);

  // Global Checkout Authentication Firewall: block VietQR / USD gateway when !user and stash selected package
  useEffect(() => {
    const onOpen = (e: Event) => {
      const custom = e as CustomEvent<PlanCheckoutRequest>;
      if (!custom.detail) return;
      if (!userRef.current) {
        setPendingCheckoutRequest(custom.detail);
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
      setInternalRequest(custom.detail);
    };
    window.addEventListener(OPEN_PLAN_CHECKOUT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PLAN_CHECKOUT_EVENT, onOpen);
  }, [lang, openAuthModal]);

  // Guard externalRequest prop if caller passes one while logged out
  useEffect(() => {
    if (!externalRequest || user) return;
    setPendingCheckoutRequest(externalRequest);
    if (onCloseExternal) onCloseExternal();
    openAuthModal({
      prompt:
        lang === 'en'
          ? 'Please sign in to activate and permanently store your digital ticket.'
          : lang === 'zh'
          ? '请登录账号以激活并永久保存您的电子门票。'
          : 'Vui lòng đăng nhập tài khoản để kích hoạt và lưu trữ vé điện tử vĩnh viễn.',
    });
  }, [externalRequest, user, lang, onCloseExternal, openAuthModal]);

  // Resume pending checkout automatically upon login; close checkout immediately on logout
  useEffect(() => {
    if (!user) {
      setInternalRequest(null);
      setCompletedOrder(null);
      return;
    }
    const pending = consumePendingCheckoutRequest();
    if (pending) {
      setInternalRequest(pending);
    }
  }, [user]);

  // Clear pending checkout if visitor dismisses AuthModal without signing in
  useEffect(() => {
    if (!isAuthModalOpen && !user) {
      setPendingCheckoutRequest(null);
    }
  }, [isAuthModalOpen, user]);

  // Sync Admin-configured VietQR image
  useEffect(() => {
    const syncQr = () => setQrConfig(loadPaymentQrConfig());
    window.addEventListener(PAYMENT_QR_CONFIG_UPDATED_EVENT, syncQr);
    return () => window.removeEventListener(PAYMENT_QR_CONFIG_UPDATED_EVENT, syncQr);
  }, []);

  // Initialize modal state whenever a new request opens
  useEffect(() => {
    if (!activeRequest) return;
    setRegionTab(lang === 'vi' ? 'vn_vietqr' : 'intl_usd');
    setSelectedTier(activeRequest.planTier);
    if (activeRequest.plusScopeType) {
      setPlusScopeType(activeRequest.plusScopeType);
    } else if (activeRequest.siteId) {
      setPlusScopeType('site');
    } else {
      setPlusScopeType('route');
    }
    if (activeRequest.siteId) setSelectedSiteId(activeRequest.siteId);
    if (activeRequest.routeId) setSelectedRouteId(activeRequest.routeId);
    if (activeRequest.schoolName) setSchoolName(activeRequest.schoolName);
    if (activeRequest.schoolProvince) setSchoolProvince(activeRequest.schoolProvince);
    setTransferMemo(generateTransferMemo(activeRequest.planTier));
    setCompletedOrder(null);
    setCardError('');
    setReceiptEmailError('');
    setLastEmailResult(null);
    setReceiptEmail(user?.email || '');
    setIsProcessing(false);
    void pullPaymentQrConfigFromFirebase().then(setQrConfig);
  }, [activeRequest, lang, user?.email]);

  // Update transfer memo prefix if user switches tier inside modal
  useEffect(() => {
    setTransferMemo(generateTransferMemo(selectedTier));
  }, [selectedTier]);

  const pricing = PLAN_PRICING[selectedTier];

  const scopeSummary = useMemo(() => {
    if (selectedTier === 'school') {
      const name = schoolName.trim() || 'Trường học Đối tác';
      return {
        label:
          lang === 'en'
            ? `School EdTech License · ${name} (${schoolProvince})`
            : lang === 'zh'
            ? `学校年度授权 · ${name}（${schoolProvince}）`
            : `Gói Học Liệu Trường Học · ${name} (${schoolProvince})`,
        siteIds: DEFAULT_HERITAGE_SITES.map((s) => s.id),
        routeIds: TOUR_ROUTES.map((r) => r.id),
      };
    }
    if (selectedTier === 'pro') {
      return {
        label:
          lang === 'en'
            ? 'Pro All-Access Pass · All 17 Landmarks'
            : lang === 'zh'
            ? 'Pro 全景通票 · 全部 17 处地标'
            : 'Vé Pro Toàn Diện · Toàn bộ 17 di tích',
        siteIds: DEFAULT_HERITAGE_SITES.map((s) => s.id),
        routeIds: TOUR_ROUTES.map((r) => r.id),
      };
    }
    if (plusScopeType === 'site') {
      const site =
        DEFAULT_HERITAGE_SITES.find((s) => s.id === selectedSiteId) || DEFAULT_HERITAGE_SITES[0];
      return {
        label:
          lang === 'en'
            ? `Plus Pass · Landmark: ${site.officialName}`
            : lang === 'zh'
            ? `Plus 通票 · 单点：${site.officialName}`
            : `Vé Plus · Di tích: ${site.officialName}`,
        siteIds: [site.id],
        routeIds: [],
      };
    }
    const route = TOUR_ROUTES.find((r) => r.id === selectedRouteId) || TOUR_ROUTES[0];
    return {
      label:
        lang === 'en'
          ? `Plus Pass · ${route.title}`
          : lang === 'zh'
          ? `Plus 通票 · ${route.title}`
          : `Vé Plus · ${route.title}`,
      siteIds: [...route.sites],
      routeIds: [route.id],
    };
  }, [selectedTier, plusScopeType, selectedSiteId, selectedRouteId, schoolName, schoolProvince, lang]);

  // Auto-generate crisp VietQR fallback QR code if Admin hasn't uploaded an image
  useEffect(() => {
    if (!activeRequest || qrConfig.qrImageDataUrl) {
      setGeneratedQrDataUrl('');
      return;
    }
    const qrPayload = [
      'VIETQR|NAPAS247',
      `BANK:${qrConfig.bankName}`,
      `ACC:${qrConfig.accountNumber}`,
      `NAME:${qrConfig.accountHolder}`,
      `AMOUNT:${pricing.vnd}`,
      `MEMO:${transferMemo}`,
    ].join('|');

    let cancelled = false;
    void QRCode.toDataURL(qrPayload, {
      width: 240,
      margin: 1,
      color: { dark: '#171817', light: '#FFFFFF' },
    })
      .then((url) => {
        if (!cancelled) setGeneratedQrDataUrl(url);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activeRequest, qrConfig, pricing.vnd, transferMemo]);

  if (!activeRequest || !user) return null;

  const closeModal = () => {
    setInternalRequest(null);
    setCompletedOrder(null);
    if (onCloseExternal) onCloseExternal();
  };

  const handleCopyMemo = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(transferMemo).catch(() => undefined);
    }
    setCopiedMemo(true);
    window.setTimeout(() => setCopiedMemo(false), 1800);
  };

  const executePurchase = async (
    region: CheckoutRegionTab,
    paymentMethod: PaymentMethodType,
    paymentMethodLabel: string,
    overrideUser?: {
      uid: string;
      userId: string;
      email: string;
      displayName: string;
      provider?: 'google' | 'facebook';
    }
  ) => {
    const actor = overrideUser || (user
      ? {
          uid: user.firebaseUid || user.userId,
          userId: user.userId,
          email: user.email,
          displayName: user.displayName,
          provider: user.provider,
        }
      : null);

    if (!actor) {
      openAuthModal({
        prompt:
          lang === 'en'
            ? 'Sign in to bind your pass & unlock features permanently'
            : lang === 'zh'
            ? '登录以绑定通行证并永久解锁功能'
            : 'Đăng nhập để gắn vé điện tử & mở khóa tính năng theo tài khoản',
        onSuccess: (signedInUser: AuthUser) => {
          void executePurchase(region, paymentMethod, paymentMethodLabel, {
            uid: signedInUser.firebaseUid || signedInUser.userId,
            userId: signedInUser.userId,
            email: signedInUser.email,
            displayName: signedInUser.displayName,
            provider: signedInUser.provider,
          });
        },
      });
      return;
    }

    const resolvedEmail = (receiptEmail.trim() || actor.email || '').trim();
    const hasProfileEmail = Boolean(actor.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(actor.email.trim()));
    if (!resolvedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail)) {
      if (!hasProfileEmail) {
        setReceiptEmailError(
          lang === 'en'
            ? 'Please enter a valid Gmail address to receive your e-ticket and thank-you letter.'
            : lang === 'zh'
            ? '请填写有效的电子邮箱以接收电子门票和感谢信。'
            : 'Vui lòng nhập địa chỉ Email Gmail hợp lệ để nhận mã vé điện tử & thư cảm ơn.'
        );
        return;
      }
    }
    setReceiptEmailError('');

    setIsProcessing(true);
    try {
      const result = await completePlanPurchase({
        uid: actor.uid,
        userId: actor.userId,
        email: resolvedEmail || actor.email,
        displayName: actor.displayName,
        provider: actor.provider,
        planTier: selectedTier,
        plusScopeType: selectedTier === 'plus' ? plusScopeType : undefined,
        siteIds: scopeSummary.siteIds,
        routeIds: scopeSummary.routeIds,
        scopeLabel: scopeSummary.label,
        region,
        paymentMethod,
        paymentMethodLabel,
        transferMemo: region === 'vn_vietqr' ? transferMemo : undefined,
        schoolName: selectedTier === 'school' ? schoolName.trim() || 'Trường học Đối tác' : undefined,
        schoolProvince: selectedTier === 'school' ? schoolProvince : undefined,
      });
      refreshEntitlements();
      setCompletedOrder(result.order);
      setLastEmailResult(result.emailResult);
      if (onPurchaseSuccess) onPurchaseSuccess(result.order);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendCompletedOrderEmail = async () => {
    if (!completedOrder || isResendingEmail) return;
    setIsResendingEmail(true);
    try {
      const res = await sendOrderThankYouEmail(
        {
          toEmail: completedOrder.email,
          customerName: completedOrder.customerName || 'Quý khách',
          planName: completedOrder.planName || getPlanDisplayName(completedOrder.planTier),
          scope:
            completedOrder.planTier === 'pro' || completedOrder.planTier === 'school'
              ? 'Toàn bộ 17 di tích'
              : completedOrder.scopeLabel,
          orderCode: completedOrder.orderId,
          amount: completedOrder.amountDisplay,
        },
        { requireEnabled: false }
      );
      setLastEmailResult(res);
      if (res.ok) {
        await updatePaymentOrderEmailStatus(completedOrder.orderId, true);
        setCompletedOrder((prev) =>
          prev ? { ...prev, emailSent: true, emailSentAt: new Date().toISOString() } : prev
        );
      }
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) {
      setCardError(
        lang === 'en'
          ? 'Please enter a valid 16-digit card number.'
          : lang === 'zh'
          ? '请输入有效的信用卡/借记卡号。'
          : 'Vui lòng nhập số thẻ quốc tế hợp lệ (13–19 chữ số).'
      );
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry.trim())) {
      setCardError(
        lang === 'en'
          ? 'Please enter expiry date in MM/YY format.'
          : lang === 'zh'
          ? '请按 MM/YY 格式输入有效期。'
          : 'Vui lòng nhập ngày hết hạn theo định dạng MM/YY.'
      );
      return;
    }
    if (!/^\d{3,4}$/.test(cardCvc.trim())) {
      setCardError(
        lang === 'en'
          ? 'Please enter a 3 or 4 digit CVC security code.'
          : lang === 'zh'
          ? '请输入 3 或 4 位安全码（CVC）。'
          : 'Vui lòng nhập mã bảo mật CVC (3–4 chữ số).'
      );
      return;
    }
    if (cardHolder.trim().length < 2) {
      setCardError(
        lang === 'en'
          ? 'Please enter the cardholder name.'
          : lang === 'zh'
          ? '请输入持卡人姓名。'
          : 'Vui lòng nhập tên chủ thẻ.'
      );
      return;
    }
    setCardError('');
    const last4 = digits.slice(-4);
    const brand = digits.startsWith('4')
      ? 'Visa'
      : digits.startsWith('5') || digits.startsWith('2')
      ? 'Mastercard'
      : 'Discover';
    void executePurchase('intl_usd', 'card', `${brand} •••• ${last4}`);
  };

  const formatCardNumberInput = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryInput = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length <= 2) return clean;
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/82 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dual-checkout-title"
      onClick={closeModal}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-[#171817] border border-[#C9A46A]/45 shadow-2xl overflow-hidden text-[#D8C9A9] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#A94F3D] via-[#C9A46A] to-[#47796D]" />

        {/* Header */}
        <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A46A]">
              {lang === 'en'
                ? 'DUAL-REGION MUSEUM CHECKOUT'
                : lang === 'zh'
                ? '双区域博物馆数字票务结账'
                : 'CỔNG THANH TOÁN HAI KHU VỰC · DẤU ẤN VIỆT 3D'}
            </p>
            <h3
              id="dual-checkout-title"
              className="text-lg sm:text-xl font-serif font-bold text-[#F5EFE6] mt-0.5"
            >
              {completedOrder
                ? lang === 'en'
                  ? 'Access Unlocked Successfully'
                  : lang === 'zh'
                  ? '通行证已激活，功能已解锁'
                  : 'Kích hoạt gói & Mở khóa thành công'
                : lang === 'en'
                ? 'Complete Your Heritage Pass'
                : lang === 'zh'
                ? '完成数字遗产通行证订阅'
                : 'Hoàn tất đăng ký Gói Trải Nghiệm'}
            </h3>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-lg text-[#D8C9A9]/60 hover:text-[#F5EFE6] hover:bg-white/5 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-7 max-h-[82vh] overflow-y-auto space-y-5">
          {completedOrder ? (
            /* ================= SUCCESS CONFIRMATION ================= */
            <div className="space-y-5 py-2">
              <div className="rounded-2xl bg-[#47796D]/15 border border-[#47796D]/45 p-5 flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-[#47796D] shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-base font-bold text-[#F5EFE6]">
                    {lang === 'en'
                      ? 'Your package is now active!'
                      : lang === 'zh'
                      ? '您的套餐已生效，状态已更新为「使用中」！'
                      : 'Gói trải nghiệm đã chuyển sang trạng thái “Đang sử dụng”!'}
                  </p>
                  <p className="text-xs text-[#D8C9A9]/85 leading-relaxed">
                    {lang === 'en'
                      ? 'All corresponding 3D modes, multilingual audio guides, and Royal Historiographer privileges have been unlocked immediately and synced to your Account & Tickets history.'
                      : lang === 'zh'
                      ? '对应的 3D 拆解/透视/室内模式、三语语音导览与深度史官功能已立即解锁，并同步至「账户与我的门票」。'
                      : 'Toàn bộ tính năng của gói đã được mở khóa tức thì và lưu mã vé điện tử vào mục Tài khoản & Vé của tôi -> Lịch sử mua vé.'}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[#1F211F] border border-[#C9A46A]/25 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#D8C9A9]/55 block">Mã đơn hàng</span>
                  <span className="font-mono font-bold text-[#F5EFE6]">{completedOrder.orderId}</span>
                </div>
                <div>
                  <span className="text-[#D8C9A9]/55 block">Phương thức</span>
                  <span className="font-semibold text-[#C9A46A]">
                    {completedOrder.region === 'vn_vietqr' ? 'VietQR Nội địa' : 'Quốc tế USD'} ·{' '}
                    {completedOrder.paymentMethodLabel}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[#D8C9A9]/55 block">Phạm vi kích hoạt</span>
                  <span className="font-semibold text-[#F5EFE6]">{completedOrder.scopeLabel}</span>
                </div>
                <div>
                  <span className="text-[#D8C9A9]/55 block">Số tiền</span>
                  <span className="font-mono font-bold text-[#47796D] text-sm">
                    {completedOrder.amountDisplay}
                  </span>
                </div>
                <div>
                  <span className="text-[#D8C9A9]/55 block">Gmail nhận vé &amp; thư cảm ơn</span>
                  <span className="font-medium text-[#F5EFE6] break-all">
                    {completedOrder.email}
                  </span>
                </div>
                {completedOrder.schoolCode && (
                  <div className="sm:col-span-2">
                    <span className="text-[#D8C9A9]/55 block">Mã kích hoạt trường học</span>
                    <span className="font-mono font-bold text-[#C9A46A] text-sm">
                      {completedOrder.schoolCode}
                    </span>
                  </div>
                )}
              </div>

              {/* Automated Gmail Thank-You & Sử Quan Confirmation Status */}
              <div className="rounded-xl bg-[#1C1D1B] border border-[#C9A46A]/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 text-xs">
                  <Mail className="w-4 h-4 text-[#C9A46A] shrink-0 mt-0.5" strokeWidth={1.7} />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[#F5EFE6]">
                      {completedOrder.emailSent
                        ? `Thư tri ân kèm mã vé điện tử đã được gửi tới ${completedOrder.email}.`
                        : lastEmailResult?.error
                        ? lastEmailResult.error
                        : `Sử Quan Dấu Ấn đã ghi nhận xác nhận đơn ${completedOrder.orderId} trong khung trò chuyện.`}
                    </p>
                    <p className="text-[11px] text-[#D8C9A9]/70">
                      Kiểm tra tin nhắn xác nhận từ Sử Quan Dấu Ấn ở góc dưới phải hoặc bấm gửi lại thư bất cứ lúc nào.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isResendingEmail}
                  onClick={() => void handleResendCompletedOrderEmail()}
                  className="px-3.5 py-2 rounded-full border border-[#C9A46A]/60 hover:bg-[#C9A46A]/15 text-[#D8C9A9] text-xs font-medium inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors disabled:opacity-55"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-[#C9A46A] ${isResendingEmail ? 'animate-spin' : ''}`} />
                  <span>{isResendingEmail ? 'Đang gửi...' : 'Gửi lại thư cảm ơn'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-full py-3.5 rounded-xl bg-[#C9A46A] hover:bg-[#b89258] text-[#171817] font-bold text-sm transition-colors cursor-pointer"
              >
                {lang === 'en'
                  ? 'Start Exploring Now'
                  : lang === 'zh'
                  ? '立即开始体验'
                  : 'Bắt đầu trải nghiệm ngay'}
              </button>
            </div>
          ) : (
            <>
              {/* 1. Plan & Scope Selector Summary */}
              <div className="rounded-xl bg-[#1F211F] border border-[#C9A46A]/25 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A46A]">
                    {lang === 'en' ? 'Selected Package' : lang === 'zh' ? '已选套餐' : 'Gói đã chọn'}
                  </span>
                  <div className="inline-flex rounded-lg bg-[#171817] p-0.5 border border-white/10">
                    {(['plus', 'pro', 'school'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTier(t)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                          selectedTier === t
                            ? 'bg-[#C9A46A] text-[#171817]'
                            : 'text-[#D8C9A9]/70 hover:text-[#F5EFE6]'
                        }`}
                      >
                        {t === 'plus' ? 'Plus' : t === 'pro' ? 'Pro 17' : 'Trường học'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plus Scope Picker: 1 Monument OR 1 Route */}
                {selectedTier === 'plus' && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPlusScopeType('route')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          plusScopeType === 'route'
                            ? 'border-[#C9A46A] bg-[#C9A46A]/15 text-[#F5EFE6]'
                            : 'border-white/10 bg-[#171817] text-[#D8C9A9]/70'
                        }`}
                      >
                        {lang === 'en'
                          ? '1 Heritage Route (9 Routes)'
                          : lang === 'zh'
                          ? '1 条主题路线（共 9 条）'
                          : '1 Tuyến Di sản (9 Tuyến)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlusScopeType('site')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          plusScopeType === 'site'
                            ? 'border-[#C9A46A] bg-[#C9A46A]/15 text-[#F5EFE6]'
                            : 'border-white/10 bg-[#171817] text-[#D8C9A9]/70'
                        }`}
                      >
                        {lang === 'en'
                          ? '1 Individual Landmark (17 Sites)'
                          : lang === 'zh'
                          ? '1 处单点古迹（共 17 处）'
                          : '1 Di tích đơn lẻ (17 Di tích)'}
                      </button>
                    </div>

                    {plusScopeType === 'route' ? (
                      <select
                        value={selectedRouteId}
                        onChange={(e) => setSelectedRouteId(e.target.value)}
                        className="w-full rounded-lg bg-[#171817] border border-[#C9A46A]/35 px-3 py-2 text-xs text-[#F5EFE6] focus:outline-none focus:border-[#C9A46A]"
                      >
                        {TOUR_ROUTES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title} ({r.sites.length} di tích)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <HeritageSitePickerDropdown
                        sites={DEFAULT_HERITAGE_SITES}
                        selectedSiteId={selectedSiteId}
                        onSelectSite={(s) => setSelectedSiteId(s.id)}
                        headingLabel={
                          lang === 'en'
                            ? 'SELECT INDIVIDUAL MONUMENT'
                            : lang === 'zh'
                            ? '选择单点历史遗迹'
                            : 'CHỌN DI TÍCH ĐƠN LẺ'
                        }
                        dropdownWidthClass="w-full"
                      />
                    )}
                  </div>
                )}

                {/* School details input */}
                {selectedTier === 'school' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder={
                        lang === 'en'
                          ? 'School / Institution name...'
                          : lang === 'zh'
                          ? '学校或教育机构名称...'
                          : 'Tên Trường học / Đơn vị giáo dục...'
                      }
                      className="rounded-lg bg-[#171817] border border-[#C9A46A]/35 px-3 py-2 text-xs text-[#F5EFE6] placeholder:text-[#D8C9A9]/40 focus:outline-none focus:border-[#C9A46A]"
                    />
                    <select
                      value={schoolProvince}
                      onChange={(e) => setSchoolProvince(e.target.value)}
                      className="rounded-lg bg-[#171817] border border-[#C9A46A]/35 px-3 py-2 text-xs text-[#F5EFE6] focus:outline-none focus:border-[#C9A46A]"
                    >
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Bình Dương">Bình Dương</option>
                      <option value="Bà Rịa - Vũng Tàu">Bà Rịa - Vũng Tàu</option>
                      <option value="Khu vực khác / Quốc tế">Khu vực khác / Quốc tế</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-xs font-medium text-[#F5EFE6] truncate pr-3">
                    {scopeSummary.label}
                  </span>
                  <span className="font-mono font-bold text-base text-[#C9A46A] shrink-0">
                    {regionTab === 'vn_vietqr' ? pricing.vndLabel : pricing.usdLabel}
                  </span>
                </div>
              </div>

              {/* Gmail Recipient Input (shown directly when user has no email on profile, or compact editable field) */}
              {(!user?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim())) && (
                <div className="rounded-xl bg-[#1C1D1B] border border-[#C9A46A]/35 p-3.5 space-y-1.5">
                  <label
                    htmlFor="checkout-gmail-recipient"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#C9A46A]"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
                    <span>
                      {lang === 'en'
                        ? 'Gmail Address for E-Ticket & Thank-You Letter'
                        : lang === 'zh'
                        ? '接收电子门票与感谢信的 Gmail 邮箱'
                        : 'Email Gmail nhận vé & thư cảm ơn'}
                    </span>
                  </label>
                  <input
                    id="checkout-gmail-recipient"
                    type="email"
                    value={receiptEmail}
                    onChange={(e) => {
                      setReceiptEmail(e.target.value);
                      if (receiptEmailError) setReceiptEmailError('');
                    }}
                    placeholder="example@gmail.com"
                    className="w-full rounded-lg bg-[#141514] border border-[#C9A46A]/30 px-3 py-2 text-xs sm:text-sm text-[#F5EFE6] placeholder:text-[#D8C9A9]/40 focus:outline-none focus:border-[#C9A46A]"
                  />
                  {receiptEmailError && (
                    <p className="text-[11px] text-[#f28b79] font-medium">{receiptEmailError}</p>
                  )}
                </div>
              )}

              {/* 2. Dual-Region Switcher Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#111211] border border-white/10">
                <button
                  type="button"
                  onClick={() => setRegionTab('vn_vietqr')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    regionTab === 'vn_vietqr'
                      ? 'bg-[#A94F3D] text-[#F5EFE6] shadow-md'
                      : 'text-[#D8C9A9]/70 hover:text-[#F5EFE6]'
                  }`}
                >
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span className="truncate">Khách Việt Nam (VNĐ - VietQR)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegionTab('intl_usd')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    regionTab === 'intl_usd'
                      ? 'bg-[#526D8B] text-[#F5EFE6] shadow-md'
                      : 'text-[#D8C9A9]/70 hover:text-[#F5EFE6]'
                  }`}
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span className="truncate">Khách Quốc tế (USD - Global)</span>
                </button>
              </div>

              {/* ================= TAB 1: VIETNAM DOMESTIC (VIETQR / NAPAS 247) ================= */}
              {regionTab === 'vn_vietqr' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#1F211F] border border-[#C9A46A]/35 p-5 flex flex-col sm:flex-row items-center gap-5">
                    {/* Centered Crisp QR Frame */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="rounded-xl bg-white p-3 shadow-lg border-2 border-[#C9A46A]/60 flex flex-col items-center gap-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <VietQrBadgeSvg />
                          <Napas247BadgeSvg />
                        </div>
                        {qrConfig.qrImageDataUrl ? (
                          <img
                            src={qrConfig.qrImageDataUrl}
                            alt="Mã VietQR chuyển khoản ngân hàng"
                            className="w-44 h-44 object-contain rounded-md"
                          />
                        ) : generatedQrDataUrl ? (
                          <img
                            src={generatedQrDataUrl}
                            alt="Mã VietQR tự động"
                            className="w-44 h-44 object-contain rounded-md"
                          />
                        ) : (
                          <div className="w-44 h-44 flex items-center justify-center bg-neutral-100 text-neutral-500 text-xs">
                            Đang tạo mã QR...
                          </div>
                        )}
                      </div>
                      <span className="mt-2 text-[10px] font-medium text-[#D8C9A9]/65">
                        Quét bằng App Ngân hàng hoặc Ví điện tử
                      </span>
                    </div>

                    {/* Transfer Details */}
                    <div className="flex-1 w-full space-y-3 text-xs">
                      <div className="rounded-lg bg-[#171817] border border-white/10 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#D8C9A9]/60">Ngân hàng</span>
                          <span className="font-semibold text-[#F5EFE6] text-right">
                            {qrConfig.bankName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#D8C9A9]/60">Số tài khoản</span>
                          <span className="font-mono font-bold text-[#F5EFE6]">
                            {qrConfig.accountNumber}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#D8C9A9]/60">Chủ tài khoản</span>
                          <span className="font-semibold text-[#F5EFE6] text-right">
                            {qrConfig.accountHolder}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/10">
                          <span className="text-[#D8C9A9]/60">Số tiền chính xác</span>
                          <span className="font-mono font-bold text-base text-[#C9A46A]">
                            {pricing.vndLabel}
                          </span>
                        </div>
                      </div>

                      {/* Transfer Memo + 1-click Copy */}
                      <div className="rounded-lg bg-[#C9A46A]/10 border border-[#C9A46A]/45 p-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A46A] block mb-1">
                          Nội dung chuyển khoản (không dấu)
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <code className="font-mono text-sm font-bold text-[#F5EFE6] tracking-wider">
                            {transferMemo}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyMemo}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#171817] border border-[#C9A46A]/40 text-[11px] font-semibold text-[#C9A46A] hover:bg-[#C9A46A] hover:text-[#171817] transition-colors cursor-pointer"
                          >
                            {copiedMemo ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Đã chép
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Sao chép
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() =>
                      void executePurchase('vn_vietqr', 'vietqr', 'VietQR · Napas 247')
                    }
                    className="w-full py-3.5 rounded-xl bg-[#47796D] hover:bg-[#3b665c] disabled:opacity-60 text-[#F5EFE6] font-bold text-sm transition-colors shadow-lg cursor-pointer"
                  >
                    {isProcessing
                      ? 'Đang xác nhận giao dịch & mở khóa...'
                      : 'Tôi đã hoàn tất chuyển khoản'}
                  </button>
                </div>
              ) : (
                /* ================= TAB 2: INTERNATIONAL CHECKOUT (USD) ================= */
                <div className="space-y-4">
                  {/* 2 Method Selector Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIntlMethod('express')}
                      className={`text-left rounded-xl p-3.5 border transition-all cursor-pointer ${
                        intlMethod === 'express'
                          ? 'border-[#C9A46A] bg-[#C9A46A]/12 shadow-md'
                          : 'border-white/12 bg-[#1F211F] hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-[#F5EFE6]">
                          Thanh toán một chạm
                        </span>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            intlMethod === 'express'
                              ? 'border-[#C9A46A] bg-[#C9A46A]'
                              : 'border-white/30'
                          }`}
                        >
                          {intlMethod === 'express' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#171817]" />
                          )}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#D8C9A9]/70 mb-2.5">Express Checkout</p>
                      <ExpressBrandBadgesSvg />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIntlMethod('card')}
                      className={`text-left rounded-xl p-3.5 border transition-all cursor-pointer ${
                        intlMethod === 'card'
                          ? 'border-[#C9A46A] bg-[#C9A46A]/12 shadow-md'
                          : 'border-white/12 bg-[#1F211F] hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-[#F5EFE6]">
                          Thẻ Tín dụng / Ghi nợ Quốc tế
                        </span>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            intlMethod === 'card'
                              ? 'border-[#C9A46A] bg-[#C9A46A]'
                              : 'border-white/30'
                          }`}
                        >
                          {intlMethod === 'card' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#171817]" />
                          )}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#D8C9A9]/70 mb-2.5">Credit / Debit Card</p>
                      <CardBrandBadgesSvg />
                    </button>
                  </div>

                  {/* Method Body */}
                  {intlMethod === 'express' ? (
                    <div className="rounded-2xl bg-[#1F211F] border border-white/10 p-4 sm:p-5 space-y-3">
                      <p className="text-xs text-[#D8C9A9]/80 text-center">
                        {lang === 'en'
                          ? 'Choose your preferred one-tap global wallet to unlock immediately:'
                          : lang === 'zh'
                          ? '选择您常用的全球一键支付方式，立即激活权限：'
                          : 'Chọn ví thanh toán quốc tế một chạm để mở khóa tức thì:'}
                      </p>

                      {/* 1. Black Apple Pay Button */}
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => void executePurchase('intl_usd', 'apple_pay', 'Apple Pay')}
                        className="w-full h-12 rounded-xl bg-black hover:bg-neutral-900 border border-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow cursor-pointer disabled:opacity-60"
                      >
                        <AppleLogoSvg className="w-4 h-4" />
                        <span className="tracking-tight text-[15px]">Apple Pay</span>
                        <span className="text-xs text-white/60 ml-1">({pricing.usdLabel})</span>
                      </button>

                      {/* 2. Black Google Pay Button */}
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => void executePurchase('intl_usd', 'google_pay', 'Google Pay')}
                        className="w-full h-12 rounded-xl bg-[#0F1111] hover:bg-[#1a1d1d] border border-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow cursor-pointer disabled:opacity-60"
                      >
                        <GoogleGLogoSvg className="w-4 h-4" />
                        <span className="tracking-tight text-[15px]">Google Pay</span>
                        <span className="text-xs text-white/60 ml-1">({pricing.usdLabel})</span>
                      </button>

                      {/* 3. Yellow PayPal Button */}
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => void executePurchase('intl_usd', 'paypal', 'PayPal')}
                        className="w-full h-12 rounded-xl bg-[#FFC439] hover:bg-[#f2b62b] text-[#003087] font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow cursor-pointer disabled:opacity-60"
                      >
                        <PayPalMarkSvg className="h-4 w-auto" />
                        <span>
                          {lang === 'en'
                            ? 'Pay Now'
                            : lang === 'zh'
                            ? '立即支付'
                            : '— Thanh toán ngay'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleCardSubmit}
                      className="rounded-2xl bg-[#1F211F] border border-white/10 p-4 sm:p-5 space-y-3.5"
                    >
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[#D8C9A9]/80 block">
                          Số thẻ (Card Number)
                        </label>
                        <div className="relative">
                          <CreditCard className="w-4 h-4 text-[#C9A46A]/70 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            inputMode="numeric"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumberInput(e.target.value))}
                            placeholder="4242 4242 4242 4242"
                            className="w-full rounded-lg bg-[#171817] border border-white/15 pl-9 pr-3 py-2.5 text-sm font-mono text-[#F5EFE6] placeholder:text-[#D8C9A9]/35 focus:outline-none focus:border-[#C9A46A]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#D8C9A9]/80 block">
                            Ngày hết hạn (MM/YY)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                            placeholder="08/29"
                            className="w-full rounded-lg bg-[#171817] border border-white/15 px-3 py-2.5 text-sm font-mono text-[#F5EFE6] placeholder:text-[#D8C9A9]/35 focus:outline-none focus:border-[#C9A46A]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#D8C9A9]/80 block">
                            Mã bảo mật (CVC)
                          </label>
                          <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={cardCvc}
                            onChange={(e) =>
                              setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))
                            }
                            placeholder="123"
                            className="w-full rounded-lg bg-[#171817] border border-white/15 px-3 py-2.5 text-sm font-mono text-[#F5EFE6] placeholder:text-[#D8C9A9]/35 focus:outline-none focus:border-[#C9A46A]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[#D8C9A9]/80 block">
                          Tên chủ thẻ (Cardholder Name)
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          placeholder="NGUYEN VAN A"
                          className="w-full rounded-lg bg-[#171817] border border-white/15 px-3 py-2.5 text-sm text-[#F5EFE6] placeholder:text-[#D8C9A9]/35 focus:outline-none focus:border-[#C9A46A]"
                        />
                      </div>

                      {cardError && (
                        <p className="text-xs text-[#f28b79] font-medium">{cardError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-3 rounded-xl bg-[#C9A46A] hover:bg-[#b89258] disabled:opacity-60 text-[#171817] font-bold text-sm transition-colors cursor-pointer"
                      >
                        {isProcessing
                          ? 'Đang xử lý thanh toán quốc tế...'
                          : `Thanh toán ${pricing.usdLabel} & Mở khóa ngay`}
                      </button>
                    </form>
                  )}

                  {/* Auto USD Conversion & Security Footnote */}
                  <div className="rounded-xl bg-[#111211] border border-white/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <div className="text-[#D8C9A9]/80">
                      <span className="text-[#C9A46A] font-semibold">Quy đổi tự động USD: </span>
                      <span>
                        {pricing.vndLabel} → <strong className="text-[#F5EFE6]">{pricing.usdLabel}</strong>
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[#47796D] font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      Mã hóa bảo mật chuẩn PCI-DSS / TLS
                    </span>
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
