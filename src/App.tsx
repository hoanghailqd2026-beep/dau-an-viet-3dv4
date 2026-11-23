import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { HeritageSite, BaseMapMode, TourRoute } from './types/heritage';
import { HERITAGE_SITES } from './data/heritageSites';
import { TOUR_ROUTES } from './data/tours';
import { useI18n } from './i18n/I18nContext';
import { Language } from './i18n/types';
import { AppleErrorBoundary } from './components/common/AppleErrorBoundary';
import {
  useHeritageRealPhotos,
  resolveSitePhotos,
  saveCustomSitePhoto,
  removeCustomSitePhoto,
  clearAllCustomSitePhotos,
  loadCustomPhotosMap,
  hasAnyCustomPhotoForSite,
  CustomPhotosMap,
  PhotoSlotIndex,
} from './utils/wikimediaPhotoService';
import { MapCanvas } from './components/gis/MapCanvas';
import { FloatingExplorer } from './components/gis/FloatingExplorer';
import { TourRoutePanel } from './components/routing/TourRoutePanel';
import { HistoricalTimeline } from './components/timeline/HistoricalTimeline';
import { HeritageCatalog } from './components/heritage/HeritageCatalog';
import { HeritageDetailModal } from './components/heritage/HeritageDetailModal';
import { CustomPhotoManagerModal } from './components/heritage/CustomPhotoManagerModal';
import { ARAudioModal } from './components/ar/ARAudioModal';
import { FloatingAudioBar } from './components/ar/FloatingAudioBar';
import { AudioGuideProvider, useAudioGuide } from './contexts/AudioGuideContext';
import { AmbientAudioProvider, useAmbientAudio } from './contexts/AmbientAudioContext';
import { AuthProvider, AuthUser, useAuth } from './contexts/AuthContext';
import { LabsProvider, useLabs } from './contexts/LabsContext';
import { AmbientAudioControl } from './components/common/AmbientAudioControl';
import { DauAnLabsModal, LabsQuickNoteModal } from './components/labs/DauAnLabsModal';
import { AuthModal } from './components/auth/AuthModal';
import { MyTicketsAndJourneyModal } from './components/account/MyTicketsAndJourneyModal';
import { FeedbackModal } from './components/feedback/FeedbackModal';
import { SupportHelpdeskModal, SupportModalTab } from './components/support/SupportHelpdeskModal';
import { AdminWorkflowModal, StudioModule } from './components/admin/AdminWorkflowModal';
import { EmergencyLockdownOverlay } from './components/security/EmergencyLockdownOverlay';
import { ThreeDModelViewer } from './components/viewers/ThreeDModelViewer';
import { AppleScrollytellingHome } from './components/viewers/AppleScrollytellingHome';
import { CommercializationEdTechHub } from './components/startup/CommercializationEdTechHub';
import { GeminiHeritageChat } from './components/GeminiHeritageChat';
import {
  InteractiveUserGuideModal,
  GuideSectionId,
} from './components/guide/InteractiveUserGuideModal';
import {
  SuQuanMascotOnboarding,
  getOnboardingDoneStorageKey,
  getOnboardingLockedPrompt,
  OnboardingStep,
} from './components/guide/SuQuanMascotOnboarding';
import {
  MuseumOpeningGateLetter,
  getWelcomeSeenLocalStorageKey,
} from './components/guide/MuseumOpeningGateLetter';
import {
  GuidedTourWelcomeModal,
  GuidedTourProgressBar,
  GuidedTourCompletionModal,
} from './components/guide/GuidedTourConcierge';
import {
  GuidedTourRoute,
  ResolvedGuidedTour,
  resolvePublicGuidedTours,
} from './data/guidedTours';
import { CinemaDocumentaryModal, LocalVideoAsset } from './components/media/CinemaDocumentaryModal';
import { DragScrollRow } from './components/common/DragScrollRow';
import { MediaCreditsModal } from './components/common/MediaCreditsModal';
import { ArchivalSourcesTrigger } from './components/common/ArchivalSourcesTrigger';
import {
  applyRemoteMediaCreditsPayload,
  pullMediaCreditsFromFirebaseRest,
  type MediaCreditCategory,
} from './utils/mediaCreditsStore';
import { HeritageVideoKey, resolveHeritageVideoId } from './data/heritageFilms';
import {
  AI_SHIELD_STORAGE_KEY,
  AI_SHIELD_UPDATED_EVENT,
  AiSecurityShieldState,
  CMS_UPDATED_EVENT,
  CmsSiteOverride,
  EMERGENCY_LOCKDOWN_EVENT,
  EMERGENCY_LOCKDOWN_STORAGE_KEY,
  EmergencyLockdownState,
  PRIMARY_ADMIN_EMAIL,
  RegisteredVisitorRecord,
  SUPPORT_TICKETS_STORAGE_KEY,
  SUPPORT_TICKETS_UPDATED_EVENT,
  SiteSettings,
  VISITORS_UPDATED_EVENT,
  deactivateEmergencyLockdown,
  getVisitorRecord,
  hasUnreadSupportReply,
  loadAiSecurityShield,
  loadCmsSiteOverrides,
  loadEmergencyLockdownState,
  loadHiddenHeritageIds,
  loadSiteSettings,
  recordServerSiteView,
  recordServerVisit,
  recordUnauthorizedAdminAttempt,
  recordVisitorCompletedRoute,
  recordVisitorExploredSite,
  saveCmsSiteOverride,
  syncLocalBootstrapSnapshotToServer,
  syncStateFromServer,
  trackPlatformInteraction,
  createSupportTicket,
  processSupportTicketAiReply,
  applyRemoteSiteSettingsSnapshot,
} from './utils/adminPlatformStore';
import { pullFromFirebaseRealtimeDb } from './utils/firebaseRestSync';
import { hydratePublicCloudOnStartup } from './utils/cloudSync';
import { CloudAutoSyncToast } from './components/common/CloudAutoSyncToast';
import { pullVisitStatsFromFirebase, recordHeritageVisitStat } from './utils/visitStatsSync';
import { recordPersonalVisitHistory } from './utils/accountActivityStore';
import { getTourRouteIndochineColor } from './utils/indochinePalette';
import { RoyalHistoriographerIcon } from './components/common/RoyalHistoriographerIcon';
import {
  SU_QUAN_NOTICE_READ_EVENT,
  SU_QUAN_PURCHASE_NOTICE_EVENT,
  applyRemoteEmailJsConfigSnapshot,
  hasUnreadSuQuanPurchaseNotice,
  markSuQuanPurchaseNoticesRead,
} from './utils/emailAutoSender';
import { UpgradePromptModal } from './components/subscription/UpgradePromptModal';
import { DualRegionCheckoutModal } from './components/subscription/DualRegionCheckoutModal';
import { LockGlyph } from './components/subscription/LockGlyph';
import {
  NAVIGATE_TO_PRICING_PLAN_EVENT,
  applyRemotePaymentQrConfigSnapshot,
  applyRemoteUserSubscriptionSnapshot,
  useSubscriptionPermissions,
} from './utils/subscriptionGatingStore';
import {
  subscribeGlobalSettingsRealtimeSync,
  subscribeUserRealtimeCloudSync,
  syncUserOnboardingToCloud,
  syncUserPreferencesToCloud,
  syncUserWelcomeLetterSeenToCloud,
  useCloudSyncStatus,
  useGraphicsQuality,
  useUserFavorites,
  type GraphicsQualityLevel,
} from './utils/realtimeCloudSync';
import { matchesHeritageSiteQuery } from './utils/heritageSearch';
import { HeritageSiteListPanel } from './components/common/HeritageSiteDropdown';
import {
  Map as MapIcon,
  Route,
  BookOpen,
  Clock,
  Ticket,
  HelpCircle,
  LifeBuoy,
  LogIn,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  ChevronDown,
  Lock,
  Star,
  Headphones,
  X,
  FlaskConical,
  Bug,
  CheckCircle2,
  Menu,
  Compass,
  Box,
  User,
  Search,
  Layers,
  Satellite,
  History,
} from 'lucide-react';

export type MainTab = 'explore' | 'space3d' | 'map_routes' | 'catalog' | 'edtech';

function HeritageAppContent({ emergencyState }: { emergencyState: EmergencyLockdownState }) {
  const { user, isTesterPro } = useAuth();
  const isAdminSession = user?.role === 'admin';
  const canPreviewHidden = isAdminSession || isTesterPro;
  const [activeTab, setActiveTab] = useState<MainTab>('explore');
  const [mapSubView, setMapSubView] = useState<'gis' | 'routes'>('gis');
  const [catalogSubView, setCatalogSubView] = useState<'dossiers' | 'timeline'>('dossiers');

  // Single Source of Truth: Wikimedia Commons API (2 photos/site) + Admin custom overrides
  const { customPhotosMap, setCustomPhotosMap, wikimediaCacheMap } = useHeritageRealPhotos();

  // Live Admin CMS overrides, hidden heritage IDs & global site settings synced via CMS_UPDATED_EVENT
  const [cmsOverridesMap, setCmsOverridesMap] = useState<Record<string, CmsSiteOverride>>(() =>
    loadCmsSiteOverrides()
  );
  const [hiddenHeritageIds, setHiddenHeritageIds] = useState<string[]>(() =>
    loadHiddenHeritageIds()
  );
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => loadSiteSettings());

  const refreshCmsFromStore = () => {
    setCmsOverridesMap(loadCmsSiteOverrides());
    setHiddenHeritageIds(loadHiddenHeritageIds());
    setSiteSettings(loadSiteSettings());
  };

  useEffect(() => {
    let cancelled = false;
    // Public Auto-Hydration: runs immediately on load for ALL visitors (including Guests & Remix copies)
    void hydratePublicCloudOnStartup();

    const bootstrapSync = async () => {
      await Promise.all([syncStateFromServer(), pullVisitStatsFromFirebase()]);
      if (cancelled) return;
      await syncLocalBootstrapSnapshotToServer();
      if (cancelled) return;
      await recordServerVisit(user?.displayName || user?.email);
    };
    void bootstrapSync();

    const intervalId = window.setInterval(() => {
      void syncStateFromServer();
      void pullVisitStatsFromFirebase();
    }, 15000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void hydratePublicCloudOnStartup(true);
        void pullFromFirebaseRealtimeDb();
        void pullVisitStatsFromFirebase();
        void syncStateFromServer();
      }
    };

    const onWindowFocus = () => {
      void pullFromFirebaseRealtimeDb();
      void pullVisitStatsFromFirebase();
      void syncStateFromServer();
    };

    const onCmsUpdated = () => refreshCmsFromStore();
    window.addEventListener(CMS_UPDATED_EVENT, onCmsUpdated);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onWindowFocus);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener(CMS_UPDATED_EVENT, onCmsUpdated);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, []);

  // All 17 sites enriched with resolved photos & full CMS field overrides (used by Admin Studio)
  const allSites = useMemo<HeritageSite[]>(() => {
    return HERITAGE_SITES.map((site) => {
      const ov = cmsOverridesMap[site.id];
      return {
        ...site,
        photos: resolveSitePhotos(site, customPhotosMap, wikimediaCacheMap),
        ...(ov
          ? {
              officialName: ov.officialName || site.officialName,
              chronology: ov.chronology || site.chronology,
              commencementYear:
                typeof ov.commencementYear === 'number'
                  ? ov.commencementYear
                  : site.commencementYear,
              address: {
                ...site.address,
                street: ov.addressStreet || site.address.street,
                district: ov.addressDistrict || site.address.district,
              },
              summary: ov.summary || site.summary,
              architecturalStyle: ov.architecturalStyle || site.architecturalStyle,
              conservationNotes:
                ov.conservationNotes !== undefined
                  ? ov.conservationNotes
                  : site.conservationNotes,
              dossierStatus: ov.dossierStatus || site.dossierStatus,
              expertReviews: ov.expertReviews || site.expertReviews,
            }
          : {}),
      };
    });
  }, [customPhotosMap, wikimediaCacheMap, cmsOverridesMap]);

  // Role-based site visibility:
  // - Admin & Tester Pro ALWAYS see all 17 sites (hidden sites get unified badge).
  // - Normal / Paid Visitors NEVER see sites listed in dau_an_viet_hidden_heritages.
  const sites = useMemo<HeritageSite[]>(() => {
    if (canPreviewHidden) return allSites;
    const hiddenSet = new Set(hiddenHeritageIds);
    return allSites.filter((site) => !hiddenSet.has(site.id));
  }, [allSites, hiddenHeritageIds, canPreviewHidden]);

  const [selectedSiteId, setSelectedSiteId] = useState<string>(HERITAGE_SITES[0].id);
  const selectedSite = useMemo(
    () => sites.find((s) => s.id === selectedSiteId) || sites[0] || allSites[0],
    [sites, selectedSiteId, allSites]
  );

  // Map & Filter State
  const [baseMapMode, setBaseMapMode] = useState<BaseMapMode>('admin');
  const [activeTour, setActiveTour] = useState<TourRoute | null>(TOUR_ROUTES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRanking, setFilterRanking] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterTech, setFilterTech] = useState('all');

  // Modals & Overlays
  const [detailModalSiteId, setDetailModalSiteId] = useState<string | null>(null);
  const [photoManagerSiteId, setPhotoManagerSiteId] = useState<string | null>(null);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // If a visitor is viewing a site that gets hidden, automatically redirect to the first public site
  useEffect(() => {
    if (canPreviewHidden || sites.length === 0) return;
    if (!sites.some((s) => s.id === selectedSiteId)) {
      setSelectedSiteId(sites[0].id);
    }
    if (detailModalSiteId && !sites.some((s) => s.id === detailModalSiteId)) {
      setDetailModalSiteId(null);
    }
    if (photoManagerSiteId && !sites.some((s) => s.id === photoManagerSiteId)) {
      setPhotoManagerSiteId(null);
    }
  }, [canPreviewHidden, sites, selectedSiteId, detailModalSiteId, photoManagerSiteId]);

  const detailModalSite = useMemo(
    () => (detailModalSiteId ? sites.find((s) => s.id === detailModalSiteId) || null : null),
    [sites, detailModalSiteId]
  );
  const photoManagerSite = useMemo(
    () => (photoManagerSiteId ? sites.find((s) => s.id === photoManagerSiteId) || null : null),
    [sites, photoManagerSiteId]
  );

  return (
    <AudioGuideProvider sites={sites}>
      <AmbientAudioProvider>
      <HeritageAppInner
        emergencyState={emergencyState}
        allSites={allSites}
        sites={sites}
        hiddenSiteIds={canPreviewHidden ? hiddenHeritageIds : []}
        siteSettings={siteSettings}
        onRefreshCms={refreshCmsFromStore}
        selectedSite={selectedSite}
        setSelectedSiteId={setSelectedSiteId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mapSubView={mapSubView}
        setMapSubView={setMapSubView}
        catalogSubView={catalogSubView}
        setCatalogSubView={setCatalogSubView}
        customPhotosMap={customPhotosMap}
        setCustomPhotosMap={setCustomPhotosMap}
        baseMapMode={baseMapMode}
        setBaseMapMode={setBaseMapMode}
        activeTour={activeTour}
        setActiveTour={setActiveTour}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterRanking={filterRanking}
        setFilterRanking={setFilterRanking}
        filterDistrict={filterDistrict}
        setFilterDistrict={setFilterDistrict}
        filterType={filterType}
        setFilterType={setFilterType}
        filterTech={filterTech}
        setFilterTech={setFilterTech}
        detailModalSite={detailModalSite}
        setDetailModalSiteId={setDetailModalSiteId}
        photoManagerSite={photoManagerSite}
        setPhotoManagerSiteId={setPhotoManagerSiteId}
        isAiChatOpen={isAiChatOpen}
        setIsAiChatOpen={setIsAiChatOpen}
        isGuideOpen={isGuideOpen}
        setIsGuideOpen={setIsGuideOpen}
        onUpdateSiteStatus={(siteId, newStatus, expertComment) => {
          const baseSite = allSites.find((s) => s.id === siteId);
          const prevReviews = baseSite?.expertReviews || [];
          const nextReviews = expertComment?.trim()
            ? [
                {
                  id: `rev-${Date.now()}`,
                  reviewerName: 'Quản trị viên Dấu Ấn Việt',
                  title: 'Phê duyệt qua Admin Studio',
                  organization: 'Bảo tàng Số Dấu Ấn Việt 3D',
                  ratingScore: newStatus === 'approved_published' ? 5 : 3,
                  verdict:
                    newStatus === 'approved_published'
                      ? ('approved' as const)
                      : ('revision_requested' as const),
                  timestamp: new Date().toLocaleDateString('vi-VN'),
                  comment: expertComment.trim(),
                },
                ...prevReviews,
              ]
            : prevReviews;
          saveCmsSiteOverride(siteId, {
            dossierStatus: newStatus,
            expertReviews: nextReviews,
          });
          refreshCmsFromStore();
        }}
      />
      </AmbientAudioProvider>
    </AudioGuideProvider>
  );
}

interface HeritageAppInnerProps {
  emergencyState: EmergencyLockdownState;
  allSites: HeritageSite[];
  sites: HeritageSite[];
  hiddenSiteIds: string[];
  siteSettings: SiteSettings;
  onRefreshCms: () => void;
  selectedSite: HeritageSite;
  setSelectedSiteId: React.Dispatch<React.SetStateAction<string>>;
  activeTab: MainTab;
  setActiveTab: React.Dispatch<React.SetStateAction<MainTab>>;
  mapSubView: 'gis' | 'routes';
  setMapSubView: React.Dispatch<React.SetStateAction<'gis' | 'routes'>>;
  catalogSubView: 'dossiers' | 'timeline';
  setCatalogSubView: React.Dispatch<React.SetStateAction<'dossiers' | 'timeline'>>;
  customPhotosMap: CustomPhotosMap;
  setCustomPhotosMap: React.Dispatch<React.SetStateAction<CustomPhotosMap>>;
  baseMapMode: BaseMapMode;
  setBaseMapMode: React.Dispatch<React.SetStateAction<BaseMapMode>>;
  activeTour: TourRoute | null;
  setActiveTour: React.Dispatch<React.SetStateAction<TourRoute | null>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filterRanking: string;
  setFilterRanking: React.Dispatch<React.SetStateAction<string>>;
  filterDistrict: string;
  setFilterDistrict: React.Dispatch<React.SetStateAction<string>>;
  filterType: string;
  setFilterType: React.Dispatch<React.SetStateAction<string>>;
  filterTech: string;
  setFilterTech: React.Dispatch<React.SetStateAction<string>>;
  detailModalSite: HeritageSite | null;
  setDetailModalSiteId: React.Dispatch<React.SetStateAction<string | null>>;
  photoManagerSite: HeritageSite | null;
  setPhotoManagerSiteId: React.Dispatch<React.SetStateAction<string | null>>;
  isAiChatOpen: boolean;
  setIsAiChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isGuideOpen: boolean;
  setIsGuideOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onUpdateSiteStatus: (
    siteId: string,
    newStatus: 'draft' | 'district_submitted' | 'expert_review' | 'approved_published',
    expertComment?: string
  ) => void;
}

