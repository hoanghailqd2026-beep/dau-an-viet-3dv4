import React, { useState, useMemo, useEffect, useRef } from 'react';
import { HeritageSite } from '../../types/heritage';
import { useAuth } from '../../contexts/AuthContext';
import { useAudioGuide } from '../../contexts/AudioGuideContext';
import { useLabs, LABS_FEATURES_META } from '../../contexts/LabsContext';
import { useI18n } from '../../i18n/I18nContext';
import {
  HERITAGE_FLYCAM_VIDEOS,
  loadCustomVideoUrlForHeritage,
  removeCustomVideoUrlForHeritage,
  resolveHeritageVideoId,
  saveCustomVideoUrlForHeritage,
} from '../../data/heritageFilms';
import { getCuratedAudioScript, CuratedAudioChapter } from '../../data/audioGuideScripts';
import {
  CustomPhotosMap,
  PhotoSlotIndex,
  compressImageFileToDataUrl,
  fetchWikimediaPhotosForSite,
  normalizeCustomPhotoSlot,
  removeCustomSitePhoto,
  resolveSitePhotoSlots,
  saveCustomSitePhoto,
  syncAllWikimediaPhotos,
  uploadHeritagePhotoToPublic,
  useHeritageRealPhotos,
} from '../../utils/wikimediaPhotoService';
import { HeritageTypographicPlate } from '../common/HeritageTypographicPlate';
import { HeritageSmoothImage } from '../common/HeritageSmoothImage';
import {
  getCustomHistoricalPhotoForSite,
  getHistoricalArchiveForSite,
  removeCustomHistoricalPhotoForSite,
  saveCustomHistoricalPhotoForSite,
} from '../spatial/MuseumHistoricalWidgets';
import { SITE_TRANSLATIONS, SITE_TRANSLATIONS_ZH } from '../../i18n/glossary';
import {
  AI_AUTOPILOT_UPDATED_EVENT,
  AI_COPILOT_AUTHOR,
  AI_OUTBOX_STORAGE_KEY,
  AI_OUTBOX_UPDATED_EVENT,
  AI_SHIELD_STORAGE_KEY,
  AI_SHIELD_UPDATED_EVENT,
  AI_SUPPORT_BOT_AUTHOR,
  AdminAuditEntry,
  AdminEmailOutboxItem,
  AdminQuizQuestion,
  AiSecurityShieldState,
  CMS_UPDATED_EVENT,
  CmsSiteOverride,
  DEFAULT_EMERGENCY_LOCKDOWN_MESSAGE,
  DEFAULT_SITE_SETTINGS,
  EMERGENCY_LOCKDOWN_EVENT,
  EmergencyLockdownState,
  IssuedPassRecord,
  PASSES_UPDATED_EVENT,
  PRIMARY_ADMIN_EMAIL,
  PlatformAnalytics,
  PublishedSiteQuizSet,
  QUIZZES_UPDATED_EVENT,
  REVIEWS_UPDATED_EVENT,
  RegisteredVisitorRecord,
  SECURITY_LOGS_EVENT,
  SUPPORT_TICKETS_STORAGE_KEY,
  SUPPORT_TICKETS_UPDATED_EVENT,
  SUPPORT_TICKET_CATEGORIES,
  SecurityAlertEntry,
  SiteSettings,
  SupportTicketCategory,
  SupportTicketRecord,
  VISITORS_UPDATED_EVENT,
  VisitorReviewRecord,
  activateEmergencyLockdown,
  clearAdminOutbox,
  clearAiEmergencyShield,
  clearSecurityAlerts,
  computeVisitorReviewStats,
  deactivateEmergencyLockdown,
  deleteVisitorReview,
  exportFullPlatformBackupJson,
  getSiteContentGaps,
  importFullPlatformBackupJson,
  listAdminOutbox,
  listAllSupportTicketsForAdmin,
  listIssuedPasses,
  listRegisteredVisitors,
  listVisitorReviews,
  loadAiAutopilotEnabled,
  loadAiSecurityShield,
  loadAnalytics,
  loadAuditLogs,
  loadCmsSiteOverrides,
  loadEmergencyLockdownState,
  loadHiddenHeritageIds,
  loadPublishedQuizzes,
  loadSecurityAlerts,
  loadSiteQuizDrafts,
  loadSiteSettings,
  loadSiteTranslationOverrides,
  publishSiteQuizSet,
  replyToSupportTicket,
  updateSupportTicketStatus,
  deleteSupportTicket,
  replyToVisitorReview,
  resetCmsSiteOverride,
  runAiContentAutopilotSweep,
  saveAudioScriptOverride,
  saveCmsSiteOverride,
  saveSiteQuizDraft,
  saveSiteSettings,
  saveSiteTranslationCurated,
  scanAndAutoReplyAllReviewsAsync,
  setAiAutopilotEnabled,
  setHeritageHidden,
  simulateSecurityAttackLevel1,
  simulateSecurityAttackLevel2,
  togglePinVisitorReview,
  unpublishSiteQuizSet,
  updateIssuedPassStatus,
  verifyAdminPassword,
  HYDROGEN_BRIEFING_STORAGE_KEY,
  HYDROGEN_COMMAND_LOGS_KEY,
  HYDROGEN_CORES_STORAGE_KEY,
  HYDROGEN_CORES_UPDATED_EVENT,
  HydrogenCommandLogEntry,
  HydrogenCoreId,
  HydrogenCoresMatrixState,
  HydrogenExecutiveBriefing,
  computeSystemHealthMetrics,
  executeHydrogenAdminCommand,
  generateHydrogenExecutiveBriefing,
  getConciergeSentimentSummary,
  getHydrogenCuratorAuditSummary,
  loadHydrogenCommandLogs,
  loadHydrogenCoresState,
  loadHydrogenExecutiveBriefing,
  runFullFourHydrogenSync,
  runHydrogenConciergeCoreAsync,
  runHydrogenCuratorCore,
  runHydrogenShieldDiagnostic,
  toggleHydrogenCore,
  autoReplyAllPendingSupportTickets,
  draftAdminSupportReplyWithGemini,
  getTicketConversationMessages,
  ACCOUNT_LOCKS_STORAGE_KEY,
  ACCOUNT_LOCKS_UPDATED_EVENT,
  AdminAccountRecord,
  listAdminAccountDirectory,
  adminResetUserPassword,
  setUserAccountLock,
  setUserBetaTester,
  ANALYTICS_UPDATED_EVENT,
  VISIT_HISTORY_STORAGE_KEY,
  VisitHistoryLogEntry,
  loadVisitHistoryLogs,
  syncStateFromServer,
  fetchUsersFromCloudApi,
  setPublishedQuizHidden,
  listTesterAllowlistEmails,
  addTesterAllowlistEmail,
  removeTesterAllowlistEmail,
  sortSupportTicketsForAdmin,
  TESTER_ALLOWLIST_UPDATED_EVENT,
  ACCOUNTS_DB_UPDATED_EVENT,
  SUBSCRIPTION_TIER_UPDATED_EVENT,
  UserAccountTier,
  setUserAccountTierByAdmin,
  exportHardcodedAccountsSnippet,
  generateStaticDataHardcodeBundle,
  generateHeritageDataTsFile,
} from '../../utils/adminPlatformStore';
import {
  ShieldCheck,
  ShieldAlert,
  X,
  Search,
  BarChart3,
  Building2,
  Ticket,
  Users,
  Settings,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Film,
  Mic,
  UserPlus,
  Trash2,
  Download,
  FileUp,
  KeyRound,
  Bell,
  Sun,
  Moon,
  Clock,
  Check,
  Ban,
  ExternalLink,
  Menu,
  Star,
  Pin,
  Send,
  MessageSquareHeart,
  Landmark,
  Sparkles,
  Languages,
  GraduationCap,
  Cpu,
  Plus,
  LifeBuoy,
  Mail,
  Inbox,
  Bot,
  Zap,
  FlaskConical,
  Shield,
  RefreshCw,
  Terminal,
  Activity,
  TrendingUp,
  Play,
  ChevronRight,
  ChevronDown,
  Crown,
  Unlock,
  Monitor,
  Smartphone,
  Box,
  Link2,
  Copy,
  FileCode2,
  Database,
  QrCode,
  BookOpen,
} from 'lucide-react';
import { RoyalHistoriographerIcon } from '../common/RoyalHistoriographerIcon';
import {
  pullAllUsersFromFirebaseRealtimeDb,
  pullFeedbacksFromFirebase,
  pullSupportTicketsFromFirebase,
  pushAllCurrentDataToFirebase,
  syncUserRoleToFirebaseRealtimeDb,
  useFirebaseSyncStatus,
  type FirebaseDirectoryUserSummary,
} from '../../utils/firebaseRestSync';
import { Language } from '../../i18n/types';
import { GlbMiniStage } from '../gis/GlbMiniStage';
import {
  clearAllCustomGlbForSite,
  formatGlbFileSize,
  removeCustomGlbUrl,
  saveCustomGlbUrl,
  switchSiteGlbSourceMode,
  uploadGlbToPublicFolder,
  useAllCustomGlbMap,
  useSiteGlbSource,
} from '../../utils/glbModelStorage';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { HeritageVisitStatsPanel } from './HeritageVisitStatsPanel';
import { HeritageTrendForecastPanel } from './HeritageTrendForecastPanel';
import { AmbientAudioAdminCard } from './AmbientAudioAdminCard';
import { AdminLoginAuditPanel } from './AdminLoginAuditPanel';
import { AdminPaymentsPanel } from './AdminPaymentsPanel';
import { AdminMediaCreditsPanel } from './AdminMediaCreditsPanel';
import { AdminSourceBackupPanel } from './AdminSourceBackupPanel';
import { forcePushAllToCloud } from '../../utils/cloudSync';
import { useMediaCredits } from '../../utils/mediaCreditsStore';
import { pullVisitStatsFromFirebase } from '../../utils/visitStatsSync';
import {
  LOGIN_AUDIT_UPDATED_EVENT,
  loadAdminLoginAuditLogs,
} from '../../utils/accountActivityStore';
import {
  AdminPreviewRole,
  PAYMENT_ORDERS_UPDATED_EVENT,
  loadPaymentOrders,
  useAdminPreviewRole,
} from '../../utils/subscriptionGatingStore';

export type StudioModule =
  | 'dashboard'
  | 'ai_copilot'
  | 'cms'
  | 'media_credits'
  | 'ai_curator'
  | 'reviews'
  | 'support'
  | 'visitors_tickets'
  | 'payments_orders'
  | 'accounts'
  | 'login_audit'
  | 'labs'
  | 'permissions'
  | 'source_backup'
  | 'settings_backup';

interface AdminWorkflowModalProps {
  sites: HeritageSite[];
  onClose: () => void;
  onUpdateSiteStatus?: (
    siteId: string,
    newStatus: 'draft' | 'district_submitted' | 'expert_review' | 'approved_published',
    expertComment?: string
  ) => void;
  onRefreshCms?: () => void;
  customPhotosMap?: CustomPhotosMap;
  localVideosMap?: Record<string, { url: string; fileName: string }>;
  onOpenPhotoManager?: (site: HeritageSite) => void;
  onOpenAudioStudio?: (site: HeritageSite) => void;
  onOpenVideoModal?: (site: HeritageSite) => void;
  launchGlbTarget?: { siteId: string; token: number } | null;
  initialModule?: StudioModule;
}
type CmsStatusFilter = 'all' | 'approved_published' | 'expert_review' | 'draft' | 'hidden';

const STATUS_LABELS: Record<HeritageSite['dossierStatus'], string> = {
  approved_published: 'Đã xuất bản',
  expert_review: 'Chờ thẩm định',
  district_submitted: 'Cơ sở đề xuất',
  draft: 'Bản nháp',
};

