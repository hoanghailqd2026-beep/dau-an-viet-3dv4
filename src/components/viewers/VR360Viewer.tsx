// =========================================================================
// SAIGON HERITAGE - BẢN ĐỒ DI SẢN VĂN HÓA VẬT THỂ TP.HCM
// CHẾ ĐỘ TOÀN CẢNH VR 360° THỰC ĐỊA (MUSEUM GRADE FIELD VIRTUAL TOUR)
// DỮ LIỆU TỪ panoramas.json - KHÔNG CẢNH GIẢ - KHÔNG ĐƯỜNG DẪN 404 - KHÔNG MÀN HÌNH ĐEN
// =========================================================================

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { HeritageSite } from '../../types/heritage';
import { HERITAGE_SITES } from '../../data/heritageSites';
import {
  PanoramaViewpoint,
  PanoramaHotspot,
  getSitePanoramaData,
} from '../../data/panoramaData';
import { useI18n } from '../../i18n/I18nContext';
import { playGalleryGateSound } from '../../utils/galleryGateAudio';
import { HeritageTypographicPlate } from '../common/HeritageTypographicPlate';
import { HeritageSmoothImage } from '../common/HeritageSmoothImage';
import { HeritageSitePickerDropdown } from '../common/HeritageSiteDropdown';
import {
  RotateCw,
  Compass,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Smartphone,
  Eye,
  Maximize2,
  Minimize2,
  X,
  Share2,
  Download,
  Sun,
  Moon,
  Info,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Box,
  MapPin,
  UploadCloud,
  Check,
  Navigation,
  ArrowUp,
  ExternalLink,
} from 'lucide-react';

interface VR360ViewerProps {
  site: HeritageSite;
  sites?: HeritageSite[];
  onClose?: () => void;
  onSwitchSite?: (site: HeritageSite) => void;
  onLaunch3D?: () => void;
  onOpenAudioGuide?: () => void;
  onOpenDossier?: (site: HeritageSite) => void;
}

interface ProjectedHotspot {
  hotspot: PanoramaHotspot;
  screenX: number;
  screenY: number;
  isVisible: boolean;
  edgeX: number;
  edgeY: number;
  edgeAngle: number;
}

