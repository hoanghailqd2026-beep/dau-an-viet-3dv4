import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { HeritageSite } from '../../types/heritage';
import { useI18n } from '../../i18n/I18nContext';
import {
  computeVisitTrendForecast,
  useVisitStats,
  type TrendDirection,
} from '../../utils/visitStatsSync';

interface HeritageTrendForecastPanelProps {
  sites: HeritageSite[];
}

function TrendArrowBadge({
  direction,
  delta,
  percent,
  lang,
}: {
  direction: TrendDirection;
  delta: number;
  percent?: number;
  lang: 'vi' | 'en' | 'zh';
}) {
  if (direction === 'up') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#47796D]/25 border border-[#47796D] text-[#D8C9A9] text-[11px] font-semibold tabular-nums">
        <TrendingUp className="w-3.5 h-3.5 text-[#47796D] shrink-0" />
        <span>
          +{delta}
          {typeof percent === 'number' ? ` (+${Math.abs(percent)}%)` : ''}
        </span>
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#A94F3D]/25 border border-[#A94F3D] text-[#D8C9A9] text-[11px] font-semibold tabular-nums">
        <TrendingDown className="w-3.5 h-3.5 text-[#A94F3D] shrink-0" />
        <span>
          {delta}
          {typeof percent === 'number' ? ` (-${Math.abs(percent)}%)` : ''}
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#C9A46A]/15 border border-[#C9A46A]/50 text-[#C9A46A] text-[11px] font-semibold tabular-nums">
      <Minus className="w-3.5 h-3.5 shrink-0" />
      <span>{lang === 'en' ? 'Steady' : lang === 'zh' ? '平稳' : 'Ổn định'}</span>
    </span>
  );
}

