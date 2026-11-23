import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Mail,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  Sparkles,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  useAuth,
  AuthProviderType,
  PRIMARY_ADMIN_EMAIL,
  normalizeEmail,
} from '../../contexts/AuthContext';
import {
  VISITORS_UPDATED_EVENT,
  fetchUsersFromCloudApi,
} from '../../utils/adminPlatformStore';
import { useI18n } from '../../i18n/I18nContext';

type AlternativeAuthMode = 'none' | 'password' | 'transfer';

export const AuthModal: React.FC = () => {
  const { lang } = useI18n();
  const {
    isAuthModalOpen,
    authGatePrompt,
    closeAuthModal,
    checkAccountPasswordExists,
    signInWithFirebaseGoogleAccount,
    loginWithGoogle,
    loginWithFacebook,
    loginAsJudge,
    loginWithTransferCode,
  } = useAuth();

  const [altMode, setAltMode] = useState<AlternativeAuthMode>('none');
  const [selectedProvider, setSelectedProvider] = useState<AuthProviderType>('google');
  const [transferCodeInput, setTransferCodeInput] = useState('');
  const [credentialSyncTick, setCredentialSyncTick] = useState(0);

  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googlePassword, setGooglePassword] = useState('');

  const [facebookName, setFacebookName] = useState('');
  const [facebookEmail, setFacebookEmail] = useState('');
  const [facebookPassword, setFacebookPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isFirebaseGoogleSubmitting, setIsFirebaseGoogleSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJudgeSubmitting, setIsJudgeSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const onVisitorsSync = () => setCredentialSyncTick((t) => t + 1);
    window.addEventListener(VISITORS_UPDATED_EVENT, onVisitorsSync);
    return () => {
      window.removeEventListener(VISITORS_UPDATED_EVENT, onVisitorsSync);
    };
  }, [isAuthModalOpen]);

  useEffect(() => {
    if (!isAuthModalOpen) {
      setAltMode('none');
      setSelectedProvider('google');
      setTransferCodeInput('');
      setErrorMsg(null);
      setShowPassword(false);
      setIsFirebaseGoogleSubmitting(false);
      setIsSubmitting(false);
      setIsJudgeSubmitting(false);
      setGooglePassword('');
      setFacebookPassword('');
      void fetchUsersFromCloudApi().then(() => {
        setCredentialSyncTick((v) => v + 1);
      });
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  const normalizedGoogleEmail = useMemo(() => normalizeEmail(googleEmail), [googleEmail]);
  const isGoogleEmailAdmin = normalizedGoogleEmail === PRIMARY_ADMIN_EMAIL;
  const googleHasExistingPassword = useMemo(
    () =>
      normalizedGoogleEmail.length >= 2
        ? checkAccountPasswordExists('google', normalizedGoogleEmail)
        : false,
    [normalizedGoogleEmail, checkAccountPasswordExists, credentialSyncTick]
  );

  const facebookIdentifier = useMemo(
    () => normalizeEmail(facebookEmail || facebookName),
    [facebookEmail, facebookName]
  );
  const facebookHasExistingPassword = useMemo(
    () =>
      facebookIdentifier.length >= 2
        ? checkAccountPasswordExists('facebook', facebookIdentifier)
        : false,
    [facebookIdentifier, checkAccountPasswordExists, credentialSyncTick]
  );

  if (!isAuthModalOpen) return null;

  const isAnyBusy = isFirebaseGoogleSubmitting || isSubmitting || isJudgeSubmitting;

  const handleFirebaseGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsFirebaseGoogleSubmitting(true);
    try {
      const res = await signInWithFirebaseGoogleAccount(lang);
      if (!res.ok) {
        setErrorMsg(
          res.error ||
            (lang === 'en'
              ? 'Unable to sign in with Google.'
              : lang === 'zh'
              ? '无法通过 Google 登录。'
              : 'Không thể hoàn tất đăng nhập qua Google.')
        );
      }
    } finally {
      setIsFirebaseGoogleSubmitting(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle(googleEmail, googlePassword, googleName);
      if (!res.ok) {
        setErrorMsg(
          res.error ||
            (lang === 'en'
              ? 'Unable to sign in to this account.'
              : lang === 'zh'
              ? '无法登录此账户。'
              : 'Không thể đăng nhập tài khoản.')
        );
      } else {
        setGoogleEmail('');
        setGoogleName('');
        setGooglePassword('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacebookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await loginWithFacebook(facebookName, facebookPassword, facebookEmail);
      if (!res.ok) {
        setErrorMsg(
          res.error ||
            (lang === 'en'
              ? 'Unable to sign in with Facebook.'
              : lang === 'zh'
              ? '无法通过 Facebook 登录。'
              : 'Không thể đăng nhập tài khoản Facebook.')
        );
      } else {
        setFacebookName('');
        setFacebookEmail('');
        setFacebookPassword('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJudgeQuickLogin = async () => {
    setErrorMsg(null);
    setIsJudgeSubmitting(true);
    try {
      const res = await loginAsJudge();
      if (!res.ok) {
        setErrorMsg(
          res.error ||
            (lang === 'en'
              ? 'Unable to activate Judge Quick Access.'
              : lang === 'zh'
              ? '无法启用评委快速体验模式。'
              : 'Không thể kích hoạt chế độ trải nghiệm nhanh.')
        );
      }
    } finally {
      setIsJudgeSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        lang === 'zh'
          ? '登录 / 注册 Dấu Ấn Việt 3D'
          : lang === 'en'
          ? 'Sign in / Register to Dấu Ấn Việt 3D'
          : 'Đăng nhập / Đăng ký Dấu Ấn Việt 3D'
      }
      onClick={closeAuthModal}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-[#171817]/85"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[94vw] sm:w-full max-w-md max-h-[85vh] sm:max-h-[88dvh] flex flex-col bg-[#171817] border border-[#C9A46A]/45 rounded-2xl overflow-hidden text-[#D8C9A9] animate-apple-sheet"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#C9A46A]/20 bg-[#171817] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {altMode === 'transfer' && (
              <button
                type="button"
                onClick={() => {
                  setAltMode('none');
                  setErrorMsg(null);
                }}
                className="w-7 h-7 rounded-full bg-[#D8C9A9]/10 hover:bg-[#D8C9A9]/20 text-[#D8C9A9] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                aria-label={lang === 'en' ? 'Back' : lang === 'zh' ? '返回' : 'Quay lại'}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-[#C9A46A] block">
                {lang === 'zh'
                  ? 'Dấu Ấn Việt 3D · Firebase Google 云端验证'
                  : lang === 'en'
                  ? 'Dấu Ấn Việt 3D · Firebase Google Authentication'
                  : 'Dấu Ấn Việt 3D · Xác thực Google & Đồng bộ Firebase'}
              </span>
              <h2 className="text-lg font-serif font-semibold text-[#D8C9A9] truncate">
                {altMode === 'transfer'
                  ? lang === 'en'
                    ? 'Restore via Sync Code'
                    : lang === 'zh'
                    ? '通过同步码恢复'
                    : 'Khôi phục bằng Mã Đồng Bộ'
                  : lang === 'zh'
                  ? '使用 Google 账号登录'
                  : lang === 'en'
                  ? 'Sign In to Heritage Space'
                  : 'Đăng nhập Không gian Di sản'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full bg-[#D8C9A9]/10 hover:bg-[#A94F3D] text-[#D8C9A9] flex items-center justify-center cursor-pointer transition-colors shrink-0"
            aria-label={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto heritage-scrollbar">
          {/* Contextual Auth Gate Banner */}
          <div className="rounded-xl bg-[#47796D]/18 border border-[#47796D]/45 px-4 py-3 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[#C9A46A] shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-medium text-[#D8C9A9] leading-relaxed">
                {lang === 'en'
                  ? 'Sign in with Gmail via Firebase Authentication to sync your QR passes, 0/17 heritage progress, and subscription tier across devices.'
                  : lang === 'zh'
                  ? '通过 Firebase Authentication 使用 Gmail 登录，即可跨设备同步电子门票、0/17 遗产探索进度及会员套餐权限。'
                  : 'Đăng nhập bằng tài khoản Gmail qua Firebase Authentication để tự động lưu và đồng bộ vé QR, tiến độ 0/17 di tích và hạng gói trên mọi thiết bị.'}
              </p>
              {authGatePrompt && (
                <div className="text-[11px] font-sans text-[#C9A46A]">
                  {lang === 'en'
                    ? `Unlocking section: ${authGatePrompt}`
                    : lang === 'zh'
                    ? `正在解锁模块：${authGatePrompt}`
                    : `Khu vực đang mở: ${authGatePrompt}`}
                </div>
              )}
            </div>
          </div>

          {altMode === 'transfer' ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setErrorMsg(null);
                setIsSubmitting(true);
                try {
                  const res = await loginWithTransferCode(transferCodeInput);
                  if (!res.ok) {
                    setErrorMsg(
                      res.error ||
                        (lang === 'en'
                          ? 'Unable to restore account from the provided code.'
                          : lang === 'zh'
                          ? '无法通过所输入的同步码恢复账户。'
                          : 'Không thể khôi phục tài khoản từ mã đã nhập.')
                    );
                  } else {
                    setTransferCodeInput('');
                    setAltMode('none');
                  }
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-transfer-code"
                  className="block text-xs font-medium text-[#C9A46A]"
                >
                  {lang === 'en'
                    ? 'Account Sync Code (DAV3D-...) *'
                    : lang === 'zh'
                    ? '跨设备同步码（DAV3D-...）*'
                    : 'Mã Đồng Bộ Tài Khoản (DAV3D-...) *'}
                </label>
                <textarea
                  id="auth-transfer-code"
                  required
                  autoFocus
                  rows={4}
                  value={transferCodeInput}
                  onChange={(e) => setTransferCodeInput(e.target.value)}
                  placeholder={
                    lang === 'en'
                      ? 'Paste the DAV3D-... sync code from My Account & Tickets on your previous device...'
                      : lang === 'zh'
                      ? '请粘贴原设备“我的账户与门票”页面生成的 DAV3D-... 同步码...'
                      : 'Dán chuỗi mã DAV3D-... từ mục Tài khoản & Vé của tôi trên thiết bị cũ...'
                  }
                  className="w-full p-3 rounded-xl bg-[#171817] border border-[#C9A46A]/35 focus:border-[#C9A46A] focus:outline-none text-xs font-sans tabular-nums text-[#D8C9A9] placeholder:text-[#D8C9A9]/45 resize-none"
                />
              </div>

              {errorMsg && (
                <div className="rounded-xl bg-[#A94F3D]/20 border border-[#A94F3D]/60 px-3.5 py-2.5 text-xs text-[#D8C9A9]">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isAnyBusy || !transferCodeInput.trim()}
                className="w-full h-11 rounded-full bg-[#C9A46A] hover:bg-[#D8C9A9] text-[#171817] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>
                  {lang === 'en'
                    ? 'Activate Now'
                    : lang === 'zh'
                    ? '立即激活'
                    : 'Kích hoạt ngay'}
                </span>
              </button>
            </form>
          ) : (
            <>
              {/* Primary Firebase Google Sign-In Card */}
              <div className="rounded-2xl border border-[#C9A46A]/45 bg-[#D8C9A9]/[0.04] p-4 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A46A]">
                    {lang === 'en'
                      ? 'Recommended · 1-Click Sign-In'
                      : lang === 'zh'
                      ? '推荐方式 · 一键登录'
                      : 'Khuyên dùng · Đăng nhập 1 chạm'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#47796D]/25 border border-[#47796D]/55 text-[10px] font-medium text-[#D8C9A9]">
                    Firebase Auth
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isAnyBusy}
                  onClick={handleFirebaseGoogleSignIn}
                  className="w-full h-12 rounded-full bg-[#D8C9A9] hover:bg-[#C9A46A] text-[#171817] border border-[#C9A46A]/70 text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_8px_24px_rgba(23,24,23,0.45)]"
                >
                  {isFirebaseGoogleSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#171817]" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-[#171817]/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                        />
                      </svg>
                    </span>
                  )}
                  <span>
                    {isFirebaseGoogleSubmitting
                      ? lang === 'en'
                        ? 'Connecting to Google...'
                        : lang === 'zh'
                        ? '正在连接 Google...'
                        : 'Đang kết nối Google...'
                      : lang === 'en'
                      ? 'Continue with Google (Gmail)'
                      : lang === 'zh'
                      ? '使用 Google (Gmail) 登录'
                      : 'Tiếp tục với Google (Gmail)'}
                  </span>
                </button>

                <p className="text-[11px] text-[#D8C9A9]/75 text-center leading-relaxed">
                  {lang === 'en'
                    ? 'Select any Google account to sign in immediately or unlock Admin / Tester Pro permissions.'
                    : lang === 'zh'
                    ? '选择任意 Google 账号即可快速登录，或自动匹配 Admin / Tester Pro 权限。'
                    : 'Chọn tài khoản Google để vào thẳng hệ thống hoặc tự động nhận quyền Admin / Tester Pro.'}
                </p>
              </div>

              {errorMsg && altMode === 'none' && (
                <div className="rounded-xl bg-[#A94F3D]/20 border border-[#A94F3D]/60 px-3.5 py-2.5 text-xs text-[#D8C9A9] leading-relaxed">
                  {errorMsg}
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 py-0.5">
                <div className="h-px flex-1 bg-[#C9A46A]/20" />
                <span className="text-[10px] uppercase tracking-wider text-[#D8C9A9]/55">
                  {lang === 'en'
                    ? 'Or use another method'
                    : lang === 'zh'
                    ? '或使用其他方式'
                    : 'Hoặc phương thức khác'}
                </span>
                <div className="h-px flex-1 bg-[#C9A46A]/20" />
              </div>

              {/* Collapsible Alternative Password / Admin Portal Sign-In */}
              <div className="rounded-xl border border-[#C9A46A]/25 bg-[#171817]">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAltMode((prev) => (prev === 'password' ? 'none' : 'password'));
                  }}
                  className="w-full px-4 py-2.5 flex items-center justify-between gap-2 text-xs font-medium text-[#D8C9A9] hover:text-[#C9A46A] transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-[#C9A46A]" />
                    <span>
                      {lang === 'en'
                        ? 'Admin Password & Email Sign-In'
                        : lang === 'zh'
                        ? '管理员密码 / 邮箱登录'
                        : 'Đăng nhập bằng Email & Mật khẩu Quản trị'}
                    </span>
                  </span>
                  {altMode === 'password' ? (
                    <ChevronUp className="w-4 h-4 text-[#C9A46A]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#D8C9A9]/65" />
                  )}
                </button>

                {altMode === 'password' && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#C9A46A]/15 space-y-3.5">
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#D8C9A9]/[0.05] border border-[#C9A46A]/20">
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setSelectedProvider('google');
                        }}
                        className={`h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          selectedProvider === 'google'
                            ? 'bg-[#C9A46A] text-[#171817]'
                            : 'text-[#D8C9A9]/70 hover:text-[#D8C9A9]'
                        }`}
                      >
                        Email / Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setSelectedProvider('facebook');
                        }}
                        className={`h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          selectedProvider === 'facebook'
                            ? 'bg-[#526D8B] text-[#D8C9A9]'
                            : 'text-[#D8C9A9]/70 hover:text-[#D8C9A9]'
                        }`}
                      >
                        Facebook
                      </button>
                    </div>

                    {selectedProvider === 'facebook' ? (
                      <form onSubmit={handleFacebookSubmit} className="space-y-3">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="auth-facebook-name"
                            className="block text-xs font-medium text-[#C9A46A]"
                          >
                            {lang === 'en'
                              ? 'Full Name / Facebook Username *'
                              : lang === 'zh'
                              ? '姓名 / Facebook 用户名 *'
                              : 'Họ và tên / Tên tài khoản Facebook *'}
                          </label>
                          <div className="relative">
                            <UserIcon className="w-4 h-4 text-[#D8C9A9]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              id="auth-facebook-name"
                              type="text"
                              required
                              value={facebookName}
                              onChange={(e) => setFacebookName(e.target.value)}
                              placeholder="VD: Trần Gia Huy"
                              className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-[#D8C9A9]/[0.05] border border-[#C9A46A]/25 focus:border-[#C9A46A] focus:outline-none text-xs sm:text-sm text-[#D8C9A9] placeholder:text-[#D8C9A9]/40"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="auth-facebook-email"
                            className="block text-xs font-medium text-[#D8C9A9]/75"
                          >
                            {lang === 'en'
                              ? 'Email or Username (optional)'
                              : lang === 'zh'
                              ? '邮箱或用户名（可选）'
                              : 'Email hoặc Tên đăng nhập (tùy chọn)'}
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-[#D8C9A9]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              id="auth-facebook-email"
                              type="text"
                              value={facebookEmail}
                              onChange={(e) => setFacebookEmail(e.target.value)}
                              placeholder="name@example.com"
                              className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-[#D8C9A9]/[0.05] border border-[#C9A46A]/25 focus:border-[#C9A46A] focus:outline-none text-xs sm:text-sm text-[#D8C9A9] placeholder:text-[#D8C9A9]/40"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label
                              htmlFor="auth-facebook-password"
                              className="block text-xs font-medium text-[#C9A46A]"
                            >
                              {lang === 'en' ? 'Password *' : lang === 'zh' ? '密码 *' : 'Mật khẩu *'}
                            </label>
                            <span className="text-[11px] font-medium text-[#47796D]">
                              {facebookHasExistingPassword
                                ? lang === 'en'
                                  ? 'Existing account'
                                  : lang === 'zh'
                                  ? '已有账户'
                                  : 'Tài khoản đã có'
                                : lang === 'en'
                                ? 'Instant access'
                                : lang === 'zh'
                                ? '即时注册/登录'
                                : 'Đăng ký / Đăng nhập ngay'}
                            </span>
                          </div>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-[#D8C9A9]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              id="auth-facebook-password"
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={facebookPassword}
                              onChange={(e) => setFacebookPassword(e.target.value)}
                              placeholder={
                                lang === 'en'
                                  ? 'Enter password...'
                                  : lang === 'zh'
                                  ? '输入密码...'
                                  : 'Nhập mật khẩu...'
                              }
                              className="w-full h-10 pl-10 pr-10 rounded-xl bg-[#D8C9A9]/[0.05] border border-[#C9A46A]/25 focus:border-[#C9A46A] focus:outline-none text-xs sm:text-sm text-[#D8C9A9] placeholder:text-[#D8C9A9]/40"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D8C9A9]/55 hover:text-[#D8C9A9] cursor-pointer"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {errorMsg && (
                          <div className="rounded-xl bg-[#A94F3D]/20 border border-[#A94F3D]/60 px-3.5 py-2.5 text-xs text-[#D8C9A9]">
                            {errorMsg}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isAnyBusy}
                          className="w-full h-10 rounded-full bg-[#526D8B] hover:bg-[#47796D] text-[#D8C9A9] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>
                            {lang === 'en'
                              ? 'Continue with Facebook Account'
                              : lang === 'zh'
                              ? '继续使用 Facebook 账户'
                              : 'Đăng nhập tài khoản Facebook'}
                          </span>
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleGoogleSubmit} className="space-y-3">
                        {!isGoogleEmailAdmin && (
                          <div className="space-y-1.5">
                            <label
                              htmlFor="auth-google-name"
                              className="block text-xs font-medium text-[#C9A46A]"
                            >
                              {lang === 'en'
                                ? 'Display Name (for Pass & Certificate)'
                                : lang === 'zh'
                                ? '显示名称（用于门票与证书）'
                                : 'Họ và tên hiển thị (in lên Vé & Chứng nhận)'}
                            </label>
                            <div className="relative">
                              <UserIcon className="w-4 h-4 text-[#D8C9A9]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                id="auth-google-name"
                                type="text"
                                value={googleName}
                                onChange={(e) => setGoogleName(e.target.value)}
                                placeholder="VD: Nguyễn Minh Anh"
                                className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-[#D8C9A9]/[0.05] border border-[#C9A46A]/25 focus:border-[#C9A46A] focus:outline-none text-xs sm:text-sm text-[#D8C9A9] placeholder:text-[#D8C9A9]/40"
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label
                            htmlFor="auth-google-email"
                            className="block text-xs font-medium text-[#C9A46A]"
                          >
                            {lang === 'en'
                              ? 'Email or Account Name *'
                              : lang === 'zh'
                              ? '邮箱或账户名 *'
                              : 'Email hoặc Tên tài khoản *'}
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-[#D8C9A9]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              id="auth-google-email"
                              type="text"
                              required
                              value={googleEmail}
                              onChange={(e) => setGoogleEmail(e.target.value)}
                              placeholder="name@gmail.com"
                              className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-[#D8C9A9]/[0.05] border border-[#C9A46A]/25 focus:border-[#C9A46A] focus:outline-none text-xs sm:text-sm text-[#D8C9A9] placeholder:text-[#D8C9A9]/40"
                            />
                          </div>
                        </div>

                        {isGoogleEmailAdmin && (
                          <div className="rounded-xl bg-[#C9A46A]/15 border border-[#C9A46A]/45 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-[#D8C9A9]">
                            <KeyRound className="w-4 h-4 text-[#C9A46A] shrink-0" />
                            <span>
                              {lang === 'en'
                                ? 'Super Admin account: Enter your Admin Password to unlock Admin Studio.'
                                : lang === 'zh'
                                ? '超级管理员账户：请输入管理员密码以解锁 Admin Studio。'
                                : 'Tài khoản Quản trị viên cao nhất: Nhập Mật khẩu Admin để mở khóa Admin Studio.'}
                            </span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label
                              htmlFor="auth-google-password"
                              className="block text-xs font-medium text-[#C9A46A]"
                            >
                              {isGoogleEmailAdmin
                                ? lang === 'en'
                                  ? 'Admin Password *'
                                  : lang === 'zh'
                                  ? '管理员密码 *'
                                  : 'Mật khẩu Admin *'
                                : lang === 'en'
                                ? 'Password *'
                                : lang === 'zh'
                                ? '密码 *'
                                : 'Mật khẩu *'}
                            </label>
                            {!isGoogleEmailAdmin && (
                              <span className="text-[11px] font-medium text-[#47796D]">
                                {googleHasExistingPassword
                                  ? lang === 'en'
                                    ? 'Existing account'
                                    : lang === 'zh'
                                    ? '已有账户'
                                    : 'Tài khoản đã có'
                                  : lang === 'en'
                                  ? 'Create & sign in'
                                  : lang === 'zh'
                                  ? '立即创建并登录'
                                  : 'Đăng ký / Vào ngay'}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-[#D8C9A9]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              id="auth-google-password"
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={googlePassword}
                              onChange={(e) => setGooglePassword(e.target.value)}
                              placeholder={
                                lang === 'en'
                                  ? 'Enter password...'
                                  : lang === 'zh'
                                  ? '输入密码...'
                                  : 'Nhập mật khẩu...'
                              }
                              className="w-full h-10 pl-10 pr-10 rounded-xl bg-[#D8C9A9]/[0.05] border border-[#C9A46A]/25 focus:border-[#C9A46A] focus:outline-none text-xs sm:text-sm text-[#D8C9A9] placeholder:text-[#D8C9A9]/40"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D8C9A9]/55 hover:text-[#D8C9A9] cursor-pointer"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {errorMsg && (
                          <div className="rounded-xl bg-[#A94F3D]/20 border border-[#A94F3D]/60 px-3.5 py-2.5 text-xs text-[#D8C9A9]">
                            {errorMsg}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isAnyBusy}
                          className="w-full h-10 rounded-full bg-[#C9A46A] hover:bg-[#D8C9A9] text-[#171817] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>
                            {isGoogleEmailAdmin
                              ? lang === 'en'
                                ? 'Sign In & Unlock Admin Studio'
                                : lang === 'zh'
                                ? '登录并解锁 Admin Studio'
                                : 'Đăng nhập & Mở khóa Admin Studio'
                              : lang === 'en'
                              ? 'Sign In with Email'
                              : lang === 'zh'
                              ? '使用邮箱登录'
                              : 'Đăng nhập bằng Email'}
                          </span>
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Secondary Quick Actions */}
          <div className="pt-2 border-t border-[#C9A46A]/15 space-y-2.5 text-[11px] text-[#D8C9A9]/65">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {altMode !== 'transfer' && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAltMode('transfer');
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#D8C9A9]/[0.07] hover:bg-[#D8C9A9]/[0.14] border border-[#C9A46A]/35 text-[11px] text-[#D8C9A9] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3 h-3 text-[#C9A46A]" />
                  <span>
                    {lang === 'en'
                      ? 'Restore via Sync Code'
                      : lang === 'zh'
                      ? '通过同步码恢复'
                      : 'Khôi phục bằng Mã Đồng Bộ'}
                  </span>
                </button>
              )}

              <button
                type="button"
                disabled={isAnyBusy}
                onClick={handleJudgeQuickLogin}
                className="px-3 py-1.5 rounded-full bg-[#D8C9A9]/[0.06] hover:bg-[#D8C9A9]/[0.14] border border-[#C9A46A]/30 hover:border-[#C9A46A]/65 text-[11px] text-[#D8C9A9]/85 hover:text-[#D8C9A9] inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 ml-auto"
              >
                {isJudgeSubmitting ? (
                  <Loader2 className="w-3 h-3 animate-spin text-[#C9A46A]" />
                ) : (
                  <Sparkles className="w-3 h-3 text-[#C9A46A]" />
                )}
                <span>
                  {lang === 'en'
                    ? 'Quick Demo (Judge)'
                    : lang === 'zh'
                    ? '快速体验（评委通道）'
                    : 'Trải nghiệm nhanh (Ban Giám Khảo)'}
                </span>
              </button>
            </div>

            <div className="flex items-start gap-2 text-[10px] text-[#D8C9A9]/60">
              <ShieldCheck className="w-3.5 h-3.5 text-[#47796D] shrink-0 mt-0.5" />
              <span>
                {lang === 'en'
                  ? 'Instant synchronization across desktop and mobile via Firebase Authentication & Realtime Database.'
                  : lang === 'zh'
                  ? '通过 Firebase Authentication 与 Realtime Database 在桌面端和移动端即时同步数据。'
                  : 'Đồng bộ đám mây tức thì giữa máy tính và điện thoại qua Firebase Authentication & Realtime Database.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
