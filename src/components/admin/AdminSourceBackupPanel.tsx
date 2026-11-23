import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Cloud,
  CloudDownload,
  CloudUpload,
  Code2,
  Copy,
  Database,
  Download,
  FileAudio,
  FileBox,
  FileJson,
  HardDrive,
  Image as ImageIcon,
  Link2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { HeritageSite } from '../../types/heritage';
import {
  ASSET_VAULT_UPDATED_EVENT,
  formatVaultBytes,
  getVaultStorageStats,
  type VaultStorageStats,
} from '../../utils/assetVault';
import {
  CLOUD_ASSETS_MANIFEST_READY_EVENT,
  CLOUD_SYNC_UPDATED_EVENT,
  DEFAULT_UNIFIED_CATEGORIES,
  auditAll17SitesAssets,
  buildFullMigrationSnapshot,
  checkCloudSyncVersion,
  clearCloudSyncLogs,
  forcePushAllToCloud,
  generateBakedAssetsTypeScriptCode,
  getActiveChunkTransport,
  getCustomRtdbUrlOverride,
  importFullMigrationSnapshot,
  invalidateCloudMetaCache,
  invalidateStaticProbeCache,
  pullAllFromCloud,
  pullUnifiedAssetsFromCloud,
  pushUnifiedAssetsToCloud,
  runFirebaseWriteHealthCheck,
  saveCustomRtdbUrlOverride,
  saveDirectAssetUrl,
  uploadAssetBinaryToFirebaseStorage,
  useCloudSyncStatus,
  type AssetResolutionTier,
  type BatchChunkSyncItemResult,
  type ChunkTransferProgress,
  type FirebaseHealthCheckResult,
  type SiteAssetAuditRow,
  type UnifiedSyncCategory,
  type UnifiedSyncCategorySelection,
} from '../../utils/cloudSync';
import { GLB_MODELS_UPDATED_EVENT } from '../../utils/glbModelStorage';
import { BAKED_ASSETS } from '../../data/bakedAssets';
import { useI18n } from '../../i18n/I18nContext';

interface AdminSourceBackupPanelProps {
  sites: HeritageSite[];
  showToast: (type: 'ok' | 'err', text: string) => void;
  onRefreshData: () => void;
}

