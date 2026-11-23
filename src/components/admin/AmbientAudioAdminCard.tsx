import React, { useEffect, useRef, useState } from 'react';
import {
  SiteSettings,
  saveSiteSettings,
} from '../../utils/adminPlatformStore';
import {
  AmbientPlaylistTrack,
  MultiTrackMuseumSynth,
  StoredLocalAmbientAudio,
  cloneDefaultAmbientPlaylist,
  createPreviewSynth,
  deleteLocalAmbientTrackAudio,
  extractTrackIdFromAmbientPointer,
  makeFirebaseAmbientPointer,
  normalizeAmbientPlaylist,
  resolveAmbientTrackUrl,
  saveLocalAmbientTrackAudio,
} from '../../utils/ambientAudioEngine';
import {
  deleteAmbientTrackAssetInFirebase,
  isFirebaseDbConfigured,
  pushAmbientPlaylistToFirebase,
  pushAmbientTrackAssetToFirebase,
  pushHeritageSitesToFirebase,
} from '../../utils/firebaseRestSync';
import { useAmbientAudio } from '../../contexts/AmbientAudioContext';
import {
  ArrowDown,
  ArrowUp,
  Link2,
  Music,
  Play,
  Plus,
  RotateCcw,
  Save,
  Square,
  Trash2,
  Upload,
} from 'lucide-react';

interface AmbientAudioAdminCardProps {
  siteSettings: SiteSettings;
  setSiteSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
  adminActorEmail: string;
  onAfterSave: () => void;
  showToast: (type: 'ok' | 'err', message: string) => void;
}

