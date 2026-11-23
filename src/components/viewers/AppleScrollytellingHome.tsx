import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HeritageSite } from '../../types/heritage';
import { useI18n } from '../../i18n/I18nContext';
import { useLabs } from '../../contexts/LabsContext';
import {
  useHeritageRealPhotos,
  resolveSitePhotoSlots,
} from '../../utils/wikimediaPhotoService';
import {
  HeritageTypographicPlate,
  getHeritagePlatePalette,
} from '../common/HeritageTypographicPlate';
import { HeritageSmoothImage } from '../common/HeritageSmoothImage';
import { HeritageSearchCombobox } from '../common/HeritageSiteDropdown';
import { CascadeRevealCard } from '../common/CascadeRevealCard';
import { ArchivalSourcesTrigger } from '../common/ArchivalSourcesTrigger';
import { matchesHeritageSiteQuery } from '../../utils/heritageSearch';
import { getHeritageColorBlock } from '../../utils/indochinePalette';
import { useMuseumTilt3D } from '../../utils/useMuseumTilt3D';
import { triggerHaptic } from '../../utils/haptics';
import { getLandmarkFeatures } from '../../data/heritageLandmarkHotspots';
import { useSiteGlbSource } from '../../utils/glbModelStorage';
import {
  useCloudAssetDownloadProgress,
  useCloudAssetError,
} from '../../utils/cloudSync';
import { loadAndNormalizeGlb } from '../../utils/threeGlbLoader';
import {
  GlbSectionController,
  type GlbViewMode,
} from '../../utils/glbSectionController';
import { ResolvedGuidedTour } from '../../data/guidedTours';
import { GuidedTourStarterSection } from '../guide/GuidedTourConcierge';
import { SectionGuideButton } from '../guide/InteractiveUserGuideModal';
import {
  ANALYTICS_UPDATED_EVENT,
  VISITORS_UPDATED_EVENT,
  loadAnalytics,
  loadVisitHistoryLogs,
  PlatformAnalytics,
  VisitHistoryLogEntry,
} from '../../utils/adminPlatformStore';
import {
  Plus,
  Camera,
  Compass,
  Ticket,
  BookOpen,
  Layers,
  Scan,
  ArrowUpRight,
  Lock,
  Users,
  Eye,
  Monitor,
  Smartphone,
  Clock,
  Landmark,
  Upload,
  Search,
  RefreshCw,
} from 'lucide-react';

interface AppleScrollytellingHomeProps {
  sites: HeritageSite[];
  selectedSite: HeritageSite;
  hiddenSiteIds?: string[];
  isPaused?: boolean;
  isAuthenticated?: boolean;
  isAudioGuideLocked?: boolean;
  userDisplayName?: string;
  isStrictAdmin?: boolean;
  onOpenAdminGlbUpload?: (site: HeritageSite) => void;
  guidedTours?: ResolvedGuidedTour[];
  masterpieceSite?: HeritageSite | null;
  onStartGuidedTour?: (tour: ResolvedGuidedTour) => void;
  onStartMasterpiece?: () => void;
  onSelectSite: (site: HeritageSite) => void;
  onOpen3D: (site: HeritageSite) => void;
  onOpenDetailModal: (site: HeritageSite) => void;
  onOpenAudioModal: (site: HeritageSite) => void;
  onOpenPhotoManager: (site: HeritageSite) => void;
  onOpenCinemaModal: (site?: HeritageSite) => void;
  onNavigateTab: (tab: 'explore' | 'space3d' | 'map_routes' | 'catalog' | 'edtech') => void;
  onOpenGuide?: () => void;
  onOpenGateLetter?: () => void;
  onOpenMediaCredits?: () => void;
}



function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (
      obj instanceof THREE.Mesh ||
      obj instanceof THREE.Points ||
      obj instanceof THREE.Line ||
      obj instanceof THREE.LineSegments ||
      obj instanceof THREE.LineLoop ||
      obj instanceof THREE.Sprite
    ) {
      obj.geometry?.dispose();
      const disposeMat = (m: THREE.Material) => {
        const anyMat = m as unknown as Record<string, unknown>;
        [
          'map',
          'bumpMap',
          'roughnessMap',
          'normalMap',
          'aoMap',
          'emissiveMap',
          'metalnessMap',
          'alphaMap',
          'envMap',
          'specularMap',
        ].forEach((k) => {
          const tex = anyMat[k];
          if (tex && typeof (tex as THREE.Texture).dispose === 'function' && !(tex as THREE.Texture).userData?.isCached) {
            (tex as THREE.Texture).dispose();
          }
        });
        m.dispose();
      };
      if (Array.isArray(obj.material)) {
        obj.material.forEach(disposeMat);
      } else if (obj.material) {
        disposeMat(obj.material);
      }
    }
  });
}

function fitCameraForStage(camera: THREE.PerspectiveCamera, targetGroup: THREE.Object3D, distanceScale = 1.38) {
  const box = new THREE.Box3().setFromObject(targetGroup);
  if (box.isEmpty()) return new THREE.Vector3(0, 3, 0);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 10);
  const fovRad = (camera.fov * Math.PI) / 180;
  const dist = (maxDim / 2 / Math.tan(fovRad / 2)) * distanceScale;
  camera.position.set(center.x + dist * 0.52, center.y + dist * 0.34, center.z + dist * 0.84);
  camera.lookAt(center);
  return center;
}

interface BentoMonumentCardProps {
  site: HeritageSite;
  officialName: string;
  isAuthenticated?: boolean;
  isHiddenForVisitors?: boolean;
  onOpenDetailModal: (site: HeritageSite) => void;
  onOpenPhotoManager: (site: HeritageSite) => void;
  onOpen3D: (site: HeritageSite) => void;
}

const BentoMonumentCard: React.FC<BentoMonumentCardProps> = React.memo(({
  site,
  officialName,
  isAuthenticated = false,
  isHiddenForVisitors = false,
  onOpenDetailModal,
  onOpenPhotoManager,
  onOpen3D,
}) => {
  const { lang } = useI18n();
  const tiltHandlers = useMuseumTilt3D(4);
  const [activePhotoIdx, setActivePhotoIdx] = useState<0 | 1>(0);
  const [imgFailed, setImgFailed] = useState(false);
  const rawPhoto = site.photos?.[activePhotoIdx] ?? (activePhotoIdx === 0 ? site.photos?.[0] : '') ?? '';
  useEffect(() => {
    setImgFailed(false);
  }, [rawPhoto, activePhotoIdx]);
  const hasRealPhoto = Boolean(rawPhoto && !imgFailed);
  const block = getHeritageColorBlock(site, lang as 'vi' | 'en' | 'zh');

  return (
  <article
    onClick={() => onOpenDetailModal(site)}
    onMouseMove={tiltHandlers.onMouseMove}
    onMouseLeave={tiltHandlers.onMouseLeave}
    style={{ backgroundColor: block.bg, color: block.fg }}
    className="museum-tilt-card relative group rounded-[24px] border border-[#171817]/20 overflow-hidden cursor-pointer flex flex-col justify-between shadow-[0_14px_34px_rgba(23,24,23,0.12)]"
  >
    <div
      data-tilt-glow="true"
      className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300"
    />
    <div
      className="relative aspect-video w-full overflow-hidden bg-[#171817]"
      style={{ borderBottom: `1px solid ${block.hairline}` }}
    >
      {hasRealPhoto ? (
        <HeritageSmoothImage
          src={rawPhoto}
          alt={officialName}
          loading="lazy"
          waitTone="dark"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-[opacity,transform] duration-500"
        />
      ) : (
        <HeritageTypographicPlate site={site} variant="bento" />
      )}
      {isHiddenForVisitors && (
        <span className="absolute bottom-3 left-3 z-10 px-2.5 py-0.5 rounded-full bg-[#171817] border border-[#C9A46A] text-[#C9A46A] text-[10px] font-semibold">
          {lang === 'en'
            ? 'Tester Preview · Hidden'
            : lang === 'zh'
            ? '隐藏草稿 · 测试模式'
            : 'Đang ẩn · Chế độ Tester'}
        </span>
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3 right-3 z-10 inline-flex items-center rounded-full bg-[#F4EFE4]/95 border border-[#171817]/25 p-0.5 shadow-sm"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActivePhotoIdx(0);
          }}
          className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold tabular-nums transition-colors cursor-pointer ${
            activePhotoIdx === 0
              ? 'bg-[#171817] text-[#D8C9A9]'
              : 'text-[#171817]/75 hover:text-[#171817]'
          }`}
        >
          01
        </button>
        <span className="text-[#171817]/25 text-[10px] px-0.5 select-none" aria-hidden="true">
          |
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActivePhotoIdx(1);
          }}
          className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold tabular-nums transition-colors cursor-pointer ${
            activePhotoIdx === 1
              ? 'bg-[#171817] text-[#D8C9A9]'
              : 'text-[#171817]/75 hover:text-[#171817]'
          }`}
        >
          02
        </button>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenPhotoManager(site);
        }}
        title={
          lang === 'en'
            ? 'Change real photo'
            : lang === 'zh'
            ? '更换实景照片'
            : 'Đổi ảnh chụp thật'
        }
        className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full bg-[#F4EFE4]/95 border border-[#171817]/20 text-[#171817] flex items-center justify-center cursor-pointer"
      >
        <Camera className="w-3.5 h-3.5" />
      </button>
    </div>

    <div className="p-5 flex-1 flex flex-col justify-between">
      <div>
        <span
          className="font-sans text-[12px] font-medium tabular-nums"
          style={{ color: block.mutedFg }}
        >
          {site.commencementYear} · {site.identifierCode}
        </span>
        <h4
          className="font-serif text-xl font-medium mt-1 line-clamp-1"
          style={{ fontVariantNumeric: 'lining-nums', color: block.fg }}
        >
          {officialName}
        </h4>
      </div>

      <div className="flex items-center justify-between pt-4 mt-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen3D(site);
          }}
          style={{ color: block.fg }}
          className="text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? '3D View' : lang === 'zh' ? '3D 视图' : 'Xem 3D'}</span>
          {!isAuthenticated && <Lock className="w-3 h-3 shrink-0 opacity-80" />}
        </button>
        <span
          style={{
            backgroundColor: block.badgeBg,
            color: block.badgeFg,
            borderColor: block.hairline,
          }}
          className="w-8 h-8 rounded-full border flex items-center justify-center transition-transform group-hover:scale-105"
        >
          {!isAuthenticated ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
        </span>
      </div>
    </div>
  </article>
  );
});