export const HeritageTrendForecastPanel: React.FC<HeritageTrendForecastPanelProps> = ({
  sites,
}) => {
  const { lang, getLocalizedSite } = useI18n();
  const visitStats = useVisitStats();

  const forecast = useMemo(
    () => computeVisitTrendForecast(visitStats, sites),
    [visitStats, sites]
  );

  // Build SVG path geometry for 7-day actual vs OLS regression line
  const svgGeometry = useMemo(() => {
    const w = 320;
    const h = 88;
    const padX = 14;
    const padY = 12;
    const pts = forecast.dailyPoints;
    const maxVal = Math.max(
      1,
      ...pts.map((p) => Math.max(p.actual, p.fitted)),
      ...(forecast.nextWeekDailyProjection.length > 0
        ? [forecast.nextWeekDailyProjection[0]]
        : [0])
    );

    const xStep = pts.length > 1 ? (w - padX * 2) / (pts.length - 1) : 0;
    const toY = (v: number) => h - padY - (v / maxVal) * (h - padY * 2);

    const actualCoords = pts.map((p, i) => ({
      x: padX + i * xStep,
      y: toY(p.actual),
      label: p.shortLabel,
      value: p.actual,
    }));

    const fittedCoords = pts.map((p, i) => ({
      x: padX + i * xStep,
      y: toY(p.fitted),
    }));

    const actualPath = actualCoords
      .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');
    const fittedPath = fittedCoords
      .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');

    return {
      width: w,
      height: h,
      actualCoords,
      actualPath,
      fittedPath,
    };
  }, [forecast]);

  const prioritizedSites = useMemo(() => {
    return [...forecast.siteForecasts]
      .sort(
        (a, b) =>
          Math.abs(b.projectedDelta) - Math.abs(a.projectedDelta) ||
          b.currentCount - a.currentCount
      )
      .slice(0, 4);
  }, [forecast.siteForecasts]);

  const directionColor =
    forecast.direction === 'up'
      ? '#47796D'
      : forecast.direction === 'down'
      ? '#A94F3D'
      : '#C9A46A';

  return (
    <section className="p-5 sm:p-6 rounded-2xl bg-[#171817] border border-[#C9A46A]/30 space-y-4 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8C9A9]/12 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#526D8B]/25 border border-[#526D8B]/60 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-[#C9A46A]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-semibold text-[#D8C9A9] truncate">
              {lang === 'en'
                ? 'Next-Week Visit Trend Forecast (Linear Regression)'
                : lang === 'zh'
                ? '下周参观趋势预测（线性回归分析）'
                : 'Dự báo Xu hướng Tham quan Tuần tới (Hồi quy Tuyến tính)'}
            </h4>
            <p className="text-[11px] text-[#D8C9A9]/65 truncate">
              {lang === 'en'
                ? 'OLS regression across 17 heritage monuments synced from Firebase visit_stats.json'
                : lang === 'zh'
                ? '基于 Firebase visit_stats.json 17 处遗迹历史访问数据的最小二乘回归预测'
                : 'Tính bằng phương pháp hồi quy tuyến tính OLS trên chuỗi lượt xem 7 ngày từ Firebase'}
            </p>
          </div>
        </div>

        <TrendArrowBadge
          direction={forecast.direction}
          delta={forecast.projectedDelta}
          percent={forecast.projectedPercentChange}
          lang={lang}
        />
      </div>

      {/* Summary + Sparkline + Top Moving Monuments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: 2 Compact Regression KPIs + Mini Trend Chart */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-[#222321] border border-[#C9A46A]/20 flex flex-col justify-between space-y-2">
            <div className="text-[11px] uppercase tracking-[0.07em] text-[#C9A46A] font-semibold">
              {lang === 'en'
                ? 'Projected Next 7 Days'
                : lang === 'zh'
                ? '预计下周总访问量'
                : 'Dự kiến tuần tới (7 ngày)'}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl font-bold text-[#D8C9A9] tabular-nums">
                {forecast.projectedNextWeekTotal.toLocaleString()}
              </span>
              {forecast.direction === 'up' ? (
                <TrendingUp className="w-6 h-6 text-[#47796D] shrink-0" />
              ) : forecast.direction === 'down' ? (
                <TrendingDown className="w-6 h-6 text-[#A94F3D] shrink-0" />
              ) : (
                <Minus className="w-6 h-6 text-[#C9A46A] shrink-0" />
              )}
            </div>
            <div className="text-[11px] text-[#D8C9A9]/70 flex items-center justify-between gap-2 tabular-nums">
              <span>
                {lang === 'en'
                  ? `Last 7d: ${forecast.currentWeekTotal}`
                  : lang === 'zh'
                  ? `过去7天：${forecast.currentWeekTotal}`
                  : `7 ngày qua: ${forecast.currentWeekTotal}`}
              </span>
              <span className="text-[#C9A46A] font-semibold">
                {forecast.slopePerDay >= 0 ? '+' : ''}
                {forecast.slopePerDay.toFixed(2)}/{lang === 'en' ? 'd' : lang === 'zh' ? '天' : 'ngày'}
              </span>
            </div>
          </div>

          {/* Mini OLS SVG Trendline Chart */}
          <div className="p-3.5 rounded-xl bg-[#222321] border border-[#D8C9A9]/12 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold text-[#D8C9A9]">
                {lang === 'en'
                  ? '7-Day Trajectory'
                  : lang === 'zh'
                  ? '7日趋势拟合线'
                  : 'Đường xu hướng 7 ngày'}
              </span>
              <span className="text-[10px] text-[#D8C9A9]/60 tabular-nums">
                R² = {forecast.rSquared.toFixed(2)}
              </span>
            </div>

            <svg
              viewBox={`0 0 ${svgGeometry.width} ${svgGeometry.height}`}
              className="w-full h-20 overflow-visible mt-1"
              aria-label="Visit trend regression chart"
            >
              <line
                x1="14"
                y1={svgGeometry.height - 12}
                x2={svgGeometry.width - 14}
                y2={svgGeometry.height - 12}
                stroke="rgba(216,201,169,0.18)"
                strokeWidth="1"
              />
              <path
                d={svgGeometry.fittedPath}
                fill="none"
                stroke={directionColor}
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <path
                d={svgGeometry.actualPath}
                fill="none"
                stroke="#C9A46A"
                strokeWidth="2"
              />
              {svgGeometry.actualCoords.map((pt, idx) => (
                <g key={pt.label + idx}>
                  <circle cx={pt.x} cy={pt.y} r="3" fill="#171817" stroke="#C9A46A" strokeWidth="1.5" />
                </g>
              ))}
            </svg>

            <div className="flex items-center justify-between text-[10px] text-[#D8C9A9]/60 tabular-nums">
              <span>{forecast.dailyPoints[0]?.shortLabel}</span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-[#C9A46A] inline-block" />
                  {lang === 'en' ? 'Actual' : lang === 'zh' ? '实际' : 'Thực tế'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span
                    className="w-2 h-0.5 inline-block"
                    style={{ backgroundColor: directionColor }}
                  />
                  {lang === 'en' ? 'OLS' : lang === 'zh' ? '回归' : 'Hồi quy'}
                </span>
              </span>
              <span>{forecast.dailyPoints[forecast.dailyPoints.length - 1]?.shortLabel}</span>
            </div>
          </div>
        </div>

        {/* Right: Monument Momentum Breakdown */}
        <div className="lg:col-span-5 p-3.5 rounded-xl bg-[#222321] border border-[#D8C9A9]/12 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] border-b border-[#D8C9A9]/10 pb-1.5">
            <span className="font-semibold text-[#C9A46A] uppercase tracking-[0.06em]">
              {lang === 'en'
                ? 'Key Monument Signals'
                : lang === 'zh'
                ? '重点遗迹趋势信号'
                : 'Biến động dự kiến theo di tích'}
            </span>
            <span className="text-[#D8C9A9]/60 tabular-nums">
              {forecast.activeDaysCount}/7 {lang === 'en' ? 'active days' : lang === 'zh' ? '活跃天' : 'ngày có dữ liệu'}
            </span>
          </div>

          <div className="space-y-1.5">
            {prioritizedSites.map((item) => {
              const loc = getLocalizedSite(item.site);
              return (
                <div
                  key={item.site.id}
                  className="flex items-center justify-between gap-2 py-1 text-xs border-b border-[#D8C9A9]/[0.06] last:border-b-0"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="text-[10.5px] font-bold text-[#C9A46A] tabular-nums shrink-0">
                      {item.code}
                    </span>
                    <span className="text-[#D8C9A9] truncate">{loc.officialName}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[11px] text-[#D8C9A9]/65 tabular-nums">
                      {item.currentCount}
                    </span>
                    <TrendArrowBadge
                      direction={item.direction}
                      delta={item.projectedDelta}
                      lang={lang}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
