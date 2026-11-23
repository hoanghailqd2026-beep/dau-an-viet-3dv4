import React, { useMemo, useState } from 'react';
import { BarChart3, RotateCcw, ArrowUpDown, AlertTriangle } from 'lucide-react';
import { HeritageSite } from '../../types/heritage';
import { useI18n } from '../../i18n/I18nContext';
import { resetAllVisitStatsToZero, useVisitStats } from '../../utils/visitStatsSync';
import { isFirebaseDbConfigured } from '../../utils/firebaseRestSync';

interface HeritageVisitStatsPanelProps {
  sites: HeritageSite[];
  onNotify?: (type: 'ok' | 'err', text: string) => void;
}

type SortMode = 'order' | 'desc';

interface BarRowItem {
  code: string;
  site: HeritageSite;
  fullName: string;
  shortName: string;
  visitCount: number;
  percentage: number;
  colorIndex: number;
}

function abbreviateHeritageName(name: string, maxLen = 16): string {
  const cleaned = name
    .replace(/^(Di tích Khảo cổ học|Di tích Lịch sử|Bảo tàng|Nhà hát|Bưu điện|Chợ|Dinh|Địa đạo)\s+/i, '')
    .trim();
  const base = cleaned.length >= 4 ? cleaned : name.trim();
  if (base.length <= maxLen) return base;
  return `${base.slice(0, maxLen - 1).trimEnd()}…`;
}

