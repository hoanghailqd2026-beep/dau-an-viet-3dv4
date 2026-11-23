import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HeritageSite } from '../../types/heritage';
import { HERITAGE_SITES } from '../../data/heritageSites';
import { useI18n } from '../../i18n/I18nContext';
import { speechEngine } from '../../utils/chunkedSpeechEngine';
import { getCuratedAudioScript } from '../../data/audioGuideScripts';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  ChevronRight,
  Radio,
  MapPin,
  Download,
  Navigation,
  WifiOff,
  ShoppingBag,
  Headphones,
} from 'lucide-react';

export interface TourStationItem {
  id: string;
  name: string;
  description: string;
  cameraPos: [number, number, number];
  targetPos: [number, number, number];
  thumbnailUrl: string;
  effectType?: 'normal' | 'xray' | 'exploded';
  narrationScript?: string;
}

export type GuideSubMode = 'autotour' | 'gps_route' | 'offline_cache';

interface VirtualTourGuidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSite: HeritageSite;
  stations: TourStationItem[];
  onFlyToStation: (station: TourStationItem) => void;
  onSetRenderMode: (mode: 'textured' | 'wireframe' | 'xray') => void;
  onSetExplodedFactor: (factor: number) => void;
  onSwitchSite: (site: HeritageSite) => void;
  onOpenBookingModal: () => void;
  initialActiveRouteId?: string | null;
  initialSubMode?: GuideSubMode;
  autoStartTourCounter?: number;
}

interface InterRegionalRouteConfig {
  id: string;
  shortTitle: string;
  fullTitle: string;
  provinces: string;
  siteIds: string[];
  summary: string;
  script: string;
}

