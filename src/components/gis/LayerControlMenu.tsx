import React, { useState } from 'react';
import { BaseMapMode } from '../../types/heritage';
import { useI18n } from '../../i18n/I18nContext';
import {
  Layers,
  Map as MapIcon,
  Satellite,
  History,
  Ruler,
  Split,
  ChevronDown,
  X,
  ShieldAlert,
} from 'lucide-react';

interface LayerControlMenuProps {
  baseMapMode: BaseMapMode;
  onChangeBaseMapMode: (mode: BaseMapMode) => void;
  showDistricts: boolean;
  onToggleDistricts: () => void;
  showWaterways: boolean;
  onToggleWaterways: () => void;
  showProtectionZones: boolean;
  onToggleProtectionZones: () => void;
  measureMode: boolean;
  onToggleMeasureMode: () => void;
  isSplitCompare: boolean;
  onToggleSplitCompare: () => void;
  historicalOpacity: number;
  onChangeHistoricalOpacity: (opacity: number) => void;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
  embedded?: boolean;
}

export const LayerControlMenu: React.FC<LayerControlMenuProps> = ({
  baseMapMode,
  onChangeBaseMapMode,
  showDistricts,
  onToggleDistricts,
  showWaterways,
  onToggleWaterways,
  showProtectionZones,
  onToggleProtectionZones,
  measureMode,
  onToggleMeasureMode,
  isSplitCompare,
  onToggleSplitCompare,
  historicalOpacity,
  onChangeHistoricalOpacity,
  isOpen: controlledIsOpen,
  onToggleOpen,
  embedded = false,
}) => {
  const { lang } = useI18n();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (next: boolean) => {
    if (onToggleOpen) onToggleOpen(next);
    else setInternalIsOpen(next);
  };

  const isHistoricalActive = baseMapMode.startsWith('historical');

  return (
    <div
      className={
        embedded
          ? 'relative z-30 flex flex-col items-end gap-2 pointer-events-none'
          : 'absolute max-sm:top-[136px] top-3 right-2.5 sm:top-4 sm:right-4 z-20 flex flex-col items-end gap-2 pointer-events-none'
      }
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Cream Paper Trigger Pill */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="pointer-events-auto h-9 px-3.5 bg-[#F4EFE4]/95 hover:bg-[#EDE4D0] backdrop-blur-2xl rounded-full border border-[#171817]/20 text-[#171817] text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all hover:border-[#A94F3D] cursor-pointer"
        aria-label={lang === 'zh' ? '打开地图图层面板' : lang === 'en' ? 'Open map layers panel' : 'Mở bảng điều khiển lớp bản đồ'}
      >
        <Layers className="w-3.5 h-3.5 text-[#A94F3D]" />
        <span className="font-semibold whitespace-nowrap">{lang === 'zh' ? '地图图层' : lang === 'en' ? 'Map Layers' : 'Lớp bản đồ'}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#171817]/65 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#A94F3D]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`pointer-events-auto ${
            embedded ? 'absolute right-0 top-11 z-40' : ''
          } w-[calc(100vw-24px)] max-w-80 sm:w-88 max-h-[calc(100dvh-200px)] sm:max-h-[calc(100vh-140px)] overflow-y-auto gis-scrollbar bg-[#F4EFE4] border border-[#171817]/20 rounded-[24px] shadow-[0_24px_60px_rgba(23,24,23,0.28)] p-4 text-xs text-[#171817] space-y-4 animate-apple-sheet`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Panel */}
          <div className="flex items-center justify-between border-b border-[#171817]/15 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#A94F3D]" />
              <span className="font-semibold text-[#171817] text-xs">
                {lang === 'zh' ? '空间显示选项' : lang === 'en' ? 'Spatial Display Options' : 'Tùy chọn hiển thị không gian'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-[#171817]/60 hover:text-[#171817] hover:bg-[#D8C9A9] transition-colors cursor-pointer"
              aria-label={lang === 'zh' ? '关闭地图图层面板' : lang === 'en' ? 'Close map layers panel' : 'Đóng bảng lớp bản đồ'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Nhóm Bản đồ nền: Hành chính & Vệ tinh */}
          <div className="space-y-1.5">
            <label className="text-xs font-sans text-[#171817]/75 block font-semibold">
              {lang === 'zh' ? '基础底图' : lang === 'en' ? 'Base Map' : 'Bản đồ nền'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeBaseMapMode('admin')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  baseMapMode === 'admin'
                    ? 'bg-[#A94F3D] border-[#A94F3D] text-[#D8C9A9] font-semibold'
                    : 'bg-[#EDE4D0] border-[#171817]/15 text-[#171817] hover:bg-[#D8C9A9]'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '行政底图' : lang === 'en' ? 'Cartographic' : 'Hành chính'}</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeBaseMapMode('satellite')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  baseMapMode === 'satellite'
                    ? 'bg-[#A94F3D] border-[#A94F3D] text-[#D8C9A9] font-semibold'
                    : 'bg-[#EDE4D0] border-[#171817]/15 text-[#171817] hover:bg-[#D8C9A9]'
                }`}
              >
                <Satellite className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '卫星底图' : lang === 'en' ? 'Satellite' : 'Vệ tinh'}</span>
              </button>
            </div>
          </div>

          {/* 2. Lớp Đồ bản Lịch sử Sài Gòn */}
          <div className="space-y-1.5 pt-2 border-t border-[#171817]/12">
            <div className="flex items-center justify-between">
              <label className="text-xs font-sans text-[#171817]/80 font-semibold flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#A94F3D]" />
                <span>{lang === 'zh' ? '西贡历史舆图叠加层' : lang === 'en' ? 'Historical Saigon Overlays' : 'Lớp lịch sử Sài Gòn'}</span>
              </label>
              {isHistoricalActive && (
                <button
                  type="button"
                  onClick={() => onChangeBaseMapMode('admin')}
                  className="text-[10px] text-[#A94F3D] font-semibold hover:underline cursor-pointer"
                >
                  {lang === 'zh' ? '关闭图层' : lang === 'en' ? 'Turn off' : 'Tắt lớp'}
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {[
                {
                  id: 'historical_1815' as BaseMapMode,
                  title: lang === 'zh' ? '1815年 八卦城（嘉定城）' : lang === 'en' ? 'Octagonal Citadel 1815' : 'Thành Bát Quái 1815',
                  sub: lang === 'zh' ? '陈文学舆图 - 嘉定古城堡垒格局' : lang === 'en' ? 'Tran Van Hoc Cartography - Gia Dinh Citadel' : 'Đồ bản Trần Văn Học - Thành Gia Định',
                },
                {
                  id: 'historical_1898' as BaseMapMode,
                  title: lang === 'zh' ? '1898年 西贡 - 堤岸' : lang === 'en' ? 'Saigon - Cho Lon 1898' : 'Sài Gòn - Chợ Lớn 1898',
                  sub: lang === 'zh' ? '法属时期林荫大道规划与填河工程' : lang === 'en' ? 'French colonial boulevard planning & canal reclamation' : 'Quy hoạch đại lộ thời Pháp & lấp kênh',
                },
                {
                  id: 'historical_1966' as BaseMapMode,
                  title: lang === 'zh' ? '1966年 西贡都城' : lang === 'en' ? 'Saigon Capital City 1966' : 'Đô thành Sài Gòn 1966',
                  sub: lang === 'zh' ? '独立宫中轴线与历史核心区' : lang === 'en' ? 'Independence Palace axis & historic core' : 'Trục Dinh Độc Lập & trung tâm di sản',
                },
              ].map((mapItem) => {
                const isActive = baseMapMode === mapItem.id;
                return (
                  <button
                    key={mapItem.id}
                    type="button"
                    onClick={() => onChangeBaseMapMode(isActive ? 'admin' : mapItem.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#C9A46A] border-[#171817] text-[#171817]'
                        : 'bg-[#EDE4D0] border-[#171817]/15 text-[#171817] hover:bg-[#D8C9A9]'
                    }`}
                  >
                    <div className="font-semibold text-xs text-[#171817]">
                      {mapItem.title}
                    </div>
                    <div className="text-[11px] text-[#171817]/75 mt-0.5">
                      {mapItem.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thanh trượt độ mờ và nút đối chiếu khi bật bản đồ lịch sử */}
          {isHistoricalActive && (
            <div className="p-3 bg-[#EDE4D0] rounded-xl border border-[#171817]/15 space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#171817] font-medium">{lang === 'zh' ? '历史地图不透明度：' : lang === 'en' ? 'Antique Map Opacity:' : 'Độ mờ lớp bản đồ cổ:'}</span>
                <span className="font-sans tabular-nums text-[#A94F3D] font-bold">
                  {Math.round(historicalOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={historicalOpacity}
                onChange={(e) => onChangeHistoricalOpacity(parseFloat(e.target.value))}
                className="w-full heritage-range-slider"
                style={{
                  background: `linear-gradient(to right, #C9A46A ${Math.round(historicalOpacity * 100)}%, rgba(23, 24, 23, 0.88) ${Math.round(historicalOpacity * 100)}%)`,
                }}
              />

              <button
                type="button"
                onClick={onToggleSplitCompare}
                className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isSplitCompare
                    ? 'bg-[#47796D] text-[#171817] border-[#171817]/30'
                    : 'bg-[#F4EFE4] border-[#171817]/20 text-[#171817] hover:bg-[#D8C9A9]'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>
                  {isSplitCompare
                    ? (lang === 'zh' ? '已开启分屏对比' : lang === 'en' ? 'Split Screen Active' : 'Đang bật chia đôi màn hình')
                    : (lang === 'zh' ? '开启古今分屏对比' : lang === 'en' ? 'Compare Past vs Present' : 'Bật đối chiếu Quá khứ / Hiện tại')}
                </span>
              </button>
            </div>
          )}

          {/* 3. Lớp Chuyên đề & Bảo vệ di sản (bật/tắt rõ ràng) */}
          <div className="space-y-1.5 pt-2 border-t border-[#171817]/12">
            <label className="text-xs font-sans text-[#171817]/75 font-semibold block">
              {lang === 'zh' ? '遗产保护区与空间 GIS 数据' : lang === 'en' ? 'Protection & Spatial GIS Data' : 'Lớp bảo vệ & Dữ liệu không gian'}
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#EDE4D0] hover:bg-[#D8C9A9] cursor-pointer transition-colors">
              <div className="flex items-center gap-2 text-[#171817] text-xs font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-[#A94F3D]" />
                <span>{lang === 'zh' ? '遗产保护缓冲带' : lang === 'en' ? 'Heritage Protection Buffer Zones' : 'Vùng bảo vệ di sản (Vành đai đệm)'}</span>
              </div>
              <input
                type="checkbox"
                checked={showProtectionZones}
                onChange={onToggleProtectionZones}
                className="accent-[#A94F3D] w-4 h-4 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#EDE4D0] hover:bg-[#D8C9A9] cursor-pointer transition-colors">
              <span className="text-[#171817] text-xs font-medium">
                {lang === 'zh' ? '西贡河与运河水系' : lang === 'en' ? 'Saigon River & Canal System' : 'Thủy hệ Sông Sài Gòn & Kênh rạch'}
              </span>
              <input
                type="checkbox"
                checked={showWaterways}
                onChange={onToggleWaterways}
                className="accent-[#A94F3D] w-4 h-4 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#EDE4D0] hover:bg-[#D8C9A9] cursor-pointer transition-colors">
              <span className="text-[#171817] text-xs font-medium">
                {lang === 'zh' ? '郡县行政边界' : lang === 'en' ? 'District Boundaries' : 'Ranh giới Quận / Huyện'}
              </span>
              <input
                type="checkbox"
                checked={showDistricts}
                onChange={onToggleDistricts}
                className="accent-[#A94F3D] w-4 h-4 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#EDE4D0] hover:bg-[#D8C9A9] cursor-pointer transition-colors">
              <div className="flex items-center gap-2 text-[#171817] text-xs font-medium">
                <Ruler className="w-3.5 h-3.5 text-[#47796D]" />
                <span>{lang === 'zh' ? 'GIS 空间测距工具' : lang === 'en' ? 'GIS Distance Measure Tool' : 'Thước đo khoảng cách GIS'}</span>
              </div>
              <input
                type="checkbox"
                checked={measureMode}
                onChange={onToggleMeasureMode}
                className="accent-[#A94F3D] w-4 h-4 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