export const VR360Viewer: React.FC<VR360ViewerProps> = ({
  site,
  sites,
  onClose,
  onSwitchSite,
  onLaunch3D,
  onOpenDossier,
}) => {
  const { lang, t } = useI18n();
  const availableSites = sites && sites.length > 0 ? sites : HERITAGE_SITES;

  // Root container ref & Three.js canvas ref
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedExitSoundRef = useRef<boolean>(false);

  // Trigger subtle low-pass filtered 'gallery-gate' transition sound on entering & exiting VR360 viewer
  useEffect(() => {
    hasPlayedExitSoundRef.current = false;
    playGalleryGateSound('enter');
    return () => {
      if (!hasPlayedExitSoundRef.current) {
        hasPlayedExitSoundRef.current = true;
        playGalleryGateSound('exit');
      }
    };
  }, []);

  const handleCloseWithSound = useCallback(() => {
    if (!hasPlayedExitSoundRef.current) {
      hasPlayedExitSoundRef.current = true;
      playGalleryGateSound('exit');
    }
    if (onClose) onClose();
  }, [onClose]);

  const handleLaunch3DWithSound = useCallback(() => {
    if (!hasPlayedExitSoundRef.current) {
      hasPlayedExitSoundRef.current = true;
      playGalleryGateSound('exit');
    }
    if (onLaunch3D) onLaunch3D();
    else if (onClose) onClose();
  }, [onLaunch3D, onClose]);

  // Panorama data for current site (sourced from panoramas.json)
  const sitePanoData = useMemo(() => getSitePanoramaData(site.id), [site.id]);
  const [imageLoadFailed, setImageLoadFailed] = useState<boolean>(false);
  const [imageErrorDetail, setImageErrorDetail] = useState<string | null>(null);
  const [siteThumbFailed, setSiteThumbFailed] = useState<boolean>(false);
  const [hotspotPhotoFailed, setHotspotPhotoFailed] = useState<boolean>(false);

  // Active Viewpoint
  const [activeVpId, setActiveVpId] = useState<string>(() => {
    return sitePanoData.defaultViewpointId || sitePanoData.viewpoints[0]?.id || '';
  });

  // Whenever site changes, reset active viewpoint & image error state
  useEffect(() => {
    setImageLoadFailed(false);
    setImageErrorDetail(null);
    setSiteThumbFailed(false);
    setHotspotPhotoFailed(false);
    const data = getSitePanoramaData(site.id);
    if (data.hasField360 && data.viewpoints.length > 0) {
      setActiveVpId(data.defaultViewpointId || data.viewpoints[0].id);
    } else {
      setActiveVpId('');
    }
  }, [site.id]);

  const currentVp = useMemo<PanoramaViewpoint | null>(() => {
    if (!sitePanoData.hasField360) return null;
    return (
      sitePanoData.viewpoints.find((vp) => vp.id === activeVpId) ||
      sitePanoData.viewpoints[0] ||
      null
    );
  }, [sitePanoData, activeVpId]);

  // Is field 360 photo genuinely available and loaded without 404?
  const isPanoramaUsable = sitePanoData.hasField360 && !!currentVp?.imageUrl && !imageLoadFailed;

  // View state & HUD controls
  const [isLoading, setIsLoading] = useState<boolean>(isPanoramaUsable);
  const [loadProgress, setLoadProgress] = useState<number>(10);
  const [showSiteNameFlash, setShowSiteNameFlash] = useState<boolean>(true);
  const [showGestureTip, setShowGestureTip] = useState<boolean>(true);
  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);
  const [isHighlightsPanelOpen, setIsHighlightsPanelOpen] = useState<boolean>(true);
  const [isMiniMapExpanded, setIsMiniMapExpanded] = useState<boolean>(false);
  const [activeHotspot, setActiveHotspot] = useState<PanoramaHotspot | null>(null);
  const [activeTone, setActiveTone] = useState<'day' | 'evening'>('day');
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [isGyroActive, setIsGyroActive] = useState<boolean>(false);
  const [gyroSupported, setGyroSupported] = useState<boolean>(false);
  const [isVrSplitMode, setIsVrSplitMode] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showContributeModal, setShowContributeModal] = useState<boolean>(false);
  const [contributeSuccess, setContributeSuccess] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Real-time projected hotspots for HTML overlay
  const [projectedHotspots, setProjectedHotspots] = useState<ProjectedHotspot[]>([]);
  const [cameraHeadingDeg, setCameraHeadingDeg] = useState<number>(0);

  // Camera orientation refs (Euler degrees)
  const lonRef = useRef<number>(currentVp ? currentVp.initialLon : 0);
  const latRef = useRef<number>(currentVp ? currentVp.initialLat : 0);
  const fovRef = useRef<number>(currentVp?.initialFov || 75);
  const isInteractingRef = useRef<boolean>(false);
  const lastInteractionTimeRef = useRef<number>(Date.now());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const sphereMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isTransitioningVpRef = useRef<boolean>(false);

  // Hide gesture hint after 5s or upon interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGestureTip(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [site.id]);

  // Flash site name on switch (1.5s)
  useEffect(() => {
    setShowSiteNameFlash(true);
    const timer = setTimeout(() => {
      setShowSiteNameFlash(false);
    }, 1600);
    return () => clearTimeout(timer);
  }, [site.id]);

  // Idle auto-dim timer (4s)
  useEffect(() => {
    const resetIdleTimer = () => {
      setIsHudVisible((prev) => (prev ? prev : true));
      lastInteractionTimeRef.current = Date.now();
    };

    const interval = setInterval(() => {
      if (Date.now() - lastInteractionTimeRef.current > 4000 && !activeHotspot) {
        setIsHudVisible((prev) => (prev ? false : prev));
      }
    }, 1000);

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('pointerdown', resetIdleTimer);
    window.addEventListener('touchstart', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('pointerdown', resetIdleTimer);
      window.removeEventListener('touchstart', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
    };
  }, [activeHotspot]);

  // Check hardware gyroscope support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      setGyroSupported(true);
    }
  }, []);

  // Keyboard navigation & accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      lastInteractionTimeRef.current = Date.now();
      setIsHudVisible(true);

      switch (e.key) {
        case 'ArrowLeft':
          lonRef.current -= 4;
          break;
        case 'ArrowRight':
          lonRef.current += 4;
          break;
        case 'ArrowUp':
          latRef.current = Math.min(85, latRef.current + 3);
          break;
        case 'ArrowDown':
          latRef.current = Math.max(-85, latRef.current - 3);
          break;
        case '+':
        case '=':
          if (cameraRef.current) {
            fovRef.current = Math.max(30, fovRef.current - 5);
            cameraRef.current.fov = fovRef.current;
            cameraRef.current.updateProjectionMatrix();
          }
          break;
        case '-':
        case '_':
          if (cameraRef.current) {
            fovRef.current = Math.min(95, fovRef.current + 5);
            cameraRef.current.fov = fovRef.current;
            cameraRef.current.updateProjectionMatrix();
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          if (activeHotspot) setActiveHotspot(null);
          else if (showContributeModal) setShowContributeModal(false);
          else if (isFullscreen) toggleFullscreen();
          else if (onClose) handleCloseWithSound();
          break;
        case 'n':
        case 'N':
          if (currentVp) {
            lonRef.current = currentVp.northHeadingDeg;
            latRef.current = 0;
          }
          break;
        case ' ':
          e.preventDefault();
          setIsAutoRotate((prev) => !prev);
          break;
        default:
          const num = parseInt(e.key, 10);
          if (!isNaN(num) && num >= 1 && currentVp?.hotspots?.[num - 1]) {
            flyToHotspot(currentVp.hotspots[num - 1]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeHotspot, showContributeModal, isFullscreen, currentVp]);

  // Fullscreen controller
  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Gyroscope orientation listener
  useEffect(() => {
    if (!isGyroActive) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.beta !== null) {
        lonRef.current = (e.alpha + (currentVp?.northHeadingDeg || 0)) % 360;
        latRef.current = Math.max(-80, Math.min(80, (e.beta - 90) * 0.8));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, [isGyroActive, currentVp]);

  const requestGyroPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setIsGyroActive(true);
        }
      } catch (err) {
        console.warn('Gyro permission rejected:', err);
      }
    } else {
      setIsGyroActive(!isGyroActive);
    }
  };

  // Tone lighting toggle (Day / Evening tone mapping exposure)
  useEffect(() => {
    if (!rendererRef.current) return;
    if (activeTone === 'evening') {
      rendererRef.current.toneMappingExposure = 0.72;
    } else {
      rendererRef.current.toneMappingExposure = 1.08;
    }
  }, [activeTone]);

  // Smooth camera flight to hotspot (700ms)
  const flyToHotspot = (hs: PanoramaHotspot) => {
    setActiveHotspot(hs);
    setIsAutoRotate(false);

    const targetLon = (THREE.MathUtils.radToDeg(hs.theta) + 360) % 360;
    const targetLat = THREE.MathUtils.radToDeg(hs.phi);

    const startLon = lonRef.current;
    const startLat = latRef.current;
    const startTime = performance.now();
    const duration = 700;

    let diffLon = (targetLon - (startLon % 360) + 540) % 360 - 180;

    const tween = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      lonRef.current = startLon + diffLon * ease;
      latRef.current = startLat + (targetLat - startLat) * ease;

      if (progress < 1) {
        requestAnimationFrame(tween);
      }
    };

    requestAnimationFrame(tween);
  };

  // Switch Viewpoint with smooth crossfade
  const handleSelectViewpoint = useCallback((vpId: string) => {
    if (vpId === activeVpId || isTransitioningVpRef.current) return;
    const targetVp = sitePanoData.viewpoints.find((v) => v.id === vpId);
    if (!targetVp) return;

    isTransitioningVpRef.current = true;
    setIsLoading(true);
    setLoadProgress(30);

    if (cameraRef.current) {
      fovRef.current = Math.max(40, fovRef.current - 12);
      cameraRef.current.fov = fovRef.current;
      cameraRef.current.updateProjectionMatrix();
    }

    setTimeout(() => {
      setActiveVpId(vpId);
      lonRef.current = targetVp.initialLon;
      latRef.current = targetVp.initialLat;
      fovRef.current = targetVp.initialFov || 75;
      if (cameraRef.current) {
        cameraRef.current.fov = fovRef.current;
        cameraRef.current.updateProjectionMatrix();
      }
      isTransitioningVpRef.current = false;
    }, 450);
  }, [activeVpId, sitePanoData]);

  // Audio Guide Controller
  const toggleAudio = () => {
    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      if (!audioRef.current && site.audioGuide?.[lang === 'en' ? 'en' : 'vn']?.audioUrl) {
        const audio = new Audio(site.audioGuide[lang === 'en' ? 'en' : 'vn'].audioUrl);
        audio.onended = () => setIsPlayingAudio(false);
        audioRef.current = audio;
      }
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      setIsPlayingAudio(true);
    }
  };

  // Download snapshot of current view
  const handleDownloadSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `SaigonHeritage-360-${site.id}-${Date.now()}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  // Share perspective
  const handleSharePerspective = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('site', site.id);
    url.searchParams.set('mode', '360');
    url.searchParams.set('vp', activeVpId);
    url.searchParams.set('lon', Math.round(lonRef.current).toString());
    url.searchParams.set('lat', Math.round(latRef.current).toString());

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url.toString()).then(() => {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2500);
      });
    }
  };

  // =========================================================================
  // MAIN THREE.JS WEBGL 360 EQUIRECTANGULAR ENGINE
  // =========================================================================
  useEffect(() => {
    if (!containerRef.current || !isPanoramaUsable || !currentVp?.imageUrl) {
      setIsLoading(false);
      return;
    }

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    setIsLoading(true);
    setLoadProgress(20);

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(fovRef.current, width / height, 1, 1200);
    cameraRef.current = camera;
    const cameraTarget = new THREE.Vector3();

    // 2. High-performance WebGLRenderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = activeTone === 'evening' ? 0.72 : 1.08;
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // 3. Inverted 360 Sphere Geometry
    const sphereGeo = new THREE.SphereGeometry(500, 64, 36);
    sphereGeo.scale(-1, 1, 1);

    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x141418 });
    sphereMatRef.current = sphereMat;
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);

    // Diagnostics & WebGL Capabilities Check
    const gl = renderer.getContext();
    const maxTextureSize = renderer.capabilities.maxTextureSize;
    const webglRendererName = gl?.getParameter(gl.RENDERER) || 'Standard WebGL';

    console.group('📷 [VR 360° Trắc Địa] Khởi tạo khung nhìn toàn cảnh');
    console.log('🏛 Di tích:', site.officialName, `(Mã số: ${site.identifierCode || site.id})`);
    console.log('🌐 Đường dẫn ảnh toàn cảnh (URL):', currentVp.imageUrl);
    console.log('🖥 Kích thước khung xem:', `${width}x${height}px`);
    console.log('🎮 WebGL GPU Renderer:', webglRendererName);
    console.log('📐 Giới hạn Texture tối đa (Max Texture Size):', maxTextureSize);
    console.groupEnd();

    // 4. Progressive Texture Loader with timeout & robust error diagnostics
    const textureLoader = new THREE.TextureLoader();
    setLoadProgress(45);

    const loadTimeout = setTimeout(() => {
      console.warn('⚠️ [VR 360°] Quá thời gian nạp ảnh (timeout 8s):', currentVp.imageUrl);
      setImageLoadFailed(true);
      setImageErrorDetail(
        `Quá thời gian nạp ảnh (quá 8 giây) từ URL "${currentVp.imageUrl}". Vui lòng kiểm tra lại kết nối mạng hoặc tệp ảnh.`
      );
      setIsLoading(false);
    }, 8000);

    textureLoader.load(
      currentVp.imageUrl,
      (texture) => {
        clearTimeout(loadTimeout);
        const img = texture.image;
        const imgW = img?.naturalWidth || img?.width || 0;
        const imgH = img?.naturalHeight || img?.height || 0;

        console.log('✅ [VR 360°] Tải ảnh toàn cảnh thành công:', {
          monument: site.officialName,
          url: currentVp.imageUrl,
          resolution: `${imgW} × ${imgH} px`,
          aspectRatio: imgH > 0 ? (imgW / imgH).toFixed(2) : 'N/A',
          maxTextureSize,
        });

        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        sphereMat.map = texture;
        sphereMat.needsUpdate = true;
        setLoadProgress(100);
        setTimeout(() => {
          setIsLoading(false);
        }, 120);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const p = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadProgress(Math.max(45, p));
        }
      },
      (err) => {
        clearTimeout(loadTimeout);
        console.error('❌ [VR 360°] Không thể nạp ảnh toàn cảnh (404/CORS/Lỗi WebGL):', {
          monument: site.officialName,
          url: currentVp.imageUrl,
          error: err,
        });

        setImageLoadFailed(true);
        setImageErrorDetail(
          `Không thể tải tệp ảnh từ "${currentVp.imageUrl}". Trình duyệt báo lỗi hoặc tệp không tồn tại (404 Not Found / CORS).`
        );
        setIsLoading(false);
      }
    );

    // 5. Initial slow rotation for 3s
    let initialAutoRotateActive = true;
    const autoRotateTimer = setTimeout(() => {
      initialAutoRotateActive = false;
    }, 3200);

    // 6. Pointer & Mouse Drag Interaction with strict non-passive canvas listeners
    let isUserDragging = false;
    let onPointerDownX = 0;
    let onPointerDownY = 0;
    let onPointerDownLon = 0;
    let onPointerDownLat = 0;

    const dom = renderer.domElement;
    dom.style.touchAction = 'none';
    dom.style.overscrollBehavior = 'contain';
    dom.style.userSelect = 'none';
    dom.style.cursor = 'grab';

    const onPointerDown = (e: MouseEvent) => {
      isUserDragging = true;
      dom.style.cursor = 'grabbing';
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
      isInteractingRef.current = true;
      lastInteractionTimeRef.current = Date.now();
      setIsHudVisible(true);
      setShowGestureTip(false);

      onPointerDownX = e.clientX;
      onPointerDownY = e.clientY;
      onPointerDownLon = lonRef.current;
      onPointerDownLat = latRef.current;
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!isUserDragging) return;
      lastInteractionTimeRef.current = Date.now();
      const deltaX = onPointerDownX - e.clientX;
      const deltaY = e.clientY - onPointerDownY;

      const factor = (fovRef.current / 75) * 0.16;
      lonRef.current = (onPointerDownLon + deltaX * factor + 360) % 360;
      latRef.current = Math.max(-85, Math.min(85, onPointerDownLat + deltaY * factor));
    };

    const onPointerUp = () => {
      isUserDragging = false;
      dom.style.cursor = 'grab';
      if (containerRef.current) containerRef.current.style.cursor = 'grab';
      isInteractingRef.current = false;
    };

    // Wheel event attached directly to canvas with { passive: false } and preventDefault
    // Con lăn trên khung chỉ phóng to/thu nhỏ 360°, không cuộn trang; ngoài khung cuộn bình thường
    const onWheel = (e: WheelEvent) => {
      if (e.cancelable) e.preventDefault();
      lastInteractionTimeRef.current = Date.now();
      setIsHudVisible(true);

      fovRef.current += e.deltaY * 0.05;
      fovRef.current = Math.max(30, Math.min(95, fovRef.current));
      camera.fov = fovRef.current;
      camera.updateProjectionMatrix();
    };

    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Touch controls with { passive: false } attached directly to DOM canvas element
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartLon = 0;
    let touchStartLat = 0;
    let touchDistStart = 0;

    const onTouchStart = (e: TouchEvent) => {
      lastInteractionTimeRef.current = Date.now();
      setIsHudVisible(true);
      setShowGestureTip(false);

      if (e.touches.length === 1) {
        isUserDragging = true;
        dom.style.cursor = 'grabbing';
        if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartLon = lonRef.current;
        touchStartLat = latRef.current;
      } else if (e.touches.length === 2) {
        isUserDragging = false;
        touchDistStart = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.cancelable && (isUserDragging || e.touches.length === 2)) {
        e.preventDefault();
      }
      lastInteractionTimeRef.current = Date.now();

      if (e.touches.length === 1 && isUserDragging) {
        const deltaX = touchStartX - e.touches[0].clientX;
        const deltaY = e.touches[0].clientY - touchStartY;
        const factor = (fovRef.current / 75) * 0.22;
        lonRef.current = (touchStartLon + deltaX * factor + 360) % 360;
        latRef.current = Math.max(-85, Math.min(85, touchStartLat + deltaY * factor));
      } else if (e.touches.length === 2 && touchDistStart > 0) {
        const curDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = touchDistStart - curDist;
        fovRef.current += diff * 0.08;
        fovRef.current = Math.max(30, Math.min(95, fovRef.current));
        camera.fov = fovRef.current;
        camera.updateProjectionMatrix();
        touchDistStart = curDist;
      }
    };

    const onTouchEnd = () => {
      isUserDragging = false;
      dom.style.cursor = 'grab';
      if (containerRef.current) containerRef.current.style.cursor = 'grab';
      touchDistStart = 0;
    };

    dom.addEventListener('touchstart', onTouchStart, { passive: false });
    dom.addEventListener('touchmove', onTouchMove, { passive: false });
    dom.addEventListener('touchend', onTouchEnd);
    dom.addEventListener('touchcancel', onTouchEnd);

    // 7. Animation Loop with requestAnimationFrame (only triggers React state updates when camera orientation changes)
    let lastTime = performance.now();
    let lastProjLon = -9999;
    let lastProjLat = -9999;
    let lastProjFov = -9999;
    const tempHsVec = new THREE.Vector3();

    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (document.hidden) return;

      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if ((isAutoRotate || initialAutoRotateActive) && !isUserDragging) {
        lonRef.current = (lonRef.current + delta * 7.5 + 360) % 360;
      }

      const curLon = lonRef.current;
      const curLat = latRef.current;
      const curFov = fovRef.current;

      const phi = THREE.MathUtils.degToRad(90 - curLat);
      const theta = THREE.MathUtils.degToRad(curLon);

      cameraTarget.x = 500 * Math.sin(phi) * Math.cos(theta);
      cameraTarget.y = 500 * Math.cos(phi);
      cameraTarget.z = 500 * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(cameraTarget);

      renderer.render(scene, camera);

      const hasCameraMoved =
        Math.abs(curLon - lastProjLon) > 0.04 ||
        Math.abs(curLat - lastProjLat) > 0.04 ||
        Math.abs(curFov - lastProjFov) > 0.04;

      if (hasCameraMoved) {
        lastProjLon = curLon;
        lastProjLat = curLat;
        lastProjFov = curFov;

        const trueHeading = (curLon - currentVp.northHeadingDeg + 360) % 360;
        setCameraHeadingDeg(trueHeading);

        // Project 3D Hotspots into 2D Screen Space
        if (currentVp.hotspots && currentVp.hotspots.length > 0) {
          const curW = containerRef.current?.clientWidth || width;
          const curH = containerRef.current?.clientHeight || height;
          const halfW = curW / 2;
          const halfH = curH / 2;

          const projected: ProjectedHotspot[] = currentVp.hotspots.map((hs) => {
            const r = 480;
            tempHsVec.set(
              r * Math.cos(hs.phi) * Math.sin(hs.theta),
              r * Math.sin(hs.phi),
              r * Math.cos(hs.phi) * Math.cos(hs.theta)
            );

            tempHsVec.project(camera);

            const screenX = tempHsVec.x * halfW + halfW;
            const screenY = -tempHsVec.y * halfH + halfH;
            const isInFront = tempHsVec.z < 1;
            const isVisible =
              isInFront &&
              screenX >= 24 &&
              screenX <= curW - 24 &&
              screenY >= 24 &&
              screenY <= curH - 24;

            const centerVecX = screenX - halfW;
            const centerVecY = screenY - halfH;
            const angle = Math.atan2(centerVecY, centerVecX);

            const padding = 36;
            const edgeX = Math.max(padding, Math.min(curW - padding, halfW + Math.cos(angle) * (halfW - padding)));
            const edgeY = Math.max(padding, Math.min(curH - padding, halfH + Math.sin(angle) * (halfH - padding)));

            return {
              hotspot: hs,
              screenX,
              screenY,
              isVisible,
              edgeX,
              edgeY,
              edgeAngle: (angle * 180) / Math.PI + 90,
            };
          });

          setProjectedHotspots(projected);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // 8. Viewport Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Full cleanup of DOM listeners and Three.js memory
    return () => {
      clearTimeout(loadTimeout);
      clearTimeout(autoRotateTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('resize', handleResize);

      if (sphereMat.map) sphereMat.map.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      renderer.dispose();
      if (dom.parentElement) dom.parentElement.removeChild(dom);
    };
  }, [site.id, activeVpId, isPanoramaUsable, currentVp, isAutoRotate, activeTone]);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full min-h-[500px] overflow-hidden bg-[#0c0c0e] text-[#F5EFE6] select-none font-sans"
      style={{
        touchAction: 'none',
        overscrollBehavior: 'contain',
        userSelect: 'none',
      }}
    >
      {/* =====================================================================
          A. KHI CHƯA CÓ ẢNH THẬT HOẶC ẢNH LỖI (src = null / 404):
             HIỆN THẺ TRẠNG THÁI CHUẨN MỰC - KHÔNG BAO GIỜ ĐỂ MÀN HÌNH ĐEN
             ẨN TOÀN BỘ CHIP THỰC ĐỊA, CREDIT, HOTSPOT, MINI-MAP VÀ LA BÀN
         ===================================================================== */}
      {!isPanoramaUsable && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#0c0c0e]">
          <div className="relative max-w-xl w-full bg-[#141418] border border-[#C9A15B]/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in duration-300">
            {onClose && (
              <button
                onClick={handleCloseWithSound}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black text-[#F5EFE6] border border-white/10 transition-colors cursor-pointer z-40"
                aria-label="Đóng"
                title="Đóng (Esc)"
              >
                <X className="w-4 h-4 text-[#C9A15B]" />
              </button>
            )}

            {/* Ảnh thực tế thông thường hoặc Bản khắc Bảo tàng */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 group bg-[#171817]">
              {site.photos?.[0] && !siteThumbFailed ? (
                <>
                  <HeritageSmoothImage
                    src={site.photos[0]}
                    alt={site.officialName}
                    waitTone="dark"
                    onError={() => setSiteThumbFailed(true)}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[12px] font-sans font-medium text-[#E2C27D] tabular-nums">
                    <span className="flex items-center gap-1.5 bg-black/75 px-2.5 py-1 rounded-md border border-white/10">
                      <MapPin className="w-3 h-3 text-[#C9A15B]" />
                      <span>{site.address.district}</span>
                    </span>
                    <span className="bg-black/75 px-2.5 py-1 rounded-md border border-white/10">
                      Mã số: {site.identifierCode}
                    </span>
                  </div>
                </>
              ) : (
                <HeritageTypographicPlate site={site} variant="catalog" />
              )}
            </div>

            {/* Thông báo chuẩn mực */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A15B]/15 border border-[#C9A15B]/40 text-[#E2C27D] font-sans text-xs font-medium">
                <Info className="w-3.5 h-3.5 text-[#C9A15B]" />
                <span>Tiêu chuẩn Trắc địa Di sản</span>
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5EFE6]">
                Chưa có ảnh 360° thực địa cho di tích này
              </h3>
              <p className="text-xs sm:text-sm text-[#F5EFE6]/75 font-light leading-relaxed max-w-md mx-auto">
                {lang === 'en'
                  ? 'No authentic 360° field panorama has been uploaded for this monument yet. You can inspect the digital 3D model or contribute 360° photographic records.'
                  : 'Dữ liệu toàn cảnh equirectangular 360° thực địa của di tích đang được thu thập. Bạn có thể xem mô hình 3D số hóa hoặc đóng góp ảnh 360° cho cơ sở dữ liệu.'}
              </p>
            </div>

            {/* Thông báo chẩn đoán kỹ thuật khi tải thất bại */}
            {imageLoadFailed && (
              <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3.5 text-left font-sans text-xs text-red-200/90 space-y-1.5 shadow-inner">
                <div className="flex items-center gap-1.5 font-bold text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Chẩn đoán trình tải ảnh (Image Loader Diagnostics)</span>
                </div>
                <div className="truncate text-red-300/80">
                  <span className="text-white/60">URL tệp:</span> {currentVp?.imageUrl || '(Chưa cấu hình src = null trong panoramas.json)'}
                </div>
                <div className="text-red-300/80">
                  <span className="text-white/60">Trạng thái:</span> 404 Not Found / Lỗi nạp tệp WebGL
                </div>
                {imageErrorDetail && (
                  <div className="text-red-300/70 pt-0.5 border-t border-red-500/20">
                    {imageErrorDetail}
                  </div>
                )}
              </div>
            )}

            {/* Hai nút hành động: Xem mô hình 3D & Đóng góp ảnh */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleLaunch3DWithSound}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-[#C9A15B] hover:bg-[#d8b067] text-black font-semibold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Box className="w-4 h-4 text-black" />
                <span>{t('vr360.switchTo3D') || 'Xem mô hình 3D'}</span>
              </button>
              <button
                onClick={() => setShowContributeModal(true)}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.12] text-[#F5EFE6] font-medium text-xs rounded-xl border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-[#C9A15B]" />
                <span>{t('vr360.contributePhoto') || 'Đóng góp ảnh 360°'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          B. THREE.JS VIEWPORT CANVAS (CHỈ CHẠY KHI CÓ ẢNH HỢP LỆ)
         ===================================================================== */}
      {isPanoramaUsable && (
        <div
          ref={containerRef}
          className={`w-full h-full cursor-grab active:cursor-grabbing select-none touch-none overscroll-contain ${
            isVrSplitMode ? 'filter contrast-105' : ''
          }`}
          style={{
            touchAction: 'none',
            overscrollBehavior: 'contain',
            userSelect: 'none',
            cursor: 'grab',
          }}
        />
      )}

      {/* =====================================================================
          C. MÀN HÌNH TẢI TOÀN CẢNH (CHỈ KHI ĐANG TẢI ẢNH THẬT)
         ===================================================================== */}
      {isLoading && isPanoramaUsable && (
        <div className="absolute inset-0 z-40 bg-[#070a12]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
          {site.photos?.[0] && !siteThumbFailed && (
            <img
              src={site.photos[0]}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setSiteThumbFailed(true)}
              className="absolute inset-0 w-full h-full object-cover filter blur-2xl opacity-20 pointer-events-none scale-110"
            />
          )}
          <div className="relative z-10 max-w-sm w-full space-y-4 bg-black/85 backdrop-blur-2xl p-6 rounded-2xl border border-white/15 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#C9A15B]/20 border border-[#C9A15B] flex items-center justify-center text-[#E2C27D]">
              <Eye className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-lg text-[#F5EFE6] leading-tight">
                {site.officialName}
              </h4>
              <p className="text-xs text-[#E2C27D] mt-1 font-sans font-medium">
                {currentVp?.name}
              </p>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#C9A15B] h-full transition-all duration-200 rounded-full"
                  style={{ width: `${Math.max(15, loadProgress)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-sans font-medium text-[#E2C27D] tabular-nums">
                <span>{t('vr360.loading') || 'Đang tải toàn cảnh'}</span>
                <span>{loadProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          D. CHUYỂN DI TÍCH: FLASH TÊN DI TÍCH SERIF (1.5S)
         ===================================================================== */}
      {showSiteNameFlash && isPanoramaUsable && !isLoading && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-4">
          <div className="bg-black/85 backdrop-blur-xl border border-[#C9A15B]/40 px-6 py-4 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in-95 duration-300">
            <span className="font-sans text-[12px] font-medium text-[#C9A15B] block mb-1">
              {t('vr360.title') || 'Toàn cảnh VR 360° thực địa'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5EFE6]">
              {site.officialName}
            </h2>
            <p className="text-xs text-[#F5EFE6]/70 font-light mt-1">
              {site.address.district} · {site.chronology}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================================
          E. GỢI Ý THAO TÁC BAN ĐẦU
         ===================================================================== */}
      {showGestureTip && isPanoramaUsable && !isLoading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 text-xs text-[#F5EFE6] flex items-center gap-2.5 shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-[#C9A15B] animate-ping" />
            <span className="font-light">
              {window.matchMedia('(pointer: coarse)').matches
                ? t('vr360.readyTipTouch') || 'Kéo để xoay · Chụm 2 ngón để phóng'
                : t('vr360.readyTipMouse') || 'Kéo chuột để xoay · Cuộn chuột để phóng'}
            </span>
          </div>
        </div>
      )}

      {/* =====================================================================
          F. 2D HOTSPOTS OVERLAY (CHỈ HIỆN KHI CÓ ẢNH HỢP LỆ VÀ CÓ HOTSPOTS)
         ===================================================================== */}
      {isPanoramaUsable && !isLoading && projectedHotspots.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {projectedHotspots.map(({ hotspot, screenX, screenY, isVisible, edgeX, edgeY, edgeAngle }) => {
            if (isVisible) {
              const isTransition = hotspot.type === 'transition';
              return (
                <div
                  key={hotspot.id}
                  style={{
                    left: `${screenX}px`,
                    top: `${screenY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute pointer-events-auto group cursor-pointer"
                  onClick={() => {
                    if (isTransition && hotspot.targetViewpointId) {
                      handleSelectViewpoint(hotspot.targetViewpointId);
                    } else {
                      flyToHotspot(hotspot);
                    }
                  }}
                >
                  {isTransition ? (
                    <div className="relative flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-[#C9A15B] flex items-center justify-center text-[#E2C27D] shadow-xl group-hover:scale-110 transition-transform">
                        <ArrowUp className="w-5 h-5 animate-bounce text-[#C9A15B]" />
                      </div>
                      <span className="mt-1 px-2 py-0.5 rounded bg-black/90 text-[10px] font-medium font-serif text-[#F5EFE6] border border-white/10 whitespace-nowrap shadow-md">
                        {lang === 'en' ? hotspot.titleEn : hotspot.title}
                      </span>
                    </div>
                  ) : (
                    <div className="relative flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-[#C9A15B]/20 animate-ping absolute" />
                      <div className="w-3.5 h-3.5 rounded-full bg-[#C9A15B] border-2 border-white shadow-xl group-hover:scale-125 transition-transform" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30">
                        <div className="bg-black/90 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-[#C9A15B]/40 shadow-2xl text-center">
                          <p className="font-serif text-xs font-bold text-[#F5EFE6]">
                            {lang === 'en' ? hotspot.titleEn : hotspot.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <div
                  key={`edge-${hotspot.id}`}
                  style={{
                    left: `${edgeX}px`,
                    top: `${edgeY}px`,
                    transform: `translate(-50%, -50%) rotate(${edgeAngle}deg)`,
                  }}
                  className="absolute pointer-events-auto cursor-pointer"
                  onClick={() => flyToHotspot(hotspot)}
                  title={`Xoay tới: ${lang === 'en' ? hotspot.titleEn : hotspot.title}`}
                >
                  <div className="w-7 h-7 rounded-full bg-black/85 backdrop-blur-md border border-[#C9A15B]/60 flex items-center justify-center text-[#E2C27D] shadow-xl hover:scale-110 transition-transform">
                    <Navigation className="w-3.5 h-3.5 fill-[#C9A15B] text-[#C9A15B]" />
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}

      {/* =====================================================================
          G. GIAO DIỆN NỔI (HUD) - CHỈ KHI CÓ ẢNH THẬT HỢP LỆ
         ===================================================================== */}
      {isPanoramaUsable && (
        <div
          className={`absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 ${
            isHudVisible ? 'opacity-100' : 'opacity-20 hover:opacity-100'
          }`}
        >
          {/* 1. TRÊN TRÁI: BỘ CHỌN DI TÍCH & CHIP NGUỒN ẢNH THẬT */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-2 pointer-events-auto max-w-[calc(100vw-32px)] sm:max-w-md">
            <div className="bg-[#0e0e10]/80 backdrop-blur-xl p-1.5 sm:p-2 rounded-[14px] border border-white/10 shadow-2xl flex items-center gap-2.5">
              {site.photos?.[0] && !siteThumbFailed ? (
                <HeritageSmoothImage
                  src={site.photos[0]}
                  alt=""
                  waitTone="dark"
                  onError={() => setSiteThumbFailed(true)}
                  className="w-16 aspect-video rounded-lg object-cover shrink-0 border border-white/10"
                />
              ) : (
                <div className="w-16 aspect-video rounded-lg overflow-hidden shrink-0">
                  <HeritageTypographicPlate site={site} variant="compact" />
                </div>
              )}
              <div className="flex-1 min-w-[210px] sm:min-w-[250px] pr-1">
                <HeritageSitePickerDropdown
                  sites={availableSites}
                  selectedSiteId={site.id}
                  onSelectSite={(next) => {
                    if (onSwitchSite) onSwitchSite(next);
                  }}
                  ariaLabel="Chọn di tích tham quan 360°"
                  headingLabel={
                    lang === 'en'
                      ? 'SWITCH VR 360° MONUMENT'
                      : lang === 'zh'
                      ? '切换 360° 全景遗迹'
                      : 'CHUYỂN NGỮ CẢNH DI TÍCH 360°'
                  }
                  triggerClassName="!bg-transparent !border-0 !p-0"
                  dropdownWidthClass="w-[310px] sm:w-[340px] max-w-[calc(100vw-2rem)]"
                />
                {currentVp?.name && (
                  <div className="mt-0.5 text-[10.5px] text-[#C9A46A]/80 font-sans truncate pl-9">
                    {currentVp.name}
                  </div>
                )}
              </div>
            </div>

            {/* Chip nguồn ảnh trung thực: CHỈ hiện khi có photographer/license trong panoramas.json */}
            {currentVp && (currentVp.photographer || currentVp.captureDate) && (
              <div className="inline-flex items-center gap-2 bg-[#0e0e10]/85 backdrop-blur-xl px-3 py-1.5 rounded-[12px] border border-white/10 text-[11px] font-sans text-[#F5EFE6]/90 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A15B] shrink-0" />
                <span className="text-[#E2C27D] font-semibold">
                  {currentVp.type === 'field_360'
                    ? t('vr360.fieldScanChip') || 'Ảnh thực địa 360°'
                    : currentVp.type === 'historical_archive'
                    ? t('vr360.archiveChip') || 'Ảnh tư liệu lịch sử'
                    : t('vr360.aiChip') || 'Dựng lại minh họa'}
                </span>
                {currentVp.photographer && (
                  <>
                    <span className="text-white/30">|</span>
                    <span className="truncate text-white/70 max-w-[180px] sm:max-w-xs" title={currentVp.photographer}>
                      {t('vr360.photoCreditPrefix') || 'Ảnh:'} {currentVp.photographer}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 2. TRÊN PHẢI: NÚT SÁNG/TỐI, TẢI VỀ, CHIA SẺ, TOÀN MÀN HÌNH */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            <button
              onClick={() => setActiveTone(activeTone === 'day' ? 'evening' : 'day')}
              className="min-h-[44px] min-w-[44px] bg-[#0e0e10]/80 backdrop-blur-xl rounded-[14px] border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title={t('vr360.brightnessToggle') || 'Độ sáng / Ánh sáng'}
              aria-label="Độ sáng"
            >
              {activeTone === 'day' ? <Sun className="w-4 h-4 text-[#C9A15B]" /> : <Moon className="w-4 h-4 text-sky-400" />}
            </button>

            <button
              onClick={handleDownloadSnapshot}
              className="min-h-[44px] min-w-[44px] bg-[#0e0e10]/80 backdrop-blur-xl rounded-[14px] border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title={t('vr360.downloadSnapshot') || 'Chụp & tải góc nhìn'}
              aria-label="Tải ảnh"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleSharePerspective}
              className={`min-h-[44px] min-w-[44px] bg-[#0e0e10]/80 backdrop-blur-xl rounded-[14px] border flex items-center justify-center transition-colors cursor-pointer ${
                copyFeedback ? 'border-[#C9A15B] text-[#E2C27D]' : 'border-white/10 text-neutral-300 hover:text-white'
              }`}
              title={copyFeedback ? t('vr360.copiedLink') || 'Đã sao chép liên kết!' : t('vr360.shareView') || 'Chia sẻ góc nhìn'}
              aria-label="Chia sẻ"
            >
              {copyFeedback ? <Check className="w-4 h-4 text-[#C9A15B]" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="min-h-[44px] min-w-[44px] bg-[#0e0e10]/80 backdrop-blur-xl rounded-[14px] border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? t('vr360.exitFullscreen') || 'Thoát toàn màn hình' : t('vr360.fullscreen') || 'Toàn màn hình'}
              aria-label="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {onClose && (
              <button
                onClick={handleCloseWithSound}
                className="min-h-[44px] min-w-[44px] bg-[#0e0e10]/80 hover:bg-neutral-800 backdrop-blur-xl rounded-[14px] border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer ml-1"
                title={t('vr360.close') || 'Đóng'}
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 3. PHẢI: PANEL ĐIỂM NHẤN (CHỈ HIỆN KHI CÓ HOTSPOTS) */}
          {currentVp?.hotspots && currentVp.hotspots.length > 0 && (
            <div className="hidden md:block absolute top-20 right-3 sm:right-4 z-20 pointer-events-auto">
              {isHighlightsPanelOpen ? (
                <div className="w-80 bg-[#0e0e10]/85 backdrop-blur-xl p-4 rounded-[14px] border border-white/10 shadow-2xl space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#C9A15B]" />
                      <span className="font-serif font-bold text-xs text-[#F5EFE6]">
                        {t('vr360.highlights') || 'Điểm nhấn kiến trúc'}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsHighlightsPanelOpen(false)}
                      className="p-1 text-neutral-400 hover:text-white cursor-pointer rounded"
                      aria-label="Thu gọn điểm nhấn"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto heritage-scrollbar pr-1">
                    {currentVp.hotspots.map((hs, idx) => (
                      <button
                        key={hs.id}
                        onClick={() => flyToHotspot(hs)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                          activeHotspot?.id === hs.id
                            ? 'bg-[#C9A15B]/20 border-[#C9A15B] text-[#E2C27D]'
                            : 'bg-white/[0.04] border-white/10 text-neutral-300 hover:bg-white/[0.08]'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-[#C9A15B]/20 border border-[#C9A15B]/50 flex items-center justify-center font-sans text-[11px] font-semibold text-[#E2C27D] shrink-0 mt-0.5 tabular-nums">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif font-bold text-xs text-[#F5EFE6] truncate">
                            {lang === 'en' ? hs.titleEn : hs.title}
                          </p>
                          <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5 font-light leading-relaxed">
                            {lang === 'en' ? hs.descriptionEn : hs.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsHighlightsPanelOpen(true)}
                  className="bg-[#0e0e10]/85 backdrop-blur-xl px-3 py-2 rounded-[14px] border border-white/10 shadow-2xl flex items-center gap-2 text-xs font-serif text-[#F5EFE6] hover:bg-[#141418] cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#C9A15B]" />
                  <span>{t('vr360.highlights') || 'Điểm nhấn'}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#C9A15B]/20 font-sans text-[11px] font-medium text-[#E2C27D] tabular-nums">
                    {currentVp.hotspots.length}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* 4. DƯỚI GIỮA: THANH ĐIỀU KHIỂN 360° */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <div className="bg-[#0e0e10]/85 backdrop-blur-xl border border-white/10 px-2 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-2xl max-w-[94vw] overflow-x-auto flex-nowrap heritage-scrollbar touch-pan-x">
              <button
                onClick={() => setIsAutoRotate(!isAutoRotate)}
                className={`min-h-[44px] px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  isAutoRotate
                    ? 'bg-[#C9A15B]/20 text-[#E2C27D] border border-[#C9A15B]/50 font-semibold'
                    : 'text-neutral-300 hover:text-white'
                }`}
                title={isAutoRotate ? t('vr360.autoRotateOn') || 'Dừng xoay' : t('vr360.autoRotateOff') || 'Tự xoay'}
                aria-label="Tự xoay"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{t('vr360.autoRotateOff') || 'Tự xoay'}</span>
              </button>

              <div className="flex items-center bg-white/[0.06] p-0.5 rounded-full border border-white/10 shrink-0">
                <button
                  onClick={() => {
                    if (cameraRef.current) {
                      fovRef.current = Math.min(95, fovRef.current + 6);
                      cameraRef.current.fov = fovRef.current;
                      cameraRef.current.updateProjectionMatrix();
                    }
                  }}
                  className="min-h-[44px] min-w-[36px] px-2 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer"
                  title={t('vr360.zoomOut') || 'Thu nhỏ'}
                  aria-label="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-3.5 bg-white/20" />
                <button
                  onClick={() => {
                    if (cameraRef.current) {
                      fovRef.current = Math.max(30, fovRef.current - 6);
                      cameraRef.current.fov = fovRef.current;
                      cameraRef.current.updateProjectionMatrix();
                    }
                  }}
                  className="min-h-[44px] min-w-[36px] px-2 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer"
                  title={t('vr360.zoomIn') || 'Phóng to'}
                  aria-label="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => {
                  if (currentVp) {
                    lonRef.current = currentVp.initialLon;
                    latRef.current = currentVp.initialLat;
                    fovRef.current = currentVp.initialFov || 75;
                    if (cameraRef.current) {
                      cameraRef.current.fov = fovRef.current;
                      cameraRef.current.updateProjectionMatrix();
                    }
                  }
                }}
                className="min-h-[44px] px-3 py-1.5 rounded-full text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                title={t('vr360.resetView') || 'Về hướng ban đầu'}
                aria-label="Về hướng ban đầu"
              >
                <Compass className="w-3.5 h-3.5 text-[#C9A15B]" />
                <span className="hidden md:inline">{t('vr360.resetView') || 'Ban đầu'}</span>
              </button>

              <button
                onClick={toggleAudio}
                className={`min-h-[44px] px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  isPlayingAudio
                    ? 'bg-[#C9A15B]/20 text-[#E2C27D] border border-[#C9A15B]/50 font-semibold'
                    : 'text-neutral-300 hover:text-white'
                }`}
                title={t('vr360.audioGuide') || 'Thuyết minh âm thanh'}
                aria-label="Thuyết minh âm thanh"
              >
                {isPlayingAudio ? (
                  <Volume2 className="w-3.5 h-3.5 animate-pulse text-[#E2C27D]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                <span>Audio</span>
              </button>

              {gyroSupported && (
                <button
                  onClick={requestGyroPermission}
                  className={`min-h-[44px] px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                    isGyroActive
                      ? 'bg-[#C9A15B]/20 text-[#E2C27D] border border-[#C9A15B]/50 font-semibold'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                  title={t('vr360.gyroPrompt') || 'Con quay hồi chuyển'}
                  aria-label="Con quay hồi chuyển"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('vr360.gyroscope') || 'Gyro'}</span>
                </button>
              )}

              <button
                onClick={() => setIsVrSplitMode(!isVrSplitMode)}
                className={`min-h-[44px] px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  isVrSplitMode
                    ? 'bg-[#C9A15B]/20 text-[#E2C27D] border border-[#C9A15B]/50 font-semibold'
                    : 'text-neutral-300 hover:text-white'
                }`}
                title={t('vr360.vrSplitMode') || 'Chế độ kính VR'}
                aria-label="Kính VR"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('vr360.vrMode') || 'Kính VR'}</span>
              </button>
            </div>
          </div>

          {/* 5. DƯỚI TRÁI: BẢN ĐỒ MINI VÀ LA BÀN (CHỈ HIỆN KHI CÓ ẢNH THẬT) */}
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 pointer-events-auto flex items-end gap-2">
            <button
              onClick={() => {
                if (currentVp) {
                  lonRef.current = currentVp.northHeadingDeg;
                }
              }}
              className="min-h-[44px] min-w-[44px] w-11 h-11 bg-[#0e0e10]/85 backdrop-blur-xl rounded-full border border-white/10 shadow-xl flex items-center justify-center cursor-pointer hover:border-[#C9A15B]/50 transition-colors"
              title={t('vr360.compassNorth') || 'Hướng Bắc (Bấm để xoay về Bắc)'}
              aria-label="Hướng Bắc"
            >
              <div
                style={{
                  transform: `rotate(${-cameraHeadingDeg}deg)`,
                }}
                className="flex flex-col items-center transition-transform duration-75"
              >
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-red-500" />
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[8px] border-t-white/80" />
              </div>
            </button>

            <div className="hidden sm:block">
              {isMiniMapExpanded || window.innerWidth >= 768 ? (
                <div className="relative w-[120px] h-[120px] bg-[#0e0e10]/90 backdrop-blur-xl rounded-full border border-[#C9A15B]/40 shadow-2xl p-2 overflow-hidden">
                  <div className="w-full h-full rounded-full bg-black/60 relative border border-white/10 flex items-center justify-center">
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-75"
                      style={{
                        transform: `rotate(${cameraHeadingDeg}deg)`,
                      }}
                      viewBox="0 0 100 100"
                    >
                      <defs>
                        <linearGradient id="fovConeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#C9A15B" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#C9A15B" stopOpacity="0.65" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 50 50 L 28 8 A 50 50 0 0 1 72 8 Z"
                        fill="url(#fovConeGrad)"
                        stroke="#C9A15B"
                        strokeWidth="1"
                      />
                      <circle cx="50" cy="50" r="3.5" fill="#E2C27D" stroke="#000" strokeWidth="1" />
                    </svg>

                    {sitePanoData.viewpoints.map((vp) => (
                      <button
                        key={vp.id}
                        onClick={() => handleSelectViewpoint(vp.id)}
                        style={{
                          left: `${vp.miniMapCoords.x}%`,
                          top: `${vp.miniMapCoords.y}%`,
                        }}
                        className={`absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer z-10 transition-transform ${
                          activeVpId === vp.id
                            ? 'bg-[#C9A15B] ring-2 ring-white scale-125'
                            : 'bg-neutral-500 hover:bg-neutral-300'
                        }`}
                        title={vp.name}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsMiniMapExpanded(true)}
                  className="min-h-[44px] min-w-[44px] bg-[#0e0e10]/85 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer shadow-xl"
                  title={t('vr360.miniMapExpand') || 'Mở bản đồ điểm đứng'}
                >
                  <MapPin className="w-4 h-4 text-[#C9A15B]" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          H. THẺ CHI TIẾT ĐIỂM NHẤN
         ===================================================================== */}
      {activeHotspot && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="pointer-events-auto w-full sm:w-96 max-h-[85vh] bg-[#0e0e10]/95 backdrop-blur-2xl border-t sm:border border-[#C9A15B]/30 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 overflow-y-auto heritage-scrollbar">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <span className="font-sans text-[12px] font-medium text-[#C9A15B] block">
                  {t('vr360.highlights') || 'Điểm nhấn di sản'}
                </span>
                <h3 className="font-serif font-bold text-lg text-[#F5EFE6] leading-tight mt-0.5">
                  {lang === 'en' ? activeHotspot.titleEn : activeHotspot.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveHotspot(null)}
                className="min-h-[44px] min-w-[44px] text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer rounded-lg"
                aria-label="Đóng chi tiết"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeHotspot.photoUrl && !hotspotPhotoFailed && (
              <div className="w-full h-40 rounded-xl overflow-hidden border border-white/10">
                <img
                  src={activeHotspot.photoUrl}
                  alt={activeHotspot.title}
                  referrerPolicy="no-referrer"
                  onError={() => setHotspotPhotoFailed(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs text-[#F5EFE6]/85 font-light leading-relaxed">
                {lang === 'en' ? activeHotspot.descriptionEn : activeHotspot.description}
              </p>
              {activeHotspot.sourceCredit && (
                <p className="text-[11px] font-sans text-[#E2C27D]/75 pt-1">
                  Nguồn: {activeHotspot.sourceCredit}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => toggleAudio()}
                className="flex-1 min-h-[44px] px-3 py-2 bg-[#C9A15B] hover:bg-[#d8b067] text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Volume2 className="w-3.5 h-3.5 text-black" />
                <span>{t('vr360.listenAudio') || 'Nghe thuyết minh'}</span>
              </button>
              {onOpenDossier && (
                <button
                  onClick={() => onOpenDossier(site)}
                  className="min-h-[44px] px-3 py-2 bg-white/[0.08] hover:bg-white/[0.14] text-[#F5EFE6] font-medium text-xs rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#E2C27D]" />
                  <span>{t('vr360.viewDossier') || 'Hồ sơ'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          J. MODAL ĐÓNG GÓP ẢNH TOÀN CẢNH 360°
         ===================================================================== */}
      {showContributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-lg w-full bg-[#141418] border border-[#C9A15B]/40 rounded-2xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#C9A15B]" />
                <h4 className="font-serif font-bold text-lg text-[#F5EFE6]">
                  {t('vr360.contributeModalTitle') || 'Đóng góp Tư liệu ảnh Toàn cảnh 360°'}
                </h4>
              </div>
              <button
                onClick={() => setShowContributeModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {contributeSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-sm text-[#F5EFE6] font-serif">
                  {t('vr360.contributionSuccess') ||
                    'Cảm ơn bạn! Ban biên tập và Hội đồng thẩm định sẽ kiểm định dữ liệu và công bố.'}
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setContributeSuccess(true);
                  setTimeout(() => {
                    setShowContributeModal(false);
                    setContributeSuccess(false);
                  }, 2500);
                }}
                className="space-y-3 text-xs"
              >
                <p className="text-[#F5EFE6]/75 font-light leading-relaxed">
                  {t('vr360.contributeModalDesc') ||
                    'Hệ thống tiếp nhận ảnh toàn cảnh equirectangular (2:1, tối thiểu 6000x3000px, dưới 15MB) đặt trong thư mục public/panoramas/ và cập nhật đường dẫn vào panoramas.json.'}
                </p>
                <div>
                  <label className="block text-xs font-sans font-medium text-[#E2C27D] mb-1">
                    Di tích tiếp nhận
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${site.officialName} (${site.identifierCode})`}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-neutral-300 font-serif"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans font-medium text-[#E2C27D] mb-1">
                    Họ tên người chụp / Đơn vị
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Nguyễn Văn A / Đơn vị khảo sát"
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A15B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans font-medium text-[#E2C27D] mb-1">
                    Thiết bị chụp &amp; Ngày chụp
                  </label>
                  <input
                    type="text"
                    placeholder="Insta360 Pro 2 / Ricoh Theta Z1 · 2026"
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A15B]"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowContributeModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#C9A15B] text-black font-semibold hover:bg-[#d8b067]"
                  >
                    {t('vr360.submitContribution') || 'Gửi tư liệu ảnh'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