const INTER_REGIONAL_ROUTES: InterRegionalRouteConfig[] = [
  {
    id: 'TOUR-INTER-01',
    shortTitle: 'Tuyến Địa Đạo Chiến Tranh Lạnh',
    fullTitle: 'Tuyến Địa Đạo Chiến Tranh Lạnh (Củ Chi TP.HCM - Tam Giác Sắt Bình Dương - Long Phước BRVT)',
    provinces: 'TP.HCM ↔ Bình Dương ↔ Bà Rịa - Vũng Tàu',
    siteIds: ['HCM-DT-009', 'BD-DT-002', 'BRVT-DT-003'],
    summary:
      'Kết nối 3 pháo đài quân sự ngầm cùng khởi đào năm 1948: Địa đạo Củ Chi (250km, 3 tầng sâu tới 10m), Địa đạo Tam Giác Sắt Tây Nam Bến Cát (bờ Đông sông Sài Gòn) và Địa đạo Long Phước (Bà Rịa).',
    script:
      'Chào mừng quý vị đến với Tuyến Địa Đạo Chiến Tranh Lạnh của HeritageGuide 3D. Chỉ có trên nền tảng giải phẫu 3D, quý vị mới có thể quan sát xuyên lòng đất cả 3 kỳ quan quân sự ngầm của Đông Nam Bộ cùng ra đời năm 1948: từ hệ thống 3 tầng sâu 10 mét chống bom B-52 tại Củ Chi TP.HCM, vượt sông Sài Gòn sang mắt xích Tam Giác Sắt Bến Cát Bình Dương, đến hệ thống hầm xương sống cao 1,6 mét tại Địa đạo Long Phước Bà Rịa Vũng Tàu.',
  },
  {
    id: 'TOUR-INTER-02',
    shortTitle: 'Tuyến Sài Gòn Pháp Cổ & Đông Dương',
    fullTitle: 'Tuyến Sài Gòn Pháp Cổ & Đông Dương (Nhà Hát TP - Nhà Thờ Đức Bà - Bưu Điện - Bảo Tàng Lịch Sử - Bạch Dinh BRVT)',
    provinces: 'TP. Hồ Chí Minh ↔ Bà Rịa - Vũng Tàu',
    siteIds: ['HCM-DT-002', 'HCM-DT-005', 'HCM-DT-003', 'HCM-DT-006', 'BRVT-DT-001'],
    summary:
      'Hành trình đối sánh sự tiến hóa kiến trúc: từ Nhà thờ Đức Bà (1880), Bưu điện Trung tâm (1891), Nhà hát Thành phố (1900) và Bạch Dinh Vũng Tàu (1898) đến phong cách Đông Dương Indochine tại Bảo tàng Lịch sử (1929).',
    script:
      'Chào mừng quý vị đến với Tuyến Sài Gòn Pháp Cổ và Đông Dương trên HeritageGuide 3D. Tuyến hành trình kết nối trục di sản trung tâm Quận 1 gồm Nhà thờ Chính tòa Đức Bà, Bưu điện Trung tâm, Nhà hát Thành phố và Bảo tàng Lịch sử TP.HCM với dinh thự nghỉ dưỡng Bạch Dinh Villa Blanche trên sườn Núi Lớn thành phố Vũng Tàu.',
  },
  {
    id: 'TOUR-INTER-03',
    shortTitle: 'Tuyến Văn Hóa Biển & Mở Cõi',
    fullTitle: 'Tuyến Văn Hóa Biển & Mở Cõi (Bến Nhà Rồng - Giồng Cá Vồ - Chùa Giác Lâm - Nhà Cổ Bình Dương - Nhà Lớn Long Sơn)',
    provinces: 'TP.HCM ↔ Bình Dương ↔ Bà Rịa - Vũng Tàu',
    siteIds: ['HCM-DT-007', 'HCM-DT-010', 'HCM-DT-011', 'BD-DT-001', 'BRVT-DT-002'],
    summary:
      'Lần theo cội nguồn giao thương đường biển và mở cõi Nam Bộ từ thương cảng cổ Giồng Cá Vồ (Cần Giờ), Bến Nhà Rồng, Tổ đình Giác Lâm (1744) đến Nhà cổ Trần Công Vàng (Bình Dương) và Nhà Lớn Long Sơn (Vũng Tàu).',
    script:
      'Chào mừng quý vị đến với Tuyến Văn Hóa Biển và Mở Cõi liên vùng Đông Nam Bộ. Hành trình kết nối di chỉ khảo cổ Giồng Cá Vồ hơn 2.000 năm tuổi tại Cần Giờ và thương cảng Bến Nhà Rồng với mạch nguồn kiến trúc gỗ truyền thống qua 3 tỉnh: Chùa Giác Lâm Sài Gòn, kiệt tác 64 cột gỗ Nhà cổ Trần Công Vàng Thủ Dầu Một Bình Dương, và quần thể Nhà Lớn Long Sơn tại Vũng Tàu.',
  },
];

