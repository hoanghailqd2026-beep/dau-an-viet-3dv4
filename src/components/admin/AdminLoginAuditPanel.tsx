import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AdminLoginAuditEntry,
  LOGIN_AUDIT_UPDATED_EVENT,
  clearAdminLoginAuditLogs,
  getCurrentSessionLoginAudit,
  loadAdminLoginAuditLogs,
  pullAdminLoginAuditLogsFromFirebase,
} from '../../utils/accountActivityStore';
import { useI18n } from '../../i18n/I18nContext';
import {
  Clock,
  Globe,
  Laptop,
  MapPin,
  RefreshCw,
  Shield,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2,
  UserCheck,
} from 'lucide-react';

interface AdminLoginAuditPanelProps {
  showToast: (type: 'ok' | 'err', text: string) => void;
}

type AuditFilterMode = 'all' | 'admin_only';

export const AdminLoginAuditPanel: React.FC<AdminLoginAuditPanelProps> = ({ showToast }) => {
  const { lang } = useI18n();
  const [entries, setEntries] = useState<AdminLoginAuditEntry[]>(() => loadAdminLoginAuditLogs());
  const [filterMode, setFilterMode] = useState<AuditFilterMode>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const currentSession = useMemo(() => getCurrentSessionLoginAudit(), [entries]);

  const handleRefresh = useCallback(
    async (silent = false) => {
      setIsSyncing(true);
      try {
        const merged = await pullAdminLoginAuditLogsFromFirebase();
        setEntries(merged);
        if (!silent) {
          showToast(
            'ok',
            lang === 'en'
              ? `Synced ${merged.length} login audit records from Firebase.`
              : lang === 'zh'
              ? `已从 Firebase 同步 ${merged.length} 条登录审计记录。`
              : `Đã đồng bộ ${merged.length} lượt đăng nhập từ Firebase.`
          );
        }
      } catch {
        if (!silent) {
          showToast(
            'err',
            lang === 'en'
              ? 'Could not refresh login audit log right now.'
              : lang === 'zh'
              ? '暂时无法刷新登录审计日志。'
              : 'Không thể làm mới Nhật ký Đăng nhập lúc này.'
          );
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [lang, showToast]
  );

  useEffect(() => {
    const syncLocal = () => setEntries(loadAdminLoginAuditLogs());
    window.addEventListener(LOGIN_AUDIT_UPDATED_EVENT, syncLocal);
    void handleRefresh(true);
    return () => {
      window.removeEventListener(LOGIN_AUDIT_UPDATED_EVENT, syncLocal);
    };
  }, [handleRefresh]);

  const filteredEntries = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) => new Date(b.loggedInAt).getTime() - new Date(a.loggedInAt).getTime()
    );
    if (filterMode === 'admin_only') {
      return sorted.filter((item) => item.role === 'admin');
    }
    return sorted;
  }, [entries, filterMode]);

  const adminCount = useMemo(
    () => entries.filter((item) => item.role === 'admin').length,
    [entries]
  );

  const uniqueDeviceCount = useMemo(() => {
    const set = new Set(entries.map((item) => `${item.deviceType}|${item.os}|${item.browser}`));
    return set.size;
  }, [entries]);

  const handleClearOldLogs = async () => {
    setIsClearing(true);
    try {
      await clearAdminLoginAuditLogs();
      setEntries(loadAdminLoginAuditLogs());
      setConfirmClear(false);
      showToast(
        'ok',
        lang === 'en'
          ? 'Old login audit records cleared. Active session preserved.'
          : lang === 'zh'
          ? '已清除旧登录记录，并保留当前会话。'
          : 'Đã xóa nhật ký cũ và giữ lại phiên đăng nhập hiện tại.'
      );
    } finally {
      setIsClearing(false);
    }
  };

  const renderDeviceIcon = (deviceType: AdminLoginAuditEntry['deviceType']) => {
    if (deviceType === 'mobile') {
      return <Smartphone className="w-4 h-4 text-[#C9A46A] shrink-0" strokeWidth={1.6} />;
    }
    if (deviceType === 'tablet') {
      return <Tablet className="w-4 h-4 text-[#C9A46A] shrink-0" strokeWidth={1.6} />;
    }
    return <Laptop className="w-4 h-4 text-[#C9A46A] shrink-0" strokeWidth={1.6} />;
  };

  const getInitials = (name: string) => {
    const parts = (name || 'U').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (parts[0] || 'U').slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-[#1E1F1E] border border-[#C9A46A]/25 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#C9A46A]">
            <Shield className="w-4 h-4" strokeWidth={1.7} />
            <span>
              {lang === 'en'
                ? 'Security & Session Monitor · Admin Only'
                : lang === 'zh'
                ? '安全与设备会话监控 · 仅限管理员'
                : 'Giám sát Thiết bị & An ninh Đăng nhập · Chỉ dành cho Quản trị viên'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-semibold text-[#D8C9A9]">
            {lang === 'en'
              ? 'Login Audit Log & Active Devices'
              : lang === 'zh'
              ? '登录审计日志与活跃设备'
              : 'Nhật ký Đăng nhập & Giám sát Thiết bị'}
          </h3>
          <p className="text-xs text-[#D8C9A9]/70 leading-relaxed max-w-2xl">
            {lang === 'en'
              ? 'Automatically captures each login session (max 100 latest) with account identity, authentication method, device/OS/browser, Vietnam timestamp, and IP geolocation — synchronized with Firebase Realtime Database.'
              : lang === 'zh'
              ? '自动记录每次登录会话（保留最近 100 条），包括账户与认证方式、设备/操作系统/浏览器、精确登录时间及 IP 地理位置，并与 Firebase 实时同步。'
              : 'Tự động ghi nhận mỗi phiên đăng nhập mới (lưu tối đa 100 lượt gần nhất) kèm phương thức xác thực, thiết bị, hệ điều hành, trình duyệt, giờ Việt Nam và vị trí IP — đồng bộ trực tiếp lên Firebase.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isSyncing}
            onClick={() => void handleRefresh(false)}
            className="px-3.5 py-2 rounded-lg bg-[#252725] hover:bg-[#2F312F] border border-[#D8C9A9]/15 text-[#D8C9A9] text-xs font-medium inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C9A46A] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {lang === 'en' ? 'Sync Firebase' : lang === 'zh' ? '同步 Firebase' : 'Làm mới Firebase'}
            </span>
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={entries.length <= 1}
              className="px-3.5 py-2 rounded-lg bg-[#A94F3D]/15 hover:bg-[#A94F3D]/30 border border-[#A94F3D]/45 text-[#E8B3A7] text-xs font-medium inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {lang === 'en' ? 'Clear Old Logs' : lang === 'zh' ? '清除旧日志' : 'Xóa nhật ký cũ'}
              </span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#A94F3D]/20 border border-[#A94F3D]/55">
              <span className="text-[11px] text-[#F5D0C8] font-medium">
                {lang === 'en' ? 'Confirm clear?' : lang === 'zh' ? '确认清除？' : 'Xác nhận xóa cũ?'}
              </span>
              <button
                type="button"
                disabled={isClearing}
                onClick={() => void handleClearOldLogs()}
                className="px-2.5 py-1 rounded bg-[#A94F3D] hover:bg-[#914132] text-[#D8C9A9] text-[11px] font-semibold cursor-pointer"
              >
                {lang === 'en' ? 'Clear' : lang === 'zh' ? '清除' : 'Xóa'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-[#D8C9A9] text-[11px] cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : lang === 'zh' ? '取消' : 'Hủy'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-xl bg-[#1E1F1E] border border-[#D8C9A9]/12 p-4">
          <div className="text-[11px] font-medium text-[#D8C9A9]/65">
            {lang === 'en' ? 'Recorded Sessions' : lang === 'zh' ? '已记录登录次数' : 'Tổng lượt đăng nhập đã lưu'}
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-serif font-semibold text-[#D8C9A9] tabular-nums">
              {entries.length}
            </span>
            <span className="text-[11px] text-[#C9A46A] tabular-nums">
              / 100 {lang === 'en' ? 'max' : lang === 'zh' ? '上限' : 'tối đa'}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-[#1E1F1E] border border-[#D8C9A9]/12 p-4">
          <div className="text-[11px] font-medium text-[#D8C9A9]/65">
            {lang === 'en' ? 'Admin Logins' : lang === 'zh' ? '管理员登录次数' : 'Lượt đăng nhập Quản trị viên'}
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-serif font-semibold text-[#C9A46A] tabular-nums">
              {adminCount}
            </span>
            <span className="text-[11px] text-[#47796D] font-medium">
              {lang === 'en' ? 'Protected RBAC' : lang === 'zh' ? 'RBAC 保护' : 'Giám sát RBAC'}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-[#1E1F1E] border border-[#D8C9A9]/12 p-4">
          <div className="text-[11px] font-medium text-[#D8C9A9]/65">
            {lang === 'en' ? 'Distinct Device Profiles' : lang === 'zh' ? '不同设备组合' : 'Cấu hình thiết bị ghi nhận'}
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-serif font-semibold text-[#D8C9A9] tabular-nums">
              {uniqueDeviceCount}
            </span>
            {currentSession && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#47796D]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#47796D]" />
                <span>{currentSession.deviceLabel} · {currentSession.browser}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 rounded-lg bg-[#1E1F1E] border border-[#D8C9A9]/15 gap-1">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#C9A46A] text-[#171817] font-semibold'
                : 'text-[#D8C9A9]/75 hover:text-[#D8C9A9] hover:bg-white/5'
            }`}
          >
            {lang === 'en'
              ? `All Accesses (${entries.length})`
              : lang === 'zh'
              ? `全部访问 (${entries.length})`
              : `Tất cả lượt truy cập (${entries.length})`}
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('admin_only')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              filterMode === 'admin_only'
                ? 'bg-[#C9A46A] text-[#171817] font-semibold'
                : 'text-[#D8C9A9]/75 hover:text-[#D8C9A9] hover:bg-white/5'
            }`}
          >
            {lang === 'en'
              ? `Admin Accounts Only (${adminCount})`
              : lang === 'zh'
              ? `仅限管理员账户 (${adminCount})`
              : `Chỉ tài khoản Admin (${adminCount})`}
          </button>
        </div>

        <div className="text-[11px] text-[#D8C9A9]/60">
          {lang === 'en'
            ? 'Sorted newest first · Deduplicated per browser session'
            : lang === 'zh'
            ? '按最新时间排序 · 按浏览器会话去重'
            : 'Sắp xếp mới nhất lên đầu · Chống trùng lặp khi tải lại trang (F5)'}
        </div>
      </div>

      {/* Audit Table */}
      <div className="rounded-xl bg-[#1E1F1E] border border-[#D8C9A9]/15 overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <UserCheck className="w-8 h-8 text-[#C9A46A]/70 mx-auto" strokeWidth={1.5} />
            <p className="text-sm font-medium text-[#D8C9A9]">
              {lang === 'en'
                ? 'No login sessions match this filter yet.'
                : lang === 'zh'
                ? '暂无符合条件的登录记录。'
                : 'Chưa có lượt đăng nhập nào khớp bộ lọc hiện tại.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto heritage-scrollbar pb-1.5 touch-pan-x">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D8C9A9]/12 bg-[#171817]/70 text-[11px] font-semibold text-[#C9A46A] uppercase tracking-wider">
                  <th className="py-3.5 px-4">
                    {lang === 'en'
                      ? 'User & Method'
                      : lang === 'zh'
                      ? '用户与登录方式'
                      : 'Người dùng & Phương thức'}
                  </th>
                  <th className="py-3.5 px-4">
                    {lang === 'en'
                      ? 'Device & OS'
                      : lang === 'zh'
                      ? '设备与操作系统'
                      : 'Thiết bị & Hệ điều hành'}
                  </th>
                  <th className="py-3.5 px-4">
                    {lang === 'en' ? 'Time (VN)' : lang === 'zh' ? '登录时间' : 'Thời gian'}
                  </th>
                  <th className="py-3.5 px-4">
                    {lang === 'en' ? 'Location & IP' : lang === 'zh' ? '位置与 IP' : 'Vị trí & IP'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8C9A9]/10 text-xs">
                {filteredEntries.map((item) => {
                  const isCurrentSession = Boolean(
                    currentSession && currentSession.sessionId === item.sessionId
                  );
                  const isAdminRow = item.role === 'admin';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isCurrentSession
                          ? 'bg-[#47796D]/12 hover:bg-[#47796D]/18'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* Col 1: User & Method */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                              isAdminRow
                                ? 'bg-[#C9A46A] text-[#171817] ring-1 ring-[#C9A46A]'
                                : 'bg-[#526D8B]/30 text-[#D8C9A9] border border-[#526D8B]/60'
                            }`}
                          >
                            {getInitials(item.displayName)}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-[#D8C9A9] truncate max-w-[200px]">
                                {item.displayName}
                              </span>
                              {isAdminRow ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#C9A46A]/20 border border-[#C9A46A]/50 text-[#C9A46A] text-[10px] font-semibold">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>{lang === 'en' ? 'Admin' : lang === 'zh' ? '管理员' : 'Quản trị viên'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#526D8B]/20 border border-[#526D8B]/45 text-[#B9CEE6] text-[10px] font-medium">
                                  {lang === 'en' ? 'Visitor' : lang === 'zh' ? '访客' : 'Du khách'}
                                </span>
                              )}
                              {isCurrentSession && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#47796D] text-[#F4EFE4] text-[10px] font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#D8C9A9]" />
                                  <span>
                                    {lang === 'en'
                                      ? 'Current Session'
                                      : lang === 'zh'
                                      ? '当前会话'
                                      : 'Phiên hiện tại'}
                                  </span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#D8C9A9]/65 truncate max-w-[240px]">
                              {item.email}
                            </div>
                            <div className="text-[11px] text-[#C9A46A]/85">
                              {item.authProviderLabel}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Col 2: Device & OS */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">{renderDeviceIcon(item.deviceType)}</div>
                          <div className="space-y-0.5">
                            <div className="font-medium text-[#D8C9A9]">{item.deviceLabel}</div>
                            <div className="text-[11px] text-[#D8C9A9]/70">
                              {item.os} · {item.browser}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Col 3: Time */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[#D8C9A9] font-medium tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-[#C9A46A]/80 shrink-0" />
                          <span>{item.formattedTimeVn}</span>
                        </div>
                        <div className="text-[11px] text-[#D8C9A9]/55 mt-0.5 tabular-nums">
                          {item.timezone || 'Asia/Ho_Chi_Minh'}
                        </div>
                      </td>

                      {/* Col 4: Location & IP */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-2">
                          {item.usedTimezoneFallback ? (
                            <Globe className="w-3.5 h-3.5 text-[#526D8B] mt-0.5 shrink-0" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-[#A94F3D] mt-0.5 shrink-0" />
                          )}
                          <div className="space-y-0.5">
                            <div className="font-medium text-[#D8C9A9]">
                              {item.locationDisplay}
                            </div>
                            <div className="text-[11px] text-[#D8C9A9]/65 tabular-nums">
                              IP: {item.ip}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
