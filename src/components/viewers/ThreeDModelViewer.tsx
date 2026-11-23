import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HeritageSite } from '../../types/heritage';
import { HERITAGE_SITES } from '../../data/heritageSites';
import {
  CONFIG_3D_UPDATED_EVENT,
  DEFAULT_HERITAGE_3D_CONFIG,
  getSite3DHotspots,
  getSite3DTransform,
  saveSite3DTransform,
  resetSite3DTransform,
} from '../../data/heritage3DConfig';
import { pushHeritageSitesToFirebase } from '../../utils/firebaseRestSync';
import { getLandmarkFeatures } from '../../data/heritageLandmarkHotspots';
import { VirtualTourGuidePanel, GuideSubMode } from '../startup/VirtualTourGuidePanel';
import { StartupBookingModal } from '../startup/StartupBookingModal';
import { GeminiHeritageAssistant } from '../startup/GeminiHeritageAssistant';
import { useI18n } from '../../i18n/I18nContext';
import { useLabs } from '../../contexts/LabsContext';
import { HeritageTypographicPlate } from '../common/HeritageTypographicPlate';
import { HeritageSmoothImage } from '../common/HeritageSmoothImage';
import { DragScrollRow } from '../common/DragScrollRow';
import { RoyalHistoriographerIcon } from '../common/RoyalHistoriographerIcon';
import { HeritageSiteListPanel } from '../common/HeritageSiteDropdown';
import { LockGlyph } from '../subscription/LockGlyph';
import { SectionGuideButton } from '../guide/InteractiveUserGuideModal';
import {
  openUpgradePrompt,
  useSubscriptionPermissions,
} from '../../utils/subscriptionGatingStore';
import { getSitePhotoCaption } from '../../utils/wikimediaPhotoService';
import { getChateauErasForSite } from '../spatial/MuseumHistoricalWidgets';
import {
  MuseumLightingMode,
  MuseumEnvironmentRefs,
  createMuseumEnvironmentMaps,
  createMuseumSkyDome,
  createStudioBronzeDust,
  createNightStarfield,
  createArchitecturalDioramaPlinth,
  applyMuseumEnvironmentPreset,
} from '../../utils/museumEnvironment3D';
import {
  RotateCw,
  Box,
  Info,
  Eye,
  Volume2,
  ChevronDown,
  ChevronUp,
  Check,
  ShieldCheck,
  Film,
  Upload,
  ArrowLeft,
  Layers,
  X,
  Sun,
  Moon,
  Sunrise,
  Sliders,
  RefreshCw,
} from 'lucide-react';

import {
  CMS_UPDATED_EVENT,
  loadCmsSiteOverrides,
  trackPlatformInteraction,
} from '../../utils/adminPlatformStore';
import { useAuth } from '../../contexts/AuthContext';
import {
  formatGlbFileSize,
  setSessionTempGlb,
  useSiteGlbSource,
} from '../../utils/glbModelStorage';
import {
  useCloudAssetDownloadProgress,
  useCloudAssetError,
} from '../../utils/cloudSync';
import { loadAndNormalizeGlb } from '../../utils/threeGlbLoader';
import { GlbSectionController, GlbViewMode } from '../../utils/glbSectionController';

interface ThreeDModelViewerProps {
  site: HeritageSite;
  sites?: HeritageSite[];
  hiddenSiteIds?: string[];
  onClose?: () => void;
  onSelectSite?: (site: HeritageSite) => void;
  onUpdateCustomPhoto?: (siteId: string, photoDataUrl: string) => void;
  onRestoreDefaultPhoto?: (siteId: string) => void;
  isGettyLanding?: boolean;
  onOpenMapOverlay?: () => void;
  onOpenAudioModal?: (site: HeritageSite) => void;
  onOpenVideoModal?: (site: HeritageSite) => void;
  onOpenDetailModal?: (site: HeritageSite) => void;
  onOpenArchiveDrawer?: () => void;
  onOpenAdminGlbUpload?: (site: HeritageSite) => void;
  isPaused?: boolean;
  defaultLightingMode?: LightingMode;
  initialRenderMode?: RenderMode;
  initialExplodedFactor?: number;
  onNavigateToTickets?: () => void;
  onOpenGuide?: () => void;
}

type RenderMode = 'textured' | 'wireframe' | 'xray';
type LightingMode = MuseumLightingMode;
type ViewTwinMode = '3d_cad_pbr' | 'real_field_360';

export interface ArchitecturalFeature {
  id: string;
  name: string;
  description: string;
  cameraPos: [number, number, number];
  targetPos: [number, number, number];
  thumbnailUrl: string;
}

export interface SpatialSpotlightState {
  position: [number, number, number];
  label?: string;
}

export interface MysteryRayClickEvent {
  hitPoint: [number, number, number];
  meshName: string;
  timestamp: number;
}