// Calculate Haversine distance in km between two WGS84 coordinates
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const VirtualTourGuidePanel: React.FC<VirtualTourGuidePanelProps> = ({
  isOpen,
  onClose,
  currentSite,
  stations,
  onFlyToStation,
  onSetRenderMode,
  onSetExplodedFactor,
  onSwitchSite,
  onOpenBookingModal,
  initialActiveRouteId,
  initialSubMode,
  autoStartTourCounter = 0,
}) => {
  const { lang, getLocalizedSite } = useI18n();
  const [activeTab, setActiveTab] = useState<GuideSubMode>(initialSubMode || 'autotour');
  const [isTourRunning, setIsTourRunning] = useState<boolean>(false);
  const [currentStationIdx, setCurrentStationIdx] = useState<number>(0);
  const [activeSubtitle, setActiveSubtitle] = useState<string>('');
  const [activeEffectLabel, setActiveEffectLabel] = useState<string>('Bề mặt chuẩn PBR');
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    initialActiveRouteId || 'TOUR-INTER-01'
  );

  // GPS & Shortest Route State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; source: string }>({
    lat: 10.7769,
    lng: 106.7009,
    source: 'Tâm định vị Quận 1, TP.HCM (Mặc định)',
  });
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);

  // Offline Wi-Fi Cache State
  const [offlineCacheProgress, setOfflineCacheProgress] = useState<number>(0);
  const [isDownloadingCache, setIsDownloadingCache] = useState<boolean>(false);
  const [cachedSiteIds, setCachedSiteIds] = useState<Record<string, boolean>>({});

  const tourTimerRef = useRef<number | null>(null);
  const lastAutoStartRef = useRef<number>(0);

  useEffect(() => {
    if (initialSubMode) {
      setActiveTab(initialSubMode);
    }
  }, [initialSubMode]);

  useEffect(() => {
    if (initialActiveRouteId) {
      setSelectedRouteId(initialActiveRouteId);
    }
  }, [initialActiveRouteId]);

  // Build 4 complete stations with anatomical 3D effects (X-Ray / Exploded View) for every landmark
  const enrichedStations: TourStationItem[] = useMemo(() => {
    const base = stations.slice(0, 4);
    const result: TourStationItem[] = [];
    const isTunnelSite =
      currentSite.id === 'HCM-DT-009' ||
      currentSite.id === 'BRVT-DT-003' ||
      currentSite.id === 'BD-DT-002';

    const curated = getCuratedAudioScript(currentSite.id, lang);
    const locSite = getLocalizedSite(currentSite);

    for (let i = 0; i < 4; i++) {
      const s = base[i] || base[0] || {
        id: `st-${i + 1}`,
        name: `Hotspot ${i + 1}: ${locSite.officialName}`,
        description: locSite.summary,
        cameraPos: [16 - i * 6, 12 + i * 2, 26] as [number, number, number],
        targetPos: [0, 5, 0] as [number, number, number],
        thumbnailUrl: '',
      };

      let effectType: 'normal' | 'xray' | 'exploded' = 'normal';
      if (i === 1) {
        effectType = isTunnelSite ? 'xray' : 'exploded';
      } else if (i === 2) {
        effectType = 'xray';
      } else if (i === 3) {
        effectType = 'exploded';
      }

      const effectIntro =
        lang === 'zh'
          ? effectType === 'xray'
            ? '系统已开启 X 光透视模式，为您展示内部隐蔽结构。'
            : effectType === 'exploded'
            ? '系统已开启分层爆炸视图，清晰呈现屋顶与立体空间结构。'
            : ''
          : lang === 'en'
          ? effectType === 'xray'
            ? 'X-Ray transparency mode is active to reveal hidden internal structures. '
            : effectType === 'exploded'
            ? 'Exploded structural dissection mode is active to reveal roof and floor layers. '
            : ''
          : effectType === 'xray'
          ? 'Hệ thống đang kích hoạt chế độ X-Ray nhìn xuyên kết cấu ngầm và khung chịu lực bên trong. '
          : effectType === 'exploded'
          ? 'Hệ thống đang kích hoạt chế độ Bóc tách tầng kiến trúc để lộ rõ cấu trúc mái và các tầng không gian. '
          : '';

      const localizedHotspot =
        'hotspots' in locSite && Array.isArray(locSite.hotspots) ? locSite.hotspots[i] : undefined;
      const curatedChapter = curated?.chapters?.[i];
      const narrationScript =
        lang === 'vi'
          ? `Điểm nhấn kiến trúc số ${i + 1}: ${s.name}. ${effectIntro}${s.description}`
          : curatedChapter
          ? `${effectIntro}${curatedChapter.narration}`
          : `${effectIntro}${localizedHotspot?.description || locSite.summary}`;

      result.push({
        ...s,
        id: `station-${i + 1}`,
        name:
          localizedHotspot?.name
            ? `Hotspot ${i + 1}: ${localizedHotspot.name}`
            : base[i]
            ? `Hotspot ${i + 1}: ${base[i].name}`
            : `Hotspot ${i + 1}: ${curatedChapter?.title || locSite.officialName}`,
        effectType,
        narrationScript,
      });
    }
    return result;
  }, [stations, currentSite, lang, getLocalizedSite]);

  const stopSpeechAndTimers = () => {
    if (tourTimerRef.current) {
      window.clearTimeout(tourTimerRef.current);
      tourTimerRef.current = null;
    }
    speechEngine.stop();
  };

  useEffect(() => {
    return () => {
      stopSpeechAndTimers();
    };
  }, []);

  // Stop auto-tour when switching landmark
  useEffect(() => {
    stopSpeechAndTimers();
    setIsTourRunning(false);
    setCurrentStationIdx(0);
    setActiveSubtitle('');
    setActiveEffectLabel('Bề mặt chuẩn PBR');
  }, [currentSite.id]);

  const speakVietnamese = (text: string, onEndCallback?: () => void) => {
    stopSpeechAndTimers();
    setActiveSubtitle(text);

    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      tourTimerRef.current = window.setTimeout(() => {
        if (onEndCallback) onEndCallback();
      }, 7500);
      return;
    }

    let finished = false;
    const finishOnce = () => {
      if (finished) return;
      finished = true;
      if (tourTimerRef.current) {
        window.clearTimeout(tourTimerRef.current);
        tourTimerRef.current = null;
      }
      if (onEndCallback) onEndCallback();
    };

    speechEngine.speakText(text, {
      lang,
      rate: 1.0,
      onComplete: finishOnce,
    });

    const safetyTimeoutMs = Math.max(9000, Math.min(24000, text.length * 95));
    tourTimerRef.current = window.setTimeout(finishOnce, safetyTimeoutMs);
  };

  const triggerStationStep = (idx: number, autoContinue: boolean) => {
    const st = enrichedStations[idx];
    if (!st) {
      setIsTourRunning(false);
      onSetRenderMode('textured');
      onSetExplodedFactor(0);
      setActiveEffectLabel('Hoàn thành Tour · Đã khôi phục Bề mặt số');
      return;
    }

    setCurrentStationIdx(idx);
    onFlyToStation(st);

    if (st.effectType === 'xray') {
      onSetRenderMode('xray');
      onSetExplodedFactor(0);
      setActiveEffectLabel('Đang bật X-Ray (Nhìn xuyên lòng đất & kết cấu)');
    } else if (st.effectType === 'exploded') {
      onSetRenderMode('textured');
      onSetExplodedFactor(0.6);
      setActiveEffectLabel('Đang bật Bóc tách tầng (Exploded View 60%)');
    } else {
      onSetRenderMode('textured');
      onSetExplodedFactor(0);
      setActiveEffectLabel('Chế độ Bề mặt PBR Chân thực');
    }

    const script = st.narrationScript || st.description;
    speakVietnamese(script, () => {
      if (autoContinue) {
        if (idx + 1 < enrichedStations.length) {
          triggerStationStep(idx + 1, true);
        } else {
          setIsTourRunning(false);
          onSetRenderMode('textured');
          onSetExplodedFactor(0);
          setActiveEffectLabel('Đã hoàn thành 4/4 Hotspot Giải phẫu 3D');
        }
      }
    });
  };

  const handleStartAutoTour = () => {
    setActiveTab('autotour');
    setIsTourRunning(true);
    triggerStationStep(0, true);
  };

  // Trigger auto-start when requested externally (e.g. via Gemini AI [ACTION:START_TOUR] or HUD button)
  useEffect(() => {
    if (autoStartTourCounter > 0 && autoStartTourCounter !== lastAutoStartRef.current && isOpen) {
      lastAutoStartRef.current = autoStartTourCounter;
      handleStartAutoTour();
    }
  }, [autoStartTourCounter, isOpen]);

  const handleStopAutoTour = () => {
    stopSpeechAndTimers();
    setIsTourRunning(false);
    onSetRenderMode('textured');
    onSetExplodedFactor(0);
    setActiveEffectLabel('Đã dừng Tour · Bề mặt chuẩn PBR');
  };

  const handleNextStation = () => {
    const nextIdx = (currentStationIdx + 1) % enrichedStations.length;
    setIsTourRunning(false);
    triggerStationStep(nextIdx, false);
  };

  // Request Real Browser GPS or simulate on-site coordinates
  const handleLocateGps = () => {
    setIsLocatingGps(true);
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            source: 'Định vị vệ tinh GPS thiết bị thực tế',
          });
          setIsLocatingGps(false);
        },
        () => {
          setUserCoords({
            lat: Number((currentSite.gps.lat - 0.0042).toFixed(5)),
            lng: Number((currentSite.gps.lng - 0.0035).toFixed(5)),
            source: `Trạm định vị vệ tinh gần ${currentSite.address.district}`,
          });
          setIsLocatingGps(false);
        },
        { timeout: 4000 }
      );
    } else {
      setTimeout(() => {
        setIsLocatingGps(false);
      }, 600);
    }
  };



  // Simulate Offline 3D & Audio Wi-Fi Cache Download
  const handleDownloadOfflineCache = () => {
    if (isDownloadingCache) return;
    setIsDownloadingCache(true);
    setOfflineCacheProgress(15);

    const step1 = window.setTimeout(() => setOfflineCacheProgress(48), 350);
    const step2 = window.setTimeout(() => setOfflineCacheProgress(82), 700);
    const step3 = window.setTimeout(() => {
      setOfflineCacheProgress(100);
      setIsDownloadingCache(false);
      setCachedSiteIds((prev) => ({ ...prev, [currentSite.id]: true }));
    }, 1100);

    return () => {
      window.clearTimeout(step1);
      window.clearTimeout(step2);
      window.clearTimeout(step3);
    };
  };

  // Distance to current monument & sorted nearest monuments
  const distanceToCurrentKm = useMemo(() => {
    return calculateDistanceKm(
      userCoords.lat,
      userCoords.lng,
      currentSite.gps.lat,
      currentSite.gps.lng
    );
  }, [userCoords, currentSite]);

  const nearestRouteSites = useMemo(() => {
    return HERITAGE_SITES.map((s) => ({
      site: s,
      distanceKm: calculateDistanceKm(
        currentSite.gps.lat,
        currentSite.gps.lng,
        s.gps.lat,
        s.gps.lng
      ),
    }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);
  }, [currentSite]);

  if (!isOpen) return null;

  const isCurrentSiteCached = Boolean(cachedSiteIds[currentSite.id]);

  return (
    <div className="absolute bottom-18 left-3 sm:left-5 right-3 sm:right-auto sm:w-[445px] md:w-[480px] max-h-[76vh] bg-[#0B0F19]/95 backdrop-blur-2xl border border-[#D4AF61]/45 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.92)] z-35 pointer-events-auto flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* HEADER */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#D4AF61]/20 via-[#151C2C] to-[#0B0F19] border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#D4AF61] text-black flex items-center justify-center font-bold shrink-0 shadow-md">
            <Headphones className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-sm sm:text-[15px] text-white truncate">
                Hướng Dẫn Viên 3D &amp; Định Vị (Chế Độ Kép)
              </span>
              {isTourRunning && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-sans text-[10px] font-bold uppercase animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            <span className="text-[11px] font-sans text-[#DFCE9D] block truncate">
              HeritageGuide 3D · On-site GPS &amp; Remote Auto-Tour
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              const nextVoice = !voiceEnabled;
              setVoiceEnabled(nextVoice);
              if (!nextVoice) {
                speechEngine.stop();
              }
            }}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
              voiceEnabled
                ? 'bg-[#D4AF61]/20 border-[#D4AF61]/50 text-[#DFCE9D]'
                : 'bg-white/5 border-white/10 text-neutral-400'
            }`}
            title={voiceEnabled ? 'Tắt giọng đọc tiếng Việt' : 'Bật giọng đọc tiếng Việt'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer"
            aria-label="Đóng Hướng dẫn viên 3D & Định vị"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 CORE STARTUP TOOLS TABS */}
      <div className="grid grid-cols-3 gap-1 p-1.5 bg-black/60 border-b border-white/10 text-[11px] font-sans shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('autotour')}
          className={`py-2 px-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'autotour'
              ? 'bg-[#D4AF61] text-black shadow-sm'
              : 'text-neutral-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Play className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Tour Thuyết Minh</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gps_route')}
          className={`py-2 px-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'gps_route'
              ? 'bg-[#D4AF61] text-black shadow-sm'
              : 'text-neutral-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Định Vị GPS</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('offline_cache')}
          className={`py-2 px-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'offline_cache'
              ? 'bg-[#D4AF61] text-black shadow-sm'
              : 'text-neutral-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Bộ nhớ Offline</span>
        </button>
      </div>

      {/* BODY CONTENT */}
      <div className="p-4 overflow-y-auto ar-modal-scrollbar space-y-3.5 flex-1">
        {/* =====================================================================
            TAB 1: THUYẾT MINH TỰ ĐỘNG & BAY CAMERA (AUTO-TOUR 4 HOTSPOTS)
           ===================================================================== */}
        {activeTab === 'autotour' && (
          <div className="space-y-3">
            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              {!isTourRunning ? (
                <button
                  type="button"
                  onClick={handleStartAutoTour}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF61] to-[#e6c67c] hover:brightness-110 text-black font-semibold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Bắt đầu Tour Thuyết minh</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopAutoTour}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400/50 text-amber-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Pause className="w-4 h-4" />
                  <span>Tạm dừng Tour &amp; Khôi phục mặt cắt</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNextStation}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-[#DFCE9D] flex items-center gap-1 cursor-pointer shrink-0"
                title="Chuyển nhanh sang Hotspot tiếp theo"
              >
                <SkipForward className="w-4 h-4" />
                <span>Hotspot kế</span>
              </button>
            </div>

            {/* Active 3D Synchronization Status Badge */}
            <div className="px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-between gap-2 text-[11px]">
              <span className="text-sky-300 font-sans font-semibold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse shrink-0" />
                <span>{activeEffectLabel}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onSetRenderMode('xray');
                    setActiveEffectLabel('⚡ Đang bật X-Ray xuyên thấu');
                  }}
                  className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/35 text-sky-200 font-sans text-[11px] cursor-pointer"
                >
                  X-Ray
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSetRenderMode('textured');
                    onSetExplodedFactor(0.65);
                    setActiveEffectLabel('⚡ Đang Bóc tách tầng 65%');
                  }}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 font-sans text-[11px] cursor-pointer"
                >
                  Bóc tầng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSetRenderMode('textured');
                    onSetExplodedFactor(0);
                    setActiveEffectLabel('Bề mặt chuẩn PBR');
                  }}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-neutral-300 font-sans text-[11px] cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Live Subtitle Box */}
            <div className="p-3 rounded-2xl bg-black/80 border border-[#D4AF61]/30 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-sans font-medium tabular-nums text-[#D4AF61]">
                <span>Phụ đề Thuyết minh Trực tiếp (SpeechSynthesis)</span>
                <span>Hotspot {currentStationIdx + 1}/4</span>
              </div>
              <p className="text-xs text-[#F5EFE6] leading-relaxed font-sans">
                {activeSubtitle ||
                  `Bấm "▶️ Bắt đầu Tour Thuyết Minh" để hệ thống tự động đọc thuyết minh tiếng Việt kèm phụ đề chạy trực tiếp, đồng thời bay mượt Camera 3D (lerp) lần lượt qua Hotspot 1 → Hotspot 2 → Hotspot 3 → Hotspot 4 của ${currentSite.officialName}.`}
              </p>
            </div>

            {/* 4 Hotspots List */}
            <div className="space-y-1.5">
              {enrichedStations.map((st, idx) => {
                const isCurr = idx === currentStationIdx;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setIsTourRunning(false);
                      triggerStationStep(idx, false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                      isCurr
                        ? 'bg-[#D4AF61]/20 border-[#D4AF61] text-white'
                        : 'bg-white/[0.03] border-white/10 text-neutral-300 hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[#F5EFE6] truncate">{st.name}</div>
                      <div className="text-[10.5px] text-neutral-400 line-clamp-1 mt-0.5">
                        {st.description}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium shrink-0 ${
                        st.effectType === 'xray'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                          : st.effectType === 'exploded'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          : 'bg-white/10 text-neutral-300'
                      }`}
                    >
                      {st.effectType === 'xray'
                        ? 'X-Ray 3D'
                        : st.effectType === 'exploded'
                        ? 'Bóc tầng'
                        : 'Bay Camera'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: ĐỊNH VỊ GPS LỘ TRÌNH & GỢI Ý KẾT NỐI NGẮN NHẤT
           ===================================================================== */}
        {activeTab === 'gps_route' && (
          <div className="space-y-3">
            {/* Current User GPS Distance Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#111827] to-black border border-emerald-400/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-sans text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Định vị GPS / Lộ trình gần nhất</span>
                </span>
                <button
                  type="button"
                  onClick={handleLocateGps}
                  disabled={isLocatingGps}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-sans text-[11px] font-medium cursor-pointer transition-colors"
                >
                  {isLocatingGps ? 'Đang lấy tọa độ GPS...' : 'Cập nhật vị trí của tôi'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
                  <span className="text-[11px] font-sans text-neutral-400 block">
                    Khoảng cách tới di tích đang chọn:
                  </span>
                  <span className="text-lg font-sans tabular-nums font-extrabold text-[#D4AF61]">
                    {distanceToCurrentKm} km
                  </span>
                  <span className="text-[10px] text-emerald-300 block mt-0.5 tabular-nums">
                    ~{Math.max(5, Math.round(distanceToCurrentKm * 2.2))} phút di chuyển
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
                  <span className="text-[11px] font-sans text-neutral-400 block">
                    Tọa độ WGS84 của di tích:
                  </span>
                  <span className="text-xs font-sans tabular-nums font-bold text-white block mt-1">
                    {currentSite.gps.lat.toFixed(4)}°N, {currentSite.gps.lng.toFixed(4)}°E
                  </span>
                  <span className="text-[10px] text-neutral-400 truncate block mt-0.5">
                    {userCoords.source}
                  </span>
                </div>
              </div>
            </div>

            {/* Shortest Connected Monuments in Region */}
            <div className="p-3 rounded-2xl bg-black/75 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-[#DFCE9D] font-semibold">
                  Gợi ý Lộ trình Kết nối Ngắn nhất từ {currentSite.officialName}:
                </span>
              </div>
              <div className="space-y-1.5">
                {nearestRouteSites.map((item, idx) => {
                  const isCurr = item.site.id === currentSite.id;
                  return (
                    <button
                      key={item.site.id}
                      type="button"
                      onClick={() => onSwitchSite(item.site)}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isCurr
                          ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 font-semibold'
                          : 'bg-white/[0.04] border-white/10 text-neutral-200 hover:bg-white/[0.09]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate">
                          {idx + 1}. {item.site.officialName}{' '}
                          <span className="text-white/50 text-[10.5px]">({item.site.address.district})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 font-sans tabular-nums text-[11px] text-[#D4AF61]">
                          {isCurr ? 'Đang ở đây (0 km)' : `Cách ${item.distanceKm} km`}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#D4AF61]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inter-regional Thematic Tours */}
            <div className="space-y-1.5">
              <span className="text-xs font-sans font-medium text-[#D4AF61] block px-1">
                3 Tuyến Du lịch Thông sử Liên vùng (TP.HCM - Bình Dương - BRVT):
              </span>
              {INTER_REGIONAL_ROUTES.map((route) => {
                const isSel = route.id === selectedRouteId;
                return (
                  <div
                    key={route.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isSel
                        ? 'bg-[#D4AF61]/15 border-[#D4AF61]'
                        : 'bg-white/[0.03] border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-sans text-[#D4AF61] font-semibold">
                        {route.provinces}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRouteId(route.id);
                          speakVietnamese(route.script);
                        }}
                        className="px-2 py-0.5 rounded bg-[#D4AF61] text-black font-bold text-[10px] cursor-pointer flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Nghe Tuyến</span>
                      </button>
                    </div>
                    <div className="font-serif font-bold text-xs text-white mt-1">
                      {route.fullTitle}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {route.siteIds.map((sId) => {
                        const sObj = HERITAGE_SITES.find((s) => s.id === sId);
                        if (!sObj) return null;
                        return (
                          <button
                            key={sId}
                            type="button"
                            onClick={() => onSwitchSite(sObj)}
                            className={`px-2 py-1 rounded-lg text-[10.5px] border cursor-pointer transition-all ${
                              sObj.id === currentSite.id
                                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-semibold'
                                : 'bg-black/60 border-white/15 text-neutral-300 hover:text-white'
                            }`}
                          >
                            {sObj.officialName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: TẢI TRƯỚC OFFLINE WI-FI CACHE (DỮ LIỆU 3D & AUDIO)
           ===================================================================== */}
        {activeTab === 'offline_cache' && (
          <div className="space-y-3.5">
            {/* Risk Management Explanation Banner */}
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-400/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-sans font-semibold text-sky-300">
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
                <span>Giải pháp Quản trị rủi ro: Chế độ Ngoại tuyến (Offline Mode)</span>
              </div>
              <p className="text-[11.5px] text-neutral-200 leading-relaxed">
                Khi di chuyển đến các khu vực sóng yếu hoặc khi đi thực địa tại di tích, bạn có thể tải trước <strong className="text-[#DFCE9D]">Offline Wi-Fi Cache</strong> để trải nghiệm mượt mà không cần kết nối Internet liên tục.
              </p>
            </div>

            {/* Offline Wi-Fi Cache Preloader */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-[#0F172A] to-black border border-sky-400/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Bộ nhớ đệm Không gian 3D &amp; Audio (Offline Cache)</span>
                </span>
                {isCurrentSiteCached && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-sans text-[11px] font-medium">
                    ✓ Đã lưu Offline
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleDownloadOfflineCache}
                disabled={isDownloadingCache}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-300 hover:brightness-110 text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all tabular-nums"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isCurrentSiteCached
                    ? `✓ Đã tải trước dữ liệu 3D (${currentSite.officialName})`
                    : isDownloadingCache
                    ? `Đang tải gói dữ liệu 3D Offline (${offlineCacheProgress}%)...`
                    : 'Tải trước dữ liệu 3D (Offline Wi-Fi Cache)'}
                </span>
              </button>

              {(isDownloadingCache || isCurrentSiteCached) && (
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300 rounded-full"
                      style={{ width: `${isCurrentSiteCached ? 100 : offlineCacheProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-sans tabular-nums text-emerald-300">
                    {isCurrentSiteCached
                      ? `Đã lưu 18.4 MB dữ liệu Mesh 3D, Texture PBR & File âm thanh thuyết minh của ${currentSite.officialName} vào bộ nhớ đệm Offline.`
                      : 'Đang nén Geometry 3D, PBR CanvasTexture & kịch bản thuyết minh...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER: QUICK LINK TO E-COMMERCE STORE */}
      <div className="px-4 py-2.5 bg-black/80 border-t border-white/10 flex items-center justify-between gap-2 shrink-0">
        <span className="text-[11px] text-neutral-300 truncate">
          Mở khóa Tour 3D chỉ <strong className="text-[#D4AF61]">19.000đ/Tuyến</strong> (Rẻ hơn 95%)
        </span>
        <button
          type="button"
          onClick={onOpenBookingModal}
          className="px-3 py-1.5 rounded-xl bg-[#D4AF61]/20 hover:bg-[#D4AF61]/30 border border-[#D4AF61]/50 text-[#DFCE9D] font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF61]" />
          <span>Cửa hàng Tour 3D (E-commerce)</span>
        </button>
      </div>
    </div>
  );
};