export const HeritageVisitStatsPanel: React.FC<HeritageVisitStatsPanelProps> = ({
  sites,
  onNotify,
}) => {
  const { lang, getLocalizedSite } = useI18n();
  const visitStats = useVisitStats();

  const [sortMode, setSortMode] = useState<SortMode>('order');
  const [activeHoverCode, setActiveHoverCode] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const computed = useMemo(() => {
    const baseRows = sites.map((site, idx) => {
      const loc = getLocalizedSite(site);
      const code = String(idx + 1).padStart(2, '0');
      const count = visitStats.countsBySiteId[site.id] ?? visitStats.countsByCode[code] ?? 0;
      return {
        code,
        site,
        fullName: loc.officialName,
        shortName: abbreviateHeritageName(loc.officialName),
        visitCount: count,
        colorIndex: idx,
      };
    });

    const totalVisits = baseRows.reduce((acc, r) => acc + r.visitCount, 0);
    const maxVisitCount = baseRows.reduce((max, r) => Math.max(max, r.visitCount), 0);
    const avgVisits = baseRows.length > 0 ? totalVisits / baseRows.length : 0;

    let topSiteRow = baseRows[0] || null;
    for (const row of baseRows) {
      if (!topSiteRow || row.visitCount > topSiteRow.visitCount) {
        topSiteRow = row;
      }
    }

    const enrichedRows: BarRowItem[] = baseRows.map((row) => ({
      ...row,
      percentage: totalVisits > 0 ? (row.visitCount / totalVisits) * 100 : 0,
    }));

    const sortedRows =
      sortMode === 'desc'
        ? [...enrichedRows].sort((a, b) =>
            b.visitCount !== a.visitCount
              ? b.visitCount - a.visitCount
              : Number(a.code) - Number(b.code)
          )
        : enrichedRows;

    const yAxisMax = Math.max(4, Math.ceil(Math.max(maxVisitCount, 1) / 4) * 4);
    const yTicks = [yAxisMax, Math.round(yAxisMax * 0.75), Math.round(yAxisMax * 0.5), Math.round(yAxisMax * 0.25), 0];

    return {
      rows: sortedRows,
      totalVisits,
      maxVisitCount,
      avgVisits,
      topSiteRow,
      yAxisMax,
      yTicks,
    };
  }, [sites, visitStats, sortMode, getLocalizedSite]);

  const activeBarItem = useMemo(
    () => computed.rows.find((r) => r.code === activeHoverCode) || null,
    [computed.rows, activeHoverCode]
  );

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const res = await resetAllVisitStatsToZero();
      setIsResetConfirmOpen(false);
      setActiveHoverCode(null);
      if (onNotify) {
        if (res.syncedFirebase) {
          onNotify(
            'ok',
            lang === 'en'
              ? 'All 17 site visit counters have been reset to 0 and synced to Firebase.'
              : lang === 'zh'
              ? '已将 17 处遗迹参观计数器重置为 0 并同步至 Firebase。'
              : 'Đã đặt lại bộ đếm 17 di tích về 0 và đồng bộ lên Firebase.'
          );
        } else {
          onNotify(
            'ok',
            lang === 'en'
              ? 'All 17 site visit counters have been reset to 0 locally.'
              : lang === 'zh'
              ? '已在本地将 17 处遗迹参观计数器重置为 0。'
              : 'Đã đặt lại bộ đếm 17 di tích về 0 trong bộ nhớ cục bộ.'
          );
        }
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <section className="p-5 sm:p-6 rounded-2xl bg-[#161619] border border-[#C9A46A]/30 space-y-5 w-full max-w-full overflow-hidden">
      {/* Header + Sort & Reset Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#A94F3D]/20 border border-[#A94F3D]/55 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-[#C9A46A]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-semibold text-[#D8C9A9] truncate">
              {lang === 'en'
                ? 'Monument Visit Statistics (17 Heritage Sites)'
                : lang === 'zh'
                ? '各遗迹参观人数统计与柱状图（17 处遗迹）'
                : 'Thống kê lượt tham quan từng di tích (17 Di tích)'}
            </h4>
            <p className="text-[11px] text-[#D8C9A9]/65 truncate">
              {isFirebaseDbConfigured()
                ? lang === 'en'
                  ? 'Real-time session-deduplicated counter synced with Firebase visit_stats.json'
                  : lang === 'zh'
                  ? '基于会话去重的真实计数，实时同步 Firebase visit_stats.json'
                  : 'Bộ đếm thực tế theo phiên truy cập, đồng bộ trực tiếp Firebase (visit_stats.json)'
                : lang === 'en'
                ? 'Real-time session-deduplicated counter (local backup active)'
                : lang === 'zh'
                ? '基于会话去重的真实计数（已启用本地存储备份）'
                : 'Bộ đếm thực tế theo phiên truy cập (lưu dự phòng trình duyệt)'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap items-center rounded-lg bg-[#171817] border border-[#C9A46A]/35 p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setSortMode('order')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1 ${
                sortMode === 'order'
                  ? 'bg-[#C9A46A] text-[#171817]'
                  : 'text-[#D8C9A9]/75 hover:text-[#D8C9A9]'
              }`}
            >
              <span>
                {lang === 'en'
                  ? 'Order 01 - 17'
                  : lang === 'zh'
                  ? '按编号 01 - 17'
                  : 'Thứ tự 01 - 17'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSortMode('desc')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1 ${
                sortMode === 'desc'
                  ? 'bg-[#C9A46A] text-[#171817]'
                  : 'text-[#D8C9A9]/75 hover:text-[#D8C9A9]'
              }`}
            >
              <ArrowUpDown className="w-3 h-3 shrink-0" />
              <span>
                {lang === 'en'
                  ? 'Highest → Lowest'
                  : lang === 'zh'
                  ? '由高到低'
                  : 'Cao nhất → Thấp nhất'}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#171817] hover:bg-[#A94F3D]/25 border border-[#A94F3D]/55 text-[#D8C9A9] text-[11px] font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#A94F3D] shrink-0" />
            <span>
              {lang === 'en'
                ? 'Reset Counter to 0'
                : lang === 'zh'
                ? '重置计数器为 0'
                : 'Đặt lại bộ đếm về 0'}
            </span>
          </button>
        </div>
      </div>

      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#171817] border border-[#C9A46A]/25 space-y-1">
          <div className="text-[11px] uppercase tracking-[0.08em] text-[#C9A46A] font-semibold">
            {lang === 'en'
              ? 'Total Visits'
              : lang === 'zh'
              ? '总参观人数'
              : 'Tổng lượt tham quan'}
          </div>
          <div className="text-2xl font-bold text-[#D8C9A9] tabular-nums">
            {computed.totalVisits.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#D8C9A9]/60">
            {lang === 'en'
              ? 'Across all 17 monuments'
              : lang === 'zh'
              ? '全馆 17 处遗迹累计'
              : 'Cộng dồn toàn bộ 17 di tích'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#171817] border border-[#A94F3D]/40 space-y-1 min-w-0">
          <div className="text-[11px] uppercase tracking-[0.08em] text-[#A94F3D] font-semibold">
            {lang === 'en'
              ? 'Most Visited Site'
              : lang === 'zh'
              ? '最受关注遗迹'
              : 'Di tích được quan tâm nhất'}
          </div>
          <div className="text-sm sm:text-base font-bold text-[#D8C9A9] truncate">
            {computed.totalVisits > 0 && computed.topSiteRow
              ? computed.topSiteRow.fullName
              : lang === 'en'
              ? 'No visits recorded yet'
              : lang === 'zh'
              ? '暂无新访问记录'
              : 'Chưa có lượt tham quan'}
          </div>
          <div className="text-[11px] text-[#C9A46A] font-semibold tabular-nums">
            {computed.topSiteRow
              ? lang === 'en'
                ? `#${computed.topSiteRow.code} · ${computed.topSiteRow.visitCount} visits`
                : lang === 'zh'
                ? `#${computed.topSiteRow.code} · ${computed.topSiteRow.visitCount} 次`
                : `Mã ${computed.topSiteRow.code} · ${computed.topSiteRow.visitCount} lượt`
              : '0'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#171817] border border-[#47796D]/45 space-y-1">
          <div className="text-[11px] uppercase tracking-[0.08em] text-[#47796D] font-semibold">
            {lang === 'en'
              ? 'Average per Monument'
              : lang === 'zh'
              ? '每处遗迹平均'
              : 'Trung bình mỗi di tích'}
          </div>
          <div className="text-2xl font-bold text-[#D8C9A9] tabular-nums">
            {computed.avgVisits.toFixed(1)}
          </div>
          <div className="text-[11px] text-[#D8C9A9]/60">
            {lang === 'en'
              ? 'Visits / 17 heritage sites'
              : lang === 'zh'
              ? '次 / 17 处历史遗迹'
              : 'Lượt / 17 điểm di tích'}
          </div>
        </div>
      </div>

      {/* Interactive Tooltip Banner + Color Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#D8C9A9]/80">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#A94F3D] inline-block" />
            <span>
              {lang === 'en' ? 'Highest' : lang === 'zh' ? '最高关注度' : 'Cao nhất'}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#47796D] inline-block" />
            <span>
              {lang === 'en' ? 'Teal Series' : lang === 'zh' ? '序列 A' : 'Nhóm Xanh cổ'}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#C9A46A] inline-block" />
            <span>
              {lang === 'en' ? 'Gold Series' : lang === 'zh' ? '序列 B' : 'Nhóm Vàng đồng'}
            </span>
          </span>
        </div>

        {/* Active Hover / Touch Tooltip Box */}
        <div
          className={`px-3 py-1.5 rounded-sm bg-[#171817] border transition-colors text-xs max-w-full ${
            activeBarItem
              ? 'border-[#C9A46A] text-[#D8C9A9]'
              : 'border-[#D8C9A9]/15 text-[#D8C9A9]/60'
          }`}
        >
          {activeBarItem ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#C9A46A] tabular-nums">{activeBarItem.code}</span>
              <span className="font-semibold text-[#D8C9A9] truncate max-w-[260px] sm:max-w-[360px]">
                {activeBarItem.fullName}
              </span>
              <span className="text-[#C9A46A] font-bold tabular-nums">
                {activeBarItem.visitCount}{' '}
                {lang === 'en' ? 'visits' : lang === 'zh' ? '次' : 'lượt'}
              </span>
              <span className="px-1.5 py-0.5 rounded-sm bg-[#526D8B]/30 border border-[#526D8B]/60 text-[#D8C9A9] text-[10.5px] font-semibold tabular-nums">
                {activeBarItem.percentage.toFixed(1)}%
              </span>
            </div>
          ) : (
            <span>
              {lang === 'en'
                ? 'Hover or tap any column to inspect monument details & share (%)'
                : lang === 'zh'
                ? '悬停或点击任意立柱查看遗迹详情与占比 (%)'
                : 'Di chuột hoặc chạm vào cột bất kỳ để xem tên đầy đủ, lượt xem và tỷ lệ (%)'}
            </span>
          )}
        </div>
      </div>

      {/* Pure React / SVG-styled Vertical Bar Chart (All 17 Monuments, horizontal scroll on narrow screens) */}
      <div className="rounded-xl bg-[#171817] border border-white/[0.08] p-3 sm:p-4 relative">
        <div className="overflow-x-auto heritage-scrollbar pt-20 pb-2 touch-pan-x">
          <div className="min-w-[760px] w-full">
            <div className="flex items-stretch gap-2">
              {/* Y-Axis Scale Column */}
              <div className="w-9 shrink-0 h-[230px] flex flex-col justify-between items-end pr-2 text-[10.5px] text-[#D8C9A9]/55 tabular-nums select-none">
                {computed.yTicks.map((tick, tIdx) => (
                  <span key={`y-tick-${tIdx}`} className="leading-none -translate-y-1">
                    {tick}
                  </span>
                ))}
              </div>

              {/* Plot Area with Gridlines + 17 Columns */}
              <div className="flex-1 relative">
                {/* Horizontal Gridlines */}
                <div className="relative h-[230px] flex flex-col justify-between pointer-events-none">
                  {computed.yTicks.map((_, idx) => (
                    <div
                      key={`grid-${idx}`}
                      className="w-full border-t border-[#D8C9A9]/15"
                    />
                  ))}
                </div>

                {/* 17 Vertical Bars Overlay */}
                <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-2 px-1">
                  {computed.rows.map((row, rowIdx) => {
                    const isTop =
                      computed.maxVisitCount > 0 && row.visitCount === computed.maxVisitCount;
                    const barColor = isTop
                      ? '#A94F3D'
                      : row.colorIndex % 2 === 0
                      ? '#47796D'
                      : '#C9A46A';
                    const heightPct =
                      row.visitCount > 0
                        ? Math.max(4, Math.min(100, (row.visitCount / computed.yAxisMax) * 100))
                        : 2;
                    const isActive = activeHoverCode === row.code;
                    const tooltipAlignClass =
                      rowIdx <= 1
                        ? 'left-0 translate-x-0'
                        : rowIdx >= computed.rows.length - 2
                        ? 'right-0 left-auto translate-x-0'
                        : 'left-1/2 -translate-x-1/2';

                    return (
                      <div
                        key={row.site.id}
                        className="flex-1 min-w-0 h-full flex flex-col justify-end items-center relative group"
                        onMouseEnter={() => setActiveHoverCode(row.code)}
                        onMouseLeave={() =>
                          setActiveHoverCode((prev) => (prev === row.code ? null : prev))
                        }
                        onClick={() =>
                          setActiveHoverCode((prev) => (prev === row.code ? null : row.code))
                        }
                        role="button"
                        tabIndex={0}
                        onFocus={() => setActiveHoverCode(row.code)}
                        onBlur={() =>
                          setActiveHoverCode((prev) => (prev === row.code ? null : prev))
                        }
                        aria-label={`${row.code} ${row.fullName}: ${row.visitCount}`}
                      >
                        {/* Floating Tooltip on Desktop Hover/Tap */}
                        {isActive && (
                          <div
                            className={`pointer-events-none absolute -top-2 -translate-y-full z-30 w-52 p-2.5 rounded-sm bg-[#171817] border border-[#C9A46A] shadow-2xl text-left ${tooltipAlignClass}`}
                          >
                            <div className="text-[10px] font-semibold text-[#C9A46A] uppercase tracking-wider">
                              #{row.code}
                            </div>
                            <div className="text-xs font-semibold text-[#D8C9A9] leading-snug mt-0.5">
                              {row.fullName}
                            </div>
                            <div className="mt-1.5 pt-1.5 border-t border-[#D8C9A9]/15 flex items-center justify-between text-[11px] tabular-nums">
                              <span className="font-bold text-[#D8C9A9]">
                                {row.visitCount}{' '}
                                {lang === 'en' ? 'visits' : lang === 'zh' ? '次' : 'lượt'}
                              </span>
                              <span className="font-semibold text-[#C9A46A]">
                                {row.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Exact Count Above Bar */}
                        <span
                          className={`text-[10.5px] font-semibold tabular-nums mb-1 transition-colors select-none ${
                            isTop
                              ? 'text-[#A94F3D]'
                              : isActive
                              ? 'text-[#D8C9A9]'
                              : 'text-[#D8C9A9]/85'
                          }`}
                        >
                          {row.visitCount}
                        </span>

                        {/* Vertical Bar */}
                        <div className="w-full max-w-[30px] flex-1 flex items-end justify-center cursor-pointer">
                          <div
                            className={`w-full rounded-t-md transition-all duration-500 ${
                              isActive ? 'brightness-125 ring-1 ring-[#D8C9A9]/70' : ''
                            }`}
                            style={{
                              height: `${heightPct}%`,
                              backgroundColor: barColor,
                              opacity: row.visitCount === 0 ? 0.35 : 1,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-Axis Labels (01..17 + Short Name) */}
            <div className="flex items-start gap-2 mt-2">
              <div className="w-9 shrink-0" />
              <div className="flex-1 flex items-start gap-1.5 sm:gap-2 px-1">
                {computed.rows.map((row) => {
                  const isTop =
                    computed.maxVisitCount > 0 && row.visitCount === computed.maxVisitCount;
                  const isActive = activeHoverCode === row.code;
                  return (
                    <button
                      key={`x-${row.site.id}`}
                      type="button"
                      onClick={() =>
                        setActiveHoverCode((prev) => (prev === row.code ? null : row.code))
                      }
                      className="flex-1 min-w-0 flex flex-col items-center text-center cursor-pointer group"
                      title={row.fullName}
                    >
                      <span
                        className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold tabular-nums transition-colors ${
                          isActive
                            ? 'bg-[#C9A46A] text-[#171817]'
                            : isTop
                            ? 'bg-[#A94F3D]/25 text-[#D8C9A9] border border-[#A94F3D]/60'
                            : 'bg-[#D8C9A9]/10 text-[#C9A46A]'
                        }`}
                      >
                        {row.code}
                      </span>
                      <span className="mt-1 text-[9.5px] leading-tight text-[#D8C9A9]/70 group-hover:text-[#D8C9A9] line-clamp-2 break-words w-full">
                        {row.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Resetting Counters to 0 */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-[120] bg-black/75 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-sm bg-[#171817] border border-[#C9A46A] p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-sm bg-[#A94F3D]/20 border border-[#A94F3D]/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-[#A94F3D]" />
              </div>
              <div className="space-y-1">
                <h5 className="text-sm font-bold text-[#D8C9A9]">
                  {lang === 'en'
                    ? 'Confirm Reset Visit Counters to 0'
                    : lang === 'zh'
                    ? '确认将所有参观计数器重置为 0'
                    : 'Xác nhận đặt lại bộ đếm lượt tham quan về 0'}
                </h5>
                <p className="text-xs text-[#D8C9A9]/80 leading-relaxed">
                  {lang === 'en'
                    ? 'This action resets visitCount of all 17 monuments to 0 in browser storage and Firebase Realtime Database (visit_stats.json).'
                    : lang === 'zh'
                    ? '此操作会将全部 17 处遗迹的参观次数清零，并同步更新至 Firebase Realtime Database（visit_stats.json）。'
                    : 'Hành động này sẽ đưa số lượt tham quan của toàn bộ 17 di tích về 0 trên máy cục bộ và đồng bộ trực tiếp lên Firebase Realtime Database (visit_stats.json).'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-1.5 rounded-sm bg-[#171817] hover:bg-white/[0.06] border border-[#D8C9A9]/30 text-xs font-semibold text-[#D8C9A9] cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : lang === 'zh' ? '取消' : 'Hủy bỏ'}
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={() => void handleConfirmReset()}
                className="px-3.5 py-1.5 rounded-sm bg-[#A94F3D] hover:bg-[#8E3F2F] text-xs font-semibold text-[#D8C9A9] cursor-pointer disabled:opacity-60"
              >
                {isResetting
                  ? lang === 'en'
                    ? 'Resetting...'
                    : lang === 'zh'
                    ? '正在重置...'
                    : 'Đang đặt lại...'
                  : lang === 'en'
                  ? 'Confirm Reset to 0'
                  : lang === 'zh'
                  ? '确认重置'
                  : 'Xác nhận đặt lại'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