export const ThreeDModelViewer: React.FC<ThreeDModelViewerProps> = ({
  site: initialSite,
  sites,
  hiddenSiteIds = [],
  onClose,
  onSelectSite,
  onUpdateCustomPhoto,
  onRestoreDefaultPhoto,
  isGettyLanding = true,
  onOpenAudioModal,
  onOpenVideoModal,
  onOpenDetailModal,
  onOpenAdminGlbUpload,
  isPaused = false,
  defaultLightingMode = 'studio',
  initialRenderMode = 'textured',
  initialExplodedFactor = 0,
  onNavigateToTickets,
  onOpenGuide,
}) => {
  const { lang, getLocalizedSite } = useI18n();
  const { isAdmin, isTesterPro } = useAuth();
  const canPreviewHidden = isAdmin || isTesterPro;
  const { effectiveGoldenHour3D, effectiveWireframeOverlay } = useLabs();
  const [cmsOverrides, setCmsOverrides] = useState(() => loadCmsSiteOverrides());
  const tempGlbInputRef = useRef<HTMLInputElement | null>(null);
  const [tempGlbNotice, setTempGlbNotice] = useState<string | null>(null);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState<boolean>(false);
  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState<boolean>(false);
  const [isMobileDissectOpen, setIsMobileDissectOpen] = useState<boolean>(false);
  const [mobileDissectStyle, setMobileDissectStyle] = useState<'explode' | 'section' | 'wireframe'>('explode');
  const [tierVisibility, setTierVisibility] = useState<[boolean, boolean, boolean, boolean]>([
    true,
    true,
    true,
    true,
  ]);
  const tierVisibilityRef = useRef<[boolean, boolean, boolean, boolean]>(tierVisibility);
  tierVisibilityRef.current = tierVisibility;

  useEffect(() => {
    const onCmsUpdate = () => setCmsOverrides(loadCmsSiteOverrides());
    window.addEventListener(CMS_UPDATED_EVENT, onCmsUpdate);
    return () => window.removeEventListener(CMS_UPDATED_EVENT, onCmsUpdate);
  }, []);

  const [viewTwinMode, setViewTwinMode] = useState<ViewTwinMode>('3d_cad_pbr');
  const [currentSite, setCurrentSite] = useState<HeritageSite>(initialSite);
  const localizedCurrentSite = useMemo(
    () => getLocalizedSite(currentSite),
    [getLocalizedSite, currentSite]
  );
  const isCurrentModelHidden = cmsOverrides[currentSite.id]?.modelVisibility === 'hidden';
  const isCurrentSiteOrModelHidden =
    hiddenSiteIds.includes(currentSite.id) || isCurrentModelHidden;
  const [isTourGuideOpen, setIsTourGuideOpen] = useState<boolean>(false);
  const [guideSubMode, setGuideSubMode] = useState<GuideSubMode>('autotour');
  const [autoStartTourCounter, setAutoStartTourCounter] = useState<number>(0);
  const [isGeminiAssistantOpen, setIsGeminiAssistantOpen] = useState<boolean>(false);
  const [isStartupBookingOpen, setIsStartupBookingOpen] = useState<boolean>(false);
  const [activeStartupRouteId, setActiveStartupRouteId] = useState<string | null>(null);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState<boolean>(true);
  const [isEraMenuOpen, setIsEraMenuOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Mode & Lighting (Default: Studio or Admin Site Settings)
  const [renderMode, setRenderMode] = useState<RenderMode>(initialRenderMode);
  useEffect(() => {
    setRenderMode(initialRenderMode);
  }, [initialRenderMode]);
  const { permissions: sitePermissions } = useSubscriptionPermissions(currentSite.id);
  const [viewMode, setViewMode] = useState<GlbViewMode>(() =>
    initialRenderMode === 'xray'
      ? 'xray'
      : initialExplodedFactor > 0.02
      ? 'explode'
      : 'original'
  );
  const viewModeRef = useRef<GlbViewMode>(viewMode);
  viewModeRef.current = viewMode;
  const [lightingMode, setLightingMode] = useState<LightingMode>(() =>
    effectiveGoldenHour3D ? 'golden' : defaultLightingMode
  );
  const lightingModeRef = useRef<LightingMode>(lightingMode);
  lightingModeRef.current = lightingMode;
  useEffect(() => {
    setLightingMode(effectiveGoldenHour3D ? 'golden' : defaultLightingMode);
  }, [defaultLightingMode, effectiveGoldenHour3D]);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Model Loading State (.GLB only)
  const {
    source: customGlbSource,
    loading: customGlbSourceLoading,
    retryFromCloud: retryGlbFromCloud,
  } = useSiteGlbSource(currentSite.id);
  const cloudModelDownload = useCloudAssetDownloadProgress(currentSite.id, 'models');
  const cloudModelError = useCloudAssetError(currentSite.id, 'models');
  const [customGlbError, setCustomGlbError] = useState<string | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [webglRestartKey, setWebglRestartKey] = useState<number>(0);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [glbLoadedReady, setGlbLoadedReady] = useState<boolean>(false);
  const [glbScale, setGlbScale] = useState<number>(() => getSite3DTransform(currentSite.id).scale);
  const [glbRotationY, setGlbRotationY] = useState<number>(
    () => getSite3DTransform(currentSite.id).rotationY
  );
  const [hotspotRevision, setHotspotRevision] = useState<number>(0);
  const [activeViewerPhotoIdx, setActiveViewerPhotoIdx] = useState<0 | 1>(0);
  const [viewerPhotoFailed, setViewerPhotoFailed] = useState<boolean>(false);

  const activeViewerPhoto =
    currentSite.photos?.[activeViewerPhotoIdx] ??
    (activeViewerPhotoIdx === 0 ? currentSite.photos?.[0] : '') ??
    '';

  useEffect(() => {
    setActiveViewerPhotoIdx(0);
    setViewerPhotoFailed(false);
  }, [currentSite.id]);

  useEffect(() => {
    setViewerPhotoFailed(false);
  }, [activeViewerPhotoIdx, activeViewerPhoto]);

  // Technical Tools
  const [isTechToolsOpen, setIsTechToolsOpen] = useState<boolean>(false);
  const [explodedFactor, setExplodedFactor] = useState<number>(initialExplodedFactor); // 0 to 1
  useEffect(() => {
    setExplodedFactor(initialExplodedFactor);
  }, [initialExplodedFactor]);
  const [sectionCutActive, setSectionCutActive] = useState<boolean>(false);
  const [sectionHeight, setSectionHeight] = useState<number>(12);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'front' | 'top'>('iso');

  // Hotspots & Camera
  const [activeFeature, setActiveFeature] = useState<ArchitecturalFeature | null>(null);
  const [hotspotScreenPos, setHotspotScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // ✨ Apple 3D Scrollytelling (Cuộn Giải Phẫu Không Gian) Mode & 4 Story Stages
  const [isScrollytellingMode, setIsScrollytellingMode] = useState<boolean>(false);
  const [scrollyStageIndex, setScrollyStageIndex] = useState<number>(0); // 0..3
  const lastWheelStepTimeRef = useRef<number>(0);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const glbRootRef = useRef<THREE.Object3D | null>(null);
  const glbScaleRef = useRef<number>(1);
  const glbRotationYRef = useRef<number>(0);
  glbScaleRef.current = glbScale;
  glbRotationYRef.current = glbRotationY;
  const explodedFactorRef = useRef<number>(initialExplodedFactor);
  explodedFactorRef.current = explodedFactor;
  const sectionCutActiveRef = useRef<boolean>(false);
  sectionCutActiveRef.current = sectionCutActive;
  const sectionHeightRef = useRef<number>(12);
  sectionHeightRef.current = sectionHeight;
  const customInteriorCutRatioRef = useRef<number | null>(null);
  const glbSectionControllerRef = useRef<GlbSectionController | null>(null);
  const renderModeRef = useRef<RenderMode>('textured');
  renderModeRef.current = renderMode;
  const explodeTrackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingExplodeRef = useRef<boolean>(false);
  const [isDraggingExplode, setIsDraggingExplode] = useState<boolean>(false);
  const lightsRef = useRef<{
    dirLight: THREE.DirectionalLight;
    backDirLight: THREE.DirectionalLight;
    ambient: THREE.AmbientLight;
    hemiLight: THREE.HemisphereLight;
    nightSpots: THREE.SpotLight[];
  } | null>(null);
  const museumEnvRef = useRef<MuseumEnvironmentRefs | null>(null);
  const activeFeatureRef = useRef<ArchitecturalFeature | null>(null);
  const isThreeJsVisibleRef = useRef<boolean>(false);
  const lastHotspotPosRef = useRef<{ x: number; y: number; visible: boolean }>({ x: -9999, y: -9999, visible: false });

  // Spatial HUD & multi-era states
  const [selectedEraIndex, setSelectedEraIndex] = useState<number>(3);
  const azimuthSpanRef = useRef<HTMLSpanElement | null>(null);
  const lastAzimuthRoundedRef = useRef<number>(-999);
  const isRenderPausedRef = useRef<boolean>(false);
  const ensureAnimateRunningRef = useRef<(() => void) | null>(null);
  const [projectedBadges, setProjectedBadges] = useState<
    Array<{ id: string; x: number; y: number; feat: ArchitecturalFeature }>
  >([]);
  const lastBadgeProjectionTimeRef = useRef<number>(0);
  const featuresRef = useRef<ArchitecturalFeature[]>([]);
  const mouseParallaxRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });
  const isUserDraggingRef = useRef<boolean>(false);
  const cameraFlightRafRef = useRef<number | null>(null);
  const cancelCameraFlight = useCallback(() => {
    if (cameraFlightRafRef.current !== null) {
      cancelAnimationFrame(cameraFlightRafRef.current);
      cameraFlightRafRef.current = null;
    }
  }, []);

  // Spatial Living Docent: 3D Spotlight + Laser Ring + Raycaster Mystery Mode
  const [spatialSpotlight, setSpatialSpotlight] = useState<SpatialSpotlightState | null>(null);
  const spatialSpotlightRef = useRef<SpatialSpotlightState | null>(null);
  spatialSpotlightRef.current = spatialSpotlight;
  const [isMysteryModeActive, setIsMysteryModeActive] = useState<boolean>(false);
  const isMysteryModeActiveRef = useRef<boolean>(false);
  isMysteryModeActiveRef.current = isMysteryModeActive;
  const [mysteryRayClickEvent, setMysteryRayClickEvent] = useState<MysteryRayClickEvent | null>(null);
  const baseLightIntensitiesRef = useRef<{
    ambient: number;
    hemi: number;
    dir: number;
    backDir: number;
  }>({ ambient: 0.62, hemi: 0.78, dir: 1.55, backDir: 1.15 });

  useEffect(() => {
    activeFeatureRef.current = activeFeature;
    lastHotspotPosRef.current = { x: -9999, y: -9999, visible: false };
  }, [activeFeature]);

  useEffect(() => {
    const threeVisible = viewTwinMode === '3d_cad_pbr';
    isThreeJsVisibleRef.current = threeVisible;
    const shouldPause =
      isPaused ||
      !threeVisible ||
      showCreditsModal ||
      isStartupBookingOpen ||
      (typeof document !== 'undefined' && document.visibilityState === 'hidden');
    isRenderPausedRef.current = shouldPause;
    if (!shouldPause) {
      ensureAnimateRunningRef.current?.();
    }
  }, [
    isPaused,
    viewTwinMode,
    showCreditsModal,
    isStartupBookingOpen,
  ]);

  // Landmark Dropdown Menu state & click outside listener (synced between bottom dock & top-left badge)
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState<boolean>(false);
  const [siteDropdownAnchor, setSiteDropdownAnchor] = useState<'bottom' | 'top'>('bottom');
  const siteDropdownRef = useRef<HTMLDivElement>(null);
  const topSiteDropdownRef = useRef<HTMLDivElement>(null);

  const allSites = useMemo(() => (sites && sites.length > 0 ? sites : HERITAGE_SITES), [sites]);
  const currentSiteIndex = useMemo(() => {
    const idx = allSites.findIndex((s) => s.id === currentSite.id);
    return idx >= 0 ? idx : 0;
  }, [allSites, currentSite.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideBottom = siteDropdownRef.current?.contains(target) ?? false;
      const isInsideTop = topSiteDropdownRef.current?.contains(target) ?? false;
      if (!isInsideBottom && !isInsideTop) {
        setIsSiteDropdownOpen(false);
      }
    };
    if (isSiteDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSiteDropdownOpen]);

  // ESC key listener for fullscreen, dropdown, and modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSiteDropdownOpen) setIsSiteDropdownOpen(false);
        else if (showCreditsModal) setShowCreditsModal(false);
        else if (isTechToolsOpen) setIsTechToolsOpen(false);
        else if (isFullscreen) setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isTechToolsOpen, showCreditsModal, isSiteDropdownOpen]);

  // Features list based on landmark — always 6 Getty Teardrop Pin stations (1..6) localized for VI/EN/ZH
  const features: ArchitecturalFeature[] = useMemo(() => {
    const rawBase = getLandmarkFeatures(currentSite.id);
    const locHotspots = localizedCurrentSite.hotspots || [];
    const base = rawBase.map((feat, idx) => {
      const matchedHotspot =
        locHotspots.find((h) => h.id === feat.id) || locHotspots[idx];
      if (matchedHotspot) {
        return {
          ...feat,
          name: matchedHotspot.name,
          description: matchedHotspot.description,
        };
      }
      return feat;
    });
    if (base.length >= 6) return base.slice(0, 6);
    const siteTitle = localizedCurrentSite.officialName;
    const fallbackPresets: Array<{
      suffix: string;
      name: string;
      desc: string;
      cam: [number, number, number];
      target: [number, number, number];
    }> = [
      {
        suffix: 'g1',
        name:
          lang === 'en'
            ? 'Forecourt Plaza & Ceremonial Axis'
            : lang === 'zh'
            ? '前庭广场与礼仪中轴线'
            : 'Quảng Trường & Cảnh Quan Tiền Đường',
        desc:
          lang === 'en'
            ? `Landscaped lawns, flower parterres, and the ceremonial axis leading to the main facade of ${siteTitle}.`
            : lang === 'zh'
            ? `通往 ${siteTitle} 主立面的礼仪轴线、园林草坪与前庭景观空间。`
            : `Không gian cảnh quan thảm cỏ, bồn hoa và trục thần đạo dẫn vào mặt đứng chính của ${siteTitle}.`,
        cam: [20, 11, 28],
        target: [7.5, 1.8, 13.5],
      },
      {
        suffix: 'g2',
        name:
          lang === 'en'
            ? 'Roof Structure & Architectural Crown'
            : lang === 'zh'
            ? '屋顶结构与建筑塔冠'
            : 'Cấu Trúc Mái & Đỉnh Chóp Kiến Trúc',
        desc:
          lang === 'en'
            ? `Classical roof trusses and central crown geometry defining the unmistakable silhouette of ${siteTitle}.`
            : lang === 'zh'
            ? `构成 ${siteTitle} 标志性天际轮廓的传统屋顶桁架与中央穹顶构造。`
            : `Hệ kết cấu mái ngói cổ điển và đỉnh vòm trung tâm tạo nên đường nét kiến trúc đặc trưng của ${siteTitle}.`,
        cam: [-18, 21, 22],
        target: [1.8, 12.2, -2.5],
      },
      {
        suffix: 'g3',
        name:
          lang === 'en'
            ? 'East Wing Veranda & Tropical Louvers'
            : lang === 'zh'
            ? '东翼回廊与热带百叶通风窗'
            : 'Hành Lang Cánh Đông & Hệ Cửa Thông Gió',
        desc:
          lang === 'en'
            ? 'Arched verandas and tropical louvered shutters regulating natural airflow along the eastern flank.'
            : lang === 'zh'
            ? '东侧拱廊与热带百叶窗系统，实现自然的微气候通风与遮阳降温。'
            : 'Dãy hành lang vòm cuốn và hệ cửa lá sách nhiệt đới giúp điều hòa vi khí hậu tự nhiên bên hông Đông công trình.',
        cam: [25, 12, 14],
        target: [12.5, 5.2, 2.5],
      },
      {
        suffix: 'g4',
        name:
          lang === 'en'
            ? 'West Wing Colonnade & Load-Bearing Pillars'
            : lang === 'zh'
            ? '西翼柱廊与承重立柱'
            : 'Hành Lang Cánh Tây & Trụ Cột Chịu Lực',
        desc:
          lang === 'en'
            ? 'Symmetrical load-bearing columns and ornamental moldings along the western wing.'
            : lang === 'zh'
            ? '西翼对称分布的承重立柱与精美线脚装饰，体现当时的营造工艺水准。'
            : 'Hệ cột chịu lực và phào chỉ nghệ thuật đối xứng ở cánh Tây, phản ánh kỹ thuật xây dựng đương thời.',
        cam: [-25, 12, 14],
        target: [-12.5, 5.2, 2.5],
      },
      {
        suffix: 'g5',
        name:
          lang === 'en'
            ? 'Rear Sanctuary & Heritage Grounds'
            : lang === 'zh'
            ? '后殿空间与古树园林'
            : 'Không Gian Hậu Đường & Khuôn Viên Xanh',
        desc:
          lang === 'en'
            ? 'Rear architectural ensemble framed by warm sandstone terraces and century-old heritage trees.'
            : lang === 'zh'
            ? '建筑群后方与暖色砂岩台地及百年古树群落相融的静谧园林空间。'
            : 'Mặt hậu của quần thể kiến trúc gắn liền với nền đồi đá sa thạch ấm và hàng cây cổ thụ bao bọc xung quanh di tích.',
        cam: [-18, 15, -26],
        target: [-8.5, 4.2, -9.5],
      },
      {
        suffix: 'g6',
        name:
          lang === 'en'
            ? 'Foundation Plinth & Preserved Stratum'
            : lang === 'zh'
            ? '基座台明与地层保护结构'
            : 'Tầng Nền & Kết Cấu Địa Tầng Bảo Tồn',
        desc:
          lang === 'en'
            ? `Historic stone foundation plinth, stepped entrance, and preserved load-bearing stratum of ${siteTitle}.`
            : lang === 'zh'
            ? `${siteTitle} 原貌保存的石砌基座、踏步台阶与地下承重地层结构。`
            : `Hệ thống nền móng đá cổ, bậc tam cấp và kết cấu chịu lực bảo tồn nguyên trạng của ${siteTitle}.`,
        cam: [18, 14, -24],
        target: [8.5, 2.8, -8.5],
      },
    ];
    const result = [...base];
    let presetIdx = 0;
    while (result.length < 6 && presetIdx < fallbackPresets.length) {
      const p = fallbackPresets[presetIdx++];
      result.push({
        id: `f_${result.length + 1}_${p.suffix}`,
        name: p.name,
        description: p.desc,
        cameraPos: p.cam,
        targetPos: p.target,
        thumbnailUrl: '',
      });
    }
    return result.slice(0, 6);
  }, [currentSite.id, localizedCurrentSite, lang, hotspotRevision]);

  useEffect(() => {
    featuresRef.current = features;
  }, [features]);

  // Switch landmark handler
  const handleSwitchLandmark = (newSite: HeritageSite) => {
    setCurrentSite(newSite);
    setActiveFeature(null);
    setSpatialSpotlight(null);
    setIsMysteryModeActive(false);
    setMysteryRayClickEvent(null);
    viewModeRef.current = 'original';
    renderModeRef.current = 'textured';
    sectionCutActiveRef.current = false;
    explodedFactorRef.current = 0;
    customInteriorCutRatioRef.current = null;
    tierVisibilityRef.current = [true, true, true, true];
    setTierVisibility([true, true, true, true]);
    setIsMobileDissectOpen(false);
    setMobileDissectStyle('explode');
    setViewMode('original');
    setRenderMode('textured');
    setExplodedFactor(0);
    setSectionCutActive(false);
    setAutoRotate(true);
    if (onSelectSite) onSelectSite(newSite);
  };

  const handlePrevSite = () => {
    const prevIndex = (currentSiteIndex - 1 + allSites.length) % allSites.length;
    handleSwitchLandmark(allSites[prevIndex]);
    setIsSiteDropdownOpen(false);
  };

  const handleNextSite = () => {
    const nextIndex = (currentSiteIndex + 1) % allSites.length;
    handleSwitchLandmark(allSites[nextIndex]);
    setIsSiteDropdownOpen(false);
  };

  const prevInitialSiteIdRef = useRef<string>(initialSite.id);

  useEffect(() => {
    setCurrentSite(initialSite);
    if (prevInitialSiteIdRef.current !== initialSite.id) {
      prevInitialSiteIdRef.current = initialSite.id;
      setActiveFeature(null);
      setSpatialSpotlight(null);
      setIsMysteryModeActive(false);
      setMysteryRayClickEvent(null);
      viewModeRef.current = 'original';
      renderModeRef.current = 'textured';
      sectionCutActiveRef.current = false;
      explodedFactorRef.current = 0;
      customInteriorCutRatioRef.current = null;
      tierVisibilityRef.current = [true, true, true, true];
      setTierVisibility([true, true, true, true]);
      setIsMobileDissectOpen(false);
      setMobileDissectStyle('explode');
      setViewMode('original');
      setRenderMode('textured');
      setExplodedFactor(0);
      setSectionCutActive(false);
      setAutoRotate(true);
    }
  }, [initialSite]);

  // Helper to recalculate renderer & camera dimensions and force render
  const updateThreeDimensions = useCallback(() => {
    if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
    const container = containerRef.current;
    const w = container.clientWidth || container.parentElement?.clientWidth || window.innerWidth;
    const h = container.clientHeight || container.parentElement?.clientHeight || window.innerHeight;
    if (w > 0 && h > 0) {
      rendererRef.current.setSize(w, h, true);
      cameraRef.current.aspect = w / h;
      cameraRef.current.clearViewOffset();
      cameraRef.current.updateProjectionMatrix();
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  }, []);

  // Helper to reset Three.js camera view and immediately recalculate renderer & camera dimensions
  const switchToThreeJs = useCallback((targetRenderMode?: RenderMode) => {
    if (targetRenderMode) {
      setRenderMode(targetRenderMode);
    }
    // Ensure initial view faces the grand Main Front Facade (+Z)
    if (cameraRef.current && controlsRef.current) {
      if (currentSite.id === 'HCM-DT-005') {
        cameraRef.current.position.set(20, 16, 40);
        controlsRef.current.target.set(0, 10, 4);
      } else if (currentSite.id === 'HCM-DT-002') {
        cameraRef.current.position.set(0, 13, 35);
        controlsRef.current.target.set(0, 6, 0);
      } else if (currentSite.id === 'HCM-DT-006') {
        cameraRef.current.position.set(0, 11, 34);
        controlsRef.current.target.set(0, 5, 0);
      } else if (currentSite.id === 'HCM-DT-009' || currentSite.id === 'BRVT-DT-003' || currentSite.id === 'BD-DT-002') {
        cameraRef.current.position.set(22, 16, 26);
        controlsRef.current.target.set(0, 2, 0);
      } else if (currentSite.id === 'HCM-DT-010') {
        cameraRef.current.position.set(20, 14, 24);
        controlsRef.current.target.set(0, 0.8, 1.5);
      } else if (currentSite.id === 'BRVT-DT-001') {
        cameraRef.current.position.set(22, 16, 28);
        controlsRef.current.target.set(0, 6.5, -1.5);
      } else {
        const cfg = DEFAULT_HERITAGE_3D_CONFIG[currentSite.id];
        if (cfg) {
          cameraRef.current.position.set(...cfg.cameraPos);
          controlsRef.current.target.set(...cfg.cameraTarget);
        } else {
          cameraRef.current.position.set(24, 18, 28);
          controlsRef.current.target.set(0, 4.5, 0);
        }
      }
      controlsRef.current.update();
    }
    // Update immediately and schedule follow-ups across ticks to guarantee canvas is sized correctly
    updateThreeDimensions();
    requestAnimationFrame(updateThreeDimensions);
    const t1 = setTimeout(updateThreeDimensions, 30);
    const t2 = setTimeout(updateThreeDimensions, 100);
    const t3 = setTimeout(updateThreeDimensions, 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [updateThreeDimensions, currentSite.id]);

  // Ensure Three.js resize is executed whenever 3D view is active
  useEffect(() => {
    if (viewTwinMode === '3d_cad_pbr') {
      updateThreeDimensions();
      const rId = requestAnimationFrame(updateThreeDimensions);
      const t1 = setTimeout(updateThreeDimensions, 50);
      const t2 = setTimeout(updateThreeDimensions, 200);
      return () => {
        cancelAnimationFrame(rId);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [viewTwinMode, updateThreeDimensions]);

  // =========================================================================
  // MAIN THREE.JS SETUP & ORBITCONTROLS LIFECYCLE
  // =========================================================================
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || containerRef.current.parentElement?.clientWidth || window.innerWidth || 800;
    const height = containerRef.current.clientHeight || containerRef.current.parentElement?.clientHeight || window.innerHeight || 600;

    setIsLoadingModel(true);
    setLoadingProgress(25);

    // 1. Scene setup — Seamless Infinite Sky Dome + Horizon FogExp2
    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.FogExp2(0x181715, 0.0024);
    sceneRef.current = scene;

    const { mesh: skyDomeMesh, uniforms: skyUniforms } = createMuseumSkyDome();
    scene.add(skyDomeMesh);

    const studioDust = createStudioBronzeDust(120);
    scene.add(studioDust);

    const nightStars = createNightStarfield(240);
    scene.add(nightStars);

    // 2. Camera setup — Isometric / Aerial Bird's-eye Diorama View
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    const defaultCamCfg = DEFAULT_HERITAGE_3D_CONFIG[currentSite.id];
    if (defaultCamCfg) {
      camera.position.set(...defaultCamCfg.cameraPos);
      camera.lookAt(...defaultCamCfg.cameraTarget);
    } else {
      camera.position.set(26, 21, 35);
      camera.lookAt(0, 4.5, 0);
    }
    cameraRef.current = camera;

    // 3. Renderer setup with adaptive pixel ratio (capped at 1.5, or 1.25 on slow network)
    const isSlowConnection =
      typeof navigator !== 'undefined' &&
      (('connection' in navigator && (navigator as any).connection?.saveData) ||
        ['slow-2g', '2g', '3g'].includes((navigator as any).connection?.effectiveType));

    const targetPixelRatio = isSlowConnection
      ? Math.min(window.devicePixelRatio || 1, 1.25)
      : Math.min(window.devicePixelRatio || 1, 1.5);

    setWebglError(null);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: true,
          powerPreference: 'default',
        });
      } catch {
        setWebglError(
          'Trình duyệt hoặc card đồ họa hiện tại chưa khởi tạo được ngữ cảnh đồ họa 3D (WebGL).'
        );
        setIsLoadingModel(false);
        return;
      }
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(targetPixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    // 4-Mode Synchronized PBR Environment Reflections via PMREMGenerator
    const envMaps = createMuseumEnvironmentMaps(renderer);
    scene.environment = envMaps[lightingModeRef.current].texture;

    // Attach to DOM
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Apply strict viewport constraints: no touch scroll, contain overscroll, grab cursor
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.overscrollBehavior = 'contain';
    renderer.domElement.style.userSelect = 'none';
    renderer.domElement.style.cursor = 'grab';

    // Intercept wheel on canvas directly with non-passive listener to zoom model without scrolling page
    const handleDomWheel = (e: WheelEvent) => {
      cancelCameraFlight();
      if (e.cancelable) e.preventDefault();
    };
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(
        'Ngữ cảnh đồ họa 3D (WebGL) tạm thời bị gián đoạn do bộ nhớ GPU.'
      );
    };
    const handleContextRestored = () => {
      setWebglError(null);
    };
    renderer.domElement.addEventListener('wheel', handleDomWheel, { passive: false });
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // 4. OrbitControls with angle limits, smooth damping & two-finger gestures
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.03; // Cannot flip upside down or look from under floor
    controls.minPolarAngle = 0.08; // Cannot flip over top zenith
    controls.minDistance = 6;
    controls.maxDistance = 140;
    const defaultTargetCfg = DEFAULT_HERITAGE_3D_CONFIG[currentSite.id];
    if (defaultTargetCfg) {
      controls.target.set(...defaultTargetCfg.cameraTarget);
    } else {
      controls.target.set(0, 5, 0);
    }
    controls.update();
    controls.saveState();

    // Multi-touch gestures: single-finger rotate, two-finger pinch-zoom & pan
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    controls.addEventListener('start', () => {
      cancelCameraFlight();
      isUserDraggingRef.current = true;
      controls.autoRotate = false;
      setAutoRotate(false);
      renderer.domElement.style.cursor = 'grabbing';
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    });
    controls.addEventListener('end', () => {
      isUserDraggingRef.current = false;
      renderer.domElement.style.cursor = 'grab';
      if (containerRef.current) containerRef.current.style.cursor = 'grab';
    });

    // Lock smooth automatic 3D rotation ON by default across all machines (independent of localStorage / OS reduced-motion)
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.42;
    setAutoRotate(true);
    controlsRef.current = controls;

    // 5. Museum Exhibition 3-Point Lighting + 4 Architectural Night Uplights
    const isDeepTunnel =
      currentSite.id === 'HCM-DT-009' ||
      currentSite.id === 'BRVT-DT-003' ||
      currentSite.id === 'BD-DT-002';
    const stageBaseY = isDeepTunnel ? -6.05 : currentSite.id === 'HCM-DT-010' ? -2.85 : 0;

    const ambient = new THREE.AmbientLight(0xf5ead8, 0.62);
    scene.add(ambient);

    const hemiLight = new THREE.HemisphereLight(0xd8c7a8, 0x1c1a17, 0.78);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff6ea, 1.55);
    dirLight.position.set(32, 38, 32);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.radius = 2.2;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.045;
    dirLight.shadow.camera.near = 1.0;
    dirLight.shadow.camera.far = 135;
    const shadowD = 36;
    dirLight.shadow.camera.left = -shadowD;
    dirLight.shadow.camera.right = shadowD;
    dirLight.shadow.camera.top = shadowD;
    dirLight.shadow.camera.bottom = -shadowD;
    scene.add(dirLight);

    // Champagne Gold Rim Light highlighting roofs & architectural contours
    const backDirLight = new THREE.DirectionalLight(0xe5c787, 1.15);
    backDirLight.position.set(-26, 26, -38);
    scene.add(backDirLight);

    // Subtle Grazing Architectural Rim Light
    const studioRimLight = new THREE.DirectionalLight(0xd8e2ef, 0.45);
    studioRimLight.position.set(-34, 16, 18);
    scene.add(studioRimLight);

    // 4 Warm Architectural Uplights (#FFCF75) from base perimeter for Đêm Di Sản mode
    const nightSpots: THREE.SpotLight[] = [];
    const uplightCoords: [number, number][] = [
      [16, 16],
      [-16, 16],
      [16, -16],
      [-16, -16],
    ];
    uplightCoords.forEach(([ux, uz]) => {
      const spot = new THREE.SpotLight(0xffcf75, 0, 52, Math.PI / 3.4, 0.65, 1.15);
      spot.position.set(ux, stageBaseY + 0.85, uz);
      spot.target.position.set(0, stageBaseY + 7.5, 0);
      scene.add(spot);
      scene.add(spot.target);
      nightSpots.push(spot);
    });

    lightsRef.current = { dirLight, backDirLight, ambient, hemiLight, nightSpots };

    // 6. Multi-Tier Architectural Diorama Plinth with Brushed Bronze Rim (#C5A059) & B-Đ-N-T Compass Rose
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const plinth = createArchitecturalDioramaPlinth(
      stageBaseY,
      maxAniso,
      false
    );
    const dioramaTerrainGroup = plinth.group;
    scene.add(dioramaTerrainGroup);

    const envRefs: MuseumEnvironmentRefs = {
      skyUniforms,
      studioDust,
      nightStars,
      plinth,
      dirLight,
      backDirLight,
      studioRimLight,
      ambient,
      hemiLight,
      nightSpots,
      envMaps,
    };
    museumEnvRef.current = envRefs;
    applyMuseumEnvironmentPreset(lightingModeRef.current, scene, envRefs);
    baseLightIntensitiesRef.current = {
      ambient: ambient.intensity,
      hemi: hemiLight.intensity,
      dir: dirLight.intensity,
      backDir: backDirLight.intensity,
    };

    // 6B. Spatial Docent Gold Spotlight + Laser Ring Rig (for AI guided focus)
    const spatialSpotLight = new THREE.SpotLight(0xffe1a8, 0, 85, Math.PI / 7.5, 0.55, 1.0);
    const spatialSpotTarget = new THREE.Object3D();
    scene.add(spatialSpotLight);
    scene.add(spatialSpotTarget);
    spatialSpotLight.target = spatialSpotTarget;

    const spatialRigGroup = new THREE.Group();
    spatialRigGroup.visible = false;
    spatialRigGroup.renderOrder = 22;

    const haloOuterMat = new THREE.MeshBasicMaterial({
      color: 0xc5a059,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const haloOuterRing = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.32, 48), haloOuterMat);
    haloOuterRing.rotation.x = -Math.PI / 2;
    spatialRigGroup.add(haloOuterRing);

    const haloTiltRing = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.18, 48),
      haloOuterMat.clone()
    );
    spatialRigGroup.add(haloTiltRing);

    const haloInnerMat = new THREE.MeshBasicMaterial({
      color: 0xfff0cc,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const haloInnerRing = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.48, 32), haloInnerMat);
    haloInnerRing.rotation.x = -Math.PI / 2;
    spatialRigGroup.add(haloInnerRing);

    const laserBeamMat = new THREE.MeshBasicMaterial({
      color: 0xc5a059,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const laserBeamMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.44, 13.5, 18, 1, true),
      laserBeamMat
    );
    laserBeamMesh.position.y = 6.75;
    spatialRigGroup.add(laserBeamMesh);
    scene.add(spatialRigGroup);

    // Transient 3D click ripple ring for Mystery Mode raycaster feedback
    const mysteryPingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const mysteryPingMesh = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.56, 32), mysteryPingMat);
    mysteryPingMesh.visible = false;
    mysteryPingMesh.renderOrder = 25;
    scene.add(mysteryPingMesh);
    let mysteryPingTimer = 0;

    // 6C. Raycaster click handler for "Thử thách Giải mã Kiến trúc"
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const localHitVec = new THREE.Vector3();
    let pointerDownX = 0;
    let pointerDownY = 0;

    const handleCanvasPointerDown = (ev: PointerEvent) => {
      cancelCameraFlight();
      pointerDownX = ev.clientX;
      pointerDownY = ev.clientY;
    };

    const handleCanvasPointerUp = (ev: PointerEvent) => {
      if (!isMysteryModeActiveRef.current || !meshGroupRef.current) return;
      if (Math.hypot(ev.clientX - pointerDownX, ev.clientY - pointerDownY) > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(meshGroupRef.current.children, true);

      const validHit = hits.find((h) => {
        let obj: THREE.Object3D | null = h.object;
        if (
          obj.userData?.isGround ||
          obj.userData?.isGrid ||
          obj.userData?.isLabsWireframeOverlay
        )
          return false;
        while (obj) {
          if (!obj.visible) return false;
          obj = obj.parent;
        }
        return true;
      });

      if (!validHit) return;

      // Show brief 3D ping ring right where user clicked
      mysteryPingMesh.position.copy(validHit.point);
      mysteryPingMesh.lookAt(camera.position);
      mysteryPingMesh.scale.setScalar(1);
      mysteryPingMesh.visible = true;
      mysteryPingTimer = 1.0;

      // Convert hit point to local model coordinates
      localHitVec.copy(validHit.point);
      meshGroupRef.current.worldToLocal(localHitVec);

      setMysteryRayClickEvent({
        hitPoint: [localHitVec.x, localHitVec.y, localHitVec.z],
        meshName: validHit.object.name || 'architectural-element',
        timestamp: Date.now(),
      });
    };

    renderer.domElement.addEventListener('pointerdown', handleCanvasPointerDown);
    renderer.domElement.addEventListener('pointerup', handleCanvasPointerUp);

    // 7. Architectural Model Construction Group (.GLB only — clean plinth stage)
    const mainGroup = new THREE.Group();
    mainGroupRef.current = mainGroup;
    scene.add(mainGroup);

    const meshGroup = new THREE.Group();
    meshGroupRef.current = meshGroup;
    mainGroup.add(meshGroup);

    // 8. Load authentic .GLB model via GLTFLoader (no procedural geometry fallbacks)
    let glbMixer: THREE.AnimationMixer | null = null;
    let isDisposed = false;

    const allowCustomGlbLoad = Boolean(
      customGlbSource.url &&
        (!isCurrentModelHidden || canPreviewHidden || customGlbSource.kind === 'session_temp')
    );

    glbSectionControllerRef.current?.dispose();
    glbSectionControllerRef.current = null;
    glbRootRef.current = null;
    customInteriorCutRatioRef.current = null;
    setGlbLoadedReady(false);

    if (allowCustomGlbLoad && customGlbSource.url) {
      setCustomGlbError(null);
      setIsLoadingModel(true);
      setLoadingProgress(18);

      void loadAndNormalizeGlb(customGlbSource.url, {
        targetMaxDim: 26,
        groundY: stageBaseY,
        maxAnisotropy: maxAniso,
        onProgress: (pct) => {
          if (!isDisposed) {
            setLoadingProgress(Math.max(18, Math.min(98, Math.round(pct))));
          }
        },
      })
        .then((res) => {
          if (isDisposed) return;
          glbRootRef.current = res.root;
          res.root.scale.setScalar(glbScaleRef.current);
          res.root.rotation.y = (glbRotationYRef.current * Math.PI) / 180;
          meshGroup.add(res.root);
          glbSectionControllerRef.current?.dispose();
          glbSectionControllerRef.current = new GlbSectionController(res.root, meshGroup, {
            minExplodeWhenActive: 0,
          });
          glbSectionControllerRef.current.syncTransform(
            glbScaleRef.current,
            glbRotationYRef.current
          );
          if (res.animations.length > 0) {
            glbMixer = new THREE.AnimationMixer(res.root);
            res.animations.forEach((clip) => glbMixer?.clipAction(clip).play());
          }
          const targetY = Math.max(stageBaseY + 3.5, res.center.y);
          controls.target.set(0, targetY, 0);
          controls.update();
          controls.saveState();
          renderer.shadowMap.needsUpdate = true;
          setGlbLoadedReady(true);
          setLoadingProgress(100);
          setIsLoadingModel(false);
        })
        .catch((err) => {
          if (isDisposed) return;
          glbRootRef.current = null;
          setGlbLoadedReady(false);
          setCustomGlbError(
            err instanceof Error ? err.message : 'Không thể tải tệp .glb tùy chỉnh'
          );
          renderer.shadowMap.needsUpdate = true;
          setLoadingProgress(100);
          setIsLoadingModel(false);
        });
    } else {
      glbRootRef.current = null;
      setGlbLoadedReady(false);
      setCustomGlbError(null);
      renderer.shadowMap.needsUpdate = true;
      setLoadingProgress(100);
      setIsLoadingModel(false);
    }

    // 9. Smart Render Pause & Visibility handling (stops rAF loop completely when hidden/paused)
    let animId = 0;
    const timer = new THREE.Timer();
    const tempProjVec = new THREE.Vector3();

    const checkShouldPause = () =>
      isDisposed ||
      document.visibilityState === 'hidden' ||
      !isThreeJsVisibleRef.current ||
      isRenderPausedRef.current;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ensureAnimateRunning();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = () => {
      if (checkShouldPause()) {
        animId = 0;
        return;
      }

      animId = requestAnimationFrame(animate);

      timer.update();
      const elapsedTime = timer.getElapsed();
      const delta = Math.min(timer.getDelta(), 0.05);

      if (glbMixer) {
        glbMixer.update(delta);
      }

      // Keep OrbitControls permanently active across Original / Explode / X-Ray / Interior
      controls.enabled = true;
      controls.enableRotate = true;
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.update();

      // Smooth .glb 4-tier local clipping explode + X-Ray + 35%-roof-cut interior
      if (glbSectionControllerRef.current) {
        try {
          const didAnimateGlb = glbSectionControllerRef.current.updateFrame(
            viewModeRef.current,
            explodedFactorRef.current,
            delta,
            {
              isBlueprintWireframe: renderModeRef.current === 'wireframe',
              customInteriorCutRatio: customInteriorCutRatioRef.current,
              tierVisibility: tierVisibilityRef.current,
            }
          );
          if (didAnimateGlb) {
            renderer.shadowMap.needsUpdate = true;
          }
        } catch (glbUpdateErr) {
          console.error('[3D Viewer] Lỗi cập nhật chế độ .glb:', glbUpdateErr);
        }
      }

      // Dynamically project active 3D hotspot to screen coordinates (throttled to avoid 60fps React re-renders)
      if (activeFeatureRef.current && containerRef.current) {
        const feat = activeFeatureRef.current;
        tempProjVec.set(feat.targetPos[0], feat.targetPos[1], feat.targetPos[2]);
        tempProjVec.project(camera);
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        const sx = (tempProjVec.x * 0.5 + 0.5) * w;
        const sy = (-(tempProjVec.y * 0.5) + 0.5) * h;
        const isVis = tempProjVec.z < 1;
        const last = lastHotspotPosRef.current;
        if (isVis) {
          if (!last.visible || Math.abs(sx - last.x) > 0.75 || Math.abs(sy - last.y) > 0.75) {
            lastHotspotPosRef.current = { x: sx, y: sy, visible: true };
            setHotspotScreenPos({ x: sx, y: sy });
          }
        } else if (last.visible) {
          lastHotspotPosRef.current = { x: -9999, y: -9999, visible: false };
          setHotspotScreenPos(null);
        }
      }

      // Sync 3D Spatial Compass Azimuth directly to DOM (0 React re-renders) & Interactive [+] Badges (~10fps)
      const nowPerf = performance.now();
      if (nowPerf - lastBadgeProjectionTimeRef.current > 95 && containerRef.current) {
        lastBadgeProjectionTimeRef.current = nowPerf;
        const azRad = controls.getAzimuthalAngle();
        const azDeg = (azRad * 180) / Math.PI;
        const roundedAz = Math.round(((azDeg % 360) + 360) % 360);
        if (roundedAz !== lastAzimuthRoundedRef.current) {
          lastAzimuthRoundedRef.current = roundedAz;
          if (azimuthSpanRef.current) {
            azimuthSpanRef.current.textContent = `${roundedAz}°`;
          }
        }

        const cW = containerRef.current.clientWidth;
        const cH = containerRef.current.clientHeight;
        if (cW > 0 && cH > 0 && featuresRef.current.length > 0) {
          const nextBadges: Array<{ id: string; x: number; y: number; feat: ArchitecturalFeature }> = [];
          for (let i = 0; i < featuresRef.current.length; i++) {
            const fItem = featuresRef.current[i];
            tempProjVec.set(fItem.targetPos[0], fItem.targetPos[1], fItem.targetPos[2]);
            tempProjVec.project(camera);
            if (tempProjVec.z < 1) {
              const bx = (tempProjVec.x * 0.5 + 0.5) * cW;
              const by = (-(tempProjVec.y * 0.5) + 0.5) * cH;
              if (bx >= 40 && bx <= cW - 40 && by >= 60 && by <= cH - 80) {
                nextBadges.push({ id: fItem.id, x: bx, y: by, feat: fItem });
              }
            }
          }

          // Screen-space anti-overlap relaxation pass so no two teardrop pins (1..6) ever overlap
          const minPinDist = 54;
          for (let iter = 0; iter < 4; iter++) {
            for (let a = 0; a < nextBadges.length; a++) {
              for (let b = a + 1; b < nextBadges.length; b++) {
                const dx = nextBadges[b].x - nextBadges[a].x;
                const dy = nextBadges[b].y - nextBadges[a].y;
                const dist = Math.hypot(dx, dy);
                if (dist < minPinDist) {
                  const angle = dist > 0.01 ? Math.atan2(dy, dx) : (b - a) * 1.1;
                  const push = (minPinDist - dist) * 0.52;
                  const ox = Math.cos(angle) * push;
                  const oy = Math.sin(angle) * push;
                  nextBadges[a].x = Math.max(48, Math.min(cW - 48, nextBadges[a].x - ox));
                  nextBadges[a].y = Math.max(70, Math.min(cH - 88, nextBadges[a].y - oy));
                  nextBadges[b].x = Math.max(48, Math.min(cW - 48, nextBadges[b].x + ox));
                  nextBadges[b].y = Math.max(70, Math.min(cH - 88, nextBadges[b].y + oy));
                }
              }
            }
          }

          setProjectedBadges(nextBadges);
        }
      }

      // Gently drift 120 atmospheric light dust motes & twinkle night starfield (O(1) — locked 60FPS)
      if (museumEnvRef.current) {
        if (museumEnvRef.current.studioDust.visible) {
          museumEnvRef.current.studioDust.rotation.y = elapsedTime * 0.022;
          museumEnvRef.current.studioDust.position.y = Math.sin(elapsedTime * 0.42) * 0.42;
        }
        if (museumEnvRef.current.nightStars.visible) {
          museumEnvRef.current.nightStars.rotation.y = elapsedTime * 0.004;
          const starMat = museumEnvRef.current.nightStars.material as THREE.PointsMaterial;
          starMat.opacity = 0.74 + 0.14 * Math.sin(elapsedTime * 1.35);
        }
      }

      // Smoothly dim surrounding studio lights & animate Spatial Gold Spotlight + Laser Ring
      const targetSpotPos = spatialSpotlightRef.current?.position;
      const targetFocusGoal = targetSpotPos ? 1 : 0;
      const currentFocus = (spatialRigGroup.userData.focusMix as number | undefined) ?? 0;
      const nextFocus = THREE.MathUtils.damp(currentFocus, targetFocusGoal, 7.5, delta || 0.016);
      spatialRigGroup.userData.focusMix = nextFocus;

      const baseLights = baseLightIntensitiesRef.current;
      ambient.intensity = baseLights.ambient * (1 - nextFocus * 0.56);
      hemiLight.intensity = baseLights.hemi * (1 - nextFocus * 0.56);
      dirLight.intensity = baseLights.dir * (1 - nextFocus * 0.48);
      backDirLight.intensity = baseLights.backDir * (1 - nextFocus * 0.35);

      if (targetSpotPos && nextFocus > 0.01) {
        spatialRigGroup.visible = true;
        const goalVec = tempProjVec.set(targetSpotPos[0], targetSpotPos[1], targetSpotPos[2]);
        if (!spatialRigGroup.userData.hasPositioned) {
          spatialRigGroup.position.copy(goalVec);
          spatialRigGroup.userData.hasPositioned = true;
        } else {
          spatialRigGroup.position.lerp(goalVec, Math.min(1, (delta || 0.016) * 8.5));
        }

        const rx = spatialRigGroup.position.x;
        const ry = spatialRigGroup.position.y;
        const rz = spatialRigGroup.position.z;
        spatialSpotTarget.position.set(rx, ry, rz);
        spatialSpotLight.position.set(rx + 5.5, ry + 16, rz + 7.5);
        spatialSpotLight.intensity = 24 * nextFocus;

        const pulseScale = 1 + 0.18 * Math.sin(elapsedTime * 4.5);
        const pulseAlpha = 0.72 + 0.28 * Math.sin(elapsedTime * 4.5);
        haloOuterRing.scale.setScalar(pulseScale);
        haloOuterRing.rotation.z = elapsedTime * 0.85;
        haloOuterMat.opacity = 0.88 * nextFocus * pulseAlpha;

        haloTiltRing.lookAt(camera.position);
        haloTiltRing.scale.setScalar(0.95 + 0.14 * Math.cos(elapsedTime * 4.5));
        (haloTiltRing.material as THREE.MeshBasicMaterial).opacity = 0.65 * nextFocus * pulseAlpha;

        haloInnerRing.scale.setScalar(1 + 0.08 * Math.cos(elapsedTime * 6));
        haloInnerMat.opacity = 0.95 * nextFocus;

        laserBeamMat.opacity = 0.24 * nextFocus * (0.85 + 0.15 * Math.sin(elapsedTime * 5));
      } else {
        spatialSpotLight.intensity = 0;
        if (nextFocus <= 0.01) {
          spatialRigGroup.visible = false;
          spatialRigGroup.userData.hasPositioned = false;
        }
      }

      if (mysteryPingTimer > 0) {
        mysteryPingTimer = Math.max(0, mysteryPingTimer - (delta || 0.016) * 1.85);
        mysteryPingMesh.lookAt(camera.position);
        mysteryPingMesh.scale.setScalar(1 + (1 - mysteryPingTimer) * 2.4);
        mysteryPingMat.opacity = mysteryPingTimer * 0.9;
        if (mysteryPingTimer <= 0.01) {
          mysteryPingMesh.visible = false;
        }
      }

      // Smooth Camera Parallax on mouse move (Getty Persepolis subtle spatial tilt)
      const mp = mouseParallaxRef.current;
      mp.x += (mp.targetX - mp.x) * 0.06;
      mp.y += (mp.targetY - mp.y) * 0.06;
      if (!isUserDraggingRef.current && mainGroupRef.current) {
        mainGroupRef.current.rotation.y = mp.x * 0.055;
        mainGroupRef.current.rotation.x = mp.y * 0.025;
      }

      renderer.render(scene, camera);
    };

    const ensureAnimateRunning = () => {
      if (animId === 0 && !checkShouldPause()) {
        timer.update();
        animId = requestAnimationFrame(animate);
      }
    };
    ensureAnimateRunningRef.current = ensureAnimateRunning;
    ensureAnimateRunning();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.clearViewOffset();
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, true);
        controls.update();
      }
    };

    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // 10. Strict Resource Cleanup & Deep WebGL Disposal
    return () => {
      isDisposed = true;
      cancelCameraFlight();
      ensureAnimateRunningRef.current = null;
      if (animId !== 0) {
        cancelAnimationFrame(animId);
        animId = 0;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('wheel', handleDomWheel);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      renderer.domElement.removeEventListener('pointerdown', handleCanvasPointerDown);
      renderer.domElement.removeEventListener('pointerup', handleCanvasPointerUp);

      controls.dispose();

      glbSectionControllerRef.current?.dispose();
      glbSectionControllerRef.current = null;
      glbRootRef.current = null;

      // Deep hierarchy disposal (Geometries, Materials & non-cached Procedural Textures)
      scene.traverse((child) => {
        if (
          child instanceof THREE.Mesh ||
          child instanceof THREE.Points ||
          child instanceof THREE.Line ||
          child instanceof THREE.LineSegments ||
          child instanceof THREE.LineLoop ||
          child instanceof THREE.Sprite
        ) {
          (child as THREE.Mesh).geometry?.dispose();
          const disposeMat = (m: THREE.Material) => {
            const anyMat = m as unknown as Record<string, unknown>;
            ['map', 'bumpMap', 'roughnessMap', 'normalMap', 'aoMap', 'emissiveMap', 'metalnessMap', 'alphaMap'].forEach((k) => {
              const tex = anyMat[k] as THREE.Texture | undefined;
              if (tex && typeof tex.dispose === 'function' && !tex.userData?.isCached) {
                tex.dispose();
              }
            });
            m.dispose();
          };
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) {
            mat.forEach(disposeMat);
          } else if (mat) {
            disposeMat(mat);
          }
        }
      });

      if (dirLight.shadow.map) {
        dirLight.shadow.map.dispose();
      }
      scene.clear();
      museumEnvRef.current = null;
      envMaps.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [
    currentSite.id,
    customGlbSource.url,
    customGlbSource.kind,
    customGlbSource.updatedAt,
    isCurrentModelHidden,
    canPreviewHidden,
    webglRestartKey,
  ]);

  // Sync autoRotate state to controls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotateSpeed = 0.35;
      controlsRef.current.autoRotate = autoRotate;
    }
    if (autoRotate) {
      ensureAnimateRunningRef.current?.();
    }
  }, [autoRotate]);

  // Load saved .glb transform sliders when switching site or when Firebase/local 3D config updates
  useEffect(() => {
    const syncTransformAndHotspots = () => {
      const savedTransform = getSite3DTransform(currentSite.id);
      setGlbScale(savedTransform.scale);
      setGlbRotationY(savedTransform.rotationY);
      setHotspotRevision((v) => v + 1);
    };
    syncTransformAndHotspots();
    setIsMobileControlsOpen(false);
    window.addEventListener(CONFIG_3D_UPDATED_EVENT, syncTransformAndHotspots);
    return () => {
      window.removeEventListener(CONFIG_3D_UPDATED_EVENT, syncTransformAndHotspots);
    };
  }, [currentSite.id]);

  // Live sync Scale & Rotation Y onto loaded .glb model & 4-tier clipping rig
  useEffect(() => {
    const root = glbRootRef.current;
    if (!root) return;
    if (glbSectionControllerRef.current) {
      glbSectionControllerRef.current.syncTransform(glbScale, glbRotationY);
    } else {
      root.scale.setScalar(glbScale);
      root.rotation.y = (glbRotationY * Math.PI) / 180;
    }
    if (rendererRef.current) {
      rendererRef.current.shadowMap.needsUpdate = true;
    }
  }, [glbScale, glbRotationY, glbLoadedReady]);

  // Lighting & Museum Environment Mode Controller (mutates uniforms, fog & lights in-place at 60FPS)
  useEffect(() => {
    lightingModeRef.current = lightingMode;
    if (!sceneRef.current || !museumEnvRef.current) return;
    applyMuseumEnvironmentPreset(lightingMode, sceneRef.current, museumEnvRef.current);
    baseLightIntensitiesRef.current = {
      ambient: museumEnvRef.current.ambient.intensity,
      hemi: museumEnvRef.current.hemiLight.intensity,
      dir: museumEnvRef.current.dirLight.intensity,
      backDir: museumEnvRef.current.backDirLight.intensity,
    };
    if (rendererRef.current) {
      rendererRef.current.shadowMap.needsUpdate = true;
    }
  }, [lightingMode]);

  // Sync cursor crosshair cue during Raycaster Mystery Mode
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.domElement.style.cursor = isMysteryModeActive ? 'crosshair' : 'grab';
  }, [isMysteryModeActive]);

  // Sync rAF render mode for loaded .glb controller
  useEffect(() => {
    if (glbSectionControllerRef.current) {
      ensureAnimateRunningRef.current?.();
      if (rendererRef.current) {
        rendererRef.current.shadowMap.needsUpdate = true;
      }
    }
  }, [renderMode]);

  // Keep local clipping disabled on global renderer so the studio ground/plinth never clips
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.clippingPlanes = [];
    if (glbSectionControllerRef.current) {
      ensureAnimateRunningRef.current?.();
    }
    rendererRef.current.shadowMap.needsUpdate = true;
  }, [sectionCutActive, sectionHeight, glbLoadedReady]);

  // Keep viewMode + viewModeRef + explodedFactorRef always synchronized for rAF loop
  useEffect(() => {
    explodedFactorRef.current = explodedFactor;
    const derivedMode: GlbViewMode =
      renderMode === 'xray'
        ? 'xray'
        : sectionCutActive
        ? 'interior'
        : explodedFactor > 0.005
        ? 'explode'
        : 'original';
    viewModeRef.current = derivedMode;
    setViewMode(derivedMode);
    ensureAnimateRunningRef.current?.();
    if (rendererRef.current) {
      rendererRef.current.shadowMap.needsUpdate = true;
    }
  }, [renderMode, sectionCutActive, explodedFactor]);

  // Dấu Ấn Labs 02: Architectural Wireframe Overlay on loaded .GLB meshes
  useEffect(() => {
    const group = meshGroupRef.current;
    if (!group) return;

    const removeExistingOverlays = () => {
      const toRemove: THREE.Object3D[] = [];
      group.traverse((obj) => {
        if (obj.userData?.isLabsWireframeOverlay) {
          toRemove.push(obj);
        }
      });
      toRemove.forEach((overlay) => {
        overlay.parent?.remove(overlay);
      });
    };

    if (!effectiveWireframeOverlay || !glbLoadedReady) {
      removeExistingOverlays();
      return;
    }

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xc8a96e,
      wireframe: true,
      transparent: true,
      opacity: 0.26,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      depthWrite: false,
    });

    const targetMeshes: THREE.Mesh[] = [];
    group.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh &&
        obj.geometry &&
        !obj.userData.isGround &&
        !obj.userData.isGrid &&
        !obj.userData.isLabsWireframeOverlay &&
        !obj.userData.isGlbXrayOverlay &&
        !obj.userData.isGlbTierClone
      ) {
        targetMeshes.push(obj);
      }
    });

    targetMeshes.forEach((mesh) => {
      const alreadyHasOverlay = mesh.children.some(
        (c) => c.userData?.isLabsWireframeOverlay
      );
      if (!alreadyHasOverlay) {
        const overlay = new THREE.Mesh(mesh.geometry, wireMat);
        overlay.userData.isLabsWireframeOverlay = true;
        overlay.raycast = () => {};
        overlay.renderOrder = 2;
        mesh.add(overlay);
      }
    });

    return () => {
      removeExistingOverlays();
      wireMat.dispose();
    };
  }, [effectiveWireframeOverlay, currentSite.id, glbLoadedReady]);

  // Fullscreen resize effect
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !containerRef.current) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    rendererRef.current.setSize(w, h);
    cameraRef.current.aspect = w / h;
    cameraRef.current.updateProjectionMatrix();
  }, [isFullscreen]);

  // Smooth camera flight helper (800ms = 0.8s lerp interpolation, immediately cancellable by user drag/zoom)
  const flyCameraTo = (cameraTarget: [number, number, number], lookTarget: [number, number, number], duration = 800) => {
    if (!controlsRef.current || !cameraRef.current) return;

    cancelCameraFlight();
    controlsRef.current.enabled = true;
    controlsRef.current.enableRotate = true;
    controlsRef.current.enableZoom = true;
    controlsRef.current.enablePan = true;
    controlsRef.current.autoRotate = false;
    setAutoRotate(false);

    const startCam = cameraRef.current.position.clone();
    const endCam = new THREE.Vector3(...cameraTarget);
    const startTarget = controlsRef.current.target.clone();
    const endTarget = new THREE.Vector3(...lookTarget);
    const startTime = performance.now();

    const tween = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerpVectors(startCam, endCam, ease);
        controlsRef.current.target.lerpVectors(startTarget, endTarget, ease);
        controlsRef.current.update();
      }

      if (progress < 1) {
        cameraFlightRafRef.current = requestAnimationFrame(tween);
      } else {
        cameraFlightRafRef.current = null;
      }
    };
    cameraFlightRafRef.current = requestAnimationFrame(tween);
  };

  // Camera presets (Isometric, Front, Top)
  const handleSetPreset = (preset: 'iso' | 'front' | 'top') => {
    setCameraPreset(preset);
    setActiveFeature(null);
    if (preset === 'iso') {
      if (currentSite.id === 'HCM-DT-005') {
        flyCameraTo([20, 16, 40], [0, 10, 4], 800);
      } else if (currentSite.id === 'HCM-DT-002') {
        flyCameraTo([0, 13, 35], [0, 6, 0], 800);
      } else if (currentSite.id === 'HCM-DT-006') {
        flyCameraTo([0, 11, 34], [0, 5, 0], 800);
      } else if (currentSite.id === 'HCM-DT-009' || currentSite.id === 'BRVT-DT-003' || currentSite.id === 'BD-DT-002') {
        flyCameraTo([22, 16, 26], [0, 2, 0], 800);
      } else if (currentSite.id === 'HCM-DT-010') {
        flyCameraTo([20, 14, 24], [0, 0.8, 1.5], 800);
      } else if (currentSite.id === 'BRVT-DT-001') {
        flyCameraTo([22, 16, 28], [0, 6.5, -1.5], 800);
      } else {
        flyCameraTo([24, 18, 28], [0, 4, 0], 800);
      }
    } else if (preset === 'front') {
      if (currentSite.id === 'HCM-DT-005') {
        flyCameraTo([0, 11.5, 42], [0, 10.5, 4], 800);
      } else if (currentSite.id === 'HCM-DT-002') {
        flyCameraTo([0, 13, 35], [0, 6, 0], 800);
      } else if (currentSite.id === 'HCM-DT-006') {
        flyCameraTo([0, 11, 34], [0, 5, 0], 800);
      } else if (currentSite.id === 'HCM-DT-009' || currentSite.id === 'BRVT-DT-003' || currentSite.id === 'BD-DT-002') {
        flyCameraTo([0, 5, 32], [0, 2, 0], 800);
      } else if (currentSite.id === 'HCM-DT-010') {
        flyCameraTo([0, 8, 28], [0, 0.8, 1.5], 800);
      } else {
        flyCameraTo([0, 8, 34], [0, 5, 0], 800);
      }
    } else if (preset === 'top') {
      flyCameraTo([0, 48, 0.05], [0, 0, 0], 800);
    }
  };

  // Auto-reset 3D mode to Original if permissions are revoked (e.g., site switch outside Plus scope or Admin Preview switch)
  useEffect(() => {
    if (!sitePermissions.canUse3DAdvanced && viewModeRef.current !== 'original') {
      glbSectionControllerRef.current?.resetModelState();
      viewModeRef.current = 'original';
      renderModeRef.current = 'textured';
      sectionCutActiveRef.current = false;
      explodedFactorRef.current = 0;
      customInteriorCutRatioRef.current = null;
      setViewMode('original');
      setRenderMode('textured');
      setSectionCutActive(false);
      setExplodedFactor(0);
    }
  }, [sitePermissions.canUse3DAdvanced, currentSite.id]);

  // Unified 3D View Mode Handler (Nguyên bản | Bóc tách 3D | X-Ray | Nội thất)
  // Always resets previous model overlays/materials cleanly, unlocks OrbitControls, and updates viewModeRef synchronously
  const handleSelectViewMode = (requestedMode: GlbViewMode) => {
    if (requestedMode !== 'original' && !sitePermissions.canUse3DAdvanced) {
      openUpgradePrompt({
        featureKey:
          requestedMode === 'explode'
            ? '3d_explode'
            : requestedMode === 'xray'
            ? '3d_xray'
            : '3d_interior',
        siteId: currentSite.id,
        siteName: localizedCurrentSite.officialName,
        requiredPlan: sitePermissions.isPlusScopeLockedForSite ? 'pro' : 'plus_or_pro',
        isPlusScopeMismatch: sitePermissions.isPlusScopeLockedForSite,
      });
      return;
    }
    if (viewTwinMode !== '3d_cad_pbr') {
      setViewTwinMode('3d_cad_pbr');
    }
    cancelCameraFlight();
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
      controlsRef.current.enableRotate = true;
      controlsRef.current.enableZoom = true;
      controlsRef.current.enablePan = true;
      controlsRef.current.update();
    }
    ensureAnimateRunningRef.current?.();

    const glbCtrl = glbSectionControllerRef.current;
    const isGlb = Boolean(glbCtrl);

    // Clear X-Ray overlays, clipping planes, and stale opacity on EVERY mode switch BEFORE applying new mode
    glbCtrl?.resetModelState();

    if (requestedMode === 'original') {
      viewModeRef.current = 'original';
      renderModeRef.current = 'textured';
      sectionCutActiveRef.current = false;
      explodedFactorRef.current = 0;
      customInteriorCutRatioRef.current = null;
      tierVisibilityRef.current = [true, true, true, true];
      setTierVisibility([true, true, true, true]);
      setIsMobileDissectOpen(false);
      setMobileDissectStyle('explode');
      setViewMode('original');
      setRenderMode('textured');
      setSectionCutActive(false);
      setExplodedFactor(0);
      handleSetPreset('iso');
      return;
    }

    if (requestedMode === 'explode') {
      if (viewModeRef.current === 'explode') {
        handleSelectViewMode('original');
        return;
      }
      const nextFactor = isGlb ? 1 : 0.65;
      viewModeRef.current = 'explode';
      renderModeRef.current = 'textured';
      sectionCutActiveRef.current = false;
      explodedFactorRef.current = nextFactor;
      customInteriorCutRatioRef.current = null;
      setViewMode('explode');
      setRenderMode('textured');
      setSectionCutActive(false);
      setExplodedFactor(nextFactor);
      if (glbCtrl) {
        const camPreset = glbCtrl.getExplodeCameraPreset();
        flyCameraTo(camPreset.cameraPos, camPreset.targetPos, 800);
      } else {
        flyCameraTo([22, 20, 28], [0, 6.2, 0], 800);
      }
      trackPlatformInteraction('tech_3d_xray', currentSite.id);
      return;
    }

    if (requestedMode === 'xray') {
      const nextFactor = isGlb ? 0 : 0.28;
      viewModeRef.current = 'xray';
      renderModeRef.current = 'xray';
      sectionCutActiveRef.current = false;
      explodedFactorRef.current = nextFactor;
      customInteriorCutRatioRef.current = null;
      setViewMode('xray');
      setRenderMode('xray');
      setSectionCutActive(false);
      setExplodedFactor(nextFactor);
      flyCameraTo([-20, 17, 25], [0, 5.5, 0], 800);
      trackPlatformInteraction('tech_3d_xray', currentSite.id);
      return;
    }

    if (requestedMode === 'interior') {
      if (viewModeRef.current === 'interior') {
        handleSelectViewMode('original');
        return;
      }
      viewModeRef.current = 'interior';
      renderModeRef.current = 'textured';
      sectionCutActiveRef.current = true;
      customInteriorCutRatioRef.current = null;
      setViewMode('interior');
      setRenderMode('textured');
      setSectionCutActive(true);
      setIsRightPanelCollapsed(false);

      explodedFactorRef.current = 0;
      setExplodedFactor(0);
      if (glbCtrl) {
        const camPreset = glbCtrl.getInteriorCameraPreset();
        flyCameraTo(camPreset.cameraPos, camPreset.targetPos, 800);
      } else {
        flyCameraTo([14, 10, 20], [0, 3.5, 0], 800);
      }
    }
  };

  // Continuous Real-Time Exploded View Seek Bar Handler (0..1)
  const handleLiveExplodeChange = useCallback(
    (rawVal: number) => {
      if (rawVal > 0.02 && !sitePermissions.canUse3DAdvanced) {
        openUpgradePrompt({
          featureKey: '3d_explode',
          siteId: currentSite.id,
          siteName: localizedCurrentSite.officialName,
          requiredPlan: sitePermissions.isPlusScopeLockedForSite ? 'pro' : 'plus_or_pro',
          isPlusScopeMismatch: sitePermissions.isPlusScopeLockedForSite,
        });
        return;
      }
      const clamped = Math.max(0, Math.min(1, Math.round(rawVal * 100) / 100));
      cancelCameraFlight();
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        controlsRef.current.enableRotate = true;
        controlsRef.current.enableZoom = true;
        controlsRef.current.enablePan = true;
      }
      if (clamped > 0.005 && (renderModeRef.current === 'xray' || sectionCutActiveRef.current)) {
        glbSectionControllerRef.current?.resetModelState();
        renderModeRef.current = 'textured';
        sectionCutActiveRef.current = false;
        customInteriorCutRatioRef.current = null;
        setRenderMode('textured');
        setSectionCutActive(false);
      }
      explodedFactorRef.current = clamped;
      setExplodedFactor(clamped);
      const nextMode: GlbViewMode =
        renderModeRef.current === 'xray'
          ? 'xray'
          : sectionCutActiveRef.current
          ? 'interior'
          : clamped > 0.005
          ? 'explode'
          : 'original';
      viewModeRef.current = nextMode;
      setViewMode(nextMode);
      ensureAnimateRunningRef.current?.();
      if (rendererRef.current) {
        rendererRef.current.shadowMap.needsUpdate = true;
      }
    },
    [
      cancelCameraFlight,
      sitePermissions.canUse3DAdvanced,
      sitePermissions.isPlusScopeLockedForSite,
      currentSite.id,
      localizedCurrentSite.officialName,
    ]
  );

  const updateExplodeFromClientY = useCallback(
    (clientY: number) => {
      const trackEl = explodeTrackRef.current;
      if (!trackEl) return;
      const rect = trackEl.getBoundingClientRect();
      if (rect.height <= 0) return;
      const ratio = (rect.bottom - clientY) / rect.height;
      handleLiveExplodeChange(ratio);
    },
    [handleLiveExplodeChange]
  );

  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => {
      const next = !prev;
      if (next) {
        cancelCameraFlight();
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
          controlsRef.current.enableRotate = true;
          controlsRef.current.autoRotateSpeed = 0.35;
          controlsRef.current.autoRotate = true;
        }
        ensureAnimateRunningRef.current?.();
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }
      return next;
    });
  }, [cancelCameraFlight]);

  // Fly to architectural feature hotspot in 600-800ms
  const flyToFeature = (feat: ArchitecturalFeature) => {
    setActiveFeature(feat);
    if (currentSite.id === 'HCM-DT-001') {
      switchToThreeJs('textured');
      setExplodedFactor(0);
      setSectionHeight(14);
      setSectionCutActive(true);
    } else if (currentSite.id === 'BRVT-DT-002') {
      switchToThreeJs('textured');
      const isInteriorPin = feat.id === 'f1' || feat.id === 'f4' || feat.id === 'f5';
      setExplodedFactor(0);
      setSectionHeight(16);
      setSectionCutActive(isInteriorPin);
    }
    flyCameraTo(feat.cameraPos, feat.targetPos, 760);
  };

  // =========================================================================
  // ✨ APPLE 3D SCROLLYTELLING (CUỘN GIẢI PHẪU KHÔNG GIAN) — 4 GIAI ĐOẠN
  // =========================================================================
  const scrollytellingStages = useMemo(() => {
    const isTunnelSite =
      currentSite.id === 'HCM-DT-009' ||
      currentSite.id === 'BRVT-DT-003' ||
      currentSite.id === 'BD-DT-002';

    const frontCam: [number, number, number] =
      currentSite.id === 'HCM-DT-005'
        ? [16, 14, 38]
        : currentSite.id === 'HCM-DT-002'
        ? [0, 12.5, 34]
        : currentSite.id === 'HCM-DT-006'
        ? [0, 11, 33]
        : isTunnelSite
        ? [20, 15, 26]
        : [0, 12, 34];

    const frontTarget: [number, number, number] =
      currentSite.id === 'HCM-DT-005'
        ? [0, 9.5, 2]
        : isTunnelSite
        ? [0, 2, 0]
        : [0, 5.5, 0];

    return [
      {
        stageNumber: '01',
        title:
          lang === 'en'
            ? 'Stage 1: Architectural Facade Overview'
            : lang === 'zh'
            ? '阶段 1：建筑立面全景概览'
            : 'Giai đoạn 1: Tổng quan Kiến trúc Mặt tiền',
        subtitle:
          lang === 'en'
            ? 'EXTERIOR COMPOSITION & PROPORTIONS'
            : lang === 'zh'
            ? '外立面比例与建筑流派'
            : 'TỶ LỆ MẶT ĐỨNG & PHONG CÁCH ĐÔNG DƯƠNG',
        description:
          lang === 'en'
            ? `Panoramic front elevation of ${currentSite.officialName} (${currentSite.architecturalStyle}). Designed by ${currentSite.architect || 'Master Architects'}, preserving authentic historical proportions and facade ornamentation.`
            : `Toàn cảnh mặt đứng chính diện của ${currentSite.officialName} theo phong cách ${currentSite.architecturalStyle}. Tác giả / Kiến trúc sư: ${currentSite.architect || 'Kiến trúc sư đương thời'} (${currentSite.chronology}).`,
        cameraPos: frontCam,
        targetPos: frontTarget,
        renderMode: 'textured' as RenderMode,
        explodedFactor: 0,
        sectionCutActive: false,
        sectionHeight: 14,
        shellOpacity: 1.0,
        metricLabel: lang === 'en' ? 'FACADE SHELL' : 'VỎ BAO CHE NGOẠI THẤT',
        metricValue: '100% PBR Solid',
      },
      {
        stageNumber: '02',
        title:
          lang === 'en'
            ? 'Stage 2: X-Ray Cutaway & Load-Bearing Structure'
            : lang === 'zh'
            ? '阶段 2：X光透视与承重结构解剖'
            : 'Giai đoạn 2: Cắt lớp X-Ray & Giải phẫu Kết cấu chịu lực',
        subtitle:
          lang === 'en'
            ? 'STRUCTURAL COLUMNS, ARCHES & TRUSS ANATOMY'
            : lang === 'zh'
            ? '承重柱网、拱券与屋架解剖'
            : 'HỆ CỘT CHỊU LỰC, VÒM CUỐN & VÌ KÈO MÁI',
        description:
          isTunnelSite
            ? `Cắt lớp X-Ray xuyên địa tầng đất sét pha đá ong (laterite clay) trên nền phù sa cổ bền chắc như bê tông tự nhiên, làm lộ rõ kết cấu chịu lực tự nhiên của mạng lưới giao thông hào và hầm ngầm.`
            : `Chế độ giải phẫu X-Ray làm mờ lớp vỏ tường bao ngoài (độ trong suốt 35%) và nâng tách các tầng kết cấu (35%), phơi bày hệ khung cột chịu lực, vòm cuốn và dàn mái kỹ thuật bên trong công trình.`,
        cameraPos: [-22, 17, 25] as [number, number, number],
        targetPos: [0, 6.2, 0] as [number, number, number],
        renderMode: 'xray' as RenderMode,
        explodedFactor: 0.35,
        sectionCutActive: false,
        sectionHeight: 12,
        shellOpacity: 0.35,
        metricLabel: lang === 'en' ? 'STRUCTURAL X-RAY' : 'CẮT LỚP KẾT CẤU',
        metricValue: 'Opacity 35% · Explode 35%',
      },
      {
        stageNumber: '03',
        title:
          lang === 'en'
            ? 'Stage 3: Interior Chambers & Subterranean Spaces'
            : lang === 'zh'
            ? '阶段 3：内部空间与历史地下层探索'
            : 'Giai đoạn 3: Khám phá Nội thất / Tầng ngầm Lịch sử',
        subtitle:
          lang === 'en'
            ? 'INTERIOR HALLS & SUBTERRANEAN COMMAND BUNKERS'
            : lang === 'zh'
            ? '核心厅堂与地下历史空间'
            : 'KHÔNG GIAN LÕI NỘI THẤT & TẦNG HẦM CHỈ HUY',
        description:
          isTunnelSite
            ? `Camera hạ thấp đi sâu vào hệ thống 3 tầng địa đạo ngầm (từ -3m đến -10m): khám phá hầm chỉ huy chữ A, bếp Hoàng Cầm giấu khói, giếng nước ngầm và lỗ thông hơi ngụy trang.`
            : `Tự động làm mờ lớp tường bao ngoại thất (độ mờ 28%) kết hợp mặt cắt ngang ở cao độ +8.5m và tách mái 65%, đưa góc nhìn xuyên vào không gian khánh tiết, khán phòng và tầng hầm lịch sử bên trong.`,
        cameraPos: (isTunnelSite ? [11, 4.5, 16] : [13, 9.2, 18]) as [number, number, number],
        targetPos: (isTunnelSite ? [0, -1.5, 0] : [0, 4.0, 0]) as [number, number, number],
        renderMode: 'textured' as RenderMode,
        explodedFactor: 0.65,
        sectionCutActive: true,
        sectionHeight: 8.5,
        shellOpacity: 0.28,
        metricLabel: lang === 'en' ? 'INTERIOR CUTAWAY' : 'GIẢI PHẪU LÕI NỘI THẤT',
        metricValue: 'Section +8.5m · Shell 28%',
      },
      {
        stageNumber: '04',
        title:
          lang === 'en'
            ? 'Stage 4: Technical Blueprint & Regional Linkage'
            : lang === 'zh'
            ? '阶段 4：工程技术蓝图与跨区域联动'
            : 'Giai đoạn 4: Bản vẽ Kỹ thuật & Liên kết vùng',
        subtitle:
          lang === 'en'
            ? 'CAD WIREFRAME & SOUTHEAST VIETNAM CORRIDOR'
            : lang === 'zh'
            ? 'CAD 测绘线框与东南部遗产走廊'
            : 'BẢN VẼ TRẮC ĐỊA CAD & TRỤC DI SẢN ĐÔNG NAM BỘ',
        description:
          lang === 'en'
            ? `Isometric CAD wireframe survey of ${currentSite.officialName} (${currentSite.identifierCode}) at WGS84 ${currentSite.gps.lat.toFixed(4)}°N, ${currentSite.gps.lng.toFixed(4)}°E, connecting the Ho Chi Minh City – Binh Duong – Ba Ria Vung Tau heritage network.`
            : `Bản vẽ khung dây trắc địa CAD (Isometric Blueprint) của di tích ${currentSite.identifierCode} tại tọa độ WGS84 (${currentSite.gps.lat.toFixed(4)}°N, ${currentSite.gps.lng.toFixed(4)}°E), kết nối trực tiếp vào mạng lưới di sản liên vùng TP.HCM – Bình Dương – Bà Rịa Vũng Tàu.`,
        cameraPos: [25, 22, 27] as [number, number, number],
        targetPos: [0, 4.5, 0] as [number, number, number],
        renderMode: 'wireframe' as RenderMode,
        explodedFactor: 0.18,
        sectionCutActive: false,
        sectionHeight: 15,
        shellOpacity: 1.0,
        metricLabel: lang === 'en' ? 'GEODETIC CAD' : 'TỌA ĐỘ TRẮC ĐỊA WGS84',
        metricValue: `${currentSite.gps.lat.toFixed(4)}°N, ${currentSite.gps.lng.toFixed(4)}°E`,
      },
    ];
  }, [currentSite, lang]);

  // Curved camera flight combining Spherical orbital interpolation + Vector3.lerp
  const flyCameraCurvedTo = useCallback(
    (cameraTarget: [number, number, number], lookTarget: [number, number, number], duration = 920) => {
      if (!controlsRef.current || !cameraRef.current) return;

      cancelCameraFlight();
      controlsRef.current.enabled = true;
      controlsRef.current.enableRotate = true;
      controlsRef.current.enableZoom = true;
      controlsRef.current.enablePan = true;
      controlsRef.current.autoRotate = false;
      setAutoRotate(false);

      const startTarget = controlsRef.current.target.clone();
      const endTarget = new THREE.Vector3(...lookTarget);

      const startOffset = cameraRef.current.position.clone().sub(startTarget);
      const endOffset = new THREE.Vector3(...cameraTarget).sub(endTarget);

      const startSpherical = new THREE.Spherical().setFromVector3(startOffset);
      const endSpherical = new THREE.Spherical().setFromVector3(endOffset);

      // Shortest angular path for theta
      let deltaTheta = endSpherical.theta - startSpherical.theta;
      while (deltaTheta > Math.PI) deltaTheta -= Math.PI * 2;
      while (deltaTheta < -Math.PI) deltaTheta += Math.PI * 2;

      const startTime = performance.now();
      const currentSpherical = new THREE.Spherical();
      const currentOffset = new THREE.Vector3();

      const tween = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Apple quintic ease-out
        const ease = 1 - Math.pow(1 - progress, 4);

        if (cameraRef.current && controlsRef.current) {
          controlsRef.current.target.lerpVectors(startTarget, endTarget, ease);

          currentSpherical.radius = THREE.MathUtils.lerp(startSpherical.radius, endSpherical.radius, ease);
          currentSpherical.phi = THREE.MathUtils.lerp(startSpherical.phi, endSpherical.phi, ease);
          currentSpherical.theta = startSpherical.theta + deltaTheta * ease;

          currentOffset.setFromSpherical(currentSpherical);
          cameraRef.current.position.copy(controlsRef.current.target).add(currentOffset);
          controlsRef.current.update();
        }

        if (progress < 1) {
          cameraFlightRafRef.current = requestAnimationFrame(tween);
        } else {
          cameraFlightRafRef.current = null;
        }
      };

      cameraFlightRafRef.current = requestAnimationFrame(tween);
    },
    [cancelCameraFlight]
  );

  // Apply Scrollytelling stage (camera curve + .glb section/explode modes)
  const applyScrollyStage = useCallback(
    (stageIdx: number) => {
      const clampedIdx = Math.max(0, Math.min(scrollytellingStages.length - 1, stageIdx));
      const stage = scrollytellingStages[clampedIdx];
      if (!stage) return;

      setScrollyStageIndex(clampedIdx);
      setActiveFeature(null);

      if (viewTwinMode !== '3d_cad_pbr') {
        setViewTwinMode('3d_cad_pbr');
      }

      setRenderMode(stage.renderMode);
      setExplodedFactor(stage.explodedFactor);
      setSectionCutActive(stage.sectionCutActive);
      setSectionHeight(stage.sectionHeight);

      flyCameraCurvedTo(stage.cameraPos, stage.targetPos, 920);
    },
    [scrollytellingStages, viewTwinMode, flyCameraCurvedTo]
  );


  // Listen to mouse wheel when Apple 3D Scrollytelling mode is active to advance/rewind stages
  useEffect(() => {
    if (!isScrollytellingMode || !containerRef.current) return;
    const el = containerRef.current;

    const handleScrollyWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 12) return;
      const now = performance.now();
      if (now - lastWheelStepTimeRef.current < 520) return;
      lastWheelStepTimeRef.current = now;

      const direction = e.deltaY > 0 ? 1 : -1;
      const nextIdx = Math.max(0, Math.min(3, scrollyStageIndex + direction));
      if (nextIdx !== scrollyStageIndex) {
        applyScrollyStage(nextIdx);
      }
    };

    el.addEventListener('wheel', handleScrollyWheel, { passive: true });
    return () => {
      el.removeEventListener('wheel', handleScrollyWheel);
    };
  }, [isScrollytellingMode, scrollyStageIndex, applyScrollyStage]);

  return (
    <div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
          const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
          mouseParallaxRef.current.targetX = nx;
          mouseParallaxRef.current.targetY = ny;
        }
      }}
      onMouseLeave={() => {
        mouseParallaxRef.current.targetX = 0;
        mouseParallaxRef.current.targetY = 0;
      }}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen flex flex-col select-none'
          : 'relative w-full h-full min-h-[55vh] md:min-h-0 overflow-hidden border-0 shadow-none flex flex-col select-none'
      }
      style={{
        background:
          lightingMode === 'night'
            ? 'linear-gradient(180deg, #0E1117 0%, #141B26 55%, #1C2533 100%)'
            : lightingMode === 'golden'
            ? 'linear-gradient(180deg, #283342 0%, #A94F3D 58%, #C9A46A 100%)'
            : lightingMode === 'day'
            ? 'linear-gradient(180deg, #7FA3C4 0%, #B8CBDC 56%, #E8DFCE 100%)'
            : 'radial-gradient(circle at 50% 48%, rgba(201, 164, 106, 0.12) 0%, #2B261E 28%, #171817 78%)',
      }}
    >
      {/* APPLE VISIONOS 100% FULL-SCREEN 3D STAGE */}
      <div className="flex-1 relative flex overflow-hidden w-full h-full">
        <div className="flex-1 relative h-full min-h-[55vh] md:min-h-0 overflow-hidden">
          {/* 0. THREE.JS VIEWPORT CONTAINER (ALWAYS IN DOM TO PRESERVE WEBGL CONTEXT & ACCURATE DIMENSIONS) */}
          <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full select-none touch-none overscroll-contain"
            style={{
              display: viewTwinMode === '3d_cad_pbr' ? 'block' : 'none',
              zIndex: 10,
              opacity: 1,
              pointerEvents: 'auto',
              cursor: 'grab',
              touchAction: 'none',
              overscrollBehavior: 'contain',
              userSelect: 'none',
            }}
          />

      {/* 1. LOADING PROGRESS & PREVIEW BACKDROP */}
      {(customGlbSourceLoading || isLoadingModel) && (
        <div className="absolute inset-0 z-40 bg-[#171817]/95 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="relative z-10 max-w-sm w-full space-y-4 bg-[#171817] p-6 rounded-sm border border-[#C9A46A]/40 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.14em] text-[#C9A46A] block">
                {lang === 'en'
                  ? 'LOADING .GLB MODEL'
                  : lang === 'zh'
                  ? '正在加载 .GLB 模型'
                  : 'ĐANG NẠP MÔ HÌNH .GLB'}
              </span>
              <h4 className="font-serif font-bold text-lg text-[#D8C9A9]">{localizedCurrentSite.officialName}</h4>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-[#D8C9A9]/15 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-[#C9A46A] h-full transition-all duration-200 rounded-full"
                  style={{ width: `${Math.max(15, loadingProgress)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-sans font-medium text-[#D8C9A9]/80 tabular-nums">
                <span>
                  {lang === 'en'
                    ? 'Preparing spatial mesh'
                    : lang === 'zh'
                    ? '准备空间几何数据'
                    : 'Đang nạp dữ liệu mô hình'}
                </span>
                <span>{loadingProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1A-CLOUD. CLOUD CHUNK REASSEMBLY OVERLAY (NEW DEVICE / REMIX AUTO-PULL INTO INDEXEDDB) */}
      {cloudModelDownload?.active && viewTwinMode === '3d_cad_pbr' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto max-w-sm w-[92vw] rounded-sm bg-[#171817]/95 backdrop-blur-md border border-[#C9A46A]/65 p-5 shadow-2xl space-y-3.5 text-center">
            <div className="mx-auto relative w-14 h-14 flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  fill="none"
                  stroke="rgba(216,201,169,0.16)"
                  strokeWidth="3"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  fill="none"
                  stroke="#C9A46A"
                  strokeWidth="3"
                  strokeLinecap="square"
                  strokeDasharray={144.5}
                  strokeDashoffset={144.5 - (144.5 * Math.max(0, Math.min(100, cloudModelDownload.percent))) / 100}
                  className="transition-all duration-300"
                />
              </svg>
              <span className="absolute text-xs font-mono font-semibold tabular-nums text-[#F5EFE6]">
                {cloudModelDownload.percent}%
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-sans uppercase tracking-[0.18em] text-[#C9A46A]">
                {lang === 'en'
                  ? 'CLOUD ARCHIVE SYNC'
                  : lang === 'zh'
                  ? '云端档案同步'
                  : 'KHO LƯU TRỮ CLOUD'}
              </div>
              <p className="text-xs font-medium text-[#F5EFE6]">
                {lang === 'en'
                  ? `Downloading 3D model ${localizedCurrentSite.officialName} from Cloud Archive: ${cloudModelDownload.percent}%`
                  : lang === 'zh'
                  ? `正在从云端档案库加载 ${localizedCurrentSite.officialName} 3D 模型：${cloudModelDownload.percent}%`
                  : `Đang tải mô hình 3D ${localizedCurrentSite.officialName} từ Kho Lưu trữ Cloud: ${cloudModelDownload.percent}%`}
              </p>
              <p className="text-[11px] font-mono text-[#D8C9A9]/70 tabular-nums">
                {lang === 'en'
                  ? `Chunk ${cloudModelDownload.currentChunk}/${cloudModelDownload.totalChunks} · Caching to local IndexedDB`
                  : lang === 'zh'
                  ? `分片 ${cloudModelDownload.currentChunk}/${cloudModelDownload.totalChunks} · 正在写入本地缓存`
                  : `Mảnh ${cloudModelDownload.currentChunk}/${cloudModelDownload.totalChunks} · Tự động lưu đệm IndexedDB`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1B. DIGITAL MUSEUM .GLB DIGITIZING NOTICE CARD (SHOWN ONLY AFTER CLOUD & INDEXEDDB CHECKS COMPLETE) */}
      {!customGlbSourceLoading &&
        !isLoadingModel &&
        !cloudModelDownload?.active &&
        viewTwinMode === '3d_cad_pbr' &&
        (!customGlbSource.url || Boolean(customGlbError)) && (
          <div className="absolute inset-0 z-25 flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto max-w-md w-[94vw] md:w-full rounded-sm bg-[#171817]/95 border border-[#C9A46A] p-5 md:p-6 shadow-2xl space-y-4 text-left">
              <div className="space-y-1.5 border-b border-[#D8C9A9]/15 pb-3">
                <span className="text-[10.5px] font-sans font-semibold uppercase tracking-[0.14em] text-[#C9A46A] block">
                  {lang === 'en'
                    ? 'DIGITAL ARCHIVE · .GLB'
                    : lang === 'zh'
                    ? '数字展厅 · .GLB'
                    : 'LƯU TRỮ SỐ · .GLB'}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#D8C9A9] leading-snug">
                  {localizedCurrentSite.officialName}
                </h3>
                <p className="text-xs text-[#D8C9A9]/90 leading-relaxed font-sans">
                  {cloudModelError
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
                {cloudModelError && (
                  <div className="mt-1.5 rounded-[3px] border border-[#A94F3D]/55 bg-[#A94F3D]/12 px-2.5 py-1.5 text-[11px] font-mono text-[#F0B4A8] break-words">
                    [{cloudModelError.code}] {cloudModelError.message}
                  </div>
                )}
                {customGlbError && (
                  <p className="text-[11px] font-sans text-[#A94F3D] leading-snug pt-0.5">
                    {lang === 'en'
                      ? `Could not load .GLB source: ${customGlbError}`
                      : lang === 'zh'
                      ? `无法加载 .GLB 资源：${customGlbError}`
                      : `Không thể tải tệp .GLB (${customGlbError}).`}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomGlbError(null);
                      void retryGlbFromCloud();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-sm border border-[#C9A46A]/65 bg-[#C9A46A]/15 hover:bg-[#C9A46A]/25 text-[#F5EFE6] text-xs font-medium cursor-pointer transition-colors"
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
                  {isAdmin && !isTesterPro && onOpenAdminGlbUpload && (
                    <button
                      type="button"
                      onClick={() => onOpenAdminGlbUpload(currentSite)}
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-sm bg-[#C9A46A] hover:bg-[#D8C9A9] text-[#171817] text-xs font-semibold cursor-pointer transition-colors"
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
                <span className="text-[11px] font-sans text-[#D8C9A9]/65 tabular-nums">
                  {currentSite.identifierCode}
                </span>
              </div>
            </div>
          </div>
        )}

      {/* 2. WEBGL CONTEXT LOST / GPU FALLBACK OVERLAY */}
      {webglError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#171817]/92 backdrop-blur-sm">
          <div className="max-w-md w-[94vw] md:w-full rounded-xl bg-[#1C1D1B] border border-[#C9A46A]/65 p-5 sm:p-6 shadow-2xl space-y-4 text-left">
            <div className="space-y-1.5 border-b border-[#D8C9A9]/15 pb-3">
              <span className="text-[10.5px] font-sans font-semibold uppercase tracking-[0.14em] text-[#C9A46A] block">
                {lang === 'en'
                  ? 'WEBGL 3D GRAPHICS NOTICE'
                  : lang === 'zh'
                  ? 'WEBGL 3D 图形提示'
                  : 'THÔNG BÁO ĐỒ HỌA 3D (WEBGL)'}
              </span>
              <h3 className="font-serif text-lg font-bold text-[#F4EFE4] leading-snug">
                {localizedCurrentSite.officialName}
              </h3>
              <p className="text-xs text-[#D8C9A9]/90 leading-relaxed font-sans">
                {lang === 'en'
                  ? 'The 3D graphics context was interrupted or your GPU needs a quick reset to display this monument.'
                  : lang === 'zh'
                  ? '当前浏览器或显卡的 3D 渲染上下文暂时中断，请点击下方按钮重新启动 3D 视窗。'
                  : webglError}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setWebglError(null);
                  setCustomGlbError(null);
                  setWebglRestartKey((k) => k + 1);
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
              <span className="text-[11px] font-sans text-[#D8C9A9]/60 tabular-nums">
                {currentSite.identifierCode}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SVG HOTSPOT CONNECTOR BEAM (Desktop >= 768px only) */}
      {showHotspots && activeFeature && hotspotScreenPos && containerRef.current && (
        <svg className="hidden md:block absolute inset-0 pointer-events-none z-20 w-full h-full">
          <defs>
            <linearGradient id="heritageBeam" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C9A15B" stopOpacity="0.3" />
              <stop offset="80%" stopColor="#DFCE9D" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>
            <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {(() => {
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            const cardAnchorX = Math.min(380, w * 0.42);
            const cardAnchorY = Math.max(80, h - 180);
            const midX = (cardAnchorX + hotspotScreenPos.x) / 2;
            const midY = Math.min(cardAnchorY, hotspotScreenPos.y) - 30;

            return (
              <g>
                <path
                  d={`M ${cardAnchorX} ${cardAnchorY} Q ${midX} ${midY}, ${hotspotScreenPos.x} ${hotspotScreenPos.y}`}
                  fill="none"
                  stroke="url(#heritageBeam)"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                  filter="url(#goldGlow)"
                />
                <circle cx={cardAnchorX} cy={cardAnchorY} r="3.5" fill="#C9A15B" stroke="#ffffff" strokeWidth="1" />
              </g>
            );
          })()}

          {/* Target Beacon Ring on 3D Model */}
          <circle
            cx={hotspotScreenPos.x}
            cy={hotspotScreenPos.y}
            r="16"
            fill="rgba(201, 161, 91, 0.2)"
            stroke="#C9A15B"
            strokeWidth="1.5"
            className="animate-ping"
            style={{ transformOrigin: `${hotspotScreenPos.x}px ${hotspotScreenPos.y}px` }}
          />
          <circle cx={hotspotScreenPos.x} cy={hotspotScreenPos.y} r="6" fill="#DFCE9D" stroke="#000000" strokeWidth="1.5" />
          <circle cx={hotspotScreenPos.x} cy={hotspotScreenPos.y} r="2" fill="#000000" />
        </svg>
      )}

          {/* MOBILE (< 768px) STREAMLINED TOP HUD: Back Circle + Full-Width 17-Monument Search Selector */}
          {!isGettyLanding && viewTwinMode === '3d_cad_pbr' && (
            <div className="md:hidden absolute top-2.5 inset-x-3 z-30 pointer-events-auto">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onClose?.()}
                  aria-label={lang === 'en' ? 'Back' : lang === 'zh' ? '返回' : 'Quay lại'}
                  className="w-10 h-10 rounded-full bg-[#1C1D1B]/92 backdrop-blur-md border border-[#C9A46A]/35 text-[#D8C9A9] hover:border-[#C9A46A] flex items-center justify-center shrink-0 cursor-pointer shadow-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSiteDropdownAnchor('top');
                    setIsSiteDropdownOpen((prev) => !prev);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={isSiteDropdownOpen && siteDropdownAnchor === 'top'}
                  className="flex-1 min-w-0 h-10 px-3.5 rounded-full bg-[#1C1D1B]/92 backdrop-blur-md border border-[#C9A46A]/45 hover:border-[#C9A46A] shadow-lg flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[11px] font-sans font-bold text-[#171817] bg-[#C9A46A] px-1.5 py-0.5 rounded-md tabular-nums shrink-0 leading-none">
                      {String(currentSiteIndex + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[12.5px] font-medium text-[#F4EFE4] truncate">
                      {localizedCurrentSite.officialName}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#C9A46A] shrink-0 transition-transform ${
                      isSiteDropdownOpen && siteDropdownAnchor === 'top' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Full-width 17-Monument Search Dropdown Panel on Mobile */}
              {isSiteDropdownOpen && siteDropdownAnchor === 'top' && (
                <div className="mt-2 w-full z-[999] pointer-events-auto">
                  <HeritageSiteListPanel
                    sites={allSites}
                    selectedSiteId={currentSite.id}
                    showInternalSearch
                    autoFocusSearch
                    showRegionFilters
                    hiddenSiteIds={allSites
                      .filter(
                        (s) =>
                          hiddenSiteIds.includes(s.id) ||
                          cmsOverrides[s.id]?.modelVisibility === 'hidden'
                      )
                      .map((s) => s.id)}
                    canPreviewHidden={canPreviewHidden}
                    headingLabel={
                      lang === 'en'
                        ? `SEARCH ${allSites.length} MONUMENTS`
                        : lang === 'zh'
                        ? `搜索 ${allSites.length} 处遗产`
                        : `CHỌN TRONG ${allSites.length} DI TÍCH 3D`
                    }
                    maxListHeightClass="max-h-[48dvh]"
                    onClose={() => setIsSiteDropdownOpen(false)}
                    onSelectSite={(s) => {
                      handleSwitchLandmark(s);
                      setIsSiteDropdownOpen(false);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* TOP-LEFT COMPACT APPLE PILL (DESKTOP >= 768px): CURRENT MONUMENT TITLE */}
          {!isGettyLanding && viewTwinMode === '3d_cad_pbr' && (
            <div
              className={`hidden md:flex absolute top-4 left-4 ${
                isSiteDropdownOpen && siteDropdownAnchor === 'top' ? 'z-[999]' : 'z-20'
              } flex-wrap items-center gap-2 pointer-events-auto`}
            >
              <div ref={topSiteDropdownRef} className="relative z-[999] pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (isSiteDropdownOpen && siteDropdownAnchor === 'top') {
                      setIsSiteDropdownOpen(false);
                    } else {
                      setSiteDropdownAnchor('top');
                      setIsSiteDropdownOpen(true);
                    }
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={isSiteDropdownOpen && siteDropdownAnchor === 'top'}
                  title={
                    lang === 'en'
                      ? `Click to switch among ${allSites.length} monuments`
                      : lang === 'zh'
                      ? `点击快速切换 ${allSites.length} 处遗产`
                      : `Bấm để chọn nhanh trong ${allSites.length} Di tích`
                  }
                  className="rounded-full bg-[#1D1D1F]/80 hover:bg-[#272729]/90 backdrop-blur-2xl border border-white/10 hover:border-[#C5A059]/50 px-4 py-1.5 shadow-lg flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <span className="text-[11px] font-sans text-[#D4AF37] font-semibold tabular-nums">
                    {String(currentSiteIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-medium text-[#F5F5F7] truncate max-w-[180px] sm:max-w-[260px]">
                    {localizedCurrentSite.officialName}
                  </span>
                  {isCurrentSiteOrModelHidden && canPreviewHidden && (
                    <span className="px-2 py-0.5 rounded-sm bg-[#171817] border border-[#C9A46A] text-[#C9A46A] text-[10px] font-semibold shrink-0">
                      {lang === 'en'
                        ? 'Tester Preview · Hidden'
                        : lang === 'zh'
                        ? '隐藏草稿 · 测试模式'
                        : 'Đang ẩn · Chế độ Tester'}
                    </span>
                  )}
                  <span
                    ref={azimuthSpanRef}
                    className="hidden md:inline text-[11px] font-sans text-[#86868B] tabular-nums"
                  >
                    0°
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#86868B] shrink-0 transition-transform ${
                      isSiteDropdownOpen && siteDropdownAnchor === 'top' ? 'rotate-180 text-[#C5A059]' : ''
                    }`}
                  />
                </button>

                {isSiteDropdownOpen && siteDropdownAnchor === 'top' && (
                  <div className="absolute top-full left-0 mt-2 w-80 sm:w-[350px] max-w-[calc(100vw-2rem)] z-[999] pointer-events-auto">
                    <HeritageSiteListPanel
                      sites={allSites}
                      selectedSiteId={currentSite.id}
                      showInternalSearch
                      autoFocusSearch
                      showRegionFilters
                      hiddenSiteIds={allSites
                        .filter(
                          (s) =>
                            hiddenSiteIds.includes(s.id) ||
                            cmsOverrides[s.id]?.modelVisibility === 'hidden'
                        )
                        .map((s) => s.id)}
                      canPreviewHidden={canPreviewHidden}
                      headingLabel={
                        lang === 'en'
                          ? 'SWITCH 3D MONUMENT'
                          : lang === 'zh'
                          ? '切换 3D 历史遗迹'
                          : 'CHUYỂN NGỮ CẢNH DI TÍCH 3D'
                      }
                      maxListHeightClass="max-h-[46vh]"
                      onClose={() => setIsSiteDropdownOpen(false)}
                      onSelectSite={(s) => {
                        handleSwitchLandmark(s);
                        setIsSiteDropdownOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {(spatialSpotlight || isMysteryModeActive) && (
                <button
                  type="button"
                  onClick={() => {
                    setSpatialSpotlight(null);
                    setIsMysteryModeActive(false);
                    setExplodedFactor(0);
                    setRenderMode('textured');
                    handleSetPreset('iso');
                  }}
                  className="rounded-full bg-[#C5A059] hover:bg-[#DFC286] text-[#121110] px-3.5 py-1.5 text-xs font-semibold shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'en'
                      ? 'Restore Full View'
                      : lang === 'zh'
                      ? '恢复全景视角'
                      : 'Khôi phục toàn cảnh'}
                  </span>
                </button>
              )}

              <div className="hidden sm:flex items-center rounded-full bg-[#1D1D1F]/85 border border-white/12 p-1 shadow-lg gap-0.5">
                {(['studio', 'day', 'golden', 'night'] as LightingMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLightingMode(mode)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      lightingMode === mode
                        ? 'bg-[#C5A059] text-[#121110] font-semibold shadow-sm'
                        : 'text-[#A1A1A6] hover:text-[#F5F5F7]'
                    }`}
                  >
                    {mode === 'studio'
                      ? lang === 'zh'
                        ? '展馆'
                        : 'Studio'
                      : mode === 'day'
                      ? lang === 'en'
                        ? 'Day'
                        : lang === 'zh'
                        ? '白天'
                        : 'Ngày'
                      : mode === 'golden'
                      ? lang === 'en'
                        ? 'Sunset'
                        : lang === 'zh'
                        ? '黄昏'
                        : 'Hoàng hôn'
                      : lang === 'en'
                      ? 'Night'
                      : lang === 'zh'
                      ? '夜晚'
                      : 'Đêm'}
                  </button>
                ))}
              </div>

              {isTesterPro && (
                <div className="flex items-center gap-1.5">
                  <input
                    ref={tempGlbInputRef}
                    type="file"
                    accept=".glb,.gltf,model/gltf-binary"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      try {
                        const meta = setSessionTempGlb(currentSite.id, file);
                        setTempGlbNotice(
                          `Đã nạp thử RAM: ${meta.fileName} (${formatGlbFileSize(meta.fileSize)})`
                        );
                      } catch (err) {
                        setTempGlbNotice(
                          err instanceof Error ? err.message : 'Không thể nạp tệp .glb cục bộ.'
                        );
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => tempGlbInputRef.current?.click()}
                    className="rounded-full bg-[#47796D] hover:bg-[#3A655B] border border-[#C9A46A]/65 text-[#D8C9A9] px-3 py-1.5 text-[11px] font-semibold shadow-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    title="Dùng URL.createObjectURL nạp thử mô hình .glb trong RAM phiên làm việc (không lưu vào bộ nhớ tạm hay dữ liệu gốc)"
                  >
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {lang === 'en'
                        ? 'Load Temp .GLB'
                        : lang === 'zh'
                        ? '临时加载 .GLB'
                        : 'Nạp thử tệp .glb cục bộ'}
                    </span>
                  </button>
                  {tempGlbNotice && (
                    <span className="hidden xl:inline px-2 py-1 rounded-sm bg-[#171817]/90 border border-[#C9A46A]/50 text-[#D8C9A9] text-[10px]">
                      {tempGlbNotice}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TOP-RIGHT APPLE VISIONOS QUICK PILLS (DESKTOP >= 768px): CHI TIẾT */}
          {!isGettyLanding && viewTwinMode === '3d_cad_pbr' && (
            <div className="hidden md:flex absolute top-4 right-4 z-20 items-center gap-2.5 pointer-events-auto">
              {isRightPanelCollapsed && (
                <button
                  type="button"
                  onClick={() => setIsRightPanelCollapsed(false)}
                  className="rounded-full bg-[#1D1D1F]/85 backdrop-blur-2xl border border-white/15 hover:border-[#D4AF37]/60 px-4 py-1.5 text-xs font-medium text-[#F5F5F7] flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
                >
                  <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{lang === 'en' ? 'Details' : lang === 'zh' ? '详情' : 'Chi tiết'}</span>
                </button>
              )}
              {onOpenGuide && (
                <SectionGuideButton lang={lang} onClick={onOpenGuide} />
              )}
            </div>
          )}

          {/* REFINED VERTICAL 3D EXPLODED SEEK BAR (DESKTOP >= 768px ONLY; Mobile uses Horizontal Dissection Bar) */}
          {!isGettyLanding && viewTwinMode === '3d_cad_pbr' && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onWheel={(e) => {
                e.stopPropagation();
                const delta = e.deltaY < 0 ? 0.04 : -0.04;
                handleLiveExplodeChange(explodedFactorRef.current + delta);
              }}
              className={`hidden md:block group absolute top-1/2 -translate-y-1/2 z-25 transition-all duration-300 ${
                !isRightPanelCollapsed
                  ? 'opacity-100 pointer-events-auto right-[352px]'
                  : isMobileControlsOpen || isTourGuideOpen || isGeminiAssistantOpen
                  ? 'right-4 opacity-0 pointer-events-none'
                  : 'right-4 opacity-100 pointer-events-auto'
              }`}
            >
              {/* Floating Tooltip Readout on Hover or Active Drag (Desktop) */}
              <div
                className={`hidden md:flex items-center gap-2 absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-[#171817]/95 backdrop-blur-xl border border-[#C9A46A]/35 shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-200 ${
                  isDraggingExplode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <span className="text-[10.5px] font-medium text-[#D8C9A9]">
                  {lang === 'en' ? '3D Exploded' : lang === 'zh' ? '3D 拆解' : 'Bóc tách 3D'}
                </span>
                <span className="text-[10.5px] font-semibold text-[#C9A46A] tabular-nums">
                  {Math.round(explodedFactor * 100)}%
                </span>
              </div>

              {/* Slender Heritage Obsidian Capsule */}
              <div className="flex flex-col items-center gap-2 py-2.5 px-1.5 rounded-full bg-[#171817]/80 backdrop-blur-xl border border-[#C9A46A]/25 shadow-[0_14px_34px_rgba(0,0,0,0.55)]">
                {/* Live Percentage Readout */}
                <span
                  className={`text-[10px] font-semibold tabular-nums leading-none transition-colors select-none ${
                    explodedFactor > 0.005 ? 'text-[#C9A46A]' : 'text-[#D8C9A9]/75'
                  }`}
                >
                  {Math.round(explodedFactor * 100)}%
                </span>

                {/* Vertical Interactive Seek Rail (Bottom 0% -> Top 100%) */}
                <div
                  ref={explodeTrackRef}
                  role="slider"
                  tabIndex={0}
                  aria-label={
                    lang === 'en'
                      ? '3D Exploded View level'
                      : lang === 'zh'
                      ? '3D 结构拆解层级'
                      : 'Mức độ Bóc tách 3D'
                  }
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(explodedFactor * 100)}
                  aria-valuetext={`${Math.round(explodedFactor * 100)}%`}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                      e.preventDefault();
                      handleLiveExplodeChange(explodedFactorRef.current + 0.05);
                    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                      e.preventDefault();
                      handleLiveExplodeChange(explodedFactorRef.current - 0.05);
                    } else if (e.key === 'PageUp') {
                      e.preventDefault();
                      handleLiveExplodeChange(explodedFactorRef.current + 0.15);
                    } else if (e.key === 'PageDown') {
                      e.preventDefault();
                      handleLiveExplodeChange(explodedFactorRef.current - 0.15);
                    } else if (e.key === 'Home') {
                      e.preventDefault();
                      handleLiveExplodeChange(0);
                    } else if (e.key === 'End') {
                      e.preventDefault();
                      handleLiveExplodeChange(1);
                    }
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    isDraggingExplodeRef.current = true;
                    setIsDraggingExplode(true);
                    updateExplodeFromClientY(e.clientY);
                  }}
                  onPointerMove={(e) => {
                    if (!isDraggingExplodeRef.current) return;
                    e.stopPropagation();
                    updateExplodeFromClientY(e.clientY);
                  }}
                  onPointerUp={(e) => {
                    if (!isDraggingExplodeRef.current) return;
                    e.stopPropagation();
                    isDraggingExplodeRef.current = false;
                    setIsDraggingExplode(false);
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    }
                  }}
                  onPointerCancel={(e) => {
                    isDraggingExplodeRef.current = false;
                    setIsDraggingExplode(false);
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    }
                  }}
                  className="relative w-7 h-36 sm:h-44 flex items-center justify-center touch-none select-none cursor-ns-resize outline-none focus-visible:ring-1 focus-visible:ring-[#C9A46A] rounded-full"
                >
                  {/* Unfilled Base Rail */}
                  <div className="relative w-[3px] h-full rounded-full bg-[#D8C9A9]/15 overflow-visible">
                    {/* Architectural 4-Tier Hairline Marks */}
                    {[0.25, 0.5, 0.75, 1].map((tierMark) => (
                      <span
                        key={tierMark}
                        aria-hidden="true"
                        style={{ bottom: `${tierMark * 100}%` }}
                        className={`absolute left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-[1px] pointer-events-none transition-colors ${
                          explodedFactor >= tierMark - 0.005
                            ? 'bg-[#C9A46A]/85'
                            : 'bg-[#D8C9A9]/25'
                        }`}
                      />
                    ))}

                    {/* Active Fill Rail */}
                    <div
                      style={{ height: `${explodedFactor * 100}%` }}
                      className="absolute bottom-0 inset-x-0 rounded-full bg-gradient-to-t from-[#47796D] to-[#C9A46A]"
                    />

                    {/* Precision Brass Knob */}
                    <div
                      style={{ bottom: `calc(${explodedFactor * 100}% - 7px)` }}
                      className={`absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#C9A46A] border-2 border-[#171817] ring-1 ring-[#D8C9A9]/70 shadow-[0_0_10px_rgba(201,164,106,0.55)] pointer-events-none transition-transform duration-150 ${
                        isDraggingExplode ? 'scale-125' : 'group-hover:scale-110'
                      }`}
                    />
                  </div>
                </div>

                {/* Bottom Quick Toggle Button (0% <-> 100%) */}
                <button
                  type="button"
                  onClick={() => handleLiveExplodeChange(explodedFactor > 0.005 ? 0 : 1)}
                  aria-label={
                    explodedFactor > 0.005
                      ? lang === 'en'
                        ? 'Reset 3D Exploded View'
                        : lang === 'zh'
                        ? '还原 3D 结构'
                        : 'Thu gọn bóc tách 3D'
                      : lang === 'en'
                      ? 'Expand full 3D Exploded View'
                      : lang === 'zh'
                      ? '展开全层 3D 拆解'
                      : 'Mở rộng bóc tách 3D'
                  }
                  title={
                    lang === 'en'
                      ? 'Toggle 3D Exploded View'
                      : lang === 'zh'
                      ? '切换 3D 拆解'
                      : 'Bật/Tắt Bóc tách 3D'
                  }
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    explodedFactor > 0.005
                      ? 'bg-[#C9A46A] text-[#171817]'
                      : 'bg-[#D8C9A9]/10 text-[#D8C9A9]/80 hover:bg-[#C9A46A]/25 hover:text-[#C9A46A]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* INTERACTIVE HOTSPOT PINS ON 3D MODEL (NUMBERS I..VI) */}
          {!isGettyLanding &&
            viewTwinMode === '3d_cad_pbr' &&
            showHotspots &&
            projectedBadges.map((b, idx) => {
              const isSelectedFeat = activeFeature?.id === b.id;
              const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
              const roman = romanNumerals[idx] || String(idx + 1);
              return (
                <button
                  key={`hotspot-pin-${b.id}`}
                  type="button"
                  onClick={() => {
                    flyToFeature(b.feat);
                    if (window.innerWidth >= 768) {
                      setIsRightPanelCollapsed(false);
                    }
                  }}
                  style={{
                    left: `${b.x}px`,
                    top: `${b.y}px`,
                  }}
                  className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center font-serif text-[11px] font-semibold border shadow-lg transition-all hover:scale-110 cursor-pointer ${
                    isSelectedFeat
                      ? 'bg-[#0071E3] text-white border-white scale-110'
                      : 'bg-[#1D1D1F]/90 text-[#F5F5F7] border-white/25 hover:border-[#D4AF37]'
                  }`}
                  title={`${roman}. ${b.feat.name}`}
                >
                  {roman}
                </button>
              );
            })}

          {/* =====================================================================
              SINGLE APPLE VISIONOS BOTTOM FROSTED PILL DOCK (DESKTOP >= 768px)
              [ Dinh Độc Lập ▾ | Nguyên bản | Bóc tách 3D | X-Ray | Nội thất | 🔊 Thuyết minh | ✦ Hỏi Gemini AI ]
             ===================================================================== */}
          {!isGettyLanding && viewTwinMode === '3d_cad_pbr' && (
            <>
            <div
              className={`hidden md:flex fixed bottom-5 left-1/2 -translate-x-1/2 ${
                isSiteDropdownOpen && siteDropdownAnchor === 'bottom' ? 'z-[999]' : 'z-40'
              } pointer-events-auto rounded-full bg-[#1D1D1F]/90 backdrop-blur-2xl border border-white/15 px-2 xl:px-2.5 py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] items-center gap-1 xl:gap-1.5 max-w-[96vw] overflow-visible`}
            >
              {/* 1. Dropdown chọn di tích (mở Popover lên trên) + cặp nút Lùi / Tiến (‹ ›) */}
              <div ref={siteDropdownRef} className="relative z-[999] pointer-events-auto flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (isSiteDropdownOpen && siteDropdownAnchor === 'bottom') {
                      setIsSiteDropdownOpen(false);
                    } else {
                      setSiteDropdownAnchor('bottom');
                      setIsSiteDropdownOpen(true);
                    }
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={isSiteDropdownOpen && siteDropdownAnchor === 'bottom'}
                  className="relative z-[999] pointer-events-auto h-8 px-2.5 xl:px-3 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-[#F5F5F7] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span className="font-sans text-[11px] text-[#C5A059] font-semibold tabular-nums">
                    {String(currentSiteIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate max-w-[105px] sm:max-w-[135px] xl:max-w-[165px]">
                    {localizedCurrentSite.officialName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#86868B] shrink-0 transition-transform ${
                      isSiteDropdownOpen && siteDropdownAnchor === 'bottom' ? 'rotate-180 text-[#C5A059]' : ''
                    }`}
                  />
                </button>

                {/* Cặp nút chuyển nhanh Lùi / Tiến (‹ ›) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handlePrevSite}
                    aria-label={
                      lang === 'en'
                        ? 'Previous monument'
                        : lang === 'zh'
                        ? '上一处遗迹'
                        : 'Di tích trước'
                    }
                    title={
                      lang === 'en'
                        ? 'Previous monument'
                        : lang === 'zh'
                        ? '上一处遗迹'
                        : 'Di tích trước (Lùi)'
                    }
                    className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.18] backdrop-blur-xl border border-white/15 hover:border-[#C5A059]/50 text-[#F5F5F7] flex items-center justify-center text-sm leading-none transition-all cursor-pointer"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSite}
                    aria-label={
                      lang === 'en'
                        ? 'Next monument'
                        : lang === 'zh'
                        ? '下一处遗迹'
                        : 'Di tích tiếp theo'
                    }
                    title={
                      lang === 'en'
                        ? 'Next monument'
                        : lang === 'zh'
                        ? '下一处遗迹'
                        : 'Di tích tiếp theo (Tiến)'
                    }
                    className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.18] backdrop-blur-xl border border-white/15 hover:border-[#C5A059]/50 text-[#F5F5F7] flex items-center justify-center text-sm leading-none transition-all cursor-pointer"
                  >
                    ›
                  </button>
                </div>

                {isSiteDropdownOpen && siteDropdownAnchor === 'bottom' && (
                  <div className="absolute bottom-full left-0 mb-3 w-80 sm:w-[350px] max-w-[calc(100vw-2rem)] z-[999] pointer-events-auto">
                    <HeritageSiteListPanel
                      sites={allSites}
                      selectedSiteId={currentSite.id}
                      showInternalSearch
                      autoFocusSearch
                      showRegionFilters
                      hiddenSiteIds={allSites
                        .filter(
                          (s) =>
                            hiddenSiteIds.includes(s.id) ||
                            cmsOverrides[s.id]?.modelVisibility === 'hidden'
                        )
                        .map((s) => s.id)}
                      canPreviewHidden={canPreviewHidden}
                      headingLabel={
                        lang === 'en'
                          ? 'SWITCH 3D MONUMENT'
                          : lang === 'zh'
                          ? '切换 3D 历史遗迹'
                          : 'CHUYỂN NGỮ CẢNH DI TÍCH 3D'
                      }
                      maxListHeightClass="max-h-[46vh]"
                      onClose={() => setIsSiteDropdownOpen(false)}
                      onSelectSite={(s) => {
                        handleSwitchLandmark(s);
                        setIsSiteDropdownOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="h-4 w-[1px] bg-white/12 shrink-0 hidden sm:block" />

              {/* 2. Chuyển chế độ 3D (Nguyên bản | Bóc tách 3D | X-Ray | Nội thất) */}
              <div className="flex items-center gap-0.5 xl:gap-1 rounded-full bg-white/[0.04] p-0.5 min-w-0 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => handleSelectViewMode('original')}
                  className={`inline-flex items-center justify-center shrink-0 h-8 px-2.5 xl:px-3 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === 'original'
                      ? 'bg-[#F5F5F7] text-black'
                      : 'text-[#86868B] hover:text-[#F5F5F7]'
                  }`}
                >
                  {lang === 'en' ? 'Original' : lang === 'zh' ? '原貌' : 'Nguyên bản'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectViewMode('explode')}
                  className={`inline-flex items-center justify-center gap-1.5 shrink-0 h-8 px-2.5 xl:px-3 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === 'explode'
                      ? 'bg-[#F5F5F7] text-black'
                      : 'text-[#86868B] hover:text-[#F5F5F7]'
                  } ${!sitePermissions.canUse3DAdvanced ? 'opacity-75' : ''}`}
                >
                  {!sitePermissions.canUse3DAdvanced && (
                    <LockGlyph className="w-3 h-3 text-[#C9A46A]" />
                  )}
                  <span>{lang === 'en' ? '3D Exploded' : lang === 'zh' ? '3D拆解' : 'Bóc tách 3D'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectViewMode('xray')}
                  className={`inline-flex items-center justify-center gap-1.5 shrink-0 h-8 px-2.5 xl:px-3 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === 'xray'
                      ? 'bg-[#F5F5F7] text-black'
                      : 'text-[#86868B] hover:text-[#F5F5F7]'
                  } ${!sitePermissions.canUse3DAdvanced ? 'opacity-75' : ''}`}
                >
                  {!sitePermissions.canUse3DAdvanced && (
                    <LockGlyph className="w-3 h-3 text-[#C9A46A]" />
                  )}
                  <span>{lang === 'en' ? 'X-Ray' : lang === 'zh' ? 'X光透视' : 'X-Ray'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectViewMode('interior')}
                  className={`inline-flex items-center justify-center gap-1.5 shrink-0 h-8 px-2.5 xl:px-3 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === 'interior'
                      ? 'bg-[#F5F5F7] text-black'
                      : 'text-[#86868B] hover:text-[#F5F5F7]'
                  } ${!sitePermissions.canUse3DAdvanced ? 'opacity-75' : ''}`}
                >
                  {!sitePermissions.canUse3DAdvanced && (
                    <LockGlyph className="w-3 h-3 text-[#C9A46A]" />
                  )}
                  <span>{lang === 'en' ? 'Interior' : lang === 'zh' ? '室内' : 'Nội thất'}</span>
                </button>
              </div>

              {/* 2b. Nút Tự động xoay quanh trục Y */}
              <button
                type="button"
                onClick={handleToggleAutoRotate}
                aria-pressed={autoRotate}
                title={
                  lang === 'en'
                    ? 'Toggle slow 360° Auto-Rotate around Y axis'
                    : lang === 'zh'
                    ? '开启/关闭绕Y轴慢速自动旋转展示'
                    : 'Bật/Tắt Tự động xoay chậm quanh trục Y'
                }
                className={`inline-flex items-center justify-center shrink-0 h-8 px-2.5 xl:px-3 rounded-full text-xs font-medium gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                  autoRotate
                    ? 'bg-[#C9A46A] border-[#C9A46A] text-[#171817] font-semibold shadow-sm'
                    : 'bg-white/[0.06] border-white/10 text-[#D8C9A9]/80 hover:text-[#F5F5F7] hover:bg-white/[0.12]'
                }`}
              >
                <RotateCw
                  className={`w-3.5 h-3.5 shrink-0 ${
                    autoRotate ? 'animate-[spin_6s_linear_infinite]' : ''
                  }`}
                />
                <span>
                  {lang === 'en' ? 'Auto-Rotate' : lang === 'zh' ? '自动旋转' : 'Tự động xoay'}
                </span>
              </button>

              <div className="h-4 w-[1px] bg-white/12 shrink-0 hidden md:block" />

              {/* 3. Nút Thuyết minh & Video Tư Liệu */}
              <button
                type="button"
                onClick={() => {
                  if (!sitePermissions.canUseAudioGuide) {
                    openUpgradePrompt({
                      featureKey: 'audio_guide',
                      siteId: currentSite.id,
                      siteName: localizedCurrentSite.officialName,
                      requiredPlan: sitePermissions.isPlusScopeLockedForSite ? 'pro' : 'plus_or_pro',
                      isPlusScopeMismatch: sitePermissions.isPlusScopeLockedForSite,
                    });
                    return;
                  }
                  if (onOpenAudioModal) {
                    onOpenAudioModal(currentSite);
                  } else {
                    setGuideSubMode('autotour');
                    setIsTourGuideOpen(true);
                    setIsGeminiAssistantOpen(false);
                    setAutoStartTourCounter((c) => c + 1);
                  }
                }}
                className={`hidden sm:inline-flex items-center justify-center shrink-0 h-8 px-2.5 xl:px-3 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-xs font-medium text-[#F5F5F7] gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  !sitePermissions.canUseAudioGuide ? 'opacity-75' : ''
                }`}
              >
                {!sitePermissions.canUseAudioGuide ? (
                  <LockGlyph className="w-3.5 h-3.5 text-[#C9A46A]" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                )}
                <span>{lang === 'en' ? 'Audio' : lang === 'zh' ? '语音' : 'Thuyết minh'}</span>
              </button>

              {onOpenVideoModal && (
                <button
                  type="button"
                  onClick={() => onOpenVideoModal(currentSite)}
                  className="hidden lg:inline-flex items-center justify-center shrink-0 h-8 px-2.5 xl:px-3 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-[#C5A059]/35 text-xs font-medium text-[#F5F5F7] gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Film className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{lang === 'en' ? 'Video' : lang === 'zh' ? '纪录片' : 'Video Tư Liệu'}</span>
                </button>
              )}

              {/* 4. Nút Sử Quan Dấu Ấn */}
              <button
                type="button"
                onClick={() => {
                  const willOpen = !isGeminiAssistantOpen;
                  setIsGeminiAssistantOpen(willOpen);
                  setIsTourGuideOpen(false);
                  if (willOpen) {
                    trackPlatformInteraction('tech_audio_ai', currentSite.id);
                  }
                }}
                className={`inline-flex items-center justify-center shrink-0 h-8 px-3 xl:px-3.5 rounded-full text-xs font-medium gap-1.5 transition-colors cursor-pointer whitespace-nowrap border ${
                  isGeminiAssistantOpen
                    ? 'bg-[#A94F3D] text-[#D8C9A9] border-[#C9A46A]'
                    : 'bg-[#171817] hover:bg-[#A94F3D] text-[#D8C9A9] border-[#C9A46A]/40 hover:border-[#C9A46A]'
                }`}
              >
                <RoyalHistoriographerIcon className="w-[18px] h-[18px] text-[#C9A46A] shrink-0" />
                <span>
                  {lang === 'en'
                    ? 'Royal Historiographer'
                    : lang === 'zh'
                    ? '史官讲解'
                    : 'Sử Quan Dấu Ấn'}
                </span>
              </button>
            </div>

            {/* MOBILE (< 768px) COMPACT BOTTOM CONTROL DOCK + HORIZONTAL 3D DISSECTION BAR + ANATOMY PIN CARD */}
            <div
              className="md:hidden fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex flex-col"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* 1. Compact Closable Mobile Structural Hotspot Callout Card (Zero Model Obstruction) */}
              {activeFeature && !isMobileSheetExpanded && (
                <div className="pointer-events-auto mx-2.5 mb-2 rounded-2xl bg-[#171817]/95 backdrop-blur-xl border border-[#C9A46A]/45 px-3 py-2.5 shadow-2xl flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-[#C9A46A] text-[#171817] font-serif text-[10px] font-bold leading-none shrink-0">
                        {(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][
                          features.findIndex((f) => f.id === activeFeature.id)
                        ] || 'I')}
                      </span>
                      <span className="text-xs font-semibold text-[#F4EFE4] truncate">
                        {activeFeature.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#D8C9A9]/80 leading-relaxed line-clamp-2 m-0">
                      {activeFeature.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveFeature(null)}
                    aria-label={lang === 'en' ? 'Close annotation' : lang === 'zh' ? '关闭注释' : 'Đóng chú thích'}
                    className="w-6 h-6 rounded-full bg-[#222321] border border-[#C9A46A]/35 text-[#D8C9A9] hover:text-[#C9A46A] flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 2. Ultra-Compact Horizontal 3D Architectural Dissection Bar (Replaces bulky w-72 vertical sidebar on mobile) */}
              {isMobileDissectOpen && (
                <div className="pointer-events-auto mx-2.5 mb-2 rounded-2xl bg-[#171817]/95 backdrop-blur-xl border border-[#C9A46A]/45 px-3 py-2.5 shadow-2xl space-y-2">
                  {/* Row 1: Separation / Cutaway Slider (0% - 100%) + Reset/Close X */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-semibold text-[#C9A46A] whitespace-nowrap shrink-0">
                      {mobileDissectStyle === 'section'
                        ? lang === 'en'
                          ? 'Cut Height'
                          : lang === 'zh'
                          ? '剖切高度'
                          : 'Mặt cắt'
                        : lang === 'en'
                        ? 'Dissect'
                        : lang === 'zh'
                        ? '拆解度'
                        : 'Bóc tách'}
                    </span>

                    {mobileDissectStyle === 'section' ? (
                      <input
                        type="range"
                        min="1"
                        max="25"
                        step="0.5"
                        value={sectionHeight}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!sectionCutActive) {
                            sectionCutActiveRef.current = true;
                            viewModeRef.current = 'interior';
                            setSectionCutActive(true);
                            setViewMode('interior');
                          }
                          if (glbSectionControllerRef.current) {
                            customInteriorCutRatioRef.current = 0.2 + ((val - 1) / 24) * 0.75;
                          }
                          setSectionHeight(val);
                          ensureAnimateRunningRef.current?.();
                        }}
                        aria-label={lang === 'en' ? 'Cross-section height' : lang === 'zh' ? '剖切平面高度' : 'Độ cao cắt ngang'}
                        className="flex-1 heritage-range-slider"
                        style={{
                          background: `linear-gradient(to right, #C9A46A ${Math.round(((sectionHeight - 1) / 24) * 100)}%, rgba(23, 24, 23, 0.9) ${Math.round(((sectionHeight - 1) / 24) * 100)}%)`,
                        }}
                      />
                    ) : (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={Math.round(explodedFactor * 100)}
                        onChange={(e) => {
                          const nextFrac = parseInt(e.target.value, 10) / 100;
                          if (mobileDissectStyle === 'wireframe') {
                            renderModeRef.current = 'wireframe';
                            setRenderMode('wireframe');
                          }
                          handleLiveExplodeChange(nextFrac);
                        }}
                        aria-label={lang === 'en' ? 'Dissection level 0 to 100 percent' : lang === 'zh' ? '拆解程度 0% 至 100%' : 'Mức độ bóc tách 0% đến 100%'}
                        className="flex-1 heritage-range-slider"
                        style={{
                          background: `linear-gradient(to right, #C9A46A ${Math.round(explodedFactor * 100)}%, rgba(23, 24, 23, 0.9) ${Math.round(explodedFactor * 100)}%)`,
                        }}
                      />
                    )}

                    <span className="text-[11px] font-mono font-semibold text-[#F4EFE4] tabular-nums w-9 text-right shrink-0">
                      {mobileDissectStyle === 'section'
                        ? `${Math.round(((sectionHeight - 1) / 24) * 100)}%`
                        : `${Math.round(explodedFactor * 100)}%`}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileDissectOpen(false);
                        handleSelectViewMode('original');
                      }}
                      aria-label={lang === 'en' ? 'Close 3D dissection' : lang === 'zh' ? '关闭 3D 拆解' : 'Đóng bóc tách 3D'}
                      className="w-6 h-6 rounded-full bg-[#222321] border border-[#C9A46A]/35 text-[#D8C9A9] hover:text-[#C9A46A] flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Row 2: Scrollable 3 Dissection Mode Buttons (Tách tầng | Cắt ngang | Khung xương) */}
                  <DragScrollRow className="flex items-center gap-1.5 overflow-x-auto flex-nowrap heritage-scrollbar pb-1">
                    {(
                      [
                        {
                          id: 'explode' as const,
                          label: lang === 'en' ? 'Explode Tiers' : lang === 'zh' ? '分层拆解' : 'Tách tầng',
                        },
                        {
                          id: 'section' as const,
                          label: lang === 'en' ? 'Cross-Section' : lang === 'zh' ? '横截面切' : 'Cắt ngang',
                        },
                        {
                          id: 'wireframe' as const,
                          label: lang === 'en' ? 'Skeleton' : lang === 'zh' ? '结构骨架' : 'Khung xương',
                        },
                      ] as const
                    ).map((m) => {
                      const active = mobileDissectStyle === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setMobileDissectStyle(m.id);
                            if (m.id === 'explode') {
                              glbSectionControllerRef.current?.resetModelState();
                              renderModeRef.current = 'textured';
                              sectionCutActiveRef.current = false;
                              customInteriorCutRatioRef.current = null;
                              const f = explodedFactorRef.current > 0.05 ? explodedFactorRef.current : 0.75;
                              explodedFactorRef.current = f;
                              viewModeRef.current = 'explode';
                              setRenderMode('textured');
                              setSectionCutActive(false);
                              setExplodedFactor(f);
                              setViewMode('explode');
                              ensureAnimateRunningRef.current?.();
                            } else if (m.id === 'section') {
                              glbSectionControllerRef.current?.resetModelState();
                              renderModeRef.current = 'textured';
                              sectionCutActiveRef.current = true;
                              explodedFactorRef.current = 0;
                              customInteriorCutRatioRef.current = 0.2 + ((sectionHeight - 1) / 24) * 0.75;
                              viewModeRef.current = 'interior';
                              setRenderMode('textured');
                              setSectionCutActive(true);
                              setExplodedFactor(0);
                              setViewMode('interior');
                              ensureAnimateRunningRef.current?.();
                            } else {
                              glbSectionControllerRef.current?.resetModelState();
                              renderModeRef.current = 'wireframe';
                              sectionCutActiveRef.current = false;
                              customInteriorCutRatioRef.current = null;
                              const f = explodedFactorRef.current > 0.05 ? explodedFactorRef.current : 0.65;
                              explodedFactorRef.current = f;
                              viewModeRef.current = 'explode';
                              setRenderMode('wireframe');
                              setSectionCutActive(false);
                              setExplodedFactor(f);
                              setViewMode('explode');
                              ensureAnimateRunningRef.current?.();
                            }
                          }}
                          className={`shrink-0 flex-1 min-w-[96px] py-1.5 px-2.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap text-center ${
                            active
                              ? 'bg-[#C9A46A] border-[#C9A46A] text-[#171817]'
                              : 'bg-[#222321] border-[#D8C9A9]/15 text-[#D8C9A9]/80 hover:border-[#C9A46A]/50'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </DragScrollRow>

                  {/* Row 3: Scrollable 4 Architectural Layers (Lớp Mái | Thân & Mặt đứng | Lõi Nội thất | Nền móng) */}
                  <DragScrollRow className="flex items-center gap-1.5 overflow-x-auto flex-nowrap heritage-scrollbar pt-0.5 pb-1.5">
                    {(
                      [
                        {
                          tierIdx: 3,
                          label: lang === 'en' ? 'Roof Layer' : lang === 'zh' ? '屋顶层' : 'Lớp Mái',
                        },
                        {
                          tierIdx: 2,
                          label: lang === 'en' ? 'Body & Facade' : lang === 'zh' ? '主体立面' : 'Thân & Mặt đứng',
                        },
                        {
                          tierIdx: 1,
                          label: lang === 'en' ? 'Interior Core' : lang === 'zh' ? '内部核心' : 'Lõi Nội thất',
                        },
                        {
                          tierIdx: 0,
                          label: lang === 'en' ? 'Foundation' : lang === 'zh' ? '地基台座' : 'Nền móng',
                        },
                      ] as const
                    ).map((layer) => {
                      const isLayerOn = tierVisibility[layer.tierIdx];
                      return (
                        <button
                          key={`mob-layer-${layer.tierIdx}`}
                          type="button"
                          onClick={() => {
                            if (mobileDissectStyle === 'section') {
                              setMobileDissectStyle('explode');
                              glbSectionControllerRef.current?.resetModelState();
                              sectionCutActiveRef.current = false;
                              setSectionCutActive(false);
                              const f = explodedFactorRef.current > 0.05 ? explodedFactorRef.current : 0.75;
                              explodedFactorRef.current = f;
                              viewModeRef.current = 'explode';
                              setExplodedFactor(f);
                              setViewMode('explode');
                            }
                            setTierVisibility((prev) => {
                              const next: [boolean, boolean, boolean, boolean] = [...prev] as [
                                boolean,
                                boolean,
                                boolean,
                                boolean,
                              ];
                              next[layer.tierIdx] = !next[layer.tierIdx];
                              // Prevent hiding all 4 tiers simultaneously
                              if (!next.some(Boolean)) {
                                return [true, true, true, true];
                              }
                              tierVisibilityRef.current = next;
                              ensureAnimateRunningRef.current?.();
                              return next;
                            });
                          }}
                          className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-medium border transition-colors cursor-pointer ${
                            isLayerOn
                              ? 'bg-[#47796D]/25 border-[#47796D] text-[#F4EFE4]'
                              : 'bg-[#1C1D1B] border-[#D8C9A9]/15 text-[#D8C9A9]/45 line-through'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isLayerOn ? 'bg-[#C9A46A]' : 'bg-[#D8C9A9]/25'
                            }`}
                          />
                          <span>{layer.label}</span>
                        </button>
                      );
                    })}
                  </DragScrollRow>
                </div>
              )}

              {/* 3. Main Collapsible Bottom Control Dock (Flush to Bottom Edge — Liberates >= 75% 3D Canvas) */}
              <div className="pointer-events-auto bg-[#1C1D1B]/95 backdrop-blur-md border-t border-[#C9A46A]/35 rounded-t-2xl px-3 pt-2.5 pb-3 shadow-[0_-14px_36px_rgba(0,0,0,0.68)]">
                {/* Top Row: Monument Name (1-line) + Expand/Collapse Button ("Chi tiết & Danh sách") */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-[14.5px] font-semibold text-[#F4EFE4] truncate leading-tight">
                      {localizedCurrentSite.officialName}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMobileSheetExpanded((prev) => !prev)}
                    aria-expanded={isMobileSheetExpanded}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#171817] border border-[#C9A46A]/40 hover:border-[#C9A46A] text-[10.5px] font-medium text-[#C9A46A] cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <span>
                      {isMobileSheetExpanded
                        ? lang === 'en'
                          ? 'Collapse'
                          : lang === 'zh'
                          ? '收起'
                          : 'Thu gọn'
                        : lang === 'en'
                        ? 'Details & List'
                        : lang === 'zh'
                        ? '详情与列表'
                        : 'Chi tiết & Danh sách'}
                    </span>
                    {isMobileSheetExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </button>
                </div>

                {/* Expandable Details, 17-Monument Thumbnails & Documentary Video (Hidden by default) */}
                {isMobileSheetExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-[#C9A46A]/20 space-y-2.5 max-h-[44dvh] overflow-y-auto heritage-scrollbar pr-0.5">
                    <div className="flex items-center justify-between gap-2 text-[10.5px] text-[#C9A46A]">
                      <span className="truncate">
                        {currentSite.commencementYear} · {localizedCurrentSite.architecturalStyle}
                      </span>
                      <span className="tabular-nums shrink-0 text-[#D8C9A9]/60">
                        {String(currentSiteIndex + 1).padStart(2, '0')}/{allSites.length}
                      </span>
                    </div>

                    <p className="text-[11.5px] text-[#D8C9A9]/80 line-clamp-3 leading-relaxed m-0">
                      {localizedCurrentSite.summary}
                    </p>

                    {/* Quick Media / Dossier Row (Video Tư Liệu, Hồ sơ, VR 360°) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {onOpenVideoModal && (
                        <button
                          type="button"
                          onClick={() => onOpenVideoModal(currentSite)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#A94F3D] hover:bg-[#8E4132] text-[#F4EFE4] text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-colors"
                        >
                          <Film className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {lang === 'en'
                              ? 'Documentary Video'
                              : lang === 'zh'
                              ? '文献纪录片'
                              : 'Video Tư Liệu'}
                          </span>
                        </button>
                      )}

                      {onOpenDetailModal && (
                        <button
                          type="button"
                          onClick={() => onOpenDetailModal(currentSite)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#171817] border border-[#C9A46A]/35 text-[#D8C9A9] text-[11px] font-medium cursor-pointer whitespace-nowrap"
                        >
                          <Info className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                          <span>{lang === 'en' ? 'Dossier' : lang === 'zh' ? '遗产档案' : 'Hồ sơ Di sản'}</span>
                        </button>
                      )}

                      {customGlbSource.url && !customGlbError && glbLoadedReady && (
                        <button
                          type="button"
                          onClick={() => setIsMobileControlsOpen((prev) => !prev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#171817] border border-[#C9A46A]/30 text-[#C9A46A] text-[11px] font-medium cursor-pointer whitespace-nowrap"
                        >
                          <Sliders className="w-3 h-3 shrink-0" />
                          <span>.GLB</span>
                        </button>
                      )}
                    </div>

                    {/* Optional .GLB Transform Sliders when toggled */}
                    {isMobileControlsOpen && customGlbSource.url && !customGlbError && glbLoadedReady && (
                      <div className="rounded-xl bg-[#171817] border border-[#C9A46A]/25 p-2.5 space-y-2">
                        <div className="flex items-center justify-between text-[10.5px] text-[#C9A46A] font-semibold">
                          <span>
                            {lang === 'en'
                              ? '.GLB Scale & Rotation'
                              : lang === 'zh'
                              ? '.GLB 缩放与旋转'
                              : 'Tỷ lệ & Xoay .GLB'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const reset = resetSite3DTransform(currentSite.id);
                              setGlbScale(reset.scale);
                              setGlbRotationY(reset.rotationY);
                              void pushHeritageSitesToFirebase(true);
                            }}
                            className="text-[10px] text-[#D8C9A9] underline cursor-pointer"
                          >
                            {lang === 'en' ? 'Reset' : lang === 'zh' ? '重置' : 'Đặt lại'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <label className="space-y-1 block">
                            <span className="flex justify-between text-[10px] text-[#D8C9A9]/75 tabular-nums">
                              <span>{lang === 'en' ? 'Scale' : lang === 'zh' ? '缩放' : 'Tỷ lệ'}</span>
                              <span>{glbScale.toFixed(2)}x</span>
                            </span>
                            <input
                              type="range"
                              min="0.25"
                              max="3"
                              step="0.05"
                              value={glbScale}
                              onChange={(e) => {
                                const nextScale = parseFloat(e.target.value);
                                setGlbScale(nextScale);
                                saveSite3DTransform(currentSite.id, nextScale, glbRotationY);
                                void pushHeritageSitesToFirebase(false);
                              }}
                              className="w-full heritage-range-slider"
                            />
                          </label>
                          <label className="space-y-1 block">
                            <span className="flex justify-between text-[10px] text-[#D8C9A9]/75 tabular-nums">
                              <span>{lang === 'en' ? 'Rot Y' : lang === 'zh' ? '旋转 Y' : 'Xoay Y'}</span>
                              <span>{glbRotationY}°</span>
                            </span>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              step="1"
                              value={glbRotationY}
                              onChange={(e) => {
                                const nextRot = parseInt(e.target.value, 10);
                                setGlbRotationY(nextRot);
                                saveSite3DTransform(currentSite.id, glbScale, nextRot);
                                void pushHeritageSitesToFirebase(false);
                              }}
                              className="w-full heritage-range-slider"
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Circular Thumbnails Row for Quick 17-Monument Switching */}
                    <DragScrollRow className="flex items-center gap-2.5 overflow-x-auto flex-nowrap heritage-scrollbar py-1 pb-2">
                      {allSites.map((s, idx) => {
                        const active = s.id === currentSite.id;
                        const locS = getLocalizedSite(s);
                        const thumbUrl = s.photos?.[0] || '';
                        return (
                          <button
                            key={`mob-3d-thumb-${s.id}`}
                            type="button"
                            onClick={() => handleSwitchLandmark(s)}
                            title={locS.officialName}
                            aria-label={locS.officialName}
                            className="shrink-0 cursor-pointer group flex flex-col items-center gap-1 w-12"
                          >
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={locS.officialName}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                className={`w-11 h-11 rounded-full object-cover transition-all ${
                                  active
                                    ? 'ring-2 ring-[#C9A46A] scale-105'
                                    : 'border border-[#D8C9A9]/25 opacity-75 group-hover:opacity-100'
                                }`}
                              />
                            ) : (
                              <span
                                className={`w-11 h-11 rounded-full bg-[#222321] flex items-center justify-center text-xs font-semibold tabular-nums ${
                                  active
                                    ? 'ring-2 ring-[#C9A46A] text-[#C9A46A]'
                                    : 'border border-[#D8C9A9]/25 text-[#D8C9A9]/75'
                                }`}
                              >
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </DragScrollRow>
                  </div>
                )}

                {/* Bottom Row: Unified Single-Line Smooth Horizontal Scrollable 3D Tool Strip */}
                <DragScrollRow className="flex items-center gap-2 overflow-x-auto flex-nowrap heritage-scrollbar pt-2 pb-1.5 mt-2 border-t border-[#C9A46A]/15">
                  {/* 1. Bóc tách 3D */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!sitePermissions.canUse3DAdvanced) {
                        handleSelectViewMode('explode');
                        return;
                      }
                      if (isMobileDissectOpen) {
                        setIsMobileDissectOpen(false);
                        handleSelectViewMode('original');
                      } else {
                        setIsMobileSheetExpanded(false);
                        setMobileDissectStyle('explode');
                        setIsMobileDissectOpen(true);
                        if (viewMode !== 'explode') {
                          handleSelectViewMode('explode');
                        }
                      }
                    }}
                    className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold border transition-colors cursor-pointer ${
                      isMobileDissectOpen || viewMode === 'explode'
                        ? 'bg-[#C9A46A] border-[#C9A46A] text-[#171817]'
                        : 'bg-[#171817] border-[#C9A46A]/40 text-[#D8C9A9] hover:border-[#C9A46A]'
                    } ${!sitePermissions.canUse3DAdvanced ? 'opacity-75' : ''}`}
                  >
                    {!sitePermissions.canUse3DAdvanced ? (
                      <LockGlyph className="w-3 h-3 text-[#C9A46A] shrink-0" />
                    ) : (
                      <Layers className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>
                      {lang === 'en' ? 'Dissect 3D' : lang === 'zh' ? '3D 拆解' : 'Bóc tách 3D'}
                    </span>
                  </button>

                  {/* 2. X-Ray */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileDissectOpen(false);
                      handleSelectViewMode(viewMode === 'xray' ? 'original' : 'xray');
                    }}
                    className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium border transition-colors cursor-pointer ${
                      viewMode === 'xray'
                        ? 'bg-[#526D8B] border-[#C9A46A] text-[#F4EFE4] font-semibold'
                        : 'bg-[#171817] border-[#D8C9A9]/20 text-[#D8C9A9] hover:border-[#C9A46A]/55'
                    } ${!sitePermissions.canUse3DAdvanced ? 'opacity-75' : ''}`}
                  >
                    {!sitePermissions.canUse3DAdvanced ? (
                      <LockGlyph className="w-3 h-3 text-[#C9A46A] shrink-0" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>X-Ray</span>
                  </button>

                  {/* 3. Nội thất */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileDissectOpen(false);
                      handleSelectViewMode(viewMode === 'interior' ? 'original' : 'interior');
                    }}
                    className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium border transition-colors cursor-pointer ${
                      viewMode === 'interior' && !isMobileDissectOpen
                        ? 'bg-[#47796D] border-[#C9A46A] text-[#F4EFE4] font-semibold'
                        : 'bg-[#171817] border-[#D8C9A9]/20 text-[#D8C9A9] hover:border-[#C9A46A]/55'
                    } ${!sitePermissions.canUse3DAdvanced ? 'opacity-75' : ''}`}
                  >
                    {!sitePermissions.canUse3DAdvanced ? (
                      <LockGlyph className="w-3 h-3 text-[#C9A46A] shrink-0" />
                    ) : (
                      <Box className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{lang === 'en' ? 'Interior' : lang === 'zh' ? '内部空间' : 'Nội thất'}</span>
                  </button>

                  {/* 4. Thuyết minh */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!sitePermissions.canUseAudioGuide) {
                        openUpgradePrompt({
                          featureKey: 'audio_guide',
                          siteId: currentSite.id,
                          siteName: localizedCurrentSite.officialName,
                          requiredPlan: sitePermissions.isPlusScopeLockedForSite
                            ? 'pro'
                            : 'plus_or_pro',
                          isPlusScopeMismatch: sitePermissions.isPlusScopeLockedForSite,
                        });
                        return;
                      }
                      if (onOpenAudioModal) onOpenAudioModal(currentSite);
                      else {
                        setGuideSubMode('autotour');
                        setIsTourGuideOpen(true);
                      }
                    }}
                    className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium border bg-[#171817] border-[#D8C9A9]/20 text-[#D8C9A9] hover:border-[#C9A46A]/55 transition-colors cursor-pointer ${
                      !sitePermissions.canUseAudioGuide ? 'opacity-75' : ''
                    }`}
                  >
                    {!sitePermissions.canUseAudioGuide ? (
                      <LockGlyph className="w-3 h-3 text-[#C9A46A] shrink-0" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                    )}
                    <span>{lang === 'en' ? 'Audio' : lang === 'zh' ? '语音导览' : 'Thuyết minh'}</span>
                  </button>

                  {/* 5. Ánh sáng (Cycles: Studio -> Ngày -> Hoàng hôn -> Đêm) */}
                  <button
                    type="button"
                    onClick={() => {
                      const order: LightingMode[] = ['studio', 'day', 'golden', 'night'];
                      const nextMode = order[(order.indexOf(lightingMode) + 1) % order.length];
                      setLightingMode(nextMode);
                    }}
                    className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium border bg-[#171817] border-[#C9A46A]/35 text-[#D8C9A9] hover:border-[#C9A46A] transition-colors cursor-pointer"
                  >
                    {lightingMode === 'night' ? (
                      <Moon className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                    ) : lightingMode === 'golden' ? (
                      <Sunrise className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                    )}
                    <span>
                      {lang === 'en'
                        ? `Light: ${
                            lightingMode === 'studio'
                              ? 'Studio'
                              : lightingMode === 'day'
                              ? 'Day'
                              : lightingMode === 'golden'
                              ? 'Sunset'
                              : 'Night'
                          }`
                        : lang === 'zh'
                        ? `光照: ${
                            lightingMode === 'studio'
                              ? '展馆'
                              : lightingMode === 'day'
                              ? '白天'
                              : lightingMode === 'golden'
                              ? '黄昏'
                              : '夜晚'
                          }`
                        : `Ánh sáng: ${
                            lightingMode === 'studio'
                              ? 'Studio'
                              : lightingMode === 'day'
                              ? 'Ngày'
                              : lightingMode === 'golden'
                              ? 'Hoàng hôn'
                              : 'Đêm'
                          }`}
                    </span>
                  </button>

                  {/* 6. Tự động xoay */}
                  <button
                    type="button"
                    onClick={handleToggleAutoRotate}
                    aria-pressed={autoRotate}
                    className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium border transition-colors cursor-pointer ${
                      autoRotate
                        ? 'bg-[#C9A46A]/20 border-[#C9A46A] text-[#C9A46A] font-semibold'
                        : 'bg-[#171817] border-[#D8C9A9]/20 text-[#D8C9A9]/80'
                    }`}
                  >
                    <RotateCw
                      className={`w-3.5 h-3.5 shrink-0 ${
                        autoRotate ? 'animate-[spin_6s_linear_infinite]' : ''
                      }`}
                    />
                    <span>
                      {lang === 'en' ? 'Auto-Rotate' : lang === 'zh' ? '自动旋转' : 'Tự động xoay'}
                    </span>
                  </button>

                  {/* 7. Video Tư Liệu */}
                  {onOpenVideoModal && (
                    <button
                      type="button"
                      onClick={() => onOpenVideoModal(currentSite)}
                      className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium border bg-[#A94F3D]/25 border-[#A94F3D]/60 text-[#F4EFE4] hover:bg-[#A94F3D]/40 transition-colors cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                      <span>
                        {lang === 'en' ? 'Documentary' : lang === 'zh' ? '文献纪录片' : 'Video Tư Liệu'}
                      </span>
                    </button>
                  )}

                  {/* 8. Sử Quan Dấu Ấn */}
                  <button
                    type="button"
                    onClick={() => {
                      const willOpen = !isGeminiAssistantOpen;
                      setIsGeminiAssistantOpen(willOpen);
                      setIsTourGuideOpen(false);
                      if (willOpen) {
                        trackPlatformInteraction('tech_audio_ai', currentSite.id);
                      }
                    }}
                    className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium border transition-colors cursor-pointer ${
                      isGeminiAssistantOpen
                        ? 'bg-[#A94F3D] border-[#C9A46A] text-[#F4EFE4] font-semibold'
                        : 'bg-[#171817] border-[#C9A46A]/45 text-[#C9A46A] hover:border-[#C9A46A]'
                    }`}
                  >
                    <RoyalHistoriographerIcon size={15} className="w-[15px] h-[15px] text-[#C9A46A] shrink-0" />
                    <span>
                      {lang === 'en'
                        ? 'Royal Historiographer'
                        : lang === 'zh'
                        ? '史官讲解'
                        : 'Sử Quan Dấu Ấn'}
                    </span>
                  </button>
                </DragScrollRow>
              </div>
            </div>
            </>
          )}
        </div>

        {/* =======================================================================
            NGĂN KÉO KÍNH MỜ BÊN PHẢI (APPLE VISIONOS FROSTED DRAWER)
            Mặc định ẩn để 3D chiếm 100% khung hình; trượt ra khi bấm ghim hoặc "Chi tiết"
           ======================================================================= */}
        {!isGettyLanding && !isRightPanelCollapsed && (
          <aside className="hidden md:flex absolute top-16 right-4 bottom-24 w-80 rounded-[24px] bg-[#1D1D1F]/90 backdrop-blur-2xl border border-white/10 p-5 overflow-y-auto ar-modal-scrollbar z-30 shadow-[0_24px_60px_rgba(0,0,0,0.85)] flex-col justify-between select-text animate-apple-sheet">
            {(() => {
              const eras = getChateauErasForSite(currentSite);
              const activeEra = eras[selectedEraIndex] || eras[eras.length - 1];
              const displayFeature = activeFeature || features[0] || null;

              return (
                <div className="space-y-4">
                  {/* Drawer Header + Nút Đóng X */}
                  <div className="flex items-start justify-between gap-2 border-b border-white/[0.08] pb-3.5">
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-[#D4AF37] block tabular-nums">
                        {currentSite.commencementYear} · {localizedCurrentSite.address.city}
                      </span>
                      <h3 className="font-serif text-base font-semibold text-[#F5F5F7] tracking-tight truncate mt-0.5">
                        {localizedCurrentSite.officialName}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRightPanelCollapsed(true)}
                      className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-[#86868B] hover:text-[#F5F5F7] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                      aria-label={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Selector Giai đoạn Lịch sử gọn đẹp */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsEraMenuOpen((v) => !v)}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 hover:border-white/25 text-xs text-[#F5F5F7] flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{activeEra.shortPeriod}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[#86868B] transition-transform ${isEraMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isEraMenuOpen && (
                      <div className="mt-1.5 rounded-xl bg-[#161618] border border-white/10 p-1 space-y-0.5">
                        {eras.map((era, idx) => (
                          <button
                            key={era.id}
                            type="button"
                            onClick={() => {
                              setSelectedEraIndex(idx);
                              setIsEraMenuOpen(false);
                              setLightingMode(idx === 0 || idx === 3 ? 'golden' : 'studio');
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                              idx === selectedEraIndex ? 'bg-[#0071E3] text-white' : 'text-[#86868B] hover:text-[#F5F5F7]'
                            }`}
                          >
                            {era.shortPeriod}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Kiến trúc sư & Niên đại */}
                  <div className="rounded-2xl bg-black/35 border border-white/[0.06] p-3.5 space-y-2">
                    <div className="text-xs font-semibold text-[#F5F5F7]">
                      {lang === 'vi' ? activeEra.figureName : localizedCurrentSite.architect}
                    </div>
                    <div className="text-[11px] text-[#D4AF37]">
                      {lang === 'vi' ? activeEra.figureRole : localizedCurrentSite.architecturalStyle}
                    </div>
                    <p className="text-xs text-[#86868B] leading-relaxed">
                      {lang === 'vi' ? activeEra.archNote : localizedCurrentSite.summary}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onOpenDetailModal && onOpenDetailModal(currentSite)}
                        className="text-xs font-medium text-[#0071E3] hover:underline cursor-pointer"
                      >
                        {lang === 'en'
                          ? 'Open Full Dossier ↗'
                          : lang === 'zh'
                          ? '打开完整遗产档案 ↗'
                          : 'Mở hồ sơ gốc ↗'}
                      </button>
                    </div>
                  </div>

                  {/* .GLB Scale & Rotation Y Sliders */}
                  {customGlbSource.url && !customGlbError && glbLoadedReady && (
                    <div className="rounded-sm bg-[#171817] border border-[#C9A46A]/40 p-3.5 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#C9A46A]">
                          {lang === 'en'
                            ? '.GLB Scale & Rotation Y'
                            : lang === 'zh'
                            ? '.GLB 缩放与 Y 轴旋转'
                            : 'Điều chỉnh Mô hình .GLB'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const reset = resetSite3DTransform(currentSite.id);
                            setGlbScale(reset.scale);
                            setGlbRotationY(reset.rotationY);
                            void pushHeritageSitesToFirebase(true);
                          }}
                          className="text-[11px] text-[#D8C9A9] underline cursor-pointer"
                        >
                          {lang === 'en' ? 'Reset' : lang === 'zh' ? '重置' : 'Đặt lại'}
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-[#D8C9A9]/80">
                          <span>{lang === 'en' ? 'Scale' : lang === 'zh' ? '缩放比例' : 'Tỷ lệ (Scale)'}</span>
                          <span className="text-[#D8C9A9] font-sans font-medium tabular-nums">
                            {glbScale.toFixed(2)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.25"
                          max="3"
                          step="0.05"
                          value={glbScale}
                          onChange={(e) => {
                            const nextScale = parseFloat(e.target.value);
                            setGlbScale(nextScale);
                            saveSite3DTransform(currentSite.id, nextScale, glbRotationY);
                            void pushHeritageSitesToFirebase(false);
                          }}
                          className="w-full accent-[#C9A46A] cursor-pointer h-1.5"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-[#D8C9A9]/80">
                          <span>{lang === 'en' ? 'Rotation Y' : lang === 'zh' ? 'Y 轴旋转' : 'Xoay trục Y'}</span>
                          <span className="text-[#D8C9A9] font-sans font-medium tabular-nums">
                            {glbRotationY}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="1"
                          value={glbRotationY}
                          onChange={(e) => {
                            const nextRot = parseInt(e.target.value, 10);
                            setGlbRotationY(nextRot);
                            saveSite3DTransform(currentSite.id, glbScale, nextRot);
                            void pushHeritageSitesToFirebase(false);
                          }}
                          className="w-full accent-[#C9A46A] cursor-pointer h-1.5"
                        />
                      </div>
                    </div>
                  )}

                  {/* Thanh kéo Mặt cắt & Bóc tách 3D */}
                  {(sectionCutActive || explodedFactor > 0 || renderMode === 'xray') && (
                    <div className="rounded-2xl bg-black/40 border border-white/10 p-3.5 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#F5F5F7]">
                          {lang === 'en'
                            ? '3D Cutaway & Exploded View'
                            : lang === 'zh'
                            ? '3D 剖面与结构拆解'
                            : 'Mặt cắt & Bóc tách 3D'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelectViewMode('original')}
                          className="text-[11px] text-[#0071E3] hover:underline cursor-pointer"
                        >
                          {lang === 'en' ? 'Reset' : lang === 'zh' ? '重置' : 'Đặt lại'}
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-[#86868B]">
                          <span>
                            {lang === 'en'
                              ? 'Section Cut Elevation'
                              : lang === 'zh'
                              ? '剖切平面高度'
                              : 'Cao độ mặt cắt'}
                          </span>
                          <span className="text-[#F5F5F7] font-sans font-medium tabular-nums">{sectionHeight}m</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="25"
                          step="0.5"
                          value={sectionHeight}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!sectionCutActive) {
                              sectionCutActiveRef.current = true;
                              viewModeRef.current = 'interior';
                              setSectionCutActive(true);
                              setViewMode('interior');
                            }
                            if (glbSectionControllerRef.current) {
                              customInteriorCutRatioRef.current = 0.2 + ((val - 1) / 24) * 0.75;
                            }
                            setSectionHeight(val);
                            ensureAnimateRunningRef.current?.();
                          }}
                          className="w-full accent-[#0071E3] cursor-pointer h-1.5"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-[#86868B]">
                          <span>
                            {lang === 'en'
                              ? 'Structural Separation'
                              : lang === 'zh'
                              ? '结构分层间距'
                              : 'Tách lớp kết cấu'}
                          </span>
                          <span className="text-[#F5F5F7] font-sans font-medium tabular-nums">{Math.round(explodedFactor * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={explodedFactor}
                          onChange={(e) => {
                            handleLiveExplodeChange(parseFloat(e.target.value));
                          }}
                          className="w-full accent-[#C9A46A] cursor-pointer h-1.5"
                        />
                      </div>
                    </div>
                  )}

                  {/* Danh sách Điểm nhấn Kiến trúc */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#F5F5F7]">
                        {lang === 'en'
                          ? `Architectural Highlights (${features.length})`
                          : lang === 'zh'
                          ? `建筑核心看点 (${features.length})`
                          : `Điểm nhấn kiến trúc (${features.length})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowHotspots(!showHotspots)}
                        className="text-[11px] text-[#86868B] hover:text-[#F5F5F7] cursor-pointer"
                      >
                        {showHotspots
                          ? lang === 'en'
                            ? 'Hide Pins'
                            : lang === 'zh'
                            ? '隐藏图钉'
                            : 'Ẩn ghim'
                          : lang === 'en'
                          ? 'Show Pins'
                          : lang === 'zh'
                          ? '显示图钉'
                          : 'Hiện ghim'}
                      </button>
                    </div>
                    <div className="space-y-1">
                      {features.map((feat, idx) => {
                        const isFeatActive = (activeFeature?.id || features[0]?.id) === feat.id;
                        const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
                        const roman = romanNumerals[idx] || `${idx + 1}`;
                        return (
                          <button
                            key={feat.id}
                            type="button"
                            onClick={() => {
                              flyToFeature(feat);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-start gap-2.5 cursor-pointer ${
                              isFeatActive
                                ? 'bg-[#0071E3]/20 border border-[#0071E3]/50 text-[#F5F5F7]'
                                : 'bg-black/30 border border-transparent hover:bg-white/[0.06] text-[#86868B]'
                            }`}
                          >
                            <span className="font-serif text-[12px] font-medium text-[#D4AF37] pt-0.5">{roman}</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-[#F5F5F7] truncate">{feat.name}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Đối chiếu Ảnh thật & Góc nhìn */}
                  {displayFeature && (
                    <div className="rounded-2xl bg-black/35 border border-white/[0.06] overflow-hidden">
                      <div className="px-3 py-2 bg-black/50 border-b border-white/[0.08] flex items-center justify-between gap-2">
                        <span className="text-[11px] font-sans font-medium text-[#D8C9A9]/85 truncate">
                          {lang === 'en'
                            ? 'Real-World Comparison'
                            : lang === 'zh'
                            ? '实景对比参照'
                            : 'Đối chiếu Ảnh chụp thật'}
                        </span>
                        <div className="inline-flex items-center rounded-full bg-white/[0.06] border border-white/15 p-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveViewerPhotoIdx(0)}
                            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-sans font-semibold tabular-nums transition-colors cursor-pointer ${
                              activeViewerPhotoIdx === 0
                                ? 'bg-[#C9A46A] text-[#171817]'
                                : 'text-[#D8C9A9]/80 hover:text-white'
                            }`}
                          >
                            {lang === 'en' ? 'Photo 01' : lang === 'zh' ? '实景 01' : 'Ảnh 01'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveViewerPhotoIdx(1)}
                            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-sans font-semibold tabular-nums transition-colors cursor-pointer ${
                              activeViewerPhotoIdx === 1
                                ? 'bg-[#C9A46A] text-[#171817]'
                                : 'text-[#D8C9A9]/80 hover:text-white'
                            }`}
                          >
                            {lang === 'en' ? 'Photo 02' : lang === 'zh' ? '实景 02' : 'Ảnh 02'}
                          </button>
                        </div>
                      </div>
                      <div className="relative aspect-video w-full">
                        {activeViewerPhoto && !viewerPhotoFailed ? (
                          <>
                            <HeritageSmoothImage
                              src={activeViewerPhoto}
                              alt={displayFeature.name}
                              loading="lazy"
                              waitTone="dark"
                              onError={() => setViewerPhotoFailed(true)}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                            <div className="absolute bottom-2 left-3 right-3">
                              <div className="text-xs font-medium text-[#F5F5F7]">
                                {displayFeature.name}
                              </div>
                              <div className="text-[10.5px] text-[#D8C9A9]/85 truncate mt-0.5">
                                {getSitePhotoCaption(
                                  currentSite,
                                  activeViewerPhotoIdx,
                                  (lang as 'vi' | 'en' | 'zh') || 'vi'
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <HeritageTypographicPlate
                            site={currentSite}
                            variant="detail"
                            subtitleOverride={displayFeature.name}
                          />
                        )}
                      </div>
                      <div className="p-3 space-y-2.5">
                        <p className="text-xs text-[#86868B] leading-relaxed">{displayFeature.description}</p>
                        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                          {(['iso', 'front', 'top'] as const).map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleSetPreset(preset)}
                              className={`py-1.5 rounded-lg text-center cursor-pointer transition-colors ${
                                cameraPreset === preset
                                  ? 'bg-[#F5F5F7] text-black font-medium'
                                  : 'bg-white/[0.06] text-[#86868B] hover:text-[#F5F5F7]'
                              }`}
                            >
                              {preset === 'iso'
                                ? lang === 'en'
                                  ? 'Isometric'
                                  : lang === 'zh'
                                  ? '轴测视图'
                                  : 'Phối cảnh'
                                : preset === 'front'
                                ? lang === 'en'
                                  ? 'Elevation'
                                  : lang === 'zh'
                                  ? '正立面'
                                  : 'Mặt đứng'
                                : lang === 'en'
                                ? 'Top Plan'
                                : lang === 'zh'
                                ? '俯视平面'
                                : 'Mặt bằng'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </aside>
        )}
      </div>

      {/* 7. CREDITS / METADATA MODAL */}
      {showCreditsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowCreditsModal(false)}
        >
          <div
            className="bg-[#181614] border border-[#C5A059]/40 max-w-md w-full p-6 text-left space-y-4 shadow-2xl text-[#F5EFE6]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#F2EFE9]/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-serif font-bold text-base text-[#F5EFE6]">
                  {lang === 'en'
                    ? '3D Model Copyright & Attribution'
                    : lang === 'zh'
                    ? '3D 模型版权与档案信息'
                    : 'Hồ sơ bản quyền mô hình 3D'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreditsModal(false)}
                className="text-[#A39E93] hover:text-[#F4F1EA] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2.5 text-xs leading-relaxed">
              <div>
                <span className="text-[#C5A059] font-sans font-medium block text-[11px]">
                  {lang === 'en'
                    ? 'Heritage Monument:'
                    : lang === 'zh'
                    ? '文化遗产工程：'
                    : 'Công trình di tích:'}
                </span>
                <span className="font-semibold text-sm">{localizedCurrentSite.officialName}</span>
              </div>
              <div>
                <span className="text-[#C5A059] font-sans font-medium block text-[11px]">
                  {lang === 'en'
                    ? 'Distribution License:'
                    : lang === 'zh'
                    ? '授权许可协议：'
                    : 'Giấy phép phân phối:'}
                </span>
                <span className="font-sans">
                  {lang === 'en'
                    ? 'CC BY-NC-SA 4.0 / Southern Heritage Digital Archive'
                    : lang === 'zh'
                    ? 'CC BY-NC-SA 4.0 / 东南部遗产数字典藏数据库'
                    : 'CC BY-NC-SA 4.0 / Cơ sở dữ liệu Di sản Đông Nam Bộ'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. HƯỚNG DẪN VIÊN 3D & THUYẾT MINH PANEL */}
      <VirtualTourGuidePanel
        isOpen={isTourGuideOpen}
        onClose={() => setIsTourGuideOpen(false)}
        currentSite={currentSite}
        stations={features}
        onFlyToStation={(station) => {
          flyToFeature(station);
        }}
        onSetRenderMode={(mode) => {
          switchToThreeJs(mode);
        }}
        onSetExplodedFactor={(factor) => {
          setExplodedFactor(factor);
        }}
        onSwitchSite={(site) => {
          handleSwitchLandmark(site);
        }}
        onOpenBookingModal={() => setIsStartupBookingOpen(true)}
        initialActiveRouteId={activeStartupRouteId}
        initialSubMode={guideSubMode}
        autoStartTourCounter={autoStartTourCounter}
      />

      {/* 9. MODAL ĐẶT VÉ & HỌC LIỆU SỐ */}
      <StartupBookingModal
        isOpen={isStartupBookingOpen}
        onClose={() => setIsStartupBookingOpen(false)}
        onStartDemoTour={(routeId) => {
          setIsStartupBookingOpen(false);
          if (routeId) {
            setActiveStartupRouteId(routeId);
          }
          setGuideSubMode('autotour');
          setIsTourGuideOpen(true);
          setAutoStartTourCounter((c) => c + 1);
        }}
      />

      {/* 10. TRỢ LÝ GIÁM TUYẾN AI — SPATIAL LIVING DOCENT 3D */}
      <GeminiHeritageAssistant
        isOpen={isGeminiAssistantOpen}
        onClose={() => {
          setIsGeminiAssistantOpen(false);
          setSpatialSpotlight(null);
          setIsMysteryModeActive(false);
        }}
        currentSite={currentSite}
        sites={allSites}
        onSwitchSite={(targetSite) => {
          handleSwitchLandmark(targetSite);
        }}
        onSetLightingMode={(mode) => {
          setLightingMode(mode);
        }}
        hotspots={features}
        onFlyToHotspot={(hotspot) => {
          flyToFeature(hotspot);
          setSpatialSpotlight({ position: hotspot.targetPos, label: hotspot.name });
        }}
        onSetRenderMode={(mode) => {
          switchToThreeJs(mode);
        }}
        onSetExplodedFactor={(factor) => {
          setExplodedFactor(factor);
        }}
        onSetSpatialSpotlight={(pos, label) => {
          setSpatialSpotlight({ position: pos, label });
        }}
        onClearSpatialSpotlight={() => {
          setSpatialSpotlight(null);
          setIsMysteryModeActive(false);
          setExplodedFactor(0);
          setRenderMode('textured');
          handleSetPreset('iso');
        }}
        isMysteryModeActive={isMysteryModeActive}
        onToggleMysteryMode={(active) => {
          setIsMysteryModeActive(active);
          if (!active) {
            setMysteryRayClickEvent(null);
          }
        }}
        mysteryRayClickEvent={mysteryRayClickEvent}
        onNavigateToTickets={onNavigateToTickets}
        onTriggerAutoTour={() => {
          setGuideSubMode('autotour');
          setIsTourGuideOpen(true);
          setAutoStartTourCounter((c) => c + 1);
        }}
      />
    </div>
  );
};

// Return landmark-specific curatorial feature points