function formatIsoDisplay(iso: string | null): string {
  if (!iso) return 'Chưa ghi nhận';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getTierLabel(tier: AssetResolutionTier, kind: 'model' | 'audio'): string {
  switch (tier) {
    case 'firebase_cloud':
      return 'Firebase Cloud';
    case 'indexed_db':
      return 'Cục bộ IndexedDB';
    case 'static_source':
      return 'Đã gắn trong mã nguồn';
    default:
      return kind === 'audio' ? 'Giọng đọc AI (TTS)' : 'Chưa có';
  }
}

function getTierBadgeClasses(tier: AssetResolutionTier): string {
  switch (tier) {
    case 'firebase_cloud':
      return 'border-[#526D8B]/55 bg-[#526D8B]/15 text-[#B9CFE8]';
    case 'indexed_db':
      return 'border-[#C9A46A]/55 bg-[#C9A46A]/15 text-[#E8CFA0]';
    case 'static_source':
      return 'border-[#47796D]/55 bg-[#47796D]/18 text-[#9ED3C6]';
    default:
      return 'border-[#A94F3D]/45 bg-[#A94F3D]/12 text-[#E5A396]';
  }
}

function getUnifiedCategoryBadge(category: UnifiedSyncCategory): {
  code: string;
  label: string;
  border: string;
  bg: string;
  text: string;
} {
  switch (category) {
    case 'models':
      return {
        code: '3D',
        label: '3D',
        border: 'rgba(82, 109, 139, 0.55)',
        bg: 'rgba(82, 109, 139, 0.22)',
        text: '#C2D6EC',
      };
    case 'audio':
      return {
        code: 'AUDIO',
        label: 'Ghi âm',
        border: 'rgba(169, 79, 61, 0.55)',
        bg: 'rgba(169, 79, 61, 0.22)',
        text: '#F2BEB3',
      };
    case 'images':
      return {
        code: 'IMG',
        label: 'Hình ảnh',
        border: 'rgba(71, 121, 109, 0.55)',
        bg: 'rgba(71, 121, 109, 0.22)',
        text: '#A8DDD0',
      };
    case 'videos':
      return {
        code: 'VIDEO',
        label: 'Video',
        border: 'rgba(201, 164, 106, 0.55)',
        bg: 'rgba(201, 164, 106, 0.2)',
        text: '#EBD3A6',
      };
    case 'accounts':
      return {
        code: 'ACC',
        label: 'Tài khoản',
        border: 'rgba(216, 201, 169, 0.45)',
        bg: 'rgba(216, 201, 169, 0.14)',
        text: '#E9DFCB',
      };
    default:
      return {
        code: 'DATA',
        label: 'Cập nhật mới',
        border: 'rgba(71, 121, 109, 0.45)',
        bg: 'rgba(71, 121, 109, 0.15)',
        text: '#B3DED3',
      };
  }
}

export const AdminSourceBackupPanel: React.FC<AdminSourceBackupPanelProps> = ({
  sites,
  showToast,
  onRefreshData,
}) => {
  const { lang } = useI18n();
  const syncStatus = useCloudSyncStatus();

  const [auditRows, setAuditRows] = useState<SiteAssetAuditRow[]>([]);
  const [vaultStats, setVaultStats] = useState<VaultStorageStats>({
    modelCount: 0,
    audioCount: 0,
    imageCount: 0,
    videoCount: 0,
    modelBytes: 0,
    audioBytes: 0,
    imageBytes: 0,
    videoBytes: 0,
    totalBytes: 0,
  });
  const [isAuditing, setIsAuditing] = useState<boolean>(true);
  const [uploadingCellKey, setUploadingCellKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showTelemetry, setShowTelemetry] = useState<boolean>(false);

  // Unified 6-Category Sync Controls (Delta Sync + Selective Checkboxes + Filter Bar)
  const [selectedCategories, setSelectedCategories] = useState<UnifiedSyncCategorySelection>({
    ...DEFAULT_UNIFIED_CATEGORIES,
  });
  const [forceOverwritePush, setForceOverwritePush] = useState<boolean>(false);
  const [activeProgressFilter, setActiveProgressFilter] = useState<'all' | UnifiedSyncCategory>('all');
  const [isProgressCollapsed, setIsProgressCollapsed] = useState<boolean>(false);

  // Chunked Batch Push / Full Pull + Write Health Check state
  const [isBatchRunning, setIsBatchRunning] = useState<'push' | 'pull' | 'health' | null>(null);
  const [liveProgress, setLiveProgress] = useState<ChunkTransferProgress | null>(null);
  const [batchResults, setBatchResults] = useState<BatchChunkSyncItemResult[]>([]);
  const [healthCheckResult, setHealthCheckResult] = useState<FirebaseHealthCheckResult | null>(null);

  // Optional custom Realtime Database URL override (for users who also want a custom RTDB endpoint)
  const [showRtdbConfig, setShowRtdbConfig] = useState<boolean>(false);
  const [draftRtdbUrl, setDraftRtdbUrl] = useState<string>(() => getCustomRtdbUrlOverride());

  // Inline Direct CDN URL editor (GitHub / jsDelivr for >15MB models or external audio)
  const [editingUrlKey, setEditingUrlKey] = useState<string | null>(null);
  const [draftDirectUrl, setDraftDirectUrl] = useState<string>('');

  // Source-Code Baker state
  const [bakedCode, setBakedCode] = useState<string>('');
  const [isGeneratingBake, setIsGeneratingBake] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedPaths, setCopiedPaths] = useState<boolean>(false);

  const importJsonRef = useRef<HTMLInputElement | null>(null);
  const activeTransport = getActiveChunkTransport();

  const runAudit = useCallback(
    async (clearCache = false) => {
      setIsAuditing(true);
      try {
        if (clearCache) {
          invalidateStaticProbeCache();
          invalidateCloudMetaCache();
        }
        const [{ rows }, stats] = await Promise.all([
          auditAll17SitesAssets(sites),
          getVaultStorageStats(),
        ]);
        // Reflect locked GitHub CDN source-of-truth assets from src/data/bakedAssets.ts across all 17 sites
        const enrichedRows: SiteAssetAuditRow[] = rows.map((row) => {
          const baked = BAKED_ASSETS[row.siteId];
          if (!baked) return row;
          const nextModelTier: AssetResolutionTier =
            row.modelTier === 'fallback' && baked.modelUrl ? 'static_source' : row.modelTier;
          const nextAudioTier: AssetResolutionTier =
            row.audioTier === 'fallback' && baked.audioUrl ? 'static_source' : row.audioTier;
          const isBakedPrimary =
            nextModelTier === 'static_source' && nextAudioTier === 'static_source';
          return {
            ...row,
            modelTier: nextModelTier,
            modelUrl: row.modelUrl || baked.modelUrl,
            modelFileName: row.modelFileName || baked.modelFileName,
            directModelUrl: row.directModelUrl || baked.modelUrl,
            audioTier: nextAudioTier,
            audioUrl: row.audioUrl || baked.audioUrl,
            audioFileName: row.audioFileName || baked.audioFileName,
            directAudioUrl: row.directAudioUrl || baked.audioUrl,
            primaryStorageLabelVi: isBakedPrimary
              ? 'Đã gắn trong mã nguồn'
              : row.primaryStorageLabelVi,
            primaryStorageLabelEn: isBakedPrimary
              ? 'Embedded in Source Code'
              : row.primaryStorageLabelEn,
            primaryStorageLabelZh: isBakedPrimary
              ? '已写入源代码'
              : row.primaryStorageLabelZh,
          };
        });
        setAuditRows(enrichedRows);
        setVaultStats(stats);
      } finally {
        setIsAuditing(false);
      }
    },
    [sites]
  );

  useEffect(() => {
    void runAudit(false);
    void checkCloudSyncVersion();

    const handleRefresh = () => {
      void runAudit(false);
    };
    window.addEventListener(ASSET_VAULT_UPDATED_EVENT, handleRefresh);
    window.addEventListener(CLOUD_ASSETS_MANIFEST_READY_EVENT, handleRefresh);
    window.addEventListener(CLOUD_SYNC_UPDATED_EVENT, handleRefresh);
    window.addEventListener(GLB_MODELS_UPDATED_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(ASSET_VAULT_UPDATED_EVENT, handleRefresh);
      window.removeEventListener(CLOUD_ASSETS_MANIFEST_READY_EVENT, handleRefresh);
      window.removeEventListener(CLOUD_SYNC_UPDATED_EVENT, handleRefresh);
      window.removeEventListener(GLB_MODELS_UPDATED_EVENT, handleRefresh);
    };
  }, [runAudit]);

  const metrics = useMemo(() => {
    const total = auditRows.length || sites.length || 17;
    const photosReady = auditRows.filter((r) => r.hasPhotos).length;
    const modelsReady = auditRows.filter((r) => r.modelTier !== 'fallback').length;
    const audioFilesReady = auditRows.filter((r) => r.audioTier !== 'fallback').length;
    const audioScriptsReady = auditRows.filter((r) => r.hasScriptNarration).length;
    const cloudChunkModels = auditRows.filter((r) => r.cloudModelChunks > 0).length;
    const cloudChunkAudios = auditRows.filter((r) => r.cloudAudioChunks > 0).length;
    return {
      total,
      photosReady,
      modelsReady,
      audioFilesReady,
      audioScriptsReady,
      cloudChunkModels,
      cloudChunkAudios,
    };
  }, [auditRows, sites.length]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return auditRows;
    return auditRows.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.officialName.toLowerCase().includes(q) ||
        r.siteId.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q)
    );
  }, [auditRows, searchQuery]);

  // 1. REAL FIREBASE WRITE/READ HEALTH CHECK (`/_healthCheck`)
  const handleRunWriteHealthCheck = async () => {
    if (isBatchRunning) return;
    setIsBatchRunning('health');
    try {
      const res = await runFirebaseWriteHealthCheck();
      setHealthCheckResult(res);
      if (res.ok) {
        showToast(
          'ok',
          `Xác thực quyền ghi & đọc /_healthCheck thành công (${res.latencyMs}ms · ${res.transport.toUpperCase()}). Sẵn sàng đẩy chia mảnh.`
        );
      } else {
        setShowTelemetry(true);
        showToast(
          'err',
          `Kiểm tra quyền ghi thất bại (${res.errorCode || 'unknown'}): ${
            res.errorMessage || 'Kiểm tra trạng thái đăng nhập Admin hoặc Firebase Rules.'
          }`
        );
      }
    } finally {
      setIsBatchRunning(null);
    }
  };

  // 2. ONE-CLICK UNIFIED 6-CATEGORY SMART DELTA PUSH
  const handleChunkedBatchPush = async () => {
    if (isBatchRunning) return;
    const anyCategorySelected = Object.values(selectedCategories).some(Boolean);
    if (!anyCategorySelected) {
      showToast('err', 'Vui lòng chọn ít nhất 1 danh mục dữ liệu để đẩy lên Cloud.');
      return;
    }

    setIsBatchRunning('push');
    setBatchResults([]);
    setIsProgressCollapsed(false);
    setActiveProgressFilter('all');
    setLiveProgress({
      siteId: '',
      assetType: 'models',
      phase: 'encoding',
      active: true,
      currentChunk: 0,
      totalChunks: 1,
      percent: 2,
      label: forceOverwritePush
        ? 'Đang quét toàn bộ 6 phân hệ để ghi đè lên Firebase Cloud...'
        : 'Đang đối chiếu checksum (Delta Sync) để chỉ đẩy các cập nhật mới...',
    });

    try {
      const res = await pushUnifiedAssetsToCloud(sites, {
        categories: selectedCategories,
        forceOverwrite: forceOverwritePush,
        includeStaticPublicFallback: true,
        onProgress: (p) => setLiveProgress(p),
        onItemDone: (item) => setBatchResults((prev) => [item, ...prev]),
      });

      onRefreshData();
      await runAudit(true);

      if (res.ok) {
        const pushedTotal =
          res.pushedModels +
          res.pushedAudios +
          res.pushedImages +
          res.pushedVideos +
          (res.pushedAccounts ? 1 : 0) +
          (res.pushedUpdates ? 1 : 0);
        showToast(
          'ok',
          `Smart Push hoàn tất: ${pushedTotal} mục mới đã đẩy lên Cloud (${res.skippedCount} mục đã khớp Cloud được bỏ qua).`
        );
      } else {
        setShowTelemetry(true);
        const firstErr = res.items.find((i) => i.status === 'error');
        showToast(
          'err',
          `Đồng bộ hoàn tất một phần (${res.failedCount} lỗi${
            firstErr?.errorCode ? ` · ${firstErr.errorCode}` : ''
          }). Xem bảng tiến trình chi tiết bên dưới.`
        );
      }
    } finally {
      setIsBatchRunning(null);
      setLiveProgress(null);
    }
  };

  // 3. ONE-CLICK UNIFIED 6-CATEGORY FULL PULL (PRE-DOWNLOAD EVERYTHING TO THIS DEVICE)
  const handleChunkedFullPull = async () => {
    if (isBatchRunning) return;
    const anyCategorySelected = Object.values(selectedCategories).some(Boolean);
    if (!anyCategorySelected) {
      showToast('err', 'Vui lòng chọn ít nhất 1 danh mục dữ liệu để kéo từ Cloud.');
      return;
    }

    setIsBatchRunning('pull');
    setBatchResults([]);
    setIsProgressCollapsed(false);
    setActiveProgressFilter('all');
    setLiveProgress({
      siteId: '',
      assetType: 'models',
      phase: 'downloading',
      active: true,
      currentChunk: 0,
      totalChunks: 1,
      percent: 2,
      label: 'Đang kiểm tra toàn bộ 6 phân hệ trên Firebase Cloud...',
    });

    try {
      const res = await pullUnifiedAssetsFromCloud(sites, {
        categories: selectedCategories,
        forceRefresh: forceOverwritePush,
        onProgress: (p) => setLiveProgress(p),
        onItemDone: (item) => setBatchResults((prev) => [item, ...prev]),
      });

      onRefreshData();
      await runAudit(true);

      if (res.ok) {
        showToast(
          'ok',
          `Đã kéo toàn bộ hệ thống về máy này: ${res.pulledModels} 3D, ${res.pulledAudios} ghi âm, ${res.pulledImages} ảnh, ${res.pulledVideos} video, ${res.pulledAccounts} tài khoản (${res.skippedUpToDate} mục đã khớp).`
        );
      } else {
        setShowTelemetry(true);
        showToast(
          'err',
          `Kéo dữ liệu gặp ${res.failedCount} lỗi. Xem bảng tiến trình và nhật ký chi tiết bên dưới.`
        );
      }
    } finally {
      setIsBatchRunning(null);
      setLiveProgress(null);
    }
  };

  const progressFilterCounts = useMemo(() => {
    const counts: Record<'all' | UnifiedSyncCategory, number> = {
      all: batchResults.length,
      models: 0,
      audio: 0,
      images: 0,
      videos: 0,
      accounts: 0,
      updates: 0,
    };
    for (const item of batchResults) {
      counts[item.assetType] = (counts[item.assetType] || 0) + 1;
    }
    return counts;
  }, [batchResults]);

  const filteredBatchResults = useMemo(() => {
    if (activeProgressFilter === 'all') return batchResults;
    return batchResults.filter((item) => item.assetType === activeProgressFilter);
  }, [batchResults, activeProgressFilter]);

  // Lightweight Metadata-only Push / Pull (preserved)
  const handleForcePushMetadata = async () => {
    const res = await forcePushAllToCloud(sites);
    onRefreshData();
    await runAudit(false);
    if (res.ok) {
      showToast('ok', `Đã đẩy ${res.succeededBranches} nhánh siêu dữ liệu di tích lên Firebase Cloud.`);
    } else {
      setShowTelemetry(true);
      showToast(
        'err',
        `Đồng bộ siêu dữ liệu chưa hoàn tất (${res.firstErrorCode || 'unknown'}): ${
          res.firstErrorMessage || 'Xem Nhật ký đồng bộ chi tiết.'
        }`
      );
    }
  };

  const handlePullMetadataOnly = async () => {
    const res = await pullAllFromCloud();
    onRefreshData();
    await runAudit(true);
    if (res.ok) {
      showToast(
        'ok',
        `Đã kéo siêu dữ liệu Cloud: ${res.pulledSites} di tích, ${res.pulledCredits} nguồn tư liệu.`
      );
    } else {
      setShowTelemetry(true);
      showToast('err', `Không thể kéo siêu dữ liệu (${res.errorCode || 'unknown'}).`);
    }
  };

  const handleSaveRtdbOverride = () => {
    const saved = saveCustomRtdbUrlOverride(draftRtdbUrl);
    setDraftRtdbUrl(saved);
    invalidateCloudMetaCache();
    showToast(
      'ok',
      saved
        ? `Đã chuyển kênh Chunked Sync sang Realtime Database: ${saved}`
        : 'Đã đặt lại về kênh Firebase Cloud Database miễn phí tích hợp sẵn.'
    );
  };

  const handleInlineAssetUpload = async (
    kind: 'models' | 'audio',
    row: SiteAssetAuditRow,
    file: File | undefined
  ) => {
    if (!file) return;
    const cellKey = `${kind}:${row.siteId}`;
    setUploadingCellKey(cellKey);
    try {
      const res = await uploadAssetBinaryToFirebaseStorage(kind, row.siteId, file, file.name);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(GLB_MODELS_UPDATED_EVENT, { detail: { siteId: row.siteId } }));
      }
      await runAudit(true);
      onRefreshData();
      if (res.ok) {
        showToast(
          'ok',
          `Đã lưu "${file.name}" vào IndexedDB và đẩy chia mảnh 350KB lên Firebase Cloud cho ${row.officialName}.`
        );
      } else {
        showToast(
          'ok',
          `Đã lưu an toàn "${file.name}" trong Kho IndexedDB cục bộ cho ${row.officialName} (Cloud: ${
            res.errorCode || 'offline'
          }).`
        );
      }
    } catch (err) {
      showToast(
        'err',
        err instanceof Error ? err.message : 'Không thể nạp tệp vào kho lưu trữ 3 tầng.'
      );
    } finally {
      setUploadingCellKey(null);
    }
  };

  const handleOpenDirectUrlEditor = (assetType: 'models' | 'audio', row: SiteAssetAuditRow) => {
    const key = `${assetType}:${row.siteId}`;
    if (editingUrlKey === key) {
      setEditingUrlKey(null);
      return;
    }
    setEditingUrlKey(key);
    setDraftDirectUrl(assetType === 'models' ? row.directModelUrl : row.directAudioUrl);
  };

  const handleSaveDirectUrl = async (assetType: 'models' | 'audio', row: SiteAssetAuditRow) => {
    const raw = draftDirectUrl.trim();
    if (raw && !/^https?:\/\//i.test(raw) && !raw.startsWith('/')) {
      showToast('err', 'URL trực tiếp phải bắt đầu bằng https://, http:// hoặc /');
      return;
    }
    const normalized = saveDirectAssetUrl(assetType, row.siteId, raw);
    setEditingUrlKey(null);
    await runAudit(false);
    onRefreshData();
    showToast(
      'ok',
      normalized
        ? `Đã gắn URL CDN trực tiếp (${assetType === 'models' ? '.glb' : '.m4a/.mp3'}) cho ${row.officialName}.`
        : `Đã xóa URL trực tiếp của ${row.officialName}.`
    );
  };

  const handleGenerateBakedSource = async () => {
    setIsGeneratingBake(true);
    try {
      const code = await generateBakedAssetsTypeScriptCode(sites);
      setBakedCode(code);
      showToast('ok', 'Đã tổng hợp hoàn chỉnh mã nguồn TypeScript cho 17/17 di tích.');
    } finally {
      setIsGeneratingBake(false);
    }
  };

  const handleCopyBakedCode = async () => {
    let codeToCopy = bakedCode;
    if (!codeToCopy) {
      setIsGeneratingBake(true);
      try {
        codeToCopy = await generateBakedAssetsTypeScriptCode(sites);
        setBakedCode(codeToCopy);
      } finally {
        setIsGeneratingBake(false);
      }
    }
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2200);
      showToast('ok', 'Đã sao chép toàn bộ mã nguồn bakedAssets.ts vào khay nhớ tạm.');
    } catch {
      showToast('err', 'Trình duyệt chặn sao chép tự động. Vui lòng dùng nút Tải file .ts.');
    }
  };

  const handleDownloadBakedFile = async () => {
    let codeToDownload = bakedCode;
    if (!codeToDownload) {
      setIsGeneratingBake(true);
      try {
        codeToDownload = await generateBakedAssetsTypeScriptCode(sites);
        setBakedCode(codeToDownload);
      } finally {
        setIsGeneratingBake(false);
      }
    }
    const blob = new Blob([codeToDownload], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bakedAssets.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('ok', 'Đã tải xuống tệp bakedAssets.ts sẵn sàng thay thế vào mã nguồn dự án.');
  };

  const handleCopyExpectedPaths = async () => {
    const lines = auditRows.map(
      (r) => `${r.code}. ${r.officialName} -> ${r.recommendedModelPath} | ${r.recommendedAudioPath}`
    );
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedPaths(true);
      window.setTimeout(() => setCopiedPaths(false), 2200);
      showToast('ok', 'Đã sao chép danh sách tên tệp chuẩn hóa cho 17 di tích.');
    } catch {
      showToast('err', 'Không thể sao chép danh sách đường dẫn.');
    }
  };

  const handleExportMigrationJson = () => {
    const snapshot = buildFullMigrationSnapshot(sites);
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dau-an-viet-3d-migration-snapshot-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('ok', 'Đã xuất Gói Di trú toàn phần (.json) cho toàn bộ 17 di tích.');
  };

  const handleImportMigrationJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const result = importFullMigrationSnapshot(text);
      if (result.ok) {
        onRefreshData();
        await runAudit(true);
        showToast(
          'ok',
          `Khôi phục Gói Di trú thành công (${result.restoredSections.length} phân hệ dữ liệu đã được nạp).`
        );
      } else {
        showToast('err', result.error || 'Tệp JSON di trú không hợp lệ.');
      }
    } catch {
      showToast('err', 'Không thể đọc tệp JSON di trú đã chọn.');
    }
  };

  const healthMeta = useMemo(() => {
    switch (syncStatus.health) {
      case 'synced':
        return {
          label:
            lang === 'en'
              ? 'Cloud Synced'
              : lang === 'zh'
              ? '云端已同步'
              : 'Cloud đã đồng bộ',
          dotClass: 'bg-[#47796D]',
          boxClass: 'border-[#47796D]/50 bg-[#47796D]/12 text-[#A7DDD0]',
        };
      case 'rules_attention':
        return {
          label:
            lang === 'en'
              ? 'Check Firebase Rules'
              : lang === 'zh'
              ? '需检查 Firebase 规则'
              : 'Cần kiểm tra Firebase Rules',
          dotClass: 'bg-[#A94F3D]',
          boxClass: 'border-[#A94F3D]/55 bg-[#A94F3D]/14 text-[#F0B4A8]',
        };
      case 'syncing':
        return {
          label:
            lang === 'en'
              ? 'Syncing Chunks...'
              : lang === 'zh'
              ? '正在分片同步...'
              : 'Đang đồng bộ chia mảnh...',
          dotClass: 'bg-[#526D8B]',
          boxClass: 'border-[#526D8B]/55 bg-[#526D8B]/16 text-[#C0D5EC]',
        };
      default:
        return {
          label:
            lang === 'en'
              ? 'Local IndexedDB Only'
              : lang === 'zh'
              ? '仅本地 IndexedDB 持久存储'
              : 'Chỉ lưu cục bộ IndexedDB',
          dotClass: 'bg-[#C9A46A]',
          boxClass: 'border-[#C9A46A]/50 bg-[#C9A46A]/12 text-[#EAD2A5]',
        };
    }
  }, [syncStatus.health, lang]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* MASTHEAD WITH DOUBLE ARCHITECTURAL RULE */}
      <div className="rounded-xl border border-[#C9A46A]/30 bg-[#171817] overflow-hidden">
        <div className="h-[2px] bg-[#A94F3D]" />
        <div className="h-[2px] bg-transparent" />
        <div className="h-[1px] bg-[#C9A46A]/75" />

        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#C9A46A] font-medium">
                ĐỒNG BỘ CHIA MẢNH 350KB (CHUNKED DB SYNC) · KHÔNG CẦN FIREBASE STORAGE TRẢ PHÍ
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-semibold text-[#F5EFE6] tracking-tight">
                Đóng gói Mã nguồn &amp; Đồng bộ 3D / 17 Thuyết minh
              </h3>
              <p className="text-xs sm:text-[13px] text-[#D8C9A9]/75 max-w-3xl leading-relaxed">
                Cắt nhỏ tệp `.glb` và `.m4a`/`.mp3` (tới 25MB/tệp) thành các mảnh 350KB đẩy tuần tự lên Firebase miễn phí, tự động kéo và ghép mảnh lưu đệm vào IndexedDB khi mở ở tài khoản mới hoặc bản Remix.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] border text-xs font-medium ${healthMeta.boxClass}`}
              >
                <span className={`w-2 h-2 rounded-full ${healthMeta.dotClass}`} />
                <span>{healthMeta.label}</span>
              </div>
              <button
                type="button"
                onClick={() => void runAudit(true)}
                disabled={isAuditing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#D8C9A9]/25 bg-white/[0.03] hover:bg-white/[0.08] text-xs text-[#F5EFE6] cursor-pointer transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#C9A46A] ${isAuditing ? 'animate-spin' : ''}`} />
                <span>Quét lại 17 di tích</span>
              </button>
            </div>
          </div>

          {/* 4-COLUMN INTEGRITY TELEMETRY BAR */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="rounded-lg border border-[#D8C9A9]/15 bg-black/25 p-3.5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#D8C9A9]/65">
                <span>Ảnh tư liệu HD</span>
                <ImageIcon className="w-3.5 h-3.5 text-[#C9A46A]" />
              </div>
              <div className="mt-1.5 text-2xl font-semibold tabular-nums text-[#F5EFE6]">
                {metrics.photosReady}
                <span className="text-sm font-normal text-[#D8C9A9]/55">/{metrics.total}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[#9ED3C6]">Ảnh thực tế độ phân giải cao</div>
            </div>

            <div className="rounded-lg border border-[#D8C9A9]/15 bg-black/25 p-3.5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#D8C9A9]/65">
                <span>Mô hình 3D (.GLB)</span>
                <FileBox className="w-3.5 h-3.5 text-[#526D8B]" />
              </div>
              <div className="mt-1.5 text-2xl font-semibold tabular-nums text-[#F5EFE6]">
                {metrics.modelsReady}
                <span className="text-sm font-normal text-[#D8C9A9]/55">/{metrics.total}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[#B9CFE8] tabular-nums">
                {metrics.cloudChunkModels} mô hình đã chia mảnh trên Cloud
              </div>
            </div>

            <div className="rounded-lg border border-[#D8C9A9]/15 bg-black/25 p-3.5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#D8C9A9]/65">
                <span>Thuyết minh 17/17</span>
                <FileAudio className="w-3.5 h-3.5 text-[#A94F3D]" />
              </div>
              <div className="mt-1.5 text-2xl font-semibold tabular-nums text-[#F5EFE6]">
                {metrics.audioScriptsReady}
                <span className="text-sm font-normal text-[#D8C9A9]/55">/{metrics.total}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[#E8CFA0] tabular-nums">
                {metrics.audioFilesReady} bản thu sẵn sàng · {metrics.cloudChunkAudios} trên Cloud
              </div>
            </div>

            <div className="rounded-lg border border-[#D8C9A9]/15 bg-black/25 p-3.5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#D8C9A9]/65">
                <span>Kho IndexedDB cục bộ</span>
                <HardDrive className="w-3.5 h-3.5 text-[#47796D]" />
              </div>
              <div className="mt-1.5 text-2xl font-semibold tabular-nums text-[#F5EFE6]">
                {formatVaultBytes(vaultStats.totalBytes)}
              </div>
              <div className="mt-0.5 text-[11px] text-[#D8C9A9]/70 tabular-nums">
                {vaultStats.modelCount} tệp 3D · {vaultStats.audioCount} tệp ghi âm
              </div>
            </div>
          </div>

          {/* ONE-CLICK CHUNKED SYNC COMMAND CENTER */}
          <div className="rounded-lg border border-[#C9A46A]/35 bg-black/35 p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-[#D8C9A9]/12 pb-3">
              <div className="space-y-0.5">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[#C9A46A] font-semibold">
                  ĐỒNG BỘ MỘT CHẠM GIỮA CÁC TÀI KHOẢN &amp; BẢN REMIX
                </div>
                <div className="text-xs text-[#D8C9A9]/75 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    Kênh hoạt động: <strong className="text-[#F5EFE6]">{activeTransport.label}</strong>
                  </span>
                  <span className="text-[#D8C9A9]/35">|</span>
                  <span className="font-mono text-[11px] text-[#D8C9A9]/65">
                    {activeTransport.endpoint}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRtdbConfig((v) => !v)}
                    className="text-[11px] text-[#C9A46A] hover:underline cursor-pointer"
                  >
                    {showRtdbConfig ? 'Ẩn cấu hình RTDB' : 'Cấu hình RTDB URL tùy chọn'}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#D8C9A9]/65 tabular-nums">
                Cập nhật Cloud gần nhất: <strong className="text-[#F5EFE6]">{formatIsoDisplay(syncStatus.cloudUpdatedAt)}</strong>
              </div>
            </div>

            {showRtdbConfig && (
              <div className="rounded-md border border-[#C9A46A]/25 bg-[#121312] p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                  type="url"
                  value={draftRtdbUrl}
                  onChange={(e) => setDraftRtdbUrl(e.target.value)}
                  placeholder="Để trống để dùng Firebase Cloud DB tích hợp sẵn, hoặc dán https://...-default-rtdb.asia-southeast1.firebasedatabase.app"
                  className="flex-1 px-3 py-1.5 rounded-[4px] bg-black/50 border border-[#D8C9A9]/20 text-xs text-[#F5EFE6] font-mono placeholder:text-[#D8C9A9]/40 focus:outline-none focus:border-[#C9A46A]"
                />
                <button
                  type="button"
                  onClick={handleSaveRtdbOverride}
                  className="px-3.5 py-1.5 rounded-[4px] bg-[#C9A46A] hover:bg-[#D8C9A9] text-[#171817] text-xs font-semibold cursor-pointer transition-colors shrink-0"
                >
                  Lưu kênh DB
                </button>
              </div>
            )}

            {/* SELECTIVE 6-CATEGORY CHECKBOXES + FORCE OVERWRITE TOGGLE */}
            <div className="rounded-md border border-[#C9A46A]/20 bg-[#141514] px-3.5 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-[10.5px] uppercase tracking-[0.16em] text-[#C9A46A] font-semibold">
                  Phân hệ đồng bộ:
                </span>
                {(
                  [
                    { key: 'models', label: '3D' },
                    { key: 'audio', label: 'Ghi âm' },
                    { key: 'images', label: 'Hình ảnh' },
                    { key: 'videos', label: 'Video' },
                    { key: 'accounts', label: 'Tài khoản' },
                    { key: 'updates', label: 'Dữ liệu & Nguồn' },
                  ] as Array<{ key: UnifiedSyncCategory; label: string }>
                ).map((cat) => (
                  <label
                    key={cat.key}
                    className="inline-flex items-center gap-1.5 text-xs text-[#F7F3EB] cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories[cat.key]}
                      onChange={(e) =>
                        setSelectedCategories((prev) => ({
                          ...prev,
                          [cat.key]: e.target.checked,
                        }))
                      }
                      className="accent-[#C9A46A] w-3.5 h-3.5 rounded-[2px] cursor-pointer"
                    />
                    <span>{cat.label}</span>
                  </label>
                ))}
              </div>

              <label className="inline-flex items-center gap-2 text-[11.5px] text-[#D8C9A9] cursor-pointer select-none shrink-0 border-t lg:border-t-0 lg:border-l border-[#C9A46A]/15 pt-2 lg:pt-0 lg:pl-3.5">
                <input
                  type="checkbox"
                  checked={forceOverwritePush}
                  onChange={(e) => setForceOverwritePush(e.target.checked)}
                  className="accent-[#A94F3D] w-3.5 h-3.5 rounded-[2px] cursor-pointer"
                />
                <span>Ghi đè toàn bộ (Force Push)</span>
              </label>
            </div>

            {/* PRIMARY 3 ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => void handleChunkedBatchPush()}
                disabled={Boolean(isBatchRunning) || syncStatus.isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-[#A94F3D] hover:bg-[#934232] text-[#F5EFE6] text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
              >
                <CloudUpload className="w-4 h-4 shrink-0" />
                <span>
                  {isBatchRunning === 'push'
                    ? 'Đang đẩy chia mảnh thông minh...'
                    : 'Đẩy tất cả cập nhật mới lên Cloud (Smart Push)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleChunkedFullPull()}
                disabled={Boolean(isBatchRunning) || syncStatus.isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-[#47796D] hover:bg-[#3b665c] text-[#F5EFE6] text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
              >
                <CloudDownload className="w-4 h-4 shrink-0" />
                <span>
                  {isBatchRunning === 'pull'
                    ? 'Đang kéo toàn bộ hệ thống về máy...'
                    : 'Kéo toàn bộ hệ thống từ Cloud về máy này (Full Pull)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void handleRunWriteHealthCheck()}
                disabled={Boolean(isBatchRunning)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-[4px] border border-[#C9A46A]/65 bg-[#C9A46A]/15 hover:bg-[#C9A46A]/25 text-[#F5EFE6] text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-[#C9A46A] shrink-0" />
                <span>
                  {isBatchRunning === 'health'
                    ? 'Đang kiểm tra /_healthCheck...'
                    : 'Kiểm tra quyền ghi Firebase'}
                </span>
              </button>
            </div>

            {/* SECONDARY METADATA & TELEMETRY ROW */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#D8C9A9]/10 text-xs">
              <button
                type="button"
                onClick={() => void handleForcePushMetadata()}
                disabled={Boolean(isBatchRunning) || syncStatus.isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#D8C9A9]/20 bg-white/[0.03] hover:bg-white/[0.08] text-[#D8C9A9] cursor-pointer transition-colors disabled:opacity-50"
              >
                <Cloud className="w-3.5 h-3.5 text-[#C9A46A]" />
                <span>Chỉ đẩy siêu dữ liệu &amp; 34 ảnh</span>
              </button>
              <button
                type="button"
                onClick={() => void handlePullMetadataOnly()}
                disabled={Boolean(isBatchRunning) || syncStatus.isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#D8C9A9]/20 bg-white/[0.03] hover:bg-white/[0.08] text-[#D8C9A9] cursor-pointer transition-colors disabled:opacity-50"
              >
                <CloudDownload className="w-3.5 h-3.5 text-[#526D8B]" />
                <span>Chỉ kéo siêu dữ liệu</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTelemetry((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#D8C9A9]/20 bg-white/[0.03] hover:bg-white/[0.08] text-[#D8C9A9] cursor-pointer transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 text-[#C9A46A]" />
                <span>Nhật ký đồng bộ chi tiết ({syncStatus.logs.length})</span>
              </button>
            </div>

            {/* LIVE WRITE HEALTH CHECK RESULT BANNER */}
            {healthCheckResult && (
              <div
                className={`rounded-md border px-3.5 py-2.5 flex items-start justify-between gap-3 text-xs ${
                  healthCheckResult.ok
                    ? 'border-[#47796D]/60 bg-[#47796D]/15 text-[#B4E3D7]'
                    : 'border-[#A94F3D]/60 bg-[#A94F3D]/15 text-[#F4C4BA]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {healthCheckResult.ok ? (
                    <ShieldCheck className="w-4 h-4 text-[#7EC4B2] shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-[#E07A66] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <div className="font-medium text-[#F5EFE6]">
                      {healthCheckResult.ok
                        ? `Xác thực ghi & đọc lại /_healthCheck thành công (${healthCheckResult.latencyMs}ms)`
                        : `Kiểm tra quyền ghi /_healthCheck thất bại · Mã lỗi: ${healthCheckResult.errorCode || 'unknown'}`}
                    </div>
                    <div className="text-[11px] opacity-90 font-mono break-all">
                      {healthCheckResult.ok
                        ? `Kênh: ${healthCheckResult.transport.toUpperCase()} · Đích: ${healthCheckResult.endpoint} · Mốc đọc lại: ${healthCheckResult.readBackTimestamp}`
                        : healthCheckResult.errorMessage}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHealthCheckResult(null)}
                  className="text-current opacity-65 hover:opacity-100 cursor-pointer"
                  aria-label="Đóng thông báo kiểm tra"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* LIVE CHUNK PROGRESS BAR */}
            {liveProgress && (
              <div className="rounded-md border border-[#C9A46A]/45 bg-[#141514] p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-[#F7F3EB]">{liveProgress.label}</span>
                  <span className="font-mono text-[#C9A46A] tabular-nums shrink-0">
                    {liveProgress.currentChunk}/{liveProgress.totalChunks} ({liveProgress.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-[2px] bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#C9A46A] transition-all duration-200"
                    style={{ width: `${Math.max(2, Math.min(100, liveProgress.percent))}%` }}
                  />
                </div>
              </div>
            )}

            {/* UPGRADED UNIFIED PROGRESS TABLE: "TIẾN TRÌNH ĐỒNG BỘ TOÀN HỆ THỐNG" */}
            {batchResults.length > 0 && (
              <div className="rounded-md border border-[#C9A46A]/20 bg-[#141514] p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C9A46A]/20 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-[#C9A46A] font-semibold">
                      TIẾN TRÌNH ĐỒNG BỘ TOÀN HỆ THỐNG ({batchResults.length} mục)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsProgressCollapsed((v) => !v)}
                      className="text-[11px] text-[#D8C9A9]/75 hover:text-[#F7F3EB] cursor-pointer"
                    >
                      {isProgressCollapsed ? 'Mở rộng danh sách' : 'Thu gọn danh sách'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchResults([])}
                      className="text-[11px] text-[#D8C9A9]/55 hover:text-[#E89585] cursor-pointer"
                    >
                      Xóa bảng
                    </button>
                  </div>
                </div>

                {!isProgressCollapsed && (
                  <>
                    {/* 7-CATEGORY FILTER TABS */}
                    <div className="flex flex-wrap items-center gap-1.5 pb-1">
                      {(
                        [
                          { id: 'all', label: 'Tất cả' },
                          { id: 'models', label: '3D' },
                          { id: 'audio', label: 'Ghi âm' },
                          { id: 'images', label: 'Hình ảnh' },
                          { id: 'videos', label: 'Video' },
                          { id: 'accounts', label: 'Tài khoản' },
                          { id: 'updates', label: 'Cập nhật mới' },
                        ] as Array<{ id: 'all' | UnifiedSyncCategory; label: string }>
                      ).map((tab) => {
                        const isActive = activeProgressFilter === tab.id;
                        const count = progressFilterCounts[tab.id] || 0;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveProgressFilter(tab.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border text-[11px] transition-colors cursor-pointer ${
                              isActive
                                ? 'border-[#C9A46A] bg-[#C9A46A]/18 text-[#F7F3EB] font-medium'
                                : 'border-[#C9A46A]/20 bg-white/[0.02] text-[#D8C9A9]/70 hover:text-[#F7F3EB] hover:border-[#C9A46A]/45'
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span className="font-mono text-[10px] tabular-nums opacity-80">
                              ({count})
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* UNIFIED SYNC PROGRESS ROWS */}
                    <div className="max-h-72 overflow-y-auto heritage-scrollbar divide-y divide-[#C9A46A]/15 text-xs">
                      {filteredBatchResults.length === 0 ? (
                        <div className="py-4 text-center text-[11.5px] text-[#D8C9A9]/55">
                          Chưa có mục nào thuộc danh mục này trong lượt đồng bộ hiện tại.
                        </div>
                      ) : (
                        filteredBatchResults.map((item, idx) => {
                          const badge = getUnifiedCategoryBadge(item.assetType);
                          const detailInfo =
                            item.detailText ||
                            (item.fileSize > 0
                              ? `${item.fileName} (${formatVaultBytes(item.fileSize)})`
                              : item.fileName);
                          return (
                            <div
                              key={`${item.assetType}-${item.siteId}-${idx}`}
                              className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{
                                    backgroundColor:
                                      item.status === 'ok'
                                        ? '#47796D'
                                        : item.status === 'skipped'
                                        ? '#C9A46A'
                                        : '#A94F3D',
                                  }}
                                />
                                <span
                                  className="font-mono text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-[2px] border shrink-0 tracking-wider"
                                  style={{
                                    borderColor: badge.border,
                                    backgroundColor: badge.bg,
                                    color: badge.text,
                                  }}
                                >
                                  {badge.code}
                                </span>
                                <span className="font-medium text-[#F7F3EB] truncate">
                                  {item.siteName}
                                </span>
                                {detailInfo && (
                                  <span className="font-mono text-[10.5px] text-[#D8C9A9]/60 truncate">
                                    · {detailInfo}
                                  </span>
                                )}
                              </div>
                              <span
                                className="font-mono text-[11px] shrink-0"
                                style={{
                                  color:
                                    item.status === 'ok'
                                      ? '#8FD0BF'
                                      : item.status === 'skipped'
                                      ? '#E4C892'
                                      : '#EC9A8A',
                                }}
                              >
                                {item.message}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {syncStatus.lastErrorCode && !healthCheckResult && (
              <div className="rounded-md border border-[#A94F3D]/50 bg-[#A94F3D]/15 px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-[#F4C4BA]">
                <ShieldAlert className="w-4 h-4 text-[#E07A66] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-medium text-[#F9DDD7]">
                    Phản hồi thật từ Firebase SDK: <code className="font-mono">{syncStatus.lastErrorCode}</code>
                  </div>
                  <div className="text-[11px] text-[#F4C4BA]/90 break-all">
                    {syncStatus.lastErrorMessage}
                  </div>
                </div>
              </div>
            )}

            {showTelemetry && (
              <div className="rounded-md border border-[#D8C9A9]/15 bg-[#101110] p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-[#D8C9A9]/10 pb-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#C9A46A] font-medium">
                    Nhật ký đồng bộ chi tiết (Sync Telemetry Log)
                  </span>
                  <button
                    type="button"
                    onClick={clearCloudSyncLogs}
                    className="inline-flex items-center gap-1 text-[11px] text-[#D8C9A9]/65 hover:text-[#F5EFE6] cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa nhật ký</span>
                  </button>
                </div>
                {syncStatus.logs.length === 0 ? (
                  <p className="text-xs text-[#D8C9A9]/55 py-2">
                    Chưa có phiên đồng bộ nào được ghi nhận trong phiên làm việc này.
                  </p>
                ) : (
                  <div className="max-h-56 overflow-y-auto heritage-scrollbar divide-y divide-white/[0.06] font-mono text-[11px]">
                    {syncStatus.logs.map((entry) => (
                      <div key={entry.id} className="py-1.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                        <span className="text-[#D8C9A9]/45 shrink-0 tabular-nums">
                          {new Date(entry.timestamp).toLocaleTimeString('vi-VN', { hour12: false })}
                        </span>
                        <span
                          className={`uppercase font-semibold shrink-0 w-12 ${
                            entry.status === 'ok'
                              ? 'text-[#7EC4B2]'
                              : entry.status === 'warn'
                              ? 'text-[#E5C17B]'
                              : 'text-[#EA8B78]'
                          }`}
                        >
                          [{entry.status}]
                        </span>
                        <span className="text-[#C9A46A] shrink-0">{entry.branch}</span>
                        <span className="text-[#F5EFE6]/85 flex-1">
                          {entry.message}
                          {entry.errorCode ? ` | code=${entry.errorCode}` : ''}
                          {entry.errorMessage ? ` | ${entry.errorMessage}` : ''}
                        </span>
                        {typeof entry.bytes === 'number' && entry.bytes > 0 && (
                          <span className="text-[#D8C9A9]/50 shrink-0 tabular-nums">
                            {formatVaultBytes(entry.bytes)}
                          </span>
                        )}
                        {typeof entry.durationMs === 'number' && (
                          <span className="text-[#D8C9A9]/45 shrink-0 tabular-nums">
                            {entry.durationMs}ms
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: 17/17 ASSET INTEGRITY MATRIX + DIRECT CDN URL SUPPORT */}
      <div className="rounded-xl border border-[#D8C9A9]/15 bg-[#161716] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D8C9A9]/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#C9A46A]">
              PHẦN 1 · KIỂM TOÁN TÀI SẢN 17/17 &amp; GẮN LINK CDN TRỰC TIẾP (GITHUB / JSDELIVR)
            </div>
            <h4 className="text-base font-serif font-semibold text-[#F5EFE6] mt-0.5">
              Bảng kiểm toán tài sản 17/17 di tích (Asset Integrity Matrix)
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc theo mã 01–17 hoặc tên di tích..."
              className="w-60 px-3 py-1.5 rounded-[4px] bg-black/40 border border-[#D8C9A9]/20 text-xs text-[#F5EFE6] placeholder:text-[#D8C9A9]/45 focus:outline-none focus:border-[#C9A46A]/70"
            />
            <button
              type="button"
              onClick={() => void handleCopyExpectedPaths()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-[#D8C9A9]/25 bg-white/[0.03] hover:bg-white/[0.08] text-xs text-[#D8C9A9] cursor-pointer transition-colors"
            >
              {copiedPaths ? <Check className="w-3.5 h-3.5 text-[#7EC4B2]" /> : <Copy className="w-3.5 h-3.5 text-[#C9A46A]" />}
              <span>{copiedPaths ? 'Đã chép danh sách tên file' : 'Chép danh sách đường dẫn chuẩn'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto heritage-scrollbar">
          <table className="w-full text-left border-collapse min-w-[920px]">
            <thead>
              <tr className="border-b border-[#D8C9A9]/15 bg-black/30 text-[11px] uppercase tracking-wider text-[#D8C9A9]/70">
                <th className="py-3 px-4 font-medium">Di tích (01–17)</th>
                <th className="py-3 px-3 font-medium">Ảnh thật</th>
                <th className="py-3 px-3 font-medium">Mô hình 3D (.GLB / CDN)</th>
                <th className="py-3 px-3 font-medium">Thuyết minh 17/17 (.M4A / CDN)</th>
                <th className="py-3 px-4 font-medium">Nguồn lưu trữ hiện tại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8C9A9]/10 text-xs">
              {filteredRows.map((row) => {
                const isUploadingModel = uploadingCellKey === `models:${row.siteId}`;
                const isUploadingAudio = uploadingCellKey === `audio:${row.siteId}`;
                const isEditingModelUrl = editingUrlKey === `models:${row.siteId}`;
                const isEditingAudioUrl = editingUrlKey === `audio:${row.siteId}`;

                return (
                  <tr key={row.siteId} className="hover:bg-white/[0.025] transition-colors align-top">
                    {/* Monument Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[11px] text-[#C9A46A] font-semibold tabular-nums">
                          {row.code}
                        </span>
                        <span className="font-medium text-[#F5EFE6]">{row.officialName}</span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-[#D8C9A9]/50">
                        {row.siteId}
                      </div>
                    </td>

                    {/* Real Photos Column */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-[3px] border text-[11px] font-medium tabular-nums ${
                          row.hasPhotos
                            ? 'border-[#47796D]/55 bg-[#47796D]/18 text-[#9ED3C6]'
                            : 'border-[#A94F3D]/50 bg-[#A94F3D]/15 text-[#E8A396]'
                        }`}
                      >
                        {row.photoCount}/2 Ảnh HD
                      </span>
                    </td>

                    {/* 3D Model Column + Inline Upload + Direct CDN URL */}
                    <td className="py-3 px-3 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[3px] border text-[11px] font-medium ${getTierBadgeClasses(
                            row.modelTier
                          )}`}
                        >
                          {getTierLabel(row.modelTier, 'model')}
                          {row.cloudModelChunks > 0 ? ` · ${row.cloudModelChunks} mảnh` : ''}
                        </span>
                        <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] border border-[#D8C9A9]/25 bg-white/[0.04] hover:bg-white/[0.1] text-[10px] text-[#F5EFE6] cursor-pointer transition-colors">
                          <Upload className="w-3 h-3 text-[#C9A46A]" />
                          <span>{isUploadingModel ? 'Đang đẩy...' : 'Nạp .GLB'}</span>
                          <input
                            type="file"
                            accept=".glb,.gltf"
                            className="hidden"
                            disabled={isUploadingModel}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              e.target.value = '';
                              void handleInlineAssetUpload('models', row, f);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenDirectUrlEditor('models', row)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] border text-[10px] cursor-pointer transition-colors ${
                            row.directModelUrl
                              ? 'border-[#526D8B]/70 bg-[#526D8B]/20 text-[#C6DBF2]'
                              : 'border-[#D8C9A9]/20 bg-white/[0.03] hover:bg-white/[0.08] text-[#D8C9A9]'
                          }`}
                          title="Dán link trực tiếp GitHub / jsDelivr CDN cho tệp .glb > 15MB"
                        >
                          <Link2 className="w-3 h-3" />
                          <span>URL CDN</span>
                        </button>
                      </div>

                      {isEditingModelUrl && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="url"
                            value={draftDirectUrl}
                            onChange={(e) => setDraftDirectUrl(e.target.value)}
                            placeholder="https://cdn.jsdelivr.net/.../model.glb"
                            className="flex-1 min-w-[180px] px-2 py-1 rounded-[3px] bg-black/50 border border-[#C9A46A]/50 text-[11px] text-[#F5EFE6] font-mono focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => void handleSaveDirectUrl('models', row)}
                            className="px-2 py-1 rounded-[3px] bg-[#C9A46A] text-[#171817] text-[10px] font-semibold cursor-pointer"
                          >
                            Lưu
                          </button>
                        </div>
                      )}

                      <div className="font-mono text-[10px] text-[#D8C9A9]/65 truncate max-w-[260px]" title={row.directModelUrl || row.modelFileName || row.recommendedModelPath}>
                        {row.directModelUrl
                          ? `CDN: ${row.directModelUrl}`
                          : row.modelFileName
                          ? `Tệp: ${row.modelFileName}`
                          : 'Dùng mô hình bảo tàng mặc định'}
                      </div>
                      <div className="font-mono text-[10px] text-[#D8C9A9]/45 truncate max-w-[260px]" title={row.recommendedModelPath}>
                        Chuẩn di trú: {row.recommendedModelPath}
                      </div>
                    </td>

                    {/* Audio Narration Column + Inline Upload + Direct CDN URL */}
                    <td className="py-3 px-3 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[3px] border text-[11px] font-medium ${getTierBadgeClasses(
                            row.audioTier
                          )}`}
                        >
                          {getTierLabel(row.audioTier, 'audio')}
                          {row.cloudAudioChunks > 0 ? ` · ${row.cloudAudioChunks} mảnh` : ''}
                        </span>
                        <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] border border-[#D8C9A9]/25 bg-white/[0.04] hover:bg-white/[0.1] text-[10px] text-[#F5EFE6] cursor-pointer transition-colors">
                          <Upload className="w-3 h-3 text-[#C9A46A]" />
                          <span>{isUploadingAudio ? 'Đang đẩy...' : 'Nạp .M4A/.MP3'}</span>
                          <input
                            type="file"
                            accept="audio/*,.m4a,.mp3,.wav"
                            className="hidden"
                            disabled={isUploadingAudio}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              e.target.value = '';
                              void handleInlineAssetUpload('audio', row, f);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenDirectUrlEditor('audio', row)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] border text-[10px] cursor-pointer transition-colors ${
                            row.directAudioUrl
                              ? 'border-[#526D8B]/70 bg-[#526D8B]/20 text-[#C6DBF2]'
                              : 'border-[#D8C9A9]/20 bg-white/[0.03] hover:bg-white/[0.08] text-[#D8C9A9]'
                          }`}
                          title="Dán link trực tiếp GitHub / jsDelivr CDN cho tệp ghi âm .m4a / .mp3"
                        >
                          <Link2 className="w-3 h-3" />
                          <span>URL CDN</span>
                        </button>
                      </div>

                      {isEditingAudioUrl && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="url"
                            value={draftDirectUrl}
                            onChange={(e) => setDraftDirectUrl(e.target.value)}
                            placeholder="https://cdn.jsdelivr.net/.../audio.m4a"
                            className="flex-1 min-w-[180px] px-2 py-1 rounded-[3px] bg-black/50 border border-[#C9A46A]/50 text-[11px] text-[#F5EFE6] font-mono focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => void handleSaveDirectUrl('audio', row)}
                            className="px-2 py-1 rounded-[3px] bg-[#C9A46A] text-[#171817] text-[10px] font-semibold cursor-pointer"
                          >
                            Lưu
                          </button>
                        </div>
                      )}

                      <div className="font-mono text-[10px] text-[#D8C9A9]/65 truncate max-w-[260px]" title={row.directAudioUrl || row.audioFileName || row.recommendedAudioPath}>
                        {row.directAudioUrl
                          ? `CDN: ${row.directAudioUrl}`
                          : row.audioFileName
                          ? `Bản thu: ${row.audioFileName}`
                          : row.hasScriptNarration
                          ? 'Kịch bản 4 chương VI/EN/ZH sẵn sàng'
                          : 'Chưa có thuyết minh'}
                      </div>
                      <div className="font-mono text-[10px] text-[#D8C9A9]/45 truncate max-w-[260px]" title={row.recommendedAudioPath}>
                        Chuẩn di trú: {row.recommendedAudioPath}
                      </div>
                    </td>

                    {/* Primary Storage Tier Column */}
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-[#C9A46A]/30 bg-black/30 text-[11px] text-[#F5EFE6] font-medium">
                        <Database className="w-3 h-3 text-[#C9A46A]" />
                        <span>
                          {lang === 'en'
                            ? row.primaryStorageLabelEn
                            : lang === 'zh'
                            ? row.primaryStorageLabelZh
                            : row.primaryStorageLabelVi}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: SOURCE-CODE BAKER (bakedAssets.ts) */}
      <div className="rounded-xl border border-[#C9A46A]/25 bg-[#161716] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#C9A46A]">
              PHẦN 2 · ĐÓNG CỨNG VÀO MÃ NGUỒN (SOURCE-CODE BAKER)
            </div>
            <h4 className="text-base font-serif font-semibold text-[#F5EFE6]">
              Xuất tệp mã nguồn <code className="font-mono text-sm text-[#E8CFA0]">bakedAssets.ts</code>
            </h4>
            <p className="text-xs text-[#D8C9A9]/75 max-w-2xl leading-relaxed">
              Tổng hợp toàn bộ đường dẫn ảnh thật, mô hình 3D, 17/17 bản thuyết minh tiếng Việt, thông số căn chỉnh 3D/giải phẫu kiến trúc và bảng nguồn tư liệu bản quyền thành một tệp TypeScript chuẩn xác.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void handleGenerateBakedSource()}
              disabled={isGeneratingBake}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] border border-[#C9A46A]/60 bg-[#C9A46A]/15 hover:bg-[#C9A46A]/25 text-[#F5EFE6] text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
            >
              <Code2 className="w-3.5 h-3.5 text-[#C9A46A]" />
              <span>{isGeneratingBake ? 'Đang tổng hợp...' : 'Tạo mã nguồn bakedAssets.ts'}</span>
            </button>

            <button
              type="button"
              onClick={() => void handleCopyBakedCode()}
              disabled={isGeneratingBake}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] border border-[#D8C9A9]/25 bg-white/[0.04] hover:bg-white/[0.1] text-[#F5EFE6] text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-[#7EC4B2]" /> : <Copy className="w-3.5 h-3.5 text-[#C9A46A]" />}
              <span>{copiedCode ? 'Đã sao chép code' : 'Sao chép toàn bộ code'}</span>
            </button>

            <button
              type="button"
              onClick={() => void handleDownloadBakedFile()}
              disabled={isGeneratingBake}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#47796D] hover:bg-[#3c695e] text-[#F5EFE6] text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file .ts</span>
            </button>
          </div>
        </div>

        {bakedCode && (
          <div className="rounded-lg border border-[#D8C9A9]/15 bg-[#0E0F0E] overflow-hidden">
            <div className="px-3.5 py-2 border-b border-[#D8C9A9]/10 flex items-center justify-between text-[11px] text-[#D8C9A9]/70 font-mono">
              <span>src/data/bakedAssets.ts</span>
              <span className="tabular-nums">{bakedCode.split('\n').length} dòng</span>
            </div>
            <pre className="p-4 max-h-80 overflow-auto heritage-scrollbar text-[11px] leading-relaxed text-[#D8C9A9]/90 font-mono">
              <code>{bakedCode}</code>
            </pre>
          </div>
        )}
      </div>

      {/* SECTION 3: FULL MIGRATION SNAPSHOT (.JSON) */}
      <div className="rounded-xl border border-[#D8C9A9]/15 bg-[#161716] p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#C9A46A]">
              PHẦN 3 · GÓI DI TRÚ TOÀN PHẦN (FULL MIGRATION SNAPSHOT)
            </div>
            <h4 className="text-base font-serif font-semibold text-[#F5EFE6]">
              Xuất / Nhập Gói Di trú toàn phần (<code className="font-mono text-sm text-[#E8CFA0]">.json</code>)
            </h4>
            <p className="text-xs text-[#D8C9A9]/75 max-w-2xl leading-relaxed">
              Sao lưu 1 chạm toàn bộ cấu hình 17 di tích, 34 ảnh HD, chú thích ảnh, liên kết CDN 3D/Audio, thông số căn chỉnh 3D, điểm tương tác, kịch bản thuyết minh, bản dịch và thư mục Nguồn tư liệu bản quyền.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportMigrationJson}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] bg-[#526D8B] hover:bg-[#445c76] text-[#F5EFE6] text-xs font-medium cursor-pointer transition-colors"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Xuất gói di trú (.json)</span>
            </button>

            <button
              type="button"
              onClick={() => importJsonRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] border border-[#C9A46A]/55 bg-[#C9A46A]/15 hover:bg-[#C9A46A]/25 text-[#F5EFE6] text-xs font-medium cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#C9A46A]" />
              <span>Nhập &amp; Khôi phục (.json)</span>
            </button>
            <input
              ref={importJsonRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => void handleImportMigrationJson(e)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
