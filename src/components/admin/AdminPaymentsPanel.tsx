import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Globe,
  Mail,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  DEFAULT_EMAILJS_SERVICE_ID,
  EMAIL_CONFIG_UPDATED_EVENT,
  EmailJsConfig,
  loadEmailJsConfig,
  pullEmailJsConfigFromFirebase,
  saveEmailJsConfig,
  sendEmailViaEmailJs,
} from '../../utils/emailAutoSender';
import {
  PAYMENT_ORDERS_UPDATED_EVENT,
  PAYMENT_QR_CONFIG_UPDATED_EVENT,
  PaymentOrderRecord,
  PaymentQrConfig,
  loadPaymentOrders,
  loadPaymentQrConfig,
  pullPaymentOrdersFromFirebase,
  pullPaymentQrConfigFromFirebase,
  savePaymentQrConfig,
} from '../../utils/subscriptionGatingStore';

interface AdminPaymentsPanelProps {
  showToast: (msg: string) => void;
}

function resizeQrFileToDataUrl(file: File, maxDim = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh QR.'));
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src) {
        reject(new Error('Dữ liệu ảnh không hợp lệ.'));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('Tệp không phải hình ảnh hợp lệ.'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

function formatOrderTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export const AdminPaymentsPanel: React.FC<AdminPaymentsPanelProps> = ({ showToast }) => {
  const { user } = useAuth();

  const [qrConfig, setQrConfig] = useState<PaymentQrConfig>(() => loadPaymentQrConfig());
  const [bankName, setBankName] = useState(qrConfig.bankName);
  const [accountNumber, setAccountNumber] = useState(qrConfig.accountNumber);
  const [accountHolder, setAccountHolder] = useState(qrConfig.accountHolder);
  const [isSavingQr, setIsSavingQr] = useState(false);

  // EmailJS Auto-Thank-You Configuration State (/settings/emailConfig)
  const [emailConfig, setEmailConfig] = useState<EmailJsConfig>(() => loadEmailJsConfig());
  const [emailEnabled, setEmailEnabled] = useState<boolean>(emailConfig.enabled);
  const [emailServiceId, setEmailServiceId] = useState<string>(
    emailConfig.serviceId || DEFAULT_EMAILJS_SERVICE_ID
  );
  const [emailTemplateId, setEmailTemplateId] = useState<string>(emailConfig.templateId);
  const [emailPublicKey, setEmailPublicKey] = useState<string>(emailConfig.publicKey);
  const [testRecipientEmail, setTestRecipientEmail] = useState<string>(user?.email || '');
  const [isSavingEmailCfg, setIsSavingEmailCfg] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [emailTestFeedback, setEmailTestFeedback] = useState<{
    type: 'ok' | 'err';
    message: string;
  } | null>(null);

  const [orders, setOrders] = useState<PaymentOrderRecord[]>(() => loadPaymentOrders());
  const [regionFilter, setRegionFilter] = useState<'all' | 'vn_vietqr' | 'intl_usd'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user?.email && !testRecipientEmail) {
      setTestRecipientEmail(user.email);
    }
  }, [user?.email, testRecipientEmail]);

  useEffect(() => {
    const syncQr = () => {
      const latest = loadPaymentQrConfig();
      setQrConfig(latest);
      setBankName(latest.bankName);
      setAccountNumber(latest.accountNumber);
      setAccountHolder(latest.accountHolder);
    };
    const syncEmailCfg = () => {
      const latest = loadEmailJsConfig();
      setEmailConfig(latest);
      setEmailEnabled(latest.enabled);
      setEmailServiceId(latest.serviceId || DEFAULT_EMAILJS_SERVICE_ID);
      setEmailTemplateId(latest.templateId);
      setEmailPublicKey(latest.publicKey);
    };
    const syncOrders = () => setOrders(loadPaymentOrders());

    window.addEventListener(PAYMENT_QR_CONFIG_UPDATED_EVENT, syncQr);
    window.addEventListener(EMAIL_CONFIG_UPDATED_EVENT, syncEmailCfg);
    window.addEventListener(PAYMENT_ORDERS_UPDATED_EVENT, syncOrders);

    void Promise.all([
      pullPaymentQrConfigFromFirebase().then((cfg) => {
        setQrConfig(cfg);
        setBankName(cfg.bankName);
        setAccountNumber(cfg.accountNumber);
        setAccountHolder(cfg.accountHolder);
      }),
      pullEmailJsConfigFromFirebase().then((cfg) => {
        setEmailConfig(cfg);
        setEmailEnabled(cfg.enabled);
        setEmailServiceId(cfg.serviceId || DEFAULT_EMAILJS_SERVICE_ID);
        setEmailTemplateId(cfg.templateId);
        setEmailPublicKey(cfg.publicKey);
      }),
      pullPaymentOrdersFromFirebase().then(setOrders),
    ]);

    return () => {
      window.removeEventListener(PAYMENT_QR_CONFIG_UPDATED_EVENT, syncQr);
      window.removeEventListener(EMAIL_CONFIG_UPDATED_EVENT, syncEmailCfg);
      window.removeEventListener(PAYMENT_ORDERS_UPDATED_EVENT, syncOrders);
    };
  }, []);

  const handleSaveEmailConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingEmailCfg(true);
    setEmailTestFeedback(null);
    try {
      const res = await saveEmailJsConfig({
        enabled: emailEnabled,
        serviceId: emailServiceId.trim() || DEFAULT_EMAILJS_SERVICE_ID,
        templateId: emailTemplateId.trim(),
        publicKey: emailPublicKey.trim(),
      });
      setEmailConfig(res.config);
      setEmailServiceId(res.config.serviceId);
      const msg = res.syncedFirebase
        ? `Đã lưu cấu hình EmailJS (${res.config.enabled ? 'Đang bật' : 'Đang tắt'}) lên Firebase /settings/emailConfig.`
        : `Đã lưu cấu hình EmailJS (${res.config.enabled ? 'Đang bật' : 'Đang tắt'}) trên thiết bị.`;
      setEmailTestFeedback({ type: 'ok', message: msg });
      showToast(msg);
    } finally {
      setIsSavingEmailCfg(false);
    }
  };

  const handleSendTestEmail = async () => {
    setEmailTestFeedback(null);
    const targetEmail = (testRecipientEmail || user?.email || '').trim();
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      const errMsg = 'Vui lòng nhập địa chỉ Gmail nhận thư kiểm tra hợp lệ.';
      setEmailTestFeedback({ type: 'err', message: errMsg });
      showToast(errMsg);
      return;
    }

    const serviceId = emailServiceId.trim() || DEFAULT_EMAILJS_SERVICE_ID;
    const templateId = emailTemplateId.trim();
    const publicKey = emailPublicKey.trim();

    if (!serviceId || !templateId || !publicKey) {
      const errMsg =
        'Vui lòng nhập đầy đủ Service ID, Template ID và Public Key trước khi gửi thư kiểm tra.';
      setEmailTestFeedback({ type: 'err', message: errMsg });
      showToast(errMsg);
      return;
    }

    setIsSendingTestEmail(true);
    try {
      const result = await sendEmailViaEmailJs(
        { serviceId, templateId, publicKey },
        {
          toEmail: targetEmail,
          customerName: user?.displayName || 'Quản trị viên Dấu Ấn Việt 3D',
          planName: 'Gói Pro Toàn Diện 17 Di tích (Thư kiểm tra)',
          scope: 'Toàn bộ 17 di tích',
          orderCode: `ORD-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
          amount: '49.000đ',
        }
      );

      if (result.ok) {
        const okMsg = `Đã gửi thành công thư cảm ơn mẫu qua EmailJS tới ${targetEmail}.`;
        setEmailTestFeedback({ type: 'ok', message: okMsg });
        showToast(okMsg);
      } else {
        const errMsg =
          result.error || 'Không thể gửi thư kiểm tra qua EmailJS. Vui lòng kiểm tra lại cấu hình.';
        setEmailTestFeedback({ type: 'err', message: errMsg });
        showToast(errMsg);
      }
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleUploadQrImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh PNG/JPG hợp lệ cho mã VietQR.');
      return;
    }
    setIsSavingQr(true);
    try {
      const dataUrl = await resizeQrFileToDataUrl(file, 640);
      const res = await savePaymentQrConfig({
        qrImageDataUrl: dataUrl,
        bankName: bankName.trim() || qrConfig.bankName,
        accountNumber: accountNumber.trim() || qrConfig.accountNumber,
        accountHolder: accountHolder.trim() || qrConfig.accountHolder,
      });
      setQrConfig(res.config);
      showToast(
        res.syncedFirebase
          ? 'Đã tải ảnh VietQR lên và đồng bộ Firebase thành công.'
          : 'Đã lưu ảnh VietQR trên thiết bị (sẵn sàng hiển thị tại cổng thanh toán).'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể xử lý ảnh mã QR.');
    } finally {
      setIsSavingQr(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveQrImage = async () => {
    setIsSavingQr(true);
    try {
      const res = await savePaymentQrConfig({ qrImageDataUrl: null });
      setQrConfig(res.config);
      showToast('Đã gỡ ảnh QR tùy chỉnh. Hệ thống sẽ dùng mã VietQR tự động.');
    } finally {
      setIsSavingQr(false);
    }
  };

  const handleSaveBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingQr(true);
    try {
      const res = await savePaymentQrConfig({
        bankName: bankName.trim() || qrConfig.bankName,
        accountNumber: accountNumber.trim() || qrConfig.accountNumber,
        accountHolder: accountHolder.trim().toUpperCase() || qrConfig.accountHolder,
      });
      setQrConfig(res.config);
      showToast('Đã lưu thông tin tài khoản thụ hưởng VietQR / Napas 247.');
    } finally {
      setIsSavingQr(false);
    }
  };

  const handleRefreshOrders = async () => {
    setIsRefreshing(true);
    try {
      const latest = await pullPaymentOrdersFromFirebase();
      setOrders(latest);
      showToast(`Đã cập nhật ${latest.length} đơn hàng mới nhất.`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const vnOrders = orders.filter((o) => o.region === 'vn_vietqr');
    const intlOrders = orders.filter((o) => o.region === 'intl_usd');
    const totalVnd = vnOrders.reduce((sum, o) => sum + (Number(o.amountVnd) || 0), 0);
    const totalUsd = intlOrders.reduce((sum, o) => sum + (Number(o.amountUsd) || 0), 0);
    return {
      totalCount: orders.length,
      vnCount: vnOrders.length,
      intlCount: intlOrders.length,
      totalVnd,
      totalUsd,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (regionFilter !== 'all' && o.region !== regionFilter) return false;
      if (!q) return true;
      return (
        o.orderId.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.scopeLabel.toLowerCase().includes(q) ||
        (o.transferMemo || '').toLowerCase().includes(q)
      );
    });
  }, [orders, regionFilter, searchQuery]);

  return (
    <div className="space-y-6 text-[#D8C9A9]">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#C9A46A]/20">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A46A]">
            ADMIN PAYMENT GATEWAY & RECONCILIATION
          </p>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-[#F5EFE6] mt-0.5">
            Cấu hình Thanh toán VietQR & Quản lý Đơn hàng
          </h3>
        </div>
        <button
          type="button"
          onClick={() => void handleRefreshOrders()}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1F211F] border border-[#C9A46A]/35 text-xs font-semibold text-[#C9A46A] hover:bg-[#C9A46A]/15 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Đồng bộ đơn hàng Firebase</span>
        </button>
      </div>

      {/* 0. Automated Thank-You Gmail (EmailJS) Configuration Card */}
      <form
        onSubmit={(e) => void handleSaveEmailConfig(e)}
        className="rounded-2xl bg-[#1C1D1B] border border-[#C9A46A]/40 p-5 space-y-4 shadow-lg"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-[#C9A46A]/20">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#171817] border border-[#C9A46A]/35 flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="w-4 h-4 text-[#C9A46A]" strokeWidth={1.7} />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-serif font-semibold text-[#F5EFE6]">
                Cấu hình Gửi Thư Cảm Ơn Gmail Tự Động (EmailJS)
              </h4>
              <p className="text-[11px] text-[#D8C9A9]/70 mt-0.5">
                Đồng bộ cấu hình tại Firebase{' '}
                <code className="text-[#C9A46A] font-mono">/settings/emailConfig</code> · Gửi tự động qua EmailJS REST API ngay khi khách thanh toán VietQR hoặc USD.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                emailEnabled
                  ? 'bg-[#47796D]/25 border-[#47796D] text-[#D8C9A9]'
                  : 'bg-[#171817] border-white/15 text-[#D8C9A9]/60'
              }`}
            >
              {emailEnabled ? 'Đang bật' : 'Đang tắt'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={emailEnabled}
              aria-label="Tự động gửi thư cảm ơn qua Gmail sau khi khách mua gói"
              onClick={() => setEmailEnabled((prev) => !prev)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors cursor-pointer shrink-0 ${
                emailEnabled
                  ? 'bg-[#47796D] border-[#C9A46A]/60'
                  : 'bg-[#141514] border-white/20'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                  emailEnabled
                    ? 'translate-x-6 bg-[#C9A46A]'
                    : 'translate-x-1 bg-[#D8C9A9]/60'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-[#D8C9A9]/90 bg-[#141514] border border-[#C9A46A]/20 rounded-xl px-3.5 py-2.5">
          <span className="font-medium">
            Tự động gửi thư cảm ơn qua Gmail sau khi khách mua gói
          </span>
          <span className="text-[11px] text-[#C9A46A] font-mono">
            {emailConfig.updatedAt
              ? `Cập nhật: ${formatOrderTime(emailConfig.updatedAt)}`
              : 'Chưa lưu lên Firebase'}
          </span>
        </div>

        {/* 3 EmailJS Connection Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-emailjs-service-id"
              className="text-[11px] font-semibold text-[#C9A46A] block"
            >
              Service ID
            </label>
            <input
              id="admin-emailjs-service-id"
              type="text"
              value={emailServiceId}
              onChange={(e) => setEmailServiceId(e.target.value)}
              placeholder={DEFAULT_EMAILJS_SERVICE_ID}
              className="w-full rounded-xl bg-[#141514] border border-[#C9A46A]/25 px-3 py-2 text-xs font-mono text-[#F5EFE6] placeholder:text-[#D8C9A9]/40 focus:outline-none focus:border-[#C9A46A]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-emailjs-template-id"
              className="text-[11px] font-semibold text-[#C9A46A] block"
            >
              Template ID
            </label>
            <input
              id="admin-emailjs-template-id"
              type="text"
              value={emailTemplateId}
              onChange={(e) => setEmailTemplateId(e.target.value)}
              placeholder="template_xxxxxxx"
              className="w-full rounded-xl bg-[#141514] border border-[#C9A46A]/25 px-3 py-2 text-xs font-mono text-[#F5EFE6] placeholder:text-[#D8C9A9]/40 focus:outline-none focus:border-[#C9A46A]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-emailjs-public-key"
              className="text-[11px] font-semibold text-[#C9A46A] block"
            >
              Public Key
            </label>
            <input
              id="admin-emailjs-public-key"
              type="text"
              value={emailPublicKey}
              onChange={(e) => setEmailPublicKey(e.target.value)}
              placeholder="Nhập Public Key từ mục Account trên EmailJS"
              className="w-full rounded-xl bg-[#141514] border border-[#C9A46A]/25 px-3 py-2 text-xs font-mono text-[#F5EFE6] placeholder:text-[#D8C9A9]/40 focus:outline-none focus:border-[#C9A46A]"
            />
          </div>
        </div>

        {/* Test Recipient + 2 Action Pill Buttons */}
        <div className="pt-2 border-t border-white/10 flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div className="flex-1 max-w-sm space-y-1">
            <label
              htmlFor="admin-emailjs-test-recipient"
              className="text-[11px] font-medium text-[#D8C9A9]/75 block"
            >
              Gmail nhận thư kiểm tra (mặc định Gmail Admin đang đăng nhập)
            </label>
            <input
              id="admin-emailjs-test-recipient"
              type="email"
              value={testRecipientEmail}
              onChange={(e) => setTestRecipientEmail(e.target.value)}
              placeholder="admin@gmail.com"
              className="w-full rounded-xl bg-[#141514] border border-white/15 px-3 py-2 text-xs text-[#F5EFE6] placeholder:text-[#D8C9A9]/40 focus:outline-none focus:border-[#C9A46A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={isSendingTestEmail}
              onClick={() => void handleSendTestEmail()}
              className="px-4 py-2 rounded-full border border-[#C9A46A] text-[#D8C9A9] hover:bg-[#C9A46A]/15 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-55"
            >
              <Send className="w-3.5 h-3.5 text-[#C9A46A]" strokeWidth={1.7} />
              <span>{isSendingTestEmail ? 'Đang gửi thử...' : 'Gửi thư kiểm tra'}</span>
            </button>

            <button
              type="submit"
              disabled={isSavingEmailCfg}
              className="px-5 py-2 rounded-full bg-[#C9A46A] hover:brightness-110 text-[#171817] text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-55 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span>{isSavingEmailCfg ? 'Đang lưu...' : 'Lưu cấu hình Gmail'}</span>
            </button>
          </div>
        </div>

        {emailTestFeedback && (
          <div
            className={`rounded-xl px-3.5 py-2.5 text-xs border ${
              emailTestFeedback.type === 'ok'
                ? 'bg-[#47796D]/20 border-[#47796D]/60 text-[#F5EFE6]'
                : 'bg-[#A94F3D]/20 border-[#A94F3D]/60 text-[#F5EFE6]'
            }`}
          >
            {emailTestFeedback.message}
          </div>
        )}
      </form>

      {/* 1. VietQR / Napas 247 Upload & Bank Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 rounded-2xl bg-[#1F211F] border border-[#C9A46A]/30 p-5 flex flex-col items-center justify-between gap-4">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-[#F5EFE6] flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#C9A46A]" />
              Ảnh mã QR VietQR / Napas 247
            </span>
            {qrConfig.qrImageDataUrl ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#47796D]/20 text-[#47796D] border border-[#47796D]/40">
                Đang dùng ảnh tải lên
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#526D8B]/20 text-[#9db6d1] border border-[#526D8B]/40">
                QR tự động mặc định
              </span>
            )}
          </div>

          <div className="w-48 h-48 rounded-xl bg-white p-2.5 border-2 border-[#C9A46A]/50 flex items-center justify-center overflow-hidden shadow-inner">
            {qrConfig.qrImageDataUrl ? (
              <img
                src={qrConfig.qrImageDataUrl}
                alt="Ảnh VietQR của Admin"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center px-3 space-y-1.5">
                <QrCode className="w-10 h-10 text-[#171817]/40 mx-auto" />
                <p className="text-[11px] font-semibold text-[#171817]/75">
                  Chưa tải ảnh VietQR riêng
                </p>
                <p className="text-[10px] text-[#171817]/55 leading-snug">
                  Cổng thanh toán đang tự tạo mã QR sắc nét theo STK bên cạnh.
                </p>
              </div>
            )}
          </div>

          <div className="w-full flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => void handleUploadQrImage(e)}
              className="hidden"
            />
            <button
              type="button"
              disabled={isSavingQr}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#C9A46A] hover:bg-[#b89258] text-[#171817] font-bold text-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{qrConfig.qrImageDataUrl ? 'Thay ảnh VietQR mới' : 'Tải ảnh VietQR ngân hàng'}</span>
            </button>
            {qrConfig.qrImageDataUrl && (
              <button
                type="button"
                disabled={isSavingQr}
                onClick={() => void handleRemoveQrImage()}
                className="p-2.5 rounded-xl bg-[#A94F3D]/15 hover:bg-[#A94F3D]/30 border border-[#A94F3D]/40 text-[#f28b79] transition-colors cursor-pointer"
                title="Gỡ ảnh QR tùy chỉnh"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bank Metadata Form */}
        <form
          onSubmit={(e) => void handleSaveBankInfo(e)}
          className="lg:col-span-7 rounded-2xl bg-[#1F211F] border border-white/10 p-5 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#F5EFE6]">
                Thông tin tài khoản nhận chuyển khoản nội địa (VNĐ)
              </h4>
              <span className="text-[11px] text-[#47796D] inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Firebase /paymentConfig/vietqr
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#D8C9A9]/75 block">
                Tên ngân hàng thụ hưởng
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-lg bg-[#171817] border border-white/15 px-3 py-2 text-xs text-[#F5EFE6] focus:outline-none focus:border-[#C9A46A]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#D8C9A9]/75 block">
                  Số tài khoản
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full rounded-lg bg-[#171817] border border-white/15 px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:outline-none focus:border-[#C9A46A]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#D8C9A9]/75 block">
                  Tên chủ tài khoản (IN HOA)
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full rounded-lg bg-[#171817] border border-white/15 px-3 py-2 text-xs text-[#F5EFE6] focus:outline-none focus:border-[#C9A46A]"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-[#D8C9A9]/60">
              Quy đổi Quốc tế tự động: 19.000đ → $1.00 · 49.000đ → $2.00 · 5.000.000đ → $199.00
            </p>
            <button
              type="submit"
              disabled={isSavingQr}
              className="px-4 py-2 rounded-lg bg-[#47796D] hover:bg-[#3c685e] text-[#F5EFE6] text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
            >
              Lưu cấu hình ngân hàng
            </button>
          </div>
        </form>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-xl bg-[#1F211F] border border-white/10 p-4">
          <p className="text-[11px] text-[#D8C9A9]/65 uppercase tracking-wider font-semibold">
            Tổng đơn hàng đã ghi nhận
          </p>
          <p className="text-2xl font-mono font-bold text-[#F5EFE6] mt-1">{stats.totalCount}</p>
        </div>
        <div className="rounded-xl bg-[#1F211F] border border-[#A94F3D]/35 p-4">
          <p className="text-[11px] text-[#C9A46A] uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5" />
            VietQR Nội địa ({stats.vnCount} đơn)
          </p>
          <p className="text-2xl font-mono font-bold text-[#F5EFE6] mt-1">
            {stats.totalVnd.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="rounded-xl bg-[#1F211F] border border-[#526D8B]/40 p-4">
          <p className="text-[11px] text-[#9db6d1] uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Quốc tế USD ({stats.intlCount} đơn)
          </p>
          <p className="text-2xl font-mono font-bold text-[#F5EFE6] mt-1">
            ${stats.totalUsd.toFixed(2)} USD
          </p>
        </div>
      </div>

      {/* 3. Orders Reconciliation Table */}
      <div className="rounded-2xl bg-[#1F211F] border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-[#171817] p-1 rounded-lg border border-white/10">
            {(
              [
                ['all', `Tất cả (${stats.totalCount})`],
                ['vn_vietqr', `VietQR Nội địa (${stats.vnCount})`],
                ['intl_usd', `Quốc tế USD (${stats.intlCount})`],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setRegionFilter(val)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  regionFilter === val
                    ? 'bg-[#C9A46A] text-[#171817]'
                    : 'text-[#D8C9A9]/75 hover:text-[#F5EFE6]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#D8C9A9]/45 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã đơn, email, nội dung CK..."
              className="w-full rounded-lg bg-[#171817] border border-white/15 pl-8 pr-3 py-1.5 text-xs text-[#F5EFE6] placeholder:text-[#D8C9A9]/40 focus:outline-none focus:border-[#C9A46A]"
            />
          </div>
        </div>

        <div className="overflow-x-auto heritage-scrollbar pb-1.5 touch-pan-x">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-[#171817]/70 text-[10px] uppercase tracking-wider text-[#C9A46A]">
                <th className="py-3 px-4">Mã đơn & Nội dung</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Gói & Phạm vi</th>
                <th className="py-3 px-4">Kênh thanh toán</th>
                <th className="py-3 px-4 text-right">Số tiền</th>
                <th className="py-3 px-4 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#D8C9A9]/55">
                    Chưa có đơn hàng nào khớp bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#F5EFE6]">{order.orderId}</div>
                      {order.transferMemo && (
                        <div className="text-[10px] font-mono text-[#C9A46A]/85 mt-0.5">
                          CK: {order.transferMemo}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#F5EFE6]">{order.customerName}</div>
                      <div className="text-[11px] text-[#D8C9A9]/65">{order.email}</div>
                      <div className="mt-1">
                        {order.emailSent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#47796D]/20 border border-[#47796D]/50 text-[#D8C9A9] text-[10px] font-medium">
                            <Mail className="w-2.5 h-2.5 text-[#C9A46A]" />
                            Đã gửi Gmail cảm ơn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[#D8C9A9]/55 text-[10px]">
                            Chưa gửi Gmail
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-[#F5EFE6] truncate" title={order.scopeLabel}>
                        {order.scopeLabel}
                      </div>
                      {order.schoolCode && (
                        <div className="text-[10px] font-mono text-[#47796D] mt-0.5">
                          Mã trường: {order.schoolCode}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {order.region === 'vn_vietqr' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#A94F3D]/15 border border-[#A94F3D]/40 text-[#f2a696] text-[11px] font-semibold">
                          <QrCode className="w-3 h-3" />
                          VietQR Nội địa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#526D8B]/20 border border-[#526D8B]/45 text-[#b7cde6] text-[11px] font-semibold">
                          <Globe className="w-3 h-3" />
                          Quốc tế USD · {order.paymentMethodLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#C9A46A]">
                      {order.amountDisplay}
                    </td>
                    <td className="py-3 px-4 text-right text-[#D8C9A9]/70 whitespace-nowrap">
                      {formatOrderTime(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