export const AppleScrollytellingHome: React.FC<AppleScrollytellingHomeProps> = React.memo(({
  sites,
  selectedSite,
  hiddenSiteIds = [],
  isPaused = false,
  isAuthenticated = false,
  isAudioGuideLocked = false,
  userDisplayName,
  isStrictAdmin = false,
  onOpenAdminGlbUpload,
  guidedTours = [],
  masterpieceSite = null,
  onStartGuidedTour,
  onStartMasterpiece,
  onSelectSite,
  onOpen3D,
  onOpenDetailModal,
  onOpenAudioModal,
  onOpenPhotoManager,
  onOpenCinemaModal,
  onNavigateTab,
  onOpenGuide,
  onOpenGateLetter,
  onOpenMediaCredits,
}) => {
  const { lang, getLocalizedSite } = useI18n();
  const locSelected = getLocalizedSite(selectedSite);
  const [mobileSearchQuery, setMobileSearchQuery] = useState<string>('');

  const mobileFilteredSites = useMemo(() => {
    return sites.filter((site, idx) => {
      const loc = getLocalizedSite(site);
      return matchesHeritageSiteQuery({
        site,
        canonicalIndex: idx,
        rawQuery: mobileSearchQuery,
        localizedName: loc.officialName,
        localizedFolkName: loc.folkName,
        localizedSummary: loc.summary,
      });
    });
  }, [sites, mobileSearchQuery, getLocalizedSite]);

  const featuredFeatures = useMemo(() => getLandmarkFeatures(selectedSite.id), [selectedSite.id]);
  const tiltHandlers = useMuseumTilt3D(7);

  const { customPhotosMap, wikimediaCacheMap } = useHeritageRealPhotos();
  const [cardPhotoSlotMap, setCardPhotoSlotMap] = useState<Record<string, 0 | 1>>({});

  const getCardPhotoSlot = useCallback(
    (siteId: string): 0 | 1 => cardPhotoSlotMap[siteId] ?? 0,
    [cardPhotoSlotMap]
  );

  const setCardPhotoSlot = useCallback((siteId: string, slot: 0 | 1) => {
    setCardPhotoSlotMap((prev) => (prev[siteId] === slot ? prev : { ...prev, [siteId]: slot }));
  }, []);

  const [failedPhotoMap, setFailedPhotoMap] = useState<Record<string, boolean>>({});
  const markPhotoFailed = useCallback((key: string) => {
    setFailedPhotoMap((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const resolveHeroPhoto = useCallback(
    (site: HeritageSite, slot: 0 | 1 = 0) => {
      const { slots } = resolveSitePhotoSlots(site.id, customPhotosMap, wikimediaCacheMap);
      return slots[slot] || site.photos?.[slot] || (slot === 0 ? site.photos?.[0] : '') || '';
    },
    [customPhotosMap, wikimediaCacheMap]
  );

  // Van Gogh Museum-style horizontal card strip refs & scroll progress
  const heroCardsTrackRef = useRef<HTMLDivElement>(null);
  const [heroScrollProgress, setHeroScrollProgress] = useState<number>(0);
  const dragStateRef = useRef<{
    isDown: boolean;
    startX: number;
    scrollLeft: number;
  }>({ isDown: false, startX: 0, scrollLeft: 0 });
  const dragDistanceRef = useRef<number>(0);
  const [isDraggingCards, setIsDraggingCards] = useState<boolean>(false);

  const handleHeroTrackScroll = useCallback(() => {
    const el = heroCardsTrackRef.current;
    if (!el) return;
    const maxScroll = Math.max(1, el.scrollWidth - el.clientWidth);
    const ratio = Math.min(1, Math.max(0, el.scrollLeft / maxScroll));
    setHeroScrollProgress(ratio);
  }, []);

  useEffect(() => {
    handleHeroTrackScroll();
    window.addEventListener('resize', handleHeroTrackScroll);
    return () => window.removeEventListener('resize', handleHeroTrackScroll);
  }, [handleHeroTrackScroll, sites.length]);

  useEffect(() => {
    const el = heroCardsTrackRef.current;
    if (!el) return;

    const onWheelNative = (e: WheelEvent) => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const delta = e.deltaY;
      if (delta === 0) return;

      const atStart = el.scrollLeft <= 1;
      const atEnd = el.scrollLeft >= maxScroll - 1;
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) {
        return;
      }

      e.preventDefault();
      el.scrollLeft += delta;
    };

    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.isDown) return;
      const el = heroCardsTrackRef.current;
      if (!el) return;
      const dx = e.clientX - dragStateRef.current.startX;
      dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(dx));
      if (dragDistanceRef.current >= 3) {
        setIsDraggingCards(true);
      }
      el.scrollLeft = dragStateRef.current.scrollLeft - dx;
    };

    const endDrag = () => {
      if (!dragStateRef.current.isDown) return;
      dragStateRef.current.isDown = false;
      setIsDraggingCards(false);
      window.setTimeout(() => {
        dragDistanceRef.current = 0;
      }, 0);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('blur', endDrag);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('blur', endDrag);
    };
  }, []);

  const handleHeroTrackMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = heroCardsTrackRef.current;
    if (!el) return;
    dragDistanceRef.current = 0;
    dragStateRef.current = {
      isDown: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
    };
  }, []);

  const scrollHeroCards = useCallback((direction: -1 | 1) => {
    const el = heroCardsTrackRef.current;
    if (!el) return;
    const firstCard = el.firstElementChild as HTMLElement | null;
    const stepPx = firstCard ? firstCard.offsetWidth + 24 : 309;
    el.scrollBy({ left: direction * stepPx, behavior: 'smooth' });
  }, []);

  // Refs for Sticky Scrollytelling 3D Choreography
  const choreographySectionRef = useRef<HTMLDivElement>(null);
  const stickyStageWrapperRef = useRef<HTMLDivElement>(null);
  const stickyCanvasHostRef = useRef<HTMLDivElement>(null);
  const stickyVisibleRef = useRef<boolean>(false);
  const resumeStickyLoopRef = useRef<(() => void) | null>(null);
  const isPausedRef = useRef<boolean>(isPaused);
  const [activeBeat, setActiveBeat] = useState<0 | 1 | 2>(0);
  const activeBeatRef = useRef<0 | 1 | 2>(0);
  const viewModeRef = useRef<'original' | 'explode' | 'xray'>('original');
  const targetExplodeFactorRef = useRef<number>(0);
  const [explodePercent, setExplodePercent] = useState<number>(0);
  const lastExplodePercentRef = useRef<number>(0);
  const lastScrollYRef = useRef<number>(typeof window !== 'undefined' ? window.scrollY : 0);

  // Refs for 3D-projected SVG Leader Lines & Tier Callout Cards
  const calloutSvgRef = useRef<SVGSVGElement | null>(null);
  const roofLineRef = useRef<SVGPolylineElement | null>(null);
  const roofDotRef = useRef<SVGCircleElement | null>(null);
  const roofRingRef = useRef<SVGCircleElement | null>(null);
  const roofCardRef = useRef<HTMLDivElement | null>(null);
  const frameLineRef = useRef<SVGPolylineElement | null>(null);
  const frameDotRef = useRef<SVGCircleElement | null>(null);
  const frameRingRef = useRef<SVGCircleElement | null>(null);
  const frameCardRef = useRef<HTMLDivElement | null>(null);
  const baseLineRef = useRef<SVGPolylineElement | null>(null);
  const baseDotRef = useRef<SVGCircleElement | null>(null);
  const baseRingRef = useRef<SVGCircleElement | null>(null);
  const baseCardRef = useRef<HTMLDivElement | null>(null);

  const {
    source: stickyGlbSource,
    loading: stickyGlbSourceLoading,
    retryFromCloud: retryStickyGlbFromCloud,
  } = useSiteGlbSource(selectedSite.id);
  const stickyCloudDownload = useCloudAssetDownloadProgress(selectedSite.id, 'models');
  const stickyCloudError = useCloudAssetError(selectedSite.id, 'models');
  const [stickyGlbLoading, setStickyGlbLoading] = useState<boolean>(false);
  const [stickyGlbError, setStickyGlbError] = useState<string | null>(null);
  const [stickyWebglError, setStickyWebglError] = useState<string | null>(null);
  const [stickyWebglRestartKey, setStickyWebglRestartKey] = useState<number>(0);

  const selectHomeViewMode = useCallback(
    (mode: 'original' | 'explode' | 'xray', explicitFactor?: number) => {
      const nextBeat: 0 | 1 | 2 = mode === 'original' ? 0 : mode === 'explode' ? 1 : 2;
      const nextFactor =
        typeof explicitFactor === 'number'
          ? Math.max(0, Math.min(1, explicitFactor))
          : mode === 'explode'
          ? 1.0
          : 0.0;

      viewModeRef.current = mode;
      activeBeatRef.current = nextBeat;
      targetExplodeFactorRef.current = nextFactor;
      setActiveBeat(nextBeat);
      resumeStickyLoopRef.current?.();
    },
    []
  );

  useEffect(() => {
    activeBeatRef.current = activeBeat;
    viewModeRef.current =
      activeBeat === 1 ? 'explode' : activeBeat === 2 ? 'xray' : 'original';
  }, [activeBeat]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    if (!isPaused) {
      resumeStickyLoopRef.current?.();
    }
  }, [isPaused]);

  // Live synced visitor analytics & recent visit logs (across devices)
  const [liveAnalytics, setLiveAnalytics] = useState<PlatformAnalytics>(() => loadAnalytics());
  const [visitHistoryLogs, setVisitHistoryLogs] = useState<VisitHistoryLogEntry[]>(() =>
    loadVisitHistoryLogs()
  );

  useEffect(() => {
    const syncAnalyticsView = () => {
      setLiveAnalytics(loadAnalytics());
      setVisitHistoryLogs(loadVisitHistoryLogs());
    };
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === 'dau_an_viet_analytics_v1' ||
        e.key === 'dau_an_viet_visit_history_v1'
      ) {
        syncAnalyticsView();
      }
    };
    window.addEventListener(ANALYTICS_UPDATED_EVENT, syncAnalyticsView);
    window.addEventListener(VISITORS_UPDATED_EVENT, syncAnalyticsView);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ANALYTICS_UPDATED_EVENT, syncAnalyticsView);
      window.removeEventListener(VISITORS_UPDATED_EVENT, syncAnalyticsView);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const totalSiteViews = useMemo(
    () =>
      Object.values(liveAnalytics.siteViews || {}).reduce(
        (sum, val) => sum + (Number.isFinite(val) ? Number(val) : 0),
        0
      ),
    [liveAnalytics.siteViews]
  );
  const selectedSiteViews = liveAnalytics.siteViews?.[selectedSite.id] || 0;
  const latestVisitEntry = visitHistoryLogs[0] || null;

  // Scroll listener for 3-beat Choreography + smooth 0% -> 100% explodeFactor sync
  useEffect(() => {
    const syncFromScroll = (forceInit = false) => {
      const section = choreographySectionRef.current;
      if (!section) return;
      const curScrollY = window.scrollY;
      if (!forceInit && Math.abs(curScrollY - lastScrollYRef.current) < 1) {
        return;
      }
      lastScrollYRef.current = curScrollY;

      const rect = section.getBoundingClientRect();
      const viewportH = window.innerHeight || 800;
      const scrollableSpan = Math.max(1, rect.height - viewportH);
      const progress = Math.max(0, Math.min(1, -rect.top / scrollableSpan));

      if (progress < 0.14) {
        viewModeRef.current = 'original';
        activeBeatRef.current = 0;
        targetExplodeFactorRef.current = 0;
        setActiveBeat(0);
      } else if (progress < 0.72) {
        const factor = Math.max(0.02, Math.min(1, (progress - 0.14) / (0.72 - 0.14)));
        viewModeRef.current = 'explode';
        activeBeatRef.current = 1;
        targetExplodeFactorRef.current = factor;
        setActiveBeat(1);
      } else {
        viewModeRef.current = 'xray';
        activeBeatRef.current = 2;
        targetExplodeFactorRef.current = 0;
        setActiveBeat(2);
      }
      resumeStickyLoopRef.current?.();
    };

    const handleScroll = () => syncFromScroll(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    syncFromScroll(true);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { effectiveGoldenHour3D, effectiveWireframeOverlay } = useLabs();
  const labsGoldenHourRef = useRef<boolean>(effectiveGoldenHour3D);
  const labsWireframeRef = useRef<boolean>(effectiveWireframeOverlay);
  labsGoldenHourRef.current = effectiveGoldenHour3D;
  labsWireframeRef.current = effectiveWireframeOverlay;

  useEffect(() => {
    resumeStickyLoopRef.current?.();
  }, [effectiveGoldenHour3D, effectiveWireframeOverlay]);

  // =========================================================================
  // STICKY SCROLLYTELLING 3D CHOREOGRAPHY STAGE (4-Tier Clipping + X-Ray + Live 3D Callouts)
  // =========================================================================
  useEffect(() => {
    const host = stickyCanvasHostRef.current;
    const wrapper = stickyStageWrapperRef.current;
    if (!host || !wrapper) return;

    let stageW = host.clientWidth || 720;
    let stageH = host.clientHeight || 540;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x171817);

    const camera = new THREE.PerspectiveCamera(40, stageW / stageH, 0.2, 450);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          powerPreference: 'default',
        });
      } catch {
        setStickyWebglError(
          'Trình duyệt hoặc card đồ họa trên máy tính này tạm thời chưa khởi tạo được WebGL 3D. Nhấn nút bên dưới để khởi động lại khung 3D.'
        );
        return;
      }
    }
    setStickyWebglError(null);
    renderer.localClippingEnabled = true;
    renderer.setSize(stageW, stageH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setStickyWebglError(
        'Ngữ cảnh đồ họa 3D (WebGL) vừa bị tạm ngắt trên GPU. Nhấn "Khởi động lại khung 3D" để khôi phục hiển thị mượt mà.'
      );
    };
    const handleContextRestored = () => {
      setStickyWebglError(null);
      resumeStickyLoopRef.current?.();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(0xd8c9a9, 0x171817, 0.9);
    scene.add(hemiLight);
    const keyLight = new THREE.DirectionalLight(0xfff5e4, 1.85);
    keyLight.position.set(18, 28, 22);
    scene.add(keyLight);

    const heritageRim = new THREE.DirectionalLight(0x526d8b, 0.95);
    heritageRim.position.set(-20, 14, -18);
    scene.add(heritageRim);

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const baseGrid = new THREE.GridHelper(44, 22, 0x47796d, 0x262826);
    baseGrid.position.y = -0.05;
    stageGroup.add(baseGrid);

    const modelGroup = new THREE.Group();
    stageGroup.add(modelGroup);

    let glbSectionController: GlbSectionController | null = null;
    const hasGlbSource = Boolean(stickyGlbSource.url);
    if (!hasGlbSource) {
      setStickyGlbLoading(false);
      setStickyGlbError(null);
    }

    const baseCenter = fitCameraForStage(camera, modelGroup, 1.48);
    let camDistance = camera.position.distanceTo(baseCenter);

    // Museum Turntable OrbitControls (permanently unlocked across Original / Explode / X-Ray)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableRotate = true;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.target.copy(baseCenter);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.update();

    let userInteracting = false;
    let beatTransitionStart = 0;
    const onControlStart = () => {
      userInteracting = true;
      beatTransitionStart = 0;
      controls.autoRotate = false;
    };
    const onControlEnd = () => {
      userInteracting = false;
    };
    controls.addEventListener('start', onControlStart);
    controls.addEventListener('end', onControlEnd);

    let currentExploded = 0;
    let currentGoldenActive: boolean | null = null;
    let lastBeat = activeBeatRef.current;
    const beatLerpDurationSec = 0.8;
    const fromCamPos = camera.position.clone();
    const toCamPos = camera.position.clone();
    const fromTargetPos = baseCenter.clone();
    const toTargetPos = baseCenter.clone();

    // Scratch vectors for 3D->2D callout projection (zero per-frame allocations)
    const anchorTier4World = new THREE.Vector3();
    const anchorTier3World = new THREE.Vector3();
    const anchorTier1World = new THREE.Vector3();
    const projVec = new THREE.Vector3();

    const syncLabsStageVisuals = () => {
      const wantGolden = labsGoldenHourRef.current;
      if (wantGolden !== currentGoldenActive) {
        currentGoldenActive = wantGolden;
        if (wantGolden) {
          scene.background = new THREE.Color(0x171817);
          hemiLight.color.setHex(0xd8c9a9);
          hemiLight.groundColor.setHex(0x2a1810);
          hemiLight.intensity = 0.85;
          keyLight.color.setHex(0xffb86c);
          keyLight.intensity = 2.2;
          keyLight.position.set(28, 9, 16);
          heritageRim.color.setHex(0xc9a46a);
          heritageRim.intensity = 1.05;
        } else {
          scene.background = new THREE.Color(0x171817);
          hemiLight.color.setHex(0xd8c9a9);
          hemiLight.groundColor.setHex(0x171817);
          hemiLight.intensity = 0.9;
          keyLight.color.setHex(0xfff5e4);
          keyLight.intensity = 1.85;
          keyLight.position.set(18, 28, 22);
          heritageRim.color.setHex(0x526d8b);
          heritageRim.intensity = 0.95;
        }
      }
    };
    syncLabsStageVisuals();

    const computeBeatCameraVectors = (beatIdx: 0 | 1 | 2) => {
      const angle = beatIdx === 0 ? 0.52 : beatIdx === 1 ? 0.88 : -0.42;
      const elevation =
        beatIdx === 1 ? camDistance * 0.42 : beatIdx === 2 ? camDistance * 0.32 : camDistance * 0.34;
      const horiz = camDistance * 0.9;
      const targetExpl = beatIdx === 1 ? Math.max(0.45, targetExplodeFactorRef.current) : beatIdx === 2 ? 0.2 : 0;
      return {
        cam: new THREE.Vector3(
          baseCenter.x + Math.sin(angle) * horiz,
          baseCenter.y + elevation,
          baseCenter.z + Math.cos(angle) * horiz
        ),
        target: new THREE.Vector3(baseCenter.x, baseCenter.y + targetExpl * 1.15, baseCenter.z),
      };
    };

    const updateProjectedCalloutDom = () => {
      const svgEl = calloutSvgRef.current;
      if (!svgEl || viewModeRef.current !== 'explode' || !glbSectionController) return;

      const w = stageW || 720;
      const h = stageH || 540;
      svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);

      glbSectionController.getTierAnchorPointsWorld(
        anchorTier4World,
        anchorTier3World,
        anchorTier1World
      );

      const toScreen = (worldPos: THREE.Vector3) => {
        projVec.copy(worldPos).project(camera);
        return {
          x: Math.max(14, Math.min(w - 14, (projVec.x * 0.5 + 0.5) * w)),
          y: Math.max(14, Math.min(h - 14, (-projVec.y * 0.5 + 0.5) * h)),
        };
      };

      const p4 = toScreen(anchorTier4World);
      const p3 = toScreen(anchorTier3World);
      const p1 = toScreen(anchorTier1World);

      const card4El = roofCardRef.current;
      const card3El = frameCardRef.current;
      const card1El = baseCardRef.current;

      const card4H = card4El?.offsetHeight || 48;
      const card1H = card1El?.offsetHeight || 48;
      const card3H = card3El?.offsetHeight || 48;

      const card4Top = THREE.MathUtils.clamp(
        p4.y - card4H * 0.5,
        56,
        Math.max(56, h - card4H - card1H - 86)
      );
      const minCard1Top = card4Top + card4H + 14;
      const maxCard1Top = Math.max(minCard1Top, h - card1H - 64);
      const card1Top = THREE.MathUtils.clamp(p1.y - card1H * 0.5, minCard1Top, maxCard1Top);
      const card3Top = THREE.MathUtils.clamp(
        p3.y - card3H * 0.5,
        64,
        Math.max(64, h - card3H - 64)
      );

      if (roofDotRef.current && roofRingRef.current && roofLineRef.current) {
        roofDotRef.current.setAttribute('cx', p4.x.toFixed(1));
        roofDotRef.current.setAttribute('cy', p4.y.toFixed(1));
        roofRingRef.current.setAttribute('cx', p4.x.toFixed(1));
        roofRingRef.current.setAttribute('cy', p4.y.toFixed(1));
        if (card4El && card4El.offsetWidth > 0) {
          card4El.style.top = `${card4Top.toFixed(1)}px`;
          const endX = Math.max(p4.x + 24, w - 20 - card4El.offsetWidth);
          const endY = card4Top + card4H * 0.5;
          const midX = (p4.x + endX) * 0.52;
          roofLineRef.current.setAttribute(
            'points',
            `${p4.x.toFixed(1)},${p4.y.toFixed(1)} ${midX.toFixed(1)},${endY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`
          );
        } else {
          const stubX = Math.min(w - 16, p4.x + 48);
          const stubY = Math.max(56, p4.y - 26);
          roofLineRef.current.setAttribute(
            'points',
            `${p4.x.toFixed(1)},${p4.y.toFixed(1)} ${stubX.toFixed(1)},${stubY.toFixed(1)}`
          );
        }
      }

      if (frameDotRef.current && frameRingRef.current && frameLineRef.current) {
        frameDotRef.current.setAttribute('cx', p3.x.toFixed(1));
        frameDotRef.current.setAttribute('cy', p3.y.toFixed(1));
        frameRingRef.current.setAttribute('cx', p3.x.toFixed(1));
        frameRingRef.current.setAttribute('cy', p3.y.toFixed(1));
        if (card3El && card3El.offsetWidth > 0) {
          card3El.style.top = `${card3Top.toFixed(1)}px`;
          const endX = Math.min(p3.x - 24, 20 + card3El.offsetWidth);
          const endY = card3Top + card3H * 0.5;
          const midX = (p3.x + endX) * 0.48;
          frameLineRef.current.setAttribute(
            'points',
            `${p3.x.toFixed(1)},${p3.y.toFixed(1)} ${midX.toFixed(1)},${endY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`
          );
        } else {
          const stubX = Math.max(16, p3.x - 48);
          frameLineRef.current.setAttribute(
            'points',
            `${p3.x.toFixed(1)},${p3.y.toFixed(1)} ${stubX.toFixed(1)},${p3.y.toFixed(1)}`
          );
        }
      }

      if (baseDotRef.current && baseRingRef.current && baseLineRef.current) {
        baseDotRef.current.setAttribute('cx', p1.x.toFixed(1));
        baseDotRef.current.setAttribute('cy', p1.y.toFixed(1));
        baseRingRef.current.setAttribute('cx', p1.x.toFixed(1));
        baseRingRef.current.setAttribute('cy', p1.y.toFixed(1));
        if (card1El && card1El.offsetWidth > 0) {
          card1El.style.top = `${card1Top.toFixed(1)}px`;
          const endX = Math.max(p1.x + 24, w - 20 - card1El.offsetWidth);
          const endY = card1Top + card1H * 0.5;
          const midX = (p1.x + endX) * 0.52;
          baseLineRef.current.setAttribute(
            'points',
            `${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${midX.toFixed(1)},${endY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`
          );
        } else {
          const stubX = Math.min(w - 16, p1.x + 48);
          const stubY = Math.min(h - 56, p1.y + 22);
          baseLineRef.current.setAttribute(
            'points',
            `${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${stubX.toFixed(1)},${stubY.toFixed(1)}`
          );
        }
      }
    };

    const clock = new THREE.Clock();
    let rafId = 0;
    let isDisposed = false;

    const shouldRun = () =>
      !isDisposed &&
      stickyVisibleRef.current &&
      !isPausedRef.current &&
      document.visibilityState === 'visible';

    const animate = () => {
      if (!shouldRun()) {
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const nowSec = clock.elapsedTime;

      syncLabsStageVisuals();

      // Always read live refs inside requestAnimationFrame to prevent stale React closures
      const mode = viewModeRef.current;
      const beat: 0 | 1 | 2 = mode === 'explode' ? 1 : mode === 'xray' ? 2 : 0;
      const explodeTarget = mode === 'explode' ? targetExplodeFactorRef.current : 0;

      if (beat !== lastBeat) {
        lastBeat = beat;
        beatTransitionStart = nowSec;
        fromCamPos.copy(camera.position);
        fromTargetPos.copy(controls.target);
        const dest = computeBeatCameraVectors(beat);
        toCamPos.copy(dest.cam);
        toTargetPos.copy(dest.target);
      }

      if (glbSectionController) {
        glbSectionController.updateFrame(mode as GlbViewMode, explodeTarget, dt, {
          isBlueprintWireframe: labsWireframeRef.current,
        });
        currentExploded = glbSectionController.getExplodeProgress();
      } else {
        currentExploded = 0;
      }

      const livePct = Math.round(THREE.MathUtils.clamp(currentExploded, 0, 1) * 100);
      if (livePct !== lastExplodePercentRef.current) {
        lastExplodePercentRef.current = livePct;
        setExplodePercent(livePct);
      }

      if (
        beatTransitionStart > 0 &&
        nowSec - beatTransitionStart <= beatLerpDurationSec &&
        !userInteracting
      ) {
        const progress = Math.min(1, (nowSec - beatTransitionStart) / beatLerpDurationSec);
        const ease = 1 - Math.pow(1 - progress, 3);
        camera.position.lerpVectors(fromCamPos, toCamPos, ease);
        controls.target.lerpVectors(fromTargetPos, toTargetPos, ease);
      }

      controls.enabled = true;
      controls.enableRotate = true;
      controls.update();

      updateProjectedCalloutDom();
      renderer.render(scene, camera);
    };

    const startStickyLoop = () => {
      if (rafId === 0 && shouldRun()) {
        clock.getDelta();
        animate();
      }
    };
    resumeStickyLoopRef.current = startStickyLoop;

    const io = new IntersectionObserver(
      (entries) => {
        stickyVisibleRef.current = entries[0]?.isIntersecting ?? false;
        if (stickyVisibleRef.current) {
          startStickyLoop();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(wrapper);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        startStickyLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const handleResize = () => {
      if (!host) return;
      stageW = host.clientWidth || 720;
      stageH = host.clientHeight || 540;
      camera.aspect = stageW / stageH;
      camera.updateProjectionMatrix();
      renderer.setSize(stageW, stageH);
      updateProjectedCalloutDom();
    };
    window.addEventListener('resize', handleResize);

    renderer.render(scene, camera);
    startStickyLoop();

    if (hasGlbSource && stickyGlbSource.url) {
      setStickyGlbLoading(true);
      setStickyGlbError(null);
      void loadAndNormalizeGlb(stickyGlbSource.url, {
        targetMaxDim: 26,
        groundY: 0,
        maxAnisotropy: 4,
      })
        .then((res) => {
          if (isDisposed) return;
          modelGroup.add(res.root);
          glbSectionController?.dispose();
          glbSectionController = new GlbSectionController(res.root, modelGroup, {
            tierOffsets: [0, 0.45, 0.95, 1.5],
            minExplodeWhenActive: 0,
            scaleByHeightDivisor: 5.5,
          });
          glbSectionController.recomputeBounds();

          const newCenter = fitCameraForStage(camera, modelGroup, 1.48);
          baseCenter.copy(newCenter);
          camDistance = camera.position.distanceTo(baseCenter);
          controls.target.copy(baseCenter);
          controls.update();

          const activeMode = viewModeRef.current;
          glbSectionController.updateFrame(
            activeMode as GlbViewMode,
            activeMode === 'explode' ? targetExplodeFactorRef.current : 0,
            0.016,
            { isBlueprintWireframe: labsWireframeRef.current }
          );
          if (activeMode !== 'original') {
            const dest = computeBeatCameraVectors(activeMode === 'explode' ? 1 : 2);
            camera.position.copy(dest.cam);
            controls.target.copy(dest.target);
            controls.update();
          }

          setStickyGlbLoading(false);
          updateProjectedCalloutDom();
          renderer.render(scene, camera);
          startStickyLoop();
        })
        .catch((err) => {
          if (isDisposed) return;
          setStickyGlbError(err instanceof Error ? err.message : 'Không thể nạp tệp .glb');
          setStickyGlbLoading(false);
        });
    }

    return () => {
      isDisposed = true;
      resumeStickyLoopRef.current = null;
      if (rafId) cancelAnimationFrame(rafId);
      io.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('end', onControlEnd);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      glbSectionController?.dispose();
      glbSectionController = null;
      disposeObject3D(stageGroup);
      scene.clear();
      envRT.dispose();
      renderer.dispose();
      host.innerHTML = '';
    };
  }, [selectedSite.id, stickyGlbSource.url, stickyGlbSource.updatedAt, stickyWebglRestartKey]);

  // Representative sites for Apple Bento Grid
  const primaryBentoSite = useMemo(
    () => sites.find((s) => s.id === 'HCM-DT-001') || sites[0],
    [sites]
  );
  const cuChiSite = useMemo(
    () => sites.find((s) => s.id === 'HCM-DT-009') || sites[1],
    [sites]
  );
  const extraBentoSites = useMemo(() => {
    const ids = ['HCM-DT-002', 'HCM-DT-003', 'BRVT-DT-001', 'BD-DT-001'];
    return ids.map((id) => sites.find((s) => s.id === id)).filter((s): s is HeritageSite => Boolean(s));
  }, [sites]);

  const beats = useMemo(
    () => [
      {
        index: 0 as const,
        eyebrow: lang === 'en' ? '01 · ORIGINAL ARCHITECTURE' : lang === 'zh' ? '01 · 原貌建筑' : '01 · KIẾN TRÚC NGUYÊN BẢN',
        title:
          lang === 'en'
            ? 'Millimeter-Accurate Digital Twin.'
            : lang === 'zh'
            ? '毫米级三维数字孪生。'
            : 'Bản sao số chuẩn xác đến từng chi tiết.',
        body:
          lang === 'en'
            ? `Explore ${locSelected.officialName} (${selectedSite.commencementYear}) with physically based lighting, authentic stone & brick textures, and 360° spatial depth.`
            : lang === 'zh'
            ? `鉴赏 ${locSelected.officialName}（${selectedSite.commencementYear}年），采用真实物理光照与砖石木构材质，精准还原 ${locSelected.architecturalStyle} 的空间比例。`
            : `Chiêm ngưỡng ${locSelected.officialName} (${selectedSite.commencementYear}) với vật liệu phản xạ ánh sáng thực tế, giữ nguyên tỷ lệ kiến trúc ${locSelected.architecturalStyle}.`,
      },
      {
        index: 1 as const,
        eyebrow: lang === 'en' ? '02 · EXPLODED ANATOMY' : lang === 'zh' ? '02 · 3D 拆解结构' : '02 · BÓC TÁCH KẾT CẤU',
        title:
          lang === 'en'
            ? 'Every Roof, Truss & Level Separated.'
            : lang === 'zh'
            ? '屋顶、桁架与地下结构逐层分离。'
            : 'Tách lớp từng tầng mái, hệ khung và nền móng.',
        body:
          lang === 'en'
            ? 'Watch upper roofs, colonnades, and subterranean tunnels lift smoothly along vertical structural axes — inspired by Apple Pro hardware teardowns.'
            : lang === 'zh'
            ? '以 60FPS 流畅度将屋顶、花格幕墙、立柱与地下掩体沿垂直轴向逐层拆解，清晰呈现内部承重构造。'
            : 'Quan sát phần mái, rèm hoa đá, khung cột và các tầng hầm ngầm tách lớp theo phương thẳng đứng mượt mà 60FPS, lộ rõ cấu tạo chịu lực bên trong.',
      },
      {
        index: 2 as const,
        eyebrow: lang === 'en' ? '03 · X-RAY & INTERIOR' : lang === 'zh' ? '03 · X光透视与内部空间' : '03 · CHẾ ĐỘ X-RAY & NỘI THẤT THẬT',
        title:
          lang === 'en'
            ? 'See Inside History.'
            : lang === 'zh'
            ? '穿透墙体，直击历史内部。'
            : 'Nhìn xuyên thấu vào lòng không gian lịch sử.',
        body:
          lang === 'en'
            ? 'Translucent spatial X-Ray reveals inner chambers, secret command bunkers, and structural load paths hidden behind historic facades.'
            : lang === 'zh'
            ? '建筑外立面转为湛蓝 X光半透明视图，完整展现隐藏在墙体内部的礼堂、指挥地堡与地下坑道网。'
            : 'Lớp vỏ kiến trúc chuyển sang trong suốt X-Ray ánh lam, phô diễn toàn bộ nội thất, hội trường và đường hầm ngầm ẩn sâu bên trong công trình.',
      },
    ],
    [lang, locSelected.officialName, locSelected.architecturalStyle, selectedSite.commencementYear]
  );

  return (
    <div className="w-full bg-[#D8C9A9] text-[#171817]">
      {/* ====================================================================
          PART 0 (MOBILE < 768px): DIGITAL MUSEUM EXPLORE FEED
         ==================================================================== */}
      <section className="md:hidden w-full min-h-[calc(100dvh-3.25rem)] bg-[#171817] text-[#D8C9A9] px-5 pt-6 pb-6 space-y-7">
        {/* Refined Large Serif Greeting + Context Guide Pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-medium tracking-[0.06em] text-[#C9A46A]">
              {userDisplayName
                ? lang === 'en'
                  ? `Hello, ${userDisplayName}`
                  : lang === 'zh'
                  ? `您好，${userDisplayName}`
                  : `Xin chào, ${userDisplayName}`
                : lang === 'en'
                ? 'Hello'
                : lang === 'zh'
                ? '您好'
                : 'Xin chào'}
            </p>
            <h1 className="font-serif text-[26px] font-medium text-[#D8C9A9] leading-[1.2] tracking-tight">
              {lang === 'en'
                ? 'Explore Southern Heritage'
                : lang === 'zh'
                ? '探索越南南部文化遗产'
                : 'Khám phá Di sản Nam Bộ'}
            </h1>
          </div>
          {onOpenGuide && (
            <SectionGuideButton lang={lang} onClick={onOpenGuide} className="mt-1" />
          )}
        </div>

        {/* Museum Heritage Search Combobox (Dark Tone) */}
        <HeritageSearchCombobox
          sites={sites}
          canonicalSites={sites}
          selectedSiteId={selectedSite?.id}
          value={mobileSearchQuery}
          onChange={setMobileSearchQuery}
          onSelectSite={(site) => {
            triggerHaptic('selection');
            onSelectSite(site);
            onOpen3D(site);
          }}
          placeholder={
            lang === 'en'
              ? 'Search 17 heritage monuments...'
              : lang === 'zh'
              ? '搜索 17 处历史遗迹...'
              : 'Tìm kiếm 17 di tích, địa danh...'
          }
          tone="dark"
          customPhotosMap={customPhotosMap}
          wikimediaCacheMap={wikimediaCacheMap}
          hiddenSiteIds={hiddenSiteIds}
          dropdownWidthClass="w-full"
          inputClassName="py-3 text-sm"
        />

        {/* Featured Vertical Carousel (rounded-3xl h-72) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base font-medium text-[#D8C9A9]">
              {lang === 'en'
                ? 'Featured Exhibitions'
                : lang === 'zh'
                ? '精选三维典藏'
                : 'Di tích nổi bật'}
            </h2>
            <span className="text-xs text-[#C9A46A] tabular-nums">
              {mobileFilteredSites.length}/{sites.length}
            </span>
          </div>

          {mobileFilteredSites.length === 0 ? (
            <div className="p-6 rounded-3xl bg-[#222321] border border-[#C9A46A]/20 text-center text-xs text-[#D8C9A9]/70">
              {lang === 'en'
                ? 'No monuments match this search keyword'
                : lang === 'zh'
                ? '未找到符合该关键词的遗迹'
                : 'Không tìm thấy di tích phù hợp với từ khóa này'}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto heritage-scrollbar snap-x snap-mandatory -mx-5 px-5 pb-2.5 touch-pan-x">
              {mobileFilteredSites.slice(0, 6).map((site, idx) => {
                const loc = getLocalizedSite(site);
                const cleanTitle = loc.officialName.split(/\s*[（(]/)[0];
                const photoUrl = resolveHeroPhoto(site, 0);
                const hasPhoto = Boolean(
                  photoUrl && !failedPhotoMap[`hero:${site.id}:${photoUrl}`]
                );
                const codePadded = String(
                  sites.findIndex((s) => s.id === site.id) + 1 || idx + 1
                ).padStart(2, '0');

                return (
                  <article
                    key={`mob-feat-${site.id}`}
                    onClick={() => {
                      triggerHaptic('selection');
                      onSelectSite(site);
                      onOpen3D(site);
                    }}
                    className="w-[64vw] max-w-[250px] h-72 shrink-0 snap-start rounded-3xl overflow-hidden relative bg-[#222321] border border-[#C9A46A]/20 cursor-pointer"
                  >
                    {hasPhoto ? (
                      <HeritageSmoothImage
                        src={photoUrl}
                        alt={cleanTitle}
                        loading={idx < 2 ? 'eager' : 'lazy'}
                        waitTone="dark"
                        onError={() => markPhotoFailed(`hero:${site.id}:${photoUrl}`)}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <HeritageTypographicPlate site={site} index={idx} variant="hero" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#171817] via-[#171817]/30 to-transparent pointer-events-none" />

                    <div className="absolute inset-x-0 bottom-0 p-4 space-y-1">
                      <span className="text-[11px] font-medium text-[#C9A46A] tabular-nums block">
                        {codePadded} · {site.commencementYear}
                      </span>
                      <h3 className="font-serif text-lg font-medium text-[#D8C9A9] leading-snug line-clamp-2">
                        {cleanTitle}
                      </h3>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Start Your Journey: 2-Column Square Grid of All 17 Monuments */}
        {mobileFilteredSites.length > 0 && (
          <div data-onboarding-target="monuments" className="space-y-3.5">
            <h2 className="font-serif text-lg font-medium text-[#D8C9A9]">
              {lang === 'en'
                ? 'Start Your Journey'
                : lang === 'zh'
                ? '开启探索之旅'
                : 'Bắt đầu hành trình'}
            </h2>

            <div className="grid grid-cols-2 gap-3.5">
              {mobileFilteredSites.map((site, idx) => {
                const loc = getLocalizedSite(site);
                const cleanTitle = loc.officialName.split(/\s*[（(]/)[0];
                const photoUrl = resolveHeroPhoto(site, 0);
                const hasPhoto = Boolean(
                  photoUrl && !failedPhotoMap[`hero:${site.id}:${photoUrl}`]
                );
                const codePadded = String(
                  sites.findIndex((s) => s.id === site.id) + 1 || idx + 1
                ).padStart(2, '0');

                return (
                  <CascadeRevealCard
                    key={`mob-grid-${site.id}`}
                    index={idx}
                    columnsPerRow={2}
                    delayStepMs={75}
                  >
                    <article
                      onClick={() => {
                        triggerHaptic('selection');
                        onSelectSite(site);
                        onOpenDetailModal(site);
                      }}
                      className="rounded-2xl aspect-square overflow-hidden relative bg-[#222321] border border-[#C9A46A]/20 cursor-pointer group"
                    >
                      {hasPhoto ? (
                        <HeritageSmoothImage
                          src={photoUrl}
                          alt={cleanTitle}
                          loading={idx < 4 ? 'eager' : 'lazy'}
                          waitTone="dark"
                          onError={() => markPhotoFailed(`hero:${site.id}:${photoUrl}`)}
                          className="w-full h-full object-cover object-center group-active:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <HeritageTypographicPlate site={site} index={idx} variant="bento" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-[#171817] via-[#171817]/30 to-transparent pointer-events-none" />

                      <div className="absolute inset-x-0 bottom-0 p-3 space-y-0.5">
                        <span className="text-[10px] font-medium text-[#C9A46A] tabular-nums block">
                          {codePadded}
                        </span>
                        <h3 className="font-serif text-sm font-medium text-[#D8C9A9] leading-snug line-clamp-2">
                          {cleanTitle}
                        </h3>
                      </div>
                    </article>
                  </CascadeRevealCard>
                );
              })}
            </div>
          </div>
        )}

        <footer className="pt-6 border-t border-[#D8C9A9]/15 text-center space-y-2.5 text-[11px] text-[#D8C9A9]/70">
          {(onOpenGateLetter || onOpenMediaCredits) && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {onOpenGateLetter && (
                <button
                  type="button"
                  onClick={onOpenGateLetter}
                  title={
                    lang === 'en'
                      ? 'Project Welcome Letter'
                      : lang === 'zh'
                      ? '项目开幕寄语'
                      : 'Thư ngỏ dự án'
                  }
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1D1B] border border-[#C9A46A]/35 hover:border-[#C9A46A] text-[#D8C9A9] text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9A46A"
                    strokeWidth="1.65"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5 shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M8 21h10a2 2 0 0 0 2-2v-1H10v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2h4" />
                    <path d="M18 18V5a2 2 0 0 0-2-2H4" />
                    <path d="M9.5 8h5" />
                    <path d="M9.5 11.5h5" />
                  </svg>
                  <span>
                    {lang === 'en'
                      ? 'Project Welcome Letter'
                      : lang === 'zh'
                      ? '项目开幕寄语'
                      : 'Thư ngỏ dự án'}
                  </span>
                </button>
              )}

              {onOpenMediaCredits && (
                <ArchivalSourcesTrigger onClick={onOpenMediaCredits} tone="dark" />
              )}
            </div>
          )}
          <div>
            © 2026 Dấu Ấn Việt 3D ·{' '}
            <span className="font-medium text-[#C9A46A]">Made by Hoang Hai</span>
          </div>
        </footer>
      </section>

      {/* ====================================================================
          PART 1 (DESKTOP >= 768px): VIETNAM HERITAGE EDITORIAL HERO — ASYMMETRIC 5/7 SPLIT
         ==================================================================== */}
      <section className="relative hidden md:block w-full pl-8 md:pl-16 lg:pl-24 pr-0 pt-12 pb-10 overflow-hidden bg-[#D8C9A9]">
        {onOpenGuide && (
          <div className="absolute top-4 right-6 lg:right-8 z-30">
            <SectionGuideButton lang={lang} onClick={onOpenGuide} />
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* CỘT TRÁI (5 cột ~ 42%): Tiêu đề Lora 3 dòng thanh thoát, mô tả & 2 liên kết mũi tên trần */}
          <div className="lg:col-span-5 pr-8 lg:pr-4">
            <h1
              className="font-['Lora'] text-[38px] lg:text-[44px] font-normal text-[#171817] leading-[1.2] tracking-tight"
              style={{ fontVariantNumeric: 'lining-nums' }}
            >
              {lang === 'en' ? (
                <>
                  Explore Southern
                  <br />
                  Architectural Heritage
                  <br />
                  &amp; Living History
                </>
              ) : lang === 'zh' ? (
                <>
                  探索越南南部
                  <br />
                  建筑遗产与百年
                  <br />
                  历史印记
                </>
              ) : (
                <>
                  Khám phá Di sản
                  <br />
                  Kiến trúc &amp; Lịch sử
                  <br />
                  Vùng đất Nam Bộ
                </>
              )}
            </h1>

            <p className="mt-5 text-[14.5px] leading-[1.7] text-[#171817]/75 max-w-[360px] font-normal">
              {lang === 'en'
                ? `Dấu Ấn Việt 3D Digital Museum — reconstructing ${sites.length} iconic Southeastern Vietnamese monuments through architectural dissection and curated archives.`
                : lang === 'zh'
                ? `越印 3D 数字博物馆 — 通过建筑结构三维解构与历史文献档案，呈现越南东南部 ${sites.length} 处代表性文化遗产工程。`
                : `Bảo tàng số Dấu Ấn Việt 3D — không gian phục dựng ${sites.length} công trình di tích tiêu biểu vùng Đông Nam Bộ qua mô hình giải phẫu kiến trúc và tư liệu khảo cứu.`}
            </p>

            <div className="mt-7 inline-flex flex-wrap items-center gap-3 max-w-full">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('soft');
                  choreographySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#A94F3D] border border-[#C9A46A]/45 shadow-sm hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 text-sm font-medium text-[#F7F3EB] whitespace-nowrap cursor-pointer group"
              >
                {/* 3D Isometric Cube / Architectural Dissection Layers SVG */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105"
                  aria-hidden="true"
                >
                  {/* Outer 3D architectural cube in ivory cream #F7F3EB */}
                  <path
                    d="M12 2.75L20 7.25V16.75L12 21.25L4 16.75V7.25L12 2.75Z"
                    stroke="#F7F3EB"
                  />
                  {/* Exploded inner dissection plane & central axis in bronze gold #C9A46A */}
                  <path d="M4 7.25L12 11.75L20 7.25" stroke="#C9A46A" />
                  <path d="M12 11.75V21.25" stroke="#C9A46A" />
                  <path d="M7.5 13.75L12 16.25L16.5 13.75" stroke="#F7F3EB" />
                </svg>
                <span>
                  {lang === 'en'
                    ? 'Explore 3D Dissection'
                    : lang === 'zh'
                    ? '探索 3D 结构解剖'
                    : 'Khám phá bóc tách 3D'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('soft');
                  onOpenAudioModal(selectedSite);
                }}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#47796D] border border-[#C9A46A]/45 shadow-sm hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 text-sm font-medium text-[#F7F3EB] whitespace-nowrap cursor-pointer group"
              >
                {/* Museum Headphones SVG (matched to #F7F3EB for high legibility) */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105"
                  aria-hidden="true"
                >
                  <path d="M3.5 14V12A8.5 8.5 0 0 1 20.5 12V14" />
                  <rect x="3.5" y="13" width="4" height="6.5" rx="1.8" />
                  <rect x="16.5" y="13" width="4" height="6.5" rx="1.8" />
                  <path d="M9.5 15.25C10.9 14.2 13.1 14.2 14.5 15.25" />
                  <path d="M10.75 17.75C11.5 17.2 12.5 17.2 13.25 17.75" />
                </svg>
                <span>
                  {lang === 'en'
                    ? 'Listen to Museum Audio Guide'
                    : lang === 'zh'
                    ? '收听博物馆语音导览'
                    : 'Nghe thuyết minh bảo tàng'}
                </span>
                {isAudioGuideLocked && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9A46A"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5 shrink-0"
                    aria-hidden="true"
                  >
                    <rect x="4" y="11" width="16" height="10" rx="2.2" />
                    <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* CỘT PHẢI (7 cột ~ 58%): Dải thẻ phân mảng màu sắc tố & Thanh điều hướng nét chấm */}
          <div className="lg:col-span-7 min-w-0">
            <div
              ref={heroCardsTrackRef}
              onScroll={handleHeroTrackScroll}
              onMouseDown={handleHeroTrackMouseDown}
              className={`flex gap-6 overflow-x-auto hero-cards-scrollbar pr-16 pt-2 pb-4 select-none ${
                isDraggingCards ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
              }`}
              style={{ perspective: '1200px' }}
            >
              {sites.map((site, idx) => {
                const loc = getLocalizedSite(site);
                const cleanTitle = loc.officialName.split(/\s*[（(]/)[0];
                const isSelected = site.id === selectedSite.id;
                const activeSlot = getCardPhotoSlot(site.id);
                const photoUrl = resolveHeroPhoto(site, activeSlot);
                const indexPadded = String(idx + 1).padStart(2, '0');
                const block = getHeritageColorBlock(site, lang as 'vi' | 'en' | 'zh');
                const rankingShort =
                  lang === 'en'
                    ? site.rankingLevel === 'Special National'
                      ? 'Special National'
                      : 'National Heritage'
                    : lang === 'zh'
                    ? site.rankingLevel === 'Special National'
                      ? '国家级特别遗迹'
                      : '国家级遗迹'
                    : site.rankingLevel === 'Special National'
                    ? 'Di tích Quốc gia Đặc biệt'
                    : 'Di tích Quốc gia';
                const hasPhoto = Boolean(photoUrl && !failedPhotoMap[`hero:${site.id}:${photoUrl}`]);

                return (
                  <CascadeRevealCard
                    key={site.id}
                    index={idx}
                    columnsPerRow={4}
                    delayStepMs={75}
                    className="shrink-0 [perspective:1000px]"
                  >
                  <article
                    onMouseMove={tiltHandlers.onMouseMove}
                    onMouseLeave={tiltHandlers.onMouseLeave}
                    onClick={(e) => {
                      if (dragDistanceRef.current >= 5) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                      }
                      triggerHaptic('selection');
                      onSelectSite(site);
                      onNavigateTab('catalog');
                    }}
                    style={{
                      backgroundColor: block.bg,
                      color: block.fg,
                    }}
                    className={`museum-tilt-card w-[270px] sm:w-[285px] h-[420px] rounded-2xl overflow-hidden relative shrink-0 cursor-grab active:cursor-grabbing group border transition-all duration-300 flex flex-col ${
                      isSelected
                        ? 'border-[#171817] ring-2 ring-[#171817]/40 shadow-[0_18px_40px_rgba(23,24,23,0.22)]'
                        : 'border-[#171817]/20 hover:border-[#171817]/70 shadow-[0_12px_28px_rgba(23,24,23,0.14)]'
                    }`}
                  >
                    <div
                      data-tilt-glow="true"
                      className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300"
                    />

                    {/* Nút chuyển nhanh Ảnh 01 | 02 ở góc trên bên phải mỗi thẻ di tích */}
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-3 right-3 z-30 inline-flex items-center rounded-full bg-[#F4EFE4]/95 border border-[#171817]/25 p-0.5 shadow-sm"
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('selection');
                          setCardPhotoSlot(site.id, 0);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-sans font-semibold tabular-nums transition-colors cursor-pointer ${
                          activeSlot === 0
                            ? 'bg-[#171817] text-[#D8C9A9]'
                            : 'text-[#171817]/75 hover:text-[#171817]'
                        }`}
                      >
                        01
                      </button>
                      <span className="text-[#171817]/25 text-[10px] px-0.5 select-none" aria-hidden="true">
                        |
                      </span>
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('selection');
                          setCardPhotoSlot(site.id, 1);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-sans font-semibold tabular-nums transition-colors cursor-pointer ${
                          activeSlot === 1
                            ? 'bg-[#171817] text-[#D8C9A9]'
                            : 'text-[#171817]/75 hover:text-[#171817]'
                        }`}
                      >
                        02
                      </button>
                    </div>

                    {hasPhoto ? (
                      <div className="museum-tilt-preserve w-full h-full flex flex-col justify-between">
                        <div
                          className="museum-tilt-z-img relative aspect-video w-full overflow-hidden shrink-0 bg-[#171817]"
                          style={{ borderBottom: `1px solid ${block.hairline}` }}
                        >
                          <HeritageSmoothImage
                            src={photoUrl}
                            alt={cleanTitle}
                            loading={idx < 4 ? 'eager' : 'lazy'}
                            waitTone="dark"
                            onError={() => markPhotoFailed(`hero:${site.id}:${photoUrl}`)}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-[opacity,transform] duration-500"
                            draggable={false}
                          />
                        </div>

                        <div
                          className="museum-tilt-preserve p-5 flex-1 flex flex-col justify-between"
                          style={{ color: block.fg }}
                        >
                          <div className="museum-tilt-z-title">
                            <div
                              className="text-[11px] font-medium uppercase tracking-[0.07em] tabular-nums"
                              style={{ color: block.mutedFg }}
                            >
                              {indexPadded} · {rankingShort}
                            </div>
                            <h2
                              className="font-['Lora'] text-[21px] leading-[1.25] mt-1 line-clamp-2 font-normal"
                              style={{ fontVariantNumeric: 'lining-nums', color: block.fg }}
                            >
                              {cleanTitle}
                            </h2>
                            <p
                              className="text-[12.5px] leading-[1.5] mt-2 line-clamp-2"
                              style={{ color: block.mutedFg }}
                            >
                              {loc.summary}
                            </p>
                          </div>

                          <div
                            className="museum-tilt-z-cta pt-2 text-[13px] font-semibold flex items-center gap-2"
                            style={{ color: block.fg }}
                          >
                            <span>
                              {lang === 'en'
                                ? 'Explore now'
                                : lang === 'zh'
                                ? '立即探索'
                                : 'Khám phá ngay'}
                            </span>
                            <span
                              className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                              aria-hidden="true"
                            >
                              →
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const palette = getHeritagePlatePalette(site.id, idx);
                        return (
                          <div className="museum-tilt-preserve w-full h-full flex flex-col justify-between">
                            <HeritageTypographicPlate
                              site={site}
                              index={idx}
                              variant="hero"
                              className="museum-tilt-z-img !pb-2 flex-1"
                            />
                            <div
                              className="museum-tilt-preserve px-6 pb-6 pt-3 flex flex-col justify-end"
                              style={{
                                color: palette.fg,
                                borderTop: `1px solid ${palette.hairline}`,
                              }}
                            >
                              <div className="museum-tilt-z-title">
                                <div
                                  className="text-[11px] font-medium uppercase tracking-[0.08em] tabular-nums"
                                  style={{ color: palette.mutedFg }}
                                >
                                  {indexPadded} · {rankingShort}
                                </div>
                                <h2
                                  className="font-['Lora'] text-[22px] leading-[1.25] mt-1 line-clamp-2 font-normal"
                                  style={{ fontVariantNumeric: 'lining-nums', color: palette.fg }}
                                >
                                  {cleanTitle}
                                </h2>
                                <p
                                  className="text-[13px] leading-[1.55] mt-2 line-clamp-2"
                                  style={{ color: palette.mutedFg }}
                                >
                                  {loc.summary}
                                </p>
                              </div>

                              <div
                                className="museum-tilt-z-cta mt-4 text-[13px] font-semibold transition-opacity flex items-center gap-2"
                                style={{ color: palette.fg }}
                              >
                                <span>
                                  {lang === 'en'
                                    ? 'Explore now'
                                    : lang === 'zh'
                                    ? '立即探索'
                                    : 'Khám phá ngay'}
                                </span>
                                <span
                                  className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                                  aria-hidden="true"
                                >
                                  →
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </article>
                  </CascadeRevealCard>
                );
              })}
            </div>

            {/* Thanh điều hướng nét chấm dưới góc phải */}
            <div className="mt-5 pr-8 md:pr-14 flex items-center justify-end gap-3.5 text-[13px] text-[#171817]/75">
              <span>
                {lang === 'en'
                  ? 'Scroll for more'
                  : lang === 'zh'
                  ? '滑动浏览更多'
                  : 'Lướt xem thêm'}
              </span>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  scrollHeroCards(-1);
                }}
                aria-label={
                  lang === 'en'
                    ? 'Scroll left'
                    : lang === 'zh'
                    ? '向左滑动'
                    : 'Lướt sang trái'
                }
                className="w-7 h-7 rounded-full border border-[#171817]/25 bg-[#EDE4D0] flex items-center justify-center text-[#171817] hover:border-[#A94F3D] hover:bg-[#A94F3D] hover:text-[#D8C9A9] transition cursor-pointer shrink-0"
              >
                ←
              </button>

              <div className="w-32 h-2 relative flex items-center">
                <div className="w-full border-b-2 border-dotted border-[#171817]/30" />
                <div
                  className="absolute left-0 top-1/2 -translate-y-[1px] h-[2px] bg-[#A94F3D] transition-all duration-150"
                  style={{ width: `${Math.max(10, heroScrollProgress * 100)}%` }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  scrollHeroCards(1);
                }}
                aria-label={
                  lang === 'en'
                    ? 'Scroll right'
                    : lang === 'zh'
                    ? '向右滑动'
                    : 'Lướt sang phải'
                }
                className="w-7 h-7 rounded-full border border-[#171817]/25 bg-[#EDE4D0] flex items-center justify-center text-[#171817] hover:border-[#A94F3D] hover:bg-[#A94F3D] hover:text-[#D8C9A9] transition cursor-pointer shrink-0"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          PART 2: STICKY SCROLL-DRIVEN 3D CHOREOGRAPHY (240vh)
         ==================================================================== */}
      <section
        ref={choreographySectionRef}
        data-onboarding-target="space3d"
        className="hidden md:block relative max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24 border-t border-[#171817]/15"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: 3 Scrolling Editorial Beats */}
          <div className="lg:col-span-5 space-y-12 lg:space-y-24 lg:py-[18vh]">
            {beats.map((beat) => {
              const isActive = activeBeat === beat.index;
              return (
                <div
                  key={beat.index}
                  onClick={() =>
                    selectHomeViewMode(
                      beat.index === 0 ? 'original' : beat.index === 1 ? 'explode' : 'xray'
                    )
                  }
                  className={`cursor-pointer transition-all duration-500 p-6 rounded-[24px] border ${
                    isActive
                      ? 'opacity-100 bg-[#F4EFE4] border-[#A94F3D] shadow-[0_16px_40px_rgba(23,24,23,0.12)]'
                      : 'opacity-65 hover:opacity-95 bg-[#EDE4D0]/70 border-[#171817]/15'
                  }`}
                >
                  <div className="font-sans text-[13px] font-semibold text-[#A94F3D] mb-2">
                    {beat.eyebrow}
                  </div>
                  <h2
                    className="font-serif text-2xl sm:text-4xl font-medium tracking-tight text-[#171817] leading-tight"
                    style={{ fontVariantNumeric: 'lining-nums' }}
                  >
                    {beat.title}
                  </h2>
                  <p className="font-sans mt-3 text-sm sm:text-base text-[#171817]/75 leading-relaxed">{beat.body}</p>

                  {isActive && beat.index === 2 && (
                    <div className="mt-5 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpen3D(selectedSite);
                        }}
                        className="px-4 py-2 rounded-full bg-[#A94F3D] hover:bg-[#914030] text-[#D8C9A9] text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <Scan className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'en'
                            ? 'Open Fullscreen X-Ray Studio'
                            : lang === 'zh'
                            ? '打开全屏 X光透视工作室'
                            : 'Mở Studio X-Ray Toàn màn hình'}
                        </span>
                        {!isAuthenticated && <Lock className="w-3 h-3 shrink-0" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Sticky 3D Stage (#171817 WebGL canvas) + 1px SVG Structural Leader Lines */}
          <div
            ref={stickyStageWrapperRef}
            className="lg:col-span-7 lg:sticky lg:top-20 h-[56vh] min-h-[380px] lg:h-[calc(100vh-7rem)] rounded-[28px] overflow-hidden bg-[#171817] border border-[#171817]/25 shadow-[0_24px_60px_rgba(23,24,23,0.22)] relative"
          >
            {/* Isolated WebGL Host */}
            <div ref={stickyCanvasHostRef} className="w-full h-full" />

            {/* WEBGL CONTEXT LOST / WEAK GPU FALLBACK */}
            {stickyWebglError && (
              <div className="absolute inset-0 z-30 bg-[#171817]/95 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="w-full max-w-sm rounded-2xl bg-[#1C1D1B] border border-[#C9A46A]/65 p-5 shadow-2xl space-y-3.5 text-left">
                  <div className="space-y-1.5 border-b border-[#D8C9A9]/15 pb-3">
                    <span className="text-[10.5px] font-sans font-semibold uppercase tracking-[0.14em] text-[#C9A46A] block">
                      {lang === 'en'
                        ? 'WEBGL 3D GRAPHICS NOTICE'
                        : lang === 'zh'
                        ? 'WEBGL 3D 图形提示'
                        : 'THÔNG BÁO ĐỒ HỌA 3D (WEBGL)'}
                    </span>
                    <p className="text-xs text-[#D8C9A9]/90 leading-relaxed font-sans">
                      {lang === 'en'
                        ? 'The 3D graphics context was interrupted or your GPU needs a quick reset to display this monument.'
                        : lang === 'zh'
                        ? '当前浏览器或显卡的 3D 渲染上下文暂时中断，请点击下方按钮重新启动 3D 视窗。'
                        : stickyWebglError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStickyWebglError(null);
                      setStickyGlbError(null);
                      setStickyWebglRestartKey((k) => k + 1);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#C9A46A] hover:bg-[#d8b57c] text-[#171817] text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {lang === 'en'
                        ? 'Restart 3D Viewport'
                        : lang === 'zh'
                        ? '重启 3D 视窗'
                        : 'Khởi động lại khung 3D'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* REAL .GLB LOADING OR CLOUD CHUNK PULL PROGRESS RING */}
            {(stickyCloudDownload?.active || stickyGlbSourceLoading || stickyGlbLoading) && (
              <div className="absolute inset-0 z-20 bg-[#171817]/95 backdrop-blur-sm flex items-center justify-center p-6">
                {stickyCloudDownload?.active ? (
                  <div className="w-full max-w-xs flex flex-col items-center text-center space-y-3.5">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
                        <circle
                          cx="32"
                          cy="32"
                          r="27"
                          fill="none"
                          stroke="rgba(216,201,169,0.16)"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="27"
                          fill="none"
                          stroke="#C9A46A"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 27}
                          strokeDashoffset={
                            2 * Math.PI * 27 * (1 - Math.max(0, Math.min(100, stickyCloudDownload.percent)) / 100)
                          }
                          className="transition-all duration-300"
                        />
                      </svg>
                      <span className="absolute text-xs font-semibold text-[#D8C9A9] tabular-nums">
                        {Math.round(stickyCloudDownload.percent)}%
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.16em] text-[#C9A46A] block">
                        {lang === 'en'
                          ? 'CLOUD ARCHIVE SYNC'
                          : lang === 'zh'
                          ? '云端档案同步'
                          : 'KHO LƯU TRỮ CLOUD'}
                      </span>
                      <p className="text-xs text-[#D8C9A9] font-medium leading-relaxed">
                        {lang === 'en'
                          ? `Downloading model from Cloud Archive: ${Math.round(stickyCloudDownload.percent)}%`
                          : lang === 'zh'
                          ? `正在从云端档案库下载模型：${Math.round(stickyCloudDownload.percent)}%`
                          : `Đang tải mô hình từ Kho Lưu trữ Cloud: ${Math.round(stickyCloudDownload.percent)}%`}
                      </p>
                      {stickyCloudDownload.totalChunks > 0 && (
                        <p className="text-[11px] text-[#D8C9A9]/65 tabular-nums">
                          {lang === 'en'
                            ? `Chunk ${stickyCloudDownload.currentChunk}/${stickyCloudDownload.totalChunks}`
                            : lang === 'zh'
                            ? `分片 ${stickyCloudDownload.currentChunk}/${stickyCloudDownload.totalChunks}`
                            : `Mảnh ${stickyCloudDownload.currentChunk}/${stickyCloudDownload.totalChunks}`}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-xs space-y-2.5 text-left">
                    <span className="text-[10.5px] font-sans font-semibold uppercase tracking-[0.14em] text-[#C9A46A] block">
                      {lang === 'en' ? 'LOADING .GLB' : lang === 'zh' ? '正在加载 .GLB' : 'ĐANG NẠP .GLB'}
                    </span>
                    <div className="w-full h-1 bg-[#D8C9A9]/15 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-[#C9A46A] rounded-full" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {!stickyCloudDownload?.active &&
              !stickyGlbSourceLoading &&
              !stickyGlbLoading &&
              (!stickyGlbSource.url || Boolean(stickyGlbError)) && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
                  <div className="pointer-events-auto max-w-sm w-full rounded-sm bg-[#171817] border border-[#C9A46A] p-5 shadow-2xl space-y-3 text-left">
                    <div className="flex items-center justify-between gap-2 border-b border-[#C9A46A]/25 pb-2">
                      <span className="text-[10.5px] font-sans font-semibold uppercase tracking-[0.14em] text-[#C9A46A]">
                        {lang === 'en'
                          ? 'DIGITAL MUSEUM .GLB ARCHIVE'
                          : lang === 'zh'
                          ? '数字博物馆 .GLB 档案'
                          : 'BẢO TÀNG SỐ .GLB'}
                      </span>
                      <span className="text-[10.5px] font-sans text-[#D8C9A9]/65 tabular-nums">
                        {selectedSite.identifierCode}
                      </span>
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#D8C9A9] leading-snug">
                      {locSelected.officialName}
                    </h4>
                    <p className="text-xs text-[#D8C9A9] leading-relaxed">
                      {stickyCloudError
                        ? lang === 'en'
                          ? 'Could not retrieve the 3D model from Cloud Archive on this session.'
                          : lang === 'zh'
                          ? '本次会话未能从云端档案库拉取该 3D 模型。'
                          : 'Chưa thể tải mô hình 3D từ Kho Lưu trữ Cloud trong phiên này.'
                        : lang === 'en'
                        ? 'The .GLB architectural model for this heritage site is being digitized.'
                        : lang === 'zh'
                        ? '该遗产的 .GLB 建筑模型正在数字化处理中。'
                        : 'Mô hình kiến trúc .GLB của di tích này đang được số hóa.'}
                    </p>
                    {stickyCloudError && (
                      <div className="rounded-[3px] border border-[#A94F3D]/55 bg-[#A94F3D]/12 px-2.5 py-1.5 text-[11px] font-mono text-[#F0B4A8] break-words">
                        [{stickyCloudError.code}] {stickyCloudError.message}
                      </div>
                    )}
                    {stickyGlbError && (
                      <p className="text-[11px] text-[#A94F3D] leading-snug">
                        {stickyGlbError}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setStickyGlbError(null);
                          void retryStickyGlbFromCloud();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-[#C9A46A]/65 bg-[#C9A46A]/15 hover:bg-[#C9A46A]/25 text-[#F5EFE6] text-xs font-medium cursor-pointer transition-colors"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          className="w-3.5 h-3.5 text-[#C9A46A] shrink-0"
                        >
                          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                          <polyline points="21 3 21 9 15 9" />
                        </svg>
                        <span>
                          {lang === 'en'
                            ? 'Retry from Cloud'
                            : lang === 'zh'
                            ? '从云端重新加载'
                            : 'Thử tải lại từ Cloud'}
                        </span>
                      </button>
                      {isStrictAdmin && onOpenAdminGlbUpload && (
                        <button
                          type="button"
                          onClick={() => onOpenAdminGlbUpload(selectedSite)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-sm bg-[#C9A46A] hover:bg-[#D8C9A9] text-[#171817] text-xs font-semibold cursor-pointer transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {lang === 'en'
                              ? 'Upload .GLB'
                              : lang === 'zh'
                              ? '上传 .GLB'
                              : 'Tải .GLB lên'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Beat Selector Pills Top-Left */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-full bg-[#F4EFE4]/95 border border-[#171817]/20 p-1 shadow-md">
              {[
                {
                  idx: 0 as const,
                  mode: 'original' as const,
                  label: lang === 'en' ? 'Original' : lang === 'zh' ? '原貌' : 'Nguyên bản',
                },
                {
                  idx: 1 as const,
                  mode: 'explode' as const,
                  label: lang === 'en' ? '3D Exploded' : lang === 'zh' ? '3D拆解' : 'Bóc tách 3D',
                },
                {
                  idx: 2 as const,
                  mode: 'xray' as const,
                  label: lang === 'en' ? 'X-Ray' : lang === 'zh' ? 'X光透视' : 'X-Ray',
                },
              ].map((tab) => (
                <button
                  key={tab.idx}
                  type="button"
                  onClick={() => selectHomeViewMode(tab.mode)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeBeat === tab.idx
                      ? 'bg-[#A94F3D] text-[#D8C9A9]'
                      : 'text-[#171817]/75 hover:text-[#171817]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 1px Technical SVG Leader Lines Tracked Directly to 3D Tier Heights */}
            {activeBeat === 1 &&
              Boolean(stickyGlbSource.url) &&
              !stickyGlbSourceLoading &&
              !stickyGlbLoading &&
              !stickyGlbError && (
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                <svg
                  ref={calloutSvgRef}
                  className="w-full h-full"
                  viewBox="0 0 720 540"
                  preserveAspectRatio="none"
                >
                  {/* Callout 1: Tier 4 Roof & Crown */}
                  <polyline
                    ref={roofLineRef}
                    points="380,155 470,115 585,115"
                    fill="none"
                    stroke="rgba(216,201,169,0.68)"
                    strokeWidth="1"
                  />
                  <circle ref={roofDotRef} cx="380" cy="155" r="4" fill="#C9A46A" />
                  <circle
                    ref={roofRingRef}
                    cx="380"
                    cy="155"
                    r="8"
                    fill="none"
                    stroke="rgba(201,164,106,0.58)"
                    strokeWidth="1"
                  />

                  {/* Callout 2: Tier 3 Structural Load Frame */}
                  <polyline
                    ref={frameLineRef}
                    points="355,305 230,275 115,275"
                    fill="none"
                    stroke="rgba(216,201,169,0.68)"
                    strokeWidth="1"
                  />
                  <circle ref={frameDotRef} cx="355" cy="305" r="4" fill="#A94F3D" />
                  <circle
                    ref={frameRingRef}
                    cx="355"
                    cy="305"
                    r="8"
                    fill="none"
                    stroke="rgba(169,79,61,0.58)"
                    strokeWidth="1"
                  />

                  {/* Callout 3: Tier 1 Foundation & Stratum */}
                  <polyline
                    ref={baseLineRef}
                    points="430,430 520,465 620,465"
                    fill="none"
                    stroke="rgba(216,201,169,0.68)"
                    strokeWidth="1"
                  />
                  <circle ref={baseDotRef} cx="430" cy="430" r="4" fill="#47796D" />
                  <circle
                    ref={baseRingRef}
                    cx="430"
                    cy="430"
                    r="8"
                    fill="none"
                    stroke="rgba(71,121,109,0.58)"
                    strokeWidth="1"
                  />
                </svg>

                {/* Text Labels anchored neatly beside live-projected 3D leader lines */}
                <div
                  ref={roofCardRef}
                  style={{ top: '15%', right: '20px' }}
                  className="hidden sm:block absolute rounded-xl bg-[#F4EFE4]/95 border border-[#171817]/20 px-3 py-1.5 text-[11px] text-[#171817] shadow-md max-w-[200px]"
                >
                  <span className="text-[#A94F3D] font-semibold block">
                    {lang === 'en'
                      ? 'Roof & Crown Tier'
                      : lang === 'zh'
                      ? '屋顶与塔尖层'
                      : 'Tầng mái & Đỉnh chóp'}
                  </span>
                  <span className="text-[#171817]/75 truncate block">
                    {locSelected.hotspots?.[0]?.name ||
                      featuredFeatures[0]?.name ||
                      locSelected.architecturalStyle}
                  </span>
                </div>
                <div
                  ref={frameCardRef}
                  style={{ top: '41%', left: '20px' }}
                  className="hidden sm:block absolute rounded-xl bg-[#F4EFE4]/95 border border-[#171817]/20 px-3 py-1.5 text-[11px] text-[#171817] shadow-md max-w-[200px]"
                >
                  <span className="text-[#526D8B] font-semibold block">
                    {lang === 'en'
                      ? 'Structural Load Frame'
                      : lang === 'zh'
                      ? '承重框架结构'
                      : 'Hệ khung chịu lực'}
                  </span>
                  <span className="text-[#171817]/75 truncate block">
                    {(locSelected.materials || []).slice(0, 2).join(' · ')}
                  </span>
                </div>
                <div
                  ref={baseCardRef}
                  style={{ top: '72%', right: '20px' }}
                  className="hidden sm:block absolute rounded-xl bg-[#F4EFE4]/95 border border-[#171817]/20 px-3 py-1.5 text-[11px] text-[#171817] shadow-md max-w-[200px]"
                >
                  <span className="text-[#47796D] font-semibold block">
                    {lang === 'en'
                      ? 'Foundation & Stratum'
                      : lang === 'zh'
                      ? '基础与地下岩层'
                      : 'Nền móng & Địa tầng'}
                  </span>
                  <span className="font-sans text-[11px] text-[#171817]/75 tabular-nums block">
                    {selectedSite.gps.lat.toFixed(4)}°N, {selectedSite.gps.lng.toFixed(4)}°E
                  </span>
                </div>
              </div>
            )}

            {/* Bottom-Right Subtle Status Pill */}
            <div className="absolute bottom-4 right-4 z-10 pointer-events-none rounded-full bg-[#F4EFE4]/95 border border-[#171817]/20 px-3.5 py-1.5 text-xs font-medium text-[#171817] shadow-md tabular-nums">
              {activeBeat === 0
                ? lang === 'en'
                  ? 'Original · Solid PBR'
                  : lang === 'zh'
                  ? '原貌 · PBR 真实材质'
                  : 'Nguyên bản · Vật liệu PBR'
                : activeBeat === 1
                ? lang === 'en'
                  ? `3D Exploded • ${explodePercent}%`
                  : lang === 'zh'
                  ? `3D拆解 • ${explodePercent}%`
                  : `Bóc tách 3D • ${explodePercent}%`
                : lang === 'en'
                ? 'X-Ray · Interior Cut'
                : lang === 'zh'
                ? 'X光透视 · 内部剖面'
                : 'X-Ray · Mặt cắt nội thất'}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          PART 3: COLOR-BLOCKED CURATORIAL BENTO GRID SHOWCASE
         ==================================================================== */}
      <section
        data-onboarding-target="monuments"
        className="hidden md:block max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24 border-t border-[#171817]/15 space-y-10"
      >
        {onStartGuidedTour && onStartMasterpiece && (
          <GuidedTourStarterSection
            tours={guidedTours}
            isAuthenticated={isAuthenticated}
            masterpieceSite={masterpieceSite}
            onStartTour={onStartGuidedTour}
            onStartMasterpiece={onStartMasterpiece}
          />
        )}

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-[#A94F3D] block">
              {lang === 'en' ? 'Curated Showcase' : lang === 'zh' ? '精选馆藏展区' : 'Không gian trưng bày'}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-[#171817] mt-1">
              {lang === 'en'
                ? 'Explore every facet of heritage.'
                : lang === 'zh'
                ? '多维度探索越南南疆文化遗产。'
                : 'Khám phá toàn diện Di sản Đông Nam Bộ.'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('catalog')}
            className="text-sm font-semibold text-[#A94F3D] hover:text-[#171817] flex items-center gap-1.5 cursor-pointer self-start sm:self-end transition-colors"
          >
            <span>
              {lang === 'en'
                ? `View all ${sites.length} monuments`
                : lang === 'zh'
                ? `查看全部 ${sites.length} 处遗产档案`
                : `Xem tất cả ${sites.length} hồ sơ`}
            </span>
            {!isAuthenticated && <Lock className="w-3 h-3 shrink-0" />}
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Row 1: Asymmetric Large Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Featured Card 1 (7 cols) */}
          {primaryBentoSite && (() => {
            const pSlot = getCardPhotoSlot(primaryBentoSite.id);
            const pPhoto = resolveHeroPhoto(primaryBentoSite, pSlot);
            const hasPrimaryPhoto = Boolean(pPhoto && !failedPhotoMap[`bento:${primaryBentoSite.id}:${pPhoto}`]);
            const block = getHeritageColorBlock(primaryBentoSite, lang as 'vi' | 'en' | 'zh');
            return (
            <article
              onClick={() => onOpenDetailModal(primaryBentoSite)}
              onMouseMove={tiltHandlers.onMouseMove}
              onMouseLeave={tiltHandlers.onMouseLeave}
              style={{ backgroundColor: block.bg, color: block.fg }}
              className="museum-tilt-card md:col-span-7 group relative min-h-[380px] rounded-[28px] border border-[#171817]/20 overflow-hidden cursor-pointer flex flex-col justify-between shadow-[0_16px_40px_rgba(23,24,23,0.14)]"
            >
              <div
                data-tilt-glow="true"
                className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300"
              />
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-3.5 right-3.5 z-30 inline-flex items-center rounded-full bg-[#F4EFE4]/95 border border-[#171817]/25 p-0.5 shadow-sm"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardPhotoSlot(primaryBentoSite.id, 0);
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-sans font-semibold tabular-nums transition-colors cursor-pointer ${
                    pSlot === 0 ? 'bg-[#171817] text-[#D8C9A9]' : 'text-[#171817]/75 hover:text-[#171817]'
                  }`}
                >
                  01
                </button>
                <span className="text-[#171817]/25 text-[10px] px-0.5 select-none" aria-hidden="true">|</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardPhotoSlot(primaryBentoSite.id, 1);
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-sans font-semibold tabular-nums transition-colors cursor-pointer ${
                    pSlot === 1 ? 'bg-[#171817] text-[#D8C9A9]' : 'text-[#171817]/75 hover:text-[#171817]'
                  }`}
                >
                  02
                </button>
              </div>
              {hasPrimaryPhoto ? (
                <div
                  className="aspect-video w-full overflow-hidden bg-[#171817] shrink-0"
                  style={{ borderBottom: `1px solid ${block.hairline}` }}
                >
                  <HeritageSmoothImage
                    src={pPhoto}
                    alt={getLocalizedSite(primaryBentoSite).officialName}
                    loading="lazy"
                    waitTone="dark"
                    onError={() => markPhotoFailed(`bento:${primaryBentoSite.id}:${pPhoto}`)}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-[opacity,transform] duration-500"
                  />
                </div>
              ) : (
                <div
                  className="pointer-events-none absolute inset-4 border"
                  style={{ borderColor: block.hairline }}
                />
              )}

              <div className="relative z-10 p-7 flex-1 flex flex-col justify-between">
                <div className="max-w-md">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="font-sans text-[12px] font-medium tabular-nums"
                      style={{ color: block.mutedFg }}
                    >
                      {primaryBentoSite.commencementYear} · {primaryBentoSite.identifierCode} ·{' '}
                      {lang === 'en'
                        ? 'Special National Monument'
                        : lang === 'zh'
                        ? '国家级特别遗迹'
                        : 'Di tích Quốc gia Đặc biệt'}
                    </span>
                    {hiddenSiteIds.includes(primaryBentoSite.id) && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#171817] border border-[#C9A46A] text-[#C9A46A] text-[11px] font-semibold">
                        {lang === 'en'
                          ? 'Tester Preview · Hidden'
                          : lang === 'zh'
                          ? '隐藏草稿 · 测试模式'
                          : 'Đang ẩn · Chế độ Tester'}
                      </span>
                    )}
                  </div>
                  <h3
                    className="font-serif text-2xl sm:text-4xl font-medium tracking-tight mt-1.5"
                    style={{ fontVariantNumeric: 'lining-nums', color: block.fg }}
                  >
                    {getLocalizedSite(primaryBentoSite).officialName}
                  </h3>
                  <p
                    className="font-sans text-sm mt-2 line-clamp-2"
                    style={{ color: block.mutedFg }}
                  >
                    {getLocalizedSite(primaryBentoSite).summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen3D(primaryBentoSite);
                    }}
                    className="px-4 py-2 rounded-full bg-[#171817] hover:bg-[#171817]/90 text-[#D8C9A9] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>
                      {lang === 'en'
                        ? 'Open 3D X-Ray'
                        : lang === 'zh'
                        ? '打开 3D X光透视'
                        : 'Mở 3D X-Ray'}
                    </span>
                    {!isAuthenticated && <Lock className="w-3 h-3 shrink-0" />}
                  </button>
                  {!hasPrimaryPhoto && (
                    <span
                      className="font-serif text-5xl leading-none font-normal tabular-nums opacity-35 ml-auto mr-3"
                      style={{ color: block.fg, fontVariantNumeric: 'lining-nums' }}
                    >
                      01
                    </span>
                  )}
                  <span
                    style={{
                      backgroundColor: block.badgeBg,
                      color: block.badgeFg,
                      borderColor: block.hairline,
                    }}
                    className="w-9 h-9 rounded-full border flex items-center justify-center transition-transform group-hover:scale-105"
                  >
                    {!isAuthenticated ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
                  </span>
                </div>
              </div>
            </article>
            );
          })()}

          {/* Featured Card 2 (5 cols) */}
          {cuChiSite && (() => {
            const cSlot = getCardPhotoSlot(cuChiSite.id);
            const cPhoto = resolveHeroPhoto(cuChiSite, cSlot);
            const hasCuChiPhoto = Boolean(cPhoto && !failedPhotoMap[`bento:${cuChiSite.id}:${cPhoto}`]);
            const block = getHeritageColorBlock(cuChiSite, lang as 'vi' | 'en' | 'zh');
            return (
            <article
              onClick={() => onOpenDetailModal(cuChiSite)}
              onMouseMove={tiltHandlers.onMouseMove}
              onMouseLeave={tiltHandlers.onMouseLeave}
              style={{ backgroundColor: block.bg, color: block.fg }}
              className="museum-tilt-card md:col-span-5 group relative min-h-[380px] rounded-[28px] border border-[#171817]/20 overflow-hidden cursor-pointer flex flex-col justify-between shadow-[0_16px_40px_rgba(23,24,23,0.14)]"
            >
              <div
                data-tilt-glow="true"
                className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300"
              />
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-3.5 right-3.5 z-30 inline-flex items-center rounded-full bg-[#F4EFE4]/95 border border-[#171817]/25 p-0.5 shadow-sm"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardPhotoSlot(cuChiSite.id, 0);
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-sans font-semibold tabular-nums transition-colors cursor-pointer ${
                    cSlot === 0 ? 'bg-[#171817] text-[#D8C9A9]' : 'text-[#171817]/75 hover:text-[#171817]'
                  }`}
                >
                  01
                </button>
                <span className="text-[#171817]/25 text-[10px] px-0.5 select-none" aria-hidden="true">|</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardPhotoSlot(cuChiSite.id, 1);
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-sans font-semibold tabular-nums transition-colors cursor-pointer ${
                    cSlot === 1 ? 'bg-[#171817] text-[#D8C9A9]' : 'text-[#171817]/75 hover:text-[#171817]'
                  }`}
                >
                  02
                </button>
              </div>
              {hasCuChiPhoto ? (
                <div
                  className="aspect-video w-full overflow-hidden bg-[#171817] shrink-0"
                  style={{ borderBottom: `1px solid ${block.hairline}` }}
                >
                  <HeritageSmoothImage
                    src={cPhoto}
                    alt={getLocalizedSite(cuChiSite).officialName}
                    loading="lazy"
                    waitTone="dark"
                    onError={() => markPhotoFailed(`bento:${cuChiSite.id}:${cPhoto}`)}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-[opacity,transform] duration-500"
                  />
                </div>
              ) : (
                <div
                  className="pointer-events-none absolute inset-4 border"
                  style={{ borderColor: block.hairline }}
                />
              )}

              <div className="relative z-10 p-7 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="font-sans text-[12px] font-medium tabular-nums"
                      style={{ color: block.mutedFg }}
                    >
                      {lang === 'en'
                        ? `3 Underground Strata · ${cuChiSite.identifierCode}`
                        : lang === 'zh'
                        ? `三层地下坑道结构 · ${cuChiSite.identifierCode}`
                        : `3 tầng địa tầng ngầm · ${cuChiSite.identifierCode}`}
                    </span>
                    {hiddenSiteIds.includes(cuChiSite.id) && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#171817] border border-[#C9A46A] text-[#C9A46A] text-[11px] font-semibold">
                        {lang === 'en'
                          ? 'Tester Preview · Hidden'
                          : lang === 'zh'
                          ? '隐藏草稿 · 测试模式'
                          : 'Đang ẩn · Chế độ Tester'}
                      </span>
                    )}
                  </div>
                  <h3
                    className="font-serif text-2xl sm:text-3xl font-medium tracking-tight mt-1.5"
                    style={{ fontVariantNumeric: 'lining-nums', color: block.fg }}
                  >
                    {getLocalizedSite(cuChiSite).officialName}
                  </h3>
                  <p
                    className="font-sans text-sm mt-2 line-clamp-2"
                    style={{ color: block.mutedFg }}
                  >
                    {getLocalizedSite(cuChiSite).summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen3D(cuChiSite);
                    }}
                    className="px-4 py-2 rounded-full bg-[#171817] hover:bg-[#171817]/90 text-[#D8C9A9] text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>
                      {lang === 'en'
                        ? '3-Level Tunnel Cutaway ↗'
                        : lang === 'zh'
                        ? '三层地下坑道剖面 ↗'
                        : 'Mặt cắt 3 tầng ngầm ↗'}
                    </span>
                    {!isAuthenticated && <Lock className="w-3 h-3 shrink-0" />}
                  </button>
                  <span
                    style={{
                      backgroundColor: block.badgeBg,
                      color: block.badgeFg,
                      borderColor: block.hairline,
                    }}
                    className="w-9 h-9 rounded-full border flex items-center justify-center transition-transform group-hover:scale-105"
                  >
                    {!isAuthenticated ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
                  </span>
                </div>
              </div>
            </article>
            );
          })()}
        </div>

        {/* Row 2: 3 Platform Capabilities Bento Cards (Color-Blocked: Teal, Slate Blue, Gold) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <article
            onClick={() => onNavigateTab('map_routes')}
            className="group rounded-[28px] bg-[#47796D] hover:bg-[#3F6E63] text-[#171817] border border-[#171817]/20 p-7 flex flex-col justify-between min-h-[240px] cursor-pointer transition-all duration-300 shadow-[0_14px_34px_rgba(23,24,23,0.12)]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <Compass className="w-6 h-6 text-[#171817]" />
                {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-[#171817]/75" />}
              </div>
              <span className="text-[13px] font-medium text-[#171817]/80 block">
                {lang === 'en'
                  ? 'GIS & 1815 Historical Map'
                  : lang === 'zh'
                  ? 'GIS 与 1815 历史古图'
                  : 'GIS & Bản đồ cổ 1815'}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#171817] mt-1">
                {lang === 'en'
                  ? 'Map & 9 Heritage Routes'
                  : lang === 'zh'
                  ? '地图与 9条遗产路线'
                  : 'Bản đồ & 9 Tuyến Di sản'}
              </h3>
              <p className="text-xs sm:text-sm text-[#171817]/80 mt-2 leading-relaxed">
                {lang === 'en'
                  ? '1815 Gia Định Citadel time-spyglass lens, 5-layer GIS map, and 9 Heritage Routes connecting all 17 monuments across HCMC – Bình Dương – Bà Rịa-Vũng Tàu.'
                  : lang === 'zh'
                  ? '1815年嘉定八卦城历史透镜、5层GIS空间地图，以及串联胡志明市、平阳与巴地头顿17处古迹的9条遗产路线。'
                  : 'Thấu kính xuyên không Thành Bát Quái 1815, bản đồ GIS 5 lớp và 9 Tuyến Di sản kết nối trọn vẹn 17 di tích TP.HCM – Bình Dương – BR-VT.'}
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <span className="w-9 h-9 rounded-full bg-[#171817]/15 group-hover:bg-[#171817] text-[#171817] group-hover:text-[#D8C9A9] flex items-center justify-center transition-colors">
                {!isAuthenticated ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
              </span>
            </div>
          </article>

          <article
            onClick={() => onNavigateTab('catalog')}
            className="group rounded-[28px] bg-[#526D8B] hover:bg-[#49627E] text-[#D8C9A9] border border-[#171817]/20 p-7 flex flex-col justify-between min-h-[240px] cursor-pointer transition-all duration-300 shadow-[0_14px_34px_rgba(23,24,23,0.12)]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="w-6 h-6 text-[#D8C9A9]" />
                {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-[#D8C9A9]/80" />}
              </div>
              <span className="text-[13px] font-medium text-[#D8C9A9]/85 block">
                {lang === 'en'
                  ? '17 Dossiers & 300-Year Chronicle'
                  : lang === 'zh'
                  ? '17 份档案与 300 年编年史'
                  : '17 Hồ sơ & Biên niên sử 300 năm'}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#D8C9A9] mt-1">
                {lang === 'en'
                  ? 'Heritage Dossiers & Real Photos'
                  : lang === 'zh'
                  ? '遗产档案与实景影像'
                  : 'Hồ sơ Di sản & Ảnh thật'}
              </h3>
              <p className="text-xs sm:text-sm text-[#D8C9A9]/85 mt-2 leading-relaxed">
                {lang === 'en'
                  ? 'VN-2000 / WGS-84 geodetic coordinates, 1698–2026 historical timeline, and verified Wikimedia Commons photography.'
                  : lang === 'zh'
                  ? 'VN-2000 / WGS-84 测绘坐标、1698–2026 历史时间轴，以及维基共享资源实景高清摄影。'
                  : 'Tư liệu tọa độ VN-2000 / WGS-84, dòng chảy lịch sử 1698–2026 và ảnh chụp thực tế Wikimedia Commons.'}
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <span className="w-9 h-9 rounded-full bg-[#171817]/25 group-hover:bg-[#D8C9A9] text-[#D8C9A9] group-hover:text-[#171817] flex items-center justify-center transition-colors">
                {!isAuthenticated ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
              </span>
            </div>
          </article>

          <article
            onClick={() => onNavigateTab('edtech')}
            className="group rounded-[28px] bg-[#C9A46A] hover:bg-[#BE985D] text-[#171817] border border-[#171817]/20 p-7 flex flex-col justify-between min-h-[240px] cursor-pointer transition-all duration-300 shadow-[0_14px_34px_rgba(23,24,23,0.12)]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <Ticket className="w-6 h-6 text-[#171817]" />
                {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-[#171817]/75" />}
              </div>
              <span className="text-[13px] font-medium text-[#171817]/80 block">
                {lang === 'en'
                  ? '3D Tickets · EdTech · Tourism'
                  : lang === 'zh'
                  ? '3D 门票 · 数字教材 · 文化旅游'
                  : 'Vé 3D · Học liệu số · Du lịch'}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#171817] mt-1">
                {lang === 'en'
                  ? '3D Tour Tickets & Digital EdTech'
                  : lang === 'zh'
                  ? '3D 导览门票与数字教材'
                  : 'Vé Tour 3D & Học liệu Số'}
              </h3>
              <p className="text-xs sm:text-sm text-[#171817]/80 mt-2 leading-relaxed">
                {lang === 'en'
                  ? 'Instant QR e-ticket issuance, K-12 local history curriculum packages, and interactive 5-question quizzes.'
                  : lang === 'zh'
                  ? '支持二维码即刻出票、中小学地方历史数字课程包，以及5题互动知识测验。'
                  : 'Thanh toán QR demo cấp Vé Điện Tử tức thì, gói trường học GDPT 2018 và bài trắc nghiệm 5 câu.'}
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <span className="w-9 h-9 rounded-full bg-[#171817]/15 group-hover:bg-[#171817] text-[#171817] group-hover:text-[#D8C9A9] flex items-center justify-center transition-colors">
                {!isAuthenticated ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
              </span>
            </div>
          </article>
        </div>

        {/* Row 3: 4 Representative Monuments Compact Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {extraBentoSites.map((site, idx) => (
            <CascadeRevealCard
              key={site.id}
              index={idx}
              columnsPerRow={4}
              delayStepMs={85}
              className="h-full"
            >
              <BentoMonumentCard
                site={site}
                officialName={getLocalizedSite(site).officialName}
                isAuthenticated={isAuthenticated}
                isHiddenForVisitors={hiddenSiteIds.includes(site.id)}
                onOpenDetailModal={onOpenDetailModal}
                onOpenPhotoManager={onOpenPhotoManager}
                onOpen3D={onOpen3D}
              />
            </CascadeRevealCard>
          ))}
        </div>

        {/* Row 4: Live Multi-Device Visitor Statistics Cards */}
        <div className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#47796D] animate-pulse" />
              <span className="font-sans text-[13px] font-semibold text-[#A94F3D]">
                {lang === 'en'
                  ? 'Live Museum Attendance'
                  : lang === 'zh'
                  ? '实时访客统计'
                  : 'Thống kê khách tham quan trực tuyến'}
              </span>
            </div>
            <span className="text-xs text-[#171817]/65">
              {lang === 'en'
                ? 'Synced in real time across desktop & mobile devices'
                : lang === 'zh'
                ? '跨电脑与手机设备实时同步'
                : 'Đồng bộ theo thời gian thực trên máy tính & điện thoại'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-[22px] bg-[#F4EFE4] border border-[#171817]/15 p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#171817]/75">
                  {lang === 'en'
                    ? 'Total Museum Visits'
                    : lang === 'zh'
                    ? '博物馆总访问量'
                    : 'Tổng lượt khách tham quan'}
                </span>
                <Users className="w-4 h-4 text-[#A94F3D]" />
              </div>
              <div
                className="text-3xl font-semibold text-[#171817] tabular-nums"
                style={{ fontVariantNumeric: 'lining-nums' }}
              >
                {liveAnalytics.totalVisitors.toLocaleString('vi-VN')}
              </div>
              <div className="text-[11px] font-medium text-[#47796D]">
                {lang === 'en'
                  ? 'Counted once per visitor session'
                  : lang === 'zh'
                  ? '按独立访问会话统计'
                  : 'Ghi nhận theo từng phiên truy cập'}
              </div>
            </div>

            <div className="rounded-[22px] bg-[#F4EFE4] border border-[#171817]/15 p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#171817]/75 truncate">
                  {lang === 'en'
                    ? 'Selected Monument Views'
                    : lang === 'zh'
                    ? '当前古迹浏览量'
                    : 'Lượt xem di tích đang chọn'}
                </span>
                <Landmark className="w-4 h-4 text-[#526D8B] shrink-0" />
              </div>
              <div
                className="text-3xl font-semibold text-[#171817] tabular-nums"
                style={{ fontVariantNumeric: 'lining-nums' }}
              >
                {selectedSiteViews.toLocaleString('vi-VN')}
              </div>
              <div className="text-[11px] text-[#171817]/70 truncate">
                {locSelected.officialName.split(/\s*[（(]/)[0]}
              </div>
            </div>

            <div className="rounded-[22px] bg-[#F4EFE4] border border-[#171817]/15 p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#171817]/75">
                  {lang === 'en'
                    ? '3D & Dossier Views'
                    : lang === 'zh'
                    ? '3D 与档案浏览总计'
                    : 'Lượt xem 3D & Hồ sơ Di sản'}
                </span>
                <Eye className="w-4 h-4 text-[#C9A46A]" />
              </div>
              <div
                className="text-3xl font-semibold text-[#A94F3D] tabular-nums"
                style={{ fontVariantNumeric: 'lining-nums' }}
              >
                {totalSiteViews.toLocaleString('vi-VN')}
              </div>
              <div className="text-[11px] text-[#171817]/70">
                {lang === 'en'
                  ? `Across ${sites.length} preserved monuments`
                  : lang === 'zh'
                  ? `涵盖 ${sites.length} 处遗产工程`
                  : `Trên toàn bộ ${sites.length} công trình di tích`}
              </div>
            </div>

            <div className="rounded-[22px] bg-[#F4EFE4] border border-[#171817]/15 p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#171817]/75">
                  {lang === 'en'
                    ? 'Latest Activity'
                    : lang === 'zh'
                    ? '最近访问动态'
                    : 'Hoạt động tham quan gần nhất'}
                </span>
                {latestVisitEntry?.deviceType === 'Điện thoại' ? (
                  <Smartphone className="w-4 h-4 text-[#47796D]" />
                ) : (
                  <Monitor className="w-4 h-4 text-[#47796D]" />
                )}
              </div>
              <div className="text-sm font-semibold text-[#171817] line-clamp-1">
                {latestVisitEntry
                  ? latestVisitEntry.siteName || latestVisitEntry.actionLabel
                  : lang === 'en'
                  ? 'Digital Museum Online'
                  : lang === 'zh'
                  ? '数字博物馆在线运行中'
                  : 'Bảo tàng Số đang hoạt động'}
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] text-[#171817]/70">
                <span>
                  {latestVisitEntry?.deviceType === 'Điện thoại'
                    ? lang === 'en'
                      ? 'Mobile'
                      : lang === 'zh'
                      ? '手机端'
                      : 'Điện thoại'
                    : lang === 'en'
                    ? 'Desktop'
                    : lang === 'zh'
                    ? '电脑端'
                    : 'Máy tính'}
                </span>
                <span className="font-sans tabular-nums">
                  {latestVisitEntry
                    ? new Date(latestVisitEntry.timestamp).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : lang === 'en'
                    ? 'Online'
                    : lang === 'zh'
                    ? '在线'
                    : 'Trực tuyến'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          PART 4: CHÂN TRANG BẢO TÀNG & SỐ LIỆU ĐỒNG BỘ
         ==================================================================== */}
      <footer className="hidden md:block border-t border-[#171817]/20 bg-[#EDE4D0] text-[#171817]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10 pb-16 md:pb-14 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="font-serif text-lg font-semibold text-[#171817]">
                  Dấu Ấn Việt 3D
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#C9A46A]/35 border border-[#171817]/20 text-[#171817] text-[11px] font-sans font-semibold tabular-nums">
                  {lang === 'en'
                    ? `${sites.length} digitized monuments`
                    : lang === 'zh'
                    ? `${sites.length} 处数字化遗迹`
                    : `${sites.length} di tích số hóa`}
                </span>
              </div>
              <p className="text-xs text-[#171817]/75 max-w-xl">
                {lang === 'en'
                  ? 'Digital Heritage Museum of Southeastern Vietnam — Spatial 3D Architecture, 1815 Historical Map Lens & Multilingual Narration.'
                  : lang === 'zh'
                  ? '越南东南部数字遗产博物馆 — 3D空间建筑、1815历史地图透镜与多语种语音导览。'
                  : 'Bảo tàng Di sản Số Đông Nam Bộ — Kiến trúc 3D tương tác, Thấu kính Bản đồ 1815 và Thuyết minh đa ngôn ngữ.'}
              </p>
              {(onOpenGateLetter || onOpenMediaCredits) && (
                <div className="pt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {onOpenGateLetter && (
                    <button
                      type="button"
                      onClick={onOpenGateLetter}
                      title={
                        lang === 'en'
                          ? 'Project Welcome Letter'
                          : lang === 'zh'
                          ? '项目开幕寄语'
                          : 'Thư ngỏ dự án'
                      }
                      className="group inline-flex items-center gap-2 text-xs font-medium text-[#171817] hover:text-[#A94F3D] transition-colors cursor-pointer"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#1C1D1B] border border-[#C9A46A]/55 flex items-center justify-center shrink-0 group-hover:border-[#A94F3D] transition-colors">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#C9A46A"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                        >
                          <path d="M8 21h10a2 2 0 0 0 2-2v-1H10v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2h4" />
                          <path d="M18 18V5a2 2 0 0 0-2-2H4" />
                          <path d="M9.5 8h5" />
                          <path d="M9.5 11.5h5" />
                        </svg>
                      </span>
                      <span className="underline decoration-[#C9A46A]/70 underline-offset-4 group-hover:decoration-[#A94F3D]">
                        {lang === 'en'
                          ? 'Read the Welcome Letter from Grade 10 History Class – Le Quy Don High School for the Gifted – Vung Tau'
                          : lang === 'zh'
                          ? '阅读头顿黎贵惇重点高中十年级历史专业班开幕寄语'
                          : 'Đọc Thư ngỏ từ Tập thể Lớp 10 Chuyên Sử – THPT Chuyên Lê Quý Đôn – Vũng Tàu'}
                      </span>
                    </button>
                  )}

                  {onOpenMediaCredits && (
                    <ArchivalSourcesTrigger onClick={onOpenMediaCredits} tone="light" />
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3.5 py-2 rounded-xl bg-[#F4EFE4] border border-[#171817]/15 text-xs flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#A94F3D]" />
                <span className="text-[#171817]/75">
                  {lang === 'en' ? 'Visits:' : lang === 'zh' ? '总访客:' : 'Tổng lượt khách:'}
                </span>
                <strong className="text-[#171817] font-sans font-semibold tabular-nums">
                  {liveAnalytics.totalVisitors.toLocaleString('vi-VN')}
                </strong>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-[#F4EFE4] border border-[#171817]/15 text-xs flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-[#47796D]" />
                <span className="text-[#171817]/75">
                  {lang === 'en' ? '3D & Dossiers:' : lang === 'zh' ? '3D与档案浏览:' : 'Lượt xem 3D & Hồ sơ:'}
                </span>
                <strong className="text-[#171817] font-sans font-semibold tabular-nums">
                  {totalSiteViews.toLocaleString('vi-VN')}
                </strong>
              </div>
            </div>
          </div>

          {visitHistoryLogs.length > 0 && (
            <div className="pt-4 border-t border-[#171817]/15 flex flex-wrap items-center gap-2">
              <span className="text-xs font-sans font-medium text-[#171817]/70 inline-flex items-center gap-1.5 mr-1">
                <Clock className="w-3 h-3 text-[#A94F3D]" />
                <span>
                  {lang === 'en' ? 'Recent:' : lang === 'zh' ? '最近访问:' : 'Vừa tham quan:'}
                </span>
              </span>
              {visitHistoryLogs.slice(0, 3).map((entry) => (
                <span
                  key={entry.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4EFE4] border border-[#171817]/15 text-[11px] text-[#171817]"
                >
                  {entry.deviceType === 'Điện thoại' ? (
                    <Smartphone className="w-3 h-3 text-[#47796D] shrink-0" />
                  ) : (
                    <Monitor className="w-3 h-3 text-[#526D8B] shrink-0" />
                  )}
                  <span className="truncate max-w-[180px]">
                    {entry.siteName || entry.actionLabel}
                  </span>
                  <span className="text-[#171817]/60 font-sans tabular-nums">
                    {new Date(entry.timestamp).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </span>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-[#171817]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#171817]/70">
            <span>
              © 2026 Dấu Ấn Việt 3D ·{' '}
              <span className="font-medium text-[#171817]">Made by Hoang Hai</span>
            </span>
            <div className="flex flex-wrap items-center gap-4 text-[#171817]/80">
              <button
                type="button"
                onClick={() => onNavigateTab('space3d')}
                className="hover:text-[#A94F3D] font-medium transition-colors cursor-pointer"
              >
                {lang === 'en' ? '3D Space' : lang === 'zh' ? '3D 空间' : 'Không gian 3D'}
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('map_routes')}
                className="hover:text-[#A94F3D] font-medium transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Map & Routes' : lang === 'zh' ? '地图与路线' : 'Bản đồ & Tuyến'}
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('catalog')}
                className="hover:text-[#A94F3D] font-medium transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Heritage Dossiers' : lang === 'zh' ? '遗产档案' : 'Hồ sơ Di sản'}
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('edtech')}
                className="hover:text-[#A94F3D] font-medium transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Tickets & EdTech' : lang === 'zh' ? '门票与教材' : 'Vé & Học liệu'}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
});

export default AppleScrollytellingHome;