export const AdminWorkflowModal: React.FC<AdminWorkflowModalProps> = ({
  sites,
  onClose,
  onRefreshCms,
  customPhotosMap = {},
  onOpenAudioStudio,
  onOpenVideoModal,
  launchGlbTarget = null,
  initialModule,
}) => {
  const { lang: appLang } = useI18n();
  const {
    user,
    isAdmin,
    isTesterPro,
    primaryAdminEmail,
    secondaryAdminEmails,
    addAdminEmail,
    removeAdminEmail,
    changeAdminPassword,
    refreshEntitlements,
  } = useAuth();
  const { getCustomAudioForSite, uploadCustomAudio, removeCustomAudio } = useAudioGuide();
  const { settings: labsSettings, toggleLabsFeature } = useLabs();
  const {
    customPhotosMap: liveCustomPhotosMap,
    wikimediaCacheMap,
  } = useHeritageRealPhotos();
  const effectiveCustomPhotosMap =
    Object.keys(liveCustomPhotosMap).length > 0 ? liveCustomPhotosMap : customPhotosMap;

  const [activeModule, setActiveModule] = useState<StudioModule>(initialModule || 'dashboard');
  const [loginAuditCount, setLoginAuditCount] = useState<number>(
    () => loadAdminLoginAuditLogs().length
  );
  const [paymentOrdersCount, setPaymentOrdersCount] = useState<number>(
    () => loadPaymentOrders().length
  );
  const mediaCreditsList = useMediaCredits();
  const [previewRole, setPreviewRole] = useAdminPreviewRole();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (initialModule) {
      setActiveModule(initialModule);
    }
  }, [initialModule]);

  useEffect(() => {
    const syncAuditCount = () => setLoginAuditCount(loadAdminLoginAuditLogs().length);
    const syncOrdersCount = () => setPaymentOrdersCount(loadPaymentOrders().length);
    window.addEventListener(LOGIN_AUDIT_UPDATED_EVENT, syncAuditCount);
    window.addEventListener(PAYMENT_ORDERS_UPDATED_EVENT, syncOrdersCount);
    return () => {
      window.removeEventListener(LOGIN_AUDIT_UPDATED_EVENT, syncAuditCount);
      window.removeEventListener(PAYMENT_ORDERS_UPDATED_EVENT, syncOrdersCount);
    };
  }, []);

  // Module 1: Dashboard telemetry, visit history & audit logs
  const [analytics, setAnalytics] = useState<PlatformAnalytics>(() => loadAnalytics());
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>(() => loadAuditLogs());
  const [visitHistoryLogs, setVisitHistoryLogs] = useState<VisitHistoryLogEntry[]>(() =>
    loadVisitHistoryLogs()
  );

  // Module 2: CMS State for 17 Sites + Role-Based Hidden Sites
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites[0]?.id || 'HCM-DT-001');
  const [cmsSearch, setCmsSearch] = useState('');
  const [cmsFilter, setCmsFilter] = useState<CmsStatusFilter>('all');
  const [cmsOverridesSnapshot, setCmsOverridesSnapshot] = useState<
    Record<string, CmsSiteOverride>
  >(() => loadCmsSiteOverrides());
  const [hiddenSiteIds, setHiddenSiteIds] = useState<string[]>(() => loadHiddenHeritageIds());
  const [isSyncingWikiPhotos, setIsSyncingWikiPhotos] = useState(false);

  // Module 2B: AI Curator & EdTech Material Bank
  const [aiSiteId, setAiSiteId] = useState<string>(sites[0]?.id || 'HCM-DT-001');
  const [aiSummaryVi, setAiSummaryVi] = useState('');
  const [aiNameEn, setAiNameEn] = useState('');
  const [aiStyleEn, setAiStyleEn] = useState('');
  const [aiSummaryEn, setAiSummaryEn] = useState('');
  const [aiNameZh, setAiNameZh] = useState('');
  const [aiStyleZh, setAiStyleZh] = useState('');
  const [aiSummaryZh, setAiSummaryZh] = useState('');
  const [isAiTranslating, setIsAiTranslating] = useState(false);

  const [quizDraftQuestions, setQuizDraftQuestions] = useState<AdminQuizQuestion[]>([]);
  const [publishedQuizzesSnapshot, setPublishedQuizzesSnapshot] = useState<
    Record<string, PublishedSiteQuizSet>
  >(() => loadPublishedQuizzes());
  const [isAiGeneratingQuiz, setIsAiGeneratingQuiz] = useState(false);

  // Draft editor fields for active site
  const [draftName, setDraftName] = useState('');
  const [draftChronology, setDraftChronology] = useState('');
  const [draftCommencementYear, setDraftCommencementYear] = useState('');
  const [draftStreet, setDraftStreet] = useState('');
  const [draftDistrict, setDraftDistrict] = useState('');
  const [draftStyle, setDraftStyle] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [draftConservationNotes, setDraftConservationNotes] = useState('');
  const [draftDossierStatus, setDraftDossierStatus] =
    useState<HeritageSite['dossierStatus']>('approved_published');
  const [draftIsHidden, setDraftIsHidden] = useState(false);
  const [draftModelVisibility, setDraftModelVisibility] = useState<'published' | 'hidden'>('published');
  const [draftHiddenChapterIds, setDraftHiddenChapterIds] = useState<string[]>([]);

  const [draftPhoto1Url, setDraftPhoto1Url] = useState('');
  const [draftPhoto2Url, setDraftPhoto2Url] = useState('');
  const [draftHistoricalPhotoUrl, setDraftHistoricalPhotoUrl] = useState('');
  const [draftYoutubeInput, setDraftYoutubeInput] = useState('');

  const [audioEditLang, setAudioEditLang] = useState<Language>(appLang);
  const [draftAudioFolioTitle, setDraftAudioFolioTitle] = useState('');
  const [draftAudioChapters, setDraftAudioChapters] = useState<CuratedAudioChapter[]>([]);
  const [draftGlbUrl, setDraftGlbUrl] = useState('');

  const photo1FileInputRef = useRef<HTMLInputElement | null>(null);
  const photo2FileInputRef = useRef<HTMLInputElement | null>(null);
  const historicalFileInputRef = useRef<HTMLInputElement | null>(null);
  const customAudioFileInputRef = useRef<HTMLInputElement | null>(null);
  const glbFileInputRef = useRef<HTMLInputElement | null>(null);
  const glbSectionRef = useRef<HTMLDivElement | null>(null);
  const jsonBackupInputRef = useRef<HTMLInputElement | null>(null);

  // Module 3: Visitors, Issued Passes & Visitor Reviews
  const [visitors, setVisitors] = useState<RegisteredVisitorRecord[]>(() => listRegisteredVisitors());
  const [issuedPasses, setIssuedPasses] = useState<IssuedPassRecord[]>(() => listIssuedPasses());
  const [ticketFilter, setTicketFilter] = useState<'all' | 'active' | 'verified' | 'revoked'>('all');
  const [reviews, setReviews] = useState<VisitorReviewRecord[]>(() => listVisitorReviews());
  const [reviewStarFilter, setReviewStarFilter] = useState<'all' | '5' | '4' | 'le3'>('all');
  const [reviewStatusFilter, setReviewStatusFilter] = useState<
    'all' | 'unresponded' | 'responded'
  >('all');
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyDraftText, setReplyDraftText] = useState<string>('');

  // Module 3B: Visitor Support & Helpdesk Tickets (Strictly Admin-only)
  const [supportTickets, setSupportTickets] = useState<SupportTicketRecord[]>(() =>
    listAllSupportTicketsForAdmin(isAdmin)
  );
  const [supportStatusFilter, setSupportStatusFilter] = useState<
    'all' | 'pending' | 'in_progress' | 'resolved'
  >('all');
  const [supportCategoryFilter, setSupportCategoryFilter] = useState<
    'all' | SupportTicketCategory
  >('all');
  const [supportReplyDrafts, setSupportReplyDrafts] = useState<Record<string, string>>({});
  const [draftingSupportTicketId, setDraftingSupportTicketId] = useState<string | null>(null);

  // Module 4: Permissions & Admin Password
  const [newAdminEmailInput, setNewAdminEmailInput] = useState('');
  const [currentAdminPwd, setCurrentAdminPwd] = useState('');
  const [newAdminPwd, setNewAdminPwd] = useState('');
  const [confirmAdminPwd, setConfirmAdminPwd] = useState('');
  const [showPwdFields, setShowPwdFields] = useState(false);

  // Module 5: Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => loadSiteSettings());

  // Module 6: Emergency Kill Switch & Security Shield
  const [emergencyState, setEmergencyState] = useState<EmergencyLockdownState>(() =>
    loadEmergencyLockdownState()
  );
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlertEntry[]>(() =>
    loadSecurityAlerts()
  );
  const [isLockdownModalOpen, setIsLockdownModalOpen] = useState(false);
  const [lockdownModalStep, setLockdownModalStep] = useState<1 | 2>(1);
  const [lockdownDraftMessage, setLockdownDraftMessage] = useState(
    DEFAULT_EMERGENCY_LOCKDOWN_MESSAGE
  );
  const [lockdownConfirmPassword, setLockdownConfirmPassword] = useState('');
  const [showLockdownPwd, setShowLockdownPwd] = useState(false);
  const [lockdownConfirmError, setLockdownConfirmError] = useState<string | null>(null);
  const [isVerifyingLockdown, setIsVerifyingLockdown] = useState(false);

  // Module 7: AI Autonomous Admin Copilot, Outbox & 2-Level Security Shield
  const [aiAutopilotEnabled, setAiAutopilotState] = useState<boolean>(() =>
    loadAiAutopilotEnabled()
  );
  const [aiOutbox, setAiOutbox] = useState<AdminEmailOutboxItem[]>(() => listAdminOutbox());
  const [aiShield, setAiShield] = useState<AiSecurityShieldState>(() => loadAiSecurityShield());
  const [outboxFilter, setOutboxFilter] = useState<
    'all' | 'support_ticket' | 'security_level_1' | 'security_level_2'
  >('all');
  const [isRunningAiSweep, setIsRunningAiSweep] = useState(false);
  const hasAutoSweptRef = useRef(false);

  // AI CORE 4-HYDROGEN (v4.0 AUTONOMOUS)
  const [hydrogenCores, setHydrogenCores] = useState<HydrogenCoresMatrixState>(() =>
    loadHydrogenCoresState()
  );
  const [hydrogenBriefing, setHydrogenBriefing] = useState<HydrogenExecutiveBriefing | null>(() =>
    loadHydrogenExecutiveBriefing()
  );
  const [hydrogenCmdLogs, setHydrogenCmdLogs] = useState<HydrogenCommandLogEntry[]>(() =>
    loadHydrogenCommandLogs()
  );
  const [hydrogenCmdInput, setHydrogenCmdInput] = useState('');
  const [isRunningFullHydrogenSync, setIsRunningFullHydrogenSync] = useState(false);
  const [runningCoreId, setRunningCoreId] = useState<HydrogenCoreId | null>(null);
  const [isExecutingHydrogenCmd, setIsExecutingHydrogenCmd] = useState(false);
  const [lastCommandResult, setLastCommandResult] = useState<HydrogenCommandLogEntry | null>(
    () => loadHydrogenCommandLogs()[0] || null
  );
  const hasSeededBriefingRef = useRef(false);
  const [aiSubTab, setAiSubTab] = useState<'cores' | 'security_test' | 'outbox'>('cores');
  const [expandedOutboxId, setExpandedOutboxId] = useState<string | null>(null);

  // Module 8: Thông tin Tài khoản (Account Directory, SHA-256 Reset & Lock)
  const [accountDirectory, setAccountDirectory] = useState<AdminAccountRecord[]>(() =>
    listAdminAccountDirectory()
  );
  const [accountSearch, setAccountSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState<
    'all' | 'google' | 'facebook' | 'labs' | 'active' | 'locked'
  >('all');
  const [resetPwdTarget, setResetPwdTarget] = useState<AdminAccountRecord | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState('');
  const [resetPwdConfirm, setResetPwdConfirm] = useState('');
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [isResettingPwd, setIsResettingPwd] = useState(false);

  // Module 8B: Phòng Thí nghiệm (Dấu Ấn Labs & Tester Pro Allowlist)
  const [labsEmailInput, setLabsEmailInput] = useState('');
  const [isGrantingBeta, setIsGrantingBeta] = useState(false);
  const [labsGrantNotice, setLabsGrantNotice] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);
  const [testerAllowlist, setTesterAllowlist] = useState<string[]>(() =>
    listTesterAllowlistEmails()
  );
  const [allowlistEmailInput, setAllowlistEmailInput] = useState('');
  const [firebaseUsersList, setFirebaseUsersList] = useState<FirebaseDirectoryUserSummary[]>([]);
  const [isLoadingFirebaseUsers, setIsLoadingFirebaseUsers] = useState(false);
  const [testerAssignEmail, setTesterAssignEmail] = useState('');
  const [testerSelectedFirebaseKey, setTesterSelectedFirebaseKey] = useState('');
  const [isUpdatingTesterRole, setIsUpdatingTesterRole] = useState(false);
  const [isHardcodeModalOpen, setIsHardcodeModalOpen] = useState(false);
  const [hardcodeBundleText, setHardcodeBundleText] = useState('');
  const [hardcodeCopied, setHardcodeCopied] = useState(false);

  const refreshFirebaseUsersDirectory = async () => {
    setIsLoadingFirebaseUsers(true);
    try {
      const list = await pullAllUsersFromFirebaseRealtimeDb();
      setFirebaseUsersList(list);
    } finally {
      setIsLoadingFirebaseUsers(false);
    }
  };

  useEffect(() => {
    if (activeModule === 'accounts') {
      void refreshFirebaseUsersDirectory();
    }
  }, [activeModule]);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4200);
  };

  const applySnapshotsOnly = () => {
    const passes = listIssuedPasses();
    setAnalytics(loadAnalytics());
    setAuditLogs(loadAuditLogs());
    setVisitHistoryLogs(loadVisitHistoryLogs());
    setVisitors(listRegisteredVisitors());
    setIssuedPasses(passes);
    setAccountDirectory(listAdminAccountDirectory(passes));
    setReviews(listVisitorReviews());
    setCmsOverridesSnapshot(loadCmsSiteOverrides());
    setHiddenSiteIds(loadHiddenHeritageIds());
    setPublishedQuizzesSnapshot(loadPublishedQuizzes());
    setSiteSettings(loadSiteSettings());
    setEmergencyState(loadEmergencyLockdownState());
    setSecurityAlerts(loadSecurityAlerts());
    setSupportTickets(listAllSupportTicketsForAdmin(isAdmin));
    setAiAutopilotState(loadAiAutopilotEnabled());
    setAiOutbox(listAdminOutbox());
    setAiShield(loadAiSecurityShield());
    setHydrogenCores(loadHydrogenCoresState());
    setHydrogenBriefing(loadHydrogenExecutiveBriefing());
    setHydrogenCmdLogs(loadHydrogenCommandLogs());
    setTesterAllowlist(listTesterAllowlistEmails());
  };

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [isPushingFirebase, setIsPushingFirebase] = useState(false);
  const firebaseStatus = useFirebaseSyncStatus();

  const refreshLiveData = () => {
    applySnapshotsOnly();
    if (onRefreshCms) onRefreshCms();
    void Promise.all([
      fetchUsersFromCloudApi(),
      syncStateFromServer(),
      pullVisitStatsFromFirebase(),
    ]).then(() => {
      applySnapshotsOnly();
      if (onRefreshCms) onRefreshCms();
    });
  };

  const handleManualCloudSync = async () => {
    if (isSyncingCloud) return;
    setIsSyncingCloud(true);
    try {
      const [users] = await Promise.all([
        fetchUsersFromCloudApi(),
        syncStateFromServer(),
        pullVisitStatsFromFirebase(),
        pullFeedbacksFromFirebase(),
        pullSupportTicketsFromFirebase(),
      ]);
      applySnapshotsOnly();
      if (onRefreshCms) onRefreshCms();
      showToast(
        'ok',
        `Đã đồng bộ tức thì danh sách tài khoản (${users.length > 0 ? users.length : listAdminAccountDirectory().length} tài khoản), đánh giá và yêu cầu hỗ trợ từ đám mây.`
      );
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handlePushAllToFirebase = async () => {
    if (isPushingFirebase) return;
    setIsPushingFirebase(true);
    try {
      const res = await forcePushAllToCloud(sites);
      applySnapshotsOnly();
      if (onRefreshCms) onRefreshCms();
      if (res.ok) {
        const strippedSuffix =
          res.strippedBase64Count > 0
            ? ` (đã tự động chặn ${res.strippedBase64Count} chuỗi Base64 > 250KB)`
            : '';
        showToast(
          'ok',
          appLang === 'en'
            ? `Synced ${res.succeededBranches} lightweight data branches for all 17 monuments, photos, 3D configs, and audio metadata to Firebase Cloud.`
            : appLang === 'zh'
            ? `已成功将 17 处遗产的 ${res.succeededBranches} 个轻量化数据分支同步至 Firebase 云端。`
            : `Đã đẩy thành công ${res.succeededBranches} nhánh dữ liệu nhẹ (17 di tích, 34 ảnh HD, cấu hình 3D, thuyết minh và nguồn tư liệu) lên Firebase Cloud${strippedSuffix}.`
        );
      } else {
        // Fallback info if old RTDB is explicitly configured
        const rtdbFallback = await pushAllCurrentDataToFirebase().catch(() => ({
          ok: false,
          error: undefined,
        }));
        if (rtdbFallback.ok) {
          showToast(
            'ok',
            'Đã đồng bộ dữ liệu lên Firebase Realtime Database thành công.'
          );
        } else {
          showToast(
            'err',
            `Chưa đẩy được lên Firebase Cloud (${res.firstErrorCode || 'unknown'}): ${
              res.firstErrorMessage ||
              'Kiểm tra trạng thái đăng nhập Admin hoặc mở mục Đóng gói Mã nguồn & Di trú để xem Nhật ký đồng bộ chi tiết.'
            }`
          );
        }
      }
    } finally {
      setIsPushingFirebase(false);
    }
  };

  useEffect(() => {
    if (
      activeModule === 'accounts' ||
      activeModule === 'labs' ||
      activeModule === 'visitors_tickets' ||
      activeModule === 'dashboard' ||
      activeModule === 'support' ||
      activeModule === 'reviews'
    ) {
      void Promise.all([
        activeModule === 'support' || activeModule === 'reviews'
          ? Promise.resolve([])
          : fetchUsersFromCloudApi(),
        activeModule === 'dashboard' ? pullVisitStatsFromFirebase() : Promise.resolve(false),
        activeModule === 'support' ? pullSupportTicketsFromFirebase() : Promise.resolve(false),
        activeModule === 'reviews' ? pullFeedbacksFromFirebase() : Promise.resolve(false),
      ]).then(() => {
        applySnapshotsOnly();
      });
    }
  }, [activeModule]);

  useEffect(() => {
    void Promise.all([
      fetchUsersFromCloudApi(),
      syncStateFromServer(),
      pullVisitStatsFromFirebase(),
      pullFeedbacksFromFirebase(),
      pullSupportTicketsFromFirebase(),
    ]).then(() => {
      applySnapshotsOnly();
      if (onRefreshCms) onRefreshCms();
    });
    const syncSnapshotsOnly = () => {
      applySnapshotsOnly();
    };
    const onStorageSync = (e: StorageEvent) => {
      if (
        e.key === 'dau_an_viet_analytics_v1' ||
        e.key === VISIT_HISTORY_STORAGE_KEY ||
        e.key === SUPPORT_TICKETS_STORAGE_KEY ||
        e.key === AI_OUTBOX_STORAGE_KEY ||
        e.key === AI_SHIELD_STORAGE_KEY ||
        e.key === HYDROGEN_CORES_STORAGE_KEY ||
        e.key === HYDROGEN_BRIEFING_STORAGE_KEY ||
        e.key === HYDROGEN_COMMAND_LOGS_KEY ||
        e.key === ACCOUNT_LOCKS_STORAGE_KEY
      ) {
        syncSnapshotsOnly();
      }
    };
    window.addEventListener(ANALYTICS_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(PASSES_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(VISITORS_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(CMS_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(REVIEWS_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(QUIZZES_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(EMERGENCY_LOCKDOWN_EVENT, syncSnapshotsOnly);
    window.addEventListener(SECURITY_LOGS_EVENT, syncSnapshotsOnly);
    window.addEventListener(SUPPORT_TICKETS_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(AI_AUTOPILOT_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(AI_OUTBOX_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(AI_SHIELD_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(HYDROGEN_CORES_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(ACCOUNT_LOCKS_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(TESTER_ALLOWLIST_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(ACCOUNTS_DB_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener(SUBSCRIPTION_TIER_UPDATED_EVENT, syncSnapshotsOnly);
    window.addEventListener('storage', onStorageSync);
    return () => {
      window.removeEventListener(ANALYTICS_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(PASSES_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(VISITORS_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(CMS_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(REVIEWS_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(QUIZZES_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(EMERGENCY_LOCKDOWN_EVENT, syncSnapshotsOnly);
      window.removeEventListener(SECURITY_LOGS_EVENT, syncSnapshotsOnly);
      window.removeEventListener(SUPPORT_TICKETS_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(AI_AUTOPILOT_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(AI_OUTBOX_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(AI_SHIELD_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(HYDROGEN_CORES_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(ACCOUNT_LOCKS_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(TESTER_ALLOWLIST_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(ACCOUNTS_DB_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener(SUBSCRIPTION_TIER_UPDATED_EVENT, syncSnapshotsOnly);
      window.removeEventListener('storage', onStorageSync);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const activeSite = useMemo(
    () => sites.find((s) => s.id === selectedSiteId) || sites[0],
    [sites, selectedSiteId]
  );

  const customGlbMap = useAllCustomGlbMap();
  const { source: activeSiteGlb } = useSiteGlbSource(activeSite?.id || null);

  useEffect(() => {
    setDraftGlbUrl(activeSiteGlb.remoteUrl || '');
  }, [activeSite?.id, activeSiteGlb.remoteUrl]);

  // Populate draft editor fields whenever activeSite or audioEditLang changes
  useEffect(() => {
    if (!activeSite) return;
    const override = cmsOverridesSnapshot[activeSite.id];
    setDraftName(override?.officialName ?? activeSite.officialName);
    setDraftChronology(override?.chronology ?? activeSite.chronology);
    setDraftCommencementYear(String(override?.commencementYear ?? activeSite.commencementYear));
    setDraftStreet(override?.addressStreet ?? activeSite.address.street);
    setDraftDistrict(override?.addressDistrict ?? activeSite.address.district);
    setDraftStyle(override?.architecturalStyle ?? activeSite.architecturalStyle);
    setDraftSummary(override?.summary ?? activeSite.summary);
    setDraftConservationNotes(override?.conservationNotes ?? activeSite.conservationNotes ?? '');
    setDraftDossierStatus(override?.dossierStatus ?? activeSite.dossierStatus);
    setDraftIsHidden(Boolean(override?.isHidden) || override?.visibility === 'hidden');
    setDraftModelVisibility(override?.modelVisibility === 'hidden' ? 'hidden' : 'published');
    setDraftHiddenChapterIds(Array.isArray(override?.hiddenChapterIds) ? override.hiddenChapterIds : []);

    const customSlots = normalizeCustomPhotoSlot(effectiveCustomPhotosMap[activeSite.id]);
    setDraftPhoto1Url(customSlots.photo1 || '');
    setDraftPhoto2Url(customSlots.photo2 || '');
    const histOverride = getCustomHistoricalPhotoForSite(activeSite.id);
    const histDefault = getHistoricalArchiveForSite(activeSite.id)?.url || '';
    setDraftHistoricalPhotoUrl(histOverride || histDefault);

    const videoKey = resolveHeritageVideoId(activeSite.id);
    const customVideo = loadCustomVideoUrlForHeritage(videoKey);
    const defaultVideo = HERITAGE_FLYCAM_VIDEOS[videoKey]?.videoId || '';
    setDraftYoutubeInput(customVideo?.originalUrl || defaultVideo);
  }, [activeSite?.id]);

  useEffect(() => {
    if (!launchGlbTarget?.siteId) return;
    setActiveModule('cms');
    setSelectedSiteId(launchGlbTarget.siteId);
    const timer = window.setTimeout(() => {
      glbSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 160);
    return () => window.clearTimeout(timer);
  }, [launchGlbTarget?.siteId, launchGlbTarget?.token]);

  useEffect(() => {
    if (!activeSite) return;
    const script = getCuratedAudioScript(activeSite.id, audioEditLang);
    if (script) {
      setDraftAudioFolioTitle(script.folioTitle);
      setDraftAudioChapters(script.chapters.map((ch) => ({ ...ch })));
    } else {
      setDraftAudioFolioTitle(activeSite.officialName);
      setDraftAudioChapters([
        {
          id: 'ch1',
          roman: audioEditLang === 'en' ? 'CHAPTER I' : audioEditLang === 'zh' ? '第一章' : 'CHƯƠNG I',
          title: activeSite.officialName,
          durationSec: 120,
          narration: activeSite.summary,
        },
      ]);
    }
  }, [activeSite?.id, audioEditLang]);

  const aiSelectedSite = useMemo(
    () => sites.find((s) => s.id === aiSiteId) || sites[0],
    [sites, aiSiteId]
  );

  useEffect(() => {
    if (!aiSelectedSite) return;
    const cmsOv = loadCmsSiteOverrides()[aiSelectedSite.id];
    const transOv = loadSiteTranslationOverrides()[aiSelectedSite.id];
    const staticEn = SITE_TRANSLATIONS[aiSelectedSite.id];
    const staticZh = SITE_TRANSLATIONS_ZH[aiSelectedSite.id];

    setAiSummaryVi(cmsOv?.summary ?? aiSelectedSite.summary);
    setAiNameEn(transOv?.en?.officialName ?? staticEn?.officialName ?? aiSelectedSite.officialName);
    setAiStyleEn(
      transOv?.en?.architecturalStyle ??
        staticEn?.architecturalStyle ??
        aiSelectedSite.architecturalStyle
    );
    setAiSummaryEn(transOv?.en?.summary ?? staticEn?.summary ?? '');

    setAiNameZh(transOv?.zh?.officialName ?? staticZh?.officialName ?? aiSelectedSite.officialName);
    setAiStyleZh(
      transOv?.zh?.architecturalStyle ??
        staticZh?.architecturalStyle ??
        aiSelectedSite.architecturalStyle
    );
    setAiSummaryZh(transOv?.zh?.summary ?? staticZh?.summary ?? '');

    const drafts = loadSiteQuizDrafts()[aiSelectedSite.id];
    const published = loadPublishedQuizzes()[aiSelectedSite.id]?.questions;
    setQuizDraftQuestions(drafts || published || []);
  }, [aiSelectedSite?.id]);

  const filteredSites = useMemo(() => {
    const q = cmsSearch.trim().toLowerCase();
    return sites.filter((site) => {
      const isHidden =
        hiddenSiteIds.includes(site.id) || Boolean(cmsOverridesSnapshot[site.id]?.isHidden);
      const effectiveStatus = cmsOverridesSnapshot[site.id]?.dossierStatus ?? site.dossierStatus;
      if (cmsFilter === 'hidden' && !isHidden) return false;
      if (cmsFilter === 'approved_published' && (isHidden || effectiveStatus !== 'approved_published')) {
        return false;
      }
      if (cmsFilter === 'expert_review' && effectiveStatus !== 'expert_review') {
        return false;
      }
      if (cmsFilter === 'draft' && effectiveStatus !== 'draft' && effectiveStatus !== 'district_submitted') {
        return false;
      }
      if (!q) return true;
      return (
        site.officialName.toLowerCase().includes(q) ||
        (site.folkName || '').toLowerCase().includes(q) ||
        site.id.toLowerCase().includes(q) ||
        site.address.district.toLowerCase().includes(q)
      );
    });
  }, [sites, cmsSearch, cmsFilter, cmsOverridesSnapshot, hiddenSiteIds]);

  const rankingRows = useMemo(() => {
    const rows = sites.map((s, idx) => ({
      order: String(idx + 1).padStart(2, '0'),
      site: s,
      views: analytics.siteViews[s.id] || 0,
    }));
    rows.sort((a, b) => b.views - a.views);
    const maxViews = Math.max(1, ...rows.map((r) => r.views));
    return { rows, maxViews };
  }, [sites, analytics]);

  const filteredPasses = useMemo(() => {
    if (ticketFilter === 'all') return issuedPasses;
    return issuedPasses.filter((p) => p.status === ticketFilter);
  }, [issuedPasses, ticketFilter]);

  const reviewStats = useMemo(() => computeVisitorReviewStats(reviews), [reviews]);

  const filteredReviews = useMemo(() => {
    const filtered = reviews.filter((rev) => {
      if (reviewStarFilter === '5' && rev.rating !== 5) return false;
      if (reviewStarFilter === '4' && rev.rating !== 4) return false;
      if (reviewStarFilter === 'le3' && rev.rating > 3) return false;
      const hasReply = Boolean(rev.adminReply && rev.adminReply.trim());
      if (reviewStatusFilter === 'unresponded' && hasReply) return false;
      if (reviewStatusFilter === 'responded' && !hasReply) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reviews, reviewStarFilter, reviewStatusFilter]);

  const pendingSupportCount = useMemo(
    () => supportTickets.filter((t) => t.status === 'pending').length,
    [supportTickets]
  );

  const inProgressSupportCount = useMemo(
    () => supportTickets.filter((t) => t.status === 'in_progress').length,
    [supportTickets]
  );

  const resolvedSupportCount = useMemo(
    () => supportTickets.filter((t) => t.status === 'resolved').length,
    [supportTickets]
  );

  const filteredSupportTickets = useMemo(() => {
    const filtered = supportTickets.filter((t) => {
      if (supportStatusFilter !== 'all' && t.status !== supportStatusFilter) return false;
      if (supportCategoryFilter !== 'all' && t.category !== supportCategoryFilter) return false;
      return true;
    });
    return sortSupportTicketsForAdmin(filtered);
  }, [supportTickets, supportStatusFilter, supportCategoryFilter]);

  const contentGaps = useMemo(
    () => getSiteContentGaps(sites),
    [sites, cmsOverridesSnapshot, publishedQuizzesSnapshot]
  );

  const filteredOutbox = useMemo(() => {
    if (outboxFilter === 'all') return aiOutbox;
    return aiOutbox.filter((item) => item.kind === outboxFilter);
  }, [aiOutbox, outboxFilter]);

  const curatorAudit = useMemo(
    () => getHydrogenCuratorAuditSummary(sites),
    [sites, cmsOverridesSnapshot, publishedQuizzesSnapshot]
  );

  const conciergeSentiment = useMemo(
    () => getConciergeSentimentSummary(),
    [reviews, supportTickets]
  );

  const systemHealth = useMemo(
    () => computeSystemHealthMetrics(hydrogenCores, aiShield, emergencyState),
    [hydrogenCores, aiShield, emergencyState]
  );

  const accountStats = useMemo(() => {
    const total = accountDirectory.length;
    const googleCount = accountDirectory.filter((a) => a.provider === 'google').length;
    const facebookCount = accountDirectory.filter((a) => a.provider === 'facebook').length;
    const lockedCount = accountDirectory.filter((a) => a.isLocked).length;
    return { total, googleCount, facebookCount, lockedCount };
  }, [accountDirectory]);

  const conservationStatusStats = useMemo(() => {
    const draftSites: HeritageSite[] = [];
    const expertReviewSites: HeritageSite[] = [];
    const publishedSites: HeritageSite[] = [];

    for (const site of sites) {
      const effectiveStatus = cmsOverridesSnapshot[site.id]?.dossierStatus ?? site.dossierStatus;
      if (effectiveStatus === 'approved_published') {
        publishedSites.push(site);
      } else if (effectiveStatus === 'expert_review') {
        expertReviewSites.push(site);
      } else {
        // Includes 'draft' and 'district_submitted' pre-review records
        draftSites.push(site);
      }
    }

    const total = Math.max(1, sites.length);
    const publishedPct = Math.round((publishedSites.length / total) * 100);

    const items = [
      {
        key: 'published' as const,
        name:
          appLang === 'en'
            ? 'Published'
            : appLang === 'zh'
            ? '已发布 (Published)'
            : 'Đã xuất bản (Published)',
        shortName: 'Published',
        value: publishedSites.length,
        percentage: Math.round((publishedSites.length / total) * 100),
        color: '#47796D',
        sites: publishedSites,
        cmsFilter: 'approved_published' as CmsStatusFilter,
      },
      {
        key: 'expert_review' as const,
        name:
          appLang === 'en'
            ? 'Expert Review'
            : appLang === 'zh'
            ? '专家审核中 (Expert Review)'
            : 'Chờ thẩm định (Expert Review)',
        shortName: 'Expert Review',
        value: expertReviewSites.length,
        percentage: Math.round((expertReviewSites.length / total) * 100),
        color: '#C9A46A',
        sites: expertReviewSites,
        cmsFilter: 'expert_review' as CmsStatusFilter,
      },
      {
        key: 'draft' as const,
        name:
          appLang === 'en'
            ? 'Draft'
            : appLang === 'zh'
            ? '草稿 (Draft)'
            : 'Bản nháp (Draft)',
        shortName: 'Draft',
        value: draftSites.length,
        percentage: Math.round((draftSites.length / total) * 100),
        color: '#A94F3D',
        sites: draftSites,
        cmsFilter: 'draft' as CmsStatusFilter,
      },
    ];

    const chartData = items.filter((item) => item.value > 0);
    return {
      total: sites.length,
      publishedCount: publishedSites.length,
      publishedPct,
      items,
      chartData,
    };
  }, [sites, cmsOverridesSnapshot, appLang]);

  const recentSecurityEvents = useMemo(() => {
    type SecurityFeedItem = {
      id: string;
      timestamp: string;
      title: string;
      actor: string;
      level: 'ok' | 'warning' | 'critical';
      statusLabel: string;
    };

    const alertItems: SecurityFeedItem[] = securityAlerts.map((a) => ({
      id: `alert_${a.id}`,
      timestamp: a.timestamp,
      title: a.title,
      actor: a.actor,
      level: a.severity === 'critical' ? 'critical' : a.severity === 'warning' ? 'warning' : 'ok',
      statusLabel:
        a.severity === 'critical'
          ? 'Nghiêm trọng'
          : a.severity === 'warning'
          ? 'Cảnh báo'
          : 'Hệ thống',
    }));

    const auditSecurityItems: SecurityFeedItem[] = auditLogs
      .filter((log) => {
        const lower = `${log.action} ${log.detail}`.toLowerCase();
        return (
          lower.includes('đăng nhập') ||
          lower.includes('mật khẩu') ||
          lower.includes('quản trị') ||
          lower.includes('khóa') ||
          lower.includes('đóng băng') ||
          lower.includes('an ninh')
        );
      })
      .map((log) => ({
        id: `audit_${log.id}`,
        timestamp: log.timestamp,
        title: log.action,
        actor: log.adminEmail,
        level: 'ok' as const,
        statusLabel: 'Đã xác thực',
      }));

    return [...alertItems, ...auditSecurityItems]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [securityAlerts, auditLogs]);

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    return accountDirectory.filter((acc) => {
      if (accountFilter === 'google' && acc.provider !== 'google') return false;
      if (accountFilter === 'facebook' && acc.provider !== 'facebook') return false;
      if (accountFilter === 'labs' && !acc.isBetaTester && acc.role !== 'admin') return false;
      if (accountFilter === 'active' && acc.isLocked) return false;
      if (accountFilter === 'locked' && !acc.isLocked) return false;
      if (!q) return true;
      return (
        acc.displayName.toLowerCase().includes(q) ||
        acc.accountIdentifier.toLowerCase().includes(q) ||
        acc.maskedContact.toLowerCase().includes(q) ||
        acc.userId.toLowerCase().includes(q)
      );
    });
  }, [accountDirectory, accountSearch, accountFilter]);

  const betaTesterAccounts = useMemo(
    () => accountDirectory.filter((acc) => acc.isBetaTester && acc.role !== 'admin'),
    [accountDirectory]
  );

  const enabledLabsCount = useMemo(
    () => LABS_FEATURES_META.filter((f) => Boolean(labsSettings[f.key])).length,
    [labsSettings]
  );

  const labsFeedbackCount = useMemo(
    () =>
      reviews.filter(
        (r) =>
          (r.tags || []).includes('Dấu Ấn Labs') ||
          r.comment.includes('[Thẩm định Labs]') ||
          r.comment.includes('[Báo lỗi Labs]')
      ).length,
    [reviews]
  );

  useEffect(() => {
    if (hasSeededBriefingRef.current || !isAdmin || !user) return;
    if (!hydrogenBriefing && sites.length > 0) {
      hasSeededBriefingRef.current = true;
      const generated = generateHydrogenExecutiveBriefing(sites, user.email || AI_COPILOT_AUTHOR);
      setHydrogenBriefing(generated);
      setHydrogenCores(loadHydrogenCoresState());
    }
  }, [hydrogenBriefing, isAdmin, user, sites]);

  // Auto-run AI Content & Review Autopilot sweep once when Admin opens Studio with Autopilot ON
  useEffect(() => {
    if (!aiAutopilotEnabled || hasAutoSweptRef.current || !isAdmin || !user) return;
    hasAutoSweptRef.current = true;
    const runInitialAutopilot = async () => {
      const reviewRes = await scanAndAutoReplyAllReviewsAsync(AI_COPILOT_AUTHOR);
      const gaps = getSiteContentGaps(sites);
      if (
        gaps.missingTranslationsSites.length > 0 ||
        gaps.missingQuizSites.length > 0
      ) {
        await runAiContentAutopilotSweep(sites, AI_COPILOT_AUTHOR);
      }
      if (
        reviewRes.repliedCount > 0 ||
        gaps.missingTranslationsSites.length > 0 ||
        gaps.missingQuizSites.length > 0
      ) {
        refreshLiveData();
      }
    };
    void runInitialAutopilot();
  }, [aiAutopilotEnabled, isAdmin, user, sites]);

  // Strict RBAC guard (Tester Pro is NEVER permitted into Admin Studio)
  if (!isAdmin || isTesterPro || !user) {
    return null;
  }

  const adminActorEmail = user.email || primaryAdminEmail;

  // =========================================================================
  // MODULE 2 HANDLERS: SAVE FULL CMS FOR SELECTED HERITAGE SITE
  // =========================================================================
  const handleSaveSiteCms = () => {
    if (!activeSite) return;
    const parsedYear = Number(draftCommencementYear);

    saveCmsSiteOverride(
      activeSite.id,
      {
        officialName: draftName.trim() || activeSite.officialName,
        chronology: draftChronology.trim() || activeSite.chronology,
        commencementYear:
          Number.isFinite(parsedYear) && parsedYear !== 0
            ? parsedYear
            : activeSite.commencementYear,
        addressStreet: draftStreet.trim() || activeSite.address.street,
        addressDistrict: draftDistrict.trim() || activeSite.address.district,
        architecturalStyle: draftStyle.trim() || activeSite.architecturalStyle,
        summary: draftSummary.trim() || activeSite.summary,
        conservationNotes: draftConservationNotes.trim(),
        dossierStatus: draftDossierStatus,
        isHidden: draftIsHidden,
        visibility: draftIsHidden ? 'hidden' : 'published',
        modelVisibility: draftModelVisibility,
        hiddenChapterIds: draftHiddenChapterIds,
      },
      adminActorEmail
    );

    // Save 2 real photos (Hình ảnh 01 & Hình ảnh 02) & sync to CLOUD_API_URL
    const trimmedPhoto1 = draftPhoto1Url.trim();
    if (trimmedPhoto1) {
      saveCustomSitePhoto(activeSite.id, trimmedPhoto1, 0);
    } else {
      removeCustomSitePhoto(activeSite.id, 0);
    }

    const trimmedPhoto2 = draftPhoto2Url.trim();
    if (trimmedPhoto2) {
      saveCustomSitePhoto(activeSite.id, trimmedPhoto2, 1);
    } else {
      removeCustomSitePhoto(activeSite.id, 1);
    }

    // Save Historical ("Xưa & Nay") photo if customized
    const trimmedHist = draftHistoricalPhotoUrl.trim();
    const defaultHist = getHistoricalArchiveForSite(activeSite.id)?.url || '';
    if (trimmedHist && trimmedHist !== defaultHist) {
      saveCustomHistoricalPhotoForSite(activeSite.id, trimmedHist);
    }

    // Save YouTube Video ID / URL override if modified from default
    const videoKey = resolveHeritageVideoId(activeSite.id);
    const defaultVideoId = HERITAGE_FLYCAM_VIDEOS[videoKey]?.videoId || '';
    const trimmedYt = draftYoutubeInput.trim();
    if (!trimmedYt || trimmedYt === defaultVideoId) {
      removeCustomVideoUrlForHeritage(videoKey);
    } else {
      saveCustomVideoUrlForHeritage(videoKey, trimmedYt);
    }

    // Save Audio Script override
    if (draftAudioChapters.length > 0) {
      saveAudioScriptOverride(
        activeSite.id,
        audioEditLang,
        {
          folioTitle: draftAudioFolioTitle.trim() || draftName.trim() || activeSite.officialName,
          chapters: draftAudioChapters,
        },
        adminActorEmail
      );
    }

    refreshLiveData();
    showToast(
      'ok',
      `Đã lưu & đồng bộ toàn trang cho [${activeSite.id}] ${draftName.trim() || activeSite.officialName}`
    );
  };

  const handleResetSiteToDefault = () => {
    if (!activeSite) return;
    resetCmsSiteOverride(activeSite.id, adminActorEmail);
    removeCustomSitePhoto(activeSite.id);
    setDraftPhoto1Url('');
    setDraftPhoto2Url('');
    removeCustomHistoricalPhotoForSite(activeSite.id);
    removeCustomVideoUrlForHeritage(resolveHeritageVideoId(activeSite.id));
    refreshLiveData();
    showToast('ok', `Đã khôi phục nội dung & ảnh gốc Wikimedia cho ${activeSite.officialName}`);
  };

  const handleUploadLocalGlbFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeSite) return;
    try {
      const meta = await uploadGlbToPublicFolder(activeSite.id, file);
      showToast(
        'ok',
        `Đã lưu "${meta.fileName}" (${formatGlbFileSize(meta.fileSize)}) vào Kho 3 tầng (IndexedDB Vault + Firebase Storage) cho ${activeSite.officialName}.`
      );
    } catch (err) {
      showToast(
        'err',
        err instanceof Error ? err.message : 'Không thể lưu tệp .glb vào Kho lưu trữ 3 tầng.'
      );
    }
  };

  const handleSaveAdminGlbUrl = () => {
    if (!activeSite) return;
    const raw = draftGlbUrl.trim();
    if (!raw) {
      removeCustomGlbUrl(activeSite.id);
      showToast('ok', `Đã xóa link .glb tùy chỉnh của ${activeSite.officialName}.`);
      return;
    }
    if (!raw.startsWith('http://') && !raw.startsWith('https://') && !raw.startsWith('/')) {
      showToast('err', 'Link .glb phải bắt đầu bằng https://, http:// hoặc /');
      return;
    }
    const normalized = saveCustomGlbUrl(activeSite.id, raw);
    setDraftGlbUrl(normalized);
    showToast(
      'ok',
      `Đã lưu đường dẫn .glb cho ${activeSite.officialName} & đồng bộ lên bản đồ.`
    );
  };

  const handleClearAdminCustomGlb = async () => {
    if (!activeSite) return;
    await clearAllCustomGlbForSite(activeSite.id);
    setDraftGlbUrl('');
    showToast('ok', `Đã xóa ghi đè .glb tùy chỉnh, khôi phục nguồn mặc định cho ${activeSite.officialName}.`);
  };

  const handleApplySlotPhotoUrl = (slot: PhotoSlotIndex) => {
    if (!activeSite) return;
    const rawVal = (slot === 0 ? draftPhoto1Url : draftPhoto2Url).trim();
    if (!rawVal) {
      removeCustomSitePhoto(activeSite.id, slot);
      refreshLiveData();
      showToast(
        'ok',
        `Đã đặt lại Hình ảnh 0${slot + 1} của ${activeSite.officialName} về ảnh gốc & đồng bộ Cloud.`
      );
      return;
    }
    if (
      !rawVal.startsWith('http://') &&
      !rawVal.startsWith('https://') &&
      !rawVal.startsWith('/') &&
      !rawVal.startsWith('data:image/')
    ) {
      showToast('err', 'URL ảnh phải bắt đầu bằng https://, http:// hoặc /');
      return;
    }
    saveCustomSitePhoto(activeSite.id, rawVal, slot);
    refreshLiveData();
    showToast(
      'ok',
      `Đã lưu Hình ảnh 0${slot + 1} cho ${activeSite.officialName} & đồng bộ lên Cloud.`
    );
  };

  const handleResetSlotToWikimedia = async (slot: PhotoSlotIndex) => {
    if (!activeSite) return;
    removeCustomSitePhoto(activeSite.id, slot);
    if (slot === 0) setDraftPhoto1Url('');
    else setDraftPhoto2Url('');
    refreshLiveData();
    const { wikiUrls } = resolveSitePhotoSlots(
      activeSite.id,
      effectiveCustomPhotosMap,
      wikimediaCacheMap
    );
    if (!wikiUrls[slot]) {
      await fetchWikimediaPhotosForSite(activeSite.id, true);
    }
    showToast(
      'ok',
      `Đã đặt lại Hình ảnh 0${slot + 1} của ${activeSite.officialName} về ảnh gốc Wikimedia Commons.`
    );
  };

  const handleUploadLocalSlotPhoto = async (
    slot: PhotoSlotIndex,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeSite) return;
    try {
      const publicUrl = await uploadHeritagePhotoToPublic(activeSite.id, file, slot);
      const resolvedUrl =
        publicUrl || (await compressImageFileToDataUrl(file, 1400, 0.85));
      if (slot === 0) setDraftPhoto1Url(resolvedUrl);
      else setDraftPhoto2Url(resolvedUrl);
      saveCustomSitePhoto(activeSite.id, resolvedUrl, slot);
      refreshLiveData();
      showToast(
        'ok',
        publicUrl
          ? `Đã lưu Hình ảnh 0${slot + 1} vào public/images/heritage/ & src/data/ cho ${activeSite.officialName}.`
          : `Đã nạp Hình ảnh 0${slot + 1} cho ${activeSite.officialName} & đồng bộ lên Cloud.`
      );
    } catch {
      showToast('err', 'Không thể xử lý tệp ảnh tải lên.');
    }
  };

  const handleReloadAllWikimediaPhotos = async () => {
    if (isSyncingWikiPhotos) return;
    setIsSyncingWikiPhotos(true);
    try {
      await syncAllWikimediaPhotos(true);
      refreshLiveData();
      showToast(
        'ok',
        'Đã tải lại bộ 34 ảnh HD (1600px) từ Wikimedia Commons API cho toàn bộ 17 di tích.'
      );
    } catch {
      showToast('err', 'Chưa thể kết nối Wikimedia Commons API, vui lòng thử lại.');
    } finally {
      setIsSyncingWikiPhotos(false);
    }
  };

  const handleUploadLocalHistoricalPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeSite) return;
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 1400, 0.85);
      setDraftHistoricalPhotoUrl(dataUrl);
      saveCustomHistoricalPhotoForSite(activeSite.id, dataUrl);
      refreshLiveData();
      showToast('ok', `Đã nạp ảnh tư liệu xưa cho ${activeSite.officialName}`);
    } catch {
      showToast('err', 'Không thể xử lý ảnh tư liệu tải lên.');
    }
  };

  const handleUploadCustomAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeSite) return;
    uploadCustomAudio(activeSite.id, file);
    showToast('ok', `Đã nạp tệp âm thanh "${file.name}" cho ${activeSite.officialName}`);
  };

  // =========================================================================
  // MODULE 4 HANDLERS: ADMIN EMAILS & SHA-256 ADMIN PASSWORD CHANGE
  // =========================================================================
  const handleAddCoAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addAdminEmail(newAdminEmailInput);
    if (!res.ok) {
      showToast('err', res.error || 'Không thể thêm email quản trị.');
      return;
    }
    setNewAdminEmailInput('');
    refreshLiveData();
    showToast('ok', 'Đã cấp quyền Đồng Quản trị viên thành công.');
  };

  const handleChangeAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPwd !== confirmAdminPwd) {
      showToast('err', 'Mật khẩu mới và xác nhận chưa trùng khớp.');
      return;
    }
    const res = await changeAdminPassword(currentAdminPwd, newAdminPwd);
    if (!res.ok) {
      showToast('err', res.error || 'Không thể đổi mật khẩu.');
      return;
    }
    setCurrentAdminPwd('');
    setNewAdminPwd('');
    setConfirmAdminPwd('');
    refreshLiveData();
    showToast('ok', 'Đã cập nhật Mật khẩu Quản trị viên (SHA-256) thành công.');
  };

  const handleGrantBetaTesterByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawEmail = labsEmailInput.trim();
    const normalized = rawEmail.toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      setLabsGrantNotice({
        type: 'err',
        text: 'Vui lòng nhập địa chỉ email hợp lệ của tài khoản cần cấp quyền thử nghiệm.',
      });
      return;
    }

    setIsGrantingBeta(true);
    setLabsGrantNotice(null);
    try {
      const findMatchingAccount = (list: AdminAccountRecord[]) =>
        list.find(
          (acc) =>
            acc.accountIdentifier.trim().toLowerCase() === normalized ||
            acc.maskedContact.trim().toLowerCase() === normalized
        );

      let target = findMatchingAccount(listAdminAccountDirectory());
      if (!target) {
        await Promise.all([fetchUsersFromCloudApi(), syncStateFromServer()]);
        applySnapshotsOnly();
        target = findMatchingAccount(listAdminAccountDirectory());
      }

      if (!target) {
        const msg = `Chưa tìm thấy tài khoản "${rawEmail}" trong hệ thống hoặc Cloud. Người dùng cần đăng ký / đăng nhập ít nhất một lần trước khi cấp quyền.`;
        setLabsGrantNotice({ type: 'err', text: msg });
        showToast('err', msg);
        return;
      }

      if (target.isPrimaryAdmin || target.role === 'admin') {
        const msg = `Tài khoản Quản trị viên (${target.accountIdentifier}) mặc định đã có toàn quyền Phòng Thí nghiệm (Labs).`;
        setLabsGrantNotice({ type: 'ok', text: msg });
        setLabsEmailInput('');
        return;
      }

      const res = setUserBetaTester({
        userId: target.userId,
        isBetaTester: true,
        adminEmail: adminActorEmail,
        accountHint: {
          provider: target.provider,
          displayName: target.displayName,
          accountIdentifier: target.accountIdentifier,
          role: target.role,
        },
      });

      if (!res.ok) {
        const msg = res.error || 'Không thể cấp quyền Tài khoản Thử nghiệm.';
        setLabsGrantNotice({ type: 'err', text: msg });
        showToast('err', msg);
        return;
      }

      refreshLiveData();
      setLabsEmailInput('');
      const okMsg = `Đã cấp quyền Tài khoản Thử nghiệm cho ${target.displayName} (${target.accountIdentifier}) và đồng bộ lên Cloud.`;
      setLabsGrantNotice({ type: 'ok', text: okMsg });
      showToast('ok', okMsg);
    } finally {
      setIsGrantingBeta(false);
    }
  };

  // =========================================================================
  // MODULE 5 HANDLERS: SITE SETTINGS & JSON BACKUP
  // =========================================================================
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSiteSettings(siteSettings, adminActorEmail);
    refreshLiveData();
    showToast('ok', 'Đã lưu Cấu hình Hệ thống & áp dụng toàn trang.');
  };

  const handleDownloadJsonBackup = () => {
    const json = exportFullPlatformBackupJson(adminActorEmail);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dau-an-viet-3d-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    refreshLiveData();
    showToast('ok', 'Đã xuất tệp sao lưu toàn hệ thống (.JSON).');
  };

  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const res = importFullPlatformBackupJson(content, adminActorEmail);
      if (!res.ok) {
        showToast('err', res.error || 'Khôi phục dữ liệu thất bại.');
        return;
      }
      refreshLiveData();
      showToast('ok', `Đã phục hồi dữ liệu sao lưu thành công (${res.importedCount || 0} hồ sơ).`);
    };
    reader.readAsText(file);
  };

  const handleOpenHardcodeArchiveModal = async () => {
    try {
      const bundle = generateStaticDataHardcodeBundle(adminActorEmail);
      setHardcodeBundleText(bundle);
      setHardcodeCopied(false);
      setIsHardcodeModalOpen(true);
      refreshLiveData();
    } catch {
      showToast('err', 'Không thể tạo gói mã nguồn lưu cứng.');
    }
  };

  const handleDownloadHeritageDataTs = () => {
    try {
      const tsContent = generateHeritageDataTsFile(adminActorEmail);
      const blob = new Blob([tsContent], { type: 'text/typescript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'heritageData.ts';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      refreshLiveData();
      showToast(
        'ok',
        appLang === 'en'
          ? 'Downloaded complete heritageData.ts (17 sites, 34 photos, VI/EN/ZH captions, .glb, Scale, Rotation Y & 3D Hotspots).'
          : appLang === 'zh'
          ? '已下载完整 heritageData.ts 源码文件（含 17 处遗产、34 张图片、三语字幕、.glb、缩放、旋转与 3D 热点）。'
          : 'Đã tải về tệp mã nguồn heritageData.ts hoàn chỉnh (17 di tích, 34 ảnh, chú thích VI/EN/ZH, .glb, Scale, Rotation Y & Hotspots 3D).'
      );
    } catch {
      showToast('err', 'Không thể xuất tệp mã nguồn heritageData.ts.');
    }
  };

  const handleCopyHardcodeBundle = async () => {
    if (!hardcodeBundleText) return;
    try {
      await navigator.clipboard.writeText(hardcodeBundleText);
      setHardcodeCopied(true);
      window.setTimeout(() => setHardcodeCopied(false), 2500);
      showToast('ok', 'Đã sao chép toàn bộ mã nguồn dữ liệu tĩnh vào bộ nhớ tạm.');
    } catch {
      showToast('err', 'Trình duyệt không cho phép tự động sao chép, vui lòng bôi đen và copy thủ công.');
    }
  };

  const handleAiTranslateSite = async () => {
    if (!aiSelectedSite || isAiTranslating) return;
    setIsAiTranslating(true);
    try {
      const res = await fetch('/api/gemini/curator-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          site: {
            id: aiSelectedSite.id,
            officialName: aiSelectedSite.officialName,
            summary: aiSummaryVi.trim() || aiSelectedSite.summary,
            chronology: aiSelectedSite.chronology,
            architecturalStyle: aiSelectedSite.architecturalStyle,
            district: aiSelectedSite.address.district,
          },
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Máy chủ AI chưa sẵn sàng trên bản tĩnh; bạn có thể nhập & lưu trực tiếp.');
      }
      const json = await res.json();
      if (!res.ok || !json?.data) {
        throw new Error(json?.error || 'Không thể kết nối AI Giám tuyển.');
      }
      const d = json.data;
      if (d.summaryVi || d.viSummary) setAiSummaryVi(d.summaryVi || d.viSummary);
      if (d.officialNameEn || d.en?.officialName) {
        setAiNameEn(d.officialNameEn || d.en.officialName);
      }
      if (d.architecturalStyleEn || d.en?.architecturalStyle) {
        setAiStyleEn(d.architecturalStyleEn || d.en.architecturalStyle);
      }
      if (d.summaryEn || d.en?.summary) {
        setAiSummaryEn(d.summaryEn || d.en.summary);
      }
      if (d.officialNameZh || d.zh?.officialName) {
        setAiNameZh(d.officialNameZh || d.zh.officialName);
      }
      if (d.architecturalStyleZh || d.zh?.architecturalStyle) {
        setAiStyleZh(d.architecturalStyleZh || d.zh.architecturalStyle);
      }
      if (d.summaryZh || d.zh?.summary) {
        setAiSummaryZh(d.summaryZh || d.zh.summary);
      }
      showToast('ok', `AI đã biên soạn & dịch chuẩn xác VI | EN | ZH cho ${aiSelectedSite.officialName}.`);
    } catch (err) {
      showToast(
        'err',
        err instanceof Error ? err.message : 'Lỗi khi gọi Gemini AI biên soạn đa ngữ.'
      );
    } finally {
      setIsAiTranslating(false);
    }
  };

  const handleSaveAiTranslations = () => {
    if (!aiSelectedSite) return;
    saveSiteTranslationCurated(
      aiSelectedSite.id,
      {
        siteName: aiSelectedSite.officialName,
        summaryVi: aiSummaryVi.trim(),
        en: {
          officialName: aiNameEn.trim(),
          architecturalStyle: aiStyleEn.trim(),
          summary: aiSummaryEn.trim(),
        },
        zh: {
          officialName: aiNameZh.trim(),
          architecturalStyle: aiStyleZh.trim(),
          summary: aiSummaryZh.trim(),
        },
      },
      adminActorEmail
    );
    refreshLiveData();
    showToast(
      'ok',
      `Đã lưu bản dịch VI | EN | ZH cho ${aiSelectedSite.officialName} — Cập nhật ngay khi chuyển ngôn ngữ trên Header!`
    );
  };

  const handleAiGenerateQuiz = async () => {
    if (!aiSelectedSite || isAiGeneratingQuiz) return;
    setIsAiGeneratingQuiz(true);
    try {
      const res = await fetch('/api/gemini/curator-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quiz',
          site: {
            id: aiSelectedSite.id,
            officialName: aiSelectedSite.officialName,
            summary: aiSummaryVi.trim() || aiSelectedSite.summary,
            chronology: aiSelectedSite.chronology,
            architecturalStyle: aiSelectedSite.architecturalStyle,
            district: aiSelectedSite.address.district,
            conservationNotes: aiSelectedSite.conservationNotes,
          },
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Máy chủ AI chưa sẵn sàng trên bản tĩnh; bạn có thể soạn & lưu câu hỏi trực tiếp.');
      }
      const json = await res.json();
      if (!res.ok || !Array.isArray(json?.data?.questions)) {
        throw new Error(json?.error || 'Không thể tạo bộ câu hỏi trắc nghiệm AI.');
      }
      const generated: AdminQuizQuestion[] = json.data.questions
        .slice(0, 3)
        .map((q: any, idx: number) => ({
          id: `${aiSelectedSite.id}-q-${Date.now()}-${idx}`,
          siteId: aiSelectedSite.id,
          siteName: aiSelectedSite.officialName,
          question: String(q.question || ''),
          options:
            Array.isArray(q.options) && q.options.length >= 4
              ? q.options.slice(0, 4).map(String)
              : ['A. Đáp án A', 'B. Đáp án B', 'C. Đáp án C', 'D. Đáp án D'],
          correctIndex:
            typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3
              ? q.correctIndex
              : 0,
          explanation: String(q.explanation || ''),
        }));
      setQuizDraftQuestions(generated);
      saveSiteQuizDraft(aiSelectedSite.id, generated);
      showToast(
        'ok',
        `Đã tạo bộ ${generated.length} câu hỏi trắc nghiệm lịch sử cho ${aiSelectedSite.officialName}.`
      );
    } catch (err) {
      showToast(
        'err',
        err instanceof Error ? err.message : 'Lỗi khi tạo bộ câu hỏi trắc nghiệm AI.'
      );
    } finally {
      setIsAiGeneratingQuiz(false);
    }
  };

  const navItems: Array<{
    id: StudioModule;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    badge?: string | number;
  }> = [
    {
      id: 'dashboard',
      label:
        appLang === 'en'
          ? 'Overview & Analytics'
          : appLang === 'zh'
          ? '总览与统计'
          : 'Tổng quan & Thống kê',
      sublabel:
        appLang === 'en'
          ? 'Operations & Tech KPIs'
          : appLang === 'zh'
          ? '运营与技术KPI'
          : 'KPI Vận hành & Công nghệ',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'ai_copilot',
      label:
        appLang === 'en'
          ? 'AI Operations Copilot (4 Cores)'
          : appLang === 'zh'
          ? 'AI 运营助手（4核心）'
          : 'Trợ lý Vận hành AI (4 Lõi)',
      sublabel:
        appLang === 'en'
          ? 'Editorial, Support, Security & Reports'
          : appLang === 'zh'
          ? '编辑、客服、安全与报告'
          : 'Biên tập, Hỗ trợ, An ninh & Báo cáo',
      icon: <Bot className="w-4 h-4" />,
      badge: aiShield.level2EmergencyActive
        ? appLang === 'en'
          ? 'ALERT'
          : appLang === 'zh'
          ? '警报'
          : 'CẢNH BÁO'
        : appLang === 'en'
        ? `${systemHealth.onlineCount}/4 on`
        : appLang === 'zh'
        ? `${systemHealth.onlineCount}/4 开启`
        : `${systemHealth.onlineCount}/4 bật`,
    },
    {
      id: 'cms',
      label:
        appLang === 'en'
          ? 'Manage 17 Monuments'
          : appLang === 'zh'
          ? '管理 17 处古迹'
          : 'Quản trị 17 Di tích',
      sublabel:
        appLang === 'en'
          ? 'Visibility, Photos, Video & Audio'
          : appLang === 'zh'
          ? '显示/隐藏、照片、视频与语音'
          : 'Ẩn/Hiện, Ảnh, Video & Audio',
      icon: <Building2 className="w-4 h-4" />,
      badge: sites.length,
    },
    {
      id: 'media_credits',
      label:
        appLang === 'en'
          ? 'Media Credits'
          : appLang === 'zh'
          ? '资料来源与版权'
          : 'Nguồn tư liệu',
      sublabel:
        appLang === 'en'
          ? 'Images, Videos & Firebase /mediaCredits'
          : appLang === 'zh'
          ? '影像、视频与 Firebase /mediaCredits'
          : 'Ảnh, Video, Bản đồ & Firebase /mediaCredits',
      icon: <BookOpen className="w-4 h-4" />,
      badge: mediaCreditsList.length,
    },
    {
      id: 'ai_curator',
      label:
        appLang === 'en'
          ? 'Royal Historiographer & EdTech'
          : appLang === 'zh'
          ? '史官讲解与教研资料'
          : 'Sử Quan Dấu Ấn & Học liệu',
      sublabel:
        appLang === 'en'
          ? 'Multilingual Translation & Quiz Bank'
          : appLang === 'zh'
          ? '多语种翻译与历史测验'
          : 'Dịch đa ngữ & Trắc nghiệm',
      icon: <RoyalHistoriographerIcon size={16} className="w-4 h-4 text-[#C9A46A] shrink-0" />,
      badge: Object.keys(publishedQuizzesSnapshot).length || undefined,
    },
    {
      id: 'reviews',
      label:
        appLang === 'en'
          ? 'Visitor Reviews'
          : appLang === 'zh'
          ? '游客评价'
          : 'Đánh giá Du khách',
      sublabel:
        appLang === 'en'
          ? 'Feedback & Satisfaction Score'
          : appLang === 'zh'
          ? '反馈与满意度评分'
          : 'Phản hồi & Điểm hài lòng',
      icon: <MessageSquareHeart className="w-4 h-4" />,
      badge:
        reviewStats.unrespondedCount > 0
          ? appLang === 'en'
            ? `${reviewStats.unrespondedCount} new`
            : appLang === 'zh'
            ? `${reviewStats.unrespondedCount} 新`
            : `${reviewStats.unrespondedCount} mới`
          : reviews.length,
    },
    {
      id: 'support',
      label:
        appLang === 'en'
          ? 'Customer Support'
          : appLang === 'zh'
          ? '客户支持'
          : 'Hỗ trợ Khách hàng',
      sublabel:
        appLang === 'en'
          ? 'Ticket Intake & Resolution'
          : appLang === 'zh'
          ? '受理与解答请求'
          : 'Tiếp nhận & Giải đáp Yêu cầu',
      icon: <LifeBuoy className="w-4 h-4" />,
      badge:
        pendingSupportCount > 0
          ? appLang === 'en'
            ? `${pendingSupportCount} open`
            : appLang === 'zh'
            ? `${pendingSupportCount} 待办`
            : `${pendingSupportCount} chờ`
          : supportTickets.length,
    },
    {
      id: 'visitors_tickets',
      label:
        appLang === 'en'
          ? 'Visitors & Digital Passes'
          : appLang === 'zh'
          ? '游客与数字门票'
          : 'Du khách & Vé số',
      sublabel:
        appLang === 'en'
          ? 'Pass History & Certificates'
          : appLang === 'zh'
          ? '门票记录与证书'
          : 'Lịch sử Vé & Chứng nhận',
      icon: <Ticket className="w-4 h-4" />,
      badge: issuedPasses.length,
    },
    {
      id: 'accounts',
      label:
        appLang === 'en'
          ? 'User Accounts'
          : appLang === 'zh'
          ? '账户信息'
          : 'Thông tin Tài khoản',
      sublabel:
        appLang === 'en'
          ? 'Identity & SHA-256 Security'
          : appLang === 'zh'
          ? '身份识别与 SHA-256 安全'
          : 'Định danh & Bảo mật SHA-256',
      icon: <KeyRound className="w-4 h-4" />,
      badge:
        accountStats.lockedCount > 0
          ? appLang === 'en'
            ? `${accountStats.lockedCount} locked`
            : appLang === 'zh'
            ? `${accountStats.lockedCount} 锁定`
            : `${accountStats.lockedCount} khóa`
          : accountStats.total,
    },
    {
      id: 'payments_orders',
      label:
        appLang === 'en'
          ? 'Payments & Orders'
          : appLang === 'zh'
          ? '支付配置与订单'
          : 'Cấu hình Thanh toán & Đơn hàng',
      sublabel:
        appLang === 'en'
          ? 'VietQR Bank Image & USD Orders'
          : appLang === 'zh'
          ? 'VietQR 二维码与美元订单对账'
          : 'Ảnh VietQR nội địa & Đơn Quốc tế USD',
      icon: <QrCode className="w-4 h-4" />,
      badge: paymentOrdersCount || undefined,
    },
    {
      id: 'login_audit',
      label:
        appLang === 'en'
          ? 'Login Audit Log'
          : appLang === 'zh'
          ? '登录审计日志'
          : 'Nhật ký Đăng nhập',
      sublabel:
        appLang === 'en'
          ? 'Devices, Time & IP Geolocation'
          : appLang === 'zh'
          ? '设备、时间与 IP 位置监控'
          : 'Thiết bị, Thời gian & Vị trí IP',
      icon: <Shield className="w-4 h-4" />,
      badge: loginAuditCount || undefined,
    },
    {
      id: 'labs',
      label:
        appLang === 'en'
          ? 'Experimental Labs'
          : appLang === 'zh'
          ? '实验室 (Labs)'
          : 'Phòng Thí nghiệm (Labs)',
      sublabel:
        appLang === 'en'
          ? 'Beta Testers & Experimental Features'
          : appLang === 'zh'
          ? '内测体验官与实验功能'
          : 'Beta Tester & Tính năng Thử nghiệm',
      icon: <FlaskConical className="w-4 h-4" />,
      badge: `${enabledLabsCount}/4`,
    },
    {
      id: 'permissions',
      label:
        appLang === 'en'
          ? 'Roles & Security'
          : appLang === 'zh'
          ? '权限与安全'
          : 'Phân quyền & Bảo mật',
      sublabel:
        appLang === 'en'
          ? 'Admins, Password & Lockdown'
          : appLang === 'zh'
          ? '管理员、密码与紧急冻结'
          : 'Quản trị viên, Mật khẩu & Đóng băng',
      icon: <Users className="w-4 h-4" />,
      badge: emergencyState.isLocked
        ? appLang === 'en'
          ? 'LOCKED'
          : appLang === 'zh'
          ? '已冻结'
          : 'ĐÓNG BĂNG'
        : securityAlerts.length > 0
        ? appLang === 'en'
          ? `${securityAlerts.length} alerts`
          : appLang === 'zh'
          ? `${securityAlerts.length} 警报`
          : `${securityAlerts.length} cảnh báo`
        : secondaryAdminEmails.length + 1,
    },
    {
      id: 'source_backup',
      label:
        appLang === 'en'
          ? 'Source Baker & Migration'
          : appLang === 'zh'
          ? '源码打包与迁移备份'
          : 'Đóng gói Mã nguồn & Di trú',
      sublabel:
        appLang === 'en'
          ? '3-Tier Sync, 17/17 Matrix & .TS'
          : appLang === 'zh'
          ? '三层同步、17/17 矩阵与源码导出'
          : 'Đồng bộ 3 tầng, 17/17 & bakedAssets.ts',
      icon: <FileCode2 className="w-4 h-4" />,
      badge: '17/17',
    },
    {
      id: 'settings_backup',
      label:
        appLang === 'en'
          ? 'Settings & Backup'
          : appLang === 'zh'
          ? '配置与备份'
          : 'Cấu hình & Sao lưu',
      sublabel:
        appLang === 'en'
          ? 'Banner, 3D & JSON Backup'
          : appLang === 'zh'
          ? '横幅、3D 与 JSON 备份'
          : 'Banner, 3D & Sao lưu JSON',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const hiddenCount = sites.filter(
    (s) => hiddenSiteIds.includes(s.id) || Boolean(cmsOverridesSnapshot[s.id]?.isHidden)
  ).length;

  const openEmergencyLockdownWizard = () => {
    setLockdownDraftMessage(emergencyState.message || DEFAULT_EMERGENCY_LOCKDOWN_MESSAGE);
    setLockdownConfirmPassword('');
    setShowLockdownPwd(false);
    setLockdownConfirmError(null);
    setLockdownModalStep(1);
    setIsLockdownModalOpen(true);
  };

  const handleConfirmActivateLockdown = async (e: React.FormEvent) => {
    e.preventDefault();
    setLockdownConfirmError(null);
    setIsVerifyingLockdown(true);
    try {
      const valid = await verifyAdminPassword(lockdownConfirmPassword);
      if (!valid) {
        setLockdownConfirmError(
          'Mật khẩu Quản trị viên SHA-256 không chính xác. Không thể kích hoạt đóng băng.'
        );
        return;
      }
      const next = activateEmergencyLockdown(lockdownDraftMessage, adminActorEmail);
      setEmergencyState(next);
      setIsLockdownModalOpen(false);
      setLockdownConfirmPassword('');
      refreshLiveData();
      showToast(
        'ok',
        '🚨 ĐÃ KÍCH HOẠT ĐÓNG BĂNG KHẨN CẤP! Toàn bộ du khách đã bị ngắt truy cập, chỉ Admin vẫn giữ quyền điều hành.'
      );
    } finally {
      setIsVerifyingLockdown(false);
    }
  };

  const handleDeactivateLockdown = () => {
    const next = deactivateEmergencyLockdown(adminActorEmail);
    setEmergencyState(next);
    refreshLiveData();
    showToast('ok', 'Đã mở khóa cổng thông tin. Hệ thống đã khôi phục hoạt động bình thường.');
  };

  const renderSecurityAlertsTable = () => (
    <div className="rounded-2xl bg-[#161619] border border-white/[0.08] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF453A]/15 border border-[#FF453A]/40 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-[#FF453A]" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-[#F5F5F7]">
              Nhật ký Cảnh báo An ninh (Brute-Force &amp; Spam Shield)
            </h4>
            <p className="text-[11px] text-[#86868B]">
              Tự động ghi nhận khi nhập sai mật khẩu ≥ 3 lần liên tiếp (khóa 60s), spam đánh giá hoặc tạo vé liên tục
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!emergencyState.isLocked && (
            <button
              type="button"
              onClick={openEmergencyLockdownWizard}
              className="px-3.5 py-1.5 rounded-full bg-[#FF453A]/20 hover:bg-[#FF453A]/35 border border-[#FF453A]/50 text-[#FF8A80] text-xs font-semibold cursor-pointer transition-colors"
            >
              🚨 Kích hoạt Đóng băng ngay
            </button>
          )}
          {securityAlerts.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearSecurityAlerts(adminActorEmail);
                refreshLiveData();
                showToast('ok', 'Đã dọn dẹp Nhật ký Cảnh báo An ninh.');
              }}
              className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-[#A1A1A6] hover:text-white text-xs cursor-pointer"
            >
              Xóa nhật ký cũ
            </button>
          )}
        </div>
      </div>

      {securityAlerts.length === 0 ? (
        <div className="py-8 text-center rounded-xl bg-black/35 border border-white/[0.06] space-y-1.5">
          <ShieldCheck className="w-7 h-7 text-emerald-400 mx-auto" />
          <div className="text-xs font-medium text-[#E5E5EA]">
            Hệ thống đang an toàn — Chưa ghi nhận cảnh báo tấn công hay spam bất thường
          </div>
          <p className="text-[11px] text-[#86868B]">
            Lá chắn tự động giám sát mọi nỗ lực dò mật khẩu SHA-256 và thao tác gửi đánh giá / tạo vé tốc độ cao.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto heritage-scrollbar pb-1.5 touch-pan-x">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[12px] font-medium text-[#86868B]">
                <th className="py-2.5 px-3">Mức độ</th>
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Sự kiện An ninh</th>
                <th className="py-2.5 px-3">Nguồn / Tài khoản</th>
                <th className="py-2.5 px-3">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {securityAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-white/[0.03]">
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        alert.severity === 'critical'
                          ? 'bg-[#FF453A]/20 text-[#FF8A80] border border-[#FF453A]/45'
                          : alert.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/45'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      }`}
                    >
                      {alert.severity === 'critical'
                        ? 'Nghiêm trọng'
                        : alert.severity === 'warning'
                        ? 'Cảnh báo spam'
                        : 'Hệ thống'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap tabular-nums text-[12px] text-[#86868B]">
                    {new Date(alert.timestamp).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-[#F5F5F7]">{alert.title}</td>
                  <td className="py-2.5 px-3 text-[12px] text-[#C5A059] tabular-nums">
                    {alert.actor}
                  </td>
                  <td className="py-2.5 px-3 text-[#D1D1D6]">{alert.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Admin Studio — Trung tâm Quản trị Toàn diện Dấu Ấn Việt 3D"
      onClick={onClose}
      className="fixed inset-0 z-[1300] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-2xl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[96vw] max-w-[1600px] h-[92vh] rounded-[24px] sm:rounded-[30px] bg-[#0E0E11]/98 border border-white/[0.12] shadow-[0_40px_120px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden overflow-x-hidden text-[#F5F5F7] animate-apple-sheet"
      >
        {/* TOP HEADER BAR */}
        <header className="w-full max-w-full min-h-[68px] py-3 px-4 sm:px-6 border-b border-white/[0.08] bg-[#141417]/95 flex flex-col gap-2.5 shrink-0 overflow-x-hidden">
          <div className="flex items-center justify-between gap-3 w-full min-w-0">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen((v) => !v)}
                className="lg:hidden w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[#F5F5F7] cursor-pointer shrink-0"
                aria-label="Mở menu điều hướng"
              >
                <Menu className="w-4 h-4" />
              </button>
              <span
                aria-hidden="true"
                className="w-[2px] h-[36px] bg-[#C9A46A] shrink-0"
              />
              <div className="min-w-0">
                <h2 className="text-[20px] sm:text-[22px] leading-tight font-semibold tracking-tight text-[#F5F5F7] truncate">
                  Admin Studio
                </h2>
                <p className="text-[12px] sm:text-[13px] leading-snug text-[#8E8E93] truncate mt-0.5">
                  {appLang === 'en'
                    ? 'Dấu Ấn Việt 3D  ·  Heritage & Data Administration'
                    : appLang === 'zh'
                    ? '越南印记 3D  ·  数据与遗产管理中心'
                    : 'Dấu Ấn Việt 3D  ·  Quản trị Dữ liệu & Di sản'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="hidden md:inline-block text-[12px] text-[#8E8E93] px-1.5 whitespace-nowrap">
                {user.isPrimaryAdmin ? `Super Admin · ${user.email}` : `Admin · ${user.email}`}
              </span>

              <button
                type="button"
                onClick={onClose}
                aria-label={
                  appLang === 'en' ? 'Close Studio' : appLang === 'zh' ? '关闭工作台' : 'Đóng Studio'
                }
                className="h-9 px-3.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.1] text-xs font-medium text-[#F5F5F7] flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <X className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">
                  {appLang === 'en' ? 'Close Studio' : appLang === 'zh' ? '关闭工作台' : 'Đóng Studio'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full max-w-full">
            <button
              type="button"
              onClick={() => setActiveModule('ai_copilot')}
              className={`inline-flex items-center gap-2 h-8 sm:h-9 px-3 rounded-full border text-[12px] font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                aiShield.level2EmergencyActive
                  ? 'bg-[#A94F3D]/20 border-[#A94F3D] text-[#D8C9A9]'
                  : aiAutopilotEnabled
                  ? 'bg-[#47796D]/15 border-[#47796D]/60 text-[#D8C9A9] hover:bg-[#47796D]/25'
                  : 'bg-[#171817] border-white/[0.12] text-[#D8C9A9]/75 hover:text-[#D8C9A9]'
              }`}
              title={
                appLang === 'en'
                  ? 'Open AI Operations Copilot panel'
                  : appLang === 'zh'
                  ? '打开 AI 运营助手控制面板'
                  : 'Mở bảng điều khiển Trợ lý AI Điều hành'
              }
            >
              <span>
                {aiAutopilotEnabled
                  ? appLang === 'en'
                    ? 'AI Duty: Active'
                    : appLang === 'zh'
                    ? 'AI 值守：运行中'
                    : 'AI Trực ban: Đang hoạt động'
                  : appLang === 'en'
                  ? 'AI Duty: Paused'
                  : appLang === 'zh'
                  ? 'AI 值守：已暂停'
                  : 'AI Trực ban: Tạm nghỉ'}
              </span>
            </button>

            <span
              className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 max-w-full rounded-full border border-[#C9A46A]/45 bg-[#171817] text-[12px] font-semibold text-[#C9A46A] whitespace-nowrap shrink-0"
              title={
                appLang === 'en'
                  ? 'Active Admin Royal Historiographer Core: Gemini 4 Argon'
                  : appLang === 'zh'
                  ? '管理员史官讲解核心已激活：Gemini 4 Argon'
                  : 'Lõi Sử Quan Dấu Ấn mặc định dành cho Quản trị viên: Gemini 4 Argon'
              }
            >
              <RoyalHistoriographerIcon className="w-[18px] h-[18px] text-[#C9A46A] shrink-0" />
              <span className="truncate">
                {appLang === 'en'
                  ? 'Royal Historiographer Core: Gemini 4 Argon (Activated)'
                  : appLang === 'zh'
                  ? '史官讲解核心：Gemini 4 Argon（已激活）'
                  : 'Lõi Sử Quan Dấu Ấn: Gemini 4 Argon (Đã kích hoạt)'}
              </span>
            </span>

            <span
              className={`inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-full border text-[12px] font-medium whitespace-nowrap shrink-0 bg-[#171817] text-[#D8C9A9] ${
                firebaseStatus.state === 'synced'
                  ? 'border-[#47796D]'
                  : firebaseStatus.state === 'syncing'
                  ? 'border-[#C9A46A]'
                  : firebaseStatus.state === 'offline'
                  ? 'border-[#A94F3D]'
                  : 'border-[#526D8B]'
              }`}
              title={
                firebaseStatus.lastSyncedAt
                  ? `Firebase Realtime Database (${new Date(firebaseStatus.lastSyncedAt).toLocaleTimeString()})`
                  : firebaseStatus.lastError || 'Firebase Realtime Database REST Sync'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  firebaseStatus.state === 'synced'
                    ? 'bg-[#47796D]'
                    : firebaseStatus.state === 'syncing'
                    ? 'bg-[#C9A46A]'
                    : firebaseStatus.state === 'offline'
                    ? 'bg-[#A94F3D]'
                    : 'bg-[#526D8B]'
                }`}
              />
              <span>
                {firebaseStatus.state === 'synced'
                  ? appLang === 'en'
                    ? 'Firebase Live · Synced'
                    : appLang === 'zh'
                    ? 'Firebase Live · 已同步'
                    : 'Firebase Live · Đã đồng bộ'
                  : firebaseStatus.state === 'syncing'
                  ? appLang === 'en'
                    ? 'Firebase Live · Syncing'
                    : appLang === 'zh'
                    ? 'Firebase Live · 同步中'
                    : 'Firebase Live · Đang đồng bộ'
                  : firebaseStatus.state === 'offline'
                  ? appLang === 'en'
                    ? 'Firebase Live · Offline'
                    : appLang === 'zh'
                    ? 'Firebase Live · 离线'
                    : 'Firebase Live · Ngoại tuyến'
                  : appLang === 'en'
                  ? 'Firebase Live · Needs DB URL'
                  : appLang === 'zh'
                  ? 'Firebase Live · 待配置链接'
                  : 'Firebase Live · Chờ link DB'}
              </span>
            </span>

            <button
              type="button"
              onClick={() => void handlePushAllToFirebase()}
              disabled={isPushingFirebase}
              className="h-8 sm:h-9 px-3 max-w-full rounded-full bg-[#171817] hover:bg-[#47796D]/25 border border-[#C9A46A]/55 text-xs font-semibold text-[#D8C9A9] flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
              title={
                appLang === 'en'
                  ? 'Push all current photos, 3D settings, and accounts to Firebase'
                  : appLang === 'zh'
                  ? '将当前所有照片、3D 配置及账户推送到 Firebase'
                  : 'Đẩy dữ liệu hiện tại lên Firebase'
              }
            >
              <Database
                className={`w-3.5 h-3.5 text-[#C9A46A] shrink-0 ${
                  isPushingFirebase ? 'animate-pulse' : ''
                }`}
              />
              <span className="truncate">
                {isPushingFirebase
                  ? appLang === 'en'
                    ? 'Pushing to Firebase...'
                    : appLang === 'zh'
                    ? '正在推送至 Firebase...'
                    : 'Đang đẩy lên Firebase...'
                  : appLang === 'en'
                  ? 'Push Current Data to Firebase'
                  : appLang === 'zh'
                  ? '推送当前数据至 Firebase'
                  : 'Đẩy dữ liệu hiện tại lên Firebase'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHeritageDataTs}
              className="h-8 sm:h-9 px-3 max-w-full rounded-full bg-[#171817] hover:bg-[#C9A46A]/20 border border-[#C9A46A]/65 text-xs font-semibold text-[#D8C9A9] flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              title="Tải tệp mã nguồn dữ liệu (heritageData.ts)"
            >
              <Download className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
              <span className="truncate">Tải tệp mã nguồn dữ liệu (heritageData.ts)</span>
            </button>

            <button
              type="button"
              onClick={() => void handleOpenHardcodeArchiveModal()}
              className="h-8 sm:h-9 px-3 rounded-full bg-[#D8C9A9]/10 hover:bg-[#D8C9A9]/20 border border-[#C9A46A]/45 text-xs font-semibold text-[#D8C9A9] flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              title="Lưu cứng dữ liệu hiện tại ra Code (Chống mất khi Remix)"
            >
              <FileCode2 className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
              <span>Lưu cứng ra Code</span>
            </button>

            <button
              type="button"
              onClick={() => void handleManualCloudSync()}
              disabled={isSyncingCloud}
              className="h-8 sm:h-9 px-3.5 rounded-full bg-[#C9A46A]/15 hover:bg-[#C9A46A]/25 border border-[#C9A46A]/55 text-xs font-semibold text-[#D8C9A9] flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-[#C9A46A] shrink-0 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>
                {isSyncingCloud
                  ? appLang === 'en'
                    ? 'Syncing...'
                    : appLang === 'zh'
                    ? '同步中...'
                    : 'Đang đồng bộ...'
                  : appLang === 'en'
                  ? 'Sync Now'
                  : appLang === 'zh'
                  ? '立即同步'
                  : 'Đồng bộ ngay'}
              </span>
            </button>

            <span className="md:hidden inline-flex items-center h-8 px-3 rounded-full bg-[#171817] border border-white/[0.1] text-[11px] text-[#8E8E93] max-w-full truncate">
              {user.isPrimaryAdmin ? `Super Admin · ${user.email}` : `Admin · ${user.email}`}
            </span>
          </div>

          {/* ADMIN ROLE PREVIEW SWITCHER BAR */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.08] w-full">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#C9A46A] mr-1">
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>Xem thử quyền hạn dưới góc nhìn:</span>
              </span>
              {(
                [
                  ['guest', 'Chưa đăng nhập'],
                  ['admin', 'Admin (Mở hết)'],
                  ['tester', 'Tester (Kiểm thử)'],
                  ['basic', 'Cơ bản 0đ'],
                  ['plus', 'Plus 19k'],
                  ['pro', 'Pro 49k'],
                  ['school', 'Trường học'],
                ] as Array<[AdminPreviewRole, string]>
              ).map(([roleKey, label]) => {
                const isActive = previewRole === roleKey;
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => {
                      setPreviewRole(roleKey);
                      showToast(
                        'ok',
                        roleKey === 'guest'
                          ? 'Đang mô phỏng góc nhìn Khách chưa đăng nhập: khóa hoàn toàn Nhạc nền Di sản & Bộ trộn âm kèm lớp phủ mời đăng nhập.'
                          : roleKey === 'admin'
                          ? 'Đã khôi phục toàn quyền Quản trị viên (Admin - Mở hết).'
                          : roleKey === 'tester'
                          ? 'Đang mô phỏng góc nhìn Tester (Kiểm thử): thấy Gemini 4 Argon ở trạng thái khóa cứng, mở Gemini 4 Hydrogen.'
                          : roleKey === 'plus'
                          ? 'Đang mô phỏng góc nhìn Plus 19k (mở Tuyến 01 & Gemini 3.5 Flash; khóa Gemini 4 Hydrogen). Đóng Admin Studio để kiểm thử trực tiếp.'
                          : `Đang mô phỏng giao diện dưới góc nhìn: ${label}. Đóng Admin Studio để kiểm thử trực tiếp.`
                      );
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border ${
                      isActive
                        ? roleKey === 'admin'
                          ? 'bg-[#47796D] border-[#47796D] text-[#F5EFE6]'
                          : 'bg-[#A94F3D] border-[#C9A46A] text-[#F5EFE6]'
                        : 'bg-[#171817] border-white/12 text-[#D8C9A9]/75 hover:text-[#F5EFE6] hover:border-[#C9A46A]/45'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {previewRole !== 'admin' && (
              <span className="text-[11px] text-[#C9A46A] font-medium">
                {previewRole === 'guest'
                  ? 'Đang mô phỏng trạng thái Chưa đăng nhập (Nhạc nền Di sản & Bộ trộn âm đang khóa)'
                  : 'Đang bật chế độ mô phỏng khách hàng (Plus mặc định mở Tuyến 1)'}
              </span>
            )}
          </div>
        </header>

        {/* FLASHING RED LEVEL 2 SECURITY ALERT BAR */}
        {aiShield.level2EmergencyActive && (
          <div className="mx-4 sm:mx-6 mt-3 px-4 py-2.5 rounded-2xl border border-[#FF453A]/80 bg-gradient-to-r from-[#3D1216] via-[#2A1014] to-[#3D1216] text-xs text-rose-100 flex flex-wrap items-center justify-between gap-2.5 shrink-0 animate-pulse">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldAlert className="w-4 h-4 text-[#FF453A] shrink-0" />
              <span className="font-semibold">
                🚨 BÁO ĐỘNG ĐỎ CẤP ĐỘ 2: {aiShield.lastIncidentTitle || 'Phát hiện tấn công quy mô lớn!'} — AI đã bật Lá chắn &amp; gửi mail khẩn cấp tới {PRIMARY_ADMIN_EMAIL}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!emergencyState.isLocked && (
                <button
                  type="button"
                  onClick={openEmergencyLockdownWizard}
                  className="px-3.5 py-1.5 rounded-full bg-[#FF453A] hover:bg-[#FF5B52] text-white text-[11px] font-bold cursor-pointer"
                >
                  Kích hoạt Đóng băng Khẩn cấp
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  clearAiEmergencyShield(adminActorEmail);
                  refreshLiveData();
                  showToast('ok', 'Đã hạ cấp Lá chắn An ninh Mức 2 về trạng thái giám sát bình thường.');
                }}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium cursor-pointer"
              >
                Tắt cảnh báo đỏ
              </button>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {toast && (
          <div
            className={`mx-4 sm:mx-6 mt-3 px-4 py-2.5 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 shrink-0 ${
              toast.type === 'ok'
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                : 'bg-rose-500/15 border-rose-400/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{toast.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-white/60 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MOBILE HORIZONTAL TAB BAR WITH .heritage-scrollbar (Zero hidden tabs on Mobile) */}
        <div className="lg:hidden px-3 py-2 bg-[#131316] border-b border-white/[0.08] shrink-0">
          <nav
            aria-label="Admin Studio Mobile Tabs"
            className="flex items-center gap-1.5 overflow-x-auto flex-nowrap heritage-scrollbar pb-1"
          >
            {navItems.map((item) => {
              const isActive = activeModule === item.id;
              return (
                <button
                  key={`mob-${item.id}`}
                  type="button"
                  onClick={() => {
                    setActiveModule(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#C9A46A] border-[#C9A46A] text-[#171817] font-semibold'
                      : 'bg-[#1C1D1B] border-white/[0.1] text-[#D8C9A9]/80 hover:border-[#C9A46A]/45'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                        isActive ? 'bg-[#171817]/15 text-[#171817]' : 'bg-white/[0.08] text-[#C9A46A]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* MAIN SHELL: LEFT SIDEBAR + RIGHT WORKSPACE */}
        <div className="flex-1 min-h-0 flex relative overflow-hidden">
          {/* LEFT SIDEBAR */}
          <aside
            className={`${
              isMobileSidebarOpen
                ? 'absolute inset-y-0 left-0 z-30 w-72 flex shadow-2xl'
                : 'hidden lg:flex lg:w-72'
            } h-full min-h-0 overflow-y-auto overscroll-contain pr-1.5 admin-sidebar-scrollbar flex-col justify-between gap-4 bg-[#131316] border-r border-white/[0.08] p-3.5 shrink-0`}
          >
            <nav className="space-y-1.5 shrink-0" aria-label="Admin Studio Modules">
              {navItems.map((item) => {
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveModule(item.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isActive
                        ? 'bg-[#C5A059]/15 border-[#C5A059]/55 text-[#F5F5F7] shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-white/[0.05] text-[#A1A1A6] hover:text-[#F5F5F7]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-[#C5A059] text-black'
                            : 'bg-white/[0.06] text-[#8E8E93]'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{item.label}</div>
                        <div className="text-[10.5px] text-[#86868B] truncate">{item.sublabel}</div>
                      </div>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums shrink-0 ${
                          isActive
                            ? 'bg-[#C5A059]/25 text-[#C5A059]'
                            : 'bg-white/[0.07] text-[#8E8E93]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-3.5 rounded-2xl bg-black/45 border border-white/[0.08] space-y-2 text-[11px] shrink-0">
              <div className="flex items-center justify-between text-[#8E8E93]">
                <span>
                  {appLang === 'en'
                    ? 'Publishing Status'
                    : appLang === 'zh'
                    ? '发布状态'
                    : 'Trạng thái xuất bản'}
                </span>
                <span className="font-medium tabular-nums text-emerald-400">
                  {sites.length - hiddenCount}/{sites.length}{' '}
                  {appLang === 'en' ? 'Public' : appLang === 'zh' ? '公开' : 'Công khai'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#8E8E93]">
                <span>
                  {appLang === 'en'
                    ? 'Default 3D Lighting'
                    : appLang === 'zh'
                    ? '默认 3D 光照'
                    : 'Ánh sáng 3D mặc định'}
                </span>
                <span className="font-medium text-[#C5A059]">
                  {siteSettings.default3DLighting === 'studio'
                    ? 'Studio'
                    : appLang === 'en'
                    ? 'Daylight'
                    : appLang === 'zh'
                    ? '日光'
                    : 'Ban ngày'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#8E8E93]">
                <span>
                  {appLang === 'en'
                    ? 'Event Banner'
                    : appLang === 'zh'
                    ? '活动横幅'
                    : 'Banner Sự kiện'}
                </span>
                <span
                  className={`font-medium ${
                    siteSettings.bannerEnabled ? 'text-emerald-400' : 'text-[#636366]'
                  }`}
                >
                  {siteSettings.bannerEnabled
                    ? appLang === 'en'
                      ? 'Enabled'
                      : appLang === 'zh'
                      ? '已开启'
                      : 'Đang bật'
                    : appLang === 'en'
                    ? 'Disabled'
                    : appLang === 'zh'
                    ? '已关闭'
                    : 'Đang tắt'}
                </span>
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN WORKSPACE */}
          <div className="flex-1 h-full min-w-0 min-h-0 overflow-y-auto heritage-scrollbar p-4 sm:p-6 lg:p-7 space-y-6 bg-[#0B0B0D]">
            {/* ===============================================================
                MODULE 1: DASHBOARD (TỔNG QUAN & THỐNG KÊ VẬN HÀNH)
               =============================================================== */}
            {activeModule === 'dashboard' && (
              <div className="space-y-5">
                {/* THANH TRẠNG THÁI AN NINH 1 DÒNG GỌN NHẸ */}
                <div
                  className={`rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
                    emergencyState.isLocked
                      ? 'bg-[#221215] border-[#FF453A]/55'
                      : 'bg-[#141416] border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        emergencyState.isLocked
                          ? 'bg-[#FF453A] animate-ping'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-medium text-[#F5F5F7]">
                      {emergencyState.isLocked
                        ? 'Hệ thống đang đóng băng khẩn cấp — Toàn bộ du khách tạm ngắt truy cập'
                        : 'Hệ thống đang hoạt động bình thường'}
                    </span>
                  </div>

                  {emergencyState.isLocked ? (
                    <button
                      type="button"
                      onClick={handleDeactivateLockdown}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/45 text-xs font-semibold text-emerald-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Mở khóa hệ thống</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openEmergencyLockdownWizard}
                      className="px-3.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-[#FF453A]/20 border border-white/[0.12] hover:border-[#FF453A]/50 text-xs font-medium text-[#F5F5F7] hover:text-[#FF8A80] flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-[#FF453A]" />
                      <span>Khóa khẩn cấp</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[13px] font-medium text-[#C5A059]">
                      Số liệu vận hành thời gian thực
                    </span>
                    <h3 className="text-xl sm:text-2xl font-semibold text-[#F5F5F7] mt-0.5">
                      Tổng quan &amp; Thống kê Bảo tàng Số
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleManualCloudSync()}
                    disabled={isSyncingCloud}
                    className="px-3.5 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                    <span>{isSyncingCloud ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                  </button>
                </div>

                {/* 5 KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                  <div className="p-5 rounded-xl bg-[#141416] border border-white/[0.08] space-y-2">
                    <span className="text-[12px] font-medium text-[#86868B]">
                      Tổng lượt khách truy cập
                    </span>
                    <div className="text-3xl font-semibold text-[#F5F5F7] tabular-nums">
                      {analytics.totalVisitors.toLocaleString('vi-VN')}
                    </div>
                    <div className="text-xs text-emerald-400 tabular-nums">
                      {visitors.length} tài khoản đã định danh
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#141416] border border-white/[0.08] space-y-2">
                    <span className="text-[12px] font-medium text-[#86868B]">
                      Lượt tương tác 3D
                    </span>
                    <div className="text-3xl font-semibold text-[#C5A059] tabular-nums">
                      {analytics.interactions3D.toLocaleString('vi-VN')}
                    </div>
                    <div className="text-xs text-[#A1A1A6] tabular-nums">
                      17 mô hình · {analytics.routesCompleted || 0} lượt hoàn thành tuyến
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#141416] border border-white/[0.08] space-y-2">
                    <span className="text-[12px] font-medium text-[#86868B]">
                      Lượt nghe Thuyết minh
                    </span>
                    <div className="text-3xl font-semibold text-[#F5F5F7] tabular-nums">
                      {analytics.audioPlays.toLocaleString('vi-VN')}
                    </div>
                    <div className="text-xs text-[#A1A1A6]">
                      Đa ngôn ngữ VI · EN · ZH
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#141416] border border-white/[0.08] space-y-2">
                    <span className="text-[12px] font-medium text-[#86868B]">
                      Vé &amp; Chứng nhận đã cấp
                    </span>
                    <div className="text-3xl font-semibold text-[#F5F5F7] tabular-nums">
                      {issuedPasses.length.toLocaleString('vi-VN')}
                    </div>
                    <div className="text-xs text-[#A1A1A6] tabular-nums">
                      {issuedPasses.filter((p) => p.status === 'verified').length} đã xác thực ·{' '}
                      {issuedPasses.filter((p) => p.status === 'revoked').length} đã thu hồi
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveModule('reviews')}
                    className="p-5 rounded-xl bg-[#141416] border border-white/[0.08] hover:border-[#C5A059]/45 text-left space-y-2 transition-all cursor-pointer"
                  >
                    <span className="text-[12px] font-medium text-[#C5A059]">
                      Điểm hài lòng trung bình
                    </span>
                    <div className="text-3xl font-semibold text-[#F5F5F7] tabular-nums flex items-baseline gap-1.5">
                      <span>{reviewStats.total > 0 ? reviewStats.averageRating.toFixed(1) : '—'}</span>
                      <span className="text-lg text-[#C5A059]">/ 5.0 ★</span>
                    </div>
                    <div className="text-xs text-[#A1A1A6] tabular-nums">
                      {reviewStats.total} đánh giá · {reviewStats.unrespondedCount} chưa phản hồi
                    </div>
                  </button>
                </div>

                {/* COMPACT 4-CORE AI STATUS BAR */}
                <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                      <Activity
                        className={`w-5 h-5 ${
                          systemHealth.tone === 'critical'
                            ? 'text-[#FF453A]'
                            : systemHealth.tone === 'warn'
                            ? 'text-amber-300'
                            : 'text-emerald-400'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-[#F5F5F7]">
                          Trợ lý Vận hành AI (4 Lõi)
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[11px] font-medium tabular-nums text-[#D1D1D6]">
                          {systemHealth.onlineCount}/{systemHealth.totalCount} Đang bật
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                            systemHealth.tone === 'critical'
                              ? 'bg-[#FF453A]/15 border-[#FF453A]/45 text-[#FF8A80]'
                              : systemHealth.tone === 'warn'
                              ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                              : 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                          }`}
                        >
                          Sức khỏe: {systemHealth.scoreLabel} · {systemHealth.statusLabel}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {(
                          [
                            { id: 'curator', label: 'Lõi 1: Biên tập Sử liệu' },
                            { id: 'concierge', label: 'Lõi 2: Chăm sóc Du khách' },
                            { id: 'shield', label: 'Lõi 3: Giám sát An ninh' },
                            { id: 'strategist', label: 'Lõi 4: Phân tích Vận hành' },
                          ] as const
                        ).map((item) => {
                          const c = hydrogenCores[item.id];
                          return (
                            <span
                              key={item.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border ${
                                !c.enabled
                                  ? 'bg-white/[0.02] border-white/[0.06] text-[#86868B]'
                                  : c.status === 'alert'
                                  ? 'bg-[#FF453A]/15 border-[#FF453A]/45 text-[#FF8A80]'
                                  : 'bg-white/[0.04] border-white/[0.08] text-[#E5E5EA]'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  !c.enabled
                                    ? 'bg-[#636366]'
                                    : c.status === 'alert'
                                    ? 'bg-[#FF453A] animate-ping'
                                    : 'bg-emerald-400'
                                }`}
                              />
                              <span>{item.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveModule('ai_copilot')}
                    className="px-4 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Mở Trợ lý AI</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* BIỂU ĐỒ TRÒN TIẾN ĐỘ BẢO TỒN 17 DI TÍCH (RECHARTS PIE CHART) */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#161619] border border-[#C9A46A]/25 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#47796D]/20 border border-[#47796D]/50 flex items-center justify-center shrink-0">
                        <Landmark className="w-4 h-4 text-[#C9A46A]" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-[#D8C9A9]">
                          {appLang === 'en'
                            ? `Conservation Progress by Dossier Status (${conservationStatusStats.total} Sites)`
                            : appLang === 'zh'
                            ? `遗产数字化保护进度分布（${conservationStatusStats.total} 处遗迹）`
                            : `Tiến độ Bảo tồn & Thẩm định Hồ sơ (${conservationStatusStats.total} Di tích)`}
                        </h4>
                        <p className="text-[11px] text-[#D8C9A9]/65">
                          {appLang === 'en'
                            ? 'Real-time distribution across Draft, Expert Review, and Published stages'
                            : appLang === 'zh'
                            ? '实时统计草稿（Draft）、专家审核（Expert Review）与已发布（Published）比例'
                            : 'Biểu đồ tròn thống kê tỷ lệ trạng thái Draft / Expert Review / Published theo thời gian thực'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-sm bg-[#171817] border border-[#47796D]/60 text-[11px] font-semibold text-[#D8C9A9] tabular-nums">
                        {conservationStatusStats.publishedCount}/{conservationStatusStats.total}{' '}
                        {appLang === 'en' ? 'Published' : appLang === 'zh' ? '已发布' : 'Đã xuất bản'} (
                        {conservationStatusStats.publishedPct}%)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                    {/* Recharts Donut / Pie Chart */}
                    <div className="lg:col-span-5 relative h-[230px] w-full min-w-0 flex items-center justify-center rounded-xl bg-[#171817] border border-white/[0.07] p-2">
                      {/* Center KPI inside Donut */}
                      <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold text-[#D8C9A9] tabular-nums leading-none">
                          {conservationStatusStats.publishedPct}%
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#C9A46A] mt-1">
                          {appLang === 'en' ? 'Published' : appLang === 'zh' ? '已发布' : 'Hoàn tất'}
                        </span>
                      </div>

                      <div className="relative z-10 w-full h-[214px]">
                        <ResponsiveContainer width="100%" height={214} minWidth={180}>
                          <PieChart>
                            <Pie
                              data={conservationStatusStats.chartData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={56}
                              outerRadius={84}
                              paddingAngle={3}
                              stroke="#171817"
                              strokeWidth={2}
                              isAnimationActive={false}
                              onClick={(_data, index) => {
                                const entry = conservationStatusStats.chartData[index];
                                if (entry?.cmsFilter) {
                                  setCmsFilter(entry.cmsFilter);
                                  if (entry.sites && entry.sites.length > 0) {
                                    setSelectedSiteId(entry.sites[0].id);
                                  }
                                  setActiveModule('cms');
                                }
                              }}
                              className="cursor-pointer outline-none"
                            >
                              {conservationStatusStats.chartData.map((entry) => (
                                <Cell key={entry.key} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              wrapperStyle={{ zIndex: 50, pointerEvents: 'none' }}
                              formatter={(value: unknown, name: unknown) => {
                                const num = Number(value) || 0;
                                const pct =
                                  conservationStatusStats.total > 0
                                    ? Math.round((num / conservationStatusStats.total) * 100)
                                    : 0;
                                return [
                                  `${num}/${conservationStatusStats.total} (${pct}%)`,
                                  String(name ?? ''),
                                ];
                              }}
                              contentStyle={{
                                backgroundColor: '#171817',
                                border: '1px solid rgba(201, 164, 106, 0.55)',
                                borderRadius: '6px',
                                color: '#D8C9A9',
                                fontSize: '12px',
                                padding: '8px 10px',
                              }}
                              itemStyle={{ color: '#D8C9A9', fontWeight: 600 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 3 Status Breakdown Cards */}
                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                      {conservationStatusStats.items.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setCmsFilter(item.cmsFilter);
                            if (item.sites.length > 0) {
                              setSelectedSiteId(item.sites[0].id);
                            }
                            setActiveModule('cms');
                          }}
                          className="w-full text-left p-3.5 rounded-xl bg-[#171817] hover:bg-black/70 border border-white/[0.08] hover:border-[#C9A46A]/45 transition-colors cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-3 h-3 rounded-sm shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-xs sm:text-sm font-semibold text-[#D8C9A9] truncate">
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2 shrink-0 tabular-nums">
                              <span className="text-base font-bold text-[#F5F5F7]">
                                {item.value}
                              </span>
                              <span className="text-xs font-semibold text-[#C9A46A]">
                                {item.percentage}%
                              </span>
                            </div>
                          </div>

                          <div className="h-1.5 rounded-sm bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${item.value > 0 ? Math.max(4, item.percentage) : 0}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2 text-[11px] text-[#D8C9A9]/65">
                            <span className="truncate">
                              {item.sites.length === 0
                                ? appLang === 'en'
                                  ? 'No monuments in this stage'
                                  : appLang === 'zh'
                                  ? '暂无此阶段遗迹'
                                  : 'Không có di tích ở trạng thái này'
                                : item.sites
                                    .slice(0, 2)
                                    .map((s) => s.officialName)
                                    .join(', ') +
                                  (item.sites.length > 2
                                    ? ` +${item.sites.length - 2}`
                                    : '')}
                            </span>
                            <span className="text-[#C9A46A] font-medium shrink-0 inline-flex items-center gap-0.5">
                              <span>
                                {appLang === 'en' ? 'Open CMS' : appLang === 'zh' ? '查看' : 'Mở CMS'}
                              </span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* THỐNG KÊ LƯỢT THAM QUAN & BIỂU ĐỒ CỘT 17 DI TÍCH */}
                <HeritageVisitStatsPanel sites={sites} onNotify={showToast} />

                {/* DỰ BÁO XU HƯỚNG THAM QUAN TUẦN TỚI (OLS LINEAR REGRESSION) */}
                <HeritageTrendForecastPanel sites={sites} />

                {/* ENGAGEMENT BAR CHART + RECENT CHANGELOG */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                  <div className="xl:col-span-7 p-5 rounded-2xl bg-[#161619] border border-white/[0.08] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                      <h4 className="text-sm font-semibold text-[#F5F5F7]">
                        Xếp hạng Mức độ Quan tâm 17 Di tích (Lượt xem &amp; Khám phá)
                      </h4>
                      <span className="text-[12px] font-medium text-[#C5A059] tabular-nums">17 di tích</span>
                    </div>

                    <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                      {rankingRows.rows.map((row, rankIdx) => {
                        const pct = Math.max(8, Math.round((row.views / rankingRows.maxViews) * 100));
                        return (
                          <div key={row.site.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs gap-2">
                              <span className="truncate text-[#E5E5EA]">
                                <span className="font-semibold tabular-nums text-[#C5A059] mr-1.5">
                                  #{String(rankIdx + 1).padStart(2, '0')}
                                </span>
                                {row.site.officialName}
                              </span>
                              <span className="text-[11px] text-[#A1A1A6] shrink-0 tabular-nums">
                                {row.views} lượt
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background:
                                    rankIdx < 3
                                      ? 'linear-gradient(90deg, #C5A059, #E3C27A)'
                                      : 'linear-gradient(90deg, #0071E3, #38BDF8)',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="xl:col-span-5 p-5 rounded-2xl bg-[#161619] border border-white/[0.08] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                      <h4 className="text-sm font-semibold text-[#F5F5F7]">
                        Nhật ký Chỉnh sửa Admin gần đây
                      </h4>
                      <Clock className="w-4 h-4 text-[#C5A059]" />
                    </div>

                    {auditLogs.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#86868B]">
                        Chưa có thao tác chỉnh sửa nào được ghi nhận trong phiên này. Mọi thay đổi CMS, Phân quyền và Sao lưu sẽ hiển thị tại đây.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                        {auditLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-3 rounded-xl bg-black/40 border border-white/[0.07] space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="font-semibold text-[#C5A059]">{log.action}</span>
                              <span className="tabular-nums text-[#636366]">
                                {new Date(log.timestamp).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <div className="text-xs text-[#E5E5EA]">{log.detail}</div>
                            <div className="text-[11px] text-[#86868B]">
                              Bởi: {log.adminEmail}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* BIỂU ĐỒ PHÂN TÍCH TƯƠNG TÁC CÔNG NGHỆ */}
                {(() => {
                  const tech = analytics.techUsage || {
                    explodedXray: 214,
                    map1815: 168,
                    flycamVideo: 145,
                    audioAi: 274,
                  };
                  const techItems = [
                    {
                      id: 'explodedXray',
                      label: 'Chế độ Bóc tách 3D & X-Ray',
                      sublabel: 'Tách lớp cấu trúc công trình & tia X nội thất',
                      count: tech.explodedXray,
                    },
                    {
                      id: 'map1815',
                      label: 'Thấu kính Bản đồ Lịch sử 1815',
                      sublabel: 'Xuyên không Thành Bát Quái & bản đồ cổ Liên vùng',
                      count: tech.map1815,
                    },
                    {
                      id: 'flycamVideo',
                      label: 'Video Tư liệu Flycam',
                      sublabel: 'Phim tư liệu trên cao & kho Wikimedia Commons',
                      count: tech.flycamVideo,
                    },
                    {
                      id: 'audioAi',
                      label: 'Thuyết minh Audio & Trợ lý AI',
                      sublabel: 'Thuyết minh đa ngữ VI/EN/ZH & Hướng dẫn viên AI',
                      count: tech.audioAi,
                    },
                  ];
                  const totalTech = Math.max(
                    1,
                    techItems.reduce((sum, item) => sum + item.count, 0)
                  );
                  return (
                    <div className="p-5 sm:p-6 rounded-2xl bg-[#161619] border border-white/[0.08] space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/40 flex items-center justify-center shrink-0">
                            <Cpu className="w-4 h-4 text-[#C5A059]" />
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-semibold text-[#F5F5F7]">
                              Mức độ yêu thích các tính năng tương tác
                            </h4>
                            <p className="text-[11px] text-[#86868B]">
                              Biểu đồ phân tích tỷ lệ tương tác thực tế theo 4 công nghệ trải nghiệm cốt lõi
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/35 text-[11px] font-medium text-[#C5A059] tabular-nums">
                          {totalTech.toLocaleString('vi-VN')} lượt kích hoạt
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {techItems.map((item) => {
                          const sharePct = Math.round((item.count / totalTech) * 100);
                          return (
                            <div
                              key={item.id}
                              className="p-4 rounded-xl bg-black/40 border border-white/[0.07] space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-xs sm:text-sm font-semibold text-[#F5F5F7]">
                                    {item.label}
                                  </div>
                                  <div className="text-[11px] text-[#86868B] mt-0.5">
                                    {item.sublabel}
                                  </div>
                                </div>
                                <div className="text-right shrink-0 tabular-nums">
                                  <div className="text-sm font-bold text-[#C5A059]">
                                    {sharePct}%
                                  </div>
                                  <div className="text-[11px] text-[#A1A1A6]">
                                    {item.count.toLocaleString('vi-VN')} lượt
                                  </div>
                                </div>
                              </div>
                              <div className="h-2.5 rounded-full bg-white/[0.07] overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${Math.max(4, sharePct)}%`,
                                    background: 'linear-gradient(90deg, #C5A059, #E3C27A)',
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* NHẬT KÝ THAM QUAN & THIẾT BỊ GẦN ĐÂY */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#161619] border border-white/[0.08] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-[#F5F5F7]">
                          Nhật ký Tham quan &amp; Thiết bị Gần đây
                        </h4>
                        <p className="text-[11px] text-[#86868B]">
                          Ghi nhận thời gian, công trình vừa xem (3D / Hồ sơ Di sản) và thiết bị truy cập theo thời gian thực
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] font-medium text-[#D1D1D6] tabular-nums">
                      {visitHistoryLogs.length} bản ghi gần nhất
                    </span>
                  </div>

                  {visitHistoryLogs.length === 0 ? (
                    <div className="py-10 text-center text-xs text-[#86868B]">
                      Chưa ghi nhận nhật ký truy cập mới từ máy chủ. Khi du khách mở bảo tàng, Không gian 3D hoặc Hồ sơ Di sản trên máy tính/điện thoại, lịch sử sẽ tự động hiển thị tại đây.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                      {visitHistoryLogs.slice(0, 30).map((entry) => {
                        const isPhone = entry.deviceType === 'Điện thoại';
                        return (
                          <div
                            key={entry.id}
                            className="p-3 rounded-xl bg-black/40 border border-white/[0.07] flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                    entry.action === 'open_3d'
                                      ? 'bg-[#C5A059]/15 border-[#C5A059]/35 text-[#E3C27A]'
                                      : entry.action === 'open_dossier'
                                      ? 'bg-[#0071E3]/15 border-[#0071E3]/40 text-[#60A5FA]'
                                      : 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                                  }`}
                                >
                                  {entry.actionLabel}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                                    isPhone
                                      ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                                      : 'bg-sky-500/10 border-sky-400/30 text-sky-300'
                                  }`}
                                >
                                  {isPhone ? (
                                    <Smartphone className="w-3 h-3 shrink-0" />
                                  ) : (
                                    <Monitor className="w-3 h-3 shrink-0" />
                                  )}
                                  <span>{entry.deviceType}</span>
                                </span>
                              </div>
                              <div className="text-xs font-medium text-[#F5F5F7] truncate">
                                {entry.siteName || 'Cổng tham quan Bảo tàng Số'}
                              </div>
                              {entry.visitorLabel && (
                                <div className="text-[10.5px] text-[#86868B] truncate">
                                  Khách: {entry.visitorLabel}
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] text-[#86868B] shrink-0 tabular-nums">
                              {new Date(entry.timestamp).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                              })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {renderSecurityAlertsTable()}
              </div>
            )}

            {/* ===============================================================
                MODULE 2: FULL CMS CONTROL FOR 17 HERITAGE SITES
               =============================================================== */}
            {activeModule === 'cms' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* LEFT COLUMN: 01 -> 17 LIST WITH SEARCH & STATUS FILTER */}
                <div className="xl:col-span-4 rounded-2xl bg-[#161619] border border-white/[0.08] p-4 space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={cmsSearch}
                      onChange={(e) => setCmsSearch(e.target.value)}
                      placeholder="Tìm theo tên di tích, mã hoặc khu vực..."
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-black/50 border border-white/[0.12] text-xs text-[#F5F5F7] placeholder:text-[#636366] focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'all', label: `Tất cả (${sites.length})` },
                        { id: 'approved_published', label: 'Đã xuất bản' },
                        { id: 'expert_review', label: 'Chờ thẩm định' },
                        { id: 'draft', label: 'Bản nháp' },
                        { id: 'hidden', label: `Ẩn (${hiddenCount})` },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setCmsFilter(f.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
                          cmsFilter === f.id
                            ? 'bg-[#C5A059] text-black font-semibold'
                            : 'bg-white/[0.06] text-[#A1A1A6] hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5 max-h-[62vh] overflow-y-auto pr-1">
                    {filteredSites.map((s) => {
                      const orderIdx = sites.findIndex((x) => x.id === s.id) + 1;
                      const orderLabel = String(orderIdx).padStart(2, '0');
                      const isSelected = activeSite?.id === s.id;
                      const isHidden =
                        hiddenSiteIds.includes(s.id) ||
                        Boolean(cmsOverridesSnapshot[s.id]?.isHidden);

                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedSiteId(s.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedSiteId(s.id);
                            }
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-[#C5A059]/15 border-[#C5A059]/60'
                              : 'bg-black/30 border-white/[0.06] hover:border-white/20'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg tabular-nums text-[11px] font-bold flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[#C5A059] text-black'
                                : 'bg-white/[0.07] text-[#C5A059]'
                            }`}
                          >
                            {orderLabel}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-[#F5F5F7] truncate flex items-center gap-1.5">
                              <span className="truncate">{s.officialName}</span>
                              {customGlbMap[s.id] && (
                                <span className="px-1.5 py-0.2 rounded bg-[#C5A059]/20 border border-[#C5A059]/50 text-[#C5A059] text-[9px] font-bold shrink-0">
                                  GLB
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#86868B] mt-0.5">
                              <span className="tabular-nums">{s.id}</span>
                              <span>·</span>
                              <span className="truncate">{s.address.district}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextHidden = !isHidden;
                              setHeritageHidden(s.id, nextHidden, adminActorEmail, s.officialName);
                              if (activeSite?.id === s.id) {
                                setDraftIsHidden(nextHidden);
                              }
                              refreshLiveData();
                              showToast(
                                'ok',
                                nextHidden
                                  ? `Đã chuyển "${s.officialName}" sang trạng thái Ẩn với Du khách (Admin vẫn xem được).`
                                  : `Đã Công khai "${s.officialName}" cho toàn bộ Du khách.`
                              );
                            }}
                            title="Bấm để bật/tắt nhanh trạng thái hiển thị với Du khách"
                            className={`px-2 py-1 rounded-full text-[10px] font-semibold shrink-0 border flex items-center gap-1 cursor-pointer transition-colors ${
                              isHidden
                                ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
                                : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/25'
                            }`}
                          >
                            {isHidden ? (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Ẩn với Du khách</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Công khai</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT COLUMN: COMPREHENSIVE EDITOR FOR ACTIVE SITE */}
                {activeSite && (
                  <div className="xl:col-span-8 rounded-2xl bg-[#161619] border border-white/[0.08] p-5 sm:p-6 space-y-6">
                    {/* EDITOR HEADER + SAVE BUTTON */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                      <div className="min-w-0">
                        <span className="text-[13px] font-medium text-[#C5A059]">
                          Chỉnh sửa trực tiếp hồ sơ · {activeSite.id}
                        </span>
                        <h3 className="text-lg sm:text-xl font-semibold text-[#F5F5F7] truncate mt-0.5">
                          {draftName || activeSite.officialName}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleResetSiteToDefault}
                          className="px-3.5 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium text-[#D1D1D6] flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Khôi phục gốc</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveSiteCms}
                          className="px-5 py-2 rounded-full bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Lưu &amp; Áp dụng toàn trang</span>
                        </button>
                      </div>
                    </div>

                    {/* SECTION A: VISIBILITY & STATUS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/35 border border-white/[0.07]">
                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-medium text-[#A1A1A6]">
                          Trạng thái công bố Di tích (Khách vs Tester/Admin)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDraftIsHidden(false)}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                              !draftIsHidden
                                ? 'bg-[#47796D]/25 border-[#47796D] text-[#D8C9A9]'
                                : 'bg-white/[0.04] border-white/[0.08] text-[#86868B]'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Công khai</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraftIsHidden(true)}
                            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                              draftIsHidden
                                ? 'bg-[#171817] border-[#C9A46A] text-[#C9A46A]'
                                : 'bg-white/[0.04] border-white/[0.08] text-[#86868B]'
                            }`}
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Ẩn với khách (Chỉ Tester thấy)</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-medium text-[#A1A1A6]">
                          Trạng thái Thẩm định Hồ sơ
                        </label>
                        <select
                          value={draftDossierStatus}
                          onChange={(e) =>
                            setDraftDossierStatus(
                              e.target.value as HeritageSite['dossierStatus']
                            )
                          }
                          className="w-full h-9 px-3 rounded-xl bg-black/60 border border-white/[0.14] text-xs text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        >
                          {Object.entries(STATUS_LABELS).map(([k, label]) => (
                            <option key={k} value={k}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2 pt-2 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-[12px] font-medium text-[#D8C9A9]">
                            Hiển thị Mô hình 3D (.glb) tùy chỉnh cho Du khách
                          </div>
                          <div className="text-[11px] text-[#86868B]">
                            Khi ẩn mô hình 3D, du khách chỉ thấy mô hình gốc; Tester Pro &amp; Admin xem trước được mô hình ẩn.
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDraftModelVisibility('published')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                              draftModelVisibility === 'published'
                                ? 'bg-[#47796D]/25 border-[#47796D] text-[#D8C9A9]'
                                : 'bg-white/[0.04] border-white/[0.08] text-[#86868B]'
                            }`}
                          >
                            Công khai 3D
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraftModelVisibility('hidden')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                              draftModelVisibility === 'hidden'
                                ? 'bg-[#171817] border-[#C9A46A] text-[#C9A46A]'
                                : 'bg-white/[0.04] border-white/[0.08] text-[#86868B]'
                            }`}
                          >
                            Ẩn 3D (Chỉ Tester thấy)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SECTION B: TEXT METADATA FIELDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-[12px] font-medium text-[#C5A059]">
                          Tên chính thức của Di tích
                        </label>
                        <input
                          type="text"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl bg-black/50 border border-white/[0.12] text-sm text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-medium text-[#A1A1A6]">
                          Niên đại lịch sử
                        </label>
                        <input
                          type="text"
                          value={draftChronology}
                          onChange={(e) => setDraftChronology(e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl bg-black/50 border border-white/[0.12] text-xs sm:text-sm text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-medium text-[#A1A1A6]">
                          Năm khởi công (Số nguyên — dùng cho Biên niên sử)
                        </label>
                        <input
                          type="number"
                          value={draftCommencementYear}
                          onChange={(e) => setDraftCommencementYear(e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl bg-black/50 border border-white/[0.12] text-xs sm:text-sm text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-medium text-[#A1A1A6]">
                          Địa chỉ chi tiết (Đường / Số nhà)
                        </label>
                        <input
                          type="text"
                          value={draftStreet}
                          onChange={(e) => setDraftStreet(e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl bg-black/50 border border-white/[0.12] text-xs sm:text-sm text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-medium text-[#A1A1A6]">
                          Quận / Huyện / Tỉnh thành
                        </label>
                        <input
                          type="text"
                          value={draftDistrict}
                          onChange={(e) => setDraftDistrict(e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl bg-black/50 border border-white/[0.12] text-xs sm:text-sm text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-[12px] font-medium text-[#A1A1A6]">
                          Phong cách kiến trúc
                        </label>
                        <input
                          type="text"
                          value={draftStyle}
                          onChange={(e) => setDraftStyle(e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl bg-black/50 border border-white/[0.12] text-xs sm:text-sm text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-[12px] font-medium text-[#C5A059]">
                          Mô tả lịch sử &amp; Kiến trúc (Hiển thị trên Trang chủ, 3D &amp; Hồ sơ)
                        </label>
                        <textarea
                          rows={3}
                          value={draftSummary}
                          onChange={(e) => setDraftSummary(e.target.value)}
                          className="w-full p-3.5 rounded-xl bg-black/50 border border-white/[0.12] text-xs sm:text-sm text-[#F5F5F7] leading-relaxed focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-[12px] font-medium text-[#A1A1A6]">
                          Ghi chú bảo tồn &amp; Phê duyệt
                        </label>
                        <textarea
                          rows={2}
                          value={draftConservationNotes}
                          onChange={(e) => setDraftConservationNotes(e.target.value)}
                          className="w-full p-3 rounded-xl bg-black/50 border border-white/[0.12] text-xs text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* SECTION C: DUAL REAL PHOTO MANAGER (HÌNH ẢNH 01 & HÌNH ẢNH 02) + HISTORICAL XƯA & NAY */}
                    <div className="space-y-4 pt-2 border-t border-white/[0.08]">
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#171817] border border-[#C9A46A]/35">
                        <div className="min-w-0 space-y-0.5">
                          <div className="text-xs font-semibold text-[#D8C9A9] flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-[#C9A46A]" />
                            <span>Hệ thống 2 Ảnh Thực Tế HD (1600px · Chuẩn 16:9)</span>
                          </div>
                          <p className="text-[11px] text-[#D8C9A9]/70">
                            Ảnh 01: Toàn cảnh mặt tiền · Ảnh 02: Không gian nội thất / Cận cảnh kiến trúc. Các link Admin tùy chỉnh được giữ nguyên khi tải lại.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleReloadAllWikimediaPhotos()}
                          disabled={isSyncingWikiPhotos}
                          className="px-3.5 py-2 rounded-full bg-[#C9A46A] hover:bg-[#D8C9A9] disabled:opacity-60 text-[#171817] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-sm"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${isSyncingWikiPhotos ? 'animate-spin' : ''}`}
                          />
                          <span>
                            {isSyncingWikiPhotos
                              ? 'Đang tải bộ ảnh HD...'
                              : 'Tải lại bộ ảnh HD từ Wikimedia'}
                          </span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {([0, 1] as const).map((slotIdx) => {
                          const slotDraftUrl = slotIdx === 0 ? draftPhoto1Url : draftPhoto2Url;
                          const setSlotDraftUrl =
                            slotIdx === 0 ? setDraftPhoto1Url : setDraftPhoto2Url;
                          const slotFileRef =
                            slotIdx === 0 ? photo1FileInputRef : photo2FileInputRef;
                          const slotInfo = resolveSitePhotoSlots(
                            activeSite.id,
                            effectiveCustomPhotosMap,
                            wikimediaCacheMap
                          );
                          const wikiDefaultUrl = slotInfo.wikiUrls[slotIdx] || '';
                          const trimmedDraft = slotDraftUrl.trim();
                          const previewUrl = trimmedDraft || wikiDefaultUrl;
                          const isCustomActive = Boolean(
                            trimmedDraft || slotInfo.customUrls[slotIdx]
                          );

                          return (
                            <div
                              key={slotIdx}
                              className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-[#F5F5F7] flex items-center gap-1.5">
                                  <ImageIcon className="w-3.5 h-3.5 text-[#C9A46A]" />
                                  <span>Hình ảnh 0{slotIdx + 1}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                      isCustomActive
                                        ? 'bg-[#A94F3D]/25 text-[#F5B0A3] border border-[#A94F3D]/40'
                                        : wikiDefaultUrl
                                        ? 'bg-[#47796D]/25 text-[#9BE0CD] border border-[#47796D]/40'
                                        : 'bg-white/10 text-[#86868B]'
                                    }`}
                                  >
                                    {isCustomActive
                                      ? 'Link Admin tùy chỉnh'
                                      : wikiDefaultUrl
                                      ? 'Wikimedia Commons (Gốc)'
                                      : 'Đang tải Wikimedia...'}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void handleResetSlotToWikimedia(slotIdx)}
                                  className="text-[11px] text-[#C9A46A] hover:text-white flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Đặt lại về ảnh gốc Wikimedia</span>
                                </button>
                              </div>

                              <div className="aspect-video rounded-xl overflow-hidden bg-[#171817] border border-white/10">
                                {previewUrl ? (
                                  <HeritageSmoothImage
                                    src={previewUrl}
                                    alt={`${activeSite.officialName} - Hình ảnh 0${slotIdx + 1}`}
                                    waitTone="dark"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <HeritageTypographicPlate site={activeSite} variant="catalog" />
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={slotDraftUrl}
                                  onChange={(e) => setSlotDraftUrl(e.target.value)}
                                  placeholder={
                                    wikiDefaultUrl
                                      ? 'Dán URL ảnh từ Wikimedia / Flickr / Drive / Báo chí...'
                                      : 'Dán URL ảnh thực tế (https://... .jpg/.png)'
                                  }
                                  className="flex-1 h-9 px-3 rounded-lg bg-black/60 border border-white/[0.12] text-[11px] text-[#F5F5F7] focus:border-[#C9A46A] focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleApplySlotPhotoUrl(slotIdx)}
                                  className="h-9 px-3 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white text-[11px] font-semibold cursor-pointer shrink-0"
                                >
                                  Lưu &amp; Đồng bộ
                                </button>
                              </div>

                              <input
                                ref={slotFileRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => void handleUploadLocalSlotPhoto(slotIdx, e)}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => slotFileRef.current?.click()}
                                className="w-full py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] text-xs font-medium text-[#F5F5F7] flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5 text-[#C9A46A]" />
                                <span>Tải Hình ảnh 0{slotIdx + 1} từ máy tính</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Historical Photo (Xưa & Nay) */}
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#F5F5F7] flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>Ảnh tư liệu Xưa (Xưa &amp; Nay)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              removeCustomHistoricalPhotoForSite(activeSite.id);
                              setDraftHistoricalPhotoUrl(
                                getHistoricalArchiveForSite(activeSite.id)?.url || ''
                              );
                              refreshLiveData();
                            }}
                            className="text-[11px] text-[#86868B] hover:text-white cursor-pointer"
                          >
                            Dùng ảnh xưa gốc
                          </button>
                        </div>

                        <div className="aspect-video rounded-xl overflow-hidden bg-[#171817] border border-white/10">
                          {draftHistoricalPhotoUrl ? (
                            <HeritageSmoothImage
                              src={draftHistoricalPhotoUrl}
                              alt="Ảnh tư liệu xưa"
                              waitTone="dark"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[11px] text-[#636366] px-4 text-center">
                              Đang dùng chế độ phục chế phim Sepia tự động
                            </div>
                          )}
                        </div>

                        <input
                          type="text"
                          value={draftHistoricalPhotoUrl}
                          onChange={(e) => setDraftHistoricalPhotoUrl(e.target.value)}
                          placeholder="Dán URL ảnh tư liệu xưa (https://...)"
                          className="w-full h-9 px-3 rounded-lg bg-black/60 border border-white/[0.12] text-[11px] text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        />

                        <input
                          ref={historicalFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleUploadLocalHistoricalPhoto}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => historicalFileInputRef.current?.click()}
                          className="w-full py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] text-xs font-medium text-[#F5F5F7] flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Tải ảnh tư liệu xưa từ máy</span>
                        </button>
                      </div>
                    </div>

                    {/* SECTION D: MÔ HÌNH 3D (.GLB), YOUTUBE FLYCAM VIDEO & AUDIO NARRATION EDITOR */}
                    <div className="space-y-4 pt-2 border-t border-white/[0.08]">
                      {/* 3D .GLB Model (Direct public/ Storage + GitHub/Cloud Link) */}
                      <div
                        ref={glbSectionRef}
                        className="p-4 rounded-2xl bg-black/40 border border-[#C5A059]/30 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#F5F5F7] flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>
                              Mô hình 3D (.glb) — Lưu trực tiếp public/ &amp; Link GitHub/Cloud
                              {activeSite.id === 'BRVT-DT-001' ? ' (Bạch Dinh / Dinh Bảo Đại)' : ''}
                            </span>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              activeSiteGlb.kind === 'public_asset'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                                : activeSiteGlb.kind === 'remote_url'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                                : activeSiteGlb.kind === 'indexed_db'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                                : 'bg-white/10 text-[#A1A1A6] border-white/10'
                            }`}
                          >
                            {activeSiteGlb.kind === 'public_asset'
                              ? `Đã gắn trong mã nguồn: ${activeSiteGlb.fileName}`
                              : activeSiteGlb.kind === 'remote_url'
                              ? `Cloud .GLB: ${activeSiteGlb.fileName}`
                              : activeSiteGlb.kind === 'indexed_db'
                              ? `IndexedDB .GLB: ${activeSiteGlb.fileName}`
                              : activeSiteGlb.expectedPublicPath
                              ? `Chờ tệp public${activeSiteGlb.expectedPublicPath}`
                              : 'Chưa có tệp .GLB (Đang chờ số hóa)'}
                          </span>
                        </div>

                        {activeSiteGlb.url && (
                          <div className="relative aspect-[16/9] max-h-56 w-full rounded-xl overflow-hidden bg-[#171817] border border-white/15">
                            <GlbMiniStage
                              glbUrl={activeSiteGlb.url}
                              lang={appLang}
                              className="w-full h-full"
                            />
                            <div className="pointer-events-none absolute bottom-2 left-2.5 px-2.5 py-0.5 rounded-sm bg-[#171817] border border-[#C5A059]/50 text-[10px] text-[#D8C9A9]">
                              Kéo để xoay · Cuộn để thu phóng trực tiếp tệp .glb
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Upload .glb from computer -> public/ */}
                          <div className="p-3 rounded-xl bg-black/50 border border-white/[0.08] space-y-2">
                            <div className="text-[11px] font-medium text-[#D1D1D6]">
                              1. Chọn tệp .glb từ máy tính (Lưu thẳng vào thư mục public/)
                            </div>
                            <input
                              ref={glbFileInputRef}
                              type="file"
                              accept=".glb,.gltf,model/gltf-binary"
                              onChange={(e) => void handleUploadLocalGlbFile(e)}
                              className="hidden"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => glbFileInputRef.current?.click()}
                                className="flex-1 py-2 px-3 rounded-xl bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Chọn &amp; lưu .glb vào public/</span>
                              </button>
                            </div>
                            {activeSiteGlb.publicAssetUrl && (
                              <div className="text-[10.5px] text-emerald-300/90 flex items-center justify-between gap-2">
                                <span className="truncate">
                                  Đường dẫn nguồn: {activeSiteGlb.publicAssetUrl}
                                </span>
                                {activeSiteGlb.kind !== 'public_asset' && (
                                  <button
                                    type="button"
                                    onClick={() => switchSiteGlbSourceMode(activeSite.id, 'public_asset')}
                                    className="text-[#C5A059] hover:underline shrink-0 cursor-pointer"
                                  >
                                    Dùng file này
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Paste GitHub/Cloud .glb URL */}
                          <div className="p-3 rounded-xl bg-black/50 border border-white/[0.08] space-y-2">
                            <div className="text-[11px] font-medium text-[#D1D1D6] flex items-center gap-1.5">
                              <Link2 className="w-3.5 h-3.5 text-[#C5A059]" />
                              <span>2. Hoặc dán link .glb từ GitHub / Cloud / public/</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="url"
                                value={draftGlbUrl}
                                onChange={(e) => setDraftGlbUrl(e.target.value)}
                                placeholder="https://raw.githubusercontent.com/.../model.glb"
                                className="flex-1 h-9 px-3 rounded-lg bg-black/60 border border-white/[0.12] text-[11px] text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleSaveAdminGlbUrl}
                                className="h-9 px-3 rounded-lg bg-[#47796D] hover:bg-[#3B665B] text-white text-[11px] font-semibold cursor-pointer shrink-0"
                              >
                                Lưu link
                              </button>
                            </div>
                            {activeSiteGlb.remoteUrl && activeSiteGlb.kind !== 'remote_url' && (
                              <div className="text-[10.5px] text-sky-300/90 flex items-center justify-between gap-2">
                                <span className="truncate">Đang có đường dẫn tùy chỉnh</span>
                                <button
                                  type="button"
                                  onClick={() => switchSiteGlbSourceMode(activeSite.id, 'remote_url')}
                                  className="text-[#C5A059] hover:underline shrink-0 cursor-pointer"
                                >
                                  Dùng đường dẫn này
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {activeSiteGlb.remoteUrl && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => void handleClearAdminCustomGlb()}
                              className="text-[11px] text-red-300 hover:text-red-200 flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Xóa ghi đè đường dẫn .glb (Về nguồn src/data/)</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* YouTube Video ID */}
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#F5F5F7] flex items-center gap-1.5">
                            <Film className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>YouTube Video ID / Link Flycam Tư Liệu</span>
                          </span>
                          {onOpenVideoModal && (
                            <button
                              type="button"
                              onClick={() => onOpenVideoModal(activeSite)}
                              className="text-[11px] text-[#2997FF] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>Xem thử Video Tư Liệu</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={draftYoutubeInput}
                          onChange={(e) => setDraftYoutubeInput(e.target.value)}
                          placeholder="Nhập YouTube Video ID (VD: 11 ký tự) hoặc link youtube.com/watch?v=..."
                          className="w-full h-10 px-3.5 rounded-xl bg-black/60 border border-white/[0.12] text-xs text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>

                      {/* Audio Narration Script + Custom MP3/WAV */}
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#F5F5F7] flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>Kịch bản Thuyết minh &amp; Giọng đọc tùy chỉnh</span>
                          </span>

                          <div className="flex items-center gap-2">
                            <div className="inline-flex p-0.5 rounded-full bg-black/60 border border-white/[0.1]">
                              {(['vi', 'en', 'zh'] as Language[]).map((l) => (
                                <button
                                  key={l}
                                  type="button"
                                  onClick={() => setAudioEditLang(l)}
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium cursor-pointer ${
                                    audioEditLang === l
                                      ? 'bg-[#C5A059] text-black font-bold'
                                      : 'text-[#86868B] hover:text-white'
                                  }`}
                                >
                                  {l.toUpperCase()}
                                </button>
                              ))}
                            </div>
                            {onOpenAudioStudio && (
                              <button
                                type="button"
                                onClick={() => onOpenAudioStudio(activeSite)}
                                className="text-[11px] text-[#2997FF] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>Mở trình phát</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[12px] font-medium text-[#A1A1A6]">
                            Tiêu đề hồ sơ Audio ({audioEditLang.toUpperCase()})
                          </label>
                          <input
                            type="text"
                            value={draftAudioFolioTitle}
                            onChange={(e) => setDraftAudioFolioTitle(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg bg-black/60 border border-white/[0.12] text-xs text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                          {draftAudioChapters.map((ch, idx) => {
                            const isChHidden = draftHiddenChapterIds.includes(ch.id);
                            return (
                            <div
                              key={ch.id}
                              className="p-3 rounded-xl bg-black/50 border border-white/[0.08] space-y-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[11px] text-[#C5A059] shrink-0">
                                  {ch.roman}
                                </span>
                                <input
                                  type="text"
                                  value={ch.title}
                                  onChange={(e) => {
                                    const next = [...draftAudioChapters];
                                    next[idx] = { ...ch, title: e.target.value };
                                    setDraftAudioChapters(next);
                                  }}
                                  className="flex-1 h-8 px-2.5 rounded-lg bg-black/50 border border-white/[0.1] text-xs text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraftHiddenChapterIds((prev) =>
                                      prev.includes(ch.id)
                                        ? prev.filter((id) => id !== ch.id)
                                        : [...prev, ch.id]
                                    )
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border shrink-0 cursor-pointer transition-colors ${
                                    isChHidden
                                      ? 'bg-[#171817] border-[#C9A46A] text-[#C9A46A]'
                                      : 'bg-white/[0.04] border-white/[0.1] text-[#A1A1A6] hover:text-white'
                                  }`}
                                >
                                  {isChHidden ? 'Đang ẩn · Chỉ Tester thấy' : 'Công khai chương'}
                                </button>
                              </div>
                              <textarea
                                rows={2}
                                value={ch.narration}
                                onChange={(e) => {
                                  const next = [...draftAudioChapters];
                                  next[idx] = { ...ch, narration: e.target.value };
                                  setDraftAudioChapters(next);
                                }}
                                className="w-full p-2.5 rounded-lg bg-black/50 border border-white/[0.1] text-xs text-[#D1D1D6] leading-relaxed focus:border-[#C5A059] focus:outline-none"
                              />
                            </div>
                          );
                          })}
                        </div>

                        {/* Upload Custom MP3/WAV Audio Recording */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
                          <div className="text-xs text-[#A1A1A6]">
                            {getCustomAudioForSite(activeSite.id) ? (
                              <span className="text-[#8FC6B8] font-medium">
                                {getCustomAudioForSite(activeSite.id)?.sourceTier === 'static_source'
                                  ? `Đã gắn trong mã nguồn: ${getCustomAudioForSite(activeSite.id)?.fileName}`
                                  : `Bản thu âm thuyết minh viên: ${getCustomAudioForSite(activeSite.id)?.fileName}`}
                              </span>
                            ) : (
                              <span>Giọng đọc mặc định: AI TTS đa ngữ ({audioEditLang.toUpperCase()})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              ref={customAudioFileInputRef}
                              type="file"
                              accept="audio/*"
                              onChange={handleUploadCustomAudioFile}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => customAudioFileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-xs text-[#F5F5F7] flex items-center gap-1.5 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                              <span>Tải lên MP3/WAV</span>
                            </button>
                            {getCustomAudioForSite(activeSite.id) && (
                              <button
                                type="button"
                                onClick={() => removeCustomAudio(activeSite.id)}
                                className="px-3 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-xs text-rose-300 cursor-pointer"
                              >
                                Gỡ tệp âm thanh
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===============================================================
                MODULE 2B: VISITOR EXPERIENCE REVIEWS & ADMIN FEEDBACK
               =============================================================== */}
            {activeModule === 'reviews' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[13px] font-medium text-[#C5A059]">
                      Trung tâm đánh giá &amp; phản hồi du khách
                    </span>
                    <h3 className="text-xl sm:text-2xl font-semibold text-[#F5F5F7] mt-0.5">
                      Đánh giá Trải nghiệm Du khách &amp; Phản hồi Ban Quản lý
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={refreshLiveData}
                    className="px-3.5 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Làm mới đánh giá</span>
                  </button>
                </div>

                {/* BẢNG TỔNG HỢP CHỈ SỐ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Overall Score */}
                  <div className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-[#211C13] via-[#161619] to-[#131316] border border-[#C5A059]/45 p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[12px] font-medium text-[#C5A059]">
                        Điểm sao trung bình
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-semibold text-[#F5F5F7] tabular-nums">
                          {reviewStats.total > 0 ? reviewStats.averageRating.toFixed(1) : '0.0'}
                        </span>
                        <span className="text-lg text-[#C5A059] font-semibold tabular-nums">/ 5.0 ★</span>
                      </div>
                      <div className="flex items-center gap-1 pt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= Math.round(reviewStats.averageRating)
                                ? 'text-[#C5A059] fill-[#C5A059]'
                                : 'text-white/20'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.08] text-xs">
                      <div>
                        <span className="block text-[11px] text-[#86868B]">Tổng lượt</span>
                        <strong className="text-base text-[#F5F5F7] tabular-nums">
                          {reviewStats.total}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#86868B]">Chờ phản hồi</span>
                        <strong className="text-base text-amber-300 tabular-nums">
                          {reviewStats.unrespondedCount}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#86868B]">Đã ghim</span>
                        <strong className="text-base text-[#C5A059] tabular-nums">
                          {reviewStats.pinnedCount}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* 5 -> 1 Star Distribution Chart */}
                  <div className="lg:col-span-4 rounded-2xl bg-[#161619] border border-white/[0.08] p-5 space-y-3">
                    <div className="text-xs font-semibold text-[#F5F5F7] border-b border-white/[0.08] pb-2.5">
                      Phân bổ Tỷ lệ từ 5★ xuống 1★
                    </div>
                    <div className="space-y-2.5">
                      {([5, 4, 3, 2, 1] as const).map((star) => {
                        const count = reviewStats.distribution[star];
                        const pct =
                          reviewStats.total > 0
                            ? Math.round((count / reviewStats.total) * 100)
                            : 0;
                        return (
                          <div key={star} className="flex items-center gap-2.5 text-xs">
                            <span className="w-8 font-medium tabular-nums text-[#C5A059] shrink-0">
                              {star}★
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#C5A059] to-[#E8CA68] transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-16 text-right text-[11px] text-[#A1A1A6] tabular-nums shrink-0">
                              {count} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Most Praised Feature Tags */}
                  <div className="lg:col-span-4 rounded-2xl bg-[#161619] border border-white/[0.08] p-5 space-y-3">
                    <div className="text-xs font-semibold text-[#F5F5F7] border-b border-white/[0.08] pb-2.5">
                      Tính năng được khen nhiều nhất
                    </div>
                    <div className="space-y-2.5">
                      {reviewStats.topTags.map((item) => {
                        const maxTagCount = Math.max(1, reviewStats.topTags[0]?.count || 1);
                        const pct =
                          item.count > 0 ? Math.max(10, Math.round((item.count / maxTagCount) * 100)) : 0;
                        return (
                          <div key={item.tag} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] gap-2">
                              <span className="text-[#E5E5EA] truncate">{item.tag}</span>
                              <span className="font-medium text-[#C5A059] tabular-nums shrink-0">
                                {item.count} lượt
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#0071E3] transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* BỘ LỌC NHANH */}
                <div className="rounded-2xl bg-[#161619] border border-white/[0.08] p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] font-medium text-[#86868B] mr-1">
                      Số sao:
                    </span>
                    {(
                      [
                        { id: 'all', label: 'Tất cả' },
                        { id: '5', label: '5★' },
                        { id: '4', label: '4★' },
                        { id: 'le3', label: 'Từ 3★ trở xuống' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setReviewStarFilter(f.id)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
                          reviewStarFilter === f.id
                            ? 'bg-[#C5A059] text-black font-semibold'
                            : 'bg-white/[0.06] text-[#A1A1A6] hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] font-medium text-[#86868B] mr-1">
                      Trạng thái:
                    </span>
                    {(
                      [
                        { id: 'all', label: 'Tất cả' },
                        { id: 'unresponded', label: 'Chưa phản hồi' },
                        { id: 'responded', label: 'Đã phản hồi' },
                      ] as const
                    ).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setReviewStatusFilter(s.id)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
                          reviewStatusFilter === s.id
                            ? 'bg-[#0071E3] text-white font-semibold'
                            : 'bg-white/[0.06] text-[#A1A1A6] hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DANH SÁCH THẺ ĐÁNH GIÁ TRỰC QUAN */}
                {filteredReviews.length === 0 ? (
                  <div className="rounded-2xl bg-[#161619] border border-white/[0.08] py-12 px-6 text-center space-y-2">
                    <MessageSquareHeart className="w-8 h-8 text-[#C5A059]/60 mx-auto" />
                    <div className="text-sm font-medium text-[#F5F5F7]">
                      Chưa có đánh giá nào khớp bộ lọc hiện tại
                    </div>
                    <p className="text-xs text-[#86868B] max-w-md mx-auto">
                      Khi du khách gửi đánh giá trải nghiệm từ nút “Đánh giá trải nghiệm” hoặc mục Vé &amp; Học liệu, thẻ phản hồi sẽ đồng bộ tức thì về đây.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredReviews.map((rev) => {
                      const isReplying = replyingReviewId === rev.id;
                      const hasReply = Boolean(rev.adminReply && rev.adminReply.trim());
                      return (
                        <article
                          key={rev.id}
                          className={`rounded-2xl p-5 border transition-all space-y-3.5 ${
                            rev.isPinned
                              ? 'bg-gradient-to-br from-[#211C12] via-[#161619] to-[#131316] border-[#C5A059]/60 shadow-lg'
                              : 'bg-[#161619] border-white/[0.08]'
                          }`}
                        >
                          {/* Top Metadata Row */}
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-[#F5F5F7]">
                                  {rev.userName || rev.visitorName}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    rev.provider === 'google'
                                      ? 'bg-white/10 text-white'
                                      : 'bg-[#1877F2]/25 text-[#60A5FA]'
                                  }`}
                                >
                                  {rev.provider === 'google'
                                    ? 'Google'
                                    : rev.provider === 'facebook'
                                    ? 'Facebook'
                                    : 'Tài khoản'}
                                </span>
                                {rev.visitorRoleLabel && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#47796D]/25 border border-[#47796D]/50 text-[10px] font-medium text-[#D8C9A9]">
                                    {rev.visitorRoleLabel}
                                  </span>
                                )}
                                {rev.isPinned && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/50 text-[10px] font-semibold text-[#C5A059] inline-flex items-center gap-1">
                                    <Pin className="w-3 h-3" />
                                    <span>Đánh giá tiêu biểu</span>
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    hasReply
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}
                                >
                                  {hasReply ? 'Đã phản hồi' : 'Chưa phản hồi'}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] tabular-nums text-[#86868B]">
                                <span className="text-[#D8C9A9]/80">
                                  {rev.userEmail || rev.contactDisplay}
                                </span>
                                {(rev.uid || (rev.userId && !rev.userId.startsWith('guest_'))) && (
                                  <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-[#C9A46A]">
                                    UID: {rev.uid || rev.userId}
                                  </span>
                                )}
                                <span>· {new Date(rev.createdAt).toLocaleString('vi-VN')}</span>
                              </div>
                            </div>

                            {/* Star Score */}
                            <div className="flex items-center gap-1 bg-black/45 px-3 py-1.5 rounded-full border border-white/[0.08] shrink-0">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    s <= rev.rating
                                      ? 'text-[#C5A059] fill-[#C5A059]'
                                      : 'text-white/15'
                                  }`}
                                />
                              ))}
                              <span className="ml-1.5 tabular-nums text-xs font-bold text-[#C5A059]">
                                {rev.rating}.0
                              </span>
                            </div>
                          </div>

                          {/* Favorite Site + Tags */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[#E5E5EA]">
                              <Landmark className="w-3.5 h-3.5 text-[#C5A059]" />
                              <span>Yêu thích: <strong>{rev.favoriteSiteName}</strong></span>
                            </span>
                            {(rev.tags || []).map((tag) => (
                              <span
                                key={tag}
                                className="px-2.5 py-1 rounded-full bg-[#C5A059]/12 border border-[#C5A059]/35 text-[11px] text-[#E8CA68]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Comment Body */}
                          <p className="text-xs sm:text-sm text-[#F5F5F7]/90 leading-relaxed p-3.5 rounded-xl bg-black/35 border border-white/[0.06]">
                            {rev.comment}
                          </p>

                          {/* Existing Admin Reply */}
                          {hasReply && (
                            <div className="p-3.5 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/35 space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-[#C5A059]">
                                <span>Phản hồi từ Ban Quản lý ({rev.adminRepliedBy || adminActorEmail})</span>
                                {rev.adminRepliedAt && (
                                  <span className="text-[#A1A1A6] tabular-nums">
                                    {new Date(rev.adminRepliedAt).toLocaleString('vi-VN')}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#F5EFE6] leading-relaxed">
                                {rev.adminReply}
                              </div>
                            </div>
                          )}

                          {/* Inline Reply Composer */}
                          {isReplying && (
                            <div className="p-3.5 rounded-xl bg-black/50 border border-[#C5A059]/45 space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-[12px] font-medium text-[#C5A059]">
                                  Soạn lời cảm ơn / phản hồi tới {rev.visitorName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReplyDraftText(
                                      `Trân trọng cảm ơn ${rev.visitorName} đã tham quan Bảo tàng Số Dấu Ấn Việt 3D và chia sẻ nhận xét quý báu! Hẹn gặp lại bạn trên các tuyến di sản tiếp theo.`
                                    )
                                  }
                                  className="text-[11px] text-[#C5A059] hover:underline cursor-pointer"
                                >
                                  Chèn mẫu lời cảm ơn nhanh
                                </button>
                              </div>
                              <textarea
                                rows={2}
                                value={replyDraftText}
                                onChange={(e) => setReplyDraftText(e.target.value)}
                                placeholder="Nhập nội dung phản hồi gửi tới du khách..."
                                className="w-full p-2.5 rounded-xl bg-[#111114] border border-white/[0.12] text-xs text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none resize-none"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingReviewId(null);
                                    setReplyDraftText('');
                                  }}
                                  className="px-3 py-1.5 rounded-full bg-white/[0.07] text-xs text-[#A1A1A6] hover:text-white cursor-pointer"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!replyDraftText.trim()) return;
                                    replyToVisitorReview(rev.id, replyDraftText, adminActorEmail);
                                    refreshLiveData();
                                    setReplyingReviewId(null);
                                    setReplyDraftText('');
                                    showToast('ok', `Đã gửi lời cảm ơn tới ${rev.visitorName}`);
                                  }}
                                  className="px-4 py-1.5 rounded-full bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Gửi phản hồi</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Admin Action Buttons */}
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (isReplying) {
                                  setReplyingReviewId(null);
                                } else {
                                  setReplyingReviewId(rev.id);
                                  setReplyDraftText(
                                    rev.adminReply ||
                                      `Trân trọng cảm ơn ${rev.visitorName} đã tham quan Bảo tàng Số Dấu Ấn Việt 3D và đóng góp ý kiến quý báu!`
                                  );
                                }
                              }}
                              className="px-3.5 py-1.5 rounded-full bg-[#0071E3]/20 hover:bg-[#0071E3]/35 border border-[#0071E3]/45 text-xs font-medium text-sky-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{hasReply ? 'Sửa phản hồi' : 'Gửi lời cảm ơn / Phản hồi'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                togglePinVisitorReview(rev.id, adminActorEmail);
                                refreshLiveData();
                                showToast(
                                  'ok',
                                  rev.isPinned
                                    ? `Đã bỏ ghim đánh giá của ${rev.visitorName}`
                                    : `Đã ghim đánh giá tiêu biểu của ${rev.visitorName}`
                                );
                              }}
                              className={`px-3.5 py-1.5 rounded-full border text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                                rev.isPinned
                                  ? 'bg-[#C5A059] text-black border-[#C5A059] font-semibold'
                                  : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.12] text-[#F5F5F7]'
                              }`}
                            >
                              <Pin className="w-3.5 h-3.5" />
                              <span>{rev.isPinned ? 'Bỏ ghim tiêu biểu' : 'Ghim đánh giá tiêu biểu'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                deleteVisitorReview(rev.id, adminActorEmail);
                                refreshLiveData();
                                showToast('ok', `Đã xóa đánh giá của ${rev.visitorName}`);
                              }}
                              className="px-3.5 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/35 text-xs font-medium text-rose-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa đánh giá</span>
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ===============================================================
                MODULE 2C: VISITOR SUPPORT & HELPDESK TICKETS MANAGEMENT
               =============================================================== */}
            {activeModule === 'support' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <span className="text-[13px] font-medium text-[#C5A059]">
                      Hỗ trợ du khách · Đồng bộ hội thoại &amp; Email {PRIMARY_ADMIN_EMAIL}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-semibold text-[#F5F5F7] mt-0.5">
                      Hỗ trợ Khách hàng &amp; Hội thoại Trợ lý AI
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await autoReplyAllPendingSupportTickets(sites, adminActorEmail);
                        refreshLiveData();
                        showToast(
                          'ok',
                          res.processedCount > 0
                            ? `Lõi 2 đã tự động trả lời ${res.processedCount} phiếu đang chờ.`
                            : 'Tất cả phiếu đang chờ hiện tại đều đã có phản hồi hoặc đang chờ Quản trị viên xử lý ưu tiên.'
                        );
                      }}
                      className="px-4 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D4B06A] text-black font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Tự động trả lời phiếu đang chờ</span>
                    </button>

                    <span className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-[#D1D1D6] tabular-nums">
                      Tổng phiếu: <strong className="text-white">{supportTickets.length}</strong>
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-300 tabular-nums">
                      Chờ hỗ trợ: <strong>{pendingSupportCount}</strong>
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-[#526D8B]/25 border border-[#526D8B]/60 text-[#D8C9A9] tabular-nums">
                      Đang xử lý: <strong>{inProgressSupportCount}</strong>
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 tabular-nums">
                      Đã giải quyết: <strong>{resolvedSupportCount}</strong>
                    </span>
                  </div>
                </div>

                {/* BỘ LỌC TRẠNG THÁI & NHÓM VẤN ĐỀ */}
                <div className="rounded-2xl bg-[#161619] border border-white/[0.08] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] font-medium text-[#86868B] mr-1">
                      Trạng thái:
                    </span>
                    {(
                      [
                        { id: 'all', label: `Tất cả (${supportTickets.length})` },
                        { id: 'pending', label: `Chờ hỗ trợ (${pendingSupportCount})` },
                        { id: 'in_progress', label: `Đang xử lý (${inProgressSupportCount})` },
                        { id: 'resolved', label: `Đã giải quyết (${resolvedSupportCount})` },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSupportStatusFilter(st.id)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
                          supportStatusFilter === st.id
                            ? 'bg-[#C5A059] text-black font-semibold'
                            : 'bg-white/[0.06] text-[#A1A1A6] hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] font-medium text-[#86868B] mr-1">
                      Nhóm vấn đề:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSupportCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
                        supportCategoryFilter === 'all'
                          ? 'bg-[#0071E3] text-white font-semibold'
                          : 'bg-white/[0.06] text-[#A1A1A6] hover:text-white'
                      }`}
                    >
                      Tất cả nhóm
                    </button>
                    {SUPPORT_TICKET_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSupportCategoryFilter(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
                          supportCategoryFilter === cat.id
                            ? 'bg-[#0071E3] text-white font-semibold'
                            : 'bg-white/[0.06] text-[#A1A1A6] hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DANH SÁCH PHIẾU HỖ TRỢ */}
                {filteredSupportTickets.length === 0 ? (
                  <div className="rounded-2xl bg-[#161619] border border-white/[0.08] py-12 px-6 text-center space-y-2">
                    <Inbox className="w-8 h-8 text-[#C5A059]/60 mx-auto" />
                    <div className="text-sm font-medium text-[#F5F5F7]">
                      Chưa có yêu cầu hỗ trợ nào khớp bộ lọc hiện tại
                    </div>
                    <p className="text-xs text-[#86868B] max-w-md mx-auto">
                      Khi du khách gửi yêu cầu hoặc báo lỗi từ nút (?) Hỗ trợ trên Header, phiếu sẽ đồng bộ tức thì vào hàng đợi này.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSupportTickets.map((ticket) => {
                      const isResolved = ticket.status === 'resolved';
                      const isInProgress = ticket.status === 'in_progress';
                      const messages = getTicketConversationMessages(ticket);
                      const draftValue = supportReplyDrafts[ticket.id] ?? '';
                      return (
                        <article
                          key={ticket.id}
                          className={`rounded-2xl p-5 border space-y-4 transition-colors ${
                            ticket.escalatedToAdmin
                              ? 'bg-[#221215] border-[#A94F3D]'
                              : ticket.supportTier === 'vip_fast_track'
                              ? 'bg-[#1F1A11] border-[#C9A46A]'
                              : isResolved
                              ? 'bg-[#161619] border-white/[0.08]'
                              : isInProgress
                              ? 'bg-[#151A20] border-[#526D8B]/60'
                              : 'bg-[#1A1814] border-[#C9A46A]/45'
                          }`}
                        >
                          {/* Top Metadata */}
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-[#C5A059] text-black tabular-nums text-[11px] font-bold">
                                  {ticket.ticketCode}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 ${
                                    isResolved
                                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                                      : isInProgress
                                      ? 'bg-[#526D8B]/25 border border-[#526D8B]/60 text-[#D8C9A9]'
                                      : 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                                  }`}
                                >
                                  {isResolved ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : (
                                    <Clock className="w-3 h-3" />
                                  )}
                                  <span>
                                    {isResolved
                                      ? 'Đã giải quyết'
                                      : isInProgress
                                      ? 'Đang xử lý'
                                      : ticket.escalatedToAdmin
                                      ? 'Chờ Quản trị viên phản hồi'
                                      : 'Chờ hỗ trợ'}
                                  </span>
                                </span>
                                {ticket.supportTier === 'vip_fast_track' && (
                                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#A94F3D] border border-[#C9A46A] text-[#D8C9A9]">
                                    Pro · 49k · Ưu tiên nhanh
                                  </span>
                                )}
                                {ticket.supportTier === 'standard_19k' && (
                                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#526D8B] text-[#D8C9A9]">
                                    Plus · 19k
                                  </span>
                                )}
                                {(ticket.supportTier === 'tester_report' ||
                                  ticket.category === 'tester_feedback') && (
                                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#47796D] text-[#D8C9A9]">
                                    Tester Pro
                                  </span>
                                )}
                                {ticket.escalatedToAdmin && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-[#A94F3D]/25 border border-[#A94F3D] text-[#D8C9A9] text-[11px] font-bold inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-[#C9A46A]" />
                                    <span>Ưu tiên Admin xử lý</span>
                                  </span>
                                )}
                                <span className="px-2.5 py-0.5 rounded-full bg-[#0071E3]/20 border border-[#0071E3]/40 text-[11px] text-sky-200 font-medium">
                                  {ticket.categoryLabel}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] text-[#A1A1A6] inline-flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-[#C9A46A]" />
                                  <span>{ticket.forwardedToEmail || PRIMARY_ADMIN_EMAIL}</span>
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#D1D1D6]">
                                <span>
                                  Người gửi:{' '}
                                  <strong className="text-[#F5F5F7]">
                                    {ticket.userName || ticket.senderName}
                                  </strong>
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#C5A059]">
                                  <Mail className="w-3 h-3" />
                                  <span>{ticket.userEmail || ticket.senderEmail}</span>
                                </span>
                                {ticket.senderPhone && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-[#D8C9A9] font-medium">
                                    <span>SĐT / Zalo: {ticket.senderPhone}</span>
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-[#A1A1A6]">
                                  <span>
                                    Tài khoản: {ticket.userEmail || ticket.ownerEmail || ticket.senderEmail}
                                  </span>
                                </span>
                                {(ticket.uid || ticket.senderUserId) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-[#C9A46A]/25 text-[10.5px] font-mono text-[#C9A46A]">
                                    <span>UID: {ticket.uid || ticket.senderUserId}</span>
                                  </span>
                                )}
                              </div>
                              {ticket.testerContext && (
                                <div className="inline-flex flex-wrap items-center gap-2 px-2.5 py-1 rounded-lg bg-[#171817] border border-[#47796D]/60 text-[10.5px] text-[#D8C9A9] font-mono">
                                  <span>Tab: {ticket.testerContext.tab}</span>
                                  {ticket.testerContext.siteName && (
                                    <span>· Di tích: {ticket.testerContext.siteName}</span>
                                  )}
                                  {ticket.testerContext.lang && (
                                    <span>· Ngôn ngữ: {ticket.testerContext.lang.toUpperCase()}</span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="text-[11px] tabular-nums text-[#86868B] shrink-0">
                              {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                            </div>
                          </div>

                          {/* Status Management & Delete Toolbar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] text-[#86868B] mr-1">
                                Đổi trạng thái:
                              </span>
                              {(
                                [
                                  { id: 'pending', label: 'Chờ hỗ trợ' },
                                  { id: 'in_progress', label: 'Đang xử lý' },
                                  { id: 'resolved', label: 'Đã giải quyết' },
                                ] as const
                              ).map((stOption) => {
                                const isCurrent = ticket.status === stOption.id;
                                return (
                                  <button
                                    key={stOption.id}
                                    type="button"
                                    onClick={() => {
                                      if (isCurrent) return;
                                      updateSupportTicketStatus(
                                        ticket.id,
                                        stOption.id,
                                        adminActorEmail
                                      );
                                      refreshLiveData();
                                      showToast(
                                        'ok',
                                        `Đã chuyển trạng thái phiếu ${ticket.ticketCode} sang "${stOption.label}".`
                                      );
                                    }}
                                    className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                                      isCurrent
                                        ? stOption.id === 'resolved'
                                          ? 'bg-[#47796D] text-[#F7F3EB] border-[#47796D] font-semibold'
                                          : stOption.id === 'in_progress'
                                          ? 'bg-[#526D8B] text-[#F7F3EB] border-[#526D8B] font-semibold'
                                          : 'bg-[#C9A46A] text-[#171817] border-[#C9A46A] font-semibold'
                                        : 'bg-white/[0.04] text-[#A1A1A6] border-white/[0.1] hover:text-white hover:border-white/[0.25]'
                                    }`}
                                  >
                                    {stOption.label}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                deleteSupportTicket(ticket.id, adminActorEmail);
                                refreshLiveData();
                                showToast(
                                  'ok',
                                  `Đã xóa yêu cầu hỗ trợ ${ticket.ticketCode} khỏi hệ thống và Firebase.`
                                );
                              }}
                              className="px-3 py-1 rounded-full bg-[#A94F3D]/15 hover:bg-[#A94F3D]/30 border border-[#A94F3D]/45 text-[#F5C2B8] text-[11px] font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa yêu cầu</span>
                            </button>
                          </div>

                          {ticket.relatedSiteName && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs text-[#E5E5EA]">
                              <Landmark className="w-3.5 h-3.5 text-[#C5A059]" />
                              <span>
                                Di tích liên quan:{' '}
                                <strong>{ticket.relatedSiteName}</strong>
                              </span>
                            </div>
                          )}

                          {/* Full Conversation Thread: Visitor <-> AI Support <-> Admin */}
                          <div className="space-y-2.5">
                            <div className="text-[12px] font-medium text-[#86868B]">
                              Lịch sử Hội thoại ({messages.length} tin nhắn)
                            </div>
                            <div className="space-y-2">
                              {messages.map((msg) => {
                                const isAi = msg.senderRole === 'ai_concierge';
                                const isAdminMsg = msg.senderRole === 'admin';
                                return (
                                  <div
                                    key={msg.id}
                                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                                      isAdminMsg
                                        ? 'bg-[#C5A059]/12 border-[#C5A059]/45'
                                        : isAi
                                        ? 'bg-[#0E1B2A]/85 border-[#0071E3]/45'
                                        : 'bg-black/45 border-white/[0.07]'
                                    }`}
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
                                      {isAi ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0071E3]/25 border border-[#0071E3]/45 font-bold text-sky-200">
                                          <Bot className="w-3 h-3 text-sky-300" />
                                          <span>{AI_SUPPORT_BOT_AUTHOR}</span>
                                        </span>
                                      ) : isAdminMsg ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C5A059]/25 border border-[#C5A059]/55 font-bold text-[#F2D388]">
                                          <Crown className="w-3 h-3 text-[#C5A059]" />
                                          <span>Quản trị viên Dấu Ấn Việt 3D</span>
                                        </span>
                                      ) : (
                                        <span className="font-semibold text-[#D1D1D6]">
                                          {msg.senderLabel}
                                        </span>
                                      )}
                                      <span className="tabular-nums text-[#86868B]">
                                        {new Date(msg.createdAt).toLocaleString('vi-VN')}
                                      </span>
                                    </div>
                                    <div className="text-xs sm:text-[13px] text-[#F5EFE6] leading-relaxed whitespace-pre-line">
                                      {msg.text}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Direct Admin Intervention Composer */}
                          <div className="p-3.5 rounded-xl bg-black/45 border border-white/[0.08] space-y-2.5">
                            <label
                              htmlFor={`support-reply-${ticket.id}`}
                              className="flex flex-wrap items-center justify-between gap-2 text-[12px] font-medium text-[#C5A059]"
                            >
                              <span>
                                Nhắn tin bổ sung tới {ticket.senderName} dưới danh nghĩa Quản trị viên Dấu Ấn Việt 3D
                              </span>
                            </label>
                            <textarea
                              id={`support-reply-${ticket.id}`}
                              rows={2}
                              value={draftValue}
                              onChange={(e) =>
                                setSupportReplyDrafts((prev) => ({
                                  ...prev,
                                  [ticket.id]: e.target.value,
                                }))
                              }
                              placeholder="Nhập tin nhắn trực tiếp từ Quản trị viên để bổ sung hoặc chốt hỗ trợ cho du khách..."
                              className="w-full p-2.5 rounded-xl bg-[#111114] border border-white/[0.12] text-xs text-[#F5F5F7] placeholder:text-[#636366] focus:border-[#C5A059] focus:outline-none resize-none"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <button
                                  type="button"
                                  disabled={draftingSupportTicketId === ticket.id}
                                  onClick={async () => {
                                    setDraftingSupportTicketId(ticket.id);
                                    try {
                                      const drafted = await draftAdminSupportReplyWithGemini(
                                        ticket,
                                        sites
                                      );
                                      setSupportReplyDrafts((prev) => ({
                                        ...prev,
                                        [ticket.id]: drafted,
                                      }));
                                      showToast(
                                        'ok',
                                        `Lõi 02 đã soạn bản nháp theo ngữ cảnh lịch sử cho phiếu ${ticket.ticketCode}.`
                                      );
                                    } finally {
                                      setDraftingSupportTicketId((prev) =>
                                        prev === ticket.id ? null : prev
                                      );
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-full bg-[#0071E3]/20 hover:bg-[#0071E3]/35 border border-[#0071E3]/45 disabled:opacity-60 text-[11px] font-medium text-sky-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                                >
                                  <Sparkles
                                    className={`w-3 h-3 ${
                                      draftingSupportTicketId === ticket.id ? 'animate-spin' : ''
                                    }`}
                                  />
                                  <span>
                                    {draftingSupportTicketId === ticket.id
                                      ? 'AI đang soạn theo sử liệu...'
                                      : 'AI Soạn phản hồi theo sử liệu di tích'}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSupportReplyDrafts((prev) => ({
                                      ...prev,
                                      [ticket.id]: `Xin chào ${ticket.senderName}, Quản trị viên Bảo tàng Số Dấu Ấn Việt 3D đã trực tiếp kiểm tra phiếu ${ticket.ticketCode} của bạn và xác nhận xử lý hoàn tất. Nếu cần hỗ trợ thêm, bạn có thể nhắn lại ngay tại đây nhé!`,
                                    }))
                                  }
                                  className="text-[11px] text-[#C5A059] hover:underline cursor-pointer"
                                >
                                  Chèn mẫu câu trả lời Quản trị viên
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const text = draftValue.trim();
                                  if (!text) {
                                    showToast(
                                      'err',
                                      'Vui lòng nhập nội dung phản hồi trước khi gửi.'
                                    );
                                    return;
                                  }
                                  replyToSupportTicket(ticket.id, text, adminActorEmail);
                                  setSupportReplyDrafts((prev) => ({
                                    ...prev,
                                    [ticket.id]: '',
                                  }));
                                  refreshLiveData();
                                  showToast(
                                    'ok',
                                    `👑 Đã gửi tin nhắn Quản trị viên vào hội thoại phiếu ${ticket.ticketCode}.`
                                  );
                                }}
                                className="px-4 py-2 rounded-full bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Gửi tin nhắn Quản trị viên</span>
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ===============================================================
                MODULE 3: VISITORS & DIGITAL TICKETS / CERTIFICATES
               =============================================================== */}
            {activeModule === 'visitors_tickets' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[13px] font-medium text-[#C5A059]">
                      Tài khoản du khách &amp; vé số đã cấp
                    </span>
                    <h3 className="text-xl sm:text-2xl font-semibold text-[#F5F5F7] mt-0.5">
                      Quản lý Du khách &amp; Vé Tham Quan Số / Chứng nhận Học liệu
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleManualCloudSync()}
                    disabled={isSyncingCloud}
                    className="px-3.5 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                    <span>{isSyncingCloud ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                  </button>
                </div>

                {/* REGISTERED VISITORS TABLE (PRIVACY MASKED) */}
                <div className="rounded-2xl bg-[#161619] border border-white/[0.08] p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <h4 className="text-sm font-semibold text-[#F5F5F7]">
                      Danh sách Tài khoản Du khách đã Đăng nhập ({visitors.length})
                    </h4>
                    <span className="text-[11px] text-[#86868B]">
                      Email được ẩn danh một phần để bảo vệ quyền riêng tư
                    </span>
                  </div>

                  {visitors.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#86868B]">
                      Chưa có tài khoản du khách nào đăng nhập vào hệ thống.
                    </div>
                  ) : (
                    <div className="overflow-x-auto heritage-scrollbar pb-1.5 touch-pan-x">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.08] text-[#86868B] text-[12px] font-medium">
                            <th className="py-2.5 pr-3">Tên hiển thị</th>
                            <th className="py-2.5 px-3">Nền tảng</th>
                            <th className="py-2.5 px-3">Liên hệ (Ẩn danh)</th>
                            <th className="py-2.5 px-3">Vai trò</th>
                            <th className="py-2.5 px-3">Dấu Ấn Labs</th>
                            <th className="py-2.5 px-3">Mô hình 3D</th>
                            <th className="py-2.5 px-3">Tuyến xong</th>
                            <th className="py-2.5 px-3">Lần đăng nhập</th>
                            <th className="py-2.5 pl-3">Cập nhật cuối</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                          {visitors.map((v) => {
                            const hasLabs = v.role === 'admin' || Boolean(v.isBetaTester);
                            const isFixedAdminLabs = v.isPrimaryAdmin || v.role === 'admin';
                            return (
                              <tr key={v.userId}>
                                <td className="py-2.5 pr-3 font-medium text-[#F5F5F7]">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>{v.displayName}</span>
                                    {v.isQuickJudge && (
                                      <span className="px-1.5 py-0.5 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/45 text-[9.5px] font-semibold text-[#C5A059]">
                                        Ban Giám Khảo
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      v.provider === 'google'
                                        ? 'bg-white/10 text-white'
                                        : 'bg-[#1877F2]/25 text-[#60A5FA]'
                                    }`}
                                  >
                                    {v.provider === 'google' ? 'Google' : 'Facebook'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-[#A1A1A6]">
                                  {v.maskedContact}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      v.role === 'admin'
                                        ? 'bg-[#C5A059]/20 text-[#C5A059]'
                                        : 'bg-white/[0.07] text-[#D1D1D6]'
                                    }`}
                                  >
                                    {v.isPrimaryAdmin
                                      ? 'Super Admin'
                                      : v.role === 'admin'
                                      ? 'Admin'
                                      : 'Du khách'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={hasLabs}
                                    disabled={isFixedAdminLabs}
                                    title={
                                      isFixedAdminLabs
                                        ? 'Quản trị viên mặc định có quyền Dấu Ấn Labs'
                                        : hasLabs
                                        ? 'Tắt quyền Dấu Ấn Labs'
                                        : 'Bật quyền Dấu Ấn Labs'
                                    }
                                    onClick={() => {
                                      const nextState = !hasLabs;
                                      const res = setUserBetaTester({
                                        userId: v.userId,
                                        isBetaTester: nextState,
                                        adminEmail: adminActorEmail,
                                      });
                                      if (!res.ok) {
                                        showToast('err', res.error || 'Không thể cập nhật quyền Dấu Ấn Labs.');
                                        return;
                                      }
                                      refreshLiveData();
                                      showToast(
                                        'ok',
                                        nextState
                                          ? `Đã cấp quyền Dấu Ấn Labs cho ${v.displayName} và đồng bộ Cloud.`
                                          : `Đã tắt quyền Dấu Ấn Labs cho ${v.displayName}.`
                                      );
                                    }}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
                                      hasLabs
                                        ? 'bg-[#C8A96E] border-[#C8A96E]'
                                        : 'bg-[#27272A] border-white/[0.12]'
                                    } ${isFixedAdminLabs ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
                                  >
                                    <span
                                      className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
                                        hasLabs
                                          ? 'translate-x-4 bg-[#0E0E10]'
                                          : 'translate-x-0.5 bg-[#8E8E93]'
                                      }`}
                                    />
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 tabular-nums text-[#C5A059]">
                                  {(v.exploredSiteIds || []).length}/17
                                </td>
                                <td className="py-2.5 px-3 tabular-nums text-emerald-300">
                                  {(v.completedRouteIds || []).length}/6
                                </td>
                                <td className="py-2.5 px-3 tabular-nums text-[#D1D1D6]">
                                  {v.loginCount}
                                </td>
                                <td className="py-2.5 pl-3 tabular-nums text-[11px] text-[#86868B]">
                                  {new Date(v.lastLoginAt).toLocaleString('vi-VN')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ISSUED DIGITAL TICKETS & CERTIFICATES */}
                <div className="rounded-2xl bg-[#161619] border border-white/[0.08] p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                    <h4 className="text-sm font-semibold text-[#F5F5F7]">
                      Danh sách Vé Tham Quan Số &amp; Chứng nhận đã cấp ({issuedPasses.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: 'all', label: 'Tất cả' },
                          { id: 'active', label: 'Chờ duyệt' },
                          { id: 'verified', label: 'Đã xác thực' },
                          { id: 'revoked', label: 'Đã thu hồi' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setTicketFilter(tab.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] cursor-pointer ${
                            ticketFilter === tab.id
                              ? 'bg-[#C5A059] text-black font-semibold'
                              : 'bg-white/[0.06] text-[#A1A1A6]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredPasses.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#86868B]">
                      Chưa có Vé điện tử VIP hoặc Chứng nhận học liệu nào được phát hành.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredPasses.map((pass) => (
                        <div
                          key={pass.id}
                          className="p-3.5 rounded-xl bg-black/40 border border-white/[0.07] flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="tabular-nums text-xs font-bold text-[#C5A059]">
                                {pass.code}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-[10px] text-[#D1D1D6]">
                                {pass.label}
                              </span>
                              {pass.provider && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    pass.provider === 'google'
                                      ? 'bg-white/10 text-white'
                                      : 'bg-[#1877F2]/25 text-[#60A5FA]'
                                  }`}
                                >
                                  {pass.provider === 'google' ? 'Google' : 'Facebook'}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  pass.status === 'verified'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : pass.status === 'revoked'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-sky-500/20 text-sky-300'
                                }`}
                              >
                                {pass.status === 'verified'
                                  ? '✓ Đã xác thực'
                                  : pass.status === 'revoked'
                                  ? '✕ Đã thu hồi'
                                  : 'Đang hiệu lực'}
                              </span>
                            </div>
                            <div className="text-xs text-[#D1D1D6]">
                              Chủ sở hữu: <strong>{pass.ownerName}</strong> ({pass.ownerContactMasked}) ·{' '}
                              <span className="text-[#C5A059]">{pass.amountLabel}</span>
                              {pass.routeTitle && pass.routeTitle !== pass.label
                                ? ` · Tuyến: ${pass.routeTitle}`
                                : ''}
                              {pass.score !== undefined ? ` · Điểm: ${pass.score}/100` : ''}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {pass.status !== 'verified' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateIssuedPassStatus(pass.id, 'verified', adminActorEmail);
                                  refreshLiveData();
                                  showToast('ok', `Đã xác thực mã ${pass.code}`);
                                }}
                                className="px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-xs font-medium text-emerald-200 flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Xác thực</span>
                              </button>
                            )}
                            {pass.status !== 'revoked' && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateIssuedPassStatus(pass.id, 'revoked', adminActorEmail);
                                  refreshLiveData();
                                  showToast('ok', `Đã thu hồi mã ${pass.code}`);
                                }}
                                className="px-3 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/35 text-xs font-medium text-rose-200 flex items-center gap-1 cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Thu hồi</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===============================================================
                MODULE 4: QUẢN TRỊ PHÂN QUYỀN & BẢO MẬT HỆ THỐNG (2-COLUMN CLEAN GRID)
               =============================================================== */}
            {activeModule === 'permissions' && (
              <div className="space-y-6 max-w-6xl">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#F5F5F7]">
                    Quản trị Phân quyền &amp; Bảo mật Hệ thống
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1A1A6]">
                    Kiểm soát danh sách quản trị viên, cập nhật mật khẩu bảo vệ và thiết lập trạng thái vận hành cổng thông tin.
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                  {/* CỘT TRÁI — QUẢN LÝ QUYỀN & MẬT KHẨU */}
                  <div className="space-y-5">
                    {/* 1. THẺ DANH SÁCH QUẢN TRỊ VIÊN */}
                    <div className="rounded-[14px] bg-[#141416] border border-white/[0.08] p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
                        <h4 className="text-sm font-semibold text-[#F5F5F7]">
                          Danh sách Quản trị viên
                        </h4>
                        <span className="text-[11px] tabular-nums text-[#86868B]">
                          {secondaryAdminEmails.length + 1} tài khoản
                        </span>
                      </div>

                      {/* Tài khoản Quản trị viên chính */}
                      <div className="p-3.5 rounded-xl bg-black/40 border border-[#C5A059]/30 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/35 flex items-center justify-center shrink-0">
                            <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-medium text-[#F5F5F7] truncate">
                              {primaryAdminEmail}
                            </div>
                            <div className="text-[11px] text-[#86868B]">
                              Tài khoản gốc được bảo vệ cố định
                            </div>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#E6C580] text-[11px] font-medium shrink-0">
                          Quản trị viên chính
                        </span>
                      </div>

                      {/* Form thêm thành viên phụ */}
                      <form onSubmit={handleAddCoAdmin} className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="email"
                          required
                          value={newAdminEmailInput}
                          onChange={(e) => setNewAdminEmailInput(e.target.value)}
                          placeholder="Nhập email Google cần cấp quyền..."
                          className="flex-1 h-9 px-3 rounded-lg bg-black/50 border border-white/[0.1] text-xs sm:text-sm text-[#F5F5F7] placeholder:text-[#636366] focus:border-[#C5A059] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="h-9 px-4 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-[#F5F5F7] text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Thêm quyền</span>
                        </button>
                      </form>

                      {/* Danh sách đồng quản trị viên phụ */}
                      <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.07] bg-black/25 overflow-hidden">
                        {secondaryAdminEmails.length === 0 ? (
                          <div className="px-3.5 py-3 text-xs text-[#86868B]">
                            Chưa có thành viên phụ nào được cấp quyền quản trị.
                          </div>
                        ) : (
                          secondaryAdminEmails.map((email) => (
                            <div
                              key={email}
                              className="px-3.5 py-2.5 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                                <span className="text-xs text-[#E5E5EA] truncate">
                                  {email}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const res = removeAdminEmail(email);
                                  if (!res.ok) {
                                    showToast('err', res.error || 'Không thể gỡ quyền.');
                                  } else {
                                    refreshLiveData();
                                    showToast('ok', `Đã gỡ quyền quản trị của ${email}`);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] text-[#A1A1A6] hover:text-[#FCA5A5] inline-flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Gỡ quyền</span>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 2. THẺ ĐỔI MẬT KHẨU BẢO VỆ */}
                    <form
                      onSubmit={handleChangeAdminPasswordSubmit}
                      className="rounded-[14px] bg-[#141416] border border-white/[0.08] p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-[#C5A059]" />
                          <h4 className="text-sm font-semibold text-[#F5F5F7]">
                            Đổi mật khẩu Bảo vệ
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPwdFields((v) => !v)}
                          className="text-xs text-[#86868B] hover:text-[#F5F5F7] flex items-center gap-1 cursor-pointer"
                        >
                          {showPwdFields ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          <span>{showPwdFields ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="block text-xs text-[#A1A1A6]">
                            Mật khẩu hiện tại
                          </label>
                          <input
                            type={showPwdFields ? 'text' : 'password'}
                            required
                            value={currentAdminPwd}
                            onChange={(e) => setCurrentAdminPwd(e.target.value)}
                            placeholder="Nhập mật khẩu hiện tại..."
                            className="w-full h-10 px-3.5 rounded-lg bg-black/50 border border-white/[0.1] text-xs sm:text-sm text-[#F5F5F7] placeholder:text-[#636366] focus:border-[#C5A059] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs text-[#A1A1A6]">
                            Mật khẩu mới
                          </label>
                          <input
                            type={showPwdFields ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={newAdminPwd}
                            onChange={(e) => setNewAdminPwd(e.target.value)}
                            placeholder="Tối thiểu 6 ký tự..."
                            className="w-full h-10 px-3.5 rounded-lg bg-black/50 border border-white/[0.1] text-xs sm:text-sm text-[#F5F5F7] placeholder:text-[#636366] focus:border-[#C5A059] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs text-[#A1A1A6]">
                            Xác nhận mật khẩu mới
                          </label>
                          <input
                            type={showPwdFields ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={confirmAdminPwd}
                            onChange={(e) => setConfirmAdminPwd(e.target.value)}
                            placeholder="Nhập lại mật khẩu mới..."
                            className="w-full h-10 px-3.5 rounded-lg bg-black/50 border border-white/[0.1] text-xs sm:text-sm text-[#F5F5F7] placeholder:text-[#636366] focus:border-[#C5A059] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Cập nhật mật khẩu</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* CỘT PHẢI — TRẠNG THÁI VẬN HÀNH & KHÓA KHẨN CẤP */}
                  <div className="space-y-5">
                    {/* 1. THẺ TRẠNG THÁI CỔNG THÔNG TIN */}
                    <div className="rounded-[14px] bg-[#141416] border border-white/[0.08] p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
                        <h4 className="text-sm font-semibold text-[#F5F5F7]">
                          Trạng thái Cổng Thông Tin
                        </h4>

                        <span className="inline-flex items-center gap-2 text-xs font-medium">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              emergencyState.isLocked
                                ? 'bg-[#EF4444] animate-ping'
                                : 'bg-emerald-400'
                            }`}
                          />
                          <span
                            className={
                              emergencyState.isLocked ? 'text-[#FCA5A5]' : 'text-emerald-300'
                            }
                          >
                            {emergencyState.isLocked
                              ? 'Đang tạm khóa khẩn cấp'
                              : 'Đang mở cửa bình thường'}
                          </span>
                        </span>
                      </div>

                      <p className="text-xs text-[#A1A1A6] leading-relaxed">
                        Tạm ngắt toàn bộ truy cập từ du khách và dừng tải dữ liệu khi cần bảo trì hệ thống hoặc xử lý sự cố an ninh.
                      </p>

                      {emergencyState.isLocked && (
                        <div className="p-3 rounded-xl bg-black/40 border border-white/[0.07] text-xs text-[#D1D1D6]">
                          <span className="text-[11px] text-[#86868B] block mb-0.5">
                            Thông báo đang hiển thị cho du khách:
                          </span>
                          “{emergencyState.message}”
                        </div>
                      )}

                      <div className="flex items-center justify-end pt-1">
                        {emergencyState.isLocked ? (
                          <button
                            type="button"
                            onClick={handleDeactivateLockdown}
                            className="px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Mở khóa cổng thông tin</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={openEmergencyLockdownWizard}
                            className="px-4 py-2 rounded-lg border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.08)] hover:bg-[rgba(239,68,68,0.16)] text-[#FCA5A5] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Tạm khóa khẩn cấp</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. THẺ NHẬT KÝ AN NINH GẦN ĐÂY */}
                    <div className="rounded-[14px] bg-[#141416] border border-white/[0.08] p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
                        <h4 className="text-sm font-semibold text-[#F5F5F7]">
                          Nhật ký An ninh Gần đây
                        </h4>
                        {securityAlerts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              clearSecurityAlerts(adminActorEmail);
                              refreshLiveData();
                              showToast('ok', 'Đã xóa các cảnh báo an ninh cũ.');
                            }}
                            className="text-[11px] text-[#86868B] hover:text-[#F5F5F7] cursor-pointer"
                          >
                            Xóa cảnh báo cũ
                          </button>
                        )}
                      </div>

                      {recentSecurityEvents.length === 0 ? (
                        <div className="py-8 text-center rounded-xl bg-black/30 border border-white/[0.06] space-y-1.5">
                          <ShieldCheck className="w-6 h-6 text-emerald-400/80 mx-auto" />
                          <div className="text-xs font-medium text-[#E5E5EA]">
                            Chưa ghi nhận sự cố an ninh nào gần đây
                          </div>
                          <p className="text-[11px] text-[#86868B]">
                            Các sự kiện đăng nhập quản trị và cảnh báo bảo mật sẽ hiển thị tại đây.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.07] bg-black/25 overflow-hidden">
                          {recentSecurityEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="font-medium text-[#F5F5F7] truncate">
                                  {ev.title}
                                </div>
                                <div className="text-[11px] tabular-nums text-[#86868B] truncate">
                                  {new Date(ev.timestamp).toLocaleString('vi-VN')} · {ev.actor}
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10.5px] font-medium shrink-0 border ${
                                  ev.level === 'critical'
                                    ? 'bg-[#FF453A]/15 border-[#FF453A]/40 text-[#FCA5A5]'
                                    : ev.level === 'warning'
                                    ? 'bg-amber-500/15 border-amber-400/35 text-amber-300'
                                    : 'bg-emerald-500/12 border-emerald-400/30 text-emerald-300'
                                }`}
                              >
                                {ev.statusLabel}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                MODULE 4.5: SOURCE-CODE BAKER & 3-TIER MIGRATION VAULT
               =============================================================== */}
            {activeModule === 'source_backup' && (
              <AdminSourceBackupPanel
                sites={sites}
                showToast={showToast}
                onRefreshData={refreshLiveData}
              />
            )}

            {/* ===============================================================
                MODULE 5: SITE SETTINGS & JSON BACKUP / RESTORE
               =============================================================== */}
            {activeModule === 'settings_backup' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <span className="text-[13px] font-medium text-[#C5A059]">
                    Cấu hình hệ thống &amp; sao lưu
                  </span>
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#F5F5F7] mt-0.5">
                    Cấu hình Hệ thống &amp; Sao lưu Dữ liệu (.JSON)
                  </h3>
                </div>

                {/* SITE SETTINGS FORM */}
                <form
                  onSubmit={handleSaveSettings}
                  className="rounded-2xl bg-[#161619] border border-white/[0.08] p-5 space-y-5"
                >
                  <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-[#C5A059]" />
                      <div>
                        <h4 className="text-sm font-semibold text-[#F5F5F7]">
                          Banner Thông báo Sự kiện Đầu trang
                        </h4>
                        <p className="text-xs text-[#86868B]">
                          Hiển thị dải thông báo nổi bật phía trên nội dung du khách khi bật.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSiteSettings((s) => ({ ...s, bannerEnabled: !s.bannerEnabled }))
                      }
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                        siteSettings.bannerEnabled
                          ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-200'
                          : 'bg-white/[0.07] border border-white/[0.12] text-[#A1A1A6]'
                      }`}
                    >
                      {siteSettings.bannerEnabled ? 'Đang bật' : 'Đang tắt'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-medium text-[#A1A1A6]">
                        Nội dung Banner Sự kiện
                      </label>
                      <input
                        type="text"
                        value={siteSettings.bannerText}
                        onChange={(e) =>
                          setSiteSettings((s) => ({ ...s, bannerText: e.target.value }))
                        }
                        className="w-full h-10 px-3.5 rounded-xl bg-black/50 border border-white/[0.12] text-sm text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-medium text-[#A1A1A6]">
                          Mục đích điều hướng khi bấm Banner
                        </label>
                        <select
                          value={siteSettings.bannerLinkTab}
                          onChange={(e) =>
                            setSiteSettings((s) => ({
                              ...s,
                              bannerLinkTab: e.target.value as SiteSettings['bannerLinkTab'],
                            }))
                          }
                          className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/[0.12] text-xs text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        >
                          <option value="explore">Trang chủ Khám phá</option>
                          <option value="space3d">Không gian 3D</option>
                          <option value="map_routes">Bản đồ &amp; Tuyến</option>
                          <option value="catalog">Hồ sơ Di sản</option>
                          <option value="edtech">Vé &amp; Học liệu</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[12px] font-medium text-[#A1A1A6]">
                          Ánh sáng mặc định Không gian 3D
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSiteSettings((s) => ({ ...s, default3DLighting: 'studio' }))
                            }
                            className={`h-10 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                              siteSettings.default3DLighting === 'studio'
                                ? 'bg-[#C5A059]/20 border-[#C5A059]/60 text-[#C5A059]'
                                : 'bg-black/40 border-white/[0.1] text-[#86868B]'
                            }`}
                          >
                            <Moon className="w-3.5 h-3.5" />
                            <span>Studio</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSiteSettings((s) => ({ ...s, default3DLighting: 'day' }))
                            }
                            className={`h-10 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                              siteSettings.default3DLighting === 'day'
                                ? 'bg-[#0071E3]/25 border-[#0071E3]/60 text-sky-200'
                                : 'bg-black/40 border-white/[0.1] text-[#86868B]'
                            }`}
                          >
                            <Sun className="w-3.5 h-3.5" />
                            <span>Ban ngày</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSiteSettings(DEFAULT_SITE_SETTINGS);
                        saveSiteSettings(DEFAULT_SITE_SETTINGS, adminActorEmail);
                        refreshLiveData();
                        showToast('ok', 'Đã khôi phục Cấu hình Hệ thống về mặc định.');
                      }}
                      className="px-4 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium text-[#D1D1D6] flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Khôi phục mặc định</span>
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu cấu hình hệ thống</span>
                    </button>
                  </div>
                </form>

                {/* AMBIENT MUSEUM AUDIO CONFIGURATION CARD */}
                <AmbientAudioAdminCard
                  siteSettings={siteSettings}
                  setSiteSettings={setSiteSettings}
                  adminActorEmail={adminActorEmail}
                  onAfterSave={refreshLiveData}
                  showToast={showToast}
                />

                {/* BACKUP & RESTORE JSON */}
                <div className="rounded-2xl bg-[#161619] border border-white/[0.08] p-5 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-[#F5F5F7]">
                      Sao lưu &amp; Phục hồi Dữ liệu Hệ thống (.JSON)
                    </h4>
                    <p className="text-xs text-[#86868B] mt-1">
                      Đóng gói toàn bộ chỉnh sửa 17 Di tích, 2 ảnh thực tế &amp; chú thích VI/EN/ZH (`photoCaptionOverrides`), link `.glb` (`customGlbUrls`), danh sách tài khoản &amp; hạng gói (`ACCOUNTS_DB`, `userTier`), kịch bản Thuyết minh, Vé số và Cấu hình hệ thống thành 1 tệp JSON duy nhất.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadJsonBackup}
                      className="px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Xuất dữ liệu sao lưu (.JSON)</span>
                    </button>

                    <input
                      ref={jsonBackupInputRef}
                      type="file"
                      accept="application/json,.json"
                      onChange={handleImportJsonBackup}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => jsonBackupInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-[#F5F5F7] text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <FileUp className="w-4 h-4 text-[#C5A059]" />
                      <span>Nhập dữ liệu (.JSON)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadHeritageDataTs}
                      className="px-5 py-2.5 rounded-full bg-[#171817] hover:bg-[#C9A46A]/20 border border-[#C9A46A] text-[#D8C9A9] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Download className="w-4 h-4 text-[#C9A46A]" />
                      <span>Tải tệp mã nguồn dữ liệu (heritageData.ts)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleOpenHardcodeArchiveModal()}
                      className="px-5 py-2.5 rounded-full bg-[#C9A46A]/15 hover:bg-[#C9A46A]/25 border border-[#C9A46A]/55 text-[#F5E6C8] text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <FileCode2 className="w-4 h-4 text-[#C9A46A]" />
                      <span>Lưu cứng dữ liệu hiện tại ra Code (Chống mất khi Remix)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handlePushAllToFirebase()}
                      disabled={isPushingFirebase}
                      className="px-5 py-2.5 rounded-full bg-[#171817] hover:bg-[#47796D]/25 border border-[#47796D] text-[#D8C9A9] text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <Database className="w-4 h-4 text-[#47796D]" />
                      <span>
                        {isPushingFirebase
                          ? 'Đang đẩy dữ liệu lên Firebase...'
                          : 'Đẩy dữ liệu hiện tại lên Firebase'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                MODULE 6: TRỢ LÝ GIÁM TUYỂN AI & NGÂN HÀNG HỌC LIỆU (EDTECH)
               =============================================================== */}
            {activeModule === 'ai_curator' && aiSelectedSite && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                  <div>
                    <span className="text-[13px] font-medium text-[#C5A059]">
                      Sử Quan Dấu Ấn &amp; Học liệu
                    </span>
                    <h3 className="text-xl sm:text-2xl font-semibold text-[#F5F5F7] mt-0.5">
                      Sử Quan Dấu Ấn &amp; Ngân hàng Học liệu
                    </h3>
                    <p className="text-xs text-[#86868B] mt-1">
                      Tự động dịch đa ngữ chuẩn thuật ngữ lịch sử (VI | EN | ZH) và tạo bộ 3 câu hỏi trắc nghiệm xuất bản ngay sang tab Vé &amp; Học liệu.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <select
                      value={aiSelectedSite.id}
                      onChange={(e) => setAiSiteId(e.target.value)}
                      aria-label="Chọn di tích để AI biên soạn"
                      className="h-10 px-3.5 rounded-xl bg-[#161619] border border-[#C5A059]/45 text-xs sm:text-sm text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none min-w-[260px]"
                    >
                      {sites.map((s, idx) => {
                        const isHidden = hiddenSiteIds.includes(s.id);
                        return (
                          <option key={s.id} value={s.id} className="bg-[#161619] text-[#F5F5F7]">
                            {String(idx + 1).padStart(2, '0')}. {s.officialName}
                            {isHidden ? ' [Đang ẩn · Chế độ Tester]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* PANEL 1: DỊCH THUẬT ĐA NGỮ VI | EN | ZH */}
                <div className="rounded-2xl bg-[#161619] border border-white/[0.08] p-5 sm:p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/40 flex items-center justify-center shrink-0">
                        <Languages className="w-4 h-4 text-[#C5A059]" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-[#F5F5F7]">
                          Biên soạn &amp; Dịch thuật Đa ngữ (VI | EN | ZH)
                        </h4>
                        <p className="text-xs text-[#86868B]">
                          Lưu bản dịch vào trình duyệt để đồng bộ ngay khi Du khách bấm chuyển VI | EN | ZH trên thanh Header.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAiTranslateSite}
                        disabled={isAiTranslating}
                        className="px-4 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {isAiTranslating
                            ? 'AI đang biên soạn & dịch...'
                            : 'AI Biên soạn & Dịch tự động'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAiTranslations}
                        className="px-4 py-2 rounded-full bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Lưu bản dịch VI | EN | ZH</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* TIẾNG VIỆT */}
                    <div className="p-4 rounded-xl bg-black/40 border border-white/[0.07] space-y-3">
                      <div className="text-[12px] text-[#C5A059] font-semibold">
                        VI — Tiếng Việt (Gốc học thuật)
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#86868B]">
                          Tên chính thức
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={aiSelectedSite.officialName}
                          className="w-full h-9 px-3 rounded-lg bg-black/50 border border-white/[0.08] text-xs text-[#A1A1A6]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#86868B]">
                          Tóm tắt học thuật (VI)
                        </label>
                        <textarea
                          rows={5}
                          value={aiSummaryVi}
                          onChange={(e) => setAiSummaryVi(e.target.value)}
                          className="w-full p-3 rounded-lg bg-black/50 border border-white/[0.12] text-xs text-[#F5F5F7] leading-relaxed focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* ENGLISH */}
                    <div className="p-4 rounded-xl bg-black/40 border border-white/[0.07] space-y-3">
                      <div className="text-[12px] text-[#2997FF] font-semibold">
                        EN — English Curatorial Edition
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#86868B]">
                          Official Name (EN)
                        </label>
                        <input
                          type="text"
                          value={aiNameEn}
                          onChange={(e) => setAiNameEn(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-black/50 border border-white/[0.12] text-xs text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#86868B]">
                          Architectural Style (EN)
                        </label>
                        <input
                          type="text"
                          value={aiStyleEn}
                          onChange={(e) => setAiStyleEn(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-black/50 border border-white/[0.12] text-xs text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#86868B]">
                          Scholarly Summary (EN)
                        </label>
                        <textarea
                          rows={4}
                          value={aiSummaryEn}
                          onChange={(e) => setAiSummaryEn(e.target.value)}
                          className="w-full p-3 rounded-lg bg-black/50 border border-white/[0.12] text-xs text-[#F5F5F7] leading-relaxed focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* ZH */}
                    <div className="p-4 rounded-xl bg-black/40 border border-white/[0.07] space-y-3">
                      <div className="text-[12px] text-[#47796D] font-semibold">
                        ZH — 中文历史与建筑译本
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#86868B]">
                          遗迹名称 (ZH)
                        </label>
                        <input
                          type="text"
                          value={aiNameZh}
                          onChange={(e) => setAiNameZh(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-black/50 border border-white/[0.12] text-xs text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#86868B]">
                          建筑风格 (ZH)
                        </label>
                        <input
                          type="text"
                          value={aiStyleZh}
                          onChange={(e) => setAiStyleZh(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-black/50 border border-white/[0.12] text-xs text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-[#86868B]">
                          学术简介 (ZH)
                        </label>
                        <textarea
                          rows={4}
                          value={aiSummaryZh}
                          onChange={(e) => setAiSummaryZh(e.target.value)}
                          className="w-full p-3 rounded-lg bg-black/50 border border-white/[0.12] text-xs text-[#F5F5F7] leading-relaxed focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* PANEL 2: NGÂN HÀNG CÂU HỎI TRẮC NGHIỆM LỊCH SỬ (EDTECH) */}
                <div className="rounded-2xl bg-[#161619] border border-white/[0.08] p-5 sm:p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/40 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4 text-[#C5A059]" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm sm:text-base font-semibold text-[#F5F5F7]">
                            Ngân hàng Câu hỏi Trắc nghiệm Lịch sử — {aiSelectedSite.officialName}
                          </h4>
                          {publishedQuizzesSnapshot[aiSelectedSite.id] && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-medium">
                              Đã xuất bản
                            </span>
                          )}
                          {publishedQuizzesSnapshot[aiSelectedSite.id]?.isHidden && (
                            <span className="px-2 py-0.5 rounded-full bg-[#171817] border border-[#C9A46A] text-[#C9A46A] text-[10.5px] font-semibold">
                              Đang ẩn · Chế độ Tester
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#86868B]">
                          Du khách đạt từ 80% trở lên tại tab Vé &amp; Học liệu sẽ nhận Huy hiệu &amp; Chứng nhận Hoàn thành Chuyên đề.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAiGenerateQuiz}
                        disabled={isAiGeneratingQuiz}
                        className="px-4 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <RoyalHistoriographerIcon size={15} className="w-[15px] h-[15px] text-[#C9A46A] shrink-0" />
                        <span>
                          {isAiGeneratingQuiz
                            ? 'Sử Quan đang soạn bộ 3 câu hỏi...'
                            : 'Tạo bộ 3 câu hỏi trắc nghiệm cho di tích này'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setQuizDraftQuestions((prev) => [
                            ...prev,
                            {
                              id: `${aiSelectedSite.id}-q-${Date.now()}`,
                              siteId: aiSelectedSite.id,
                              siteName: aiSelectedSite.officialName,
                              question: '',
                              options: ['A. ', 'B. ', 'C. ', 'D. '],
                              correctIndex: 0,
                              explanation: '',
                            },
                          ])
                        }
                        className="px-3.5 py-2 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.12] text-xs font-medium text-[#F5F5F7] flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Thêm câu hỏi</span>
                      </button>
                    </div>
                  </div>

                  {quizDraftQuestions.length === 0 ? (
                    <div className="py-10 text-center rounded-xl bg-black/35 border border-white/[0.06] space-y-2">
                      <p className="text-xs text-[#86868B]">
                        Chưa có câu hỏi nháp cho di tích này. Bấm <strong className="text-[#F5F5F7]">🎯 Tạo bộ 3 câu hỏi trắc nghiệm cho di tích này</strong> để AI biên soạn tức thì.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quizDraftQuestions.map((q, qIdx) => (
                        <div
                          key={q.id}
                          className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-semibold text-[#C5A059]">
                              Câu hỏi {qIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setQuizDraftQuestions((prev) =>
                                  prev.filter((_, i) => i !== qIdx)
                                )
                              }
                              className="text-[11px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa</span>
                            </button>
                          </div>

                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) =>
                              setQuizDraftQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === qIdx ? { ...item, question: e.target.value } : item
                                )
                              )
                            }
                            placeholder="Nội dung câu hỏi..."
                            className="w-full h-10 px-3 rounded-lg bg-black/55 border border-white/[0.12] text-xs sm:text-sm text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={q.correctIndex === oIdx}
                                  onChange={() =>
                                    setQuizDraftQuestions((prev) =>
                                      prev.map((item, i) =>
                                        i === qIdx ? { ...item, correctIndex: oIdx } : item
                                      )
                                    )
                                  }
                                  title="Đánh dấu là đáp án đúng"
                                  className="accent-[#C5A059] cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) =>
                                    setQuizDraftQuestions((prev) =>
                                      prev.map((item, i) =>
                                        i === qIdx
                                          ? {
                                              ...item,
                                              options: item.options.map((o, oi) =>
                                                oi === oIdx ? e.target.value : o
                                              ),
                                            }
                                          : item
                                      )
                                    )
                                  }
                                  className={`flex-1 h-9 px-3 rounded-lg bg-black/50 border text-xs text-[#F5F5F7] focus:outline-none ${
                                    q.correctIndex === oIdx
                                      ? 'border-[#C5A059]/60'
                                      : 'border-white/[0.1]'
                                  }`}
                                />
                              </div>
                            ))}
                          </div>

                          <textarea
                            rows={2}
                            value={q.explanation}
                            onChange={(e) =>
                              setQuizDraftQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === qIdx ? { ...item, explanation: e.target.value } : item
                                )
                              )
                            }
                            placeholder="Giải thích ngắn gọn sau khi du khách chọn đáp án..."
                            className="w-full p-2.5 rounded-lg bg-black/50 border border-white/[0.1] text-xs text-[#D1D1D6] focus:border-[#C5A059] focus:outline-none"
                          />
                        </div>
                      ))}

                      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
                        {publishedQuizzesSnapshot[aiSelectedSite.id] && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const nextHidden = !publishedQuizzesSnapshot[aiSelectedSite.id]?.isHidden;
                                setPublishedQuizHidden(
                                  aiSelectedSite.id,
                                  nextHidden,
                                  adminActorEmail
                                );
                                refreshLiveData();
                                showToast(
                                  'ok',
                                  nextHidden
                                    ? `Đã ẩn bộ Quiz "${aiSelectedSite.officialName}" với Du khách (Chỉ Tester Pro & Admin xem được).`
                                    : `Đã công khai bộ Quiz "${aiSelectedSite.officialName}" cho toàn bộ Du khách.`
                                );
                              }}
                              className={`px-4 py-2 rounded-full border text-xs font-medium cursor-pointer transition-colors ${
                                publishedQuizzesSnapshot[aiSelectedSite.id]?.isHidden
                                  ? 'bg-[#47796D]/25 hover:bg-[#47796D]/40 border-[#47796D] text-[#D8C9A9]'
                                  : 'bg-[#171817] hover:bg-black border-[#C9A46A]/60 text-[#C9A46A]'
                              }`}
                            >
                              {publishedQuizzesSnapshot[aiSelectedSite.id]?.isHidden
                                ? 'Công khai bộ Quiz'
                                : 'Ẩn bộ Quiz với Du khách (Chỉ Tester thấy)'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                unpublishSiteQuizSet(
                                  aiSelectedSite.id,
                                  adminActorEmail,
                                  aiSelectedSite.officialName
                                );
                                refreshLiveData();
                                showToast(
                                  'ok',
                                  `Đã gỡ chuyên đề ${aiSelectedSite.officialName} khỏi tab Vé & Học liệu.`
                                );
                              }}
                              className="px-4 py-2 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 text-rose-200 text-xs font-medium cursor-pointer"
                            >
                              Gỡ xuất bản
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            saveSiteQuizDraft(aiSelectedSite.id, quizDraftQuestions);
                            showToast('ok', 'Đã lưu bản nháp bộ câu hỏi.');
                          }}
                          className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-[#F5F5F7] text-xs font-medium cursor-pointer"
                        >
                          Lưu nháp
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            publishSiteQuizSet(
                              aiSelectedSite.id,
                              aiSelectedSite.officialName,
                              quizDraftQuestions,
                              adminActorEmail
                            );
                            refreshLiveData();
                            showToast(
                              'ok',
                              `Đã xuất bản bộ ${quizDraftQuestions.length} câu hỏi "${aiSelectedSite.officialName}" sang tab Vé & Học liệu!`
                            );
                          }}
                          className="px-5 py-2.5 rounded-full bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Xuất bản sang tab Vé &amp; Học liệu</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===============================================================
                MODULE 1B: TRỢ LÝ VẬN HÀNH AI (4 LÕI) — PHÂN TẦNG 3 TAB PHỤ
               =============================================================== */}
            {activeModule === 'ai_copilot' && (
              <div className="space-y-5">
                {/* COMPACT HEADER + 1 PRIMARY ACTION + AUTOPILOT SWITCH */}
                <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-[#F5F5F7]">
                        Trợ lý Vận hành AI (4 Lõi)
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                          systemHealth.tone === 'critical'
                            ? 'bg-[#FF453A]/15 border-[#FF453A]/45 text-[#FF8A80]'
                            : systemHealth.tone === 'warn'
                            ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                            : 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                        }`}
                      >
                        {systemHealth.onlineCount}/4 đang bật · Sức khỏe {systemHealth.scoreLabel}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium border bg-[#C5A059]/12 border-[#C5A059]/40 text-[#E5C787] inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Động cơ AI: Gemini 3.5 Flash (Định tuyến dự phòng ổn định)</span>
                      </span>
                    </div>
                    <p className="text-xs text-[#A1A1A6]">
                      Tự động hóa biên tập sử liệu, chăm sóc du khách, giám sát an ninh và tổng hợp báo cáo gửi về {PRIMARY_ADMIN_EMAIL}.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {/* MASTER AUTOPILOT TOGGLE */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={aiAutopilotEnabled}
                      onClick={async () => {
                        const next = !aiAutopilotEnabled;
                        setAiAutopilotEnabled(next, adminActorEmail);
                        refreshLiveData();
                        if (next) {
                          showToast(
                            'ok',
                            'Đã bật chế độ AI tự động trực thay Admin. Đang rà soát hệ thống...'
                          );
                          setIsRunningAiSweep(true);
                          try {
                            const revRes = await scanAndAutoReplyAllReviewsAsync(AI_COPILOT_AUTHOR);
                            const sweepRes = await runAiContentAutopilotSweep(
                              sites,
                              AI_COPILOT_AUTHOR
                            );
                            refreshLiveData();
                            if (
                              revRes.repliedCount > 0 ||
                              sweepRes.supplementedTranslations > 0 ||
                              sweepRes.supplementedQuizzes > 0
                            ) {
                              showToast(
                                'ok',
                                `AI đã tự động bổ sung ${sweepRes.supplementedTranslations} bản dịch, ${sweepRes.supplementedQuizzes} bộ quiz và trả lời ${revRes.repliedCount} đánh giá.`
                              );
                            }
                          } finally {
                            setIsRunningAiSweep(false);
                          }
                        } else {
                          showToast('ok', 'Đã tạm nghỉ chế độ AI tự động trực thay Admin.');
                        }
                      }}
                      className={`px-3.5 py-2 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-colors text-xs font-medium ${
                        aiAutopilotEnabled
                          ? 'bg-white/[0.06] border-emerald-400/40 text-emerald-300'
                          : 'bg-white/[0.04] border-white/[0.1] text-[#A1A1A6]'
                      }`}
                    >
                      <span>Tự động trực: {aiAutopilotEnabled ? 'Bật' : 'Tắt'}</span>
                      <span
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                          aiAutopilotEnabled
                            ? 'bg-emerald-500 justify-end'
                            : 'bg-white/20 justify-start'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-white" />
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={isRunningFullHydrogenSync}
                      onClick={async () => {
                        setIsRunningFullHydrogenSync(true);
                        try {
                          const full = await runFullFourHydrogenSync(sites, adminActorEmail);
                          if (full.briefing) {
                            setHydrogenBriefing(full.briefing);
                          }
                          refreshLiveData();
                          const curatedCount =
                            (full.curatorRes?.supplementedSummaries || 0) +
                            (full.curatorRes?.supplementedTranslations || 0) +
                            (full.curatorRes?.supplementedQuizzes || 0);
                          showToast(
                            'ok',
                            `Đã đồng bộ ${full.coresExecuted}/4 lõi: bổ sung ${curatedCount} mục sử liệu, trả lời ${
                              full.conciergeRes?.repliedReviews || 0
                            } đánh giá & ${
                              full.conciergeRes?.repliedTickets || 0
                            } phiếu hỗ trợ vào localStorage.`
                          );
                        } finally {
                          setIsRunningFullHydrogenSync(false);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D4B06A] disabled:opacity-60 text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Zap
                        className={`w-3.5 h-3.5 ${isRunningFullHydrogenSync ? 'animate-spin' : ''}`}
                      />
                      <span>
                        {isRunningFullHydrogenSync ? 'Đang đồng bộ 4 Lõi...' : 'Đồng bộ toàn bộ 4 Lõi'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 3 HORIZONTAL SUB-TABS */}
                <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3">
                  {(
                    [
                      { id: 'cores', label: 'Điều hành 4 Lõi' },
                      {
                        id: 'security_test',
                        label: 'An ninh & Kiểm thử',
                        badge: aiShield.level2EmergencyActive
                          ? 'Mức 2'
                          : aiShield.level === 1
                          ? 'Mức 1'
                          : undefined,
                      },
                      {
                        id: 'outbox',
                        label: 'Hộp thư Báo cáo Admin',
                        badge: aiOutbox.length > 0 ? aiOutbox.length : undefined,
                      },
                    ] as const
                  ).map((sub) => {
                    const isSubActive = aiSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setAiSubTab(sub.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                          isSubActive
                            ? 'bg-[#C5A059] text-black font-semibold'
                            : 'bg-[#141416] hover:bg-white/[0.07] border border-white/[0.08] text-[#D1D1D6]'
                        }`}
                      >
                        <span>{sub.label}</span>
                        {'badge' in sub && sub.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] tabular-nums ${
                              isSubActive
                                ? 'bg-black/15 text-black'
                                : 'bg-white/[0.08] text-[#C5A059]'
                            }`}
                          >
                            {sub.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* =========================================================
                    SUB-TAB 1: ĐIỀU HÀNH 4 LÕI
                   ========================================================= */}
                {aiSubTab === 'cores' && (
                  <div className="space-y-5">
                    {/* 2x2 STREAMLINED GRID */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                      {/* LÕI 1 — BIÊN TẬP SỬ LIỆU & HỌC LIỆU */}
                      <div className="rounded-xl bg-[#141416] border border-white/[0.08] p-5 flex flex-col justify-between gap-4">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-[12px] font-medium tabular-nums text-[#C5A059]">
                                Lõi 1 · {hydrogenCores.curator.tasksProcessed} tác vụ đã xử lý
                              </div>
                              <h4 className="text-base font-semibold text-[#F5F5F7]">
                                Lõi 1 — Biên tập Sử liệu &amp; Học liệu
                              </h4>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={hydrogenCores.curator.enabled}
                              onClick={() => {
                                const next = toggleHydrogenCore(
                                  'curator',
                                  !hydrogenCores.curator.enabled,
                                  adminActorEmail
                                );
                                setHydrogenCores(next);
                              }}
                              className={`px-2.5 py-1 rounded-lg border flex items-center gap-2 text-[11px] font-medium cursor-pointer shrink-0 ${
                                hydrogenCores.curator.enabled
                                  ? 'bg-white/[0.06] border-emerald-400/40 text-emerald-300'
                                  : 'bg-white/[0.03] border-white/[0.08] text-[#86868B]'
                              }`}
                            >
                              <span>{hydrogenCores.curator.enabled ? 'Bật' : 'Tắt'}</span>
                              <span
                                className={`w-7 h-4 rounded-full p-0.5 flex items-center ${
                                  hydrogenCores.curator.enabled
                                    ? 'bg-emerald-500 justify-end'
                                    : 'bg-white/20 justify-start'
                                }`}
                              >
                                <span className="w-3 h-3 rounded-full bg-white" />
                              </span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-black/35 border border-white/[0.06]">
                              <div className="text-[11px] text-[#86868B]">Bản dịch EN / ZH còn thiếu</div>
                              <div className="text-xl tabular-nums font-semibold text-[#F5F5F7] mt-1">
                                {curatorAudit.missingTranslationsCount}
                                <span className="text-xs font-normal text-[#86868B]">
                                  /{sites.length} di tích
                                </span>
                              </div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-black/35 border border-white/[0.06]">
                              <div className="text-[11px] text-[#86868B]">Bộ câu hỏi Quiz còn thiếu</div>
                              <div className="text-xl tabular-nums font-semibold text-[#C5A059] mt-1">
                                {curatorAudit.missingQuizCount}
                                <span className="text-xs font-normal text-[#86868B]">
                                  /{sites.length} di tích
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={runningCoreId === 'curator' || isRunningFullHydrogenSync}
                          onClick={async () => {
                            setRunningCoreId('curator');
                            try {
                              const res = await runHydrogenCuratorCore(sites, adminActorEmail);
                              refreshLiveData();
                              const total =
                                res.supplementedSummaries +
                                res.supplementedTranslations +
                                res.supplementedQuizzes;
                              showToast(
                                'ok',
                                total === 0
                                  ? 'Lõi 1: Toàn bộ 17 di tích đã đầy đủ sử liệu, bản dịch VI|EN|ZH và câu hỏi Quiz.'
                                  : `Lõi 1: Đã bổ sung ${res.supplementedSummaries} mô tả sử liệu, ${res.supplementedTranslations} bản dịch EN/ZH và ${res.supplementedQuizzes} bộ Quiz.`
                              );
                            } finally {
                              setRunningCoreId(null);
                            }
                          }}
                          className="w-full py-2.5 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.1] disabled:opacity-60 text-[#F5F5F7] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 text-[#C5A059] ${
                              runningCoreId === 'curator' ? 'animate-spin' : ''
                            }`}
                          />
                          <span>
                            {runningCoreId === 'curator'
                              ? 'Đang quét & bổ sung 17 di tích...'
                              : 'Quét & Bổ sung Sử liệu còn thiếu'}
                          </span>
                        </button>
                      </div>

                      {/* LÕI 2 — CHĂM SÓC & PHẢN HỒI DU KHÁCH */}
                      <div className="rounded-xl bg-[#141416] border border-white/[0.08] p-5 flex flex-col justify-between gap-4">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-[12px] font-medium tabular-nums text-[#C5A059]">
                                Lõi 2 · {hydrogenCores.concierge.tasksProcessed} tác vụ đã xử lý
                              </div>
                              <h4 className="text-base font-semibold text-[#F5F5F7]">
                                Lõi 2 — Chăm sóc &amp; Phản hồi Du khách
                              </h4>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={hydrogenCores.concierge.enabled}
                              onClick={() => {
                                const next = toggleHydrogenCore(
                                  'concierge',
                                  !hydrogenCores.concierge.enabled,
                                  adminActorEmail
                                );
                                setHydrogenCores(next);
                              }}
                              className={`px-2.5 py-1 rounded-lg border flex items-center gap-2 text-[11px] font-medium cursor-pointer shrink-0 ${
                                hydrogenCores.concierge.enabled
                                  ? 'bg-white/[0.06] border-emerald-400/40 text-emerald-300'
                                  : 'bg-white/[0.03] border-white/[0.08] text-[#86868B]'
                              }`}
                            >
                              <span>{hydrogenCores.concierge.enabled ? 'Bật' : 'Tắt'}</span>
                              <span
                                className={`w-7 h-4 rounded-full p-0.5 flex items-center ${
                                  hydrogenCores.concierge.enabled
                                    ? 'bg-emerald-500 justify-end'
                                    : 'bg-white/20 justify-start'
                                }`}
                              >
                                <span className="w-3 h-3 rounded-full bg-white" />
                              </span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-black/35 border border-white/[0.06]">
                              <div className="text-[11px] text-[#86868B]">Đánh giá chưa phản hồi</div>
                              <div className="text-xl tabular-nums font-semibold text-[#F5F5F7] mt-1">
                                {conciergeSentiment.unrespondedReviews}
                                <span className="text-xs font-normal text-[#86868B]">
                                  /{conciergeSentiment.totalReviews} đánh giá ({conciergeSentiment.positiveRatePct}% tích cực)
                                </span>
                              </div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-black/35 border border-white/[0.06]">
                              <div className="text-[11px] text-[#86868B]">Phiếu hỗ trợ chờ xử lý</div>
                              <div className="text-xl tabular-nums font-semibold text-[#C5A059] mt-1">
                                {conciergeSentiment.pendingTickets}
                                <span className="text-xs font-normal text-[#86868B]">
                                  /{conciergeSentiment.totalTickets} phiếu
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={runningCoreId === 'concierge' || isRunningFullHydrogenSync}
                          onClick={async () => {
                            setRunningCoreId('concierge');
                            try {
                              const res = await runHydrogenConciergeCoreAsync(
                                AI_COPILOT_AUTHOR,
                                sites
                              );
                              refreshLiveData();
                              showToast(
                                'ok',
                                `Lõi 2: Đã trả lời ${res.repliedReviews} đánh giá, phản hồi ${res.repliedTickets} phiếu hỗ trợ theo sử liệu & đồng bộ trạng thái (ownerEmail) + ${res.syncedPendingTickets} thông báo tới ${PRIMARY_ADMIN_EMAIL}.`
                              );
                            } finally {
                              setRunningCoreId(null);
                            }
                          }}
                          className="w-full py-2.5 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.1] disabled:opacity-60 text-[#F5F5F7] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <MessageSquareHeart className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Tự động Phản hồi Hỗ trợ, Đánh giá &amp; Đồng bộ</span>
                        </button>
                      </div>

                      {/* LÕI 3 — GIÁM SÁT AN NINH HỆ THỐNG */}
                      <div
                        className={`rounded-xl border p-5 flex flex-col justify-between gap-4 ${
                          aiShield.level2EmergencyActive
                            ? 'bg-[#221215] border-[#FF453A]/60'
                            : 'bg-[#141416] border-white/[0.08]'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-[12px] font-medium tabular-nums text-[#C5A059]">
                                Lõi 3 · {hydrogenCores.shield.tasksProcessed} sự kiện đã kiểm tra
                              </div>
                              <h4 className="text-base font-semibold text-[#F5F5F7]">
                                Lõi 3 — Giám sát An ninh Hệ thống
                              </h4>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={hydrogenCores.shield.enabled}
                              onClick={() => {
                                const next = toggleHydrogenCore(
                                  'shield',
                                  !hydrogenCores.shield.enabled,
                                  adminActorEmail
                                );
                                setHydrogenCores(next);
                              }}
                              className={`px-2.5 py-1 rounded-lg border flex items-center gap-2 text-[11px] font-medium cursor-pointer shrink-0 ${
                                hydrogenCores.shield.enabled
                                  ? 'bg-white/[0.06] border-emerald-400/40 text-emerald-300'
                                  : 'bg-white/[0.03] border-white/[0.08] text-[#86868B]'
                              }`}
                            >
                              <span>{hydrogenCores.shield.enabled ? 'Bật' : 'Tắt'}</span>
                              <span
                                className={`w-7 h-4 rounded-full p-0.5 flex items-center ${
                                  hydrogenCores.shield.enabled
                                    ? 'bg-emerald-500 justify-end'
                                    : 'bg-white/20 justify-start'
                                }`}
                              >
                                <span className="w-3 h-3 rounded-full bg-white" />
                              </span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-black/35 border border-white/[0.06]">
                              <div className="text-[11px] text-[#86868B]">Cảnh báo Spam (Mức 1)</div>
                              <div className="text-xl tabular-nums font-semibold text-amber-300 mt-1">
                                {aiShield.threatCountLevel1}
                                <span className="text-xs font-normal text-[#86868B]"> lần chặn</span>
                              </div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-black/35 border border-white/[0.06]">
                              <div className="text-[11px] text-[#86868B]">Tấn công nghiêm trọng (Mức 2)</div>
                              <div className="text-xl tabular-nums font-semibold text-[#FF8A80] mt-1">
                                {aiShield.threatCountLevel2}
                                <span className="text-xs font-normal text-[#86868B]"> cảnh báo</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const diag = runHydrogenShieldDiagnostic(adminActorEmail);
                            refreshLiveData();
                            showToast(diag.isAlert ? 'err' : 'ok', diag.statusText);
                          }}
                          className="w-full py-2.5 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.1] text-[#F5F5F7] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Kiểm tra An ninh Hệ thống ngay</span>
                        </button>
                      </div>

                      {/* LÕI 4 — PHÂN TÍCH & BÁO CÁO VẬN HÀNH */}
                      <div className="rounded-xl bg-[#141416] border border-white/[0.08] p-5 flex flex-col justify-between gap-4">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-[12px] font-medium tabular-nums text-[#C5A059]">
                                Lõi 4 · {hydrogenCores.strategist.tasksProcessed} bản tin đã xuất
                              </div>
                              <h4 className="text-base font-semibold text-[#F5F5F7]">
                                Lõi 4 — Phân tích &amp; Báo cáo Vận hành
                              </h4>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={hydrogenCores.strategist.enabled}
                              onClick={() => {
                                const next = toggleHydrogenCore(
                                  'strategist',
                                  !hydrogenCores.strategist.enabled,
                                  adminActorEmail
                                );
                                setHydrogenCores(next);
                              }}
                              className={`px-2.5 py-1 rounded-lg border flex items-center gap-2 text-[11px] font-medium cursor-pointer shrink-0 ${
                                hydrogenCores.strategist.enabled
                                  ? 'bg-white/[0.06] border-emerald-400/40 text-emerald-300'
                                  : 'bg-white/[0.03] border-white/[0.08] text-[#86868B]'
                              }`}
                            >
                              <span>{hydrogenCores.strategist.enabled ? 'Bật' : 'Tắt'}</span>
                              <span
                                className={`w-7 h-4 rounded-full p-0.5 flex items-center ${
                                  hydrogenCores.strategist.enabled
                                    ? 'bg-emerald-500 justify-end'
                                    : 'bg-white/20 justify-start'
                                }`}
                              >
                                <span className="w-3 h-3 rounded-full bg-white" />
                              </span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-black/35 border border-white/[0.06]">
                              <div className="text-[11px] text-[#86868B]">Lượt tương tác 3D</div>
                              <div className="text-xl tabular-nums font-semibold text-[#C5A059] mt-1">
                                {analytics.interactions3D.toLocaleString('vi-VN')}
                              </div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-black/35 border border-white/[0.06]">
                              <div className="text-[11px] text-[#86868B]">Tuyến tham quan hoàn tất</div>
                              <div className="text-xl tabular-nums font-semibold text-emerald-300 mt-1">
                                {(analytics.routesCompleted || 0).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const nextBriefing = generateHydrogenExecutiveBriefing(
                              sites,
                              adminActorEmail
                            );
                            setHydrogenBriefing(nextBriefing);
                            refreshLiveData();
                            showToast(
                              'ok',
                              'Lõi 4: Đã phân tích dữ liệu và cập nhật Báo cáo Điều hành tổng hợp mới nhất.'
                            );
                          }}
                          className="w-full py-2.5 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.1] text-[#F5F5F7] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Xuất Báo cáo Vận hành Tổng hợp</span>
                        </button>
                      </div>
                    </div>

                    {/* BÁO CÁO VẬN HÀNH TỔNG HỢP TỪ LÕI 4 */}
                    {hydrogenBriefing && (
                      <div className="rounded-xl bg-[#141416] border border-white/[0.08] p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                          <div>
                            <div className="text-[12px] font-medium text-[#C5A059]">
                              Báo cáo phân tích từ Lõi 4
                            </div>
                            <h4 className="text-sm sm:text-base font-semibold text-[#F5F5F7] mt-0.5">
                              Di tích Thu hút, Khung giờ Cao điểm &amp; Đề xuất Tối ưu
                            </h4>
                          </div>
                          <span className="text-[11px] tabular-nums text-[#86868B]">
                            Cập nhật: {new Date(hydrogenBriefing.generatedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          <div className="lg:col-span-5 p-4 rounded-xl bg-black/35 border border-white/[0.06] space-y-2.5">
                            <div className="text-[12px] font-medium text-[#C5A059]">
                              Top 3 Di tích Thu hút nhất
                            </div>
                            <div className="space-y-2">
                              {hydrogenBriefing.top3Sites.map((s, idx) => (
                                <div
                                  key={s.id}
                                  className="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                                >
                                  <div className="min-w-0">
                                    <span className="tabular-nums font-bold text-[#C5A059] mr-1.5">
                                      #{idx + 1}
                                    </span>
                                    <span className="text-[#F5F5F7] font-medium truncate">
                                      {s.name}
                                    </span>
                                    <span className="text-[10.5px] text-[#86868B] block pl-5">
                                      {s.district}
                                    </span>
                                  </div>
                                  <span className="tabular-nums text-[11px] text-emerald-300 shrink-0">
                                    {s.views.toLocaleString('vi-VN')} lượt
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="lg:col-span-7 flex flex-col gap-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="p-3.5 rounded-xl bg-black/35 border border-white/[0.06]">
                                <div className="text-[11px] text-[#86868B] flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                                  <span>Khung giờ Cao điểm Dự báo</span>
                                </div>
                                <div className="text-sm font-semibold text-[#F5F5F7] mt-1">
                                  {hydrogenBriefing.peakHoursWindow}
                                </div>
                              </div>
                              <div className="p-3.5 rounded-xl bg-black/35 border border-white/[0.06]">
                                <div className="text-[11px] text-[#86868B] flex items-center gap-1.5">
                                  <Star className="w-3.5 h-3.5 text-[#C5A059]" />
                                  <span>Mức độ Hài lòng Du khách</span>
                                </div>
                                <div className="text-sm font-semibold text-emerald-300 mt-1">
                                  {hydrogenBriefing.positiveRatePct}% tích cực (
                                  {hydrogenBriefing.averageRating.toFixed(1)}/5.0 ★ ·{' '}
                                  {hydrogenBriefing.totalReviews} đánh giá)
                                </div>
                              </div>
                            </div>

                            <div className="p-4 rounded-xl bg-black/35 border border-white/[0.06] space-y-2 flex-1">
                              <div className="text-[12px] font-medium text-emerald-300">
                                3 Đề xuất Tối ưu Vận hành
                              </div>
                              <ul className="space-y-1.5 text-xs text-[#E5E5EA]">
                                {hydrogenBriefing.recommendations.map((rec, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="tabular-nums text-[#C5A059] font-bold shrink-0">
                                      0{idx + 1}.
                                    </span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* YÊU CẦU AI XỬ LÝ NHANH */}
                    <div className="rounded-xl bg-[#141416] border border-white/[0.08] p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-[#C5A059]" />
                          <h4 className="text-sm sm:text-base font-semibold text-[#F5F5F7]">
                            Yêu cầu AI xử lý nhanh
                          </h4>
                        </div>
                        <span className="text-[11px] text-[#86868B]">
                          Tự động phân tuyến đúng lõi chức năng &amp; lưu nhật ký thực thi
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          'Kiểm tra an ninh hệ thống',
                          'Trả lời toàn bộ đánh giá mới',
                          'Tạo báo cáo vận hành hôm nay',
                          'Quét sử liệu & Quiz 17 di tích',
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            disabled={isExecutingHydrogenCmd}
                            onClick={async () => {
                              setHydrogenCmdInput(preset);
                              setIsExecutingHydrogenCmd(true);
                              try {
                                const res = await executeHydrogenAdminCommand(
                                  preset,
                                  sites,
                                  adminActorEmail
                                );
                                setLastCommandResult(res.entry);
                                setHydrogenCmdLogs(res.logs);
                                if (res.briefing) setHydrogenBriefing(res.briefing);
                                refreshLiveData();
                                showToast(
                                  res.entry.status === 'alert' ? 'err' : 'ok',
                                  `[${res.entry.coreLabel}] ${res.entry.result}`
                                );
                              } finally {
                                setIsExecutingHydrogenCmd(false);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] text-[#E5E5EA] cursor-pointer transition-colors"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const trimmed = hydrogenCmdInput.trim();
                          if (!trimmed || isExecutingHydrogenCmd) return;
                          setIsExecutingHydrogenCmd(true);
                          try {
                            const res = await executeHydrogenAdminCommand(
                              trimmed,
                              sites,
                              adminActorEmail
                            );
                            setLastCommandResult(res.entry);
                            setHydrogenCmdLogs(res.logs);
                            if (res.briefing) setHydrogenBriefing(res.briefing);
                            setHydrogenCmdInput('');
                            refreshLiveData();
                            showToast(
                              res.entry.status === 'alert' ? 'err' : 'ok',
                              `[${res.entry.coreLabel}] ${res.entry.result}`
                            );
                          } finally {
                            setIsExecutingHydrogenCmd(false);
                          }
                        }}
                        className="flex flex-col sm:flex-row gap-2.5"
                      >
                        <div className="relative flex-1">
                          <Terminal className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={hydrogenCmdInput}
                            onChange={(e) => setHydrogenCmdInput(e.target.value)}
                            placeholder='Nhập yêu cầu (VD: "Trả lời toàn bộ đánh giá mới", "Kiểm tra an ninh hệ thống")...'
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/50 border border-white/[0.12] focus:border-[#C5A059] outline-none text-xs text-[#F5F5F7] placeholder:text-[#6E6E73]"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!hydrogenCmdInput.trim() || isExecutingHydrogenCmd}
                          className="px-4 py-2.5 rounded-lg bg-[#C5A059] hover:bg-[#D4B06A] disabled:opacity-50 text-black text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{isExecutingHydrogenCmd ? 'Đang xử lý...' : 'Thực hiện'}</span>
                        </button>
                      </form>

                      {lastCommandResult && (
                        <div
                          className={`p-3.5 rounded-xl border space-y-1 ${
                            lastCommandResult.status === 'alert'
                              ? 'bg-[#FF453A]/10 border-[#FF453A]/40'
                              : 'bg-emerald-500/10 border-emerald-400/35'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <span className="font-semibold text-[#C5A059]">
                              {lastCommandResult.coreLabel}
                            </span>
                            <span className="tabular-nums text-[#86868B]">
                              {new Date(lastCommandResult.timestamp).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <div className="text-xs text-[#F5F5F7] leading-relaxed">
                            {lastCommandResult.result}
                          </div>
                        </div>
                      )}

                      {hydrogenCmdLogs.length > 0 && (
                        <div className="rounded-xl bg-black/35 border border-white/[0.06] p-3.5 space-y-2">
                          <div className="text-[12px] font-medium text-[#86868B]">
                            Lịch sử xử lý gần đây ({hydrogenCmdLogs.length})
                          </div>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {hydrogenCmdLogs.map((log) => (
                              <div
                                key={log.id}
                                className="flex flex-wrap items-baseline justify-between gap-2 text-xs py-1.5 px-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                              >
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10.5px] font-medium text-[#C5A059]">
                                      {log.coreLabel}
                                    </span>
                                    <span className="text-[#F5F5F7] font-medium">
                                      · {log.command}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#A1A1A6]">{log.result}</div>
                                </div>
                                <span className="tabular-nums text-[11px] text-[#6E6E73] shrink-0">
                                  {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* =========================================================
                    SUB-TAB 2: AN NINH & KIỂM THỬ
                   ========================================================= */}
                {aiSubTab === 'security_test' && (
                  <div className="space-y-5">
                    <div
                      className={`rounded-xl border p-5 space-y-5 ${
                        aiShield.level2EmergencyActive
                          ? 'bg-[#221215] border-[#FF453A]/60'
                          : 'bg-[#141416] border-white/[0.08]'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
                        <div className="space-y-1">
                          <h4 className="text-base font-semibold text-[#F5F5F7]">
                            Lá chắn An ninh 2 Cấp độ
                          </h4>
                          <p className="text-xs text-[#A1A1A6]">
                            Giám sát đăng nhập sai mật khẩu, spam đánh giá/phiếu hỗ trợ và tự động báo cáo về {PRIMARY_ADMIN_EMAIL}.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                              aiShield.level2EmergencyActive
                                ? 'bg-[#FF453A]/20 border-[#FF453A]/60 text-[#FF8A80]'
                                : aiShield.level === 1
                                ? 'bg-amber-500/15 border-amber-400/45 text-amber-300'
                                : 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                            }`}
                          >
                            {aiShield.level2EmergencyActive
                              ? 'Đang báo động Mức 2 (Khẩn cấp)'
                              : aiShield.level === 1
                              ? 'Cảnh báo Mức 1 (Đã tạm chặn Spam)'
                              : 'Hệ thống đang an toàn'}
                          </span>

                          {(aiShield.level > 0 || aiShield.level2EmergencyActive) && (
                            <button
                              type="button"
                              onClick={() => {
                                clearAiEmergencyShield(adminActorEmail);
                                refreshLiveData();
                                showToast(
                                  'ok',
                                  'Đã đưa trạng thái lá chắn an ninh về bình thường.'
                                );
                              }}
                              className="px-3 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs text-[#F5F5F7] cursor-pointer"
                            >
                              Đưa về bình thường
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="p-4 rounded-xl bg-black/35 border border-white/[0.07] space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-amber-300">
                              Cấp độ 1 — Chặn Spam &amp; Dò mật khẩu nhẹ
                            </span>
                            <span className="text-xs tabular-nums text-[#86868B]">
                              Đã chặn: {aiShield.threatCountLevel1} lần
                            </span>
                          </div>
                          <ul className="text-xs text-[#D1D1D6] space-y-1 list-disc pl-4">
                            <li>Kích hoạt khi nhập sai mật khẩu 3–5 lần hoặc gửi biểu mẫu lặp lại.</li>
                            <li>Tạm khóa biểu mẫu 60 giây, không làm gián đoạn du khách khác.</li>
                            <li>Tự động lưu bản sao cảnh báo gửi về {PRIMARY_ADMIN_EMAIL}.</li>
                          </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-black/35 border border-white/[0.07] space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#FF8A80]">
                              Cấp độ 2 — Báo động Tấn công Quy mô lớn
                            </span>
                            <span className="text-xs tabular-nums text-[#86868B]">
                              Báo động: {aiShield.threatCountLevel2} lần
                            </span>
                          </div>
                          <ul className="text-xs text-[#D1D1D6] space-y-1 list-disc pl-4">
                            <li>Kích hoạt khi dò mật khẩu ≥ 8 lần hoặc truy cập trái phép.</li>
                            <li>Bật cảnh báo đỏ và gợi ý Đóng băng khẩn cấp toàn trang.</li>
                            <li>Phát email gắn nhãn [KHẨN CẤP] gửi tới {PRIMARY_ADMIN_EMAIL}.</li>
                          </ul>
                        </div>
                      </div>

                      {/* KIỂM THỬ QUY TRÌNH AN NINH (DUY NHẤT TẠI ĐÂY) */}
                      <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-[#F5F5F7] flex items-center gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>Kiểm thử Quy trình Lá chắn An ninh</span>
                          </div>
                          <div className="text-[11px] text-[#86868B]">
                            Thử nghiệm tức thì cơ chế chặn Spam, cảnh báo Mức 2 và tạo bản sao email trong Hộp thư Báo cáo Admin.
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              simulateSecurityAttackLevel1(adminActorEmail);
                              refreshLiveData();
                              showToast(
                                'ok',
                                `Đã chạy thử chặn Spam (Mức 1) và tạo email cảnh báo tới ${PRIMARY_ADMIN_EMAIL}.`
                              );
                            }}
                            className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-[#F5F5F7] text-xs font-medium cursor-pointer transition-colors"
                          >
                            Thử chặn Spam
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              simulateSecurityAttackLevel2(adminActorEmail);
                              refreshLiveData();
                              showToast(
                                'err',
                                `Đã chạy thử cảnh báo Tấn công (Mức 2) và tạo email khẩn cấp tới ${PRIMARY_ADMIN_EMAIL}.`
                              );
                            }}
                            className="px-4 py-2 rounded-lg bg-[#FF453A]/20 hover:bg-[#FF453A]/35 border border-[#FF453A]/55 text-[#FF8A80] text-xs font-semibold cursor-pointer transition-colors"
                          >
                            Thử cảnh báo Tấn công
                          </button>

                          {!emergencyState.isLocked && (
                            <button
                              type="button"
                              onClick={openEmergencyLockdownWizard}
                              className="px-4 py-2 rounded-lg bg-[#FF453A] hover:bg-[#FF5B52] text-white text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Đóng băng Trang web
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    SUB-TAB 3: HỘP THƯ BÁO CÁO ADMIN (DANH SÁCH 1 DÒNG MỞ RỘNG)
                   ========================================================= */}
                {aiSubTab === 'outbox' && (
                  <div className="rounded-xl bg-[#141416] border border-white/[0.08] p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
                      <div>
                        <h4 className="text-base font-semibold text-[#F5F5F7]">
                          Hộp thư Báo cáo Admin ({PRIMARY_ADMIN_EMAIL})
                        </h4>
                        <p className="text-xs text-[#86868B] mt-0.5">
                          Bấm vào từng dòng email để xem nội dung chi tiết và mở nhanh trong Gmail.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {(
                          [
                            { id: 'all', label: `Tất cả (${aiOutbox.length})` },
                            { id: 'support_ticket', label: 'Phiếu Hỗ trợ' },
                            { id: 'security_level_1', label: 'Cảnh báo Mức 1' },
                            { id: 'security_level_2', label: 'Khẩn cấp Mức 2' },
                          ] as const
                        ).map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setOutboxFilter(f.id)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${
                              outboxFilter === f.id
                                ? 'bg-[#C5A059] text-black font-semibold'
                                : 'bg-white/[0.05] text-[#A1A1A6] hover:text-white border border-white/[0.08]'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                        {aiOutbox.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              clearAdminOutbox(adminActorEmail);
                              setExpandedOutboxId(null);
                              refreshLiveData();
                              showToast('ok', 'Đã xóa lịch sử Hộp thư Báo cáo Admin.');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-[11px] text-[#A1A1A6] hover:text-[#F5F5F7] cursor-pointer"
                          >
                            Xóa lịch sử
                          </button>
                        )}
                      </div>
                    </div>

                    {filteredOutbox.length === 0 ? (
                      <div className="py-10 text-center rounded-xl bg-black/35 border border-white/[0.06] space-y-2">
                        <Mail className="w-7 h-7 text-[#C5A059]/60 mx-auto" />
                        <div className="text-sm font-medium text-[#F5F5F7]">
                          Chưa có email báo cáo nào
                        </div>
                        <p className="text-xs text-[#86868B] max-w-md mx-auto">
                          Khi có phiếu hỗ trợ mới hoặc cảnh báo an ninh, bản sao email chuyển tiếp tới {PRIMARY_ADMIN_EMAIL} sẽ xuất hiện tại đây.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.07] rounded-xl border border-white/[0.08] bg-black/35 overflow-hidden">
                        {filteredOutbox.map((mail) => {
                          const isExpanded = expandedOutboxId === mail.id;
                          return (
                            <div key={mail.id} className="transition-colors">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedOutboxId((prev) =>
                                    prev === mail.id ? null : mail.id
                                  )
                                }
                                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-white/[0.04] cursor-pointer"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10.5px] font-medium shrink-0 border ${
                                      mail.kind === 'security_level_2'
                                        ? 'bg-[#FF453A]/15 border-[#FF453A]/45 text-[#FF8A80]'
                                        : mail.kind === 'security_level_1'
                                        ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                                        : 'bg-white/[0.06] border-white/[0.1] text-[#C5A059]'
                                    }`}
                                  >
                                    {mail.kind === 'security_level_2'
                                      ? 'Khẩn cấp'
                                      : mail.kind === 'security_level_1'
                                      ? 'Cảnh báo'
                                      : mail.ticketCode || 'Hỗ trợ'}
                                  </span>
                                  <span className="text-xs sm:text-sm font-medium text-[#F5F5F7] truncate">
                                    {mail.subject}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="hidden md:inline-block text-[11px] text-emerald-400">
                                    Đã lưu &amp; chuyển tiếp
                                  </span>
                                  <span className="text-[11px] tabular-nums text-[#86868B]">
                                    {new Date(mail.createdAt).toLocaleString('vi-VN')}
                                  </span>
                                  <ChevronDown
                                    className={`w-4 h-4 text-[#86868B] transition-transform ${
                                      isExpanded ? 'rotate-180 text-[#C5A059]' : ''
                                    }`}
                                  />
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] bg-black/30 space-y-3">
                                  <div className="text-xs text-[#E5E5EA] bg-white/[0.04] px-3 py-2 rounded-lg border border-white/[0.07]">
                                    <strong className="text-[#C5A059]">Tóm tắt:</strong> {mail.aiSummary}
                                  </div>

                                  <pre className="whitespace-pre-wrap font-sans text-xs text-[#D1D1D6] leading-relaxed p-3.5 rounded-lg bg-[#141416] border border-white/[0.07]">
                                    {mail.body}
                                  </pre>

                                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                                    <span className="text-[11px] text-[#86868B]">
                                      Tới: {mail.recipient} · Mức độ: {mail.priorityLabel}
                                    </span>

                                    <a
                                      href={mail.gmailComposeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-4 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      <span>Mở trong Gmail</span>
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ===============================================================
                MODULE 8: THÔNG TIN TÀI KHOẢN (ĐỊNH DANH, SHA-256 & KHÓA/CẤP MẬT KHẨU)
               =============================================================== */}
            {activeModule === 'accounts' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[13px] font-medium text-[#C5A059]">
                      Quản lý định danh &amp; phân hạng tài khoản
                    </span>
                    <h3 className="text-xl sm:text-2xl font-semibold text-[#F5F5F7] mt-0.5">
                      Thông tin Tài khoản Người dùng
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const snippet = exportHardcodedAccountsSnippet();
                        try {
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            await navigator.clipboard.writeText(snippet);
                          }
                          showToast(
                            'ok',
                            'Đã sao chép dữ liệu tài khoản (HARDCODED_SEEDED_ACCOUNTS) vào bộ nhớ tạm để lưu cứng vào code.'
                          );
                        } catch {
                          showToast('err', 'Không thể truy cập Clipboard trình duyệt.');
                        }
                      }}
                      className="px-3.5 py-2 rounded-lg bg-[#171817] hover:bg-[#47796D] border border-[#C9A46A]/60 text-[#D8C9A9] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#C9A46A]" />
                      <span>Sao chép dữ liệu tài khoản để lưu cứng vào code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleManualCloudSync()}
                      disabled={isSyncingCloud}
                      className="px-3.5 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D4B06A] text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                      <span>{isSyncingCloud ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                    </button>
                  </div>
                </div>

                {/* 4 THẺ THỐNG KÊ TÓM TẮT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  <div className="p-5 rounded-xl bg-[#141416] border border-white/[0.08] space-y-1.5">
                    <span className="text-[12px] font-medium text-[#86868B]">
                      Tổng số tài khoản
                    </span>
                    <div className="text-3xl font-semibold text-[#F5F5F7] tabular-nums">
                      {accountStats.total}
                    </div>
                    <div className="text-xs text-[#A1A1A6]">
                      Đã ghi nhận trong hệ thống
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#141416] border border-white/[0.08] space-y-1.5">
                    <span className="text-[12px] font-medium text-[#86868B]">
                      Đăng nhập qua Google
                    </span>
                    <div className="text-3xl font-semibold text-[#C5A059] tabular-nums">
                      {accountStats.googleCount}
                    </div>
                    <div className="text-xs text-[#A1A1A6]">
                      Xác thực Gmail &amp; SHA-256
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#141416] border border-white/[0.08] space-y-1.5">
                    <span className="text-[12px] font-medium text-[#86868B]">
                      Đăng nhập qua Facebook
                    </span>
                    <div className="text-3xl font-semibold text-[#F5F5F7] tabular-nums">
                      {accountStats.facebookCount}
                    </div>
                    <div className="text-xs text-[#A1A1A6]">
                      Tài khoản du khách mạng xã hội
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#141416] border border-white/[0.08] space-y-1.5">
                    <span className="text-[12px] font-medium text-[#86868B]">
                      Tài khoản đang bị khóa
                    </span>
                    <div
                      className={`text-3xl font-semibold tabular-nums ${
                        accountStats.lockedCount > 0 ? 'text-[#FF8A80]' : 'text-emerald-400'
                      }`}
                    >
                      {accountStats.lockedCount}
                    </div>
                    <div className="text-xs text-[#A1A1A6]">
                      {accountStats.lockedCount > 0
                        ? 'Đã vô hiệu hóa quyền đăng nhập'
                        : 'Tất cả tài khoản đang hoạt động'}
                    </div>
                  </div>
                </div>

                {/* THANH TÌM KIẾM & BỘ LỌC KÊNH */}
                <div className="rounded-xl bg-[#141416] border border-white/[0.08] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      placeholder="Tìm theo Tên hiển thị, Email hoặc ID tài khoản..."
                      className="w-full h-10 pl-10 pr-4 rounded-lg bg-black/50 border border-white/[0.12] focus:border-[#C5A059] focus:outline-none text-xs sm:text-sm text-[#F5F5F7] placeholder:text-[#636366]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'Tất cả' },
                        { id: 'google', label: 'Google' },
                        { id: 'facebook', label: 'Facebook' },
                        { id: 'labs', label: 'Tài khoản Thử nghiệm' },
                        { id: 'active', label: 'Đang hoạt động' },
                        { id: 'locked', label: 'Bị khóa' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setAccountFilter(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          accountFilter === f.id
                            ? 'bg-[#C5A059] text-black font-semibold'
                            : 'bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-[#A1A1A6]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PHÂN QUYỀN VAI TRÒ KIỂM THỬ VIÊN (TESTER · FIREBASE RTDB /users/{uid}/role) */}
                <div className="rounded-xl bg-[#141416] border border-[#C9A46A]/30 p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-[#C9A46A] shrink-0" />
                        <h4 className="text-sm font-semibold text-[#F5F5F7]">
                          Cấp quyền Kiểm thử viên (Tester · Firebase RTDB)
                        </h4>
                      </div>
                      <p className="text-xs text-[#A1A1A6] mt-1 leading-relaxed">
                        Nhập Email hoặc chọn người dùng từ Firebase Realtime Database để gắn vai trò{' '}
                        <code className="text-[#C9A46A] bg-black/50 px-1.5 py-0.5 rounded">
                          /users/{'{uid}'}/role = &quot;tester&quot;
                        </code>
                        . Tài khoản Tester mở khóa đầy đủ 17 di tích &amp; Gemini 4 Hydrogen, thấy mục Gemini 4 Argon ở trạng thái khóa cứng.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void refreshFirebaseUsersDirectory()}
                      disabled={isLoadingFirebaseUsers}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-[#D8C9A9] cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFirebaseUsers ? 'animate-spin' : ''}`} />
                      <span>Tải DS Firebase ({firebaseUsersList.length})</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Cách 1: Nhập Email trực tiếp */}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const normEmail = testerAssignEmail.trim().toLowerCase();
                        if (!normEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
                          showToast('err', 'Vui lòng nhập địa chỉ Email hợp lệ để gắn vai trò Tester.');
                          return;
                        }
                        setIsUpdatingTesterRole(true);
                        try {
                          const matchedAcc = accountDirectory.find(
                            (a) => a.accountIdentifier.toLowerCase() === normEmail
                          );
                          const matchedFb = firebaseUsersList.find(
                            (u) => u.email.toLowerCase() === normEmail
                          );
                          const targetUid = matchedFb?.uid || matchedAcc?.userId || normEmail;
                          addTesterAllowlistEmail(normEmail, adminActorEmail);
                          if (matchedAcc && matchedAcc.role !== 'admin') {
                            setUserBetaTester({
                              userId: matchedAcc.userId,
                              isBetaTester: true,
                              adminEmail: adminActorEmail,
                              accountHint: {
                                provider: matchedAcc.provider,
                                displayName: matchedAcc.displayName,
                                accountIdentifier: matchedAcc.accountIdentifier,
                                role: matchedAcc.role,
                              },
                            });
                          }
                          const syncRes = await syncUserRoleToFirebaseRealtimeDb({
                            uid: targetUid,
                            email: normEmail,
                            role: 'tester',
                            displayName: matchedAcc?.displayName || matchedFb?.displayName || normEmail,
                          });
                          setTesterAssignEmail('');
                          refreshLiveData();
                          refreshEntitlements();
                          await refreshFirebaseUsersDirectory();
                          showToast(
                            'ok',
                            syncRes.syncedFirebase
                              ? `Đã gắn vai trò Tester cho ${normEmail} và lưu tại /users/${syncRes.pathKey}/role = "tester".`
                              : `Đã gắn vai trò Tester cục bộ cho ${normEmail}.`
                          );
                        } finally {
                          setIsUpdatingTesterRole(false);
                        }
                      }}
                      className="flex flex-col sm:flex-row gap-2"
                    >
                      <input
                        type="email"
                        value={testerAssignEmail}
                        onChange={(e) => setTesterAssignEmail(e.target.value)}
                        placeholder="Nhập Email cộng tác viên kiểm thử (VD: qa@gmail.com)..."
                        className="flex-1 h-9 px-3 rounded-lg bg-black/50 border border-white/[0.12] focus:border-[#C9A46A] focus:outline-none text-xs text-[#F5F5F7] placeholder:text-[#636366]"
                      />
                      <button
                        type="submit"
                        disabled={isUpdatingTesterRole}
                        className="h-9 px-3.5 rounded-lg bg-[#47796D] hover:bg-[#3A655A] text-[#F5EFE6] text-xs font-semibold cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                      >
                        Gắn vai trò Tester
                      </button>
                    </form>

                    {/* Cách 2: Chọn trực tiếp từ danh sách người dùng Firebase RTDB */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={testerSelectedFirebaseKey}
                        onChange={(e) => setTesterSelectedFirebaseKey(e.target.value)}
                        aria-label="Chọn tài khoản từ Firebase Realtime Database"
                        className="flex-1 h-9 px-3 rounded-lg bg-black/50 border border-white/[0.12] focus:border-[#C9A46A] focus:outline-none text-xs text-[#F5F5F7]"
                      >
                        <option value="">
                          -- Chọn tài khoản từ Firebase RTDB / Danh bạ --
                        </option>
                        {(() => {
                          const mergedMap = new Map<
                            string,
                            { uid: string; email: string; displayName: string; role: string }
                          >();
                          for (const fb of firebaseUsersList) {
                            if (fb.role === 'admin') continue;
                            const key = (fb.email || fb.uid).toLowerCase();
                            mergedMap.set(key, {
                              uid: fb.uid,
                              email: fb.email,
                              displayName: fb.displayName,
                              role: fb.role,
                            });
                          }
                          for (const acc of accountDirectory) {
                            if (acc.role === 'admin' || acc.isPrimaryAdmin) continue;
                            const email = acc.accountIdentifier.includes('@')
                              ? acc.accountIdentifier.toLowerCase()
                              : '';
                            const key = email || acc.userId;
                            if (!mergedMap.has(key)) {
                              mergedMap.set(key, {
                                uid: acc.userId,
                                email: email || acc.accountIdentifier,
                                displayName: acc.displayName,
                                role: acc.isBetaTester ? 'tester' : 'visitor',
                              });
                            }
                          }
                          return Array.from(mergedMap.entries()).map(([k, item]) => (
                            <option key={k} value={`${item.uid}|||${item.email}|||${item.displayName}`}>
                              {item.displayName} ({item.email}) {item.role === 'tester' ? '[Đang là Tester]' : ''}
                            </option>
                          ));
                        })()}
                      </select>
                      <button
                        type="button"
                        disabled={!testerSelectedFirebaseKey || isUpdatingTesterRole}
                        onClick={async () => {
                          const [uid, email, displayName] = testerSelectedFirebaseKey.split('|||');
                          if (!uid && !email) return;
                          setIsUpdatingTesterRole(true);
                          try {
                            const normEmail = (email || '').toLowerCase().trim();
                            if (normEmail && normEmail.includes('@')) {
                              addTesterAllowlistEmail(normEmail, adminActorEmail);
                            }
                            const matchedAcc = accountDirectory.find(
                              (a) =>
                                a.userId === uid ||
                                (normEmail && a.accountIdentifier.toLowerCase() === normEmail)
                            );
                            if (matchedAcc && matchedAcc.role !== 'admin') {
                              setUserBetaTester({
                                userId: matchedAcc.userId,
                                isBetaTester: true,
                                adminEmail: adminActorEmail,
                                accountHint: {
                                  provider: matchedAcc.provider,
                                  displayName: matchedAcc.displayName,
                                  accountIdentifier: matchedAcc.accountIdentifier,
                                  role: matchedAcc.role,
                                },
                              });
                            }
                            const syncRes = await syncUserRoleToFirebaseRealtimeDb({
                              uid: uid || normEmail,
                              email: normEmail || undefined,
                              role: 'tester',
                              displayName: displayName || normEmail || uid,
                            });
                            setTesterSelectedFirebaseKey('');
                            refreshLiveData();
                            refreshEntitlements();
                            await refreshFirebaseUsersDirectory();
                            showToast(
                              'ok',
                              syncRes.syncedFirebase
                                ? `Đã cấp quyền Tester cho ${displayName || normEmail} (/users/${syncRes.pathKey}/role = "tester").`
                                : `Đã cấp quyền Tester cho ${displayName || normEmail}.`
                            );
                          } finally {
                            setIsUpdatingTesterRole(false);
                          }
                        }}
                        className="h-9 px-3.5 rounded-lg bg-[#C9A46A] hover:bg-[#D8C9A9] text-[#171817] text-xs font-semibold cursor-pointer transition-colors shrink-0 disabled:opacity-45 disabled:cursor-not-allowed"
                      >
                        Cấp quyền Tester
                      </button>
                    </div>
                  </div>

                  {/* Danh sách tài khoản đang giữ vai trò Tester */}
                  {(() => {
                    const activeTestersMap = new Map<
                      string,
                      { email: string; uid?: string; displayName?: string }
                    >();
                    for (const em of testerAllowlist) {
                      const norm = em.toLowerCase().trim();
                      if (norm) activeTestersMap.set(norm, { email: norm });
                    }
                    for (const fb of firebaseUsersList) {
                      if (fb.role === 'tester') {
                        const key = (fb.email || fb.uid).toLowerCase();
                        activeTestersMap.set(key, {
                          email: fb.email || fb.uid,
                          uid: fb.uid,
                          displayName: fb.displayName,
                        });
                      }
                    }
                    for (const acc of accountDirectory) {
                      if (acc.isBetaTester && acc.role !== 'admin') {
                        const key = acc.accountIdentifier.toLowerCase();
                        const prev = activeTestersMap.get(key);
                        activeTestersMap.set(key, {
                          email: acc.accountIdentifier,
                          uid: prev?.uid || acc.userId,
                          displayName: acc.displayName,
                        });
                      }
                    }
                    const activeTesters = Array.from(activeTestersMap.values());
                    if (activeTesters.length === 0) {
                      return (
                        <div className="text-xs text-[#86868B] italic">
                          Chưa có tài khoản nào được gắn vai trò Tester.
                        </div>
                      );
                    }
                    return (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {activeTesters.map((tItem) => (
                          <span
                            key={`${tItem.email}-${tItem.uid || ''}`}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171817] border border-[#47796D] text-xs text-[#D8C9A9]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#47796D]" />
                            <span className="font-medium">
                              {tItem.displayName && tItem.displayName !== tItem.email
                                ? `${tItem.displayName} · ${tItem.email}`
                                : tItem.email}
                            </span>
                            <button
                              type="button"
                              onClick={async () => {
                                const norm = tItem.email.toLowerCase().trim();
                                removeTesterAllowlistEmail(norm, adminActorEmail);
                                const matchedAcc = accountDirectory.find(
                                  (a) =>
                                    a.userId === tItem.uid ||
                                    a.accountIdentifier.toLowerCase() === norm
                                );
                                if (matchedAcc && matchedAcc.role !== 'admin') {
                                  setUserBetaTester({
                                    userId: matchedAcc.userId,
                                    isBetaTester: false,
                                    adminEmail: adminActorEmail,
                                    accountHint: {
                                      provider: matchedAcc.provider,
                                      displayName: matchedAcc.displayName,
                                      accountIdentifier: matchedAcc.accountIdentifier,
                                      role: matchedAcc.role,
                                    },
                                  });
                                }
                                await syncUserRoleToFirebaseRealtimeDb({
                                  uid: tItem.uid || norm,
                                  email: norm.includes('@') ? norm : undefined,
                                  role: 'visitor',
                                  displayName: tItem.displayName,
                                });
                                refreshLiveData();
                                refreshEntitlements();
                                await refreshFirebaseUsersDirectory();
                                showToast(
                                  'ok',
                                  `Đã thu hồi vai trò Tester của ${tItem.email} (đặt lại role = "visitor").`
                                );
                              }}
                              aria-label={`Thu hồi Tester của ${tItem.email}`}
                              className="text-[#D8C9A9]/70 hover:text-[#A94F3D] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* DANH SÁCH ĐỊNH DANH & MÃ HÓA BẢO MẬT */}
                <div className="rounded-xl bg-[#141416] border border-white/[0.08] p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                    <h4 className="text-sm font-semibold text-[#F5F5F7]">
                      Danh sách Tài khoản &amp; Trạng thái Mã hóa ({filteredAccounts.length})
                    </h4>
                    <span className="text-[11px] text-[#86868B]">
                      Mật khẩu được bảo vệ bằng hàm băm SHA-256 một chiều, không lưu bản gốc
                    </span>
                  </div>

                  {filteredAccounts.length === 0 ? (
                    <div className="py-10 text-center rounded-xl bg-black/30 border border-white/[0.06] space-y-1.5">
                      <Users className="w-7 h-7 text-[#86868B] mx-auto" />
                      <div className="text-sm font-medium text-[#F5F5F7]">
                        Không tìm thấy tài khoản phù hợp
                      </div>
                      <p className="text-xs text-[#86868B]">
                        Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái phía trên.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredAccounts.map((acc) => {
                        const initials = acc.displayName
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((w) => w[0]?.toUpperCase() || '')
                          .join('') || 'DA';

                        return (
                          <div
                            key={acc.userId}
                            className={`rounded-xl border p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 ${
                              acc.isLocked
                                ? 'bg-[#221215]/75 border-[#FF453A]/40'
                                : 'bg-black/35 border-white/[0.07]'
                            }`}
                          >
                            <div className="flex items-start gap-3.5 min-w-0 flex-1">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                                  acc.isPrimaryAdmin
                                    ? 'bg-[#C5A059]/20 border-[#C5A059]/50 text-[#C5A059]'
                                    : acc.isLocked
                                    ? 'bg-[#FF453A]/15 border-[#FF453A]/40 text-[#FF8A80]'
                                    : 'bg-white/[0.06] border-white/[0.1] text-[#F5F5F7]'
                                }`}
                              >
                                {initials}
                              </div>

                              <div className="min-w-0 space-y-1.5 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-[#F5F5F7]">
                                    {acc.displayName}
                                  </span>
                                  {acc.role === 'admin' ? (
                                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#C9A46A] text-[#171817]">
                                      {acc.isPrimaryAdmin ? 'Quản trị viên gốc' : 'Quản trị viên'}
                                    </span>
                                  ) : acc.isBetaTester ? (
                                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#47796D] text-[#D8C9A9]">
                                      Tester Pro
                                    </span>
                                  ) : acc.userTier === 'pro' ? (
                                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#171817] border border-[#C9A46A] text-[#C9A46A]">
                                      Pro
                                    </span>
                                  ) : acc.userTier === 'plus' ? (
                                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-[#526D8B] text-[#D8C9A9]">
                                      Plus
                                    </span>
                                  ) : (
                                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide bg-white/[0.08] text-[#D8C9A9]/75">
                                      Free
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[10.5px] text-[#A1A1A6]">
                                    {acc.provider === 'google' ? 'Google' : 'Facebook'}
                                  </span>
                                  {acc.isLocked && (
                                    <span className="px-2 py-0.5 rounded bg-[#A94F3D]/25 border border-[#A94F3D] text-[10.5px] font-semibold text-[#D8C9A9]">
                                      Đang bị khóa
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs text-[#D1D1D6] flex flex-wrap items-center gap-x-4 gap-y-1">
                                  <span>
                                    Tài khoản:{' '}
                                    <strong className="font-semibold text-[#F5F5F7]">
                                      {acc.accountIdentifier}
                                    </strong>
                                  </span>
                                  <span className="text-[#86868B] tabular-nums text-[11px]">
                                    ID: {acc.userId}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                  {acc.hasPasswordHash ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/35 text-[11px] text-emerald-300">
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>Đã mã hóa SHA-256</span>
                                      <code className="tabular-nums text-[11px] text-emerald-200/90 ml-1">
                                        {acc.sha256Preview}
                                      </code>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[11px] text-[#A1A1A6]">
                                      <Lock className="w-3 h-3" />
                                      <span>{acc.sha256Preview}</span>
                                    </span>
                                  )}

                                  <span className="text-[11px] tabular-nums text-[#86868B]">
                                    Tạo ngày {new Date(acc.createdAt).toLocaleDateString('vi-VN')} ·{' '}
                                    {acc.ticketsCount} vé đã đặt ·{' '}
                                    {acc.exploredSitesCount}/17 di tích đã xem
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* HÀNH ĐỘNG ADMIN */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {/* Phân hạng tài khoản thủ công: Free / Plus (19k) / Pro (49k) */}
                              {acc.role !== 'admin' && !acc.isPrimaryAdmin && (
                                <div className="px-2 py-1 rounded-lg bg-[#0E0E10] border border-white/[0.08] flex items-center gap-1">
                                  {(
                                    [
                                      { id: 'free' as UserAccountTier, label: 'Free' },
                                      { id: 'plus' as UserAccountTier, label: 'Plus (19k)' },
                                      { id: 'pro' as UserAccountTier, label: 'Pro (49k)' },
                                    ] as const
                                  ).map((tierOpt) => {
                                    const isCurrent = (acc.userTier || 'free') === tierOpt.id;
                                    return (
                                      <button
                                        key={tierOpt.id}
                                        type="button"
                                        onClick={() => {
                                          const targetEmail = acc.accountIdentifier.includes('@')
                                            ? acc.accountIdentifier
                                            : acc.userId;
                                          setUserAccountTierByAdmin({
                                            userId: acc.userId,
                                            email: targetEmail,
                                            tier: tierOpt.id,
                                            adminEmail: adminActorEmail,
                                          });
                                          refreshLiveData();
                                          refreshEntitlements();
                                          showToast(
                                            'ok',
                                            `Đã cập nhật hạng tài khoản ${acc.displayName} → ${tierOpt.label}.`
                                          );
                                        }}
                                        className={`px-2 py-1 rounded-full text-[10.5px] font-semibold transition-colors cursor-pointer ${
                                          isCurrent
                                            ? tierOpt.id === 'pro'
                                              ? 'bg-[#171817] border border-[#C9A46A] text-[#C9A46A]'
                                              : tierOpt.id === 'plus'
                                              ? 'bg-[#526D8B] text-[#D8C9A9]'
                                              : 'bg-[#D8C9A9] text-[#171817]'
                                            : 'text-[#A1A1A6] hover:text-white hover:bg-white/[0.06]'
                                        }`}
                                      >
                                        {tierOpt.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Công tắc cấp quyền Tài khoản Thử nghiệm (Labs) */}
                              <div className="px-3 py-1.5 rounded-lg bg-[#0E0E10] border border-white/[0.08] flex items-center gap-2.5">
                                <span className="text-[11.5px] font-medium text-[#FAF8F5]">
                                  Tài khoản Thử nghiệm
                                </span>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={acc.role === 'admin' || acc.isBetaTester}
                                  disabled={acc.isPrimaryAdmin || acc.role === 'admin'}
                                  onClick={async () => {
                                    const nextState = !acc.isBetaTester;
                                    const res = setUserBetaTester({
                                      userId: acc.userId,
                                      isBetaTester: nextState,
                                      adminEmail: adminActorEmail,
                                      accountHint: {
                                        provider: acc.provider,
                                        displayName: acc.displayName,
                                        accountIdentifier: acc.accountIdentifier,
                                        role: acc.role,
                                      },
                                    });
                                    if (!res.ok) {
                                      showToast('err', res.error || 'Không thể cập nhật quyền Tester.');
                                      return;
                                    }
                                    const normEmail = acc.accountIdentifier.includes('@')
                                      ? acc.accountIdentifier.toLowerCase().trim()
                                      : '';
                                    if (normEmail) {
                                      if (nextState) {
                                        addTesterAllowlistEmail(normEmail, adminActorEmail);
                                      } else {
                                        removeTesterAllowlistEmail(normEmail, adminActorEmail);
                                      }
                                    }
                                    const matchedFb = firebaseUsersList.find(
                                      (u) => normEmail && u.email.toLowerCase() === normEmail
                                    );
                                    await syncUserRoleToFirebaseRealtimeDb({
                                      uid: matchedFb?.uid || acc.userId,
                                      email: normEmail || undefined,
                                      role: nextState ? 'tester' : 'visitor',
                                      displayName: acc.displayName,
                                    });
                                    refreshLiveData();
                                    refreshEntitlements();
                                    void refreshFirebaseUsersDirectory();
                                    showToast(
                                      'ok',
                                      nextState
                                        ? `Đã gắn vai trò Tester cho ${acc.displayName} (/users/${matchedFb?.uid || acc.userId}/role = "tester").`
                                        : `Đã gỡ vai trò Tester cho ${acc.displayName}.`
                                    );
                                  }}
                                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
                                    acc.role === 'admin' || acc.isBetaTester
                                      ? 'bg-[#C8A96E] border-[#C8A96E]'
                                      : 'bg-[#27272A] border-white/[0.12]'
                                  } ${
                                    acc.isPrimaryAdmin || acc.role === 'admin'
                                      ? 'opacity-70 cursor-default'
                                      : 'cursor-pointer'
                                  }`}
                                  title={
                                    acc.isPrimaryAdmin || acc.role === 'admin'
                                      ? 'Quản trị viên luôn có quyền Dấu Ấn Labs'
                                      : 'Bật / Tắt quyền Dấu Ấn Labs'
                                  }
                                >
                                  <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
                                      acc.role === 'admin' || acc.isBetaTester
                                        ? 'translate-x-4 bg-[#0E0E10]'
                                        : 'translate-x-0.5 bg-[#8E8E93]'
                                    }`}
                                  />
                                </button>
                              </div>

                              {acc.isPrimaryAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveModule('permissions')}
                                  className="px-3.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.1] text-xs font-medium text-[#D1D1D6] cursor-pointer transition-colors"
                                >
                                  Đổi mật khẩu tại Phân quyền
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setResetPwdTarget(acc);
                                      setResetPwdValue('');
                                      setResetPwdConfirm('');
                                      setShowResetPwd(false);
                                    }}
                                    className="px-3.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.1] text-xs font-medium text-[#F5F5F7] flex items-center gap-1.5 cursor-pointer transition-colors"
                                  >
                                    <KeyRound className="w-3.5 h-3.5 text-[#C5A059]" />
                                    <span>Cấp lại mật khẩu</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextLock = !acc.isLocked;
                                      const res = setUserAccountLock({
                                        userId: acc.userId,
                                        locked: nextLock,
                                        adminEmail: adminActorEmail,
                                      });
                                      if (!res.ok) {
                                        showToast('err', res.error || 'Không thể cập nhật trạng thái tài khoản.');
                                        return;
                                      }
                                      refreshLiveData();
                                      showToast(
                                        'ok',
                                        nextLock
                                          ? `Đã khóa tài khoản ${acc.displayName}. Người dùng này không thể đăng nhập cho tới khi được mở khóa.`
                                          : `Đã mở khóa tài khoản ${acc.displayName}. Quyền đăng nhập đã được khôi phục.`
                                      );
                                    }}
                                    className={`px-3.5 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                                      acc.isLocked
                                        ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-400/40 text-emerald-300'
                                        : 'bg-[#FF453A]/15 hover:bg-[#FF453A]/25 border-[#FF453A]/45 text-[#FF8A80]'
                                    }`}
                                  >
                                    {acc.isLocked ? (
                                      <>
                                        <Unlock className="w-3.5 h-3.5" />
                                        <span>Mở khóa tài khoản</span>
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="w-3.5 h-3.5" />
                                        <span>Khóa tài khoản</span>
                                      </>
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===============================================================
                MODULE 8B: PHÒNG THÍ NGHIỆM (LABS) — CẤP QUYỀN & BẢNG ĐIỀU KHIỂN
               =============================================================== */}
            {activeModule === 'labs' && (
              <div className="space-y-6">
                {/* Editorial Minimalist Module Header */}
                <div className="pb-4 border-b border-white/[0.08] flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span className="w-[2px] h-10 bg-[#C8A96E] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <span className="text-[12px] font-medium text-[#C8A96E]">
                        {appLang === 'en'
                          ? 'Dấu Ấn Labs · Experimental Orchestration'
                          : appLang === 'zh'
                          ? '印记实验室 · 实验功能调度'
                          : 'Dấu Ấn Labs · Điều phối Thử nghiệm'}
                      </span>
                      <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#FAF8F5] tracking-tight mt-0.5">
                        {appLang === 'en'
                          ? 'Experimental Labs'
                          : appLang === 'zh'
                          ? '实验室 (Labs)'
                          : 'Phòng Thí nghiệm (Labs)'}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-[#8E8E93] mt-1">
                        {appLang === 'en'
                          ? 'Grant Beta Tester permissions and centrally toggle experimental features across the platform.'
                          : appLang === 'zh'
                          ? '授予内测体验官权限并集中开关全站实验功能。'
                          : 'Cấp quyền Tài khoản Thử nghiệm và bật/tắt tập trung các tính năng thử nghiệm toàn hệ thống.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleManualCloudSync()}
                    disabled={isSyncingCloud}
                    className="px-3.5 py-2 rounded-lg bg-[#141416] hover:bg-white/[0.06] border border-white/[0.08] text-[#FAF8F5] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 text-[#C8A96E] ${isSyncingCloud ? 'animate-spin' : ''}`} />
                    <span>
                      {isSyncingCloud
                        ? appLang === 'en'
                          ? 'Syncing...'
                          : appLang === 'zh'
                          ? '同步中...'
                          : 'Đang đồng bộ...'
                        : appLang === 'en'
                        ? 'Cloud Sync'
                        : appLang === 'zh'
                        ? '云端同步'
                        : 'Đồng bộ Cloud'}
                    </span>
                  </button>
                </div>

                {/* PHẦN TRÊN: CẤP QUYỀN TÀI KHOẢN THỬ NGHIỆM */}
                <div className="rounded-2xl bg-[#141416] border border-white/[0.08] p-5 sm:p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3.5">
                    <div>
                      <h4 className="font-serif text-base sm:text-lg font-medium text-[#FAF8F5]">
                        {appLang === 'en'
                          ? 'Grant Beta Tester Access'
                          : appLang === 'zh'
                          ? '授予内测体验官权限'
                          : 'Cấp quyền Tài khoản Thử nghiệm'}
                      </h4>
                      <p className="text-xs text-[#8E8E93] mt-0.5">
                        {appLang === 'en' ? (
                          <>
                            Find account by Email, enable <code className="text-[#C8A96E]">isBetaTester</code> and sync immediately to Cloud API.
                          </>
                        ) : appLang === 'zh' ? (
                          <>
                            通过邮箱查找账户，开启 <code className="text-[#C8A96E]">isBetaTester</code> 标记并即时同步至云端 API。
                          </>
                        ) : (
                          <>
                            Tìm tài khoản theo Email, bật cờ <code className="text-[#C8A96E]">isBetaTester</code> và đồng bộ tức thì lên Cloud API.
                          </>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-[#8E8E93] tabular-nums">
                      {appLang === 'en'
                        ? `${betaTesterAccounts.length} Beta Tester accounts`
                        : appLang === 'zh'
                        ? `${betaTesterAccounts.length} 个内测账户`
                        : `${betaTesterAccounts.length} tài khoản Beta Tester`}
                    </span>
                  </div>

                  <form
                    onSubmit={(e) => void handleGrantBetaTesterByEmail(e)}
                    className="flex flex-col sm:flex-row gap-2.5"
                  >
                    <input
                      type="email"
                      value={labsEmailInput}
                      onChange={(e) => {
                        setLabsEmailInput(e.target.value);
                        if (labsGrantNotice) setLabsGrantNotice(null);
                      }}
                      placeholder={
                        appLang === 'en'
                          ? 'Enter user email to grant Beta Tester access...'
                          : appLang === 'zh'
                          ? '输入需要授予内测权限的用户邮箱...'
                          : 'Nhập email người dùng cần cấp quyền thử nghiệm...'
                      }
                      className="flex-1 h-10 px-3.5 rounded-lg bg-[#0E0E10] border border-white/[0.1] focus:border-[#C8A96E] focus:outline-none text-xs sm:text-sm text-[#FAF8F5] placeholder:text-[#636366]"
                    />
                    <button
                      type="submit"
                      disabled={isGrantingBeta}
                      className="h-10 px-5 rounded-lg bg-[#C8A96E] hover:bg-[#D4B87E] disabled:opacity-60 text-[#0E0E10] text-xs sm:text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors"
                    >
                      {isGrantingBeta
                        ? appLang === 'en'
                          ? 'Processing & syncing...'
                          : appLang === 'zh'
                          ? '处理与同步中...'
                          : 'Đang xử lý & đồng bộ...'
                        : appLang === 'en'
                        ? 'Grant Beta Access'
                        : appLang === 'zh'
                        ? '授予内测权限'
                        : 'Cấp quyền thử nghiệm'}
                    </button>
                  </form>

                  {labsGrantNotice && (
                    <div
                      className={`px-3.5 py-2.5 rounded-lg border text-xs leading-relaxed flex items-center gap-2 ${
                        labsGrantNotice.type === 'ok'
                          ? 'bg-[#0E0E10] border-[#C8A96E]/40 text-[#FAF8F5]'
                          : 'bg-[#1D1214] border-rose-500/35 text-rose-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          labsGrantNotice.type === 'ok' ? 'bg-[#C8A96E]' : 'bg-rose-400'
                        }`}
                      />
                      <span>{labsGrantNotice.text}</span>
                    </div>
                  )}

                  {/* Danh sách tài khoản đang được cấp quyền thử nghiệm */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#8E8E93]">
                        {appLang === 'en'
                          ? 'Active Beta Tester Accounts'
                          : appLang === 'zh'
                          ? '当前生效的内测体验官账户'
                          : 'Danh sách Tài khoản Thử nghiệm đang hoạt động'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAccountFilter('all');
                          setActiveModule('accounts');
                        }}
                        className="text-xs text-[#C8A96E] hover:underline cursor-pointer"
                      >
                        {appLang === 'en'
                          ? 'Open full directory'
                          : appLang === 'zh'
                          ? '打开完整名录'
                          : 'Mở danh bạ đầy đủ'}
                      </button>
                    </div>

                    {betaTesterAccounts.length === 0 ? (
                      <div className="py-6 px-4 rounded-xl bg-[#0E0E10] border border-white/[0.06] text-center space-y-1">
                        <div className="text-xs sm:text-[13px] font-medium text-[#FAF8F5]">
                          {appLang === 'en'
                            ? 'No visitor accounts have been granted Beta Tester access yet'
                            : appLang === 'zh'
                            ? '暂无游客账户获授内测体验官权限'
                            : 'Chưa có tài khoản du khách nào được cấp quyền Thử nghiệm'}
                        </div>
                        <p className="text-xs text-[#8E8E93]">
                          {appLang === 'en'
                            ? 'Enter a user email above to grant early access to Labs features.'
                            : appLang === 'zh'
                            ? '在上方输入框填写用户邮箱即可授予 Labs 实验功能抢先体验权限。'
                            : 'Nhập email người dùng ở khung phía trên để cấp quyền trải nghiệm sớm các tính năng Labs.'}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.08] rounded-xl bg-[#0E0E10] border border-white/[0.08]">
                        {betaTesterAccounts.map((acc) => (
                          <div
                            key={acc.userId}
                            className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs sm:text-[13px] font-medium text-[#FAF8F5] truncate">
                                  {acc.displayName}
                                </span>
                                <span className="px-2 py-0.5 rounded border border-[#C8A96E]/35 text-[10.5px] font-medium text-[#C8A96E]">
                                  {appLang === 'en'
                                    ? 'Beta Tester Account'
                                    : appLang === 'zh'
                                    ? '内测体验官账户'
                                    : 'Tài khoản Thử nghiệm'}
                                </span>
                              </div>
                              <div className="text-[11.5px] text-[#8E8E93] truncate">
                                {acc.accountIdentifier} · {acc.provider === 'google' ? 'Google' : 'Facebook'}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const res = setUserBetaTester({
                                  userId: acc.userId,
                                  isBetaTester: false,
                                  adminEmail: adminActorEmail,
                                  accountHint: {
                                    provider: acc.provider,
                                    displayName: acc.displayName,
                                    accountIdentifier: acc.accountIdentifier,
                                    role: acc.role,
                                  },
                                });
                                if (!res.ok) {
                                  showToast('err', res.error || 'Không thể thu hồi quyền.');
                                  return;
                                }
                                refreshLiveData();
                                showToast('ok', `Đã thu hồi quyền Tài khoản Thử nghiệm của ${acc.displayName}.`);
                              }}
                              className="px-3 py-1.5 rounded-lg border border-white/[0.1] hover:border-white/25 text-xs text-[#8E8E93] hover:text-[#FAF8F5] transition-colors cursor-pointer self-start sm:self-center shrink-0"
                            >
                              {appLang === 'en'
                                ? 'Revoke Access'
                                : appLang === 'zh'
                                ? '撤销权限'
                                : 'Thu hồi quyền'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Danh sách Email Tester Pro (Allowlist — Tự động cấp quyền ngay khi đăng nhập) */}
                  <div className="pt-4 mt-2 border-t border-white/[0.08] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h5 className="text-sm font-medium text-[#FAF8F5]">
                          {appLang === 'en'
                            ? 'Tester Pro Email Allowlist'
                            : appLang === 'zh'
                            ? 'Tester Pro 邮箱白名单'
                            : 'Danh sách Email Tester Pro (Allowlist)'}
                        </h5>
                        <p className="text-[11.5px] text-[#8E8E93]">
                          {appLang === 'en'
                            ? 'Emails listed here automatically receive Tester Pro privileges upon sign-in (works before first login).'
                            : appLang === 'zh'
                            ? '名单中的邮箱在登录后将自动获得 Tester Pro 全部测试权限。'
                            : 'Email trong danh sách tự động nhận huy hiệu & full quyền Tester Pro khi đăng nhập (không cần chờ đăng nhập trước).'}
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#47796D]/25 border border-[#47796D] text-[11px] font-semibold text-[#D8C9A9] tabular-nums">
                        {testerAllowlist.length} email
                      </span>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const targetEmail = allowlistEmailInput.trim().toLowerCase();
                        const res = addTesterAllowlistEmail(targetEmail, adminActorEmail);
                        if (!res.ok) {
                          showToast('err', res.error || 'Không thể thêm email vào danh sách Tester Pro.');
                          return;
                        }
                        await syncUserRoleToFirebaseRealtimeDb({
                          email: targetEmail,
                          role: 'tester',
                        });
                        setAllowlistEmailInput('');
                        refreshLiveData();
                        refreshEntitlements();
                        showToast('ok', `Đã gắn vai trò Tester & đồng bộ Firebase RTDB cho ${targetEmail}.`);
                      }}
                      className="flex flex-col sm:flex-row gap-2"
                    >
                      <input
                        type="email"
                        value={allowlistEmailInput}
                        onChange={(e) => setAllowlistEmailInput(e.target.value)}
                        placeholder={
                          appLang === 'en'
                            ? 'Enter tester email (e.g. qa@example.com)...'
                            : appLang === 'zh'
                            ? '输入测试人员邮箱...'
                            : 'Nhập email Người thử nghiệm (VD: qa@domain.com)...'
                        }
                        className="flex-1 h-9 px-3 rounded-lg bg-[#0E0E10] border border-white/[0.1] focus:border-[#47796D] focus:outline-none text-xs text-[#FAF8F5] placeholder:text-[#636366]"
                      />
                      <button
                        type="submit"
                        className="h-9 px-4 rounded-lg bg-[#47796D] hover:bg-[#3A655A] text-[#D8C9A9] text-xs font-semibold cursor-pointer transition-colors shrink-0"
                      >
                        {appLang === 'en'
                          ? 'Add to Allowlist'
                          : appLang === 'zh'
                          ? '加入白名单'
                          : 'Thêm Email Tester Pro'}
                      </button>
                    </form>

                    {testerAllowlist.length === 0 ? (
                      <div className="text-[11.5px] text-[#8E8E93] italic">
                        {appLang === 'en'
                          ? 'No emails in Tester Pro allowlist yet.'
                          : appLang === 'zh'
                          ? '白名单中暂无邮箱。'
                          : 'Chưa có email nào trong danh sách Tester Pro Allowlist.'}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {testerAllowlist.map((emailItem) => (
                          <span
                            key={emailItem}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171817] border border-[#47796D] text-xs text-[#D8C9A9]"
                          >
                            <span>{emailItem}</span>
                            <button
                              type="button"
                              onClick={async () => {
                                removeTesterAllowlistEmail(emailItem, adminActorEmail);
                                await syncUserRoleToFirebaseRealtimeDb({
                                  email: emailItem,
                                  role: 'visitor',
                                });
                                refreshLiveData();
                                refreshEntitlements();
                                showToast('ok', `Đã gỡ ${emailItem} khỏi danh sách Tester.`);
                              }}
                              aria-label={`Gỡ ${emailItem}`}
                              className="text-[#D8C9A9]/70 hover:text-[#A94F3D] cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* PHẦN DƯỚI: BẢNG ĐIỀU KHIỂN TÍNH NĂNG THỬ NGHIỆM */}
                <div className="rounded-2xl bg-[#141416] border border-white/[0.08] p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3.5">
                    <div>
                      <h4 className="font-serif text-base sm:text-lg font-medium text-[#FAF8F5]">
                        {appLang === 'en'
                          ? 'Experimental Features Control Panel'
                          : appLang === 'zh'
                          ? '实验功能控制面板'
                          : 'Bảng điều khiển Tính năng Thử nghiệm'}
                      </h4>
                      <p className="text-xs text-[#8E8E93] mt-0.5">
                        {appLang === 'en' ? (
                          <>
                            When enabled by Admin here, Beta Tester accounts (<code className="text-[#C8A96E]">isBetaTester</code>) automatically unlock these features along with <code className="text-[#C8A96E]">Labs · Experimental</code> mode in the Royal Historiographer.
                          </>
                        ) : appLang === 'zh' ? (
                          <>
                            管理员在此开启功能后，内测体验官账户（<code className="text-[#C8A96E]">isBetaTester</code>）将自动解锁对应功能及史官讲解中的 <code className="text-[#C8A96E]">Labs · 实验版</code> 模式。
                          </>
                        ) : (
                          <>
                            Khi Admin bật tính năng tại đây, các Tài khoản Thử nghiệm (<code className="text-[#C8A96E]">isBetaTester</code>) sẽ tự động được mở khóa cùng chế độ <code className="text-[#C8A96E]">Labs · Thử nghiệm</code> trong Sử Quan Dấu Ấn.
                          </>
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[#C8A96E] tabular-nums">
                      {appLang === 'en'
                        ? `${enabledLabsCount}/4 enabled`
                        : appLang === 'zh'
                        ? `${enabledLabsCount}/4 已启用`
                        : `${enabledLabsCount}/4 đang bật`}
                    </span>
                  </div>

                  <div className="divide-y divide-white/[0.08]">
                    {LABS_FEATURES_META.map((item) => {
                      const isOn = Boolean(labsSettings[item.key]);
                      const itemTitle =
                        appLang === 'en'
                          ? item.titleEn
                          : appLang === 'zh'
                          ? item.titleZh
                          : item.title;
                      const itemDesc =
                        appLang === 'en'
                          ? item.descriptionEn
                          : appLang === 'zh'
                          ? item.descriptionZh
                          : item.description;
                      return (
                        <div
                          key={item.key}
                          className="py-4 first:pt-1 last:pb-1 flex items-start justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <span
                              className={`font-serif text-sm tabular-nums pt-0.5 shrink-0 transition-colors ${
                                isOn ? 'text-[#C8A96E]' : 'text-[#8E8E93]'
                              }`}
                            >
                              {item.number}.
                            </span>
                            <div className="min-w-0">
                              <div className="text-[13.5px] sm:text-[14px] font-medium text-[#FAF8F5] leading-snug">
                                {itemTitle}
                              </div>
                              <p className="text-xs text-[#8E8E93] leading-relaxed mt-1">
                                {itemDesc}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={isOn}
                            aria-label={itemTitle}
                            onClick={() => toggleLabsFeature(item.key)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 cursor-pointer mt-0.5 ${
                              isOn
                                ? 'bg-[#C8A96E] border-[#C8A96E]'
                                : 'bg-[#27272A] border-white/[0.08]'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ${
                                isOn
                                  ? 'translate-x-6 bg-[#0E0E10]'
                                  : 'translate-x-1 bg-[#8E8E93]'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8E8E93]">
                    <span>
                      {appLang === 'en'
                        ? 'Administrator accounts always have full access to all enabled experimental features above.'
                        : appLang === 'zh'
                        ? '管理员账户始终自动解锁上方已启用的全部实验功能。'
                        : 'Tài khoản Quản trị viên luôn được mở khóa toàn bộ các tính năng đang bật ở bảng trên.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveModule('reviews')}
                      className="text-[#C8A96E] hover:underline cursor-pointer tabular-nums"
                    >
                      {appLang === 'en'
                        ? `View evaluation notes & bug reports (${labsFeedbackCount}) →`
                        : appLang === 'zh'
                        ? `查看评测笔记与问题反馈 (${labsFeedbackCount}) →`
                        : `Xem ghi chú thẩm định & báo lỗi (${labsFeedbackCount}) →`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeModule === 'media_credits' && (
              <AdminMediaCreditsPanel sites={sites} showToast={showToast} />
            )}
            {activeModule === 'payments_orders' && (
              <AdminPaymentsPanel showToast={(msg) => showToast('ok', msg)} />
            )}
            {activeModule === 'login_audit' && <AdminLoginAuditPanel showToast={showToast} />}

            <footer className="pt-5 pb-2 border-t border-[#D8C9A9]/12 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#D8C9A9]/65">
              <span>
                © 2026 Dấu Ấn Việt 3D ·{' '}
                <span className="font-medium text-[#C9A46A]">Made by Hoang Hai</span>
              </span>
              <span className="text-[#D8C9A9]/45">
                Admin Studio · Heritage Conservation &amp; Cloud Sync
              </span>
            </footer>
          </div>
        </div>
      </div>

      {/* 2-STEP EMERGENCY LOCKDOWN CONFIRMATION MODAL (ANTI-MISCLICK) */}
      {isLockdownModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận 2 bước kích hoạt Đóng băng Khẩn cấp"
          onClick={(e) => {
            e.stopPropagation();
            setIsLockdownModalOpen(false);
          }}
          className="fixed inset-0 z-[1400] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-[28px] bg-[#161619] border border-[#FF453A]/55 shadow-[0_32px_90px_rgba(0,0,0,0.95)] overflow-hidden text-[#F5F5F7]"
          >
            <div className="px-6 py-4 border-b border-white/[0.08] bg-[#241114] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-[#FF453A] shrink-0" />
                <div>
                  <span className="text-[12px] font-medium tabular-nums text-[#FF8A80] block">
                    Xác nhận 2 bước · Bước {lockdownModalStep}/2
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-[#F5F5F7]">
                    Kích hoạt Đóng băng Trang web Khẩn cấp
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLockdownModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-[#8E8E93] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {lockdownModalStep === 1 ? (
              <div className="p-6 space-y-4">
                <div className="rounded-xl bg-[#FF453A]/12 border border-[#FF453A]/35 p-3.5 text-xs text-rose-100 leading-relaxed space-y-1">
                  <div className="font-semibold text-[#FF8A80]">
                    Tác động khi bật Đóng băng Khẩn cấp:
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[#F5EFE6]/90">
                    <li>Tự động đăng xuất toàn bộ phiên du khách thông thường.</li>
                    <li>Ngắt 100% vòng lặp dựng hình 3D WebGL và các luồng tải API.</li>
                    <li>Tài khoản Quản trị viên vẫn giữ toàn quyền truy cập &amp; mở khóa lại.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lockdown-visitor-message"
                    className="block text-[12px] font-medium text-[#C5A059]"
                  >
                    Thông báo hiển thị cho du khách
                  </label>
                  <textarea
                    id="lockdown-visitor-message"
                    rows={3}
                    value={lockdownDraftMessage}
                    onChange={(e) => setLockdownDraftMessage(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-black/55 border border-white/[0.14] text-xs sm:text-sm text-[#F5F5F7] focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLockdownModalOpen(false)}
                    className="px-4 py-2.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-xs font-medium text-[#D1D1D6] cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLockdownConfirmError(null);
                      setLockdownModalStep(2);
                    }}
                    className="px-5 py-2.5 rounded-full bg-[#FF453A] hover:bg-[#FF5B52] text-white text-xs font-bold cursor-pointer"
                  >
                    Tiếp tục xác thực SHA-256 (2/2)
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmActivateLockdown} className="p-6 space-y-4">
                <div className="rounded-xl bg-black/45 border border-white/[0.08] p-3.5 text-xs text-[#D1D1D6]">
                  <span className="text-[11px] font-medium text-[#86868B] block mb-1">
                    Thông báo sẽ hiển thị:
                  </span>
                  “{lockdownDraftMessage.trim() || DEFAULT_EMERGENCY_LOCKDOWN_MESSAGE}”
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lockdown-admin-password"
                    className="block text-[12px] font-medium text-[#C5A059]"
                  >
                    Xác nhận lại bằng Mật khẩu Admin (SHA-256) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="lockdown-admin-password"
                      type={showLockdownPwd ? 'text' : 'password'}
                      required
                      autoFocus
                      minLength={6}
                      value={lockdownConfirmPassword}
                      onChange={(e) => setLockdownConfirmPassword(e.target.value)}
                      placeholder="Nhập Mật khẩu Admin để kích hoạt đóng băng..."
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-black/55 border border-white/[0.14] focus:border-[#FF453A] focus:outline-none text-sm text-[#F5F5F7]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLockdownPwd((v) => !v)}
                      aria-label={showLockdownPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-white cursor-pointer"
                    >
                      {showLockdownPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {lockdownConfirmError && (
                  <div className="rounded-xl bg-[#FF453A]/15 border border-[#FF453A]/45 px-3.5 py-2.5 text-xs text-[#FF8A80]">
                    {lockdownConfirmError}
                  </div>
                )}

                <div className="flex flex-wrap justify-between gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setLockdownModalStep(1)}
                    className="px-4 py-2.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-xs font-medium text-[#D1D1D6] cursor-pointer"
                  >
                    Quay lại bước 1
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingLockdown}
                    className="px-5 py-2.5 rounded-full bg-[#FF453A] hover:bg-[#FF5B52] text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>
                      {isVerifyingLockdown
                        ? 'Đang xác thực SHA-256...'
                        : '🚨 Xác nhận ĐÓNG BĂNG KHẨN CẤP'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* MODAL CẤP LẠI MẬT KHẨU TẠM THỜI (MÃ HÓA SHA-256) */}
      {resetPwdTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cấp lại mật khẩu tài khoản"
          onClick={(e) => {
            e.stopPropagation();
            if (!isResettingPwd) setResetPwdTarget(null);
          }}
          className="fixed inset-0 z-[1400] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-[#141416] border border-white/[0.12] shadow-2xl overflow-hidden text-[#F5F5F7]"
          >
            <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-[#C5A059]" />
                <h3 className="text-sm font-semibold text-[#F5F5F7]">
                  Cấp lại mật khẩu tài khoản
                </h3>
              </div>
              <button
                type="button"
                disabled={isResettingPwd}
                onClick={() => setResetPwdTarget(null)}
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[#8E8E93] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (resetPwdValue.trim().length < 6) {
                  showToast('err', 'Mật khẩu tạm thời mới phải có ít nhất 6 ký tự.');
                  return;
                }
                if (resetPwdValue !== resetPwdConfirm) {
                  showToast('err', 'Mật khẩu xác nhận chưa trùng khớp.');
                  return;
                }
                setIsResettingPwd(true);
                try {
                  const res = await adminResetUserPassword({
                    userId: resetPwdTarget.userId,
                    provider: resetPwdTarget.provider,
                    accountIdentifier: resetPwdTarget.accountIdentifier,
                    displayName: resetPwdTarget.displayName,
                    newPassword: resetPwdValue,
                    adminEmail: adminActorEmail,
                  });
                  if (!res.ok) {
                    showToast('err', res.error || 'Không thể cấp lại mật khẩu.');
                    return;
                  }
                  setResetPwdTarget(null);
                  setResetPwdValue('');
                  setResetPwdConfirm('');
                  refreshLiveData();
                  showToast(
                    'ok',
                    `Đã cấp lại mật khẩu và mã hóa SHA-256 mới (${res.sha256Preview}) cho ${resetPwdTarget.displayName}.`
                  );
                } finally {
                  setIsResettingPwd(false);
                }
              }}
              className="p-5 space-y-4"
            >
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.07] space-y-1 text-xs">
                <div className="font-semibold text-[#F5F5F7]">{resetPwdTarget.displayName}</div>
                <div className="text-[#A1A1A6]">{resetPwdTarget.accountIdentifier}</div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D1D1D6]">
                  Mật khẩu tạm thời mới (tối thiểu 6 ký tự)
                </label>
                <div className="relative">
                  <input
                    type={showResetPwd ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoFocus
                    value={resetPwdValue}
                    onChange={(e) => setResetPwdValue(e.target.value)}
                    placeholder="Nhập mật khẩu tạm thời mới..."
                    className="w-full h-10 pl-3.5 pr-10 rounded-lg bg-black/50 border border-white/[0.12] focus:border-[#C5A059] focus:outline-none text-sm text-[#F5F5F7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-white cursor-pointer"
                    aria-label={showResetPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showResetPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D1D1D6]">
                  Xác nhận mật khẩu tạm thời
                </label>
                <input
                  type={showResetPwd ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={resetPwdConfirm}
                  onChange={(e) => setResetPwdConfirm(e.target.value)}
                  placeholder="Nhập lại mật khẩu tạm thời..."
                  className="w-full h-10 px-3.5 rounded-lg bg-black/50 border border-white/[0.12] focus:border-[#C5A059] focus:outline-none text-sm text-[#F5F5F7]"
                />
              </div>

              <p className="text-[11px] text-[#86868B] leading-relaxed">
                Hệ thống sẽ tự động tạo muối ngẫu nhiên (salt) và mã hóa bằng SHA-256 trước khi lưu, không lưu mật khẩu gốc dưới bất kỳ hình thức nào.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isResettingPwd}
                  onClick={() => setResetPwdTarget(null)}
                  className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.1] text-xs font-medium text-[#D1D1D6] cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isResettingPwd}
                  className="px-4 py-2 rounded-lg bg-[#C5A059] hover:bg-[#D4B06A] disabled:opacity-60 text-black text-xs font-semibold cursor-pointer"
                >
                  {isResettingPwd ? 'Đang mã hóa...' : 'Lưu & Mã hóa SHA-256'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isHardcodeModalOpen && (
        <div
          className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsHardcodeModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[88vh] rounded-2xl bg-[#1C1C1E] border border-white/[0.12] shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-[#C9A46A] shrink-0" />
                  <h4 className="text-base font-semibold text-[#F5F5F7] truncate">
                    Lưu cứng dữ liệu hiện tại ra Code (Chống mất khi Remix)
                  </h4>
                </div>
                <p className="text-xs text-[#86868B] mt-1">
                  Bao gồm toàn bộ 17 ảnh di tích, danh sách Tester Pro, bảng tài khoản và cấu hình góc nhìn 3D hiện hành.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHardcodeModalOpen(false)}
                aria-label="Đóng cửa sổ mã nguồn"
                className="w-8 h-8 rounded-full bg-white/[0.07] hover:bg-white/[0.14] text-[#F5F5F7] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto heritage-scrollbar space-y-4 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-medium text-[#D1D1D6]">
                  Mã nguồn TypeScript xuất bản trực tiếp vào thư mục src/data/
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadHeritageDataTs}
                    className="px-4 py-2 rounded-full bg-[#171817] hover:bg-[#C9A46A]/20 border border-[#C9A46A] text-[#D8C9A9] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C9A46A]" />
                    <span>Tải tệp mã nguồn dữ liệu (heritageData.ts)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCopyHardcodeBundle()}
                    className="px-4 py-2 rounded-full bg-[#C9A46A] hover:bg-[#D4B07A] text-[#171817] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {hardcodeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hardcodeCopied ? 'Đã sao chép mã nguồn' : 'Sao chép mã nguồn dữ liệu'}</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={hardcodeBundleText}
                aria-label="Mã nguồn dữ liệu tĩnh"
                className="w-full h-72 rounded-xl bg-[#111113] border border-white/[0.1] p-4 font-mono text-[11px] leading-relaxed text-[#D8C9A9] focus:outline-none focus:border-[#C9A46A] resize-y"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
