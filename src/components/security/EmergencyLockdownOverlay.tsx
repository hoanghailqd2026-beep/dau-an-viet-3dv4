import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Clock,
  KeyRound,
  X,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import {
  EmergencyLockdownState,
  LoginShieldStatus,
  appendSecurityAlert,
  getLoginShieldStatus,
  maskEmailForDisplay,
} from '../../utils/adminPlatformStore';
import { PRIMARY_ADMIN_EMAIL, normalizeEmail, useAuth } from '../../contexts/AuthContext';

interface EmergencyLockdownOverlayProps {
  lockdownState: EmergencyLockdownState;
}

function formatElapsedDuration(lockedAtIso?: string, nowMs: number = Date.now()): string {
  if (!lockedAtIso) return '00:00:00';
  const start = new Date(lockedAtIso).getTime();
  if (!Number.isFinite(start)) return '00:00:00';
  const totalSec = Math.max(0, Math.floor((nowMs - start) / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}

export const EmergencyLockdownOverlay: React.FC<EmergencyLockdownOverlayProps> = ({
  lockdownState,
}) => {
  const { loginWithGoogle } = useAuth();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [isRecoveryOpen, setIsRecoveryOpen] = useState<boolean>(false);
  const [adminEmailInput, setAdminEmailInput] = useState<string>(PRIMARY_ADMIN_EMAIL);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [showPwd, setShowPwd] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loginShield, setLoginShield] = useState<LoginShieldStatus>(() =>
    getLoginShieldStatus()
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
      if (isRecoveryOpen) {
        setLoginShield(getLoginShieldStatus());
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRecoveryOpen]);

  useEffect(() => {
    if (!isRecoveryOpen) return;
    setLoginShield(getLoginShieldStatus());
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsRecoveryOpen(false);
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isRecoveryOpen]);

  const elapsedFormatted = useMemo(
    () => formatElapsedDuration(lockdownState.lockedAt, nowMs),
    [lockdownState.lockedAt, nowMs]
  );

  const lockedAtLabel = useMemo(() => {
    if (!lockdownState.lockedAt) return 'Vừa kích hoạt';
    try {
      return new Date(lockdownState.lockedAt).toLocaleString('vi-VN');
    } catch {
      return lockdownState.lockedAt;
    }
  }, [lockdownState.lockedAt]);

  const handleAdminRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const normalized = normalizeEmail(adminEmailInput);
    if (normalized !== PRIMARY_ADMIN_EMAIL) {
      appendSecurityAlert({
        category: 'unauthorized_admin',
        severity: 'critical',
        title: 'Truy cập trái phép Cổng Khôi phục Quản trị',
        detail: `Tài khoản không hợp lệ (${maskEmailForDisplay(
          normalized || 'trống'
        )}) đã cố gắng đăng nhập qua Cổng Xác Thực Quản Trị khi hệ thống đang phong tỏa.`,
        actor: maskEmailForDisplay(normalized || 'Ẩn danh'),
      });
      setErrorMsg(
        `Cổng khôi phục chỉ chấp nhận tài khoản Super Admin duy nhất (${PRIMARY_ADMIN_EMAIL}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle(PRIMARY_ADMIN_EMAIL, adminPasswordInput);
      setLoginShield(getLoginShieldStatus());
      if (!res.ok) {
        setErrorMsg(res.error || 'Mật khẩu Quản trị viên SHA-256 không chính xác.');
      } else {
        setAdminPasswordInput('');
        setIsRecoveryOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Trung tâm Bảo vệ An ninh Hệ thống — Dấu Ấn Việt 3D"
      className="fixed inset-0 z-[99999] bg-[#070709] text-[#F5F5F7] flex flex-col items-center justify-center p-5 sm:p-8 overflow-y-auto select-none"
    >
      {/* Subtle Ambient Security Grid & Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(255, 69, 58, 0.16), transparent 52%), radial-gradient(circle at 50% 75%, rgba(197, 160, 89, 0.12), transparent 55%)',
        }}
      />

      {/* Center Security Shield Card */}
      <div className="relative z-10 w-full max-w-2xl rounded-[32px] bg-[#121216]/95 border border-[#FF453A]/40 shadow-[0_32px_120px_rgba(0,0,0,0.95)] p-6 sm:p-10 text-center space-y-6">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF453A]/15 border border-[#FF453A]/45 text-xs font-semibold text-[#FF8A80]">
          <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-pulse" />
          <span>Trung tâm Bảo vệ An ninh Hệ thống — Dấu Ấn Việt 3D</span>
        </div>

        {/* Shield + Lock Emblem */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#FF453A]/15 animate-ping opacity-35" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#2B1214] via-[#1B1412] to-[#141418] border-2 border-[#C5A059]/70 shadow-[0_0_40px_rgba(255,69,58,0.28)] flex items-center justify-center">
            <ShieldAlert className="w-11 h-11 text-[#FF453A]" />
            <span className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-[#C5A059] text-black flex items-center justify-center shadow-lg">
              <Lock className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Main Heading */}
        <div className="space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#F5F5F7]">
            Hệ thống đang tạm phong tỏa khẩn cấp
          </h1>
          <p className="text-xs font-medium text-[#C5A059]">
            Phong tỏa an ninh khẩn cấp · Dữ liệu đang được bảo toàn
          </p>
        </div>

        {/* Management Notice Box */}
        <div className="rounded-2xl bg-black/55 border border-[#C5A059]/35 p-5 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C5A059]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Thông báo từ Ban Quản lý Bảo tàng Số</span>
          </div>
          <p className="text-sm sm:text-base text-[#F5EFE6] leading-relaxed">
            {lockdownState.message}
          </p>
        </div>

        {/* Lockdown Elapsed Timer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-[#8E8E93] block">
                Thời gian đã phong tỏa
              </span>
              <span className="text-2xl font-sans font-bold text-[#FF8A80] tabular-nums">
                {elapsedFormatted}
              </span>
            </div>
            <Clock className="w-6 h-6 text-[#FF453A] shrink-0" />
          </div>

          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-1">
            <span className="text-xs font-medium text-[#8E8E93] block">
              Thời điểm kích hoạt lá chắn
            </span>
            <span className="text-xs sm:text-sm font-sans tabular-nums text-[#F5F5F7] block">
              {lockedAtLabel}
            </span>
            <span className="text-[11px] text-emerald-400 block">
              ✓ Đã ngắt WebGL 3D &amp; các luồng tải API
            </span>
          </div>
        </div>

        <p className="text-xs text-[#8E8E93]">
          Mọi phiên tham quan của du khách đã được tự động đăng xuất an toàn để bảo vệ tài nguyên hệ thống.
        </p>
      </div>

      {/* Subtle Super Admin Recovery Entry at Bottom Corner */}
      <button
        type="button"
        onClick={() => {
          setErrorMsg(null);
          setIsRecoveryOpen(true);
        }}
        className="fixed bottom-5 right-5 z-[99999] px-3.5 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.12] hover:border-[#C5A059]/60 text-[11px] font-medium text-[#A1A1A6] hover:text-[#F5EFE6] inline-flex items-center gap-1.5 backdrop-blur-xl transition-all cursor-pointer shadow-lg"
      >
        <Lock className="w-3 h-3 text-[#C5A059]" />
        <span>Cổng Xác Thực Quản Trị</span>
      </button>

      {/* Dedicated Super Admin Recovery Dialog (Only accepts bivsmoon2023@gmail.com + SHA-256) */}
      {isRecoveryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cổng Xác Thực Quản Trị"
          onClick={() => setIsRecoveryOpen(false)}
          className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[28px] bg-[#161619] border border-[#C5A059]/45 shadow-[0_32px_90px_rgba(0,0,0,0.95)] overflow-hidden text-[#F5F5F7]"
          >
            <div className="px-6 py-4 border-b border-white/[0.08] bg-black/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-[#C5A059] block">
                    Cổng khôi phục Super Admin
                  </span>
                  <h2 className="font-serif text-base sm:text-lg font-semibold text-[#F5F5F7] truncate">
                    Cổng Xác Thực Quản Trị
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRecoveryOpen(false)}
                aria-label="Đóng cổng xác thực"
                className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-[#8E8E93] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminRecoverySubmit} className="p-6 space-y-4">
              <div className="rounded-xl bg-[#C5A059]/12 border border-[#C5A059]/40 px-3.5 py-2.5 text-xs text-[#F5EFE6] flex items-start gap-2.5">
                <KeyRound className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                <span>
                  Lối vào khôi phục hệ thống chỉ chấp nhận tài khoản Super Admin{' '}
                  <strong className="font-sans text-[#C5A059]">{PRIMARY_ADMIN_EMAIL}</strong>{' '}
                  cùng mật khẩu SHA-256 hợp lệ.
                </span>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="recovery-admin-email"
                  className="block text-xs font-medium text-[#C5A059]"
                >
                  Email Super Admin *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="recovery-admin-email"
                    type="email"
                    required
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    placeholder={PRIMARY_ADMIN_EMAIL}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-black/55 border border-white/[0.14] focus:border-[#C5A059] focus:outline-none text-sm font-sans text-[#F5F5F7]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="recovery-admin-password"
                  className="block text-xs font-medium text-[#C5A059]"
                >
                  Mật khẩu Admin (SHA-256) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="recovery-admin-password"
                    type={showPwd ? 'text' : 'password'}
                    required
                    autoFocus
                    minLength={6}
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="Nhập mật khẩu quản trị..."
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-black/55 border border-white/[0.14] focus:border-[#C5A059] focus:outline-none text-sm text-[#F5F5F7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white cursor-pointer"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginShield.isLockedOut && (
                <div className="rounded-xl bg-[#FF453A]/15 border border-[#FF453A]/50 px-3.5 py-2.5 text-xs text-rose-200 flex items-center justify-between gap-2">
                  <span>Lá chắn chống dò mật khẩu đang tạm khóa biểu mẫu. Thử lại sau:</span>
                  <span className="font-sans tabular-nums font-bold text-[#FF8A80] shrink-0">
                    {loginShield.remainingSec}s
                  </span>
                </div>
              )}

              {errorMsg && (
                <div className="rounded-xl bg-[#FF453A]/15 border border-[#FF453A]/45 px-3.5 py-2.5 text-xs text-[#FF8A80]">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || loginShield.isLockedOut}
                className="w-full h-11 rounded-full bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>Xác thực &amp; Vào quyền Quản trị</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