const MAX_UPLOAD_BYTES = 1024 * 1024; // 1 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const AmbientAudioAdminCard: React.FC<AmbientAudioAdminCardProps> = ({
  siteSettings,
  setSiteSettings,
  adminActorEmail,
  onAfterSave,
  showToast,
}) => {
  const { setAdminPreviewing } = useAmbientAudio();

  const playlist = normalizeAmbientPlaylist(siteSettings.ambientPlaylist);

  // Add New Track form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newDirectUrl, setNewDirectUrl] = useState('');
  const [draftUpload, setDraftUpload] = useState<StoredLocalAmbientAudio | null>(null);

  // Pending uploaded blobs keyed by trackId (saved to IndexedDB + Firebase RTDB on Save)
  const [pendingTrackUploads, setPendingTrackUploads] = useState<
    Record<string, StoredLocalAmbientAudio>
  >({});
  const [deletedTrackAssetIds, setDeletedTrackAssetIds] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewSynthRef = useRef<MultiTrackMuseumSynth | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopPreview = () => {
    if (previewAudioRef.current) {
      try {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
      } catch {
        // ignore
      }
      previewAudioRef.current = null;
    }
    if (previewSynthRef.current) {
      previewSynthRef.current.stop(120, true);
    }
    setPreviewTrackId(null);
    setAdminPreviewing(false);
  };

  useEffect(() => {
    return () => {
      stopPreview();
      previewSynthRef.current?.destroy();
      previewSynthRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePlaylist = (nextList: AmbientPlaylistTrack[]) => {
    setSiteSettings((prev) => ({
      ...prev,
      ambientPlaylist: nextList,
    }));
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isValidExt = lowerName.endsWith('.mp3') || lowerName.endsWith('.ogg');
    const isValidMime =
      file.type === 'audio/mpeg' ||
      file.type === 'audio/mp3' ||
      file.type === 'audio/ogg' ||
      file.type === 'application/ogg';

    if (!isValidExt && !isValidMime) {
      showToast('err', 'Chỉ hỗ trợ tệp âm thanh định dạng .mp3 hoặc .ogg.');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      showToast(
        'err',
        `Tệp quá lớn (${formatBytes(file.size)}). Tệp tải lên cần nhẹ dưới 1 MB hoặc hãy dán URL trực tiếp.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        showToast('err', 'Không thể đọc tệp âm thanh đã chọn.');
        return;
      }
      setDraftUpload({
        dataUrl,
        fileName: file.name,
        mimeType: file.type || (lowerName.endsWith('.ogg') ? 'audio/ogg' : 'audio/mpeg'),
        sizeBytes: file.size,
        updatedAt: new Date().toISOString(),
      });
      setNewDirectUrl('');
      if (!newTitle.trim()) {
        setNewTitle(file.name.replace(/\.[^.]+$/, ''));
      }
      showToast('ok', `Đã chọn tệp "${file.name}" (${formatBytes(file.size)}). Nhấn Thêm vào danh sách.`);
    };
    reader.onerror = () => {
      showToast('err', 'Lỗi khi đọc tệp âm thanh từ thiết bị.');
    };
    reader.readAsDataURL(file);
  };

  const handleAddTrack = () => {
    const title = newTitle.trim();
    const subtitle = newSubtitle.trim() || 'Hòa tấu Di sản Tùy chỉnh';
    const trimmedUrl = newDirectUrl.trim();

    if (!title) {
      showToast('err', 'Vui lòng nhập Tên bài hát trước khi thêm.');
      return;
    }

    if (!draftUpload && !trimmedUrl) {
      showToast('err', 'Vui lòng dán URL trực tiếp (.mp3 / .ogg) hoặc chọn tệp nhẹ dưới 1 MB.');
      return;
    }

    if (
      !draftUpload &&
      trimmedUrl &&
      !/^https?:\/\//i.test(trimmedUrl) &&
      !trimmedUrl.startsWith('/')
    ) {
      showToast('err', 'Đường dẫn âm thanh phải bắt đầu bằng https://, http:// hoặc /');
      return;
    }

    const trackId = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();
    let audioUrl = trimmedUrl;

    if (draftUpload) {
      audioUrl = makeFirebaseAmbientPointer(trackId);
      setPendingTrackUploads((prev) => ({
        ...prev,
        [trackId]: draftUpload,
      }));
    }

    const newTrack: AmbientPlaylistTrack = {
      id: trackId,
      title,
      subtitle,
      sourceType: 'custom',
      audioUrl,
      enabled: true,
      isBuiltIn: false,
      updatedAt: nowIso,
    };

    updatePlaylist([...playlist, newTrack]);
    setNewTitle('');
    setNewSubtitle('');
    setNewDirectUrl('');
    setDraftUpload(null);
    showToast('ok', `Đã thêm "${title}" vào danh sách. Nhấn Lưu Playlist để áp dụng & đồng bộ Firebase.`);
  };

  const handleToggleTrackEnabled = (trackId: string) => {
    const enabledCount = playlist.filter((t) => t.enabled).length;
    const target = playlist.find((t) => t.id === trackId);
    if (!target) return;
    if (target.enabled && enabledCount <= 1) {
      showToast('err', 'Cần giữ tối thiểu 1 bài hát đang bật trong danh sách.');
      return;
    }
    updatePlaylist(
      playlist.map((t) => (t.id === trackId ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleMoveTrack = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= playlist.length) return;
    const next = [...playlist];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    updatePlaylist(next);
  };

  const handleDeleteTrack = (track: AmbientPlaylistTrack) => {
    if (playlist.length <= 1) {
      showToast('err', 'Danh sách phải có ít nhất 1 bài hát.');
      return;
    }
    if (previewTrackId === track.id) {
      stopPreview();
    }
    const next = playlist.filter((t) => t.id !== track.id);
    if (!next.some((t) => t.enabled) && next.length > 0) {
      next[0] = { ...next[0], enabled: true };
    }
    updatePlaylist(next);

    setPendingTrackUploads((prev) => {
      if (!prev[track.id]) return prev;
      const copy = { ...prev };
      delete copy[track.id];
      return copy;
    });

    const pointerId = track.audioUrl ? extractTrackIdFromAmbientPointer(track.audioUrl) : null;
    if (pointerId) {
      setDeletedTrackAssetIds((prev) =>
        prev.includes(pointerId) ? prev : [...prev, pointerId]
      );
    }
  };

  const handleTogglePreviewTrack = async (track: AmbientPlaylistTrack) => {
    if (previewTrackId === track.id) {
      stopPreview();
      return;
    }

    stopPreview();

    if (track.sourceType === 'synth') {
      if (!previewSynthRef.current) {
        previewSynthRef.current = createPreviewSynth();
      }
      setAdminPreviewing(true);
      setPreviewTrackId(track.id);
      const started = await previewSynthRef.current.start(
        track.synthPreset || 'imperial_dan_tranh',
        0.38,
        350,
        true
      );
      if (!started) {
        stopPreview();
        showToast('err', 'Trình duyệt không thể khởi chạy bộ phát nghe thử.');
      }
      return;
    }

    let playableSrc = pendingTrackUploads[track.id]?.dataUrl || '';
    if (!playableSrc && track.audioUrl) {
      playableSrc = (await resolveAmbientTrackUrl(track.audioUrl)) || '';
    }

    if (!playableSrc) {
      showToast('err', 'Không tìm thấy nguồn âm thanh để nghe thử cho bài hát này.');
      return;
    }

    try {
      const audio = new Audio(playableSrc);
      audio.volume = 0.45;
      audio.onended = () => stopPreview();
      audio.onerror = () => {
        stopPreview();
        showToast('err', 'Không thể phát nguồn âm thanh này. Kiểm tra lại tệp hoặc URL trực tiếp.');
      };
      previewAudioRef.current = audio;
      setAdminPreviewing(true);
      setPreviewTrackId(track.id);
      await audio.play();
    } catch {
      stopPreview();
      showToast('err', 'Trình duyệt không thể phát tệp/đường dẫn này.');
    }
  };

  const handleRestoreDefaultThreeTracks = () => {
    stopPreview();
    const defaults = cloneDefaultAmbientPlaylist();
    const existingIds = new Set(playlist.map((t) => t.id));
    const missingDefaults = defaults.filter((d) => !existingIds.has(d.id));
    if (missingDefaults.length === 0) {
      updatePlaylist(defaults);
      showToast('ok', 'Đã đặt lại danh sách về 3 bản nhạc mặc định Web Audio API. Nhấn Lưu để đồng bộ.');
    } else {
      updatePlaylist([...missingDefaults, ...playlist]);
      showToast('ok', `Đã bổ sung lại ${missingDefaults.length} bản nhạc mặc định. Nhấn Lưu để đồng bộ.`);
    }
  };

  const handleSavePlaylistAndSync = async () => {
    setIsSaving(true);
    stopPreview();
    try {
      const nowIso = new Date().toISOString();
      let syncedAnyAsset = false;

      // Persist & upload any newly uploaded < 1 MB tracks
      for (const [trackId, record] of Object.entries(pendingTrackUploads)) {
        const stillInList = playlist.some((t) => t.id === trackId);
        if (!stillInList) continue;
        await saveLocalAmbientTrackAudio(trackId, record);
        if (isFirebaseDbConfigured()) {
          const ok = await pushAmbientTrackAssetToFirebase(trackId, {
            dataUrl: record.dataUrl,
            fileName: record.fileName,
            mimeType: record.mimeType,
            updatedAt: nowIso,
          });
          if (ok) syncedAnyAsset = true;
        }
      }

      // Clean up deleted uploaded track blobs
      for (const removedId of deletedTrackAssetIds) {
        await deleteLocalAmbientTrackAudio(removedId);
        if (isFirebaseDbConfigured()) {
          void deleteAmbientTrackAssetInFirebase(removedId);
        }
      }

      setPendingTrackUploads({});
      setDeletedTrackAssetIds([]);

      const normalizedList = normalizeAmbientPlaylist(playlist);
      const nextSettings: SiteSettings = {
        ...siteSettings,
        ambientPlaylist: normalizedList,
        ambientAudioUpdatedAt: nowIso,
      };

      setSiteSettings(nextSettings);
      saveSiteSettings(nextSettings, adminActorEmail);

      const [syncedPlaylist, syncedSites] = await Promise.all([
        pushAmbientPlaylistToFirebase(
          normalizedList as unknown as Array<Record<string, unknown>>,
          nextSettings.ambientAudioEnabled
        ),
        pushHeritageSitesToFirebase(true),
      ]);

      onAfterSave();

      if (isFirebaseDbConfigured()) {
        if (syncedPlaylist || syncedSites || syncedAnyAsset) {
          showToast(
            'ok',
            `Đã lưu danh sách ${normalizedList.length} bài nhạc nền & đồng bộ JSON lên Firebase Realtime Database.`
          );
        } else {
          showToast(
            'ok',
            'Đã lưu danh sách nhạc nền cục bộ. Kết nối Firebase hiện đang ngoại tuyến.'
          );
        }
      } else {
        showToast(
          'ok',
          `Đã lưu danh sách ${normalizedList.length} bài nhạc nền & áp dụng tức thì trên toàn trang.`
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const enabledCount = playlist.filter((t) => t.enabled).length;

  return (
    <div className="rounded-2xl bg-[#161619] border border-white/[0.08] p-5 space-y-5">
      {/* Header + Global Enable Toggle */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2.5">
          <Music className="w-4 h-4 text-[#C9A46A] shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-[#F5F5F7]">
              Quản lý Nhạc nền Di sản (Multi-Track Playlist)
            </h4>
            <p className="text-xs text-[#86868B]">
              Quản lý danh sách phát ({enabledCount}/{playlist.length} bài đang bật), thêm bài bằng URL trực tiếp hoặc tệp nhẹ dưới 1 MB, nghe thử, sắp xếp thứ tự và đồng bộ JSON lên Firebase Realtime Database.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            setSiteSettings((s) => ({
              ...s,
              ambientAudioEnabled: !s.ambientAudioEnabled,
            }))
          }
          className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
            siteSettings.ambientAudioEnabled
              ? 'bg-[#47796D]/25 border border-[#47796D] text-[#D8C9A9]'
              : 'bg-white/[0.07] border border-white/[0.12] text-[#A1A1A6]'
          }`}
        >
          {siteSettings.ambientAudioEnabled ? 'Đang bật' : 'Đang tắt'}
        </button>
      </div>

      {/* Add New Track Form */}
      <div className="rounded-xl bg-black/35 border border-white/[0.08] p-4 space-y-3.5">
        <div className="text-xs font-semibold text-[#D8C9A9]">
          Thêm bài hát mới vào danh sách phát
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[11.5px] font-medium text-[#A1A1A6]">
              Tên bài hát
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ví dụ: Dạ Cổ Hoài Lang (Hòa tấu)"
              className="w-full h-9.5 px-3 rounded-xl bg-black/50 border border-white/[0.12] text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#C9A46A] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11.5px] font-medium text-[#A1A1A6]">
              Mô tả / Thể loại
            </label>
            <input
              type="text"
              value={newSubtitle}
              onChange={(e) => setNewSubtitle(e.target.value)}
              placeholder="Ví dụ: Đờn ca tài tử Nam Bộ êm dịu"
              className="w-full h-9.5 px-3 rounded-xl bg-black/50 border border-white/[0.12] text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#C9A46A] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-[11.5px] font-medium text-[#A1A1A6]">
              URL trực tiếp tệp .mp3 / .ogg
            </label>
            <div className="relative">
              <Link2 className="w-3.5 h-3.5 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="url"
                value={newDirectUrl}
                onChange={(e) => {
                  setNewDirectUrl(e.target.value);
                  if (e.target.value.trim()) setDraftUpload(null);
                }}
                placeholder="https://example.com/nhac-di-san.mp3"
                className="w-full h-9.5 pl-9 pr-3 rounded-xl bg-black/50 border border-white/[0.12] text-xs text-[#F5F5F7] placeholder-[#6E6E73] focus:border-[#C9A46A] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11.5px] font-medium text-[#A1A1A6]">
              Hoặc tải tệp nhẹ dưới 1 MB (.mp3 / .ogg)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.ogg,audio/mpeg,audio/ogg"
              onChange={handleFileSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-9.5 px-3 rounded-xl bg-[#1F1F24] hover:bg-[#2A2A30] border border-dashed border-[#C9A46A]/45 text-xs font-medium text-[#D8C9A9] flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" />
              <span className="truncate">
                {draftUpload
                  ? `${draftUpload.fileName} (${formatBytes(draftUpload.sizeBytes)})`
                  : 'Chọn tệp .mp3 / .ogg dưới 1 MB'}
              </span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleAddTrack}
            className="px-4 py-1.5 rounded-full bg-[#EDE4D0] hover:bg-[#C9A46A] text-[#171817] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm vào danh sách phát</span>
          </button>
        </div>
      </div>

      {/* Playlist Items Management */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#D8C9A9]">
            Danh sách bài hát hiện tại ({playlist.length} bài)
          </span>
          <span className="text-[11px] text-[#86868B]">
            Nghe thử tự động tạm dừng nhạc nền chính
          </span>
        </div>

        <div className="divide-y divide-white/[0.07] rounded-xl border border-white/[0.08] bg-black/30 overflow-hidden">
          {playlist.map((track, idx) => {
            const isPreviewingThis = previewTrackId === track.id;
            const sourceDescriptor =
              track.sourceType === 'synth'
                ? 'Web Audio API · 90s mặc định'
                : track.audioUrl?.startsWith('firebase-ambient://')
                ? pendingTrackUploads[track.id]
                  ? `Tệp tải lên (${formatBytes(pendingTrackUploads[track.id].sizeBytes)}) · Chờ lưu`
                  : 'Tệp tải lên · Đồng bộ Firebase'
                : `URL trực tiếp · ${track.audioUrl || ''}`;

            return (
              <div
                key={track.id}
                className={`px-3.5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  track.enabled ? 'bg-transparent' : 'opacity-55 bg-black/25'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="text-xs font-semibold text-[#C9A46A] tabular-nums pt-0.5 w-5 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#F5F5F7] truncate">
                      {track.title}
                    </div>
                    <div className="text-[11px] text-[#A1A1A6] truncate mt-0.5">
                      {track.subtitle}
                    </div>
                    <div className="text-[10.5px] text-[#86868B] truncate mt-0.5">
                      {sourceDescriptor}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {/* Preview */}
                  <button
                    type="button"
                    onClick={() => void handleTogglePreviewTrack(track)}
                    className={`h-8 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                      isPreviewingThis
                        ? 'bg-[#A94F3D] text-[#D8C9A9]'
                        : 'bg-white/[0.08] hover:bg-white/[0.15] text-[#D8C9A9]'
                    }`}
                  >
                    {isPreviewingThis ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>Dừng</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Nghe thử</span>
                      </>
                    )}
                  </button>

                  {/* Enable / Disable */}
                  <button
                    type="button"
                    onClick={() => handleToggleTrackEnabled(track.id)}
                    className={`h-8 px-2.5 rounded-lg border text-[11px] font-medium cursor-pointer transition-colors ${
                      track.enabled
                        ? 'bg-[#47796D]/22 border-[#47796D]/70 text-[#D8C9A9]'
                        : 'bg-white/[0.04] border-white/[0.1] text-[#86868B]'
                    }`}
                  >
                    {track.enabled ? 'Đang bật' : 'Đang ẩn'}
                  </button>

                  {/* Reorder Up / Down */}
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveTrack(idx, -1)}
                    title="Chuyển lên trên"
                    aria-label="Chuyển lên trên"
                    className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[#D8C9A9] flex items-center justify-center cursor-pointer disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === playlist.length - 1}
                    onClick={() => handleMoveTrack(idx, 1)}
                    title="Chuyển xuống dưới"
                    aria-label="Chuyển xuống dưới"
                    className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[#D8C9A9] flex items-center justify-center cursor-pointer disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteTrack(track)}
                    title="Xóa bài hát khỏi danh sách"
                    aria-label="Xóa bài hát"
                    className="w-8 h-8 rounded-lg bg-[#A94F3D]/18 hover:bg-[#A94F3D]/35 text-[#D8C9A9] flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <span className="text-[11px] text-[#86868B]">
          {isFirebaseDbConfigured()
            ? 'Trạng thái: Tự động đồng bộ JSON playlist lên Firebase Realtime Database.'
            : 'Trạng thái: Lưu cục bộ & tự đồng bộ JSON khi cấu hình Firebase RTDB.'}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRestoreDefaultThreeTracks}
            disabled={isSaving}
            className="px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium text-[#D1D1D6] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục 3 bản mặc định</span>
          </button>
          <button
            type="button"
            onClick={() => void handleSavePlaylistAndSync()}
            disabled={isSaving}
            className="px-5 py-2 rounded-full bg-[#C9A46A] hover:bg-[#D8C9A9] text-[#171817] text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Đang đồng bộ...' : 'Lưu Playlist & Đồng bộ Firebase'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