function HeritageAppInner({
  emergencyState,
  allSites,
  sites,
  hiddenSiteIds,
  siteSettings,
  onRefreshCms,
  selectedSite,
  setSelectedSiteId,
  activeTab,
  setActiveTab,
  mapSubView,
  setMapSubView,
  catalogSubView,
  setCatalogSubView,
  customPhotosMap,
  setCustomPhotosMap,
  baseMapMode,
  setBaseMapMode,
  activeTour,
  setActiveTour,
  searchQuery,
  setSearchQuery,
  filterRanking,
  setFilterRanking,
  filterDistrict,
  setFilterDistrict,
  filterType,
  setFilterType,
  filterTech,
  setFilterTech,
  detailModalSite,
  setDetailModalSiteId,
  photoManagerSite,
  setPhotoManagerSiteId,
  isAiChatOpen,
  setIsAiChatOpen,
  isGuideOpen,
  setIsGuideOpen,
  onUpdateSiteStatus,
}: HeritageAppInnerProps) {
  const { lang, setLang, getLocalizedSite, getLocalizedTour } = useI18n();
  const { setVideoModalOpen, setSpatial3DContext } = useAmbientAudio();
  const [photoManagerInitialSlot, setPhotoManagerInitialSlot] = useState<PhotoSlotIndex>(0);
  const {
    user,
    userTier,
    isAdmin,
    isTesterPro,
    isAuthModalOpen,
    openAuthModal,
    logout,
    refreshEntitlements,
  } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobileMapSearchOpen, setIsMobileMapSearchOpen] = useState<boolean>(false);
  const [isMobileRoutesOpen, setIsMobileRoutesOpen] = useState<boolean>(false);
  const [isMobileLayersOpen, setIsMobileLayersOpen] = useState<boolean>(false);
  const {
    effectiveQuickNotesWidget,
    isLabsModalOpen,
    isQuickNoteOpen,
    openLabsModal,
    openQuickNote,
  } = useLabs();
  const isNonAdminBetaTester = Boolean(user && user.isBetaTester && !isAdmin);
  const isNonAdminTesterPro = Boolean(isTesterPro && !isAdmin);
  const canPreviewHidden = isAdmin || isTesterPro;
  const {
    activeSite: audioActiveSite,
    isModalOpen: isAudioModalOpen,
    isFloatingBarVisible,
    isPlaying: isAudioPlaying,
    pause: pauseAudioGuide,
    openModalForSite,
    startAudioGuideForSite,
    minimizeModalKeepPlaying,
  } = useAudioGuide();
  const {
    permissions: activeSitePerms,
    previewRole,
    setPreviewRole,
  } = useSubscriptionPermissions(selectedSite.id);

  const [guideSection, setGuideSection] = useState<GuideSectionId>('explore');
  const openGuideForSection = useCallback(
    (section?: GuideSectionId) => {
      setGuideSection(section ?? (isAudioModalOpen ? 'audio' : activeTab));
      setIsGuideOpen(true);
    },
    [activeTab, isAudioModalOpen, setIsGuideOpen]
  );

  // Duolingo-style "Sử Quan Dấu Ấn" Mascot Onboarding Tour (Locked when logged out, tracked per UID & synced to cloud)
  const currentOnboardingUid = user ? user.firebaseUid || user.userId || user.id : null;
  const [isGateLetterOpen, setIsGateLetterOpen] = useState<boolean>(false);
  const [isGateLetterMandatory, setIsGateLetterMandatory] = useState<boolean>(false);
  const isGateLetterMandatoryRef = React.useRef<boolean>(false);
  isGateLetterMandatoryRef.current = isGateLetterMandatory;
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(1);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const pendingManualOnboardingRef = React.useRef<boolean>(false);

  // Full-screen Opening Gate Letter: Mandatory read ONLY on first-ever login per UID (checked via localStorage + Firebase `/users/{uid}/welcomeLetterSeen`)
  useEffect(() => {
    if (!currentOnboardingUid) {
      setIsGateLetterOpen(false);
      setIsGateLetterMandatory(false);
      return;
    }
    try {
      const seenKey = getWelcomeSeenLocalStorageKey(currentOnboardingUid);
      if (window.localStorage.getItem(seenKey) !== 'true') {
        setIsGateLetterMandatory(true);
        setIsGateLetterOpen(true);
      } else {
        setIsGateLetterMandatory(false);
        setIsGateLetterOpen(false);
      }
    } catch {
      setIsGateLetterMandatory(true);
      setIsGateLetterOpen(true);
    }
  }, [currentOnboardingUid]);

  const handleOpenGateLetterReview = useCallback(() => {
    setIsGateLetterMandatory(false);
    setIsGateLetterOpen(true);
  }, []);

  const handleEnterMuseumFromGateLetter = useCallback(() => {
    if (currentOnboardingUid) {
      try {
        window.localStorage.setItem(getWelcomeSeenLocalStorageKey(currentOnboardingUid), 'true');
      } catch {
        // ignore localStorage quota / privacy errors
      }
      syncUserWelcomeLetterSeenToCloud(currentOnboardingUid, true);
    }
    setIsGateLetterOpen(false);
    setIsGateLetterMandatory(false);
  }, [currentOnboardingUid]);

  // Realtime Cloud Sync status, 3D graphics quality preference, and cloud-synced favorites
  const cloudSyncStatus = useCloudSyncStatus();
  const [graphicsQuality, setGraphicsQuality] = useGraphicsQuality(currentOnboardingUid);
  const { favoriteSiteIds } = useUserFavorites(currentOnboardingUid);
  const lastRemoteSiteIdRef = React.useRef<string | null>(null);
  const prevSiteIdForCloudRef = React.useRef<string>(selectedSite.id);

  const [mediaCreditsState, setMediaCreditsState] = useState<{
    isOpen: boolean;
    siteId?: string | null;
    category?: 'ALL' | MediaCreditCategory;
  }>({ isOpen: false, siteId: null, category: 'ALL' });

  const handleOpenMediaCredits = useCallback(
    (siteId?: string | null, category: 'ALL' | MediaCreditCategory = 'ALL') => {
      setMediaCreditsState({
        isOpen: true,
        siteId: siteId ?? null,
        category,
      });
    },
    []
  );

  // 1. Global Realtime Sync for Admin Studio settings (`/settings/emailConfig`, `/settings/siteSettings`, `/paymentConfig/vietqr`, `/mediaCredits`)
  useEffect(() => {
    void pullMediaCreditsFromFirebaseRest();
    return subscribeGlobalSettingsRealtimeSync({
      onEmailConfig: (cfg) => {
        applyRemoteEmailJsConfigSnapshot(cfg);
      },
      onSiteSettings: (settings) => {
        applyRemoteSiteSettingsSnapshot(settings);
      },
      onPaymentQrConfig: (cfg) => {
        applyRemotePaymentQrConfigSnapshot(cfg);
      },
      onMediaCredits: (payload) => {
        applyRemoteMediaCreditsPayload(payload);
      },
    });
  }, []);

  // 2. Per-Account Realtime Cloud Sync Hub (`/users/{uid}` -> entitlements, preferences, onboarding, favorites)
  useEffect(() => {
    if (!currentOnboardingUid) return;
    const userEmail = user?.email;
    return subscribeUserRealtimeCloudSync(currentOnboardingUid, {
      onEntitlements: (remoteEnt) => {
        applyRemoteUserSubscriptionSnapshot(currentOnboardingUid, userEmail, remoteEnt);
        refreshEntitlements();
      },
      onOnboarding: (remoteOnb) => {
        if (remoteOnb.done) {
          try {
            window.localStorage.setItem(getOnboardingDoneStorageKey(currentOnboardingUid), 'true');
          } catch {
            // ignore
          }
          setIsOnboardingOpen(false);
          setOnboardingStep(1);
        }
      },
      onWelcomeLetterSeen: (seen) => {
        if (seen) {
          try {
            window.localStorage.setItem(getWelcomeSeenLocalStorageKey(currentOnboardingUid), 'true');
          } catch {
            // ignore
          }
          // Only auto-dismiss if currently locked in first-login mandatory read (never interrupt voluntary re-read)
          if (isGateLetterMandatoryRef.current) {
            setIsGateLetterMandatory(false);
            setIsGateLetterOpen(false);
          }
        }
      },
      onPreferences: (remotePrefs) => {
        if (
          typeof remotePrefs.lastViewedSiteId === 'string' &&
          remotePrefs.lastViewedSiteId &&
          remotePrefs.lastViewedSiteId !== lastRemoteSiteIdRef.current &&
          sites.some((s) => s.id === remotePrefs.lastViewedSiteId)
        ) {
          lastRemoteSiteIdRef.current = remotePrefs.lastViewedSiteId;
          prevSiteIdForCloudRef.current = remotePrefs.lastViewedSiteId;
          setSelectedSiteId(remotePrefs.lastViewedSiteId);
        }
      },
    });
  }, [currentOnboardingUid, user?.email, refreshEntitlements, sites, setSelectedSiteId]);

  // 3. Push user language preference to `/users/{uid}/preferences` ONLY on explicit local switches (zero echo loops)
  useEffect(() => {
    if (!currentOnboardingUid) return;
    const onLocalLangChanged = (ev: Event) => {
      const nextLang = (ev as CustomEvent<unknown>).detail;
      if (nextLang === 'vi' || nextLang === 'en' || nextLang === 'zh') {
        syncUserPreferencesToCloud(currentOnboardingUid, { language: nextLang });
      }
    };
    window.addEventListener('dau-an-viet-local-lang-changed', onLocalLangChanged);
    return () => {
      window.removeEventListener('dau-an-viet-local-lang-changed', onLocalLangChanged);
    };
  }, [currentOnboardingUid]);

  // 4. Push last viewed monument ID to `/users/{uid}/preferences` (debounced to prevent write spam)
  useEffect(() => {
    const activeSiteId = selectedSite.id;
    if (!currentOnboardingUid || !activeSiteId) return;
    if (prevSiteIdForCloudRef.current === activeSiteId) return;
    const timer = window.setTimeout(() => {
      prevSiteIdForCloudRef.current = activeSiteId;
      syncUserPreferencesToCloud(currentOnboardingUid, { lastViewedSiteId: activeSiteId });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [selectedSite.id, currentOnboardingUid]);

  useEffect(() => {
    if (!currentOnboardingUid) {
      pendingManualOnboardingRef.current = false;
      setIsOnboardingOpen(false);
      setOnboardingStep(1);
      return;
    }
    if (pendingManualOnboardingRef.current) {
      pendingManualOnboardingRef.current = false;
      setActiveTab('explore');
      setOnboardingStep(1);
      setIsOnboardingOpen(true);
      return;
    }
    try {
      const doneKey = getOnboardingDoneStorageKey(currentOnboardingUid);
      if (window.localStorage.getItem(doneKey) !== 'true') {
        setOnboardingStep(1);
        setIsOnboardingOpen(true);
      } else {
        setIsOnboardingOpen(false);
      }
    } catch {
      setOnboardingStep(1);
      setIsOnboardingOpen(true);
    }
  }, [currentOnboardingUid, setActiveTab]);

  const handleFinishOnboarding = useCallback(() => {
    if (currentOnboardingUid) {
      try {
        window.localStorage.setItem(getOnboardingDoneStorageKey(currentOnboardingUid), 'true');
      } catch {
        // ignore storage quota / privacy errors
      }
      syncUserOnboardingToCloud(currentOnboardingUid, true);
    }
    setIsOnboardingOpen(false);
    setOnboardingStep(1);
  }, [currentOnboardingUid]);

  const handleRestartOnboarding = useCallback(() => {
    setIsMobileMenuOpen(false);
    if (!user) {
      openAuthModal({
        prompt: getOnboardingLockedPrompt(lang),
        onSuccess: () => {
          pendingManualOnboardingRef.current = true;
          setActiveTab('explore');
          setOnboardingStep(1);
          setIsOnboardingOpen(true);
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        },
      });
      return;
    }
    setActiveTab('explore');
    setOnboardingStep(1);
    setIsOnboardingOpen(true);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [user, lang, openAuthModal, setActiveTab]);

  const handleEnsureExploreView = useCallback(() => {
    setActiveTab((prev) => (prev === 'explore' ? prev : 'explore'));
  }, [setActiveTab]);

  const [isAdminStudioOpen, setIsAdminStudioOpen] = useState<boolean>(false);
  const [adminInitialModule, setAdminInitialModule] = useState<StudioModule | undefined>(undefined);
  const [adminGlbLaunchTarget, setAdminGlbLaunchTarget] = useState<{ siteId: string; token: number } | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isMyJourneyOpen, setIsMyJourneyOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [isFeedbackLockPromptOpen, setIsFeedbackLockPromptOpen] = useState<boolean>(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);

  const handleRequestOpenFeedback = useCallback(() => {
    if (!user) {
      setIsFeedbackLockPromptOpen(true);
      return;
    }
    setIsFeedbackLockPromptOpen(false);
    setIsFeedbackOpen(true);
  }, [user]);

  useEffect(() => {
    if (user) {
      setIsFeedbackLockPromptOpen(false);
    } else {
      setIsFeedbackOpen(false);
    }
  }, [user]);
  const [supportDefaultTab, setSupportDefaultTab] = useState<SupportModalTab>('faq');
  const [isTesterBugModalOpen, setIsTesterBugModalOpen] = useState<boolean>(false);
  const [testerBugDescription, setTesterBugDescription] = useState<string>('');
  const [testerBugSubmittedCode, setTesterBugSubmittedCode] = useState<string | null>(null);
  const [isSubmittingTesterBug, setIsSubmittingTesterBug] = useState<boolean>(false);
  const [hasUnreadSupport, setHasUnreadSupport] = useState<boolean>(() =>
    hasUnreadSupportReply(user?.userId, user?.email)
  );
  const [hasUnreadSuQuanNotice, setHasUnreadSuQuanNotice] = useState<boolean>(() =>
    hasUnreadSuQuanPurchaseNotice(user?.email, user?.userId)
  );
  const [visitorRecord, setVisitorRecord] = useState<RegisteredVisitorRecord | null>(() =>
    getVisitorRecord(user?.userId)
  );
  const [aiShieldState, setAiShieldState] = useState<AiSecurityShieldState>(() =>
    loadAiSecurityShield()
  );
  const unauthorizedLoggedRef = React.useRef<string | null>(null);
  const userMenuRef = React.useRef<HTMLDivElement | null>(null);
  const adminNavRef = React.useRef<HTMLElement | null>(null);
  const isAdminSession = user?.role === 'admin';
  const [pending3DRenderMode, setPending3DRenderMode] = useState<'textured' | 'wireframe' | 'xray'>('textured');
  const [pending3DExploded, setPending3DExploded] = useState<number>(0);

  useEffect(() => {
    const onNavigatePricing = () => {
      setActiveTab('edtech');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener(NAVIGATE_TO_PRICING_PLAN_EVENT, onNavigatePricing);
    return () => window.removeEventListener(NAVIGATE_TO_PRICING_PLAN_EVENT, onNavigatePricing);
  }, []);

  useEffect(() => {
    const syncShield = () => setAiShieldState(loadAiSecurityShield());
    const onStorage = (e: StorageEvent) => {
      if (e.key === AI_SHIELD_STORAGE_KEY) syncShield();
    };
    window.addEventListener(AI_SHIELD_UPDATED_EVENT, syncShield);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(AI_SHIELD_UPDATED_EVENT, syncShield);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    const syncSuQuanNotice = () => {
      setHasUnreadSuQuanNotice(hasUnreadSuQuanPurchaseNotice(user?.email, user?.userId));
    };
    syncSuQuanNotice();
    window.addEventListener(SU_QUAN_PURCHASE_NOTICE_EVENT, syncSuQuanNotice);
    window.addEventListener(SU_QUAN_NOTICE_READ_EVENT, syncSuQuanNotice);
    return () => {
      window.removeEventListener(SU_QUAN_PURCHASE_NOTICE_EVENT, syncSuQuanNotice);
      window.removeEventListener(SU_QUAN_NOTICE_READ_EVENT, syncSuQuanNotice);
    };
  }, [user?.email, user?.userId]);

  useEffect(() => {
    if (isAiChatOpen && hasUnreadSuQuanNotice) {
      markSuQuanPurchaseNoticesRead();
      setHasUnreadSuQuanNotice(false);
    }
  }, [isAiChatOpen, hasUnreadSuQuanNotice]);

  useEffect(() => {
    if (isAdmin) return;
    const urlMarker = `${window.location.search}${window.location.hash}`.toLowerCase();
    if (urlMarker.includes('admin')) {
      const actorKey = `${user?.email || 'guest'}:${urlMarker}`;
      if (unauthorizedLoggedRef.current !== actorKey) {
        unauthorizedLoggedRef.current = actorKey;
        recordUnauthorizedAdminAttempt(
          user?.email || user?.displayName || 'Khách truy cập trái phép',
          `Phát hiện truy cập tham số quản trị (${urlMarker}) không có quyền Super Admin.`
        );
      }
    }
  }, [isAdmin, user?.email, user?.displayName]);

  useEffect(() => {
    const syncUnreadSupport = () => {
      setHasUnreadSupport(hasUnreadSupportReply(user?.userId, user?.email));
    };
    syncUnreadSupport();
    const onStorage = (e: StorageEvent) => {
      if (e.key === SUPPORT_TICKETS_STORAGE_KEY) syncUnreadSupport();
    };
    window.addEventListener(SUPPORT_TICKETS_UPDATED_EVENT, syncUnreadSupport);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(SUPPORT_TICKETS_UPDATED_EVENT, syncUnreadSupport);
      window.removeEventListener('storage', onStorage);
    };
  }, [user?.userId, user?.email]);

  useEffect(() => {
    setVisitorRecord(getVisitorRecord(user?.userId));
    if (!user?.userId) return;
    const onVisitorsUpdated = () => setVisitorRecord(getVisitorRecord(user.userId));
    window.addEventListener(VISITORS_UPDATED_EVENT, onVisitorsUpdated);
    return () => window.removeEventListener(VISITORS_UPDATED_EVENT, onVisitorsUpdated);
  }, [user?.userId]);

  useEffect(() => {
    if (!isAdmin && isAdminStudioOpen) {
      setIsAdminStudioOpen(false);
    }
  }, [isAdmin, isAdminStudioOpen]);

  // Sync shared server state immediately whenever switching main tabs, subviews, or opening Admin Studio
  useEffect(() => {
    void syncStateFromServer();
  }, [activeTab, mapSubView, catalogSubView, isAdminStudioOpen]);

  // Enforce Mandatory Visitor Auth Gate if user logs out while in a protected view
  useEffect(() => {
    if (!user) {
      if (activeTab !== 'explore') {
        setActiveTab('explore');
      }
      if (isMyJourneyOpen) {
        setIsMyJourneyOpen(false);
      }
    }
  }, [user, activeTab, isMyJourneyOpen, setActiveTab]);

  // Record 3D site visit whenever authenticated visitor views a monument in Không gian 3D
  useEffect(() => {
    if (user?.userId && activeTab === 'space3d' && selectedSite?.id) {
      recordVisitorExploredSite(user.userId, selectedSite.id);
      recordPersonalVisitHistory({
        uid: user.userId,
        siteId: selectedSite.id,
        siteName: selectedSite.officialName,
        activityType: '3d_explore',
      });
    }
  }, [user?.userId, activeTab, selectedSite?.id, selectedSite?.officialName]);

  // Automatically track session-deduplicated visit stat when viewing a monument in Không gian 3D
  useEffect(() => {
    if (activeTab === 'space3d' && selectedSite?.id) {
      void recordHeritageVisitStat(selectedSite.id);
    }
  }, [activeTab, selectedSite?.id]);

  // Sync 3D spatial context with Global Sound Mixer's 3D Spatial Ambient Sounds engine
  useEffect(() => {
    const isIn3DView = activeTab === 'space3d';
    const spatialSite = selectedSite;
    setSpatial3DContext({
      active: isIn3DView,
      siteId: spatialSite?.id,
      siteName: spatialSite?.officialName,
      siteType: spatialSite?.type,
    });
  }, [
    activeTab,
    selectedSite?.id,
    selectedSite?.officialName,
    selectedSite?.type,
    setSpatial3DContext,
  ]);

  const [activeGuidedTour, setActiveGuidedTour] = useState<{
    route: GuidedTourRoute;
    stops: HeritageSite[];
    stepIndex: number;
  } | null>(null);
  const [isGuidedWelcomeOpen, setIsGuidedWelcomeOpen] = useState<boolean>(false);
  const [completedGuidedTour, setCompletedGuidedTour] = useState<{
    route: GuidedTourRoute;
    stopCount: number;
  } | null>(null);
  const [preselectedGuidedRoute, setPreselectedGuidedRoute] = useState<{
    mappedTourId: string;
    title: string;
    token: number;
  } | null>(null);
  const [masterpieceAudioHintSite, setMasterpieceAudioHintSite] = useState<HeritageSite | null>(null);

  const prevUserIdRef = React.useRef<string | null>(user?.userId || null);
  const suppressNextWelcomeRef = React.useRef<boolean>(false);

  // Public-only guided tours (strictly excludes any monument hidden in dau_an_viet_hidden_heritages)
  const resolvedGuidedTours = useMemo<ResolvedGuidedTour[]>(
    () => resolvePublicGuidedTours(sites, hiddenSiteIds),
    [sites, hiddenSiteIds]
  );

  // Monument 01 masterpiece (falls back to first public monument if 01 is hidden by Admin)
  const masterpieceSite = useMemo<HeritageSite | null>(() => {
    const hiddenSet = new Set(hiddenSiteIds);
    return (
      sites.find((s) => s.id === 'HCM-DT-001' && !hiddenSet.has(s.id)) ||
      sites.find((s) => !hiddenSet.has(s.id)) ||
      null
    );
  }, [sites, hiddenSiteIds]);

  // Keep active guided tour synced live if Admin hides/unhides any stop
  useEffect(() => {
    if (!activeGuidedTour) return;
    const updated = resolvedGuidedTours.find((item) => item.route.id === activeGuidedTour.route.id);
    if (!updated || updated.stops.length === 0) {
      setActiveGuidedTour(null);
      return;
    }
    const currentStopId = activeGuidedTour.stops[activeGuidedTour.stepIndex]?.id;
    const newIdx = currentStopId
      ? updated.stops.findIndex((s) => s.id === currentStopId)
      : 0;
    const safeIdx =
      newIdx >= 0 ? newIdx : Math.min(activeGuidedTour.stepIndex, updated.stops.length - 1);
    const stopsChanged =
      updated.stops.length !== activeGuidedTour.stops.length ||
      updated.stops.some((s, i) => s.id !== activeGuidedTour.stops[i]?.id);
    if (stopsChanged || safeIdx !== activeGuidedTour.stepIndex) {
      setActiveGuidedTour({
        route: updated.route,
        stops: updated.stops,
        stepIndex: safeIdx,
      });
    }
  }, [resolvedGuidedTours, activeGuidedTour]);

  // Clean up guided tour session states on logout (GuidedTourWelcomeModal is only opened manually, never auto-popped on login)
  useEffect(() => {
    const currentUserId = user?.userId || null;
    prevUserIdRef.current = currentUserId;

    if (!currentUserId) {
      setActiveGuidedTour(null);
      setIsGuidedWelcomeOpen(false);
      setCompletedGuidedTour(null);
      setMasterpieceAudioHintSite(null);
      setPreselectedGuidedRoute(null);
      return;
    }

    if (suppressNextWelcomeRef.current) {
      suppressNextWelcomeRef.current = false;
    }
  }, [user?.userId]);

  const requireAuth = (action: (authedUser: AuthUser) => void, promptLabel: string) => {
    if (user) {
      action(user);
      return;
    }
    suppressNextWelcomeRef.current = true;
    openAuthModal({
      prompt: promptLabel,
      onSuccess: (authedUser: AuthUser) => action(authedUser),
    });
  };

  useEffect(() => {
    const navEl = adminNavRef.current;
    if (!isAdminSession || !navEl) return;
    const handleWheelToHorizontal = (e: WheelEvent) => {
      if (navEl.scrollWidth <= navEl.clientWidth) return;
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX) && e.deltaY !== 0) {
        e.preventDefault();
        navEl.scrollLeft += e.deltaY;
      }
    };
    navEl.addEventListener('wheel', handleWheelToHorizontal, { passive: false });
    return () => navEl.removeEventListener('wheel', handleWheelToHorizontal);
  }, [isAdminSession]);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isUserMenuOpen]);

  const [mapFocusTick, setMapFocusTick] = useState<number>(0);
  const [tourFocusTick, setTourFocusTick] = useState<number>(0);
  const [viewerResetKey, setViewerResetKey] = useState<number>(0);
  const activeMapHeritageId = useMemo(
    () => resolveHeritageVideoId(selectedSite.id),
    [selectedSite.id]
  );

  const handleSelectTourRoute = (tour: TourRoute | null) => {
    setActiveTour(tour);
    if (tour && tour.sites.length > 0) {
      const firstStop = sites.find((s) => s.id === tour.sites[0]);
      if (firstStop) {
        setSelectedSiteId(firstStop.id);
      }
      setTourFocusTick((t) => t + 1);
    }
  };
  const [cinemaState, setCinemaState] = useState<{
    isOpen: boolean;
    siteId: string | null;
    activeVideoHeritageId: HeritageVideoKey | null;
  }>({
    isOpen: false,
    siteId: null,
    activeVideoHeritageId: null,
  });

  useEffect(() => {
    setVideoModalOpen(cinemaState.isOpen);
  }, [cinemaState.isOpen, setVideoModalOpen]);
  const [localVideosMap, setLocalVideosMap] = useState<Record<string, LocalVideoAsset>>({});
  const localVideosRef = React.useRef<Record<string, LocalVideoAsset>>({});
  localVideosRef.current = localVideosMap;

  useEffect(() => {
    return () => {
      Object.values(localVideosRef.current).forEach((asset) => {
        try {
          URL.revokeObjectURL(asset.url);
        } catch {
          // ignore revoke error
        }
      });
    };
  }, []);

  const handleUploadLocalVideo = (targetKey: string, file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setLocalVideosMap((prev) => {
      const existing = prev[targetKey];
      if (existing?.url) {
        try {
          URL.revokeObjectURL(existing.url);
        } catch {
          // ignore revoke error
        }
      }
      return {
        ...prev,
        [targetKey]: { url: objectUrl, fileName: file.name },
      };
    });
  };

  const handleClearLocalVideo = (targetKey: string) => {
    setLocalVideosMap((prev) => {
      const existing = prev[targetKey];
      if (!existing) return prev;
      try {
        URL.revokeObjectURL(existing.url);
      } catch {
        // ignore revoke error
      }
      const next = { ...prev };
      delete next[targetKey];
      return next;
    });
  };

  const handleOpenCinemaModal = (site?: HeritageSite | null) => {
    if (isAudioPlaying) {
      pauseAudioGuide();
    }
    const targetSite = site || selectedSite;
    if (site) {
      setSelectedSiteId(site.id);
    }
    const lockedVideoKey = resolveHeritageVideoId(targetSite?.id);
    trackPlatformInteraction('tech_flycam', targetSite?.id);
    setCinemaState({
      isOpen: true,
      siteId: targetSite ? targetSite.id : null,
      activeVideoHeritageId: lockedVideoKey,
    });
  };

  useEffect(() => {
    if (!canPreviewHidden && cinemaState.isOpen && cinemaState.siteId) {
      if (!sites.some((s) => s.id === cinemaState.siteId)) {
        setCinemaState({ isOpen: false, siteId: null, activeVideoHeritageId: null });
      }
    }
  }, [canPreviewHidden, cinemaState.isOpen, cinemaState.siteId, sites]);

  const cinemaContextSite = useMemo(
    () => (cinemaState.siteId ? sites.find((s) => s.id === cinemaState.siteId) || null : null),
    [sites, cinemaState.siteId]
  );

  useEffect(() => {
    if (isAudioModalOpen && audioActiveSite?.id) {
      setSelectedSiteId(audioActiveSite.id);
    }
  }, [isAudioModalOpen, audioActiveSite?.id, setSelectedSiteId]);

  const activeAiContextSite = useMemo(
    () =>
      detailModalSite ||
      cinemaContextSite ||
      (isAudioModalOpen ? audioActiveSite : null) ||
      selectedSite,
    [detailModalSite, cinemaContextSite, isAudioModalOpen, audioActiveSite, selectedSite]
  );

  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      if (s.address.district) set.add(s.address.district);
    });
    return Array.from(set);
  }, [sites]);

  const filteredMapSites = useMemo(() => {
    return sites.filter((site, idx) => {
      const locSite = getLocalizedSite(site);
      const matchesSearch = matchesHeritageSiteQuery({
        site,
        canonicalIndex: idx,
        rawQuery: searchQuery,
        localizedName: locSite.officialName,
        localizedFolkName: locSite.folkName,
        localizedSummary: locSite.summary,
      });
      const matchesRanking = filterRanking === 'all' || site.rankingLevel === filterRanking;
      const matchesDistrict = filterDistrict === 'all' || site.address.district === filterDistrict;
      const matchesType = filterType === 'all' || site.type === filterType;
      const matchesTech =
        filterTech === 'all' ||
        (filterTech === '3d' && site.has3D) ||
        (filterTech === 'vr360' && site.hasVR360);

      return matchesSearch && matchesRanking && matchesDistrict && matchesType && matchesTech;
    });
  }, [sites, searchQuery, filterRanking, filterDistrict, filterType, filterTech, getLocalizedSite]);

  const handleOpen3D = (site: HeritageSite, authedUser?: AuthUser) => {
    const actor = authedUser || user;
    setSelectedSiteId(site.id);
    void recordHeritageVisitStat(site.id);
    void recordServerSiteView(
      site.id,
      site.officialName,
      'open_3d',
      actor?.displayName || actor?.email
    );
    recordVisitorExploredSite(actor?.userId, site.id);
    if (actor?.userId) {
      recordPersonalVisitHistory({
        uid: actor.userId,
        siteId: site.id,
        siteName: site.officialName,
        activityType: '3d_explore',
      });
    }
    setActiveTab('space3d');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleOpenDetailModal = (siteOrId: HeritageSite | string, authedUser?: AuthUser) => {
    const target =
      typeof siteOrId === 'string'
        ? sites.find((s) => s.id === siteOrId) || allSites.find((s) => s.id === siteOrId)
        : siteOrId;
    if (!target) return;
    const actor = authedUser || user;
    setSelectedSiteId(target.id);
    setDetailModalSiteId(target.id);
    void recordHeritageVisitStat(target.id);
    void recordServerSiteView(
      target.id,
      target.officialName,
      'open_dossier',
      actor?.displayName || actor?.email
    );
  };

  const startGuidedTourSession = (tour: ResolvedGuidedTour, authedUser?: AuthUser) => {
    if (!tour.stops.length) return;
    const firstStop = tour.stops[0];
    setIsGuidedWelcomeOpen(false);
    setCompletedGuidedTour(null);
    setMasterpieceAudioHintSite(null);
    setActiveGuidedTour({
      route: tour.route,
      stops: tour.stops,
      stepIndex: 0,
    });
    const matchingMapTour = TOUR_ROUTES.find((t) => t.id === tour.route.mappedTourId);
    if (matchingMapTour) {
      setActiveTour(matchingMapTour);
    }
    handleOpen3D(firstStop, authedUser);
  };

  const startMasterpieceSession = (authedUser?: AuthUser) => {
    if (!masterpieceSite) return;
    setIsGuidedWelcomeOpen(false);
    setActiveGuidedTour(null);
    setMasterpieceAudioHintSite(masterpieceSite);
    handleOpen3D(masterpieceSite, authedUser);
  };

  const handleGuidedNextStep = () => {
    if (!activeGuidedTour) return;
    const nextIdx = activeGuidedTour.stepIndex + 1;
    if (nextIdx < activeGuidedTour.stops.length) {
      const nextSite = activeGuidedTour.stops[nextIdx];
      setActiveGuidedTour({
        ...activeGuidedTour,
        stepIndex: nextIdx,
      });
      setSelectedSiteId(nextSite.id);
      void recordHeritageVisitStat(nextSite.id);
      void recordServerSiteView(
        nextSite.id,
        nextSite.officialName,
        'open_3d',
        user?.displayName || user?.email
      );
      recordVisitorExploredSite(user?.userId, nextSite.id);
      if (activeTab !== 'space3d' && activeTab !== 'map_routes') {
        setActiveTab('space3d');
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    } else {
      recordVisitorCompletedRoute(user?.userId, activeGuidedTour.route.mappedTourId);
      setCompletedGuidedTour({
        route: activeGuidedTour.route,
        stopCount: activeGuidedTour.stops.length,
      });
      setActiveGuidedTour(null);
    }
  };

  const handleLocateOnMap = (site: HeritageSite) => {
    if (isAudioModalOpen) {
      minimizeModalKeepPlaying();
    }
    setSelectedSiteId(site.id);
    setMapFocusTick((t) => t + 1);
    setMapSubView('gis');
    setActiveTab('map_routes');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleNavigateTab = (tab: MainTab, scrollBehavior: ScrollBehavior = 'auto') => {
    if (isAudioModalOpen) {
      minimizeModalKeepPlaying();
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: scrollBehavior });
  };

  const navItems: { id: MainTab | 'audio'; label: string }[] = [
    { id: 'explore', label: lang === 'en' ? 'Explore' : lang === 'zh' ? '探索' : 'Khám phá' },
    { id: 'space3d', label: lang === 'en' ? '3D Space' : lang === 'zh' ? '3D 空间' : 'Không gian 3D' },
    { id: 'map_routes', label: lang === 'en' ? 'Map & Routes' : lang === 'zh' ? '地图与路线' : 'Bản đồ & Tuyến' },
    { id: 'catalog', label: lang === 'en' ? 'Dossiers' : lang === 'zh' ? '遗产档案' : 'Hồ sơ Di sản' },
    { id: 'edtech', label: lang === 'en' ? 'Tickets & EdTech' : lang === 'zh' ? '门票与教材' : 'Vé & Học liệu' },
    { id: 'audio', label: lang === 'en' ? 'Audio Guide' : lang === 'zh' ? '语音导览' : 'Thuyết minh' },
  ];

  const isStrictAdmin = Boolean(isAdmin && !isTesterPro);

  const handleOpenAdminGlbUpload = (targetSite: HeritageSite) => {
    if (!isStrictAdmin) return;
    setAdminGlbLaunchTarget({ siteId: targetSite.id, token: Date.now() });
    setIsAdminStudioOpen(true);
  };

  const renderTierPill = (variant: 'light' | 'dark' = 'light') => {
    if (!user) return null;
    if (isStrictAdmin) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-[#C9A46A] text-[#171817] whitespace-nowrap shrink-0">
          {lang === 'en' ? 'Admin' : lang === 'zh' ? '管理员' : 'Quản trị viên'}
        </span>
      );
    }
    if (isNonAdminTesterPro) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-[#47796D] text-[#D8C9A9] whitespace-nowrap shrink-0">
          {lang === 'en' ? 'Tester Pro' : lang === 'zh' ? '专业测试版' : 'Tester Pro'}
        </span>
      );
    }
    if (userTier === 'pro') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-[#171817] border border-[#C9A46A] text-[#C9A46A] whitespace-nowrap shrink-0">
          Pro
        </span>
      );
    }
    if (userTier === 'plus') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-[#526D8B] text-[#D8C9A9] whitespace-nowrap shrink-0">
          Plus
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap shrink-0 ${
          variant === 'dark'
            ? 'bg-[#D8C9A9]/10 text-[#D8C9A9]/80 border border-[#D8C9A9]/20'
            : 'bg-[#171817]/10 text-[#171817]'
        }`}
      >
        {lang === 'en' ? 'Visitor' : lang === 'zh' ? '访客' : 'Du khách'}
      </span>
    );
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#D8C9A9] text-[#171817] flex flex-col selection:bg-[#A94F3D] selection:text-[#D8C9A9]">
      <div className="sticky top-0 z-50 flex flex-col">
        {emergencyState.isLocked && isStrictAdmin && (
          <div
            role="status"
            className="w-full bg-[#A94F3D] border-b border-[#171817]/25 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#D8C9A9]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShieldAlert className="w-4 h-4 text-[#FFD6D3] animate-pulse shrink-0" />
              <span className="font-semibold tracking-tight truncate">
                CHẾ ĐỘ ĐÓNG BĂNG KHẨN CẤP ĐANG BẬT — Toàn bộ du khách đã bị ngắt truy cập
              </span>
            </div>
            <button
              type="button"
              onClick={() => deactivateEmergencyLockdown(user?.email || PRIMARY_ADMIN_EMAIL)}
              className="px-3.5 py-1 rounded-full bg-white hover:bg-[#F5EFE6] text-[#7A1216] text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mở khóa hoạt động lại ngay</span>
            </button>
          </div>
        )}

        {!emergencyState.isLocked && aiShieldState.level2EmergencyActive && (
          <div
            role="status"
            className="w-full bg-gradient-to-r from-[#5E1115] via-[#8F191E] to-[#5E1115] border-b border-[#FF453A]/60 px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-white"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShieldAlert className="w-4 h-4 text-[#FFD6D3] animate-pulse shrink-0" />
              <span className="font-medium truncate">
                {isStrictAdmin
                  ? `CẢNH BÁO AN NINH MỨC 2: ${aiShieldState.lastIncidentTitle || 'Trợ lý AI đã bật Lá chắn Bảo vệ & gửi email khẩn cấp về bivsmoon2023@gmail.com'}`
                  : 'Lá chắn AI Bảo vệ Khẩn cấp đang bật: Hệ thống đang áp dụng giới hạn tốc độ truy cập an toàn để ngăn chặn gửi biểu mẫu tự động.'}
              </span>
            </div>
            {isStrictAdmin && (
              <button
                type="button"
                onClick={() => setIsAdminStudioOpen(true)}
                className="px-3 py-1 rounded-full bg-white hover:bg-[#F5EFE6] text-[#7A1216] text-[11px] font-bold cursor-pointer transition-colors shrink-0"
              >
                Mở Admin Studio xử lý
              </button>
            )}
          </div>
        )}

      {/* ====================================================================
          0. MOBILE COMPACT SINGLE-ROW HEADER (< 768px)
         ==================================================================== */}
      <header className="flex md:hidden items-center justify-between px-3 py-2 gap-1.5 h-[52px] bg-[#171817] border-b border-[#C9A46A]/25 text-[#D8C9A9]">
        {/* Left: Compact Architectural Crest + Brand Name (shrink-0) */}
        <button
          type="button"
          onClick={() => {
            setIsMobileMenuOpen(false);
            handleNavigateTab('explore');
          }}
          className="text-left focus:outline-none shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <svg
            width="22"
            height="24"
            viewBox="0 0 42 46"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="33" height="38" rx="4.5" stroke="#A94F3D" strokeWidth="1.8" />
            <path d="M7.5 43H35.5C37.9853 43 40 40.9853 40 38.5V7.5" stroke="#C9A46A" strokeWidth="1.4" />
            <path d="M11.5 12.2C16.8 13.8 22.2 13.8 27.5 12.2L26 14.3H13L11.5 12.2Z" stroke="#D8C9A9" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M8.5 16.4C15.8 18.4 23.2 18.4 30.5 16.4L28.5 18.8H10.5L8.5 16.4Z" stroke="#D8C9A9" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M14 34.7V26C14 22.9624 16.4624 20.5 19.5 20.5C22.5376 20.5 25 22.9624 25 26V34.7" stroke="#D8C9A9" strokeWidth="1.5" />
            <circle cx="19.5" cy="26.5" r="2" fill="#C9A46A" />
          </svg>
          <span className="font-serif text-[15px] font-semibold tracking-tight text-[#D8C9A9] whitespace-nowrap">
            Dấu Ấn Việt
          </span>
          <span className="font-sans text-[9.5px] font-semibold text-[#171817] bg-[#C9A46A] px-1.5 py-0.5 rounded-[4px] leading-none shrink-0">
            3D
          </span>
        </button>

        {/* Right: Compact Icon Controls Only (Music, Language, Account/Admin, Secondary Menu) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <AmbientAudioControl popoverAlign="right" />

          {/* Compact Language Cycle Pill (VI / EN / ZH) */}
          <button
            type="button"
            onClick={() => {
              const order: Language[] = ['vi', 'en', 'zh'];
              const nextLang = order[(order.indexOf(lang) + 1) % order.length];
              setLang(nextLang);
            }}
            aria-label={lang === 'en' ? 'Switch language' : lang === 'zh' ? '切换语言' : 'Đổi ngôn ngữ'}
            title={lang === 'en' ? 'Switch language (VI / EN / ZH)' : lang === 'zh' ? '切换语言 (VI / EN / ZH)' : 'Đổi ngôn ngữ (VI / EN / ZH)'}
            className="h-8 px-2 rounded-full bg-[#171817] border border-[#C9A46A]/35 hover:border-[#C9A46A] text-[#C9A46A] text-[10.5px] font-semibold uppercase tracking-wide flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            {lang.toUpperCase()}
          </button>

          {/* Account / Admin Compact Icon */}
          <button
            type="button"
            onClick={() => {
              if (isStrictAdmin) {
                setIsAdminStudioOpen(true);
              } else if (user) {
                setIsMyJourneyOpen(true);
              } else {
                openAuthModal();
              }
            }}
            aria-label={
              isStrictAdmin
                ? 'Admin Studio'
                : user
                ? lang === 'en'
                  ? 'My Account'
                  : lang === 'zh'
                  ? '我的账户'
                  : 'Tài khoản của tôi'
                : lang === 'en'
                ? 'Sign In'
                : lang === 'zh'
                ? '登录'
                : 'Đăng nhập'
            }
            title={
              isStrictAdmin
                ? 'Admin Studio'
                : user
                ? user.displayName
                : lang === 'en'
                ? 'Sign In'
                : lang === 'zh'
                ? '登录'
                : 'Đăng nhập'
            }
            className={`relative w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
              isStrictAdmin
                ? 'bg-[#C9A46A] border-[#C9A46A] text-[#171817]'
                : user
                ? 'bg-[#171817] border-[#C9A46A]/55 text-[#C9A46A]'
                : 'bg-[#A94F3D] border-[#A94F3D] text-[#D8C9A9]'
            }`}
          >
            {isStrictAdmin ? (
              <ShieldCheck className="w-4 h-4" />
            ) : user ? (
              <User className="w-4 h-4" />
            ) : (
              <LogIn className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Secondary Menu Trigger (Contains Thư ngỏ, Đánh giá & Hỗ trợ, Hướng dẫn) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label={lang === 'en' ? 'Open menu' : lang === 'zh' ? '打开菜单' : 'Mở menu phụ'}
            className="relative w-8 h-8 rounded-full bg-[#171817] border border-[#C9A46A]/35 hover:border-[#C9A46A] text-[#D8C9A9] flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <Menu className="w-4 h-4" />
            {hasUnreadSupport && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#A94F3D]" />
            )}
          </button>
        </div>
      </header>

      {/* ====================================================================
          1. DESKTOP & SPLIT-PREVIEW EDITORIAL NAVBAR (>= 768px)
         ==================================================================== */}
      <header
        className="hidden md:flex items-center justify-between gap-3 px-4 py-2.5 w-full min-h-16 bg-[#D8C9A9]/95 backdrop-blur-md border-b border-[#171817]/15 tracking-normal"
      >
        {/* 1. LEFT ZONE: ARCHITECTURAL BRAND + FULL SUBTITLE (STRICTLY ISOLATED) */}
        <button
          type="button"
          onClick={() => handleNavigateTab('explore')}
          className="text-left focus:outline-none shrink-0 mr-4 whitespace-nowrap flex items-center gap-2.5 group cursor-pointer"
        >
          <svg width="32" height="36" viewBox="0 0 42 46" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <rect x="3" y="3" width="33" height="38" rx="4.5" stroke="#A94F3D" strokeWidth="1.5" />
            <path d="M7.5 43H35.5C37.9853 43 40 40.9853 40 38.5V7.5" stroke="#C9A46A" strokeWidth="1.2" />
            <line x1="19.5" y1="6.5" x2="19.5" y2="37.5" stroke="#A94F3D" strokeWidth="0.9" strokeDasharray="1.8 1.8" strokeOpacity="0.8" />
            <line x1="7" y1="26.5" x2="32" y2="26.5" stroke="#A94F3D" strokeWidth="0.9" strokeDasharray="1.8 1.8" strokeOpacity="0.8" />
            <path d="M11.5 12.2C16.8 13.8 22.2 13.8 27.5 12.2L26 14.3H13L11.5 12.2Z" stroke="#171817" strokeWidth="1.25" strokeLinejoin="round" />
            <line x1="14.5" y1="14.3" x2="14.5" y2="16.4" stroke="#171817" strokeWidth="1.15" />
            <line x1="24.5" y1="14.3" x2="24.5" y2="16.4" stroke="#171817" strokeWidth="1.15" />
            <path d="M8.5 16.4C15.8 18.4 23.2 18.4 30.5 16.4L28.5 18.8H10.5L8.5 16.4Z" stroke="#171817" strokeWidth="1.3" strokeLinejoin="round" />
            <rect x="11.8" y="18.8" width="2.2" height="13.7" stroke="#171817" strokeWidth="1.15" />
            <rect x="11" y="32.5" width="3.8" height="2.2" stroke="#171817" strokeWidth="1.15" />
            <rect x="25" y="18.8" width="2.2" height="13.7" stroke="#171817" strokeWidth="1.15" />
            <rect x="24.2" y="32.5" width="3.8" height="2.2" stroke="#171817" strokeWidth="1.15" />
            <path d="M14 34.7V26C14 22.9624 16.4624 20.5 19.5 20.5C22.5376 20.5 25 22.9624 25 26V34.7" stroke="#171817" strokeWidth="1.3" />
            <circle cx="19.5" cy="26.5" r="1.7" fill="#A94F3D" />
          </svg>

          <div className="flex flex-col leading-none shrink-0">
            <div className="flex items-start whitespace-nowrap">
              <span
                className="font-serif text-[17px] lg:text-[19px] font-semibold tracking-[-0.01em] text-[#171817] group-hover:text-[#A94F3D] transition-colors leading-none whitespace-nowrap"
                style={{ fontVariantNumeric: 'lining-nums' }}
              >
                Dấu Ấn Việt
              </span>
              <span className="font-sans text-[10px] font-semibold text-[#C9A46A] bg-[#171817] px-1.5 py-0.5 rounded-[4px] ml-1.5 leading-none tracking-normal shrink-0">
                3D
              </span>
            </div>
            <span className="font-sans font-medium text-[10.5px] tracking-normal text-[#171817]/75 mt-1 whitespace-nowrap block">
              {lang === 'en'
                ? 'Digital Museum of Southern Heritage'
                : lang === 'zh'
                ? '东南部遗产数字博物馆'
                : 'Bảo tàng số Di sản Đông Nam Bộ'}
            </span>
          </div>
        </button>

        {/* 2. CENTER ZONE: ALL 6 NAVIGATION ITEMS (NEVER HIDDEN, SMOOTH HORIZONTAL SCROLL WHEN NARROW) */}
        <nav
          ref={adminNavRef}
          aria-label="Global Navigation"
          className="min-w-0 flex-1 overflow-x-auto no-scrollbar"
        >
          <div className="w-max mx-auto bg-[#EDE4D0] border border-[#171817]/15 rounded-full p-1 flex items-center gap-1.5 whitespace-nowrap">
            {navItems.map((item) => {
              const isAudio = item.id === 'audio';
              const isActive = !isAudio && activeTab === item.id;
              const isEdtech = item.id === 'edtech';
              const isAudioTierLocked = isAudio && !activeSitePerms.canUseAudioGuide;
              const isLocked = !user && item.id !== 'explore' && item.id !== 'edtech' && !isAudio;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-onboarding-target={
                    item.id === 'catalog'
                      ? 'nav-dossier'
                      : item.id === 'space3d'
                      ? 'nav-space3d'
                      : undefined
                  }
                  onClick={() => {
                    if (item.id === 'explore') {
                      handleNavigateTab('explore');
                      return;
                    }
                    if (item.id === 'edtech') {
                      handleNavigateTab('edtech');
                      return;
                    }
                    if (isAudio) {
                      openModalForSite(selectedSite.id);
                    } else {
                      requireAuth(() => handleNavigateTab(item.id as MainTab), item.label);
                    }
                  }}
                  className={`text-xs lg:text-sm tracking-normal whitespace-nowrap shrink-0 rounded-full px-2.5 lg:px-3.5 py-1.5 transition-all duration-200 cursor-pointer inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#A94F3D] text-[#D8C9A9] font-semibold'
                      : 'text-[#171817]/80 hover:text-[#171817] hover:bg-[#171817]/8'
                  } ${isAudioTierLocked ? 'opacity-80' : ''}`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A46A] shrink-0" />
                  )}
                  {isEdtech && (
                    <Ticket className={`w-3.5 h-3.5 shrink-0 hidden 2xl:inline ${isActive ? 'text-[#D8C9A9]' : 'text-[#A94F3D]'}`} />
                  )}
                  <span className="whitespace-nowrap">{item.label}</span>
                  {isAudioTierLocked ? (
                    <LockGlyph className="w-3 h-3 text-[#C9A46A] shrink-0" />
                  ) : isLocked ? (
                    <Lock className={`w-3 h-3 shrink-0 ${isActive ? 'text-[#D8C9A9]' : 'text-[#47796D]'}`} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>

        {/* 3. RIGHT ZONE: AUDIO + VI|EN|ZH + ADMIN STUDIO + SYNC DOT + ACCOUNT + SINGLE GUIDE */}
        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          <div className="shrink-0">
            <AmbientAudioControl popoverAlign="right" />
          </div>

          <div className="inline-flex items-center p-0.5 rounded-full bg-[#EDE4D0] border border-[#171817]/15 shrink-0 whitespace-nowrap">
            {(['vi', 'en', 'zh'] as Language[]).map((l, idx) => (
              <React.Fragment key={l}>
                {idx > 0 && (
                  <span className="text-[10px] text-[#171817]/20 select-none">|</span>
                )}
                <button
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-1.5 py-1 rounded-full text-[10.5px] font-semibold uppercase tracking-normal transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    lang === l
                      ? 'bg-[#171817] text-[#D8C9A9]'
                      : 'text-[#171817]/70 hover:text-[#171817]'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Auth Portal: Sign In (Logged out) OR Admin Studio + Compact Sync Dot + Account Avatar (Logged in) */}
          {!user ? (
            <button
              type="button"
              onClick={() => openAuthModal()}
              className="h-8 px-3 rounded-full bg-[#EDE4D0] hover:bg-[#171817] border border-[#171817]/20 text-[#171817] hover:text-[#D8C9A9] text-xs font-medium inline-flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer group"
            >
              <LogIn className="w-3.5 h-3.5 text-[#A94F3D] group-hover:text-[#C9A46A] shrink-0" />
              <span className="whitespace-nowrap">
                {lang === 'en' ? 'Sign In' : lang === 'zh' ? '登录' : 'Đăng nhập'}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2 relative shrink-0 whitespace-nowrap" ref={userMenuRef}>
              {isStrictAdmin && (
                <button
                  type="button"
                  title="Admin Studio"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setAdminInitialModule(undefined);
                    setIsAdminStudioOpen(true);
                  }}
                  className="inline-flex h-8 px-2.5 rounded-full bg-[#C9A46A] hover:bg-[#171817] border border-[#171817]/20 text-[#171817] hover:text-[#C9A46A] text-xs font-semibold items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Admin Studio</span>
                </button>
              )}

              {/* Compact Cloud Sync Status Dot with Hover Tooltip */}
              <div
                role="status"
                aria-label={
                  cloudSyncStatus.state === 'synced'
                    ? 'Đã đồng bộ đám mây'
                    : 'Đang kết nối lại...'
                }
                title={
                  cloudSyncStatus.state === 'synced'
                    ? 'Đã đồng bộ đám mây'
                    : cloudSyncStatus.pendingCount > 0
                    ? `Đang kết nối lại... (${cloudSyncStatus.pendingCount} thay đổi chờ đồng bộ)`
                    : 'Đang kết nối lại...'
                }
                className="group relative w-6 h-6 rounded-full bg-[#EDE4D0]/90 border border-[#171817]/15 flex items-center justify-center shrink-0 cursor-default"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    cloudSyncStatus.state === 'synced'
                      ? 'bg-[#47796D]'
                      : 'bg-[#C9A46A] animate-pulse'
                  }`}
                />
                <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-2 px-2.5 py-1 rounded-full bg-[#171817] border border-[#C9A46A]/45 text-[11px] font-medium text-[#D8C9A9] whitespace-nowrap shadow-xl z-[70]">
                  {cloudSyncStatus.state === 'synced'
                    ? 'Đã đồng bộ đám mây'
                    : cloudSyncStatus.pendingCount > 0
                    ? `Đang kết nối lại... (${cloudSyncStatus.pendingCount})`
                    : 'Đang kết nối lại...'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-expanded={isUserMenuOpen}
                aria-label={`${user.displayName}${isStrictAdmin ? ' (Quản trị viên)' : ''}`}
                title={`${user.displayName}${user.email ? ` · ${user.email}` : ''}`}
                className={`h-8 pl-1 pr-1.5 rounded-full bg-[#EDE4D0] hover:bg-[#F4EFE4] flex items-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  isStrictAdmin
                    ? 'border border-[#C9A46A] ring-1 ring-[#C9A46A]/45'
                    : 'border border-[#171817]/18'
                }`}
              >
                <span
                  className={`relative overflow-hidden w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                    isStrictAdmin
                      ? 'bg-[#171817] text-[#C9A46A] border border-[#C9A46A]'
                      : isNonAdminTesterPro
                      ? 'bg-[#47796D] text-[#D8C9A9]'
                      : userTier === 'pro'
                      ? 'bg-[#171817] text-[#C9A46A] border border-[#C9A46A]/60'
                      : userTier === 'plus'
                      ? 'bg-[#526D8B] text-[#D8C9A9]'
                      : 'bg-[#47796D] text-[#D8C9A9]'
                  }`}
                >
                  <span>{user.avatarInitials}</span>
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#171817]/70 shrink-0" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#F4EFE4] border border-[#171817]/20 shadow-[0_18px_40px_rgba(23,24,23,0.18)] p-1.5 z-[65] animate-apple-sheet whitespace-normal">
                  <div className="px-3 py-2.5 border-b border-[#171817]/12">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-[#171817] truncate">
                        {user.displayName}
                      </div>
                      {renderTierPill('light')}
                    </div>
                    <div className="text-[11px] text-[#171817]/65 truncate mt-0.5 tabular-nums">
                      {user.email || (user.provider === 'facebook' ? 'Facebook Account' : 'Google Account')}
                    </div>
                    <div className="mt-1.5 flex flex-col items-start gap-1">
                      <span className="text-[11px] font-medium text-[#171817]/70">
                        {isStrictAdmin
                          ? lang === 'en'
                            ? 'Administrator · Gemini 4 Argon'
                            : lang === 'zh'
                            ? '管理员 · Gemini 4 Argon'
                            : 'Quản trị viên · Gemini 4 Argon'
                          : isNonAdminTesterPro
                          ? lang === 'en'
                            ? 'Tester Pro · QA & Gemini 4 Hydrogen'
                            : lang === 'zh'
                            ? '专业测试版 · QA 与 Gemini 4 Hydrogen'
                            : 'Người thử nghiệm Pro · QA & Gemini 4 Hydrogen'
                          : userTier === 'pro'
                          ? lang === 'en'
                            ? 'Pro Plan (49,000 VND) · Fast-Track'
                            : lang === 'zh'
                            ? 'Pro 尊享套餐 (49,000đ) · 优先支持'
                            : 'Gói Pro (49.000đ) · Hỗ trợ Ưu tiên Nhanh'
                          : userTier === 'plus'
                          ? lang === 'en'
                            ? 'Plus Plan (19,000 VND) · Gemini 3.5 Flash'
                            : lang === 'zh'
                            ? 'Plus 标准套餐 (19,000đ) · Gemini 3.5 Flash'
                            : 'Gói Plus (19.000đ) · Gemini 3.5 Flash'
                          : lang === 'en'
                          ? 'Visitor · Standard Access'
                          : lang === 'zh'
                          ? '访客 · 参观权限'
                          : 'Du khách · Quyền tham quan'}
                      </span>
                      {isNonAdminBetaTester && (
                        <span className="text-[11px] font-medium text-[#A94F3D] mt-0.5">
                          {lang === 'en'
                            ? 'Beta Tester Account · Labs'
                            : lang === 'zh'
                            ? '测试版账户 · Labs'
                            : 'Tài khoản Thử nghiệm · Labs'}
                        </span>
                      )}
                    </div>

                    {/* Realtime Cloud Sync Status & Synced Preferences */}
                    <div className="mt-2.5 pt-2 border-t border-[#171817]/10 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#171817]/80">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              cloudSyncStatus.state === 'synced'
                                ? 'bg-[#47796D]'
                                : 'bg-[#C9A46A] animate-pulse'
                            }`}
                          />
                          <span>
                            {cloudSyncStatus.state === 'synced'
                              ? 'Đã đồng bộ đám mây'
                              : 'Đang kết nối lại...'}
                          </span>
                        </span>
                        {favoriteSiteIds.length > 0 && (
                          <span className="text-[10.5px] font-medium text-[#A94F3D] tabular-nums">
                            {favoriteSiteIds.length} yêu thích
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10.5px] font-medium text-[#171817]/65">
                          Đồ họa 3D
                        </span>
                        <div className="inline-flex items-center p-0.5 rounded-full bg-[#EDE4D0] border border-[#171817]/12">
                          {(
                            [
                              { id: 'high', label: 'Cao' },
                              { id: 'balanced', label: 'Chuẩn' },
                              { id: 'eco', label: 'Nhẹ' },
                            ] as Array<{ id: GraphicsQualityLevel; label: string }>
                          ).map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setGraphicsQuality(opt.id)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors cursor-pointer ${
                                graphicsQuality === opt.id
                                  ? 'bg-[#171817] text-[#C9A46A]'
                                  : 'text-[#171817]/70 hover:text-[#171817]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsMyJourneyOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-[#171817] hover:bg-[#EDE4D0] flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Ticket className="w-3.5 h-3.5 text-[#A94F3D] shrink-0" />
                      <span>
                        {lang === 'en'
                          ? 'My Account & Tickets'
                          : lang === 'zh'
                          ? '我的账户与门票'
                          : 'Tài khoản & Vé của tôi'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setSupportDefaultTab(hasUnreadSupport ? 'tickets' : 'faq');
                        setIsSupportModalOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-[#171817] hover:bg-[#EDE4D0] flex items-center justify-between gap-2 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <LifeBuoy className="w-3.5 h-3.5 text-[#47796D] shrink-0" />
                        <span className="truncate">
                          {lang === 'en'
                            ? 'Help & Support'
                            : lang === 'zh'
                            ? '帮助与支持'
                            : 'Trợ giúp & Hỗ trợ'}
                        </span>
                      </span>
                      {hasUnreadSupport && (
                        <span className="w-2 h-2 rounded-full bg-[#A94F3D] shrink-0" />
                      )}
                    </button>

                    {isStrictAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsAdminStudioOpen(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#171817] bg-[#C9A46A]/35 hover:bg-[#C9A46A]/55 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {lang === 'en'
                            ? 'Open Admin Studio'
                            : lang === 'zh'
                            ? '打开 Admin Studio'
                            : 'Mở Admin Studio'}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsAdminStudioOpen(false);
                        setIsMyJourneyOpen(false);
                        setIsFeedbackOpen(false);
                        setDetailModalSiteId(null);
                        setPhotoManagerSiteId(null);
                        setIsAiChatOpen(false);
                        setCinemaState({ isOpen: false, siteId: null, activeVideoHeritageId: null });
                        setActiveTab('explore');
                        logout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs text-[#A94F3D] font-semibold hover:bg-[#A94F3D]/12 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {lang === 'en'
                          ? 'Sign Out'
                          : lang === 'zh'
                          ? '退出登录'
                          : 'Đăng xuất'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Single Compact Circular Tour Guide Button (Lock Icon When Logged Out, Compass Icon When Logged In) */}
          <button
            type="button"
            onClick={handleRestartOnboarding}
            title={
              user
                ? lang === 'en'
                  ? 'Guided Tour'
                  : lang === 'zh'
                  ? '导览指南'
                  : 'Hướng dẫn tham quan'
                : getOnboardingLockedPrompt(lang)
            }
            aria-label={
              user
                ? lang === 'en'
                  ? 'Guided Tour'
                  : lang === 'zh'
                  ? '导览指南'
                  : 'Hướng dẫn tham quan'
                : getOnboardingLockedPrompt(lang)
            }
            className={`group relative w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer border ${
              user
                ? 'bg-[#EDE4D0] hover:bg-[#47796D] border-[#171817]/20 hover:border-[#47796D] text-[#171817] hover:text-[#F7F3EB]'
                : 'bg-[#EDE4D0]/80 hover:bg-[#F7F3EB] border-[#A94F3D]/40 hover:border-[#A94F3D]/70 text-[#A94F3D]'
            }`}
          >
            {user ? (
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.65"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-[#47796D] group-hover:text-[#F7F3EB] shrink-0 transition-colors"
                aria-hidden="true"
              >
                <circle cx="10" cy="10" r="7.5" />
                <polygon points="13.2 6.8 11.4 11.4 6.8 13.2 8.6 8.6 13.2 6.8" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="#A94F3D"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5 shrink-0"
                aria-hidden="true"
              >
                <rect x="4" y="9" width="12" height="8" rx="2" />
                <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
              </svg>
            )}
            <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-full mt-2 px-2.5 py-1 rounded-full bg-[#171817] border border-[#C9A46A]/45 text-[11px] font-medium text-[#D8C9A9] whitespace-nowrap shadow-xl z-[70]">
              {user ? 'Hướng dẫn tham quan' : 'Hướng dẫn tham quan · Cần đăng nhập'}
            </span>
          </button>
        </div>
      </header>
      </div>

      {/* Mobile Right Slide-Over Navigation Drawer (< 768px) */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-[#171817]/70 z-[75]"
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={lang === 'en' ? 'Mobile Navigation' : lang === 'zh' ? '移动导航' : 'Menu điều hướng'}
            className="fixed inset-y-0 right-0 w-72 max-w-[85vw] max-h-[100dvh] bg-[#171817] border-l border-[#C9A46A]/30 text-[#D8C9A9] z-[80] p-5 flex flex-col justify-between overflow-y-auto heritage-scrollbar"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#C9A46A]/20">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-base font-semibold text-[#D8C9A9]">Dấu Ấn Việt</span>
                  <span className="text-[10px] font-semibold bg-[#C9A46A] text-[#171817] px-1.5 py-0.5 rounded-[4px]">
                    3D
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label={lang === 'en' ? 'Close menu' : lang === 'zh' ? '关闭菜单' : 'Đóng menu'}
                  className="w-8 h-8 rounded-full border border-[#D8C9A9]/20 text-[#D8C9A9] hover:border-[#C9A46A] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Account Card */}
              {user ? (
                <div className="p-3 rounded-xl bg-[#D8C9A9]/5 border border-[#C9A46A]/25 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#D8C9A9] truncate">
                      {user.displayName}
                    </span>
                    {renderTierPill('dark')}
                  </div>
                  <div className="text-[11px] text-[#D8C9A9]/65 truncate tabular-nums">
                    {user.email || (user.provider === 'facebook' ? 'Facebook Account' : 'Google Account')}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal();
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#A94F3D] hover:bg-[#8E4132] text-[#D8C9A9] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Sign In' : lang === 'zh' ? '登录' : 'Đăng nhập'}</span>
                </button>
              )}

              {/* Navigation Links */}
              <nav aria-label="Mobile Navigation" className="space-y-1">
                {navItems.map((item) => {
                  const isAudio = item.id === 'audio';
                  const isActive = !isAudio && activeTab === item.id;
                  const isAudioTierLocked = isAudio && !activeSitePerms.canUseAudioGuide;
                  const isLocked = !user && item.id !== 'explore' && item.id !== 'edtech' && !isAudio;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (item.id === 'explore') {
                          handleNavigateTab('explore');
                          return;
                        }
                        if (item.id === 'edtech') {
                          handleNavigateTab('edtech');
                          return;
                        }
                        if (isAudio) {
                          openModalForSite(selectedSite.id);
                        } else {
                          requireAuth(() => handleNavigateTab(item.id as MainTab), item.label);
                        }
                      }}
                      className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-medium flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#A94F3D] text-[#D8C9A9] font-semibold'
                          : 'text-[#D8C9A9]/85 hover:bg-[#D8C9A9]/10'
                      } ${isAudioTierLocked ? 'opacity-75' : ''}`}
                    >
                      <span>{item.label}</span>
                      {isAudioTierLocked ? (
                        <LockGlyph className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                      ) : isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </nav>

              {/* Utility Actions: Thư ngỏ, Đánh giá & Hỗ trợ, Hướng dẫn */}
              <div className="pt-3 border-t border-[#C9A46A]/20 space-y-1">
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsMyJourneyOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left text-xs text-[#D8C9A9] hover:bg-[#D8C9A9]/10 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5 text-[#A94F3D] shrink-0" />
                    <span>
                      {lang === 'en' ? 'My Account & Tickets' : lang === 'zh' ? '我的账户与门票' : 'Tài khoản & Vé của tôi'}
                    </span>
                  </button>
                )}

                {/* Thư ngỏ dự án (Accessible to ALL visitors) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleOpenGateLetterReview();
                  }}
                  className="w-full px-3 py-2 rounded-lg text-left text-xs text-[#D8C9A9] hover:bg-[#D8C9A9]/10 flex items-center gap-2.5 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9A46A"
                    strokeWidth="1.75"
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

                {/* Nguồn tư liệu & Bản quyền (Accessible to ALL visitors on Mobile Menu) */}
                <ArchivalSourcesTrigger
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleOpenMediaCredits(null, 'ALL');
                  }}
                  tone="dark"
                  fullWidth
                />

                {/* Đánh giá & Hỗ trợ (Moved cleanly from mobile bottom floating bar) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleRequestOpenFeedback();
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-left text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    user
                      ? 'text-[#D8C9A9] hover:bg-[#D8C9A9]/10'
                      : 'text-[#D8C9A9]/65 hover:bg-[#D8C9A9]/10'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {user ? (
                      <Star className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#A94F3D] shrink-0" />
                    )}
                    <span>
                      {lang === 'en'
                        ? 'Feedback & Support'
                        : lang === 'zh'
                        ? '评价与支持'
                        : 'Đánh giá & Hỗ trợ'}
                    </span>
                  </span>
                  {!user && (
                    <span className="text-[10px] font-medium text-[#A94F3D] whitespace-nowrap">
                      {lang === 'en' ? 'Sign in' : lang === 'zh' ? '请登录' : 'Cần đăng nhập'}
                    </span>
                  )}
                </button>

                {/* Hướng dẫn tham quan (Sử Quan 4 trạm) */}
                <button
                  type="button"
                  onClick={handleRestartOnboarding}
                  className={`w-full px-3 py-2 rounded-lg text-left text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    user
                      ? 'text-[#D8C9A9] hover:bg-[#D8C9A9]/10'
                      : 'text-[#D8C9A9]/65 hover:bg-[#D8C9A9]/10'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {user ? (
                      <Compass className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#A94F3D] shrink-0" />
                    )}
                    <span>
                      {lang === 'en'
                        ? 'Guided Tour (4 Stations)'
                        : lang === 'zh'
                        ? '四站导览指南'
                        : 'Hướng dẫn tham quan'}
                    </span>
                  </span>
                  {!user && (
                    <span className="text-[10px] font-medium text-[#A94F3D] whitespace-nowrap">
                      {lang === 'en' ? 'Sign in' : lang === 'zh' ? '请登录' : 'Cần đăng nhập'}
                    </span>
                  )}
                </button>

                {/* Hướng dẫn sử dụng */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openGuideForSection();
                  }}
                  className="w-full px-3 py-2 rounded-lg text-left text-xs text-[#D8C9A9] hover:bg-[#D8C9A9]/10 flex items-center gap-2.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                  <span>
                    {lang === 'en'
                      ? 'User Guide'
                      : lang === 'zh'
                      ? '使用指南'
                      : 'Hướng dẫn sử dụng'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setSupportDefaultTab(hasUnreadSupport ? 'tickets' : 'faq');
                    setIsSupportModalOpen(true);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-left text-xs text-[#D8C9A9] hover:bg-[#D8C9A9]/10 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <LifeBuoy className="w-3.5 h-3.5 text-[#47796D] shrink-0" />
                    <span>
                      {lang === 'en' ? 'Help Center & FAQ' : lang === 'zh' ? '帮助中心与问答' : 'Trung tâm Trợ giúp'}
                    </span>
                  </span>
                  {hasUnreadSupport && <span className="w-2 h-2 rounded-full bg-[#A94F3D]" />}
                </button>

                {isNonAdminTesterPro && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setTesterBugSubmittedCode(null);
                      setTesterBugDescription('');
                      setIsTesterBugModalOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left text-xs text-[#D8C9A9] hover:bg-[#D8C9A9]/10 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Bug className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
                    <span>
                      {lang === 'en' ? 'Bug Report / Tester' : lang === 'zh' ? '测试员报错' : 'Báo cáo lỗi Tester'}
                    </span>
                  </button>
                )}

                {isNonAdminBetaTester && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openLabsModal();
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left text-xs text-[#D8C9A9] hover:bg-[#D8C9A9]/10 flex items-center gap-2.5 cursor-pointer"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-[#47796D] shrink-0" />
                    <span>Dấu Ấn Labs</span>
                  </button>
                )}

                {isStrictAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAdminStudioOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-left text-xs font-semibold bg-[#C9A46A] text-[#171817] flex items-center gap-2.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Admin Studio</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#C9A46A]/20 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wider text-[#D8C9A9]/60">
                  {lang === 'en' ? 'Language' : lang === 'zh' ? '语言' : 'Ngôn ngữ'}
                </span>
                <div className="flex items-center gap-2">
                  <AmbientAudioControl popoverAlign="right" popoverPlacement="top" />
                  <div className="inline-flex items-center p-0.5 rounded-full bg-[#D8C9A9]/10 border border-[#C9A46A]/30">
                    {(['vi', 'en', 'zh'] as Language[]).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLang(l)}
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold uppercase cursor-pointer ${
                          lang === l ? 'bg-[#C9A46A] text-[#171817]' : 'text-[#D8C9A9]/75'
                        }`}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {user && (
                <div className="px-3 py-1.5 rounded-lg bg-[#D8C9A9]/8 border border-[#C9A46A]/20 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[11px] font-medium text-[#D8C9A9]/85">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        cloudSyncStatus.state === 'synced'
                          ? 'bg-[#47796D]'
                          : 'bg-[#C9A46A] animate-pulse'
                      }`}
                    />
                    <span>
                      {cloudSyncStatus.state === 'synced'
                        ? 'Đã đồng bộ đám mây'
                        : 'Đang kết nối lại...'}
                    </span>
                  </span>
                  {favoriteSiteIds.length > 0 && (
                    <span className="text-[10px] font-medium text-[#C9A46A] tabular-nums">
                      {favoriteSiteIds.length} yêu thích
                    </span>
                  )}
                </div>
              )}

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAdminStudioOpen(false);
                    setIsMyJourneyOpen(false);
                    setIsFeedbackOpen(false);
                    setDetailModalSiteId(null);
                    setPhotoManagerSiteId(null);
                    setIsAiChatOpen(false);
                    setCinemaState({ isOpen: false, siteId: null, activeVideoHeritageId: null });
                    setActiveTab('explore');
                    logout();
                  }}
                  className="w-full px-3 py-2 rounded-lg text-left text-xs text-[#A94F3D] font-semibold hover:bg-[#A94F3D]/15 flex items-center gap-2.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'en' ? 'Sign Out' : lang === 'zh' ? '退出登录' : 'Đăng xuất'}</span>
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Event Announcement Banner controlled from Admin Studio -> Site Settings */}
      {siteSettings.bannerEnabled && siteSettings.bannerText.trim() && (
        <div className="bg-[#EDE4D0] border-b border-[#171817]/15 px-4 py-2 text-center">
          <button
            type="button"
            onClick={() => {
              if (siteSettings.bannerLinkTab === 'explore') {
                handleNavigateTab('explore');
              } else {
                requireAuth(
                  () => handleNavigateTab(siteSettings.bannerLinkTab),
                  siteSettings.bannerText
                );
              }
            }}
            className="text-xs font-medium text-[#171817] hover:text-[#A94F3D] transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <span className="px-2 py-0.5 rounded-full bg-[#A94F3D] text-[#D8C9A9] text-[11px] font-semibold shrink-0">
              {lang === 'en' ? 'Event' : lang === 'zh' ? '活动' : 'Sự kiện'}
            </span>
            <span>{siteSettings.bannerText}</span>
          </button>
        </div>
      )}

      {/* ====================================================================
          2. MAIN VIEWPORT CONTENT (sticky h-16 header above)
         ==================================================================== */}
      <main
        className={`flex-1 flex flex-col bg-[#D8C9A9] ${
          !isAudioModalOpen && activeTab !== 'space3d' && activeTab !== 'map_routes'
            ? 'pb-4 md:pb-0'
            : ''
        }`}
      >
        {sites.length === 0 && !canPreviewHidden ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C9A46A] border border-[#171817]/20 flex items-center justify-center text-[#171817]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#171817]">
              {lang === 'en'
                ? 'The Exhibition Gallery is Being Updated by Curators'
                : lang === 'zh'
                ? '展厅正在由博物馆管理委员会更新维护'
                : 'Không gian trưng bày đang được Ban Quản lý cập nhật'}
            </h2>
            <p className="text-sm text-[#171817]/75 max-w-md">
              {lang === 'en'
                ? 'All monument dossiers are currently in internal maintenance mode. Please check back shortly or contact an Administrator.'
                : lang === 'zh'
                ? '当前所有遗产档案处于内部维护模式。请稍后访问或联系管理员。'
                : 'Hiện tất cả hồ sơ di tích đang ở chế độ bảo trì nội bộ. Vui lòng quay lại sau hoặc liên hệ Quản trị viên.'}
            </p>
          </div>
        ) : (
          <>
        {/* TAB 1: KHÁM PHÁ */}
        {!isAudioModalOpen && activeTab === 'explore' && (
          <div className="relative w-full bg-[#D8C9A9]">
            <AppleErrorBoundary
              variant="spatial3d"
              lang={lang}
              onReset={() => setViewerResetKey((k) => k + 1)}
            >
              <AppleScrollytellingHome
                key={`explore-${viewerResetKey}`}
                sites={sites}
                hiddenSiteIds={hiddenSiteIds}
                selectedSite={selectedSite}
                isAuthenticated={Boolean(user)}
                isAudioGuideLocked={!activeSitePerms.canUseAudioGuide}
                userDisplayName={user?.displayName}
                isStrictAdmin={isStrictAdmin}
                onOpenAdminGlbUpload={isStrictAdmin ? handleOpenAdminGlbUpload : undefined}
                guidedTours={resolvedGuidedTours}
                masterpieceSite={masterpieceSite}
                onStartGuidedTour={(tour) =>
                  requireAuth(
                    (authedUser) => startGuidedTourSession(tour, authedUser),
                    tour.route.title
                  )
                }
                onStartMasterpiece={() =>
                  requireAuth(
                    (authedUser) => startMasterpieceSession(authedUser),
                    masterpieceSite
                      ? getLocalizedSite(masterpieceSite).officialName
                      : 'Không gian 3D'
                  )
                }
                onSelectSite={(site) => {
                  setSelectedSiteId(site.id);
                  void recordHeritageVisitStat(site.id);
                }}
                onOpen3D={(site) =>
                  requireAuth(
                    (authedUser) => handleOpen3D(site, authedUser),
                    lang === 'en' ? '3D Space' : lang === 'zh' ? '3D 空间' : 'Không gian 3D'
                  )
                }
                onOpenDetailModal={(site) =>
                  requireAuth(
                    (authedUser) => handleOpenDetailModal(site, authedUser),
                    lang === 'en' ? 'Heritage Dossier' : lang === 'zh' ? '遗产档案' : 'Hồ sơ Di sản'
                  )
                }
                onOpenAudioModal={(site) =>
                  requireAuth(
                    () => {
                      setSelectedSiteId(site.id);
                      openModalForSite(site.id);
                    },
                    lang === 'en' ? 'Audio Guide' : lang === 'zh' ? '语音导览' : 'Thuyết minh'
                  )
                }
                onOpenPhotoManager={(site) =>
                  requireAuth(
                    () => {
                      setSelectedSiteId(site.id);
                      setPhotoManagerSiteId(site.id);
                    },
                    lang === 'en' ? 'Archive Photos' : lang === 'zh' ? '实景照片' : 'Ảnh tư liệu'
                  )
                }
                onOpenCinemaModal={(site) =>
                  requireAuth(
                    () => handleOpenCinemaModal(site),
                    lang === 'en' ? 'Documentary Video' : lang === 'zh' ? '纪录片' : 'Video Tư Liệu'
                  )
                }
                onNavigateTab={(tab) => {
                  if (tab === 'explore') {
                    handleNavigateTab('explore');
                  } else {
                    requireAuth(
                      () => {
                        if (tab === 'catalog') {
                          setCatalogSubView('dossiers');
                          handleNavigateTab('catalog', 'smooth');
                        } else {
                          handleNavigateTab(tab);
                        }
                      },
                      tab === 'space3d'
                        ? 'Không gian 3D'
                        : tab === 'map_routes'
                        ? 'Bản đồ & Tuyến'
                        : tab === 'catalog'
                        ? 'Hồ sơ Di sản'
                        : 'Vé & Học liệu'
                    );
                  }
                }}
                onOpenGuide={() => openGuideForSection('explore')}
                onOpenGateLetter={handleOpenGateLetterReview}
                onOpenMediaCredits={() => handleOpenMediaCredits(null, 'ALL')}
                isPaused={
                  activeTab !== 'explore' ||
                  cinemaState.isOpen ||
                  mediaCreditsState.isOpen ||
                  Boolean(detailModalSite) ||
                  isAudioModalOpen ||
                  Boolean(photoManagerSite) ||
                  isGuideOpen ||
                  isAiChatOpen ||
                  isAuthModalOpen ||
                  isAdminStudioOpen ||
                  isMyJourneyOpen ||
                  isFeedbackOpen ||
                  isLabsModalOpen ||
                  isQuickNoteOpen ||
                  isGuidedWelcomeOpen ||
                  (isOnboardingOpen && onboardingStep === 1) ||
                  Boolean(completedGuidedTour)
                }
              />
            </AppleErrorBoundary>
          </div>
        )}

        {/* TAB 2: KHÔNG GIAN 3D — KEEPS #171817 STAGE */}
        {activeTab === 'space3d' && (
          <div
            className={
              isAudioModalOpen
                ? 'hidden'
                : 'w-full h-[calc(100vh-4rem)] bg-[#171817] relative overflow-hidden'
            }
          >
            <AppleErrorBoundary
              variant="spatial3d"
              lang={lang}
              onReset={() => setViewerResetKey((k) => k + 1)}
              onReturnHome={() => handleNavigateTab('explore')}
            >
              <ThreeDModelViewer
                key={`space3d-${viewerResetKey}`}
                site={selectedSite}
                sites={sites}
                hiddenSiteIds={hiddenSiteIds}
                onSelectSite={(site) => {
                  setSelectedSiteId(site.id);
                  void recordHeritageVisitStat(site.id);
                  void recordServerSiteView(
                    site.id,
                    site.officialName,
                    'open_3d',
                    user?.displayName || user?.email
                  );
                  recordVisitorExploredSite(user?.userId, site.id);
                }}
                onUpdateCustomPhoto={(siteId, photoDataUrl) => {
                  const updated = saveCustomSitePhoto(siteId, photoDataUrl);
                  setCustomPhotosMap(updated);
                }}
                onRestoreDefaultPhoto={(siteId) => {
                  const updated = removeCustomSitePhoto(siteId);
                  setCustomPhotosMap(updated);
                }}
                isGettyLanding={false}
                defaultLightingMode={siteSettings.default3DLighting}
                initialRenderMode={pending3DRenderMode}
                initialExplodedFactor={pending3DExploded}
                onOpenMapOverlay={() => handleLocateOnMap(selectedSite)}
                onOpenAudioModal={(site) => openModalForSite(site.id)}
                onOpenVideoModal={(site) => handleOpenCinemaModal(site)}
                onOpenDetailModal={(site) => handleOpenDetailModal(site)}
                onOpenArchiveDrawer={() => {
                  setCatalogSubView('dossiers');
                  handleNavigateTab('catalog');
                }}
                onNavigateToTickets={() => handleNavigateTab('edtech')}
                onOpenGuide={() => openGuideForSection('space3d')}
                onOpenAdminGlbUpload={isStrictAdmin ? handleOpenAdminGlbUpload : undefined}
                onClose={() => handleNavigateTab('explore')}
                isPaused={
                  activeTab !== 'space3d' ||
                  cinemaState.isOpen ||
                  Boolean(detailModalSite) ||
                  isAudioModalOpen ||
                  Boolean(photoManagerSite) ||
                  isGuideOpen ||
                  isAiChatOpen ||
                  isAuthModalOpen ||
                  isAdminStudioOpen ||
                  isMyJourneyOpen ||
                  isFeedbackOpen ||
                  isGuidedWelcomeOpen ||
                  Boolean(completedGuidedTour)
                }
              />
            </AppleErrorBoundary>

            {masterpieceAudioHintSite &&
              selectedSite.id === masterpieceAudioHintSite.id &&
              !isAudioModalOpen &&
              !isAudioPlaying && (
                <div
                  role="status"
                  className="fixed top-20 left-1/2 -translate-x-1/2 z-30 max-w-[calc(100vw-2rem)] rounded-full bg-[#F4EFE4] border border-[#171817]/20 px-4 py-2 shadow-lg flex items-center gap-2.5 animate-apple-sheet"
                >
                  <Headphones className="w-4 h-4 text-[#A94F3D] shrink-0" />
                  <span className="text-xs text-[#171817] truncate">
                    {lang === 'en'
                      ? 'Exploring masterpiece '
                      : lang === 'zh'
                      ? '正在打开杰作 '
                      : 'Đang mở kiệt tác '}
                    <strong className="text-[#A94F3D]">
                      {getLocalizedSite(masterpieceAudioHintSite).officialName}
                    </strong>
                    {lang === 'en'
                      ? ' · Start audio narration?'
                      : lang === 'zh'
                      ? ' · 是否开启语音导览？'
                      : ' · Gợi ý bật thuyết minh?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = masterpieceAudioHintSite.id;
                      setMasterpieceAudioHintSite(null);
                      startAudioGuideForSite(targetId);
                    }}
                    className="px-3 py-1 rounded-full bg-[#A94F3D] hover:bg-[#171817] text-[#D8C9A9] text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                  >
                    {lang === 'en'
                      ? 'Play Audio Guide'
                      : lang === 'zh'
                      ? '开启导览'
                      : 'Bật thuyết minh'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMasterpieceAudioHintSite(null)}
                    aria-label={
                      lang === 'en'
                        ? 'Dismiss audio hint'
                        : lang === 'zh'
                        ? '关闭语音提示'
                        : 'Đóng gợi ý thuyết minh'
                    }
                    className="w-6 h-6 rounded-full bg-[#EDE4D0] hover:bg-[#171817] text-[#171817] hover:text-[#D8C9A9] flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            <div className="pointer-events-none fixed bottom-1 left-1/2 -translate-x-1/2 z-40 text-[11px] font-medium text-[#D8C9A9]/60 whitespace-nowrap select-none">
              Made by Hoang Hai
            </div>
          </div>
        )}

        {/* TAB 3: BẢN ĐỒ & TUYẾN — GIS MULTI-LAYER & 9 HERITAGE ROUTES */}
        {!isAudioModalOpen && activeTab === 'map_routes' && (
          <div className="w-full h-[calc(100dvh-3.25rem)] md:h-[calc(100vh-4rem)] bg-[#D8C9A9] flex flex-col lg:flex-row overflow-hidden relative">
            {/* Desktop/Tablet Sidebar (>= 768px untouched; hidden on mobile < 768px so map reclaims full height) */}
            <div className="hidden md:flex w-full lg:w-[375px] xl:w-[400px] md:h-[44%] lg:h-full shrink-0 border-b lg:border-b-0 lg:border-r border-[#171817]/15 bg-[#F4EFE4] flex-col overflow-hidden">
              {/* Compact Segmented Switcher: Bản đồ GIS | 9 Tuyến Di sản */}
              <div className="p-2.5 border-b border-[#171817]/15 bg-[#EDE4D0] shrink-0">
                <div className="grid grid-cols-2 p-1 rounded-full bg-[#D8C9A9] border border-[#171817]/15 gap-1">
                  <button
                    type="button"
                    onClick={() => setMapSubView('gis')}
                    className={`py-1.5 px-3 rounded-full text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      mapSubView === 'gis'
                        ? 'bg-[#A94F3D] text-[#D8C9A9] font-semibold'
                        : 'text-[#171817]/75 hover:text-[#171817]'
                    }`}
                  >
                    <MapIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {lang === 'en' ? 'GIS Map' : lang === 'zh' ? 'GIS 地图' : 'Bản đồ GIS'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMapSubView('routes');
                      handleSelectTourRoute(activeTour || TOUR_ROUTES[0]);
                    }}
                    className={`py-1.5 px-3 rounded-full text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      mapSubView === 'routes'
                        ? 'bg-[#47796D] text-[#171817] font-semibold'
                        : 'text-[#171817]/75 hover:text-[#171817]'
                    }`}
                  >
                    <Route className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {lang === 'en'
                        ? `${TOUR_ROUTES.length} Heritage Routes`
                        : lang === 'zh'
                        ? `${TOUR_ROUTES.length}条遗产路线`
                        : `${TOUR_ROUTES.length} Tuyến Di sản`}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                {mapSubView === 'gis' ? (
                  <FloatingExplorer
                    sites={filteredMapSites}
                    hiddenSiteIds={hiddenSiteIds}
                    selectedSite={selectedSite}
                    onSelectSite={(site) => {
                      setSelectedSiteId(site.id);
                      setMapFocusTick((t) => t + 1);
                    }}
                    onOpen3D={(site) => handleOpen3D(site)}
                    onOpenARAudio={(site) => openModalForSite(site.id)}
                    onOpenDetailModal={(site) => handleOpenDetailModal(site)}
                    onOpenVideo={(site) => handleOpenCinemaModal(site)}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filterRanking={filterRanking}
                    onFilterRankingChange={setFilterRanking}
                    filterDistrict={filterDistrict}
                    onFilterDistrictChange={setFilterDistrict}
                    filterType={filterType}
                    onFilterTypeChange={setFilterType}
                    filterTech={filterTech}
                    onFilterTechChange={setFilterTech}
                    uniqueDistricts={uniqueDistricts}
                    totalSitesCount={sites.length}
                    activeTour={null}
                    onSelectTour={(tour) => {
                      handleSelectTourRoute(tour);
                      if (tour) {
                        setMapSubView('routes');
                      }
                    }}
                  />
                ) : (
                  <TourRoutePanel
                    activeTour={activeTour}
                    onSelectTour={handleSelectTourRoute}
                    allSites={sites}
                    hiddenSiteIds={hiddenSiteIds}
                    selectedSite={selectedSite}
                    completedRouteIds={visitorRecord?.completedRouteIds || []}
                    onCompleteTour={(tour) => {
                      if (user) {
                        recordVisitorCompletedRoute(user.userId, tour.id);
                      }
                    }}
                    onFocusSite={(site) => {
                      setSelectedSiteId(site.id);
                      setMapFocusTick((t) => t + 1);
                    }}
                    onOpen3D={(site) => handleOpen3D(site)}
                    onOpenARAudio={(site) => openModalForSite(site.id)}
                    onOpenDetailModal={(site) => handleOpenDetailModal(site)}
                    onOpenVideo={(site) => handleOpenCinemaModal(site)}
                  />
                )}
              </div>
            </div>

            <div className="flex-1 h-full md:h-[56%] lg:h-full relative overflow-hidden">
              {/* MOBILE (< 768px) COMPACT 1-ROW FLOATING SEARCH + 2 CIRCULAR ICON TOGGLES (ROUTES & MAP LAYERS COLLAPSED BY DEFAULT) */}
              <div
                className="md:hidden absolute top-2.5 left-2.5 right-2.5 z-30 pointer-events-none flex flex-col gap-2"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Single Floating Row: Search Bar + Routes Icon Button + Map Layers Icon Button */}
                <div className="pointer-events-auto flex items-center gap-1.5">
                  <div className="relative flex-1 min-w-0 flex items-center h-10 bg-[#F4EFE4]/95 backdrop-blur-xl border border-[#171817]/20 rounded-full shadow-[0_8px_24px_rgba(23,24,23,0.28)]">
                    <Search
                      className="w-3.5 h-3.5 text-[#171817]/55 absolute left-3 pointer-events-none"
                      strokeWidth={1.7}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onFocus={() => {
                        setIsMobileMapSearchOpen(true);
                        setIsMobileRoutesOpen(false);
                        setIsMobileLayersOpen(false);
                      }}
                      onClick={() => {
                        setIsMobileMapSearchOpen(true);
                        setIsMobileRoutesOpen(false);
                        setIsMobileLayersOpen(false);
                      }}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsMobileMapSearchOpen(true);
                        setIsMobileRoutesOpen(false);
                        setIsMobileLayersOpen(false);
                      }}
                      placeholder={
                        lang === 'en'
                          ? 'Search 17 monuments...'
                          : lang === 'zh'
                          ? '搜索17处遗产...'
                          : 'Tìm 17 di tích...'
                      }
                      className="w-full pl-8 pr-7 py-2 bg-transparent text-[12px] text-[#171817] placeholder-[#171817]/55 focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setIsMobileMapSearchOpen(false);
                        }}
                        aria-label={lang === 'en' ? 'Clear search' : lang === 'zh' ? '清除搜索' : 'Xóa tìm kiếm'}
                        className="absolute right-2.5 text-[#171817]/60 hover:text-[#A94F3D] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={1.7} />
                      </button>
                    )}
                  </div>

                  {/* Circular Icon Button 1: Toggle Heritage Routes Drawer */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileRoutesOpen((prev) => !prev);
                      setIsMobileLayersOpen(false);
                      setIsMobileMapSearchOpen(false);
                    }}
                    aria-expanded={isMobileRoutesOpen}
                    aria-label={
                      lang === 'en'
                        ? 'Heritage Routes'
                        : lang === 'zh'
                        ? '遗产路线'
                        : 'Danh sách Tuyến di sản'
                    }
                    title={
                      lang === 'en'
                        ? 'Heritage Routes'
                        : lang === 'zh'
                        ? '遗产路线'
                        : 'Danh sách Tuyến di sản'
                    }
                    className={`relative w-10 h-10 rounded-full shrink-0 flex items-center justify-center border shadow-[0_8px_24px_rgba(23,24,23,0.28)] transition-colors cursor-pointer ${
                      isMobileRoutesOpen || (mapSubView === 'routes' && activeTour)
                        ? 'bg-[#47796D] border-[#C9A46A] text-[#F4EFE4]'
                        : 'bg-[#171817]/95 border-[#C9A46A]/45 text-[#C9A46A]'
                    }`}
                  >
                    <Route className="w-4 h-4" />
                    {mapSubView === 'routes' && activeTour && !isMobileRoutesOpen && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#C9A46A]" />
                    )}
                  </button>

                  {/* Circular Icon Button 2: Toggle Map Layers (Dark / Satellite / Historical) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileLayersOpen((prev) => !prev);
                      setIsMobileRoutesOpen(false);
                      setIsMobileMapSearchOpen(false);
                    }}
                    aria-expanded={isMobileLayersOpen}
                    aria-label={
                      lang === 'en'
                        ? 'Map Layers'
                        : lang === 'zh'
                        ? '地图图层'
                        : 'Lớp bản đồ'
                    }
                    title={
                      lang === 'en'
                        ? 'Map Layers'
                        : lang === 'zh'
                        ? '地图图层'
                        : 'Lớp bản đồ'
                    }
                    className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border shadow-[0_8px_24px_rgba(23,24,23,0.28)] transition-colors cursor-pointer ${
                      isMobileLayersOpen || baseMapMode !== 'admin'
                        ? 'bg-[#C9A46A] border-[#171817]/30 text-[#171817]'
                        : 'bg-[#171817]/95 border-[#C9A46A]/45 text-[#C9A46A]'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                </div>

                {/* Collapsible Search Results Dropdown */}
                {(isMobileMapSearchOpen || searchQuery.trim().length > 0) && (
                  <div className="pointer-events-auto">
                    <HeritageSiteListPanel
                      sites={sites}
                      canonicalSites={allSites}
                      selectedSiteId={selectedSite?.id}
                      searchQuery={searchQuery}
                      onSearchQueryChange={setSearchQuery}
                      showInternalSearch={false}
                      showRegionFilters
                      customPhotosMap={customPhotosMap}
                      hiddenSiteIds={hiddenSiteIds}
                      canPreviewHidden={canPreviewHidden}
                      maxListHeightClass="max-h-[250px]"
                      onClose={() => setIsMobileMapSearchOpen(false)}
                      onSelectSite={(site) => {
                        setSelectedSiteId(site.id);
                        setMapFocusTick((t) => t + 1);
                        setSearchQuery('');
                        setIsMobileMapSearchOpen(false);
                      }}
                    />
                  </div>
                )}

                {/* Collapsible Map Layers Popover (Bản đồ tối / Vệ tinh / Bản đồ lịch sử) */}
                {isMobileLayersOpen && (
                  <DragScrollRow className="pointer-events-auto self-end max-w-full bg-[#171817]/95 backdrop-blur-xl border border-[#C9A46A]/40 rounded-2xl p-1.5 pb-2 shadow-2xl flex items-center gap-1.5 overflow-x-auto flex-nowrap heritage-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setBaseMapMode('admin');
                        setIsMobileLayersOpen(false);
                      }}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                        baseMapMode === 'admin'
                          ? 'bg-[#A94F3D] text-[#F4EFE4]'
                          : 'text-[#D8C9A9]/80 hover:bg-[#D8C9A9]/10'
                      }`}
                    >
                      <MapIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{lang === 'zh' ? '深色地图' : lang === 'en' ? 'Dark Map' : 'Bản đồ tối'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBaseMapMode('satellite');
                        setIsMobileLayersOpen(false);
                      }}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                        baseMapMode === 'satellite'
                          ? 'bg-[#47796D] text-[#F4EFE4]'
                          : 'text-[#D8C9A9]/80 hover:bg-[#D8C9A9]/10'
                      }`}
                    >
                      <Satellite className="w-3.5 h-3.5 shrink-0" />
                      <span>{lang === 'zh' ? '卫星地图' : lang === 'en' ? 'Satellite' : 'Vệ tinh'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBaseMapMode('historical_1815');
                        setIsMobileLayersOpen(false);
                      }}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                        baseMapMode.startsWith('historical')
                          ? 'bg-[#C9A46A] text-[#171817]'
                          : 'text-[#D8C9A9]/80 hover:bg-[#D8C9A9]/10'
                      }`}
                    >
                      <History className="w-3.5 h-3.5 shrink-0" />
                      <span>{lang === 'zh' ? '历史地图' : lang === 'en' ? 'Historical Map' : 'Bản đồ lịch sử'}</span>
                    </button>
                  </DragScrollRow>
                )}

                {/* Collapsible Heritage Routes Drawer (Default Hidden) */}
                {isMobileRoutesOpen && (
                  <div className="pointer-events-auto bg-[#171817]/95 backdrop-blur-xl border border-[#C9A46A]/35 rounded-2xl p-2.5 shadow-2xl max-h-[50vh] flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#C9A46A]/20 shrink-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A46A]">
                        {lang === 'en'
                          ? `${TOUR_ROUTES.length} Heritage Routes`
                          : lang === 'zh'
                          ? `${TOUR_ROUTES.length}条遗产路线`
                          : `${TOUR_ROUTES.length} Tuyến Di sản`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {mapSubView === 'routes' && (
                          <button
                            type="button"
                            onClick={() => {
                              setMapSubView('gis');
                              setIsMobileRoutesOpen(false);
                            }}
                            className="px-2 py-0.5 rounded-full bg-[#D8C9A9]/12 border border-[#C9A46A]/30 text-[10px] font-medium text-[#D8C9A9] cursor-pointer"
                          >
                            {lang === 'en' ? 'Show All GIS' : lang === 'zh' ? '全部点位' : 'Tất cả 17 di tích'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsMobileRoutesOpen(false)}
                          aria-label={lang === 'en' ? 'Close routes' : lang === 'zh' ? '关闭路线' : 'Đóng tuyến'}
                          className="w-6 h-6 rounded-full border border-[#D8C9A9]/20 text-[#D8C9A9]/80 flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <DragScrollRow className="flex items-stretch gap-2 overflow-x-auto flex-nowrap heritage-scrollbar pb-1.5">
                      {TOUR_ROUTES.map((tour, idx) => {
                        const isActive = mapSubView === 'routes' && activeTour?.id === tour.id;
                        const locTour = getLocalizedTour(tour);
                        const cleanTitle = locTour.title.replace(
                          /^(Tuyến|Route|路线)\s*\d+\s*[—:-]\s*/i,
                          ''
                        );
                        const routePalette = getTourRouteIndochineColor(tour);
                        const routeStopNames = tour.sites
                          .map((id) => sites.find((s) => s.id === id))
                          .filter((s): s is HeritageSite => Boolean(s))
                          .map((s) =>
                            getLocalizedSite(s).officialName.split(/\s*[-–(（]/)[0].trim()
                          );

                        return (
                          <button
                            key={tour.id}
                            type="button"
                            onClick={() => {
                              setMapSubView('routes');
                              handleSelectTourRoute(tour);
                              setIsMobileRoutesOpen(false);
                            }}
                            style={{
                              borderLeftColor: routePalette.primaryHex,
                              borderLeftWidth: '3px',
                            }}
                            className={`shrink-0 w-[232px] text-left px-2.5 py-2 rounded-xl border transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-[#C9A46A]/20 border-[#C9A46A] text-[#F4EFE4]'
                                : 'bg-[#222321]/85 border-[#D8C9A9]/12 text-[#D8C9A9] hover:bg-[#2B2C2A]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-[#C9A46A] tabular-nums">
                                {lang === 'en'
                                  ? `Route ${String(idx + 1).padStart(2, '0')}`
                                  : lang === 'zh'
                                  ? `路线 ${String(idx + 1).padStart(2, '0')}`
                                  : `Tuyến ${String(idx + 1).padStart(2, '0')}`}
                              </span>
                              <span className="text-[10px] text-[#D8C9A9]/60 truncate">
                                {locTour.region || tour.region}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-[#F4EFE4] truncate mt-0.5">
                              {cleanTitle}
                            </div>
                            <div className="text-[10px] text-[#D8C9A9]/65 truncate mt-0.5">
                              {routeStopNames.join(' · ')}
                            </div>
                          </button>
                        );
                      })}
                    </DragScrollRow>
                  </div>
                )}
              </div>

              <MapCanvas
                sites={mapSubView === 'gis' ? filteredMapSites : sites}
                selectedSite={selectedSite}
                activeMapHeritageId={activeMapHeritageId}
                focusTick={mapFocusTick}
                tourFocusTick={tourFocusTick}
                onSelectSite={(site) => {
                  setIsMobileRoutesOpen(false);
                  setIsMobileLayersOpen(false);
                  setIsMobileMapSearchOpen(false);
                  if (site) setSelectedSiteId(site.id);
                }}
                activeTour={mapSubView === 'routes' ? activeTour : null}
                baseMapMode={baseMapMode}
                onChangeBaseMapMode={setBaseMapMode}
                onOpenARAudio={(site) => openModalForSite(site.id)}
                onTriggerAudioGuide={(site) => startAudioGuideForSite(site.id)}
                onOpen3D={(site) => handleOpen3D(site)}
                onOpenDetailModal={(site) => handleOpenDetailModal(site)}
                onOpenPhotoManager={(site) => setPhotoManagerSiteId(site.id)}
                onOpenVideo={(site) => handleOpenCinemaModal(site)}
                onOpenGuide={() => openGuideForSection('map_routes')}
              />
            </div>

            <div className="hidden md:block pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 text-[11px] font-medium text-[#D8C9A9]/60 whitespace-nowrap select-none drop-shadow-[0_1px_2px_rgba(23,24,23,0.9)]">
              Made by Hoang Hai
            </div>
          </div>
        )}

        {/* TAB 4: HỒ SƠ DI SẢN & BIÊN NIÊN SỬ 300 NĂM */}
        {!isAudioModalOpen && activeTab === 'catalog' && (
          <div className="flex-1 w-full bg-[#D8C9A9]">
            {/* Centered Editorial Pill Sub-Navigation */}
            <div className="w-full flex justify-center items-center py-3 px-4">
              <div className="inline-flex items-center p-1 rounded-full bg-[#EDE4D0] border border-[#171817]/15 gap-1">
                <button
                  type="button"
                  onClick={() => setCatalogSubView('dossiers')}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    catalogSubView === 'dossiers'
                      ? 'bg-[#A94F3D] text-[#D8C9A9] font-semibold'
                      : 'text-[#171817]/75 hover:text-[#171817]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'en'
                      ? `${sites.length} Heritage Dossiers`
                      : lang === 'zh'
                      ? `${sites.length} 份遗产档案`
                      : `${sites.length} Hồ sơ Di tích`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogSubView('timeline')}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    catalogSubView === 'timeline'
                      ? 'bg-[#47796D] text-[#171817] font-semibold'
                      : 'text-[#171817]/75 hover:text-[#171817]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'en'
                      ? '300-Year Chronicle'
                      : lang === 'zh'
                      ? '300年历史编年史'
                      : 'Biên niên sử 300 Năm'}
                  </span>
                </button>
              </div>
            </div>

            {catalogSubView === 'dossiers' ? (
              <HeritageCatalog
                sites={sites}
                hiddenSiteIds={hiddenSiteIds}
                onSelectSiteOnMap={(site) => handleLocateOnMap(site)}
                onOpen3D={(site) => handleOpen3D(site)}
                onOpenARAudio={(site) => {
                  setSelectedSiteId(site.id);
                  openModalForSite(site.id);
                }}
                onOpenDetailModal={(site) => handleOpenDetailModal(site)}
                onOpenVideo={(site) => handleOpenCinemaModal(site)}
                customPhotosMap={customPhotosMap}
                onOpenPhotoManager={(site) => {
                  setSelectedSiteId(site.id);
                  setPhotoManagerSiteId(site.id);
                }}
                onOpenMediaCredits={() => handleOpenMediaCredits(null, 'ALL')}
              />
            ) : (
              <HistoricalTimeline
                sites={sites}
                hiddenSiteIds={hiddenSiteIds}
                onSelectSiteById={(siteId) => handleOpenDetailModal(siteId)}
                onOpen3DById={(siteId) => {
                  const target = sites.find((s) => s.id === siteId) || selectedSite;
                  if (target) {
                    handleOpen3D(target);
                  } else {
                    setSelectedSiteId(siteId);
                    setActiveTab('space3d');
                    window.scrollTo({ top: 0, behavior: 'auto' });
                  }
                }}
              />
            )}

            <footer className="border-t border-[#171817]/15 bg-[#EDE4D0] text-[#171817] px-4 sm:px-8 pt-6 pb-6 md:pb-14">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] text-[#171817]/75">
                <span>
                  © 2026 Dấu Ấn Việt 3D ·{' '}
                  <span className="font-medium text-[#171817]">Made by Hoang Hai</span>
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={handleOpenGateLetterReview}
                    title={
                      lang === 'en'
                        ? 'Project Welcome Letter'
                        : lang === 'zh'
                        ? '项目开幕寄语'
                        : 'Thư ngỏ dự án'
                    }
                    className="group inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#171817] hover:text-[#A94F3D] transition-colors cursor-pointer"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C9A46A"
                      strokeWidth="1.8"
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
                    <span className="underline decoration-[#C9A46A]/70 underline-offset-4 group-hover:decoration-[#A94F3D]">
                      {lang === 'en'
                        ? 'Read the Welcome Letter from Grade 10 History Class – Le Quy Don High School for the Gifted – Vung Tau'
                        : lang === 'zh'
                        ? '阅读头顿黎贵惇重点高中十年级历史专业班开幕寄语'
                        : 'Đọc Thư ngỏ từ Tập thể Lớp 10 Chuyên Sử – THPT Chuyên Lê Quý Đôn – Vũng Tàu'}
                    </span>
                  </button>

                  <ArchivalSourcesTrigger
                    onClick={() => handleOpenMediaCredits(null, 'ALL')}
                    tone="light"
                  />
                </div>
                <span className="text-[#171817]/60">
                  {lang === 'en'
                    ? 'Digital Heritage Archive & Chronicle'
                    : lang === 'zh'
                    ? '数字文化遗产档案与编年史'
                    : 'Kho lưu trữ Hồ sơ Di sản Đông Nam Bộ'}
                </span>
              </div>
            </footer>
          </div>
        )}

        {/* TAB 5: VÉ & HỌC LIỆU (COMMERCIALIZATION & EDTECH HUB) */}
        {!isAudioModalOpen && activeTab === 'edtech' && (
          <div className="flex-1 w-full bg-[#D8C9A9]">
            <CommercializationEdTechHub
              sites={sites}
              hiddenSiteIds={hiddenSiteIds}
              preselectedGuidedRoute={preselectedGuidedRoute}
              onStart3DVipExperience={(siteId) => {
                const target =
                  (siteId ? sites.find((s) => s.id === siteId) : null) || selectedSite;
                if (target) {
                  handleOpen3D(target);
                } else {
                  if (siteId) setSelectedSiteId(siteId);
                  setActiveTab('space3d');
                  window.scrollTo({ top: 0, behavior: 'auto' });
                }
              }}
              onNavigateToMap={() => {
                setMapSubView('gis');
                setActiveTab('map_routes');
                window.scrollTo({ top: 0, behavior: 'auto' });
              }}
              onOpenAudioGuide={(site) => openModalForSite(site.id)}
              onOpenMyJourney={() => setIsMyJourneyOpen(true)}
              onOpenFeedback={handleRequestOpenFeedback}
              onOpenGuide={() => openGuideForSection('edtech')}
              onOpenMediaCredits={() => handleOpenMediaCredits(null, 'ALL')}
            />
          </div>
        )}

        {/* TAB 6: THUYẾT MINH DI SẢN — DARK EDITORIAL MUSEUM (DƯỚI NAVBAR) */}
        {isAudioModalOpen && (
          <ARAudioModal
            site={audioActiveSite || selectedSite}
            onClose={() => minimizeModalKeepPlaying()}
            onBackToExplore={() => {
              minimizeModalKeepPlaying();
              setActiveTab('explore');
              window.scrollTo({ top: 0, behavior: 'auto' });
            }}
            onSelectSite={(chosen) => setSelectedSiteId(chosen.id)}
            onLaunch3D={() => {
              const target = audioActiveSite || selectedSite;
              minimizeModalKeepPlaying();
              handleOpen3D(target);
            }}
            onNavigateToMap={(site) => {
              minimizeModalKeepPlaying();
              handleLocateOnMap(site);
            }}
            onOpenPhotoManager={(site) => {
              setPhotoManagerSiteId(site.id);
            }}
            onOpenGuide={() => openGuideForSection('audio')}
          />
        )}
          </>
        )}
      </main>

      {/* ====================================================================
          3. MODALS & FLOATING GEMINI AI CURATOR
         ==================================================================== */}
      {detailModalSite && (
        <HeritageDetailModal
          site={detailModalSite}
          isHiddenForVisitors={hiddenSiteIds.includes(detailModalSite.id)}
          onClose={() => setDetailModalSiteId(null)}
          onLaunch3D={() => {
            const target = detailModalSite;
            setDetailModalSiteId(null);
            handleOpen3D(target);
          }}
          onLaunchAudio={() => {
            const targetId = detailModalSite.id;
            setDetailModalSiteId(null);
            openModalForSite(targetId);
          }}
          onLaunchVideo={() => {
            const target = detailModalSite;
            setDetailModalSiteId(null);
            handleOpenCinemaModal(target);
          }}
          onNavigateToMap={(site) => {
            setDetailModalSiteId(null);
            handleLocateOnMap(site);
          }}
          onOpenPhotoManager={(site, slot = 0) => {
            setPhotoManagerInitialSlot(slot);
            setPhotoManagerSiteId(site.id);
          }}
        />
      )}

      {photoManagerSite && (
        <CustomPhotoManagerModal
          site={photoManagerSite}
          hasCustomPhoto={hasAnyCustomPhotoForSite(customPhotosMap, photoManagerSite.id)}
          customPhotosMap={customPhotosMap}
          initialSlot={photoManagerInitialSlot}
          onClose={() => {
            setPhotoManagerSiteId(null);
            setPhotoManagerInitialSlot(0);
          }}
          onSaveCustomPhoto={(siteId, photoDataOrUrl, slot: PhotoSlotIndex = 0) => {
            const updated = saveCustomSitePhoto(siteId, photoDataOrUrl, slot);
            setCustomPhotosMap(updated);
          }}
          onRestoreDefaultPhoto={(siteId, slot?: PhotoSlotIndex) => {
            const updated = removeCustomSitePhoto(siteId, slot);
            setCustomPhotosMap(updated);
          }}
          onRestoreAllDefaultPhotos={() => {
            clearAllCustomSitePhotos();
            setCustomPhotosMap(loadCustomPhotosMap());
          }}
        />
      )}

      {/* Guided Tour Progress Bar (non-intrusive bottom bar) */}
      {user && activeGuidedTour && (
        <GuidedTourProgressBar
          route={activeGuidedTour.route}
          stops={activeGuidedTour.stops}
          stepIndex={activeGuidedTour.stepIndex}
          positionClassName={
            activeTab === 'space3d'
              ? isFloatingBarVisible
                ? 'bottom-[144px] left-1/2 -translate-x-1/2'
                : 'bottom-[74px] left-1/2 -translate-x-1/2'
              : 'bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2'
          }
          onNextStep={handleGuidedNextStep}
          onOpenAudioGuide={(site) => startAudioGuideForSite(site.id)}
          onExitTour={() => setActiveGuidedTour(null)}
        />
      )}

      {/* Persistent Floating Audio Guide Bar across all pages & 3D Space */}
      <FloatingAudioBar
        onOpenStudio={(siteId) => openModalForSite(siteId)}
        offsetAboveRouteBar={
          (activeTab === 'map_routes' && mapSubView === 'routes' && Boolean(activeTour)) ||
          activeTab === 'space3d'
        }
        customBottomClass={
          activeGuidedTour && activeTab !== 'space3d'
            ? 'bottom-[128px] sm:bottom-[94px]'
            : undefined
        }
      />

      {/* Floating Experience Feedback, Welcome Letter, Tester Bug Report & Dấu Ấn Labs Bar (Desktop >= 768px only; on mobile moved cleanly inside Secondary Header Menu) */}
      {!isAudioModalOpen && (
        <div
          className={`hidden md:flex fixed left-5 z-40 flex-wrap items-center gap-2 max-w-[calc(100vw-2.5rem)] transition-all duration-200 ${
            activeGuidedTour
              ? isFloatingBarVisible
                ? 'bottom-[174px]'
                : 'bottom-[94px]'
              : isFloatingBarVisible
              ? activeTab === 'space3d'
                ? 'bottom-[144px]'
                : activeTab === 'map_routes' && mapSubView === 'routes' && activeTour
                ? 'bottom-[154px]'
                : 'bottom-20'
              : activeTab === 'map_routes' && mapSubView === 'routes' && activeTour
              ? 'bottom-[70px]'
              : activeTab === 'space3d'
              ? 'bottom-20'
              : 'bottom-5'
          }`}
        >
          <button
            type="button"
            onClick={handleRequestOpenFeedback}
            title={
              !user
                ? lang === 'en'
                  ? 'Sign in required to use Feedback & Support'
                  : lang === 'zh'
                  ? '需要登录账户以使用评价与支持'
                  : 'Cần đăng nhập tài khoản để sử dụng Đánh giá & Hỗ trợ'
                : lang === 'en'
                ? 'Feedback & Support'
                : lang === 'zh'
                ? '评价与支持'
                : 'Đánh giá & Hỗ trợ'
            }
            aria-label={
              !user
                ? 'Đánh giá & Hỗ trợ (Cần đăng nhập)'
                : 'Đánh giá & Hỗ trợ'
            }
            className={
              !user
                ? 'group inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#F7F3EB]/85 text-[#171817]/65 border border-[#A94F3D]/40 shadow-lg text-xs sm:text-sm font-medium hover:bg-[#F7F3EB] hover:border-[#A94F3D]/70 transition-all cursor-pointer'
                : 'inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#F7F3EB] text-[#171817] border border-[#171817]/15 shadow-lg text-xs sm:text-sm font-medium hover:bg-white transition-all cursor-pointer'
            }
          >
            {!user ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#A94F3D"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 shrink-0"
                aria-hidden="true"
              >
                <rect x="4" y="11" width="16" height="10" rx="2.5" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                <circle cx="12" cy="16" r="1" fill="#A94F3D" stroke="none" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="#C9A46A"
                stroke="#A94F3D"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 shrink-0"
                aria-hidden="true"
              >
                <polygon points="12 2.6 14.95 8.58 21.55 9.54 16.78 14.19 17.9 20.76 12 17.66 6.1 20.76 7.22 14.19 2.45 9.54 9.05 8.58 12 2.6" />
              </svg>
            )}
            <span className="whitespace-nowrap">
              {lang === 'en'
                ? 'Feedback & Support'
                : lang === 'zh'
                ? '评价与支持'
                : 'Đánh giá & Hỗ trợ'}
            </span>
            {!user && (
              <span className="hidden sm:inline-block pl-2 border-l border-[#A94F3D]/30 text-[11px] font-medium text-[#A94F3D] whitespace-nowrap">
                {lang === 'en' ? 'Sign in' : lang === 'zh' ? '请登录' : 'Cần đăng nhập'}
              </span>
            )}
          </button>

          {/* Public Quick-Open Pill: Project Welcome Letter (Accessible to ALL visitors) */}
          <button
            type="button"
            onClick={handleOpenGateLetterReview}
            title={
              lang === 'en'
                ? 'Project Welcome Letter'
                : lang === 'zh'
                ? '项目开幕寄语'
                : 'Thư ngỏ dự án'
            }
            aria-label={
              lang === 'en'
                ? 'Project Welcome Letter'
                : lang === 'zh'
                ? '项目开幕寄语'
                : 'Thư ngỏ dự án'
            }
            className="inline-flex items-center gap-1.5 bg-[#1C1D1B]/90 backdrop-blur-sm border border-[#C9A46A]/40 text-[#D8C9A9] hover:border-[#C9A46A] hover:text-[#F4EFE4] px-3.5 py-2 rounded-full text-xs font-medium shadow-lg transition-all cursor-pointer whitespace-nowrap"
          >
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
              <path d="M8 21h10a2 2 0 0 0 2-2v-1H10v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2h4" />
              <path d="M18 18V5a2 2 0 0 0-2-2H4" />
              <path d="M9.5 8h5" />
              <path d="M9.5 11.5h5" />
            </svg>
            <span>
              {lang === 'en' ? 'Welcome Letter' : lang === 'zh' ? '开幕寄语' : 'Thư ngỏ'}
            </span>
          </button>

          {/* Public Quick-Open Museum Archival Colophon Trigger */}
          <ArchivalSourcesTrigger
            onClick={() => handleOpenMediaCredits(null, 'ALL')}
            tone={activeTab === 'map_routes' || activeTab === 'space3d' ? 'dark' : 'light'}
            floating
          />

          {isNonAdminTesterPro && (
            <button
              type="button"
              onClick={() => {
                setTesterBugSubmittedCode(null);
                setTesterBugDescription('');
                setIsTesterBugModalOpen(true);
              }}
              className="px-3 py-2 md:px-3.5 md:py-2.5 rounded-full bg-[#171817] hover:bg-[#47796D] text-[#D8C9A9] border border-[#C9A46A] shadow-[0_8px_24px_rgba(23,24,23,0.22)] transition-all flex items-center gap-1.5 md:gap-2 cursor-pointer"
            >
              <Bug className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
              <span className="text-[11px] md:text-xs font-semibold whitespace-nowrap">
                {lang === 'en'
                  ? 'Bug Report / Tester Feedback'
                  : lang === 'zh'
                  ? '测试员反馈与报错'
                  : 'Báo cáo lỗi / Góp ý Tester'}
              </span>
            </button>
          )}

          {isNonAdminBetaTester && (
            <button
              type="button"
              onClick={openLabsModal}
              title={
                lang === 'en'
                  ? 'Toggle Dấu Ấn Labs experimental features'
                  : lang === 'zh'
                  ? '开启 / 关闭 Dấu Ấn Labs 实验功能'
                  : 'Bật / tắt các tính năng thử nghiệm Dấu Ấn Labs'
              }
              className="px-3 py-2 md:px-3.5 md:py-2.5 rounded-full bg-[#F4EFE4] hover:bg-[#EDE4D0] text-[#171817] border border-[#171817]/20 hover:border-[#47796D] shadow-[0_8px_24px_rgba(23,24,23,0.14)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5 text-[#47796D] shrink-0" />
              <span className="text-[11px] md:text-xs font-medium whitespace-nowrap">Labs</span>
            </button>
          )}

          {effectiveQuickNotesWidget && (
            <button
              type="button"
              onClick={openQuickNote}
              className="px-3 py-2 md:px-3.5 md:py-2.5 rounded-full bg-[#F4EFE4] hover:bg-[#EDE4D0] text-[#171817] border border-[#171817]/20 hover:border-[#C9A46A] shadow-[0_8px_24px_rgba(23,24,23,0.14)] transition-all flex items-center gap-1.5 md:gap-2 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#A94F3D] shrink-0" />
              <span className="text-[11px] md:text-xs font-medium whitespace-nowrap">
                {lang === 'en' ? 'Labs Notes' : lang === 'zh' ? 'Labs 笔记' : 'Ghi chú Labs'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Floating Royal Historiographer (Sử Quan Dấu Ấn) Trigger & Drawer (Available outside 3D viewer & Audio Guide) */}
      {!isAudioModalOpen && activeTab !== 'space3d' && (
        <>
          {!isAiChatOpen && (
            <button
              type="button"
              data-onboarding-target="suquan-chat"
              aria-label={
                lang === 'en'
                  ? 'Royal Historiographer'
                  : lang === 'zh'
                  ? '史官讲解'
                  : 'Sử Quan Dấu Ấn'
              }
              title={
                lang === 'en'
                  ? 'Royal Historiographer'
                  : lang === 'zh'
                  ? '史官讲解'
                  : 'Sử Quan Dấu Ấn'
              }
              onClick={() =>
                requireAuth(
                  () => {
                    trackPlatformInteraction('tech_audio_ai', activeAiContextSite?.id);
                    setIsAiChatOpen(true);
                  },
                  lang === 'en'
                    ? 'Royal Historiographer'
                    : lang === 'zh'
                    ? '史官讲解'
                    : 'Sử Quan Dấu Ấn'
                )
              }
              className={`fixed right-3 md:right-5 ${
                cinemaState.isOpen ? 'z-[1220]' : 'z-30 md:z-[55]'
              } w-11 h-11 p-0 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-full bg-[#171817]/95 hover:bg-[#A94F3D] text-[#D8C9A9] border border-[#C9A46A]/55 hover:border-[#C9A46A] shadow-[0_8px_24px_rgba(23,24,23,0.45)] transition-all flex items-center justify-center md:gap-2 cursor-pointer ${
                activeGuidedTour
                  ? 'bottom-[160px] md:bottom-[94px]'
                  : activeTab === 'map_routes'
                  ? mapSubView === 'routes' && activeTour
                    ? 'bottom-[138px] md:bottom-[70px]'
                    : 'bottom-[138px] md:bottom-5'
                  : 'bottom-4 md:bottom-5'
              }`}
            >
              <RoyalHistoriographerIcon className="w-[20px] h-[20px] md:w-[18px] md:h-[18px] text-[#C9A46A] shrink-0" />
              <span className="hidden md:inline text-xs font-medium whitespace-nowrap">
                {lang === 'en'
                  ? 'Royal Historiographer'
                  : lang === 'zh'
                  ? '史官讲解'
                  : 'Sử Quan Dấu Ấn'}
              </span>
              {!user && (
                <>
                  <Lock className="hidden md:inline w-3 h-3 text-[#C9A46A] shrink-0" />
                  <span className="md:hidden absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#171817] border border-[#C9A46A]/70 flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5 text-[#C9A46A]" />
                  </span>
                </>
              )}
              {hasUnreadSuQuanNotice && (
                <span
                  aria-label="Có thư cảm ơn mới từ Sử Quan Dấu Ấn"
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#A94F3D] ring-2 ring-[#C9A46A] animate-pulse"
                />
              )}
            </button>
          )}

          <GeminiHeritageChat
            isOpen={isAiChatOpen}
            onClose={() => setIsAiChatOpen(false)}
            currentSite={activeAiContextSite}
            sites={sites}
            onSwitchSite={(targetSite) => {
              setSelectedSiteId(targetSite.id);
              if (detailModalSite) {
                setDetailModalSiteId(targetSite.id);
              }
              if (cinemaState.isOpen) {
                handleOpenCinemaModal(targetSite);
              }
            }}
            hotspots={[]}
            onFlyToHotspot={() => {
              setIsAiChatOpen(false);
              setActiveTab('space3d');
            }}
            onSetRenderMode={(mode) => {
              setPending3DRenderMode(mode);
              setActiveTab('space3d');
            }}
            onSetExplodedFactor={(factor) => {
              setPending3DExploded(factor);
              if (factor > 0) {
                setActiveTab('space3d');
              }
            }}
            onTriggerAutoTour={(targetSite) => {
              const siteToLaunch = targetSite || activeAiContextSite;
              setIsAiChatOpen(false);
              handleOpen3D(siteToLaunch);
            }}
            onNavigateToTickets={() => {
              setIsAiChatOpen(false);
              handleNavigateTab('edtech');
            }}
          />
        </>
      )}
      <InteractiveUserGuideModal
        isOpen={isGuideOpen}
        lang={lang}
        initialSection={guideSection}
        onClose={() => setIsGuideOpen(false)}
        onTry3D={() => {
          setIsGuideOpen(false);
          requireAuth(
            (authedUser) => handleOpen3D(selectedSite, authedUser),
            lang === 'en' ? '3D Space' : lang === 'zh' ? '3D 空间' : 'Không gian 3D'
          );
        }}
        onTryExplore={() => {
          setIsGuideOpen(false);
          handleNavigateTab('explore');
        }}
        onOpenMap={() => {
          setIsGuideOpen(false);
          requireAuth(
            () => {
              setMapSubView('gis');
              handleNavigateTab('map_routes');
            },
            lang === 'en' ? 'Map & Routes' : lang === 'zh' ? '地图与路线' : 'Bản đồ & Tuyến'
          );
        }}
        onOpenEdTech={() => {
          setIsGuideOpen(false);
          requireAuth(
            () => handleNavigateTab('edtech'),
            lang === 'en' ? 'Tickets & EdTech' : lang === 'zh' ? '门票与教材' : 'Vé & Học liệu'
          );
        }}
      />

      {/* Full-Screen 3-Language Opening Gate Letter (Mandatory first-login read; voluntary re-read anytime) */}
      <MuseumOpeningGateLetter
        isOpen={isGateLetterOpen}
        isMandatoryRead={isGateLetterMandatory}
        onEnterMuseum={handleEnterMuseumFromGateLetter}
      />

      {/* Museum Archival & Media Credits Modal (3 Languages, Firebase /mediaCredits Synced) */}
      <MediaCreditsModal
        isOpen={mediaCreditsState.isOpen}
        onClose={() => setMediaCreditsState((prev) => ({ ...prev, isOpen: false }))}
        sites={allSites}
        initialSiteId={mediaCreditsState.siteId}
        initialCategory={mediaCreditsState.category}
      />

      {/* Duolingo-Style "Sử Quan Dấu Ấn" Mascot & 4-Step Interactive Onboarding Tour (Deferred Until Gate Letter Closed) */}
      <SuQuanMascotOnboarding
        isOpen={
          Boolean(user) &&
          !isGateLetterOpen &&
          !mediaCreditsState.isOpen &&
          isOnboardingOpen &&
          !isGuidedWelcomeOpen &&
          !isAuthModalOpen &&
          !isGuideOpen &&
          !isAdminStudioOpen &&
          !isMyJourneyOpen &&
          !isFeedbackOpen &&
          !isSupportModalOpen &&
          !isAudioModalOpen &&
          !cinemaState.isOpen &&
          !detailModalSite &&
          !photoManagerSite
        }
        step={onboardingStep}
        language={lang}
        onChangeLanguage={setLang}
        onChangeStep={setOnboardingStep}
        onComplete={handleFinishOnboarding}
        onSkip={handleFinishOnboarding}
        onEnsureExploreView={handleEnsureExploreView}
      />

      <CinemaDocumentaryModal
        isOpen={cinemaState.isOpen}
        onClose={() =>
          setCinemaState({ isOpen: false, siteId: null, activeVideoHeritageId: null })
        }
        contextSite={cinemaContextSite}
        sites={sites}
        localVideosMap={localVideosMap}
        onUploadLocalVideo={handleUploadLocalVideo}
        onClearLocalVideo={handleClearLocalVideo}
        onOpenMediaCredits={(siteId) => {
          handleOpenMediaCredits(siteId || null, 'ALL');
        }}
        onSwitchSite={(site) => {
          setSelectedSiteId(site.id);
          setCinemaState((prev) => ({
            ...prev,
            siteId: site.id,
            activeVideoHeritageId: resolveHeritageVideoId(site.id),
          }));
        }}
      />

      {/* Google & Facebook Auth Portal Modal */}
      <AuthModal />

      {/* Visitor Support & Helpdesk Center (accessible even before login) */}
      <SupportHelpdeskModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        sites={sites}
        defaultTab={supportDefaultTab}
        defaultSiteId={selectedSite?.id}
        onOpenInteractiveGuide={() => openGuideForSection()}
        onNavigateToTickets={() => {
          setIsSupportModalOpen(false);
          handleNavigateTab('edtech');
        }}
      />

      {/* Visitor Experience Feedback Modal (Requires Authenticated Account) */}
      <FeedbackModal
        isOpen={Boolean(user && isFeedbackOpen)}
        onClose={() => setIsFeedbackOpen(false)}
        sites={sites}
        defaultSiteId={selectedSite.id}
      />

      {/* Locked Feedback & Support Auth Prompt Popup */}
      {isFeedbackLockPromptOpen && !user && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Yêu cầu đăng nhập Đánh giá và Hỗ trợ"
          onClick={() => setIsFeedbackLockPromptOpen(false)}
          className="fixed inset-0 z-[95] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#1C1D1B] border border-[#C9A46A]/40 p-6 shadow-2xl text-[#D8C9A9] space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#A94F3D]/15 border border-[#A94F3D]/45 flex items-center justify-center shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#A94F3D"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <rect x="4" y="11" width="16" height="10" rx="2.5" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    <circle cx="12" cy="16" r="1.1" fill="#C9A46A" stroke="none" />
                  </svg>
                </div>
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#C9A46A] block">
                    Bảo tàng số Dấu Ấn Việt 3D
                  </span>
                  <h3 className="font-serif text-lg font-semibold text-[#D8C9A9] mt-0.5">
                    Đánh giá &amp; Hỗ trợ khách hàng
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFeedbackLockPromptOpen(false)}
                aria-label="Đóng thông báo"
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-[#D8C9A9]/75 hover:text-[#D8C9A9] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-[#D8C9A9]/90 leading-relaxed">
              Tính năng Đánh giá trải nghiệm và Hỗ trợ khách hàng hiện đang khóa. Vui lòng đăng nhập tài khoản để tiếp tục.
            </p>

            <div className="pt-2 border-t border-[#C9A46A]/15 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsFeedbackLockPromptOpen(false)}
                className="px-4 py-2 rounded-full bg-transparent border border-[#C9A46A]/30 hover:border-[#C9A46A]/65 text-xs font-medium text-[#D8C9A9]/80 hover:text-[#D8C9A9] transition-colors cursor-pointer"
              >
                Để sau
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFeedbackLockPromptOpen(false);
                  openAuthModal({
                    prompt:
                      'Tính năng Đánh giá trải nghiệm và Hỗ trợ khách hàng hiện đang khóa. Vui lòng đăng nhập tài khoản để tiếp tục.',
                    onSuccess: () => setIsFeedbackOpen(true),
                  });
                }}
                className="px-5 py-2 rounded-full bg-[#C9A46A] hover:brightness-110 text-[#171817] text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md"
              >
                <LogIn className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Đăng nhập ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authenticated Visitor's Personal Account, Visit History & Tickets Center */}
      {user && isMyJourneyOpen && (
        <MyTicketsAndJourneyModal
          isOpen={Boolean(user && isMyJourneyOpen)}
          sites={sites}
          onClose={() => setIsMyJourneyOpen(false)}
          onOpen3D={(site) => handleOpen3D(site)}
          onOpenMapRoutes={() => {
            setMapSubView('routes');
            handleNavigateTab('map_routes');
          }}
          onGoToTickets={() => handleNavigateTab('edtech')}
          onOpenAdminLoginAudit={
            isStrictAdmin
              ? () => {
                  setIsMyJourneyOpen(false);
                  setAdminInitialModule('login_audit');
                  setIsAdminStudioOpen(true);
                }
              : undefined
          }
          onOpenGateLetter={() => {
            setIsMyJourneyOpen(false);
            handleOpenGateLetterReview();
          }}
        />
      )}

      {/* Manual Guided Tour Route Selector Modal (never overlaps Gate Letter or Su Quan onboarding) */}
      {user && (
        <GuidedTourWelcomeModal
          isOpen={isGuidedWelcomeOpen && !isOnboardingOpen && !isGateLetterOpen}
          visitorName={user.displayName}
          tours={resolvedGuidedTours}
          hasMasterpiece={Boolean(masterpieceSite)}
          onClose={() => setIsGuidedWelcomeOpen(false)}
          onSelectTour={(tour) => startGuidedTourSession(tour)}
          onStartMasterpiece={() => startMasterpieceSession()}
        />
      )}

      {/* Guided Tour Completion Celebration & Certificate Prompt Modal */}
      {user && (
        <GuidedTourCompletionModal
          completedRoute={completedGuidedTour}
          onClose={() => setCompletedGuidedTour(null)}
          onGoToTicketsAndCertificate={() => {
            if (!completedGuidedTour) return;
            setPreselectedGuidedRoute({
              mappedTourId: completedGuidedTour.route.mappedTourId,
              title: completedGuidedTour.route.title,
              token: Date.now(),
            });
            setCompletedGuidedTour(null);
            handleNavigateTab('edtech');
          }}
          onOpenFeedback={() => {
            setCompletedGuidedTour(null);
            handleRequestOpenFeedback();
          }}
        />
      )}

      {/* Admin Studio — Strictly accessible only to verified Admin accounts (never Tester Pro) */}
      {isStrictAdmin && isAdminStudioOpen && (
        <AdminWorkflowModal
          sites={allSites}
          onClose={() => {
            setIsAdminStudioOpen(false);
            setAdminInitialModule(undefined);
            setAdminGlbLaunchTarget(null);
          }}
          onUpdateSiteStatus={onUpdateSiteStatus}
          onRefreshCms={onRefreshCms}
          customPhotosMap={customPhotosMap}
          localVideosMap={localVideosMap}
          onOpenPhotoManager={(site) => setPhotoManagerSiteId(site.id)}
          onOpenAudioStudio={(site) => {
            setIsAdminStudioOpen(false);
            setAdminInitialModule(undefined);
            setAdminGlbLaunchTarget(null);
            openModalForSite(site.id);
          }}
          onOpenVideoModal={(site) => handleOpenCinemaModal(site)}
          launchGlbTarget={adminGlbLaunchTarget}
          initialModule={adminInitialModule}
        />
      )}
      {/* Dấu Ấn Labs Modals (Strictly gated for Beta Tester & Admin accounts) */}
      <DauAnLabsModal />
      <LabsQuickNoteModal sites={allSites} currentSite={selectedSite} />

      {/* Global Subscription Upgrade Prompt & Dual-Region Checkout Modals */}
      <UpgradePromptModal
        onNavigateToPricing={() => {
          setActiveTab('edtech');
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />
      <DualRegionCheckoutModal />

      {/* Subtle Floating Indicator when Admin is Simulating a Customer Tier */}
      {isStrictAdmin && activeSitePerms.isPreviewingNonAdmin && (
        <div className="fixed bottom-4 left-4 z-[1100] flex items-center gap-2.5 rounded-full bg-[#171817]/95 border border-[#C9A46A]/65 px-3.5 py-2 shadow-2xl text-xs text-[#D8C9A9] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#A94F3D] shrink-0" />
          <span className="font-medium whitespace-nowrap">
            Xem thử quyền:{' '}
            <strong className="text-[#C9A46A]">
              {previewRole === 'guest'
                ? 'Chưa đăng nhập'
                : previewRole === 'tester'
                ? 'Tester (Kiểm thử)'
                : previewRole === 'basic'
                ? 'Cơ bản 0đ'
                : previewRole === 'plus'
                ? 'Plus 19k'
                : previewRole === 'pro'
                ? 'Pro 49k'
                : 'Trường học'}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => setPreviewRole('admin')}
            className="px-2.5 py-0.5 rounded-full bg-[#47796D] hover:bg-[#3b665c] text-[#F5EFE6] text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            Quay lại Admin
          </button>
        </div>
      )}

      {/* Tester Pro Bug Report Modal (Auto-captures Tab + Site + Language, tagged Báo cáo Tester) */}
      {isNonAdminTesterPro && isTesterBugModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tester Pro Bug Report"
          onClick={() => setIsTesterBugModalOpen(false)}
          className="fixed inset-0 z-[1300] bg-[#171817]/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[94vw] sm:w-full max-w-lg max-h-[85vh] overflow-y-auto heritage-scrollbar rounded-2xl bg-[#D8C9A9] border border-[#171817]/25 shadow-2xl text-[#171817]"
          >
            <div className="px-5 py-4 bg-[#171817] text-[#D8C9A9] border-b border-[#C9A46A]/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Bug className="w-4 h-4 text-[#C9A46A] shrink-0" />
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A46A] block">
                    {lang === 'en' ? 'Tester Pro · QA Intake' : lang === 'zh' ? '专业测试 · 问题上报' : 'Người thử nghiệm Pro · QA'}
                  </span>
                  <h3 className="font-serif text-base font-semibold text-[#D8C9A9]">
                    {lang === 'en'
                      ? 'Bug Report / Tester Feedback'
                      : lang === 'zh'
                      ? '提交测试错误报告或建议'
                      : 'Báo cáo lỗi / Góp ý Tester'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTesterBugModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#D8C9A9]/10 hover:bg-[#D8C9A9]/20 text-[#D8C9A9] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {testerBugSubmittedCode ? (
              <div className="p-6 space-y-4 text-center">
                <CheckCircle2 className="w-10 h-10 text-[#47796D] mx-auto" />
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[#171817]">
                    {lang === 'en'
                      ? `Report ${testerBugSubmittedCode} sent to Admin Support Inbox`
                      : lang === 'zh'
                      ? `测试报告 ${testerBugSubmittedCode} 已发送至管理员收件箱`
                      : `Đã gửi phiếu ${testerBugSubmittedCode} về Hộp thư Hỗ trợ Admin`}
                  </div>
                  <p className="text-xs text-[#171817]/75">
                    {lang === 'en'
                      ? 'Tagged "Tester Report" with your active tab, monument, and language context.'
                      : lang === 'zh'
                      ? '已附带当前页面标签、遗迹名称与语言上下文并标记为“测试员报告”。'
                      : 'Phiếu đã được gắn nhãn "Báo cáo Tester" cùng ngữ cảnh Tab, Di tích và Ngôn ngữ hiện tại.'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTesterBugModalOpen(false);
                      setSupportDefaultTab('tickets');
                      setIsSupportModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-full bg-[#47796D] hover:bg-[#3A655A] text-[#D8C9A9] text-xs font-semibold cursor-pointer"
                  >
                    {lang === 'en' ? 'View in Support Inbox' : lang === 'zh' ? '查看支持工单' : 'Xem trong Hộp thư Hỗ trợ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTesterBugModalOpen(false)}
                    className="px-4 py-2 rounded-full bg-[#171817] text-[#D8C9A9] text-xs font-semibold cursor-pointer"
                  >
                    {lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const cleanText = testerBugDescription.trim();
                  if (!user || !cleanText || isSubmittingTesterBug) return;
                  setIsSubmittingTesterBug(true);
                  try {
                    const created = createSupportTicket({
                      uid: user.firebaseUid || user.userId,
                      userEmail: user.email,
                      userName: user.displayName,
                      senderUserId: user.userId,
                      ownerEmail: user.email,
                      senderName: user.displayName || 'Người thử nghiệm Pro',
                      senderEmail: user.email || 'tester@dau-an-viet.local',
                      category: 'tester_feedback',
                      relatedSiteId: selectedSite?.id,
                      relatedSiteName: selectedSite?.officialName,
                      description: cleanText,
                      supportTier: 'tester_report',
                      retentionDays: 90,
                      testerContext: {
                        tab: activeTab,
                        siteId: selectedSite?.id,
                        siteName: selectedSite?.officialName,
                        lang,
                      },
                    });
                    if (!created) return;
                    setTesterBugSubmittedCode(created.ticketCode);
                    void processSupportTicketAiReply(created.id, sites, cleanText, false);
                  } finally {
                    setIsSubmittingTesterBug(false);
                  }
                }}
                className="p-5 space-y-4"
              >
                <div className="p-3 rounded-xl bg-[#EDE4D0] border border-[#171817]/15 space-y-1.5 text-xs">
                  <div className="font-semibold text-[#171817]">
                    {lang === 'en'
                      ? 'Auto-captured Session Context'
                      : lang === 'zh'
                      ? '自动捕获的当前会话上下文'
                      : 'Ngữ cảnh phiên được tự động ghi nhận'}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#171817] text-[#D8C9A9]">
                      Tab: {activeTab}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#47796D] text-[#D8C9A9]">
                      Di tích: {selectedSite?.officialName || '—'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#526D8B] text-[#D8C9A9]">
                      Ngôn ngữ: {lang.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#171817]">
                    {lang === 'en'
                      ? 'Describe the issue, UI flaw, 3D model behavior, or suggestion *'
                      : lang === 'zh'
                      ? '请描述发现的问题、3D 模型表现或改进建议 *'
                      : 'Mô tả lỗi phát hiện, giao diện, mô hình 3D hoặc góp ý *'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={testerBugDescription}
                    onChange={(e) => setTesterBugDescription(e.target.value)}
                    placeholder={
                      lang === 'en'
                        ? 'Example: In 3D Space for Bạch Dinh, X-Ray clipping needs adjustment...'
                        : lang === 'zh'
                        ? '示例：在 3D 空间查看白宫时，图层切换响应略有延迟...'
                        : 'Ví dụ: Khi mở X-Ray ở Không gian 3D tại Dinh Độc Lập, góc xoay camera...'
                    }
                    className="w-full p-3 rounded-xl bg-[#F4EFE4] border border-[#171817]/20 focus:border-[#47796D] focus:outline-none text-xs text-[#171817] placeholder:text-[#171817]/45"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTesterBugModalOpen(false)}
                    className="px-4 py-2 rounded-full border border-[#171817]/20 text-xs font-medium text-[#171817] hover:bg-[#171817]/10 cursor-pointer"
                  >
                    {lang === 'en' ? 'Cancel' : lang === 'zh' ? '取消' : 'Hủy bỏ'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTesterBug || !testerBugDescription.trim()}
                    className="px-5 py-2 rounded-full bg-[#A94F3D] hover:bg-[#8E3F30] disabled:opacity-50 text-[#D8C9A9] text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {isSubmittingTesterBug
                      ? lang === 'en'
                        ? 'Sending...'
                        : lang === 'zh'
                        ? '发送中...'
                        : 'Đang gửi...'
                      : lang === 'en'
                      ? 'Submit Tester Report'
                      : lang === 'zh'
                      ? '发送测试报告'
                      : 'Gửi Báo cáo Tester'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmergencyLockdownGate() {
  const { user, isAdmin, logout } = useAuth();
  const [emergencyState, setEmergencyState] = useState<EmergencyLockdownState>(() =>
    loadEmergencyLockdownState()
  );

  useEffect(() => {
    const syncLockdown = () => {
      setEmergencyState(loadEmergencyLockdownState());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === EMERGENCY_LOCKDOWN_STORAGE_KEY) {
        syncLockdown();
      }
    };
    window.addEventListener(EMERGENCY_LOCKDOWN_EVENT, syncLockdown);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EMERGENCY_LOCKDOWN_EVENT, syncLockdown);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const isVisitorLockedOut = emergencyState.isLocked && !isAdmin;

  useEffect(() => {
    if (!isVisitorLockedOut) return;
    const id = window.setInterval(() => {
      void syncStateFromServer();
    }, 15000);
    return () => window.clearInterval(id);
  }, [isVisitorLockedOut]);

  // Auto-logout any non-admin visitor sessions immediately when Emergency Lockdown activates
  useEffect(() => {
    if (emergencyState.isLocked && user && user.role !== 'admin') {
      logout();
    }
  }, [emergencyState.isLocked, user, logout]);

  // Completely unmount HeritageAppContent when locked for non-admins to halt 100% of WebGL 3D loops & API flows
  if (isVisitorLockedOut) {
    return <EmergencyLockdownOverlay lockdownState={emergencyState} />;
  }

  return <HeritageAppContent emergencyState={emergencyState} />;
}

export default function App() {
  return (
    <AppleErrorBoundary variant="app">
      <AuthProvider>
        <LabsProvider>
          <EmergencyLockdownGate />
          <CloudAutoSyncToast />
        </LabsProvider>
      </AuthProvider>
    </AppleErrorBoundary>
  );
}

